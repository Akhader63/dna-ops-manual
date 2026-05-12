// ============================================
// DNA Client Operations Manual App
// Supabase Client Configuration
// ============================================

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Validate environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[Supabase] Missing environment variables.\n' +
    'Please copy .env.local.example to .env.local and fill in your Supabase credentials.\n' +
    'Get them from: https://app.supabase.com/project/_/settings/api'
  );
}

// Create typed Supabase client (singleton pattern)
export const supabase = createClient<Database>(
  supabaseUrl ?? '',
  supabaseAnonKey ?? '',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

// Export a helper to check connection health
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('modules').select('count', { count: 'exact', head: true });
    return !error;
  } catch {
    return false;
  }
}

// Helper to get current auth session
export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

// Helper to get current user
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

// Generic typed query helper
export async function fetchTable<T extends keyof Database['public']['Tables']>(
  table: T,
  options?: {
    select?: string;
    filters?: Record<string, unknown>;
    orderBy?: { column: string; ascending?: boolean };
    limit?: number;
  }
) {
  let query = supabase.from(table).select(options?.select ?? '*');

  if (options?.orderBy) {
    query = query.order(options.orderBy.column, {
      ascending: options.orderBy.ascending ?? true,
    });
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export default supabase;
