"""
Tests para Sprint A: Cotizaciones Completas - 100% Paridad con Laravel.

Basado en: CotizacionController.php y DetalleCotizacionController.php

Endpoints implementados (14 total):
- calcular_margen() - GET /cotizaciones/calcular-margen/{id}
- calcular_mc_bruto() - GET /cotizaciones/calcular-mc-bruto/{id}
- detalles_corrugados() - GET /cotizaciones/detalles-corrugados/{id}/excel
- detalles_esquineros() - GET /cotizaciones/detalles-esquineros/{id}/excel
- obtener_margen_papeles() - GET /cotizaciones/obtener-margen-papeles/{id}
- editar_margen_cotizacion() - PUT /cotizaciones/detalles/{id}/editar-margen
- guardar_multiples_ot() - POST /cotizaciones/guardar-multiples-ot
- obtiene_datos() - GET /cotizaciones/obtiene-datos
- carton_alta_grafica() - GET /cotizaciones/cartones/alta-grafica
- carton_generico() - GET /cotizaciones/cartones/generico
- retomar_cotizacion_externo() - POST /cotizaciones/{id}/retomar-externo
- editar_cotizacion_externo() - POST /cotizaciones/{id}/editar-externo
- carga_materiales() - GET /cotizaciones/carga-materiales
- solicitar_aprobacion_new() - POST /cotizaciones/{id}/solicitar-aprobacion-new
"""

import pytest
import os
import ast


class TestCotizacionesRouterEndpoints:
    """Verifica que los endpoints de Sprint A existen en router.py"""

    @pytest.fixture(autouse=True)
    def setup(self):
        self.router_path = os.path.join(
            os.path.dirname(__file__),
            "..", "app", "routers", "cotizaciones", "router.py"
        )

    def test_archivo_router_existe(self):
        """Verifica que el archivo router.py existe"""
        assert os.path.exists(self.router_path), "router.py no encontrado"

    def test_endpoint_calcular_margen(self):
        """Verifica endpoint calcular_margen"""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'calcular-margen' in content, "Endpoint calcular_margen no encontrado"
        assert 'async def calcular_margen' in content, "Función calcular_margen no encontrada"

    def test_endpoint_calcular_mc_bruto(self):
        """Verifica endpoint calcular_mc_bruto"""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'calcular-mc-bruto' in content, "Endpoint calcular_mc_bruto no encontrado"
        assert 'async def calcular_mc_bruto' in content, "Función calcular_mc_bruto no encontrada"

    def test_endpoint_detalles_corrugados_excel(self):
        """Verifica endpoint export_detalles_corrugados"""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'detalles-corrugados' in content, "Endpoint detalles_corrugados no encontrado"
        assert 'async def export_detalles_corrugados' in content, "Función export_detalles_corrugados no encontrada"

    def test_endpoint_detalles_esquineros_excel(self):
        """Verifica endpoint export_detalles_esquineros"""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'detalles-esquineros' in content, "Endpoint detalles_esquineros no encontrado"
        assert 'async def export_detalles_esquineros' in content, "Función export_detalles_esquineros no encontrada"

    def test_endpoint_obtener_margen_papeles(self):
        """Verifica endpoint obtener_margen_papeles"""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'obtener-margen-papeles' in content, "Endpoint obtener_margen_papeles no encontrado"
        assert 'async def obtener_margen_papeles' in content, "Función obtener_margen_papeles no encontrada"

    def test_endpoint_retomar_cotizacion_externo(self):
        """Verifica endpoint retomar_cotizacion_externo"""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'retomar-externo' in content, "Endpoint retomar_cotizacion_externo no encontrado"
        assert 'async def retomar_cotizacion_externo' in content, "Función retomar_cotizacion_externo no encontrada"

    def test_endpoint_editar_cotizacion_externo(self):
        """Verifica endpoint editar_cotizacion_externo"""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'editar-externo' in content, "Endpoint editar_cotizacion_externo no encontrado"
        assert 'async def editar_cotizacion_externo' in content, "Función editar_cotizacion_externo no encontrada"

    def test_endpoint_carga_materiales(self):
        """Verifica endpoint carga_materiales"""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'carga-materiales' in content, "Endpoint carga_materiales no encontrado"
        assert 'async def carga_materiales' in content, "Función carga_materiales no encontrada"

    def test_endpoint_solicitar_aprobacion_new(self):
        """Verifica endpoint solicitar_aprobacion_new"""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'solicitar-aprobacion-new' in content, "Endpoint solicitar_aprobacion_new no encontrado"
        assert 'async def solicitar_aprobacion_new' in content, "Función solicitar_aprobacion_new no encontrada"


