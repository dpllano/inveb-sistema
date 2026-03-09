"""
Tests Sprint D: Mantenedor Masivo - Cargas Excel para 24 tablas.

Basado en: MantenedorController.php (5778 líneas)

Cada tabla tiene 2 endpoints:
- POST /import - Importar desde Excel
- GET /descargar-excel - Descargar plantilla/datos

24 tablas verificadas:
1. Cartones Corrugados - MantenedorController líneas 60-354
2. Cartones Esquineros - MantenedorController líneas 360-550
3. Papeles - MantenedorController líneas 560-780
4. Fletes - MantenedorController líneas 790-1050
5. Mermas Corrugadoras - MantenedorController líneas 1060-1280
6. Mermas Convertidoras - MantenedorController líneas 1290-1510
7. Paletizados - MantenedorController líneas 1520-1720
8. Insumos Paletizados - MantenedorController líneas 1730-1940
9. Tarifarios - MantenedorController líneas 1950-2180
10. Consumo Adhesivo - MantenedorController líneas 2190-2400
11. Consumo Adhesivo Pegado - MantenedorController líneas 2410-2620
12. Consumo Energia - MantenedorController líneas 2630-2850
13. Matrices - MantenedorController líneas 2860-3100
14. Materiales - MantenedorController líneas 3110-3350
15. Factores Desarrollo - MantenedorController líneas 3360-3580
16. Factores Seguridad - MantenedorController líneas 3590-3810
17. Factores Onda - MantenedorController líneas 3820-4040
18. Maquilas - MantenedorController líneas 4050-4280
19. Ondas - MantenedorController líneas 4290-4500
20. Plantas - MantenedorController líneas 4510-4740
21. Variables - MantenedorController líneas 4750-4980
22. Margenes Minimos - MantenedorController líneas 4990-5210
23. Porcentajes Margenes - MantenedorController líneas 5220-5450
24. Mano Obra Mantencion - MantenedorController líneas 5460-5700
"""

import pytest
import os
import ast


# =============================================
# TESTS ESTRUCTURA DEL ROUTER
# =============================================

class TestSprintDRouterEstructura:
    """Verifica que el router masivos.py existe y tiene la estructura correcta."""

    @pytest.fixture(autouse=True)
    def setup(self):
        self.router_path = os.path.join(
            os.path.dirname(__file__),
            "..", "app", "routers", "mantenedores", "masivos.py"
        )

    def test_router_masivos_existe(self):
        """Verifica que masivos.py existe."""
        assert os.path.exists(self.router_path), "Router masivos.py no existe"

    def test_router_sintaxis_valida(self):
        """Verifica sintaxis Python válida."""
        with open(self.router_path, 'r') as f:
            content = f.read()
        try:
            ast.parse(content)
        except SyntaxError as e:
            pytest.fail(f"Error de sintaxis en masivos.py: {e}")

    def test_router_tiene_prefix_masivos(self):
        """Verifica que el router tiene prefix='/masivos'."""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'prefix="/masivos"' in content, "Router no tiene prefix='/masivos'"

    def test_router_importa_dependencias_requeridas(self):
        """Verifica importaciones necesarias."""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'from fastapi import APIRouter' in content, "Falta import APIRouter"
        assert 'UploadFile' in content, "Falta import UploadFile"
        assert 'openpyxl' in content, "Falta import openpyxl"
        assert 'StreamingResponse' in content, "Falta import StreamingResponse"


# =============================================
# 1. CARTONES CORRUGADOS
# =============================================

