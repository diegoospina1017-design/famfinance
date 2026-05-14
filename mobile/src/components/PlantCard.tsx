import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { HealthBadge } from './HealthBadge';
import { isOverdue, relativeFromNow } from '../utils/format';
import type { Plant } from '../types';

interface Props {
  plant: Plant;
  onPress: () => void;
}

export function PlantCard({ plant, onPress }: Props) {
  const overdue = isOverdue(plant.nextWateringAt);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.container, pressed && { opacity: 0.85 }]}>
      {plant.coverPhotoUrl ? (
        <Image source={{ uri: plant.coverPhotoUrl }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Text style={{ fontSize: 32 }}>🌿</Text>
        </View>
      )}
      <View style={{ flex: 1, justifyContent: 'space-between' }}>
        <View>
          <Text style={typography.h3} numberOfLines={1}>
            {plant.nickname ?? plant.commonName}
          </Text>
          <Text style={[typography.caption, { marginTop: 2 }]} numberOfLines={1}>
            {plant.scientificName ?? plant.commonName}
          </Text>
        </View>
        <View style={styles.footer}>
          <HealthBadge health={plant.lastHealth} size="sm" />
          <Text
            style={[
              typography.caption,
              { color: overdue ? colors.danger : colors.textMuted, fontWeight: '600' },
            ]}
          >
            💧 {overdue ? 'Atrasado' : relativeFromNow(plant.nextWateringAt)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
