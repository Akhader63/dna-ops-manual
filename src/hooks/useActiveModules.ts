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

  // Define fetchActiveModules outside useEffect so it can be called manually
  const fetchActiveModules = async () => {
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
  };

  // Expose manual refresh function
  const refetch = () => {
    console.log('[useActiveModules] Manual refetch triggered');
    fetchActiveModules();
  };

  useEffect(() => {
    fetchActiveModules();

    // Listen for manual refresh events (for instant UI feedback)
    const handleModuleChange = () => {
      console.log('[useActiveModules] Manual module change event received');
      fetchActiveModules();
    };
    window.addEventListener('dna-module-changed', handleModuleChange);

    // Subscribe to realtime changes in modules table (for multi-tab sync)
    // Use a unique channel name to avoid conflicts
    const channelName = `modules-changes-${Date.now()}`;
    const channel = supabase.channel(channelName);

    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'modules' },
        (payload) => {
          console.log('[useActiveModules] Module status changed via realtime:', payload);
          fetchActiveModules();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[useActiveModules] Successfully subscribed to module changes');
        }
      });

    return () => {
      console.log('[useActiveModules] Cleaning up subscription');
      window.removeEventListener('dna-module-changed', handleModuleChange);
      supabase.removeChannel(channel);
    };
  }, []);

  return { activeModules, loading, error, refetch };
}

/**
 * Check if a specific module is active
 */
export function isModuleActive(moduleCode: string, activeModules: Set<string>): boolean {
  // Settings is always active (not a module)
  if (moduleCode === 'settings') return true;

  return activeModules.has(moduleCode);
}
