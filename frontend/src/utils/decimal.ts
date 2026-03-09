/**
 * Utilidades para manejo de decimales con soporte para coma y punto.
 * Issues 37, 38: Aceptar coma (,) como separador decimal.
 * Fuente Laravel: str_replace(",", ".", $valor) antes de guardar
 */

/**
 * Normaliza un valor de entrada decimal, convirtiendo coma a punto.
 * @param value - Valor de entrada (puede contener coma o punto)
 * @returns Número normalizado o null si es inválido
 */
export function normalizeDecimalInput(value: string): number | null {
  if (!value || value.trim() === '') {
    return null;
  }

  // Reemplazar coma por punto (formato chileno/europeo a formato numérico)
  const normalized = value.replace(',', '.');
  const parsed = parseFloat(normalized);

  return isNaN(parsed) ? null : parsed;
}

/**
 * Formatea un número para mostrar con coma como separador decimal.
 * @param value - Número a formatear
 * @param decimals - Número de decimales (default 2)
 * @returns String formateado con coma como separador decimal
 */
export function formatDecimalDisplay(value: number | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined) {
    return '';
  }

  // Formatear con punto y luego reemplazar por coma
  return value.toFixed(decimals).replace('.', ',');
}

/**
 * Handler genérico para inputs decimales que acepta coma.
 * Uso en onChange: handleDecimalChange('campo', e.target.value, setFormState)
 */
export function handleDecimalChange<T extends Record<string, unknown>>(
  field: keyof T,
  value: string,
  setState: React.Dispatch<React.SetStateAction<T>>
): void {
  const normalizedValue = normalizeDecimalInput(value);
  setState(prev => ({
    ...prev,
    [field]: normalizedValue
  }));
}

/**
 * Regex para validar entrada decimal con coma o punto.
 * Permite: 123 | 123.45 | 123,45 | -123.45 | -123,45
 */
export const DECIMAL_REGEX = /^-?\d*[.,]?\d*$/;

/**
 * Valida si un string es un número decimal válido (con coma o punto).
 */
export function isValidDecimalInput(value: string): boolean {
  return DECIMAL_REGEX.test(value);
}
