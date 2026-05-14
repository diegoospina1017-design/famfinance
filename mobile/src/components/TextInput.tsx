import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  TextInputProps,
  View,
} from 'react-native';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

interface Props extends TextInputProps {
  label?: string;
  error?: string | null;
}

export function TextInput({ label, error, style, ...rest }: Props) {
  return (
    <View style={{ gap: 6 }}>
      {label && <Text style={typography.caption}>{label}</Text>}
      <RNTextInput
        placeholderTextColor={colors.textMuted}
        style={[styles.input, error && { borderColor: colors.danger }, style]}
        {...rest}
      />
      {error && <Text style={[typography.caption, { color: colors.danger }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.card,
    fontSize: 15,
    color: colors.text,
  },
});
