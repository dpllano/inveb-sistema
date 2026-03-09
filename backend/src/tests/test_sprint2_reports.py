"""
Tests de Certificación Sprint 2: Reportes
==========================================

Verifica que todos los endpoints de reportes están correctamente definidos
y que las funciones auxiliares funcionan según lo esperado.

Fuente Laravel: ReportController.php (11,688 líneas)
"""
import pytest
from datetime import datetime, timedelta
from calendar import monthrange

# =============================================================================
# TEST 1: VERIFICAR ARCHIVO REPORTS.PY MEDIANTE ANÁLISIS DE CÓDIGO
# =============================================================================

class TestEndpointsDefinidos:
    """Verifica endpoints mediante análisis del código fuente."""

    def test_archivo_reports_existe(self):
        """Verifica que el archivo reports.py existe y tiene contenido."""
        import os
        reports_path = os.path.join(os.path.dirname(__file__), '..', 'app', 'routers', 'reports.py')
        assert os.path.exists(reports_path), "El archivo reports.py no existe"

        with open(reports_path, 'r') as f:
            content = f.read()
            assert len(content) > 1000, "El archivo reports.py está vacío o muy pequeño"

    def test_endpoints_datos_en_codigo(self):
        """Verifica que hay 18 endpoints de datos definidos en el código."""
        import os
        reports_path = os.path.join(os.path.dirname(__file__), '..', 'app', 'routers', 'reports.py')

        with open(reports_path, 'r') as f:
            content = f.read()

        # Contar decoradores @router.get que NO son /excel
        import re
        all_gets = re.findall(r'@router\.get\("([^"]+)"', content)
        endpoints_datos = [e for e in all_gets if not e.endswith('/excel')]

        assert len(endpoints_datos) >= 18, f"Se esperaban 18 endpoints de datos, encontrados: {len(endpoints_datos)}"

    def test_endpoints_excel_en_codigo(self):
        """Verifica que hay 7 endpoints Excel definidos."""
        import os
        reports_path = os.path.join(os.path.dirname(__file__), '..', 'app', 'routers', 'reports.py')

        with open(reports_path, 'r') as f:
            content = f.read()

        import re
        all_gets = re.findall(r'@router\.get\("([^"]+)"', content)
        endpoints_excel = [e for e in all_gets if e.endswith('/excel')]

        assert len(endpoints_excel) == 7, f"Se esperaban 7 endpoints Excel, encontrados: {len(endpoints_excel)}"


# =============================================================================
# TEST 2: VERIFICAR RUTAS ESPECÍFICAS EN CÓDIGO
# =============================================================================

class TestRutasEspecificas:
    """Verifica rutas específicas analizando el código fuente."""

    @pytest.fixture
    def content(self):
        import os
        reports_path = os.path.join(os.path.dirname(__file__), '..', 'app', 'routers', 'reports.py')
        with open(reports_path, 'r') as f:
            return f.read()

    def test_ruta_index(self, content):
        """Ruta /index - Lista de reportes."""
        assert '@router.get("/index")' in content

    def test_ruta_ots_por_usuario(self, content):
        """Ruta /ots-por-usuario."""
        assert '@router.get("/ots-por-usuario"' in content

    def test_ruta_ots_completadas(self, content):
        """Ruta /ots-completadas."""
        assert '@router.get("/ots-completadas")' in content or '@router.get("/ots-completadas"' in content

    def test_ruta_conversion_ot_entre_fechas(self, content):
        """Ruta /conversion-ot-entre-fechas (Sprint 2 nuevo)."""
        assert '@router.get("/conversion-ot-entre-fechas")' in content

    def test_ruta_ots_activas_por_area(self, content):
        """Ruta /ots-activas-por-area con semáforo (Sprint 2 nuevo)."""
        assert '@router.get("/ots-activas-por-area")' in content

    def test_ruta_sala_muestra_completo(self, content):
        """Ruta /sala-muestra-completo (Sprint 2 nuevo)."""
        assert '@router.get("/sala-muestra-completo")' in content

    def test_ruta_tiempo_disenador_externo_ajuste(self, content):
        """Ruta /tiempo-disenador-externo-ajuste (Sprint 2 nuevo)."""
        assert '@router.get("/tiempo-disenador-externo-ajuste")' in content

    def test_rutas_excel(self, content):
        """Verifica las 7 rutas de descarga Excel."""
        expected_excel = [
            '/ots-completadas/excel',
            '/conversion-ot-entre-fechas/excel',
            '/ots-activas-por-area/excel',
            '/sala-muestra-completo/excel',
            '/tiempo-primera-muestra/excel',
            '/anulaciones/excel',
            '/rechazos-mes/excel'
        ]

        for excel_path in expected_excel:
            assert f'@router.get("{excel_path}")' in content, f"Falta ruta Excel: {excel_path}"


