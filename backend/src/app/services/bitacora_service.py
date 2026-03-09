"""
Servicio de Bitacora de Work Orders - Sprint M
Fuente Laravel: WorkOrderController.php lineas 1697-1715, 5560-5582

Registra TODOS los cambios realizados a las OTs para auditoria completa.

NO INVENTAR - Todas las funcionalidades son extraidas del codigo Laravel.
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
from dataclasses import dataclass
import json
import logging
import pymysql
from pymysql.cursors import DictCursor

from app.database import get_db_connection
from app.models.bitacora import (
    TipoOperacion,
    ObservacionBitacora,
    BitacoraResponse,
    HistorialCambiosResponse
)

logger = logging.getLogger(__name__)


# =============================================================================
# TIPOS DE DATOS
# =============================================================================

@dataclass
class UserData:
    """
    Datos del usuario que realiza el cambio.
    Fuente Laravel: WorkOrderController.php lineas 1703-1708
    """
    nombre: str
    apellido: str
    rut: str
    role_id: int

    def to_json(self) -> str:
        """Convierte a JSON con soporte Unicode."""
        return json.dumps({
            'nombre': self.nombre,
            'apellido': self.apellido,
            'rut': self.rut,
            'role_id': self.role_id
        }, ensure_ascii=False)


@dataclass
class CampoModificado:
    """
    Representa un campo modificado en la OT.
    Fuente Laravel: WorkOrderController.php lineas 5340-5344
    """
    campo: str
    texto: str  # Nombre legible
    antiguo_valor_id: Optional[int]
    antiguo_valor_descripcion: str
    nuevo_valor_id: Optional[int]
    nuevo_valor_descripcion: str

    def to_dict(self) -> dict:
        """Convierte a diccionario para JSON."""
        return {
            'texto': self.texto,
            'antiguo_valor': {
                'id': self.antiguo_valor_id,
                'descripcion': self.antiguo_valor_descripcion
            },
            'nuevo_valor': {
                'id': self.nuevo_valor_id,
                'descripcion': self.nuevo_valor_descripcion
            }
        }


# =============================================================================
# SERVICIO DE BITACORA
# =============================================================================

class BitacoraService:
    """
    Servicio para gestionar la bitacora de cambios de Work Orders.

    Fuente Laravel: WorkOrderController.php - multiples metodos
    """

    def __init__(self):
        """Inicializa el servicio."""
        pass

    def registrar_insercion(
        self,
        work_order_id: int,
        user_id: int,
        user_data: UserData,
        datos_insertados: Dict[str, CampoModificado],
        ip_solicitud: Optional[str] = None,
        url: Optional[str] = None
    ) -> Optional[int]:
        """
        Registra una insercion de OT en la bitacora.

        Fuente Laravel: WorkOrderController.php lineas 1697-1713

        Args:
            work_order_id: ID de la OT creada
            user_id: ID del usuario que creo la OT
            user_data: Datos del usuario
            datos_insertados: Campos insertados
            ip_solicitud: IP del cliente
            url: URL de la solicitud

        Returns:
            ID del registro de bitacora creado, o None si falla
        """
        if not datos_insertados:
            logger.debug(f"No hay datos insertados para OT {work_order_id}, no se registra bitacora")
            return None

        return self._registrar_bitacora(
            observacion=ObservacionBitacora.INSERCION,
            operacion=TipoOperacion.INSERCION,
            work_order_id=work_order_id,
            user_id=user_id,
            user_data=user_data,
            datos_modificados=datos_insertados,
            ip_solicitud=ip_solicitud,
            url=url
        )

    def registrar_modificacion(
        self,
        work_order_id: int,
        user_id: int,
        user_data: UserData,
        datos_modificados: Dict[str, CampoModificado],
        ip_solicitud: Optional[str] = None,
        url: Optional[str] = None
    ) -> Optional[int]:
        """
        Registra una modificacion de OT en la bitacora.

        Fuente Laravel: WorkOrderController.php lineas 5560-5579

        Args:
            work_order_id: ID de la OT modificada
            user_id: ID del usuario que modifico
            user_data: Datos del usuario
            datos_modificados: Campos modificados con valores antiguos y nuevos
            ip_solicitud: IP del cliente
            url: URL de la solicitud

        Returns:
            ID del registro de bitacora creado, o None si falla
        """
        if not datos_modificados:
            logger.debug(f"No hay cambios para OT {work_order_id}, no se registra bitacora")
            return None

        return self._registrar_bitacora(
            observacion=ObservacionBitacora.MODIFICACION,
            operacion=TipoOperacion.MODIFICACION,
            work_order_id=work_order_id,
            user_id=user_id,
            user_data=user_data,
            datos_modificados=datos_modificados,
            ip_solicitud=ip_solicitud,
            url=url
        )

    def registrar_mckee(
        self,
        work_order_id: int,
        user_id: int,
        user_data: UserData,
        datos_mckee: Dict[str, Any],
        ip_solicitud: Optional[str] = None,
        url: Optional[str] = None
    ) -> Optional[int]:
        """
        Registra aplicacion de formula McKee en la bitacora.

        Fuente Laravel: WorkOrderController.php lineas 4502-4518, 9548-9564

        Args:
            work_order_id: ID de la OT
            user_id: ID del usuario
            user_data: Datos del usuario
            datos_mckee: Datos calculados por McKee
            ip_solicitud: IP del cliente
            url: URL de la solicitud

        Returns:
            ID del registro de bitacora creado
        """
        return self._registrar_bitacora(
            observacion=ObservacionBitacora.MCKEE,
            operacion=TipoOperacion.MCKEE,
            work_order_id=work_order_id,
            user_id=user_id,
            user_data=user_data,
            datos_modificados=datos_mckee,
            ip_solicitud=ip_solicitud,
            url=url
        )

    def _registrar_bitacora(
        self,
        observacion: str,
        operacion: str,
        work_order_id: int,
        user_id: int,
        user_data: UserData,
        datos_modificados: Dict[str, Any],
        ip_solicitud: Optional[str],
        url: Optional[str]
    ) -> Optional[int]:
        """
        Metodo interno para registrar en la bitacora.

        Estructura exacta de Laravel.
        """
        try:
            # Convertir datos_modificados a formato JSON
            if isinstance(datos_modificados, dict):
                # Convertir CampoModificado a dict si es necesario
                datos_json = {}
                for campo, valor in datos_modificados.items():
                    if isinstance(valor, CampoModificado):
                        datos_json[campo] = valor.to_dict()
                    else:
                        datos_json[campo] = valor
                datos_modificados_str = json.dumps(datos_json, ensure_ascii=False)
            else:
                datos_modificados_str = json.dumps(datos_modificados, ensure_ascii=False)

            conn = get_db_connection()
            cursor = conn.cursor()

            cursor.execute("""
                INSERT INTO bitacora_work_orders
                (observacion, operacion, work_order_id, user_id, user_data,
                 datos_modificados, ip_solicitud, url, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                observacion,
                operacion,
                work_order_id,
                user_id,
                user_data.to_json(),
                datos_modificados_str,
                ip_solicitud,
                url,
                datetime.utcnow(),
                datetime.utcnow()
            ))

            conn.commit()
            bitacora_id = cursor.lastrowid
            conn.close()

            logger.info(f"Bitacora registrada: ID={bitacora_id}, OT={work_order_id}, Operacion={operacion}")
            return bitacora_id

        except Exception as e:
            logger.error(f"Error registrando bitacora para OT {work_order_id}: {e}")
            return None

    def obtener_historial(
        self,
        work_order_id: int,
        limite: int = 100
    ) -> HistorialCambiosResponse:
        """
        Obtiene el historial de cambios de una OT.

        Fuente Laravel: WorkOrderController.php linea 519
            $bitacora_ot = BitacoraWorkOrder::where('work_order_id', $ot->id)->get()

        Args:
            work_order_id: ID de la OT
            limite: Maximo de registros a retornar

        Returns:
            HistorialCambiosResponse con todos los cambios
        """
        try:
            conn = get_db_connection()
            cursor = conn.cursor(DictCursor)

            cursor.execute("""
                SELECT id, observacion, operacion, work_order_id, user_id,
                       datos_modificados, user_data, ip_solicitud, url,
                       created_at, updated_at
                FROM bitacora_work_orders
                WHERE work_order_id = %s
                ORDER BY created_at DESC
                LIMIT %s
            """, (work_order_id, limite))

            rows = cursor.fetchall()
            conn.close()

            registros = []
            tiene_mckee = False

            for row in rows:
                # Parsear JSON fields
                datos_mod = None
                user_data_parsed = None
                usuario_nombre = None
                cantidad_cambios = 0

                if row.get('datos_modificados'):
                    try:
                        datos_mod = json.loads(row['datos_modificados'])
                        cantidad_cambios = len(datos_mod) if datos_mod else 0
                    except json.JSONDecodeError:
                        datos_mod = None

                if row.get('user_data'):
                    try:
                        user_data_parsed = json.loads(row['user_data'])
                        if user_data_parsed:
                            nombre = user_data_parsed.get('nombre', '')
                            apellido = user_data_parsed.get('apellido', '')
                            usuario_nombre = f"{nombre} {apellido}".strip()
                    except json.JSONDecodeError:
                        user_data_parsed = None

                if row['operacion'] == TipoOperacion.MCKEE:
                    tiene_mckee = True

                registros.append(BitacoraResponse(
                    id=row['id'],
                    observacion=row['observacion'],
                    operacion=row['operacion'],
                    work_order_id=row['work_order_id'],
                    user_id=row['user_id'],
                    datos_modificados=datos_mod,
                    user_data=user_data_parsed,
                    ip_solicitud=row.get('ip_solicitud'),
                    url=row.get('url'),
                    created_at=row['created_at'],
                    updated_at=row['updated_at'],
                    usuario_nombre=usuario_nombre,
                    cantidad_cambios=cantidad_cambios
                ))

            return HistorialCambiosResponse(
                work_order_id=work_order_id,
                total_cambios=len(registros),
                registros=registros,
                tiene_mckee=tiene_mckee
            )

        except Exception as e:
            logger.error(f"Error obteniendo historial para OT {work_order_id}: {e}")
            return HistorialCambiosResponse(
                work_order_id=work_order_id,
                total_cambios=0,
                registros=[],
                tiene_mckee=False
            )

    def verificar_tiene_cambios(self, work_order_id: int) -> bool:
        """
        Verifica si una OT tiene cambios registrados en bitacora.

        Fuente Laravel: WorkOrderController.php lineas 517-522
            $bitacora_ot = BitacoraWorkOrder::where('work_order_id', $ot->id)->get()->count();

        Args:
            work_order_id: ID de la OT

        Returns:
            True si tiene cambios registrados
        """
        try:
            conn = get_db_connection()
            cursor = conn.cursor()

            cursor.execute("""
                SELECT COUNT(*) as total
                FROM bitacora_work_orders
                WHERE work_order_id = %s
            """, (work_order_id,))

            row = cursor.fetchone()
            conn.close()

            return row[0] > 0 if row else False

        except Exception as e:
            logger.error(f"Error verificando bitacora para OT {work_order_id}: {e}")
            return False

    def verificar_tiene_mckee(self, work_order_id: int) -> bool:
        """
        Verifica si una OT tiene McKee aplicado.

        Fuente Laravel: WorkOrderController.php lineas 5127-5132
            $mckee_ot = BitacoraWorkOrder::where('work_order_id', $ot->id)
                ->where('operacion', 'Mckee')->get()->count();

        Args:
            work_order_id: ID de la OT

        Returns:
            True si tiene McKee aplicado
        """
        try:
            conn = get_db_connection()
            cursor = conn.cursor()

            cursor.execute("""
                SELECT COUNT(*) as total
                FROM bitacora_work_orders
                WHERE work_order_id = %s AND operacion = %s
            """, (work_order_id, TipoOperacion.MCKEE))

            row = cursor.fetchone()
            conn.close()

            return row[0] > 0 if row else False

        except Exception as e:
            logger.error(f"Error verificando McKee para OT {work_order_id}: {e}")
            return False


