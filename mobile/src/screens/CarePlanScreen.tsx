import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { InfoRow } from '../components/InfoRow';
import { TextInput } from '../components/TextInput';
import { sendFeedback } from '../api/plants';
import { usePlants } from '../context/PlantContext';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'CarePlan'>;

export function CarePlanScreen({ navigation, route }: Props) {
  const { photoUrl, analysis } = route.params;
  const { carePlan } = analysis;
  const { addPlantFromAnalysis } = usePlants();
  const [nickname, setNickname] = useState('');
  const [feedback, setFeedback] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    try {
      setSaving(true);
      const plant = await addPlantFromAnalysis({ analysis, photoUrl, nickname: nickname.trim() || undefined });
      navigation.reset({
        index: 1,
        routes: [
          { name: 'MainTabs' },
          { name: 'PlantDetail', params: { plantId: plant.id } },
        ],
      });
    } catch (e: any) {
      Alert.alert('No pudimos guardar', e?.message ?? 'Intentá de nuevo');
    } finally {
      setSaving(false);
    }
  }

  async function handleFeedback(recId: string, helpful: boolean) {
    setFeedback(prev => ({ ...prev, [recId]: helpful }));
    try {
      // Necesita un plantId real, pero pre-guardado mandamos uno temporal
      await sendFeedback({
        plantId: '00000000-0000-0000-0000-000000000000',
        recommendationId: recId,
        helpful,
      });
    } catch {
      // silencioso
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Card>
            <Text style={typography.h2}>Plan de cuidado</Text>
            <View style={{ marginTop: spacing.md }}>
              <InfoRow icon="💧" label="Riego" value={`Cada ${carePlan.wateringFrequencyDays} días`} />
              <InfoRow icon="☀️" label="Luz" value={carePlan.light} />
              <InfoRow
                icon="🌡"
                label="Temperatura"
                value={`${carePlan.temperatureMinC}°C – ${carePlan.temperatureMaxC}°C`}
              />
              <InfoRow icon="💨" label="Humedad" value={`${carePlan.humidityPreference}%`} />
              <InfoRow icon="🪴" label="Sustrato" value={carePlan.substrate} />
              <InfoRow icon="🌱" label="Fertilizante" value={carePlan.fertilizer} />
            </View>
          </Card>

          <Card>
            <Text style={typography.h2}>Próximos 7 días</Text>
            <Text style={[typography.bodyMuted, { marginTop: 4 }]}>
              Tocá 👍 / 👎 para que el sistema mejore las próximas sugerencias.
            </Text>
            <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
              {carePlan.next7Days.map(rec => (
                <View key={rec.id} style={styles.recItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '600', color: colors.text }}>{rec.label}</Text>
                    <Text style={typography.caption}>
                      {rec.dueInDays === 0 ? 'Hoy' : `En ${rec.dueInDays} día${rec.dueInDays > 1 ? 's' : ''}`}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <FeedbackBtn
                      active={feedback[rec.id] === true}
                      onPress={() => handleFeedback(rec.id, true)}
                      label="👍"
                    />
                    <FeedbackBtn
                      active={feedback[rec.id] === false}
                      onPress={() => handleFeedback(rec.id, false)}
                      label="👎"
                    />
                  </View>
                </View>
              ))}
            </View>
          </Card>

          <Card>
            <Text style={typography.h2}>Qué evitar</Text>
            <View style={{ marginTop: spacing.sm, gap: 4 }}>
              {carePlan.avoid.map((a, i) => (
                <Text key={i} style={typography.body}>
                  • {a}
                </Text>
              ))}
            </View>
          </Card>

          <Card>
            <Text style={typography.h3}>Guardar como mi planta</Text>
            <Text style={[typography.bodyMuted, { marginTop: 4, marginBottom: spacing.md }]}>
              Le ponemos un apodo y creamos los recordatorios automáticos.
            </Text>
            <TextInput
              label="Apodo (opcional)"
              value={nickname}
              onChangeText={setNickname}
              placeholder={analysis.identification.commonName}
            />
          </Card>

          <Button title="🌿 Guardar planta" onPress={handleSave} loading={saving} fullWidth />
          <Button title="Tomar otra foto" variant="ghost" onPress={() => navigation.popToTop()} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FeedbackBtn({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.fbBtn,
        active && { backgroundColor: colors.primary, borderColor: colors.primary },
        pressed && { opacity: 0.85 },
      ]}
    >
      <Text style={{ fontSize: 16, color: active ? '#fff' : colors.text }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.xxl },
  recItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
  },
  fbBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
});
