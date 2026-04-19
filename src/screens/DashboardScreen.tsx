import { useMemo } from 'react';
import { Dimensions, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PieChart, BarChart } from 'react-native-chart-kit';

import { useAuthStore } from '@/stores/useAuthStore';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { theme } from '@/lib/theme';
import { formatCurrency, currentMonthKey } from '@/lib/format';

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundGradientFrom: theme.colors.bg,
  backgroundGradientTo: theme.colors.bg,
  color: (opacity = 1) => `rgba(34, 211, 238, ${opacity})`,
  labelColor: () => theme.colors.textMuted,
  barPercentage: 0.6,
  decimalPlaces: 0,
};

export default function DashboardScreen() {
  const profile = useAuthStore((s) => s.profile);
  const month = currentMonthKey();
  const { data: txs, loading, reload } = useTransactions(profile?.household_id, month);
  const { data: categories } = useCategories(profile?.household_id);

  const { income, expense, byCategory, last6Months } = useMemo(() => {
    let i = 0;
    let e = 0;
    const cat = new Map<string, number>();
    for (const t of txs) {
      if (t.kind === 'income') i += Number(t.amount);
      else {
        e += Number(t.amount);
        const key = t.category?.name ?? 'Sin categoría';
        cat.set(key, (cat.get(key) ?? 0) + Number(t.amount));
      }
    }
    return { income: i, expense: e, byCategory: cat, last6Months: buildLast6Months(txs) };
  }, [txs]);

  const pieData = Array.from(byCategory.entries())
    .map(([name, amount]) => {
      const cat = categories.find((c) => c.name === name);
      return {
        name,
        amount,
        color: cat?.color ?? theme.colors.textMuted,
        legendFontColor: theme.colors.text,
        legendFontSize: 12,
      };
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={reload} tintColor={theme.colors.primary} />
      }
    >
      <Text style={styles.sectionTitle}>Este mes</Text>
      <View style={styles.cards}>
        <Card label="Ingresos" value={formatCurrency(income)} color={theme.colors.success} />
        <Card label="Gastos" value={formatCurrency(expense)} color={theme.colors.danger} />
        <Card
          label="Balance"
          value={formatCurrency(income - expense)}
          color={income - expense >= 0 ? theme.colors.success : theme.colors.danger}
        />
      </View>

      <Text style={styles.sectionTitle}>Gastos por categoría</Text>
      {pieData.length === 0 ? (
        <Text style={styles.empty}>Aún no hay gastos este mes.</Text>
      ) : (
        <View style={styles.chartCard}>
          <PieChart
            data={pieData}
            width={screenWidth - 64}
            height={200}
            chartConfig={chartConfig}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="0"
            absolute
          />
        </View>
      )}

      <Text style={styles.sectionTitle}>Últimos 6 meses</Text>
      <View style={styles.chartCard}>
        <BarChart
          data={{
            labels: last6Months.map((m) => m.label),
            datasets: [{ data: last6Months.map((m) => m.expense) }],
          }}
          width={screenWidth - 64}
          height={200}
          yAxisLabel=""
          yAxisSuffix=""
          chartConfig={chartConfig}
          fromZero
          withInnerLines={false}
          style={{ borderRadius: theme.radius }}
        />
      </View>
    </ScrollView>
  );
}

function Card({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={[styles.cardValue, { color }]}>{value}</Text>
    </View>
  );
}

function buildLast6Months(txs: { date: string; kind: string; amount: number | string }[]) {
  const now = new Date();
  const months: { key: string; label: string; expense: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toISOString().slice(0, 7);
    const label = d.toLocaleDateString('es-CO', { month: 'short' });
    months.push({ key, label, expense: 0 });
  }
  for (const t of txs) {
    if (t.kind !== 'expense') continue;
    const key = t.date.slice(0, 7);
    const m = months.find((x) => x.key === key);
    if (m) m.expense += Number(t.amount);
  }
  return months;
}

const styles = StyleSheet.create({
  sectionTitle: { color: theme.colors.textMuted, fontSize: 12, textTransform: 'uppercase', marginTop: 18, marginBottom: 10 },
  cards: { flexDirection: 'row', gap: 8 },
  card: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: 14,
    borderRadius: theme.radius,
  },
  cardLabel: { color: theme.colors.textMuted, fontSize: 11 },
  cardValue: { fontWeight: '700', marginTop: 6, fontSize: 16 },
  chartCard: { backgroundColor: theme.colors.surface, padding: 16, borderRadius: theme.radius, alignItems: 'center' },
  empty: { color: theme.colors.textMuted, textAlign: 'center', padding: 20 },
});
