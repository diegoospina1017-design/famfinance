/**
 * Paleta "wellness/nature": verdes profundos, cremas, acentos cálidos.
 */
export const colors = {
  primary: '#0E5A3F',
  primaryDark: '#093E2C',
  primaryLight: '#2D8B65',
  accent: '#E08C3C',
  background: '#F7F4EE',
  card: '#FFFFFF',
  surfaceMuted: '#F0EBE2',
  text: '#1A2E27',
  textMuted: '#637773',
  border: '#E2DDD1',
  danger: '#C0392B',
  warning: '#E0A52C',
  success: '#2D8B65',
  health: {
    green: '#2D8B65',
    yellow: '#E0A52C',
    red: '#C0392B',
  },
} as const;

export type ColorPalette = typeof colors;
