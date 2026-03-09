"""
Router API Mobile para INVEB Envases OT.
Endpoints optimizados para aplicaciones moviles con respuestas ligeras.
Equivalente a ApiMobileController.php en Laravel.
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..dependencies import get_current_user

router = APIRouter(prefix="/mobile", tags=["API Mobile"])


# ============================================================================
# MODELOS PYDANTIC
# ============================================================================

class MobileOTItem(BaseModel):
    """OT resumida para listado mobile."""
    id: int
    item: Optional[str] = None
    cliente_id: int
    cliente: str
    descripcion: Optional[str] = None
    area: Optional[str] = None
    area_abreviatura: Optional[str] = None
    estado: str = "PV"
    dias_area_actual: int = 0
    created_at: str


class AreaResumen(BaseModel):
    """Area resumida para mobile."""
    id: int
    nombre: str
    abreviatura: Optional[str] = None


class EstadoResumen(BaseModel):
    """Estado resumido para mobile."""
    id: int
    nombre: str
    abreviatura: Optional[str] = None


class ListaOTsResponse(BaseModel):
    """Respuesta listado de OTs para vendedor."""
    code: str = "200"
    message: str
    data: Dict[str, Any]


class OTDetalleResponse(BaseModel):
    """Respuesta detalle de OT para mobile."""
    code: str = "200"
    message: str
    data: Dict[str, Any]


class GestionMobile(BaseModel):
    """Gestion resumida para mobile."""
    id: int
    tipo_gestion: str
    observacion: Optional[str] = None
    area: str
    usuario: str
    fecha: str
    archivos_subidos: int = 0
    color: str = "#6f42c1"
    nuevo_estado: Optional[str] = None
    area_consultada: Optional[str] = None
    estado_consulta: Optional[str] = None
    respuesta: Optional[str] = None
    usuario_respuesta: Optional[str] = None
    fecha_respuesta: Optional[str] = None
    responder: bool = False


class HistorialOTResponse(BaseModel):
    """Respuesta historial de OT."""
    code: str = "200"
    message: str
    data: Dict[str, Any]


class GuardarGestionRequest(BaseModel):
    """Request para guardar gestion mobile."""
    ot_id: int
    observacion: str
    state_id: Optional[int] = None
    area_id: Optional[int] = None


class GuardarRespuestaRequest(BaseModel):
    """Request para guardar respuesta a consulta."""
    gestion_id: int
    observacion: str


class UpdatePushTokenRequest(BaseModel):
    """Request para actualizar token push mobile."""
    token_push_mobile: str


class MaterialCliente(BaseModel):
    """Material de cliente."""
    id: int
    codigo: str
    descripcion: Optional[str] = None
    client_id: int


class JerarquiaData(BaseModel):
    """Jerarquia con sus sub-jerarquias."""
    jerarquias: Dict[str, List[str]]


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/listar-ordenes-ot")
async def listar_ordenes_ot(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
) -> ListaOTsResponse:
    """
    Lista todas las OTs del vendedor autenticado.
    Incluye tiempos por area y estados.

    Equivalente: ApiMobileController@getOrdenesOt
    """
    user_id = current_user["id"]

    # Query OTs del vendedor con joins
    query = text("""
        SELECT
            wo.id,
            pt.descripcion as item,
            c.id as cliente_id,
            c.nombre as cliente,
            wo.descripcion,
            ws.nombre as area,
            ws.abreviatura as area_abreviatura,
            (SELECT s.abreviatura FROM managements m
             JOIN states s ON m.state_id = s.id
             WHERE m.work_order_id = wo.id AND m.management_type_id = 1
             ORDER BY m.created_at DESC LIMIT 1) as estado,
            wo.created_at,
            wo.current_area_id,
            wo.ultimo_cambio_area,
            COALESCE((SELECT SUM(duracion_segundos) FROM managements
             WHERE work_order_id = wo.id AND management_type_id = 1 AND work_space_id = 1), 0) as tiempo_venta,
            COALESCE((SELECT SUM(duracion_segundos) FROM managements
             WHERE work_order_id = wo.id AND management_type_id = 1 AND work_space_id = 2), 0) as tiempo_desarrollo,
            COALESCE((SELECT SUM(duracion_segundos) FROM managements
             WHERE work_order_id = wo.id AND management_type_id = 1 AND work_space_id = 3), 0) as tiempo_diseno,
            COALESCE((SELECT SUM(duracion_segundos) FROM managements
             WHERE work_order_id = wo.id AND management_type_id = 1 AND work_space_id = 4), 0) as tiempo_catalogacion,
            COALESCE((SELECT SUM(duracion_segundos) FROM managements
             WHERE work_order_id = wo.id AND management_type_id = 1 AND work_space_id = 5), 0) as tiempo_precatalogacion
        FROM work_orders wo
        LEFT JOIN product_types pt ON wo.product_type_id = pt.id
        LEFT JOIN clients c ON wo.client_id = c.id
        LEFT JOIN work_spaces ws ON wo.current_area_id = ws.id
        WHERE wo.creador_id = :user_id AND wo.active = 1
        ORDER BY wo.created_at DESC
    """)

    result = await db.execute(query, {"user_id": user_id})
    rows = result.fetchall()

    # Calcular dias en area actual
    ots = []
    for row in rows:
        dias_area = 0
        if row.ultimo_cambio_area:
            dias_area = (datetime.now() - row.ultimo_cambio_area).days

        ots.append({
            "id": row.id,
            "item": row.item,
            "cliente_id": row.cliente_id,
            "cliente": row.cliente,
            "descripcion": row.descripcion,
            "area": row.area,
            "area_abreviatura": row.area_abreviatura,
            "estado": row.estado or "PV",
            "dias_area_actual": dias_area,
            "created_at": row.created_at.strftime("%d/%m/%Y") if row.created_at else "",
            "tiempos": {
                "venta": row.tiempo_venta or 0,
                "desarrollo": row.tiempo_desarrollo or 0,
                "diseno": row.tiempo_diseno or 0,
                "catalogacion": row.tiempo_catalogacion or 0,
                "precatalogacion": row.tiempo_precatalogacion or 0
            }
        })

    # Areas activas
    areas_query = text("""
        SELECT id, nombre, abreviatura
        FROM work_spaces
        WHERE status = 'active'
        ORDER BY id
    """)
    areas_result = await db.execute(areas_query)
    areas = [{"id": r.id, "nombre": r.nombre, "abreviatura": r.abreviatura}
             for r in areas_result.fetchall()]

    # Estados activos
    estados_query = text("""
        SELECT id, nombre, abreviatura
        FROM states
        WHERE status = 'active'
        ORDER BY id
    """)
    estados_result = await db.execute(estados_query)
    estados = [{"id": r.id, "nombre": r.nombre, "abreviatura": r.abreviatura}
               for r in estados_result.fetchall()]

    return ListaOTsResponse(
        code="200",
        message=f"Exito, lista de OTs para vendedor: {user_id}",
        data={
            "ots": ots,
            "areas": areas,
            "estados": estados
        }
    )


@router.post("/obtener-detalles-ot")
async def obtener_detalles_ot(
    ot_id: int = Query(..., description="ID de la OT"),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
) -> OTDetalleResponse:
    """
    Obtiene detalle completo de una OT para vista mobile.

    Equivalente: ApiMobileController@getDetailsOt
    """
    # Query OT con todos los joins necesarios
    query = text("""
        SELECT
            wo.*,
            c.nombre as cliente_nombre,
            pt.descripcion as tipo_item,
            cr.codigo as carton_codigo,
            st.glosa as estilo_glosa,
            ch.nombre as canal_nombre,
            pr.descripcion as proceso_descripcion,
            ar.descripcion as armado_descripcion,
            ep.descripcion as envase_descripcion,
            col1.descripcion as color_1_desc,
            col2.descripcion as color_2_desc,
            col3.descripcion as color_3_desc,
            col4.descripcion as color_4_desc,
            col5.descripcion as color_5_desc
        FROM work_orders wo
        LEFT JOIN clients c ON wo.client_id = c.id
        LEFT JOIN product_types pt ON wo.product_type_id = pt.id
        LEFT JOIN cartons cr ON wo.carton_id = cr.id
        LEFT JOIN styles st ON wo.style_id = st.id
        LEFT JOIN channels ch ON wo.channel_id = ch.id
        LEFT JOIN procesos pr ON wo.proceso_id = pr.id
        LEFT JOIN armados ar ON wo.armado_id = ar.id
        LEFT JOIN envases ep ON wo.envase_primario_id = ep.id
        LEFT JOIN colors col1 ON wo.color_1 = col1.id
        LEFT JOIN colors col2 ON wo.color_2 = col2.id
        LEFT JOIN colors col3 ON wo.color_3 = col3.id
        LEFT JOIN colors col4 ON wo.color_4 = col4.id
        LEFT JOIN colors col5 ON wo.color_5 = col5.id
        WHERE wo.id = :ot_id
    """)

    result = await db.execute(query, {"ot_id": ot_id})
    row = result.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail=f"Orden de trabajo no existe: {ot_id}")

    # Mapeos para campos con opciones
    tipos_solicitud = {
        1: "Desarrollo Completo",
        2: "Cotiza con CAD",
        3: "Muestra con CAD",
        4: "Cotiza sin CAD",
        5: "Arte con Material"
    }

    tipos_impresion = {
        1: "Offset",
        2: "Flexografia",
        3: "Flexografia Alta Grafica",
        4: "Flexografia Tiro y Retiro",
        5: "Sin Impresion",
        6: "Sin Impresion (Solo OF)",
        7: "Sin Impresion (Trazabilidad Completa)"
    }

    terminacion_pegado_map = {
        0: "No",
        1: "Si",
        2: "Interno",
        3: "Externo"
    }

    # Construir respuesta
    detalle = {
        "id": row.id,
        "cliente": row.cliente_nombre,
        "tipo_solicitud": tipos_solicitud.get(row.tipo_solicitud),
        "descripcion": row.descripcion,
        "volumen_venta_anual": row.volumen_venta_anual,
        "usd": row.usd,
        "canal": row.canal_nombre,
        "analisis": row.analisis,
        "plano": row.plano,
        "datos_cotizar": row.datos_cotizar,
        "boceto": row.boceto,
        "nuevo_material": row.nuevo_material,
        "prueba_industrial": row.prueba_industrial,
        "muestra": row.muestra,
        "numero_muestras": row.numero_muestras,
        "cad": row.cad,
        "tipo_item": row.tipo_item,
        "carton": row.carton_codigo,
        "estilo": row.estilo_glosa,
        "recubrimiento": "Cera" if row.recubrimiento == 1 else "No",
        "golpes_largo": row.golpes_largo,
        "golpes_ancho": row.golpes_ancho,
        "largura_hm": row.largura_hm,
        "anchura_hm": row.anchura_hm,
        "bct_minimo": row.rmt,
        "color_1": row.color_1_desc,
        "color_2": row.color_2_desc,
        "color_3": row.color_3_desc,
        "color_4": row.color_4_desc,
        "color_5": row.color_5_desc,
        "impresion_1": row.impresion_1,
        "impresion_2": row.impresion_2,
        "impresion_3": row.impresion_3,
        "impresion_4": row.impresion_4,
        "impresion_5": row.impresion_5,
        "pegado": "Si" if row.pegado == 1 else "No" if row.pegado == 0 else None,
        "longitud_pegado": row.longitud_pegado,
        "cera_exterior": "Si" if row.cera_exterior else "No",
        "porcentaje_cera_exterior": row.porcentaje_cera_exterior,
        "cera_interior": "Si" if row.cera_interior else "No",
        "porcentaje_cera_interior": row.porcentaje_cera_interior,
        "barniz_interior": "Si" if row.barniz_interior else "No",
        "porcentaje_barniz_interior": row.porcentaje_barniz_interior,
        "interno_largo": row.interno_largo,
        "interno_ancho": row.interno_ancho,
        "interno_alto": row.interno_alto,
        "externo_largo": row.externo_largo,
        "externo_ancho": row.externo_ancho,
        "externo_alto": row.externo_alto,
        "proceso": row.proceso_descripcion,
        "terminacion_pegado": terminacion_pegado_map.get(row.pegado_terminacion) if row.pegado_terminacion else None,
        "armado": row.armado_descripcion,
        "impresion": tipos_impresion.get(row.impresion) if row.impresion else None,
        "peso_contenido_caja": row.peso_contenido_caja,
        "autosoportante": "Si" if row.autosoportante == 1 else "No" if row.autosoportante == 0 else None,
        "envase_primario": row.envase_descripcion,
        "cajas_altura": row.cajas_altura,
        "pallet_sobre_pallet": "Si" if row.pallet_sobre_pallet == 1 else "No" if row.pallet_sobre_pallet == 0 else None,
        "cantidad": row.cantidad,
        "nombre_contacto": row.nombre_contacto,
        "email_contacto": row.email_contacto,
        "telefono_contacto": row.telefono_contacto,
        "created_at": row.created_at.strftime("%d/%m/%Y") if row.created_at else ""
    }

    return OTDetalleResponse(
        code="200",
        message=f"Detalle de OT: {ot_id}",
        data=detalle
    )


@router.post("/obtener-historico-ot")
async def obtener_historico_ot(
    ot_id: int = Query(..., description="ID de la OT"),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
) -> HistorialOTResponse:
    """
    Obtiene historial de gestiones de una OT para mobile.
    Incluye consultas, respuestas y cambios de estado.

    Equivalente: ApiMobileController@getHistoryOt
    """
    user_id = current_user["id"]

    # Verificar que la OT existe
    ot_query = text("""
        SELECT wo.*,
               (SELECT state_id FROM managements
                WHERE work_order_id = wo.id AND management_type_id = 1
                ORDER BY created_at DESC LIMIT 1) as ultimo_estado_id
        FROM work_orders wo
        WHERE wo.id = :ot_id
    """)
    ot_result = await db.execute(ot_query, {"ot_id": ot_id})
    ot = ot_result.fetchone()

    if not ot:
        raise HTTPException(status_code=404, detail=f"Orden de trabajo no existe: {ot_id}")

    # Verificar si puede gestionar
    puede_gestionar = False
    if ot.ultimo_estado_id and ot.ultimo_estado_id not in [9, 11] and ot.current_area_id == 1:
        puede_gestionar = True

    # Query gestiones
    gestiones_query = text("""
        SELECT
            m.id,
            m.observacion,
            m.management_type_id,
            m.state_id,
            m.consulted_work_space_id,
            m.created_at,
            mt.nombre as tipo_gestion,
            ws.nombre as area,
            s.nombre as estado_nombre,
            ws_consultada.nombre as area_consultada,
            CONCAT(u.name, ' ', COALESCE(u.apellido_paterno, '')) as usuario,
            (SELECT COUNT(*) FROM files WHERE management_id = m.id) as archivos,
            (SELECT a.respuesta FROM answers a WHERE a.management_id = m.id LIMIT 1) as respuesta_texto,
            (SELECT a.created_at FROM answers a WHERE a.management_id = m.id LIMIT 1) as respuesta_fecha,
            (SELECT CONCAT(u2.name, ' ', COALESCE(u2.apellido_paterno, ''))
             FROM answers a JOIN users u2 ON a.user_id = u2.id
             WHERE a.management_id = m.id LIMIT 1) as respuesta_usuario
        FROM managements m
        JOIN management_types mt ON m.management_type_id = mt.id
        JOIN work_spaces ws ON m.work_space_id = ws.id
        JOIN users u ON m.user_id = u.id
        LEFT JOIN states s ON m.state_id = s.id
        LEFT JOIN work_spaces ws_consultada ON m.consulted_work_space_id = ws_consultada.id
        WHERE m.work_order_id = :ot_id
        ORDER BY m.created_at DESC
    """)

    gestiones_result = await db.execute(gestiones_query, {"ot_id": ot_id})

    gestiones = []
    for g in gestiones_result.fetchall():
        gestion = {
            "id": g.id,
            "tipo_gestion": g.tipo_gestion,
            "observacion": g.observacion,
            "area": g.area,
            "usuario": g.usuario,
            "fecha": g.created_at.strftime("%d/%m/%Y %H:%M") if g.created_at else "",
            "archivos_subidos": g.archivos or 0
        }

        if g.management_type_id == 1:
            # Cambio estado
            gestion["color"] = "#6f42c1"
            gestion["nuevo_estado"] = g.estado_nombre
        elif g.management_type_id == 2:
            # Consulta
            gestion["color"] = "#e83e8c"
            gestion["area_consultada"] = g.area_consultada

            if g.respuesta_texto:
                gestion["estado_consulta"] = "Respondida"
                gestion["respuesta"] = g.respuesta_texto
                gestion["usuario_respuesta"] = g.respuesta_usuario
                gestion["fecha_respuesta"] = g.respuesta_fecha.strftime("%d/%m/%Y %H:%M") if g.respuesta_fecha else ""
                gestion["responder"] = False
            else:
                gestion["estado_consulta"] = "Por Responder"
                # Puede responder si el area consultada es 1 (Ventas) y es el creador
                gestion["responder"] = (g.consulted_work_space_id == 1 and ot.creador_id == user_id)
        elif g.management_type_id == 3:
            # Archivo
            gestion["color"] = "#20c997"
        else:
            gestion["color"] = "#6f42c1"

        gestiones.append(gestion)

    # Determinar estados disponibles segun logica Laravel
    states_by_area = await _get_estados_disponibles(db, ot_id, ot)

    return HistorialOTResponse(
        code="200",
        message=f"Historico OT: {ot_id}",
        data={
            "gestiones": gestiones,
            "estados": states_by_area,
            "puede_gestionar": puede_gestionar
        }
    )


async def _get_estados_disponibles(db: AsyncSession, ot_id: int, ot) -> Dict[int, str]:
    """
    Determina estados disponibles segun reglas de negocio.
    Replica logica de ApiMobileController::getHistoryOt.
    """
    # Buscar si ya fue enviado a desarrollo o diseno
    gestiones_query = text("""
        SELECT state_id FROM managements
        WHERE work_order_id = :ot_id AND management_type_id = 1
    """)
    gestiones_result = await db.execute(gestiones_query, {"ot_id": ot_id})
    estados_usados = [r.state_id for r in gestiones_result.fetchall()]

    enviado_a_desarrollo = 2 in estados_usados  # Estado 2 = Desarrollo
    enviado_a_diseno = 5 in estados_usados      # Estado 5 = Diseno grafico

    # Estados base
    if enviado_a_desarrollo:
        estados_ids = [2, 5, 6, 7, 9, 10, 11, 14, 15, 16]
    else:
        estados_ids = [2, 9, 10, 11, 14, 15, 16]

    # Si es Arte con Material
    if ot.tipo_solicitud == 5:
        if enviado_a_diseno:
            estados_ids = [2, 5, 6, 7, 9, 10, 11, 14, 15, 16]
        else:
            estados_ids = [5, 9, 10, 11, 14, 15, 16]

    # Ajustes segun estado actual
    ultimo_estado = ot.ultimo_estado_id if hasattr(ot, 'ultimo_estado_id') else None

    if ultimo_estado == 10:  # Consulta cliente
        if 10 in estados_ids:
            estados_ids.remove(10)
        estados_ids.append(1)  # Regreso a Venta
    elif ultimo_estado == 14:  # Espera de OC
        if 14 in estados_ids:
            estados_ids.remove(14)
        estados_ids.append(1)
    elif ultimo_estado == 15:  # Falta definicion cliente
        if 15 in estados_ids:
            estados_ids.remove(15)
        estados_ids.append(1)
    elif ultimo_estado == 16:  # Visto bueno cliente
        if 16 in estados_ids:
            estados_ids.remove(16)
        estados_ids.append(1)

    # Obtener nombres de estados
    estados_query = text("""
        SELECT id, nombre FROM states WHERE id IN :ids
    """)
    estados_result = await db.execute(estados_query, {"ids": tuple(estados_ids) if estados_ids else (0,)})

    return {r.id: r.nombre for r in estados_result.fetchall()}


@router.post("/guardar-gestion-ot")
async def guardar_gestion_ot(
    request: GuardarGestionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Guarda una nueva gestion (cambio estado o consulta) en una OT.

    Equivalente: ApiMobileController@saveGestionOt
    """
    user_id = current_user["id"]

    if not request.state_id and not request.area_id:
        raise HTTPException(status_code=401, detail="Falta campo state_id o area_id")

    # Verificar OT existe
    ot_query = text("""
        SELECT wo.*,
               (SELECT state_id FROM managements
                WHERE work_order_id = wo.id AND management_type_id = 1
                ORDER BY created_at DESC LIMIT 1) as ultimo_estado_id,
               (SELECT created_at FROM managements
                WHERE work_order_id = wo.id AND management_type_id = 1
                ORDER BY created_at DESC LIMIT 1) as ultimo_cambio_estado_at
        FROM work_orders wo
        WHERE wo.id = :ot_id
    """)
    ot_result = await db.execute(ot_query, {"ot_id": request.ot_id})
    ot = ot_result.fetchone()

    if not ot:
        raise HTTPException(status_code=404, detail=f"Orden de trabajo no existe: {request.ot_id}")

    # Verificar si puede gestionar (solo para cambios de estado)
    if request.state_id:
        puede_gestionar = False
        if ot.ultimo_estado_id and ot.ultimo_estado_id not in [9, 11] and ot.current_area_id == 1:
            puede_gestionar = True

        if not puede_gestionar:
            raise HTTPException(status_code=403, detail="Usuario no puede gestionar OT actualmente")

    # Determinar tipo de gestion
    management_type_id = 1 if request.state_id else 2

    # Calcular duracion en segundos para cambios de estado
    duracion_segundos = 0
    if management_type_id == 1:
        # Usar ultimo cambio de area o ultimo cambio de estado
        fecha_referencia = ot.ultimo_cambio_area
        if ot.ultimo_cambio_estado_at and ot.ultimo_cambio_estado_at > ot.ultimo_cambio_area:
            fecha_referencia = ot.ultimo_cambio_estado_at

        if fecha_referencia:
            diff = datetime.now() - fecha_referencia
            duracion_segundos = int(diff.total_seconds())

        # Si estado actual es terminal, duracion = 0
        if ot.ultimo_estado_id in [8, 9, 11, 13]:
            duracion_segundos = 0

    # Insertar gestion
    insert_query = text("""
        INSERT INTO managements
        (observacion, management_type_id, user_id, work_order_id, work_space_id,
         state_id, consulted_work_space_id, duracion_segundos, created_at, updated_at)
        VALUES
        (:observacion, :management_type_id, :user_id, :ot_id, 1,
         :state_id, :area_consultada, :duracion, NOW(), NOW())
    """)

    await db.execute(insert_query, {
        "observacion": request.observacion,
        "management_type_id": management_type_id,
        "user_id": user_id,
        "ot_id": request.ot_id,
        "state_id": request.state_id,
        "area_consultada": request.area_id,
        "duracion": duracion_segundos
    })

    # Si es cambio de estado, actualizar area de la OT
    if management_type_id == 1 and request.state_id:
        area_map = {
            1: 1,   # Ventas
            2: 2,   # Desarrollo
            5: 3,   # Diseno
            7: 4,   # Catalogacion
            6: 5,   # Precatalogacion
            16: 1   # Visto bueno cliente -> Ventas
        }

        new_area = area_map.get(request.state_id)
        if new_area:
            update_ot = text("""
                UPDATE work_orders
                SET current_area_id = :area, ultimo_cambio_area = NOW(), updated_at = NOW()
                WHERE id = :ot_id
            """)
            await db.execute(update_ot, {"area": new_area, "ot_id": request.ot_id})
        elif request.state_id in [9, 11]:  # Perdido o Anulado
            update_ot = text("""
                UPDATE work_orders SET ultimo_cambio_area = NOW(), updated_at = NOW() WHERE id = :ot_id
            """)
            await db.execute(update_ot, {"ot_id": request.ot_id})

    await db.commit()

    # Obtener gestion recien creada
    get_gestion = text("""
        SELECT m.*, mt.nombre as tipo_nombre, ws.nombre as area_nombre,
               s.nombre as estado_nombre, ws2.nombre as area_consultada_nombre,
               CONCAT(u.name, ' ', COALESCE(u.apellido_paterno, '')) as usuario_nombre
        FROM managements m
        JOIN management_types mt ON m.management_type_id = mt.id
        JOIN work_spaces ws ON m.work_space_id = ws.id
        JOIN users u ON m.user_id = u.id
        LEFT JOIN states s ON m.state_id = s.id
        LEFT JOIN work_spaces ws2 ON m.consulted_work_space_id = ws2.id
        WHERE m.work_order_id = :ot_id
        ORDER BY m.created_at DESC LIMIT 1
    """)
    gestion_result = await db.execute(get_gestion, {"ot_id": request.ot_id})
    g = gestion_result.fetchone()

    response_gestion = {
        "id": g.id,
        "tipo_gestion": g.tipo_nombre,
        "observacion": g.observacion,
        "area": g.area_nombre,
        "usuario": g.usuario_nombre,
        "fecha": g.created_at.strftime("%d/%m/%Y %H:%M") if g.created_at else "",
        "archivos_subidos": 0
    }

    if management_type_id == 1:
        response_gestion["color"] = "#6f42c1"
        response_gestion["nuevo_estado"] = g.estado_nombre
    else:
        response_gestion["color"] = "#e83e8c"
        response_gestion["area_consultada"] = g.area_consultada_nombre
        response_gestion["estado_consulta"] = "Por Responder"
        response_gestion["responder"] = False

    return {
        "code": "200",
        "message": "Gestion creada con exito",
        "data": response_gestion
    }


