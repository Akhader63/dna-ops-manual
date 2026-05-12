// ============================================
// useSupabase Hook
// Provides access to the Supabase client instance
// ============================================

import { useMemo } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Hook to access the Supabase client.
 * Uses useMemo to ensure a stable reference across renders.
 * 
 * @example
 * const { supabase } = useSupabase();
 * const { data, error } = await supabase.from('modules').select('*');
 */
export function useSupabase() {
  const client = useMemo(() => supabase, []);
  return { supabase: client };
}

export default useSupabase;
