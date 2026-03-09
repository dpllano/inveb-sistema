"""
Validadores personalizados para INVEB
Sprint I: Validaciones Backend

Incluye:
- Validador de RUT chileno (I.2)
- Validador de teléfono chileno (I.5)
- Validador de fechas dd/mm/yyyy (I.3)
"""
import re
from typing import Optional
from datetime import datetime


def validar_rut_chileno(rut: str) -> bool:
    """
    Valida formato y dígito verificador de RUT chileno.

    Formatos aceptados:
    - 12345678-9
    - 12.345.678-9
    - 123456789

    Args:
        rut: RUT a validar

    Returns:
        True si el RUT es válido, False en caso contrario
    """
    if not rut:
        return False

    # Limpiar RUT: quitar puntos, guiones y espacios
    rut_limpio = re.sub(r'[.\-\s]', '', rut.upper())

    # Verificar longitud mínima
    if len(rut_limpio) < 8 or len(rut_limpio) > 9:
        return False

    # Separar cuerpo y dígito verificador
    cuerpo = rut_limpio[:-1]
    dv_ingresado = rut_limpio[-1]

    # Verificar que el cuerpo sea numérico
    if not cuerpo.isdigit():
        return False

    # Calcular dígito verificador usando algoritmo módulo 11
    suma = 0
    multiplo = 2

    for digito in reversed(cuerpo):
        suma += int(digito) * multiplo
        multiplo += 1
        if multiplo > 7:
            multiplo = 2

    resto = suma % 11
    dv_calculado = 11 - resto

    if dv_calculado == 11:
        dv_esperado = '0'
    elif dv_calculado == 10:
        dv_esperado = 'K'
    else:
        dv_esperado = str(dv_calculado)

    return dv_ingresado == dv_esperado


def formatear_rut(rut: str) -> str:
    """
    Formatea un RUT al formato estándar XX.XXX.XXX-X

    Args:
        rut: RUT sin formato o con formato parcial

    Returns:
        RUT formateado o el mismo string si no es válido
    """
    if not rut:
        return rut

    # Limpiar RUT
    rut_limpio = re.sub(r'[.\-\s]', '', rut.upper())

    if len(rut_limpio) < 8:
        return rut

    # Separar cuerpo y dígito verificador
    cuerpo = rut_limpio[:-1]
    dv = rut_limpio[-1]

    # Formatear con puntos
    cuerpo_formateado = ''
    for i, digito in enumerate(reversed(cuerpo)):
        if i > 0 and i % 3 == 0:
            cuerpo_formateado = '.' + cuerpo_formateado
        cuerpo_formateado = digito + cuerpo_formateado

    return f"{cuerpo_formateado}-{dv}"


def validar_telefono_chileno(telefono: str) -> bool:
    """
    Valida formato de teléfono chileno.

    Formatos aceptados:
    - +56 9 1234 5678
    - +56912345678
    - 56912345678
    - 912345678
    - 9 1234 5678

    Args:
        telefono: Teléfono a validar

    Returns:
        True si el teléfono es válido, False en caso contrario
    """
    if not telefono:
        return False

    # Limpiar teléfono: quitar espacios, guiones y paréntesis
    tel_limpio = re.sub(r'[\s\-\(\)]', '', telefono)

    # Patrones válidos para Chile
    patrones = [
        r'^\+56[29]\d{8}$',      # +56 9 XXXX XXXX (móvil) o +56 2 XXXX XXXX (fijo Santiago)
        r'^56[29]\d{8}$',        # 56 9 XXXX XXXX
        r'^[29]\d{8}$',          # 9 XXXX XXXX (móvil) o 2 XXXX XXXX (fijo)
        r'^\+56[3-7]\d{7,8}$',   # Fijos regionales
        r'^56[3-7]\d{7,8}$',     # Fijos regionales sin +
        r'^[3-7]\d{7,8}$',       # Fijos regionales solo número
    ]

    for patron in patrones:
        if re.match(patron, tel_limpio):
            return True

    return False


