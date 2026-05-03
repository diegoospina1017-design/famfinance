import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { ReminderCard } from '../components/ReminderCard';
import { SectionTitle } from '../components/SectionTitle';
import { usePlants } from '../context/PlantContext';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import type { MainTabsParamList, RootStackParamList } from '../navigation/types';
import type { Reminder } from '../types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabsParamList, 'Calendar'>,
  NativeStackScreenProps<RootStackParamList>
>;

interface Group {
  key: string;
  label: string;
  reminders: Reminder[];
}

export function CalendarScreen({ navigation }: Props) {
  const { plants, reminders, markWatered } = usePlants();

  const groups = useMemo<Group[]>(() => {
    const enabled = reminders.filter(r => r.enabled);
    const overdue: Reminder[] = [];
    const today: Reminder[] = [];
    const next7: Reminder[] = [];
    const later: Reminder[] = [];
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    for (const r of enabled) {
      const d = new Date(r.nextRunAt);
      if (d < startOfDay) overdue.push(r);
      else if (sameDay(d, now)) today.push(r);
      else if (d.getTime() - now.getTime() < 7 * 86400000) next7.push(r);
      else later.push(r);
    }
    const sortByDate = (arr: Reminder[]) =>
      arr.sort((a, b) => new Date(a.nextRunAt).getTime() - new Date(b.nextRunAt).getTime());
    return [
      { key: 'overdue', label: '⚠️ Atrasados', reminders: sortByDate(overdue) },
      { key: 'today', label: 'Hoy', reminders: sortByDate(today) },
      { key: 'next7', label: 'Próximos 7 días', reminders: sortByDate(next7) },
      { key: 'later', label: 'Más adelante', reminders: sortByDate(later) },
    ].filter(g => g.reminders.length > 0);
  }, [reminders]);

  if (reminders.length === 0) {
    return (
      <EmptyState
        emoji="📅"
        title="Sin recordatorios"
        description="Cuando guardes tu primera planta, vas a ver acá los próximos cuidados."
        cta={{ label: 'Tomar foto', onPress: () => navigation.navigate('Capture') }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={typography.display}>Calendario</Text>
        {groups.map(group => (
          <View key={group.key}>
            <SectionTitle title={group.label} />
            <View style={{ gap: spacing.sm }}>
              {group.reminders.map(rem => {
                const plant = plants.find(p => p.id === rem.plantId);
                return (
                  <ReminderCard
                    key={rem.id}
                    reminder={rem}
                    plant={plant}
                    onPress={() =>
                      plant && navigation.navigate('PlantDetail', { plantId: plant.id })
                    }
                    onComplete={
                      rem.type === 'watering' ? () => markWatered(rem.plantId) : undefined
                    }
                  />
                );
              })}
            </View>
          </View>
        ))}
        <Card>
          <Text style={typography.h3}>💡 Tip</Text>
          <Text style={[typography.body, { marginTop: spacing.sm }]}>
            Tocá un recordatorio para abrir la planta y editar la frecuencia.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.xxxl },
});
