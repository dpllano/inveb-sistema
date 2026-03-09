"""
Router de Generación de PDFs - INVEB Cascade Service
Genera PDFs para etiquetas, fichas técnicas y estudios.
FASE 6.24
"""
from datetime import datetime
from io import BytesIO
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import pymysql
import jwt
import os

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, letter
from reportlab.lib.units import mm, cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.pdfgen import canvas

from app.config import get_settings

router = APIRouter(prefix="/pdfs", tags=["PDFs"])
security = HTTPBearer(auto_error=False)
settings = get_settings()


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Extrae info del usuario del token JWT."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Token no proporcionado")
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return {"id": int(payload.get("sub")), "role_id": payload.get("role_id", 0)}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalido")


def get_db_connection():
    """Conexion a MySQL."""
    return pymysql.connect(
        host=os.getenv("LARAVEL_MYSQL_HOST", os.getenv("MYSQL_HOST", "127.0.0.1")),
        port=int(os.getenv("LARAVEL_MYSQL_PORT", os.getenv("MYSQL_PORT", "3306"))),
        user=os.getenv("LARAVEL_MYSQL_USER", os.getenv("MYSQL_USER", "envases")),
        password=os.getenv("LARAVEL_MYSQL_PASSWORD", os.getenv("MYSQL_PASSWORD", "secret")),
        database=os.getenv("MYSQL_DATABASE", "envases_ot"),
        cursorclass=pymysql.cursors.DictCursor,
        charset='utf8mb4'
    )


def safe_get(data: dict, key: str, default=''):
    """Obtiene valor de dict manejando None correctamente."""
    value = data.get(key)
    if value is None:
        return default
    return value


def safe_num(data: dict, key: str, default=0):
    """Obtiene valor numérico de dict manejando None correctamente."""
    value = data.get(key)
    if value is None:
        return default
    return value


