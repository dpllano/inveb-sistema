"""
Email Service - Sistema de envio de correos electronicos.
Replica la funcionalidad de Laravel Mail para el microservicio FastAPI.

Tipos de correos soportados:
- Recuperacion de contrasena
- Notificacion nuevo cliente
- Notificacion cotizaciones pendientes
- Alerta cotizacion con margen negativo
- Recordatorio actualizacion de matrices
- Envio de cotizacion PDF al cliente
"""

import os
import smtplib
import secrets
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
from datetime import datetime, timedelta
from typing import Optional, List
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)


@dataclass
class EmailConfig:
    """Configuracion de email desde variables de entorno."""
    smtp_host: str = os.getenv("MAIL_HOST", "smtp.mailtrap.io")
    smtp_port: int = int(os.getenv("MAIL_PORT", "2525"))
    smtp_user: str = os.getenv("MAIL_USERNAME", "")
    smtp_password: str = os.getenv("MAIL_PASSWORD", "")
    smtp_tls: bool = os.getenv("MAIL_ENCRYPTION", "tls").lower() == "tls"
    from_address: str = os.getenv("MAIL_FROM_ADDRESS", "no-reply@invebchile.cl")
    from_name: str = os.getenv("MAIL_FROM_NAME", "CMPC")
    base_url: str = os.getenv("APP_URL", "https://envases-ot.inveb.cl")
    # Email para notificaciones admin
    admin_email: str = os.getenv("ADMIN_EMAIL", "maria.botella@cmpc.com")


