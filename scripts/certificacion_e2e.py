#!/usr/bin/env python3
"""
certificacion_e2e.py - Matriz feature x accion con admin token

Sprint 4 Final INVEB Cierre de Brechas (chip 105 Certificacion Funcional E2E).

Itera todos los mantenedores genericos + listados principales + endpoints clave
del cotizador y OT con JWT admin. Registra HTTP code, tiempo respuesta,
y forma del response.

Output:
- aibo/output/inveb-cierre-brechas/specs/certificacion-e2e-{fecha}.json
- aibo/output/inveb-cierre-brechas/tests/certificacion-e2e-{fecha}.md
"""
from __future__ import annotations

import json
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime
from pathlib import Path
from typing import Any, Optional, Tuple

REPO_ROOT = Path(__file__).resolve().parent.parent
API_BASE = "http://localhost:8001/api/v1"
TIMEOUT = 8


def get_admin_token() -> str:
    """Login admin para obtener JWT real."""
    req = urllib.request.Request(
        f"{API_BASE}/auth/login",
        data=json.dumps({"rut": "22222222-2", "password": "test123"}).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            return json.loads(resp.read())["access_token"]
    except Exception as e:
        print(f"ERROR login admin: {e}", file=sys.stderr)
        sys.exit(1)


def hit_full(method: str, path: str, token: str, body: Optional[dict] = None) -> Tuple[int, float, Any]:
    """Como hit() pero retorna el body completo (sin truncar a 500 chars).
    Usar solo cuando se necesita parsear arrays/totales para asserts."""
    url = f"{API_BASE}{path}"
    headers = {"Authorization": f"Bearer {token}"}
    data = None
    if body is not None:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    start = time.time()
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT * 3) as resp:
            elapsed = (time.time() - start) * 1000
            try:
                return resp.status, elapsed, json.loads(resp.read())
            except Exception:
                return resp.status, elapsed, None
    except urllib.error.HTTPError as e:
        elapsed = (time.time() - start) * 1000
        return e.code, elapsed, None
    except Exception as e:
        elapsed = (time.time() - start) * 1000
        return -1, elapsed, None


def hit(method: str, path: str, token: str, body: Optional[dict] = None) -> Tuple[int, float, Any]:
    """Ejecuta request, retorna (http_code, elapsed_ms, response_sample)."""
    url = f"{API_BASE}{path}"
    headers = {"Authorization": f"Bearer {token}"}
    data = None
    if body is not None:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    start = time.time()
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            elapsed = (time.time() - start) * 1000
            raw = resp.read()[:500]
            try:
                return resp.status, elapsed, json.loads(raw)
            except Exception:
                return resp.status, elapsed, raw.decode("utf-8", errors="ignore")
    except urllib.error.HTTPError as e:
        elapsed = (time.time() - start) * 1000
        body_txt = e.read()[:300].decode("utf-8", errors="ignore")
        return e.code, elapsed, body_txt
    except Exception as e:
        elapsed = (time.time() - start) * 1000
        return -1, elapsed, str(e)


# Lista de tablas mantenedores generic a auditar (de generic.py TABLA_CONFIG)
MANTENEDORES_GENERIC = [
    "canales", "organizaciones_ventas", "tipos_cintas", "colores", "estilos",
    "tipo_productos", "almacenes", "tipo_palet", "grupo_imputacion_material",
    "matrices", "sectores", "cartones", "secuencias_operacionales", "rechazo_conjunto",
    "tiempo_tratamiento", "grupo_materiales_1", "grupo_materiales_2", "materiales",
    "grupo_plantas", "adhesivos", "cebes", "clasificaciones_clientes", "armados",
    "procesos", "pegados", "envases", "rayados", "papeles", "cardboards",
    "carton_esquineros", "plantas", "tipo_ondas", "factores_ondas",
    "factores_desarrollos", "factores_seguridads", "areahcs", "consumo_adhesivos",
    "consumo_energias", "consumo_adhesivo_pegados", "merma_corrugadoras",
    "merma_convertidoras", "mercados", "rubros", "ciudades_fletes", "fletes",
    "maquila_servicios", "tarifario", "tarifario_margens", "variables_cotizador",
    "insumos_palletizados", "detalle_precio_palletizados", "paises", "fsc",
    "reference_types", "recubrimiento_types", "cantidad_base", "margenes_minimos",
    "codigo_materials", "prefijo_materials", "sufijo_materials", "pallet_status_types",
    "formato_bobinas", "pallet_patrons", "pallet_box_quantities", "audits",
    "bitacora_campos_modificados", "additional_characteristics_type", "changelogs",
    "pallet_protections", "states", "pallet_qas", "pallet_tag_formats",
    "target_market", "design_types", "precut_types", "coverage_types", "impresion",
    "ink_types", "print_type", "food_types", "protection_type",
]

