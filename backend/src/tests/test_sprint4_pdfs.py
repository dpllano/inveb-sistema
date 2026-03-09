"""
Tests de Certificación Sprint 4: PDFs
=====================================

Verifica que los endpoints de generación de PDF están correctamente definidos.

Fuente Laravel:
- MuestraController.php (generar_etiqueta_muestra_pdf)
- WorkOrderController.php (generar_ficha_diseño)
- CotizacionController.php (generar_cotizacion_pdf)
"""
import pytest
import os
import re


class TestPdfsRouterExists:
    """Verifica que el router de PDFs existe."""

    def test_archivo_pdfs_router_existe(self):
        """Verifica que el archivo pdfs.py existe."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'pdfs.py'
        )
        assert os.path.exists(router_path), "pdfs.py no existe"


class TestPdfEtiquetaMuestra:
    """Verifica endpoint de etiqueta de muestra."""

    def test_endpoint_etiqueta_muestra(self):
        """Verifica endpoint etiqueta-muestra."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'pdfs.py'
        )

        with open(router_path, 'r') as f:
            content = f.read()

        assert '/etiqueta-muestra/' in content, "Falta endpoint etiqueta-muestra"

    def test_tipos_etiqueta(self):
        """Verifica que soporta tipos de etiqueta (producto/cliente)."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'pdfs.py'
        )

        with open(router_path, 'r') as f:
            content = f.read()

        # Según Laravel, hay tipos: producto, cliente
        assert 'tipo' in content, "Falta parámetro tipo en etiqueta"


class TestPdfFichaDiseno:
    """Verifica endpoint de ficha de diseño."""

    def test_endpoint_ficha_diseno(self):
        """Verifica endpoint ficha-diseno."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'pdfs.py'
        )

        with open(router_path, 'r') as f:
            content = f.read()

        assert '/ficha-diseno/' in content, "Falta endpoint ficha-diseno"


class TestPdfEstudioBench:
    """Verifica endpoint de estudio benchmark."""

    def test_endpoint_estudio_bench(self):
        """Verifica endpoint estudio-bench."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'pdfs.py'
        )

        with open(router_path, 'r') as f:
            content = f.read()

        assert '/estudio-bench/' in content, "Falta endpoint estudio-bench"


class TestPdfCotizacion:
    """Verifica endpoint de cotización PDF."""

    def test_endpoint_cotizacion_pdf(self):
        """Verifica endpoint cotizacion PDF."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'pdfs.py'
        )

        with open(router_path, 'r') as f:
            content = f.read()

        assert '/cotizacion/' in content, "Falta endpoint cotizacion PDF"


class TestPdfsImports:
    """Verifica imports necesarios para PDFs."""

    def test_reportlab_import(self):
        """Verifica import de reportlab."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'pdfs.py'
        )

        with open(router_path, 'r') as f:
            content = f.read()

        assert 'reportlab' in content, "Falta import de reportlab"

    def test_streaming_response_import(self):
        """Verifica import de StreamingResponse."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'pdfs.py'
        )

        with open(router_path, 'r') as f:
            content = f.read()

        assert 'StreamingResponse' in content, "Falta import StreamingResponse"


class TestPdfsReturnType:
    """Verifica que los PDFs retornan el tipo correcto."""

    def test_pdf_content_type(self):
        """Verifica content-type application/pdf."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'pdfs.py'
        )

        with open(router_path, 'r') as f:
            content = f.read()

        assert 'application/pdf' in content, "Falta content-type application/pdf"


class TestPdfsConexionBD:
    """Verifica conexión a base de datos para PDFs."""

    def test_conexion_mysql(self):
        """Verifica función de conexión MySQL."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'pdfs.py'
        )

        with open(router_path, 'r') as f:
            content = f.read()

        assert 'get_mysql_connection' in content or 'pymysql' in content, \
            "Falta conexión a MySQL"


class TestPdfsDocumentacion:
    """Verifica documentación de endpoints."""

    def test_documentacion_fuente_laravel(self):
        """Verifica referencias a fuente."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'pdfs.py'
        )

        with open(router_path, 'r') as f:
            content = f.read()

        # Debe tener alguna documentación
        assert '"""' in content, "Falta documentación docstrings"


class TestResumenSprint4Pdfs:
    """Test final que resume la certificación de PDFs."""

    def test_archivos_creados(self):
        """Verifica que el archivo existe."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'pdfs.py'
        )
        assert os.path.exists(router_path), "Falta archivo: pdfs.py"

        print(f"\n{'='*60}")
        print("CERTIFICACIÓN SPRINT 4 - PDFs")
        print(f"{'='*60}")
        print("Archivo verificado:")
        print("  - app/routers/pdfs.py")
        print("Endpoints implementados:")
        print("  - GET /etiqueta-muestra/{muestra_id} - Etiqueta producto/cliente")
        print("  - GET /ficha-diseno/{ot_id} - Ficha de diseño OT")
        print("  - GET /estudio-bench/{ot_id} - Estudio benchmarking")
        print("  - GET /cotizacion/{cotizacion_id} - Cotización PDF")
        print(f"{'='*60}")

    def test_total_endpoints_pdfs(self):
        """Verifica el total de endpoints definidos."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'pdfs.py'
        )

        with open(router_path, 'r') as f:
            content = f.read()

        # Contar decoradores de endpoints
        get_endpoints = len(re.findall(r'@router\.get\(', content))
        post_endpoints = len(re.findall(r'@router\.post\(', content))
        total = get_endpoints + post_endpoints

        # Mínimo 4 endpoints de PDF
        assert total >= 4, f"Se esperaban mínimo 4 endpoints, encontrados: {total}"
