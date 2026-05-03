import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Identification'>;

export function IdentificationScreen({ navigation, route }: Props) {
  const { photoUrl, analysis } = route.params;
  const { identification } = analysis;
  const confidencePct = Math.round(identification.confidence * 100);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Image source={{ uri: photoUrl }} style={styles.image} />

        <Card>
          <Text style={typography.caption}>Identificación</Text>
          <Text style={[typography.display, { marginTop: 4 }]}>{identification.commonName}</Text>
          {identification.scientificName && (
            <Text style={[typography.bodyMuted, { fontStyle: 'italic', marginTop: 2 }]}>
              {identification.scientificName}
            </Text>
          )}
          <View style={styles.confidenceWrap}>
            <View style={styles.confidenceBar}>
              <View style={[styles.confidenceFill, { width: `${confidencePct}%` }]} />
            </View>
            <Text style={{ marginLeft: spacing.md, fontWeight: '700', color: colors.primary }}>
              {confidencePct}%
            </Text>
          </View>
          <Text style={[typography.body, { marginTop: spacing.md }]}>
            {identification.description}
          </Text>
        </Card>

        <Button
          title="Ver diagnóstico de salud →"
          onPress={() => navigation.navigate('Diagnosis', { photoUrl, analysis })}
          fullWidth
        />
        <Button
          title="No es esta planta"
          variant="ghost"
          onPress={() => navigation.popToTop()}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, gap: spacing.lg },
  image: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
  },
  confidenceWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  confidenceBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 4,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
});
