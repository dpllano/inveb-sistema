"""
Schemas comunes — utilidades de parsing y formateo Chile.

Origen: Val 17 (`hack-coma-decimal-decision.md`).

DECISIÓN H2:
El legacy tiene 164 ocurrencias de `str_replace(',', '.')` dispersas. Centralizar
en una función única `parse_decimal_chile()` que se usa desde DTOs Pydantic.
Convierte 164 puntos en 1.

ESTADO FastAPI 2026-05-03 (verificado):
El refactor solo tiene 7 ocurrencias del patrón disperso. Este módulo
formaliza la convención y permite migrar las 7 a la utilidad canónica.

UBICACIONES A MIGRAR (sub-items futuros, no obligatorios pre-cutover):
- routers/work_orders.py:3573    (cuchillas matriz)
- routers/work_orders.py:4613    (recorte característico — caso especial: quita .)
- services/pdf_cotizacion.py:115 (precio cotización)
- services/work_order_calculations.py:51 (helper _safe_float)
- services/excel_sap_generator.py:30 (formato Excel)

USO TÍPICO EN DTO PYDANTIC:
    from app.schemas.common import DecimalChile
    class CotizacionInput(BaseModel):
        margen: DecimalChile
        precio: DecimalChile

USO IMPERATIVO:
    from app.schemas.common import parse_decimal_chile
    valor = parse_decimal_chile("1.234,56")  # → Decimal("1234.56")
"""
from decimal import Decimal, InvalidOperation
from typing import Annotated, Any, Optional, Union
from pydantic import BeforeValidator


# =============================================================================
# PARSE — string con coma → Decimal
# =============================================================================

def parse_decimal_chile(value: Any) -> Optional[Decimal]:
    """
    Convierte un valor a Decimal, manejando el formato decimal chileno.

    Formatos aceptados:
    - "1234,56"        → Decimal("1234.56")     (coma como separador decimal)
    - "1.234,56"       → Decimal("1234.56")     (punto como separador miles, coma decimal)
    - "1234.56"        → Decimal("1234.56")     (formato anglosajón directo)
    - 1234.56          → Decimal("1234.56")     (ya es número)
    - Decimal("1234")  → Decimal("1234")        (idempotente)
    - None | ""        → None                   (vacío permitido)
    - "  1.234,56  "   → Decimal("1234.56")     (whitespace tolerante)

    Args:
        value: cualquier representación de número

    Returns:
        Decimal o None si value está vacío

    Raises:
        ValueError si el valor no se puede convertir a Decimal
    """
    # Vacío permitido — None | "" | sólo espacios
    if value is None:
        return None

    # Numérico directo (int, float, Decimal)
    if isinstance(value, Decimal):
        return value
    if isinstance(value, (int, float)):
        return Decimal(str(value))

    # String — limpiar formato chileno
    if isinstance(value, str):
        s = value.strip()
        if not s:
            return None

        # Detección heurística:
        # - Si contiene "," asume formato chileno: punto = miles, coma = decimal
        # - Si solo contiene "." asume formato anglosajón directo
        if "," in s:
            # Formato chileno: "1.234,56" → "1234.56"
            s = s.replace(".", "").replace(",", ".")
        # Si no hay ",", el "." se interpreta como decimal anglosajón (sin cambios)

        try:
            return Decimal(s)
        except InvalidOperation as e:
            raise ValueError(
                f"No se pudo convertir '{value}' a Decimal — formato inválido"
            ) from e

    raise ValueError(
        f"Tipo no soportado para parse_decimal_chile: {type(value).__name__}"
    )


# =============================================================================
# FORMAT — Decimal → string con coma (formato Chile)
# =============================================================================

def format_decimal_chile(
    value: Union[Decimal, int, float, None],
    decimales: int = 2,
    incluir_miles: bool = True,
) -> str:
    """
    Convierte un número a string con formato decimal chileno.

    Args:
        value: número a formatear (None retorna "")
        decimales: cantidad de decimales (default 2)
        incluir_miles: si True usa "." como separador de miles

    Returns:
        String formateado:
        - format_decimal_chile(Decimal("1234.56")) → "1.234,56"
        - format_decimal_chile(1234.56, decimales=0) → "1.235"
        - format_decimal_chile(1234.56, incluir_miles=False) → "1234,56"
        - format_decimal_chile(None) → ""
    """
    if value is None:
        return ""

    if not isinstance(value, Decimal):
        value = Decimal(str(value))

    if incluir_miles:
        # Formato anglosajón con miles, luego swap , ↔ .
        formateado = f"{value:,.{decimales}f}"
        # "1,234.56" → "1.234,56" via marcador temporal
        return formateado.replace(",", "X").replace(".", ",").replace("X", ".")
    else:
        # Sin separador miles, solo cambiar . → ,
        return f"{value:.{decimales}f}".replace(".", ",")


# =============================================================================
# TYPE ALIAS PARA DTOs PYDANTIC
# =============================================================================

DecimalChile = Annotated[Decimal, BeforeValidator(parse_decimal_chile)]
"""
Type alias para usar en DTOs Pydantic.

Aplica `parse_decimal_chile` automáticamente antes de validar el campo.
Acepta entradas en formato chileno y entrega Decimal limpio al modelo.

Ejemplo:
    from app.schemas.common import DecimalChile

    class CotizacionInput(BaseModel):
        margen: DecimalChile
        precio_unitario: DecimalChile
        descuento: Optional[DecimalChile] = None
"""

OptionalDecimalChile = Annotated[Optional[Decimal], BeforeValidator(parse_decimal_chile)]
"""Variante que acepta None (campos opcionales)."""
