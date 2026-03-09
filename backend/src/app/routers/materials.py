"""
Router de Materiales y CAD - FASE 6.34
Gestiona materiales, asignacion de CAD y archivos de diseno.

Funcionalidades:
- CRUD de materiales
- Asignacion de CAD a materiales y OTs
- Busqueda de materiales por codigo
- Validacion de CAD existentes
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import logging

from ..database import get_mysql_connection

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/materials", tags=["materials"])


# =============================================
# SCHEMAS
# =============================================

class MaterialBase(BaseModel):
    """Datos base de un material."""
    codigo: Optional[str] = None
    descripcion: Optional[str] = None
    client_id: Optional[int] = None
    vendedor_id: Optional[int] = None
    carton_id: Optional[int] = None
    product_type_id: Optional[int] = None
    style_id: Optional[int] = None
    cad_id: Optional[int] = None
    rayado_id: Optional[int] = None
    numero_colores: Optional[int] = None
    gramaje: Optional[float] = None
    ect: Optional[float] = None
    peso: Optional[float] = None
    golpes_largo: Optional[float] = None
    golpes_ancho: Optional[float] = None
    area_hc: Optional[float] = None
    bct_min_lb: Optional[float] = None
    bct_min_kg: Optional[float] = None


class MaterialCreate(MaterialBase):
    """Datos para crear un material."""
    pass


class MaterialUpdate(MaterialBase):
    """Datos para actualizar un material."""
    pass


class MaterialResponse(BaseModel):
    """Respuesta de material con datos adicionales."""
    id: int
    codigo: Optional[str] = None
    descripcion: Optional[str] = None
    client_id: Optional[int] = None
    client_nombre: Optional[str] = None
    cad_id: Optional[int] = None
    cad_codigo: Optional[str] = None
    carton_id: Optional[int] = None
    carton_nombre: Optional[str] = None
    product_type_id: Optional[int] = None
    product_type_nombre: Optional[str] = None
    active: bool


class MaterialListResponse(BaseModel):
    """Respuesta de lista de materiales."""
    data: List[MaterialResponse]
    total: int
    page: int
    page_size: int


class CADBase(BaseModel):
    """Datos base de un CAD."""
    cad: str  # Codigo CAD
    externo_largo: Optional[float] = None
    externo_ancho: Optional[float] = None
    externo_alto: Optional[float] = None
    interno_largo: Optional[float] = None
    interno_ancho: Optional[float] = None
    interno_alto: Optional[float] = None
    largura_hm: Optional[float] = None
    anchura_hm: Optional[float] = None
    largura_hc: Optional[float] = None
    anchura_hc: Optional[float] = None
    area_hm: Optional[float] = None
    area_hc_unitario: Optional[float] = None
    area_producto: Optional[float] = None


class CADResponse(CADBase):
    """Respuesta de CAD."""
    id: int
    active: bool


class CADAssignRequest(BaseModel):
    """Request para asignar CAD a una OT."""
    ot_id: int
    cad_id: Optional[int] = None  # Usar CAD existente
    cad_codigo: Optional[str] = None  # O crear nuevo CAD
    material_codigo: Optional[str] = None
    descripcion: Optional[str] = None


class CADAssignResponse(BaseModel):
    """Respuesta de asignacion de CAD."""
    success: bool
    message: str
    cad_id: Optional[int] = None
    material_id: Optional[int] = None


class MaterialSearchResponse(BaseModel):
    """Respuesta de busqueda de material."""
    id: int
    codigo: str
    descripcion: Optional[str] = None
    client_nombre: Optional[str] = None
    cad_codigo: Optional[str] = None


# =============================================
# ENDPOINTS MATERIALES
# =============================================

@router.get("", response_model=MaterialListResponse)
async def list_materials(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    client_id: Optional[int] = None,
    active: Optional[bool] = True
):
    """
    Lista materiales con filtros y paginacion.
    """
    connection = None
    try:
        connection = get_mysql_connection()
        with connection.cursor() as cursor:
            # Construir query base
            where_conditions = []
            params = []

            if active is not None:
                where_conditions.append("m.active = %s")
                params.append(1 if active else 0)

            if search:
                where_conditions.append("(m.codigo LIKE %s OR m.descripcion LIKE %s)")
                params.extend([f"%{search}%", f"%{search}%"])

            if client_id:
                where_conditions.append("m.client_id = %s")
                params.append(client_id)

            where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"

            # Contar total
            cursor.execute(f"""
                SELECT COUNT(*) as total
                FROM materials m
                WHERE {where_clause}
            """, params)
            total = cursor.fetchone()["total"]

            # Obtener materiales paginados
            offset = (page - 1) * page_size
            cursor.execute(f"""
                SELECT
                    m.id,
                    m.codigo,
                    m.descripcion,
                    m.client_id,
                    c.nombre AS client_nombre,
                    m.cad_id,
                    cad.cad AS cad_codigo,
                    m.carton_id,
                    ct.nombre AS carton_nombre,
                    m.product_type_id,
                    pt.nombre AS product_type_nombre,
                    m.active
                FROM materials m
                LEFT JOIN clients c ON m.client_id = c.id
                LEFT JOIN cads cad ON m.cad_id = cad.id
                LEFT JOIN cartons ct ON m.carton_id = ct.id
                LEFT JOIN product_types pt ON m.product_type_id = pt.id
                WHERE {where_clause}
                ORDER BY m.created_at DESC
                LIMIT %s OFFSET %s
            """, params + [page_size, offset])
            materials = cursor.fetchall()

            return MaterialListResponse(
                data=[MaterialResponse(**m) for m in materials],
                total=total,
                page=page,
                page_size=page_size
            )

    except Exception as e:
        logger.error(f"Error listing materials: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if connection:
            connection.close()


@router.get("/search")
async def search_materials(
    q: str = Query(..., min_length=2),
    limit: int = Query(10, ge=1, le=50)
):
    """
    Busqueda rapida de materiales por codigo.
    """
    connection = None
    try:
        connection = get_mysql_connection()
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT
                    m.id,
                    m.codigo,
                    m.descripcion,
                    c.nombre AS client_nombre,
                    cad.cad AS cad_codigo
                FROM materials m
                LEFT JOIN clients c ON m.client_id = c.id
                LEFT JOIN cads cad ON m.cad_id = cad.id
                WHERE m.active = 1
                AND (m.codigo LIKE %s OR m.descripcion LIKE %s)
                ORDER BY m.codigo
                LIMIT %s
            """, (f"%{q}%", f"%{q}%", limit))
            materials = cursor.fetchall()

            return [MaterialSearchResponse(**m) for m in materials]

    except Exception as e:
        logger.error(f"Error searching materials: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if connection:
            connection.close()


@router.get("/{material_id}")
async def get_material(material_id: int):
    """
    Obtiene un material por ID.
    """
    connection = None
    try:
        connection = get_mysql_connection()
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT
                    m.*,
                    c.nombre AS client_nombre,
                    cad.cad AS cad_codigo,
                    ct.nombre AS carton_nombre,
                    pt.nombre AS product_type_nombre
                FROM materials m
                LEFT JOIN clients c ON m.client_id = c.id
                LEFT JOIN cads cad ON m.cad_id = cad.id
                LEFT JOIN cartons ct ON m.carton_id = ct.id
                LEFT JOIN product_types pt ON m.product_type_id = pt.id
                WHERE m.id = %s
            """, (material_id,))
            material = cursor.fetchone()

            if not material:
                raise HTTPException(status_code=404, detail="Material no encontrado")

            return material

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting material: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if connection:
            connection.close()


@router.post("")
async def create_material(data: MaterialCreate):
    """
    Crea un nuevo material.
    """
    connection = None
    try:
        connection = get_mysql_connection()
        with connection.cursor() as cursor:
            # Verificar codigo unico
            if data.codigo:
                cursor.execute("""
                    SELECT id FROM materials WHERE codigo = %s
                """, (data.codigo,))
                if cursor.fetchone():
                    raise HTTPException(
                        status_code=400,
                        detail=f"Ya existe un material con codigo {data.codigo}"
                    )

            # Insertar material
            fields = []
            values = []
            placeholders = []

            for field, value in data.dict(exclude_unset=True).items():
                if value is not None:
                    fields.append(field)
                    values.append(value)
                    placeholders.append("%s")

            fields.extend(["active", "created_at"])
            values.extend([1, datetime.now()])
            placeholders.extend(["%s", "%s"])

            cursor.execute(f"""
                INSERT INTO materials ({', '.join(fields)})
                VALUES ({', '.join(placeholders)})
            """, values)
            connection.commit()

            material_id = cursor.lastrowid

            return {
                "id": material_id,
                "message": "Material creado exitosamente"
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating material: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if connection:
            connection.close()


@router.put("/{material_id}")
async def update_material(material_id: int, data: MaterialUpdate):
    """
    Actualiza un material existente.
    """
    connection = None
    try:
        connection = get_mysql_connection()
        with connection.cursor() as cursor:
            # Verificar que existe
            cursor.execute("SELECT id FROM materials WHERE id = %s", (material_id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Material no encontrado")

            # Actualizar
            updates = []
            values = []

            for field, value in data.dict(exclude_unset=True).items():
                if value is not None:
                    updates.append(f"{field} = %s")
                    values.append(value)

            if updates:
                updates.append("updated_at = %s")
                values.append(datetime.now())
                values.append(material_id)

                cursor.execute(f"""
                    UPDATE materials
                    SET {', '.join(updates)}
                    WHERE id = %s
                """, values)
                connection.commit()

            return {"message": "Material actualizado exitosamente"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating material: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if connection:
            connection.close()


@router.put("/{material_id}/activate")
async def activate_material(material_id: int):
    """
    Activa un material.
    """
    connection = None
    try:
        connection = get_mysql_connection()
        with connection.cursor() as cursor:
            cursor.execute("""
                UPDATE materials SET active = 1, updated_at = %s WHERE id = %s
            """, (datetime.now(), material_id))
            connection.commit()

            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Material no encontrado")

            return {"message": "Material activado"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error activating material: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if connection:
            connection.close()


@router.put("/{material_id}/deactivate")
async def deactivate_material(material_id: int):
    """
    Desactiva un material.
    """
    connection = None
    try:
        connection = get_mysql_connection()
        with connection.cursor() as cursor:
            cursor.execute("""
                UPDATE materials SET active = 0, updated_at = %s WHERE id = %s
            """, (datetime.now(), material_id))
            connection.commit()

            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Material no encontrado")

            return {"message": "Material desactivado"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deactivating material: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if connection:
            connection.close()


# =============================================
# ENDPOINTS CAD
# =============================================

@router.get("/cads/list")
async def list_cads(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    active: Optional[bool] = True
):
    """
    Lista CADs con filtros.
    """
    connection = None
    try:
        connection = get_mysql_connection()
        with connection.cursor() as cursor:
            where_conditions = []
            params = []

            if active is not None:
                where_conditions.append("active = %s")
                params.append(1 if active else 0)

            if search:
                where_conditions.append("cad LIKE %s")
                params.append(f"%{search}%")

            where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"

            # Total
            cursor.execute(f"SELECT COUNT(*) as total FROM cads WHERE {where_clause}", params)
            total = cursor.fetchone()["total"]

            # Lista paginada
            offset = (page - 1) * page_size
            cursor.execute(f"""
                SELECT * FROM cads
                WHERE {where_clause}
                ORDER BY cad
                LIMIT %s OFFSET %s
            """, params + [page_size, offset])
            cads = cursor.fetchall()

            return {
                "data": cads,
                "total": total,
                "page": page,
                "page_size": page_size
            }

    except Exception as e:
        logger.error(f"Error listing CADs: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if connection:
            connection.close()


@router.get("/cads/search")
async def search_cads(
    q: str = Query(..., min_length=2),
    limit: int = Query(10, ge=1, le=50)
):
    """
    Busqueda rapida de CADs.
    """
    connection = None
    try:
        connection = get_mysql_connection()
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT id, cad,
                       externo_largo, externo_ancho, externo_alto,
                       interno_largo, interno_ancho, interno_alto
                FROM cads
                WHERE active = 1 AND cad LIKE %s
                ORDER BY cad
                LIMIT %s
            """, (f"%{q}%", limit))
            cads = cursor.fetchall()

            return cads

    except Exception as e:
        logger.error(f"Error searching CADs: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if connection:
            connection.close()


@router.get("/cads/{cad_id}")
async def get_cad(cad_id: int):
    """
    Obtiene un CAD por ID.
    """
    connection = None
    try:
        connection = get_mysql_connection()
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM cads WHERE id = %s", (cad_id,))
            cad = cursor.fetchone()

            if not cad:
                raise HTTPException(status_code=404, detail="CAD no encontrado")

            return cad

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting CAD: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if connection:
            connection.close()


@router.post("/cads/validate")
async def validate_cad(cad_codigo: str):
    """
    Valida si un codigo CAD ya existe.
    """
    connection = None
    try:
        connection = get_mysql_connection()
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT id, cad FROM cads WHERE cad = %s
            """, (cad_codigo,))
            existing = cursor.fetchone()

            return {
                "exists": existing is not None,
                "cad": existing
            }

    except Exception as e:
        logger.error(f"Error validating CAD: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if connection:
            connection.close()


# =============================================
# ASIGNACION CAD A OT
# =============================================

@router.post("/assign-cad", response_model=CADAssignResponse)
async def assign_cad_to_ot(data: CADAssignRequest):
    """
    Asigna un CAD a una OT.
    Puede usar CAD existente o crear uno nuevo.
    """
    connection = None
    try:
        connection = get_mysql_connection()
        with connection.cursor() as cursor:
            # Verificar que la OT existe
            cursor.execute("SELECT id FROM work_orders WHERE id = %s", (data.ot_id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="OT no encontrada")

            cad_id = data.cad_id

            # Si no hay CAD ID, buscar por codigo o crear nuevo
            if not cad_id and data.cad_codigo:
                cursor.execute("SELECT id FROM cads WHERE cad = %s", (data.cad_codigo,))
                existing = cursor.fetchone()

                if existing:
                    cad_id = existing["id"]
                else:
                    # Crear nuevo CAD
                    cursor.execute("""
                        INSERT INTO cads (cad, active, created_at)
                        VALUES (%s, 1, %s)
                    """, (data.cad_codigo, datetime.now()))
                    cad_id = cursor.lastrowid

            if not cad_id:
                raise HTTPException(
                    status_code=400,
                    detail="Debe proporcionar cad_id o cad_codigo"
                )

            # Actualizar OT con CAD
            cursor.execute("""
                UPDATE work_orders
                SET cad_id = %s, updated_at = %s
                WHERE id = %s
            """, (cad_id, datetime.now(), data.ot_id))

            # Si hay codigo de material, buscar o crear material
            material_id = None
            if data.material_codigo:
                cursor.execute("""
                    SELECT id FROM materials WHERE codigo = %s
                """, (data.material_codigo,))
                existing_material = cursor.fetchone()

                if existing_material:
                    material_id = existing_material["id"]
                    # Actualizar material con CAD
                    cursor.execute("""
                        UPDATE materials SET cad_id = %s WHERE id = %s
                    """, (cad_id, material_id))
                else:
                    # Crear material basico
                    cursor.execute("""
                        INSERT INTO materials (codigo, descripcion, cad_id, active, created_at)
                        VALUES (%s, %s, %s, 1, %s)
                    """, (data.material_codigo, data.descripcion, cad_id, datetime.now()))
                    material_id = cursor.lastrowid

                # Asignar material a OT
                cursor.execute("""
                    UPDATE work_orders SET material_id = %s WHERE id = %s
                """, (material_id, data.ot_id))

            connection.commit()

            return CADAssignResponse(
                success=True,
                message="CAD asignado exitosamente",
                cad_id=cad_id,
                material_id=material_id
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error assigning CAD: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if connection:
            connection.close()


@router.get("/ot/{ot_id}/material")
async def get_ot_material(ot_id: int):
    """
    Obtiene el material y CAD asignado a una OT.
    """
    connection = None
    try:
        connection = get_mysql_connection()
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT
                    wo.id AS ot_id,
                    wo.material_id,
                    wo.cad_id,
                    m.codigo AS material_codigo,
                    m.descripcion AS material_descripcion,
                    c.cad AS cad_codigo,
                    c.externo_largo, c.externo_ancho, c.externo_alto,
                    c.interno_largo, c.interno_ancho, c.interno_alto
                FROM work_orders wo
                LEFT JOIN materials m ON wo.material_id = m.id
                LEFT JOIN cads c ON wo.cad_id = c.id
                WHERE wo.id = %s
            """, (ot_id,))
            result = cursor.fetchone()

            if not result:
                raise HTTPException(status_code=404, detail="OT no encontrada")

            return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting OT material: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if connection:
            connection.close()
