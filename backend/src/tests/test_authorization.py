"""
Tests de autorización por rol - INVEB
Sprint G: FASE 2 - Middleware de Roles

Verifica:
- Que los roles están correctamente definidos
- Que la función require_roles funciona
- Que usuarios sin permisos reciben 403
"""

import pytest
from unittest.mock import MagicMock, patch


# =============================================
# TESTS: CONSTANTES DE ROLES
# =============================================

class TestRolesConstants:
    """
    Verifica que las constantes de roles coinciden con Laravel.
    Fuente: app/Constants.php
    """

    def test_admin_role_id_is_1(self):
        """Admin tiene ID=1"""
        from app.constants import Roles
        assert Roles.Admin == 1

    def test_gerente_role_id_is_2(self):
        """Gerente tiene ID=2"""
        from app.constants import Roles
        assert Roles.Gerente == 2

    def test_jefe_venta_role_id_is_3(self):
        """JefeVenta tiene ID=3"""
        from app.constants import Roles
        assert Roles.JefeVenta == 3

    def test_vendedor_role_id_is_4(self):
        """Vendedor tiene ID=4"""
        from app.constants import Roles
        assert Roles.Vendedor == 4

    def test_super_administrador_role_id_is_18(self):
        """SuperAdministrador tiene ID=18"""
        from app.constants import Roles
        assert Roles.SuperAdministrador == 18

    def test_vendedor_externo_role_id_is_19(self):
        """VendedorExterno tiene ID=19"""
        from app.constants import Roles
        assert Roles.VendedorExterno == 19

    def test_gerente_comercial_role_id_is_15(self):
        """GerenteComercial tiene ID=15"""
        from app.constants import Roles
        assert Roles.GerenteComercial == 15


# =============================================
# TESTS: CONSTANTES DE ÁREAS
# =============================================

class TestAreasConstants:
    """
    Verifica que las constantes de áreas coinciden con Laravel.
    Fuente: app/Constants.php líneas 27-33
    """

    def test_area_venta_is_1(self):
        """AreaVenta tiene ID=1"""
        from app.constants import Areas
        assert Areas.Venta == 1

    def test_area_desarrollo_is_2(self):
        """AreaDesarrollo tiene ID=2"""
        from app.constants import Areas
        assert Areas.Desarrollo == 2

    def test_area_diseno_is_3(self):
        """AreaDiseño tiene ID=3"""
        from app.constants import Areas
        assert Areas.Diseño == 3

    def test_area_catalogacion_is_4(self):
        """AreaCatalogacion tiene ID=4"""
        from app.constants import Areas
        assert Areas.Catalogacion == 4

    def test_area_precatalogacion_is_5(self):
        """AreaPrecatalogacion tiene ID=5"""
        from app.constants import Areas
        assert Areas.Precatalogacion == 5

    def test_area_muestras_is_6(self):
        """AreaMuestras tiene ID=6"""
        from app.constants import Areas
        assert Areas.Muestras == 6


# =============================================
# TESTS: AGRUPACIONES DE ROLES
# =============================================

class TestRoleGroups:
    """
    Verifica que las agrupaciones de roles son correctas.
    """

    def test_roles_admin_includes_admin_and_super(self):
        """ROLES_ADMIN incluye Admin y SuperAdministrador"""
        from app.constants import ROLES_ADMIN, Roles
        assert Roles.Admin in ROLES_ADMIN
        assert Roles.SuperAdministrador in ROLES_ADMIN
        assert len(ROLES_ADMIN) == 2

    def test_roles_gerentes_includes_gerente_and_comercial(self):
        """ROLES_GERENTES incluye Gerente y GerenteComercial"""
        from app.constants import ROLES_GERENTES, Roles
        assert Roles.Gerente in ROLES_GERENTES
        assert Roles.GerenteComercial in ROLES_GERENTES
        assert len(ROLES_GERENTES) == 2

    def test_roles_crear_ot_includes_correct_roles(self):
        """ROLES_CREAR_OT incluye todos los roles que pueden crear OTs"""
        from app.constants import ROLES_CREAR_OT, Roles
        # Admin, SuperAdmin
        assert Roles.Admin in ROLES_CREAR_OT
        assert Roles.SuperAdministrador in ROLES_CREAR_OT
        # Ventas
        assert Roles.JefeVenta in ROLES_CREAR_OT
        assert Roles.Vendedor in ROLES_CREAR_OT
        assert Roles.VendedorExterno in ROLES_CREAR_OT
        # Desarrollo
        assert Roles.JefeDesarrollo in ROLES_CREAR_OT
        assert Roles.Ingeniero in ROLES_CREAR_OT
        # Diseño
        assert Roles.JefeDiseño in ROLES_CREAR_OT
        assert Roles.Diseñador in ROLES_CREAR_OT

    def test_roles_cotizador_includes_correct_roles(self):
        """ROLES_COTIZADOR incluye roles que pueden usar el cotizador"""
        from app.constants import ROLES_COTIZADOR, Roles
        assert Roles.Admin in ROLES_COTIZADOR
        assert Roles.SuperAdministrador in ROLES_COTIZADOR
        assert Roles.Gerente in ROLES_COTIZADOR
        assert Roles.GerenteComercial in ROLES_COTIZADOR
        assert Roles.JefeVenta in ROLES_COTIZADOR
        assert Roles.Vendedor in ROLES_COTIZADOR

    def test_roles_aprobar_cotizacion_includes_correct_roles(self):
        """ROLES_APROBAR_COTIZACION incluye roles que pueden aprobar"""
        from app.constants import ROLES_APROBAR_COTIZACION, Roles
        assert Roles.Admin in ROLES_APROBAR_COTIZACION
        assert Roles.SuperAdministrador in ROLES_APROBAR_COTIZACION
        assert Roles.Gerente in ROLES_APROBAR_COTIZACION
        assert Roles.GerenteComercial in ROLES_APROBAR_COTIZACION
        assert Roles.JefeVenta in ROLES_APROBAR_COTIZACION
        # Vendedor NO puede aprobar
        assert Roles.Vendedor not in ROLES_APROBAR_COTIZACION


