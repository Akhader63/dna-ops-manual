// ============================================
// ManualBuilder.tsx — 8-Step Wizard
// Core page for building client operation manuals
// ============================================

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Check,
  ChevronDown,
  FileText,
  Map,
  Users,
  Shield,
  BarChart3,
  Warehouse,
  ShoppingCart,
  Landmark,
  Cpu,
  Truck,
  Factory,
  TrendingUp,
  Layers,
  Plus,
  Trash2,
  Edit3,
  Eye,
  ArrowLeft,
  ArrowRight,
  X,
  Briefcase,
  UserCircle,
  DollarSign,
  Receipt,
  BookOpen,
  Settings,
  Share2,
  Workflow,
  Sparkles,
  Package,
  ShoppingBag,
  CreditCard,
  Calculator,
  Archive,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// ─── Types ───

interface SampleClient {
  id: string;
  name: string;
  industry: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
}

interface ModuleDef {
  id: string;
  name: string;
  color: string;
  icon: string;
  transactionCount: number;
}

interface TransactionDef {
  id: string;
  moduleId: string;
  code: string;
  name: string;
  description: string;
  useCaseCount: number;
}

interface UseCaseDef {
  id: string;
  transactionId: string;
  moduleId: string;
  name: string;
  description: string;
  moduleColor: string;
  transactionCode: string;
  transactionName: string;
  approvalRequired: boolean;
}

interface RoleDef {
  id: string;
  name: string;
  color: string;
  icon: string;
  department: string;
}

interface ApprovalConfig {
  enabled: boolean;
  level: string;
  approverRole: string;
  sequence: number;
  validatorResponsibility: string;
  outputAfter: string;
  rejectionBehavior: string;
  escalationNotes: string;
}

interface ResponsibilityRow {
  id: string;
  role: string;
  roleId: string;
  module: string;
  transaction: string;
  useCase: string;
  responsibility: string;
  canView: boolean;
  canEdit: boolean;
  approves: boolean;
}

interface WizardData {
  clientId: string;
  clientName: string;
  manualName: string;
  manualDescription: string;
  selectedModules: string[];
  selectedTransactions: string[];
  selectedUseCases: string[];
  approvals: Record<string, ApprovalConfig>;
  selectedRoles: string[];
  roleDetails: Record<string, {
    roleName: string;
    reportsTo: string;
    moduleAccess: string[];
    approvalLevel: string;
    threshold: string;
    responsibilities: string;
  }>;
  responsibilityMatrix: ResponsibilityRow[];
  manualFormat: 'pdf' | 'web' | 'both';
  roadmapFormat: 'interactive' | 'pdf' | 'both';
  shareEnabled: boolean;
}

// ─── Empty Data ───

const CLIENT_OPTIONS: SampleClient[] = [];

const MODULES: ModuleDef[] = [];

const TRANSACTIONS: TransactionDef[] = [];

const USE_CASES: UseCaseDef[] = [];

const ROLES: RoleDef[] = [];

const STEP_LABELS = [
  'Client & Modules',
  'Transactions',
  'Use Cases',
  'Approval Gates',
  'Role Definitions',
  'Responsibilities',
  'Review',
  'Generate',
];

// ─── Icon Map ───
const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>> = {
  Landmark, Warehouse, ShoppingCart, ShoppingBag, Users, Factory, BookOpen, Archive,
  TrendingUp, DollarSign, UserCircle, BarChart3, Shield, Calculator, Receipt, CreditCard,
  Package, Briefcase, Workflow, Layers, Cpu, Truck, Building2, Settings, FileText, Map,
  Plus, Trash2, Edit3, Eye,
};

function getIcon(iconName: string, size: number = 20, style?: React.CSSProperties) {
  const Icon = ICON_MAP[iconName] || Layers;
  return <Icon size={size} style={style} />;
}

// ─── Animation Variants ───
const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 20 : -20,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -20 : 20,
    opacity: 0,
  }),
};

// ─── Step 1: Client & Modules ───

