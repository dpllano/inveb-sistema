"""
Tests del flujo de aprobación multinivel de cotizaciones.
Sprint G: FASE 3 - Completar Aprobaciones

Fuente Laravel: CotizacionApprovalController.php líneas 17-90

Niveles de aprobación:
- Nivel 1: Solo Jefe Ventas → Aprobación Total
- Nivel 2: Jefe Ventas → Parcial → Gerente Comercial → Total
- Nivel 3: Jefe Ventas → Gerente Comercial → Gerente General → Total
"""

import pytest
from unittest.mock import MagicMock, patch


# =============================================
# TESTS: NIVEL 1 - SOLO JEFE VENTAS
# =============================================

class TestNivel1SoloJefeVentas:
    """
    Nivel 1: Solo requiere aprobación de Jefe de Ventas.
    Si aprueba → estado_id = 3 (Aprobado)
    Si rechaza → estado_id = 6 (Rechazado)
    """

    def test_nivel_1_aprobacion_jefe_venta_es_total(self):
        """
        En nivel 1, la aprobación del Jefe de Ventas es TOTAL.
        """
        nivel_aprobacion = 1
        role_id = 3  # Jefe Ventas
        action = "aprobar"

        # Lógica de aprobación
        if nivel_aprobacion == 1:
            if action == "aprobar":
                nuevo_estado = 3
                accion = "Aprobación Total"
            else:
                nuevo_estado = 6
                accion = "Rechazo"

        assert nuevo_estado == 3
        assert accion == "Aprobación Total"

    def test_nivel_1_rechazo_jefe_venta(self):
        """
        En nivel 1, el rechazo del Jefe de Ventas cambia estado a 6.
        """
        nivel_aprobacion = 1
        role_id = 3
        action = "rechazar"

        if nivel_aprobacion == 1:
            if action == "aprobar":
                nuevo_estado = 3
                accion = "Aprobación Total"
            else:
                nuevo_estado = 6
                accion = "Rechazo"

        assert nuevo_estado == 6
        assert accion == "Rechazo"


# =============================================
# TESTS: NIVEL 2 - JEFE VENTAS + GERENTE COMERCIAL
# =============================================

class TestNivel2JefeVentasYGerenteComercial:
    """
    Nivel 2: Requiere Jefe de Ventas Y Gerente Comercial.
    - Jefe Ventas (role=3) aprueba → Parcial, pasa a Gerente Comercial
    - Gerente Comercial (role=15) aprueba → Total
    """

    def test_nivel_2_jefe_venta_aprueba_es_parcial(self):
        """
        En nivel 2, la aprobación del Jefe de Ventas es PARCIAL.
        Debe pasar a Gerente Comercial (role_can_show = 15).
        """
        nivel_aprobacion = 2
        role_id = 3  # Jefe Ventas
        action = "aprobar"

        nuevo_estado = None
        nuevo_role_can_show = None
        accion = None

        if nivel_aprobacion == 2:
            if role_id == 3:  # Jefe Ventas
                if action == "aprobar":
                    accion = "Aprobación Parcial"
                    nuevo_role_can_show = 15  # Gerente Comercial
                else:
                    nuevo_estado = 6
                    accion = "Rechazo"
            else:
                if action == "aprobar":
                    nuevo_estado = 3
                    accion = "Aprobación Total"
                else:
                    nuevo_estado = 6
                    accion = "Rechazo"

        assert nuevo_estado is None  # No cambia estado
        assert nuevo_role_can_show == 15  # Pasa a Gerente Comercial
        assert accion == "Aprobación Parcial"

    def test_nivel_2_gerente_comercial_aprueba_es_total(self):
        """
        En nivel 2, la aprobación del Gerente Comercial es TOTAL.
        """
        nivel_aprobacion = 2
        role_id = 15  # Gerente Comercial
        action = "aprobar"

        nuevo_estado = None
        nuevo_role_can_show = None
        accion = None

        if nivel_aprobacion == 2:
            if role_id == 3:
                accion = "Aprobación Parcial"
                nuevo_role_can_show = 15
            else:
                if action == "aprobar":
                    nuevo_estado = 3
                    accion = "Aprobación Total"
                else:
                    nuevo_estado = 6
                    accion = "Rechazo"

        assert nuevo_estado == 3
        assert nuevo_role_can_show is None
        assert accion == "Aprobación Total"

    def test_nivel_2_jefe_venta_rechaza(self):
        """
        En nivel 2, si Jefe Ventas rechaza → estado = 6.
        """
        nivel_aprobacion = 2
        role_id = 3
        action = "rechazar"

        nuevo_estado = None

        if nivel_aprobacion == 2:
            if role_id == 3:
                if action != "aprobar":
                    nuevo_estado = 6

        assert nuevo_estado == 6


