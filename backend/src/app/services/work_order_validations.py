"""
Validaciones de consistencia de Work Orders.

Origen: Val 18 (`hack-archivo-oc-condicional.md`) — sprint H2 Item 4.

DECISIÓN H2:
El legacy validaba "si OC=Sí entonces archivo OC obligatorio" SOLO en JavaScript
inline en blade templates. Era vulnerabilidad bypasseable desde Postman/Excel/mobile.

El refactor H2 implementa validación backend simétrica:
1. Endpoint upload (`uploads.py`): rechaza upload de archivo OC si OT.oc != 1
2. Endpoint aprobación de OT (sub-item futuro): rechaza aprobar OT si oc=1 y oc_file IS NULL
3. Frontend (yup): UX feedback inmediato (no obligatorio para seguridad)

Este módulo provee helpers reutilizables para 2+ y otros checks de consistencia.

USO TÍPICO:
    from app.services.work_order_validations import validate_oc_consistency

    # En endpoint de aprobación de OT
    @router.post("/{ot_id}/aprobar")
    def aprobar_ot(ot_id: int, ...):
        ot = get_ot(ot_id)
        validate_oc_consistency(ot)  # Levanta HTTPException si inconsistente
        # ... resto de la lógica de aprobación
"""
from typing import Any, Dict
from fastapi import HTTPException, status


# =============================================================================
# OC — Orden de Compra
# =============================================================================

def validate_oc_consistency(ot: Dict[str, Any]) -> None:
    """
    Valida la regla "si oc=1 entonces oc_file obligatorio".

    Equivalente backend de la validación que el legacy tenía SOLO en JS inline.
    Cierra la vulnerabilidad de bypass desde Postman/Excel/integraciones.

    Args:
        ot: dict con al menos las keys 'oc' y 'oc_file' del registro work_orders

    Raises:
        HTTPException 422 si oc=1 y oc_file es None/vacío
    """
    oc_flag = ot.get("oc")
    oc_file = ot.get("oc_file")

    if oc_flag == 1 and not oc_file:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "La OT está marcada con OC=Sí pero no tiene archivo de Orden "
                "de Compra adjunto. Suba el archivo OC antes de continuar. "
                "(Validación cierra vulnerabilidad legacy val 18)"
            )
        )


def validate_oc_file_allowed(ot: Dict[str, Any]) -> None:
    """
    Valida que la OT acepte el upload de archivo OC.

    Es la validación complementaria de validate_oc_consistency:
    - validate_oc_consistency: "no se puede aprobar OT con oc=1 sin archivo"
    - validate_oc_file_allowed: "no se puede subir archivo OC si oc=0"

    Args:
        ot: dict con al menos la key 'oc' del registro work_orders

    Raises:
        HTTPException 400 si oc != 1 (no se debe permitir upload)
    """
    oc_flag = ot.get("oc")

    if oc_flag != 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "La OT no tiene OC marcada (oc=1). "
                "No se puede subir archivo OC. "
                "Marque la OT con oc=1 antes de subir el archivo."
            )
        )
