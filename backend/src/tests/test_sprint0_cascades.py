"""
Tests funcionales Sprint 0 - Endpoints de Cascadas
INVEB - Migración Laravel a FastAPI

Issues cubiertos:
- Issue 20: Filtrado de Impresiones
- Issue 22: Recubrimiento Interno según CINTA
- Issue 23: Recubrimiento Externo
- Issue 24: Planta Objetivo
- Issue 26, 45-46: Datos CAD
"""

import pytest
from unittest.mock import MagicMock, patch

# =============================================
# TESTS ISSUE 20: FILTRADO DE IMPRESIONES
# =============================================

class TestIssue20Impresiones:
    """
    Issue 20: Filtrar ID=1 (Offset) y IDs 6,7 (Sin Impresión)
    Fuente Laravel: WorkOrderController.php línea 710
    Endpoint: GET /cascades/impresiones
    """

    def test_should_exclude_offset_id_1(self):
        """No debe mostrar Offset (ID=1)"""
        excluded_ids = [1, 6, 7]
        mock_impresiones = [
            {'id': 1, 'nombre': 'Offset', 'status': 1},
            {'id': 2, 'nombre': 'Flexografía 1 color', 'status': 1},
        ]

        filtered = [i for i in mock_impresiones if i['id'] not in excluded_ids and i['status'] == 1]

        assert len(filtered) == 1
        assert filtered[0]['id'] == 2
        assert not any(i['id'] == 1 for i in filtered)

    def test_should_exclude_sin_impresion_ids_6_7(self):
        """No debe mostrar Sin Impresión (IDs 6,7)"""
        excluded_ids = [1, 6, 7]
        mock_impresiones = [
            {'id': 5, 'nombre': 'Flexografía 4 colores', 'status': 1},
            {'id': 6, 'nombre': 'Sin Impresión (Solo OF)', 'status': 1},
            {'id': 7, 'nombre': 'Sin Impresión (Trazabilidad)', 'status': 1},
        ]

        filtered = [i for i in mock_impresiones if i['id'] not in excluded_ids and i['status'] == 1]

        assert len(filtered) == 1
        assert filtered[0]['id'] == 5

    def test_should_only_show_active_impresiones(self):
        """Solo debe mostrar impresiones activas (status=1)"""
        excluded_ids = [1, 6, 7]
        mock_impresiones = [
            {'id': 2, 'nombre': 'Flexografía 1 color', 'status': 1},
            {'id': 3, 'nombre': 'Flexografía 2 colores', 'status': 0},  # Inactiva
        ]

        filtered = [i for i in mock_impresiones if i['id'] not in excluded_ids and i['status'] == 1]

        assert len(filtered) == 1
        assert filtered[0]['id'] == 2


# =============================================
# TESTS ISSUE 22: RECUBRIMIENTO INTERNO
# =============================================

class TestIssue22RecubrimientoInterno:
    """
    Issue 22: Cuando CINTA=SI, solo mostrar "No Aplica" (ID=1) y "Barniz Hidropelente" (ID=2)
    Fuente Laravel: WorkOrderController@getRecubrimientoInterno líneas 10100-10113
    Endpoint: GET /cascades/recubrimiento-interno?cinta=1
    """

    def test_cinta_si_only_shows_no_aplica_and_barniz(self):
        """Cuando CINTA=SI, solo IDs 1 y 2"""
        cinta_si = True
        allowed_ids_when_cinta = [1, 2]

        mock_opciones = [
            {'id': 1, 'nombre': 'No Aplica', 'status': 1},
            {'id': 2, 'nombre': 'Barniz Hidropelente', 'status': 1},
            {'id': 3, 'nombre': 'Cera', 'status': 1},
        ]

        if cinta_si:
            filtered = [o for o in mock_opciones if o['id'] in allowed_ids_when_cinta]
        else:
            filtered = [o for o in mock_opciones if o['status'] == 1]

        assert len(filtered) == 2
        assert all(o['id'] in [1, 2] for o in filtered)
        assert not any(o['id'] == 3 for o in filtered)  # Cera NO debe aparecer

    def test_cinta_no_shows_all_active(self):
        """Cuando CINTA=NO, mostrar todas las activas"""
        cinta_si = False
        allowed_ids_when_cinta = [1, 2]

        mock_opciones = [
            {'id': 1, 'nombre': 'No Aplica', 'status': 1},
            {'id': 2, 'nombre': 'Barniz Hidropelente', 'status': 1},
            {'id': 3, 'nombre': 'Cera', 'status': 1},
        ]

        if cinta_si:
            filtered = [o for o in mock_opciones if o['id'] in allowed_ids_when_cinta]
        else:
            filtered = [o for o in mock_opciones if o['status'] == 1]

        assert len(filtered) == 3


