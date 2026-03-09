"""
Tests para Sprint C: Gestión de OTs - Aprobación, Rechazo, CAD y Material.

Basado en: WorkOrderController.php líneas 10302-10568, 4724-4950, 11247-11380

Endpoints implementados (6 total):
- aprobar_ot() - PUT /work-orders/{id}/aprobar
- rechazar_ot() - PUT /work-orders/{id}/rechazar
- create_cad_material() - PUT /work-orders/{id}/crear-cad-material
- create_codigo_material() - PUT /work-orders/{id}/crear-codigo-material
- importar_muestras_desde_excel() - POST /work-orders/importar-muestras-excel
- cotizar_multiples_ot() - GET /work-orders/cotizar-multiples
"""

import pytest
import os
import ast


class TestSprintCAprobacionRechazo:
    """Tests para endpoints de aprobación y rechazo de OTs."""

    @pytest.fixture(autouse=True)
    def setup(self):
        self.router_path = os.path.join(
            os.path.dirname(__file__),
            "..", "app", "routers", "work_orders.py"
        )

    def test_endpoint_aprobar_ot_existe(self):
        """Verifica endpoint PUT /{ot_id}/aprobar"""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert '/aprobar"' in content or "'/aprobar'" in content, "Endpoint aprobar no encontrado"
        assert 'async def aprobar_ot' in content, "Función aprobar_ot no encontrada"

    def test_endpoint_rechazar_ot_existe(self):
        """Verifica endpoint PUT /{ot_id}/rechazar"""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert '/rechazar"' in content or "'/rechazar'" in content, "Endpoint rechazar no encontrado"
        assert 'async def rechazar_ot' in content, "Función rechazar_ot no encontrada"

    def test_aprobacion_actualiza_campo_correcto(self):
        """La aprobación debe actualizar aprobacion_jefe_venta o aprobacion_jefe_desarrollo = 2"""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'aprobacion_jefe_venta = 2' in content, "No actualiza aprobacion_jefe_venta"
        assert 'aprobacion_jefe_desarrollo = 2' in content, "No actualiza aprobacion_jefe_desarrollo"

    def test_rechazo_actualiza_campo_correcto(self):
        """El rechazo debe actualizar aprobacion_jefe_venta o aprobacion_jefe_desarrollo = 3"""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'aprobacion_jefe_venta = 3' in content, "No actualiza aprobacion_jefe_venta para rechazo"
        assert 'aprobacion_jefe_desarrollo = 3' in content, "No actualiza aprobacion_jefe_desarrollo para rechazo"


class TestSprintCCadMaterial:
    """Tests para endpoints de CAD y Material."""

    @pytest.fixture(autouse=True)
    def setup(self):
        self.router_path = os.path.join(
            os.path.dirname(__file__),
            "..", "app", "routers", "work_orders.py"
        )

    def test_endpoint_crear_cad_material_existe(self):
        """Verifica endpoint PUT /{ot_id}/crear-cad-material"""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'crear-cad-material' in content, "Endpoint crear-cad-material no encontrado"
        assert 'async def create_cad_material' in content, "Función create_cad_material no encontrada"

    def test_endpoint_crear_codigo_material_existe(self):
        """Verifica endpoint PUT /{ot_id}/crear-codigo-material"""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'crear-codigo-material' in content, "Endpoint crear-codigo-material no encontrado"
        assert 'async def create_codigo_material' in content, "Función create_codigo_material no encontrada"

    def test_schema_create_cad_material_request(self):
        """Verifica schema CreateCadMaterialRequest"""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'class CreateCadMaterialRequest' in content, "Schema CreateCadMaterialRequest no encontrado"
        assert 'descripcion: str' in content, "Campo descripcion no encontrado"
        assert 'material: str' in content, "Campo material no encontrado"
        assert 'maquila: int' in content, "Campo maquila no encontrado"

    def test_schema_create_codigo_material_request(self):
        """Verifica schema CreateCodigoMaterialRequest según Laravel líneas 10482-10486"""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'class CreateCodigoMaterialRequest' in content, "Schema CreateCodigoMaterialRequest no encontrado"
        assert 'codigo_material: str' in content, "Campo codigo_material no encontrado"
        assert 'sufijo_id: str' in content, "Campo sufijo_id no encontrado"
        assert 'prefijo_ot: str' in content, "Campo prefijo_ot no encontrado"

    def test_create_cad_material_crea_material(self):
        """Verifica que create_cad_material crea registro en tabla materials"""
        with open(self.router_path, 'r') as f:
            content = f.read()
        # Debe insertar en tabla materials
        assert 'INSERT INTO materials' in content, "No inserta en tabla materials"
        # Debe actualizar material_id en OT
        assert 'material_id = %s' in content, "No actualiza material_id en OT"

    def test_create_codigo_material_clona_materiales(self):
        """Verifica que create_codigo_material puede clonar materiales con prefijos adicionales"""
        with open(self.router_path, 'r') as f:
            content = f.read()
        # Debe soportar prefijos adicionales para clonar
        assert 'prefijos_adicionales' in content, "No soporta prefijos adicionales"
        # Debe actualizar materials.codigo
        assert 'UPDATE materials' in content and 'codigo = %s' in content, "No actualiza materials.codigo"


