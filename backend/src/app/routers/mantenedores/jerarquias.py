"""
Router de Jerarquías - INVEB Cascade Service
CRUD para jerarquías con relaciones: Jerarquía 1 → 2 → 3
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from ...database import get_db_connection
from ..auth import get_current_user

router = APIRouter(prefix="/mantenedores/jerarquias", tags=["Jerarquías"])


# =============================================
# SCHEMAS - JERARQUÍA 1
# =============================================

class Jerarquia1ListItem(BaseModel):
    id: int
    descripcion: str
    active: int
    count_children: int = 0


class Jerarquia1ListResponse(BaseModel):
    items: List[Jerarquia1ListItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class Jerarquia1Detail(BaseModel):
    id: int
    descripcion: str
    active: int
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class Jerarquia1Create(BaseModel):
    descripcion: str


class Jerarquia1Update(BaseModel):
    descripcion: Optional[str] = None


# =============================================
# SCHEMAS - JERARQUÍA 2
# =============================================

class Jerarquia2ListItem(BaseModel):
    id: int
    descripcion: str
    hierarchy_id: int
    hierarchy_nombre: str
    active: int
    count_children: int = 0


class Jerarquia2ListResponse(BaseModel):
    items: List[Jerarquia2ListItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class Jerarquia2Detail(BaseModel):
    id: int
    descripcion: str
    hierarchy_id: int
    hierarchy_nombre: str
    active: int
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class Jerarquia2Create(BaseModel):
    descripcion: str
    hierarchy_id: int


class Jerarquia2Update(BaseModel):
    descripcion: Optional[str] = None
    hierarchy_id: Optional[int] = None


# =============================================
# SCHEMAS - JERARQUÍA 3
# =============================================

class Jerarquia3ListItem(BaseModel):
    id: int
    descripcion: str
    jerarquia_sap: Optional[str] = None
    subhierarchy_id: int
    subhierarchy_nombre: str
    hierarchy_id: int
    hierarchy_nombre: str
    active: int


class Jerarquia3ListResponse(BaseModel):
    items: List[Jerarquia3ListItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class Jerarquia3Detail(BaseModel):
    id: int
    descripcion: str
    jerarquia_sap: Optional[str] = None
    subhierarchy_id: int
    subhierarchy_nombre: str
    hierarchy_id: int
    hierarchy_nombre: str
    active: int
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class Jerarquia3Create(BaseModel):
    descripcion: str
    jerarquia_sap: Optional[str] = None
    subhierarchy_id: int


class Jerarquia3Update(BaseModel):
    descripcion: Optional[str] = None
    jerarquia_sap: Optional[str] = None
    subhierarchy_id: Optional[int] = None


class ParentOption(BaseModel):
    id: int
    nombre: str


# =============================================
# ENDPOINTS - JERARQUÍA 1
# =============================================

@router.get("/nivel1", response_model=Jerarquia1ListResponse)
async def list_jerarquia1(
    search: Optional[str] = Query(None),
    activo: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """Lista Jerarquías nivel 1"""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        base_query = """
            SELECT h.id, h.descripcion, h.active,
                   COUNT(DISTINCT sh.id) as count_children
            FROM hierarchies h
            LEFT JOIN subhierarchies sh ON sh.hierarchy_id = h.id
            WHERE 1=1
        """
        count_query = "SELECT COUNT(*) as total FROM hierarchies WHERE 1=1"
        params = []
        count_params = []

        if search:
            base_query += " AND h.descripcion LIKE %s"
            count_query += " AND descripcion LIKE %s"
            params.append(f"%{search}%")
            count_params.append(f"%{search}%")

        if activo is not None:
            base_query += " AND h.active = %s"
            count_query += " AND active = %s"
            params.append(activo)
            count_params.append(activo)

        # Total
        cursor.execute(count_query, count_params)
        total = cursor.fetchone()["total"]

        # Lista con paginación
        base_query += " GROUP BY h.id ORDER BY h.descripcion ASC"
        base_query += " LIMIT %s OFFSET %s"
        params.extend([page_size, (page - 1) * page_size])

        cursor.execute(base_query, params)
        rows = cursor.fetchall()

        items = [
            Jerarquia1ListItem(
                id=row["id"],
                descripcion=row["descripcion"],
                active=row["active"],
                count_children=row["count_children"]
            )
            for row in rows
        ]

        return Jerarquia1ListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=(total + page_size - 1) // page_size
        )

    finally:
        cursor.close()
        conn.close()


@router.get("/nivel1/{item_id}", response_model=Jerarquia1Detail)
async def get_jerarquia1(
    item_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Obtiene detalle de Jerarquía nivel 1"""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "SELECT id, descripcion, active, created_at, updated_at FROM hierarchies WHERE id = %s",
            [item_id]
        )
        row = cursor.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Jerarquía no encontrada")

        return Jerarquia1Detail(
            id=row["id"],
            descripcion=row["descripcion"],
            active=row["active"],
            created_at=str(row["created_at"]) if row["created_at"] else None,
            updated_at=str(row["updated_at"]) if row["updated_at"] else None
        )

    finally:
        cursor.close()
        conn.close()


