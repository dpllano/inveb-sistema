"""
Router de Mantenedor de Instalaciones - INVEB Cascade Service
CRUD completo para la tabla installations de MySQL Laravel.
Issue 4: No se ven las instalaciones, no se pueden crear ni modificar.
Fuente: Laravel ClientController lineas 179-234, 382-387, 278-365

NOTA TABLA FSC:
- En Laravel la tabla se llama 'fsc' (singular, NO 'fscs')
- Migracion: 2021_09_15_105008_create_table_fsc.php
- Modelo: app/Fsc.php con $table = 'fsc'
- Contiene 7 opciones: No, Si, Sin FSC, Logo FSC solo EEII, etc.
- Si la tabla no existe en Railway, se usa NULL como fallback.
"""
from typing import Optional, List, Union
from fastapi import APIRouter, HTTPException, status, Query, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, EmailStr, ConfigDict
import pymysql
import jwt
import logging

from app.config import get_settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/mantenedores/installations", tags=["Mantenedor - Instalaciones"])
security = HTTPBearer(auto_error=False)
settings = get_settings()


def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> int:
    """Extrae el user_id del token JWT."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Token no proporcionado")
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return int(payload.get("sub"))
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalido")


def get_mysql_connection():
    """Obtiene conexion a MySQL de Laravel."""
    return pymysql.connect(
        host=settings.LARAVEL_MYSQL_HOST,
        port=settings.LARAVEL_MYSQL_PORT,
        user=settings.LARAVEL_MYSQL_USER,
        password=settings.LARAVEL_MYSQL_PASSWORD,
        database=settings.LARAVEL_MYSQL_DATABASE,
        cursorclass=pymysql.cursors.DictCursor,
        charset='utf8mb4'
    )


# Schemas basados en migracion Laravel 2023_04_19_151737_create_installations_table.php
class InstallationBase(BaseModel):
    """Campos base de instalacion."""
    model_config = ConfigDict(extra='ignore')  # Ignorar campos extra de la BD

    nombre: Optional[str] = Field(None, max_length=255)
    tipo_pallet: Optional[int] = None
    altura_pallet: Optional[int] = None
    sobresalir_carga: Optional[int] = None
    bulto_zunchado: Optional[int] = None
    formato_etiqueta: Optional[int] = None
    etiquetas_pallet: Optional[int] = None
    termocontraible: Optional[int] = None
    fsc: Optional[int] = None
    pais_mercado_destino: Optional[int] = None
    certificado_calidad: Optional[int] = None
    active: Optional[int] = 1
    # Contacto 1 - Usar str en lugar de EmailStr para evitar validacion estricta en respuestas
    nombre_contacto: Optional[str] = None
    cargo_contacto: Optional[str] = None
    email_contacto: Optional[str] = None
    phone_contacto: Optional[str] = None
    direccion_contacto: Optional[str] = None
    comuna_contacto: Optional[int] = None
    active_contacto: Optional[str] = "inactivo"
    # Contacto 2
    nombre_contacto_2: Optional[str] = None
    cargo_contacto_2: Optional[str] = None
    email_contacto_2: Optional[str] = None
    phone_contacto_2: Optional[str] = None
    direccion_contacto_2: Optional[str] = None
    comuna_contacto_2: Optional[int] = None
    active_contacto_2: Optional[str] = "inactivo"
    # Contacto 3
    nombre_contacto_3: Optional[str] = None
    cargo_contacto_3: Optional[str] = None
    email_contacto_3: Optional[str] = None
    phone_contacto_3: Optional[str] = None
    direccion_contacto_3: Optional[str] = None
    comuna_contacto_3: Optional[int] = None
    active_contacto_3: Optional[str] = "inactivo"
    # Contacto 4
    nombre_contacto_4: Optional[str] = None
    cargo_contacto_4: Optional[str] = None
    email_contacto_4: Optional[str] = None
    phone_contacto_4: Optional[str] = None
    direccion_contacto_4: Optional[str] = None
    comuna_contacto_4: Optional[int] = None
    active_contacto_4: Optional[str] = "inactivo"
    # Contacto 5
    nombre_contacto_5: Optional[str] = None
    cargo_contacto_5: Optional[str] = None
    email_contacto_5: Optional[str] = None
    phone_contacto_5: Optional[str] = None
    direccion_contacto_5: Optional[str] = None
    comuna_contacto_5: Optional[int] = None
    active_contacto_5: Optional[str] = "inactivo"


class InstallationCreate(InstallationBase):
    """Schema para crear instalacion.

    client_id puede ser:
    - int: ID real del cliente (modo edicion)
    - str: codigo_carga temporal (modo creacion de cliente nuevo)

    El codigo_carga sigue el patron Laravel: Auth::user()->id . date('ymdhis')
    """
    client_id: Union[int, str] = Field(..., description="ID del cliente o codigo_carga temporal")


class InstallationUpdate(InstallationBase):
    """Schema para actualizar instalacion."""
    pass


class InstallationResponse(BaseModel):
    """Respuesta de operacion."""
    id: int
    message: str


class InstallationListItem(BaseModel):
    """Item de lista de instalaciones."""
    model_config = ConfigDict(extra='ignore')

    id: int
    nombre: Optional[str]
    client_id: Union[int, str]  # Puede ser int o string (codigo_carga)
    tipo_pallet_nombre: Optional[str]
    fsc_nombre: Optional[str]
    pais_nombre: Optional[str]
    active: Optional[int]


class InstallationDetail(InstallationBase):
    """Detalle completo de instalacion."""
    model_config = ConfigDict(extra='ignore')  # Ignorar campos extra de la BD

    id: int
    client_id: Union[int, str]  # Puede ser int o string (codigo_carga)
    tipo_pallet_nombre: Optional[str] = None
    fsc_nombre: Optional[str] = None
    formato_etiqueta_nombre: Optional[str] = None
    certificado_calidad_nombre: Optional[str] = None
    pais_nombre: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


# Endpoints

@router.get("/by-client/{client_id}", response_model=List[InstallationListItem])
async def get_installations_by_client(
    client_id: str,  # Acepta string para soportar codigo_carga
    user_id: int = Depends(get_current_user_id)
):
    """
    Obtiene instalaciones de un cliente. Usado en cascada Cliente -> Instalacion.

    client_id puede ser:
    - Un numero (ID real del cliente)
    - Un string alfanumerico (codigo_carga temporal para clientes nuevos)

    NOTA: Intenta hacer JOIN con tabla 'fsc' (singular, como en Laravel).
    Si la tabla no existe en Railway, usa NULL como fallback.
    """
    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            # Verificar si existe la tabla fsc (nombre correcto de Laravel)
            cursor.execute("""
                SELECT COUNT(*) as existe FROM information_schema.tables
                WHERE table_schema = DATABASE() AND table_name = 'fsc'
            """)
            fsc_exists = cursor.fetchone()['existe'] > 0

            if fsc_exists:
                # Query completa con subquery escalar a fsc (evita duplicados).
                # Bug runtime descubierto: la tabla `fsc` tiene registros duplicados por
                # `codigo` (ej. codigo=6 aparece en id=7 'FSC solo facturacion' e id=14
                # 'FSC solo facturacion' duplicado). Un LEFT JOIN multiplicaba las filas
                # de installations. Subquery escalar con LIMIT 1 garantiza 1 fila.
                cursor.execute("""
                    SELECT
                        i.id,
                        i.nombre,
                        i.client_id,
                        pt.descripcion as tipo_pallet_nombre,
                        (SELECT f.descripcion FROM fsc f WHERE f.codigo = i.fsc LIMIT 1) as fsc_nombre,
                        p.name as pais_nombre,
                        i.active
                    FROM installations i
                    LEFT JOIN pallet_types pt ON i.tipo_pallet = pt.id
                    LEFT JOIN paises p ON i.pais_mercado_destino = p.id
                    WHERE i.client_id = %s AND i.deleted = 0
                    ORDER BY i.nombre
                """, (client_id,))
            else:
                # Fallback sin tabla fsc
                logger.warning("Tabla 'fsc' no existe en la BD. Usando NULL como fallback.")
                cursor.execute("""
                    SELECT
                        i.id,
                        i.nombre,
                        i.client_id,
                        pt.descripcion as tipo_pallet_nombre,
                        NULL as fsc_nombre,
                        p.name as pais_nombre,
                        i.active
                    FROM installations i
                    LEFT JOIN pallet_types pt ON i.tipo_pallet = pt.id
                    LEFT JOIN paises p ON i.pais_mercado_destino = p.id
                    WHERE i.client_id = %s AND i.deleted = 0
                    ORDER BY i.nombre
                """, (client_id,))

            return cursor.fetchall()
    finally:
        connection.close()


@router.get("/{installation_id}")
async def get_installation(
    installation_id: int,
    user_id: int = Depends(get_current_user_id)
):
    """
    Obtiene detalle de una instalacion. Equivalente a Laravel edit_installation().

    NOTA: Intenta hacer JOIN con tabla 'fsc' (singular, como en Laravel).
    Si la tabla no existe, usa NULL como fallback.
    Devuelve dict directamente para evitar errores de validación Pydantic.
    """
    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            # Verificar si existe la tabla fsc
            cursor.execute("""
                SELECT COUNT(*) as existe FROM information_schema.tables
                WHERE table_schema = DATABASE() AND table_name = 'fsc'
            """)
            fsc_exists = cursor.fetchone()['existe'] > 0

            if fsc_exists:
                cursor.execute("""
                    SELECT
                        i.*,
                        pt.descripcion as tipo_pallet_nombre,
                        f.descripcion as fsc_nombre,
                        pf.descripcion as formato_etiqueta_nombre,
                        pq.descripcion as certificado_calidad_nombre,
                        p.name as pais_nombre,
                        DATE_FORMAT(i.created_at, '%%Y-%%m-%%d %%H:%%i') as created_at,
                        DATE_FORMAT(i.updated_at, '%%Y-%%m-%%d %%H:%%i') as updated_at
                    FROM installations i
                    LEFT JOIN pallet_types pt ON i.tipo_pallet = pt.id
                    LEFT JOIN fsc f ON i.fsc = f.codigo
                    LEFT JOIN pallet_tag_formats pf ON i.formato_etiqueta = pf.id
                    LEFT JOIN pallet_qas pq ON i.certificado_calidad = pq.id
                    LEFT JOIN paises p ON i.pais_mercado_destino = p.id
                    WHERE i.id = %s AND i.deleted = 0
                """, (installation_id,))
            else:
                logger.warning("Tabla 'fsc' no existe en la BD. Usando NULL como fallback.")
                cursor.execute("""
                    SELECT
                        i.*,
                        pt.descripcion as tipo_pallet_nombre,
                        NULL as fsc_nombre,
                        pf.descripcion as formato_etiqueta_nombre,
                        pq.descripcion as certificado_calidad_nombre,
                        p.name as pais_nombre,
                        DATE_FORMAT(i.created_at, '%%Y-%%m-%%d %%H:%%i') as created_at,
                        DATE_FORMAT(i.updated_at, '%%Y-%%m-%%d %%H:%%i') as updated_at
                    FROM installations i
                    LEFT JOIN pallet_types pt ON i.tipo_pallet = pt.id
                    LEFT JOIN pallet_tag_formats pf ON i.formato_etiqueta = pf.id
                    LEFT JOIN pallet_qas pq ON i.certificado_calidad = pq.id
                    LEFT JOIN paises p ON i.pais_mercado_destino = p.id
                    WHERE i.id = %s AND i.deleted = 0
                """, (installation_id,))

            installation = cursor.fetchone()
            if not installation:
                raise HTTPException(status_code=404, detail="Instalacion no encontrada")

            # Convertir a dict y limpiar valores para evitar errores de serialización
            result = dict(installation)
            # Asegurar que campos string no sean None cuando deberían ser string vacío
            string_fields = [
                'nombre', 'nombre_contacto', 'cargo_contacto', 'email_contacto',
                'phone_contacto', 'direccion_contacto', 'active_contacto',
                'nombre_contacto_2', 'cargo_contacto_2', 'email_contacto_2',
                'phone_contacto_2', 'direccion_contacto_2', 'active_contacto_2',
                'nombre_contacto_3', 'cargo_contacto_3', 'email_contacto_3',
                'phone_contacto_3', 'direccion_contacto_3', 'active_contacto_3',
                'nombre_contacto_4', 'cargo_contacto_4', 'email_contacto_4',
                'phone_contacto_4', 'direccion_contacto_4', 'active_contacto_4',
                'nombre_contacto_5', 'cargo_contacto_5', 'email_contacto_5',
                'phone_contacto_5', 'direccion_contacto_5', 'active_contacto_5',
            ]
            for field in string_fields:
                if field in result and result[field] is None:
                    result[field] = ''

            return result
    except Exception as e:
        logger.error(f"Error obteniendo instalacion {installation_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")
    finally:
        connection.close()


@router.post("/", response_model=InstallationResponse, status_code=status.HTTP_201_CREATED)
async def create_installation(
    data: InstallationCreate,
    user_id: int = Depends(get_current_user_id)
):
    """
    Crea una nueva instalacion. Equivalente a Laravel store_installation().

    Soporta el patron codigo_carga de Laravel:
    - Si client_id es numerico: verifica que el cliente existe
    - Si client_id es alfanumerico (codigo_carga): permite crear sin cliente (cliente nuevo)

    Laravel ref: ClientController.php lineas 162-168
    """
    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            # Determinar si es ID real o codigo_carga
            client_id_str = str(data.client_id)
            is_codigo_carga = not client_id_str.isdigit()

            # Solo verificar cliente si es ID numerico real
            if not is_codigo_carga:
                cursor.execute("SELECT id FROM clients WHERE id = %s", (data.client_id,))
                if not cursor.fetchone():
                    raise HTTPException(status_code=404, detail="Cliente no encontrado")
            else:
                logger.info(f"[INSTALLATION] Creando con codigo_carga: {data.client_id}")

            # Insertar instalacion (basado en Laravel ClientController lineas 184-234)
            cursor.execute("""
                INSERT INTO installations (
                    nombre, client_id, tipo_pallet, altura_pallet, sobresalir_carga,
                    bulto_zunchado, formato_etiqueta, etiquetas_pallet, termocontraible,
                    fsc, pais_mercado_destino, certificado_calidad, active,
                    nombre_contacto, cargo_contacto, email_contacto, phone_contacto,
                    direccion_contacto, comuna_contacto, active_contacto,
                    nombre_contacto_2, cargo_contacto_2, email_contacto_2, phone_contacto_2,
                    direccion_contacto_2, comuna_contacto_2, active_contacto_2,
                    nombre_contacto_3, cargo_contacto_3, email_contacto_3, phone_contacto_3,
                    direccion_contacto_3, comuna_contacto_3, active_contacto_3,
                    nombre_contacto_4, cargo_contacto_4, email_contacto_4, phone_contacto_4,
                    direccion_contacto_4, comuna_contacto_4, active_contacto_4,
                    nombre_contacto_5, cargo_contacto_5, email_contacto_5, phone_contacto_5,
                    direccion_contacto_5, comuna_contacto_5, active_contacto_5,
                    deleted, created_at, updated_at
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s, %s,
                    0, NOW(), NOW()
                )
            """, (
                data.nombre, data.client_id, data.tipo_pallet, data.altura_pallet, data.sobresalir_carga,
                data.bulto_zunchado, data.formato_etiqueta, data.etiquetas_pallet, data.termocontraible,
                data.fsc, data.pais_mercado_destino, data.certificado_calidad, data.active,
                data.nombre_contacto, data.cargo_contacto, data.email_contacto, data.phone_contacto,
                data.direccion_contacto, data.comuna_contacto, data.active_contacto or 'inactivo',
                data.nombre_contacto_2, data.cargo_contacto_2, data.email_contacto_2, data.phone_contacto_2,
                data.direccion_contacto_2, data.comuna_contacto_2, data.active_contacto_2 or 'inactivo',
                data.nombre_contacto_3, data.cargo_contacto_3, data.email_contacto_3, data.phone_contacto_3,
                data.direccion_contacto_3, data.comuna_contacto_3, data.active_contacto_3 or 'inactivo',
                data.nombre_contacto_4, data.cargo_contacto_4, data.email_contacto_4, data.phone_contacto_4,
                data.direccion_contacto_4, data.comuna_contacto_4, data.active_contacto_4 or 'inactivo',
                data.nombre_contacto_5, data.cargo_contacto_5, data.email_contacto_5, data.phone_contacto_5,
                data.direccion_contacto_5, data.comuna_contacto_5, data.active_contacto_5 or 'inactivo'
            ))

            connection.commit()
            installation_id = cursor.lastrowid

            return InstallationResponse(
                id=installation_id,
                message="Instalacion creada exitosamente"
            )
    finally:
        connection.close()


@router.put("/{installation_id}", response_model=InstallationResponse)
async def update_installation(
    installation_id: int,
    data: InstallationUpdate,
    user_id: int = Depends(get_current_user_id)
):
    """
    Actualiza una instalacion. Equivalente a Laravel update_installation().
    Build: 2026-03-16 - Fix para campos de configuración de pallet
    """
    # Debug: mostrar datos recibidos
    logger.info(f"[INSTALLATION UPDATE] id={installation_id}, data={data.model_dump()}")

    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            # Verificar que existe
            cursor.execute("SELECT id FROM installations WHERE id = %s AND deleted = 0", (installation_id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Instalacion no encontrada")

            # Construir UPDATE dinamico
            updates = []
            params = []

            # Campos principales
            field_mapping = {
                'nombre': 'nombre',
                'tipo_pallet': 'tipo_pallet',
                'altura_pallet': 'altura_pallet',
                'sobresalir_carga': 'sobresalir_carga',
                'bulto_zunchado': 'bulto_zunchado',
                'formato_etiqueta': 'formato_etiqueta',
                'etiquetas_pallet': 'etiquetas_pallet',
                'termocontraible': 'termocontraible',
                'fsc': 'fsc',
                'pais_mercado_destino': 'pais_mercado_destino',
                'certificado_calidad': 'certificado_calidad',
                'active': 'active',
                # Contactos
                'nombre_contacto': 'nombre_contacto',
                'cargo_contacto': 'cargo_contacto',
                'email_contacto': 'email_contacto',
                'phone_contacto': 'phone_contacto',
                'direccion_contacto': 'direccion_contacto',
                'comuna_contacto': 'comuna_contacto',
                'active_contacto': 'active_contacto',
                'nombre_contacto_2': 'nombre_contacto_2',
                'cargo_contacto_2': 'cargo_contacto_2',
                'email_contacto_2': 'email_contacto_2',
                'phone_contacto_2': 'phone_contacto_2',
                'direccion_contacto_2': 'direccion_contacto_2',
                'comuna_contacto_2': 'comuna_contacto_2',
                'active_contacto_2': 'active_contacto_2',
                'nombre_contacto_3': 'nombre_contacto_3',
                'cargo_contacto_3': 'cargo_contacto_3',
                'email_contacto_3': 'email_contacto_3',
                'phone_contacto_3': 'phone_contacto_3',
                'direccion_contacto_3': 'direccion_contacto_3',
                'comuna_contacto_3': 'comuna_contacto_3',
                'active_contacto_3': 'active_contacto_3',
                'nombre_contacto_4': 'nombre_contacto_4',
                'cargo_contacto_4': 'cargo_contacto_4',
                'email_contacto_4': 'email_contacto_4',
                'phone_contacto_4': 'phone_contacto_4',
                'direccion_contacto_4': 'direccion_contacto_4',
                'comuna_contacto_4': 'comuna_contacto_4',
                'active_contacto_4': 'active_contacto_4',
                'nombre_contacto_5': 'nombre_contacto_5',
                'cargo_contacto_5': 'cargo_contacto_5',
                'email_contacto_5': 'email_contacto_5',
                'phone_contacto_5': 'phone_contacto_5',
                'direccion_contacto_5': 'direccion_contacto_5',
                'comuna_contacto_5': 'comuna_contacto_5',
                'active_contacto_5': 'active_contacto_5',
            }

            for field_name, db_column in field_mapping.items():
                value = getattr(data, field_name, None)
                if value is not None:
                    updates.append(f"{db_column} = %s")
                    params.append(value)

            if not updates:
                raise HTTPException(status_code=400, detail="No se proporcionaron campos para actualizar")

            updates.append("updated_at = NOW()")
            params.append(installation_id)

            query = f"UPDATE installations SET {', '.join(updates)} WHERE id = %s"
            cursor.execute(query, params)
            connection.commit()

            return InstallationResponse(
                id=installation_id,
                message="Instalacion actualizada exitosamente"
            )
    finally:
        connection.close()


@router.delete("/{installation_id}", response_model=InstallationResponse)
async def delete_installation(
    installation_id: int,
    user_id: int = Depends(get_current_user_id)
):
    """Elimina (soft delete) una instalacion."""
    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT id FROM installations WHERE id = %s AND deleted = 0", (installation_id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Instalacion no encontrada")

            # Soft delete
            cursor.execute(
                "UPDATE installations SET deleted = 1, updated_at = NOW() WHERE id = %s",
                (installation_id,)
            )
            connection.commit()

            return InstallationResponse(
                id=installation_id,
                message="Instalacion eliminada exitosamente"
            )
    finally:
        connection.close()
