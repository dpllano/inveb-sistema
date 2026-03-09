/**
 * Monitor One Spacing System - INVEB
 */

export const spacing = {
  xs: '0.25rem',  // 4px
  sm: '0.5rem',   // 8px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
  xxl: '3rem',    // 48px
} as const;

export const radius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  full: '50%',
} as const;

export const shadows = {
  sm: '0 1px 3px rgba(0, 0, 0, 0.08)',
  md: '0 2px 8px rgba(0, 0, 0, 0.1)',
  lg: '0 4px 16px rgba(0, 0, 0, 0.12)',
  hover: '0 4px 12px rgba(0, 58, 129, 0.15)',
} as const;

export const transitions = {
  fast: '0.15s ease',
  normal: '0.2s ease',
  slow: '0.3s ease',
} as const;

export type Spacing = typeof spacing;
export type Radius = typeof radius;
export type Shadows = typeof shadows;
