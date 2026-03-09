"""
Router Genérico para Mantenedores Simples - INVEB Cascade Service
Maneja CRUD para tablas con estructura: id, nombre/descripcion, active
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

from ...database import get_db_connection
from ..auth import get_current_user

router = APIRouter(prefix="/mantenedores/generic", tags=["Mantenedores Genéricos"])

# =============================================
# CONFIGURACIÓN DE TABLAS SOPORTADAS
# =============================================

# Definición de tablas y sus columnas
TABLA_CONFIG: Dict[str, Dict[str, Any]] = {
    "canales": {
        "table": "canals",
        "nombre_field": "nombre",
        "columns": ["id", "nombre"],
        "has_active": False,  # Esta tabla no tiene campo active
        "display_name": "Canales"
    },
    "organizaciones_ventas": {
        "table": "organizaciones_ventas",
        "nombre_field": "descripcion",
        "columns": ["id", "codigo", "descripcion", "active"],
        "has_active": True,
        "display_name": "Organizaciones de Venta"
    },
    "tipos_cintas": {
        "table": "tipos_cintas",
        "nombre_field": "descripcion",
        "columns": ["id", "codigo", "descripcion", "active"],
        "has_active": True,
        "display_name": "Tipos de Cintas"
    },
    "colores": {
        "table": "colors",
        "nombre_field": "descripcion",
        "columns": ["id", "codigo", "descripcion", "texto_breve", "active"],
        "has_active": True,
        "display_name": "Colores"
    },
    "estilos": {
        "table": "styles",
        "nombre_field": "glosa",
        "columns": ["id", "codigo", "glosa", "codigo_armado", "active"],
        "has_active": True,
        "display_name": "Estilos"
    },
    "tipo_productos": {
        "table": "product_types",
        "nombre_field": "descripcion",
        "columns": ["id", "codigo", "descripcion", "active"],
        "has_active": True,
        "display_name": "Tipos de Productos"
    },
    "almacenes": {
        "table": "almacenes",
        "nombre_field": "denominacion",
        "columns": ["id", "codigo", "denominacion", "centro", "active"],
        "has_active": True,
        "display_name": "Almacenes"
    },
    "tipo_palet": {
        "table": "pallet_types",
        "nombre_field": "descripcion",
        "columns": ["id", "codigo", "descripcion", "largo", "ancho", "active"],
        "has_active": True,
        "display_name": "Tipos de Palet"
    },
    "grupo_imputacion_material": {
        "table": "grupo_imputacion_materiales",
        "nombre_field": "familia",
        "columns": ["id", "proceso", "codigo", "familia", "material_modelo", "active"],
        "has_active": True,
        "display_name": "Grupo Imputación Material"
    },
    "matrices": {
        "table": "matrices",
        "nombre_field": "nombre",
        "columns": ["id", "nombre", "active"],
        "has_active": True,
        "display_name": "Matrices"
    },
    # === NUEVOS MANTENEDORES ===
    "sectores": {
        "table": "sectors",
        "nombre_field": "denominacion",
        "columns": ["id", "denominacion", "product_type_id", "active"],
        "has_active": True,
        "display_name": "Sectores"
    },
    "cartones": {
        "table": "cartons",
        "nombre_field": "codigo",
        "columns": ["id", "codigo", "onda", "color_tapa_exterior", "tipo", "ect_min", "espesor", "peso", "active"],
        "has_active": True,
        "display_name": "Cartones"
    },
    "secuencias_operacionales": {
        "table": "secuencias_operacionales",
        "nombre_field": "descripcion",
        "columns": ["id", "codigo", "descripcion", "nombre_corto", "planta_id", "active"],
        "has_active": True,
        "display_name": "Secuencias Operacionales"
    },
    "rechazo_conjunto": {
        "table": "rechazo_conjunto",
        "nombre_field": "codigo",
        "columns": ["id", "codigo", "proceso_id", "porcentaje_proceso_solo", "porcentaje_proceso_barniz", "porcentaje_proceso_maquila", "active"],
        "has_active": True,
        "display_name": "Rechazo Conjunto"
    },
    "tiempo_tratamiento": {
        "table": "tiempo_tratamiento",
        "nombre_field": "proceso_id",
        "columns": ["id", "proceso_id", "tiempo_buin", "tiempo_tiltil", "tiempo_osorno", "tiempo_buin_powerply", "tiempo_buin_cc_doble", "active"],
        "has_active": True,
        "display_name": "Tiempo de Tratamiento"
    },
    "grupo_materiales_1": {
        "table": "grupo_materiales_1",
        "nombre_field": "codigo",
        "columns": ["id", "armado_id", "codigo", "active"],
        "has_active": True,
        "display_name": "Grupo de Materiales 1"
    },
    "grupo_materiales_2": {
        "table": "grupo_materiales_2",
        "nombre_field": "codigo",
        "columns": ["id", "pruduct_type_id", "codigo", "active"],
        "has_active": True,
        "display_name": "Grupo de Materiales 2"
    },
    "materiales": {
        "table": "materials",
        "nombre_field": "descripcion",
        "columns": ["id", "codigo", "descripcion", "client_id", "carton_id", "product_type_id", "style_id", "active"],
        "has_active": True,
        "display_name": "Materiales"
    },
    "grupo_plantas": {
        "table": "grupo_plantas",
        "nombre_field": "centro",
        "columns": ["id", "planta_id", "centro", "num_almacen", "active"],
        "has_active": True,
        "display_name": "Grupo de Plantas"
    },
    "adhesivos": {
        "table": "adhesivos",
        "nombre_field": "codigo",
        "columns": ["id", "planta_id", "maquina", "codigo", "consumo", "active"],
        "has_active": True,
        "display_name": "Adhesivos"
    },
    "cebes": {
        "table": "cebes",
        "nombre_field": "nombre_cebe",
        "columns": ["id", "planta_id", "tipo", "hierearchie_id", "cebe", "nombre_cebe", "grupo_gastos_generales", "active"],
        "has_active": True,
        "display_name": "CEBES"
    },
    "clasificaciones_clientes": {
        "table": "clasificacion_clientes",
        "nombre_field": "name",
        "columns": ["id", "name", "costo_usd", "active"],
        "has_active": True,
        "display_name": "Clasificaciones de Clientes"
    },
    # === MANTENEDORES DEL COTIZADOR ===
    # Produccion y Procesos
    "armados": {
        "table": "armados",
        "nombre_field": "descripcion",
        "columns": ["id", "descripcion", "active"],
        "has_active": True,
        "display_name": "Armados"
    },
    "procesos": {
        "table": "processes",
        "nombre_field": "descripcion",
        "columns": ["id", "descripcion", "active"],
        "has_active": True,
        "display_name": "Procesos"
    },
    "pegados": {
        "table": "pegados",
        "nombre_field": "descripcion",
        "columns": ["id", "codigo", "descripcion", "active"],
        "has_active": True,
        "display_name": "Pegados"
    },
    "envases": {
        "table": "envases",
        "nombre_field": "descripcion",
        "columns": ["id", "descripcion", "active"],
        "has_active": True,
        "display_name": "Envases"
    },
    "rayados": {
        "table": "rayados",
        "nombre_field": "descripcion",
        "columns": ["id", "codigo", "descripcion", "active"],
        "has_active": True,
        "display_name": "Rayados"
    },
    # Papeles y Cartones
    "papeles": {
        "table": "papers",
        "nombre_field": "codigo",
        "columns": ["id", "codigo", "gramaje", "precio"],
        "has_active": False,
        "display_name": "Papeles"
    },
    "cardboards": {
        "table": "cardboards",
        "nombre_field": "codigo",
        "columns": ["id", "codigo", "tipo", "color_tapa_exterior", "ect_min", "espesor", "onda_1", "onda_2", "recubrimiento", "active"],
        "has_active": True,
        "display_name": "Cardboards (Cotizador)"
    },
    "carton_esquineros": {
        "table": "carton_esquineros",
        "nombre_field": "codigo",
        "columns": ["id", "codigo", "resistencia", "espesor", "ancho_esquinero", "alta_grafica", "active"],
        "has_active": True,
        "display_name": "Carton Esquineros"
    },
    # Plantas y Configuracion
    "plantas": {
        "table": "plantas",
        "nombre_field": "nombre",
        "columns": ["id", "nombre", "ancho_corrugadora", "trim_corrugadora"],
        "has_active": False,
        "display_name": "Plantas"
    },
    "tipo_ondas": {
        "table": "tipo_ondas",
        "nombre_field": "onda",
        "columns": ["id", "onda", "espesor_promedio", "espesor_maximo", "espesor_minimo"],
        "has_active": False,
        "display_name": "Tipo de Ondas"
    },
    # Factores y Calculos
    "factores_ondas": {
        "table": "factores_ondas",
        "nombre_field": "onda",
        "columns": ["id", "planta_id", "onda", "factor_onda"],
        "has_active": False,
        "display_name": "Factores de Ondas"
    },
    "factores_desarrollos": {
        "table": "factores_desarrollos",
        "nombre_field": "tipo_onda",
        "columns": ["id", "externo_largo", "externo_ancho", "externo_alto", "d1", "d2", "dh", "caja_entera", "tipo_onda", "onda_id"],
        "has_active": False,
        "display_name": "Factores de Desarrollos"
    },
    "factores_seguridads": {
        "table": "factores_seguridads",
        "nombre_field": "factor_seguridad",
        "columns": ["id", "rubro_id", "envase_id", "factor_seguridad"],
        "has_active": False,
        "display_name": "Factores de Seguridad"
    },
    "areahcs": {
        "table": "areahcs",
        "nombre_field": "id",
        "columns": ["id", "interno_largo", "interno_ancho", "interno_alto", "product_type_id", "style_id", "onda_id", "process_id", "envase_id"],
        "has_active": False,
        "display_name": "Area HCs"
    },
    # Consumos
    "consumo_adhesivos": {
        "table": "consumo_adhesivos",
        "nombre_field": "onda",
        "columns": ["id", "planta_id", "onda", "adhesivo_corrugado", "adhesivo_powerply"],
        "has_active": False,
        "display_name": "Consumo Adhesivos"
    },
    "consumo_energias": {
        "table": "consumo_energias",
        "nombre_field": "consumo_kwh_mm2",
        "columns": ["id", "planta_id", "process_id", "consumo_kwh_mm2"],
        "has_active": False,
        "display_name": "Consumo Energias"
    },
    "consumo_adhesivo_pegados": {
        "table": "consumo_adhesivo_pegados",
        "nombre_field": "consumo_adhesivo_pegado_gr_caja",
        "columns": ["id", "planta_id", "process_id", "consumo_adhesivo_pegado_gr_caja"],
        "has_active": False,
        "display_name": "Consumo Adhesivo Pegados"
    },
    # Mermas
    "merma_corrugadoras": {
        "table": "merma_corrugadoras",
        "nombre_field": "porcentaje_merma_corrugadora",
        "columns": ["id", "planta_id", "carton_id", "porcentaje_merma_corrugadora"],
        "has_active": False,
        "display_name": "Merma Corrugadoras"
    },
    "merma_convertidoras": {
        "table": "merma_convertidoras",
        "nombre_field": "porcentaje_merma_convertidora",
        "columns": ["id", "planta_id", "process_id", "rubro_id", "porcentaje_merma_convertidora"],
        "has_active": False,
        "display_name": "Merma Convertidoras"
    },
    # Comercial y Logistica
    "mercados": {
        "table": "mercados",
        "nombre_field": "descripcion",
        "columns": ["id", "codigo", "descripcion", "active"],
        "has_active": True,
        "display_name": "Mercados"
    },
    "rubros": {
        "table": "rubros",
        "nombre_field": "descripcion",
        "columns": ["id", "descripcion", "codigo_rubro"],
        "has_active": False,
        "display_name": "Rubros"
    },
    "ciudades_fletes": {
        "table": "ciudades_fletes",
        "nombre_field": "ciudad",
        "columns": ["id", "ciudad", "valor_usd_camion", "ruta"],
        "has_active": False,
        "display_name": "Ciudades Fletes"
    },
    "fletes": {
        "table": "fletes",
        "nombre_field": "costo_clp_pallet",
        "columns": ["id", "planta_id", "ciudad_id", "costo_clp_pallet"],
        "has_active": False,
        "display_name": "Fletes"
    },
    "maquila_servicios": {
        "table": "maquila_servicios",
        "nombre_field": "servicio",
        "columns": ["id", "servicio", "precio_clp_caja", "product_type_id", "active"],
        "has_active": True,
        "display_name": "Maquila Servicios"
    },
    # Tarifas y Precios
    "tarifario": {
        "table": "tarifario",
        "nombre_field": "mercado",
        "columns": ["id", "mercado", "tipo_cliente", "carton_frecuente", "planta", "estacionalidad", "porcentaje_margen"],
        "has_active": False,
        "display_name": "Tarifario"
    },
    "tarifario_margens": {
        "table": "tarifario_margens",
        "nombre_field": "tipo_cliente",
        "columns": ["id", "rubro_id", "indice_complejidad", "tipo_cliente", "volumen_negociacion_minimo_2", "volumen_negociacion_maximo_2", "margen_minimo_usd_mm2"],
        "has_active": False,
        "display_name": "Tarifario Margenes"
    },
    "variables_cotizador": {
        "table": "variables_cotizadors",
        "nombre_field": "id",
        "columns": ["id", "esq_perdida_papel", "esq_perdida_adhesivo", "esq_recorte_esquineros", "iva", "tasa_mensual_credito", "dias_financiamiento_credito"],
        "has_active": False,
        "display_name": "Variables Cotizador"
    },
    # Palletizado
    "insumos_palletizados": {
        "table": "insumos_palletizados",
        "nombre_field": "insumo",
        "columns": ["id", "insumo", "precio", "active"],
        "has_active": True,
        "display_name": "Insumos Palletizados"
    },
    "detalle_precio_palletizados": {
        "table": "detalle_precio_palletizados",
        "nombre_field": "tipo_palletizado",
        "columns": ["id", "tipo_palletizado", "tarima_nacional", "tarima_exportacion", "stretch_film", "maquila"],
        "has_active": False,
        "display_name": "Detalle Precio Palletizados"
    },
    # Catalogos Generales
    "paises": {
        "table": "paises",
        "nombre_field": "name",
        "columns": ["id", "name", "active"],
        "has_active": True,
        "display_name": "Paises"
    },
    "fsc": {
        "table": "fsc",
        "nombre_field": "descripcion",
        "columns": ["id", "descripcion", "codigo", "active"],
        "has_active": True,
        "display_name": "FSC"
    },
    "reference_types": {
        "table": "reference_types",
        "nombre_field": "descripcion",
        "columns": ["id", "descripcion", "codigo", "active"],
        "has_active": True,
        "display_name": "Tipos de Referencia"
    },
    "recubrimiento_types": {
        "table": "recubrimiento_types",
        "nombre_field": "descripcion",
        "columns": ["id", "descripcion", "codigo", "active"],
        "has_active": True,
        "display_name": "Tipos de Recubrimiento"
    },
    # === SPRINT F: Mantenedores adicionales ===
    "cantidad_base": {
        "table": "cantidad_base",
        "nombre_field": "proceso_id",
        "columns": ["id", "proceso_id", "cantidad_buin", "cantidad_tiltil", "cantidad_osorno", "active"],
        "has_active": True,
        "display_name": "Cantidad Base por Planta"
    },
    # === SPRINT H.4: Tablas Opcionales ===
    "margenes_minimos": {
        "table": "margenes_minimos",
        "nombre_field": "rubro_descripcion",
        "columns": ["id", "rubro_id", "rubro_descripcion", "mercado_id", "mercado_descripcion", "cluster", "minimo", "activo"],
        "has_active": True,
        "active_field": "activo",
        "display_name": "Márgenes Mínimos"
    },
    "codigo_materials": {
        "table": "codigo_materials",
        "nombre_field": "codigo",
        "columns": ["id", "codigo", "fecha_uso", "active"],
        "has_active": True,
        "display_name": "Códigos de Material"
    },
    "prefijo_materials": {
        "table": "prefijo_materials",
        "nombre_field": "codigo",
        "columns": ["id", "codigo"],
        "has_active": False,
        "display_name": "Prefijos de Material"
    },
    "sufijo_materials": {
        "table": "sufijo_materials",
        "nombre_field": "codigo",
        "columns": ["id", "codigo"],
        "has_active": False,
        "display_name": "Sufijos de Material"
    },
    "pallet_status_types": {
        "table": "pallet_status_types",
        "nombre_field": "descripcion",
        "columns": ["id", "descripcion", "active"],
        "has_active": True,
        "display_name": "Estados de Pallet"
    },
    "formato_bobinas": {
        "table": "formato_bobinas",
        "nombre_field": "id",
        "columns": ["id"],
        "has_active": False,
        "display_name": "Formato de Bobinas"
    },
    "pallet_patrons": {
        "table": "pallet_patrons",
        "nombre_field": "descripcion",
        "columns": ["id", "descripcion", "active"],
        "has_active": True,
        "display_name": "Patrones de Pallet"
    },
    "pallet_box_quantities": {
        "table": "pallet_box_quantities",
        "nombre_field": "descripcion",
        "columns": ["id", "descripcion", "active"],
        "has_active": True,
        "display_name": "Cantidades de Caja por Pallet"
    },
    "audits": {
        "table": "audits",
        "nombre_field": "event",
        "columns": ["id", "user_type", "user_id", "event", "auditable_type", "auditable_id", "old_values", "new_values", "url", "ip_address", "user_agent", "created_at"],
        "has_active": False,
        "display_name": "Auditorías"
    },
    "bitacora_campos_modificados": {
        "table": "bitacora_campos_modificados",
        "nombre_field": "descripcion",
        "columns": ["id", "descripcion", "active"],
        "has_active": True,
        "display_name": "Bitácora Campos Modificados"
    },
    "additional_characteristics_type": {
        "table": "additional_characteristics_type",
        "nombre_field": "descripcion",
        "columns": ["id", "descripcion", "active"],
        "has_active": True,
        "display_name": "Tipos de Características Adicionales"
    },
    "changelogs": {
        "table": "changelogs",
        "nombre_field": "column_name",
        "columns": ["id", "column_name", "table_name", "old_value", "new_value", "item_id", "user_id", "user", "codigo_operacion", "tipo_operacion", "created_at"],
        "has_active": False,
        "display_name": "Registro de Cambios"
    },
    "pallet_protections": {
        "table": "pallet_protections",
        "nombre_field": "descripcion",
        "columns": ["id", "descripcion", "active"],
        "has_active": True,
        "display_name": "Protecciones de Pallet"
    },
}


# =============================================
# SCHEMAS
# =============================================

class GenericListItem(BaseModel):
    id: int
    nombre: str  # Campo normalizado para display
    codigo: Optional[str] = None
    active: Optional[int] = 1
    extra_fields: Optional[Dict[str, Any]] = None


class GenericListResponse(BaseModel):
    items: List[GenericListItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class GenericDetail(BaseModel):
    id: int
    data: Dict[str, Any]


class GenericCreate(BaseModel):
    data: Dict[str, Any]


class GenericUpdate(BaseModel):
    data: Dict[str, Any]


class TablaInfo(BaseModel):
    key: str
    table: str
    display_name: str
    columns: List[str]
    has_active: bool


# =============================================
# ENDPOINTS
# =============================================

@router.get("/tablas", response_model=List[TablaInfo])
async def get_tablas_disponibles(
    current_user: dict = Depends(get_current_user)
):
    """Obtiene lista de tablas de mantenedores disponibles"""
    return [
        TablaInfo(
            key=key,
            table=config["table"],
            display_name=config["display_name"],
            columns=config["columns"],
            has_active=config["has_active"]
        )
        for key, config in TABLA_CONFIG.items()
    ]


@router.get("/{tabla_key}", response_model=GenericListResponse)
async def list_items(
    tabla_key: str,
    search: Optional[str] = Query(None, description="Buscar por nombre/codigo"),
    activo: Optional[int] = Query(None, description="Filtrar por estado activo"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """Lista items de una tabla de mantenedor"""
    if tabla_key not in TABLA_CONFIG:
        raise HTTPException(status_code=404, detail=f"Tabla '{tabla_key}' no encontrada")

    config = TABLA_CONFIG[tabla_key]
    table_name = config["table"]
    nombre_field = config["nombre_field"]
    has_active = config["has_active"]

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Construir query base
        columns_str = ", ".join(config["columns"])
        base_query = f"SELECT {columns_str} FROM {table_name} WHERE 1=1"
        count_query = f"SELECT COUNT(*) as total FROM {table_name} WHERE 1=1"
        params = []

        # Filtro de búsqueda
        if search:
            search_fields = [nombre_field]
            if "codigo" in config["columns"]:
                search_fields.append("codigo")
            search_conditions = " OR ".join([f"{f} LIKE %s" for f in search_fields])
            base_query += f" AND ({search_conditions})"
            count_query += f" AND ({search_conditions})"
            for _ in search_fields:
                params.append(f"%{search}%")

        # Filtro de activo
        if activo is not None and has_active:
            base_query += " AND active = %s"
            count_query += " AND active = %s"
            params.append(activo)

        # Obtener total
        cursor.execute(count_query, params)
        total = cursor.fetchone()["total"]

        # Agregar ordenamiento y paginación
        base_query += f" ORDER BY {nombre_field} ASC"
        base_query += " LIMIT %s OFFSET %s"
        params.extend([page_size, (page - 1) * page_size])

        cursor.execute(base_query, params)
        rows = cursor.fetchall()

        # Normalizar respuesta
        items = []
        for row in rows:
            # Extraer campos comunes - convertir a string para manejar valores NULL e int
            nombre_value = row.get(nombre_field)
            codigo_value = row.get("codigo")
            item = GenericListItem(
                id=row["id"],
                nombre=str(nombre_value) if nombre_value is not None else "",
                codigo=str(codigo_value) if codigo_value is not None else None,
                active=row.get("active", 1) if row.get("active") is not None else 1,
                extra_fields={k: v for k, v in row.items() if k not in ["id", nombre_field, "codigo", "active"]}
            )
            items.append(item)

        total_pages = (total + page_size - 1) // page_size

        return GenericListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )

    finally:
        cursor.close()
        conn.close()


@router.get("/{tabla_key}/{item_id}", response_model=GenericDetail)
async def get_item(
    tabla_key: str,
    item_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Obtiene detalle de un item"""
    if tabla_key not in TABLA_CONFIG:
        raise HTTPException(status_code=404, detail=f"Tabla '{tabla_key}' no encontrada")

    config = TABLA_CONFIG[tabla_key]
    table_name = config["table"]

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        columns_str = ", ".join(config["columns"])
        cursor.execute(f"SELECT {columns_str} FROM {table_name} WHERE id = %s", [item_id])
        row = cursor.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Item no encontrado")

        return GenericDetail(id=row["id"], data=dict(row))

    finally:
        cursor.close()
        conn.close()