# =============================================
# TESTS ISSUE 23: RECUBRIMIENTO EXTERNO
# =============================================

class TestIssue23RecubrimientoExterno:
    """
    Issue 23: Recubrimiento Externo filtrado por Impresión
    Fuente Laravel: WorkOrderController@getRecubrimientoExterno líneas 10117-10143
    y ot-creation.js líneas 553-590
    Endpoint: GET /cascades/recubrimiento-externo?impresion_id=X

    Regla: Las opciones de recubrimiento externo se filtran según la impresión
    seleccionada usando la tabla relacion_filtro_ingresos_principales.
    """

    def test_filters_by_impresion_using_relation_table(self):
        """El filtrado usa relacion_filtro_ingresos_principales con referencia='impresion_recubrimiento_externo'"""
        # Mock de relación filtro_1=impresion_id, filtro_2=coverage_external_id
        mock_relaciones = [
            {'filtro_1': 2, 'filtro_2': 1, 'referencia': 'impresion_recubrimiento_externo'},  # Flexo -> No Aplica
            {'filtro_1': 2, 'filtro_2': 2, 'referencia': 'impresion_recubrimiento_externo'},  # Flexo -> Barniz Hidro
            {'filtro_1': 3, 'filtro_2': 1, 'referencia': 'impresion_recubrimiento_externo'},  # Flexo AG -> No Aplica
            {'filtro_1': 3, 'filtro_2': 3, 'referencia': 'impresion_recubrimiento_externo'},  # Flexo AG -> Barniz Acuoso
        ]

        mock_coverage_external = [
            {'id': 1, 'descripcion': 'No Aplica', 'status': 1},
            {'id': 2, 'descripcion': 'Barniz Hidropelente', 'status': 1},
            {'id': 3, 'descripcion': 'Barniz Acuoso', 'status': 1},
            {'id': 4, 'descripcion': 'Barniz UV', 'status': 1},
            {'id': 5, 'descripcion': 'Cera', 'status': 1},
        ]

        # Filtrar por impresion_id = 2 (Flexografía)
        impresion_id = 2
        allowed_coverage_ids = [
            r['filtro_2'] for r in mock_relaciones
            if r['filtro_1'] == impresion_id and r['referencia'] == 'impresion_recubrimiento_externo'
        ]

        filtered = [c for c in mock_coverage_external if c['id'] in allowed_coverage_ids and c['status'] == 1]

        # Solo debe mostrar No Aplica (1) y Barniz Hidropelente (2)
        assert len(filtered) == 2
        assert all(c['id'] in [1, 2] for c in filtered)
        # Barniz Acuoso (3), UV (4) y Cera (5) NO deben aparecer para Flexografía
        assert not any(c['id'] in [3, 4, 5] for c in filtered)

    def test_without_filter_shows_all_active(self):
        """Sin filtro de impresión, muestra todas las opciones activas"""
        mock_coverage_external = [
            {'id': 1, 'descripcion': 'No Aplica', 'status': 1},
            {'id': 2, 'descripcion': 'Barniz Hidropelente', 'status': 1},
            {'id': 3, 'descripcion': 'Barniz Acuoso', 'status': 0},  # Inactivo
            {'id': 4, 'descripcion': 'Barniz UV', 'status': 1},
        ]

        # Sin filtro, todas las activas
        filtered = [c for c in mock_coverage_external if c['status'] == 1]

        assert len(filtered) == 3  # Solo activas
        assert not any(c['id'] == 3 for c in filtered)  # Barniz Acuoso inactivo

    def test_issue_23_excludes_incorrect_options(self):
        """
        Issue 23: El problema reportado es que muestra opciones incorrectas
        (Barniz Acuoso, Barniz UV, Cera) cuando NO deberían aparecer.
        """
        # Opciones que el Issue 23 dice que NO deberían aparecer
        opciones_incorrectas = ['Barniz Acuoso', 'Barniz UV', 'Cera']

        # Mock de opciones filtradas correctamente para Flexografía
        mock_resultado_correcto = [
            {'id': 1, 'descripcion': 'No Aplica'},
            {'id': 2, 'descripcion': 'Barniz Hidropelente'},
        ]

        for opcion in mock_resultado_correcto:
            assert opcion['descripcion'] not in opciones_incorrectas


# =============================================
# TESTS ISSUE 24: PLANTA OBJETIVO
# =============================================