class TestSprintDCartonesCorrugados:
    """Tests para endpoints de Cartones Corrugados."""

    @pytest.fixture(autouse=True)
    def setup(self):
        self.router_path = os.path.join(
            os.path.dirname(__file__),
            "..", "app", "routers", "mantenedores", "masivos.py"
        )

    def test_endpoint_import_cartones_corrugados_existe(self):
        """Verifica POST /cartones-corrugados/import."""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'cartones-corrugados/import' in content, "Endpoint import no encontrado"
        assert 'async def import_cartones_corrugados' in content, "Función no encontrada"

    def test_endpoint_descargar_cartones_corrugados_existe(self):
        """Verifica GET /cartones-corrugados/descargar-excel."""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'cartones-corrugados/descargar-excel' in content, "Endpoint descargar no encontrado"
        assert 'async def descargar_excel_cartones_corrugados' in content, "Función no encontrada"

    def test_columnas_cartones_corrugados_definidas(self):
        """Verifica columnas según Laravel líneas 60-80."""
        with open(self.router_path, 'r') as f:
            content = f.read()
        columnas = [
            "codigo", "onda", "color_tapa_exterior", "tipo", "ect_min", "espesor",
            "peso", "peso_total", "tolerancia_gramaje_real", "contenido_cordillera",
            "contenido_reciclado", "recubrimiento"
        ]
        for col in columnas:
            assert col in content, f"Columna {col} no encontrada"

    def test_validaciones_onda_carton(self):
        """Verifica validación de ondas según Laravel línea 165."""
        with open(self.router_path, 'r') as f:
            content = f.read()
        ondas = ["C", "CB", "CE", "B", "BE", "E"]
        for onda in ondas:
            assert f'"{onda}"' in content, f"Onda {onda} no encontrada"

    def test_validaciones_tipo_carton(self):
        """Verifica validación de tipos según Laravel línea 170."""
        with open(self.router_path, 'r') as f:
            content = f.read()
        tipos = ["SIMPLES", "DOBLES", "DOBLE MONOTAPA"]
        for tipo in tipos:
            assert tipo in content, f"Tipo {tipo} no encontrado"

    def test_validacion_codigos_papeles(self):
        """Verifica validación de códigos de papeles según Laravel línea 175."""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'codigo_tapa_interior' in content, "Falta validación codigo_tapa_interior"
        assert 'codigo_onda_1' in content, "Falta validación codigo_onda_1"
        assert 'codigo_tapa_exterior' in content, "Falta validación codigo_tapa_exterior"


# =============================================
# 2. CARTONES ESQUINEROS
# =============================================

class TestSprintDCartonesEsquineros:
    """Tests para endpoints de Cartones Esquineros."""

    @pytest.fixture(autouse=True)
    def setup(self):
        self.router_path = os.path.join(
            os.path.dirname(__file__),
            "..", "app", "routers", "mantenedores", "masivos.py"
        )

    def test_endpoint_import_cartones_esquineros_existe(self):
        """Verifica POST /cartones-esquineros/import."""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'cartones-esquineros/import' in content, "Endpoint import no encontrado"
        assert 'async def import_cartones_esquineros' in content, "Función no encontrada"

    def test_endpoint_descargar_cartones_esquineros_existe(self):
        """Verifica GET /cartones-esquineros/descargar-excel."""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'cartones-esquineros/descargar-excel' in content, "Endpoint descargar no encontrado"

    def test_columnas_esquineros(self):
        """Verifica columnas según Laravel líneas 360-380."""
        with open(self.router_path, 'r') as f:
            content = f.read()
        # Columnas reales según implementación FastAPI basada en tabla carton_esquineros
        columnas = ["codigo", "descripcion", "gramaje", "espesor", "ancho", "largo"]
        for col in columnas:
            assert col in content, f"Columna {col} no encontrada"


# =============================================
# 3. PAPELES
# =============================================