def formatear_telefono_chileno(telefono: str) -> str:
    """
    Formatea un teléfono chileno al formato estándar +56 9 XXXX XXXX

    Args:
        telefono: Teléfono sin formato

    Returns:
        Teléfono formateado o el mismo string si no es válido
    """
    if not telefono:
        return telefono

    # Limpiar teléfono
    tel_limpio = re.sub(r'[\s\-\(\)\+]', '', telefono)

    # Si empieza con 56, ya tiene código de país
    if tel_limpio.startswith('56'):
        tel_limpio = tel_limpio[2:]

    # Si tiene 9 dígitos y empieza con 9 (móvil)
    if len(tel_limpio) == 9 and tel_limpio.startswith('9'):
        return f"+56 {tel_limpio[0]} {tel_limpio[1:5]} {tel_limpio[5:]}"

    return telefono


def validar_fecha_ddmmyyyy(fecha: str) -> bool:
    """
    Valida formato de fecha dd/mm/yyyy o dd-mm-yyyy

    Args:
        fecha: Fecha a validar

    Returns:
        True si la fecha es válida, False en caso contrario
    """
    if not fecha:
        return False

    # Intentar parsear con diferentes formatos
    formatos = ['%d/%m/%Y', '%d-%m-%Y', '%Y-%m-%d']

    for formato in formatos:
        try:
            datetime.strptime(fecha, formato)
            return True
        except ValueError:
            continue

    return False


def convertir_fecha_a_iso(fecha: str) -> Optional[str]:
    """
    Convierte fecha de formato dd/mm/yyyy a ISO yyyy-mm-dd

    Args:
        fecha: Fecha en formato dd/mm/yyyy o dd-mm-yyyy

    Returns:
        Fecha en formato ISO o None si no es válida
    """
    if not fecha:
        return None

    # Si ya está en formato ISO, retornar tal cual
    if re.match(r'^\d{4}-\d{2}-\d{2}', fecha):
        return fecha

    # Intentar parsear formatos comunes
    formatos_entrada = ['%d/%m/%Y', '%d-%m-%Y']

    for formato in formatos_entrada:
        try:
            dt = datetime.strptime(fecha, formato)
            return dt.strftime('%Y-%m-%d')
        except ValueError:
            continue

    return None


def convertir_fecha_a_display(fecha: str) -> Optional[str]:
    """
    Convierte fecha de formato ISO yyyy-mm-dd a dd/mm/yyyy para mostrar

    Args:
        fecha: Fecha en formato ISO yyyy-mm-dd

    Returns:
        Fecha en formato dd/mm/yyyy o None si no es válida
    """
    if not fecha:
        return None

    try:
        # Manejar fechas con hora
        if 'T' in fecha:
            fecha = fecha.split('T')[0]

        dt = datetime.strptime(fecha[:10], '%Y-%m-%d')
        return dt.strftime('%d/%m/%Y')
    except ValueError:
        return fecha


# ============================================
# Pydantic Validators para usar en schemas
# ============================================

from pydantic import field_validator, model_validator
from typing import Any


def crear_validador_rut():
    """
    Crea un field_validator para RUT chileno.

    Uso en schema:
        class MiSchema(BaseModel):
            rut: str

            _validar_rut = field_validator('rut')(crear_validador_rut())
    """
    def validador(cls, v: str) -> str:
        if v and not validar_rut_chileno(v):
            raise ValueError('RUT chileno inválido. Verifique el formato y dígito verificador.')
        return v
    return classmethod(validador)


def crear_validador_telefono():
    """
    Crea un field_validator para teléfono chileno.
    """
    def validador(cls, v: str) -> str:
        if v and not validar_telefono_chileno(v):
            raise ValueError('Teléfono chileno inválido. Formato esperado: +56 9 XXXX XXXX')
        return v
    return classmethod(validador)


def crear_validador_fecha():
    """
    Crea un field_validator para fechas dd/mm/yyyy que convierte a ISO.
    """
    def validador(cls, v: str) -> str:
        if not v:
            return v

        # Si ya está en ISO, retornar
        if re.match(r'^\d{4}-\d{2}-\d{2}', v):
            return v

        # Intentar convertir a ISO
        fecha_iso = convertir_fecha_a_iso(v)
        if fecha_iso is None:
            raise ValueError('Fecha inválida. Formato esperado: dd/mm/yyyy')

        return fecha_iso
    return classmethod(validador)
