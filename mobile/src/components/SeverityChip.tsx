import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import type { Severity } from '../types';
import { severityLabel } from '../utils/format';

interface Props {
  severity: Severity;
}

const colorBySeverity: Record<Severity, string> = {
  low: colors.health.green,
  medium: colors.health.yellow,
  high: colors.health.red,
};

export function SeverityChip({ severity }: Props) {
  return (
    <View style={[styles.chip, { backgroundColor: colorBySeverity[severity] + '22' }]}>
      <View style={[styles.dot, { backgroundColor: colorBySeverity[severity] }]} />
      <Text style={{ fontWeight: '700', fontSize: 12, color: colors.text }}>
        Severidad {severityLabel(severity).toLowerCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    gap: 6,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
