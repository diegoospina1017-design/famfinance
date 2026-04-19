import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { theme } from '@/lib/theme';
import { formatCurrency } from '@/lib/format';
import type { Profile } from '@/lib/database.types';

interface Balance {
  user_id: string;
  paid: number;
  fair_share: number;
  net: number;
  name: string;
}

export default function SharedBalanceScreen() {
  const profile = useAuthStore((s) => s.profile);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!profile?.household_id) return;
    setLoading(true);
    const [{ data: members }, { data: bal }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, display_name')
        .eq('household_id', profile.household_id),
      supabase
        .from('shared_balances')
        .select('*')
        .eq('household_id', profile.household_id),
    ]);

    const nameById = new Map((members ?? []).map((m: Pick<Profile, 'id' | 'display_name'>) => [m.id, m.display_name]));
    const merged: Balance[] = (members ?? []).map((m: Pick<Profile, 'id' | 'display_name'>) => {
      const row = (bal ?? []).find((b: any) => b.user_id === m.id);
      return {
        user_id: m.id,
        paid: Number(row?.paid ?? 0),
        fair_share: Number(row?.fair_share ?? 0),
        net: Number(row?.net ?? 0),
        name: nameById.get(m.id) ?? '—',
      };
    });
    setBalances(merged);
    setLoading(false);
  }, [profile?.household_id]);

  useEffect(() => {
    load();
  }, [load]);

  const totalShared = balances.reduce((s, b) => s + b.paid, 0);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={theme.colors.primary} />}
    >
      <Text style={styles.hint}>
        Gastos marcados como "compartido" se dividen en partes iguales entre los miembros del hogar.
      </Text>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total compartido (histórico)</Text>
        <Text style={styles.totalValue}>{formatCurrency(totalShared)}</Text>
      </View>

      {balances.map((b) => (
        <View key={b.user_id} style={styles.row}>
          <Text style={styles.name}>{b.name}</Text>
          <View style={styles.stats}>
            <Stat label="Pagó" value={formatCurrency(b.paid)} />
            <Stat label="Debería pagar" value={formatCurrency(b.fair_share)} />
            <Stat
              label="Neto"
              value={formatCurrency(b.net)}
              color={b.net >= 0 ? theme.colors.success : theme.colors.danger}
            />
          </View>
        </View>
      ))}

      <Text style={styles.footnote}>
        Neto positivo: los demás le deben. Neto negativo: debe a los demás.
      </Text>
    </ScrollView>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hint: { color: theme.colors.textMuted, fontSize: 12, marginBottom: 12 },
  totalCard: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: theme.radius,
    marginBottom: 16,
  },
  totalLabel: { color: theme.colors.textMuted, fontSize: 12 },
  totalValue: { color: theme.colors.text, fontWeight: '700', fontSize: 22, marginTop: 4 },
  row: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: theme.radius,
    marginBottom: 10,
  },
  name: { color: theme.colors.text, fontWeight: '700', fontSize: 16, marginBottom: 12 },
  stats: { flexDirection: 'row', justifyContent: 'space-between' },
  statLabel: { color: theme.colors.textMuted, fontSize: 11 },
  statValue: { color: theme.colors.text, fontWeight: '600', marginTop: 4 },
  footnote: { color: theme.colors.textMuted, fontSize: 11, textAlign: 'center', marginTop: 20 },
});