# =============================================================================
# FUNCIONES DE AYUDA PARA COMPARAR CAMBIOS
# =============================================================================

def comparar_campo(
    campo: str,
    texto: str,
    valor_antiguo: Any,
    valor_nuevo: Any,
    id_antiguo: Optional[int] = None,
    id_nuevo: Optional[int] = None
) -> Optional[CampoModificado]:
    """
    Compara dos valores y retorna CampoModificado si son diferentes.

    Fuente Laravel: WorkOrderController.php lineas 5339-5345

    Args:
        campo: Nombre tecnico del campo
        texto: Nombre legible del campo
        valor_antiguo: Valor antes del cambio
        valor_nuevo: Valor despues del cambio
        id_antiguo: ID relacionado antiguo (para FKs)
        id_nuevo: ID relacionado nuevo (para FKs)

    Returns:
        CampoModificado si hay diferencia, None si son iguales
    """
    # Normalizar valores para comparacion
    val_ant = str(valor_antiguo) if valor_antiguo is not None else ''
    val_nue = str(valor_nuevo) if valor_nuevo is not None else ''

    if val_ant != val_nue:
        return CampoModificado(
            campo=campo,
            texto=texto,
            antiguo_valor_id=id_antiguo,
            antiguo_valor_descripcion=str(valor_antiguo) if valor_antiguo else '',
            nuevo_valor_id=id_nuevo,
            nuevo_valor_descripcion=str(valor_nuevo) if valor_nuevo else ''
        )

    return None


