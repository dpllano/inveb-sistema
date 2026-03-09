"""
Tests de Certificación Sprint 1.2: Excel SAP
=============================================

Verifica que los endpoints de exportación Excel SAP están correctamente definidos.

Fuente Laravel: WorkOrderExcelController.php (3,319 líneas)
"""
import pytest
import os


class TestExcelSapGeneratorExists:
    """Verifica que el servicio de generación Excel SAP existe."""

    def test_archivo_excel_sap_generator_existe(self):
        """Verifica que el archivo excel_sap_generator.py existe."""
        generator_path = os.path.join(
            os.path.dirname(__file__), '..', 'services', 'excel_sap_generator.py'
        )
        assert os.path.exists(generator_path), "excel_sap_generator.py no existe"

    def test_import_funciones_principales(self):
        """Verifica que se pueden importar las funciones principales."""
        from services.excel_sap_generator import (
            generar_excel_sap,
            generar_excel_sap_semielaborado,
            generar_reporte_excel_ot,
            format_decimal_sap,
            get_sap_data_from_ot
        )

        assert callable(generar_excel_sap)
        assert callable(generar_excel_sap_semielaborado)
        assert callable(generar_reporte_excel_ot)
        assert callable(format_decimal_sap)
        assert callable(get_sap_data_from_ot)


class TestExcelSapRouterExists:
    """Verifica que el router de Excel SAP existe."""

    def test_archivo_router_existe(self):
        """Verifica que el archivo work_order_excel.py existe."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'work_order_excel.py'
        )
        assert os.path.exists(router_path), "work_order_excel.py no existe"

    def test_endpoints_definidos_en_codigo(self):
        """Verifica que los 3 endpoints están definidos."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'app', 'routers', 'work_order_excel.py'
        )

        with open(router_path, 'r') as f:
            content = f.read()

        # Verificar endpoints
        assert '/{ot_id}/excel-sap"' in content, "Falta endpoint excel-sap"
        assert '/{ot_id}/excel-sap-semielaborado"' in content, "Falta endpoint excel-sap-semielaborado"
        assert '/{ot_id}/reporte-excel"' in content, "Falta endpoint reporte-excel"


class TestFormatDecimalSap:
    """Verifica la función de formateo decimal para SAP."""

    def test_formato_basico(self):
        """Formato decimal básico."""
        from services.excel_sap_generator import format_decimal_sap

        result = format_decimal_sap(123.4567)
        assert ',' in result  # Usa coma como separador decimal

    def test_formato_con_4_decimales(self):
        """Verifica que genera 4 decimales por defecto."""
        from services.excel_sap_generator import format_decimal_sap

        result = format_decimal_sap(123.4)
        # Debe tener 4 decimales
        parts = result.split(',')
        assert len(parts) == 2
        assert len(parts[1]) == 4

    def test_valor_none_retorna_na(self):
        """Valor None retorna N/A."""
        from services.excel_sap_generator import format_decimal_sap

        assert format_decimal_sap(None) == 'N/A'

    def test_valor_vacio_retorna_na(self):
        """Valor vacío retorna N/A."""
        from services.excel_sap_generator import format_decimal_sap

        assert format_decimal_sap('') == 'N/A'
        assert format_decimal_sap('N/A') == 'N/A'


class TestCamposSap:
    """Verifica la estructura de campos SAP."""

    def test_campos_principales_definidos(self):
        """Verifica que los campos principales SAP están definidos."""
        router_path = os.path.join(
            os.path.dirname(__file__), '..', 'services', 'excel_sap_generator.py'
        )

        with open(router_path, 'r') as f:
            content = f.read()

        # Campos SAP obligatorios según Laravel
        campos_obligatorios = [
            'MATNR',  # Número de Material
            'MAKTX',  # Descripción Comercial
            'WERKS',  # Centro
            'LGORT',  # Almacén
            'BRGEW',  # Peso bruto
            'NTGEW',  # Peso neto
            'VOLUM',  # Volumen
            'EN_OT',  # Numero OT
            'EN_LARGO',  # Largo Interior
            'EN_ANCHO',  # Ancho Interior
            'EN_ALTO',  # Alto Interior
            'EN_CARTON',  # Cartón
        ]

        for campo in campos_obligatorios:
            assert f'"{campo}"' in content, f"Falta campo SAP: {campo}"


class TestResumenSprint12:
    """Test final que resume la certificación del Sprint 1.2."""

    def test_archivos_creados(self):
        """Verifica que todos los archivos del Sprint 1.2 fueron creados."""
        archivos = [
            ('services', 'excel_sap_generator.py'),
            ('app/routers', 'work_order_excel.py'),
        ]

        for carpeta, archivo in archivos:
            path = os.path.join(
                os.path.dirname(__file__), '..', carpeta, archivo
            )
            assert os.path.exists(path), f"Falta archivo: {carpeta}/{archivo}"

        print(f"\n{'='*60}")
        print("CERTIFICACIÓN SPRINT 1.2 - RESUMEN")
        print(f"{'='*60}")
        print("Archivos creados:")
        print("  - services/excel_sap_generator.py")
        print("  - app/routers/work_order_excel.py")
        print("Endpoints implementados:")
        print("  - GET /{ot_id}/excel-sap")
        print("  - GET /{ot_id}/excel-sap-semielaborado")
        print("  - GET /{ot_id}/reporte-excel")
        print(f"{'='*60}")

    def test_total_funciones_generador(self):
        """Verifica el total de funciones en el generador."""
        generator_path = os.path.join(
            os.path.dirname(__file__), '..', 'services', 'excel_sap_generator.py'
        )

        with open(generator_path, 'r') as f:
            content = f.read()

        import re
        funciones = re.findall(r'^def \w+', content, re.MULTILINE)

        # Mínimo 5 funciones principales
        assert len(funciones) >= 5, f"Se esperaban mínimo 5 funciones, encontradas: {len(funciones)}"