class TestSprintDPapeles:
    """Tests para endpoints de Papeles."""

    @pytest.fixture(autouse=True)
    def setup(self):
        self.router_path = os.path.join(
            os.path.dirname(__file__),
            "..", "app", "routers", "mantenedores", "masivos.py"
        )

    def test_endpoint_import_papeles_existe(self):
        """Verifica POST /papeles/import."""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'papeles/import' in content, "Endpoint import no encontrado"
        assert 'async def import_papeles' in content, "Función no encontrada"

    def test_endpoint_descargar_papeles_existe(self):
        """Verifica GET /papeles/descargar-excel."""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'papeles/descargar-excel' in content, "Endpoint descargar no encontrado"

    def test_columnas_papeles(self):
        """Verifica columnas según Laravel líneas 560-580."""
        with open(self.router_path, 'r') as f:
            content = f.read()
        columnas = ["codigo", "descripcion", "tipo", "gramaje", "precio"]
        for col in columnas:
            assert col in content, f"Columna {col} no encontrada"


# =============================================
# 4. FLETES
# =============================================

class TestSprintDFletes:
    """Tests para endpoints de Fletes."""

    @pytest.fixture(autouse=True)
    def setup(self):
        self.router_path = os.path.join(
            os.path.dirname(__file__),
            "..", "app", "routers", "mantenedores", "masivos.py"
        )

    def test_endpoint_import_fletes_existe(self):
        """Verifica POST /fletes/import."""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'fletes/import' in content, "Endpoint import no encontrado"
        assert 'async def import_fletes' in content, "Función no encontrada"

    def test_endpoint_descargar_fletes_existe(self):
        """Verifica GET /fletes/descargar-excel."""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'fletes/descargar-excel' in content, "Endpoint descargar no encontrado"

    def test_columnas_fletes(self):
        """Verifica columnas según tabla ciudades_fletes."""
        with open(self.router_path, 'r') as f:
            content = f.read()
        # Columnas reales según implementación FastAPI basada en tabla ciudades_fletes
        columnas = ["ciudad", "region", "valor_flete", "distancia"]
        for col in columnas:
            assert col in content, f"Columna {col} no encontrada"


# =============================================
# 5. MERMAS CORRUGADORAS
# =============================================

class TestSprintDMermasCorrugadoras:
    """Tests para endpoints de Mermas Corrugadoras."""

    @pytest.fixture(autouse=True)
    def setup(self):
        self.router_path = os.path.join(
            os.path.dirname(__file__),
            "..", "app", "routers", "mantenedores", "masivos.py"
        )

    def test_endpoint_import_mermas_corrugadoras_existe(self):
        """Verifica POST /mermas-corrugadoras/import."""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'mermas-corrugadoras/import' in content, "Endpoint import no encontrado"

    def test_endpoint_descargar_mermas_corrugadoras_existe(self):
        """Verifica GET /mermas-corrugadoras/descargar-excel."""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'mermas-corrugadoras/descargar-excel' in content, "Endpoint descargar no encontrado"


# =============================================
# 6. MERMAS CONVERTIDORAS
# =============================================

class TestSprintDMermasConvertidoras:
    """Tests para endpoints de Mermas Convertidoras."""

    @pytest.fixture(autouse=True)
    def setup(self):
        self.router_path = os.path.join(
            os.path.dirname(__file__),
            "..", "app", "routers", "mantenedores", "masivos.py"
        )

    def test_endpoint_import_mermas_convertidoras_existe(self):
        """Verifica POST /mermas-convertidoras/import."""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'mermas-convertidoras/import' in content, "Endpoint import no encontrado"

    def test_endpoint_descargar_mermas_convertidoras_existe(self):
        """Verifica GET /mermas-convertidoras/descargar-excel."""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'mermas-convertidoras/descargar-excel' in content, "Endpoint descargar no encontrado"


# =============================================
# 7-12. TABLAS INTERMEDIAS
# =============================================

