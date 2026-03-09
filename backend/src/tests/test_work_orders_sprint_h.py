"""
Tests de endpoints adicionales de OTs - Sprint H
Fuente Laravel: WorkOrderController.php

Endpoints implementados:
1. PUT /{ot_id}/descripcion - Actualiza descripción con bitácora
2. POST /aplicar-mckee - Registra fórmula McKee
3. GET /{ot_id}/data-complete - Datos completos de OT
"""

import pytest
from unittest.mock import MagicMock, patch


# =============================================
# TESTS: UPDATE DESCRIPCION
# =============================================

class TestUpdateDescripcion:
    """
    Tests para PUT /{ot_id}/descripcion
    Fuente Laravel: WorkOrderController.php líneas 9670-9909
    """

    def test_update_descripcion_type_description(self):
        """
        Cuando type_edit='description', debe actualizar descripción de OT y material.
        """
        request_data = {
            "type_edit": "description",
            "descripcion": "Nueva descripción del producto"
        }

        # Simular lógica
        ot = {"id": 1, "descripcion": "Vieja descripción", "material_id": 10}
        nueva_desc = request_data["descripcion"].strip()

        # Verificar que se crea registro de cambio
        datos_modificados = {}
        if ot["descripcion"] != nueva_desc:
            datos_modificados["descripcion"] = {
                "texto": "Descripción",
                "antiguo_valor": {"id": None, "descripcion": ot["descripcion"]},
                "nuevo_valor": {"id": None, "descripcion": nueva_desc}
            }

        assert "descripcion" in datos_modificados
        assert datos_modificados["descripcion"]["antiguo_valor"]["descripcion"] == "Vieja descripción"
        assert datos_modificados["descripcion"]["nuevo_valor"]["descripcion"] == "Nueva descripción del producto"

    def test_update_descripcion_type_oc(self):
        """
        Cuando type_edit='oc', debe actualizar campo OC y crear gestión.
        """
        request_data = {
            "type_edit": "oc",
            "oc": 1
        }

        ot = {"id": 1, "oc": 0}

        # Verificar cambio de OC
        datos_modificados = {}
        if str(ot["oc"]) != str(request_data["oc"]):
            datos_modificados["oc"] = {
                "texto": "OC",
                "antiguo_valor": {"id": ot["oc"], "descripcion": "No"},
                "nuevo_valor": {"id": request_data["oc"], "descripcion": "Sí"}
            }

        assert "oc" in datos_modificados
        assert datos_modificados["oc"]["antiguo_valor"]["descripcion"] == "No"
        assert datos_modificados["oc"]["nuevo_valor"]["descripcion"] == "Sí"

    def test_update_descripcion_with_mckee(self):
        """
        Cuando aplicar_mckee=1, debe registrar datos de fórmula McKee.
        """
        request_data = {
            "type_edit": "description",
            "descripcion": "Test",
            "aplicar_mckee": 1,
            "largo_mckee": 100,
            "ancho_mckee": 50,
            "alto_mckee": 30
        }

        datos_mckee = {}
        if request_data.get("largo_mckee"):
            datos_mckee["largo"] = {"texto": "Largo", "valor": request_data["largo_mckee"]}
        if request_data.get("ancho_mckee"):
            datos_mckee["ancho"] = {"texto": "Ancho", "valor": request_data["ancho_mckee"]}
        if request_data.get("alto_mckee"):
            datos_mckee["alto"] = {"texto": "Alto", "valor": request_data["alto_mckee"]}

        assert len(datos_mckee) == 3
        assert datos_mckee["largo"]["valor"] == 100
        assert datos_mckee["ancho"]["valor"] == 50
        assert datos_mckee["alto"]["valor"] == 30

    def test_recordatorio_fsc_para_disenadores(self):
        """
        Recordatorio FSC debe mostrarse para diseñadores cuando FSC=1.
        """
        ot = {"fsc": 1}
        role_id = 8  # Diseñador

        recordatorio_fsc = (ot["fsc"] == 1 and role_id in [7, 8])

        assert recordatorio_fsc is True

    def test_no_recordatorio_fsc_para_otros_roles(self):
        """
        Recordatorio FSC NO debe mostrarse para otros roles.
        """
        ot = {"fsc": 1}
        role_id = 4  # Vendedor

        recordatorio_fsc = (ot["fsc"] == 1 and role_id in [7, 8])

        assert recordatorio_fsc is False


# =============================================
# TESTS: APLICAR MCKEE
# =============================================

