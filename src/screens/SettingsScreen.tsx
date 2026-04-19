import { useCallback, useEffect, useState } from 'react';
import { Alert, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { theme } from '@/lib/theme';
import type { Household } from '@/lib/database.types';

export default function SettingsScreen() {
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);
  const [household, setHousehold] = useState<Household | null>(null);

  const load = useCallback(async () => {
    if (!profile?.household_id) return;
    const { data } = await supabase
      .from('households')
      .select('*')
      .eq('id', profile.household_id)
      .single();
    setHousehold((data as Household) ?? null);
  }, [profile?.household_id]);

  useEffect(() => {
    load();
  }, [load]);

  const shareInvite = async () => {
    if (!household) return;
    try {
      await Share.share({
        message: `Únete a ${household.name} en famfinance con el código: ${household.invite_code}`,
      });
    } catch (e: any) {
      Alert.alert('No pudimos compartir', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Section label="Perfil">
        <Text style={styles.value}>{profile?.display_name ?? '—'}</Text>
      </Section>

      <Section label="Hogar">
        <Text style={styles.value}>{household?.name ?? '—'}</Text>
        <Text style={styles.code}>Código: {household?.invite_code ?? '—'}</Text>
      </Section>

      <TouchableOpacity style={styles.primaryBtn} onPress={shareInvite} disabled={!household}>
        <Text style={styles.primaryBtnText}>Invitar a mi pareja</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.primaryBtn, { backgroundColor: theme.colors.surface, marginTop: 10 }]}
        onPress={() =>
          Alert.alert('Cerrar sesión', '¿Seguro?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Salir', style: 'destructive', onPress: signOut },
          ])
        }
      >
        <Text style={[styles.primaryBtnText, { color: theme.colors.text }]}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg, padding: 20 },
  section: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: theme.radius,
    marginBottom: 12,
  },
  label: { color: theme.colors.textMuted, fontSize: 12, textTransform: 'uppercase', marginBottom: 6 },
  value: { color: theme.colors.text, fontSize: 16, fontWeight: '600' },
  code: { color: theme.colors.primary, marginTop: 6, fontFamily: 'Menlo' },
  primaryBtn: {
    backgroundColor: theme.colors.primary,
    padding: 14,
    borderRadius: theme.radius,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: { color: theme.colors.bg, fontWeight: '700', fontSize: 16 },
});