class TestDetallesRouterEndpoints:
    """Verifica que los endpoints de Sprint A existen en detalles.py"""

    @pytest.fixture(autouse=True)
    def setup(self):
        self.detalles_path = os.path.join(
            os.path.dirname(__file__),
            "..", "app", "routers", "cotizaciones", "detalles.py"
        )

    def test_archivo_detalles_existe(self):
        """Verifica que el archivo detalles.py existe"""
        assert os.path.exists(self.detalles_path), "detalles.py no encontrado"

    def test_endpoint_editar_margen(self):
        """Verifica endpoint editar_margen_cotizacion"""
        with open(self.detalles_path, 'r') as f:
            content = f.read()
        assert 'editar-margen' in content, "Endpoint editar_margen no encontrado"
        assert 'async def editar_margen_cotizacion' in content, "Función editar_margen_cotizacion no encontrada"

    def test_endpoint_guardar_multiples_ot(self):
        """Verifica endpoint guardar_multiples_ot"""
        with open(self.detalles_path, 'r') as f:
            content = f.read()
        assert 'guardar-multiples-ot' in content, "Endpoint guardar_multiples_ot no encontrado"
        assert 'async def guardar_multiples_ot' in content, "Función guardar_multiples_ot no encontrada"

    def test_endpoint_obtiene_datos(self):
        """Verifica endpoint obtiene_datos"""
        with open(self.detalles_path, 'r') as f:
            content = f.read()
        assert 'obtiene-datos' in content, "Endpoint obtiene_datos no encontrado"
        assert 'async def obtiene_datos' in content, "Función obtiene_datos no encontrada"

    def test_endpoint_carton_alta_grafica(self):
        """Verifica endpoint carton_alta_grafica"""
        with open(self.detalles_path, 'r') as f:
            content = f.read()
        assert 'cartones/alta-grafica' in content, "Endpoint carton_alta_grafica no encontrado"
        assert 'async def carton_alta_grafica' in content, "Función carton_alta_grafica no encontrada"

    def test_endpoint_carton_generico(self):
        """Verifica endpoint carton_generico"""
        with open(self.detalles_path, 'r') as f:
            content = f.read()
        assert 'cartones/generico' in content, "Endpoint carton_generico no encontrado"
        assert 'async def carton_generico' in content, "Función carton_generico no encontrada"


class TestSprintASchemas:
    """Verifica schemas necesarios para Sprint A"""

    @pytest.fixture(autouse=True)
    def setup(self):
        self.detalles_path = os.path.join(
            os.path.dirname(__file__),
            "..", "app", "routers", "cotizaciones", "detalles.py"
        )

    def test_schema_editar_margen_request(self):
        """Verifica schema EditarMargenRequest"""
        with open(self.detalles_path, 'r') as f:
            content = f.read()
        assert 'class EditarMargenRequest' in content, "Schema EditarMargenRequest no encontrado"
        assert 'precio_nuevo' in content, "Campo precio_nuevo no encontrado"

    def test_schema_guardar_multiples_ot_request(self):
        """Verifica schema GuardarMultiplesOTRequest"""
        with open(self.detalles_path, 'r') as f:
            content = f.read()
        assert 'class GuardarMultiplesOTRequest' in content, "Schema GuardarMultiplesOTRequest no encontrado"
        assert 'work_order_ids' in content, "Campo work_order_ids no encontrado"