@router.post("/{tabla_key}", response_model=GenericDetail)
async def create_item(
    tabla_key: str,
    item: GenericCreate,
    current_user: dict = Depends(get_current_user)
):
    """Crea un nuevo item"""
    if tabla_key not in TABLA_CONFIG:
        raise HTTPException(status_code=404, detail=f"Tabla '{tabla_key}' no encontrada")

    config = TABLA_CONFIG[tabla_key]
    table_name = config["table"]
    allowed_columns = [c for c in config["columns"] if c != "id"]

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Filtrar solo columnas permitidas
        data = {k: v for k, v in item.data.items() if k in allowed_columns}

        if not data:
            raise HTTPException(status_code=400, detail="No hay datos válidos para insertar")

        # Agregar active por defecto si aplica
        if config["has_active"] and "active" not in data:
            data["active"] = 1

        # Agregar timestamps si la tabla los tiene
        data["created_at"] = datetime.now()
        data["updated_at"] = datetime.now()

        columns = ", ".join(data.keys())
        placeholders = ", ".join(["%s"] * len(data))
        values = list(data.values())

        cursor.execute(
            f"INSERT INTO {table_name} ({columns}) VALUES ({placeholders})",
            values
        )
        conn.commit()

        new_id = cursor.lastrowid

        # Retornar item creado
        columns_str = ", ".join(config["columns"])
        cursor.execute(f"SELECT {columns_str} FROM {table_name} WHERE id = %s", [new_id])
        row = cursor.fetchone()

        return GenericDetail(id=new_id, data=dict(row))

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()


