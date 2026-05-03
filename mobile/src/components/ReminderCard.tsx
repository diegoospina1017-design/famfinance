import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { isOverdue, reminderEmoji, reminderLabel, shortDate } from '../utils/format';
import type { Plant, Reminder } from '../types';

interface Props {
  reminder: Reminder;
  plant?: Plant;
  onPress?: () => void;
  onComplete?: () => void;
}

export function ReminderCard({ reminder, plant, onPress, onComplete }: Props) {
  const overdue = isOverdue(reminder.nextRunAt);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.container, pressed && { opacity: 0.85 }]}>
      <Text style={{ fontSize: 28 }}>{reminderEmoji(reminder.type)}</Text>
      <View style={{ flex: 1 }}>
        <Text style={typography.h3}>{reminderLabel(reminder.type)}</Text>
        <Text style={typography.caption} numberOfLines={1}>
          {plant?.nickname ?? plant?.commonName ?? 'Planta'} · cada {reminder.frequencyDays}d
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text
          style={{
            fontWeight: '700',
            color: overdue ? colors.danger : colors.text,
            fontSize: 13,
          }}
        >
          {overdue ? 'Hoy' : shortDate(reminder.nextRunAt)}
        </Text>
        {onComplete && (
          <Pressable
            onPress={onComplete}
            style={({ pressed }) => [styles.complete, pressed && { opacity: 0.8 }]}
          >
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Hecho</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  complete: {
    marginTop: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
});
