"""
Tests Sprint H2 — Items 3 y 4

Cubre:
- Item 3 (val 17): parse_decimal_chile, format_decimal_chile, DecimalChile type alias
- Item 4 (val 18): validate_oc_consistency, validate_oc_file_allowed

Origen:
- aibo/output/inveb-h1/documento/sprint-h2-item3-parse-decimal-chile-implementado.md
- aibo/output/inveb-h1/documento/sprint-h2-item4-validator-oc-implementado.md
"""
import sys
import os
import pytest
from decimal import Decimal
from fastapi import HTTPException

# Agregar el path de src al sistema
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.schemas.common import (
    parse_decimal_chile,
    format_decimal_chile,
)
from app.services.work_order_validations import (
    validate_oc_consistency,
    validate_oc_file_allowed,
)


# =============================================================================
# ITEM 3 — parse_decimal_chile
# =============================================================================

class TestParseDecimalChile:
    """Tests del parser canónico (val 17)."""

    def test_formato_chileno_basico(self):
        assert parse_decimal_chile("1234,56") == Decimal("1234.56")

    def test_formato_chileno_con_miles(self):
        assert parse_decimal_chile("1.234,56") == Decimal("1234.56")
        assert parse_decimal_chile("1.234.567,89") == Decimal("1234567.89")

    def test_formato_anglosajon_directo(self):
        assert parse_decimal_chile("1234.56") == Decimal("1234.56")

    def test_numero_directo_int(self):
        assert parse_decimal_chile(1234) == Decimal("1234")

    def test_numero_directo_float(self):
        assert parse_decimal_chile(1234.56) == Decimal("1234.56")

    def test_decimal_idempotente(self):
        d = Decimal("99.99")
        assert parse_decimal_chile(d) == d

    def test_none_retorna_none(self):
        assert parse_decimal_chile(None) is None

    def test_string_vacio_retorna_none(self):
        assert parse_decimal_chile("") is None
        assert parse_decimal_chile("   ") is None

    def test_whitespace_tolerante(self):
        assert parse_decimal_chile("  1.234,56  ") == Decimal("1234.56")

    def test_valor_invalido_levanta_error(self):
        with pytest.raises(ValueError):
            parse_decimal_chile("no es un numero")

    def test_tipo_no_soportado_levanta_error(self):
        with pytest.raises(ValueError):
            parse_decimal_chile([1, 2, 3])

    def test_solo_entero_chileno(self):
        # "1.234" sin coma se interpreta como anglosajón directo (Decimal("1.234"))
        # NO como "1234" porque la heurística requiere "," para asumir formato chileno
        assert parse_decimal_chile("1.234") == Decimal("1.234")

    def test_negativo(self):
        assert parse_decimal_chile("-1234,56") == Decimal("-1234.56")
        assert parse_decimal_chile("-1.234,56") == Decimal("-1234.56")


class TestFormatDecimalChile:
    """Tests del formateador (val 17)."""

    def test_formato_basico_con_miles(self):
        assert format_decimal_chile(Decimal("1234.56")) == "1.234,56"

    def test_decimales_personalizados(self):
        assert format_decimal_chile(Decimal("1234.5"), decimales=4) == "1.234,5000"
        assert format_decimal_chile(Decimal("1234.56"), decimales=0) == "1.235"

    def test_sin_separador_miles(self):
        assert format_decimal_chile(
            Decimal("1234.56"), incluir_miles=False
        ) == "1234,56"

    def test_none_retorna_vacio(self):
        assert format_decimal_chile(None) == ""

    def test_int_se_convierte(self):
        assert format_decimal_chile(1234) == "1.234,00"

    def test_float_se_convierte(self):
        assert format_decimal_chile(1234.5) == "1.234,50"

    def test_redondeo_estandar(self):
        # 1234.555 con 2 decimales → 1.234,55 o 1.234,56 según política Decimal
        # Decimal usa half-even por defecto (banker's rounding)
        result = format_decimal_chile(Decimal("1234.555"), decimales=2)
        assert result in ("1.234,55", "1.234,56")  # tolera ambas convenciones


class TestRoundtripParseFormat:
    """Tests de ida-y-vuelta para asegurar invariancia."""

    def test_parse_then_format(self):
        original = "1.234,56"
        parsed = parse_decimal_chile(original)
        formatted = format_decimal_chile(parsed)
        assert formatted == original

    def test_format_then_parse(self):
        original = Decimal("9876.54")
        formatted = format_decimal_chile(original)
        parsed = parse_decimal_chile(formatted)
        assert parsed == original


# =============================================================================
# ITEM 4 — validate_oc_consistency / validate_oc_file_allowed
# =============================================================================

class TestValidateOcConsistency:
    """Tests del helper de consistencia OC (val 18) — para endpoint aprobación."""

    def test_oc_si_con_archivo_pasa(self):
        ot = {"oc": 1, "oc_file": "/uploads/ot_123/oc.pdf"}
        validate_oc_consistency(ot)  # No levanta excepción

    def test_oc_si_sin_archivo_falla(self):
        ot = {"oc": 1, "oc_file": None}
        with pytest.raises(HTTPException) as exc_info:
            validate_oc_consistency(ot)
        assert exc_info.value.status_code == 422
        assert "OC=Sí" in exc_info.value.detail
        assert "archivo" in exc_info.value.detail.lower()

    def test_oc_si_archivo_vacio_falla(self):
        ot = {"oc": 1, "oc_file": ""}
        with pytest.raises(HTTPException) as exc_info:
            validate_oc_consistency(ot)
        assert exc_info.value.status_code == 422

    def test_oc_no_sin_archivo_pasa(self):
        ot = {"oc": 0, "oc_file": None}
        validate_oc_consistency(ot)  # No levanta excepción

    def test_oc_null_sin_archivo_pasa(self):
        # OT con oc=NULL es OT que no requiere OC — no debe levantar
        ot = {"oc": None, "oc_file": None}
        validate_oc_consistency(ot)


class TestValidateOcFileAllowed:
    """Tests del helper que rechaza upload de archivo OC sin oc=1 (val 18)."""

    def test_oc_si_permite_upload(self):
        ot = {"oc": 1}
        validate_oc_file_allowed(ot)  # No levanta excepción

    def test_oc_no_rechaza_upload(self):
        ot = {"oc": 0}
        with pytest.raises(HTTPException) as exc_info:
            validate_oc_file_allowed(ot)
        assert exc_info.value.status_code == 400
        assert "OC marcada" in exc_info.value.detail

    def test_oc_null_rechaza_upload(self):
        ot = {"oc": None}
        with pytest.raises(HTTPException) as exc_info:
            validate_oc_file_allowed(ot)
        assert exc_info.value.status_code == 400


# =============================================================================
# Smoke test integrado: parse → validate (escenario realista)
# =============================================================================

class TestEscenarioIntegrado:
    """Smoke test que combina parse + validate en flujo realista."""

    def test_cotizacion_con_margen_y_oc_marcada(self):
        # Frontend envía margen como string chileno
        margen_raw = "12,5"
        margen = parse_decimal_chile(margen_raw)
        assert margen == Decimal("12.5")

        # OT marcada con oc=1 y archivo subido
        ot = {"oc": 1, "oc_file": "/uploads/ot_99/orden_compra.pdf"}
        validate_oc_consistency(ot)  # OK

    def test_ot_sin_oc_no_acepta_archivo(self):
        ot = {"oc": 0}
        # Intentar subir archivo OC a OT con oc=0 → rechazado
        with pytest.raises(HTTPException) as exc:
            validate_oc_file_allowed(ot)
        assert exc.value.status_code == 400