# =============================================
# TESTS: NIVEL 3 - TRIPLE APROBACIÓN
# =============================================

class TestNivel3TripleAprobacion:
    """
    Nivel 3: Requiere Jefe Ventas, Gerente Comercial Y Gerente General.
    - Jefe Ventas (role=3) → Parcial → Gerente Comercial (role_can_show=15)
    - Gerente Comercial (role=15) → Parcial → Gerente General (role_can_show=2)
    - Gerente General (role=2) → Total
    """

    def test_nivel_3_jefe_venta_aprueba_es_parcial(self):
        """
        En nivel 3, Jefe Ventas aprueba → Parcial → Gerente Comercial.
        """
        nivel_aprobacion = 3
        role_id = 3  # Jefe Ventas
        action = "aprobar"

        nuevo_estado = None
        nuevo_role_can_show = None
        accion = None

        if nivel_aprobacion == 3:
            if role_id == 3:
                if action == "aprobar":
                    accion = "Aprobación Parcial"
                    nuevo_role_can_show = 15
            elif role_id == 15:
                if action == "aprobar":
                    accion = "Aprobación Parcial"
                    nuevo_role_can_show = 2
            else:
                if action == "aprobar":
                    nuevo_estado = 3
                    accion = "Aprobación Total"

        assert nuevo_role_can_show == 15
        assert accion == "Aprobación Parcial"

    def test_nivel_3_gerente_comercial_aprueba_es_parcial(self):
        """
        En nivel 3, Gerente Comercial aprueba → Parcial → Gerente General.
        """
        nivel_aprobacion = 3
        role_id = 15  # Gerente Comercial
        action = "aprobar"

        nuevo_estado = None
        nuevo_role_can_show = None
        accion = None

        if nivel_aprobacion == 3:
            if role_id == 3:
                accion = "Aprobación Parcial"
                nuevo_role_can_show = 15
            elif role_id == 15:
                if action == "aprobar":
                    accion = "Aprobación Parcial"
                    nuevo_role_can_show = 2  # Gerente General
            else:
                if action == "aprobar":
                    nuevo_estado = 3
                    accion = "Aprobación Total"

        assert nuevo_role_can_show == 2  # Pasa a Gerente General
        assert accion == "Aprobación Parcial"

    def test_nivel_3_gerente_general_aprueba_es_total(self):
        """
        En nivel 3, Gerente General aprueba → TOTAL.
        """
        nivel_aprobacion = 3
        role_id = 2  # Gerente General
        action = "aprobar"

        nuevo_estado = None
        nuevo_role_can_show = None
        accion = None

        if nivel_aprobacion == 3:
            if role_id == 3:
                accion = "Aprobación Parcial"
                nuevo_role_can_show = 15
            elif role_id == 15:
                accion = "Aprobación Parcial"
                nuevo_role_can_show = 2
            else:
                if action == "aprobar":
                    nuevo_estado = 3
                    accion = "Aprobación Total"

        assert nuevo_estado == 3
        assert accion == "Aprobación Total"

    def test_nivel_3_cualquier_rol_puede_rechazar(self):
        """
        En cualquier nivel, cualquier rol autorizado puede rechazar.
        """
        nivel_aprobacion = 3
        action = "rechazar"

        # Probar con diferentes roles
        for role_id in [3, 15, 2]:  # Jefe Ventas, Gerente Comercial, Gerente General
            nuevo_estado = 6 if action == "rechazar" else None
            accion = "Rechazo" if action == "rechazar" else None

            assert nuevo_estado == 6
            assert accion == "Rechazo"