@router.post("/nivel1", response_model=Jerarquia1Detail)
async def create_jerarquia1(
    item: Jerarquia1Create,
    current_user: dict = Depends(get_current_user)
):
    """Crea Jerarquía nivel 1"""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        now = datetime.now()
        cursor.execute(
            "INSERT INTO hierarchies (descripcion, active, created_at, updated_at) VALUES (%s, 1, %s, %s)",
            [item.descripcion, now, now]
        )
        conn.commit()
        new_id = cursor.lastrowid

        return Jerarquia1Detail(
            id=new_id,
            descripcion=item.descripcion,
            active=1,
            created_at=str(now),
            updated_at=str(now)
        )

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()


@router.put("/nivel1/{item_id}", response_model=Jerarquia1Detail)
async def update_jerarquia1(
    item_id: int,
    item: Jerarquia1Update,
    current_user: dict = Depends(get_current_user)
):
    """Actualiza Jerarquía nivel 1"""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT id FROM hierarchies WHERE id = %s", [item_id])
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Jerarquía no encontrada")

        updates = []
        params = []

        if item.descripcion is not None:
            updates.append("descripcion = %s")
            params.append(item.descripcion)

        if not updates:
            raise HTTPException(status_code=400, detail="No hay datos para actualizar")

        updates.append("updated_at = %s")
        params.append(datetime.now())
        params.append(item_id)

        cursor.execute(
            f"UPDATE hierarchies SET {', '.join(updates)} WHERE id = %s",
            params
        )
        conn.commit()

        return await get_jerarquia1(item_id, current_user)

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()


@router.put("/nivel1/{item_id}/activate")
async def activate_jerarquia1(item_id: int, current_user: dict = Depends(get_current_user)):
    """Activa Jerarquía nivel 1"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE hierarchies SET active = 1, updated_at = %s WHERE id = %s", [datetime.now(), item_id])
        conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Jerarquía no encontrada")
        return {"message": "Jerarquía activada"}
    finally:
        cursor.close()
        conn.close()


@router.put("/nivel1/{item_id}/deactivate")
async def deactivate_jerarquia1(item_id: int, current_user: dict = Depends(get_current_user)):
    """Desactiva Jerarquía nivel 1"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE hierarchies SET active = 0, updated_at = %s WHERE id = %s", [datetime.now(), item_id])
        conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Jerarquía no encontrada")
        return {"message": "Jerarquía desactivada"}
    finally:
        cursor.close()
        conn.close()


# =============================================
# ENDPOINTS - JERARQUÍA 2
# =============================================

