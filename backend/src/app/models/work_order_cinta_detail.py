"""
Modelo SQLModel — WorkOrderCintaDetail (val 19 cinta cascada)

Tabla 1:0..1 que extrae los 8 campos cinta del legacy
(corte_liner, tipo_cinta, distancia_cinta_1..6) del registro plano de
`work_orders` a una tabla separada — solo presentes cuando work_orders.cinta = 1.

Origen: aibo/output/inveb-h1/documento/hack-cinta-cascada-decision.md
Script SQL: backend/migrations/002_create_work_order_cinta_details.sql

Decisión H2 — Opción C híbrida (2026-05-03):
Modelo SQLModel disponible para nuevas tablas (greenfield). El código de
inserts existente sigue escribiendo a work_orders.cinta_* (paridad de API).
La migración del código a la nueva tabla se programa en H3 post-cutover.

Patrón establecido en val 19:
"API queda plano (mismo formato que legacy), schema interno queda normalizado".
Esto significa que el DTO Pydantic de WorkOrderInput mantiene la estructura
plana (corte_liner, tipo_cinta, distancia_cinta_1..6 como campos directos),
pero el service interno puede mapearlos a/desde WorkOrderCintaDetail.
"""
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


# =============================================================================
# WORK_ORDER_CINTA_DETAILS — relación 1:0..1 con work_orders
# =============================================================================

class WorkOrderCintaDetailBase(SQLModel):
    """Campos base de los detalles cinta (8 campos del legacy)."""
    work_order_id: int = Field(
        foreign_key="work_orders.id",
        description="ID de la work_order asociada (relación 1:0..1)"
    )
    corte_liner: Optional[int] = Field(
        default=None,
        description="Corte del liner (legacy: work_orders.corte_liner)"
    )
    tipo_cinta: Optional[int] = Field(
        default=None,
        description="Tipo de cinta (FK a tipos_cintas) — legacy: work_orders.tipo_cinta"
    )
    distancia_cinta_1: Optional[int] = Field(default=None)
    distancia_cinta_2: Optional[int] = Field(default=None)
    distancia_cinta_3: Optional[int] = Field(default=None)
    distancia_cinta_4: Optional[int] = Field(default=None)
    distancia_cinta_5: Optional[int] = Field(default=None)
    distancia_cinta_6: Optional[int] = Field(default=None)


class WorkOrderCintaDetail(WorkOrderCintaDetailBase, table=True):
    """
    Tabla work_order_cinta_details.

    Constraint UNIQUE en work_order_id garantiza relación 1:0..1
    (una sola fila de detalles por OT).

    NOTA H2: el código actual (work_orders.py inserts en líneas 4696, 4931, 4951)
    sigue escribiendo a work_orders.cinta_* directo. Este modelo está disponible
    para uso futuro y para queries explícitas de detalles cinta.
    """
    __tablename__ = "work_order_cinta_details"

    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: Optional[datetime] = Field(default=None)
    updated_at: Optional[datetime] = Field(default=None)


class WorkOrderCintaDetailCreate(WorkOrderCintaDetailBase):
    """Schema para crear detalles cinta de una OT."""
    pass


class WorkOrderCintaDetailRead(WorkOrderCintaDetailBase):
    """Schema de lectura con id."""
    id: int
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
