/**
 * Monitor One Theme - INVEB
 * Consolidated theme object for styled-components
 */

import { colors } from './colors';
import { typography } from './typography';
import { spacing, radius, shadows, transitions } from './spacing';

export const theme = {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  transitions,
} as const;

export type Theme = typeof theme;

// Re-export individual modules
export { colors } from './colors';
export { typography } from './typography';
export { spacing, radius, shadows, transitions } from './spacing';