@router.get("/nivel2/parents", response_model=List[ParentOption])
async def get_jerarquia2_parents(current_user: dict = Depends(get_current_user)):
    """Obtiene lista de Jerarquías nivel 1 para select de padres"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id, descripcion FROM hierarchies WHERE active = 1 ORDER BY descripcion")
        rows = cursor.fetchall()
        return [ParentOption(id=row["id"], nombre=row["descripcion"]) for row in rows]
    finally:
        cursor.close()
        conn.close()


@router.get("/nivel2", response_model=Jerarquia2ListResponse)
async def list_jerarquia2(
    search: Optional[str] = Query(None),
    activo: Optional[int] = Query(None),
    hierarchy_id: Optional[int] = Query(None, description="Filtrar por Jerarquía 1"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """Lista Jerarquías nivel 2"""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        base_query = """
            SELECT sh.id, sh.descripcion, sh.hierarchy_id, sh.active,
                   h.descripcion as hierarchy_nombre,
                   COUNT(DISTINCT ssh.id) as count_children
            FROM subhierarchies sh
            LEFT JOIN hierarchies h ON h.id = sh.hierarchy_id
            LEFT JOIN subsubhierarchies ssh ON ssh.subhierarchy_id = sh.id
            WHERE 1=1
        """
        count_query = "SELECT COUNT(*) as total FROM subhierarchies WHERE 1=1"
        params = []
        count_params = []

        if search:
            base_query += " AND sh.descripcion LIKE %s"
            count_query += " AND descripcion LIKE %s"
            params.append(f"%{search}%")
            count_params.append(f"%{search}%")

        if activo is not None:
            base_query += " AND sh.active = %s"
            count_query += " AND active = %s"
            params.append(activo)
            count_params.append(activo)

        if hierarchy_id is not None:
            base_query += " AND sh.hierarchy_id = %s"
            count_query += " AND hierarchy_id = %s"
            params.append(hierarchy_id)
            count_params.append(hierarchy_id)

        cursor.execute(count_query, count_params)
        total = cursor.fetchone()["total"]

        base_query += " GROUP BY sh.id ORDER BY sh.descripcion ASC"
        base_query += " LIMIT %s OFFSET %s"
        params.extend([page_size, (page - 1) * page_size])

        cursor.execute(base_query, params)
        rows = cursor.fetchall()

        items = [
            Jerarquia2ListItem(
                id=row["id"],
                descripcion=row["descripcion"],
                hierarchy_id=row["hierarchy_id"],
                hierarchy_nombre=row["hierarchy_nombre"] or "",
                active=row["active"],
                count_children=row["count_children"]
            )
            for row in rows
        ]

        return Jerarquia2ListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=(total + page_size - 1) // page_size
        )

    finally:
        cursor.close()
        conn.close()


@router.get("/nivel2/{item_id}", response_model=Jerarquia2Detail)
async def get_jerarquia2(item_id: int, current_user: dict = Depends(get_current_user)):
    """Obtiene detalle de Jerarquía nivel 2"""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT sh.id, sh.descripcion, sh.hierarchy_id, sh.active,
                   sh.created_at, sh.updated_at, h.descripcion as hierarchy_nombre
            FROM subhierarchies sh
            LEFT JOIN hierarchies h ON h.id = sh.hierarchy_id
            WHERE sh.id = %s
        """, [item_id])
        row = cursor.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Jerarquía no encontrada")

        return Jerarquia2Detail(
            id=row["id"],
            descripcion=row["descripcion"],
            hierarchy_id=row["hierarchy_id"],
            hierarchy_nombre=row["hierarchy_nombre"] or "",
            active=row["active"],
            created_at=str(row["created_at"]) if row["created_at"] else None,
            updated_at=str(row["updated_at"]) if row["updated_at"] else None
        )

    finally:
        cursor.close()
        conn.close()


@router.post("/nivel2", response_model=Jerarquia2Detail)
async def create_jerarquia2(item: Jerarquia2Create, current_user: dict = Depends(get_current_user)):
    """Crea Jerarquía nivel 2"""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        now = datetime.now()
        cursor.execute(
            "INSERT INTO subhierarchies (descripcion, hierarchy_id, active, created_at, updated_at) VALUES (%s, %s, 1, %s, %s)",
            [item.descripcion, item.hierarchy_id, now, now]
        )
        conn.commit()
        return await get_jerarquia2(cursor.lastrowid, current_user)

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()


@router.put("/nivel2/{item_id}", response_model=Jerarquia2Detail)
async def update_jerarquia2(item_id: int, item: Jerarquia2Update, current_user: dict = Depends(get_current_user)):
    """Actualiza Jerarquía nivel 2"""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT id FROM subhierarchies WHERE id = %s", [item_id])
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Jerarquía no encontrada")

        updates = []
        params = []

        if item.descripcion is not None:
            updates.append("descripcion = %s")
            params.append(item.descripcion)
        if item.hierarchy_id is not None:
            updates.append("hierarchy_id = %s")
            params.append(item.hierarchy_id)

        if not updates:
            raise HTTPException(status_code=400, detail="No hay datos para actualizar")

        updates.append("updated_at = %s")
        params.append(datetime.now())
        params.append(item_id)

        cursor.execute(f"UPDATE subhierarchies SET {', '.join(updates)} WHERE id = %s", params)
        conn.commit()

        return await get_jerarquia2(item_id, current_user)

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()


