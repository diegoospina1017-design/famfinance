import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { HealthBadge } from '../components/HealthBadge';
import { InfoRow } from '../components/InfoRow';
import { ReminderCard } from '../components/ReminderCard';
import { SectionTitle } from '../components/SectionTitle';
import { TextInput } from '../components/TextInput';
import { usePlants } from '../context/PlantContext';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { isOverdue, relativeFromNow, shortDate } from '../utils/format';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'PlantDetail'>;

export function PlantDetailScreen({ navigation, route }: Props) {
  const { plantId } = route.params;
  const {
    plants,
    reminders,
    diagnoses,
    notes,
    markWatered,
    addNote,
    deletePlant,
  } = usePlants();
  const plant = plants.find(p => p.id === plantId);
  const plantReminders = reminders.filter(r => r.plantId === plantId);
  const plantDiagnoses = diagnoses.filter(d => d.plantId === plantId);
  const plantNotes = notes.filter(n => n.plantId === plantId);

  const [noteDraft, setNoteDraft] = useState('');

  if (!plant) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={[typography.body, { padding: spacing.xl }]}>Planta no encontrada.</Text>
      </SafeAreaView>
    );
  }

  function confirmDelete() {
    Alert.alert('Eliminar planta', '¿Seguro? Esto borra todo su histórico.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await deletePlant(plantId);
          navigation.goBack();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {plant.coverPhotoUrl ? (
          <Image source={{ uri: plant.coverPhotoUrl }} style={styles.cover} />
        ) : (
          <View style={[styles.cover, { alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ fontSize: 64 }}>🌿</Text>
          </View>
        )}

        <View>
          <Text style={typography.display}>{plant.nickname ?? plant.commonName}</Text>
          <Text style={[typography.bodyMuted, { fontStyle: 'italic' }]}>
            {plant.scientificName ?? plant.commonName}
          </Text>
          <View style={{ marginTop: spacing.sm }}>
            <HealthBadge health={plant.lastHealth} />
          </View>
        </View>

        <Card>
          <Text style={typography.h3}>Próximo riego</Text>
          <Text style={[typography.body, { marginTop: 4 }]}>
            {isOverdue(plant.nextWateringAt)
              ? '⚠️ Atrasado'
              : `${relativeFromNow(plant.nextWateringAt)} (${shortDate(plant.nextWateringAt)})`}
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
            <Button title="💧 Regar hoy" onPress={() => markWatered(plant.id)} style={{ flex: 1 }} />
            <Button
              title="📷 Nueva foto"
              variant="secondary"
              onPress={() => navigation.navigate('Capture')}
              style={{ flex: 1 }}
            />
          </View>
          <Button
            title="💬 Preguntale a la IA"
            variant="secondary"
            onPress={() => navigation.navigate('Chat', { plantId })}
            style={{ marginTop: spacing.sm }}
            fullWidth
          />
        </Card>

        <Card>
          <Text style={typography.h3}>Cuidado</Text>
          <View style={{ marginTop: spacing.sm }}>
            <InfoRow icon="💧" label="Riego" value={`Cada ${plant.wateringFrequencyDays} días`} />
            <InfoRow icon="☀️" label="Luz" value={plant.light} />
            <InfoRow
              icon="🌡"
              label="Temperatura"
              value={`${plant.temperatureMinC}°C – ${plant.temperatureMaxC}°C`}
            />
            <InfoRow icon="💨" label="Humedad" value={`${plant.humidityPreference}%`} />
            <InfoRow icon="🪴" label="Sustrato" value={plant.substrate} />
            <InfoRow icon="🌱" label="Fertilizante" value={plant.fertilizer} />
          </View>
        </Card>

        <View>
          <SectionTitle title="Recordatorios" />
          {plantReminders.length === 0 ? (
            <Card>
              <Text style={typography.bodyMuted}>Sin recordatorios.</Text>
            </Card>
          ) : (
            <View style={{ gap: spacing.sm }}>
              {plantReminders.map(rem => (
                <ReminderCard key={rem.id} reminder={rem} plant={plant} />
              ))}
            </View>
          )}
        </View>

        <View>
          <SectionTitle title={`Histórico de salud (${plantDiagnoses.length})`} />
          {plantDiagnoses.length === 0 ? (
            <Card>
              <Text style={typography.bodyMuted}>Aún no hay diagnósticos guardados.</Text>
            </Card>
          ) : (
            <View style={{ gap: spacing.sm }}>
              {plantDiagnoses.map(d => (
                <Card key={d.id}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <HealthBadge health={d.health} size="sm" />
                    <Text style={typography.caption}>{shortDate(d.createdAt)}</Text>
                  </View>
                  <Text style={[typography.body, { marginTop: spacing.sm }]}>{d.summary}</Text>
                </Card>
              ))}
            </View>
          )}
        </View>

        <View>
          <SectionTitle title="Notas" />
          <TextInput
            multiline
            value={noteDraft}
            onChangeText={setNoteDraft}
            placeholder="Agregá una observación..."
            style={{ minHeight: 80, textAlignVertical: 'top' }}
          />
          <Button
            title="Guardar nota"
            variant="secondary"
            onPress={() => {
              if (!noteDraft.trim()) return;
              addNote(plantId, noteDraft.trim());
              setNoteDraft('');
            }}
            style={{ marginTop: spacing.sm }}
          />
          <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
            {plantNotes.map(n => (
              <Card key={n.id}>
                <Text style={typography.caption}>{shortDate(n.createdAt)}</Text>
                <Text style={[typography.body, { marginTop: 4 }]}>{n.body}</Text>
              </Card>
            ))}
          </View>
        </View>

        <Button title="Eliminar planta" variant="danger" onPress={confirmDelete} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.xxxl },
  cover: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
  },
});