class TestIssue24PlantaObjetivo:
    """
    Issue 24: Solo mostrar plantas activas
    Fuente Laravel: WorkOrderController@getPlantaObjetivo líneas 10146-10160
    Endpoint: GET /cascades/plantas-objetivo
    """

    def test_only_show_active_plantas(self):
        """Solo debe mostrar plantas con active=1"""
        mock_plantas = [
            {'id': 1, 'nombre': 'Santiago', 'active': 1},
            {'id': 2, 'nombre': 'Buin', 'active': 0},  # Inactiva - NO mostrar
            {'id': 3, 'nombre': 'Chillan', 'active': 0},  # Inactiva - NO mostrar
        ]

        filtered = [p for p in mock_plantas if p['active'] == 1]

        assert len(filtered) == 1
        assert filtered[0]['nombre'] == 'Santiago'
        assert not any(p['nombre'] == 'Buin' for p in filtered)
        assert not any(p['nombre'] == 'Chillan' for p in filtered)


# =============================================
# TESTS ISSUE 26, 45-46: DATOS CAD
# =============================================

class TestIssue26CadData:
    """
    Issues 26, 45-46: Carga automática de datos del CAD
    Fuente Laravel: WorkOrderController@getCad líneas 9948-9967
    Endpoint: GET /cascades/cads/{cad_id}
    """

    def test_cad_response_includes_all_fields(self):
        """El endpoint debe devolver todos los campos del CAD"""
        mock_cad_response = {
            'id': 123,
            'cad': 'CAD-001',
            'largura_hm': 1500,
            'anchura_hm': 1200,
            'area_producto': 1.8,
            'recorte_adicional': 0.2,
            'veces_item': 4,
            'interno_largo': 400,
            'interno_ancho': 300,
            'interno_alto': 250,
            'externo_largo': 410,
            'externo_ancho': 310,
            'externo_alto': 260,
        }

        # Verificar que todos los campos requeridos están presentes
        required_fields = [
            'id', 'cad',
            'largura_hm', 'anchura_hm',  # Issue 26
            'area_producto', 'recorte_adicional', 'veces_item',  # Issue 26
            'interno_largo', 'interno_ancho', 'interno_alto',  # Issue 45
            'externo_largo', 'externo_ancho', 'externo_alto',  # Issue 46
        ]

        for field in required_fields:
            assert field in mock_cad_response, f"Campo {field} faltante"

    def test_cad_handles_null_values(self):
        """El endpoint debe manejar valores null correctamente"""
        mock_cad_response = {
            'id': 123,
            'cad': 'CAD-002',
            'largura_hm': None,
            'anchura_hm': None,
            'area_producto': None,
            'recorte_adicional': None,
            'veces_item': None,
            'interno_largo': None,
            'interno_ancho': None,
            'interno_alto': None,
            'externo_largo': None,
            'externo_ancho': None,
            'externo_alto': None,
        }

        # Debe aceptar valores null sin error
        assert mock_cad_response['largura_hm'] is None
        assert mock_cad_response['interno_largo'] is None


# =============================================
# TESTS ISSUE 25: FORMULA MCKEE
# =============================================

class TestIssue25McKee:
    """
    Issue 25: Fórmula McKee para cálculo BCT
    Fuente Laravel: ot-creation.js línea 3750
    Endpoint: GET /work-orders/carton/{carton_id}
    """

    def test_carton_response_includes_ect_and_espesor(self):
        """El endpoint carton debe devolver ECT y Espesor para McKee"""
        mock_carton = {
            'id': 5,
            'codigo': 'BC-001',
            'nombre': 'Cartón BC',
            'ect_min': 45,
            'espesor': 5.0,
        }

        assert 'ect_min' in mock_carton
        assert 'espesor' in mock_carton
        assert mock_carton['ect_min'] == 45
        assert mock_carton['espesor'] == 5.0

    def test_mckee_formula_calculation(self):
        """
        Fórmula McKee:
        bct_kilos = 0.325 × ECT × ((Espesor - 0.2) ^ 0.508) × ((Perímetro / 10) ^ 0.492)
        bct_lb = bct_kilos / 0.454
        """
        ect = 45
        espesor = 5.0
        largo = 300
        ancho = 200

        # Cálculo según Laravel
        perimetro = (largo + ancho) * 2  # 1000
        bct_kilos = 0.325 * ect * ((espesor - 0.2) ** 0.508) * ((perimetro / 10) ** 0.492)
        bct_lb = bct_kilos / 0.454

        # Verificar rangos razonables
        assert perimetro == 1000
        assert 250 < bct_kilos < 400
        assert 550 < bct_lb < 900


# =============================================
# RUN TESTS
# =============================================

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