def get_ot_data(ot_id: int) -> dict:
    """Obtiene datos completos de una OT."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            sql = """
            SELECT
                ot.*,
                ot.interno_largo as largo,
                ot.interno_ancho as ancho,
                ot.interno_alto as alto,
                ot.externo_largo as largo_exterior,
                ot.externo_ancho as ancho_exterior,
                ot.externo_alto as alto_exterior,
                c.nombre as client_name,
                c.codigo as client_sap_code,
                ca.nombre as canal_nombre,
                pt.descripcion as product_type_nombre,
                st.glosa as estilo_nombre,
                st.codigo as estilo_codigo,
                ct.codigo as carton_nombre,
                ct.codigo as carton_codigo,
                m.codigo as material_codigo,
                m.descripcion as material_descripcion,
                ssh.descripcion as subsubhierarchy_nombre,
                p.nombre as planta_nombre,
                tp.descripcion as tipo_palet_nombre,
                proc.descripcion as proceso_nombre,
                arm.descripcion as armado_nombre,
                peg.descripcion as pegado_nombre,
                ray.descripcion as rayado_nombre,
                CONCAT(u.nombre, ' ', u.apellido) as creador_nombre,
                CONCAT(u.nombre, ' ', u.apellido) as vendedor_nombre,
                ct.onda as tipo_onda_nombre
            FROM work_orders ot
            LEFT JOIN clients c ON ot.client_id = c.id
            LEFT JOIN canals ca ON ot.canal_id = ca.id
            LEFT JOIN product_types pt ON ot.product_type_id = pt.id
            LEFT JOIN styles st ON ot.style_id = st.id
            LEFT JOIN cartons ct ON ot.carton_id = ct.id
            LEFT JOIN materials m ON ot.material_id = m.id
            LEFT JOIN subsubhierarchies ssh ON ot.subsubhierarchy_id = ssh.id
            LEFT JOIN plantas p ON ot.planta_id = p.id
            LEFT JOIN pallet_types tp ON ot.pallet_type_id = tp.id
            LEFT JOIN processes proc ON ot.process_id = proc.id
            LEFT JOIN armados arm ON ot.armado_id = arm.id
            LEFT JOIN pegados peg ON ot.pegado_terminacion = peg.id
            LEFT JOIN rayados ray ON ot.rayado_type_id = ray.id
            LEFT JOIN users u ON ot.creador_id = u.id
            WHERE ot.id = %s
            """
            cursor.execute(sql, (ot_id,))
            ot = cursor.fetchone()
            if not ot:
                raise HTTPException(status_code=404, detail="OT no encontrada")

            # Colores están en campos individuales (color_1_id...color_5_id), no en tabla pivot
            # Se obtienen directamente del ot.*
            ot['colores'] = []

            return ot
    finally:
        conn.close()


def get_muestra_data(muestra_id: int) -> dict:
    """Obtiene datos de una muestra."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            sql = """
            SELECT
                m.*,
                ot.id as ot_id,
                ot.descripcion as ot_descripcion,
                ot.interno_largo as largo, ot.interno_ancho as ancho, ot.interno_alto as alto,
                ot.externo_largo as largo_exterior, ot.externo_ancho as ancho_exterior, ot.externo_alto as alto_exterior,
                ot.cad,
                c.nombre as client_name,
                c.direccion as client_direccion,
                ct.codigo as carton_nombre,
                ct.onda as tipo_onda_nombre,
                CONCAT(u.nombre, ' ', u.apellido) as disenador_nombre
            FROM muestras m
            JOIN work_orders ot ON m.work_order_id = ot.id
            LEFT JOIN clients c ON ot.client_id = c.id
            LEFT JOIN cartons ct ON ot.carton_id = ct.id
            LEFT JOIN users u ON m.user_id = u.id
            WHERE m.id = %s
            """
            cursor.execute(sql, (muestra_id,))
            muestra = cursor.fetchone()
            if not muestra:
                raise HTTPException(status_code=404, detail="Muestra no encontrada")
            return muestra
    finally:
        conn.close()


@router.get("/etiqueta-muestra/{muestra_id}")
async def generar_etiqueta_muestra(
    muestra_id: int,
    tipo: str = "producto",
    current_user: dict = Depends(get_current_user)
):
    """
    Genera etiqueta PDF para muestra.
    tipo: 'producto' (10x10cm) o 'cliente' (A4)
    """
    muestra = get_muestra_data(muestra_id)

    buffer = BytesIO()

    if tipo == "producto":
        # Etiqueta de producto 10x10 cm
        page_size = (100*mm, 100*mm)
        c = canvas.Canvas(buffer, pagesize=page_size)

        # Titulo
        c.setFont("Helvetica-Bold", 14)
        c.drawCentredString(50*mm, 90*mm, "ETIQUETA DE MUESTRA")

        c.setFont("Helvetica", 10)
        y = 78*mm

        # Datos de la muestra
        data = [
            f"OT: {muestra.get('ot_id', '')}",
            f"CAD: {muestra.get('cad', '-')}",
            f"Cliente: {muestra.get('client_name', '-')[:30]}",
            f"Descripcion: {muestra.get('ot_descripcion', '-')[:25]}",
            "",
            f"Dim. Int: {muestra.get('largo', 0)} x {muestra.get('ancho', 0)} x {muestra.get('alto', 0)} mm",
            f"Dim. Ext: {muestra.get('largo_exterior', 0)} x {muestra.get('ancho_exterior', 0)} x {muestra.get('alto_exterior', 0)} mm",
            "",
            f"Carton: {muestra.get('carton_nombre', '-')}",
            f"Onda: {muestra.get('tipo_onda_nombre', '-')}",
            "",
            f"Disenador: {muestra.get('disenador_nombre', '-')}",
            f"Fecha: {datetime.now().strftime('%d/%m/%Y')}",
        ]

        for line in data:
            c.drawString(8*mm, y, line)
            y -= 5*mm

        # Recuadro
        c.rect(3*mm, 3*mm, 94*mm, 94*mm)

        c.save()

    else:
        # Etiqueta de cliente A4
        page_size = A4
        c = canvas.Canvas(buffer, pagesize=page_size)
        width, height = page_size

        c.setFont("Helvetica-Bold", 18)
        c.drawCentredString(width/2, height - 50*mm, "ETIQUETA DE ENVIO")

        c.setFont("Helvetica", 14)
        y = height - 80*mm

        data = [
            f"DESTINATARIO:",
            f"{muestra.get('client_name', '-')}",
            "",
            f"Direccion: {muestra.get('client_direccion', '-')}",
            f"Ciudad: {muestra.get('client_ciudad', '-')}",
            "",
            f"OT: {muestra.get('ot_id', '')}",
            f"Muestra ID: {muestra_id}",
            f"Fecha: {datetime.now().strftime('%d/%m/%Y')}",
        ]

        for line in data:
            c.drawString(30*mm, y, line)
            y -= 10*mm

        c.save()

    buffer.seek(0)
    filename = f"Etiqueta_{'Producto' if tipo == 'producto' else 'Cliente'}_{muestra_id}.pdf"

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/ficha-diseno/{ot_id}")
async def generar_ficha_diseno(
    ot_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Genera PDF de ficha de diseno con informacion tecnica de la OT.
    """
    ot = get_ot_data(ot_id)

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=20*mm, bottomMargin=20*mm)
    elements = []

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Heading1'],
        fontSize=16,
        spaceAfter=12,
        alignment=1  # Center
    )
    header_style = ParagraphStyle(
        'Header',
        parent=styles['Heading2'],
        fontSize=12,
        spaceAfter=6,
        textColor=colors.HexColor('#1a1a2e')
    )
    normal_style = styles['Normal']

    # Titulo
    elements.append(Paragraph(f"FICHA DE DISENO - OT #{ot_id}", title_style))
    elements.append(Spacer(1, 10*mm))

    # Datos Comerciales
    elements.append(Paragraph("DATOS COMERCIALES", header_style))
    commercial_data = [
        ["Vendedor:", safe_get(ot, 'vendedor_nombre', '-'), "Cliente:", safe_get(ot, 'client_name', '-')],
        ["Material:", safe_get(ot, 'material_codigo', '-'), "Descripcion:", safe_get(ot, 'descripcion', '-')],
        ["CAD:", safe_get(ot, 'cad', '-'), "Canal:", safe_get(ot, 'canal_nombre', '-')],
    ]
    t = Table(commercial_data, colWidths=[80, 150, 80, 150])
    t.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 8*mm))

    # Caracteristicas
    elements.append(Paragraph("CARACTERISTICAS", header_style))
    char_data = [
        ["Carton:", safe_get(ot, 'carton_nombre', '-'), "Estilo:", safe_get(ot, 'estilo_nombre', '-')],
        ["Tipo Onda:", safe_get(ot, 'tipo_onda_nombre', '-'), "Rayado:", safe_get(ot, 'rayado_nombre', '-')],
        ["Proceso:", safe_get(ot, 'proceso_nombre', '-'), "Armado:", safe_get(ot, 'armado_nombre', '-')],
        ["Pegado:", safe_get(ot, 'pegado_nombre', '-'), "Tipo Producto:", safe_get(ot, 'product_type_nombre', '-')],
    ]
    t = Table(char_data, colWidths=[80, 150, 80, 150])
    t.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 8*mm))

    # Medidas
    elements.append(Paragraph("MEDIDAS", header_style))
    measures_data = [
        ["INTERIORES", "", "EXTERIORES", ""],
        ["Largo:", f"{safe_num(ot, 'largo', 0)} mm", "Largo:", f"{safe_num(ot, 'largo_exterior', 0)} mm"],
        ["Ancho:", f"{safe_num(ot, 'ancho', 0)} mm", "Ancho:", f"{safe_num(ot, 'ancho_exterior', 0)} mm"],
        ["Alto:", f"{safe_num(ot, 'alto', 0)} mm", "Alto:", f"{safe_num(ot, 'alto_exterior', 0)} mm"],
    ]
    t = Table(measures_data, colWidths=[80, 150, 80, 150])
    t.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('BACKGROUND', (0, 0), (1, 0), colors.HexColor('#e0e0e0')),
        ('BACKGROUND', (2, 0), (3, 0), colors.HexColor('#e0e0e0')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 8*mm))

    # Colores
    if ot.get('colores'):
        elements.append(Paragraph("COLORES", header_style))
        color_data = [["#", "Color", "Codigo", "Consumo (g)"]]
        for i, color in enumerate(ot['colores'], 1):
            color_data.append([str(i), color.get('nombre', '-'), color.get('codigo', '-'), str(color.get('consumo', '-'))])
        t = Table(color_data, colWidths=[30, 150, 100, 80])
        t.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a1a2e')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 8*mm))

    # Paletizado
    elements.append(Paragraph("PALETIZADO", header_style))
    pallet_data = [
        ["Planta:", safe_get(ot, 'planta_nombre', '-'), "Tipo Palet:", safe_get(ot, 'tipo_palet_nombre', '-')],
        ["Cajas/Palet:", str(safe_get(ot, 'cajas_por_palet', '-')), "", ""],
    ]
    t = Table(pallet_data, colWidths=[80, 150, 80, 150])
    t.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    elements.append(t)

    # Footer
    elements.append(Spacer(1, 15*mm))
    elements.append(Paragraph(f"Generado: {datetime.now().strftime('%d/%m/%Y %H:%M')}", normal_style))

    doc.build(elements)
    buffer.seek(0)

    filename = f"Ficha_Diseno_OT_{ot_id}.pdf"

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/estudio-bench/{ot_id}")
async def generar_estudio_benchmarking(
    ot_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Genera PDF de solicitud de estudio de benchmarking (laboratorio).
    """
    ot = get_ot_data(ot_id)

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=20*mm, bottomMargin=20*mm)
    elements = []

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Heading1'],
        fontSize=16,
        spaceAfter=12,
        alignment=1
    )
    header_style = ParagraphStyle(
        'Header',
        parent=styles['Heading2'],
        fontSize=12,
        spaceAfter=6,
        textColor=colors.HexColor('#1a1a2e')
    )

    # Titulo
    elements.append(Paragraph("SOLICITUD DE ESTUDIO DE BENCHMARKING", title_style))
    elements.append(Paragraph("Laboratorio de Control de Calidad", styles['Normal']))
    elements.append(Spacer(1, 10*mm))

    # Datos de la OT
    elements.append(Paragraph("DATOS DE LA ORDEN DE TRABAJO", header_style))
    ot_data = [
        ["OT #:", str(ot_id), "Fecha Solicitud:", datetime.now().strftime('%d/%m/%Y')],
        ["Cliente:", safe_get(ot, 'client_name', '-')[:40], "Solicitante:", safe_get(ot, 'creador_nombre', '-')],
        ["Descripcion:", safe_get(ot, 'descripcion', '-'), "", ""],
    ]
    t = Table(ot_data, colWidths=[80, 150, 80, 150])
    t.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 8*mm))

    # Identificacion de muestra
    elements.append(Paragraph("IDENTIFICACION DE MUESTRA", header_style))
    sample_data = [
        ["Material:", safe_get(ot, 'material_codigo', '-'), "Carton:", safe_get(ot, 'carton_nombre', '-')],
        ["CAD:", safe_get(ot, 'cad', '-'), "Tipo Onda:", safe_get(ot, 'tipo_onda_nombre', '-')],
        ["Estilo:", safe_get(ot, 'estilo_nombre', '-'), "", ""],
    ]
    t = Table(sample_data, colWidths=[80, 150, 80, 150])
    t.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 8*mm))

    # Ensayos solicitados
    elements.append(Paragraph("ENSAYOS SOLICITADOS (marcar los requeridos)", header_style))
    tests = [
        ["[ ] BCT (Resistencia a la compresion)", "[ ] ECT (Edge Crush Test)"],
        ["[ ] Humedad", "[ ] Porosidad"],
        ["[ ] Espesor", "[ ] Cera"],
        ["[ ] Flexion", "[ ] Gramaje"],
        ["[ ] Composicion de Papeles", "[ ] Cobb"],
        ["[ ] Medidas", "[ ] Impresion"],
        ["[ ] Mullen", "[ ] FCT"],
    ]
    t = Table(tests, colWidths=[230, 230])
    t.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 10*mm))

    # Observaciones
    elements.append(Paragraph("OBSERVACIONES", header_style))
    elements.append(Spacer(1, 5*mm))
    obs_table = Table([
        [""],
        [""],
        [""],
    ], colWidths=[460])
    obs_table.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 1, colors.black),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 20),
    ]))
    elements.append(obs_table)
    elements.append(Spacer(1, 15*mm))

    # Firmas
    signatures = [
        ["___________________________", "___________________________"],
        ["Solicitante", "Recepcion Laboratorio"],
        ["", ""],
        ["Fecha: __/__/____", "Fecha: __/__/____"],
    ]
    t = Table(signatures, colWidths=[230, 230])
    t.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(t)

    doc.build(elements)
    buffer.seek(0)

    filename = f"Estudio_Benchmarking_OT_{ot_id}.pdf"

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/cotizacion/{cotizacion_id}")
async def generar_cotizacion_pdf(
    cotizacion_id: int,
    completo: bool = True,
    incluir_ficha: bool = True,
    current_user: dict = Depends(get_current_user)
):
    """
    Genera PDF de cotizacion comercial.

    Laravel equivalente: CotizacionController@generar_pdf

    Parametros:
    - completo: Si True, genera PDF multi-pagina con 3 secciones (Carta, Acuerdo, Ficha)
    - incluir_ficha: Si True, incluye la Ficha Tecnica HACCP

    El PDF completo incluye:
    1. Carta Cotizacion: Saludo, tabla de productos corrugados y esquineros, precios
    2. Acuerdo Comercial: Datos vendedor, terminos y condiciones
    3. Ficha Tecnica: Especificaciones HACCP-REGISTRO N71 (opcional)
    """
    # Si se solicita PDF completo, usar el servicio especializado
    if completo:
        try:
            from app.services.pdf_cotizacion import generar_pdf_cotizacion_completo
            pdf_bytes = generar_pdf_cotizacion_completo(cotizacion_id, incluir_ficha_tecnica=incluir_ficha)
            filename = f"Cotizacion_{cotizacion_id}_Completa.pdf"
            return StreamingResponse(
                BytesIO(pdf_bytes),
                media_type="application/pdf",
                headers={"Content-Disposition": f"attachment; filename={filename}"}
            )
        except ValueError as e:
            raise HTTPException(status_code=404, detail=str(e))
        except Exception as e:
            # Fallback al PDF simple si hay error
            pass
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Obtener cotizacion
            cursor.execute("""
                SELECT
                    cot.*,
                    c.nombre as client_name,
                    c.rut as client_rut,
                    c.direccion as client_direccion,
                    CONCAT(u.nombre, ' ', u.apellido) as vendedor_nombre,
                    u.email as vendedor_email,
                    e.nombre as estado_nombre
                FROM cotizacions cot
                LEFT JOIN clients c ON cot.client_id = c.id
                LEFT JOIN users u ON cot.user_id = u.id
                LEFT JOIN cotizacion_estados e ON cot.estado_id = e.id
                WHERE cot.id = %s
            """, (cotizacion_id,))
            cot = cursor.fetchone()
            if not cot:
                raise HTTPException(status_code=404, detail="Cotizacion no encontrada")

            # Obtener detalles
            cursor.execute("""
                SELECT
                    dc.*,
                    pt.descripcion as product_type_nombre
                FROM detalle_cotizacions dc
                LEFT JOIN product_types pt ON dc.product_type_id = pt.id
                WHERE dc.cotizacion_id = %s
                ORDER BY dc.id
            """, (cotizacion_id,))
            detalles = cursor.fetchall()
    finally:
        conn.close()

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=20*mm, bottomMargin=20*mm)
    elements = []

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Heading1'],
        fontSize=18,
        spaceAfter=12,
        alignment=1
    )
    header_style = ParagraphStyle(
        'Header',
        parent=styles['Heading2'],
        fontSize=12,
        spaceAfter=6,
        textColor=colors.HexColor('#1a1a2e')
    )

    # Titulo
    elements.append(Paragraph(f"COTIZACION #{cotizacion_id}", title_style))
    elements.append(Paragraph(f"Fecha: {datetime.now().strftime('%d/%m/%Y')}", styles['Normal']))
    elements.append(Spacer(1, 10*mm))

    # Datos del cliente
    elements.append(Paragraph("DATOS DEL CLIENTE", header_style))
    client_data = [
        ["Cliente:", cot.get('client_name', '-')],
        ["RUT:", cot.get('client_rut', '-')],
        ["Direccion:", cot.get('client_direccion', '-')],
    ]
    t = Table(client_data, colWidths=[100, 360])
    t.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 8*mm))

    # Vendedor
    elements.append(Paragraph("EJECUTIVO COMERCIAL", header_style))
    elements.append(Paragraph(f"{cot.get('vendedor_nombre', '-')} - {cot.get('vendedor_email', '-')}", styles['Normal']))
    elements.append(Spacer(1, 8*mm))

    # Detalles
    if detalles:
        elements.append(Paragraph("DETALLE DE PRODUCTOS", header_style))
        detail_header = ["#", "Tipo", "Cantidad", "Descripcion"]
        detail_data = [detail_header]
        for i, det in enumerate(detalles, 1):
            detail_data.append([
                str(i),
                det.get('product_type_nombre', '-'),
                str(det.get('cantidad', 0)),
                str(det.get('descripcion', '-'))[:40] if det.get('descripcion') else '-'
            ])

        t = Table(detail_data, colWidths=[30, 100, 80, 250])
        t.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a1a2e')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 8*mm))

    # Estado
    elements.append(Paragraph(f"Estado: {cot.get('estado_nombre', '-')}", styles['Normal']))

    # Footer
    elements.append(Spacer(1, 20*mm))
    elements.append(Paragraph("Este documento es una cotizacion comercial y no constituye un compromiso de venta.", styles['Normal']))

    doc.build(elements)
    buffer.seek(0)

    filename = f"Cotizacion_{cotizacion_id}.pdf"

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/cotizacion/{cotizacion_id}/carta")
async def generar_carta_cotizacion(
    cotizacion_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Genera solo la Carta de Cotizacion (pagina 1).
    Incluye tabla de productos y precios.
    """
    try:
        from app.services.pdf_cotizacion import generar_pdf_cotizacion_completo, get_cotizacion_completa

        cotizacion = get_cotizacion_completa(cotizacion_id)
        if not cotizacion:
            raise HTTPException(status_code=404, detail="Cotizacion no encontrada")

        # Usar el servicio completo pero sin ficha tecnica
        pdf_bytes = generar_pdf_cotizacion_completo(cotizacion_id, incluir_ficha_tecnica=False)
        filename = f"Carta_Cotizacion_{cotizacion_id}.pdf"

        return StreamingResponse(
            BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/cotizacion/{cotizacion_id}/ficha-tecnica")
async def generar_ficha_tecnica_haccp(
    cotizacion_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Genera solo la Ficha Tecnica HACCP-REGISTRO N71.
    Documento estatico de especificaciones tecnicas.
    """
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate
    from app.services.pdf_cotizacion import _generar_ficha_tecnica

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=25*mm,
        bottomMargin=20*mm,
        leftMargin=15*mm,
        rightMargin=15*mm
    )

    styles = getSampleStyleSheet()
    estilo_seccion = ParagraphStyle(
        'SeccionCMPC',
        parent=styles['Heading2'],
        fontSize=12,
        spaceBefore=12,
        spaceAfter=6,
        fontName='Helvetica-Bold'
    )
    estilo_normal = ParagraphStyle(
        'NormalCMPC',
        parent=styles['Normal'],
        fontSize=10,
        spaceBefore=3,
        spaceAfter=3
    )
    estilo_pequeno = ParagraphStyle(
        'PequenoCMPC',
        parent=styles['Normal'],
        fontSize=9
    )

    elements = _generar_ficha_tecnica(styles, estilo_seccion, estilo_normal, estilo_pequeno)
    doc.build(elements)
    buffer.seek(0)

    filename = f"Ficha_Tecnica_HACCP.pdf"

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/cotizacion/{cotizacion_id}/preview")
async def preview_cotizacion_pdf(
    cotizacion_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Genera PDF completo de cotizacion para visualizacion (inline).
    No fuerza descarga, permite ver en navegador.
    """
    try:
        from app.services.pdf_cotizacion import generar_pdf_cotizacion_completo
        pdf_bytes = generar_pdf_cotizacion_completo(cotizacion_id, incluir_ficha_tecnica=True)
        filename = f"Cotizacion_{cotizacion_id}.pdf"

        return StreamingResponse(
            BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f"inline; filename={filename}"}
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
