#!/usr/bin/env python3
"""
Test de Transiciones de Estado de OT
Fecha: 2026-02-25

Prueba las transiciones de estado con diferentes usuarios y roles.
Incluye pruebas de rechazos.

Estados del sistema:
- 1: Proceso de Ventas (PV)
- 2: Proceso de Diseño Estructural (PDE)
- 3: Laboratorio (L)
- 4: Muestra (M)
- 5: Proceso de Diseño Gráfico (PDG)
- 6: Proceso de Cálculo Paletizado (PP)
- 7: Proceso de Catalogación (PC)
- 8: Terminada (T)
- 9: Perdida (P)
- 10: Consulta Cliente (CC)
- 11: Anulada (A)
- 12: Rechazada (R)
- 13: Entregado (E)
- 17: Sala de Muestras (SM)
- 18: Muestras Listas (ML)
"""

import requests
import json
from datetime import datetime
from typing import Optional, List, Dict

BASE_URL = "http://localhost:8001/api/v1"
PASSWORD = "test123"

# Estados del sistema
ESTADOS = {
    1: "Proceso de Ventas (PV)",
    2: "Proceso de Diseño Estructural (PDE)",
    3: "Laboratorio (L)",
    4: "Muestra (M)",
    5: "Proceso de Diseño Gráfico (PDG)",
    6: "Proceso de Cálculo Paletizado (PP)",
    7: "Proceso de Catalogación (PC)",
    8: "Terminada (T)",
    9: "Perdida (P)",
    10: "Consulta Cliente (CC)",
    11: "Anulada (A)",
    12: "Rechazada (R)",
    13: "Entregado (E)",
    17: "Sala de Muestras (SM)",
    18: "Muestras Listas (ML)",
}

# Mapeo de abreviatura a ID
ESTADO_ABREV_TO_ID = {
    "PV": 1,
    "PDE": 2,
    "L": 3,
    "M": 4,
    "PDG": 5,
    "PP": 6,
    "PC": 7,
    "T": 8,
    "P": 9,
    "CC": 10,
    "A": 11,
    "R": 12,
    "E": 13,
    "SM": 17,
    "ML": 18,
}


def get_state_id(ot: Dict) -> int:
    """Obtiene el state_id de una OT, ya sea directo o por abreviatura"""
    if "state_id" in ot:
        return ot["state_id"]
    if "current_state_id" in ot:
        return ot["current_state_id"]
    if "estado_abrev" in ot:
        return ESTADO_ABREV_TO_ID.get(ot["estado_abrev"], 0)
    return 0

# Flujo normal de estados
FLUJO_NORMAL = [1, 2, 5, 6, 7, 8]  # PV → PDE → PDG → PP → PC → Terminada

# Usuarios de prueba por área
USUARIOS = {
    "admin": {"rut": "22222222-2", "rol": "Admin", "rol_id": 1},
    "gerente": {"rut": "33333333-3", "rol": "Gerente", "rol_id": 2},
    "jefe_ventas": {"rut": "23748870-9", "rol": "JefeVentas", "rol_id": 3},
    "vendedor": {"rut": "11334692-2", "rol": "Vendedor", "rol_id": 4},
    "jefe_desarrollo": {"rut": "20649380-1", "rol": "JefeDesarrollo", "rol_id": 5},
    "ingeniero": {"rut": "8106237-4", "rol": "Ingeniero", "rol_id": 6},
    "jefe_diseno": {"rut": "16193907-2", "rol": "JefeDiseño", "rol_id": 7},
    "disenador": {"rut": "9719795-4", "rol": "Diseñador", "rol_id": 8},
    "jefe_precatalog": {"rut": "24727035-3", "rol": "JefePrecatalog", "rol_id": 9},
    "precatalogador": {"rut": "10554084-1", "rol": "Precatalogador", "rol_id": 10},
    "jefe_catalogador": {"rut": "6334369-2", "rol": "JefeCatalogador", "rol_id": 11},
    "catalogador": {"rut": "5068443-1", "rol": "Catalogador", "rol_id": 12},
}


def login(rut: str) -> Optional[str]:
    """Login y retorna token JWT"""
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"rut": rut, "password": PASSWORD},
            headers={"Content-Type": "application/json"}
        )
        if response.status_code == 200:
            return response.json().get("access_token")
        return None
    except Exception as e:
        print(f"Error login: {e}")
        return None


