"""
Modelos SQLModel para INVEB Envases OT.
FASE 3: Tablas de soporte al formulario de cascada.
"""
from .cascade_rule import (
    CascadeRule,
    CascadeRuleCreate,
    CascadeRuleRead,
    CascadeRuleUpdate
)
from .cascade_valid_combination import (
    CascadeValidCombination,
    CascadeValidCombinationCreate,
    CascadeValidCombinationRead,
    CascadeValidCombinationWithPlantas
)
from .cascade_combination_planta import (
    CascadeCombinationPlanta,
    CascadeCombinationPlantaCreate,
    CascadeCombinationPlantaRead
)
from .coverage_internal_planta import (
    CoverageInternalPlanta,
    CoverageInternalPlantaCreate,
    CoverageInternalPlantaRead
)
from .carton_planta import (
    CartonPlanta,
    CartonPlantaCreate,
    CartonPlantaRead
)
from .bitacora import (
    BitacoraWorkOrder,
    BitacoraCamposModificados,
    BitacoraCreate,
    BitacoraResponse,
    HistorialCambiosResponse,
    TipoOperacion,
    ObservacionBitacora,
)
from .muestra_sala_corte import (
    MuestraSalaCorte,
    MuestraSalaCorteCreate,
    MuestraSalaCorteRead,
    ROLES_SALA_CORTE,
)
from .work_order_cinta_detail import (
    WorkOrderCintaDetail,
    WorkOrderCintaDetailCreate,
    WorkOrderCintaDetailRead,
)

__all__ = [
    # CascadeRule
    "CascadeRule",
    "CascadeRuleCreate",
    "CascadeRuleRead",
    "CascadeRuleUpdate",
    # CascadeValidCombination
    "CascadeValidCombination",
    "CascadeValidCombinationCreate",
    "CascadeValidCombinationRead",
    "CascadeValidCombinationWithPlantas",
    # CascadeCombinationPlanta
    "CascadeCombinationPlanta",
    "CascadeCombinationPlantaCreate",
    "CascadeCombinationPlantaRead",
    # CoverageInternalPlanta
    "CoverageInternalPlanta",
    "CoverageInternalPlantaCreate",
    "CoverageInternalPlantaRead",
    # CartonPlanta
    "CartonPlanta",
    "CartonPlantaCreate",
    "CartonPlantaRead",
    # Bitacora - Sprint M
    "BitacoraWorkOrder",
    "BitacoraCamposModificados",
    "BitacoraCreate",
    "BitacoraResponse",
    "HistorialCambiosResponse",
    "TipoOperacion",
    "ObservacionBitacora",
    # MuestraSalaCorte - Val 22 (sprint H2)
    "MuestraSalaCorte",
    "MuestraSalaCorteCreate",
    "MuestraSalaCorteRead",
    "ROLES_SALA_CORTE",
    # WorkOrderCintaDetail - Val 19 (sprint H2)
    "WorkOrderCintaDetail",
    "WorkOrderCintaDetailCreate",
    "WorkOrderCintaDetailRead",
]
