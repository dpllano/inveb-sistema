"""
Tests para regresiones de SQL aliases en routers de cotizaciones.

Regresion del bug PR #26:
- `cotizaciones/router.py:378` tenia `cl.nombre_sap as cliente_nombre` pero la
  columna real en BD legacy es `cl.nombre` (en clients.py:421 se hace
  `c.nombre as nombre_sap` para exponer ese alias en el API REST).
- El endpoint `/cotizaciones/{id}/costos-resumen` fallaba con HTTP 500
  `Unknown column 'cl.nombre_sap'` porque referenciaba el alias del API
  como si fuera columna fisica de la tabla.

Verifica via inspeccion de codigo que ningun query SQL en routers de
cotizaciones referencie columnas que solo existen como alias de API.
"""
import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
COTIZACIONES_DIR = REPO_ROOT / "backend" / "src" / "app" / "routers" / "cotizaciones"

# Columnas reales de la tabla clients (verificadas runtime contra BD prod 2026-05-13)
# Las que aparecen como `c.nombre as nombre_sap` o similar son alias del API, NO columnas fisicas
CLIENT_API_ALIASES_NOT_DB_COLUMNS = {
    "nombre_sap",  # alias de c.nombre en clients.py:421
    "clasificacion_nombre",  # alias de cc.nombre via LEFT JOIN
    "phone_contacto_1",  # alias de phone_contacto
    "email_contacto_1",  # alias de email_contacto
}


def test_no_client_api_aliases_in_cotizaciones_sql():
    """
    PR #26 regression: ningun query SQL debe referenciar `cl.<alias>` o `c.<alias>`
    cuando `<alias>` no es una columna fisica de la tabla clients.
    """
    violations = []
    pattern = re.compile(r'\b(cl|c)\.(\w+)\b')

    for py_file in COTIZACIONES_DIR.rglob("*.py"):
        text = py_file.read_text(encoding="utf-8")
        # Solo lineas que parezcan SQL (heuristica: contienen SELECT, FROM, WHERE, JOIN)
        for lineno, line in enumerate(text.splitlines(), 1):
            line_upper = line.upper()
            if not any(kw in line_upper for kw in ("SELECT ", "FROM CLIENTS", "JOIN CLIENTS", "WHERE ", " AS ")):
                continue
            for match in pattern.finditer(line):
                table_alias = match.group(1)
                column = match.group(2)
                # cl. siempre referencia clients en este codebase
                # c. en SQL de cotizaciones referencia cotizacions, no clients - skip
                if table_alias == "c":
                    continue
                if column in CLIENT_API_ALIASES_NOT_DB_COLUMNS:
                    violations.append(f"{py_file.name}:{lineno}: {table_alias}.{column} (es alias API, no columna BD)")

    assert not violations, (
        "Queries SQL referencian alias del API REST como si fueran columnas fisicas:\n"
        + "\n".join(violations)
        + "\nFix: usar el nombre real de la columna BD (ej. `cl.nombre` no `cl.nombre_sap`)."
    )
