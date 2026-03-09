"""
Modelo CartonPlanta - Relación cartón con plantas.
FASE 3: Tabla pivote que normaliza el campo multi-valor cartons.planta_id.
"""
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class CartonPlantaBase(SQLModel):
    """Campos base de la relación carton-planta."""

    carton_id: int = Field(index=True, description="FK a cartons")
    planta_id: int = Field(index=True, description="FK a plantas")


class CartonPlanta(CartonPlantaBase, table=True):
    """Modelo de tabla carton_planta."""

    __tablename__ = "carton_planta"

    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        # Índice único compuesto
        table_args = {"UniqueConstraint": ("carton_id", "planta_id")}


class CartonPlantaCreate(CartonPlantaBase):
    """Schema para crear relación carton-planta."""
    pass


class CartonPlantaRead(CartonPlantaBase):
    """Schema para leer relación carton-planta."""
    id: int
    created_at: datetime
    updated_at: datetime
