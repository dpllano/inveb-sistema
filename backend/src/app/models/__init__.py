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
]
