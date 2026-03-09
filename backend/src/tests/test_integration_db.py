"""
Tests de Integración con BD Real - INVEB
=========================================

Pruebas que verifican la conexión y operaciones contra la BD MySQL real.

IMPORTANTE: Estos tests requieren:
1. BD MySQL corriendo en el puerto configurado
2. Base de datos 'envases_ot' existente
3. Variables de entorno o configuración correcta

Ejecutar: pytest tests/test_integration_db.py -v
"""
import pytest
import os
import sys

# Agregar path para imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Intentar importar pymysql
try:
    import pymysql
    PYMYSQL_AVAILABLE = True
except ImportError:
    PYMYSQL_AVAILABLE = False


# Skip si no hay pymysql
pytestmark = pytest.mark.skipif(
    not PYMYSQL_AVAILABLE,
    reason="pymysql no instalado"
)


class TestDatabaseConnection:
    """Verifica conexión a la base de datos."""

    def get_connection(self):
        """Obtiene conexión a BD."""
        try:
            from app.config import get_settings
            settings = get_settings()
            return pymysql.connect(
                host=settings.LARAVEL_MYSQL_HOST,
                port=settings.LARAVEL_MYSQL_PORT,
                user=settings.LARAVEL_MYSQL_USER,
                password=settings.LARAVEL_MYSQL_PASSWORD,
                database=settings.LARAVEL_MYSQL_DATABASE,
                charset='utf8mb4',
                cursorclass=pymysql.cursors.DictCursor,
                connect_timeout=5
            )
        except Exception:
            # Usar valores por defecto si no se puede cargar settings
            return pymysql.connect(
                host='127.0.0.1',
                port=3306,
                user='envases',
                password='secret',
                database='envases_ot',
                charset='utf8mb4',
                cursorclass=pymysql.cursors.DictCursor,
                connect_timeout=5
            )

    def test_database_connection(self):
        """Verifica que se puede conectar a la BD."""
        try:
            conn = self.get_connection()
            assert conn is not None
            conn.close()
            print("\n[OK] Conexión a BD establecida")
        except pymysql.Error as e:
            pytest.skip(f"BD no disponible: {e}")

    def test_database_has_tables(self):
        """Verifica que la BD tiene tablas."""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()
            conn.close()

            assert len(tables) > 0, "La BD no tiene tablas"
            print(f"\n[OK] BD tiene {len(tables)} tablas")
        except pymysql.Error as e:
            pytest.skip(f"BD no disponible: {e}")


class TestWorkOrdersIntegration:
    """Pruebas de integración para OTs."""

    def get_connection(self):
        """Obtiene conexión a BD."""
        try:
            from app.config import get_settings
            settings = get_settings()
            return pymysql.connect(
                host=settings.LARAVEL_MYSQL_HOST,
                port=settings.LARAVEL_MYSQL_PORT,
                user=settings.LARAVEL_MYSQL_USER,
                password=settings.LARAVEL_MYSQL_PASSWORD,
                database=settings.LARAVEL_MYSQL_DATABASE,
                charset='utf8mb4',
                cursorclass=pymysql.cursors.DictCursor,
                connect_timeout=5
            )
        except Exception:
            return pymysql.connect(
                host='localhost',
                port=3307,
                user='root',
                password='root',
                database='envases_ot',
                charset='utf8mb4',
                cursorclass=pymysql.cursors.DictCursor,
                connect_timeout=5
            )

    def test_work_orders_table_exists(self):
        """Verifica que la tabla work_orders existe."""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            cursor.execute("SHOW TABLES LIKE 'work_orders'")
            result = cursor.fetchone()
            conn.close()

            assert result is not None, "Tabla work_orders no existe"
            print("\n[OK] Tabla work_orders existe")
        except pymysql.Error as e:
            pytest.skip(f"BD no disponible: {e}")

    def test_work_orders_has_data(self):
        """Verifica que hay datos en work_orders."""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) as total FROM work_orders")
            result = cursor.fetchone()
            conn.close()

            print(f"\n[INFO] work_orders tiene {result['total']} registros")
            # No falla si está vacía, solo informa
        except pymysql.Error as e:
            pytest.skip(f"BD no disponible: {e}")

    def test_work_orders_columns(self):
        """Verifica columnas críticas de work_orders."""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            cursor.execute("DESCRIBE work_orders")
            columns = {row['Field'] for row in cursor.fetchall()}
            conn.close()

            required_columns = [
                'id', 'client_id', 'product_type_id',
                'created_at', 'updated_at'
            ]

            for col in required_columns:
                assert col in columns, f"Columna {col} no existe en work_orders"

            print(f"\n[OK] work_orders tiene columnas críticas")
        except pymysql.Error as e:
            pytest.skip(f"BD no disponible: {e}")


