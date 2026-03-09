"""
Router de Uploads - Subida de archivos de diseno.
Gestiona archivos relacionados a OTs: planos, bocetos, fichas tecnicas, etc.

Funcionalidades:
- Subir archivos de diseno a OTs
- Listar archivos de una OT
- Descargar archivos
- Eliminar archivos
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import os
import uuid
import logging
import shutil

from ..database import get_mysql_connection

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/uploads", tags=["uploads"])

# Configuracion
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/tmp/uploads")
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB
ALLOWED_EXTENSIONS = {
    "pdf", "doc", "docx", "xls", "xlsx",
    "png", "jpg", "jpeg", "gif",
    "dwg", "dxf",  # CAD files
    "ai", "eps", "psd"  # Design files
}


# =============================================
# SCHEMAS
# =============================================

class FileResponse(BaseModel):
    """Respuesta de archivo."""
    id: int
    url: str
    filename: str
    peso: int
    tipo: str
    created_at: Optional[str] = None


class UploadResponse(BaseModel):
    """Respuesta de subida."""
    success: bool
    message: str
    file_id: Optional[int] = None
    url: Optional[str] = None


class OTFilesResponse(BaseModel):
    """Archivos de diseno de una OT."""
    ot_id: int
    plano_actual: Optional[str] = None
    boceto_actual: Optional[str] = None
    ficha_tecnica: Optional[str] = None
    correo_cliente: Optional[str] = None
    speed_file: Optional[str] = None
    otro_file: Optional[str] = None
    oc_file: Optional[str] = None
    licitacion_file: Optional[str] = None
    vb_muestra_file: Optional[str] = None
    vb_boceto_file: Optional[str] = None


# =============================================
# FUNCIONES AUXILIARES
# =============================================

def get_extension(filename: str) -> str:
    """Obtiene la extension de un archivo."""
    return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""


def generate_unique_filename(original_filename: str) -> str:
    """Genera un nombre de archivo unico."""
    ext = get_extension(original_filename)
    unique_id = uuid.uuid4().hex[:8]
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    return f"{timestamp}_{unique_id}.{ext}"


def human_filesize(size: int) -> str:
    """Convierte tamano a formato legible."""
    for unit in ["B", "KB", "MB", "GB"]:
        if size < 1024:
            return f"{size:.1f} {unit}"
        size /= 1024
    return f"{size:.1f} TB"


def ensure_upload_dir():
    """Asegura que el directorio de uploads exista."""
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR, exist_ok=True)


# =============================================
# ENDPOINTS
# =============================================

@router.post("/ot/{ot_id}/file")
async def upload_ot_file(
    ot_id: int,
    file: UploadFile = File(...),
    file_type: str = Form(...),  # plano, boceto, ficha_tecnica, correo_cliente, speed, otro, oc, licitacion, vb_muestra, vb_boceto
):
    """
    Sube un archivo de diseno para una OT.

    Tipos de archivo:
    - plano: Plano/diseno actual
    - boceto: Boceto actual
    - ficha_tecnica: Ficha tecnica
    - correo_cliente: Archivo de correo del cliente
    - speed: Archivo de velocidad/produccion
    - otro: Otro archivo de diseno
    - oc: Orden de compra
    - licitacion: Archivo de licitacion
    - vb_muestra: VoBo de muestra
    - vb_boceto: VoBo de boceto
    """
    connection = None
    try:
        # Validar tipo de archivo
        valid_types = [
            "plano", "boceto", "ficha_tecnica", "correo_cliente",
            "speed", "otro", "oc", "licitacion", "vb_muestra", "vb_boceto"
        ]
        if file_type not in valid_types:
            raise HTTPException(
                status_code=400,
                detail=f"Tipo de archivo invalido. Use: {', '.join(valid_types)}"
            )

        # Validar extension
        ext = get_extension(file.filename)
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Extension no permitida. Permitidas: {', '.join(ALLOWED_EXTENSIONS)}"
            )

        # Validar tamano
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"Archivo muy grande. Maximo: {MAX_FILE_SIZE // (1024*1024)} MB"
            )

        connection = get_mysql_connection()
        with connection.cursor() as cursor:
            # Verificar que la OT existe
            cursor.execute("SELECT id FROM work_orders WHERE id = %s", (ot_id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="OT no encontrada")

            # Generar nombre unico y guardar archivo
            ensure_upload_dir()
            unique_filename = generate_unique_filename(file.filename)
            file_path = os.path.join(UPLOAD_DIR, f"ot_{ot_id}", unique_filename)

            # Crear directorio de la OT si no existe
            ot_dir = os.path.join(UPLOAD_DIR, f"ot_{ot_id}")
            os.makedirs(ot_dir, exist_ok=True)

            # Guardar archivo
            with open(file_path, "wb") as f:
                f.write(content)

            # Mapear tipo a campo de la tabla
            field_map = {
                "plano": "ant_des_plano_actual_file",
                "boceto": "ant_des_boceto_actual_file",
                "ficha_tecnica": "ficha_tecnica_file",
                "correo_cliente": "ant_des_correo_cliente_file",
                "speed": "ant_des_speed_file",
                "otro": "ant_des_otro_file",
                "oc": "oc_file",
                "licitacion": "licitacion_file",
                "vb_muestra": "ant_des_vb_muestra_file",
                "vb_boceto": "ant_des_vb_boce_file"
            }

            field_name = field_map.get(file_type)
            relative_url = f"/uploads/ot_{ot_id}/{unique_filename}"

            # Actualizar OT con la URL del archivo
            cursor.execute(f"""
                UPDATE work_orders
                SET {field_name} = %s, updated_at = %s
                WHERE id = %s
            """, (relative_url, datetime.now(), ot_id))
            connection.commit()

            return UploadResponse(
                success=True,
                message=f"Archivo {file_type} subido exitosamente",
                url=relative_url
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading file: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if connection:
            connection.close()


@router.get("/ot/{ot_id}/files", response_model=OTFilesResponse)
async def get_ot_files(ot_id: int):
    """
    Obtiene todos los archivos de diseno de una OT.
    """
    connection = None
    try:
        connection = get_mysql_connection()
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT
                    id,
                    ant_des_plano_actual_file AS plano_actual,
                    ant_des_boceto_actual_file AS boceto_actual,
                    ficha_tecnica_file AS ficha_tecnica,
                    ant_des_correo_cliente_file AS correo_cliente,
                    ant_des_speed_file AS speed_file,
                    ant_des_otro_file AS otro_file,
                    oc_file,
                    licitacion_file,
                    ant_des_vb_muestra_file AS vb_muestra_file,
                    ant_des_vb_boce_file AS vb_boceto_file
                FROM work_orders
                WHERE id = %s
            """, (ot_id,))
            ot = cursor.fetchone()

            if not ot:
                raise HTTPException(status_code=404, detail="OT no encontrada")

            return OTFilesResponse(
                ot_id=ot_id,
                plano_actual=ot.get("plano_actual"),
                boceto_actual=ot.get("boceto_actual"),
                ficha_tecnica=ot.get("ficha_tecnica"),
                correo_cliente=ot.get("correo_cliente"),
                speed_file=ot.get("speed_file"),
                otro_file=ot.get("otro_file"),
                oc_file=ot.get("oc_file"),
                licitacion_file=ot.get("licitacion_file"),
                vb_muestra_file=ot.get("vb_muestra_file"),
                vb_boceto_file=ot.get("vb_boceto_file")
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting OT files: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if connection:
            connection.close()


@router.delete("/ot/{ot_id}/file/{file_type}")
async def delete_ot_file(ot_id: int, file_type: str):
    """
    Elimina un archivo de diseno de una OT.
    """
    connection = None
    try:
        field_map = {
            "plano": "ant_des_plano_actual_file",
            "boceto": "ant_des_boceto_actual_file",
            "ficha_tecnica": "ficha_tecnica_file",
            "correo_cliente": "ant_des_correo_cliente_file",
            "speed": "ant_des_speed_file",
            "otro": "ant_des_otro_file",
            "oc": "oc_file",
            "licitacion": "licitacion_file",
            "vb_muestra": "ant_des_vb_muestra_file",
            "vb_boceto": "ant_des_vb_boce_file"
        }

        if file_type not in field_map:
            raise HTTPException(status_code=400, detail="Tipo de archivo invalido")

        connection = get_mysql_connection()
        with connection.cursor() as cursor:
            # Obtener URL actual
            field_name = field_map[file_type]
            cursor.execute(f"""
                SELECT {field_name} AS file_url FROM work_orders WHERE id = %s
            """, (ot_id,))
            result = cursor.fetchone()

            if not result:
                raise HTTPException(status_code=404, detail="OT no encontrada")

            file_url = result.get("file_url")
            if file_url:
                # Eliminar archivo fisico
                file_path = os.path.join(UPLOAD_DIR, file_url.lstrip("/uploads/"))
                if os.path.exists(file_path):
                    os.remove(file_path)

            # Limpiar campo en base de datos
            cursor.execute(f"""
                UPDATE work_orders SET {field_name} = NULL, updated_at = %s WHERE id = %s
            """, (datetime.now(), ot_id))
            connection.commit()

            return {"message": f"Archivo {file_type} eliminado"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting file: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if connection:
            connection.close()


@router.post("/management/{management_id}/file")
async def upload_management_file(
    management_id: int,
    file: UploadFile = File(...)
):
    """
    Sube un archivo relacionado a un registro de gestion (management).
    Usado para adjuntar documentos a gestiones de OT.
    """
    connection = None
    try:
        ext = get_extension(file.filename)
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Extension no permitida"
            )

        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"Archivo muy grande"
            )

        connection = get_mysql_connection()
        with connection.cursor() as cursor:
            # Verificar que la gestion existe
            cursor.execute("SELECT id FROM managements WHERE id = %s", (management_id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Gestion no encontrada")

            # Guardar archivo
            ensure_upload_dir()
            unique_filename = generate_unique_filename(file.filename)
            file_dir = os.path.join(UPLOAD_DIR, "managements", str(management_id))
            os.makedirs(file_dir, exist_ok=True)
            file_path = os.path.join(file_dir, unique_filename)

            with open(file_path, "wb") as f:
                f.write(content)

            relative_url = f"/uploads/managements/{management_id}/{unique_filename}"

            # Registrar en tabla files
            cursor.execute("""
                INSERT INTO files (url, peso, unidad, tipo, management_id, created_at)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                relative_url,
                len(content),
                "bytes",
                ext,
                management_id,
                datetime.now()
            ))
            connection.commit()

            file_id = cursor.lastrowid

            return UploadResponse(
                success=True,
                message="Archivo subido exitosamente",
                file_id=file_id,
                url=relative_url
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading management file: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if connection:
            connection.close()


@router.get("/management/{management_id}/files")
async def get_management_files(management_id: int):
    """
    Lista archivos de un registro de gestion.
    """
    connection = None
    try:
        connection = get_mysql_connection()
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT id, url, peso, tipo, created_at
                FROM files
                WHERE management_id = %s
                ORDER BY created_at DESC
            """, (management_id,))
            files = cursor.fetchall()

            return [
                {
                    "id": f["id"],
                    "url": f["url"],
                    "filename": os.path.basename(f["url"]) if f["url"] else None,
                    "peso": f["peso"],
                    "peso_readable": human_filesize(f["peso"]) if f["peso"] else None,
                    "tipo": f["tipo"],
                    "created_at": str(f["created_at"]) if f["created_at"] else None
                }
                for f in files
            ]

    except Exception as e:
        logger.error(f"Error getting management files: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if connection:
            connection.close()


@router.delete("/file/{file_id}")
async def delete_file(file_id: int):
    """
    Elimina un archivo por ID.
    """
    connection = None
    try:
        connection = get_mysql_connection()
        with connection.cursor() as cursor:
            # Obtener info del archivo
            cursor.execute("SELECT url FROM files WHERE id = %s", (file_id,))
            file_record = cursor.fetchone()

            if not file_record:
                raise HTTPException(status_code=404, detail="Archivo no encontrado")

            file_url = file_record.get("url")
            if file_url:
                file_path = os.path.join(UPLOAD_DIR, file_url.lstrip("/uploads/"))
                if os.path.exists(file_path):
                    os.remove(file_path)

            # Eliminar registro
            cursor.execute("DELETE FROM files WHERE id = %s", (file_id,))
            connection.commit()

            return {"message": "Archivo eliminado"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting file: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if connection:
            connection.close()
