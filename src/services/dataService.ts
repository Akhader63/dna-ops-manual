// ============================================
// DNA Client Operations Manual App
// Data Service Layer - Supabase Integration
// All database queries go through this file
// ============================================

import { supabase } from '@/lib/supabase';


// ─── Type Aliases ───
// Using Record<string, unknown> instead of any for better type safety
// TODO: Generate these from Supabase schema using `supabase gen types typescript`
export type Module = Record<string, unknown>;
export type Transaction = Record<string, unknown>;
export type UseCase = Record<string, unknown>;
export type Client = Record<string, unknown>;
export type ClientManual = Record<string, unknown>;
export type Role = Record<string, unknown>;
export type BugIssue = Record<string, unknown>;
export type ProjectPlanItem = Record<string, unknown>;
export type UserAccount = Record<string, unknown>;

// ─── Generic Fetch ───
export async function fetchAll(
  table: string,
  options?: { columns?: string; orderBy?: string; ascending?: boolean; limit?: number }
) {
  let query = supabase.from(table).select(options?.columns ?? '*');
  if (options?.orderBy) query = query.order(options.orderBy, { ascending: options.ascending ?? true });
  if (options?.limit) query = query.limit(options.limit);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as any[];
}

// ─── Modules ───
export async function getModules() {
  return fetchAll('modules', { orderBy: 'sort_order' });
}

export async function getModuleById(id: string) {
  const { data, error } = await supabase.from('modules').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Module;
}

// ─── Transactions ───
export async function getTransactions(moduleId?: string) {
  let query = supabase.from('transactions').select('*').order('sort_order');
  if (moduleId) query = query.eq('module_id', moduleId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Transaction[];
}

// ─── Use Cases ───
export async function getUseCases(transactionId?: string) {
  let query = supabase.from('use_cases').select('*').order('sort_order');
  if (transactionId) query = query.eq('transaction_id', transactionId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as UseCase[];
}

// ─── Clients ───
export async function getClients() {
  return fetchAll('clients', { orderBy: 'created_at', ascending: false });
}

export async function getClientById(id: string) {
  const { data, error } = await supabase.from('clients').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Client;
}

export async function generateNextClientCode(): Promise<string> {
  // Fetch all existing client codes
  const { data, error } = await supabase
    .from('clients')
    .select('code')
    .order('code', { ascending: false })
    .limit(1);

  if (error) throw error;

  // If no clients exist, start with CLT-0001
  if (!data || data.length === 0) {
    return 'CLT-0001';
  }

  // Extract the number from the last code
  const lastCode = data[0].code;
  const match = lastCode.match(/CLT-(\d+)/);

  if (match) {
    const lastNumber = parseInt(match[1], 10);
    const nextNumber = lastNumber + 1;
    return `CLT-${String(nextNumber).padStart(4, '0')}`;
  }

  // Fallback if code format is unexpected
  return 'CLT-0001';
}

export async function createClient(client: Omit<Client, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase.from('clients').insert(client).select().single();
  if (error) throw error;
  return data as Client;
}

export async function updateClient(id: string, updates: Partial<Client>) {
  const { data, error } = await supabase.from('clients').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as Client;
}

// ─── Client Manuals ───
export async function getClientManuals(clientId?: string) {
  let query = supabase.from('client_manuals').select('*').order('updated_at', { ascending: false });
  if (clientId) query = query.eq('client_id', clientId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ClientManual[];
}

// ─── Roles ───
export async function getRoles(clientId?: string) {
  let query = supabase.from('roles').select('*');
  if (clientId) query = query.eq('client_id', clientId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Role[];
}

// ─── Issues ───
export async function getIssues() {
  return fetchAll('bugs_issues', { orderBy: 'created_at', ascending: false });
}

// ─── Project Plan ───
export async function getProjectPlan() {
  return fetchAll('project_plan', { orderBy: 'sort_order' });
}

// ─── Dashboard KPIs ───
export async function getDashboardStats() {
  const [modules, transactions, useCases, clients, manuals, roles, issues, planItems] = await Promise.all([
    supabase.from('modules').select('*', { count: 'exact', head: true }),
    supabase.from('transactions').select('*', { count: 'exact', head: true }),
    supabase.from('use_cases').select('*', { count: 'exact', head: true }),
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('client_manuals').select('*', { count: 'exact', head: true }),
    supabase.from('roles').select('*', { count: 'exact', head: true }),
    supabase.from('bugs_issues').select('*', { count: 'exact', head: true }),
    supabase.from('project_plan').select('*', { count: 'exact', head: true }),
  ]);

  return {
    totalModules: modules.count ?? 0,
    totalTransactions: transactions.count ?? 0,
    totalUseCases: useCases.count ?? 0,
    totalClients: clients.count ?? 0,
    totalManuals: manuals.count ?? 0,
    totalRoles: roles.count ?? 0,
    openIssues: (issues.data?.filter((i: BugIssue) => i.status === 'open').length) ?? 0,
    totalPlanItems: planItems.count ?? 0,
  };
}

// ─── Auth Operations ───
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUp(email: string, password: string, metadata?: Record<string, unknown>) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}