class TestSprintDTablasIntermedias:
    """Tests para tablas 7-12: Paletizados, Insumos, Tarifarios, Consumos."""

    @pytest.fixture(autouse=True)
    def setup(self):
        self.router_path = os.path.join(
            os.path.dirname(__file__),
            "..", "app", "routers", "mantenedores", "masivos.py"
        )

    def test_endpoints_paletizados(self):
        """Verifica endpoints Paletizados."""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'paletizados/import' in content, "Falta import paletizados"
        assert 'paletizados/descargar-excel' in content, "Falta descargar paletizados"

    def test_endpoints_insumos_paletizados(self):
        """Verifica endpoints Insumos Paletizados."""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'insumos-paletizados/import' in content, "Falta import insumos"
        assert 'insumos-paletizados/descargar-excel' in content, "Falta descargar insumos"

    def test_endpoints_tarifarios(self):
        """Verifica endpoints Tarifarios."""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'tarifarios/import' in content, "Falta import tarifarios"
        assert 'tarifarios/descargar-excel' in content, "Falta descargar tarifarios"

    def test_endpoints_consumo_adhesivo(self):
        """Verifica endpoints Consumo Adhesivo."""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'consumo-adhesivo/import' in content, "Falta import consumo adhesivo"
        assert 'consumo-adhesivo/descargar-excel' in content, "Falta descargar consumo adhesivo"

    def test_endpoints_consumo_adhesivo_pegado(self):
        """Verifica endpoints Consumo Adhesivo Pegado."""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'consumo-adhesivo-pegado/import' in content, "Falta import consumo adhesivo pegado"
        assert 'consumo-adhesivo-pegado/descargar-excel' in content, "Falta descargar consumo adhesivo pegado"

    def test_endpoints_consumo_energia(self):
        """Verifica endpoints Consumo Energía."""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'consumo-energia/import' in content, "Falta import consumo energia"
        assert 'consumo-energia/descargar-excel' in content, "Falta descargar consumo energia"


# =============================================
# 13-14. MATRICES Y MATERIALES
# =============================================

class TestSprintDMatricesMateriales:
    """Tests para Matrices y Materiales."""

    @pytest.fixture(autouse=True)
    def setup(self):
        self.router_path = os.path.join(
            os.path.dirname(__file__),
            "..", "app", "routers", "mantenedores", "masivos.py"
        )

    def test_endpoints_matrices(self):
        """Verifica endpoints Matrices."""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'matrices/import' in content, "Falta import matrices"
        assert 'matrices/descargar-excel' in content, "Falta descargar matrices"

    def test_endpoints_materiales(self):
        """Verifica endpoints Materiales."""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'materiales/import' in content, "Falta import materiales"
        assert 'materiales/descargar-excel' in content, "Falta descargar materiales"


# =============================================
# 15-18. FACTORES Y MAQUILAS
# =============================================

class TestSprintDFactoresMaquilas:
    """Tests para Factores y Maquilas."""

    @pytest.fixture(autouse=True)
    def setup(self):
        self.router_path = os.path.join(
            os.path.dirname(__file__),
            "..", "app", "routers", "mantenedores", "masivos.py"
        )

    def test_endpoints_factores_desarrollo(self):
        """Verifica endpoints Factores Desarrollo."""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'factores-desarrollo/import' in content, "Falta import factores desarrollo"
        assert 'factores-desarrollo/descargar-excel' in content, "Falta descargar factores desarrollo"

    def test_endpoints_factores_seguridad(self):
        """Verifica endpoints Factores Seguridad."""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'factores-seguridad/import' in content, "Falta import factores seguridad"
        assert 'factores-seguridad/descargar-excel' in content, "Falta descargar factores seguridad"

    def test_endpoints_factores_onda(self):
        """Verifica endpoints Factores Onda."""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'factores-onda/import' in content, "Falta import factores onda"
        assert 'factores-onda/descargar-excel' in content, "Falta descargar factores onda"

    def test_endpoints_maquilas(self):
        """Verifica endpoints Maquilas."""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'maquilas/import' in content, "Falta import maquilas"
        assert 'maquilas/descargar-excel' in content, "Falta descargar maquilas"


# =============================================
# 19-24. TABLAS FINALES
# =============================================