@router.put("/nivel2/{item_id}/activate")
async def activate_jerarquia2(item_id: int, current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE subhierarchies SET active = 1, updated_at = %s WHERE id = %s", [datetime.now(), item_id])
        conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Jerarquía no encontrada")
        return {"message": "Jerarquía activada"}
    finally:
        cursor.close()
        conn.close()


@router.put("/nivel2/{item_id}/deactivate")
async def deactivate_jerarquia2(item_id: int, current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE subhierarchies SET active = 0, updated_at = %s WHERE id = %s", [datetime.now(), item_id])
        conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Jerarquía no encontrada")
        return {"message": "Jerarquía desactivada"}
    finally:
        cursor.close()
        conn.close()


# =============================================
# ENDPOINTS - JERARQUÍA 3
# =============================================

@router.get("/nivel3/parents", response_model=List[ParentOption])
async def get_jerarquia3_parents(
    hierarchy_id: Optional[int] = Query(None, description="Filtrar por Jerarquía 1"),
    current_user: dict = Depends(get_current_user)
):
    """Obtiene lista de Jerarquías nivel 2 para select de padres"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        query = "SELECT id, descripcion FROM subhierarchies WHERE active = 1"
        params = []
        if hierarchy_id:
            query += " AND hierarchy_id = %s"
            params.append(hierarchy_id)
        query += " ORDER BY descripcion"

        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [ParentOption(id=row["id"], nombre=row["descripcion"]) for row in rows]
    finally:
        cursor.close()
        conn.close()


@router.get("/nivel3", response_model=Jerarquia3ListResponse)
async def list_jerarquia3(
    search: Optional[str] = Query(None),
    activo: Optional[int] = Query(None),
    subhierarchy_id: Optional[int] = Query(None, description="Filtrar por Jerarquía 2"),
    hierarchy_id: Optional[int] = Query(None, description="Filtrar por Jerarquía 1"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """Lista Jerarquías nivel 3"""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        base_query = """
            SELECT ssh.id, ssh.descripcion, ssh.jerarquia_sap, ssh.subhierarchy_id, ssh.active,
                   sh.descripcion as subhierarchy_nombre, sh.hierarchy_id,
                   h.descripcion as hierarchy_nombre
            FROM subsubhierarchies ssh
            LEFT JOIN subhierarchies sh ON sh.id = ssh.subhierarchy_id
            LEFT JOIN hierarchies h ON h.id = sh.hierarchy_id
            WHERE 1=1
        """
        count_query = """
            SELECT COUNT(*) as total
            FROM subsubhierarchies ssh
            LEFT JOIN subhierarchies sh ON sh.id = ssh.subhierarchy_id
            WHERE 1=1
        """
        params = []
        count_params = []

        if search:
            base_query += " AND (ssh.descripcion LIKE %s OR ssh.jerarquia_sap LIKE %s)"
            count_query += " AND (ssh.descripcion LIKE %s OR ssh.jerarquia_sap LIKE %s)"
            params.extend([f"%{search}%", f"%{search}%"])
            count_params.extend([f"%{search}%", f"%{search}%"])

        if activo is not None:
            base_query += " AND ssh.active = %s"
            count_query += " AND ssh.active = %s"
            params.append(activo)
            count_params.append(activo)

        if subhierarchy_id is not None:
            base_query += " AND ssh.subhierarchy_id = %s"
            count_query += " AND ssh.subhierarchy_id = %s"
            params.append(subhierarchy_id)
            count_params.append(subhierarchy_id)

        if hierarchy_id is not None:
            base_query += " AND sh.hierarchy_id = %s"
            count_query += " AND sh.hierarchy_id = %s"
            params.append(hierarchy_id)
            count_params.append(hierarchy_id)

        cursor.execute(count_query, count_params)
        total = cursor.fetchone()["total"]

        base_query += " ORDER BY ssh.descripcion ASC LIMIT %s OFFSET %s"
        params.extend([page_size, (page - 1) * page_size])

        cursor.execute(base_query, params)
        rows = cursor.fetchall()

        items = [
            Jerarquia3ListItem(
                id=row["id"],
                descripcion=row["descripcion"],
                jerarquia_sap=row["jerarquia_sap"],
                subhierarchy_id=row["subhierarchy_id"],
                subhierarchy_nombre=row["subhierarchy_nombre"] or "",
                hierarchy_id=row["hierarchy_id"] or 0,
                hierarchy_nombre=row["hierarchy_nombre"] or "",
                active=row["active"]
            )
            for row in rows
        ]

        return Jerarquia3ListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=(total + page_size - 1) // page_size
        )

    finally:
        cursor.close()
        conn.close()


@router.get("/nivel3/{item_id}", response_model=Jerarquia3Detail)
async def get_jerarquia3(item_id: int, current_user: dict = Depends(get_current_user)):
    """Obtiene detalle de Jerarquía nivel 3"""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT ssh.id, ssh.descripcion, ssh.jerarquia_sap, ssh.subhierarchy_id, ssh.active,
                   ssh.created_at, ssh.updated_at,
                   sh.descripcion as subhierarchy_nombre, sh.hierarchy_id,
                   h.descripcion as hierarchy_nombre
            FROM subsubhierarchies ssh
            LEFT JOIN subhierarchies sh ON sh.id = ssh.subhierarchy_id
            LEFT JOIN hierarchies h ON h.id = sh.hierarchy_id
            WHERE ssh.id = %s
        """, [item_id])
        row = cursor.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Jerarquía no encontrada")

        return Jerarquia3Detail(
            id=row["id"],
            descripcion=row["descripcion"],
            jerarquia_sap=row["jerarquia_sap"],
            subhierarchy_id=row["subhierarchy_id"],
            subhierarchy_nombre=row["subhierarchy_nombre"] or "",
            hierarchy_id=row["hierarchy_id"] or 0,
            hierarchy_nombre=row["hierarchy_nombre"] or "",
            active=row["active"],
            created_at=str(row["created_at"]) if row["created_at"] else None,
            updated_at=str(row["updated_at"]) if row["updated_at"] else None
        )

    finally:
        cursor.close()
        conn.close()


@router.post("/nivel3", response_model=Jerarquia3Detail)
async def create_jerarquia3(item: Jerarquia3Create, current_user: dict = Depends(get_current_user)):
    """Crea Jerarquía nivel 3"""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        now = datetime.now()
        cursor.execute(
            "INSERT INTO subsubhierarchies (descripcion, jerarquia_sap, subhierarchy_id, active, created_at, updated_at) VALUES (%s, %s, %s, 1, %s, %s)",
            [item.descripcion, item.jerarquia_sap, item.subhierarchy_id, now, now]
        )
        conn.commit()
        return await get_jerarquia3(cursor.lastrowid, current_user)

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()


@router.put("/nivel3/{item_id}", response_model=Jerarquia3Detail)
async def update_jerarquia3(item_id: int, item: Jerarquia3Update, current_user: dict = Depends(get_current_user)):
    """Actualiza Jerarquía nivel 3"""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT id FROM subsubhierarchies WHERE id = %s", [item_id])
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Jerarquía no encontrada")

        updates = []
        params = []

        if item.descripcion is not None:
            updates.append("descripcion = %s")
            params.append(item.descripcion)
        if item.jerarquia_sap is not None:
            updates.append("jerarquia_sap = %s")
            params.append(item.jerarquia_sap)
        if item.subhierarchy_id is not None:
            updates.append("subhierarchy_id = %s")
            params.append(item.subhierarchy_id)

        if not updates:
            raise HTTPException(status_code=400, detail="No hay datos para actualizar")

        updates.append("updated_at = %s")
        params.append(datetime.now())
        params.append(item_id)

        cursor.execute(f"UPDATE subsubhierarchies SET {', '.join(updates)} WHERE id = %s", params)
        conn.commit()

        return await get_jerarquia3(item_id, current_user)

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()


@router.put("/nivel3/{item_id}/activate")
async def activate_jerarquia3(item_id: int, current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE subsubhierarchies SET active = 1, updated_at = %s WHERE id = %s", [datetime.now(), item_id])
        conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Jerarquía no encontrada")
        return {"message": "Jerarquía activada"}
    finally:
        cursor.close()
        conn.close()


@router.put("/nivel3/{item_id}/deactivate")
async def deactivate_jerarquia3(item_id: int, current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE subsubhierarchies SET active = 0, updated_at = %s WHERE id = %s", [datetime.now(), item_id])
        conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Jerarquía no encontrada")
        return {"message": "Jerarquía desactivada"}
    finally:
        cursor.close()
        conn.close()
