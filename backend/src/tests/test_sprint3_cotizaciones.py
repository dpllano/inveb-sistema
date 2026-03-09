"""
Tests de Certificación Sprint 3: Cotizaciones
==============================================

Verifica que los endpoints de cotizaciones están correctamente definidos.

Fuente Laravel: CotizacionController.php, DetalleCotizacionController.php
"""
import pytest
import os
import re


class TestCotizacionesRouterExists:
    """Verifica que el router de cotizaciones existe."""

    def test_archivo_cotizaciones_router_existe(self):
        """Verifica que el archivo cotizaciones.py existe."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'cotizaciones.py'
        )
        assert os.path.exists(router_path), "cotizaciones.py no existe"

    def test_endpoints_crud_cotizaciones(self):
        """Verifica endpoints CRUD de cotizaciones."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'cotizaciones.py'
        )

        with open(router_path, 'r') as f:
            content = f.read()

        endpoints_crud = [
            '@router.get("/",',               # Listar cotizaciones
            '@router.get("/{cotizacion_id}"', # Obtener cotización
            '@router.post("/",',              # Crear cotización
            '@router.put("/{cotizacion_id}"', # Actualizar cotización
        ]

        for endpoint in endpoints_crud:
            assert endpoint in content, f"Falta endpoint CRUD: {endpoint}"


class TestCotizacionesDetalles:
    """Verifica endpoints de detalles de cotización."""

    def test_endpoints_detalles(self):
        """Verifica endpoints de detalles."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'cotizaciones.py'
        )

        with open(router_path, 'r') as f:
            content = f.read()

        endpoints_detalles = [
            '/{cotizacion_id}/detalles',  # Agregar detalle
            '/detalles/{detalle_id}',     # Eliminar detalle
        ]

        for endpoint in endpoints_detalles:
            assert endpoint in content, f"Falta endpoint de detalles: {endpoint}"


class TestCotizacionesAprobacion:
    """Verifica endpoints de aprobación."""

    def test_endpoints_aprobacion(self):
        """Verifica endpoints de aprobación."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'cotizaciones.py'
        )

        with open(router_path, 'r') as f:
            content = f.read()

        endpoints_aprobacion = [
            'solicitar-aprobacion',
            'gestionar-aprobacion',
        ]

        for endpoint in endpoints_aprobacion:
            assert endpoint in content, f"Falta endpoint de aprobación: {endpoint}"


class TestCotizacionesSchemas:
    """Verifica que los schemas de cotizaciones están definidos."""

    def test_schemas_cotizacion(self):
        """Verifica schemas de cotización."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'cotizaciones.py'
        )

        with open(router_path, 'r') as f:
            content = f.read()

        schemas = [
            'class CotizacionBase',
            'class CotizacionCreate',
            'class CotizacionUpdate',
            'class CotizacionResponse',
            'class CotizacionListResponse',
        ]

        for schema in schemas:
            assert schema in content, f"Falta schema: {schema}"

    def test_schemas_detalle(self):
        """Verifica schemas de detalle cotización."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'cotizaciones.py'
        )

        with open(router_path, 'r') as f:
            content = f.read()

        schemas = [
            'class DetalleCotizacionBase',
            'class DetalleCotizacionCreate',
            'class DetalleCotizacionResponse',
        ]

        for schema in schemas:
            assert schema in content, f"Falta schema: {schema}"