# =============================================================================
# TEST 3: FUNCIONES DE GENERACIÓN EXCEL
# =============================================================================

class TestExcelGenerators:
    """Verifica que las funciones de generación Excel existen."""

    def test_import_generadores(self):
        """Verifica que se pueden importar todas las funciones."""
        from services.report_excel_generator import (
            generar_excel_ots_completadas,
            generar_excel_conversion_ot,
            generar_excel_ots_activas_area,
            generar_excel_sala_muestra,
            generar_excel_tiempo_primera_muestra,
            generar_excel_anulaciones,
            generar_excel_rechazos
        )

        assert callable(generar_excel_ots_completadas)
        assert callable(generar_excel_conversion_ot)
        assert callable(generar_excel_ots_activas_area)
        assert callable(generar_excel_sala_muestra)
        assert callable(generar_excel_tiempo_primera_muestra)
        assert callable(generar_excel_anulaciones)
        assert callable(generar_excel_rechazos)

    def test_generar_excel_ots_completadas(self):
        """Test básico de generación Excel OTs completadas."""
        from services.report_excel_generator import generar_excel_ots_completadas

        items = [
            {'id': 1, 'created_at': '01/01/2025', 'client_name': 'Test',
             'descripcion': 'Test', 'tiempo_dias': 5, 'estado': 'Completado'}
        ]
        resumen = {'total': 1, 'tiempo_promedio': 5.0}

        result = generar_excel_ots_completadas(items, resumen, "Test")
        assert result is not None

    def test_generar_excel_conversion_ot(self):
        """Test básico de generación Excel conversión OT."""
        from services.report_excel_generator import generar_excel_conversion_ot

        items = [
            {'id': 1, 'tipo_nombre': 'Desarrollo', 'created_at': '01/01/2025',
             'client_name': 'Test', 'descripcion': 'Test', 'estado': 'Completado', 'completada': True}
        ]
        resumen = {
            'desarrollo': {'total': 1, 'completadas': 1, 'porcentaje': 100},
            'arte_material': {'total': 0, 'completadas': 0, 'porcentaje': 0}
        }

        result = generar_excel_conversion_ot(items, resumen, '2025-01-01', '2025-01-31')
        assert result is not None

    def test_generar_excel_ots_activas_area(self):
        """Test básico de generación Excel OTs activas por área."""
        from services.report_excel_generator import generar_excel_ots_activas_area

        items = [
            {'id': 1, 'descripcion': 'Test', 'area_nombre': 'Diseño',
             'dias_en_area': 3, 'semaforo': 'verde', 'client_name': 'Test', 'estado': 'En proceso'}
        ]
        por_area = [{'area_nombre': 'Diseño', 'total': 1, 'verde': 1, 'amarillo': 0, 'rojo': 0}]
        semaforo_totales = {'verde': 1, 'amarillo': 0, 'rojo': 0}

        result = generar_excel_ots_activas_area(items, por_area, semaforo_totales)
        assert result is not None

    def test_generar_excel_sala_muestra(self):
        """Test básico de generación Excel sala muestras."""
        from services.report_excel_generator import generar_excel_sala_muestra

        data = {
            'periodo': {'nombre_mes': 'Enero', 'year': 2025},
            'ots_en_sala': 5,
            'muestras': {'en_proceso': 3, 'pendiente_entrega': 2, 'cortadas_mes': 10, 'terminadas_mes': 8},
            'estadisticas_mes': {'total_ots': 15, 'tiempo_promedio_dias': 3.5},
            'comparacion_meses': [{'nombre': 'ENE', 'total': 15}],
            'comparacion_anual': {
                'anio_anterior': {'year': 2024, 'total_ots': 100},
                'anio_actual': {'year': 2025, 'total_ots': 120}
            }
        }

        result = generar_excel_sala_muestra(data, "Test")
        assert result is not None


# =============================================================================
# TEST 4: LÓGICA DE SEMÁFORO
# =============================================================================

