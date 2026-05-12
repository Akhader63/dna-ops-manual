import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Crown,
  UserCog,
  Wallet,
  Calculator,
  ShoppingCart,
  Warehouse,
  TrendingUp,
  Settings,
  Users,
  ShieldCheck,
  Eye,
  Edit3,
  Trash2,
  ListTodo,
  FileText,
  Briefcase,
  Gavel,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

/* ═══════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════ */

interface Role {
  id: string;
  name: string;
  code: string;
  color: string;
  icon: string;
  description: string;
  reportsTo: string;
  status: 'Active' | 'Inactive';
  clientCount: number;
  permissionCount: number;
  modules: number;
  transactions: number;
  approvals: number;
  documents: number;
}

interface RoleModuleAccess {
  module: string;
  canView: boolean;
  canEdit: boolean;
  canApprove: boolean;
}

interface TransactionPerm {
  transaction: string;
  code: string;
  canView: boolean;
  canEdit: boolean;
  canApprove: boolean;
  canGenerate: boolean;
}

interface ApprovalConfig {
  transaction: string;
  level: string;
  threshold: string;
  canOverride: boolean;
  escalateTo: string;
}

interface TodoItem {
  id: string;
  task: string;
  frequency: 'Daily' | 'Weekly' | 'Monthly';
  relatedModule: string;
  completed: boolean;
}

/* ═══════════════════════════════════════════════════════════
   EMPTY DATA
   ═══════════════════════════════════════════════════════════ */

const ROLES: Role[] = [];

const MODULE_ACCESS: RoleModuleAccess[] = [];

const TRANSACTION_PERMS: TransactionPerm[] = [];

const APPROVAL_CONFIGS: ApprovalConfig[] = [];

const INITIAL_TODOS: TodoItem[] = [];

const CLIENTS = ['All Clients'];
const MODULES = ['General Ledger', 'Procurement', 'Inventory', 'Sales', 'Accounts Receivable', 'Banking'];

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Crown, UserCog, Wallet, Calculator, ShoppingCart, Warehouse, TrendingUp, Settings, Users, ShieldCheck, Eye, Edit3,
};

/* ═══════════════════════════════════════════════════════════
   ROLE CARD COMPONENT
   ═══════════════════════════════════════════════════════════ */

function RoleCard({ role, isSelected, onClick }: { role: Role; isSelected: boolean; onClick: () => void }) {
  const Icon = ICON_MAP[role.icon] || UserCog;

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`flex-shrink-0 w-[180px] rounded-xl border p-4 text-left transition-all ${
        isSelected
          ? 'border-black bg-white shadow-md ring-1 ring-black'
          : 'border-dna-alto bg-white shadow-xs hover:shadow-sm'
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${role.color}18` }}
        >
          <Icon className="w-6 h-6" style={{ color: role.color }} />
        </div>
        <div
          className="w-2.5 h-2.5 rounded-full"
          style={{
            backgroundColor: role.status === 'Active' ? '#10B981' : '#C7C7C7',
          }}
        />
      </div>
      <div className="text-[15px] font-semibold text-black mb-1 truncate">{role.name}</div>
      <div className="flex items-center gap-3 text-xs text-dna-tundora">
        <span>{role.clientCount} clients</span>
        <span>{role.permissionCount} perms</span>
      </div>
    </motion.button>
  );
}

/* ═══════════════════════════════════════════════════════════
   ROLE DETAIL — LEFT COLUMN (Profile)
   ═══════════════════════════════════════════════════════════ */

