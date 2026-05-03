import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CompositeScreenProps, useNavigation } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { PlantCard } from '../components/PlantCard';
import { ReminderCard } from '../components/ReminderCard';
import { SectionTitle } from '../components/SectionTitle';
import { EmptyState } from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import { usePlants } from '../context/PlantContext';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import type { MainTabsParamList, RootStackParamList } from '../navigation/types';
import { isOverdue } from '../utils/format';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabsParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function HomeScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { plants, reminders, markWatered } = usePlants();

  const todayReminders = useMemo(() => {
    const sorted = [...reminders]
      .filter(r => r.enabled)
      .sort((a, b) => new Date(a.nextRunAt).getTime() - new Date(b.nextRunAt).getTime());
    return sorted.slice(0, 3);
  }, [reminders]);

  const overdueCount = reminders.filter(r => r.enabled && isOverdue(r.nextRunAt)).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View>
          <Text style={typography.caption}>Hola{user?.displayName ? `, ${user.displayName}` : ''} 👋</Text>
          <Text style={[typography.display, { marginTop: 4 }]}>Tu jardín hoy</Text>
        </View>

        <Card style={styles.heroCard}>
          <Text style={{ color: '#fff', fontSize: 13, opacity: 0.9 }}>Identificación con IA</Text>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700', marginTop: 4 }}>
            ¿Tenés una planta nueva?
          </Text>
          <Text style={{ color: '#fff', opacity: 0.85, marginTop: 6 }}>
            Tomá una foto y te decimos qué es, cómo está y cómo cuidarla.
          </Text>
          <Button
            title="📷 Tomar nueva foto"
            variant="secondary"
            onPress={() => navigation.navigate('Capture')}
            style={{ marginTop: spacing.lg, alignSelf: 'flex-start' }}
          />
        </Card>

        {overdueCount > 0 && (
          <View style={styles.alert}>
            <Text style={{ fontSize: 22 }}>⚠️</Text>
            <Text style={{ flex: 1, color: colors.text, fontWeight: '600' }}>
              Tenés {overdueCount} cuidado{overdueCount > 1 ? 's' : ''} atrasado{overdueCount > 1 ? 's' : ''}.
            </Text>
          </View>
        )}

        <View>
          <SectionTitle
            title="Próximos cuidados"
            action={
              reminders.length > 3
                ? { label: 'Ver todos', onPress: () => navigation.navigate('Calendar') }
                : undefined
            }
          />
          {todayReminders.length === 0 ? (
            <Card>
              <Text style={typography.bodyMuted}>No hay cuidados pendientes. 🎉</Text>
            </Card>
          ) : (
            <View style={{ gap: spacing.sm }}>
              {todayReminders.map(rem => {
                const plant = plants.find(p => p.id === rem.plantId);
                return (
                  <ReminderCard
                    key={rem.id}
                    reminder={rem}
                    plant={plant}
                    onPress={() => plant && navigation.navigate('PlantDetail', { plantId: plant.id })}
                    onComplete={
                      rem.type === 'watering' ? () => markWatered(rem.plantId) : undefined
                    }
                  />
                );
              })}
            </View>
          )}
        </View>

        <View>
          <SectionTitle
            title="Mis plantas"
            action={{ label: 'Ver todas', onPress: () => navigation.navigate('MyPlants') }}
          />
          {plants.length === 0 ? (
            <EmptyState
              emoji="🪴"
              title="Aún no agregaste plantas"
              description="Tomá tu primera foto para empezar."
              cta={{ label: 'Tomar foto', onPress: () => navigation.navigate('Capture') }}
            />
          ) : (
            <View style={{ gap: spacing.sm }}>
              {plants.slice(0, 3).map(plant => (
                <PlantCard
                  key={plant.id}
                  plant={plant}
                  onPress={() => navigation.navigate('PlantDetail', { plantId: plant.id })}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.xl, gap: spacing.xl, paddingBottom: spacing.xxxl },
  heroCard: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: '#FFF3E5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F5D6A4',
  },
});
