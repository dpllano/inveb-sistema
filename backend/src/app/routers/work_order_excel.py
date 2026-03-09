"""
Router de Excel SAP para Work Orders - INVEB Cascade Service
============================================================

Endpoints para descargar archivos Excel para integración con SAP.

Fuente Laravel: WorkOrderExcelController.php (3,319 líneas)
Rutas Laravel (web.php líneas 139-143):
- /crear-ot-excel/{id}
- /guardar-excel/{id}
- /descargar-reporte-excel/{id}
- /descargar-excel-sap/{id}
- /descargar-excel-sap-semielaborado/{id}
"""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
import pymysql

from app.config import get_settings
from services.excel_sap_generator import (
    generar_excel_sap,
    generar_excel_sap_semielaborado,
    generar_reporte_excel_ot
)

router = APIRouter(prefix="/work-orders", tags=["Work Order Excel"])
settings = get_settings()


def get_mysql_connection():
    """Crea conexión a MySQL de Laravel."""
    return pymysql.connect(
        host=settings.LARAVEL_MYSQL_HOST,
        port=settings.LARAVEL_MYSQL_PORT,
        user=settings.LARAVEL_MYSQL_USER,
        password=settings.LARAVEL_MYSQL_PASSWORD,
        database=settings.LARAVEL_MYSQL_DATABASE,
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )


@router.get("/{ot_id}/excel-sap")
async def descargar_excel_sap(ot_id: int):
    """
    Descarga archivo Excel SAP para una OT.

    Fuente Laravel: WorkOrderExcelController@descargarExcelSap (línea 1030)
    Ruta Laravel: /descargar-excel-sap/{id}

    Genera un archivo Excel con ~190 campos formateados para importación a SAP.
    El formato es vertical (códigos SAP en columna A, descripción en B, valor en C).
    """
    connection = get_mysql_connection()
    try:
        # Verificar que la OT existe
        with connection.cursor() as cursor:
            cursor.execute("SELECT id FROM work_orders WHERE id = %s AND active = 1", (ot_id,))
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"OT {ot_id} no encontrada"
                )

        # Generar Excel
        excel_file = generar_excel_sap(ot_id, connection)

        filename = f"Excel_SAP_OT_{ot_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"

        return StreamingResponse(
            excel_file,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generando Excel SAP: {str(e)}"
        )
    finally:
        connection.close()


@router.get("/{ot_id}/excel-sap-semielaborado")
async def descargar_excel_sap_semielaborado(ot_id: int):
    """
    Descarga archivo Excel SAP Semielaborado para una OT.

    Fuente Laravel: WorkOrderExcelController@descargarExcelSapSemielaborado (línea 2448)
    Ruta Laravel: /descargar-excel-sap-semielaborado/{id}

    Similar al Excel SAP pero con campos específicos para semielaborados.
    """
    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT id FROM work_orders WHERE id = %s AND active = 1", (ot_id,))
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"OT {ot_id} no encontrada"
                )

        excel_file = generar_excel_sap_semielaborado(ot_id, connection)

        filename = f"Excel_SAP_Semielaborado_OT_{ot_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"

        return StreamingResponse(
            excel_file,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generando Excel SAP Semielaborado: {str(e)}"
        )
    finally:
        connection.close()


@router.get("/{ot_id}/reporte-excel")
async def descargar_reporte_excel(ot_id: int):
    """
    Descarga reporte Excel general de una OT.

    Fuente Laravel: WorkOrderExcelController@descargarReporteExcel (línea 390)
    Ruta Laravel: /descargar-reporte-excel/{id}

    Genera un reporte con información general de la OT, medidas, estado, etc.
    """
    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT id FROM work_orders WHERE id = %s AND active = 1", (ot_id,))
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"OT {ot_id} no encontrada"
                )

        excel_file = generar_reporte_excel_ot(ot_id, connection)

        filename = f"Reporte_OT_{ot_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"

        return StreamingResponse(
            excel_file,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generando reporte Excel: {str(e)}"
        )
    finally:
        connection.close()