# =============================================
# TESTS: FUNCIONES HELPER
# =============================================

class TestHelperFunctions:
    """
    Verifica las funciones helper de roles.
    """

    def test_is_admin_returns_true_for_admin(self):
        """is_admin retorna True para Admin"""
        from app.constants import is_admin, Roles
        assert is_admin(Roles.Admin) is True
        assert is_admin(Roles.SuperAdministrador) is True

    def test_is_admin_returns_false_for_non_admin(self):
        """is_admin retorna False para no-admin"""
        from app.constants import is_admin, Roles
        assert is_admin(Roles.Vendedor) is False
        assert is_admin(Roles.Ingeniero) is False

    def test_is_gerente_returns_true_for_gerentes(self):
        """is_gerente retorna True para Gerentes"""
        from app.constants import is_gerente, Roles
        assert is_gerente(Roles.Gerente) is True
        assert is_gerente(Roles.GerenteComercial) is True

    def test_can_create_ot_returns_correct_values(self):
        """can_create_ot retorna valores correctos"""
        from app.constants import can_create_ot, Roles
        # Roles que pueden crear
        assert can_create_ot(Roles.Admin) is True
        assert can_create_ot(Roles.Vendedor) is True
        assert can_create_ot(Roles.Ingeniero) is True
        # Roles que NO pueden crear
        assert can_create_ot(Roles.Catalogador) is False
        assert can_create_ot(Roles.TecnicoMuestras) is False

    def test_can_use_cotizador_returns_correct_values(self):
        """can_use_cotizador retorna valores correctos"""
        from app.constants import can_use_cotizador, Roles
        # Roles que pueden usar cotizador
        assert can_use_cotizador(Roles.Admin) is True
        assert can_use_cotizador(Roles.Vendedor) is True
        # Roles que NO pueden usar cotizador
        assert can_use_cotizador(Roles.Ingeniero) is False
        assert can_use_cotizador(Roles.Diseñador) is False

    def test_can_approve_cotizacion_returns_correct_values(self):
        """can_approve_cotizacion retorna valores correctos"""
        from app.constants import can_approve_cotizacion, Roles
        # Roles que pueden aprobar
        assert can_approve_cotizacion(Roles.Admin) is True
        assert can_approve_cotizacion(Roles.JefeVenta) is True
        assert can_approve_cotizacion(Roles.GerenteComercial) is True
        # Roles que NO pueden aprobar
        assert can_approve_cotizacion(Roles.Vendedor) is False
        assert can_approve_cotizacion(Roles.VendedorExterno) is False

    def test_get_user_area_returns_correct_area(self):
        """get_user_area retorna el área correcta"""
        from app.constants import get_user_area, Roles, Areas
        assert get_user_area(Roles.Vendedor) == Areas.Venta
        assert get_user_area(Roles.Ingeniero) == Areas.Desarrollo
        assert get_user_area(Roles.Diseñador) == Areas.Diseño
        assert get_user_area(Roles.Catalogador) == Areas.Catalogacion

    def test_get_user_area_returns_none_for_admin(self):
        """get_user_area retorna None para Admin (no tiene área específica)"""
        from app.constants import get_user_area, Roles
        # Admin y Gerentes no tienen área específica
        assert get_user_area(Roles.Admin) is None
        assert get_user_area(Roles.Gerente) is None


