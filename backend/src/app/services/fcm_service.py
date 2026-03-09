"""
Servicio de Firebase Cloud Messaging (FCM) - Sprint M
Fuente Laravel: app/Helpers/CustomHelpers.php líneas 2148-2176

Envía notificaciones push a dispositivos móviles usando FCM Legacy API.
"""
import httpx
import json
from typing import Optional, Any, Dict
from dataclasses import dataclass
from app.config import get_settings

settings = get_settings()


# =============================================================================
# CONFIGURACIÓN FCM
# =============================================================================

@dataclass
class FCMConfig:
    """Configuración del servicio FCM."""
    api_key: str = ""  # Se carga desde settings o variable de entorno
    fcm_url: str = "https://fcm.googleapis.com/fcm/send"

    def __post_init__(self):
        # Intentar cargar API key desde settings
        self.api_key = getattr(settings, 'FCM_API_KEY', '') or ""


# =============================================================================
# MODELOS DE DATOS
# =============================================================================

@dataclass
class FCMNotification:
    """
    Estructura de notificación FCM.
    Fuente: CustomHelpers.php línea 2152
    """
    title: str
    body: str
    icon: str = "myicon"


@dataclass
class FCMMessage:
    """
    Mensaje FCM completo.
    Fuente: CustomHelpers.php línea 2166
    """
    notification: FCMNotification
    token: str  # to: token del dispositivo
    data: Optional[Dict[str, Any]] = None


@dataclass
class FCMResponse:
    """Respuesta del servicio FCM."""
    success: bool
    message_id: Optional[str] = None
    error: Optional[str] = None
    raw_response: Optional[Dict[str, Any]] = None


# =============================================================================
# TIPOS DE NOTIFICACIÓN (extraídos de Laravel)
# =============================================================================

class TipoNotificacion:
    """
    Tipos de notificación usados en Laravel.
    Fuente: ManagementController.php líneas 862, 977, 1153, 1174, 1209
    """
    DEVOLUCION = "Devolución"
    RECHAZO = "Rechazo"
    MUESTRAS_DEVUELTAS = "Muestras Devueltas"
    CONSULTA = "Consulta"


# =============================================================================
# SERVICIO FCM
# =============================================================================

class FCMService:
    """
    Servicio para enviar notificaciones push via Firebase Cloud Messaging.

    Replica la función push_notification de Laravel:
    - Envía notificaciones push al técnico/vendedor
    - Usa FCM Legacy HTTP API

    Fuente: CustomHelpers.php líneas 2148-2176
    """

    def __init__(self, config: Optional[FCMConfig] = None):
        self.config = config or FCMConfig()

    def _get_headers(self) -> Dict[str, str]:
        """Genera headers para la petición FCM."""
        return {
            "Content-Type": "application/json",
            "Authorization": f"key={self.config.api_key}"
        }

    def push_notification(
        self,
        titulo: str,
        body: str,
        data: Any,
        token: str
    ) -> FCMResponse:
        """
        Envía una notificación push via FCM.

        Args:
            titulo: Título de la notificación (ej: "Devolución")
            body: Cuerpo del mensaje (ej: "Se le ha devuelto la OT 123")
            data: Datos adicionales (ej: work_order_id)
            token: Token del dispositivo móvil (user.token_push_mobile)

        Returns:
            FCMResponse con el resultado de la operación

        Fuente Laravel: CustomHelpers.php líneas 2148-2176
        """
        if not self.config.api_key:
            return FCMResponse(
                success=False,
                error="FCM API key no configurada"
            )

        if not token:
            return FCMResponse(
                success=False,
                error="Token de dispositivo no proporcionado"
            )

        # Construir payload según estructura Laravel
        # CustomHelpers.php líneas 2152-2166
        payload = {
            "notification": {
                "title": titulo,
                "body": body,
                "icon": "myicon"
            },
            "to": token,
            "data": {
                "data": data
            }
        }

        try:
            with httpx.Client() as client:
                response = client.post(
                    self.config.fcm_url,
                    headers=self._get_headers(),
                    json=payload,
                    timeout=10.0
                )

                result = response.json()

                # FCM devuelve success=1 o failure=1
                if result.get("success", 0) == 1:
                    return FCMResponse(
                        success=True,
                        message_id=result.get("results", [{}])[0].get("message_id"),
                        raw_response=result
                    )
                else:
                    error_msg = "Error desconocido"
                    if "results" in result and len(result["results"]) > 0:
                        error_msg = result["results"][0].get("error", error_msg)
                    return FCMResponse(
                        success=False,
                        error=error_msg,
                        raw_response=result
                    )

        except httpx.RequestError as e:
            return FCMResponse(
                success=False,
                error=f"Error de conexión: {str(e)}"
            )
        except json.JSONDecodeError:
            return FCMResponse(
                success=False,
                error="Respuesta FCM inválida"
            )

    # =========================================================================
    # MÉTODOS DE CONVENIENCIA (replican uso en Laravel)
    # =========================================================================

    def notificar_devolucion(self, ot_id: int, token: str) -> FCMResponse:
        """
        Notifica devolución de OT al vendedor.
        Fuente: ManagementController.php línea 862
        """
        return self.push_notification(
            titulo=TipoNotificacion.DEVOLUCION,
            body=f"Se le ha devuelto la OT {ot_id}",
            data=ot_id,
            token=token
        )

    def notificar_rechazo(self, ot_id: int, token: str) -> FCMResponse:
        """
        Notifica rechazo de OT al vendedor.
        Fuente: ManagementController.php línea 977
        """
        return self.push_notification(
            titulo=TipoNotificacion.RECHAZO,
            body=f"Se rechazo la OT {ot_id}",
            data=ot_id,
            token=token
        )

    def notificar_muestras_devueltas(self, ot_id: int, token: str) -> FCMResponse:
        """
        Notifica devolución de muestras al vendedor.
        Fuente: ManagementController.php línea 1153
        """
        return self.push_notification(
            titulo=TipoNotificacion.MUESTRAS_DEVUELTAS,
            body=f"Se Devuelve la OT {ot_id}",
            data=ot_id,
            token=token
        )

    def notificar_consulta(self, ot_id: int, token: str) -> FCMResponse:
        """
        Notifica consulta realizada en la OT.
        Fuente: ManagementController.php líneas 1174, 1183
        """
        return self.push_notification(
            titulo=TipoNotificacion.CONSULTA,
            body=f"Se le ha realizado una consulta en la OT {ot_id}",
            data=ot_id,
            token=token
        )


# =============================================================================
# SINGLETON
# =============================================================================

_fcm_service: Optional[FCMService] = None


def get_fcm_service() -> FCMService:
    """Obtiene instancia singleton del servicio FCM."""
    global _fcm_service
    if _fcm_service is None:
        _fcm_service = FCMService()
    return _fcm_service
