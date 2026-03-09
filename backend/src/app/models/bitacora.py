"""
Modelos de Bitácora de Work Orders - Sprint M
Fuente Laravel: app/BitacoraWorkOrder.php, app/BitacoraCamposModificados.php
Migraciones: 2022_01_10, 2022_02_21, 2022_03_31

Registra TODOS los cambios realizados a las OTs para auditoría.
"""
from sqlmodel import SQLModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import validator
import json


# =============================================================================
# BITACORA WORK ORDERS - Registro de cambios en OTs
# =============================================================================

class BitacoraWorkOrderBase(SQLModel):
    """
    Campos base de la bitácora.
    Fuente: database/migrations/2022_01_10_123810_bitacora_work_orders.php
            database/migrations/2022_02_21_170442_add_new_fileds_table_bitacora_work_orders.php
    """
    observacion: str = Field(
        max_length=255,
        description="Descripción de la operación: 'Insercion de datos de OT', 'Modificación de datos de OT'"
    )
    operacion: str = Field(
        max_length=255,
        description="Tipo de operación: 'Insercion', 'Modificación', 'Mckee'"
    )
    work_order_id: int = Field(
        description="ID de la OT afectada"
    )
    user_id: int = Field(
        description="ID del usuario que realizó el cambio"
    )


class BitacoraWorkOrder(BitacoraWorkOrderBase, table=True):
    """
    Modelo de tabla bitacora_work_orders.
    Registra cada operación de inserción o modificación de OTs.
    """
    __tablename__ = "bitacora_work_orders"

    id: Optional[int] = Field(default=None, primary_key=True)

    # Campos JSON - Agregados en migración 2022_02_21
    datos_modificados: Optional[str] = Field(
        default=None,
        description="JSON con diff de cambios: {campo: {texto, antiguo_valor, nuevo_valor}}"
    )
    user_data: Optional[str] = Field(
        default=None,
        description="JSON con datos del usuario: {nombre, apellido, rut, role_id}"
    )
    ip_solicitud: Optional[str] = Field(
        default=None,
        max_length=255,
        description="IP del cliente que realizó la solicitud"
    )
    url: Optional[str] = Field(
        default=None,
        max_length=500,
        description="URL completa de la solicitud"
    )

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# =============================================================================
# BITACORA CAMPOS MODIFICADOS - Catálogo de campos
# =============================================================================

class BitacoraCamposModificadosBase(SQLModel):
    """
    Campos base del catálogo de campos modificados.
    Fuente: database/migrations/2022_03_31_154002_create_table_bitacora_campos_modificados.php
    """
    descripcion: str = Field(
        description="Nombre del campo en español (ej: 'Descripción', 'Código producto')"
    )
    active: bool = Field(
        default=True,
        description="Si el campo está activo para auditoría"
    )


class BitacoraCamposModificados(BitacoraCamposModificadosBase, table=True):
    """
    Catálogo de campos que se auditan.
    Usado para validar qué campos se deben registrar en la bitácora.
    """
    __tablename__ = "bitacora_campos_modificados"

    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# =============================================================================
# SCHEMAS PYDANTIC - Para requests y responses
# =============================================================================

class UserDataSchema(SQLModel):
    """Schema para user_data JSON."""
    nombre: str
    apellido: Optional[str] = None
    rut: Optional[str] = None
    role_id: int


class CampoModificadoSchema(SQLModel):
    """
    Schema para cada campo modificado en datos_modificados.
    Fuente Laravel: WorkOrderController.php líneas 5340-5344
    """
    texto: str  # Nombre legible del campo
    antiguo_valor: Dict[str, Any]  # {id: int|null, descripcion: str}
    nuevo_valor: Dict[str, Any]  # {id: int|null, descripcion: str}


class BitacoraCreate(SQLModel):
    """Schema para crear un registro de bitácora."""
    observacion: str
    operacion: str  # "Insercion" | "Modificación" | "Mckee"
    work_order_id: int
    user_id: int
    datos_modificados: Optional[Dict[str, CampoModificadoSchema]] = None
    user_data: Optional[UserDataSchema] = None
    ip_solicitud: Optional[str] = None
    url: Optional[str] = None


class BitacoraResponse(SQLModel):
    """Schema para respuesta de bitácora con datos parseados."""
    id: int
    observacion: str
    operacion: str
    work_order_id: int
    user_id: int
    datos_modificados: Optional[Dict[str, Any]] = None
    user_data: Optional[Dict[str, Any]] = None
    ip_solicitud: Optional[str] = None
    url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    # Campos calculados para facilitar visualización
    usuario_nombre: Optional[str] = None
    cantidad_cambios: int = 0

    @classmethod
    def from_model(cls, model: BitacoraWorkOrder) -> "BitacoraResponse":
        """Convierte modelo a response con datos parseados."""
        datos_mod = None
        user_data_parsed = None
        usuario_nombre = None
        cantidad_cambios = 0

        if model.datos_modificados:
            try:
                datos_mod = json.loads(model.datos_modificados)
                cantidad_cambios = len(datos_mod)
            except json.JSONDecodeError:
                datos_mod = None

        if model.user_data:
            try:
                user_data_parsed = json.loads(model.user_data)
                if user_data_parsed:
                    nombre = user_data_parsed.get('nombre', '')
                    apellido = user_data_parsed.get('apellido', '')
                    usuario_nombre = f"{nombre} {apellido}".strip()
            except json.JSONDecodeError:
                user_data_parsed = None

        return cls(
            id=model.id,
            observacion=model.observacion,
            operacion=model.operacion,
            work_order_id=model.work_order_id,
            user_id=model.user_id,
            datos_modificados=datos_mod,
            user_data=user_data_parsed,
            ip_solicitud=model.ip_solicitud,
            url=model.url,
            created_at=model.created_at,
            updated_at=model.updated_at,
            usuario_nombre=usuario_nombre,
            cantidad_cambios=cantidad_cambios
        )


class HistorialCambiosResponse(SQLModel):
    """Schema para respuesta de historial de cambios de una OT."""
    work_order_id: int
    total_cambios: int
    registros: List[BitacoraResponse]
    tiene_mckee: bool = False


# =============================================================================
# CONSTANTES - Tipos de operación (extraídos de Laravel)
# =============================================================================

class TipoOperacion:
    """
    Tipos de operación para la bitácora.
    Fuente: WorkOrderController.php líneas 1700, 5566, 4505
    """
    INSERCION = "Insercion"
    MODIFICACION = "Modificación"
    MCKEE = "Mckee"


class ObservacionBitacora:
    """
    Textos de observación estándar.
    Fuente: WorkOrderController.php líneas 1699, 5565, 4504
    """
    INSERCION = "Insercion de datos de OT"
    MODIFICACION = "Modificación de datos de OT"
    MCKEE = "Aplicacion Formula Mckee"
