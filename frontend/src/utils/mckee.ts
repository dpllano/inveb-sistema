/**
 * Utilidades para Fórmula McKee - Cálculo BCT
 * Issue 25: Sección Fórmula McKee
 * Fuente Laravel: ot-creation.js líneas 3620-3810
 */

export interface McKeeInputs {
  largo: number;
  ancho: number;
  alto: number;
  ect: number;
  espesor: number;
}

export interface McKeeResults {
  perimetro: number;
  bct_kilos: number;
  bct_lib: number;
}

/**
 * Calcula el perímetro resistente.
 * Fórmula Laravel: (largo + ancho) * 2
 */
export function calcularPerimetro(largo: number, ancho: number): number {
  return (largo + ancho) * 2;
}

/**
 * Calcula BCT (Box Compression Test) según Fórmula McKee.
 *
 * Fórmula Laravel (línea 3750):
 * bct_kilos = 0.325 * ect * ((espesor - 0.2) ^ 0.508) * ((perimetro / 10) ^ 0.492)
 * bct_lb = bct_kilos / 0.454
 *
 * @param inputs - Valores de entrada (ect, espesor, perimetro)
 * @returns BCT en kilos y libras, redondeado a enteros
 */
export function calcularBCT(ect: number, espesor: number, perimetro: number): { bct_kilos: number; bct_lib: number } {
  // Fórmula McKee exacta de Laravel
  const bct_kilos = 0.325 * ect * Math.pow(espesor - 0.2, 0.508) * Math.pow(perimetro / 10, 0.492);
  const bct_lib = bct_kilos / 0.454;

  return {
    bct_kilos: Math.round(bct_kilos),
    bct_lib: Math.round(bct_lib)
  };
}

/**
 * Calcula todos los valores de la Fórmula McKee.
 */
export function calcularFormulaMcKee(inputs: McKeeInputs): McKeeResults {
  const perimetro = calcularPerimetro(inputs.largo, inputs.ancho);
  const { bct_kilos, bct_lib } = calcularBCT(inputs.ect, inputs.espesor, perimetro);

  return {
    perimetro,
    bct_kilos,
    bct_lib
  };
}

/**
 * Genera fecha actual en formato DD-MM-YYYY HH:mm:ss (formato Laravel).
 */
export function getFechaMcKee(): string {
  const dt = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');

  return `${pad(dt.getDate())}-${pad(dt.getMonth() + 1)}-${dt.getFullYear()} ${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`;
}
