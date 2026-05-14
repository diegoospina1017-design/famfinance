import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { Button } from './Button';

interface Props {
  emoji?: string;
  title: string;
  description?: string;
  cta?: { label: string; onPress: () => void };
}

export function EmptyState({ emoji = '🌱', title, description, cta }: Props) {
  return (
    <View style={styles.container}>
      <Text style={{ fontSize: 56 }}>{emoji}</Text>
      <Text style={[typography.h2, { textAlign: 'center', marginTop: spacing.md }]}>{title}</Text>
      {description && (
        <Text
          style={[typography.bodyMuted, { textAlign: 'center', marginTop: spacing.sm }]}
        >
          {description}
        </Text>
      )}
      {cta && <Button title={cta.label} onPress={cta.onPress} style={{ marginTop: spacing.lg }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
});
