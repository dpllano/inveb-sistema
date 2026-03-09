"""
Tests para Sprint 1.3: Cálculos/Accessors WorkOrder

Estos tests verifican que las fórmulas implementadas coinciden con el comportamiento
del sistema Laravel original.

Fuente Laravel: app/WorkOrder.php líneas 346-880
"""
import pytest
import sys
import os

# Agregar el path de src al sistema
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from services.work_order_calculations import (
    # Constantes
    CONSUMO_TINTA, CONSUMO_ADHESIVO, CONSUMO_CERA,
    CONSUMO_HIDROPELENTE, CONSUMO_BARNIZ_UV,
    # Funciones de área
    calcular_area_hm, calcular_area_hc, calcular_area_hc_semielaborado,
    calcular_area_esquinero,
    # Funciones de dimensiones
    calcular_largura_hc, calcular_anchura_hc,
    # Funciones de peso
    calcular_peso_bruto, calcular_peso_neto, calcular_peso_esquinero,
    # Funciones de volumen
    calcular_volumen_unitario,
    # Funciones de UMA
    calcular_uma_area, calcular_uma_peso,
    # Funciones de consumo
    calcular_consumo_tinta, calcular_consumo_barniz_uv,
    calcular_consumo_color_interno, calcular_consumo_pegado,
    calcular_consumo_cera_interior, calcular_consumo_cera_exterior,
    calcular_consumo_barniz_hidropelente, calcular_gramos_adhesivo,
    # Función de recorte
    calcular_recorte_caracteristico,
    # Función principal
    calcular_todos,
)


# =============================================================================
# Tests de Constantes
# Fuente Laravel: app/WorkOrder.php líneas 19-23
# =============================================================================

class TestConstantes:
    """Verificar que las constantes coinciden con Laravel."""

    def test_consumo_tinta(self):
        """CONSUMO_TINTA = 5 (línea 19)"""
        assert CONSUMO_TINTA == 5

    def test_consumo_adhesivo(self):
        """CONSUMO_ADHESIVO = 4 (línea 20)"""
        assert CONSUMO_ADHESIVO == 4

    def test_consumo_cera(self):
        """CONSUMO_CERA = 28 (línea 21)"""
        assert CONSUMO_CERA == 28

    def test_consumo_hidropelente(self):
        """CONSUMO_HIDROPELENTE = 25 (línea 22)"""
        assert CONSUMO_HIDROPELENTE == 25

    def test_consumo_barniz_uv(self):
        """CONSUMO_BARNIZ_UV = 20 (línea 23)"""
        assert CONSUMO_BARNIZ_UV == 20


# =============================================================================
# Tests de Área HM
# Fuente Laravel: app/WorkOrder.php líneas 346-350
# =============================================================================

class TestAreaHM:
    """Tests para calcular_area_hm."""

    def test_calculo_basico(self):
        """Fórmula: (largura_hm * anchura_hm) / 1000000"""
        # Ejemplo: 1000mm x 500mm = 0.5 m²
        resultado = calcular_area_hm(1000, 500)
        assert resultado == 0.5

    def test_valores_reales(self):
        """Test con valores típicos de producción."""
        # 800mm x 600mm = 0.48 m²
        resultado = calcular_area_hm(800, 600)
        assert resultado == 0.48

    def test_sin_largura(self):
        """Retorna N/A si falta largura."""
        assert calcular_area_hm(None, 500) == "N/A"

    def test_sin_anchura(self):
        """Retorna N/A si falta anchura."""
        assert calcular_area_hm(1000, None) == "N/A"

    def test_valor_cero(self):
        """Retorna 0 si algún valor es cero."""
        resultado = calcular_area_hm(0, 500)
        assert resultado == 0


# =============================================================================
# Tests de Área HC
# Fuente Laravel: app/WorkOrder.php líneas 351-359
# =============================================================================

class TestAreaHC:
    """Tests para calcular_area_hc."""

    def test_calculo_basico(self):
        """Fórmula: (largura_hc * anchura_hc / 1000000) / (golpes_largo * golpes_ancho)"""
        # 1000mm x 500mm / (2 * 2) = 0.125 m²
        resultado = calcular_area_hc(1000, 500, 2, 2)
        assert resultado == 0.125

    def test_sin_golpes(self):
        """Retorna N/A si faltan golpes."""
        assert calcular_area_hc(1000, 500, None, 2) == "N/A"
        assert calcular_area_hc(1000, 500, 2, None) == "N/A"

    def test_largura_na(self):
        """Retorna N/A si largura es N/A."""
        assert calcular_area_hc("N/A", 500, 2, 2) == "N/A"