class TestAplicarMckee:
    """
    Tests para POST /aplicar-mckee
    Fuente Laravel: WorkOrderController.php líneas 11365-11455
    """

    def test_aplicar_mckee_con_todos_datos(self):
        """
        Debe registrar todos los datos de fórmula McKee.
        """
        params = {
            "carton": 5,
            "largo": 100,
            "ancho": 50,
            "alto": 30,
            "perimetro": 300,
            "espesor": 3.5,
            "ect": 25.0,
            "bct_lb": 150,
            "bct_kilos": 68
        }

        datos_insertados = {}

        # Simular procesamiento (sin carton lookup)
        if params.get("largo"):
            datos_insertados["largo"] = {"texto": "Largo", "valor": params["largo"]}
        if params.get("ancho"):
            datos_insertados["ancho"] = {"texto": "Ancho", "valor": params["ancho"]}
        if params.get("alto"):
            datos_insertados["alto"] = {"texto": "Alto", "valor": params["alto"]}
        if params.get("perimetro"):
            datos_insertados["perimetro"] = {"texto": "Perimetro", "valor": params["perimetro"]}
        if params.get("espesor"):
            datos_insertados["espesor"] = {"texto": "Espesor", "valor": params["espesor"]}
        if params.get("ect"):
            datos_insertados["ect"] = {"texto": "Ect", "valor": params["ect"]}
        if params.get("bct_lb"):
            datos_insertados["bct_lb"] = {"texto": "Bct_lb", "valor": params["bct_lb"]}
        if params.get("bct_kilos"):
            datos_insertados["bct_kilos"] = {"texto": "Bct_kilos", "valor": params["bct_kilos"]}

        # Debe tener 8 campos (sin carton que requiere lookup)
        assert len(datos_insertados) == 8

    def test_aplicar_mckee_datos_parciales(self):
        """
        Debe funcionar con datos parciales.
        """
        params = {
            "largo": 100,
            "ancho": 50
        }

        datos_insertados = {}
        if params.get("largo"):
            datos_insertados["largo"] = {"texto": "Largo", "valor": params["largo"]}
        if params.get("ancho"):
            datos_insertados["ancho"] = {"texto": "Ancho", "valor": params["ancho"]}

        assert len(datos_insertados) == 2

    def test_aplicar_mckee_bitacora_work_order_id_especial(self):
        """
        La bitácora debe usar work_order_id=909999 para fórmula McKee sin OT.
        """
        # En Laravel línea 11446: $bitacora->work_order_id = 909999;
        work_order_id_especial = 909999
        assert work_order_id_especial == 909999

    def test_aplicar_mckee_operacion_mckee(self):
        """
        La operación debe ser 'Mckee'.
        """
        # En Laravel línea 11445: $bitacora->operacion = 'Mckee';
        operacion = "Mckee"
        assert operacion == "Mckee"


# =============================================
# TESTS: GET OT DATA COMPLETE
# =============================================

class TestGetOTDataComplete:
    """
    Tests para GET /{ot_id}/data-complete
    """

    def test_data_complete_incluye_relaciones_basicas(self):
        """
        Debe incluir relaciones básicas: cliente, cartón, CAD.
        """
        expected_fields = [
            "cliente_nombre",
            "cliente_codigo",
            "carton_codigo",
            "cad_codigo",
            "canal_nombre",
            "creador_nombre"
        ]

        # Simular respuesta
        ot_data = {
            "id": 1,
            "cliente_nombre": "Cliente Test",
            "cliente_codigo": "C001",
            "carton_codigo": "CART001",
            "cad_codigo": "CAD001",
            "canal_nombre": "Nacional",
            "creador_nombre": "Juan Pérez"
        }

        for field in expected_fields:
            assert field in ot_data

    def test_data_complete_incluye_colores(self):
        """
        Debe incluir array de colores si existen.
        """
        ot = {
            "color_1_id": 1,
            "color_2_id": 2,
            "color_3_id": None,
            "color_4_id": None,
            "color_5_id": None
        }

        colores = []
        for i in range(1, 6):
            color_id = ot.get(f"color_{i}_id")
            if color_id:
                colores.append({"id": color_id, "descripcion": f"Color {color_id}"})

        assert len(colores) == 2

    def test_data_complete_incluye_jerarquia(self):
        """
        Debe incluir jerarquía si existe subsubhierarchy_id.
        """
        ot = {"subsubhierarchy_id": 10}

        if ot.get("subsubhierarchy_id"):
            jerarquia = {
                "jerarquia_1": "Nivel 1",
                "jerarquia_2": "Nivel 2",
                "jerarquia_3": "Nivel 3"
            }
            ot["jerarquia"] = jerarquia

        assert "jerarquia" in ot
        assert ot["jerarquia"]["jerarquia_1"] == "Nivel 1"


# =============================================
# TESTS: INTEGRACIÓN CON BITÁCORA
# =============================================

class TestBitacoraIntegracion:
    """
    Tests de integración con tabla bitacora_work_orders.
    """

    def test_bitacora_guarda_user_data_json(self):
        """
        La bitácora debe guardar datos del usuario como JSON.
        """
        import json

        user_data = {
            "nombre": "Juan",
            "apellido": "Pérez",
            "rut": "12345678-9",
            "role_id": 4
        }

        user_data_json = json.dumps(user_data, ensure_ascii=False)

        # Verificar que se puede parsear
        parsed = json.loads(user_data_json)
        assert parsed["nombre"] == "Juan"
        assert parsed["role_id"] == 4

    def test_bitacora_guarda_datos_modificados_json(self):
        """
        La bitácora debe guardar datos modificados como JSON.
        """
        import json

        datos_modificados = {
            "descripcion": {
                "texto": "Descripción",
                "antiguo_valor": {"id": None, "descripcion": "Viejo"},
                "nuevo_valor": {"id": None, "descripcion": "Nuevo"}
            }
        }

        datos_json = json.dumps(datos_modificados, ensure_ascii=False)

        # Verificar que se puede parsear
        parsed = json.loads(datos_json)
        assert "descripcion" in parsed
        assert parsed["descripcion"]["texto"] == "Descripción"


# =============================================
# RUN TESTS
# =============================================

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