# Endpoints clave fuera del generic (lista feature x accion)
ENDPOINTS_FEATURE = [
    # (group, method, path, accion)
    ("auth", "GET", "/auth/me", "GET profile"),
    ("auth", "GET", "/auth/roles", "LIST roles"),
    # Clients
    ("clients", "GET", "/mantenedores/clients/?page_size=1", "LIST"),
    # Installations
    ("installations", "GET", "/mantenedores/installations/by-client/627", "LIST by client"),
    # Users
    ("users", "GET", "/mantenedores/users/?page_size=1", "LIST"),
    # Roles
    ("roles", "GET", "/mantenedores/roles/?page_size=1", "LIST"),
    # Jerarquias N1/N2/N3
    ("jerarquias", "GET", "/mantenedores/jerarquias/nivel1?page_size=1", "LIST N1"),
    ("jerarquias", "GET", "/mantenedores/jerarquias/nivel2?page_size=1", "LIST N2"),
    ("jerarquias", "GET", "/mantenedores/jerarquias/nivel3?page_size=1", "LIST N3"),
    ("jerarquias", "GET", "/mantenedores/jerarquias/nivel2/parents", "Parents N2"),
    ("jerarquias", "GET", "/mantenedores/jerarquias/nivel3/parents", "Parents N3"),
    # Cotizaciones
    ("cotizaciones", "GET", "/cotizaciones/?page_size=1", "LIST"),
    ("cotizaciones", "GET", "/cotizaciones/estados/", "LIST estados"),
    ("cotizaciones", "GET", "/cotizaciones/pendientes-aprobacion/?page_size=1", "LIST pendientes"),
    ("cotizaciones", "GET", "/cotizaciones/23/costos-resumen", "Cost summary cotizacion 23 (regression PR #26 cl.nombre)"),
    # Work Orders
    ("work_orders", "GET", "/work-orders/?page_size=1", "LIST"),
    ("work_orders", "GET", "/work-orders/filter-options", "Filter options"),
    ("work_orders", "GET", "/work-orders/form-options-complete", "Form options"),
    # Cascadas
    ("cascades", "GET", "/cascades/clientes/627/instalaciones", "Cascada instalaciones"),
    ("cascades", "GET", "/cascades/clientes/627/contactos", "Cascada contactos"),
    ("cascades", "GET", "/cascades/jerarquias/nivel2-rubro?hierarchy_id=1", "Cascada N2"),
    ("cascades", "GET", "/cascades/jerarquias/nivel3-rubro?subhierarchy_id=1", "Cascada N3"),
    # Form options (cotizador)
    ("form_options", "GET", "/areahc/form-options-complete", "Cotizador completo"),
    ("form_options", "GET", "/form-options/certificados-calidad", "Certificados"),
    # Muestras
    ("muestras", "GET", "/muestras/?page_size=1", "LIST"),
    # Materials
    ("materials", "GET", "/materials/?page_size=1", "LIST"),
    # Reports (ya con path correctos)
    ("reports", "GET", "/reports/ots-por-usuario?fecha_desde=2024-01-01&fecha_hasta=2024-12-31", "OTs por usuario"),
    ("reports", "GET", "/reports/carga-mensual?ano=2024", "Carga mensual"),
]


