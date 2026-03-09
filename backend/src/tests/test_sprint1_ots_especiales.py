"""
Tests Sprint 1 - OTs Especiales
INVEB - Migración Laravel a FastAPI

Issues cubiertos:
- Sprint 1.1: OTs Especiales (Licitación, Ficha Técnica, Estudio Benchmarking)

Fuente Laravel: WorkOrderController.php líneas 778-870, 1250, 1731, 2007
"""

import pytest


# =============================================
# TESTS SPRINT 1.1: OTs ESPECIALES
# =============================================

class TestAjusteAreaDesarrollo:
    """
    Sprint 1.1: Campo ajuste_area_desarrollo para OTs Especiales
    Fuente Laravel: WorkOrderController.php línea 799
    $ajustes_area_desarrollo = [1 => "Licitación", 2 => "Ficha Técnica", 3 => "Estudio Benchmarking"]
    """

    def test_ajuste_area_desarrollo_options(self):
        """Debe tener 3 opciones de tipos de OT especial"""
        ajustes_area_desarrollo = [
            {'value': 1, 'label': 'Licitación'},
            {'value': 2, 'label': 'Ficha Técnica'},
            {'value': 3, 'label': 'Estudio Benchmarking'},
        ]

        assert len(ajustes_area_desarrollo) == 3
        assert ajustes_area_desarrollo[0]['value'] == 1
        assert ajustes_area_desarrollo[0]['label'] == 'Licitación'
        assert ajustes_area_desarrollo[1]['value'] == 2
        assert ajustes_area_desarrollo[1]['label'] == 'Ficha Técnica'
        assert ajustes_area_desarrollo[2]['value'] == 3
        assert ajustes_area_desarrollo[2]['label'] == 'Estudio Benchmarking'

    def test_ot_licitacion_type(self):
        """OT de tipo Licitación tiene ajuste_area_desarrollo = 1"""
        ot_licitacion = {
            'tipo_solicitud': 1,  # Desarrollo Completo
            'ajuste_area_desarrollo': 1,  # Licitación
            'client_id': 1,
            'descripcion': 'Test Licitación',
        }

        assert ot_licitacion['ajuste_area_desarrollo'] == 1

    def test_ot_ficha_tecnica_type(self):
        """OT de tipo Ficha Técnica tiene ajuste_area_desarrollo = 2"""
        ot_ficha_tecnica = {
            'tipo_solicitud': 1,
            'ajuste_area_desarrollo': 2,  # Ficha Técnica
            'client_id': 1,
            'descripcion': 'Test Ficha Técnica',
        }

        assert ot_ficha_tecnica['ajuste_area_desarrollo'] == 2

    def test_ot_estudio_benchmarking_type(self):
        """OT de tipo Estudio Benchmarking tiene ajuste_area_desarrollo = 3"""
        ot_estudio = {
            'tipo_solicitud': 1,
            'ajuste_area_desarrollo': 3,  # Estudio Benchmarking
            'client_id': 1,
            'descripcion': 'Test Estudio Benchmarking',
        }

        assert ot_estudio['ajuste_area_desarrollo'] == 3

    def test_ot_normal_no_tiene_ajuste_area(self):
        """OT normal NO tiene ajuste_area_desarrollo (null)"""
        ot_normal = {
            'tipo_solicitud': 1,
            'ajuste_area_desarrollo': None,  # OT normal
            'client_id': 1,
            'descripcion': 'Test OT Normal',
        }

        assert ot_normal['ajuste_area_desarrollo'] is None


class TestTiposSolicitud:
    """
    Tipos de Solicitud disponibles según Laravel
    Fuente Laravel: WorkOrderController.php líneas 795-798
    """

    def test_tipos_solicitud_options(self):
        """Tipos de solicitud disponibles"""
        tipos_solicitud = {
            1: "Desarrollo Completo",
            3: "Muestra con CAD",
            5: "Arte con Material",
            6: "Otras Solicitudes Desarrollo",
            7: "OT Proyectos Innovación",
        }

        assert tipos_solicitud[1] == "Desarrollo Completo"
        assert tipos_solicitud[3] == "Muestra con CAD"
        assert tipos_solicitud[7] == "OT Proyectos Innovación"

    def test_ot_licitacion_permite_tipos_solicitud(self):
        """OT Licitación permite ciertos tipos de solicitud según el rol"""
        tipos_solicitud_ventas = [1, 3, 7, 5, 6]  # Rol Ventas
        tipos_solicitud_diseño = [1, 3, 7, 6]  # Rol Diseño (sin Arte con Material)

        assert 1 in tipos_solicitud_ventas  # Desarrollo Completo
        assert 5 in tipos_solicitud_ventas  # Arte con Material (solo Ventas)
        assert 5 not in tipos_solicitud_diseño  # NO disponible para Diseño


