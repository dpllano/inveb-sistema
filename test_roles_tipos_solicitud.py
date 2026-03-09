#!/usr/bin/env python3
"""
Test de creación de OT por Rol y Tipo de Solicitud
Fecha: 2026-02-23

Este script prueba cada combinación de rol + tipo_solicitud para verificar
que las restricciones de creación están funcionando correctamente.

Tipos de solicitud:
- 1: Desarrollo Completo
- 3: Muestra con CAD
- 5: Arte con Material
- 6: Otras Solicitudes
- 7: Proyectos Innovación

Restricciones esperadas:
- VendedorExterno (19): Solo tipos 1 y 5, solo cliente 8
- JefeDesarrollo (5) e Ingeniero (6): Solo tipos 1, 3, 6, 7 (NO el 5)
- Resto de roles con permiso de crear: Todos los tipos
"""

import requests
import json
from datetime import datetime
from typing import Optional

BASE_URL = "http://localhost:8001/api/v1"

# Usuarios de prueba (contraseña: test123)
USUARIOS = [
    {"rut": "22222222-2", "rol": "Admin", "rol_id": 1},
    {"rut": "33333333-3", "rol": "Gerente", "rol_id": 2},
    {"rut": "23748870-9", "rol": "JefeVentas", "rol_id": 3},
    {"rut": "11334692-2", "rol": "Vendedor", "rol_id": 4},
    {"rut": "20649380-1", "rol": "JefeDesarrollo", "rol_id": 5},
    {"rut": "8106237-4", "rol": "Ingeniero", "rol_id": 6},
    {"rut": "16193907-2", "rol": "JefeDiseño", "rol_id": 7},
    {"rut": "9719795-4", "rol": "Diseñador", "rol_id": 8},
    {"rut": "8827783-K", "rol": "VendedorExterno", "rol_id": 19},
]

# Tipos de solicitud a probar
TIPOS_SOLICITUD = [
    {"id": 1, "nombre": "Desarrollo Completo"},
    {"id": 3, "nombre": "Muestra con CAD"},
    {"id": 5, "nombre": "Arte con Material"},
    {"id": 6, "nombre": "Otras Solicitudes"},
    {"id": 7, "nombre": "Proyectos Innovación"},
]

PASSWORD = "test123"

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
        print(f"  Login failed ({response.status_code}): {response.text[:100]}")
        return None
    except Exception as e:
        print(f"Error login: {e}")
        return None

def crear_ot(token: str, tipo_solicitud: int, client_id: int = 1) -> dict:
    """Intenta crear una OT con el tipo de solicitud especificado"""
    headers = {"Authorization": f"Bearer {token}"}

    # Datos completos para crear una OT
    data = {
        "client_id": client_id,
        "tipo_solicitud": tipo_solicitud,
        "installation_id": 1,
        "contact_id": 1,
        "nombre_producto": f"TEST-{datetime.now().strftime('%H%M%S')}-Tipo{tipo_solicitud}",
        "nombre_material": "Material de prueba",
        "descripcion": "Test OT automatico",
        "especificacion": "Especificación de prueba",
        "proceso_id": 2,  # Flexografía
        "carton_id": 1,
        "color_id": 1,
        "estilo_id": 1,
        "cantidad_base": 1000,
        "canal_id": 1,
        "hierarchy_id": 2,
        "product_type_id": 1,
        "envase_id": 1,
        "sector_id": 1,
    }

    try:
        response = requests.post(
            f"{BASE_URL}/work-orders/",
            json=data,
            headers=headers
        )
        return {
            "status_code": response.status_code,
            "success": response.status_code == 200 or response.status_code == 201,
            "detail": response.json().get("detail", "") if response.status_code >= 400 else "OK",
            "ot_id": response.json().get("id") if response.status_code in [200, 201] else None
        }
    except Exception as e:
        return {
            "status_code": 500,
            "success": False,
            "detail": str(e),
            "ot_id": None
        }

