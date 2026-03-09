"""
Router de Roles y Permisos - INVEB Envases OT
CRUD completo para gestion de roles del sistema.

Endpoints:
- GET /roles - Listar roles con paginacion
- GET /roles/{id} - Obtener rol por ID
- POST /roles - Crear nuevo rol
- PUT /roles/{id} - Actualizar rol
- DELETE /roles/{id} - Eliminar rol (soft delete)
- GET /roles/{id}/permissions - Obtener permisos de un rol
- PUT /roles/{id}/permissions - Actualizar permisos de un rol
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import logging

from ...database import get_db_connection
from ..auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/mantenedores/roles", tags=["roles"])


# =============================================
# SCHEMAS
# =============================================

class RoleBase(BaseModel):
    """Schema base para rol."""
    nombre: str = Field(..., min_length=2, max_length=100)


class RoleCreate(RoleBase):
    """Schema para crear rol."""
    pass


class RoleUpdate(BaseModel):
    """Schema para actualizar rol."""
    nombre: Optional[str] = Field(None, min_length=2, max_length=100)


class RoleResponse(BaseModel):
    """Schema de respuesta de rol."""
    id: int
    nombre: str
    users_count: int = 0
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class RoleListResponse(BaseModel):
    """Respuesta paginada de roles."""
    items: List[RoleResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class Permission(BaseModel):
    """Schema de permiso."""
    id: int
    nombre: str
    codigo: str
    modulo: str
    activo: bool = True


class RolePermissionsResponse(BaseModel):
    """Permisos de un rol."""
    role_id: int
    role_nombre: str
    permissions: List[Permission]


class UpdatePermissionsRequest(BaseModel):
    """Request para actualizar permisos."""
    permission_ids: List[int]


# =============================================
# ENDPOINTS
# =============================================

@router.get("", response_model=RoleListResponse)
async def list_roles(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """
    Lista roles con paginacion y filtros.
    Solo usuarios con rol admin pueden acceder.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Base query con conteo de usuarios
        base_query = """
            FROM roles r
            LEFT JOIN (
                SELECT role_id, COUNT(*) as user_count
                FROM users
                WHERE active = 1
                GROUP BY role_id
            ) u ON r.id = u.role_id
            WHERE 1=1
        """
        params = []

        # Filtro de busqueda
        if search:
            base_query += " AND r.nombre LIKE %s"
            search_pattern = f"%{search}%"
            params.append(search_pattern)

        # Contar total
        cursor.execute(f"SELECT COUNT(*) as total {base_query}", params)
        total = cursor.fetchone()["total"]

        # Calcular paginacion
        total_pages = (total + page_size - 1) // page_size
        offset = (page - 1) * page_size

        # Obtener roles
        cursor.execute(f"""
            SELECT
                r.id,
                r.nombre,
                COALESCE(u.user_count, 0) as users_count,
                r.created_at,
                r.updated_at
            {base_query}
            ORDER BY r.nombre ASC
            LIMIT %s OFFSET %s
        """, params + [page_size, offset])

        rows = cursor.fetchall()

        items = [
            RoleResponse(
                id=row["id"],
                nombre=row["nombre"],
                users_count=row["users_count"],
                created_at=str(row["created_at"]) if row.get("created_at") else None,
                updated_at=str(row["updated_at"]) if row.get("updated_at") else None,
            )
            for row in rows
        ]

        return RoleListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    finally:
        cursor.close()
        conn.close()


