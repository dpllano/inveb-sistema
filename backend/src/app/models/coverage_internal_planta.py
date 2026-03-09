"""
Modelo CoverageInternalPlanta - Relación recubrimiento interno con plantas.
FASE 3: Tabla pivote que normaliza el campo multi-valor coverage_internals.planta_id.
"""
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class CoverageInternalPlantaBase(SQLModel):
    """Campos base de la relación coverage_internal-planta."""

    coverage_internal_id: int = Field(index=True, description="FK a coverage_internals")
    planta_id: int = Field(index=True, description="FK a plantas")


class CoverageInternalPlanta(CoverageInternalPlantaBase, table=True):
    """Modelo de tabla coverage_internal_planta."""

    __tablename__ = "coverage_internal_planta"

    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        # Índice único compuesto
        table_args = {"UniqueConstraint": ("coverage_internal_id", "planta_id")}


class CoverageInternalPlantaCreate(CoverageInternalPlantaBase):
    """Schema para crear relación coverage_internal-planta."""
    pass


class CoverageInternalPlantaRead(CoverageInternalPlantaBase):
    """Schema para leer relación coverage_internal-planta."""
    id: int
    created_at: datetime
    updated_at: datetime