def main():
    print("=" * 80)
    print("TEST DE CREACIÓN DE OT POR ROL Y TIPO DE SOLICITUD")
    print("=" * 80)
    print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    # Matriz de resultados
    resultados = []

    for usuario in USUARIOS:
        print(f"\n{'='*60}")
        print(f"USUARIO: {usuario['rol']} (ID {usuario['rol_id']}) - RUT: {usuario['rut']}")
        print(f"{'='*60}")

        # Login
        token = login(usuario["rut"])
        if not token:
            print(f"  ❌ ERROR: No se pudo hacer login")
            continue
        print(f"  ✅ Login exitoso")

        # Determinar cliente según rol
        # VendedorExterno solo puede usar cliente 8
        client_id = 8 if usuario["rol_id"] == 19 else 1

        for tipo in TIPOS_SOLICITUD:
            resultado = crear_ot(token, tipo["id"], client_id)

            status = "✅" if resultado["success"] else "❌"
            print(f"  {status} Tipo {tipo['id']} ({tipo['nombre']}): {resultado['detail'][:50]}")

            resultados.append({
                "rol": usuario["rol"],
                "rol_id": usuario["rol_id"],
                "tipo_id": tipo["id"],
                "tipo_nombre": tipo["nombre"],
                "success": resultado["success"],
                "detail": resultado["detail"],
                "ot_id": resultado["ot_id"]
            })

    # Resumen final
    print("\n")
    print("=" * 80)
    print("RESUMEN DE RESULTADOS")
    print("=" * 80)

    # Tabla de resumen
    print("\n{:<20} | {:^3} | {:^3} | {:^3} | {:^3} | {:^3} |".format(
        "ROL", "T1", "T3", "T5", "T6", "T7"
    ))
    print("-" * 60)

    for usuario in USUARIOS:
        fila = [usuario["rol"]]
        for tipo in TIPOS_SOLICITUD:
            # Buscar resultado
            res = next(
                (r for r in resultados
                 if r["rol_id"] == usuario["rol_id"] and r["tipo_id"] == tipo["id"]),
                None
            )
            if res:
                fila.append("✅" if res["success"] else "❌")
            else:
                fila.append("?")

        print("{:<20} | {:^3} | {:^3} | {:^3} | {:^3} | {:^3} |".format(*fila))

    # Verificar restricciones esperadas
    print("\n")
    print("=" * 80)
    print("VERIFICACIÓN DE RESTRICCIONES")
    print("=" * 80)

    errores = []

    # VendedorExterno solo debería poder crear tipos 1 y 5
    for r in resultados:
        if r["rol_id"] == 19:  # VendedorExterno
            if r["tipo_id"] in [1, 5]:
                if not r["success"]:
                    errores.append(f"ERROR: VendedorExterno DEBERÍA poder crear tipo {r['tipo_id']} pero falló")
            else:
                if r["success"]:
                    errores.append(f"ERROR: VendedorExterno NO debería poder crear tipo {r['tipo_id']} pero lo creó")

    # JefeDesarrollo e Ingeniero no deberían poder crear tipo 5
    for r in resultados:
        if r["rol_id"] in [5, 6]:  # JefeDesarrollo, Ingeniero
            if r["tipo_id"] == 5:
                if r["success"]:
                    errores.append(f"ERROR: {r['rol']} NO debería poder crear tipo 5 pero lo creó")
            else:
                if not r["success"] and r["tipo_id"] != 5:
                    errores.append(f"ERROR: {r['rol']} DEBERÍA poder crear tipo {r['tipo_id']} pero falló")

    if errores:
        print("\n⚠️ ERRORES ENCONTRADOS:")
        for e in errores:
            print(f"  - {e}")
    else:
        print("\n✅ Todas las restricciones funcionan correctamente")

    # Guardar resultados en JSON
    with open("/Users/danielallanorecabal/inveb/RESULTADOS_TEST_ROLES_TIPOS.json", "w") as f:
        json.dump({
            "fecha": datetime.now().isoformat(),
            "resultados": resultados,
            "errores": errores
        }, f, indent=2, ensure_ascii=False)

    print("\n📄 Resultados guardados en: RESULTADOS_TEST_ROLES_TIPOS.json")

if __name__ == "__main__":
    main()