def get_ots_prueba(token: str) -> List[Dict]:
    """Obtiene las OTs de prueba (las que tienen 'Test OT' en descripcion)"""
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.get(
            f"{BASE_URL}/work-orders/?limit=200",
            headers=headers
        )
        if response.status_code == 200:
            data = response.json()
            items = data.get("items", data) if isinstance(data, dict) else data
            # Filtrar solo las de prueba (tienen "Test OT" en descripcion)
            prueba = [ot for ot in items if "Test OT" in str(ot.get("descripcion", ""))]
            return prueba
        return []
    except Exception as e:
        print(f"Error obteniendo OTs: {e}")
        return []


def get_ot_detail(token: str, ot_id: int) -> Optional[Dict]:
    """Obtiene el detalle de una OT"""
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.get(
            f"{BASE_URL}/work-orders/{ot_id}",
            headers=headers
        )
        if response.status_code == 200:
            return response.json()
        return None
    except Exception as e:
        return None


# Mapeo de estados a áreas
ESTADO_TO_AREA = {
    1: 1,   # PV → Ventas
    2: 2,   # PDE → Desarrollo
    3: 2,   # Laboratorio → Desarrollo
    4: 2,   # Muestra → Desarrollo
    5: 3,   # PDG → Diseño
    6: 5,   # PP → Precatalogación (área 5 según BD)
    7: 4,   # PC → Catalogación (área 4 según BD)
    8: 4,   # Terminada → Catalogación
    9: 1,   # Perdida → Ventas
    10: 1,  # Consulta Cliente → Ventas
    11: 1,  # Anulada → Ventas
    12: 1,  # Rechazada → Ventas
    13: 2,  # Entregado → Desarrollo
    17: 6,  # Sala Muestras → Muestras
    18: 6,  # Muestras Listas → Muestras
}


def cambiar_estado(token: str, ot_id: int, nuevo_estado: int, observacion: str = "") -> Dict:
    """Cambia el estado de una OT"""
    headers = {"Authorization": f"Bearer {token}"}

    # Determinar el área destino según el estado
    area_destino = ESTADO_TO_AREA.get(nuevo_estado, 1)

    data = {
        "management_type_id": 1,  # 1 = Cambio de Estado
        "state_id": nuevo_estado,
        "work_space_id": area_destino,
        "observation": observacion or f"Transición automática a estado {nuevo_estado}"
    }

    try:
        response = requests.post(
            f"{BASE_URL}/work-orders/{ot_id}/transition",
            json=data,
            headers=headers
        )
        return {
            "success": response.status_code in [200, 201],
            "status_code": response.status_code,
            "detail": response.json().get("detail", "OK") if response.status_code != 200 else "OK",
            "response": response.json() if response.status_code == 200 else None
        }
    except Exception as e:
        return {"success": False, "status_code": 500, "detail": str(e)}


def rechazar_ot(token: str, ot_id: int, motivo: str = "Rechazo de prueba") -> Dict:
    """Rechaza una OT (envía a estado 12)"""
    return cambiar_estado(token, ot_id, 12, f"RECHAZO: {motivo}")