class EmailTemplates:
    """Templates HTML para correos electronicos."""

    @staticmethod
    def _base_template(content: str, primary_color: str = "#003f7d") -> str:
        """Template base con estilos comunes."""
        return f"""
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CMPC Envases</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <tr>
            <td style="background: linear-gradient(135deg, {primary_color} 0%, #16213e 100%); padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">CMPC Envases</h1>
                <p style="color: #ccc; margin: 5px 0 0 0; font-size: 14px;">Sistema de Ordenes de Trabajo</p>
            </td>
        </tr>
        <!-- Content -->
        <tr>
            <td style="padding: 30px;">
                {content}
            </td>
        </tr>
        <!-- Footer -->
        <tr>
            <td style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666;">
                <p style="margin: 0;">Este es un correo automatico, por favor no responda a este mensaje.</p>
                <p style="margin: 10px 0 0 0;">&copy; {datetime.now().year} CMPC Envases - Todos los derechos reservados</p>
            </td>
        </tr>
    </table>
</body>
</html>
"""

    @staticmethod
    def password_recovery(reset_url: str) -> str:
        """Template para recuperacion de contrasena."""
        content = f"""
<h2 style="color: #333; margin: 0 0 20px 0;">Recuperar Contrasena</h2>
<p style="color: #666; line-height: 1.6;">
    Has solicitado restablecer tu contrasena. Haz clic en el boton de abajo para crear una nueva contrasena.
</p>
<p style="color: #666; line-height: 1.6;">
    <strong>Importante:</strong> Este enlace es valido por 5 minutos.
</p>
<div style="text-align: center; margin: 30px 0;">
    <a href="{reset_url}"
       style="background-color: #003f7d; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Restablecer Contrasena
    </a>
</div>
<p style="color: #999; font-size: 12px;">
    Si no solicitaste este cambio, puedes ignorar este correo.
</p>
"""
        return EmailTemplates._base_template(content)

    @staticmethod
    def new_client_notification(client_name: str, client_id: int, manage_url: str) -> str:
        """Template para notificacion de nuevo cliente."""
        content = f"""
<h2 style="color: #333; margin: 0 0 20px 0;">Nuevo Cliente Registrado</h2>
<p style="color: #666; line-height: 1.6;">
    Se ha registrado un nuevo cliente en el sistema:
</p>
<div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <p style="margin: 0; color: #333;"><strong>Nombre:</strong> {client_name}</p>
    <p style="margin: 10px 0 0 0; color: #333;"><strong>ID:</strong> {client_id}</p>
    <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">
        <em>Clasificacion por defecto: Z</em>
    </p>
</div>
<div style="text-align: center; margin: 30px 0;">
    <a href="{manage_url}"
       style="background-color: #003f7d; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Gestionar Clientes
    </a>
</div>
"""
        return EmailTemplates._base_template(content)

    @staticmethod
    def pending_quotations(user_name: str, approve_url: str) -> str:
        """Template para notificacion de cotizaciones pendientes."""
        content = f"""
<h2 style="color: #333; margin: 0 0 20px 0;">Cotizaciones Pendientes de Aprobacion</h2>
<p style="color: #666; line-height: 1.6;">
    Hola <strong>{user_name}</strong>,
</p>
<p style="color: #666; line-height: 1.6;">
    Hay cotizaciones pendientes que requieren tu aprobacion. Por favor revisa y gestiona las cotizaciones.
</p>
<div style="text-align: center; margin: 30px 0;">
    <a href="{approve_url}"
       style="background-color: #003f7d; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Gestionar Cotizaciones
    </a>
</div>
"""
        return EmailTemplates._base_template(content)

    @staticmethod
    def negative_margin_alert(quotation_id: int) -> str:
        """Template para alerta de cotizacion con margen negativo."""
        content = f"""
<h2 style="color: #c41e3a; margin: 0 0 20px 0;">Alerta: Margen Bruto Negativo</h2>
<p style="color: #666; line-height: 1.6;">
    La cotizacion numero <strong>#{quotation_id}</strong> ha sido aprobada, sin embargo,
    el margen bruto es <strong style="color: #c41e3a;">negativo</strong>.
</p>
<p style="color: #666; line-height: 1.6;">
    Por favor revise esta cotizacion para tomar las acciones necesarias.
</p>
<div style="background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <p style="margin: 0; color: #856404;">
        <strong>Atencion:</strong> Las cotizaciones con margen negativo pueden afectar la rentabilidad del proyecto.
    </p>
</div>
"""
        return EmailTemplates._base_template(content, primary_color="#c41e3a")

    @staticmethod
    def matrix_update_reminder(user_name: str, date: str) -> str:
        """Template para recordatorio de actualizacion de matrices."""
        content = f"""
<h2 style="color: #3aaa35; margin: 0 0 20px 0;">Recordatorio: Actualizacion de Matrices</h2>
<p style="color: #666; line-height: 1.6;">
    Hola <strong>{user_name}</strong>,
</p>
<p style="color: #666; line-height: 1.6;">
    Hoy es viernes <strong>{date}</strong>. Recuerde que debe actualizar la base de datos de matrices.
</p>
<div style="background-color: #d4edda; border: 1px solid #28a745; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <p style="margin: 0; color: #155724;">
        Mantener las matrices actualizadas es importante para el correcto funcionamiento del sistema.
    </p>
</div>
"""
        return EmailTemplates._base_template(content, primary_color="#3aaa35")

    @staticmethod
    def quotation_to_client(client_name: str, seller_name: str) -> str:
        """Template para envio de cotizacion al cliente."""
        content = f"""
<h2 style="color: #333; margin: 0 0 20px 0;">Nueva Cotizacion</h2>
<p style="color: #666; line-height: 1.6;">
    Estimado/a <strong>{client_name}</strong>,
</p>
<p style="color: #666; line-height: 1.6;">
    El vendedor <strong>{seller_name}</strong> ha generado una cotizacion para usted.
</p>
<p style="color: #666; line-height: 1.6;">
    Encontrara adjunto el documento PDF con los detalles de la cotizacion.
</p>
<div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <p style="margin: 0; color: #666; font-size: 14px;">
        Para cualquier consulta, no dude en contactar a su vendedor asignado.
    </p>
</div>
"""
        return EmailTemplates._base_template(content)

    @staticmethod
    def ot_notification(ot_id: int, ot_description: str, message: str, sender_name: str) -> str:
        """Template para notificacion de OT (asignacion, transicion, etc)."""
        content = f"""
<h2 style="color: #333; margin: 0 0 20px 0;">Notificacion de Orden de Trabajo</h2>
<div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <p style="margin: 0; color: #333;"><strong>OT #:</strong> {ot_id}</p>
    <p style="margin: 10px 0 0 0; color: #333;"><strong>Descripcion:</strong> {ot_description}</p>
</div>
<p style="color: #666; line-height: 1.6;">
    {message}
</p>
<p style="color: #999; font-size: 12px; margin-top: 20px;">
    Enviado por: {sender_name}
</p>
"""
        return EmailTemplates._base_template(content)