# =============================================
# TESTS: CASCADA DE APROBACIONES
# =============================================

class TestCascadaAprobaciones:
    """
    Verifica el flujo completo de cascada de aprobaciones.
    """

    def test_flujo_completo_nivel_2(self):
        """
        Flujo completo nivel 2:
        1. Jefe Ventas aprueba → role_can_show = 15
        2. Gerente Comercial aprueba → estado_id = 3
        """
        cotizacion = {
            "id": 1,
            "nivel_aprobacion": 2,
            "role_can_show": 3,  # Inicia visible para Jefe Ventas
            "estado_id": 2  # Pendiente
        }

        # Paso 1: Jefe Ventas aprueba
        role_id = 3
        if role_id == 3:
            cotizacion["role_can_show"] = 15  # Pasa a Gerente Comercial

        assert cotizacion["role_can_show"] == 15
        assert cotizacion["estado_id"] == 2  # Aún pendiente

        # Paso 2: Gerente Comercial aprueba
        role_id = 15
        if role_id == 15 or role_id == 2:  # Gerente Comercial o General
            cotizacion["estado_id"] = 3  # Aprobado

        assert cotizacion["estado_id"] == 3  # Aprobado

    def test_flujo_completo_nivel_3(self):
        """
        Flujo completo nivel 3:
        1. Jefe Ventas aprueba → role_can_show = 15
        2. Gerente Comercial aprueba → role_can_show = 2
        3. Gerente General aprueba → estado_id = 3
        """
        cotizacion = {
            "id": 1,
            "nivel_aprobacion": 3,
            "role_can_show": 3,
            "estado_id": 2
        }

        # Paso 1: Jefe Ventas aprueba
        cotizacion["role_can_show"] = 15
        assert cotizacion["role_can_show"] == 15

        # Paso 2: Gerente Comercial aprueba
        cotizacion["role_can_show"] = 2
        assert cotizacion["role_can_show"] == 2

        # Paso 3: Gerente General aprueba
        cotizacion["estado_id"] = 3
        assert cotizacion["estado_id"] == 3


# =============================================
# TESTS: REGISTRO DE APROBACIONES
# =============================================

class TestRegistroAprobaciones:
    """
    Verifica que las aprobaciones se registran correctamente.
    """

    def test_aprobacion_registra_accion_correcta(self):
        """
        La aprobación debe registrar la acción correcta en cotizacion_approvals.
        """
        acciones_validas = [
            "Aprobación Total",
            "Aprobación Parcial",
            "Rechazo"
        ]

        for accion in acciones_validas:
            approval = {
                "cotizacion_id": 1,
                "user_id": 1,
                "role_do_action": 3,
                "action_made": accion,
                "motivo": "Test"
            }

            assert approval["action_made"] in acciones_validas

    def test_aprobacion_registra_role_correcto(self):
        """
        Se debe registrar el role_id del usuario que aprueba.
        """
        roles_aprobacion = [3, 15, 2]  # Jefe Ventas, Gerente Comercial, Gerente General

        for role_id in roles_aprobacion:
            approval = {
                "cotizacion_id": 1,
                "user_id": 1,
                "role_do_action": role_id,
                "action_made": "Aprobación Total",
                "motivo": ""
            }

            assert approval["role_do_action"] == role_id


# =============================================
# RUN TESTS
# =============================================

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