def main():
    print("=" * 80)
    print("TEST DE TRANSICIONES DE ESTADO DE OT")
    print("=" * 80)
    print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    # Login como admin para obtener OTs de prueba
    admin_token = login(USUARIOS["admin"]["rut"])
    if not admin_token:
        print("❌ No se pudo hacer login como admin")
        return

    print("✅ Login como Admin exitoso")

    # Obtener OTs de prueba
    ots_prueba = get_ots_prueba(admin_token)
    print(f"\n📋 OTs de prueba encontradas: {len(ots_prueba)}")

    if not ots_prueba:
        print("❌ No hay OTs de prueba para testear")
        return

    # Mostrar OTs disponibles
    print("\nOTs disponibles para prueba:")
    for ot in ots_prueba[:10]:  # Mostrar primeras 10
        estado_actual = get_state_id(ot)
        estado_abrev = ot.get("estado_abrev", "?")
        print(f"  OT {ot['id']}: {ot.get('descripcion', '?')[:20]} - Estado: {estado_abrev} ({estado_actual})")

    resultados = []

    # =========================================
    # PRUEBA 1: Flujo Normal Completo
    # =========================================
    print("\n" + "=" * 60)
    print("PRUEBA 1: FLUJO NORMAL COMPLETO (PV → PDE → PDG → PP → PC → T)")
    print("=" * 60)

    # Seleccionar una OT en estado PV (1)
    ots_pv = [ot for ot in ots_prueba if get_state_id(ot) == 1]

    if ots_pv:
        ot_flujo = ots_pv[0]
        ot_id = ot_flujo["id"]
        print(f"\n📌 Usando OT {ot_id} para flujo normal")

        # Flujo: PV(1) → PDE(2) → PDG(5) → PP(6) → PC(7) → T(8)
        transiciones = [
            (2, "jefe_desarrollo", "Pasando a Desarrollo"),
            (5, "jefe_diseno", "Pasando a Diseño Gráfico"),
            (6, "jefe_precatalog", "Pasando a Precatalogación"),
            (7, "jefe_catalogador", "Pasando a Catalogación"),
            (8, "admin", "Terminando OT"),
        ]

        for nuevo_estado, usuario_key, descripcion in transiciones:
            usuario = USUARIOS[usuario_key]
            token = login(usuario["rut"])

            if not token:
                print(f"  ❌ No se pudo hacer login como {usuario['rol']}")
                continue

            resultado = cambiar_estado(token, ot_id, nuevo_estado, descripcion)
            estado_nombre = ESTADOS.get(nuevo_estado, f"Estado {nuevo_estado}")

            if resultado["success"]:
                print(f"  ✅ {usuario['rol']}: {ESTADOS.get(nuevo_estado-1 if nuevo_estado > 1 else 1, '?')} → {estado_nombre}")
            else:
                print(f"  ❌ {usuario['rol']}: Falló transición a {estado_nombre} - {resultado['detail'][:50]}")

            resultados.append({
                "prueba": "flujo_normal",
                "ot_id": ot_id,
                "usuario": usuario["rol"],
                "de_estado": nuevo_estado - 1 if nuevo_estado > 1 else 1,
                "a_estado": nuevo_estado,
                "success": resultado["success"],
                "detail": resultado["detail"]
            })
    else:
        print("  ⚠️ No hay OTs en estado PV para probar flujo normal")

    # =========================================
    # PRUEBA 2: Rechazos desde diferentes estados
    # =========================================
    print("\n" + "=" * 60)
    print("PRUEBA 2: RECHAZOS DESDE DIFERENTES ESTADOS")
    print("=" * 60)

    # Buscar OTs en diferentes estados para probar rechazos
    estados_a_rechazar = [1, 2, 5]  # PV, PDE, PDG

    for estado_origen in estados_a_rechazar:
        ots_estado = [ot for ot in ots_prueba
                      if get_state_id(ot) == estado_origen]

        if ots_estado:
            ot = ots_estado[0]
            ot_id = ot["id"]
            estado_nombre = ESTADOS.get(estado_origen, f"Estado {estado_origen}")

            # Determinar qué usuario puede rechazar según el estado
            if estado_origen == 1:
                usuario_key = "jefe_ventas"
            elif estado_origen == 2:
                usuario_key = "jefe_desarrollo"
            else:
                usuario_key = "jefe_diseno"

            usuario = USUARIOS[usuario_key]
            token = login(usuario["rut"])

            if token:
                resultado = rechazar_ot(token, ot_id, f"Rechazo desde {estado_nombre}")

                if resultado["success"]:
                    print(f"  ✅ OT {ot_id}: {estado_nombre} → Rechazada por {usuario['rol']}")
                else:
                    print(f"  ❌ OT {ot_id}: Falló rechazo desde {estado_nombre} - {resultado['detail'][:50]}")

                resultados.append({
                    "prueba": "rechazo",
                    "ot_id": ot_id,
                    "usuario": usuario["rol"],
                    "de_estado": estado_origen,
                    "a_estado": 12,
                    "success": resultado["success"],
                    "detail": resultado["detail"]
                })
        else:
            print(f"  ⚠️ No hay OTs en estado {ESTADOS.get(estado_origen, estado_origen)} para rechazar")

    # =========================================
    # PRUEBA 3: Transiciones por cada rol
    # =========================================
    print("\n" + "=" * 60)
    print("PRUEBA 3: TRANSICIONES POR CADA ROL")
    print("=" * 60)

    # Probar que cada rol puede hacer transiciones en su área
    pruebas_rol = [
        ("vendedor", 1, 2, "Vendedor pasa de PV a PDE"),
        ("ingeniero", 2, 5, "Ingeniero pasa de PDE a PDG"),
        ("disenador", 5, 6, "Diseñador pasa de PDG a PP"),
        ("precatalogador", 6, 7, "Precatalogador pasa de PP a PC"),
        ("catalogador", 7, 8, "Catalogador pasa de PC a Terminada"),
    ]

    for usuario_key, estado_origen, estado_destino, descripcion in pruebas_rol:
        # Buscar OT en estado origen
        ots_estado = [ot for ot in ots_prueba
                      if get_state_id(ot) == estado_origen]

        if ots_estado:
            ot = ots_estado[0]
            ot_id = ot["id"]
            usuario = USUARIOS[usuario_key]
            token = login(usuario["rut"])

            if token:
                resultado = cambiar_estado(token, ot_id, estado_destino, descripcion)

                if resultado["success"]:
                    print(f"  ✅ {usuario['rol']}: OT {ot_id} - {ESTADOS.get(estado_origen)} → {ESTADOS.get(estado_destino)}")
                else:
                    print(f"  ❌ {usuario['rol']}: OT {ot_id} - Falló - {resultado['detail'][:60]}")

                resultados.append({
                    "prueba": "transicion_rol",
                    "ot_id": ot_id,
                    "usuario": usuario["rol"],
                    "de_estado": estado_origen,
                    "a_estado": estado_destino,
                    "success": resultado["success"],
                    "detail": resultado["detail"]
                })
            else:
                print(f"  ❌ {usuario['rol']}: No se pudo hacer login")
        else:
            print(f"  ⚠️ No hay OTs en estado {ESTADOS.get(estado_origen)} para {USUARIOS[usuario_key]['rol']}")

    # =========================================
    # PRUEBA 4: Estados especiales
    # =========================================
    print("\n" + "=" * 60)
    print("PRUEBA 4: ESTADOS ESPECIALES")
    print("=" * 60)

    # Probar estados especiales como Consulta Cliente, Anulada, etc.
    estados_especiales = [
        (10, "Consulta Cliente"),
        (11, "Anulada"),
        (9, "Perdida"),
    ]

    ots_disponibles = [ot for ot in ots_prueba
                       if get_state_id(ot) == 1]

    for estado_id, estado_nombre in estados_especiales:
        if ots_disponibles:
            ot = ots_disponibles.pop(0)
            ot_id = ot["id"]

            resultado = cambiar_estado(admin_token, ot_id, estado_id, f"Pasando a {estado_nombre}")

            if resultado["success"]:
                print(f"  ✅ OT {ot_id}: PV → {estado_nombre}")
            else:
                print(f"  ❌ OT {ot_id}: Falló transición a {estado_nombre} - {resultado['detail'][:50]}")

            resultados.append({
                "prueba": "estado_especial",
                "ot_id": ot_id,
                "usuario": "Admin",
                "de_estado": 1,
                "a_estado": estado_id,
                "success": resultado["success"],
                "detail": resultado["detail"]
            })
        else:
            print(f"  ⚠️ No hay OTs disponibles para probar {estado_nombre}")

    # =========================================
    # RESUMEN
    # =========================================
    print("\n" + "=" * 80)
    print("RESUMEN DE RESULTADOS")
    print("=" * 80)

    exitosas = [r for r in resultados if r["success"]]
    fallidas = [r for r in resultados if not r["success"]]

    print(f"\n✅ Transiciones exitosas: {len(exitosas)}")
    print(f"❌ Transiciones fallidas: {len(fallidas)}")

    if fallidas:
        print("\n⚠️ Detalle de fallos:")
        for r in fallidas:
            print(f"  - {r['prueba']}: OT {r['ot_id']} ({r['usuario']}) - {r['detail'][:60]}")

    # Guardar resultados
    with open("/Users/danielallanorecabal/inveb/RESULTADOS_TEST_TRANSICIONES.json", "w") as f:
        json.dump({
            "fecha": datetime.now().isoformat(),
            "total_pruebas": len(resultados),
            "exitosas": len(exitosas),
            "fallidas": len(fallidas),
            "resultados": resultados
        }, f, indent=2, ensure_ascii=False)

    print("\n📄 Resultados guardados en: RESULTADOS_TEST_TRANSICIONES.json")

    # =========================================
    # VERIFICACIÓN FINAL: Estado de OTs de prueba
    # =========================================
    print("\n" + "=" * 60)
    print("ESTADO FINAL DE OTs DE PRUEBA")
    print("=" * 60)

    ots_final = get_ots_prueba(admin_token)

    # Contar por estado
    conteo_estados = {}
    for ot in ots_final:
        estado = ot.get("state_id", ot.get("current_state_id", "?"))
        estado_nombre = ESTADOS.get(estado, f"Estado {estado}")
        conteo_estados[estado_nombre] = conteo_estados.get(estado_nombre, 0) + 1

    print("\nDistribución por estado:")
    for estado, cantidad in sorted(conteo_estados.items(), key=lambda x: -x[1]):
        print(f"  {estado}: {cantidad}")


if __name__ == "__main__":
    main()
