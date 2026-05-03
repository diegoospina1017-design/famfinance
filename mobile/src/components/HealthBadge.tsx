import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import type { HealthLevel } from '../types';

interface Props {
  health: HealthLevel;
  size?: 'sm' | 'md';
}

const labels: Record<HealthLevel, string> = {
  green: 'Saludable',
  yellow: 'Atención',
  red: 'Necesita ayuda',
};

export function HealthBadge({ health, size = 'md' }: Props) {
  const dotSize = size === 'sm' ? 8 : 10;
  const fontSize = size === 'sm' ? 12 : 13;
  return (
    <View style={[styles.container, { paddingVertical: size === 'sm' ? 4 : 6 }]}>
      <View
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: colors.health[health],
        }}
      />
      <Text style={{ marginLeft: 6, fontWeight: '600', fontSize, color: colors.text }}>
        {labels[health]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
});