function RoleProfile({ role }: { role: Role }) {
  const Icon = ICON_MAP[role.icon] || UserCog;

  return (
    <Card className="bg-white border-dna-alto rounded-xl shadow-xs p-6">
      {/* Role Icon & Name */}
      <div className="flex flex-col items-center text-center mb-6">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-3"
          style={{ backgroundColor: `${role.color}18` }}
        >
          <Icon className="w-10 h-10" style={{ color: role.color }} />
        </div>
        <h2 className="text-2xl font-bold">{role.name}</h2>
        <span className="text-xs font-mono text-dna-silver mt-1">{role.code}</span>
      </div>

      {/* Description */}
      <div className="mb-4">
        <label className="text-xs font-semibold text-dna-tundora mb-1 block">Description</label>
        <Textarea
          defaultValue={role.description}
          className="w-full bg-white border-dna-alto min-h-[80px] text-sm"
        />
      </div>

      {/* Reports To */}
      <div className="mb-4">
        <label className="text-xs font-semibold text-dna-tundora mb-1 block">Reports To</label>
        <Select defaultValue={role.reportsTo}>
          <SelectTrigger className="w-full bg-white border-dna-alto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="None">None</SelectItem>
            {ROLES.filter((r) => r.id !== role.id).map((r) => (
              <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Status Toggle */}
      <div className="flex items-center justify-between py-3 border-t border-dna-alto mb-4">
        <div>
          <div className="text-sm font-medium">Status</div>
          <div className="text-xs text-dna-silver">Active roles can access the system</div>
        </div>
        <Switch defaultChecked={role.status === 'Active'} />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Modules', value: role.modules },
          { label: 'Transactions', value: role.transactions },
          { label: 'Approvals', value: role.approvals },
          { label: 'Documents', value: role.documents },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-lg border border-dna-alto bg-dna-cream px-3 py-2.5 text-center"
          >
            <div className="text-lg font-bold">{s.value}</div>
            <div className="text-[10px] uppercase tracking-wider text-dna-tundora font-medium">{s.label}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════
   ROLE DETAIL — RIGHT COLUMN TABS
   ═══════════════════════════════════════════════════════════ */

function RoleDetailTabs({ role }: { role: Role }) {
  const [moduleAccess, setModuleAccess] = useState(MODULE_ACCESS);
  const [transPerms, setTransPerms] = useState(TRANSACTION_PERMS);
  const [approvalConfigs, setApprovalConfigs] = useState(APPROVAL_CONFIGS);
  const [responsibilities, setResponsibilities] = useState(
    `- Review and approve all financial transactions within delegated authority\n- Ensure compliance with company policies and procedures\n- Coordinate with department heads on budget matters\n- Prepare monthly financial reports for management review`
  );
  const [todos, setTodos] = useState<TodoItem[]>(INITIAL_TODOS);

  const toggleModule = (index: number, field: keyof RoleModuleAccess) => {
    setModuleAccess((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: !next[index][field] };
      return next;
    });
  };

  const toggleTransPerm = (index: number, field: keyof TransactionPerm) => {
    setTransPerms((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: !next[index][field] };
      return next;
    });
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) => prev.map((t) => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const addTodo = () => {
    setTodos((prev) => [
      ...prev,
      { id: `${Date.now()}`, task: 'New task', frequency: 'Daily', relatedModule: 'General Ledger', completed: false },
    ]);
  };

  const toggleApprovalOverride = (index: number) => {
    setApprovalConfigs((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], canOverride: !next[index].canOverride };
      return next;
    });
  };

  const moduleIcon = (mod: string) => {
    const map: Record<string, string> = {
      'General Ledger': 'bg-blue-50 text-blue-600',
      'Procurement': 'bg-orange-50 text-orange-600',
      'Inventory': 'bg-purple-50 text-purple-600',
      'Sales': 'bg-green-50 text-green-600',
      'Accounts Receivable': 'bg-cyan-50 text-cyan-600',
      'Banking': 'bg-indigo-50 text-indigo-600',
    };
    return map[mod] || 'bg-gray-50 text-gray-600';
  };

  return (
    <Card className="bg-white border-dna-alto rounded-xl shadow-xs">
      <Tabs defaultValue="modules" className="w-full">
        <div className="px-4 pt-4 border-b border-dna-alto">
          <TabsList className="bg-dna-cream border border-dna-alto rounded-lg p-0.5 h-9">
            {[
              { value: 'modules', label: 'Module Access', icon: Briefcase },
              { value: 'transactions', label: 'Transactions', icon: FileText },
              { value: 'approvals', label: 'Approval Authority', icon: Gavel },
              { value: 'responsibilities', label: 'Responsibilities', icon: ShieldCheck },
              { value: 'todos', label: 'To-Do List', icon: ListTodo },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="text-xs font-medium data-[state=active]:bg-black data-[state=active]:text-white rounded-md px-3"
                >
                  <Icon className="w-3.5 h-3.5 mr-1" /> {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {/* Module Access Tab */}
        <TabsContent value="modules" className="p-4 m-0">
          <div className="grid grid-cols-2 gap-3">
            {moduleAccess.map((mod, i) => (
              <div
                key={mod.module}
                className="rounded-lg border border-dna-alto p-4 hover:border-dna-silver transition-colors"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${moduleIcon(mod.module)}`}>
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-semibold">{mod.module}</span>
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'Can View', field: 'canView' as const, checked: mod.canView },
                    { label: 'Can Edit', field: 'canEdit' as const, checked: mod.canEdit },
                    { label: 'Can Approve', field: 'canApprove' as const, checked: mod.canApprove },
                  ].map((t) => (
                    <div key={t.field} className="flex items-center justify-between">
                      <span className="text-xs text-dna-tundora">{t.label}</span>
                      <Switch
                        checked={t.checked}
                        onCheckedChange={() => toggleModule(i, t.field)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Transaction Permissions Tab */}
        <TabsContent value="transactions" className="m-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-dna-cream hover:bg-dna-cream">
                  <TableHead className="text-dna-tundora uppercase text-xs font-semibold">Transaction</TableHead>
                  <TableHead className="text-dna-tundora uppercase text-xs font-semibold">Code</TableHead>
                  <TableHead className="text-dna-tundora uppercase text-xs font-semibold text-center">View</TableHead>
                  <TableHead className="text-dna-tundora uppercase text-xs font-semibold text-center">Edit</TableHead>
                  <TableHead className="text-dna-tundora uppercase text-xs font-semibold text-center">Approve</TableHead>
                  <TableHead className="text-dna-tundora uppercase text-xs font-semibold text-center">Generate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transPerms.map((tp, i) => (
                  <TableRow key={tp.code} className="border-b border-dna-alto/60">
                    <TableCell className="text-sm font-medium">{tp.transaction}</TableCell>
                    <TableCell className="text-xs font-mono text-dna-silver">{tp.code}</TableCell>
                    {(['canView', 'canEdit', 'canApprove', 'canGenerate'] as const).map((field) => (
                      <TableCell key={field} className="text-center">
                        <Switch
                          checked={tp[field]}
                          onCheckedChange={() => toggleTransPerm(i, field)}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Approval Authority Tab */}
        <TabsContent value="approvals" className="p-4 m-0">
          <div className="space-y-3">
            {approvalConfigs.map((ac, i) => (
              <div
                key={ac.transaction}
                className="rounded-lg border border-dna-alto p-4 hover:border-dna-silver transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{ac.transaction}</span>
                    <Badge variant="outline" className="text-xs bg-dna-cream">{ac.level}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-dna-tundora">Can Override</span>
                    <Switch
                      checked={ac.canOverride}
                      onCheckedChange={() => toggleApprovalOverride(i)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-dna-silver font-semibold mb-1 block">
                      Threshold
                    </label>
                    <Input
                      defaultValue={ac.threshold}
                      className="bg-white border-dna-alto h-8 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-dna-silver font-semibold mb-1 block">
                      Escalation To
                    </label>
                    <Select defaultValue={ac.escalateTo}>
                      <SelectTrigger className="bg-white border-dna-alto h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.filter((r) => r.name !== role.name).map((r) => (
                          <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Responsibilities Tab */}
        <TabsContent value="responsibilities" className="p-4 m-0">
          <div className="rounded-lg border border-dna-alto bg-white">
            <div className="flex items-center gap-1 px-3 py-2 border-b border-dna-alto bg-dna-cream rounded-t-lg">
              {['B', 'I', 'U', 'S'].map((fmt) => (
                <Button
                  key={fmt}
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-xs font-bold text-dna-tundora hover:bg-white"
                >
                  {fmt}
                </Button>
              ))}
              <div className="w-px h-4 bg-dna-alto mx-1" />
              {['H1', 'H2', 'UL'].map((fmt) => (
                <Button
                  key={fmt}
                  variant="ghost"
                  size="sm"
                  className="h-7 px-1.5 text-[10px] font-semibold text-dna-tundora hover:bg-white"
                >
                  {fmt}
                </Button>
              ))}
            </div>
            <Textarea
              value={responsibilities}
              onChange={(e) => setResponsibilities(e.target.value)}
              className="min-h-[300px] border-0 rounded-t-none resize-none text-sm leading-relaxed"
            />
          </div>
        </TabsContent>

        {/* To-Do List Tab */}
        <TabsContent value="todos" className="p-4 m-0">
          <div className="space-y-2">
            {todos.map((todo) => (
              <div
                key={todo.id}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-all ${
                  todo.completed ? 'border-dna-alto/60 bg-dna-cream/50' : 'border-dna-alto bg-white'
                }`}
              >
                <Checkbox
                  checked={todo.completed}
                  onCheckedChange={() => toggleTodo(todo.id)}
                />
                <div className="flex-1">
                  <Input
                    value={todo.task}
                    onChange={(e) =>
                      setTodos((prev) =>
                        prev.map((t) => t.id === todo.id ? { ...t, task: e.target.value } : t)
                      )
                    }
                    className={`h-7 border-0 bg-transparent text-sm px-0 ${
                      todo.completed ? 'line-through text-dna-silver' : ''
                    }`}
                  />
                </div>
                <Select
                  value={todo.frequency}
                  onValueChange={(v) =>
                    setTodos((prev) =>
                      prev.map((t) =>
                        t.id === todo.id ? { ...t, frequency: v as 'Daily' | 'Weekly' | 'Monthly' } : t
                      )
                    )
                  }
                >
                  <SelectTrigger className="w-28 h-7 bg-white border-dna-alto text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Daily">Daily</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={todo.relatedModule}
                  onValueChange={(v) =>
                    setTodos((prev) =>
                      prev.map((t) =>
                        t.id === todo.id ? { ...t, relatedModule: v } : t
                      )
                    )
                  }
                >
                  <SelectTrigger className="w-36 h-7 bg-white border-dna-alto text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODULES.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-dna-silver hover:text-red-500"
                  onClick={() => deleteTodo(todo.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              className="w-full mt-2 border-dashed border-dna-alto text-dna-tundora hover:bg-dna-cream"
              onClick={addTodo}
            >
              <Plus className="w-4 h-4 mr-1.5" /> Add Task
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */

export default function RoleSetup() {
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [clientFilter, setClientFilter] = useState('All Clients');

  const selectedRole = ROLES.find((r) => r.id === selectedRoleId) || null;

  return (
    <div className="min-h-screen bg-dna-pampas py-8">
      <div className="max-w-[1400px] mx-auto px-6">

        {/* ═══ Page Header ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="flex items-start justify-between mb-8"
        >
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Role Manager</h1>
            <p className="mt-2 text-base text-dna-tundora">
              Define client roles, responsibilities, and ERP module permissions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger className="w-48 bg-white border-dna-alto">
                <Building2 className="w-4 h-4 mr-1 text-dna-silver" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CLIENTS.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button className="bg-dna-pomegranate text-white hover:bg-red-700">
              <Plus className="w-4 h-4 mr-1.5" /> Add Custom Role
            </Button>
          </div>
        </motion.div>

        {/* ═══ Role Overview Cards (Horizontal Scroll) ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="mb-8"
        >
          <ScrollArea className="w-full">
            <div className="flex gap-3 pb-2" style={{ minWidth: 'max-content' }}>
              {ROLES.map((role) => (
                <RoleCard
                  key={role.id}
                  role={role}
                  isSelected={selectedRoleId === role.id}
                  onClick={() => setSelectedRoleId(role.id)}
                />
              ))}
            </div>
          </ScrollArea>
        </motion.div>

        {/* ═══ Role Detail View (2-Column Grid) ═══ */}
        <AnimatePresence mode="wait">
          {selectedRole && (
            <motion.div
              key={selectedRole.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
              className="grid gap-6"
              style={{ gridTemplateColumns: '35% 65%' }}
            >
              {/* Left — Role Profile */}
              <div>
                <RoleProfile role={selectedRole} />
              </div>

              {/* Right — Tabs */}
              <div>
                <RoleDetailTabs role={selectedRole} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!selectedRole && (
          <div className="text-center py-16 text-dna-silver">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Select a role to view and configure its details.</p>
          </div>
        )}
      </div>
    </div>
  );
}