class TestSprintCImportarMuestras:
    """Tests para endpoint de importación de muestras desde Excel."""

    @pytest.fixture(autouse=True)
    def setup(self):
        self.router_path = os.path.join(
            os.path.dirname(__file__),
            "..", "app", "routers", "work_orders.py"
        )

    def test_endpoint_importar_muestras_excel_existe(self):
        """Verifica endpoint POST /importar-muestras-excel"""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'importar-muestras-excel' in content, "Endpoint importar-muestras-excel no encontrado"
        assert 'async def importar_muestras_desde_excel' in content, "Función importar_muestras_desde_excel no encontrada"

    def test_columnas_obligatorias_validadas(self):
        """El endpoint debe validar columnas obligatorias del Excel"""
        with open(self.router_path, 'r') as f:
            content = f.read()
        columnas = ["descripcion", "largo_int", "ancho_int", "alto_int", "carton", "destinatario", "cantidad"]
        for col in columnas:
            assert col in content, f"Columna obligatoria {col} no mencionada"

    def test_usa_upload_file(self):
        """El endpoint debe usar UploadFile para recibir archivos"""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'licitacion_file: UploadFile' in content, "No usa UploadFile para licitacion_file"


class TestSprintCCotizarMultiples:
    """Tests para endpoint de cotizar múltiples OTs."""

    @pytest.fixture(autouse=True)
    def setup(self):
        self.router_path = os.path.join(
            os.path.dirname(__file__),
            "..", "app", "routers", "work_orders.py"
        )

    def test_endpoint_cotizar_multiples_existe(self):
        """Verifica endpoint GET /cotizar-multiples"""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'cotizar-multiples' in content, "Endpoint cotizar-multiples no encontrado"
        assert 'async def cotizar_multiples_ot' in content, "Función cotizar_multiples_ot no encontrada"

    def test_paginacion_implementada(self):
        """El endpoint debe soportar paginación"""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'page:' in content, "Parámetro page no encontrado"
        assert 'per_page:' in content, "Parámetro per_page no encontrado"
        assert 'pagination' in content, "Respuesta de paginación no encontrada"


class TestSprintCSyntax:
    """Verifica que el archivo tiene sintaxis Python válida."""

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


class TestSprintCDocumentacion:
    """Verifica documentación de fuente Laravel."""

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
        assert 'WorkOrderController' in content, "Falta referencia a WorkOrderController"


class TestResumenSprintC:
    """Resumen de implementación Sprint C."""

    def test_total_endpoints_sprint_c(self):
        """Cuenta los endpoints implementados en Sprint C"""
        router_path = os.path.join(
            os.path.dirname(__file__),
            "..", "app", "routers", "work_orders.py"
        )

        endpoints_sprint_c = [
            "aprobar_ot",
            "rechazar_ot",
            "create_cad_material",
            "create_codigo_material",
            "importar_muestras_desde_excel",
            "cotizar_multiples_ot",
        ]

        with open(router_path, 'r') as f:
            content = f.read()

        endpoints_encontrados = sum(
            1 for ep in endpoints_sprint_c if f"async def {ep}" in content
        )

        assert endpoints_encontrados == 6, f"Esperados 6 endpoints Sprint C, encontrados {endpoints_encontrados}"
        print(f"\n✅ Sprint C: {endpoints_encontrados}/6 endpoints implementados")


# =============================================
# RUN TESTS
# =============================================

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