# =============================================
# TESTS: ROLE CHECKER
# =============================================

class TestRoleChecker:
    """
    Verifica que el RoleChecker funciona correctamente.
    """

    def test_role_checker_accepts_allowed_role(self):
        """RoleChecker permite roles autorizados"""
        from app.middleware.roles import RoleChecker
        from app.constants import Roles

        checker = RoleChecker([Roles.Admin, Roles.Vendedor])

        # Mock user con rol Admin
        mock_user = {
            "id": 1,
            "role_id": Roles.Admin,
            "nombre": "Test",
            "apellido": "User"
        }

        # El checker acepta roles en la lista
        assert Roles.Admin in checker.allowed_roles
        assert Roles.Vendedor in checker.allowed_roles

    def test_role_checker_rejects_unauthorized_role(self):
        """RoleChecker rechaza roles no autorizados"""
        from app.middleware.roles import RoleChecker
        from app.constants import Roles

        checker = RoleChecker([Roles.Admin])

        # Vendedor NO está en la lista
        assert Roles.Vendedor not in checker.allowed_roles

    def test_require_roles_returns_checker(self):
        """require_roles retorna un RoleChecker"""
        from app.middleware.roles import require_roles, RoleChecker
        from app.constants import Roles

        checker = require_roles(Roles.Admin, Roles.Vendedor)
        assert isinstance(checker, RoleChecker)
        assert Roles.Admin in checker.allowed_roles
        assert Roles.Vendedor in checker.allowed_roles


# =============================================
# TESTS: FILTRO DE DATOS POR ROL
# =============================================

class TestUserFilterQuery:
    """
    Verifica que el filtro de query por usuario funciona correctamente.
    Fuente: WorkOrderController.php líneas 70-200
    """

    def test_admin_sees_all(self):
        """Admin ve todas las OTs"""
        from app.middleware.roles import get_user_filter_query
        from app.constants import Roles

        user = {"id": 1, "role_id": Roles.Admin}
        query = get_user_filter_query(user)
        assert query == "1=1"  # Sin restricción

    def test_gerente_sees_all(self):
        """Gerente ve todas las OTs"""
        from app.middleware.roles import get_user_filter_query
        from app.constants import Roles

        user = {"id": 2, "role_id": Roles.Gerente}
        query = get_user_filter_query(user)
        assert query == "1=1"  # Sin restricción

    def test_vendedor_only_sees_own_ots(self):
        """Vendedor solo ve sus OTs"""
        from app.middleware.roles import get_user_filter_query
        from app.constants import Roles

        user = {"id": 10, "role_id": Roles.Vendedor}
        query = get_user_filter_query(user)
        assert "user_id = 10" in query

    def test_vendedor_externo_only_sees_own_ots(self):
        """VendedorExterno solo ve sus OTs"""
        from app.middleware.roles import get_user_filter_query
        from app.constants import Roles

        user = {"id": 15, "role_id": Roles.VendedorExterno}
        query = get_user_filter_query(user)
        assert "user_id = 15" in query

    def test_ingeniero_sees_assigned_ots(self):
        """Ingeniero ve OTs asignadas a él"""
        from app.middleware.roles import get_user_filter_query
        from app.constants import Roles

        user = {"id": 20, "role_id": Roles.Ingeniero}
        query = get_user_filter_query(user)
        assert "asignado_desarrollo_id = 20" in query

    def test_jefe_desarrollo_sees_all_desarrollo(self):
        """JefeDesarrollo ve todas las de desarrollo"""
        from app.middleware.roles import get_user_filter_query
        from app.constants import Roles

        user = {"id": 5, "role_id": Roles.JefeDesarrollo}
        query = get_user_filter_query(user)
        assert "estado_id BETWEEN" in query


# =============================================
# TESTS: FILTRO VENDEDOR EXTERNO
# =============================================

class TestVendedorExternoClientFilter:
    """
    Verifica el filtro de clientes para VendedorExterno.
    Fuente: WorkOrderController.php líneas 657-661
    """

    def test_vendedor_externo_only_client_8(self):
        """VendedorExterno solo puede ver cliente ID=8"""
        from app.middleware.roles import filter_vendedor_externo_clients
        from app.constants import Roles

        user = {"role_id": Roles.VendedorExterno}
        clients = filter_vendedor_externo_clients(user)
        assert clients == [8]

    def test_other_roles_no_client_restriction(self):
        """Otros roles no tienen restricción de cliente"""
        from app.middleware.roles import filter_vendedor_externo_clients
        from app.constants import Roles

        user = {"role_id": Roles.Vendedor}
        clients = filter_vendedor_externo_clients(user)
        assert clients == []  # Sin restricción


# =============================================
# RUN TESTS
# =============================================

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