# =============================================================================
# Tests de Largura HC
# Fuente Laravel: app/WorkOrder.php líneas 374-446
# =============================================================================

class TestLarguraHC:
    """Tests para calcular_largura_hc."""

    def test_proceso_corrugado(self):
        """CORRUGADO: largura_hc = largura_hm"""
        resultado = calcular_largura_hc(
            largura_hm=800,
            golpes_largo=2,
            tipo_carton="SIMPLES",
            proceso="CORRUGADO"
        )
        assert resultado == 800

    def test_proceso_sin_proceso(self):
        """S/PROCESO: largura_hc = largura_hm * golpes_largo"""
        resultado = calcular_largura_hc(
            largura_hm=400,
            golpes_largo=3,
            tipo_carton="SIMPLES",
            proceso="S/PROCESO"
        )
        assert resultado == 1200  # 400 * 3

    def test_diecutter_carton_simple(self):
        """DIECUTTER + cartón simple: suma = 20"""
        # (400 * 2) + ((2-1) * 5) + 20 = 800 + 5 + 20 = 825
        resultado = calcular_largura_hc(
            largura_hm=400,
            golpes_largo=2,
            tipo_carton="SIMPLES",
            proceso="DIECUTTER",
            separacion_golpes_largo=5
        )
        assert resultado == 825

    def test_diecutter_carton_doble(self):
        """DIECUTTER + cartón doble: suma = 25"""
        # (400 * 2) + ((2-1) * 5) + 25 = 800 + 5 + 25 = 830
        resultado = calcular_largura_hc(
            largura_hm=400,
            golpes_largo=2,
            tipo_carton="DOBLES",
            proceso="DIECUTTER",
            separacion_golpes_largo=5
        )
        assert resultado == 830

    def test_offset(self):
        """OFFSET: suma = 24"""
        # (400 * 2) + ((2-1) * 0) + 24 = 800 + 0 + 24 = 824
        resultado = calcular_largura_hc(
            largura_hm=400,
            golpes_largo=2,
            tipo_carton="SIMPLES",
            proceso="OFFSET"
        )
        assert resultado == 824

    def test_otros_procesos(self):
        """Otros procesos: suma = 10"""
        # (400 * 2) + ((2-1) * 0) + 10 = 800 + 0 + 10 = 810
        resultado = calcular_largura_hc(
            largura_hm=400,
            golpes_largo=2,
            tipo_carton="SIMPLES",
            proceso="FLEXO"
        )
        assert resultado == 810

    def test_sin_datos(self):
        """Retorna N/A si faltan datos necesarios."""
        assert calcular_largura_hc(None, 2, "SIMPLES", "DIECUTTER") == "N/A"
        assert calcular_largura_hc(400, None, "SIMPLES", "DIECUTTER") == "N/A"
        assert calcular_largura_hc(400, 2, None, "DIECUTTER") == "N/A"
        assert calcular_largura_hc(400, 2, "SIMPLES", None) == "N/A"


# =============================================================================
# Tests de Anchura HC
# Fuente Laravel: app/WorkOrder.php líneas 447-516
# =============================================================================

class TestAnchuraHC:
    """Tests para calcular_anchura_hc."""

    def test_proceso_corrugado(self):
        """CORRUGADO: anchura_hc = anchura_hm"""
        resultado = calcular_anchura_hc(
            anchura_hm=600,
            golpes_ancho=2,
            tipo_carton="SIMPLES",
            proceso="CORRUGADO"
        )
        assert resultado == 600

    def test_diecutter_carton_simple(self):
        """DIECUTTER + cartón simple: suma = 20"""
        # (300 * 2) + ((2-1) * 5) + 20 = 600 + 5 + 20 = 625
        resultado = calcular_anchura_hc(
            anchura_hm=300,
            golpes_ancho=2,
            tipo_carton="SIMPLES",
            proceso="DIECUTTER",
            separacion_golpes_ancho=5
        )
        assert resultado == 625

    def test_otros_procesos_suma_cero(self):
        """Otros procesos sin DIECUTTER/OFFSET: suma = 0"""
        # (300 * 2) + ((2-1) * 0) + 0 = 600 + 0 + 0 = 600
        resultado = calcular_anchura_hc(
            anchura_hm=300,
            golpes_ancho=2,
            tipo_carton="SIMPLES",
            proceso="FLEXO"
        )
        assert resultado == 600


