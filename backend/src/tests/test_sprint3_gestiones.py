"""
Tests de Certificación Sprint 3: Gestiones OT
=============================================

Verifica que los endpoints de gestión de OT están correctamente definidos.

Fuente Laravel: ManagementController.php (~1,500 líneas)
"""
import pytest
import os
import re


class TestGestionesRouterExists:
    """Verifica que el router de gestiones existe."""

    def test_archivo_gestiones_router_existe(self):
        """Verifica que el archivo gestiones.py existe."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'gestiones.py'
        )
        assert os.path.exists(router_path), "gestiones.py no existe"

    def test_endpoints_definidos_en_codigo(self):
        """Verifica que los 7 endpoints principales están definidos."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'gestiones.py'
        )

        with open(router_path, 'r') as f:
            content = f.read()

        # Endpoints principales de gestiones
        endpoints = [
            '@router.get("/{ot_id}"',           # Obtener datos para gestionar OT
            '@router.post("/{ot_id}/crear"',    # Crear gestión
            '@router.post("/{gestion_id}/respuesta"',  # Responder consulta
            '@router.get("/{ot_id}/log"',       # Log de gestiones
            '@router.get("/{ot_id}/log/excel"', # Excel de log
            '@router.post("/{ot_id}/reactivar"',  # Reactivar OT
            '@router.post("/{ot_id}/retomar"',  # Retomar OT
        ]

        for endpoint in endpoints:
            assert endpoint in content, f"Falta endpoint: {endpoint}"


class TestGestionesSchemas:
    """Verifica que los schemas de gestiones están definidos."""

    def test_schemas_definidos(self):
        """Verifica schemas principales."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'gestiones.py'
        )

        with open(router_path, 'r') as f:
            content = f.read()

        schemas = [
            'class GestionBase',
            'class GestionCreate',
            'class GestionResponse',
            'class RespuestaCreate',
            'class RespuestaResponse',
            'class GestionarOTResponse',
            'class DetalleLogResponse',
        ]

        for schema in schemas:
            assert schema in content, f"Falta schema: {schema}"


class TestGestionesFunciones:
    """Verifica funciones auxiliares de gestiones."""

    def test_funciones_helper_existen(self):
        """Verifica funciones helper."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'gestiones.py'
        )

        with open(router_path, 'r') as f:
            content = f.read()

        funciones = [
            'def get_mysql_connection',
            'def get_states_by_area',
            'def get_management_types_by_area',
        ]

        for funcion in funciones:
            assert funcion in content, f"Falta función: {funcion}"


class TestGestionesConstantes:
    """Verifica constantes de áreas definidas."""

    def test_constantes_areas(self):
        """Verifica constantes de áreas."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'gestiones.py'
        )

        with open(router_path, 'r') as f:
            content = f.read()

        areas = [
            'AREA_VENTA',
            'AREA_DESARROLLO',
            'AREA_DISEÑO',
            'AREA_CATALOGACION',
            'AREA_MUESTRAS',
        ]

        for area in areas:
            assert area in content, f"Falta constante: {area}"


class TestGestionesMotivos:
    """Verifica que los motivos de rechazo están definidos."""

    def test_motivos_rechazo(self):
        """Verifica motivos de rechazo según Laravel."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'gestiones.py'
        )

        with open(router_path, 'r') as f:
            content = f.read()

        # Motivos según Laravel ManagementController línea 287
        motivos = [
            "Falta Información",
            "Información Erronea",
            "Falta Muestra Física",
            "Medida Erronea",
            "Error de Digitación",
        ]

        for motivo in motivos:
            assert motivo in content, f"Falta motivo: {motivo}"


class TestGestionesExcelGeneration:
    """Verifica generación de Excel para log."""

    def test_excel_generation_imports(self):
        """Verifica imports para generación Excel."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'gestiones.py'
        )

        with open(router_path, 'r') as f:
            content = f.read()

        assert 'import openpyxl' in content or 'from openpyxl' in content, \
            "Falta import openpyxl para generación Excel"
        assert 'StreamingResponse' in content, "Falta StreamingResponse para descarga"


class TestGestionesDocumentacion:
    """Verifica documentación de endpoints."""

    def test_documentacion_fuente_laravel(self):
        """Verifica referencias a Laravel."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'gestiones.py'
        )

        with open(router_path, 'r') as f:
            content = f.read()

        assert 'ManagementController' in content, "Falta referencia a ManagementController"
        assert 'Fuente Laravel' in content, "Falta documentación de fuente Laravel"


class TestResumenSprint3Gestiones:
    """Test final que resume la certificación de Gestiones."""

    def test_archivos_creados(self):
        """Verifica que el archivo del Sprint 3 fue creado."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'gestiones.py'
        )
        assert os.path.exists(router_path), "Falta archivo: gestiones.py"

        print(f"\n{'='*60}")
        print("CERTIFICACIÓN SPRINT 3 - GESTIONES OT")
        print(f"{'='*60}")
        print("Archivo creado:")
        print("  - app/routers/gestiones.py")
        print("Endpoints implementados:")
        print("  - GET /{ot_id} - Obtener datos para gestionar")
        print("  - POST /{ot_id}/crear - Crear gestión")
        print("  - POST /{gestion_id}/respuesta - Responder consulta")
        print("  - GET /{ot_id}/log - Historial de gestiones")
        print("  - GET /{ot_id}/log/excel - Descargar historial Excel")
        print("  - POST /{ot_id}/reactivar - Reactivar OT")
        print("  - POST /{ot_id}/retomar - Retomar OT")
        print(f"{'='*60}")

    def test_total_endpoints_gestiones(self):
        """Verifica el total de endpoints definidos."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'gestiones.py'
        )

        with open(router_path, 'r') as f:
            content = f.read()

        # Contar decoradores de endpoints
        get_endpoints = len(re.findall(r'@router\.get\(', content))
        post_endpoints = len(re.findall(r'@router\.post\(', content))
        total = get_endpoints + post_endpoints

        # Mínimo 7 endpoints principales
        assert total >= 7, f"Se esperaban mínimo 7 endpoints, encontrados: {total}"