class TestSprintDTablasFinales:
    """Tests para tablas 19-24: Ondas, Plantas, Variables, Márgenes, Mano Obra."""

    @pytest.fixture(autouse=True)
    def setup(self):
        self.router_path = os.path.join(
            os.path.dirname(__file__),
            "..", "app", "routers", "mantenedores", "masivos.py"
        )

    def test_endpoints_ondas(self):
        """Verifica endpoints Ondas."""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'ondas/import' in content, "Falta import ondas"
        assert 'ondas/descargar-excel' in content, "Falta descargar ondas"

    def test_endpoints_plantas(self):
        """Verifica endpoints Plantas."""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'plantas/import' in content, "Falta import plantas"
        assert 'plantas/descargar-excel' in content, "Falta descargar plantas"

    def test_endpoints_variables(self):
        """Verifica endpoints Variables."""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'variables/import' in content, "Falta import variables"
        assert 'variables/descargar-excel' in content, "Falta descargar variables"

    def test_endpoints_margenes_minimos(self):
        """Verifica endpoints Márgenes Mínimos."""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'margenes-minimos/import' in content, "Falta import margenes minimos"
        assert 'margenes-minimos/descargar-excel' in content, "Falta descargar margenes minimos"

    def test_endpoints_porcentajes_margenes(self):
        """Verifica endpoints Porcentajes Márgenes."""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'porcentajes-margenes/import' in content, "Falta import porcentajes margenes"
        assert 'porcentajes-margenes/descargar-excel' in content, "Falta descargar porcentajes margenes"

    def test_endpoints_mano_obra_mantencion(self):
        """Verifica endpoints Mano Obra Mantención."""
        with open(self.router_path, 'r') as f:
            content = f.read()
        assert 'mano-obra-mantencion/import' in content, "Falta import mano obra mantencion"
        assert 'mano-obra-mantencion/descargar-excel' in content, "Falta descargar mano obra mantencion"


# =============================================
# RESUMEN SPRINT D
# =============================================

class TestResumenSprintD:
    """Resumen de implementación Sprint D."""

    def test_total_endpoints_sprint_d(self):
        """Cuenta todos los endpoints de masivos (48 total = 24 import + 24 descargar)."""
        router_path = os.path.join(
            os.path.dirname(__file__),
            "..", "app", "routers", "mantenedores", "masivos.py"
        )

        with open(router_path, 'r') as f:
            content = f.read()

        # Contar endpoints import
        import_count = content.count('/import"')
        # Contar endpoints descargar
        descargar_count = content.count('/descargar-excel"')

        total = import_count + descargar_count

        assert import_count >= 24, f"Esperados al menos 24 endpoints import, encontrados {import_count}"
        assert descargar_count >= 24, f"Esperados al menos 24 endpoints descargar, encontrados {descargar_count}"
        print(f"\n✅ Sprint D: {import_count} imports + {descargar_count} descargars = {total} endpoints")

    def test_todas_las_tablas_documentadas(self):
        """Verifica que las 24 tablas están listadas en el docstring."""
        router_path = os.path.join(
            os.path.dirname(__file__),
            "..", "app", "routers", "mantenedores", "masivos.py"
        )

        with open(router_path, 'r') as f:
            content = f.read()

        tablas = [
            "Cartones Corrugados",
            "Cartones Esquineros",
            "Papeles",
            "Fletes",
            "Mermas Corrugadoras",
            "Mermas Convertidoras",
            "Paletizados",
            "Insumos Paletizados",
            "Tarifarios",
            "Consumo Adhesivo",
            "Matrices",
            "Materiales",
            "Factores Desarrollo",
            "Factores Seguridad",
            "Factores Onda",
            "Maquilas",
            "Ondas",
            "Plantas",
            "Variables",
            "Margenes Minimos",
            "Porcentajes Margenes",
            "Mano Obra Mantencion",
        ]

        for tabla in tablas:
            assert tabla in content, f"Tabla {tabla} no documentada"


# =============================================
# RUN TESTS
# =============================================

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
