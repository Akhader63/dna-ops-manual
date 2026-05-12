import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { PostgrestError } from '@supabase/supabase-js';

export interface UseDataReturn<T = unknown> {
  data: T[];
  single: T | null;
  isLoading: boolean;
  isMutating: boolean;
  error: PostgrestError | Error | null;
  count: number | null;
  fetch: () => Promise<void>;
  fetchById: (id: string) => Promise<void>;
  insert: (row: Partial<T>) => Promise<T | null>;
  update: (id: string, changes: Partial<T>) => Promise<T | null>;
  remove: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<T[]>>;
}

export function useData<T = unknown>(
  table: string,
  options?: {
    select?: string;
    filters?: Record<string, string | number | boolean | null>;
    orderBy?: { column: string; ascending?: boolean };
    limit?: number;
    autoFetch?: boolean;
  }
): UseDataReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [single, setSingle] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<PostgrestError | Error | null>(null);
  const [count, setCount] = useState<number | null>(null);

  const optionsRef = useRef(options);
  const tableRef = useRef(table);

  // Update refs in useEffect to avoid updating during render
  useEffect(() => {
    optionsRef.current = options;
    tableRef.current = table;
  });

  const buildQuery = useCallback(() => {
    // Using 'from' with dynamic table name - Supabase doesn't type this at compile time
    let query = supabase.from(tableRef.current).select(optionsRef.current?.select ?? '*', { count: 'exact' });

    if (optionsRef.current?.filters) {
      Object.entries(optionsRef.current.filters).forEach(([column, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          query = query.eq(column, value);
        }
      });
    }

    if (optionsRef.current?.orderBy) {
      query = query.order(optionsRef.current.orderBy.column, {
        ascending: optionsRef.current.orderBy.ascending ?? true,
      });
    }

    if (optionsRef.current?.limit) {
      query = query.limit(optionsRef.current.limit);
    }

    return query;
  }, []);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const { data: rows, error: err, count: rowCount } = await buildQuery();

    if (err) {
      setError(err);
      setData([]);
    } else {
      setData(rows ?? []);
      setCount(rowCount ?? null);
    }

    setIsLoading(false);
  }, [buildQuery]);

  const fetchById = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    const { data: row, error: err } = await supabase
      .from(tableRef.current)
      .select(optionsRef.current?.select ?? '*')
      .eq('id', id)
      .single();

    if (err) {
      setError(err);
      setSingle(null);
    } else {
      setSingle(row);
    }

    setIsLoading(false);
  }, []);

  const insert = useCallback(async (row: Partial<T>): Promise<T | null> => {
    setIsMutating(true);
    setError(null);

    const { data: inserted, error: err } = await supabase
      .from(tableRef.current)
      .insert(row)
      .select()
      .single();

    if (err) {
      setError(err);
      setIsMutating(false);
      return null;
    }

    setData(prev => [inserted, ...prev]);
    setIsMutating(false);
    return inserted;
  }, []);

  const update = useCallback(async (id: string, changes: Partial<T>): Promise<T | null> => {
    setIsMutating(true);
    setError(null);

    const { data: updated, error: err } = await supabase
      .from(tableRef.current)
      .update({ ...changes, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (err) {
      setError(err);
      setIsMutating(false);
      return null;
    }

    setData(prev => prev.map((r) => (r as { id?: string }).id === id ? updated : r));
    setIsMutating(false);
    return updated;
  }, []);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    setIsMutating(true);
    setError(null);

    const { error: softErr } = await supabase
      .from(tableRef.current)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (softErr) {
      const { error: hardErr } = await supabase
        .from(tableRef.current)
        .delete()
        .eq('id', id);

      if (hardErr) {
        setError(hardErr);
        setIsMutating(false);
        return false;
      }
    }

    setData(prev => prev.filter((r) => (r as { id?: string }).id !== id));
    setIsMutating(false);
    return true;
  }, []);

  const refresh = useCallback(async () => {
    await fetch();
  }, [fetch]);

  useEffect(() => {
    if (options?.autoFetch !== false) {
      fetch();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    data,
    single,
    isLoading,
    isMutating,
    error,
    count,
    fetch,
    fetchById,
    insert,
    update,
    remove,
    refresh,
    setData,
  };
}

export function useModules() {
  return useData('modules', { orderBy: { column: 'sort_order', ascending: true }, autoFetch: true });
}

export function useTransactions(moduleId?: string | null) {
  return useData('transactions', {
    filters: moduleId ? { module_id: moduleId } : undefined,
    orderBy: { column: 'sort_order', ascending: true },
    autoFetch: !!moduleId,
  });
}

export function useUseCases(transactionId?: string | null) {
  return useData('use_cases', {
    filters: transactionId ? { transaction_id: transactionId } : undefined,
    orderBy: { column: 'sort_order', ascending: true },
    autoFetch: !!transactionId,
  });
}

export function useClients() {
  return useData('clients', { orderBy: { column: 'created_at', ascending: false }, autoFetch: true });
}

export function useClientManuals(clientId?: string | null) {
  return useData('client_manuals', {
    filters: clientId ? { client_id: clientId } : undefined,
    orderBy: { column: 'updated_at', ascending: false },
    autoFetch: !!clientId,
  });
}

export function useRoles(manualId?: string | null) {
  return useData('roles', {
    filters: manualId ? { manual_id: manualId } : undefined,
    orderBy: { column: 'created_at', ascending: true },
    autoFetch: !!manualId,
  });
}

export function useApprovalGateways(manualId?: string | null) {
  return useData('approval_gateways', {
    filters: manualId ? { manual_id: manualId } : undefined,
    autoFetch: !!manualId,
  });
}

export function useIssues(manualId?: string | null) {
  return useData('bugs_issues', {
    filters: manualId ? { manual_id: manualId } : undefined,
    orderBy: { column: 'created_at', ascending: false },
    autoFetch: true,
  });
}

export function useProjectPlan(manualId?: string | null) {
  return useData('project_plan', {
    filters: manualId ? { manual_id: manualId } : undefined,
    orderBy: { column: 'sort_order', ascending: true },
    autoFetch: !!manualId,
  });
}

export function useSharedLinks(manualId?: string | null) {
  return useData('shared_links', {
    filters: manualId ? { manual_id: manualId } : { is_active: true },
    orderBy: { column: 'created_at', ascending: false },
    autoFetch: !!manualId,
  });
}

export default useData;
