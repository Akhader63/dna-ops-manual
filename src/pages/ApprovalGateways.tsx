import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Upload,
  List,
  GitBranch,
  Pencil,
  Trash2,
  Check,
  Filter,
  Settings2,
  ShieldAlert,
  Clock,
  FileCheck,
  Shield,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';

/* ═══════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════ */

interface ApprovalGate {
  id: string;
  useCase: string;
  transaction: string;
  module: string;
  approvalLevel: string;
  approverRole: string;
  client: string;
  status: 'Configured' | 'Pending' | 'Needs Review';
  approvalRequired: boolean;
  sequence: number;
  slaHours: number;
}

interface FlowNode {
  id: string;
  label: string;
  role: string;
  level: number;
  color: string;
}

/* ═══════════════════════════════════════════════════════════
   EMPTY DATA
   ═══════════════════════════════════════════════════════════ */

const INITIAL_GATES: ApprovalGate[] = [];

const FLOW_NODES: FlowNode[] = [
  { id: 'req', label: 'Requester', role: 'Requester', level: 0, color: '#C7C7C7' },
  { id: 'dh', label: 'Department Head', role: 'Department Head', level: 0, color: '#0E0486' },
  { id: 'fm', label: 'Finance Manager', role: 'Finance Manager', level: 1, color: '#059669' },
  { id: 'om', label: 'Operations Mgr', role: 'Operations Manager', level: 1, color: '#885FF2' },
  { id: 'gm', label: 'General Manager', role: 'General Manager', level: 2, color: '#7C3AED' },
  { id: 'own', label: 'Owner', role: 'Owner', level: 2, color: '#F3350C' },
];

const FLOW_EDGES = [
  { from: 'req', to: 'dh', label: 'Submit' },
  { from: 'dh', to: 'fm', label: 'PO, Invoice' },
  { from: 'dh', to: 'om', label: 'GR, Transfer' },
  { from: 'fm', to: 'gm', label: '> $10K' },
  { from: 'om', to: 'gm', label: '> $5K' },
  { from: 'gm', to: 'own', label: '> $50K' },
];

const MODULES = ['General Ledger', 'Procurement', 'Inventory', 'Sales', 'Accounts Receivable', 'Accounts Payable', 'Banking'];
const CLIENTS = ['All Clients'];
const ROLES = ['Finance Manager', 'General Manager', 'Operations Manager', 'Department Head', 'Accountant', 'Owner', 'Approver'];

/* ═══════════════════════════════════════════════════════════
   BADGES
   ═══════════════════════════════════════════════════════════ */

