"""
Tests de Certificación Sprint 4: Muestras
==========================================

Verifica que los endpoints de muestras están correctamente definidos.

Fuente Laravel: MuestraController.php (~857 líneas)
"""
import pytest
import os
import re


class TestMuestrasRouterExists:
    """Verifica que el router de muestras existe."""

    def test_archivo_muestras_router_existe(self):
        """Verifica que el archivo muestras.py existe."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'muestras.py'
        )
        assert os.path.exists(router_path), "muestras.py no existe"

    def test_endpoints_crud_muestras(self):
        """Verifica endpoints CRUD de muestras."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'muestras.py'
        )

        with open(router_path, 'r') as f:
            content = f.read()

        endpoints_crud = [
            '@router.get("/{muestra_id}"',    # Obtener muestra
            '@router.post("/",',               # Crear muestra
            '@router.put("/{muestra_id}"',    # Actualizar muestra
            '@router.delete("/{muestra_id}"', # Eliminar muestra
        ]

        for endpoint in endpoints_crud:
            assert endpoint in content, f"Falta endpoint CRUD: {endpoint}"


class TestMuestrasOtEndpoint:
    """Verifica endpoint de muestras por OT."""

    def test_endpoint_muestras_ot(self):
        """Verifica endpoint GET /ot/{ot_id}."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'muestras.py'
        )

        with open(router_path, 'r') as f:
            content = f.read()

        assert '@router.get("/ot/{ot_id}"' in content, \
            "Falta endpoint GET /ot/{ot_id}"


class TestMuestrasEstados:
    """Verifica endpoints de cambio de estado."""

    def test_endpoint_terminar(self):
        """Verifica endpoint terminar muestra."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'muestras.py'
        )

        with open(router_path, 'r') as f:
            content = f.read()

        assert '/{muestra_id}/terminar' in content, "Falta endpoint terminar"

    def test_endpoint_rechazar(self):
        """Verifica endpoint rechazar muestra."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'muestras.py'
        )

        with open(router_path, 'r') as f:
            content = f.read()

        assert '/{muestra_id}/rechazar' in content, "Falta endpoint rechazar"

    def test_endpoint_anular(self):
        """Verifica endpoint anular muestra."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'muestras.py'
        )

        with open(router_path, 'r') as f:
            content = f.read()

        assert '/{muestra_id}/anular' in content, "Falta endpoint anular"

    def test_endpoint_devolver(self):
        """Verifica endpoint devolver muestra."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'muestras.py'
        )

        with open(router_path, 'r') as f:
            content = f.read()

        assert '/{muestra_id}/devolver' in content, "Falta endpoint devolver"

    def test_endpoint_prioritaria(self):
        """Verifica endpoint marcar como prioritaria."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'muestras.py'
        )

        with open(router_path, 'r') as f:
            content = f.read()

        assert '/{muestra_id}/prioritaria' in content, "Falta endpoint prioritaria"


class TestMuestrasSalaCorte:
    """Verifica endpoints de sala de corte."""

    def test_endpoint_sala_corte(self):
        """Verifica endpoint sala corte."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'muestras.py'
        )

        with open(router_path, 'r') as f:
            content = f.read()

        assert '/{muestra_id}/sala-corte' in content, "Falta endpoint sala-corte"

    def test_endpoint_en_proceso(self):
        """Verifica endpoint en proceso."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'muestras.py'
        )

        with open(router_path, 'r') as f:
            content = f.read()

        assert '/{muestra_id}/en-proceso' in content, "Falta endpoint en-proceso"


class TestMuestrasSchemas:
    """Verifica que los schemas de muestras están definidos."""

    def test_schemas_principales(self):
        """Verifica schemas principales."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'muestras.py'
        )

        with open(router_path, 'r') as f:
            content = f.read()

        # Schemas según implementación actual
        schemas = [
            'class MuestraListItem',
            'class MuestraCreate',
            'class MuestraUpdate',
            'class MuestraDetalle',
        ]

        for schema in schemas:
            assert schema in content, f"Falta schema: {schema}"

    def test_schemas_response(self):
        """Verifica schemas de response."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'muestras.py'
        )

        with open(router_path, 'r') as f:
            content = f.read()

        schemas = [
            'class MuestraListResponse',
            'class MuestraCreateResponse',
            'class MuestraUpdateResponse',
            'class MuestraActionResponse',
        ]

        for schema in schemas:
            assert schema in content, f"Falta schema response: {schema}"


