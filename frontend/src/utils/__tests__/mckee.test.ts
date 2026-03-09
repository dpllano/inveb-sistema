/**
 * Tests funcionales - Issue 25: Fórmula McKee
 * Verifican que los cálculos BCT son correctos según Laravel
 * Fuente Laravel: ot-creation.js línea 3750
 */

import { calcularPerimetro, calcularBCT, calcularFormulaMcKee, getFechaMcKee } from '../mckee';

describe('Fórmula McKee - Issue 25', () => {
  describe('calcularPerimetro', () => {
    it('debería calcular perímetro correctamente: (largo + ancho) × 2', () => {
      expect(calcularPerimetro(300, 200)).toBe(1000);
    });

    it('debería manejar valores cero', () => {
      expect(calcularPerimetro(0, 0)).toBe(0);
    });

    it('debería manejar valores grandes', () => {
      expect(calcularPerimetro(1000, 800)).toBe(3600);
    });
  });

  describe('calcularBCT', () => {
    /**
     * Fórmula Laravel (línea 3750):
     * bct_kilos = 0.325 × ECT × ((Espesor - 0.2) ^ 0.508) × ((Perímetro / 10) ^ 0.492)
     * bct_lb = bct_kilos / 0.454
     */

    it('debería calcular BCT con valores típicos', () => {
      // Valores de prueba: ECT=45, Espesor=5.0, Perímetro=1000
      const result = calcularBCT(45, 5.0, 1000);

      // Cálculo manual:
      // bct_kilos = 0.325 * 45 * ((5.0 - 0.2) ^ 0.508) * ((1000 / 10) ^ 0.492)
      // bct_kilos = 0.325 * 45 * (4.8 ^ 0.508) * (100 ^ 0.492)
      // bct_kilos ≈ 0.325 * 45 * 2.21 * 9.73 ≈ 314.6
      // bct_lb = 314.6 / 0.454 ≈ 693

      expect(result.bct_kilos).toBeGreaterThan(250);
      expect(result.bct_kilos).toBeLessThan(400);
      expect(result.bct_lib).toBeGreaterThan(550);
      expect(result.bct_lib).toBeLessThan(900);
    });

    it('debería retornar valores redondeados a enteros', () => {
      const result = calcularBCT(45, 5.0, 1000);

      expect(Number.isInteger(result.bct_kilos)).toBe(true);
      expect(Number.isInteger(result.bct_lib)).toBe(true);
    });

    it('debería manejar espesor mínimo (cerca de 0.2)', () => {
      // Cuando espesor ≈ 0.2, el factor (espesor - 0.2) tiende a 0
      const result = calcularBCT(45, 0.3, 1000);

      expect(result.bct_kilos).toBeGreaterThan(0);
      expect(result.bct_lib).toBeGreaterThan(0);
    });

    it('debería calcular BCT proporcionalmente mayor con ECT mayor', () => {
      const result1 = calcularBCT(30, 5.0, 1000);
      const result2 = calcularBCT(60, 5.0, 1000);

      // Con el doble de ECT, BCT debería ser aproximadamente el doble
      expect(result2.bct_kilos).toBeGreaterThan(result1.bct_kilos * 1.8);
    });
  });

  describe('calcularFormulaMcKee', () => {
    it('debería calcular todos los valores en una sola llamada', () => {
      const result = calcularFormulaMcKee({
        largo: 300,
        ancho: 200,
        alto: 250,
        ect: 45,
        espesor: 5.0
      });

      expect(result.perimetro).toBe(1000);
      expect(result.bct_kilos).toBeGreaterThan(0);
      expect(result.bct_lib).toBeGreaterThan(0);
    });
  });

  describe('getFechaMcKee', () => {
    it('debería retornar fecha en formato DD-MM-YYYY HH:mm:ss', () => {
      const fecha = getFechaMcKee();

      // Formato esperado: DD-MM-YYYY HH:mm:ss
      const regex = /^\d{2}-\d{2}-\d{4} \d{2}:\d{2}:\d{2}$/;
      expect(regex.test(fecha)).toBe(true);
    });

    it('debería contener el año actual', () => {
      const fecha = getFechaMcKee();
      const year = new Date().getFullYear().toString();

      expect(fecha).toContain(year);
    });
  });
});

describe('Integración con valores reales de producción', () => {
  /**
   * Estos tests usan valores típicos de producción de INVEB
   * para verificar que los cálculos coinciden con Laravel
   */

  it('Caso típico: Caja mediana estándar', () => {
    // Dimensiones típicas de caja mediana
    const largo = 400; // mm
    const ancho = 300; // mm
    const alto = 250;  // mm
    const ect = 32;    // Cartón estándar
    const espesor = 4.5;

    const perimetro = calcularPerimetro(largo, ancho);
    expect(perimetro).toBe(1400);

    const { bct_kilos, bct_lib } = calcularBCT(ect, espesor, perimetro);

    // Valores razonables para este tipo de caja
    expect(bct_kilos).toBeGreaterThan(150);
    expect(bct_kilos).toBeLessThan(350);
  });

  it('Caso típico: Caja grande reforzada', () => {
    // Caja grande con cartón reforzado
    const largo = 600; // mm
    const ancho = 400; // mm
    const ect = 55;    // Cartón reforzado
    const espesor = 6.5;

    const perimetro = calcularPerimetro(largo, ancho);
    const { bct_kilos } = calcularBCT(ect, espesor, perimetro);

    // Mayor resistencia que caja mediana
    expect(bct_kilos).toBeGreaterThan(400);
  });
});
