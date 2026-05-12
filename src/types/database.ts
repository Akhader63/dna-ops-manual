/**
 * ============================================
 * DNA Client Operations Manual App
 * Supabase Database TypeScript Types
 * Generated from schema: database/001_initial_schema.sql
 * ============================================
 */

// ─── ENUM Types ───

export type UserRole = 'super_admin' | 'admin' | 'consultant' | 'viewer';
export type ClientStatus = 'active' | 'inactive' | 'on_hold';
export type ManualStatus = 'draft' | 'in_review' | 'approved' | 'published' | 'archived';
export type ManualType = 'full' | 'module_specific' | 'role_specific' | 'process_specific';
export type SelectionLevel = 'module' | 'transaction' | 'use_case';
export type ApprovalType = 'sequential' | 'parallel' | 'hierarchical' | 'conditional';
export type RoleType = 'system' | 'custom';
export type ResponsibilityType = 'R' | 'A' | 'C' | 'I';
export type RoadmapType = 'flowchart' | 'swimlane' | 'mindmap' | 'timeline';
export type RoadmapStatus = 'draft' | 'published' | 'archived';
export type NodeType = 'start' | 'end' | 'module' | 'transaction' | 'use_case' | 'approval' | 'document' | 'decision' | 'process';
export type EdgeType = 'standard' | 'conditional' | 'reversible';
export type AccessLevel = 'admin' | 'manager' | 'user' | 'viewer';
export type TransactionFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually' | 'as_needed' | 'event_driven';
export type Complexity = 'simple' | 'medium' | 'complex';
export type IssueType = 'bug' | 'feature' | 'change_request' | 'task';
export type IssuePriority = 'critical' | 'high' | 'medium' | 'low';
export type IssueStatus = 'open' | 'in_progress' | 'in_review' | 'resolved' | 'closed';

// ─── JSONB Subtypes ───

export interface UseCaseStep {
  step: number;
  action: string;
  details?: string;
}

export interface ApprovalLevel {
  level: number;
  name: string;
  min_approvers: number;
  role_ids: string[];
  can_delegate: boolean;
  auto_approve_below_amount?: number;
}

export interface NodeStyle {
  background?: string;
  color?: string;
  border?: string;
  borderRadius?: string;
}

export interface NodeData {
  moduleId?: string;
  transactionId?: string;
  useCaseId?: string;
  description?: string;
  details?: Record<string, unknown>;
}

export interface EdgeStyle {
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
}

export interface RoadmapLayout {
  orientation: 'horizontal' | 'vertical';
  spacing: number;
  autoLayout: boolean;
}

// ─── Recovery Code Type ───

export interface RecoveryCode {
  code: string; // Hashed recovery code
  used: boolean;
  used_at?: string;
}

// ─── Table Row Types ───

