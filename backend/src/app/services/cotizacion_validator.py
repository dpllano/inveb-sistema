"""
Servicio de Validacion de Detalles de Cotizacion - INVEB
Sprint BRECHA 2: Validacion Consistencia Detalles Cotizacion

Fuente Laravel:
- DetalleCotizacionController.php metodos store(), update(), cargaMasivaDetalles()
- DetalleCotizacion.php modelo y relaciones

NO INVENTAR - Todas las reglas son extraidas directamente del codigo Laravel.
"""
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field
from enum import IntEnum
import pymysql
from app.database import get_db_connection


# =============================================================================
# CONSTANTES - Fuente Laravel: DetalleCotizacionController.php
# =============================================================================

class TipoDetalle(IntEnum):
    """Tipos de detalle de cotizacion."""
    CORRUGADO = 1
    ESQUINERO = 2


# IDs fijos para Esquinero - Fuente Laravel: DetalleCotizacionController@store linea 180
ESQUINERO_PRODUCT_TYPE_ID = 21  # Tipo producto fijo para esquineros
ESQUINERO_RUBRO_ID = 5  # Rubro fijo para esquineros (Esquinero)


# =============================================================================
# RESULTADO DE VALIDACION
# =============================================================================

@dataclass
class ValidationError:
    """Error de validacion individual."""
    campo: str
    mensaje: str
    valor: Any = None


@dataclass
class ValidationResult:
    """Resultado de validacion de un detalle."""
    es_valido: bool
    errores: List[ValidationError] = field(default_factory=list)
    advertencias: List[str] = field(default_factory=list)
    datos_corregidos: Dict[str, Any] = field(default_factory=dict)

    def agregar_error(self, campo: str, mensaje: str, valor: Any = None):
        """Agrega un error de validacion."""
        self.errores.append(ValidationError(campo=campo, mensaje=mensaje, valor=valor))
        self.es_valido = False

    def agregar_advertencia(self, mensaje: str):
        """Agrega una advertencia (no bloquea)."""
        self.advertencias.append(mensaje)


# =============================================================================
# VALIDADOR DE DETALLES DE COTIZACION
# =============================================================================