@router.put("/{tabla_key}/{item_id}", response_model=GenericDetail)
async def update_item(
    tabla_key: str,
    item_id: int,
    item: GenericUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Actualiza un item"""
    if tabla_key not in TABLA_CONFIG:
        raise HTTPException(status_code=404, detail=f"Tabla '{tabla_key}' no encontrada")

    config = TABLA_CONFIG[tabla_key]
    table_name = config["table"]
    allowed_columns = [c for c in config["columns"] if c != "id"]

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Verificar que existe
        cursor.execute(f"SELECT id FROM {table_name} WHERE id = %s", [item_id])
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Item no encontrado")

        # Filtrar solo columnas permitidas
        data = {k: v for k, v in item.data.items() if k in allowed_columns}

        if not data:
            raise HTTPException(status_code=400, detail="No hay datos válidos para actualizar")

        # Agregar timestamp de actualización
        data["updated_at"] = datetime.now()

        set_clause = ", ".join([f"{k} = %s" for k in data.keys()])
        values = list(data.values()) + [item_id]

        cursor.execute(
            f"UPDATE {table_name} SET {set_clause} WHERE id = %s",
            values
        )
        conn.commit()

        # Retornar item actualizado
        columns_str = ", ".join(config["columns"])
        cursor.execute(f"SELECT {columns_str} FROM {table_name} WHERE id = %s", [item_id])
        row = cursor.fetchone()

        return GenericDetail(id=item_id, data=dict(row))

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()


@router.put("/{tabla_key}/{item_id}/activate")
async def activate_item(
    tabla_key: str,
    item_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Activa un item"""
    if tabla_key not in TABLA_CONFIG:
        raise HTTPException(status_code=404, detail=f"Tabla '{tabla_key}' no encontrada")

    config = TABLA_CONFIG[tabla_key]
    if not config["has_active"]:
        raise HTTPException(status_code=400, detail="Esta tabla no soporta activación/desactivación")

    table_name = config["table"]

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            f"UPDATE {table_name} SET active = 1, updated_at = %s WHERE id = %s",
            [datetime.now(), item_id]
        )
        conn.commit()

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Item no encontrado")

        return {"message": "Item activado exitosamente"}

    finally:
        cursor.close()
        conn.close()


