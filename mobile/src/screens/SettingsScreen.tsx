import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useAuth } from '../context/AuthContext';
import { usePlants } from '../context/PlantContext';
import {
  cancelAllNotifications,
  registerForPushNotificationsAsync,
} from '../lib/notifications';
import { env } from '../lib/env';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

export function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { plants, reminders } = usePlants();
  const [pushEnabled, setPushEnabled] = useState(false);

  async function togglePush(value: boolean) {
    if (value) {
      const { granted } = await registerForPushNotificationsAsync();
      if (!granted) {
        Alert.alert(
          'Permiso denegado',
          'Activá las notificaciones para PlantCare en Ajustes del sistema.',
        );
        return;
      }
      setPushEnabled(true);
    } else {
      await cancelAllNotifications();
      setPushEnabled(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={typography.display}>Ajustes</Text>

        <Card>
          <Text style={typography.h3}>Cuenta</Text>
          <View style={{ marginTop: spacing.sm }}>
            <Text style={typography.body}>{user?.email ?? '—'}</Text>
            {user?.displayName && (
              <Text style={typography.bodyMuted}>{user.displayName}</Text>
            )}
          </View>
        </Card>

        <Card>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={typography.h3}>Notificaciones push</Text>
              <Text style={typography.bodyMuted}>
                Avisos para regar, fertilizar y revisar plagas.
              </Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={togglePush}
              trackColor={{ true: colors.primaryLight, false: colors.border }}
              thumbColor="#fff"
            />
          </View>
        </Card>

        <Card>
          <Text style={typography.h3}>Resumen</Text>
          <View style={{ marginTop: spacing.sm, gap: 4 }}>
            <Text style={typography.body}>🪴 {plants.length} plantas guardadas</Text>
            <Text style={typography.body}>⏰ {reminders.length} recordatorios activos</Text>
          </View>
        </Card>

        <Card>
          <Text style={typography.h3}>Modo</Text>
          <Text style={[typography.bodyMuted, { marginTop: 4 }]}>
            {env.useMocks ? 'Mock data activado (sin backend)' : `Backend: ${env.apiUrl}`}
          </Text>
        </Card>

        <Button title="Cerrar sesión" variant="secondary" onPress={signOut} fullWidth />

        <Text style={[typography.caption, { textAlign: 'center', marginTop: spacing.xl }]}>
          PlantCare AI · v0.1.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.xxxl },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
