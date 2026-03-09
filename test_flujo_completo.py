#!/usr/bin/env python3
"""
Test de Flujo Completo de OT con todos los estados
Fecha: 2026-02-25

Prueba sistemática de:
1. Flujo normal completo: PV → PDE → PDG → PP → PC → Terminada
2. Rechazos desde cada estado
3. Estados especiales
4. Transiciones por rol específico
"""

import requests
import json
from datetime import datetime
from typing import Optional, Dict
import time

BASE_URL = "http://localhost:8001/api/v1"
PASSWORD = "test123"

# Estados y sus áreas
ESTADOS = {
    1: ("PV", "Proceso de Ventas", 1),
    2: ("PDE", "Proceso de Diseño Estructural", 2),
    5: ("PDG", "Proceso de Diseño Gráfico", 3),
    6: ("PP", "Proceso de Cálculo Paletizado", 5),
    7: ("PC", "Proceso de Catalogación", 4),
    8: ("T", "Terminada", 4),
    9: ("P", "Perdida", 1),
    10: ("CC", "Consulta Cliente", 1),
    11: ("A", "Anulada", 1),
    12: ("R", "Rechazada", 1),
    17: ("SM", "Sala de Muestras", 6),
    18: ("ML", "Muestras Listas", 6),
}

USUARIOS = {
    "admin": "22222222-2",
    "vendedor": "11334692-2",
    "jefe_desarrollo": "20649380-1",
    "ingeniero": "8106237-4",
    "jefe_diseno": "16193907-2",
    "disenador": "9719795-4",
    "jefe_precatalog": "24727035-3",
    "precatalogador": "10554084-1",
    "jefe_catalogador": "6334369-2",
    "catalogador": "5068443-1",
}


def login(rut: str) -> Optional[str]:
    try:
        r = requests.post(f"{BASE_URL}/auth/login", json={"rut": rut, "password": PASSWORD})
        return r.json().get("access_token") if r.status_code == 200 else None
    except:
        return None


def crear_ot(token: str, nombre: str) -> Optional[int]:
    """Crea una OT de prueba"""
    data = {
        "client_id": 1, "tipo_solicitud": 1, "installation_id": 1, "contact_id": 1,
        "nombre_producto": nombre, "nombre_material": "Material test",
        "descripcion": "Test transiciones", "especificacion": "Test",
        "proceso_id": 2, "carton_id": 1, "color_id": 1, "estilo_id": 1,
        "cantidad_base": 1000, "canal_id": 1, "hierarchy_id": 2,
        "product_type_id": 1, "envase_id": 1, "sector_id": 1,
    }
    try:
        r = requests.post(f"{BASE_URL}/work-orders/", json=data, headers={"Authorization": f"Bearer {token}"})
        return r.json().get("id") if r.status_code in [200, 201] else None
    except:
        return None


def transicion(token: str, ot_id: int, estado: int, obs: str = "") -> Dict:
    """Realiza una transición de estado"""
    area = ESTADOS.get(estado, (None, None, 1))[2]
    data = {"management_type_id": 1, "state_id": estado, "work_space_id": area, "observation": obs or f"Transición a {estado}"}
    try:
        r = requests.post(f"{BASE_URL}/work-orders/{ot_id}/transition", json=data, headers={"Authorization": f"Bearer {token}"})
        return {"ok": r.status_code == 200, "msg": r.json().get("message", r.json().get("detail", str(r.status_code)))}
    except Exception as e:
        return {"ok": False, "msg": str(e)}


def get_ot_estado(token: str, ot_id: int) -> str:
    """Obtiene el estado actual de una OT"""
    try:
        r = requests.get(f"{BASE_URL}/work-orders/{ot_id}", headers={"Authorization": f"Bearer {token}"})
        if r.status_code == 200:
            d = r.json()
            return d.get("estado_abrev", d.get("state", {}).get("abreviatura", "?"))
    except:
        pass
    return "?"


