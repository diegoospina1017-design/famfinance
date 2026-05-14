import { TextStyle } from 'react-native';
import { colors } from './colors';

export const typography = {
  display: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  } satisfies TextStyle,
  h1: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  } satisfies TextStyle,
  h2: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  } satisfies TextStyle,
  h3: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  } satisfies TextStyle,
  body: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  } satisfies TextStyle,
  bodyMuted: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
  } satisfies TextStyle,
  caption: {
    fontSize: 13,
    color: colors.textMuted,
  } satisfies TextStyle,
  button: {
    fontSize: 15,
    fontWeight: '600',
  } satisfies TextStyle,
};
