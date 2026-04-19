import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { Category, Transaction } from '@/lib/database.types';

export interface TransactionWithCategory extends Transaction {
  category: Pick<Category, 'id' | 'name' | 'color'> | null;
}

export function useTransactions(householdId: string | null | undefined, monthKey?: string) {
  const [data, setData] = useState<TransactionWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!householdId) {
      setData([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let query = supabase
      .from('transactions')
      .select('*, category:categories(id, name, color)')
      .eq('household_id', householdId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (monthKey) {
      const start = `${monthKey}-01`;
      const [y, m] = monthKey.split('-').map(Number);
      const nextMonth = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10);
      query = query.gte('date', start).lt('date', nextMonth);
    }

    const { data: rows, error: err } = await query;
    if (err) {
      setError(err.message);
      setData([]);
    } else {
      setError(null);
      setData((rows ?? []) as TransactionWithCategory[]);
    }
    setLoading(false);
  }, [householdId, monthKey]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload };
}
