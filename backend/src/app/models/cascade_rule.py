"""
Modelo CascadeRule - Reglas de cascada del formulario OT.
FASE 3: Define el comportamiento de habilitación/deshabilitación
de campos en función de selecciones previas.
"""
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class CascadeRuleBase(SQLModel):
    """Campos base compartidos entre Create/Read/Update."""

    rule_code: str = Field(max_length=20, index=True, description="Código único de la regla (ej: CASC-001)")
    rule_name: str = Field(max_length=100, description="Nombre descriptivo de la regla")
    trigger_field: str = Field(max_length=50, description="Campo que dispara la regla")
    trigger_table: Optional[str] = Field(default=None, max_length=50, description="Tabla del campo trigger")
    target_field: str = Field(max_length=50, description="Campo afectado por la regla")
    target_table: Optional[str] = Field(default=None, max_length=50, description="Tabla del campo target")
    action: str = Field(max_length=20, default="enable", description="Acción: enable, disable, setValue, filter")
    condition_type: str = Field(max_length=30, default="hasValue", description="Tipo de condición: hasValue, equals, in")
    condition_value: Optional[str] = Field(default=None, description="Valor de condición en JSON")
    reset_fields: Optional[str] = Field(default=None, description="Campos a resetear en JSON array")
    validation_endpoint: Optional[str] = Field(default=None, max_length=100, description="Endpoint de validación")
    cascade_order: int = Field(default=0, description="Orden de ejecución de la regla")
    form_context: str = Field(max_length=30, default="ot", description="Contexto del formulario")
    description: Optional[str] = Field(default=None, description="Descripción detallada")
    active: bool = Field(default=True, description="Si la regla está activa")


class CascadeRule(CascadeRuleBase, table=True):
    """Modelo de tabla cascade_rules."""

    __tablename__ = "cascade_rules"

    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class CascadeRuleCreate(CascadeRuleBase):
    """Schema para crear una regla de cascada."""
    pass


class CascadeRuleRead(CascadeRuleBase):
    """Schema para leer una regla de cascada."""
    id: int
    created_at: datetime
    updated_at: datetime


class CascadeRuleUpdate(SQLModel):
    """Schema para actualizar una regla de cascada (todos campos opcionales)."""
    rule_name: Optional[str] = None
    trigger_field: Optional[str] = None
    trigger_table: Optional[str] = None
    target_field: Optional[str] = None
    target_table: Optional[str] = None
    action: Optional[str] = None
    condition_type: Optional[str] = None
    condition_value: Optional[str] = None
    reset_fields: Optional[str] = None
    validation_endpoint: Optional[str] = None
    cascade_order: Optional[int] = None
    form_context: Optional[str] = None
    description: Optional[str] = None
    active: Optional[bool] = None
