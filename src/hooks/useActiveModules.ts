import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Module {
  code: string;
  name: string;
  is_active: boolean;
}

/**
 * Custom hook to fetch and cache active modules
 * Returns a Set of active module codes for fast lookup
 */
export function useActiveModules() {
  const [activeModules, setActiveModules] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchActiveModules() {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('modules')
          .select('code, name, is_active')
          .eq('is_active', true);

        if (fetchError) throw fetchError;

        const activeCodes = new Set((data || []).map((m: Module) => m.code));
        setActiveModules(activeCodes);
      } catch (err) {
        console.error('[useActiveModules] Error fetching modules:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch modules');
        // On error, assume all modules are active (fail-safe)
        setActiveModules(new Set([
          'dashboard',
          'clients',
          'manual_builder',
          'module_library',
          'approval_gateways',
          'role_setup',
          'roadmap_generator',
          'manual_preview',
          'project_tracker',
          'issues_tracker',
        ]));
      } finally {
        setLoading(false);
      }
    }

    fetchActiveModules();

    // Subscribe to realtime changes in modules table
    const channel = supabase
      .channel('modules-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'modules' },
        () => {
          console.log('[useActiveModules] Module status changed, refreshing...');
          fetchActiveModules();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return { activeModules, loading, error };
}

/**
 * Check if a specific module is active
 */
export function isModuleActive(moduleCode: string, activeModules: Set<string>): boolean {
  // Settings is always active (not a module)
  if (moduleCode === 'settings') return true;

  return activeModules.has(moduleCode);
}