# =============================================================================
# Tests de Pesos
# Fuente Laravel: app/WorkOrder.php líneas 553-580
# =============================================================================

class TestPesos:
    """Tests para cálculos de peso."""

    def test_peso_bruto(self):
        """Fórmula: area_hc * gramaje / 1000"""
        # 0.5 m² * 400 g/m² / 1000 = 0.2 kg
        resultado = calcular_peso_bruto(0.5, 400)
        assert resultado == 0.2

    def test_peso_neto(self):
        """Fórmula: area_producto * gramaje / 1000"""
        # 0.4 m² * 400 g/m² / 1000 = 0.16 kg
        resultado = calcular_peso_neto(0.4, 400)
        assert resultado == 0.16

    def test_peso_esquinero(self):
        """Fórmula: largura_hm * gramaje / 1000000"""
        # 800mm * 400 g/m² / 1000000 = 0.32 kg
        resultado = calcular_peso_esquinero(800, 400)
        assert resultado == 0.32

    def test_peso_bruto_sin_area(self):
        """Retorna N/A si falta área."""
        assert calcular_peso_bruto(None, 400) == "N/A"
        assert calcular_peso_bruto("N/A", 400) == "N/A"


# =============================================================================
# Tests de Volumen
# Fuente Laravel: app/WorkOrder.php líneas 581-598
# =============================================================================

class TestVolumen:
    """Tests para cálculo de volumen."""

    def test_volumen_unitario(self):
        """Fórmula: (largura_hc * anchura_hc * espesor / (golpes_largo * golpes_ancho)) / 1000"""
        # (1000 * 500 * 3 / (2 * 2)) / 1000 = (1500000 / 4) / 1000 = 375 cm³
        resultado = calcular_volumen_unitario(1000, 500, 3, 2, 2)
        assert resultado == 375

    def test_volumen_sin_espesor(self):
        """Retorna N/A si falta espesor."""
        assert calcular_volumen_unitario(1000, 500, None, 2, 2) == "N/A"


# =============================================================================
# Tests de UMA
# Fuente Laravel: app/WorkOrder.php líneas 600-617
# =============================================================================

class TestUMA:
    """Tests para cálculos de UMA."""

    def test_uma_area(self):
        """Fórmula: area_hc * 1000"""
        resultado = calcular_uma_area(0.125)
        assert resultado == 125

    def test_uma_peso(self):
        """Fórmula: peso_bruto * 1000"""
        resultado = calcular_uma_peso(0.2)
        assert resultado == 200


# =============================================================================
# Tests de Consumos
# Fuente Laravel: app/WorkOrder.php líneas 618-755
# =============================================================================

class TestConsumos:
    """Tests para cálculos de consumo."""

    def test_consumo_tinta(self):
        """Fórmula: (area_hm * porcentaje * CONSUMO_TINTA / 100) * (golpes_largo * golpes_ancho)"""
        # (0.5 * 80 * 5 / 100) * (2 * 2) = 2 * 4 = 8
        resultado = calcular_consumo_tinta(0.5, 80, 2, 2)
        assert resultado == 8

    def test_consumo_barniz_uv(self):
        """Fórmula: (area_hm * porcentaje * CONSUMO_BARNIZ_UV / 100) * (golpes_largo * golpes_ancho)"""
        # (0.5 * 50 * 20 / 100) * (2 * 2) = 5 * 4 = 20
        resultado = calcular_consumo_barniz_uv(0.5, 50, 2, 2)
        assert resultado == 20

    def test_consumo_color_interno(self):
        """Fórmula: area_hm * porcentaje * CONSUMO_TINTA / 100 (SIN multiplicar por golpes)"""
        # 0.5 * 80 * 5 / 100 = 2
        resultado = calcular_consumo_color_interno(0.5, 80)
        assert resultado == 2

    def test_consumo_pegado(self):
        """Fórmula: (longitud_pegado / 1000) * CONSUMO_ADHESIVO * golpes_largo * golpes_ancho"""
        # (200 / 1000) * 4 * 2 * 2 = 0.2 * 4 * 4 = 3.2
        resultado = calcular_consumo_pegado(200, 2, 2)
        assert resultado == 3.2

    def test_consumo_cera_interior_aplica(self):
        """Solo aplica si coverage_internal_id == 2"""
        # (0.5 * 60 * 28 / 100) * (2 * 2) = 8.4 * 4 = 33.6
        resultado = calcular_consumo_cera_interior(0.5, 60, 2, 2, 2)
        assert resultado == 33.6

    def test_consumo_cera_interior_no_aplica(self):
        """No aplica si coverage_internal_id != 2"""
        resultado = calcular_consumo_cera_interior(0.5, 60, 1, 2, 2)
        assert resultado == "N/A"

    def test_consumo_barniz_hidropelente(self):
        """Fórmula: area_hm * porcentaje * CONSUMO_HIDROPELENTE / 100 (SIN multiplicar por golpes)"""
        # 0.5 * 40 * 25 / 100 = 5
        resultado = calcular_consumo_barniz_hidropelente(0.5, 40)
        assert resultado == 5

    def test_gramos_adhesivo(self):
        """Fórmula: (longitud_pegado / 1000) * CONSUMO_ADHESIVO * (golpes_largo * golpes_ancho)"""
        # (200 / 1000) * 4 * (2 * 2) = 0.2 * 4 * 4 = 3.2
        resultado = calcular_gramos_adhesivo(200, 2, 2)
        assert resultado == 3.2


