"""
Modelo SQLModel — MuestraSalaCorte (val 22 brecha P0 #2)

Tabla N:M que normaliza los 8 campos sala_corte_* del legacy
(sala_corte_vendedor, sala_corte_diseñador, sala_corte_laboratorio,
sala_corte_1..4, sala_corte_diseñador_revision) en una relación N:M.

Origen: aibo/output/inveb-h1/documento/brecha-filtro-sala-corte-tecnico-muestras.md
Script SQL: backend/migrations/001_create_muestra_salas_corte.sql

Decisión H2 — Opción C híbrida (2026-05-03):
Modelo SQLModel para la tabla nueva (greenfield). El resto del backend
sigue con pymysql crudo. Refactor arquitectónico verdadero queda en H3.
"""
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


# =============================================================================
# ROLES VÁLIDOS — coherentes con los 8 campos sala_corte_* del legacy
# =============================================================================
ROLES_SALA_CORTE = (
    "vendedor",
    "diseñador",
    "laboratorio",
    "cliente_1",
    "cliente_2",
    "cliente_3",
    "cliente_4",
    "diseñador_revision",
)


# =============================================================================
# MUESTRA_SALAS_CORTE — relación N:M muestras ↔ salas_corte
# =============================================================================

class MuestraSalaCorteBase(SQLModel):
    """Campos base de la asociación muestra ↔ sala_corte."""
    muestra_id: int = Field(
        foreign_key="muestras.id",
        description="ID de la muestra asociada"
    )
    role: str = Field(
        max_length=50,
        description="Rol del actor que asigna la sala. Uno de ROLES_SALA_CORTE."
    )
    sala_corte_id: int = Field(
        foreign_key="salas_corte.id",
        description="ID de la sala de corte asignada"
    )


class MuestraSalaCorte(MuestraSalaCorteBase, table=True):
    """
    Tabla muestra_salas_corte.

    Constraint UNIQUE en (muestra_id, role) garantiza que cada muestra
    tiene a lo sumo una sala asignada por rol — coherente con la semántica
    legacy donde cada campo sala_corte_* era una columna única.
    """
    __tablename__ = "muestra_salas_corte"

    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: Optional[datetime] = Field(default=None)
    updated_at: Optional[datetime] = Field(default=None)


class MuestraSalaCorteCreate(MuestraSalaCorteBase):
    """Schema para crear una asociación muestra ↔ sala_corte."""
    pass


class MuestraSalaCorteRead(MuestraSalaCorteBase):
    """Schema de lectura con id."""
    id: int
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