function Step1ClientModules({
  data,
  updateData,
}: {
  data: WizardData;
  updateData: (patch: Partial<WizardData>) => void;
}) {
  const selectedClient = CLIENT_OPTIONS.find((c) => c.id === data.clientId);

  const toggleModule = (moduleId: string) => {
    const next = data.selectedModules.includes(moduleId)
      ? data.selectedModules.filter((id) => id !== moduleId)
      : [...data.selectedModules, moduleId];
    updateData({ selectedModules: next });
  };

  const selectAllModules = () => updateData({ selectedModules: MODULES.map((m) => m.id) });
  const clearAllModules = () => updateData({ selectedModules: [] });

  return (
    <div className="grid grid-cols-5 gap-8">
      {/* Left — Client Info */}
      <div className="col-span-2">
        <Card className="border-dna-alto rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Client Information</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {/* Client Selector */}
            <div>
              <label className="text-sm font-medium text-dna-tundora mb-1.5 block">Select Client</label>
              <div className="relative">
                <select
                  className="w-full h-10 px-3 pr-10 rounded-lg border border-dna-alto bg-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-dna-pomegranate/20 focus:border-dna-pomegranate"
                  value={data.clientId}
                  onChange={(e) => {
                    const client = CLIENT_OPTIONS.find((c) => c.id === e.target.value);
                    updateData({
                      clientId: e.target.value,
                      clientName: client?.name ?? '',
                      manualName: client ? `${client.name} \u2014 Operation Manual` : '',
                    });
                  }}
                >
                  <option value="">Choose a client...</option>
                  {CLIENT_OPTIONS.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-dna-silver pointer-events-none" />
              </div>
            </div>

            {/* Selected Client Details */}
            {selectedClient && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-3 p-4 bg-dna-pampas rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-dna-black text-white flex items-center justify-center text-sm font-bold">
                    {selectedClient.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-dna-black">{selectedClient.name}</div>
                    <Badge variant="secondary" className="mt-0.5 bg-dna-cream text-dna-tundora text-[11px]">
                      {selectedClient.industry}
                    </Badge>
                  </div>
                </div>
                <div className="text-xs text-dna-tundora space-y-1">
                  <div><span className="text-dna-silver">Contact:</span> {selectedClient.contactName}</div>
                  <div><span className="text-dna-silver">Email:</span> {selectedClient.contactEmail}</div>
                  <div><span className="text-dna-silver">Phone:</span> {selectedClient.contactPhone}</div>
                </div>
              </motion.div>
            )}

            {/* Manual Name */}
            <div>
              <label className="text-sm font-medium text-dna-tundora mb-1.5 block">Manual Name</label>
              <Input
                value={data.manualName}
                onChange={(e) => updateData({ manualName: e.target.value })}
                placeholder="Enter manual name..."
                className="border-dna-alto focus-visible:ring-dna-pomegranate/20 focus-visible:border-dna-pomegranate"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium text-dna-tundora mb-1.5 block">Description</label>
              <Textarea
                value={data.manualDescription}
                onChange={(e) => updateData({ manualDescription: e.target.value })}
                placeholder="Brief description of this manual..."
                rows={4}
                className="border-dna-alto focus-visible:ring-dna-pomegranate/20 focus-visible:border-dna-pomegranate resize-none"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right — Module Selection */}
      <div className="col-span-3">
        <Card className="border-dna-alto rounded-xl">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Select Applicable Modules</CardTitle>
            <div className="flex items-center gap-3 text-sm">
              <button onClick={selectAllModules} className="text-dna-pomegranate hover:underline font-medium">Select All</button>
              <span className="text-dna-silver">|</span>
              <button onClick={clearAllModules} className="text-dna-tundora hover:text-dna-black hover:underline">Clear All</button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {MODULES.map((mod) => {
                const isSelected = data.selectedModules.includes(mod.id);
                return (
                  <button
                    key={mod.id}
                    onClick={() => toggleModule(mod.id)}
                    className={cn(
                      'relative flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-150 cursor-pointer hover:bg-[#FAFAFA]',
                      isSelected
                        ? 'border-2 border-dna-pomegranate bg-white'
                        : 'border-dna-alto bg-white'
                    )}
                    style={isSelected ? { borderLeftWidth: '4px', borderLeftColor: mod.color } : {}}
                  >
                    {/* Checkbox */}
                    <div className={cn(
                      'absolute top-2.5 right-2.5 w-5 h-5 rounded border flex items-center justify-center transition-all',
                      isSelected ? 'bg-dna-pomegranate border-dna-pomegranate' : 'border-dna-alto'
                    )}>
                      {isSelected && <Check size={12} className="text-white" />}
                    </div>
                    {/* Icon */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${mod.color}15` }}
                    >
                      {getIcon(mod.icon, 20, { color: mod.color })}
                    </div>
                    {/* Info */}
                    <div className="min-w-0 pr-6">
                      <div className="text-sm font-semibold text-dna-black truncate">{mod.name}</div>
                      <div className="text-xs text-dna-tundora">{mod.transactionCount} transactions</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Step 2: Transactions ───

function Step2Transactions({
  data,
  updateData,
}: {
  data: WizardData;
  updateData: (patch: Partial<WizardData>) => void;
}) {
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  const selectedModuleIds = data.selectedModules;
  const selectedModulesData = MODULES.filter((m) => selectedModuleIds.includes(m.id));
  const transactionsForModules = TRANSACTIONS.filter((t) => selectedModuleIds.includes(t.moduleId));

  const toggleTransaction = (txId: string) => {
    const next = data.selectedTransactions.includes(txId)
      ? data.selectedTransactions.filter((id) => id !== txId)
      : [...data.selectedTransactions, txId];
    updateData({ selectedTransactions: next });
  };

  const selectAllInModule = (moduleId: string) => {
    const moduleTxIds = TRANSACTIONS.filter((t) => t.moduleId === moduleId).map((t) => t.id);
    const newSelected = [...new Set([...data.selectedTransactions, ...moduleTxIds])];
    updateData({ selectedTransactions: newSelected });
  };

  const deselectAllInModule = (moduleId: string) => {
    const moduleTxIds = TRANSACTIONS.filter((t) => t.moduleId === moduleId).map((t) => t.id);
    updateData({ selectedTransactions: data.selectedTransactions.filter((id) => !moduleTxIds.includes(id)) });
  };

  const selectAllTransactions = () => {
    updateData({ selectedTransactions: transactionsForModules.map((t) => t.id) });
  };

  const clearAllTransactions = () => updateData({ selectedTransactions: [] });

  const toggleExpand = (moduleId: string) => {
    setExpandedModules((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Select Transactions</h2>
          <p className="text-sm text-dna-tundora mt-1">
            {selectedModulesData.length} of {MODULES.length} modules &rarr; {transactionsForModules.length} transactions available
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <button onClick={selectAllTransactions} className="text-dna-pomegranate hover:underline font-medium">Select All</button>
          <span className="text-dna-silver">|</span>
          <button onClick={clearAllTransactions} className="text-dna-tundora hover:text-dna-black hover:underline">None</button>
        </div>
      </div>

      {/* Module Accordion Groups */}
      <div className="flex flex-col gap-3">
        {selectedModulesData.map((mod) => {
          const modTransactions = TRANSACTIONS.filter((t) => t.moduleId === mod.id);
          const isExpanded = expandedModules[mod.id] ?? true;
          const allSelected = modTransactions.length > 0 && modTransactions.every((t) => data.selectedTransactions.includes(t.id));

          return (
            <Card key={mod.id} className="border-dna-alto rounded-xl overflow-hidden">
              {/* Accordion Header */}
              <button
                onClick={() => toggleExpand(mod.id)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#FAFAFA] transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${mod.color}15` }}>
                    {getIcon(mod.icon, 16, { color: mod.color })}
                  </div>
                  <span className="text-sm font-semibold text-dna-black">{mod.name}</span>
                  <Badge variant="secondary" className="bg-dna-cream text-dna-tundora text-[11px]">
                    {modTransactions.length} transactions
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (allSelected) {
                        deselectAllInModule(mod.id);
                      } else {
                        selectAllInModule(mod.id);
                      }
                    }}
                    className="text-xs font-medium text-dna-pomegranate hover:underline"
                  >
                    {allSelected ? 'Deselect All' : 'Select All'}
                  </button>
                  <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={18} className="text-dna-silver" />
                  </motion.div>
                </div>
              </button>

              {/* Transaction Rows */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-dna-mercury">
                      {modTransactions.map((tx) => {
                        const isSelected = data.selectedTransactions.includes(tx.id);
                        return (
                          <div
                            key={tx.id}
                            onClick={() => toggleTransaction(tx.id)}
                            className={cn(
                              'flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-colors border-l-[3px] hover:bg-dna-pampas',
                              isSelected ? 'border-l-dna-pomegranate bg-dna-pampas/50' : 'border-l-transparent'
                            )}
                          >
                            <div className={cn(
                              'w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-all',
                              isSelected ? 'bg-dna-pomegranate border-dna-pomegranate' : 'border-dna-alto'
                            )}>
                              {isSelected && <Check size={12} className="text-white" />}
                            </div>
                            <span className="text-xs font-mono text-dna-silver w-16 shrink-0">{tx.code}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-dna-black">{tx.name}</div>
                              <div className="text-xs text-dna-tundora truncate">{tx.description}</div>
                            </div>
                            <Badge variant="secondary" className="bg-dna-cream text-dna-tundora text-[11px] shrink-0">
                              {tx.useCaseCount} use cases
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 3: Use Cases ───

function Step3UseCases({
  data,
  updateData,
}: {
  data: WizardData;
  updateData: (patch: Partial<WizardData>) => void;
}) {
  const [filterTx, setFilterTx] = useState<string>('all');

  const availableUseCases = USE_CASES.filter(
    (uc) => data.selectedTransactions.includes(uc.transactionId)
  );

  const filteredUseCases = filterTx === 'all'
    ? availableUseCases
    : availableUseCases.filter((uc) => uc.transactionId === filterTx);

  const toggleUseCase = (ucId: string) => {
    const next = data.selectedUseCases.includes(ucId)
      ? data.selectedUseCases.filter((id) => id !== ucId)
      : [...data.selectedUseCases, ucId];
    updateData({ selectedUseCases: next });
  };

  const selectAll = () => updateData({ selectedUseCases: filteredUseCases.map((uc) => uc.id) });
  const clearAll = () => updateData({ selectedUseCases: [] });

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Select Use Cases</h2>
          <p className="text-sm text-dna-tundora mt-1">
            {data.selectedUseCases.length} of {availableUseCases.length} use cases selected
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <select
              value={filterTx}
              onChange={(e) => setFilterTx(e.target.value)}
              className="h-9 px-3 pr-8 rounded-lg border border-dna-alto bg-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-dna-pomegranate/20"
            >
              <option value="all">All Transactions</option>
              {data.selectedTransactions.map((txId) => {
                const tx = TRANSACTIONS.find((t) => t.id === txId);
                return tx ? <option key={txId} value={txId}>{tx.code} - {tx.name}</option> : null;
              })}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-dna-silver pointer-events-none" />
          </div>
          <div className="flex items-center gap-3 text-sm">
            <button onClick={selectAll} className="text-dna-pomegranate hover:underline font-medium">Select All</button>
            <span className="text-dna-silver">|</span>
            <button onClick={clearAll} className="text-dna-tundora hover:text-dna-black hover:underline">None</button>
          </div>
        </div>
      </div>

      {/* Use Case Grid */}
      <div className="grid grid-cols-3 gap-4">
        {filteredUseCases.map((uc) => {
          const isSelected = data.selectedUseCases.includes(uc.id);
          return (
            <motion.div
              key={uc.id}
              whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}
              onClick={() => toggleUseCase(uc.id)}
              className={cn(
                'relative bg-white rounded-xl border p-5 cursor-pointer transition-all duration-150',
                isSelected ? 'border-2 border-dna-pomegranate' : 'border-dna-alto hover:border-dna-silver'
              )}
            >
              {/* Top stripe */}
              <div
                className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                style={{ backgroundColor: uc.moduleColor }}
              />

              {/* Selection circle */}
              <div className={cn(
                'absolute top-3 right-3 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                isSelected ? 'bg-dna-pomegranate border-dna-pomegranate' : 'border-dna-alto'
              )}>
                {isSelected && <Check size={14} className="text-white" />}
              </div>

              {/* Content */}
              <div className="mt-3">
                <h3 className="text-[15px] font-semibold text-dna-black leading-tight pr-8">{uc.name}</h3>
                <p className="text-[13px] text-dna-tundora mt-2 line-clamp-3 leading-relaxed">{uc.description}</p>

                {/* Metadata */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  <Badge variant="secondary" className="text-[11px]" style={{ backgroundColor: `${uc.moduleColor}15`, color: uc.moduleColor }}>
                    {MODULES.find((m) => m.id === uc.moduleId)?.name}
                  </Badge>
                  <Badge variant="secondary" className="bg-dna-cream text-dna-tundora text-[11px]">
                    {uc.transactionCode}
                  </Badge>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-dna-mercury">
                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-[11px]',
                      uc.approvalRequired ? 'bg-[#FEF3C7] text-[#D97706]' : 'bg-dna-cream text-dna-tundora'
                    )}
                  >
                    {uc.approvalRequired ? 'Approval Required' : 'No Approval'}
                  </Badge>
                  <span className="text-xs text-dna-pomegranate font-medium flex items-center gap-1">
                    View Details <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 4: Approval Gates ───

function Step4ApprovalGates({
  data,
  updateData,
}: {
  data: WizardData;
  updateData: (patch: Partial<WizardData>) => void;
}) {
  const [globalEnabled, setGlobalEnabled] = useState(true);
  const [expandedConfig, setExpandedConfig] = useState<string | null>(null);

  const selectedUseCases = USE_CASES.filter((uc) => data.selectedUseCases.includes(uc.id));

  const getApprovalConfig = (ucId: string): ApprovalConfig => {
    return data.approvals[ucId] ?? {
      enabled: false,
      level: 'L1',
      approverRole: '',
      sequence: 1,
      validatorResponsibility: '',
      outputAfter: '',
      rejectionBehavior: 'return',
      escalationNotes: '',
    };
  };

  const updateApproval = (ucId: string, patch: Partial<ApprovalConfig>) => {
    const current = getApprovalConfig(ucId);
    updateData({
      approvals: { ...data.approvals, [ucId]: { ...current, ...patch } },
    });
  };

  // Group by module then transaction
  const grouped = useMemo(() => {
    const result: Record<string, Record<string, UseCaseDef[]>> = {};
    selectedUseCases.forEach((uc) => {
      if (!result[uc.moduleId]) result[uc.moduleId] = {};
      if (!result[uc.moduleId][uc.transactionId]) result[uc.moduleId][uc.transactionId] = [];
      result[uc.moduleId][uc.transactionId].push(uc);
    });
    return result;
  }, [selectedUseCases]);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Configure Approval Gates</h2>
          <p className="text-sm text-dna-tundora mt-1">
            {selectedUseCases.length} use cases selected for approval configuration
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white border border-dna-alto rounded-lg px-4 py-2.5">
          <span className="text-sm font-medium text-dna-black">Enable approvals</span>
          <Switch checked={globalEnabled} onCheckedChange={setGlobalEnabled} />
        </div>
      </div>

      {globalEnabled && (
        <div className="flex flex-col gap-4">
          {Object.entries(grouped).map(([moduleId, txGroup]) => {
            const mod = MODULES.find((m) => m.id === moduleId);
            if (!mod) return null;

            return (
              <div key={moduleId}>
                {/* Module Header */}
                <div className="flex items-center gap-3 px-4 py-3 bg-dna-cream rounded-t-lg">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: `${mod.color}15` }}>
                    {getIcon(mod.icon, 14, { color: mod.color })}
                  </div>
                  <span className="text-sm font-semibold text-dna-black">{mod.name}</span>
                </div>

                <div className="bg-white border border-t-0 border-dna-alto rounded-b-lg">
                  {Object.entries(txGroup).map(([txId, ucs]) => {
                    const tx = TRANSACTIONS.find((t) => t.id === txId);
                    if (!tx) return null;

                    return (
                      <div key={txId} className="border-b border-dna-mercury last:border-b-0">
                        {/* Transaction header */}
                        <div className="flex items-center justify-between px-4 py-2.5 bg-[#FAFAFA]">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-dna-silver">{tx.code}</span>
                            <span className="text-sm font-medium text-dna-black">{tx.name}</span>
                          </div>
                          <button
                            onClick={() => {
                              const allEnabled = ucs.every((uc) => getApprovalConfig(uc.id).enabled);
                              ucs.forEach((uc) => updateApproval(uc.id, { enabled: !allEnabled }));
                            }}
                            className="text-xs font-medium text-dna-pomegranate hover:underline"
                          >
                                Toggle All
                              </button>
                        </div>

                        {/* Use case rows */}
                        {ucs.map((uc) => {
                          const cfg = getApprovalConfig(uc.id);
                          const isExpanded = expandedConfig === uc.id;

                          return (
                            <div key={uc.id} className="px-4 py-3 border-t border-dna-mercury/50">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Switch
                                    checked={cfg.enabled}
                                    onCheckedChange={(checked) => {
                                      updateApproval(uc.id, { enabled: checked });
                                      if (checked) setExpandedConfig(uc.id);
                                    }}
                                  />
                                  <span className={cn('text-sm font-medium', cfg.enabled ? 'text-dna-black' : 'text-dna-silver')}>
                                    {uc.name}
                                  </span>
                                </div>
                                {cfg.enabled && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setExpandedConfig(isExpanded ? null : uc.id)}
                                    className="h-7 text-xs border-dna-alto"
                                  >
                                    {isExpanded ? 'Hide' : 'Configure'}
                                  </Button>
                                )}
                              </div>

                              {/* Approval Detail Panel */}
                              <AnimatePresence>
                                {isExpanded && cfg.enabled && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="mt-3 p-4 bg-dna-pampas rounded-lg grid grid-cols-2 gap-4">
                                      <div>
                                        <label className="text-xs font-medium text-dna-tundora mb-1 block">Approval Level</label>
                                        <select
                                          value={cfg.level}
                                          onChange={(e) => updateApproval(uc.id, { level: e.target.value })}
                                          className="w-full h-9 px-3 rounded-lg border border-dna-alto bg-white text-sm focus:outline-none focus:ring-2 focus:ring-dna-pomegranate/20"
                                        >
                                          <option value="L1">Level 1</option>
                                          <option value="L2">Level 2</option>
                                          <option value="L3">Level 3</option>
                                        </select>
                                      </div>
                                      <div>
                                        <label className="text-xs font-medium text-dna-tundora mb-1 block">Approver Role</label>
                                        <select
                                          value={cfg.approverRole}
                                          onChange={(e) => updateApproval(uc.id, { approverRole: e.target.value })}
                                          className="w-full h-9 px-3 rounded-lg border border-dna-alto bg-white text-sm focus:outline-none focus:ring-2 focus:ring-dna-pomegranate/20"
                                        >
                                          <option value="">Select role...</option>
                                          {ROLES.map((r) => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                          ))}
                                        </select>
                                      </div>
                                      <div>
                                        <label className="text-xs font-medium text-dna-tundora mb-1 block">Sequence</label>
                                        <Input
                                          type="number"
                                          value={cfg.sequence}
                                          onChange={(e) => updateApproval(uc.id, { sequence: parseInt(e.target.value) || 1 })}
                                          className="h-9 border-dna-alto"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-xs font-medium text-dna-tundora mb-1 block">Rejection Behavior</label>
                                        <select
                                          value={cfg.rejectionBehavior}
                                          onChange={(e) => updateApproval(uc.id, { rejectionBehavior: e.target.value })}
                                          className="w-full h-9 px-3 rounded-lg border border-dna-alto bg-white text-sm focus:outline-none focus:ring-2 focus:ring-dna-pomegranate/20"
                                        >
                                          <option value="return">Return to Initiator</option>
                                          <option value="escalate">Escalate to Manager</option>
                                          <option value="reject">Final Rejection</option>
                                        </select>
                                      </div>
                                      <div>
                                        <label className="text-xs font-medium text-dna-tundora mb-1 block">Output After Approval</label>
                                        <Input
                                          value={cfg.outputAfter}
                                          onChange={(e) => updateApproval(uc.id, { outputAfter: e.target.value })}
                                          placeholder="e.g., Approved Purchase Order"
                                          className="h-9 border-dna-alto"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-xs font-medium text-dna-tundora mb-1 block">Validator Responsibility</label>
                                        <Textarea
                                          value={cfg.validatorResponsibility}
                                          onChange={(e) => updateApproval(uc.id, { validatorResponsibility: e.target.value })}
                                          placeholder="Describe validator duties..."
                                          rows={2}
                                          className="border-dna-alto text-sm resize-none"
                                        />
                                      </div>
                                      <div className="col-span-2">
                                        <label className="text-xs font-medium text-dna-tundora mb-1 block">Escalation Notes</label>
                                        <Textarea
                                          value={cfg.escalationNotes}
                                          onChange={(e) => updateApproval(uc.id, { escalationNotes: e.target.value })}
                                          placeholder="Notes about escalation procedures..."
                                          rows={2}
                                          className="border-dna-alto text-sm resize-none"
                                        />
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Step 5: Role Definitions ───

function Step5RoleDefinitions({
  data,
  updateData,
}: {
  data: WizardData;
  updateData: (patch: Partial<WizardData>) => void;
}) {
  const [activeRole, setActiveRole] = useState<string | null>(null);

  const toggleRole = (roleId: string) => {
    const next = data.selectedRoles.includes(roleId)
      ? data.selectedRoles.filter((id) => id !== roleId)
      : [...data.selectedRoles, roleId];
    updateData({ selectedRoles: next });
    if (!data.selectedRoles.includes(roleId)) {
      setActiveRole(roleId);
    }
  };

  const updateRoleDetail = (roleId: string, patch: Partial<WizardData['roleDetails'][string]>) => {
    const current = data.roleDetails[roleId] ?? {
      roleName: ROLES.find((r) => r.id === roleId)?.name ?? '',
      reportsTo: '',
      moduleAccess: [],
      approvalLevel: '',
      threshold: '',
      responsibilities: '',
    };
    updateData({
      roleDetails: { ...data.roleDetails, [roleId]: { ...current, ...patch } },
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Define Client Roles</h2>
          <p className="text-sm text-dna-tundora mt-1">
            {data.selectedRoles.length} of {ROLES.length} roles selected
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {ROLES.map((role) => {
          const isSelected = data.selectedRoles.includes(role.id);
          const isActive = activeRole === role.id;

          return (
            <div key={role.id}>
              <motion.div
                whileHover={{ y: -1 }}
                onClick={() => toggleRole(role.id)}
                className={cn(
                  'flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all',
                  isSelected ? 'border-dna-pomegranate bg-white' : 'border-dna-alto bg-white hover:border-dna-silver'
                )}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${role.color}15` }}
                >
                  {getIcon(role.icon, 32, { color: role.color })}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-dna-black">{role.name}</div>
                  <div className="text-xs text-dna-tundora">{role.department}</div>
                </div>
                <div className={cn(
                  'w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-all',
                  isSelected ? 'bg-dna-pomegranate border-dna-pomegranate' : 'border-dna-alto'
                )}>
                  {isSelected && <Check size={12} className="text-white" />}
                </div>
              </motion.div>

              {/* Role Detail Panel */}
              <AnimatePresence>
                {isSelected && isActive && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 p-4 bg-dna-pampas rounded-lg border border-dna-mercury">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-dna-black">Role Details</span>
                        <button onClick={(e) => { e.stopPropagation(); setActiveRole(null); }} className="text-dna-silver hover:text-dna-black">
                          <X size={14} />
                        </button>
                      </div>
                      <div className="flex flex-col gap-3">
                        <div>
                          <label className="text-xs font-medium text-dna-tundora mb-1 block">Reports To</label>
                          <select
                            value={data.roleDetails[role.id]?.reportsTo ?? ''}
                            onChange={(e) => updateRoleDetail(role.id, { reportsTo: e.target.value })}
                            className="w-full h-8 px-2 rounded-md border border-dna-alto bg-white text-sm"
                          >
                            <option value="">Select...</option>
                            {ROLES.filter((r) => r.id !== role.id).map((r) => (
                              <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-dna-tundora mb-1 block">Module Access</label>
                          <div className="flex flex-wrap gap-1">
                            {MODULES.filter((m) => data.selectedModules.includes(m.id)).map((mod) => {
                              const hasAccess = data.roleDetails[role.id]?.moduleAccess?.includes(mod.id) ?? false;
                              return (
                                <button
                                  key={mod.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const current = data.roleDetails[role.id]?.moduleAccess ?? [];
                                    const next = current.includes(mod.id)
                                      ? current.filter((id) => id !== mod.id)
                                      : [...current, mod.id];
                                    updateRoleDetail(role.id, { moduleAccess: next });
                                  }}
                                  className={cn(
                                    'px-2 py-0.5 rounded text-[11px] font-medium border transition-all',
                                    hasAccess ? 'border-dna-pomegranate text-dna-pomegranate bg-red-50' : 'border-dna-alto text-dna-tundora'
                                  )}
                                >
                                  {mod.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-medium text-dna-tundora mb-1 block">Approval Level</label>
                            <select
                              value={data.roleDetails[role.id]?.approvalLevel ?? ''}
                              onChange={(e) => updateRoleDetail(role.id, { approvalLevel: e.target.value })}
                              className="w-full h-8 px-2 rounded-md border border-dna-alto bg-white text-sm"
                            >
                              <option value="">None</option>
                              <option value="L1">L1 - Basic</option>
                              <option value="L2">L2 - Manager</option>
                              <option value="L3">L3 - Executive</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-dna-tundora mb-1 block">Threshold</label>
                            <Input
                              value={data.roleDetails[role.id]?.threshold ?? ''}
                              onChange={(e) => updateRoleDetail(role.id, { threshold: e.target.value })}
                              placeholder="e.g. $10,000"
                              className="h-8 border-dna-alto text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-dna-tundora mb-1 block">Responsibilities</label>
                          <Textarea
                            value={data.roleDetails[role.id]?.responsibilities ?? ''}
                            onChange={(e) => updateRoleDetail(role.id, { responsibilities: e.target.value })}
                            placeholder="Describe key responsibilities..."
                            rows={3}
                            className="border-dna-alto text-sm resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!isActive && isSelected && (
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveRole(role.id); }}
                  className="mt-1.5 ml-1 text-xs text-dna-pomegranate hover:underline font-medium"
                >
                  Define Details &rarr;
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 6: Responsibility Matrix ───

function Step6ResponsibilityMatrix({
  data,
  updateData,
}: {
  data: WizardData;
  updateData: (patch: Partial<WizardData>) => void;
}) {
  const matrix = data.responsibilityMatrix;

  const addRow = () => {
    const firstRole = data.selectedRoles[0] ? ROLES.find((r) => r.id === data.selectedRoles[0]) : undefined;
    const firstMod = data.selectedModules[0] ? MODULES.find((m) => m.id === data.selectedModules[0]) : undefined;
    const newRow: ResponsibilityRow = {
      id: `row_${Date.now()}`,
      role: firstRole?.name ?? 'Select Role',
      roleId: firstRole?.id ?? '',
      module: firstMod?.name ?? 'Select Module',
      transaction: 'Select Transaction',
      useCase: 'Select Use Case',
      responsibility: 'R',
      canView: true,
      canEdit: false,
      approves: false,
    };
    updateData({ responsibilityMatrix: [...matrix, newRow] });
  };

  const updateRow = (rowId: string, patch: Partial<ResponsibilityRow>) => {
    updateData({
      responsibilityMatrix: matrix.map((r) => (r.id === rowId ? { ...r, ...patch } : r)),
    });
  };

  const deleteRow = (rowId: string) => {
    updateData({ responsibilityMatrix: matrix.filter((r) => r.id !== rowId) });
  };

  const respOptions = [
    { value: 'R', label: 'R - Responsible' },
    { value: 'A', label: 'A - Accountable' },
    { value: 'C', label: 'C - Consulted' },
    { value: 'I', label: 'I - Informed' },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Responsibility Matrix</h2>
          <p className="text-sm text-dna-tundora mt-1">{matrix.length} responsibility assignments defined</p>
        </div>
        <Button onClick={addRow} className="bg-black text-white hover:bg-dna-tundora text-sm gap-2">
          <Plus size={16} /> Add Row
        </Button>
      </div>

      <Card className="border-dna-alto rounded-xl overflow-hidden">
        <ScrollArea className="max-h-[600px]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-dna-cream z-10">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-dna-tundora">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-dna-tundora">Module</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-dna-tundora">Transaction</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-dna-tundora">Use Case</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-dna-tundora">Type</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-dna-tundora">View</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-dna-tundora">Edit</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-dna-tundora">Approve</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((row) => (
                <tr
                  key={row.id}
                  className="border-t border-dna-mercury hover:bg-dna-pampas transition-colors group"
                >
                  <td className="px-4 py-2.5">
                    <select
                      value={row.roleId}
                      onChange={(e) => {
                        const role = ROLES.find((r) => r.id === e.target.value);
                        updateRow(row.id, { roleId: e.target.value, role: role?.name ?? '' });
                      }}
                      className="w-full h-8 px-2 rounded border border-dna-alto bg-white text-xs"
                    >
                      <option value="">Select...</option>
                      {ROLES.filter((r) => data.selectedRoles.includes(r.id)).map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2.5">
                    <select
                      value={MODULES.find((m) => m.name === row.module)?.id ?? ''}
                      onChange={(e) => {
                        const mod = MODULES.find((m) => m.id === e.target.value);
                        updateRow(row.id, { module: mod?.name ?? '' });
                      }}
                      className="w-full h-8 px-2 rounded border border-dna-alto bg-white text-xs"
                    >
                      <option value="">Select...</option>
                      {MODULES.filter((m) => data.selectedModules.includes(m.id)).map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2.5">
                    <select
                      value={TRANSACTIONS.find((t) => t.name === row.transaction)?.id ?? ''}
                      onChange={(e) => {
                        const tx = TRANSACTIONS.find((t) => t.id === e.target.value);
                        updateRow(row.id, { transaction: tx?.name ?? '' });
                      }}
                      className="w-full h-8 px-2 rounded border border-dna-alto bg-white text-xs"
                    >
                      <option value="">Select...</option>
                      {TRANSACTIONS.filter((t) => data.selectedTransactions.includes(t.id)).map((t) => (
                        <option key={t.id} value={t.id}>{t.code} - {t.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2.5">
                    <select
                      value={USE_CASES.find((uc) => uc.name === row.useCase)?.id ?? ''}
                      onChange={(e) => {
                        const uc = USE_CASES.find((u) => u.id === e.target.value);
                        updateRow(row.id, { useCase: uc?.name ?? '' });
                      }}
                      className="w-full h-8 px-2 rounded border border-dna-alto bg-white text-xs"
                    >
                      <option value="">Select...</option>
                      {USE_CASES.filter((uc) => data.selectedUseCases.includes(uc.id)).map((uc) => (
                        <option key={uc.id} value={uc.id}>{uc.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2.5">
                    <select
                      value={row.responsibility}
                      onChange={(e) => updateRow(row.id, { responsibility: e.target.value })}
                      className="h-8 px-2 rounded border border-dna-alto bg-white text-xs font-mono"
                    >
                      {respOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <Switch
                      checked={row.canView}
                      onCheckedChange={(checked) => updateRow(row.id, { canView: checked })}
                      className="scale-75"
                    />
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <Switch
                      checked={row.canEdit}
                      onCheckedChange={(checked) => updateRow(row.id, { canEdit: checked })}
                      className="scale-75"
                    />
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <Switch
                      checked={row.approves}
                      onCheckedChange={(checked) => updateRow(row.id, { approves: checked })}
                      className="scale-75"
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => deleteRow(row.id)}
                      className="opacity-0 group-hover:opacity-100 text-dna-silver hover:text-red-500 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
      </Card>
    </div>
  );
}

// ─── Step 7: Review ───

function Step7Review({
  data,
}: {
  data: WizardData;
}) {
  const selectedModulesData = MODULES.filter((m) => data.selectedModules.includes(m.id));
  const selectedTransactionsData = TRANSACTIONS.filter((t) => data.selectedTransactions.includes(t.id));
  const selectedUseCasesData = USE_CASES.filter((uc) => data.selectedUseCases.includes(uc.id));
  const selectedRolesData = ROLES.filter((r) => data.selectedRoles.includes(r.id));
  const approvalCount = Object.values(data.approvals).filter((a) => a.enabled).length;

  const sections = [
    {
      title: 'Client & Modules',
      status: data.clientId ? 'complete' : 'attention',
      content: (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Building2 size={18} className="text-dna-silver" />
            <div>
              <div className="text-sm font-medium text-dna-black">{data.clientName || 'No client selected'}</div>
              <div className="text-xs text-dna-tundora">{data.manualName}</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedModulesData.map((mod) => (
              <Badge key={mod.id} variant="secondary" style={{ backgroundColor: `${mod.color}15`, color: mod.color }} className="text-xs">
                {mod.name}
              </Badge>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: 'Transactions',
      status: selectedTransactionsData.length > 0 ? 'complete' : 'attention',
      content: (
        <div>
          <div className="text-sm text-dna-tundora mb-2">{selectedTransactionsData.length} transactions selected</div>
          <div className="flex flex-wrap gap-1.5">
            {selectedTransactionsData.map((tx) => (
              <Badge key={tx.id} variant="secondary" className="bg-dna-cream text-dna-tundora text-[11px]">
                {tx.code}
              </Badge>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: 'Use Cases',
      status: selectedUseCasesData.length > 0 ? 'complete' : 'attention',
      content: (
        <div>
          <div className="text-sm text-dna-tundora mb-2">{selectedUseCasesData.length} use cases selected</div>
          <div className="grid grid-cols-2 gap-1.5">
            {selectedUseCasesData.slice(0, 6).map((uc) => (
              <div key={uc.id} className="text-xs text-dna-black truncate">&bull; {uc.name}</div>
            ))}
            {selectedUseCasesData.length > 6 && (
              <div className="text-xs text-dna-silver">+{selectedUseCasesData.length - 6} more</div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Approval Gates',
      status: approvalCount > 0 ? 'complete' : 'attention',
      content: (
        <div>
          <div className="text-sm text-dna-tundora mb-2">{approvalCount} of {selectedUseCasesData.length} use cases have approvals configured</div>
          <div className="bg-dna-pampas rounded-lg p-3">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-dna-tundora">
                  <th className="text-left pb-2">Use Case</th>
                  <th className="text-left pb-2">Level</th>
                  <th className="text-left pb-2">Approver</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(data.approvals)
                  .filter(([, a]) => a.enabled)
                  .slice(0, 5)
                  .map(([ucId, a]) => {
                    const uc = USE_CASES.find((u) => u.id === ucId);
                    return (
                      <tr key={ucId} className="border-t border-dna-mercury/50">
                        <td className="py-1.5 text-dna-black">{uc?.name ?? ucId}</td>
                        <td className="py-1.5 text-dna-tundora">{a.level}</td>
                        <td className="py-1.5 text-dna-tundora">
                          {ROLES.find((r) => r.id === a.approverRole)?.name ?? 'Not set'}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      ),
    },
    {
      title: 'Roles',
      status: selectedRolesData.length > 0 ? 'complete' : 'attention',
      content: (
        <div className="flex flex-wrap gap-2">
          {selectedRolesData.map((role) => (
            <div
              key={role.id}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-dna-alto rounded-lg"
            >
              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: `${role.color}15` }}>
                {getIcon(role.icon, 12, { color: role.color })}
              </div>
              <span className="text-xs font-medium text-dna-black">{role.name}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Responsibilities',
      status: data.responsibilityMatrix.length > 0 ? 'complete' : 'attention',
      content: (
        <div>
          <div className="text-sm text-dna-tundora mb-2">{data.responsibilityMatrix.length} responsibility rows defined</div>
          <div className="bg-dna-pampas rounded-lg p-3">
            {data.responsibilityMatrix.slice(0, 3).map((row) => (
              <div key={row.id} className="flex items-center gap-3 py-1.5 text-xs border-b border-dna-mercury/50 last:border-b-0">
                <span className="font-medium text-dna-black">{row.role}</span>
                <span className="text-dna-silver">&rarr;</span>
                <span className="text-dna-tundora">{row.useCase || row.transaction}</span>
                <Badge variant="secondary" className="text-[10px] bg-dna-cream">{row.responsibility}</Badge>
              </div>
            ))}
            {data.responsibilityMatrix.length > 3 && (
              <div className="text-xs text-dna-silver mt-1">+{data.responsibilityMatrix.length - 3} more rows</div>
            )}
          </div>
        </div>
      ),
    },
  ];

  const allComplete = sections.every((s) => s.status === 'complete');

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Review Your Manual</h2>
          <p className="text-sm text-dna-tundora mt-1">Verify all configurations before generating</p>
        </div>
      </div>

      {/* Status Banner */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium',
        allComplete ? 'bg-[#D1FAE5] text-[#059669]' : 'bg-[#FEF3C7] text-[#D97706]'
      )}>
        {allComplete ? <Check size={18} /> : <Edit3 size={18} />}
        {allComplete
          ? 'All sections complete \u2014 ready to generate'
          : `${sections.filter((s) => s.status === 'attention').length} section(s) need attention`
        }
      </div>

      {/* Review Sections */}
      <Accordion type="multiple" className="flex flex-col gap-3">
        {sections.map((section, i) => (
          <AccordionItem key={i} value={`section-${i}`} className="border border-dna-alto rounded-xl overflow-hidden px-0">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-[#FAFAFA] text-sm">
              <div className="flex items-center gap-3">
                <span className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center',
                  section.status === 'complete' ? 'bg-status-green' : 'bg-status-amber'
                )}>
                  {section.status === 'complete' ? <Check size={12} className="text-white" /> : <span className="text-white text-[10px] font-bold">!</span>}
                </span>
                <span className="font-semibold text-dna-black">{section.title}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              {section.content}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

// ─── Step 8: Generate ───

function Step8Generate({
  data,
  updateData,
  navigate,
}: {
  data: WizardData;
  updateData: (patch: Partial<WizardData>) => void;
  navigate: (path: string) => void;
}) {
  const [generated, setGenerated] = useState(false);

  if (generated) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-[600px] mx-auto flex flex-col items-center text-center gap-6 py-8"
      >
        {/* Success Check */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          className="w-16 h-16 rounded-full bg-status-green flex items-center justify-center"
        >
          <Check size={32} className="text-white" />
        </motion.div>

        <div>
          <h2 className="text-2xl font-bold text-dna-black">Manual generated successfully!</h2>
          <p className="text-sm text-dna-tundora mt-2">
            {data.manualName} is ready for viewing and sharing.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-2 gap-4 w-full mt-4">
          <button
            onClick={() => navigate('/manual-preview')}
            className="flex flex-col items-center gap-3 p-5 bg-white border border-dna-alto rounded-xl hover:border-dna-silver hover:shadow-lg transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-dna-black flex items-center justify-center">
              <FileText size={24} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold text-dna-black">View Manual</div>
              <div className="text-xs text-dna-tundora">Open in preview mode</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/roadmap-generator')}
            className="flex flex-col items-center gap-3 p-5 bg-white border border-dna-alto rounded-xl hover:border-dna-silver hover:shadow-lg transition-all"
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F3350C15' }}>
              <Map size={24} className="text-dna-pomegranate" />
            </div>
            <div>
              <div className="text-sm font-semibold text-dna-black">View Roadmap</div>
              <div className="text-xs text-dna-tundora">Interactive process flow</div>
            </div>
          </button>

          <button
            onClick={() => alert('Share link copied to clipboard!')}
            className="flex flex-col items-center gap-3 p-5 bg-white border border-dna-alto rounded-xl hover:border-dna-silver hover:shadow-lg transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-dna-cream flex items-center justify-center">
              <Share2 size={24} className="text-dna-tundora" />
            </div>
            <div>
              <div className="text-sm font-semibold text-dna-black">Copy Share Link</div>
              <div className="text-xs text-dna-tundora">Share with client</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/')}
            className="flex flex-col items-center gap-3 p-5 bg-white border border-dna-alto rounded-xl hover:border-dna-silver hover:shadow-lg transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-dna-cream flex items-center justify-center">
              <BarChart3 size={24} className="text-dna-tundora" />
            </div>
            <div>
              <div className="text-sm font-semibold text-dna-black">Back to Dashboard</div>
              <div className="text-xs text-dna-tundora">Return home</div>
            </div>
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-[700px] mx-auto flex flex-col items-center gap-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-dna-black tracking-tight">Generate Manual</h2>
        <p className="text-sm text-dna-tundora mt-2">Choose your output format and generate the final deliverables.</p>
      </div>

      {/* Output Options */}
      <div className="grid grid-cols-2 gap-5 w-full">
        {/* Operation Manual Card */}
        <Card className="border-dna-alto rounded-xl">
          <CardContent className="p-6 flex flex-col items-center text-center gap-4">
            <FileText size={48} className="text-dna-black" />
            <div>
              <h3 className="text-xl font-semibold text-dna-black">Operation Manual</h3>
              <p className="text-sm text-dna-tundora mt-1">
                Comprehensive document with all processes, roles, and approval workflows.
              </p>
            </div>
            {/* Format Toggle */}
            <div className="flex items-center gap-1 bg-dna-pampas rounded-lg p-1">
              {(['pdf', 'web', 'both'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => updateData({ manualFormat: fmt })}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize',
                    data.manualFormat === fmt ? 'bg-white text-dna-black shadow-sm' : 'text-dna-tundora hover:text-dna-black'
                  )}
                >
                  {fmt === 'both' ? 'PDF + Web' : fmt.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="flex gap-3 w-full mt-2">
              <Button variant="outline" className="flex-1 border-dna-alto text-sm" onClick={() => navigate('/manual-preview')}>
                Preview
              </Button>
              <Button className="flex-1 bg-dna-pomegranate text-white hover:bg-[#D42D0A] text-sm">
                Generate
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Operational Roadmap Card */}
        <Card className="border-dna-alto rounded-xl">
          <CardContent className="p-6 flex flex-col items-center text-center gap-4">
            <Map size={48} className="text-dna-pomegranate" />
            <div>
              <h3 className="text-xl font-semibold text-dna-black">Operational Roadmap</h3>
              <p className="text-sm text-dna-tundora mt-1">
                Visual process diagram showing workflows, handoffs, and decision points.
              </p>
            </div>
            {/* Format Toggle */}
            <div className="flex items-center gap-1 bg-dna-pampas rounded-lg p-1">
              {(['interactive', 'pdf', 'both'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => updateData({ roadmapFormat: fmt })}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize',
                    data.roadmapFormat === fmt ? 'bg-white text-dna-black shadow-sm' : 'text-dna-tundora hover:text-dna-black'
                  )}
                >
                  {fmt === 'interactive' ? 'Web' : fmt === 'both' ? 'Web + PDF' : fmt.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="flex gap-3 w-full mt-2">
              <Button variant="outline" className="flex-1 border-dna-alto text-sm" onClick={() => navigate('/roadmap-generator')}>
                Preview
              </Button>
              <Button className="flex-1 bg-dna-pomegranate text-white hover:bg-[#D42D0A] text-sm">
                Generate
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generate Both */}
      <Button
        onClick={() => setGenerated(true)}
        className="w-full h-12 bg-black text-white hover:bg-dna-tundora text-sm font-semibold rounded-xl gap-2"
      >
        <Sparkles size={18} />
        Generate Both Outputs
      </Button>

      {/* Share Settings */}
      <div className="flex items-center gap-3 bg-white border border-dna-alto rounded-xl px-5 py-3 w-full">
        <Switch
          checked={data.shareEnabled}
          onCheckedChange={(checked) => updateData({ shareEnabled: checked })}
        />
        <div>
          <div className="text-sm font-medium text-dna-black">Enable shareable client link</div>
          <div className="text-xs text-dna-tundora">Generate a secure link to share with your client</div>
        </div>
      </div>
    </div>
  );
}

// ─── Step Bar Component ───

interface StepBarProps {
  currentStep: number;
  goToStep: (step: number) => void;
}

function StepBar({ currentStep, goToStep }: StepBarProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {STEP_LABELS.map((label, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;
          const isUpcoming = stepNum > currentStep;

          return (
            <div key={i} className="flex flex-col items-center gap-2 flex-1 relative">
              {/* Connector line (left) */}
              {i > 0 && (
                <div
                  className={cn(
                    'absolute top-[18px] left-0 right-1/2 h-[2px] -translate-y-1/2',
                    isCompleted || isCurrent ? 'bg-dna-black' : 'bg-dna-mercury'
                  )}
                  style={{ right: '50%', marginRight: '18px' }}
                />
              )}
              {/* Connector line (right) */}
              {i < 7 && (
                <div
                  className={cn(
                    'absolute top-[18px] left-1/2 right-0 h-[2px] -translate-y-1/2',
                    isCompleted ? 'bg-dna-black' : 'bg-dna-mercury'
                  )}
                  style={{ left: '50%', marginLeft: '18px' }}
                />
              )}

              {/* Circle */}
              <button
                onClick={() => goToStep(stepNum)}
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200 relative z-10',
                  isCompleted && 'bg-dna-black border-2 border-dna-black text-white',
                  isCurrent && 'border-2 border-dna-pomegranate text-dna-pomegranate bg-white',
                  isUpcoming && 'border-2 border-dna-alto text-dna-silver bg-white'
                )}
              >
                {isCompleted ? <Check size={16} /> : stepNum}
              </button>

              {/* Label */}
              <span className={cn(
                'text-xs font-medium whitespace-nowrap',
                isCurrent ? 'text-dna-pomegranate' : isCompleted ? 'text-dna-black' : 'text-dna-silver'
              )}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Wizard Component ───

export default function ManualBuilder() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);

  const [wizardData, setWizardData] = useState<WizardData>({
    clientId: '',
    clientName: '',
    manualName: '',
    manualDescription: '',
    selectedModules: [],
    selectedTransactions: [],
    selectedUseCases: [],
    approvals: {},
    selectedRoles: [],
    roleDetails: {},
    responsibilityMatrix: [
      { id: 'row_1', role: 'Finance Manager', roleId: 'r2', module: 'General Ledger', transaction: 'Account Posting', useCase: 'Post AP Invoice', responsibility: 'A', canView: true, canEdit: true, approves: true },
      { id: 'row_2', role: 'Accountant', roleId: 'r3', module: 'General Ledger', transaction: 'Account Posting', useCase: 'Post Manual Entry', responsibility: 'R', canView: true, canEdit: true, approves: false },
      { id: 'row_3', role: 'AP Clerk', roleId: 'r4', module: 'Purchase & Procurement', transaction: 'Purchase Requisition', useCase: 'Create PR', responsibility: 'R', canView: true, canEdit: true, approves: false },
      { id: 'row_4', role: 'Procurement Officer', roleId: 'r8', module: 'Purchase & Procurement', transaction: 'Purchase Requisition', useCase: 'Approve PR', responsibility: 'A', canView: true, canEdit: false, approves: true },
      { id: 'row_5', role: 'Inventory Manager', roleId: 'r6', module: 'Inventory & Warehouse', transaction: 'Goods Receipt', useCase: 'Quality Inspection', responsibility: 'A', canView: true, canEdit: true, approves: true },
    ],
    manualFormat: 'pdf',
    roadmapFormat: 'interactive',
    shareEnabled: false,
  });

  const updateData = (patch: Partial<WizardData>) => {
    setWizardData((prev) => ({ ...prev, ...patch }));
  };

  const nextStep = () => {
    if (currentStep < 8) {
      setDirection(1);
      setCurrentStep((s) => s + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setDirection(-1);
      setCurrentStep((s) => s - 1);
    }
  };

  const goToStep = (step: number) => {
    setDirection(step > currentStep ? 1 : -1);
    setCurrentStep(step);
  };

  // ─── Render current step ───
  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1ClientModules data={wizardData} updateData={updateData} />;
      case 2: return <Step2Transactions data={wizardData} updateData={updateData} />;
      case 3: return <Step3UseCases data={wizardData} updateData={updateData} />;
      case 4: return <Step4ApprovalGates data={wizardData} updateData={updateData} />;
      case 5: return <Step5RoleDefinitions data={wizardData} updateData={updateData} />;
      case 6: return <Step6ResponsibilityMatrix data={wizardData} updateData={updateData} />;
      case 7: return <Step7Review data={wizardData} />;
      case 8: return <Step8Generate data={wizardData} updateData={updateData} navigate={navigate} />;
      default: return null;
    }
  };

  return (
    <div className="py-2 max-w-content mx-auto">
      {/* Step Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-xl border border-dna-alto p-6 mb-6"
      >
        <StepBar currentStep={currentStep} goToStep={goToStep} />

        {/* Navigation Row */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-dna-mercury">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="border-dna-alto text-sm gap-2 disabled:opacity-40"
          >
            <ArrowLeft size={16} /> Back
          </Button>

          <h2 className="text-2xl font-bold tracking-tight text-dna-black">
            {STEP_LABELS[currentStep - 1]}
          </h2>

          {currentStep < 8 ? (
            <Button
              onClick={nextStep}
              className="bg-black text-white hover:bg-dna-tundora text-sm gap-2"
            >
              Continue <ArrowRight size={16} />
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentStep(8)}
              className="bg-dna-pomegranate text-white hover:bg-[#D42D0A] text-sm gap-2"
            >
              <Sparkles size={16} /> Generate Manual
            </Button>
          )}
        </div>
      </motion.div>

      {/* Step Content with Animation */}
      <div className="min-h-[500px]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'tween', duration: 0.2, ease: 'easeInOut' },
              opacity: { duration: 0.2 },
            }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