# =============================================================================
# Tests de Recorte
# Fuente Laravel: app/WorkOrder.php líneas 517-537
# =============================================================================

class TestRecorte:
    """Tests para cálculo de recorte característico."""

    def test_recorte_caracteristico(self):
        """Fórmula: ((largura_hm * anchura_hm) / 1000000) - area_producto - recorte_adicional"""
        # ((800 * 600) / 1000000) - 0.4 - 0.02 = 0.48 - 0.4 - 0.02 = 0.06
        resultado = calcular_recorte_caracteristico(800, 600, 0.4, 0.02)
        assert round(resultado, 7) == 0.06

    def test_recorte_sin_proceso(self):
        """S/PROCESO siempre retorna 0"""
        resultado = calcular_recorte_caracteristico(800, 600, 0.4, 0.02, "S/PROCESO")
        assert resultado == 0


# =============================================================================
# Tests de Función Principal
# =============================================================================

class TestCalcularTodos:
    """Tests para la función calcular_todos."""

    def test_calculo_completo(self):
        """Verifica que calcular_todos devuelve todas las propiedades."""
        work_order_data = {
            "largura_hm": 800,
            "anchura_hm": 600,
            "golpes_largo": 2,
            "golpes_ancho": 2,
            "proceso_descripcion": "DIECUTTER",
            "area_producto": 0.4,
            "separacion_golpes_largo": 5,
            "separacion_golpes_ancho": 5,
            "impresion_1": 80,
            "impresion_2": None,
            "impresion_3": None,
            "impresion_4": None,
            "impresion_5": None,
            "impresion_6": None,
            "impresion_7": None,
            "porcentanje_barniz_uv": None,
            "impresion_color_interno": None,
            "longitud_pegado": None,
            "percentage_coverage_internal": None,
            "coverage_internal_id": None,
            "percentage_coverage_external": None,
            "coverage_external_id": None,
            "porcentaje_barniz_interior": None,
            "recorte_adicional": 0.02,
        }
        carton_data = {
            "tipo": "SIMPLES",
            "peso": 400,
            "espesor": 3,
        }

        resultado = calcular_todos(work_order_data, carton_data)

        # Verificar que todas las propiedades están presentes
        assert "largura_hc" in resultado
        assert "anchura_hc" in resultado
        assert "area_hm" in resultado
        assert "area_hc" in resultado
        assert "peso_bruto" in resultado
        assert "peso_neto" in resultado
        assert "volumen_unitario" in resultado
        assert "uma_area" in resultado
        assert "uma_peso" in resultado
        assert "consumo_1" in resultado
        assert "recorte_caracteristico" in resultado

    def test_area_hm_correcto(self):
        """Verifica que área HM se calcula correctamente."""
        work_order_data = {
            "largura_hm": 1000,
            "anchura_hm": 500,
            "golpes_largo": 2,
            "golpes_ancho": 2,
            "proceso_descripcion": "DIECUTTER",
        }
        carton_data = {"tipo": "SIMPLES", "peso": 400, "espesor": 3}

        resultado = calcular_todos(work_order_data, carton_data)

        # 1000 * 500 / 1000000 = 0.5
        assert resultado["area_hm"] == 0.5


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
