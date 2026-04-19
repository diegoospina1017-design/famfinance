export const theme = {
  colors: {
    bg: '#0f172a',
    surface: '#1e293b',
    surfaceAlt: '#334155',
    text: '#f8fafc',
    textMuted: '#94a3b8',
    primary: '#22d3ee',
    primaryDark: '#0e7490',
    danger: '#f43f5e',
    success: '#22c55e',
    warning: '#f59e0b',
    border: '#334155',
  },
  spacing: (n: number) => n * 4,
  radius: 12,
};

export type Theme = typeof theme;
