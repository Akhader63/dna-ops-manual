import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
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

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

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
    Configured: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    'Needs Review': 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status]}`}>
      {status}
    </span>
  );
}

function ModuleBadge({ module }: { module: string }) {
  const colors: Record<string, string> = {
    'General Ledger': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
    'Procurement': 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800',
    'Inventory': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
    'Sales': 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
    'Accounts Receivable': 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800',
    'Accounts Payable': 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950 dark:text-pink-300 dark:border-pink-800',
    'Banking': 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800',
  };
  return (
    <Badge variant="outline" className={`text-xs ${colors[module] || 'bg-gray-50 text-gray-700 dark:bg-gray-900 dark:text-gray-300'}`}>
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
      className="relative w-full rounded-xl border border-dna-alto dark:border-dna-alto bg-white dark:bg-dna-surface-dark p-8 shadow-xs"
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
                transition={{ delay: li * 0.15 + 0.2, duration: 0.4, ease }}
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
      <div className="absolute bottom-4 left-4 z-10 rounded-lg border border-dna-alto dark:border-dna-alto bg-white/90 dark:bg-dna-surface-dark/90 px-3 py-2 shadow-xs">
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
              <span className="text-[11px] text-dna-tundora dark:text-dna-text-secondary">{item.label}</span>
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
        <DrawerHeader className="border-b border-dna-alto dark:border-dna-alto pb-4">
          <DrawerTitle className="text-lg font-semibold">
            {isEditing ? 'Configure Approval Gate' : 'New Approval Rule'}
          </DrawerTitle>
          <DrawerDescription className="text-sm text-dna-tundora dark:text-dna-text-secondary">
            {isEditing
              ? 'Adjust the approval workflow for this specific use case.'
              : 'Define a new approval checkpoint for your workflows.'}
          </DrawerDescription>
        </DrawerHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-6">
            {/* Module */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-dna-black dark:text-white">Module</label>
              <Select defaultValue={initialData?.module ?? MODULES[0]}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODULES.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Transaction */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-dna-black dark:text-white">Transaction</label>
              <Input defaultValue={initialData?.transaction ?? ''} placeholder="e.g. Purchase Order" />
            </div>

            {/* Use Case */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-dna-black dark:text-white">Use Case</label>
              <Input defaultValue={initialData?.useCase ?? ''} placeholder="e.g. Create New PO" />
            </div>

            {/* Client Scope */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-dna-black dark:text-white">Client Scope</label>
              <Select defaultValue={initialData?.client ?? CLIENTS[0]}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLIENTS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Approver Role */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-dna-black dark:text-white">Approver Role</label>
              <Select defaultValue={initialData?.approverRole ?? ROLES[0]}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Approval Level */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-dna-black dark:text-white">Approval Level</label>
              <Select defaultValue={initialData?.approvalLevel ?? 'L1'}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="L1">Level 1 (Initial)</SelectItem>
                  <SelectItem value="L2">Level 2 (Intermediate)</SelectItem>
                  <SelectItem value="L3">Level 3 (Final)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* SLA Hours */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-dna-black dark:text-white">SLA (Hours)</label>
              <Input type="number" defaultValue={initialData?.slaHours ?? 24} min={1} />
              <p className="text-xs text-dna-silver dark:text-dna-text-muted">Maximum response time expected.</p>
            </div>

            {/* Approval Toggle */}
            <div className="flex items-center justify-between rounded-lg border border-dna-alto dark:border-dna-alto px-4 py-3">
              <div>
                <p className="text-sm font-medium text-dna-black dark:text-white">Approval Required</p>
                <p className="text-xs text-dna-tundora dark:text-dna-text-secondary">This step must be approved before proceeding.</p>
              </div>
              <Switch checked={approvalRequired} onCheckedChange={setApprovalRequired} />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-dna-black dark:text-white">Notes</label>
              <Textarea placeholder="Any additional context or conditions..." rows={3} />
            </div>
          </div>
        </ScrollArea>

        <DrawerFooter className="border-t border-dna-alto dark:border-dna-alto pt-4">
          <div className="flex gap-3 w-full">
            <DrawerClose asChild>
              <Button variant="outline" className="flex-1">Cancel</Button>
            </DrawerClose>
            <Button className="flex-1 bg-dna-black text-white hover:bg-dna-tundora dark:bg-white dark:text-dna-black dark:hover:bg-dna-gallery" onClick={onClose}>
              <Check className="mr-2 h-4 w-4" />
              {isEditing ? 'Save Changes' : 'Create Rule'}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */

export default function SettingsApprovalGateways() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'table' | 'flow'>('table');
  const [gates, setGates] = useState<ApprovalGate[]>(INITIAL_GATES);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingGate, setEditingGate] = useState<ApprovalGate | null>(null);

  const allSelected = gates.length > 0 && selectedIds.size === gates.length;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(gates.map((g) => g.id)));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleEdit = (gate: ApprovalGate) => {
    setEditingGate(gate);
    setDrawerOpen(true);
  };

  const handleNew = () => {
    setEditingGate(null);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setEditingGate(null);
  };

  return (
    <div className="space-y-6">
      {/* Back Button + Title */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="flex items-start gap-4"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/settings')}
          className="shrink-0 mt-1"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-semibold tracking-tight text-dna-black dark:text-white">Approval Gateways</h1>
          <p className="text-sm text-dna-tundora dark:text-dna-text-secondary mt-1">
            Define approval paths, workflow gates, and validation checkpoints.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Upload className="mr-1.5 h-4 w-4" />
            Import
          </Button>
          <Button size="sm" className="bg-dna-black text-white hover:bg-dna-tundora dark:bg-white dark:text-dna-black dark:hover:bg-dna-gallery" onClick={handleNew}>
            <Plus className="mr-1.5 h-4 w-4" />
            New Gate
          </Button>
        </div>
      </motion.div>

      {/* View Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease }}
        className="flex items-center gap-2"
      >
        <Button
          variant={viewMode === 'table' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('table')}
          className={viewMode === 'table' ? 'bg-dna-black text-white hover:bg-dna-tundora dark:bg-white dark:text-dna-black' : ''}
        >
          <List className="mr-1.5 h-4 w-4" />
          Table
        </Button>
        <Button
          variant={viewMode === 'flow' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('flow')}
          className={viewMode === 'flow' ? 'bg-dna-black text-white hover:bg-dna-tundora dark:bg-white dark:text-dna-black' : ''}
        >
          <GitBranch className="mr-1.5 h-4 w-4" />
          Flow
        </Button>
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15, ease }}
      >
        <AnimatePresence mode="wait">
          {viewMode === 'flow' ? (
            <motion.div
              key="flow"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease }}
            >
              <FlowDiagram />
            </motion.div>
          ) : (
            <motion.div
              key="table"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease }}
            >
              <Card className="overflow-hidden border-dna-alto dark:border-dna-alto">
                {gates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="mb-4 rounded-full bg-dna-gallery dark:bg-dna-surface-darker p-4">
                      <ShieldAlert className="h-8 w-8 text-dna-silver" />
                    </div>
                    <h3 className="text-lg font-semibold text-dna-black dark:text-white">No Approval Gates Defined</h3>
                    <p className="mt-1 max-w-sm text-sm text-dna-tundora dark:text-dna-text-secondary">
                      Start by creating a new approval gate or importing existing rules to manage your workflow checkpoints.
                    </p>
                    <div className="mt-6 flex gap-3">
                      <Button variant="outline" size="sm">
                        <Upload className="mr-1.5 h-4 w-4" />
                        Import Rules
                      </Button>
                      <Button size="sm" className="bg-dna-black text-white hover:bg-dna-tundora dark:bg-white dark:text-dna-black dark:hover:bg-dna-gallery" onClick={handleNew}>
                        <Plus className="mr-1.5 h-4 w-4" />
                        Create First Gate
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                        </TableHead>
                        <TableHead>Use Case</TableHead>
                        <TableHead>Transaction</TableHead>
                        <TableHead>Module</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Approver</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-20">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gates.map((gate) => (
                        <TableRow key={gate.id} className={selectedIds.has(gate.id) ? 'bg-dna-gallery/50 dark:bg-dna-surface-darker/50' : ''}>
                          <TableCell>
                            <Checkbox checked={selectedIds.has(gate.id)} onCheckedChange={() => toggleOne(gate.id)} />
                          </TableCell>
                          <TableCell className="font-medium text-dna-black dark:text-white">{gate.useCase}</TableCell>
                          <TableCell className="text-dna-tundora dark:text-dna-text-secondary">{gate.transaction}</TableCell>
                          <TableCell><ModuleBadge module={gate.module} /></TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{gate.approvalLevel}</Badge>
                          </TableCell>
                          <TableCell className="text-dna-tundora dark:text-dna-text-secondary">{gate.approverRole}</TableCell>
                          <TableCell><StatusBadge status={gate.status} /></TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(gate)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Drawer */}
      <ApprovalDrawer open={drawerOpen} onClose={handleCloseDrawer} initialData={editingGate} />
    </div>
  );
}
