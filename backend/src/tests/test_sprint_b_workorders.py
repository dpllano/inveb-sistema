"""
Tests para Sprint B: WorkOrders Grupo 2 - Cascadas y Datos.

Basado en: WorkOrderController.php líneas 9969-10299

Endpoints implementados (14 total):
- get_matriz() - GET /work-orders/matriz
- get_matriz_data() - GET /work-orders/matriz/{id}/data
- get_cad_by_material() - GET /work-orders/cad-by-material/{id}
- get_carton_color() - GET /work-orders/carton-color
- get_lista_carton() - GET /work-orders/lista-carton
- get_lista_carton_edit() - GET /work-orders/lista-carton-edit
- get_lista_carton_offset() - GET /work-orders/lista-carton-offset
- get_maquila_servicio() - GET /work-orders/maquila-servicio/{id}
- get_design_type() - GET /work-orders/design-type/{id}
- get_color_carton() - GET /work-orders/color-carton
- post_verificacion_filtro() - POST /work-orders/verificacion-filtro
- get_recubrimiento_interno() - GET /work-orders/recubrimiento-interno
- get_recubrimiento_externo() - GET /work-orders/recubrimiento-externo
- get_planta_objetivo() - GET /work-orders/planta-objetivo
"""

import pytest
import os
import ast


class TestWorkOrdersRouterEndpoints:
    """Verifica que los endpoints de Sprint B existen en work_orders.py"""

    @pytest.fixture(autouse=True)
    def setup(self):
        self.router_path = os.path.join(
            os.path.dirname(__file__),
            "..", "app", "routers", "work_orders.py"
        )

    def test_archivo_router_existe(self):
        """Verifica que el archivo work_orders.py existe"""
        assert os.path.exists(self.router_path), "work_orders.py no encontrado"

    def test_endpoint_get_matriz(self):
        """Verifica endpoint get_matriz"""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert '/matriz"' in content or "'/matriz'" in content, "Endpoint get_matriz no encontrado"
        assert 'async def get_matriz' in content, "Función get_matriz no encontrada"

    def test_endpoint_get_matriz_data(self):
        """Verifica endpoint get_matriz_data"""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'matriz/{matriz_id}/data' in content, "Endpoint get_matriz_data no encontrado"
        assert 'async def get_matriz_data' in content, "Función get_matriz_data no encontrada"

    def test_endpoint_get_cad_by_material(self):
        """Verifica endpoint get_cad_by_material"""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'cad-by-material' in content, "Endpoint get_cad_by_material no encontrado"
        assert 'async def get_cad_by_material' in content, "Función get_cad_by_material no encontrada"

    def test_endpoint_get_carton_color(self):
        """Verifica endpoint get_carton_color"""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'carton-color' in content, "Endpoint get_carton_color no encontrado"
        assert 'async def get_carton_color' in content, "Función get_carton_color no encontrada"

    def test_endpoint_get_lista_carton(self):
        """Verifica endpoint get_lista_carton"""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'lista-carton"' in content or "'/lista-carton'" in content, "Endpoint get_lista_carton no encontrado"
        assert 'async def get_lista_carton' in content, "Función get_lista_carton no encontrada"

    def test_endpoint_get_lista_carton_edit(self):
        """Verifica endpoint get_lista_carton_edit"""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'lista-carton-edit' in content, "Endpoint get_lista_carton_edit no encontrado"
        assert 'async def get_lista_carton_edit' in content, "Función get_lista_carton_edit no encontrada"

    def test_endpoint_get_lista_carton_offset(self):
        """Verifica endpoint get_lista_carton_offset"""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'lista-carton-offset' in content, "Endpoint get_lista_carton_offset no encontrado"
        assert 'async def get_lista_carton_offset' in content, "Función get_lista_carton_offset no encontrada"

    def test_endpoint_get_maquila_servicio(self):
        """Verifica endpoint get_maquila_servicio"""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'maquila-servicio' in content, "Endpoint get_maquila_servicio no encontrado"
        assert 'async def get_maquila_servicio' in content, "Función get_maquila_servicio no encontrada"

    def test_endpoint_get_design_type(self):
        """Verifica endpoint get_design_type"""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'design-type' in content, "Endpoint get_design_type no encontrado"
        assert 'async def get_design_type' in content, "Función get_design_type no encontrada"

    def test_endpoint_get_color_carton(self):
        """Verifica endpoint get_color_carton"""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'color-carton' in content, "Endpoint get_color_carton no encontrado"
        assert 'async def get_color_carton' in content, "Función get_color_carton no encontrada"

    def test_endpoint_post_verificacion_filtro(self):
        """Verifica endpoint post_verificacion_filtro"""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'verificacion-filtro' in content, "Endpoint post_verificacion_filtro no encontrado"
        assert 'async def post_verificacion_filtro' in content, "Función post_verificacion_filtro no encontrada"

    def test_endpoint_get_recubrimiento_interno(self):
        """Verifica endpoint get_recubrimiento_interno"""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'recubrimiento-interno' in content, "Endpoint get_recubrimiento_interno no encontrado"
        assert 'async def get_recubrimiento_interno' in content, "Función get_recubrimiento_interno no encontrada"

    def test_endpoint_get_recubrimiento_externo(self):
        """Verifica endpoint get_recubrimiento_externo"""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'recubrimiento-externo' in content, "Endpoint get_recubrimiento_externo no encontrado"
        assert 'async def get_recubrimiento_externo' in content, "Función get_recubrimiento_externo no encontrada"

    def test_endpoint_get_planta_objetivo(self):
        """Verifica endpoint get_planta_objetivo"""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'planta-objetivo' in content, "Endpoint get_planta_objetivo no encontrado"
        assert 'async def get_planta_objetivo' in content, "Función get_planta_objetivo no encontrada"