@router.put("/{tabla_key}/{item_id}/deactivate")
async def deactivate_item(
    tabla_key: str,
    item_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Desactiva un item"""
    if tabla_key not in TABLA_CONFIG:
        raise HTTPException(status_code=404, detail=f"Tabla '{tabla_key}' no encontrada")

    config = TABLA_CONFIG[tabla_key]
    if not config["has_active"]:
        raise HTTPException(status_code=400, detail="Esta tabla no soporta activación/desactivación")

    table_name = config["table"]

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            f"UPDATE {table_name} SET active = 0, updated_at = %s WHERE id = %s",
            [datetime.now(), item_id]
        )
        conn.commit()

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Item no encontrado")

        return {"message": "Item desactivado exitosamente"}

    finally:
        cursor.close()
        conn.close()


# =============================================
# BULK UPLOAD ENDPOINT
# =============================================

class BulkUploadItem(BaseModel):
    data: Dict[str, Any]


class BulkUploadRequest(BaseModel):
    items: List[BulkUploadItem]


class BulkUploadResult(BaseModel):
    total_recibidos: int
    insertados: int
    errores: int
    detalles_errores: List[Dict[str, Any]]


@router.post("/{tabla_key}/bulk", response_model=BulkUploadResult)
async def bulk_upload(
    tabla_key: str,
    request: BulkUploadRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Carga masiva de items para una tabla de mantenedor.
    Recibe una lista de items y los inserta en batch.
    """
    if tabla_key not in TABLA_CONFIG:
        raise HTTPException(status_code=404, detail=f"Tabla '{tabla_key}' no encontrada")

    config = TABLA_CONFIG[tabla_key]
    table_name = config["table"]
    allowed_columns = [c for c in config["columns"] if c != "id"]

    conn = get_db_connection()
    cursor = conn.cursor()

    insertados = 0
    errores = 0
    detalles_errores = []

    try:
        for idx, item in enumerate(request.items):
            try:
                # Filtrar solo columnas permitidas
                data = {k: v for k, v in item.data.items() if k in allowed_columns}

                if not data:
                    detalles_errores.append({
                        "fila": idx + 1,
                        "error": "No hay datos válidos para insertar"
                    })
                    errores += 1
                    continue

                # Agregar active por defecto si aplica
                if config["has_active"] and "active" not in data:
                    data["active"] = 1

                # Agregar timestamps
                data["created_at"] = datetime.now()
                data["updated_at"] = datetime.now()

                columns = ", ".join(data.keys())
                placeholders = ", ".join(["%s"] * len(data))
                values = list(data.values())

                cursor.execute(
                    f"INSERT INTO {table_name} ({columns}) VALUES ({placeholders})",
                    values
                )
                insertados += 1

            except Exception as e:
                detalles_errores.append({
                    "fila": idx + 1,
                    "error": str(e),
                    "data": item.data
                })
                errores += 1

        # Commit de todas las inserciones exitosas
        conn.commit()

        return BulkUploadResult(
            total_recibidos=len(request.items),
            insertados=insertados,
            errores=errores,
            detalles_errores=detalles_errores
        )

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error en carga masiva: {str(e)}")
    finally:
        cursor.close()
        conn.close()
