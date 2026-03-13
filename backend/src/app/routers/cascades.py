"""
Router de Cascadas AJAX - INVEB Cascade Service
Endpoints para carga dinámica de selectores dependientes.
FASE 6.25
"""
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
import pymysql
import jwt

from app.config import get_settings

router = APIRouter(prefix="/cascades", tags=["Cascadas AJAX"])
security = HTTPBearer(auto_error=False)
settings = get_settings()


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Extrae info del usuario del token JWT."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Token no proporcionado")
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return {"id": int(payload.get("sub")), "role_id": payload.get("role_id", 0)}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalido")


def get_db_connection():
    """Conexion a MySQL usando configuracion de settings."""
    return pymysql.connect(
        host=settings.LARAVEL_MYSQL_HOST,
        port=settings.LARAVEL_MYSQL_PORT,
        user=settings.LARAVEL_MYSQL_USER,
        password=settings.LARAVEL_MYSQL_PASSWORD,
        database=settings.LARAVEL_MYSQL_DATABASE,
        cursorclass=pymysql.cursors.DictCursor,
        charset='utf8mb4'
    )


# =============================================
# SCHEMAS
# =============================================

class SelectOption(BaseModel):
    id: int
    nombre: str


class InstalacionOption(BaseModel):
    id: int
    nombre: str
    direccion: Optional[str] = None


class ContactoOption(BaseModel):
    """Opción de contacto. Issues 6, 7: Incluir cargo, comuna, dirección."""
    id: int
    nombre: str
    cargo: Optional[str] = None  # Issue 6: Campo faltante
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    comuna_id: Optional[int] = None  # Para autocompletar en Envío Cliente VB
    direccion: Optional[str] = None  # Para autocompletar en Envío Cliente VB


class InstalacionInfo(BaseModel):
    contactos: List[ContactoOption]
    tipo_pallet_id: Optional[int] = None
    altura_pallet: Optional[float] = None
    sobresalir_carga: Optional[int] = None
    bulto_zunchado: Optional[int] = None
    formato_etiqueta: Optional[int] = None  # ID de formato etiqueta
    etiquetas_pallet: Optional[int] = None
    termocontraible: Optional[int] = None
    fsc: Optional[int] = None
    pais_mercado_destino: Optional[int] = None  # ID de país mercado destino
    certificado_calidad: Optional[int] = None


class ContactoInfo(BaseModel):
    nombre_contacto: str
    email_contacto: Optional[EmailStr] = None
    telefono_contacto: Optional[str] = None
    comuna_contacto: Optional[str] = None
    direccion_contacto: Optional[str] = None


class ClienteCotizaResponse(BaseModel):
    instalaciones: List[InstalacionOption]
    clasificacion_id: Optional[int] = None
    clasificacion_nombre: Optional[str] = None


# =============================================
# ENDPOINTS - CLIENTE → INSTALACIONES
# =============================================

