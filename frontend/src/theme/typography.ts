/**
 * Monitor One Typography - INVEB
 * Font: Poppins
 */

export const typography = {
  fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",

  weights: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  sizes: {
    h1: '2rem',      // 32px
    h2: '1.5rem',    // 24px
    h3: '1.25rem',   // 20px
    h4: '1rem',      // 16px
    body: '0.875rem', // 14px
    small: '0.75rem', // 12px
    tiny: '0.625rem', // 10px
  },

  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export type Typography = typeof typography;
