import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface Props {
  icon?: string;
  label: string;
  value: string;
}

export function InfoRow({ icon, label, value }: Props) {
  return (
    <View style={styles.row}>
      <Text style={{ fontSize: 18, width: 28 }}>{icon ?? '·'}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.textMuted, fontSize: 12 }}>{label}</Text>
        <Text style={{ color: colors.text, fontSize: 15, fontWeight: '500' }}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
});
