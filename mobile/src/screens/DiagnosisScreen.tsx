import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { HealthBadge } from '../components/HealthBadge';
import { SeverityChip } from '../components/SeverityChip';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Diagnosis'>;

export function DiagnosisScreen({ navigation, route }: Props) {
  const { photoUrl, analysis } = route.params;
  const { diagnosis } = analysis;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <HealthBadge health={diagnosis.health} />
          <SeverityChip severity={diagnosis.severity} />
        </View>

        <Card>
          <Text style={typography.h2}>Diagnóstico</Text>
          <Text style={[typography.body, { marginTop: spacing.sm }]}>{diagnosis.summary}</Text>
        </Card>

        {diagnosis.lowConfidenceWarning && (
          <Card style={{ borderColor: colors.warning, backgroundColor: '#FFF8EC' }}>
            <Text style={[typography.h3, { color: '#A36B00' }]}>⚠️ Foto insuficiente</Text>
            <Text style={[typography.body, { marginTop: spacing.sm }]}>
              {diagnosis.lowConfidenceReason ?? 'La foto no permite un diagnóstico confiable. Intentá con mejor luz y enfocando la planta entera.'}
            </Text>
            <Button
              title="Tomar otra foto"
              variant="secondary"
              onPress={() => navigation.navigate('Capture')}
              style={{ marginTop: spacing.md }}
            />
          </Card>
        )}

        {diagnosis.issues.length === 0 ? (
          <Card>
            <Text style={typography.h3}>✅ Sin problemas detectados</Text>
            <Text style={[typography.bodyMuted, { marginTop: spacing.sm }]}>
              Tu planta se ve sana. Mantené la rutina de cuidado actual.
            </Text>
          </Card>
        ) : (
          <View style={{ gap: spacing.sm }}>
            <Text style={typography.h2}>Detectamos {diagnosis.issues.length} señal{diagnosis.issues.length !== 1 ? 'es' : ''}</Text>
            {diagnosis.issues.map((issue, idx) => (
              <Card key={`${issue.key}-${idx}`}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={typography.h3}>{issue.label}</Text>
                  <SeverityChip severity={issue.severity} />
                </View>
                <Text style={[typography.body, { marginTop: spacing.sm }]}>{issue.detail}</Text>
              </Card>
            ))}
          </View>
        )}

        <Button
          title="Ver plan de cuidado →"
          onPress={() => navigation.navigate('CarePlan', { photoUrl, analysis })}
          fullWidth
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.xxl },
});