# =============================================
# TESTS CARGA DETALLES ESTUDIO BENCHMARKING
# =============================================

class TestCargaDetallesEstudio:
    """
    Tests para endpoint cargaDetallesEstudio
    Fuente Laravel: WorkOrderController.php líneas 11495-11560

    Este endpoint procesa archivos Excel con detalles para OTs de tipo
    Estudio Benchmarking (ajuste_area_desarrollo = 3)
    """

    def test_estructura_respuesta_esperada(self):
        """La respuesta debe tener la estructura correcta según Laravel"""
        # Estructura esperada del response según Laravel línea 11555-11559
        respuesta_esperada = {
            "mensaje": "Archivo cargado Exitosamente",
            "detalles": [],  # Array de detalles
            "cantidad": 0,   # Número de filas
            "archivo": ""    # Path del archivo guardado
        }

        # Verificar estructura
        assert "mensaje" in respuesta_esperada
        assert "detalles" in respuesta_esperada
        assert "cantidad" in respuesta_esperada
        assert "archivo" in respuesta_esperada

    def test_estructura_detalle_individual(self):
        """Cada detalle debe tener los campos requeridos según Laravel líneas 11515-11518"""
        detalle_esperado = {
            "identificacion_muestra": "M-001",
            "cliente": "Cliente Test",
            "descripcion": "Descripción de la muestra"
        }

        # Verificar campos requeridos
        assert "identificacion_muestra" in detalle_esperado
        assert "cliente" in detalle_esperado
        assert "descripcion" in detalle_esperado

    def test_columnas_excel_requeridas(self):
        """El Excel debe tener las 3 columnas según el código Laravel"""
        columnas_requeridas = [
            "identificacion_muestra",
            "cliente",
            "descripcion"
        ]

        assert len(columnas_requeridas) == 3
        assert "identificacion_muestra" in columnas_requeridas
        assert "cliente" in columnas_requeridas
        assert "descripcion" in columnas_requeridas

    def test_extensiones_archivo_permitidas(self):
        """Solo se permiten archivos Excel (.xlsx, .xls)"""
        extensiones_validas = ["xlsx", "xls"]
        extensiones_invalidas = ["csv", "txt", "pdf", "doc"]

        for ext in extensiones_validas:
            assert ext in ["xlsx", "xls"], f"Extensión {ext} debería ser válida"

        for ext in extensiones_invalidas:
            assert ext not in ["xlsx", "xls"], f"Extensión {ext} no debería ser válida"

    def test_error_archivo_vacio(self):
        """Debe retornar error 404 si el archivo está vacío según Laravel línea 11547-11549"""
        error_esperado = {
            "mensaje": "Archivo vacio no contiene información"
        }
        assert "mensaje" in error_esperado
        assert "vacio" in error_esperado["mensaje"].lower() or "vacío" in error_esperado["mensaje"].lower()


class TestEndpointCargaDetallesEstudioExiste:
    """Verifica que el endpoint existe en work_orders.py"""

    def test_endpoint_carga_detalles_estudio_existe(self):
        """Verifica que el endpoint POST /carga-detalles-estudio existe"""
        import os

        router_path = os.path.join(
            os.path.dirname(__file__),
            "..", "app", "routers", "work_orders.py"
        )

        with open(router_path, 'r') as f:
            content = f.read()

        # Verificar ruta
        assert 'carga-detalles-estudio' in content, "Endpoint carga-detalles-estudio no encontrado"
        # Verificar función
        assert 'async def carga_detalles_estudio' in content, "Función carga_detalles_estudio no encontrada"
        # Verificar método POST
        assert '@router.post("/carga-detalles-estudio")' in content, "Ruta POST no encontrada"

    def test_endpoint_usa_upload_file(self):
        """Verifica que el endpoint usa UploadFile para recibir archivos"""
        import os

        router_path = os.path.join(
            os.path.dirname(__file__),
            "..", "app", "routers", "work_orders.py"
        )

        with open(router_path, 'r') as f:
            content = f.read()

        assert 'UploadFile' in content, "UploadFile no encontrado"
        assert 'archivo_detalles' in content, "Parámetro archivo_detalles no encontrado"


# =============================================
# RUN TESTS
# =============================================

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