class TestSprintBSyntax:
    """Verifica que el archivo tiene sintaxis Python válida"""

    def test_work_orders_syntax(self):
        """Verifica sintaxis de work_orders.py"""
        router_path = os.path.join(
            os.path.dirname(__file__),
            "..", "app", "routers", "work_orders.py"
        )
        with open(router_path, 'r') as f:
            content = f.read()
        try:
            ast.parse(content)
        except SyntaxError as e:
            pytest.fail(f"Error de sintaxis en work_orders.py: {e}")


class TestSprintBDocumentacion:
    """Verifica que los endpoints tienen documentación de fuente Laravel"""

    @pytest.fixture(autouse=True)
    def setup(self):
        self.router_path = os.path.join(
            os.path.dirname(__file__),
            "..", "app", "routers", "work_orders.py"
        )

    def test_documentacion_laravel(self):
        """Verifica referencias a código Laravel"""
        with open(self.router_path, 'r') as f:
            content = f.read()
        # Debe contener referencias al controlador Laravel
        assert 'WorkOrderController' in content, "Falta referencia a WorkOrderController"


class TestResumenSprintB:
    """Resumen de implementación Sprint B Grupo 2"""

    def test_archivos_sprint_b_creados(self):
        """Verifica que todos los archivos están creados"""
        router_path = os.path.join(
            os.path.dirname(__file__),
            "..", "app", "routers", "work_orders.py"
        )
        assert os.path.exists(router_path), "work_orders.py no encontrado"

    def test_total_endpoints_sprint_b_grupo2(self):
        """Cuenta los endpoints implementados en Sprint B Grupo 2"""
        router_path = os.path.join(
            os.path.dirname(__file__),
            "..", "app", "routers", "work_orders.py"
        )

        endpoints_sprint_b = [
            "get_matriz",
            "get_matriz_data",
            "get_cad_by_material",
            "get_carton_color",
            "get_lista_carton",
            "get_lista_carton_edit",
            "get_lista_carton_offset",
            "get_maquila_servicio",
            "get_design_type",
            "get_color_carton",
            "post_verificacion_filtro",
            "get_recubrimiento_interno",
            "get_recubrimiento_externo",
            "get_planta_objetivo",
        ]

        with open(router_path, 'r') as f:
            content = f.read()

        endpoints_encontrados = sum(
            1 for ep in endpoints_sprint_b if f"async def {ep}" in content
        )

        assert endpoints_encontrados == 14, f"Esperados 14 endpoints Sprint B Grupo 2, encontrados {endpoints_encontrados}"
        print(f"\n✅ Sprint B Grupo 2: {endpoints_encontrados}/14 endpoints implementados")