export interface Module {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  module_id: string;
  code: string;
  name: string;
  description: string | null;
  type: string;
  typical_frequency: TransactionFrequency | null;
  complexity: Complexity | null;
  requires_approval: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UseCase {
  id: string;
  transaction_id: string;
  code: string;
  name: string;
  description: string | null;
  business_scenario: string | null;
  prerequisites: string[] | null;
  steps: UseCaseStep[];
  inputs: unknown[] | null;
  outputs: unknown[] | null;
  typical_approver_roles: string[] | null;
  estimated_duration: string | null;
  complexity: Complexity | null;
  is_critical: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  code: string;
  industry: string | null;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  status: ClientStatus;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface UserAccount {
  id: string;
  auth_user_id: string | null;
  email: string;
  full_name: string | null;
  role: UserRole;
  user_type: 'client_user' | 'consultant_user' | null;
  department: string | null;
  position: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  is_super_admin: boolean;
  status: string | null;
  last_login: string | null;
  linked_client_id: string | null;
  invited_at: string | null;
  invitation_token: string | null;
  invitation_expires_at: string | null;
  email_verified: boolean;
  email_verification_token: string | null;
  email_verification_expires_at: string | null;
  password_reset_token: string | null;
  password_reset_expires_at: string | null;
  created_at: string;
  updated_at: string;
  two_factor_enabled: boolean;
  two_factor_secret: string | null;
  two_factor_configured_at: string | null;
  recovery_codes: RecoveryCode[] | null;
  recovery_codes_generated_at: string | null;
  last_two_factor_verification: string | null;
  two_factor_required: boolean;
}

export interface ClientManual {
  id: string;
  client_id: string;
  name: string;
  description: string | null;
  version: number;
  status: ManualStatus;
  is_published: boolean;
  published_at: string | null;
  published_by: string | null;
  manual_type: ManualType | null;
  metadata: Record<string, unknown> | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ManualSelection {
  id: string;
  manual_id: string;
  module_id: string | null;
  transaction_id: string | null;
  use_case_id: string | null;
  selection_level: SelectionLevel;
  is_included: boolean;
  custom_notes: string | null;
  custom_sequence: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ApprovalGateway {
  id: string;
  selection_id: string;
  manual_id: string;
  approval_type: ApprovalType;
  levels: ApprovalLevel[];
  roles_sequence: string[] | null;
  condition_rules: Record<string, unknown> | null;
  escalation_hours: number;
  reminder_hours: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  client_id: string;
  manual_id: string | null;
  role_name: string;
  description: string | null;
  department: string | null;
  responsibilities: Record<string, unknown>[] | null;
  access_level: AccessLevel;
  assigned_users: Record<string, unknown>[] | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoleResponsibility {
  id: string;
  role_id: string;
  manual_id: string;
  module_id: string | null;
  transaction_id: string | null;
  use_case_id: string | null;
  responsibility_type: ResponsibilityType;
  is_active: boolean;
  created_at: string;
}

export interface Roadmap {
  id: string;
  manual_id: string;
  layout_type: RoadmapType;
  layout_data: RoadmapLayout | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoadmapNode {
  id: string;
  roadmap_id: string;
  node_type: NodeType;
  node_data: NodeData | null;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  style: NodeStyle | null;
  created_at: string;
}

export interface RoadmapEdge {
  id: string;
  roadmap_id: string;
  source_node_id: string;
  target_node_id: string;
  edge_type: EdgeType;
  label: string | null;
  style: EdgeStyle | null;
  created_at: string;
}

export interface SharedLink {
  id: string;
  manual_id: string;
  access_token: string;
  expires_at: string | null;
  is_active: boolean;
  view_count: number;
  last_viewed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChangeLog {
  id: string;
  table_name: string;
  record_id: string;
  action: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  changed_by: string | null;
  changed_at: string;
}

export interface BugIssue {
  id: string;
  title: string;
  description: string | null;
  type: IssueType;
  priority: IssuePriority;
  status: IssueStatus;
  assignee_id: string | null;
  manual_id: string | null;
  metadata: Record<string, unknown> | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface ProjectPlanItem {
  id: string;
  manual_id: string | null;
  parent_id: string | null;
  title: string;
  description: string | null;
  item_type: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  due_date: string | null;
  completed_at: string | null;
  sort_order: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface OptionalFeature {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  priority: string;
  estimated_effort: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskOnHold {
  id: string;
  manual_id: string;
  title: string;
  description: string | null;
  reason: string | null;
  hold_until: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SMTPSettings {
  id: string;
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  smtp_from_email: string;
  smtp_from_name: string;
  smtp_use_tls: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Insert/Update Types (partial) ───

export type InsertModule = Omit<Module, 'id' | 'created_at' | 'updated_at'>;
export type InsertClient = Omit<Client, 'id' | 'created_at' | 'updated_at'>;
export type InsertClientManual = Omit<ClientManual, 'id' | 'version' | 'created_at' | 'updated_at'>;
export type InsertRole = Omit<Role, 'id' | 'created_at' | 'updated_at'>;

// ─── Supabase Database Interface ───

export interface Database {
  public: {
    Tables: {
      modules: { Row: Module; Insert: InsertModule; Update: Partial<InsertModule> };
      transactions: { Row: Transaction; Insert: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<Transaction, 'id' | 'created_at'>> };
      use_cases: { Row: UseCase; Insert: Omit<UseCase, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<UseCase, 'id' | 'created_at'>> };
      clients: { Row: Client; Insert: InsertClient; Update: Partial<InsertClient> };
      user_accounts: { Row: UserAccount; Insert: Omit<UserAccount, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<UserAccount, 'id' | 'created_at'>> };
      client_manuals: { Row: ClientManual; Insert: InsertClientManual; Update: Partial<InsertClientManual> };
      manual_selections: { Row: ManualSelection; Insert: Omit<ManualSelection, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<ManualSelection, 'id' | 'created_at'>> };
      approval_gateways: { Row: ApprovalGateway; Insert: Omit<ApprovalGateway, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<ApprovalGateway, 'id' | 'created_at'>> };
      roles: { Row: Role; Insert: InsertRole; Update: Partial<InsertRole> };
      role_responsibilities: { Row: RoleResponsibility; Insert: Omit<RoleResponsibility, 'id' | 'created_at'>; Update: Partial<Omit<RoleResponsibility, 'id' | 'created_at'>> };
      roadmaps: { Row: Roadmap; Insert: Omit<Roadmap, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<Roadmap, 'id' | 'created_at'>> };
      roadmap_nodes: { Row: RoadmapNode; Insert: Omit<RoadmapNode, 'id' | 'created_at'>; Update: Partial<Omit<RoadmapNode, 'id' | 'created_at'>> };
      roadmap_edges: { Row: RoadmapEdge; Insert: Omit<RoadmapEdge, 'id' | 'created_at'>; Update: Partial<Omit<RoadmapEdge, 'id' | 'created_at'>> };
      shared_links: { Row: SharedLink; Insert: Omit<SharedLink, 'id' | 'view_count' | 'created_at' | 'updated_at'>; Update: Partial<Omit<SharedLink, 'id' | 'created_at'>> };
      change_logs: { Row: ChangeLog; Insert: Omit<ChangeLog, 'id' | 'changed_at'>; Update: never };
      bugs_issues: { Row: BugIssue; Insert: Omit<BugIssue, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<BugIssue, 'id' | 'created_at'>> };
      project_plan: { Row: ProjectPlanItem; Insert: Omit<ProjectPlanItem, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<ProjectPlanItem, 'id' | 'created_at'>> };
      optional_features: { Row: OptionalFeature; Insert: Omit<OptionalFeature, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<OptionalFeature, 'id' | 'created_at'>> };
      tasks_on_hold: { Row: TaskOnHold; Insert: Omit<TaskOnHold, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<TaskOnHold, 'id' | 'created_at'>> };
    };
    Views: {
      vw_client_manuals_complete: { Row: Record<string, unknown> };
      vw_module_transaction_count: { Row: Record<string, unknown> };
      vw_manual_progress: { Row: Record<string, unknown> };
    };
    Functions: {
      update_updated_at_column: { Args: Record<string, never>; Returns: void };
      log_change: { Args: { p_table_name: string; p_record_id: string; p_action: string; p_old_data: string; p_new_data: string }; Returns: void };
      generate_share_token: { Args: Record<string, never>; Returns: string };
      get_manual_progress: { Args: { p_manual_id: string }; Returns: { total_items: number; completed_items: number; progress_pct: number } };
    };
    Enums: {
      user_role: UserRole;
      client_status: ClientStatus;
      manual_status: ManualStatus;
      issue_type: IssueType;
      issue_priority: IssuePriority;
      issue_status: IssueStatus;
    };
  };
}

const databaseSchema: Database = {} as Database;
export default databaseSchema;
