"""
Modelo CascadeValidCombination - Combinaciones válidas de producto/impresión/FSC.
FASE 3: Define qué combinaciones de valores son permitidas en el formulario OT.
"""
from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List, TYPE_CHECKING
from datetime import datetime

if TYPE_CHECKING:
    from .cascade_combination_planta import CascadeCombinationPlanta


class CascadeValidCombinationBase(SQLModel):
    """Campos base de combinación válida."""

    product_type_id: int = Field(index=True, description="FK a product_types")
    impresion: str = Field(max_length=20, description="Tipo de impresión: flexo, offset, sinImpresion")
    fsc: str = Field(max_length=20, description="Tipo FSC: fsc, noFsc, mixto")
    active: bool = Field(default=True, description="Si la combinación está activa")
    notes: Optional[str] = Field(default=None, description="Notas adicionales")


class CascadeValidCombination(CascadeValidCombinationBase, table=True):
    """Modelo de tabla cascade_valid_combinations."""

    __tablename__ = "cascade_valid_combinations"

    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relación con plantas permitidas
    plantas: List["CascadeCombinationPlanta"] = Relationship(back_populates="combination")


class CascadeValidCombinationCreate(CascadeValidCombinationBase):
    """Schema para crear una combinación válida."""
    pass


class CascadeValidCombinationRead(CascadeValidCombinationBase):
    """Schema para leer una combinación válida."""
    id: int
    created_at: datetime
    updated_at: datetime


class CascadeValidCombinationWithPlantas(CascadeValidCombinationRead):
    """Schema con plantas incluidas."""
    plantas: List["CascadeCombinationPlantaRead"] = []


# Import para evitar circular import
from .cascade_combination_planta import CascadeCombinationPlantaRead
CascadeValidCombinationWithPlantas.model_rebuild()