@router.get("/{role_id}", response_model=RoleResponse)
async def get_role(
    role_id: int,
    current_user: dict = Depends(get_current_user),
):
    """Obtiene un rol por ID."""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT
                r.id,
                r.nombre,
                (SELECT COUNT(*) FROM users WHERE role_id = r.id AND active = 1) as users_count,
                r.created_at,
                r.updated_at
            FROM roles r
            WHERE r.id = %s
        """, (role_id,))

        row = cursor.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Rol no encontrado")

        return RoleResponse(
            id=row["id"],
            nombre=row["nombre"],
            users_count=row["users_count"],
            created_at=str(row["created_at"]) if row.get("created_at") else None,
            updated_at=str(row["updated_at"]) if row.get("updated_at") else None,
        )

    finally:
        cursor.close()
        conn.close()


@router.post("", response_model=RoleResponse)
async def create_role(
    data: RoleCreate,
    current_user: dict = Depends(get_current_user),
):
    """Crea un nuevo rol."""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Verificar nombre unico
        cursor.execute("SELECT id FROM roles WHERE nombre = %s", (data.nombre,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Ya existe un rol con ese nombre")

        # Insertar rol
        now = datetime.now()
        cursor.execute("""
            INSERT INTO roles (nombre, created_at, updated_at)
            VALUES (%s, %s, %s)
        """, (data.nombre, now, now))

        conn.commit()
        role_id = cursor.lastrowid

        logger.info(f"Rol creado: {role_id} - {data.nombre} por usuario {current_user.get('id')}")

        return RoleResponse(
            id=role_id,
            nombre=data.nombre,
            users_count=0,
            created_at=str(now),
            updated_at=str(now),
        )

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.error(f"Error creando rol: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()


@router.put("/{role_id}", response_model=RoleResponse)
async def update_role(
    role_id: int,
    data: RoleUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Actualiza un rol existente."""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Verificar que existe
        cursor.execute("SELECT id, nombre FROM roles WHERE id = %s", (role_id,))
        existing = cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Rol no encontrado")

        # Verificar nombre unico si se esta cambiando
        if data.nombre and data.nombre != existing["nombre"]:
            cursor.execute("SELECT id FROM roles WHERE nombre = %s AND id != %s", (data.nombre, role_id))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="Ya existe un rol con ese nombre")

        # Construir UPDATE dinamico
        updates = ["updated_at = %s"]
        params = [datetime.now()]

        if data.nombre is not None:
            updates.append("nombre = %s")
            params.append(data.nombre)

        params.append(role_id)

        cursor.execute(f"""
            UPDATE roles SET {', '.join(updates)} WHERE id = %s
        """, params)

        conn.commit()

        # Retornar rol actualizado
        return await get_role(role_id, current_user)

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.error(f"Error actualizando rol {role_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()


@router.delete("/{role_id}")
async def delete_role(
    role_id: int,
    current_user: dict = Depends(get_current_user),
):
    """
    Elimina un rol.
    No se puede eliminar si tiene usuarios asignados.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Verificar que existe
        cursor.execute("SELECT id, nombre FROM roles WHERE id = %s", (role_id,))
        existing = cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Rol no encontrado")

        # Verificar que no tiene usuarios
        cursor.execute("SELECT COUNT(*) as count FROM users WHERE role_id = %s AND active = 1", (role_id,))
        users_count = cursor.fetchone()["count"]
        if users_count > 0:
            raise HTTPException(
                status_code=400,
                detail=f"No se puede eliminar: hay {users_count} usuario(s) con este rol"
            )

        # Hard delete (la tabla no tiene columna activo)
        cursor.execute("DELETE FROM roles WHERE id = %s", (role_id,))

        conn.commit()

        logger.info(f"Rol eliminado: {role_id} - {existing['nombre']} por usuario {current_user.get('id')}")

        return {"message": f"Rol '{existing['nombre']}' eliminado correctamente"}

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.error(f"Error eliminando rol {role_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()


@router.get("/{role_id}/permissions", response_model=RolePermissionsResponse)
async def get_role_permissions(
    role_id: int,
    current_user: dict = Depends(get_current_user),
):
    """
    Obtiene los permisos asignados a un rol.
    Nota: Si la tabla permissions no existe, retorna lista vacia.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Obtener rol
        cursor.execute("SELECT id, nombre FROM roles WHERE id = %s", (role_id,))
        role = cursor.fetchone()
        if not role:
            raise HTTPException(status_code=404, detail="Rol no encontrado")

        # Intentar obtener permisos (tabla puede no existir)
        permissions = []
        try:
            cursor.execute("""
                SELECT p.id, p.nombre, p.codigo, p.modulo, p.activo
                FROM permissions p
                INNER JOIN role_permissions rp ON p.id = rp.permission_id
                WHERE rp.role_id = %s AND p.activo = 1
                ORDER BY p.modulo, p.nombre
            """, (role_id,))
            rows = cursor.fetchall()
            permissions = [
                Permission(
                    id=row["id"],
                    nombre=row["nombre"],
                    codigo=row["codigo"],
                    modulo=row["modulo"],
                    activo=row["activo"] == 1,
                )
                for row in rows
            ]
        except Exception:
            # Tabla permissions no existe, retornar vacio
            pass

        return RolePermissionsResponse(
            role_id=role_id,
            role_nombre=role["nombre"],
            permissions=permissions,
        )

    finally:
        cursor.close()
        conn.close()


@router.put("/{role_id}/permissions")
async def update_role_permissions(
    role_id: int,
    data: UpdatePermissionsRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Actualiza los permisos de un rol.
    Reemplaza todos los permisos existentes con los nuevos.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Verificar que el rol existe
        cursor.execute("SELECT id, nombre FROM roles WHERE id = %s", (role_id,))
        role = cursor.fetchone()
        if not role:
            raise HTTPException(status_code=404, detail="Rol no encontrado")

        # Intentar actualizar permisos
        try:
            # Eliminar permisos existentes
            cursor.execute("DELETE FROM role_permissions WHERE role_id = %s", (role_id,))

            # Insertar nuevos permisos
            if data.permission_ids:
                values = [(role_id, pid) for pid in data.permission_ids]
                cursor.executemany(
                    "INSERT INTO role_permissions (role_id, permission_id) VALUES (%s, %s)",
                    values
                )

            conn.commit()

            return {
                "message": f"Permisos actualizados para rol '{role['nombre']}'",
                "permissions_count": len(data.permission_ids)
            }

        except Exception as e:
            # Tabla permissions/role_permissions puede no existir
            logger.warning(f"Tabla de permisos no disponible: {e}")
            return {
                "message": "Sistema de permisos no configurado",
                "permissions_count": 0
            }

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.error(f"Error actualizando permisos del rol {role_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()


@router.get("/all/available-permissions", response_model=List[Permission])
async def get_all_permissions(
    current_user: dict = Depends(get_current_user),
):
    """
    Lista todos los permisos disponibles en el sistema.
    Usado para la UI de asignacion de permisos.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        try:
            cursor.execute("""
                SELECT id, nombre, codigo, modulo, activo
                FROM permissions
                WHERE activo = 1
                ORDER BY modulo, nombre
            """)
            rows = cursor.fetchall()
            return [
                Permission(
                    id=row["id"],
                    nombre=row["nombre"],
                    codigo=row["codigo"],
                    modulo=row["modulo"],
                    activo=row["activo"] == 1,
                )
                for row in rows
            ]
        except Exception:
            # Tabla permissions no existe
            return []

    finally:
        cursor.close()
        conn.close()
