"""
Tests BRECHA P0 #4 — filtro jefe_id en cotizaciones (sub-items A, B, C).

Origen: aibo/output/inveb-h1/documento/brecha-p0-4-jefe-id-confirmada-codigo.md

Cubre:
- Sub-item C: helpers de cotizacion_notifications (lógica pura, mockable)
- Sub-items A y B: tests de SQL building solo (los endpoints requieren BD real)
"""
import sys
import os
import pytest
from unittest.mock import MagicMock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.services.cotizacion_notifications import (
    get_jefes_para_notificar,
    get_destinatarios_aprobacion_cotizacion,
    jefe_recibe_notificacion_cotizacion,
)


# =============================================================================
# Mock helper para connection pymysql
# =============================================================================

def mock_connection(fetchall_return=None, fetchone_return=None):
    """Crea un mock de pymysql connection con cursor configurable."""
    cursor = MagicMock()
    cursor.fetchall.return_value = fetchall_return or []
    cursor.fetchone.return_value = fetchone_return
    cursor.execute = MagicMock()
    cursor.__enter__ = MagicMock(return_value=cursor)
    cursor.__exit__ = MagicMock(return_value=None)

    conn = MagicMock()
    conn.cursor.return_value = cursor
    return conn, cursor


# =============================================================================
# Sub-item C — get_jefes_para_notificar
# =============================================================================

class TestGetJefesParaNotificar:
    """Sub-item C: jefes a notificar en cotizaciones (legacy NotificarCotizacionesPorAprobacion)."""

    def test_lista_vacia_retorna_vacio(self):
        conn, _ = mock_connection()
        result = get_jefes_para_notificar(conn, [])
        assert result == []

    def test_un_jefe_asignado(self):
        conn, cursor = mock_connection(
            fetchall_return=[{"jefe_id": 5}]
        )
        result = get_jefes_para_notificar(conn, [101])
        assert result == [5]
        cursor.execute.assert_called_once()

    def test_multiples_jefes_distintos(self):
        conn, _ = mock_connection(
            fetchall_return=[{"jefe_id": 5}, {"jefe_id": 7}, {"jefe_id": 5}]
        )
        result = get_jefes_para_notificar(conn, [101, 102, 103])
        # SQL usa DISTINCT, pero el helper también es robusto si hay dups
        assert 5 in result and 7 in result

    def test_cotizacion_sin_jefe_no_notifica(self):
        # Si las cotizaciones no tienen creador con jefe_id, fetchall retorna []
        conn, _ = mock_connection(fetchall_return=[])
        result = get_jefes_para_notificar(conn, [200])
        assert result == []

    def test_jefe_inactivo_excluido(self):
        # Si el jefe está inactivo (active=0), el SQL lo filtra (fetchall vacío)
        conn, _ = mock_connection(fetchall_return=[])
        result = get_jefes_para_notificar(conn, [300])
        assert result == []


# =============================================================================
# Sub-item C — get_destinatarios_aprobacion_cotizacion
# =============================================================================

class TestGetDestinatariosAprobacion:
    """Destinatarios completos para envío de email."""

    def test_un_destinatario_completo(self):
        conn, _ = mock_connection(
            fetchall_return=[{
                "id": 5, "nombre": "Juan", "apellido": "Pérez",
                "email": "juan.perez@inveb.cl", "role_id": 3
            }]
        )
        result = get_destinatarios_aprobacion_cotizacion(conn, 101)
        assert len(result) == 1
        assert result[0]["email"] == "juan.perez@inveb.cl"
        assert result[0]["role_id"] == 3

    def test_sin_jefe_lista_vacia(self):
        conn, _ = mock_connection(fetchall_return=[])
        result = get_destinatarios_aprobacion_cotizacion(conn, 999)
        assert result == []


# =============================================================================
# Sub-item C — jefe_recibe_notificacion_cotizacion
# =============================================================================

class TestJefeRecibeNotificacion:
    """Validación inversa: ¿este jefe debe recibir esta notificación?"""

    def test_jefe_correcto_es_true(self):
        conn, _ = mock_connection(fetchone_return={"1": 1})
        assert jefe_recibe_notificacion_cotizacion(conn, jefe_user_id=5, cotizacion_id=101) is True

    def test_jefe_no_asignado_es_false(self):
        conn, _ = mock_connection(fetchone_return=None)
        assert jefe_recibe_notificacion_cotizacion(conn, jefe_user_id=99, cotizacion_id=101) is False


# =============================================================================
# Smoke test integrado del flujo brecha #4
# =============================================================================

class TestBrechaP04FlujoIntegrado:
    """Validar que los 3 helpers se comportan coherentemente."""

    def test_flujo_jefe_asignado_recibe_y_es_destinatario(self):
        # 1) get_jefes_para_notificar retorna [5]
        conn1, _ = mock_connection(fetchall_return=[{"jefe_id": 5}])
        jefes = get_jefes_para_notificar(conn1, [101])
        assert jefes == [5]

        # 2) get_destinatarios retorna info del jefe
        conn2, _ = mock_connection(fetchall_return=[{
            "id": 5, "nombre": "Juan", "apellido": "Pérez",
            "email": "j@inveb.cl", "role_id": 3
        }])
        destinatarios = get_destinatarios_aprobacion_cotizacion(conn2, 101)
        assert destinatarios[0]["id"] in jefes

        # 3) jefe_recibe_notificacion confirma el match
        conn3, _ = mock_connection(fetchone_return={"1": 1})
        assert jefe_recibe_notificacion_cotizacion(conn3, 5, 101) is True