function StatusBadge({ status }: { status: ApprovalGate['status'] }) {
  const styles = {
    Configured: 'bg-emerald-100 text-emerald-700',
    Pending: 'bg-amber-100 text-amber-700',
    'Needs Review': 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status]}`}>
      {status}
    </span>
  );
}

function ModuleBadge({ module }: { module: string }) {
  const colors: Record<string, string> = {
    'General Ledger': 'bg-blue-50 text-blue-700 border-blue-200',
    'Procurement': 'bg-orange-50 text-orange-700 border-orange-200',
    'Inventory': 'bg-purple-50 text-purple-700 border-purple-200',
    'Sales': 'bg-green-50 text-green-700 border-green-200',
    'Accounts Receivable': 'bg-cyan-50 text-cyan-700 border-cyan-200',
    'Accounts Payable': 'bg-pink-50 text-pink-700 border-pink-200',
    'Banking': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  };
  return (
    <Badge variant="outline" className={`text-xs ${colors[module] || 'bg-gray-50 text-gray-700'}`}>
      {module}
    </Badge>
  );
}

/* ═══════════════════════════════════════════════════════════
   FLOW DIAGRAM
   ═══════════════════════════════════════════════════════════ */

function FlowDiagram() {
  const containerRef = useRef<HTMLDivElement>(null);

  const levels = [
    FLOW_NODES.filter((n) => n.level === 0),
    FLOW_NODES.filter((n) => n.level === 1),
    FLOW_NODES.filter((n) => n.level === 2),
  ];

  const getNodePos = useCallback((nodeId: string): { x: number; y: number } | null => {
    const el = document.getElementById(`flow-node-${nodeId}`);
    if (!el || !containerRef.current) return null;
    const containerRect = containerRef.current.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    return {
      x: elRect.left + elRect.width / 2 - containerRect.left,
      y: elRect.top + elRect.height / 2 - containerRect.top,
    };
  }, []);

  const [lines, setLines] = useState<Array<{
    x1: number; y1: number; x2: number; y2: number; label: string;
  }>>([]);

  const recalcLines = useCallback(() => {
    const newLines: Array<{ x1: number; y1: number; x2: number; y2: number; label: string }> = [];
    FLOW_EDGES.forEach((edge) => {
      const from = getNodePos(edge.from);
      const to = getNodePos(edge.to);
      if (from && to) {
        newLines.push({ x1: from.x, y1: from.y, x2: to.x, y2: to.y, label: edge.label });
      }
    });
    setLines(newLines);
  }, [getNodePos]);

  useEffect(() => {
    const timer = setTimeout(recalcLines, 300);
    const interval = setInterval(recalcLines, 2000);
    const handleResize = () => recalcLines();
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, [recalcLines]);

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-xl border border-dna-alto bg-white p-8 shadow-xs"
      style={{ minHeight: 480 }}
    >
      {/* SVG Lines */}
      <svg className="absolute inset-0 z-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#C7C7C7" />
          </marker>
        </defs>
        {lines.map((line, i) => (
          <g key={i}>
            <line
              x1={line.x1} y1={line.y1}
              x2={line.x2} y2={line.y2}
              stroke="#C7C7C7" strokeWidth={2} markerEnd="url(#arrowhead)"
            />
            <rect
              x={(line.x1 + line.x2) / 2 - 30}
              y={(line.y1 + line.y2) / 2 - 10}
              width={60} height={18} rx={4} fill="white" stroke="#DDDDDD" strokeWidth={1}
            />
            <text
              x={(line.x1 + line.x2) / 2}
              y={(line.y1 + line.y2) / 2 + 3}
              textAnchor="middle"
              fontSize={9} fill="#434343"
            >
              {line.label}
            </text>
          </g>
        ))}
      </svg>

      {/* Nodes */}
      <div className="relative z-10 flex flex-col items-center justify-between gap-16">
        {levels.map((levelNodes, li) => (
          <div key={li} className="flex items-center justify-center gap-10">
            {levelNodes.map((node) => (
              <motion.div
                key={node.id}
                id={`flow-node-${node.id}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: li * 0.15 + 0.2, duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                className="flex flex-col items-center gap-2"
              >
                <div
                  className="rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-sm"
                  style={{ backgroundColor: node.color }}
                >
                  {node.label}
                </div>
                <span className="text-[10px] uppercase tracking-wider text-dna-silver font-medium">
                  {node.role}
                </span>
              </motion.div>
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 rounded-lg border border-dna-alto bg-white/90 px-3 py-2 shadow-xs">
        <div className="text-[10px] uppercase tracking-wider text-dna-silver font-semibold mb-1">Flow Legend</div>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {[
            { color: '#059669', label: 'Finance' },
            { color: '#7C3AED', label: 'Executive' },
            { color: '#885FF2', label: 'Operations' },
            { color: '#0E0486', label: 'Department' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-[11px] text-dna-tundora">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DRAWER
   ═══════════════════════════════════════════════════════════ */

function ApprovalDrawer({ open, onClose, initialData }: {
  open: boolean;
  onClose: () => void;
  initialData?: ApprovalGate | null;
}) {
  const [approvalRequired, setApprovalRequired] = useState(initialData?.approvalRequired ?? true);
  const isEditing = !!initialData;

  useEffect(() => {
    setApprovalRequired(initialData?.approvalRequired ?? true);
  }, [initialData]);

  return (
    <Drawer open={open} onOpenChange={(v: boolean) => !v && onClose()} direction="right">
      <DrawerContent className="!w-[560px] !max-w-[560px]" style={{ maxWidth: 560, width: 560 }}>
        <DrawerHeader className="border-b border-dna-alto pb-4">
          <DrawerTitle className="text-lg font-semibold">
            {isEditing ? 'Configure Approval Gate' : 'New Approval Rule'}
          </DrawerTitle>
          <DrawerDescription className="text-sm text-dna-tundora">
            Define approval workflow for a transaction and use case.
          </DrawerDescription>
        </DrawerHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          {/* Section 1 — Assignment */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-dna-tundora mb-3 flex items-center gap-2">
              <Settings2 className="w-4 h-4" /> Assignment
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-dna-tundora mb-1 block">Client</label>
                <Select defaultValue={initialData?.client || ''}>
                  <SelectTrigger className="w-full bg-white border-dna-alto">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLIENTS.filter((c) => c !== 'All Clients').map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-dna-tundora mb-1 block">Module</label>
                <Select defaultValue={initialData?.module || ''}>
                  <SelectTrigger className="w-full bg-white border-dna-alto">
                    <SelectValue placeholder="Select module" />
                  </SelectTrigger>
                  <SelectContent>
                    {MODULES.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-dna-tundora mb-1 block">Transaction</label>
                <Select defaultValue={initialData?.transaction || ''}>
                  <SelectTrigger className="w-full bg-white border-dna-alto">
                    <SelectValue placeholder="Select transaction" />
                  </SelectTrigger>
                  <SelectContent>
                    {['Journal Voucher', 'Purchase Order', 'Goods Receipt PO', 'Sales Invoice', 'Incoming Payment'].map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-dna-tundora mb-1 block">Use Case</label>
                <Select defaultValue={initialData?.useCase || ''}>
                  <SelectTrigger className="w-full bg-white border-dna-alto">
                    <SelectValue placeholder="Select use case" />
                  </SelectTrigger>
                  <SelectContent>
                    {INITIAL_GATES.map((g) => (
                      <SelectItem key={g.id} value={g.useCase}>{g.useCase}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Section 2 — Approval Settings */}
          <div className="mb-6 border-t border-dna-alto pt-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-dna-tundora mb-3 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> Approval Settings
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="text-sm font-medium">Approval Required</div>
                  <div className="text-xs text-dna-silver">Enable to require approval before processing</div>
                </div>
                <Switch
                  checked={approvalRequired}
                  onCheckedChange={setApprovalRequired}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-dna-tundora mb-1 block">Approval Level</label>
                <Select defaultValue={initialData?.approvalLevel || 'Level 1'}>
                  <SelectTrigger className="w-full bg-white border-dna-alto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Level 1">Level 1</SelectItem>
                    <SelectItem value="Level 2">Level 2</SelectItem>
                    <SelectItem value="Level 3">Level 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-dna-tundora mb-1 block">Approver Role</label>
                <Select defaultValue={initialData?.approverRole || ''}>
                  <SelectTrigger className="w-full bg-white border-dna-alto">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-dna-tundora mb-1 block">Sequence</label>
                <Input
                  type="number"
                  defaultValue={initialData?.sequence || 1}
                  min={0}
                  className="w-full bg-white border-dna-alto"
                />
              </div>
            </div>
          </div>

          {/* Section 3 — Advanced */}
          <div className="mb-6 border-t border-dna-alto pt-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-dna-tundora mb-3">
              Advanced Settings
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-dna-tundora mb-1 block">Validator Responsibility</label>
                <Textarea
                  placeholder="Describe validator duties..."
                  className="w-full bg-white border-dna-alto min-h-[80px]"
                  defaultValue="Review supporting documents and verify compliance with company policy before approval."
                />
              </div>
              <div>
                <label className="text-xs font-medium text-dna-tundora mb-1 block">Output After Approval</label>
                <Input
                  placeholder="e.g., Posted Document, Notification Email"
                  defaultValue="Posted Document + Email Notification"
                  className="w-full bg-white border-dna-alto"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-dna-tundora mb-1 block">Rejection Behavior</label>
                <Select defaultValue="return">
                  <SelectTrigger className="w-full bg-white border-dna-alto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="return">Return to Originator</SelectItem>
                    <SelectItem value="escalate">Escalate to Supervisor</SelectItem>
                    <SelectItem value="reject">Final Rejection</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-dna-tundora mb-1 block">Escalation Notes</label>
                <Textarea
                  placeholder="Add escalation conditions..."
                  className="w-full bg-white border-dna-alto min-h-[80px]"
                  defaultValue="Escalate if not responded within SLA hours or if amount exceeds delegated authority."
                />
              </div>
              <div>
                <label className="text-xs font-medium text-dna-tundora mb-1 block">SLA (Hours)</label>
                <Input
                  type="number"
                  defaultValue={initialData?.slaHours || 24}
                  min={1}
                  className="w-full bg-white border-dna-alto"
                />
              </div>
            </div>
          </div>
        </ScrollArea>

        <DrawerFooter className="border-t border-dna-alto gap-2">
          <DrawerClose asChild>
            <Button variant="ghost" className="flex-1">Cancel</Button>
          </DrawerClose>
          <Button
            className="flex-1 bg-dna-pomegranate text-white hover:bg-red-700"
            onClick={onClose}
          >
            <Check className="w-4 h-4 mr-1.5" /> Save Configuration
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */

export default function ApprovalGateways() {
  const [view, setView] = useState<'list' | 'flow'>('list');
  const [clientFilter, setClientFilter] = useState('All Clients');
  const [moduleFilter, setModuleFilter] = useState('All Modules');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingGate, setEditingGate] = useState<ApprovalGate | null>(null);
  const [gates] = useState<ApprovalGate[]>(INITIAL_GATES);

  const toggleRow = (id: string) => {
    const next = new Set(selectedRows);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedRows(next);
  };

  const openNewRule = () => {
    setEditingGate(null);
    setDrawerOpen(true);
  };

  const openEditRule = (gate: ApprovalGate) => {
    setEditingGate(gate);
    setDrawerOpen(true);
  };

  const filtered = gates.filter((g) => {
    if (clientFilter !== 'All Clients' && g.client !== clientFilter) return false;
    if (moduleFilter !== 'All Modules' && g.module !== moduleFilter) return false;
    if (statusFilter !== 'All Status' && g.status !== statusFilter) return false;
    return true;
  });

  const stats = {
    total: gates.length,
    pending: gates.filter((g) => g.status === 'Pending').length,
    configured: gates.filter((g) => g.status === 'Configured').length,
    escalation: gates.filter((g) => g.slaHours > 24).length,
  };

  const allSelected = filtered.length > 0 && filtered.every((g) => selectedRows.has(g.id));

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
            <h1 className="text-4xl font-bold tracking-tight">Approval Gateways</h1>
            <p className="mt-2 text-base text-dna-tundora">
              Configure approval workflows per transaction type, use case, and client.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="bg-white border-dna-alto text-black hover:bg-dna-cream"
            >
              <Upload className="w-4 h-4 mr-1.5" /> Import Template
            </Button>
            <Button
              onClick={openNewRule}
              className="bg-dna-pomegranate text-white hover:bg-red-700"
            >
              <Plus className="w-4 h-4 mr-1.5" /> New Approval Rule
            </Button>
          </div>
        </motion.div>

        {/* ═══ Summary Stats ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="grid grid-cols-4 gap-4 mb-6"
        >
          {[
            { label: 'Total Approval Gates', value: stats.total, color: '#000000', icon: Shield },
            { label: 'Pending Configuration', value: stats.pending, color: '#F59E0B', icon: Clock },
            { label: 'Fully Configured', value: stats.configured, color: '#10B981', icon: FileCheck },
            { label: 'Escalation Rules', value: stats.escalation, color: '#3B82F6', icon: ShieldAlert },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <Card
                key={i}
                className="bg-white border-dna-alto rounded-xl shadow-xs p-4 flex items-center gap-3"
                style={{ borderBottom: `3px solid ${s.color}` }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${s.color}15` }}
                >
                  <Icon className="w-5 h-5" style={{ color: s.color }} />
                </div>
                <div>
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-xs text-dna-tundora">{s.label}</div>
                </div>
              </Card>
            );
          })}
        </motion.div>

        {/* ═══ Filters & View Toggle ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.16, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="flex items-center justify-between mb-4"
        >
          <div className="flex items-center gap-2">
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger className="w-44 bg-white border-dna-alto">
                <Building2 className="w-4 h-4 mr-1 text-dna-silver" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CLIENTS.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-44 bg-white border-dna-alto">
                <Filter className="w-4 h-4 mr-1 text-dna-silver" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Modules">All Modules</SelectItem>
                {MODULES.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-white border-dna-alto">
                <Check className="w-4 h-4 mr-1 text-dna-silver" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Status">All Status</SelectItem>
                <SelectItem value="Configured">Configured</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Needs Review">Needs Review</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center bg-white border border-dna-alto rounded-lg p-0.5 shadow-xs">
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                view === 'list'
                  ? 'bg-black text-white shadow-sm'
                  : 'text-dna-tundora hover:bg-dna-cream'
              }`}
            >
              <List className="w-4 h-4" /> List View
            </button>
            <button
              onClick={() => setView('flow')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                view === 'flow'
                  ? 'bg-black text-white shadow-sm'
                  : 'text-dna-tundora hover:bg-dna-cream'
              }`}
            >
              <GitBranch className="w-4 h-4" /> Flow View
            </button>
          </div>
        </motion.div>

        {/* ═══ List View ═══ */}
        <AnimatePresence mode="wait">
          {view === 'list' && (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-white border-dna-alto rounded-xl shadow-xs overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-dna-cream hover:bg-dna-cream">
                      <TableHead className="w-10">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedRows(new Set(filtered.map((g) => g.id)));
                            } else {
                              setSelectedRows(new Set());
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead className="text-dna-tundora uppercase text-xs font-semibold w-[25%]">Use Case</TableHead>
                      <TableHead className="text-dna-tundora uppercase text-xs font-semibold w-[15%]">Transaction</TableHead>
                      <TableHead className="text-dna-tundora uppercase text-xs font-semibold w-[12%]">Module</TableHead>
                      <TableHead className="text-dna-tundora uppercase text-xs font-semibold w-[10%]">Level</TableHead>
                      <TableHead className="text-dna-tundora uppercase text-xs font-semibold w-[12%]">Approver</TableHead>
                      <TableHead className="text-dna-tundora uppercase text-xs font-semibold w-[12%]">Client</TableHead>
                      <TableHead className="text-dna-tundora uppercase text-xs font-semibold w-[10%]">Status</TableHead>
                      <TableHead className="text-dna-tundora uppercase text-xs font-semibold w-[8%] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((gate, i) => (
                      <motion.tr
                        key={gate.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.04 }}
                        className="border-b border-dna-alto/60 hover:bg-dna-pampas/60 transition-colors"
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedRows.has(gate.id)}
                            onCheckedChange={() => toggleRow(gate.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-sm">{gate.useCase}</TableCell>
                        <TableCell className="text-sm text-dna-tundora">{gate.transaction}</TableCell>
                        <TableCell><ModuleBadge module={gate.module} /></TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full bg-dna-cream px-2 py-0.5 text-xs font-medium text-dna-tundora">
                            {gate.approvalLevel}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-neutral-100 text-neutral-700">
                            {gate.approverRole}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-dna-tundora">{gate.client}</TableCell>
                        <TableCell><StatusBadge status={gate.status} /></TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-dna-tundora hover:text-black"
                              onClick={() => openEditRule(gate)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-dna-silver hover:text-red-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
                {filtered.length === 0 && (
                  <div className="py-12 text-center text-dna-silver text-sm">
                    No approval gates match the selected filters.
                  </div>
                )}
              </Card>
            </motion.div>
          )}

          {/* ═══ Flow View ═══ */}
          {view === 'flow' && (
            <motion.div
              key="flow"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <FlowDiagram />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ Drawer ═══ */}
        <ApprovalDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          initialData={editingGate}
        />
      </div>
    </div>
  );
}
