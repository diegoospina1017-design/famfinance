import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { theme } from '@/lib/theme';

export default function HouseholdOnboardingScreen() {
  const profile = useAuthStore((s) => s.profile);
  const session = useAuthStore((s) => s.session);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const signOut = useAuthStore((s) => s.signOut);
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [name, setName] = useState('Nuestro hogar');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const createHousehold = async () => {
    if (!profile) return;
    setBusy(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      console.log('[createHousehold] session.user.id =', session?.user.id);
      console.log('[createHousehold] supabase.auth.getUser() =', authData.user?.id);
      console.log('[createHousehold] profile.id =', profile.id);

      const { data: hh, error } = await supabase
        .from('households')
        .insert({ name: name.trim() })
        .select()
        .single();
      if (error) throw error;
      const { error: upErr } = await supabase
        .from('profiles')
        .update({ household_id: hh.id })
        .eq('id', profile.id);
      if (upErr) throw upErr;
      await seedDefaultCategories(hh.id);
      await refreshProfile();
    } catch (e: any) {
      Alert.alert('No pudimos crear el hogar', e.message);
    } finally {
      setBusy(false);
    }
  };

  const joinHousehold = async () => {
    if (!profile || !code.trim()) return;
    setBusy(true);
    try {
      const { data: hh, error } = await supabase
        .from('households')
        .select('id')
        .eq('invite_code', code.trim())
        .maybeSingle();
      if (error) throw error;
      if (!hh) throw new Error('Código no encontrado');
      const { error: upErr } = await supabase
        .from('profiles')
        .update({ household_id: hh.id })
        .eq('id', profile.id);
      if (upErr) throw upErr;
      await refreshProfile();
    } catch (e: any) {
      Alert.alert('No pudimos unirnos al hogar', e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configurar hogar</Text>
      <Text style={styles.subtitle}>
        Un "hogar" es el espacio compartido con tu pareja. Crea uno nuevo o únete con el código que
        te compartan.
      </Text>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, mode === 'create' && styles.tabActive]}
          onPress={() => setMode('create')}
        >
          <Text style={[styles.tabText, mode === 'create' && styles.tabTextActive]}>Crear</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, mode === 'join' && styles.tabActive]}
          onPress={() => setMode('join')}
        >
          <Text style={[styles.tabText, mode === 'join' && styles.tabTextActive]}>Unirme</Text>
        </TouchableOpacity>
      </View>

      {mode === 'create' ? (
        <>
          <TextInput
            placeholder="Nombre del hogar"
            placeholderTextColor={theme.colors.textMuted}
            style={styles.input}
            value={name}
            onChangeText={setName}
          />
          <TouchableOpacity style={styles.primaryBtn} onPress={createHousehold} disabled={busy}>
            <Text style={styles.primaryBtnText}>{busy ? 'Creando...' : 'Crear hogar'}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput
            placeholder="Código de invitación"
            placeholderTextColor={theme.colors.textMuted}
            autoCapitalize="none"
            style={styles.input}
            value={code}
            onChangeText={setCode}
          />
          <TouchableOpacity style={styles.primaryBtn} onPress={joinHousehold} disabled={busy}>
            <Text style={styles.primaryBtnText}>{busy ? 'Uniendo...' : 'Unirme'}</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity onPress={signOut} style={{ marginTop: 24 }}>
        <Text style={{ color: theme.colors.textMuted, textAlign: 'center' }}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

async function seedDefaultCategories(householdId: string) {
  const defaults = [
    { name: 'Mercado', color: '#22c55e', budget_monthly: 0 },
    { name: 'Vivienda', color: '#3b82f6', budget_monthly: 0 },
    { name: 'Transporte', color: '#f59e0b', budget_monthly: 0 },
    { name: 'Salud', color: '#ef4444', budget_monthly: 0 },
    { name: 'Ocio', color: '#a855f7', budget_monthly: 0 },
    { name: 'Otros', color: '#94a3b8', budget_monthly: 0 },
  ];
  await supabase
    .from('categories')
    .insert(defaults.map((c) => ({ ...c, household_id: householdId })));
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg, padding: 24, justifyContent: 'center' },
  title: { color: theme.colors.text, fontSize: 24, fontWeight: '700', marginBottom: 8 },
  subtitle: { color: theme.colors.textMuted, marginBottom: 24 },
  tabs: { flexDirection: 'row', marginBottom: 20, backgroundColor: theme.colors.surface, borderRadius: theme.radius, padding: 4 },
  tab: { flex: 1, padding: 10, alignItems: 'center', borderRadius: theme.radius - 2 },
  tabActive: { backgroundColor: theme.colors.primary },
  tabText: { color: theme.colors.textMuted, fontWeight: '600' },
  tabTextActive: { color: theme.colors.bg },
  input: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    padding: 14,
    borderRadius: theme.radius,
    marginBottom: 12,
  },
  primaryBtn: {
    backgroundColor: theme.colors.primary,
    padding: 14,
    borderRadius: theme.radius,
    alignItems: 'center',
  },
  primaryBtnText: { color: theme.colors.bg, fontWeight: '700', fontSize: 16 },
});