def main() -> int:
    print(f"=== Sprint 4 Certificacion E2E - {datetime.now().isoformat()} ===")

    print("Login admin...")
    token = get_admin_token()
    print(f"Token OK ({len(token)} chars)")

    results = {
        "fecha": datetime.now().isoformat(),
        "api_base": API_BASE,
        "mantenedores_generic": [],
        "endpoints_feature": [],
        "summary": {},
    }

    # Mantenedores genericos: LIST por cada tabla
    print(f"\n=== Mantenedores Generic LIST ({len(MANTENEDORES_GENERIC)} tablas) ===")
    mantenedor_results = []
    for tabla in MANTENEDORES_GENERIC:
        code, elapsed, sample = hit("GET", f"/mantenedores/generic/{tabla}?page_size=1", token)
        total = sample.get("total") if isinstance(sample, dict) else None
        ok = 200 <= code < 300
        mark = "OK " if ok else f"FAIL"
        mantenedor_results.append({
            "tabla": tabla,
            "method": "GET",
            "code": code,
            "elapsed_ms": round(elapsed, 1),
            "total_rows": total,
        })
        print(f"  {mark} {code} ({elapsed:5.0f}ms, total={total}) {tabla}")

    results["mantenedores_generic"] = mantenedor_results

    # Endpoints feature
    print(f"\n=== Endpoints feature ({len(ENDPOINTS_FEATURE)}) ===")
    feature_results = []
    for group, method, path, accion in ENDPOINTS_FEATURE:
        code, elapsed, sample = hit(method, path, token)
        ok = 200 <= code < 300
        mark = "OK " if ok else f"FAIL"
        feature_results.append({
            "group": group, "method": method, "path": path, "accion": accion,
            "code": code, "elapsed_ms": round(elapsed, 1),
        })
        print(f"  {mark} {code} ({elapsed:6.0f}ms) {method:6s} {path}")
    results["endpoints_feature"] = feature_results

    # Asserts criticos de regresion (PR #25 cotizador runtime)
    # Bug A: listboxes Crear Detalle vacios por env var inconsistente
    #        VITE_API_BASE_URL -> VITE_API_URL en DetalleForm + CalculoHCModal.
    # Bug B: filtro CLIENTE truncado por page_size=100 vs 2478 clientes
    #        + backend le=2000. Fix le=5000 + page_size=3000.
    print(f"\n=== Asserts criticos regresion PR #25 ===")
    asserts_results = []

    def assert_min(label: str, value: int, minimum: int) -> None:
        ok = value >= minimum
        asserts_results.append({"label": label, "value": value, "minimum": minimum, "ok": ok})
        mark = "OK " if ok else "FAIL"
        print(f"  {mark} {label}: {value} (>= {minimum})")

    # Bug A regression: cartons_esquinero + colecciones criticas no vacias
    code, _, sample = hit_full("GET", "/areahc/form-options-complete", token)
    if 200 <= code < 300 and isinstance(sample, dict):
        for key, minimum in [
            ("cartons_esquinero", 1),  # 10 en prod actual
            ("cartons", 1),
            ("processes", 1),
            ("print_types", 1),
            ("barniz_types", 1),
            ("pallets", 1),
            ("hierarchies", 1),
            ("product_types", 1),
        ]:
            arr = sample.get(key, [])
            assert_min(f"form-options.{key}", len(arr) if isinstance(arr, list) else 0, minimum)
    else:
        asserts_results.append({"label": "form-options-complete", "value": code, "minimum": 200, "ok": False})
        print(f"  FAIL form-options-complete: HTTP {code}")

    # Bug B regression: clientes filter respeta page_size > 2000
    code, _, sample = hit_full("GET", "/mantenedores/clients/?activo=true&page_size=3000", token)
    if 200 <= code < 300 and isinstance(sample, dict):
        items = sample.get("items", [])
        total = sample.get("total", 0)
        assert_min("clients activos page_size=3000 items", len(items), 2000)
        assert_min("clients total>=2000", total, 2000)
    else:
        asserts_results.append({"label": "clients page_size=3000", "value": code, "minimum": 200, "ok": False})
        print(f"  FAIL clients page_size=3000: HTTP {code}")

    results["asserts_regresion_pr25"] = asserts_results

    # Summary
    all_results = mantenedor_results + feature_results
    total = len(all_results)
    ok_count = sum(1 for r in all_results if 200 <= r["code"] < 300)
    code_dist = {}
    for r in all_results:
        c = r["code"]
        code_dist[str(c)] = code_dist.get(str(c), 0) + 1
    results["summary"] = {
        "total": total,
        "ok": ok_count,
        "fail": total - ok_count,
        "ok_pct": round(100 * ok_count / total, 1) if total else 0,
        "code_distribution": code_dist,
    }
    asserts_fail = [a for a in asserts_results if not a["ok"]]
    results["summary"]["asserts_regresion_pr25_fail"] = len(asserts_fail)
    results["summary"]["asserts_regresion_pr25_total"] = len(asserts_results)
    print(f"\n=== Summary ===")
    print(f"  Total: {total}, OK: {ok_count} ({results['summary']['ok_pct']}%), FAIL: {total - ok_count}")
    print(f"  Code distribution: {code_dist}")
    print(f"  Asserts regresion PR #25: {len(asserts_results) - len(asserts_fail)}/{len(asserts_results)} OK")

    # Persistir
    out_json = REPO_ROOT / "aibo" / "output" / "inveb-cierre-brechas" / "specs" / f"certificacion-e2e-{datetime.now().strftime('%Y%m%d')}.json"
    out_json.parent.mkdir(parents=True, exist_ok=True)
    out_json.write_text(json.dumps(results, indent=2, ensure_ascii=False))
    print(f"\nJSON: {out_json}")

    # Lista bugs runtime detectados (codes != 2xx)
    fails = [r for r in all_results if not (200 <= r["code"] < 300)]
    if fails:
        print(f"\n=== Fails ({len(fails)}) ===")
        for r in fails[:20]:
            label = r.get("tabla") or f"{r.get('method')} {r.get('path')}"
            print(f"  {r['code']} {label}")

    # Exit != 0 si hay asserts de regresion fallando (failsafe CI)
    return 0 if not asserts_fail else 2


if __name__ == "__main__":
    sys.exit(main())
