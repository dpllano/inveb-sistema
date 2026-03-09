"""
Modelo CascadeCombinationPlanta - Plantas válidas para cada combinación.
FASE 3: Tabla pivote que relaciona combinaciones válidas con plantas permitidas.
"""
from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, TYPE_CHECKING
from datetime import datetime

if TYPE_CHECKING:
    from .cascade_valid_combination import CascadeValidCombination


class CascadeCombinationPlantaBase(SQLModel):
    """Campos base de la relación combinación-planta."""

    combination_id: int = Field(foreign_key="cascade_valid_combinations.id", index=True)
    planta_id: int = Field(index=True, description="FK a plantas")


class CascadeCombinationPlanta(CascadeCombinationPlantaBase, table=True):
    """Modelo de tabla cascade_combination_plantas."""

    __tablename__ = "cascade_combination_plantas"

    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relación inversa
    combination: Optional["CascadeValidCombination"] = Relationship(back_populates="plantas")


class CascadeCombinationPlantaCreate(CascadeCombinationPlantaBase):
    """Schema para crear relación combinación-planta."""
    pass


class CascadeCombinationPlantaRead(CascadeCombinationPlantaBase):
    """Schema para leer relación combinación-planta."""
    id: int
    created_at: datetime
    updated_at: datetime
