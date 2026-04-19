import { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuthStore } from '@/stores/useAuthStore';
import { useCategories } from '@/hooks/useCategories';
import { useTransactions } from '@/hooks/useTransactions';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';
import { formatCurrency, currentMonthKey } from '@/lib/format';
import type { Category } from '@/lib/database.types';

export default function BudgetsScreen() {
  const profile = useAuthStore((s) => s.profile);
  const month = currentMonthKey();
  const { data: categories, reload: reloadCategories, loading } = useCategories(profile?.household_id);
  const { data: txs, reload: reloadTxs } = useTransactions(profile?.household_id, month);

  const [editing, setEditing] = useState<Category | null>(null);
  const [newName, setNewName] = useState('');
  const [newBudget, setNewBudget] = useState('');

  const spentByCategory = useMemo(() => {
    const map = new Map<string | null, number>();
    for (const t of txs) {
      if (t.kind !== 'expense') continue;
      map.set(t.category_id, (map.get(t.category_id) ?? 0) + Number(t.amount));
    }
    return map;
  }, [txs]);

  const refresh = async () => {
    await Promise.all([reloadCategories(), reloadTxs()]);
  };

  const saveEditing = async () => {
    if (!editing) return;
    const budget = Number(newBudget.replace(',', '.')) || 0;
    await supabase
      .from('categories')
      .update({ name: newName.trim() || editing.name, budget_monthly: budget })
      .eq('id', editing.id);
    setEditing(null);
    await refresh();
  };

  const deleteCategory = async (c: Category) => {
    Alert.alert('Eliminar categoría', `¿Borrar "${c.name}"? Las transacciones quedarán sin categoría.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('categories').delete().eq('id', c.id);
          await refresh();
        },
      },
    ]);
  };

  const addCategory = async () => {
    if (!profile?.household_id) return;
    const { data } = await supabase
      .from('categories')
      .insert({ household_id: profile.household_id, name: 'Nueva', color: '#22d3ee' })
      .select()
      .single();
    await refresh();
    if (data) {
      setEditing(data as Category);
      setNewName(data.name);
      setNewBudget('0');
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        keyExtractor={(c) => c.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={theme.colors.primary} />}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <Text style={styles.hint}>
            Toca una categoría para editar su presupuesto mensual.
          </Text>
        }
        ListEmptyComponent={<Text style={styles.empty}>Sin categorías.</Text>}
        renderItem={({ item }) => {
          const spent = spentByCategory.get(item.id) ?? 0;
          const budget = Number(item.budget_monthly);
          const ratio = budget > 0 ? Math.min(spent / budget, 1.2) : 0;
          const over = budget > 0 && spent > budget;
          return (
            <TouchableOpacity
              style={styles.row}
              onPress={() => {
                setEditing(item);
                setNewName(item.name);
                setNewBudget(String(item.budget_monthly ?? 0));
              }}
              onLongPress={() => deleteCategory(item)}
            >
              <View style={styles.rowHead}>
                <View style={[styles.dot, { backgroundColor: item.color }]} />
                <Text style={styles.rowTitle}>{item.name}</Text>
                <Text style={[styles.rowAmount, over && { color: theme.colors.danger }]}>
                  {formatCurrency(spent)}
                  {budget > 0 ? ` / ${formatCurrency(budget)}` : ''}
                </Text>
              </View>
              {budget > 0 && (
                <View style={styles.bar}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${ratio * 100}%`,
                        backgroundColor: over ? theme.colors.danger : item.color,
                      },
                    ]}
                  />
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />

      <TouchableOpacity style={styles.fab} onPress={addCategory}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={!!editing} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Editar categoría</Text>
            <TextInput
              style={styles.input}
              value={newName}
              onChangeText={setNewName}
              placeholder="Nombre"
              placeholderTextColor={theme.colors.textMuted}
            />
            <TextInput
              style={styles.input}
              value={newBudget}
              onChangeText={setNewBudget}
              keyboardType="decimal-pad"
              placeholder="Presupuesto mensual"
              placeholderTextColor={theme.colors.textMuted}
            />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: theme.colors.surfaceAlt }]}
                onPress={() => setEditing(null)}
              >
                <Text style={{ color: theme.colors.text, fontWeight: '600' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: theme.colors.primary }]}
                onPress={saveEditing}
              >
                <Text style={{ color: theme.colors.bg, fontWeight: '700' }}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  hint: { color: theme.colors.textMuted, fontSize: 12, marginBottom: 10 },
  empty: { color: theme.colors.textMuted, textAlign: 'center', marginTop: 48 },
  row: {
    backgroundColor: theme.colors.surface,
    padding: 14,
    borderRadius: theme.radius,
    marginBottom: 10,
  },
  rowHead: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  rowTitle: { color: theme.colors.text, fontWeight: '600', flex: 1 },
  rowAmount: { color: theme.colors.text, fontWeight: '600' },
  bar: {
    height: 6,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 3,
    marginTop: 10,
    overflow: 'hidden',
  },
  barFill: { height: '100%' },
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
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: theme.colors.bg,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '700', marginBottom: 16 },
  input: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    padding: 12,
    borderRadius: theme.radius,
    marginBottom: 10,
  },
  modalBtn: { flex: 1, padding: 14, borderRadius: theme.radius, alignItems: 'center' },
});