def main():
    print("=" * 70)
    print("TEST DE FLUJO COMPLETO DE OT")
    print("=" * 70)
    print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

    admin_token = login(USUARIOS["admin"])
    if not admin_token:
        print("❌ No se pudo hacer login como admin")
        return

    resultados = {"exitosas": 0, "fallidas": 0, "detalles": []}

    # =============================================
    # PRUEBA 1: FLUJO NORMAL COMPLETO
    # =============================================
    print("\n" + "=" * 50)
    print("PRUEBA 1: FLUJO NORMAL (PV→PDE→PDG→PP→PC→T)")
    print("=" * 50)

    ot_id = crear_ot(admin_token, f"FLUJO-{datetime.now().strftime('%H%M%S')}")
    if not ot_id:
        print("❌ No se pudo crear OT para prueba")
        return

    print(f"✅ OT {ot_id} creada en estado PV")

    flujo = [
        (2, "jefe_desarrollo", "PV → PDE"),
        (5, "jefe_diseno", "PDE → PDG"),
        (6, "jefe_precatalog", "PDG → PP"),
        (7, "jefe_catalogador", "PP → PC"),
        (8, "admin", "PC → Terminada"),
    ]

    for estado, usuario, desc in flujo:
        token = login(USUARIOS[usuario])
        if token:
            r = transicion(token, ot_id, estado, desc)
            if r["ok"]:
                print(f"  ✅ {desc} por {usuario}")
                resultados["exitosas"] += 1
            else:
                print(f"  ❌ {desc} FALLÓ: {r['msg'][:40]}")
                resultados["fallidas"] += 1
            resultados["detalles"].append({"prueba": "flujo_normal", "ot": ot_id, "transicion": desc, "ok": r["ok"]})
        time.sleep(0.2)

    estado_final = get_ot_estado(admin_token, ot_id)
    print(f"  📍 Estado final OT {ot_id}: {estado_final}")

    # =============================================
    # PRUEBA 2: RECHAZOS DESDE CADA ESTADO
    # =============================================
    print("\n" + "=" * 50)
    print("PRUEBA 2: RECHAZOS DESDE DIFERENTES ESTADOS")
    print("=" * 50)

    rechazos = [
        (1, "vendedor", "Rechazo desde PV"),
        (2, "ingeniero", "Rechazo desde PDE"),
        (5, "disenador", "Rechazo desde PDG"),
    ]

    for estado_origen, usuario_rechaza, desc in rechazos:
        # Crear OT y llevarla al estado origen
        ot_id = crear_ot(admin_token, f"RECHAZO-{estado_origen}-{datetime.now().strftime('%H%M%S')}")
        if not ot_id:
            continue

        # Si el estado origen no es 1, hacer las transiciones necesarias
        if estado_origen > 1:
            camino = {2: [2], 5: [2, 5]}
            for e in camino.get(estado_origen, []):
                transicion(admin_token, ot_id, e)
                time.sleep(0.1)

        # Ahora rechazar
        token = login(USUARIOS[usuario_rechaza])
        r = transicion(token, ot_id, 12, f"RECHAZO: {desc}")

        if r["ok"]:
            print(f"  ✅ OT {ot_id}: {desc} por {usuario_rechaza}")
            resultados["exitosas"] += 1
        else:
            print(f"  ❌ OT {ot_id}: {desc} FALLÓ: {r['msg'][:40]}")
            resultados["fallidas"] += 1

        resultados["detalles"].append({"prueba": "rechazo", "ot": ot_id, "desde": estado_origen, "ok": r["ok"]})

    # =============================================
    # PRUEBA 3: ESTADOS ESPECIALES
    # =============================================
    print("\n" + "=" * 50)
    print("PRUEBA 3: ESTADOS ESPECIALES")
    print("=" * 50)

    especiales = [
        (10, "Consulta Cliente"),
        (11, "Anulada"),
        (9, "Perdida"),
    ]

    for estado, nombre in especiales:
        ot_id = crear_ot(admin_token, f"ESPECIAL-{estado}-{datetime.now().strftime('%H%M%S')}")
        if not ot_id:
            continue

        r = transicion(admin_token, ot_id, estado, f"Prueba estado {nombre}")

        if r["ok"]:
            print(f"  ✅ OT {ot_id}: PV → {nombre}")
            resultados["exitosas"] += 1
        else:
            print(f"  ❌ OT {ot_id}: PV → {nombre} FALLÓ: {r['msg'][:40]}")
            resultados["fallidas"] += 1

        resultados["detalles"].append({"prueba": "especial", "ot": ot_id, "estado": nombre, "ok": r["ok"]})

    # =============================================
    # PRUEBA 4: TRANSICIONES POR ROL
    # =============================================
    print("\n" + "=" * 50)
    print("PRUEBA 4: TRANSICIONES POR CADA ROL")
    print("=" * 50)

    roles_prueba = [
        ("vendedor", 1, 2, "Vendedor: PV → PDE"),
        ("ingeniero", 2, 5, "Ingeniero: PDE → PDG"),
        ("disenador", 5, 6, "Diseñador: PDG → PP"),
        ("precatalogador", 6, 7, "Precatalogador: PP → PC"),
        ("catalogador", 7, 8, "Catalogador: PC → Terminada"),
    ]

    for usuario, estado_desde, estado_hasta, desc in roles_prueba:
        ot_id = crear_ot(admin_token, f"ROL-{usuario[:5]}-{datetime.now().strftime('%H%M%S')}")
        if not ot_id:
            continue

        # Llevar OT al estado origen
        if estado_desde > 1:
            camino = {2: [2], 5: [2, 5], 6: [2, 5, 6], 7: [2, 5, 6, 7]}
            for e in camino.get(estado_desde, []):
                transicion(admin_token, ot_id, e)
                time.sleep(0.1)

        # Transición con el usuario específico
        token = login(USUARIOS[usuario])
        r = transicion(token, ot_id, estado_hasta, desc)

        if r["ok"]:
            print(f"  ✅ OT {ot_id}: {desc}")
            resultados["exitosas"] += 1
        else:
            print(f"  ❌ OT {ot_id}: {desc} FALLÓ: {r['msg'][:40]}")
            resultados["fallidas"] += 1

        resultados["detalles"].append({"prueba": "rol", "usuario": usuario, "ot": ot_id, "ok": r["ok"]})

    # =============================================
    # RESUMEN FINAL
    # =============================================
    print("\n" + "=" * 70)
    print("RESUMEN DE RESULTADOS")
    print("=" * 70)
    print(f"\n✅ Transiciones exitosas: {resultados['exitosas']}")
    print(f"❌ Transiciones fallidas: {resultados['fallidas']}")
    print(f"📊 Total pruebas: {resultados['exitosas'] + resultados['fallidas']}")

    tasa = resultados['exitosas'] / (resultados['exitosas'] + resultados['fallidas']) * 100 if resultados['exitosas'] + resultados['fallidas'] > 0 else 0
    print(f"📈 Tasa de éxito: {tasa:.1f}%")

    # Guardar resultados
    with open("/Users/danielallanorecabal/inveb/RESULTADOS_FLUJO_COMPLETO.json", "w") as f:
        json.dump({"fecha": datetime.now().isoformat(), **resultados}, f, indent=2)

    print("\n📄 Resultados guardados en: RESULTADOS_FLUJO_COMPLETO.json")


if __name__ == "__main__":
    main()