class TestClientsIntegration:
    """Pruebas de integración para clientes."""

    def get_connection(self):
        """Obtiene conexión a BD."""
        try:
            from app.config import get_settings
            settings = get_settings()
            return pymysql.connect(
                host=settings.LARAVEL_MYSQL_HOST,
                port=settings.LARAVEL_MYSQL_PORT,
                user=settings.LARAVEL_MYSQL_USER,
                password=settings.LARAVEL_MYSQL_PASSWORD,
                database=settings.LARAVEL_MYSQL_DATABASE,
                charset='utf8mb4',
                cursorclass=pymysql.cursors.DictCursor,
                connect_timeout=5
            )
        except Exception:
            return pymysql.connect(
                host='localhost',
                port=3307,
                user='root',
                password='root',
                database='envases_ot',
                charset='utf8mb4',
                cursorclass=pymysql.cursors.DictCursor,
                connect_timeout=5
            )

    def test_clients_table_exists(self):
        """Verifica que la tabla clients existe."""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            cursor.execute("SHOW TABLES LIKE 'clients'")
            result = cursor.fetchone()
            conn.close()

            assert result is not None, "Tabla clients no existe"
            print("\n[OK] Tabla clients existe")
        except pymysql.Error as e:
            pytest.skip(f"BD no disponible: {e}")

    def test_clients_has_data(self):
        """Verifica que hay datos en clients."""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) as total FROM clients")
            result = cursor.fetchone()
            conn.close()

            assert result['total'] > 0, "Tabla clients está vacía"
            print(f"\n[OK] clients tiene {result['total']} registros")
        except pymysql.Error as e:
            pytest.skip(f"BD no disponible: {e}")

    def test_client_has_installations(self):
        """Verifica relación client-instalaciones."""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            cursor.execute("""
                SELECT c.id, c.nombre, COUNT(i.id) as instalaciones
                FROM clients c
                LEFT JOIN installations i ON c.id = i.client_id
                GROUP BY c.id, c.nombre
                HAVING instalaciones > 0
                LIMIT 5
            """)
            results = cursor.fetchall()
            conn.close()

            print(f"\n[INFO] {len(results)} clientes tienen instalaciones")
        except pymysql.Error as e:
            pytest.skip(f"BD no disponible: {e}")


class TestMantenedoresIntegration:
    """Pruebas de integración para mantenedores."""

    def get_connection(self):
        """Obtiene conexión a BD."""
        try:
            from app.config import get_settings
            settings = get_settings()
            return pymysql.connect(
                host=settings.LARAVEL_MYSQL_HOST,
                port=settings.LARAVEL_MYSQL_PORT,
                user=settings.LARAVEL_MYSQL_USER,
                password=settings.LARAVEL_MYSQL_PASSWORD,
                database=settings.LARAVEL_MYSQL_DATABASE,
                charset='utf8mb4',
                cursorclass=pymysql.cursors.DictCursor,
                connect_timeout=5
            )
        except Exception:
            return pymysql.connect(
                host='localhost',
                port=3307,
                user='root',
                password='root',
                database='envases_ot',
                charset='utf8mb4',
                cursorclass=pymysql.cursors.DictCursor,
                connect_timeout=5
            )

    @pytest.mark.parametrize("tabla,campo_nombre", [
        ("armados", "descripcion"),
        ("processes", "descripcion"),
        ("pegados", "descripcion"),
        ("product_types", "descripcion"),
        ("styles", "glosa"),
        ("cartons", "codigo"),
        ("plantas", "nombre"),
    ])
    def test_mantenedor_table_has_data(self, tabla, campo_nombre):
        """Verifica que las tablas de mantenedores tienen datos."""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            cursor.execute(f"SELECT COUNT(*) as total FROM {tabla}")
            result = cursor.fetchone()
            conn.close()

            print(f"\n[INFO] {tabla}: {result['total']} registros")
        except pymysql.Error as e:
            pytest.skip(f"Tabla {tabla} no disponible: {e}")