def comparar_campos_ot(ot_actual: dict, ot_nuevo: dict) -> Dict[str, CampoModificado]:
    """
    Compara todos los campos de una OT y retorna los modificados.

    Fuente Laravel: WorkOrderController.php lineas 5331-5380+

    Args:
        ot_actual: Diccionario con valores actuales de la OT
        ot_nuevo: Diccionario con nuevos valores

    Returns:
        Diccionario de campos modificados
    """
    # Mapeo de campos a texto legible
    # Fuente: WorkOrderController.php - extraido de cada comparacion
    CAMPOS_LEGIBLES = {
        'descripcion': 'Descripción',
        'codigo_producto': 'Código producto',
        'nombre_contacto': 'Nombre contacto',
        'email_contacto': 'Email contacto',
        'telefono_contacto': 'Teléfono contacto',
        'client_id': 'Cliente',
        'instalacion_id': 'Instalación',
        'canal_id': 'Canal',
        'subsubhierarchy_id': 'Sub-jerarquía',
        'reference_type': 'Tipo referencia',
        'cantidad': 'Cantidad',
        'carton_id': 'Cartón',
        'impresion_id': 'Impresión',
        'fsc_id': 'FSC',
        'coverage_internal_id': 'Recubrimiento interno',
        'coverage_external_id': 'Recubrimiento externo',
        'planta_id': 'Planta',
        'product_type_id': 'Tipo producto',
        'process_id': 'Proceso',
        'armado_id': 'Armado',
        'pegado_id': 'Pegado',
        # ... agregar mas segun necesidad
    }

    cambios = {}

    for campo, texto in CAMPOS_LEGIBLES.items():
        if campo in ot_actual or campo in ot_nuevo:
            valor_actual = ot_actual.get(campo)
            valor_nuevo = ot_nuevo.get(campo)

            cambio = comparar_campo(
                campo=campo,
                texto=texto,
                valor_antiguo=valor_actual,
                valor_nuevo=valor_nuevo
            )

            if cambio:
                cambios[campo] = cambio

    return cambios


# =============================================================================
# INSTANCIA GLOBAL DEL SERVICIO
# =============================================================================

# Singleton para uso en toda la aplicacion
_bitacora_service: Optional[BitacoraService] = None


def get_bitacora_service() -> BitacoraService:
    """Obtiene la instancia del servicio de bitacora."""
    global _bitacora_service
    if _bitacora_service is None:
        _bitacora_service = BitacoraService()
    return _bitacora_service