@router.get("/clientes/{client_id}/instalaciones", response_model=List[InstalacionOption])
async def get_instalaciones_cliente(
    client_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Obtiene instalaciones de un cliente.
    Equivalente a: /getInstalacionesCliente
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Issue 4: La tabla usa 'deleted' (0=activo) en lugar de 'active'
            cursor.execute("""
                SELECT id, COALESCE(nombre, CONCAT('Instalación #', id)) as nombre, direccion_contacto as direccion
                FROM installations
                WHERE client_id = %s AND (deleted = 0 OR deleted IS NULL)
                ORDER BY nombre
            """, (client_id,))
            rows = cursor.fetchall()
            return [
                InstalacionOption(
                    id=row["id"],
                    nombre=row["nombre"],
                    direccion=row.get("direccion")
                )
                for row in rows
            ]
    finally:
        conn.close()


@router.get("/clientes/{client_id}/instalaciones-cotiza", response_model=ClienteCotizaResponse)
async def get_instalaciones_cliente_cotiza(
    client_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Obtiene instalaciones y clasificación de un cliente para cotizaciones.
    Equivalente a: /getInstalacionesClienteCotiza
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Obtener cliente con clasificación
            cursor.execute("""
                SELECT c.clasificacion as clasificacion_id, cc.name as clasificacion_nombre
                FROM clients c
                LEFT JOIN clasificacion_clientes cc ON c.clasificacion = cc.id
                WHERE c.id = %s
            """, (client_id,))
            client = cursor.fetchone()

            # Obtener instalaciones - Issue 4: usa 'deleted' en lugar de 'active'
            cursor.execute("""
                SELECT id, COALESCE(nombre, CONCAT('Instalación #', id)) as nombre, direccion_contacto as direccion
                FROM installations
                WHERE client_id = %s AND (deleted = 0 OR deleted IS NULL)
                ORDER BY nombre
            """, (client_id,))
            instalaciones = cursor.fetchall()

            return ClienteCotizaResponse(
                instalaciones=[
                    InstalacionOption(
                        id=row["id"],
                        nombre=row["nombre"],
                        direccion=row.get("direccion")
                    )
                    for row in instalaciones
                ],
                clasificacion_id=client["clasificacion_id"] if client else None,
                clasificacion_nombre=client["clasificacion_nombre"] if client else None
            )
    finally:
        conn.close()


# =============================================
# ENDPOINTS - CLIENTE/INSTALACIÓN → CONTACTOS
# =============================================

@router.get("/clientes/{client_id}/contactos", response_model=List[ContactoOption])
async def get_contactos_cliente(
    client_id: int,
    instalacion_id: Optional[int] = Query(None, description="Filtrar por instalación"),
    current_user: dict = Depends(get_current_user)
):
    """
    Obtiene contactos de un cliente, opcionalmente filtrados por instalación.
    Equivalente a: /getContactosCliente

    Si se proporciona instalacion_id, obtiene los contactos embebidos en la instalación.
    Si no, obtiene los contactos de client_contacts.
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            contactos = []

            if instalacion_id:
                # Obtener contactos embebidos en la instalación
                # Issue 6, 7: Incluir cargo_contacto, comuna_contacto, direccion_contacto según Laravel ClientController líneas 300-347
                cursor.execute("""
                    SELECT
                        nombre_contacto, cargo_contacto, email_contacto, phone_contacto, comuna_contacto, direccion_contacto,
                        nombre_contacto_2, cargo_contacto_2, email_contacto_2, phone_contacto_2, comuna_contacto_2, direccion_contacto_2,
                        nombre_contacto_3, cargo_contacto_3, email_contacto_3, phone_contacto_3, comuna_contacto_3, direccion_contacto_3,
                        nombre_contacto_4, cargo_contacto_4, email_contacto_4, phone_contacto_4, comuna_contacto_4, direccion_contacto_4,
                        nombre_contacto_5, cargo_contacto_5, email_contacto_5, phone_contacto_5, comuna_contacto_5, direccion_contacto_5
                    FROM installations
                    WHERE id = %s AND client_id = %s
                """, (instalacion_id, client_id))
                row = cursor.fetchone()

                if row:
                    # Construir lista de contactos desde campos embebidos
                    for i in range(1, 6):
                        suffix = "" if i == 1 else f"_{i}"
                        nombre = row.get(f"nombre_contacto{suffix}")
                        if nombre:
                            contactos.append(ContactoOption(
                                id=i,  # ID sintético basado en posición
                                nombre=nombre,
                                cargo=row.get(f"cargo_contacto{suffix}"),  # Issue 6
                                email=row.get(f"email_contacto{suffix}"),
                                telefono=row.get(f"phone_contacto{suffix}"),
                                comuna_id=row.get(f"comuna_contacto{suffix}"),  # Para autocompletar
                                direccion=row.get(f"direccion_contacto{suffix}")  # Para autocompletar
                            ))
            else:
                # Sin instalación, obtener contactos embebidos del cliente
                # Nota: Contacto 1 es 'nombre_contacto', contactos 2-5 son 'nombre_contacto_2', etc.
                cursor.execute("""
                    SELECT
                        nombre_contacto, cargo_contacto, email_contacto, phone_contacto, active_contacto, comuna_contacto, direccion_contacto,
                        nombre_contacto_2, cargo_contacto_2, email_contacto_2, phone_contacto_2, active_contacto_2, comuna_contacto_2, direccion_contacto_2,
                        nombre_contacto_3, cargo_contacto_3, email_contacto_3, phone_contacto_3, active_contacto_3, comuna_contacto_3, direccion_contacto_3,
                        nombre_contacto_4, cargo_contacto_4, email_contacto_4, phone_contacto_4, active_contacto_4, comuna_contacto_4, direccion_contacto_4,
                        nombre_contacto_5, cargo_contacto_5, email_contacto_5, phone_contacto_5, active_contacto_5, comuna_contacto_5, direccion_contacto_5
                    FROM clients
                    WHERE id = %s
                """, (client_id,))
                row = cursor.fetchone()
                if row:
                    # Contacto 1 (sin sufijo numérico)
                    if row.get("nombre_contacto") and row.get("active_contacto") == "activo":
                        contactos.append(ContactoOption(
                            id=1,
                            nombre=row["nombre_contacto"],
                            cargo=row.get("cargo_contacto"),
                            email=row.get("email_contacto"),
                            telefono=row.get("phone_contacto"),
                            comuna_id=row.get("comuna_contacto"),
                            direccion=row.get("direccion_contacto")
                        ))
                    # Contactos 2-5
                    for i in range(2, 6):
                        nombre = row.get(f"nombre_contacto_{i}")
                        activo = row.get(f"active_contacto_{i}")
                        if nombre and activo == "activo":
                            contactos.append(ContactoOption(
                                id=i,
                                nombre=nombre,
                                cargo=row.get(f"cargo_contacto_{i}"),
                                email=row.get(f"email_contacto_{i}"),
                                telefono=row.get(f"phone_contacto_{i}"),
                                comuna_id=row.get(f"comuna_contacto_{i}"),
                                direccion=row.get(f"direccion_contacto_{i}")
                            ))

            return contactos
    finally:
        conn.close()


# =============================================
# ENDPOINTS - INSTALACIÓN → INFO COMPLETA
# =============================================

@router.get("/instalaciones/{instalacion_id}", response_model=InstalacionInfo)
async def get_informacion_instalacion(
    instalacion_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Obtiene información completa de una instalación incluyendo contactos.
    Equivalente a: /getInformacionInstalacion
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Datos de la instalación
            cursor.execute("""
                SELECT
                    tipo_pallet as tipo_pallet_id,
                    altura_pallet,
                    sobresalir_carga,
                    bulto_zunchado,
                    formato_etiqueta,
                    etiquetas_pallet,
                    termocontraible,
                    fsc,
                    pais_mercado_destino,
                    certificado_calidad
                FROM installations
                WHERE id = %s
            """, (instalacion_id,))
            instalacion = cursor.fetchone()

            if not instalacion:
                raise HTTPException(status_code=404, detail="Instalación no encontrada")

            # Los contactos están embebidos en la tabla installations
            # Obtener datos de contacto de la instalación
            # Issue 6, 7: Incluir cargo_contacto
            cursor.execute("""
                SELECT
                    nombre_contacto, cargo_contacto, email_contacto, phone_contacto,
                    nombre_contacto_2, cargo_contacto_2, email_contacto_2, phone_contacto_2,
                    nombre_contacto_3, cargo_contacto_3, email_contacto_3, phone_contacto_3,
                    nombre_contacto_4, cargo_contacto_4, email_contacto_4, phone_contacto_4,
                    nombre_contacto_5, cargo_contacto_5, email_contacto_5, phone_contacto_5
                FROM installations
                WHERE id = %s
            """, (instalacion_id,))
            contacto_data = cursor.fetchone()

            # Construir lista de contactos desde campos embebidos
            contactos = []
            if contacto_data:
                for i in range(1, 6):
                    suffix = "" if i == 1 else f"_{i}"
                    nombre = contacto_data.get(f"nombre_contacto{suffix}")
                    if nombre:
                        contactos.append(ContactoOption(
                            id=i,  # ID sintético
                            nombre=nombre,
                            cargo=contacto_data.get(f"cargo_contacto{suffix}"),  # Issue 6
                            email=contacto_data.get(f"email_contacto{suffix}"),
                            telefono=contacto_data.get(f"phone_contacto{suffix}")
                        ))

            return InstalacionInfo(
                contactos=contactos,
                tipo_pallet_id=instalacion.get("tipo_pallet_id"),
                altura_pallet=instalacion.get("altura_pallet"),
                sobresalir_carga=instalacion.get("sobresalir_carga"),
                bulto_zunchado=instalacion.get("bulto_zunchado"),
                formato_etiqueta=instalacion.get("formato_etiqueta"),
                etiquetas_pallet=instalacion.get("etiquetas_pallet"),
                termocontraible=instalacion.get("termocontraible"),
                fsc=instalacion.get("fsc"),
                pais_mercado_destino=instalacion.get("pais_mercado_destino"),
                certificado_calidad=instalacion.get("certificado_calidad")
            )
    finally:
        conn.close()


# =============================================
# ENDPOINTS - CONTACTO → DATOS
# =============================================

@router.get("/contactos/{contacto_id}", response_model=ContactoInfo)
async def get_datos_contacto(
    contacto_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Obtiene datos completos de un contacto.
    Equivalente a: /getDatosContacto
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Usar client_contacts en lugar de contact_instalations
            cursor.execute("""
                SELECT
                    nombre as nombre_contacto,
                    email as email_contacto,
                    telefono as telefono_contacto
                FROM client_contacts
                WHERE id = %s
            """, (contacto_id,))
            contacto = cursor.fetchone()

            if not contacto:
                raise HTTPException(status_code=404, detail="Contacto no encontrado")

            return ContactoInfo(
                nombre_contacto=contacto["nombre_contacto"] or "",
                email_contacto=contacto.get("email_contacto"),
                telefono_contacto=contacto.get("telefono_contacto"),
                comuna_contacto=None,  # No disponible en client_contacts
                direccion_contacto=None  # No disponible en client_contacts
            )
    finally:
        conn.close()


# =============================================
# ENDPOINTS - TIPO PRODUCTO → SERVICIOS MAQUILA
# =============================================

@router.get("/productos/{tipo_producto_id}/servicios-maquila", response_model=List[SelectOption])
async def get_servicios_maquila(
    tipo_producto_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Obtiene servicios de maquila disponibles según el tipo de producto.
    Equivalente a: /getServiciosMaquila
    Mapeo basado en DetalleCotizacionController.php
    """
    # Mapeo de tipo producto a servicios de maquila (según Laravel)
    mapeos = {
        # Plancha (16) → Paletizado Placas (18)
        16: [18],
        # Caja Regular RSC (3), Fondo (4), Tapa (5), Caja Especial (15) → PM CJ Chica/Mediana/Grande
        3: [15, 16, 17],
        4: [15, 16, 17],
        5: [15, 16, 17],
        15: [15, 16, 17],
        # Caja Bipartida (31) → Pegado Especial (21)
        31: [21],
        # Tabiques (18, 33, 20, 19) → Armado y Paletizado (19, 20)
        18: [19, 20],
        33: [19, 20],
        20: [19, 20],
        19: [19, 20],
        # Wrap Around (17, 32, 35) → Wrap Around (22)
        17: [22],
        32: [22],
        35: [22],
        # PAD (6) → Paletizado Placas (18)
        6: [18],
        # Esquinero (7), Zuncho (8), Bobina (10), Display (11) → Solo Paletizado (23)
        7: [23],
        8: [23],
        10: [23],
        11: [23],
    }

    servicio_ids = mapeos.get(tipo_producto_id, [])

    if not servicio_ids:
        return []

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            placeholders = ', '.join(['%s'] * len(servicio_ids))
            cursor.execute(f"""
                SELECT id, servicio as nombre
                FROM maquila_servicios
                WHERE id IN ({placeholders}) AND active = 1
                ORDER BY servicio
            """, servicio_ids)
            rows = cursor.fetchall()
            return [
                SelectOption(id=row["id"], nombre=row["nombre"])
                for row in rows
            ]
    finally:
        conn.close()


# =============================================
# ENDPOINTS - JERARQUÍA 3 → RUBRO
# =============================================

@router.get("/jerarquias/{subsubhierarchy_id}/rubro")
async def get_rubro(
    subsubhierarchy_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Obtiene el ID de rubro asociado a una jerarquía nivel 3.
    Equivalente a: /getRubro
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT rubro_id
                FROM subsubhierarchies
                WHERE id = %s
            """, (subsubhierarchy_id,))
            row = cursor.fetchone()

            if not row:
                raise HTTPException(status_code=404, detail="Jerarquía no encontrada")

            return {"rubro_id": row.get("rubro_id")}
    finally:
        conn.close()


# =============================================
# ENDPOINTS - JERARQUÍA 2 CON FILTRO RUBRO
# =============================================

@router.get("/jerarquias/nivel2-rubro", response_model=List[SelectOption])
async def get_jerarquia2_con_rubro(
    hierarchy_id: int = Query(..., description="ID de Jerarquía nivel 1"),
    rubro_id: Optional[int] = Query(None, description="ID de Rubro para filtrar"),
    current_user: dict = Depends(get_current_user)
):
    """
    Obtiene jerarquías nivel 2 filtradas por nivel 1 y opcionalmente por rubro.
    Equivalente a: /getJerarquia2AreaHC
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            if rubro_id:
                # Filtrar subhierarchies que tengan subsubhierarchies con ese rubro
                cursor.execute("""
                    SELECT DISTINCT sh.id, sh.descripcion as nombre
                    FROM subhierarchies sh
                    JOIN subsubhierarchies ssh ON ssh.subhierarchy_id = sh.id
                    WHERE sh.hierarchy_id = %s
                      AND sh.active = 1
                      AND ssh.rubro_id = %s
                    ORDER BY sh.descripcion
                """, (hierarchy_id, rubro_id))
            else:
                cursor.execute("""
                    SELECT id, descripcion as nombre
                    FROM subhierarchies
                    WHERE hierarchy_id = %s AND active = 1
                    ORDER BY descripcion
                """, (hierarchy_id,))

            rows = cursor.fetchall()
            return [SelectOption(id=row["id"], nombre=row["nombre"]) for row in rows]
    finally:
        conn.close()


@router.get("/jerarquias/nivel3-rubro", response_model=List[SelectOption])
async def get_jerarquia3_con_rubro(
    subhierarchy_id: int = Query(..., description="ID de Jerarquía nivel 2"),
    rubro_id: Optional[int] = Query(None, description="ID de Rubro para filtrar"),
    current_user: dict = Depends(get_current_user)
):
    """
    Obtiene jerarquías nivel 3 filtradas por nivel 2 y opcionalmente por rubro.
    Equivalente a: /getJerarquia3ConRubro
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            query = """
                SELECT id, descripcion as nombre
                FROM subsubhierarchies
                WHERE subhierarchy_id = %s AND active = 1
            """
            params = [subhierarchy_id]

            if rubro_id:
                query += " AND rubro_id = %s"
                params.append(rubro_id)

            query += " ORDER BY descripcion"

            cursor.execute(query, params)
            rows = cursor.fetchall()
            return [SelectOption(id=row["id"], nombre=row["nombre"]) for row in rows]
    finally:
        conn.close()


# =============================================
# ENDPOINTS - CASCADAS SECCIÓN 6 (Issues 20-24)
# Fuente Laravel: WorkOrderController.php
# =============================================

class ImpresionOption(BaseModel):
    """Opción de impresión con filtrado. Issue 20."""
    id: int
    descripcion: str


class RecubrimientoOption(BaseModel):
    """Opción de recubrimiento con planta asociada. Issues 22, 23."""
    id: int
    descripcion: str
    planta_id: Optional[str] = None  # Lista de IDs separados por coma


class PlantaOption(BaseModel):
    """Opción de planta. Issue 24."""
    id: int
    nombre: str
    active: Optional[int] = 1


@router.get("/impresiones", response_model=List[ImpresionOption])
async def get_impresiones(
    current_user: dict = Depends(get_current_user)
):
    """
    Obtiene tipos de impresión disponibles.
    Issue 20: Filtra ID=1 (Offset) según Laravel WorkOrderController línea 710:
    Impresion::where('status', 1)->whereNotIn('id', [1])

    Opciones correctas: Flexografía y variantes
    NO mostrar: Offset, Sin Impresion (Solo OF), Sin Impresion (Trazabilidad Completa)
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Issue 20: Excluir ID=1 (Offset) como en Laravel
            cursor.execute("""
                SELECT id, descripcion
                FROM impresion
                WHERE status = 1 AND id NOT IN (1, 6, 7)
                ORDER BY id
            """)
            rows = cursor.fetchall()
            return [
                ImpresionOption(id=row["id"], descripcion=row["descripcion"])
                for row in rows
            ]
    finally:
        conn.close()


@router.get("/recubrimiento-interno", response_model=List[RecubrimientoOption])
async def get_recubrimiento_interno(
    cinta: Optional[int] = Query(None, description="Valor de CINTA (0=No, 1=Si)"),
    current_user: dict = Depends(get_current_user)
):
    """
    Obtiene opciones de recubrimiento interno.
    Issue 22: Cuando CINTA=SI (1), solo mostrar:
      - "No Aplica" (id=1)
      - "Barniz Hidropelente" (id=2)
    Cuando CINTA=NO (0) o no especificado, mostrar todas las opciones activas.

    Fuente Laravel: WorkOrderController@getRecubrimientoInterno líneas 10100-10113
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            if cinta == 1:
                # Issue 22: Cuando CINTA=SI, solo No Aplica y Barniz Hidropelente
                cursor.execute("""
                    SELECT id, descripcion, planta_id
                    FROM coverage_internal
                    WHERE status = 1 AND id IN (1, 2)
                    ORDER BY id
                """)
            else:
                # Todas las opciones activas
                cursor.execute("""
                    SELECT id, descripcion, planta_id
                    FROM coverage_internal
                    WHERE status = 1
                    ORDER BY id
                """)
            rows = cursor.fetchall()
            return [
                RecubrimientoOption(
                    id=row["id"],
                    descripcion=row["descripcion"],
                    planta_id=row.get("planta_id")
                )
                for row in rows
            ]
    finally:
        conn.close()


@router.get("/recubrimiento-externo", response_model=List[RecubrimientoOption])
async def get_recubrimiento_externo(
    impresion_id: Optional[int] = Query(None, description="ID de impresión seleccionada"),
    current_user: dict = Depends(get_current_user)
):
    """
    Obtiene opciones de recubrimiento externo filtradas por impresión.
    Issue 23: Filtrar según relacion_filtro_ingresos_principales.

    Fuente Laravel: WorkOrderController@getRecubrimientoExterno líneas 10117-10143
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            if impresion_id:
                # Filtrar por impresión usando la tabla de relaciones
                cursor.execute("""
                    SELECT DISTINCT
                        e.id,
                        e.descripcion,
                        f.planta_id
                    FROM coverage_external e
                    INNER JOIN relacion_filtro_ingresos_principales f
                        ON e.id = f.filtro_2
                    WHERE f.filtro_1 = %s
                      AND f.referencia = 'impresion_recubrimiento_externo'
                      AND e.status = 1
                    ORDER BY e.id
                """, (impresion_id,))
            else:
                # Sin filtro, todas las opciones activas
                cursor.execute("""
                    SELECT id, descripcion, NULL as planta_id
                    FROM coverage_external
                    WHERE status = 1
                    ORDER BY id
                """)
            rows = cursor.fetchall()
            return [
                RecubrimientoOption(
                    id=row["id"],
                    descripcion=row["descripcion"],
                    planta_id=row.get("planta_id")
                )
                for row in rows
            ]
    finally:
        conn.close()


@router.get("/plantas-objetivo", response_model=List[PlantaOption])
async def get_plantas_objetivo(
    recubrimiento_interno_id: Optional[int] = Query(None, description="ID de recubrimiento interno"),
    impresion_id: Optional[int] = Query(None, description="ID de impresión"),
    recubrimiento_externo_id: Optional[int] = Query(None, description="ID de recubrimiento externo"),
    current_user: dict = Depends(get_current_user)
):
    """
    Obtiene plantas objetivo filtradas según selecciones previas.
    Issue 24: Solo mostrar plantas activas y válidas según cascadas.

    Fuente Laravel: WorkOrderController@getPlantaObjetivo líneas 10146-10160
    y WorkOrderController@getPlantasFiltro líneas 10057-10096
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Si hay filtros, buscar plantas válidas
            plantas_permitidas = set()

            if recubrimiento_interno_id:
                cursor.execute("""
                    SELECT planta_id FROM coverage_internal
                    WHERE id = %s AND status = 1 AND planta_id IS NOT NULL
                """, (recubrimiento_interno_id,))
                row = cursor.fetchone()
                if row and row.get("planta_id"):
                    plantas_permitidas.update(
                        int(p) for p in str(row["planta_id"]).split(",") if p.strip()
                    )

            if impresion_id and recubrimiento_externo_id:
                cursor.execute("""
                    SELECT planta_id
                    FROM relacion_filtro_ingresos_principales
                    WHERE filtro_1 = %s
                      AND filtro_2 = %s
                      AND referencia = 'impresion_recubrimiento_externo'
                      AND planta_id IS NOT NULL
                """, (impresion_id, recubrimiento_externo_id))
                row = cursor.fetchone()
                if row and row.get("planta_id"):
                    nuevas_plantas = set(
                        int(p) for p in str(row["planta_id"]).split(",") if p.strip()
                    )
                    if plantas_permitidas:
                        plantas_permitidas &= nuevas_plantas
                    else:
                        plantas_permitidas = nuevas_plantas

            # Issue 24: Excluir plantas según Excel (Buin=1, Chillan=4)
            # Nota: tabla plantas NO tiene campo 'active'
            if plantas_permitidas:
                placeholders = ','.join(['%s'] * len(plantas_permitidas))
                cursor.execute(f"""
                    SELECT id, nombre
                    FROM plantas
                    WHERE id IN ({placeholders})
                    ORDER BY nombre
                """, list(plantas_permitidas))
            else:
                # Sin filtros previos, todas las plantas excepto las excluidas
                cursor.execute("""
                    SELECT id, nombre
                    FROM plantas
                    WHERE id NOT IN (1, 4)
                    ORDER BY nombre
                """)

            rows = cursor.fetchall()
            return [
                PlantaOption(
                    id=row["id"],
                    nombre=row["nombre"],
                    active=1  # Asumir activas ya que no hay campo
                )
                for row in rows
            ]
    finally:
        conn.close()


# =============================================
# ENDPOINTS - CAD (Issue 26, FASE 0.D preview)
# =============================================

class CadDataResponse(BaseModel):
    """Datos del CAD para carga automática. Issue 26."""
    id: int
    cad: Optional[str] = None
    area_producto: Optional[float] = None
    recorte_adicional: Optional[float] = None
    largura_hm: Optional[float] = None
    anchura_hm: Optional[float] = None
    rayado_c1r1: Optional[float] = None
    rayado_r1_r2: Optional[float] = None
    rayado_r2_c2: Optional[float] = None
    veces_item: Optional[int] = None
    interno_largo: Optional[float] = None
    interno_ancho: Optional[float] = None
    interno_alto: Optional[float] = None
    externo_largo: Optional[float] = None
    externo_ancho: Optional[float] = None
    externo_alto: Optional[float] = None


@router.get("/cads/{cad_id}", response_model=CadDataResponse)
async def get_cad_data(
    cad_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Obtiene datos de un CAD para carga automática.
    Issue 26: Al seleccionar CAD, cargar datos automáticamente.

    Fuente Laravel: WorkOrderController@getCad líneas 9948-9967
    Campos a cargar: area_producto, recorte_adicional, largura_hm, anchura_hm,
                     rayados, veces_item, medidas interiores y exteriores.
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT
                    id, cad,
                    area_producto, recorte_adicional,
                    largura_hm, anchura_hm,
                    rayado_c1r1, rayado_r1_r2, rayado_r2_c2, veces_item,
                    interno_largo, interno_ancho, interno_alto,
                    externo_largo, externo_ancho, externo_alto
                FROM cads
                WHERE id = %s AND active = 1
            """, (cad_id,))
            row = cursor.fetchone()

            if not row:
                raise HTTPException(status_code=404, detail="CAD no encontrado")

            return CadDataResponse(
                id=row["id"],
                cad=row.get("cad"),
                area_producto=row.get("area_producto"),
                recorte_adicional=row.get("recorte_adicional"),
                largura_hm=row.get("largura_hm"),
                anchura_hm=row.get("anchura_hm"),
                rayado_c1r1=row.get("rayado_c1r1"),
                rayado_r1_r2=row.get("rayado_r1_r2"),
                rayado_r2_c2=row.get("rayado_r2_c2"),
                veces_item=row.get("veces_item"),
                interno_largo=row.get("interno_largo"),
                interno_ancho=row.get("interno_ancho"),
                interno_alto=row.get("interno_alto"),
                externo_largo=row.get("externo_largo"),
                externo_ancho=row.get("externo_ancho"),
                externo_alto=row.get("externo_alto")
            )
    finally:
        conn.close()
