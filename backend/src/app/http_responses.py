"""
Respuestas HTTP estandarizadas para INVEB
Sprint I: Validaciones Backend - Tarea I.6

Define constantes y funciones para respuestas HTTP consistentes.
"""
from fastapi import HTTPException, status
from typing import Any, Optional, Dict


# ============================================
# CÓDIGOS HTTP ESTÁNDAR
# ============================================

class HTTPCodes:
    """Códigos HTTP estándar para el proyecto INVEB."""

    # Éxito (2xx)
    OK = status.HTTP_200_OK                      # GET exitoso, respuesta con datos
    CREATED = status.HTTP_201_CREATED            # POST exitoso, recurso creado
    NO_CONTENT = status.HTTP_204_NO_CONTENT      # DELETE exitoso, sin contenido

    # Errores del cliente (4xx)
    BAD_REQUEST = status.HTTP_400_BAD_REQUEST    # Solicitud mal formada
    UNAUTHORIZED = status.HTTP_401_UNAUTHORIZED   # No autenticado
    FORBIDDEN = status.HTTP_403_FORBIDDEN         # Sin permisos
    NOT_FOUND = status.HTTP_404_NOT_FOUND        # Recurso no existe
    CONFLICT = status.HTTP_409_CONFLICT          # Conflicto (ej: duplicado)
    UNPROCESSABLE = status.HTTP_422_UNPROCESSABLE_ENTITY  # Validación fallida

    # Errores del servidor (5xx)
    INTERNAL_ERROR = status.HTTP_500_INTERNAL_SERVER_ERROR  # Error interno
    SERVICE_UNAVAILABLE = status.HTTP_503_SERVICE_UNAVAILABLE  # BD no disponible


# ============================================
# EXCEPCIONES PREDEFINIDAS
# ============================================

def raise_not_found(resource: str = "Recurso", id_value: Any = None):
    """
    Lanza excepción 404 - Recurso no encontrado.

    Args:
        resource: Nombre del recurso (ej: "Cliente", "OT")
        id_value: ID del recurso buscado

    Raises:
        HTTPException: 404 Not Found
    """
    detail = f"{resource} no encontrado"
    if id_value is not None:
        detail = f"{resource} con ID {id_value} no encontrado"

    raise HTTPException(
        status_code=HTTPCodes.NOT_FOUND,
        detail=detail
    )


def raise_validation_error(detail: str, field: Optional[str] = None):
    """
    Lanza excepción 422 - Error de validación.

    Args:
        detail: Descripción del error
        field: Campo que falló la validación

    Raises:
        HTTPException: 422 Unprocessable Entity
    """
    message = detail
    if field:
        message = f"Campo '{field}': {detail}"

    raise HTTPException(
        status_code=HTTPCodes.UNPROCESSABLE,
        detail=message
    )


def raise_duplicate_error(field: str, value: Any):
    """
    Lanza excepción 409 - Recurso duplicado.

    Args:
        field: Campo duplicado (ej: "rut", "email")
        value: Valor duplicado

    Raises:
        HTTPException: 409 Conflict
    """
    raise HTTPException(
        status_code=HTTPCodes.CONFLICT,
        detail=f"Ya existe un registro con {field}='{value}'"
    )


def raise_unauthorized(detail: str = "No autenticado"):
    """
    Lanza excepción 401 - No autenticado.

    Args:
        detail: Mensaje de error

    Raises:
        HTTPException: 401 Unauthorized
    """
    raise HTTPException(
        status_code=HTTPCodes.UNAUTHORIZED,
        detail=detail
    )


def raise_forbidden(detail: str = "No tiene permisos para realizar esta acción"):
    """
    Lanza excepción 403 - Sin permisos.

    Args:
        detail: Mensaje de error

    Raises:
        HTTPException: 403 Forbidden
    """
    raise HTTPException(
        status_code=HTTPCodes.FORBIDDEN,
        detail=detail
    )


def raise_bad_request(detail: str):
    """
    Lanza excepción 400 - Solicitud mal formada.

    Args:
        detail: Descripción del error

    Raises:
        HTTPException: 400 Bad Request
    """
    raise HTTPException(
        status_code=HTTPCodes.BAD_REQUEST,
        detail=detail
    )


def raise_internal_error(detail: str = "Error interno del servidor"):
    """
    Lanza excepción 500 - Error interno.

    Args:
        detail: Descripción del error (cuidado con info sensible)

    Raises:
        HTTPException: 500 Internal Server Error
    """
    raise HTTPException(
        status_code=HTTPCodes.INTERNAL_ERROR,
        detail=detail
    )


def raise_service_unavailable(service: str = "Base de datos"):
    """
    Lanza excepción 503 - Servicio no disponible.

    Args:
        service: Nombre del servicio no disponible

    Raises:
        HTTPException: 503 Service Unavailable
    """
    raise HTTPException(
        status_code=HTTPCodes.SERVICE_UNAVAILABLE,
        detail=f"{service} no disponible. Intente más tarde."
    )


# ============================================
# RESPUESTAS ESTÁNDAR
# ============================================

def success_response(
    message: str = "Operación exitosa",
    data: Optional[Any] = None,
    id: Optional[int] = None
) -> Dict:
    """
    Construye respuesta de éxito estándar.

    Args:
        message: Mensaje de éxito
        data: Datos adicionales
        id: ID del recurso creado/modificado

    Returns:
        Dict con estructura estándar
    """
    response = {"message": message}

    if id is not None:
        response["id"] = id

    if data is not None:
        response["data"] = data

    return response


def created_response(
    resource: str,
    id: int,
    data: Optional[Any] = None
) -> Dict:
    """
    Construye respuesta de recurso creado.

    Args:
        resource: Nombre del recurso (ej: "Cliente")
        id: ID del recurso creado
        data: Datos adicionales

    Returns:
        Dict con estructura estándar
    """
    return success_response(
        message=f"{resource} creado exitosamente",
        id=id,
        data=data
    )


def updated_response(
    resource: str,
    id: int,
    data: Optional[Any] = None
) -> Dict:
    """
    Construye respuesta de recurso actualizado.

    Args:
        resource: Nombre del recurso (ej: "Cliente")
        id: ID del recurso actualizado
        data: Datos adicionales

    Returns:
        Dict con estructura estándar
    """
    return success_response(
        message=f"{resource} actualizado exitosamente",
        id=id,
        data=data
    )


def deleted_response(resource: str, id: int) -> Dict:
    """
    Construye respuesta de recurso eliminado.

    Args:
        resource: Nombre del recurso (ej: "Cliente")
        id: ID del recurso eliminado

    Returns:
        Dict con estructura estándar
    """
    return success_response(
        message=f"{resource} eliminado exitosamente",
        id=id
    )


def list_response(
    items: list,
    total: int,
    page: int = 1,
    page_size: int = 10
) -> Dict:
    """
    Construye respuesta de listado paginado.

    Args:
        items: Lista de items
        total: Total de registros
        page: Página actual
        page_size: Tamaño de página

    Returns:
        Dict con estructura de paginación estándar
    """
    total_pages = (total + page_size - 1) // page_size if page_size > 0 else 1

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }
