import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

interface Props {
  title: string;
  action?: { label: string; onPress: () => void };
}

export function SectionTitle({ title, action }: Props) {
  return (
    <View style={styles.row}>
      <Text style={typography.h2}>{title}</Text>
      {action && (
        <Text
          onPress={action.onPress}
          style={{ color: colors.primary, fontWeight: '600' }}
        >
          {action.label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
});
