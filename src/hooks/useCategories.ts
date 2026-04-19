import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { Category } from '@/lib/database.types';

export function useCategories(householdId: string | null | undefined) {
  const [data, setData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!householdId) {
      setData([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data: rows } = await supabase
      .from('categories')
      .select('*')
      .eq('household_id', householdId)
      .order('name');
    setData((rows ?? []) as Category[]);
    setLoading(false);
  }, [householdId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, reload };
}