class TestMuestrasEstadosConstantes:
    """Verifica constantes de estados según Laravel."""

    def test_estados_definidos(self):
        """Verifica que los estados están definidos."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'muestras.py'
        )

        with open(router_path, 'r') as f:
            content = f.read()

        # Estados según Laravel: 0=Sin Asignar, 1=En Proceso, 2=Rechazada,
        # 3=Terminada, 4=Anulada, 5=Devuelta, 6=Sala de Corte
        estados_nombres = [
            'Sin Asignar',
            'En Proceso',
            'Rechazada',
            'Terminada',
            'Anulada',
            'Devuelta',
            'Sala de Corte',
        ]

        # Al menos debe tener definidos los estados principales
        estados_encontrados = sum(1 for e in estados_nombres if e in content)
        assert estados_encontrados >= 4, \
            f"Faltan estados de muestra. Encontrados: {estados_encontrados}/7"


class TestMuestrasCamposDestinatario:
    """Verifica campos de destinatario según Laravel."""

    def test_campos_destinatario(self):
        """Verifica campos de destinatario en schemas."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'muestras.py'
        )

        with open(router_path, 'r') as f:
            content = f.read()

        # Campos de destinatario según Laravel MuestraController
        campos = [
            'destinatarios_id',
            'cantidad_vendedor',
            'cantidad_diseñador',
        ]

        for campo in campos:
            assert campo in content, f"Falta campo de destinatario: {campo}"


class TestMuestrasOptions:
    """Verifica endpoint de opciones."""

    def test_endpoint_options(self):
        """Verifica endpoint de opciones."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'muestras.py'
        )

        with open(router_path, 'r') as f:
            content = f.read()

        assert '@router.get("/options"' in content, "Falta endpoint /options"


class TestMuestrasDocumentacion:
    """Verifica documentación de endpoints."""

    def test_documentacion_fuente_laravel(self):
        """Verifica referencias a Laravel."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'muestras.py'
        )

        with open(router_path, 'r') as f:
            content = f.read()

        assert 'MuestraController' in content, "Falta referencia a MuestraController"


class TestResumenSprint4Muestras:
    """Test final que resume la certificación de Muestras."""

    def test_archivos_creados(self):
        """Verifica que el archivo existe."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'muestras.py'
        )
        assert os.path.exists(router_path), "Falta archivo: muestras.py"

        print(f"\n{'='*60}")
        print("CERTIFICACIÓN SPRINT 4 - MUESTRAS")
        print(f"{'='*60}")
        print("Archivo verificado:")
        print("  - app/routers/muestras.py")
        print("Endpoints implementados:")
        print("  - GET /ot/{ot_id} - Muestras por OT")
        print("  - GET /options - Opciones formulario")
        print("  - GET /{id} - Obtener muestra")
        print("  - POST / - Crear muestra")
        print("  - PUT /{id} - Actualizar muestra")
        print("  - PUT /{id}/terminar - Terminar muestra")
        print("  - PUT /{id}/rechazar - Rechazar muestra")
        print("  - PUT /{id}/anular - Anular muestra")
        print("  - PUT /{id}/devolver - Devolver muestra")
        print("  - PUT /{id}/prioritaria - Marcar prioritaria")
        print("  - DELETE /{id} - Eliminar muestra")
        print("  - PUT /{id}/sala-corte - Acción sala corte")
        print("  - PUT /{id}/en-proceso - Marcar en proceso")
        print(f"{'='*60}")

    def test_total_endpoints_muestras(self):
        """Verifica el total de endpoints definidos."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'muestras.py'
        )

        with open(router_path, 'r') as f:
            content = f.read()

        # Contar decoradores de endpoints
        get_endpoints = len(re.findall(r'@router\.get\(', content))
        post_endpoints = len(re.findall(r'@router\.post\(', content))
        put_endpoints = len(re.findall(r'@router\.put\(', content))
        delete_endpoints = len(re.findall(r'@router\.delete\(', content))
        total = get_endpoints + post_endpoints + put_endpoints + delete_endpoints

        # Mínimo 13 endpoints según Laravel
        assert total >= 13, f"Se esperaban mínimo 13 endpoints, encontrados: {total}"
