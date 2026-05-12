"""
Tests para pagination del endpoint /mantenedores/clients/.

Regresion del bug PR #25:
- Backend `le=2000` < 2478 clientes activos en prod -> filtros frontend truncaban catalogo.
- Fix: `le=5000` + frontend page_size=3000 en 3 sitios.

Verifica via AST parsing (no requiere settings/BD) que:
1. El parametro `page_size` en list_clients declara `le >= 5000`.
2. El parametro `page_size` mantiene `ge=1`.
3. El default sigue siendo 20 (paginacion estandar).

Tambien valida coherencia con frontend: cualquier `page_size: N` literal en
los archivos frontend de cotizaciones/work_orders <= le del backend.
"""
import ast
import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
CLIENTS_PY = REPO_ROOT / "backend" / "src" / "app" / "routers" / "mantenedores" / "clients.py"
FRONTEND_PAGES = REPO_ROOT / "frontend" / "src" / "pages"


def _extract_page_size_query_args() -> dict:
    """Parse clients.py con AST + busca el parametro page_size de list_clients.
    Retorna dict con los kwargs de Query(...) o sentinels None."""
    tree = ast.parse(CLIENTS_PY.read_text(encoding="utf-8"))
    for node in ast.walk(tree):
        if not isinstance(node, ast.AsyncFunctionDef) or node.name != "list_clients":
            continue
        for arg, default in zip(node.args.args, [None] * (len(node.args.args) - len(node.args.defaults)) + list(node.args.defaults)):
            if arg.arg != "page_size":
                continue
            if not isinstance(default, ast.Call):
                return {}
            kwargs = {k.arg: ast.literal_eval(k.value) for k in default.keywords if isinstance(k.value, (ast.Constant, ast.Num))}
            # default posicional (Query(20, ...))
            if default.args and isinstance(default.args[0], (ast.Constant, ast.Num)):
                kwargs["default"] = ast.literal_eval(default.args[0])
            return kwargs
    return {}


def test_list_clients_page_size_le_is_at_least_5000():
    """
    PR #25 regression: el limite superior de page_size debe ser >= 5000.
    Si baja, el filtro CLIENTE del cotizador volveria a truncar el catalogo
    cuando hay > 2000 clientes activos en BD productiva (2478 al 2026-05-12).
    """
    kwargs = _extract_page_size_query_args()
    assert kwargs, "No se pudo extraer kwargs de page_size en list_clients"
    assert kwargs.get("le", 0) >= 5000, (
        f"page_size.le={kwargs.get('le')} < 5000. El bug del filtro CLIENTE "
        "volveria a aparecer cuando n_clientes_activos > le. Mantener >= 5000."
    )


def test_list_clients_page_size_ge_is_1():
    """page_size minimo = 1 (no permitir 0 o negativos)."""
    kwargs = _extract_page_size_query_args()
    assert kwargs.get("ge") == 1


def test_list_clients_page_size_default_is_20():
    """Default razonable para paginacion estandar; no truncar listados pequenos."""
    kwargs = _extract_page_size_query_args()
    assert kwargs.get("default") == 20


def test_frontend_page_size_within_backend_limit():
    """
    Coherencia frontend-backend: ningun page_size literal en pages/Cotizaciones
    o pages/WorkOrders debe exceder el limite backend (5000).
    Si el frontend pidiese 6000, el backend rechazaria con 422 sin que el dev
    se entere hasta runtime. Este test caza ese drift en static.
    """
    kwargs = _extract_page_size_query_args()
    backend_le = kwargs.get("le", 0)
    pattern = re.compile(r"page_size\s*:\s*(\d+)")
    violations = []
    for path in list(FRONTEND_PAGES.glob("Cotizaciones/*.tsx")) + list(FRONTEND_PAGES.glob("WorkOrders/*.tsx")):
        for match in pattern.finditer(path.read_text(encoding="utf-8")):
            n = int(match.group(1))
            if n > backend_le:
                violations.append((path.name, n))
    assert not violations, (
        f"Frontend pide page_size > backend le={backend_le}: {violations}. "
        "Subir backend `le=` o bajar frontend page_size."
    )