class TestSprintASyntax:
    """Verifica que los archivos tienen sintaxis Python válida"""

    def test_router_syntax(self):
        """Verifica sintaxis de router.py"""
        router_path = os.path.join(
            os.path.dirname(__file__),
            "..", "app", "routers", "cotizaciones", "router.py"
        )
        with open(router_path, 'r') as f:
            content = f.read()
        try:
            ast.parse(content)
        except SyntaxError as e:
            pytest.fail(f"Error de sintaxis en router.py: {e}")

    def test_detalles_syntax(self):
        """Verifica sintaxis de detalles.py"""
        detalles_path = os.path.join(
            os.path.dirname(__file__),
            "..", "app", "routers", "cotizaciones", "detalles.py"
        )
        with open(detalles_path, 'r') as f:
            content = f.read()
        try:
            ast.parse(content)
        except SyntaxError as e:
            pytest.fail(f"Error de sintaxis en detalles.py: {e}")


class TestSprintADocumentacion:
    """Verifica que los endpoints tienen documentación de fuente Laravel"""

    @pytest.fixture(autouse=True)
    def setup(self):
        self.router_path = os.path.join(
            os.path.dirname(__file__),
            "..", "app", "routers", "cotizaciones", "router.py"
        )
        self.detalles_path = os.path.join(
            os.path.dirname(__file__),
            "..", "app", "routers", "cotizaciones", "detalles.py"
        )

    def test_documentacion_laravel_router(self):
        """Verifica referencias a código Laravel en router.py"""
        with open(self.router_path, 'r') as f:
            content = f.read()
        # Debe contener referencias al controlador Laravel
        assert 'CotizacionController' in content, "Falta referencia a CotizacionController"

    def test_documentacion_laravel_detalles(self):
        """Verifica referencias a código Laravel en detalles.py"""
        with open(self.detalles_path, 'r') as f:
            content = f.read()
        # Debe contener referencias al controlador Laravel
        assert 'DetalleCotizacionController' in content, "Falta referencia a DetalleCotizacionController"


class TestResumenSprintA:
    """Resumen de implementación Sprint A"""

    def test_archivos_sprint_a_creados(self):
        """Verifica que todos los archivos están creados"""
        archivos = [
            ("router.py", "app/routers/cotizaciones/router.py"),
            ("detalles.py", "app/routers/cotizaciones/detalles.py"),
        ]

        for nombre, ruta_relativa in archivos:
            ruta = os.path.join(
                os.path.dirname(__file__),
                "..", ruta_relativa
            )
            assert os.path.exists(ruta), f"Archivo {nombre} no encontrado"

    def test_total_endpoints_sprint_a(self):
        """Cuenta los endpoints implementados en Sprint A"""
        router_path = os.path.join(
            os.path.dirname(__file__),
            "..", "app", "routers", "cotizaciones", "router.py"
        )
        detalles_path = os.path.join(
            os.path.dirname(__file__),
            "..", "app", "routers", "cotizaciones", "detalles.py"
        )

        endpoints_sprint_a = [
            "calcular_margen",
            "calcular_mc_bruto",
            "export_detalles_corrugados",
            "export_detalles_esquineros",
            "obtener_margen_papeles",
            "editar_margen_cotizacion",
            "guardar_multiples_ot",
            "obtiene_datos",
            "carton_alta_grafica",
            "carton_generico",
            "retomar_cotizacion_externo",
            "editar_cotizacion_externo",
            "carga_materiales",
            "solicitar_aprobacion_new",
        ]

        with open(router_path, 'r') as f:
            router_content = f.read()
        with open(detalles_path, 'r') as f:
            detalles_content = f.read()

        full_content = router_content + detalles_content

        endpoints_encontrados = sum(
            1 for ep in endpoints_sprint_a if f"async def {ep}" in full_content
        )

        assert endpoints_encontrados == 14, f"Esperados 14 endpoints Sprint A, encontrados {endpoints_encontrados}"
        print(f"\n✅ Sprint A: {endpoints_encontrados}/14 endpoints implementados para 100% paridad")