@router.post("/guardar-respuesta")
async def guardar_respuesta(
    request: GuardarRespuestaRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Guarda respuesta a una consulta de otra area.

    Equivalente: ApiMobileController@saveAnswerOt
    """
    user_id = current_user["id"]

    # Verificar gestion existe
    gestion_query = text("SELECT id FROM managements WHERE id = :gestion_id")
    gestion_result = await db.execute(gestion_query, {"gestion_id": request.gestion_id})
    gestion = gestion_result.fetchone()

    if not gestion:
        raise HTTPException(status_code=404, detail=f"Gestion no existe: {request.gestion_id}")

    # Insertar respuesta
    insert_query = text("""
        INSERT INTO answers (respuesta, user_id, management_id, created_at, updated_at)
        VALUES (:respuesta, :user_id, :management_id, NOW(), NOW())
    """)

    await db.execute(insert_query, {
        "respuesta": request.observacion,
        "user_id": user_id,
        "management_id": request.gestion_id
    })

    await db.commit()

    return {
        "code": "200",
        "message": "Respuesta guardada con exito"
    }


@router.post("/actualizar-token-notificacion")
async def actualizar_token_push(
    request: UpdatePushTokenRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Actualiza el token de notificacion push del usuario.

    Equivalente: ApiMobileController@updateTokenNotificationSeller
    """
    user_id = current_user["id"]

    update_query = text("""
        UPDATE users SET token_push_mobile = :token, updated_at = NOW() WHERE id = :user_id
    """)

    await db.execute(update_query, {
        "token": request.token_push_mobile,
        "user_id": user_id
    })

    await db.commit()

    return {
        "code": "200",
        "message": "Token de notificacion push ha sido guardado!"
    }


@router.post("/listar-materiales-cliente")
async def listar_materiales_cliente(
    rut_clientes: List[str],
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Lista materiales por RUT de clientes.

    Equivalente: ApiMobileController@postMaterialesCliente
    """
    if not rut_clientes:
        raise HTTPException(status_code=404, detail="Campo RUT es requerido")

    query = text("""
        SELECT m.* FROM materials m
        JOIN clients c ON m.client_id = c.id
        WHERE c.rut IN :ruts
    """)

    result = await db.execute(query, {"ruts": tuple(rut_clientes)})
    materiales = [dict(row._mapping) for row in result.fetchall()]

    return {
        "code": "200",
        "data": materiales
    }


@router.post("/listar-materiales-jerarquia")
async def listar_materiales_jerarquia(
    codigos: List[str],
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Lista materiales con su jerarquia.

    Equivalente: ApiMobileController@postMaterialesJerarquia
    """
    if not codigos:
        raise HTTPException(status_code=404, detail="El codigo es requerido")

    query = text("""
        SELECT m.codigo, m.descripcion as material_descripcion,
               sh.descripcion as jerarquia_descripcion
        FROM materials m
        LEFT JOIN subsubhierarchies ssh ON m.sap_hiearchy_id = ssh.id
        LEFT JOIN subhierarchies sh ON ssh.subhierarchy_id = sh.id
        WHERE m.codigo IN :codigos
    """)

    result = await db.execute(query, {"codigos": tuple(codigos)})

    datos = {}
    for row in result.fetchall():
        datos[row.codigo] = {
            "material_descripcion": row.material_descripcion,
            "material_jerarquia": row.jerarquia_descripcion
        }

    return {
        "code": "200",
        "data": datos
    }


@router.get("/listar-jerarquias")
async def listar_jerarquias(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Lista todas las jerarquias con sus sub-jerarquias.

    Equivalente: ApiMobileController@getJerarquias
    """
    query = text("""
        SELECT h.descripcion as jerarquia, sh.descripcion as subjerarquia
        FROM hierarchies h
        LEFT JOIN subhierarchies sh ON sh.hierarchy_id = h.id
        WHERE h.active = 1
        ORDER BY h.descripcion, sh.descripcion
    """)

    result = await db.execute(query)
    rows = result.fetchall()

    datos = {}
    for row in rows:
        if row.jerarquia not in datos:
            datos[row.jerarquia] = []
        if row.subjerarquia:
            datos[row.jerarquia].append(row.subjerarquia)

    return {
        "code": "200",
        "data": datos
    }


# ============================================================================
# ENDPOINTS ADICIONALES PARA MOBILE
# ============================================================================

@router.get("/resumen-vendedor")
async def resumen_vendedor(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Resumen rapido para dashboard mobile del vendedor.
    Incluye contadores y OTs recientes.
    """
    user_id = current_user["id"]

    # Contadores
    query = text("""
        SELECT
            COUNT(*) as total_ots,
            SUM(CASE WHEN current_area_id = 1 THEN 1 ELSE 0 END) as en_ventas,
            SUM(CASE WHEN current_area_id = 2 THEN 1 ELSE 0 END) as en_desarrollo,
            SUM(CASE WHEN current_area_id = 3 THEN 1 ELSE 0 END) as en_diseno,
            SUM(CASE WHEN current_area_id = 4 THEN 1 ELSE 0 END) as en_catalogacion
        FROM work_orders
        WHERE creador_id = :user_id AND active = 1
    """)

    result = await db.execute(query, {"user_id": user_id})
    stats = result.fetchone()

    # OTs recientes (ultimas 5)
    recientes_query = text("""
        SELECT wo.id, c.nombre as cliente, wo.descripcion, ws.abreviatura as area
        FROM work_orders wo
        LEFT JOIN clients c ON wo.client_id = c.id
        LEFT JOIN work_spaces ws ON wo.current_area_id = ws.id
        WHERE wo.creador_id = :user_id AND wo.active = 1
        ORDER BY wo.updated_at DESC
        LIMIT 5
    """)
    recientes_result = await db.execute(recientes_query, {"user_id": user_id})
    recientes = [dict(row._mapping) for row in recientes_result.fetchall()]

    # Notificaciones no leidas
    notif_query = text("""
        SELECT COUNT(*) as no_leidas FROM notifications
        WHERE user_id = :user_id AND leida = 0
    """)
    notif_result = await db.execute(notif_query, {"user_id": user_id})
    notif = notif_result.fetchone()

    return {
        "code": "200",
        "data": {
            "estadisticas": {
                "total": stats.total_ots or 0,
                "en_ventas": stats.en_ventas or 0,
                "en_desarrollo": stats.en_desarrollo or 0,
                "en_diseno": stats.en_diseno or 0,
                "en_catalogacion": stats.en_catalogacion or 0
            },
            "ots_recientes": recientes,
            "notificaciones_pendientes": notif.no_leidas or 0
        }
    }


@router.get("/notificaciones")
async def listar_notificaciones_mobile(
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Lista notificaciones del usuario para mobile.
    """
    user_id = current_user["id"]

    query = text("""
        SELECT n.*, wo.descripcion as ot_descripcion
        FROM notifications n
        LEFT JOIN work_orders wo ON n.work_order_id = wo.id
        WHERE n.user_id = :user_id
        ORDER BY n.created_at DESC
        LIMIT :limit
    """)

    result = await db.execute(query, {"user_id": user_id, "limit": limit})

    notificaciones = []
    for row in result.fetchall():
        notificaciones.append({
            "id": row.id,
            "titulo": row.titulo,
            "mensaje": row.mensaje,
            "leida": row.leida == 1,
            "ot_id": row.work_order_id,
            "ot_descripcion": row.ot_descripcion,
            "fecha": row.created_at.strftime("%d/%m/%Y %H:%M") if row.created_at else ""
        })

    return {
        "code": "200",
        "data": notificaciones
    }


@router.put("/notificaciones/{notif_id}/leer")
async def marcar_notificacion_leida(
    notif_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Marca una notificacion como leida.
    """
    user_id = current_user["id"]

    update_query = text("""
        UPDATE notifications SET leida = 1, updated_at = NOW()
        WHERE id = :notif_id AND user_id = :user_id
    """)

    await db.execute(update_query, {"notif_id": notif_id, "user_id": user_id})
    await db.commit()

    return {
        "code": "200",
        "message": "Notificacion marcada como leida"
    }
