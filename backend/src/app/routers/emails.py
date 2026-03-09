"""
Router de Emails - Endpoints para envio de correos electronicos.
Replica funcionalidad del sistema de notificaciones de Laravel.

Endpoints:
- POST /emails/password-recovery - Solicitar recuperacion de contrasena
- POST /emails/notify-ot - Enviar notificacion de OT por email
- POST /emails/quotation - Enviar cotizacion PDF por email
- POST /emails/test - Endpoint de prueba para verificar configuracion SMTP
- GET /emails/pending-quotations - Notificar cotizaciones pendientes (scheduled)
- GET /emails/matrix-reminder - Enviar recordatorio de matrices (scheduled)
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timedelta
import logging

from ..database import get_db_connection
from ..services.email_service import email_service, generate_password_reset_token

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/emails", tags=["emails"])


# =============================================
# SCHEMAS
# =============================================

class PasswordRecoveryRequest(BaseModel):
    """Request para solicitar recuperacion de contrasena."""
    rut: str  # RUT o email del usuario


class PasswordRecoveryResponse(BaseModel):
    """Response de recuperacion de contrasena."""
    success: bool
    message: str


class OTNotificationRequest(BaseModel):
    """Request para enviar notificacion de OT."""
    ot_id: int
    user_email: EmailStr
    message: str
    sender_name: str
    subject: Optional[str] = None


class QuotationEmailRequest(BaseModel):
    """Request para enviar cotizacion por email."""
    quotation_id: int
    client_email: EmailStr


class TestEmailRequest(BaseModel):
    """Request para probar configuracion de email."""
    to_email: EmailStr


class EmailResponse(BaseModel):
    """Response generico de email."""
    success: bool
    message: str


# =============================================
# ENDPOINTS
# =============================================

@router.post("/password-recovery", response_model=PasswordRecoveryResponse)
async def request_password_recovery(request: PasswordRecoveryRequest):
    """
    Solicita recuperacion de contrasena.
    Genera token de 5 minutos y envia email al usuario.
    """
    connection = None
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            # Buscar usuario por RUT o email
            cursor.execute("""
                SELECT id, email, fullname
                FROM users
                WHERE (rut = %s OR email = %s) AND active = 1
                LIMIT 1
            """, (request.rut, request.rut))
            user = cursor.fetchone()

            if not user:
                # Por seguridad, no revelar si el usuario existe o no
                return PasswordRecoveryResponse(
                    success=True,
                    message="Si el usuario existe, recibira un correo con instrucciones."
                )

            # Generar token
            token, expiration = generate_password_reset_token()

            # Guardar token en la base de datos
            cursor.execute("""
                UPDATE users
                SET token_reset_password = %s,
                    token_reset_password_expire = %s
                WHERE id = %s
            """, (token, expiration, user["id"]))
            connection.commit()

            # Enviar email
            email_sent = email_service.send_password_recovery(
                email=user["email"],
                token=token
            )

            if email_sent:
                logger.info(f"Password recovery email sent to user {user['id']}")
                return PasswordRecoveryResponse(
                    success=True,
                    message="Si el usuario existe, recibira un correo con instrucciones."
                )
            else:
                logger.error(f"Failed to send password recovery email to user {user['id']}")
                raise HTTPException(
                    status_code=500,
                    detail="Error al enviar el correo de recuperacion"
                )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in password recovery: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if connection:
            connection.close()


@router.post("/notify-ot", response_model=EmailResponse)
async def send_ot_notification(request: OTNotificationRequest):
    """
    Envia notificacion de OT por email.
    Usado para asignaciones, transiciones y mensajes.
    """
    connection = None
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            # Obtener datos de la OT
            cursor.execute("""
                SELECT id, descripcion
                FROM work_orders
                WHERE id = %s
            """, (request.ot_id,))
            ot = cursor.fetchone()

            if not ot:
                raise HTTPException(status_code=404, detail="OT no encontrada")

            # Enviar email
            email_sent = email_service.send_ot_notification(
                to_email=request.user_email,
                ot_id=ot["id"],
                ot_description=ot["descripcion"] or "Sin descripcion",
                message=request.message,
                sender_name=request.sender_name,
                subject=request.subject
            )

            if email_sent:
                return EmailResponse(
                    success=True,
                    message=f"Notificacion enviada a {request.user_email}"
                )
            else:
                raise HTTPException(
                    status_code=500,
                    detail="Error al enviar el email"
                )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending OT notification: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if connection:
            connection.close()


@router.post("/quotation", response_model=EmailResponse)
async def send_quotation_email(request: QuotationEmailRequest):
    """
    Envia cotizacion PDF por email al cliente.
    Genera el PDF automaticamente y lo adjunta al correo.
    """
    connection = None
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            # Obtener datos de la cotizacion con detalles
            cursor.execute("""
                SELECT
                    c.id,
                    c.fecha_cotizacion,
                    c.fecha_validez,
                    c.condiciones_pago,
                    c.observaciones,
                    cl.nombre AS client_name,
                    cl.direccion AS client_address,
                    cl.rut AS client_rut,
                    u.fullname AS seller_name,
                    u.email AS seller_email,
                    u.telefono AS seller_phone
                FROM cotizaciones c
                LEFT JOIN clients cl ON c.client_id = cl.id
                LEFT JOIN users u ON c.user_id = u.id
                WHERE c.id = %s
            """, (request.quotation_id,))
            quotation = cursor.fetchone()

            if not quotation:
                raise HTTPException(status_code=404, detail="Cotizacion no encontrada")

            # Obtener detalles de la cotizacion
            cursor.execute("""
                SELECT
                    d.id,
                    d.descripcion,
                    d.cantidad,
                    d.precio_unitario,
                    d.precio_total,
                    d.area_hc,
                    d.golpes_largo,
                    d.golpes_ancho,
                    tonda.nombre AS tipo_onda
                FROM detalles_cotizacion d
                LEFT JOIN tipo_ondas tonda ON d.tipo_onda_id = tonda.id
                WHERE d.cotizacion_id = %s
                ORDER BY d.id
            """, (request.quotation_id,))
            detalles = cursor.fetchall()

            # Generar PDF de cotizacion
            from io import BytesIO
            from reportlab.lib.pagesizes import letter
            from reportlab.lib import colors
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

            buffer = BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=50, bottomMargin=50)
            elements = []
            styles = getSampleStyleSheet()

            # Titulo
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=18,
                textColor=colors.HexColor('#003f7d'),
                spaceAfter=20
            )
            elements.append(Paragraph(f"Cotizacion N {request.quotation_id}", title_style))
            elements.append(Spacer(1, 10))

            # Info cliente
            info_style = ParagraphStyle('Info', parent=styles['Normal'], fontSize=10, spaceAfter=3)
            elements.append(Paragraph(f"<b>Cliente:</b> {quotation.get('client_name', 'N/A')}", info_style))
            elements.append(Paragraph(f"<b>RUT:</b> {quotation.get('client_rut', 'N/A')}", info_style))
            elements.append(Paragraph(f"<b>Direccion:</b> {quotation.get('client_address', 'N/A')}", info_style))
            elements.append(Paragraph(f"<b>Fecha:</b> {quotation.get('fecha_cotizacion', 'N/A')}", info_style))
            elements.append(Paragraph(f"<b>Validez:</b> {quotation.get('fecha_validez', 'N/A')}", info_style))
            elements.append(Spacer(1, 20))

            # Tabla de detalles
            if detalles:
                table_data = [['#', 'Descripcion', 'Cantidad', 'P. Unit.', 'Total']]
                total_general = 0
                for i, d in enumerate(detalles, 1):
                    precio_unit = d.get('precio_unitario') or 0
                    precio_total = d.get('precio_total') or 0
                    total_general += precio_total
                    desc = d.get('descripcion', 'Sin descripcion') or 'Sin descripcion'
                    table_data.append([
                        str(i),
                        desc[:50],
                        f"{d.get('cantidad', 0):,}",
                        f"${precio_unit:,.0f}",
                        f"${precio_total:,.0f}"
                    ])
                table_data.append(['', '', '', 'TOTAL:', f"${total_general:,.0f}"])

                table = Table(table_data, colWidths=[30, 250, 70, 80, 80])
                table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#003f7d')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 9),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
                    ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#f0f0f0')),
                    ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ]))
                elements.append(table)
            else:
                elements.append(Paragraph("No hay detalles en esta cotizacion.", info_style))

            elements.append(Spacer(1, 30))

            # Condiciones y observaciones
            if quotation.get('condiciones_pago'):
                elements.append(Paragraph(f"<b>Condiciones de Pago:</b> {quotation.get('condiciones_pago')}", info_style))
            if quotation.get('observaciones'):
                elements.append(Paragraph(f"<b>Observaciones:</b> {quotation.get('observaciones')}", info_style))

            elements.append(Spacer(1, 30))

            # Info vendedor
            elements.append(Paragraph("<b>Contacto Comercial:</b>", info_style))
            elements.append(Paragraph(f"{quotation.get('seller_name', 'N/A')}", info_style))
            if quotation.get('seller_email'):
                elements.append(Paragraph(f"Email: {quotation.get('seller_email')}", info_style))
            if quotation.get('seller_phone'):
                elements.append(Paragraph(f"Tel: {quotation.get('seller_phone')}", info_style))

            # Generar PDF
            doc.build(elements)
            pdf_content = buffer.getvalue()
            buffer.close()

            # Enviar email con PDF adjunto
            email_sent = email_service.send_quotation_to_client(
                client_email=str(request.client_email),
                client_name=quotation.get('client_name', 'Cliente'),
                seller_name=quotation.get('seller_name', 'Vendedor'),
                quotation_id=request.quotation_id,
                pdf_content=pdf_content
            )

            if email_sent:
                logger.info(f"Cotizacion {request.quotation_id} enviada a {request.client_email}")
                return EmailResponse(
                    success=True,
                    message=f"Cotizacion enviada exitosamente a {request.client_email}"
                )
            else:
                raise HTTPException(
                    status_code=500,
                    detail="Error al enviar el email. Verifique configuracion SMTP."
                )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending quotation email: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if connection:
            connection.close()


@router.post("/test", response_model=EmailResponse)
async def test_email_config(request: TestEmailRequest):
    """
    Endpoint de prueba para verificar configuracion SMTP.
    Solo para desarrollo/debugging.
    """
    try:
        from ..services.email_service import EmailTemplates

        html_content = EmailTemplates._base_template("""
            <h2 style="color: #333;">Test de Email</h2>
            <p style="color: #666;">
                Este es un correo de prueba para verificar la configuracion SMTP.
            </p>
            <p style="color: #666;">
                Si recibes este mensaje, la configuracion es correcta.
            </p>
            <p style="color: #999; font-size: 12px;">
                Enviado el: """ + datetime.now().strftime("%Y-%m-%d %H:%M:%S") + """
            </p>
        """)

        success = email_service._send_email(
            to=[request.to_email],
            subject="Test CMPC Envases - Verificacion SMTP",
            html_content=html_content
        )

        if success:
            return EmailResponse(
                success=True,
                message=f"Email de prueba enviado a {request.to_email}"
            )
        else:
            return EmailResponse(
                success=False,
                message="Error al enviar email. Verifique configuracion SMTP."
            )

    except Exception as e:
        logger.error(f"Error testing email: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/pending-quotations", response_model=EmailResponse)
async def notify_pending_quotations():
    """
    Notifica a los aprobadores sobre cotizaciones pendientes.
    Diseñado para ser llamado por un scheduler (cron job).
    En Laravel: programado para L-V a las 08:00 AM.
    """
    connection = None
    emails_sent = 0
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            # Buscar cotizaciones pendientes de aprobacion (estado_id = 2)
            cursor.execute("""
                SELECT COUNT(*) as count
                FROM cotizaciones
                WHERE estado_id = 2
            """)
            pending = cursor.fetchone()

            if not pending or pending["count"] == 0:
                return EmailResponse(
                    success=True,
                    message="No hay cotizaciones pendientes de aprobacion"
                )

            # Buscar usuarios con rol de aprobador
            # role_id: 3=Jefe Ventas, 15=Gerente Comercial, 2=Gerente General
            cursor.execute("""
                SELECT id, email, fullname
                FROM users
                WHERE role_id IN (3, 15, 2) AND active = 1
            """)
            approvers = cursor.fetchall()

            for approver in approvers:
                if approver["email"]:
                    success = email_service.send_pending_quotations_notification(
                        user_email=approver["email"],
                        user_name=approver["fullname"] or "Usuario"
                    )
                    if success:
                        emails_sent += 1

            return EmailResponse(
                success=True,
                message=f"Notificaciones enviadas a {emails_sent} aprobadores"
            )

    except Exception as e:
        logger.error(f"Error notifying pending quotations: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if connection:
            connection.close()


@router.get("/matrix-reminder", response_model=EmailResponse)
async def send_matrix_reminders():
    """
    Envia recordatorio de actualizacion de matrices.
    Diseñado para ser llamado por un scheduler (cron job).
    En Laravel: programado para viernes a las 05:00 AM.
    """
    connection = None
    emails_sent = 0
    try:
        # Verificar que hoy es viernes
        if datetime.now().weekday() != 4:  # 4 = viernes
            return EmailResponse(
                success=True,
                message="Este recordatorio solo se envia los viernes"
            )

        connection = get_db_connection()
        with connection.cursor() as cursor:
            # Buscar usuarios con rol 18 (encargados de matrices)
            cursor.execute("""
                SELECT id, email, fullname
                FROM users
                WHERE role_id = 18 AND active = 1
            """)
            users = cursor.fetchall()

            for user in users:
                if user["email"]:
                    success = email_service.send_matrix_update_reminder(
                        user_email=user["email"],
                        user_name=user["fullname"] or "Usuario"
                    )
                    if success:
                        emails_sent += 1

                    # Crear notificacion en la base de datos
                    cursor.execute("""
                        INSERT INTO notifications (
                            user_id, generador_id, work_order_id,
                            motivo, observacion, created_at
                        ) VALUES (%s, 1, 0, %s, %s, NOW())
                    """, (
                        user["id"],
                        "Recordatorio: Actualizar matrices",
                        f"Recordatorio semanal enviado el {datetime.now().strftime('%d/%m/%Y')}"
                    ))

            connection.commit()

            return EmailResponse(
                success=True,
                message=f"Recordatorios enviados a {emails_sent} usuarios"
            )

    except Exception as e:
        logger.error(f"Error sending matrix reminders: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if connection:
            connection.close()


@router.post("/notify-new-client")
async def notify_new_client(client_id: int):
    """
    Notifica al admin sobre un nuevo cliente registrado.
    Llamado automaticamente al crear un cliente.
    """
    connection = None
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT id, nombre
                FROM clients
                WHERE id = %s
            """, (client_id,))
            client = cursor.fetchone()

            if not client:
                raise HTTPException(status_code=404, detail="Cliente no encontrado")

            success = email_service.send_new_client_notification(
                client_name=client["nombre"],
                client_id=client["id"]
            )

            return EmailResponse(
                success=success,
                message="Notificacion enviada al admin" if success else "Error al enviar notificacion"
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error notifying new client: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if connection:
            connection.close()


@router.post("/notify-negative-margin/{quotation_id}")
async def notify_negative_margin(quotation_id: int):
    """
    Alerta al admin sobre cotizacion aprobada con margen negativo.
    Llamado automaticamente al aprobar cotizacion con margen < 0.
    """
    try:
        success = email_service.send_negative_margin_alert(quotation_id)

        return EmailResponse(
            success=success,
            message="Alerta enviada" if success else "Error al enviar alerta"
        )

    except Exception as e:
        logger.error(f"Error sending negative margin alert: {e}")
        raise HTTPException(status_code=500, detail=str(e))