class EmailService:
    """Servicio para envio de correos electronicos."""

    def __init__(self, config: Optional[EmailConfig] = None):
        self.config = config or EmailConfig()
        self.templates = EmailTemplates()

    def _send_email(
        self,
        to: List[str],
        subject: str,
        html_content: str,
        bcc: Optional[List[str]] = None,
        attachments: Optional[List[tuple]] = None  # [(filename, content, mime_type), ...]
    ) -> bool:
        """
        Envia un correo electronico.

        Args:
            to: Lista de destinatarios
            subject: Asunto del correo
            html_content: Contenido HTML
            bcc: Lista de copia oculta
            attachments: Lista de adjuntos (nombre, contenido, tipo_mime)

        Returns:
            True si se envio correctamente, False en caso contrario
        """
        try:
            msg = MIMEMultipart('mixed')
            msg['From'] = f"{self.config.from_name} <{self.config.from_address}>"
            msg['To'] = ", ".join(to)
            msg['Subject'] = subject

            # Agregar contenido HTML
            html_part = MIMEText(html_content, 'html', 'utf-8')
            msg.attach(html_part)

            # Agregar adjuntos si existen
            if attachments:
                for filename, content, mime_type in attachments:
                    attachment = MIMEApplication(content, _subtype=mime_type.split('/')[-1])
                    attachment.add_header('Content-Disposition', 'attachment', filename=filename)
                    msg.attach(attachment)

            # Conectar y enviar
            all_recipients = to + (bcc or [])

            with smtplib.SMTP(self.config.smtp_host, self.config.smtp_port) as server:
                if self.config.smtp_tls:
                    server.starttls()
                if self.config.smtp_user and self.config.smtp_password:
                    server.login(self.config.smtp_user, self.config.smtp_password)
                server.sendmail(self.config.from_address, all_recipients, msg.as_string())

            logger.info(f"Email enviado exitosamente a {to}")
            return True

        except Exception as e:
            logger.error(f"Error enviando email: {e}")
            return False

    def send_password_recovery(self, email: str, token: str) -> bool:
        """Envia correo de recuperacion de contrasena."""
        reset_url = f"{self.config.base_url}/resetPasswordRecovery?token={token}"
        html_content = self.templates.password_recovery(reset_url)
        return self._send_email(
            to=[email],
            subject="Recuperar Contrasena",
            html_content=html_content
        )

    def send_new_client_notification(self, client_name: str, client_id: int) -> bool:
        """Envia notificacion de nuevo cliente al admin."""
        manage_url = f"{self.config.base_url}/mantenedores/clients/editar/{client_id}"
        html_content = self.templates.new_client_notification(client_name, client_id, manage_url)
        return self._send_email(
            to=[self.config.admin_email],
            subject="Nuevo Cliente Registrado",
            html_content=html_content
        )

    def send_pending_quotations_notification(self, user_email: str, user_name: str) -> bool:
        """Envia notificacion de cotizaciones pendientes."""
        approve_url = f"{self.config.base_url}/cotizador/aprobaciones"
        html_content = self.templates.pending_quotations(user_name, approve_url)
        return self._send_email(
            to=[user_email],
            subject="Cotizaciones en espera de Aprobacion",
            html_content=html_content,
            bcc=[self.config.admin_email]
        )

    def send_negative_margin_alert(self, quotation_id: int) -> bool:
        """Envia alerta de cotizacion con margen negativo."""
        html_content = self.templates.negative_margin_alert(quotation_id)
        return self._send_email(
            to=[self.config.admin_email],
            subject=f"Cotizacion Numero:{quotation_id} Aprobada con Mg Bruto Negativo",
            html_content=html_content
        )

    def send_matrix_update_reminder(self, user_email: str, user_name: str) -> bool:
        """Envia recordatorio de actualizacion de matrices."""
        date = datetime.now().strftime("%d/%m/%Y")
        html_content = self.templates.matrix_update_reminder(user_name, date)
        return self._send_email(
            to=[user_email],
            subject=f"Recordatorio: Actualizar la base datos matrices al {date}",
            html_content=html_content
        )

    def send_quotation_to_client(
        self,
        client_email: str,
        client_name: str,
        seller_name: str,
        quotation_id: int,
        pdf_content: bytes
    ) -> bool:
        """Envia cotizacion PDF al cliente."""
        html_content = self.templates.quotation_to_client(client_name, seller_name)
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        filename = f"Cotizacion_N_{quotation_id}_{timestamp}.pdf"

        return self._send_email(
            to=[client_email],
            subject="Cotizacion CMPC",
            html_content=html_content,
            attachments=[(filename, pdf_content, "application/pdf")]
        )

    def send_ot_notification(
        self,
        to_email: str,
        ot_id: int,
        ot_description: str,
        message: str,
        sender_name: str,
        subject: Optional[str] = None
    ) -> bool:
        """Envia notificacion relacionada a una OT."""
        html_content = self.templates.ot_notification(ot_id, ot_description, message, sender_name)
        email_subject = subject or f"Notificacion OT #{ot_id}"
        return self._send_email(
            to=[to_email],
            subject=email_subject,
            html_content=html_content
        )


def generate_password_reset_token() -> tuple:
    """
    Genera un token de recuperacion de contrasena.

    Returns:
        tuple: (token, fecha_expiracion)
    """
    token = secrets.token_hex(32)  # 64 caracteres
    expiration = datetime.now() + timedelta(minutes=5)
    return token, expiration


# Instancia global del servicio de email
email_service = EmailService()