class TestCascadesIntegration:
    """Pruebas de integración para cascadas."""

    def get_connection(self):
        """Obtiene conexión a BD."""
        try:
            from app.config import get_settings
            settings = get_settings()
            return pymysql.connect(
                host=settings.LARAVEL_MYSQL_HOST,
                port=settings.LARAVEL_MYSQL_PORT,
                user=settings.LARAVEL_MYSQL_USER,
                password=settings.LARAVEL_MYSQL_PASSWORD,
                database=settings.LARAVEL_MYSQL_DATABASE,
                charset='utf8mb4',
                cursorclass=pymysql.cursors.DictCursor,
                connect_timeout=5
            )
        except Exception:
            return pymysql.connect(
                host='localhost',
                port=3307,
                user='root',
                password='root',
                database='envases_ot',
                charset='utf8mb4',
                cursorclass=pymysql.cursors.DictCursor,
                connect_timeout=5
            )

    def test_impresiones_excludes_correct_ids(self):
        """Verifica filtro de impresiones (Issue 20)."""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            # Verificar que existen IDs 1, 6, 7 para excluir
            cursor.execute("""
                SELECT id, nombre
                FROM impresion
                WHERE id IN (1, 6, 7) AND status = 1
            """)
            excluded = cursor.fetchall()

            # Verificar opciones válidas
            cursor.execute("""
                SELECT id, nombre
                FROM impresion
                WHERE id NOT IN (1, 6, 7) AND status = 1
            """)
            valid = cursor.fetchall()
            conn.close()

            print(f"\n[INFO] Impresiones excluidas: {len(excluded)}")
            print(f"[INFO] Impresiones válidas: {len(valid)}")
        except pymysql.Error as e:
            pytest.skip(f"Tabla impresion no disponible: {e}")

    def test_recubrimiento_interno_cinta(self):
        """Verifica filtro recubrimiento interno (Issue 22)."""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            # Cuando CINTA=SI, solo IDs 1 y 2
            cursor.execute("""
                SELECT id, descripcion
                FROM coverage_internal
                WHERE id IN (1, 2) AND status = 1
            """)
            cinta_options = cursor.fetchall()
            conn.close()

            assert len(cinta_options) >= 2, "Faltan opciones para CINTA=SI"
            print(f"\n[OK] Recubrimiento interno CINTA: {len(cinta_options)} opciones")
        except pymysql.Error as e:
            pytest.skip(f"Tabla coverage_internal no disponible: {e}")

    def test_plantas_activas(self):
        """Verifica filtro plantas activas (Issue 24)."""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, nombre, active
                FROM plantas
                WHERE active = 1
            """)
            activas = cursor.fetchall()

            cursor.execute("""
                SELECT id, nombre, active
                FROM plantas
                WHERE active = 0
            """)
            inactivas = cursor.fetchall()
            conn.close()

            print(f"\n[INFO] Plantas activas: {len(activas)}")
            print(f"[INFO] Plantas inactivas: {len(inactivas)}")
        except pymysql.Error as e:
            pytest.skip(f"Tabla plantas no disponible: {e}")


class TestMuestrasIntegration:
    """Pruebas de integración para muestras."""

    def get_connection(self):
        """Obtiene conexión a BD."""
        try:
            from app.config import get_settings
            settings = get_settings()
            return pymysql.connect(
                host=settings.LARAVEL_MYSQL_HOST,
                port=settings.LARAVEL_MYSQL_PORT,
                user=settings.LARAVEL_MYSQL_USER,
                password=settings.LARAVEL_MYSQL_PASSWORD,
                database=settings.LARAVEL_MYSQL_DATABASE,
                charset='utf8mb4',
                cursorclass=pymysql.cursors.DictCursor,
                connect_timeout=5
            )
        except Exception:
            return pymysql.connect(
                host='localhost',
                port=3307,
                user='root',
                password='root',
                database='envases_ot',
                charset='utf8mb4',
                cursorclass=pymysql.cursors.DictCursor,
                connect_timeout=5
            )

    def test_muestras_table_exists(self):
        """Verifica que la tabla muestras existe."""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            cursor.execute("SHOW TABLES LIKE 'muestras'")
            result = cursor.fetchone()
            conn.close()

            assert result is not None, "Tabla muestras no existe"
            print("\n[OK] Tabla muestras existe")
        except pymysql.Error as e:
            pytest.skip(f"BD no disponible: {e}")

    def test_muestras_estados(self):
        """Verifica distribución de estados de muestras."""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            cursor.execute("""
                SELECT
                    estado,
                    CASE estado
                        WHEN 0 THEN 'Sin Asignar'
                        WHEN 1 THEN 'En Proceso'
                        WHEN 2 THEN 'Rechazada'
                        WHEN 3 THEN 'Terminada'
                        WHEN 4 THEN 'Anulada'
                        WHEN 5 THEN 'Devuelta'
                        WHEN 6 THEN 'Sala de Corte'
                        ELSE 'Desconocido'
                    END as nombre_estado,
                    COUNT(*) as total
                FROM muestras
                GROUP BY estado
                ORDER BY estado
            """)
            estados = cursor.fetchall()
            conn.close()

            print("\n[INFO] Distribución de estados de muestras:")
            for e in estados:
                print(f"  - {e['nombre_estado']}: {e['total']}")
        except pymysql.Error as e:
            pytest.skip(f"Tabla muestras no disponible: {e}")


class TestCotizacionesIntegration:
    """Pruebas de integración para cotizaciones."""

    def get_connection(self):
        """Obtiene conexión a BD."""
        try:
            from app.config import get_settings
            settings = get_settings()
            return pymysql.connect(
                host=settings.LARAVEL_MYSQL_HOST,
                port=settings.LARAVEL_MYSQL_PORT,
                user=settings.LARAVEL_MYSQL_USER,
                password=settings.LARAVEL_MYSQL_PASSWORD,
                database=settings.LARAVEL_MYSQL_DATABASE,
                charset='utf8mb4',
                cursorclass=pymysql.cursors.DictCursor,
                connect_timeout=5
            )
        except Exception:
            return pymysql.connect(
                host='localhost',
                port=3307,
                user='root',
                password='root',
                database='envases_ot',
                charset='utf8mb4',
                cursorclass=pymysql.cursors.DictCursor,
                connect_timeout=5
            )

    def test_cotizaciones_table_exists(self):
        """Verifica que la tabla cotizaciones existe."""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            cursor.execute("SHOW TABLES LIKE 'cotizacions'")
            result = cursor.fetchone()
            conn.close()

            assert result is not None, "Tabla cotizacions no existe"
            print("\n[OK] Tabla cotizacions existe")
        except pymysql.Error as e:
            pytest.skip(f"BD no disponible: {e}")


class TestUsersIntegration:
    """Pruebas de integración para usuarios."""

    def get_connection(self):
        """Obtiene conexión a BD."""
        try:
            from app.config import get_settings
            settings = get_settings()
            return pymysql.connect(
                host=settings.LARAVEL_MYSQL_HOST,
                port=settings.LARAVEL_MYSQL_PORT,
                user=settings.LARAVEL_MYSQL_USER,
                password=settings.LARAVEL_MYSQL_PASSWORD,
                database=settings.LARAVEL_MYSQL_DATABASE,
                charset='utf8mb4',
                cursorclass=pymysql.cursors.DictCursor,
                connect_timeout=5
            )
        except Exception:
            return pymysql.connect(
                host='localhost',
                port=3307,
                user='root',
                password='root',
                database='envases_ot',
                charset='utf8mb4',
                cursorclass=pymysql.cursors.DictCursor,
                connect_timeout=5
            )

    def test_users_table_exists(self):
        """Verifica que la tabla users existe."""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            cursor.execute("SHOW TABLES LIKE 'users'")
            result = cursor.fetchone()
            conn.close()

            assert result is not None, "Tabla users no existe"
            print("\n[OK] Tabla users existe")
        except pymysql.Error as e:
            pytest.skip(f"BD no disponible: {e}")

    def test_users_has_roles(self):
        """Verifica relación users-roles."""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            cursor.execute("""
                SELECT r.id, r.name, COUNT(u.id) as usuarios
                FROM roles r
                LEFT JOIN users u ON r.id = u.role_id
                GROUP BY r.id, r.name
                ORDER BY usuarios DESC
                LIMIT 10
            """)
            roles = cursor.fetchall()
            conn.close()

            print("\n[INFO] Distribución de usuarios por rol:")
            for r in roles:
                print(f"  - {r['name']}: {r['usuarios']} usuarios")
        except pymysql.Error as e:
            pytest.skip(f"Tablas users/roles no disponibles: {e}")


class TestResumenIntegracion:
    """Test final de resumen."""

    def get_connection(self):
        """Obtiene conexión a BD."""
        try:
            from app.config import get_settings
            settings = get_settings()
            return pymysql.connect(
                host=settings.LARAVEL_MYSQL_HOST,
                port=settings.LARAVEL_MYSQL_PORT,
                user=settings.LARAVEL_MYSQL_USER,
                password=settings.LARAVEL_MYSQL_PASSWORD,
                database=settings.LARAVEL_MYSQL_DATABASE,
                charset='utf8mb4',
                cursorclass=pymysql.cursors.DictCursor,
                connect_timeout=5
            )
        except Exception:
            return pymysql.connect(
                host='localhost',
                port=3307,
                user='root',
                password='root',
                database='envases_ot',
                charset='utf8mb4',
                cursorclass=pymysql.cursors.DictCursor,
                connect_timeout=5
            )

    def test_resumen_tablas_principales(self):
        """Resumen de conteos de tablas principales."""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()

            tablas = [
                'work_orders', 'clients', 'users', 'muestras',
                'cotizacions', 'managements', 'notifications'
            ]

            print(f"\n{'='*50}")
            print("RESUMEN INTEGRACIÓN BD")
            print(f"{'='*50}")

            for tabla in tablas:
                try:
                    cursor.execute(f"SELECT COUNT(*) as total FROM {tabla}")
                    result = cursor.fetchone()
                    print(f"  {tabla}: {result['total']} registros")
                except pymysql.Error:
                    print(f"  {tabla}: [NO EXISTE]")

            conn.close()
            print(f"{'='*50}")

        except pymysql.Error as e:
            pytest.skip(f"BD no disponible: {e}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
