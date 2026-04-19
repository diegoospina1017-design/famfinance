import { useMemo } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuthStore } from '@/stores/useAuthStore';
import { useTransactions, type TransactionWithCategory } from '@/hooks/useTransactions';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';
import { formatCurrency, formatDate, currentMonthKey } from '@/lib/format';
import type { AppStackParamList } from '@/navigation/RootNavigator';

type Nav = NativeStackNavigationProp<AppStackParamList>;

export default function TransactionsScreen() {
  const navigation = useNavigation<Nav>();
  const profile = useAuthStore((s) => s.profile);
  const month = currentMonthKey();
  const { data, loading, reload } = useTransactions(profile?.household_id, month);

  const { income, expense } = useMemo(() => {
    let i = 0;
    let e = 0;
    for (const t of data) {
      if (t.kind === 'income') i += Number(t.amount);
      else e += Number(t.amount);
    }
    return { income: i, expense: e };
  }, [data]);

  const onDelete = (t: TransactionWithCategory) => {
    Alert.alert('Eliminar', '¿Seguro que quieres borrar esta transacción?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('transactions').delete().eq('id', t.id);
          await reload();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Ingresos</Text>
          <Text style={[styles.summaryValue, { color: theme.colors.success }]}>
            {formatCurrency(income)}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Gastos</Text>
          <Text style={[styles.summaryValue, { color: theme.colors.danger }]}>
            {formatCurrency(expense)}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Balance</Text>
          <Text style={styles.summaryValue}>{formatCurrency(income - expense)}</Text>
        </View>
      </View>

      <FlatList
        data={data}
        keyExtractor={(t) => t.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={theme.colors.primary} />}
        ListEmptyComponent={
          <Text style={styles.empty}>Sin movimientos este mes. Añade el primero.</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onLongPress={() => onDelete(item)}
            onPress={() => navigation.navigate('AddTransaction', { id: item.id })}
          >
            <View style={[styles.dot, { backgroundColor: item.category?.color ?? theme.colors.textMuted }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>
                {item.category?.name ?? 'Sin categoría'}
                {item.split === 'shared' ? '  ·  🤝' : ''}
              </Text>
              <Text style={styles.rowSubtitle}>
                {formatDate(item.date)} {item.note ? `· ${item.note}` : ''}
              </Text>
            </View>
            <Text
              style={[
                styles.amount,
                { color: item.kind === 'income' ? theme.colors.success : theme.colors.danger },
              ]}
            >
              {item.kind === 'income' ? '+' : '-'}
              {formatCurrency(Number(item.amount))}
            </Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddTransaction')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  summary: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: theme.colors.surface,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: theme.radius,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { color: theme.colors.textMuted, fontSize: 12 },
  summaryValue: { color: theme.colors.text, fontWeight: '700', marginTop: 4 },
  empty: { color: theme.colors.textMuted, textAlign: 'center', marginTop: 48 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius,
  },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  rowTitle: { color: theme.colors.text, fontWeight: '600' },
  rowSubtitle: { color: theme.colors.textMuted, fontSize: 12, marginTop: 2 },
  amount: { fontWeight: '700' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: theme.colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: { fontSize: 28, color: theme.colors.bg, fontWeight: '700', marginTop: -2 },
});