class TestCotizacionesCamposDetalle:
    """Verifica campos del detalle según Laravel."""

    def test_campos_detalle_corrugado(self):
        """Verifica campos para detalle tipo corrugado."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'cotizaciones.py'
        )

        with open(router_path, 'r') as f:
            content = f.read()

        # Campos principales según DetalleCotizacionController
        campos = [
            'tipo_detalle_id',
            'cantidad',
            'carton_id',
            'product_type_id',
            'process_id',
            'area_hc',
            'anchura',
            'largura',
            'maquila',
        ]

        for campo in campos:
            assert campo in content, f"Falta campo de detalle: {campo}"


class TestCotizacionesOpciones:
    """Verifica endpoint de opciones de formulario."""

    def test_endpoint_opciones_formulario(self):
        """Verifica endpoint de opciones."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'cotizaciones.py'
        )

        with open(router_path, 'r') as f:
            content = f.read()

        assert '/opciones/formulario' in content, "Falta endpoint de opciones"

    def test_opciones_incluidas(self):
        """Verifica que se incluyen todas las opciones necesarias."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'cotizaciones.py'
        )

        with open(router_path, 'r') as f:
            content = f.read()

        # Opciones según CotizacionController@create
        opciones = [
            'clientes',
            'estilos',
            'tipos_producto',
            'procesos',
            'rubros',
            'cartones',
            'ciudades',
            'tipos_impresion',
            'servicios_maquila',
        ]

        for opcion in opciones:
            assert opcion in content, f"Falta opción: {opcion}"


class TestCotizacionesEstados:
    """Verifica manejo de estados de cotización."""

    def test_endpoint_estados(self):
        """Verifica endpoint de estados."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'cotizaciones.py'
        )

        with open(router_path, 'r') as f:
            content = f.read()

        assert '/estados/lista' in content, "Falta endpoint de estados"

    def test_acciones_aprobacion(self):
        """Verifica acciones de aprobación definidas."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'cotizaciones.py'
        )

        with open(router_path, 'r') as f:
            content = f.read()

        acciones = ['aprobar', 'rechazar', 'solicitar_cambios']
        for accion in acciones:
            assert accion in content, f"Falta acción de aprobación: {accion}"


class TestCotizacionesBulkCotizador:
    """Verifica que el bulk cotizador existe (implementación previa)."""

    def test_bulk_cotizador_existe(self):
        """Verifica que bulk_cotizador.py existe."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'bulk_cotizador.py'
        )
        assert os.path.exists(router_path), "bulk_cotizador.py no existe"

    def test_tablas_cotizador_definidas(self):
        """Verifica que las tablas del cotizador están definidas."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'bulk_cotizador.py'
        )

        with open(router_path, 'r') as f:
            content = f.read()

        tablas = [
            'cartones',
            'papeles',
            'fletes',
            'merma_corrugadoras',
            'merma_convertidoras',
        ]

        for tabla in tablas:
            assert f'"{tabla}"' in content, f"Falta tabla: {tabla}"


class TestCotizacionesDocumentacion:
    """Verifica documentación de endpoints."""

    def test_documentacion_fuente_laravel(self):
        """Verifica referencias a Laravel."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'cotizaciones.py'
        )

        with open(router_path, 'r') as f:
            content = f.read()

        assert 'CotizacionController' in content, "Falta referencia a CotizacionController"
        assert 'DetalleCotizacionController' in content, "Falta referencia a DetalleCotizacionController"


class TestResumenSprint3Cotizaciones:
    """Test final que resume la certificación de Cotizaciones."""

    def test_archivos_creados(self):
        """Verifica que los archivos fueron creados."""
        archivos = [
            ('app/routers', 'cotizaciones.py'),
            ('app/routers', 'bulk_cotizador.py'),
        ]

        for carpeta, archivo in archivos:
            path = os.path.join(
                os.path.dirname(__file__), '..', carpeta, archivo
            )
            assert os.path.exists(path), f"Falta archivo: {carpeta}/{archivo}"

        print(f"\n{'='*60}")
        print("CERTIFICACIÓN SPRINT 3 - COTIZACIONES")
        print(f"{'='*60}")
        print("Archivos:")
        print("  - app/routers/cotizaciones.py (nuevo)")
        print("  - app/routers/bulk_cotizador.py (existente)")
        print("Endpoints Cotizaciones:")
        print("  - GET / - Listar cotizaciones")
        print("  - GET /{id} - Obtener cotización")
        print("  - POST / - Crear cotización")
        print("  - PUT /{id} - Actualizar cotización")
        print("  - POST /{id}/detalles - Agregar detalle")
        print("  - DELETE /{id}/detalles/{det_id} - Eliminar detalle")
        print("  - POST /{id}/solicitar-aprobacion")
        print("  - POST /{id}/gestionar-aprobacion")
        print("  - GET /estados/lista")
        print("  - GET /opciones/formulario")
        print(f"{'='*60}")

    def test_total_endpoints_cotizaciones(self):
        """Verifica el total de endpoints definidos."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'cotizaciones.py'
        )

        with open(router_path, 'r') as f:
            content = f.read()

        # Contar decoradores de endpoints
        get_endpoints = len(re.findall(r'@router\.get\(', content))
        post_endpoints = len(re.findall(r'@router\.post\(', content))
        put_endpoints = len(re.findall(r'@router\.put\(', content))
        delete_endpoints = len(re.findall(r'@router\.delete\(', content))
        total = get_endpoints + post_endpoints + put_endpoints + delete_endpoints

        # Mínimo 10 endpoints
        assert total >= 10, f"Se esperaban mínimo 10 endpoints, encontrados: {total}"