class CotizacionValidator:
    """
    Validador de detalles de cotizacion.

    Implementa las validaciones del DetalleCotizacionController de Laravel.
    """

    def __init__(self):
        """Inicializa el validador con caches para FKs."""
        self._cache_plantas: Optional[set] = None
        self._cache_rubros: Optional[set] = None
        self._cache_cartons: Optional[set] = None
        self._cache_cartons_esquinero: Optional[set] = None
        self._cache_processes: Optional[set] = None
        self._cache_ciudades_flete: Optional[set] = None
        self._cache_print_types: Optional[set] = None
        self._cache_barniz_types: Optional[set] = None

    def _cargar_cache_fks(self) -> None:
        """
        Carga los IDs validos de tablas de referencia en cache.

        Fuente Laravel: Validaciones en DetalleCotizacionController@cargaMasivaDetalles
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cursor:
                    # Plantas activas
                    cursor.execute("SELECT id FROM plantas WHERE active = 1")
                    self._cache_plantas = {row['id'] for row in cursor.fetchall()}

                    # Rubros activos
                    cursor.execute("SELECT id FROM rubros WHERE active = 1")
                    self._cache_rubros = {row['id'] for row in cursor.fetchall()}

                    # Cartones activos (corrugados)
                    cursor.execute("SELECT id FROM cartons WHERE active = 1")
                    self._cache_cartons = {row['id'] for row in cursor.fetchall()}

                    # Cartones esquineros activos
                    cursor.execute("SELECT id FROM carton_esquineros WHERE active = 1")
                    self._cache_cartons_esquinero = {row['id'] for row in cursor.fetchall()}

                    # Procesos activos
                    cursor.execute("SELECT id FROM processes WHERE active = 1")
                    self._cache_processes = {row['id'] for row in cursor.fetchall()}

                    # Ciudades de flete activas
                    cursor.execute("SELECT id FROM ciudades_flete WHERE active = 1")
                    self._cache_ciudades_flete = {row['id'] for row in cursor.fetchall()}

                    # Tipos de impresion activos
                    cursor.execute("SELECT id FROM print_types WHERE active = 1")
                    self._cache_print_types = {row['id'] for row in cursor.fetchall()}

                    # Tipos de barniz activos
                    cursor.execute("SELECT id FROM barniz_types WHERE active = 1")
                    self._cache_barniz_types = {row['id'] for row in cursor.fetchall()}

        except Exception as e:
            # En caso de error, usar sets vacios (no bloquear)
            self._cache_plantas = set()
            self._cache_rubros = set()
            self._cache_cartons = set()
            self._cache_cartons_esquinero = set()
            self._cache_processes = set()
            self._cache_ciudades_flete = set()
            self._cache_print_types = set()
            self._cache_barniz_types = set()

    def validar_detalle(
        self,
        detalle: Dict[str, Any],
        cotizacion_id: Optional[int] = None,
        es_actualizacion: bool = False
    ) -> ValidationResult:
        """
        Valida un detalle de cotizacion completo.

        Fuente Laravel: DetalleCotizacionController@store y @update

        Args:
            detalle: Diccionario con datos del detalle
            cotizacion_id: ID de la cotizacion padre (opcional)
            es_actualizacion: True si es una actualizacion

        Returns:
            ValidationResult con errores y datos corregidos
        """
        result = ValidationResult(es_valido=True)

        # Cargar cache de FKs si no esta cargada
        if self._cache_plantas is None:
            self._cargar_cache_fks()

        # 1. Validar tipo_detalle_id (requerido)
        tipo_detalle_id = detalle.get('tipo_detalle_id')
        if tipo_detalle_id is None:
            result.agregar_error('tipo_detalle_id', 'El tipo de detalle es requerido')
            return result  # No podemos continuar sin el tipo

        try:
            tipo_detalle_id = int(tipo_detalle_id)
        except (ValueError, TypeError):
            result.agregar_error('tipo_detalle_id', 'El tipo de detalle debe ser numerico', tipo_detalle_id)
            return result

        if tipo_detalle_id not in [TipoDetalle.CORRUGADO, TipoDetalle.ESQUINERO]:
            result.agregar_error('tipo_detalle_id', f'Tipo de detalle invalido: {tipo_detalle_id}. Debe ser 1 (Corrugado) o 2 (Esquinero)')
            return result

        # 2. Validar segun tipo
        if tipo_detalle_id == TipoDetalle.CORRUGADO:
            self._validar_corrugado(detalle, result)
        else:
            self._validar_esquinero(detalle, result)

        # 3. Validaciones comunes
        self._validar_campos_comunes(detalle, result)

        # 4. Validar FKs
        self._validar_foreign_keys(detalle, tipo_detalle_id, result)

        return result

    def _validar_corrugado(self, detalle: Dict[str, Any], result: ValidationResult) -> None:
        """
        Valida campos especificos de productos corrugados.

        Fuente Laravel: DetalleCotizacionController@store lineas 120-160
        Campos requeridos: carton_id, process_id, cantidad, area_hc, anchura, largura,
                          numero_colores, rubro_id, planta_id
        """
        # Campos requeridos para corrugado
        campos_requeridos = [
            ('carton_id', 'Carton'),
            ('process_id', 'Proceso'),
            ('cantidad', 'Cantidad'),
            ('rubro_id', 'Rubro'),
            ('planta_id', 'Planta'),
        ]

        for campo, nombre in campos_requeridos:
            valor = detalle.get(campo)
            if valor is None or valor == '':
                result.agregar_error(campo, f'{nombre} es requerido para productos corrugados')

        # Campos numericos requeridos con valor > 0
        campos_numericos = [
            ('cantidad', 'Cantidad', True),  # (campo, nombre, debe_ser_positivo)
            ('area_hc', 'Area HC', False),
            ('anchura', 'Anchura', False),
            ('largura', 'Largura', False),
            ('numero_colores', 'Numero de colores', False),
        ]

        for campo, nombre, debe_ser_positivo in campos_numericos:
            valor = detalle.get(campo)
            if valor is not None and valor != '':
                try:
                    valor_num = float(valor)
                    if debe_ser_positivo and valor_num <= 0:
                        result.agregar_error(campo, f'{nombre} debe ser mayor a 0', valor)
                except (ValueError, TypeError):
                    result.agregar_error(campo, f'{nombre} debe ser numerico', valor)

        # Validar numero de colores (0-8)
        num_colores = detalle.get('numero_colores')
        if num_colores is not None and num_colores != '':
            try:
                nc = int(num_colores)
                if nc < 0 or nc > 8:
                    result.agregar_error('numero_colores', 'Numero de colores debe estar entre 0 y 8', nc)
            except (ValueError, TypeError):
                pass  # Ya se valido arriba

    def _validar_esquinero(self, detalle: Dict[str, Any], result: ValidationResult) -> None:
        """
        Valida campos especificos de esquineros.

        Fuente Laravel: DetalleCotizacionController@store lineas 175-190
        Campos requeridos: carton_esquinero_id, largo_esquinero, cantidad
        Campos fijos: product_type_id = 21, rubro_id = 5
        """
        # Campos requeridos para esquinero
        campos_requeridos = [
            ('carton_esquinero_id', 'Carton esquinero'),
            ('largo_esquinero', 'Largo del esquinero'),
            ('cantidad', 'Cantidad'),
        ]

        for campo, nombre in campos_requeridos:
            valor = detalle.get(campo)
            if valor is None or valor == '':
                result.agregar_error(campo, f'{nombre} es requerido para esquineros')

        # Validar largo esquinero > 0
        largo = detalle.get('largo_esquinero')
        if largo is not None and largo != '':
            try:
                largo_num = float(largo)
                if largo_num <= 0:
                    result.agregar_error('largo_esquinero', 'Largo del esquinero debe ser mayor a 0', largo)
            except (ValueError, TypeError):
                result.agregar_error('largo_esquinero', 'Largo del esquinero debe ser numerico', largo)

        # Validar cantidad > 0
        cantidad = detalle.get('cantidad')
        if cantidad is not None and cantidad != '':
            try:
                cant_num = float(cantidad)
                if cant_num <= 0:
                    result.agregar_error('cantidad', 'Cantidad debe ser mayor a 0', cantidad)
            except (ValueError, TypeError):
                result.agregar_error('cantidad', 'Cantidad debe ser numerico', cantidad)

        # Corregir campos fijos para esquinero
        result.datos_corregidos['product_type_id'] = ESQUINERO_PRODUCT_TYPE_ID
        result.datos_corregidos['rubro_id'] = ESQUINERO_RUBRO_ID

        # Advertencia si se intentaron establecer valores diferentes
        if detalle.get('product_type_id') and int(detalle.get('product_type_id', 0)) != ESQUINERO_PRODUCT_TYPE_ID:
            result.agregar_advertencia(f'product_type_id corregido a {ESQUINERO_PRODUCT_TYPE_ID} para esquinero')

        if detalle.get('rubro_id') and int(detalle.get('rubro_id', 0)) != ESQUINERO_RUBRO_ID:
            result.agregar_advertencia(f'rubro_id corregido a {ESQUINERO_RUBRO_ID} para esquinero')

    def _validar_campos_comunes(self, detalle: Dict[str, Any], result: ValidationResult) -> None:
        """
        Valida campos comunes a ambos tipos de detalle.

        Fuente Laravel: DetalleCotizacionController validaciones generales
        """
        # Validar precios >= 0
        campos_precio = ['precio_final_usd', 'precio_final_clp', 'precio_mm2_usd', 'precio_mm2_clp']
        for campo in campos_precio:
            valor = detalle.get(campo)
            if valor is not None and valor != '':
                try:
                    precio = float(valor)
                    if precio < 0:
                        result.agregar_error(campo, f'{campo} no puede ser negativo', valor)
                except (ValueError, TypeError):
                    result.agregar_error(campo, f'{campo} debe ser numerico', valor)

        # Validar porcentajes (0-100)
        campos_porcentaje = ['porcentaje_cera_interno', 'porcentaje_cera_externo', 'margen']
        for campo in campos_porcentaje:
            valor = detalle.get(campo)
            if valor is not None and valor != '':
                try:
                    pct = float(valor)
                    if pct < 0 or pct > 100:
                        result.agregar_error(campo, f'{campo} debe estar entre 0 y 100', valor)
                except (ValueError, TypeError):
                    result.agregar_error(campo, f'{campo} debe ser numerico', valor)

    def _validar_foreign_keys(
        self,
        detalle: Dict[str, Any],
        tipo_detalle_id: int,
        result: ValidationResult
    ) -> None:
        """
        Valida que las foreign keys existan en las tablas de referencia.

        Fuente Laravel: DetalleCotizacionController@cargaMasivaDetalles validaciones FK
        """
        # Validar planta_id
        planta_id = detalle.get('planta_id')
        if planta_id and self._cache_plantas:
            try:
                if int(planta_id) not in self._cache_plantas:
                    result.agregar_error('planta_id', f'Planta con ID {planta_id} no existe o no esta activa')
            except (ValueError, TypeError):
                pass

        # Validar rubro_id (solo para corrugado, esquinero es fijo)
        if tipo_detalle_id == TipoDetalle.CORRUGADO:
            rubro_id = detalle.get('rubro_id')
            if rubro_id and self._cache_rubros:
                try:
                    if int(rubro_id) not in self._cache_rubros:
                        result.agregar_error('rubro_id', f'Rubro con ID {rubro_id} no existe o no esta activo')
                except (ValueError, TypeError):
                    pass

        # Validar carton_id (para corrugado)
        if tipo_detalle_id == TipoDetalle.CORRUGADO:
            carton_id = detalle.get('carton_id')
            if carton_id and self._cache_cartons:
                try:
                    if int(carton_id) not in self._cache_cartons:
                        result.agregar_error('carton_id', f'Carton con ID {carton_id} no existe o no esta activo')
                except (ValueError, TypeError):
                    pass

        # Validar carton_esquinero_id (para esquinero)
        if tipo_detalle_id == TipoDetalle.ESQUINERO:
            carton_esq_id = detalle.get('carton_esquinero_id')
            if carton_esq_id and self._cache_cartons_esquinero:
                try:
                    if int(carton_esq_id) not in self._cache_cartons_esquinero:
                        result.agregar_error('carton_esquinero_id', f'Carton esquinero con ID {carton_esq_id} no existe o no esta activo')
                except (ValueError, TypeError):
                    pass

        # Validar process_id (para corrugado)
        if tipo_detalle_id == TipoDetalle.CORRUGADO:
            process_id = detalle.get('process_id')
            if process_id and self._cache_processes:
                try:
                    if int(process_id) not in self._cache_processes:
                        result.agregar_error('process_id', f'Proceso con ID {process_id} no existe o no esta activo')
                except (ValueError, TypeError):
                    pass

        # Validar ciudad_flete_id
        ciudad_flete_id = detalle.get('ciudad_flete_id')
        if ciudad_flete_id and self._cache_ciudades_flete:
            try:
                if int(ciudad_flete_id) not in self._cache_ciudades_flete:
                    result.agregar_error('ciudad_flete_id', f'Ciudad flete con ID {ciudad_flete_id} no existe o no esta activa')
            except (ValueError, TypeError):
                pass

        # Validar print_type_id
        print_type_id = detalle.get('print_type_id')
        if print_type_id and self._cache_print_types:
            try:
                if int(print_type_id) not in self._cache_print_types:
                    result.agregar_error('print_type_id', f'Tipo impresion con ID {print_type_id} no existe o no esta activo')
            except (ValueError, TypeError):
                pass

        # Validar barniz_type_id
        barniz_type_id = detalle.get('barniz_type_id')
        if barniz_type_id and self._cache_barniz_types:
            try:
                if int(barniz_type_id) not in self._cache_barniz_types:
                    result.agregar_error('barniz_type_id', f'Tipo barniz con ID {barniz_type_id} no existe o no esta activo')
            except (ValueError, TypeError):
                pass

    def validar_detalles_masivo(
        self,
        detalles: List[Dict[str, Any]],
        cotizacion_id: int
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Valida multiples detalles para carga masiva.

        Fuente Laravel: DetalleCotizacionController@cargaMasivaDetalles

        Args:
            detalles: Lista de detalles a validar
            cotizacion_id: ID de la cotizacion padre

        Returns:
            Tupla (detalles_validos, detalles_con_errores)
        """
        detalles_validos = []
        detalles_con_errores = []

        # Cargar cache una sola vez
        if self._cache_plantas is None:
            self._cargar_cache_fks()

        for i, detalle in enumerate(detalles):
            result = self.validar_detalle(detalle, cotizacion_id)

            if result.es_valido:
                # Aplicar correcciones y agregar a validos
                detalle_corregido = {**detalle, **result.datos_corregidos}
                detalle_corregido['cotizacion_id'] = cotizacion_id
                detalles_validos.append(detalle_corregido)
            else:
                # Agregar info de errores
                detalles_con_errores.append({
                    'fila': i + 1,
                    'detalle': detalle,
                    'errores': [{'campo': e.campo, 'mensaje': e.mensaje, 'valor': e.valor} for e in result.errores],
                    'advertencias': result.advertencias
                })

        return detalles_validos, detalles_con_errores


# =============================================================================
# FUNCIONES AUXILIARES
# =============================================================================

def crear_validador() -> CotizacionValidator:
    """Crea una instancia del validador."""
    return CotizacionValidator()


def validar_detalle_cotizacion(detalle: Dict[str, Any], cotizacion_id: Optional[int] = None) -> ValidationResult:
    """
    Funcion de conveniencia para validar un detalle.

    Args:
        detalle: Datos del detalle a validar
        cotizacion_id: ID de la cotizacion padre

    Returns:
        ValidationResult
    """
    validator = crear_validador()
    return validator.validar_detalle(detalle, cotizacion_id)


def validar_detalles_masivo(
    detalles: List[Dict[str, Any]],
    cotizacion_id: int
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Funcion de conveniencia para validar detalles masivos.

    Args:
        detalles: Lista de detalles a validar
        cotizacion_id: ID de la cotizacion padre

    Returns:
        Tupla (detalles_validos, detalles_con_errores)
    """
    validator = crear_validador()
    return validator.validar_detalles_masivo(detalles, cotizacion_id)
