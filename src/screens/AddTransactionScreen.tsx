import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCategories } from '@/hooks/useCategories';
import { theme } from '@/lib/theme';
import type { AppStackParamList } from '@/navigation/RootNavigator';
import type { Kind, Split } from '@/lib/database.types';

type Props = NativeStackScreenProps<AppStackParamList, 'AddTransaction'>;

export default function AddTransactionScreen({ navigation, route }: Props) {
  const profile = useAuthStore((s) => s.profile);
  const { data: categories } = useCategories(profile?.household_id);
  const editingId = route.params?.id;

  const [kind, setKind] = useState<Kind>('expense');
  const [split, setSplit] = useState<Split>('personal');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!editingId) return;
    (async () => {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', editingId)
        .single();
      if (data) {
        setKind(data.kind as Kind);
        setSplit(data.split as Split);
        setAmount(String(data.amount));
        setCategoryId(data.category_id);
        setNote(data.note ?? '');
        setDate(data.date);
      }
    })();
  }, [editingId]);

  const onSave = async () => {
    if (!profile?.household_id) return;
    const numeric = Number(amount.replace(',', '.'));
    if (!Number.isFinite(numeric) || numeric <= 0) {
      Alert.alert('Monto inválido', 'Ingresa un número mayor a cero.');
      return;
    }
    setBusy(true);
    try {
      const payload = {
        household_id: profile.household_id,
        user_id: profile.id,
        category_id: categoryId,
        kind,
        split,
        amount: numeric,
        date,
        note: note.trim() || null,
      };
      const { error } = editingId
        ? await supabase.from('transactions').update(payload).eq('id', editingId)
        : await supabase.from('transactions').insert(payload);
      if (error) throw error;
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('No pudimos guardar', e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.toggleRow}>
          <Toggle active={kind === 'expense'} label="Gasto" onPress={() => setKind('expense')} />
          <Toggle active={kind === 'income'} label="Ingreso" onPress={() => setKind('income')} />
        </View>

        <Text style={styles.label}>Monto</Text>
        <TextInput
          placeholder="0"
          placeholderTextColor={theme.colors.textMuted}
          keyboardType="decimal-pad"
          style={styles.amountInput}
          value={amount}
          onChangeText={setAmount}
        />

        <Text style={styles.label}>Categoría</Text>
        <View style={styles.chips}>
          {categories.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[
                styles.chip,
                categoryId === c.id && { borderColor: c.color, backgroundColor: c.color + '22' },
              ]}
              onPress={() => setCategoryId(c.id)}
            >
              <View style={[styles.dot, { backgroundColor: c.color }]} />
              <Text style={styles.chipText}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Tipo</Text>
        <View style={styles.toggleRow}>
          <Toggle active={split === 'personal'} label="Personal" onPress={() => setSplit('personal')} />
          <Toggle active={split === 'shared'} label="Compartido" onPress={() => setSplit('shared')} />
        </View>

        <Text style={styles.label}>Fecha (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder="2025-01-15"
          placeholderTextColor={theme.colors.textMuted}
        />

        <Text style={styles.label}>Nota (opcional)</Text>
        <TextInput
          style={styles.input}
          value={note}
          onChangeText={setNote}
          placeholder="p.ej. mercado de la semana"
          placeholderTextColor={theme.colors.textMuted}
        />

        <TouchableOpacity style={styles.primaryBtn} onPress={onSave} disabled={busy}>
          <Text style={styles.primaryBtnText}>{busy ? 'Guardando...' : 'Guardar'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Toggle({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.toggle, active && styles.toggleActive]} onPress={onPress}>
      <Text style={[styles.toggleText, active && styles.toggleTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  label: { color: theme.colors.textMuted, marginTop: 18, marginBottom: 8, fontSize: 12, textTransform: 'uppercase' },
  toggleRow: { flexDirection: 'row', gap: 8 },
  toggle: {
    flex: 1,
    padding: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  toggleActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  toggleText: { color: theme.colors.textMuted, fontWeight: '600' },
  toggleTextActive: { color: theme.colors.bg },
  amountInput: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    padding: 18,
    borderRadius: theme.radius,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  input: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    padding: 14,
    borderRadius: theme.radius,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipText: { color: theme.colors.text, fontWeight: '500' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  primaryBtn: {
    marginTop: 24,
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: theme.radius,
    alignItems: 'center',
  },
  primaryBtnText: { color: theme.colors.bg, fontWeight: '700', fontSize: 16 },
});
