/**
 * Monitor One Color Palette - INVEB
 * Based on: FASE_5_5B_ESTANDARES_MONITOR_ONE.md
 */

export const colors = {
  // Primary Colors
  primary: '#003A81',
  primaryDark: '#002654',
  secondary: '#EC7126',
  accent: '#05C1CA',
  cardHeader: '#01214d',
  corporate: '#6D7883',

  // Background Colors
  bgWhite: '#FFFFFF',
  bgLight: '#F2F2F2',
  bgMedium: '#E9ECEF',
  sidebarBg: '#1A1A2E',
  bgBlueLight: '#D1E3F8',

  // State Colors
  success: '#28A745',
  warning: '#FFC107',
  danger: '#DC3545',
  error: '#DC3545',
  info: '#17A2B8',
  active: '#00E676',
  disabled: '#9E9E9E',

  // Text Colors
  textPrimary: '#212529',
  textSecondary: '#6C757D',
  textMuted: '#9E9E9E',
  textWhite: '#FFFFFF',
  link: '#003A81',
  linkHover: '#002654',

  // Border Colors
  border: '#dee2e6',
  borderFocus: '#05C1CA',
} as const;

export type Colors = typeof colors;
