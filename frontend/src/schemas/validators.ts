/**
 * Validadores personalizados para Chile
 * Sprint K - Task K.2
 *
 * Basado en: services/validators.py (backend)
 */

/**
 * Valida un RUT chileno usando el algoritmo de módulo 11
 * @param rut RUT en formato XXXXXXXX-X o XX.XXX.XXX-X
 * @returns true si es válido
 */
export function validarRUT(rut: string): boolean {
  if (!rut) return false;

  // Limpiar el RUT: remover puntos, espacios y convertir a mayúsculas
  const rutLimpio = rut.replace(/\./g, '').replace(/\s/g, '').toUpperCase();

  // Verificar formato básico
  const regex = /^(\d{1,8})-?([\dK])$/;
  const match = rutLimpio.match(regex);

  if (!match) return false;

  const cuerpo = match[1];
  const dvIngresado = match[2];

  // Calcular dígito verificador
  let suma = 0;
  let multiplicador = 2;

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }

  const resto = suma % 11;
  const dvCalculado = 11 - resto;

  let dvEsperado: string;
  if (dvCalculado === 11) {
    dvEsperado = '0';
  } else if (dvCalculado === 10) {
    dvEsperado = 'K';
  } else {
    dvEsperado = dvCalculado.toString();
  }

  return dvIngresado === dvEsperado;
}

/**
 * Valida un teléfono chileno
 * Formatos válidos: +56 9 XXXX XXXX, 56 9 XXXX XXXX, 9 XXXX XXXX
 * @param telefono Número de teléfono
 * @returns true si es válido
 */
export function validarTelefonoChileno(telefono: string): boolean {
  if (!telefono) return true; // Opcional

  // Limpiar el teléfono
  const telefonoLimpio = telefono.replace(/[\s\-\(\)]/g, '');

  // Patrones válidos para teléfonos chilenos
  const patrones = [
    /^\+?56?9\d{8}$/,     // +56 9 XXXX XXXX o 56 9 XXXX XXXX o 9 XXXX XXXX
    /^9\d{8}$/,           // 9 XXXX XXXX (móvil)
    /^\+?56[2-9]\d{8}$/,  // +56 2 XXXX XXXX (fijo Santiago) u otras regiones
  ];

  return patrones.some(p => p.test(telefonoLimpio));
}

/**
 * Valida un email
 * @param email Dirección de email
 * @returns true si es válido
 */
export function validarEmail(email: string): boolean {
  if (!email) return true; // Opcional
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Formatea un RUT para visualización (XX.XXX.XXX-X)
 * @param rut RUT sin formato
 * @returns RUT formateado
 */
export function formatearRUT(rut: string): string {
  if (!rut) return '';

  const rutLimpio = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();
  if (rutLimpio.length < 2) return rutLimpio;

  const cuerpo = rutLimpio.slice(0, -1);
  const dv = rutLimpio.slice(-1);

  // Agregar puntos cada 3 dígitos desde la derecha
  let cuerpoFormateado = '';
  for (let i = cuerpo.length - 1, count = 0; i >= 0; i--, count++) {
    if (count > 0 && count % 3 === 0) {
      cuerpoFormateado = '.' + cuerpoFormateado;
    }
    cuerpoFormateado = cuerpo[i] + cuerpoFormateado;
  }

  return `${cuerpoFormateado}-${dv}`;
}

/**
 * Formatea un teléfono chileno para visualización
 * @param telefono Número sin formato
 * @returns Teléfono formateado
 */
export function formatearTelefono(telefono: string): string {
  if (!telefono) return '';

  const limpio = telefono.replace(/\D/g, '');

  // Si empieza con 56, formatear como +56 X XXXX XXXX
  if (limpio.startsWith('56') && limpio.length >= 11) {
    const codigo = limpio.slice(2, 3);
    const parte1 = limpio.slice(3, 7);
    const parte2 = limpio.slice(7, 11);
    return `+56 ${codigo} ${parte1} ${parte2}`;
  }

  // Si empieza con 9 (móvil), formatear como 9 XXXX XXXX
  if (limpio.startsWith('9') && limpio.length === 9) {
    return `${limpio.slice(0, 1)} ${limpio.slice(1, 5)} ${limpio.slice(5)}`;
  }

  return telefono;
}