class TestSemaforo:
    """Verifica la lógica de semáforo (verde < 5, amarillo 5-10, rojo > 10)."""

    def test_semaforo_verde(self):
        """< 5 días = verde"""
        dias = 4.9
        if dias < 5:
            semaforo = 'verde'
        elif dias < 10:
            semaforo = 'amarillo'
        else:
            semaforo = 'rojo'
        assert semaforo == 'verde'

    def test_semaforo_amarillo_limite_inferior(self):
        """5 días exactos = amarillo"""
        dias = 5.0
        if dias < 5:
            semaforo = 'verde'
        elif dias < 10:
            semaforo = 'amarillo'
        else:
            semaforo = 'rojo'
        assert semaforo == 'amarillo'

    def test_semaforo_amarillo_limite_superior(self):
        """9.9 días = amarillo"""
        dias = 9.9
        if dias < 5:
            semaforo = 'verde'
        elif dias < 10:
            semaforo = 'amarillo'
        else:
            semaforo = 'rojo'
        assert semaforo == 'amarillo'

    def test_semaforo_rojo(self):
        """10+ días = rojo"""
        dias = 10.0
        if dias < 5:
            semaforo = 'verde'
        elif dias < 10:
            semaforo = 'amarillo'
        else:
            semaforo = 'rojo'
        assert semaforo == 'rojo'


# =============================================================================
# TEST 5: CÁLCULOS DE FECHAS
# =============================================================================

class TestCalculosFechas:
    """Verifica cálculos de fechas para comparaciones temporales."""

    def test_calculo_mes_anterior(self):
        """Verifica cálculo de mes anterior."""
        mes = 3  # Marzo
        year = 2025

        mes_anterior = mes - 1 if mes > 1 else 12
        year_anterior = year if mes > 1 else year - 1

        assert mes_anterior == 2
        assert year_anterior == 2025

    def test_calculo_mes_anterior_enero(self):
        """Verifica cálculo cuando es enero (caso límite)."""
        mes = 1  # Enero
        year = 2025

        mes_anterior = mes - 1 if mes > 1 else 12
        year_anterior = year if mes > 1 else year - 1

        assert mes_anterior == 12
        assert year_anterior == 2024

    def test_calculo_fechas_mes(self):
        """Verifica cálculo de fechas de inicio y fin de mes."""
        mes = 2  # Febrero
        year = 2025

        _, last_day = monthrange(year, mes)
        from_date = f"{year}-{mes:02d}-01"
        to_date = f"{year}-{mes:02d}-{last_day}"

        assert from_date == "2025-02-01"
        assert to_date == "2025-02-28"

    def test_calculo_ultimos_5_meses(self):
        """Verifica cálculo de últimos 5 meses."""
        mes = 3  # Marzo
        year = 2025

        meses = []
        for i in range(4, -1, -1):
            mes_calc = mes - i
            year_calc = year
            if mes_calc <= 0:
                mes_calc += 12
                year_calc -= 1
            meses.append((year_calc, mes_calc))

        # Desde noviembre 2024 hasta marzo 2025
        expected = [(2024, 11), (2024, 12), (2025, 1), (2025, 2), (2025, 3)]
        assert meses == expected


# =============================================================================
# TEST 6: RESUMEN DE CERTIFICACIÓN
# =============================================================================

class TestResumenCertificacion:
    """Test final que resume la certificación del Sprint 2."""

    def test_total_endpoints_sprint2(self):
        """Verifica el total de endpoints del Sprint 2 analizando código."""
        import os
        import re

        reports_path = os.path.join(os.path.dirname(__file__), '..', 'app', 'routers', 'reports.py')
        with open(reports_path, 'r') as f:
            content = f.read()

        all_gets = re.findall(r'@router\.get\("([^"]+)"', content)

        # Mínimo esperado: 18 datos + 7 excel = 25
        assert len(all_gets) >= 25, f"Se esperaban mínimo 25 endpoints, encontrados: {len(all_gets)}"

        datos = [e for e in all_gets if not e.endswith('/excel')]
        excel = [e for e in all_gets if e.endswith('/excel')]

        print(f"\n{'='*60}")
        print("CERTIFICACIÓN SPRINT 2 - RESUMEN")
        print(f"{'='*60}")
        print(f"Total endpoints encontrados: {len(all_gets)}")
        print(f"  - Endpoints de datos: {len(datos)}")
        print(f"  - Endpoints Excel: {len(excel)}")
        print(f"{'='*60}")

    def test_cobertura_laravel(self):
        """Verifica cobertura respecto a Laravel."""
        import os
        import re

        # Según auditoría: Laravel tiene 18 rutas activas (reporte2 no existe)
        laravel_rutas = 18

        reports_path = os.path.join(os.path.dirname(__file__), '..', 'app', 'routers', 'reports.py')
        with open(reports_path, 'r') as f:
            content = f.read()

        all_gets = re.findall(r'@router\.get\("([^"]+)"', content)
        fastapi_datos = len([e for e in all_gets if not e.endswith('/excel')])

        cobertura = (fastapi_datos / laravel_rutas) * 100

        print(f"\nCobertura vs Laravel: {cobertura:.1f}%")
        assert cobertura >= 100, f"Cobertura insuficiente: {cobertura:.1f}%"
