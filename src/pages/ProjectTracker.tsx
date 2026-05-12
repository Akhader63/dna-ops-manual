// ============================================
// ProjectTracker.tsx
// Project milestone tracking with timeline (Gantt-style),
// board (Kanban), and list views
// ============================================

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutList,
  CalendarDays,
  Columns3,
  Plus,
  Search,
  Clock,
  Flag,
  CheckCircle2,
  AlertTriangle,
  MoreHorizontal,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
// Progress component available if needed
import { useProjectPlan, useClients } from '@/hooks/useData';
import type { ProjectPlanItem, Client } from '@/types/database';

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

type ViewMode = 'timeline' | 'board' | 'list';

// ─── Animation Variants ───
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease } },
};

// ─── Empty Data ───
// ─── Helpers ───
const statusColor = (s: string) => {
  switch (s) {
    case 'completed': return 'bg-emerald-500';
    case 'in_progress': return 'bg-blue-500';
    case 'upcoming': return 'bg-amber-500';
    case 'at_risk': return 'bg-red-500';
    case 'review': return 'bg-purple-500';
    default: return 'bg-gray-400';
  }
};

const statusBadgeClass = (s: string) => {
  switch (s) {
    case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'in_progress': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'upcoming': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'at_risk': return 'bg-red-100 text-red-700 border-red-200';
    case 'review': return 'bg-purple-100 text-purple-700 border-purple-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const statusLabel = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const getAssigneeInitials = (name: string | null) => {
  if (!name) return '—';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const getAssigneeBg = (name: string | null) => {
  if (!name) return 'bg-dna-silver';
  const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const getOverallProgress = (items: ProjectPlanItem[]) => {
  if (items.length === 0) return 0;
  const total = items.reduce((sum, i) => sum + ((i.metadata?.progress as number) || 0), 0);
  return Math.round(total / items.length);
};

const isOverdue = (item: ProjectPlanItem) => {
  if (item.status === 'completed') return false;
  return !!item.due_date && new Date(item.due_date) < new Date();
};

// ─── Client Group Type ───
interface ClientGroup {
  client: string;
  items: ProjectPlanItem[];
  progress: number;
}

// ─── Sub-Component Props Interfaces ───
interface StatsBarProps {
  stats: {
    active: number;
    onTrack: number;
    atRisk: number;
    overdue: number;
    completed: number;
  };
}

interface TimelineViewProps {
  clientGroups: ClientGroup[];
}

interface BoardViewProps {
  filteredItems: ProjectPlanItem[];
}

interface ListViewProps {
  filteredItems: ProjectPlanItem[];
}

// ─── Stats Bar Component ───
const StatsBar = ({ stats }: StatsBarProps) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1, duration: 0.35, ease }}
    className="grid grid-cols-5 gap-3 mt-6"
  >
    {[
      { label: 'Active Projects', count: stats.active, border: 'border-black', icon: BarChart3 },
      { label: 'On Track', count: stats.onTrack, border: 'border-emerald-500', icon: CheckCircle2 },
      { label: 'At Risk', count: stats.atRisk, border: 'border-amber-500', icon: AlertTriangle },
      { label: 'Overdue', count: stats.overdue, border: 'border-red-500', icon: Clock },
      { label: 'Completed', count: stats.completed, border: 'border-blue-500', icon: Flag },
    ].map(stat => (
      <div
        key={stat.label}
        className={`bg-white rounded-xl border border-dna-alto shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 border-l-[3px] ${stat.border}`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-dna-tundora">{stat.label}</span>
          <stat.icon className="size-4 text-dna-silver" />
        </div>
        <div className="text-[24px] font-bold text-black mt-1">{stat.count}</div>
      </div>
    ))}
  </motion.div>
);

// ─── Timeline View Component ───
const TimelineView = ({ clientGroups }: TimelineViewProps) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3, ease }}
    className="bg-white rounded-xl border border-dna-alto shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden"
  >
    {/* Timeline Header */}
    <div className="flex border-b border-dna-mercury">
      <div className="w-[220px] shrink-0 px-5 py-3 bg-dna-cream border-r border-dna-mercury">
        <span className="text-[13px] font-semibold uppercase text-dna-tundora tracking-wide">Client</span>
      </div>
      <div className="flex-1 px-5 py-3 bg-dna-cream flex items-center justify-between">
        <span className="text-[13px] font-semibold uppercase text-dna-tundora tracking-wide">Timeline</span>
        <div className="flex items-center gap-4">
          {['Completed', 'In Progress', 'Upcoming', 'At Risk'].map(label => (
            <div key={label} className="flex items-center gap-1.5">
              <span className={`size-2.5 rounded-sm ${
                label === 'Completed' ? 'bg-emerald-500' :
                label === 'In Progress' ? 'bg-blue-500' :
                label === 'Upcoming' ? 'bg-amber-500' : 'bg-red-500'
              }`} />
              <span className="text-[11px] text-dna-silver">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Timeline Rows */}
    <div className="divide-y divide-dna-mercury">
      {clientGroups.length === 0 ? (
        <div className="p-12 text-center text-dna-silver">No projects match your filters.</div>
      ) : (
        clientGroups.map(group => (
          <div key={group.client} className="flex group hover:bg-dna-pampas/50 transition-colors">
            {/* Client Column */}
            <div className="w-[220px] shrink-0 px-5 py-4 border-r border-dna-mercury flex flex-col justify-center">
              <span className="text-[14px] font-semibold text-black truncate">{group.client}</span>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-1.5 bg-dna-cream rounded-full overflow-hidden">
                  <div
                    className="h-full bg-dna-pomegranate rounded-full transition-all"
                    style={{ width: `${group.progress}%` }}
                  />
                </div>
                <span className="text-[11px] text-dna-silver font-medium">{group.progress}%</span>
              </div>
            </div>
            {/* Milestone Bars */}
            <div className="flex-1 px-5 py-4 relative">
              <div className="flex items-center gap-2 flex-wrap">
                {group.items.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ delay: idx * 0.08, duration: 0.3, ease }}
                    className={`h-7 px-3 rounded-md flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity ${statusColor(item.status)}`}
                    style={{ minWidth: `${Math.max(100, (item.title.length * 7) + 40)}px` }}
                  >
                    <span className="text-white text-[11px] font-medium truncate">{item.title}</span>
                    <span className="text-white/70 text-[10px]">
                      {item.due_date ? new Date(item.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  </motion.div>
);

// ─── Board View Component (Kanban) ───
const BoardView = ({ filteredItems }: BoardViewProps) => {
  const columns = [
    { key: 'upcoming', label: 'Discovery', border: 'border-amber-500' },
    { key: 'in_progress', label: 'In Progress', border: 'border-blue-500' },
    { key: 'review', label: 'Review', border: 'border-purple-500' },
    { key: 'at_risk', label: 'Client Review', border: 'border-red-500' },
    { key: 'completed', label: 'Completed', border: 'border-emerald-500' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease }}
      className="flex gap-4 overflow-x-auto pb-2"
    >
      {columns.map(col => {
        const colItems = filteredItems.filter(i => i.status === col.key);
        return (
          <div key={col.key} className="w-[280px] shrink-0">
            <div className={`bg-white rounded-xl border border-dna-alto shadow-[0_1px_3px_rgba(0,0,0,0.04)] border-t-[3px] ${col.border} overflow-hidden`}>
              {/* Column Header */}
              <div className="px-4 py-3 border-b border-dna-mercury flex items-center justify-between">
                <span className="text-[13px] font-semibold text-black">{col.label}</span>
                <Badge variant="outline" className="text-[11px] bg-dna-cream border-dna-alto text-dna-tundora">
                  {colItems.length}
                </Badge>
              </div>
              {/* Cards */}
              <div className="p-3 space-y-2 min-h-[200px]">
                <AnimatePresence>
                  {colItems.map(item => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2, ease }}
                      className="bg-dna-pampas rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[13px] font-medium text-black leading-snug">{item.title}</p>
                        <MoreHorizontal className="size-4 text-dna-silver shrink-0 mt-0.5" />
                      </div>
                      <p className="text-[11px] text-dna-silver mt-1">{(item.metadata?.client as string) || '—'}</p>
                      <div className="flex items-center justify-between mt-2.5">
                        <div className="flex items-center gap-1.5">
                          <Avatar className={`size-5 ${getAssigneeBg(item.assigned_to)}`}>
                            <AvatarFallback className="text-white text-[9px] font-semibold">
                              {getAssigneeInitials(item.assigned_to)}
                            </AvatarFallback>
                          </Avatar>
                          {item.due_date && (
                            <span className={`text-[11px] ${isOverdue(item) ? 'text-red-500' : 'text-dna-silver'}`}>
                              {new Date(item.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                        {(item.metadata?.tags as string[])?.map((tag: string) => (
                          <Badge key={tag} variant="outline" className="text-[10px] bg-white border-dna-alto px-1.5 py-0">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {colItems.length === 0 && (
                  <div className="text-center py-6 text-dna-silver text-[12px]">No items</div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </motion.div>
  );
};

// ─── List View Component ───
const ListView = ({ filteredItems }: ListViewProps) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3, ease }}
    className="bg-white rounded-xl border border-dna-alto shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden"
  >
    {/* List Header */}
    <div className="grid grid-cols-[180px_1fr_120px_100px_90px_100px_90px] gap-3 px-5 py-3 bg-dna-cream border-b border-dna-mercury">
      <span className="text-[13px] font-semibold uppercase text-dna-tundora tracking-wide">Client</span>
      <span className="text-[13px] font-semibold uppercase text-dna-tundora tracking-wide">Current Step</span>
      <span className="text-[13px] font-semibold uppercase text-dna-tundora tracking-wide">Status</span>
      <span className="text-[13px] font-semibold uppercase text-dna-tundora tracking-wide">Assignee</span>
      <span className="text-[13px] font-semibold uppercase text-dna-tundora tracking-wide text-right">Due Date</span>
      <span className="text-[13px] font-semibold uppercase text-dna-tundora tracking-wide">Progress</span>
      <span className="text-[13px] font-semibold uppercase text-dna-tundora tracking-wide text-right">Priority</span>
    </div>

    {/* List Body */}
    {filteredItems.length === 0 ? (
      <div className="p-12 text-center text-dna-silver">No items match your filters.</div>
    ) : (
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        {filteredItems.map(item => (
          <motion.div
            key={item.id}
            variants={itemVariants}
            className="grid grid-cols-[180px_1fr_120px_100px_90px_100px_90px] gap-3 px-5 py-3 border-b border-dna-mercury last:border-b-0 hover:bg-dna-pampas transition-colors items-center"
          >
            <span className="text-[13px] font-medium text-black truncate">{(item.metadata?.client as string) || '—'}</span>
            <span className="text-[13px] text-black truncate">{item.title}</span>
            <Badge variant="outline" className={`${statusBadgeClass(item.status)} text-[11px] font-medium w-fit border`}>
              {statusLabel(item.status)}
            </Badge>
            <div className="flex items-center gap-2">
              <Avatar className={`size-6 ${getAssigneeBg(item.assigned_to)}`}>
                <AvatarFallback className="text-white text-[9px] font-semibold">
                  {getAssigneeInitials(item.assigned_to)}
                </AvatarFallback>
              </Avatar>
              <span className="text-[12px] text-dna-tundora truncate">{item.assigned_to || '—'}</span>
            </div>
            <span className={`text-[12px] text-right ${isOverdue(item) ? 'text-red-500 font-medium' : 'text-dna-silver'}`}>
              {item.due_date ? new Date(item.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
            </span>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-dna-cream rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(item.metadata?.progress as number) || 0}%`,
                    backgroundColor: (item.metadata?.progress as number) === 100 ? '#10B981' : '#3B82F6',
                  }}
                />
              </div>
              <span className="text-[11px] text-dna-silver w-7 text-right">{(item.metadata?.progress as number) || 0}%</span>
            </div>
            <div className="flex justify-end">
              <Badge variant="outline" className={`text-[11px] border capitalize w-fit ${
                item.priority === 'critical' ? 'bg-red-100 text-red-600 border-red-200' :
                item.priority === 'high' ? 'bg-amber-100 text-amber-600 border-amber-200' :
                item.priority === 'medium' ? 'bg-blue-100 text-blue-600 border-blue-200' :
                'bg-gray-100 text-gray-600 border-gray-200'
              }`}>
                {item.priority}
              </Badge>
            </div>
          </motion.div>
        ))}
      </motion.div>
    )}
  </motion.div>
);

export default function ProjectTracker() {
  const { data: dbPlan, insert } = useProjectPlan();
  const { data: clientsData } = useClients();

  const [planItems, setPlanItems] = useState<ProjectPlanItem[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);

  const [newMilestone, setNewMilestone] = useState<Partial<ProjectPlanItem>>({
    status: 'upcoming',
    priority: 'medium',
    item_type: 'milestone',
  });
  useEffect(() => {
    setPlanItems((dbPlan || []) as ProjectPlanItem[]);
  }, [dbPlan]);

  // ─── Derived State ───
  const filteredItems = useMemo(() => {
    return planItems.filter(item => {
      const matchesSearch = !searchQuery ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.metadata?.client as string || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesAssignee = assigneeFilter === 'all' || item.assigned_to === assigneeFilter;
      const matchesClient = selectedClient === 'all' || (item.metadata?.client as string) === selectedClient;
      return matchesSearch && matchesStatus && matchesAssignee && matchesClient;
    });
  }, [planItems, searchQuery, statusFilter, assigneeFilter, selectedClient]);

  const clientGroups = useMemo((): ClientGroup[] => {
    const groups = new Map<string, ProjectPlanItem[]>();
    filteredItems.forEach(item => {
      const client = (item.metadata?.client as string) || 'Unassigned';
      if (!groups.has(client)) groups.set(client, []);
      groups.get(client)!.push(item);
    });
    return Array.from(groups.entries())
      .map(([client, items]) => ({
        client,
        items: items.sort((a, b) => a.sort_order - b.sort_order),
        progress: getOverallProgress(items),
      }));
  }, [filteredItems]);

  const stats = useMemo(() => {
    const clients = new Set(planItems.map(i => (i.metadata?.client as string) || 'Unassigned'));
    const allClients = Array.from(clients);
    return {
      active: allClients.length,
      onTrack: allClients.filter(c => {
        const cItems = planItems.filter(i => (i.metadata?.client as string) === c);
        const hasRisk = cItems.some(i => i.status === 'at_risk');
        const hasOverdue = cItems.some(i => isOverdue(i));
        return !hasRisk && !hasOverdue;
      }).length,
      atRisk: allClients.filter(c => {
        const cItems = planItems.filter(i => (i.metadata?.client as string) === c);
        return cItems.some(i => i.status === 'at_risk');
      }).length,
      overdue: allClients.filter(c => {
        const cItems = planItems.filter(i => (i.metadata?.client as string) === c);
        return cItems.some(i => isOverdue(i));
      }).length,
      completed: allClients.filter(c => {
        const cItems = planItems.filter(i => (i.metadata?.client as string) === c);
        return cItems.every(i => i.status === 'completed');
      }).length,
    };
  }, [planItems]);

  const assigneeOptions = useMemo(() => {
    const names = new Set(planItems.map(i => i.assigned_to).filter(Boolean));
    return Array.from(names) as string[];
  }, [planItems]);

  const clientOptions = useMemo(() => {
    const fromItems = new Set(planItems.map(i => (i.metadata?.client as string)).filter(Boolean));
    const fromClients = new Set((clientsData || []).map((c: Client) => c.name));
    return Array.from(new Set([...fromItems, ...fromClients])).sort();
  }, [planItems, clientsData]);

  // ─── Handlers ───
  const handleCreateMilestone = async () => {
    if (!newMilestone.title) return;
    const itemData: Omit<ProjectPlanItem, 'id' | 'created_at' | 'updated_at'> = {
      manual_id: null, parent_id: null,
      title: newMilestone.title || 'Untitled',
      description: newMilestone.description || null,
      item_type: newMilestone.item_type || 'milestone',
      status: (newMilestone.status as string) || 'upcoming',
      priority: (newMilestone.priority as string) || 'medium',
      assigned_to: newMilestone.assigned_to || null,
      due_date: newMilestone.due_date || null,
      completed_at: null,
      sort_order: planItems.length + 1,
      metadata: { client: newMilestone.metadata?.client || 'Unassigned', progress: 0, tags: [] },
    };
    try {
      const result = await insert(itemData);
      if (result) {
        setPlanItems(prev => [...prev, result as ProjectPlanItem]);
      }
    } catch (error) {
      console.error('Failed to create milestone', error);
    }
    setModalOpen(false);
    setNewMilestone({ status: 'upcoming', priority: 'medium', item_type: 'milestone' });
  };

  // ─── Main Render ───
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease }}
      className="p-8 max-w-content mx-auto"
    >
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Project Tracker</h1>
          <p className="mt-2 text-base text-dna-tundora">
            Track implementation milestones and deliverables for each client.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger className="w-[180px] h-9 bg-white border-dna-alto text-sm">
              <SelectValue placeholder="All Clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {clientOptions.map(client => (
                <SelectItem key={client} value={client}>{client}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            className="bg-dna-pomegranate text-white hover:bg-dna-pomegranate/90"
            onClick={() => setModalOpen(true)}
          >
            <Plus className="size-4 mr-1.5" />
            New Milestone
          </Button>
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <StatsBar stats={stats} />

      {/* ── View Toggle & Filters ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.35, ease }}
        className="flex items-center justify-between mt-6"
      >
        {/* Segmented Control */}
        <div className="flex items-center bg-dna-cream rounded-lg p-0.5">
          {[
            { key: 'timeline' as ViewMode, label: 'Timeline', icon: CalendarDays },
            { key: 'board' as ViewMode, label: 'Board', icon: Columns3 },
            { key: 'list' as ViewMode, label: 'List', icon: LayoutList },
          ].map(v => (
            <button
              key={v.key}
              onClick={() => setViewMode(v.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-[13px] font-medium transition-all ${
                viewMode === v.key
                  ? 'bg-white text-black shadow-sm'
                  : 'text-dna-silver hover:text-dna-tundora'
              }`}
            >
              <v.icon className="size-4" />
              {v.label}
            </button>
          ))}
        </div>

        {/* Right Filters */}
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-9 bg-white border-dna-alto text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="upcoming">Discovery</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="at_risk">At Risk</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="w-[140px] h-9 bg-white border-dna-alto text-sm">
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignees</SelectItem>
              {assigneeOptions.map(name => (
                <SelectItem key={name} value={name}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-dna-silver" />
            <Input
              placeholder="Search..."
              className="w-[200px] h-9 pl-9 bg-white border-dna-alto text-sm"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </motion.div>

      {/* ── View Content ── */}
      <div className="mt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease }}
          >
            {viewMode === 'timeline' && <TimelineView clientGroups={clientGroups} />}
            {viewMode === 'board' && <BoardView filteredItems={filteredItems} />}
            {viewMode === 'list' && <ListView filteredItems={filteredItems} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── New Milestone Modal ── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[520px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">Create New Milestone</DialogTitle>
            <DialogDescription className="text-[13px] text-dna-silver">
              Add a new milestone or task to the project plan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-[13px] font-medium text-black mb-1.5 block">Title *</label>
              <Input
                placeholder="Milestone name..."
                className="h-9 bg-white border-dna-alto"
                value={newMilestone.title || ''}
                onChange={e => setNewMilestone(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[13px] font-medium text-black mb-1.5 block">Client</label>
                <Select
                  value={(newMilestone.metadata?.client as string) || ''}
                  onValueChange={val =>
                    setNewMilestone(prev => ({ ...prev, metadata: { ...prev.metadata, client: val } }))
                  }
                >
                  <SelectTrigger className="h-9 bg-white border-dna-alto">
                    <SelectValue placeholder="Select client..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clientOptions.map(client => (
                      <SelectItem key={client} value={client}>{client}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[13px] font-medium text-black mb-1.5 block">Status</label>
                <Select
                  value={newMilestone.status || 'upcoming'}
                  onValueChange={val => setNewMilestone(prev => ({ ...prev, status: val }))}
                >
                  <SelectTrigger className="h-9 bg-white border-dna-alto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Discovery</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="at_risk">At Risk</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[13px] font-medium text-black mb-1.5 block">Priority</label>
                <Select
                  value={newMilestone.priority || 'medium'}
                  onValueChange={val => setNewMilestone(prev => ({ ...prev, priority: val }))}
                >
                  <SelectTrigger className="h-9 bg-white border-dna-alto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[13px] font-medium text-black mb-1.5 block">Assignee</label>
                <Select
                  value={newMilestone.assigned_to || ''}
                  onValueChange={val => setNewMilestone(prev => ({ ...prev, assigned_to: val }))}
                >
                  <SelectTrigger className="h-9 bg-white border-dna-alto">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {assigneeOptions.map(name => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-[13px] font-medium text-black mb-1.5 block">Due Date</label>
              <Input
                type="date"
                className="h-9 bg-white border-dna-alto"
                value={newMilestone.due_date || ''}
                onChange={e => setNewMilestone(prev => ({ ...prev, due_date: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-[13px] font-medium text-black mb-1.5 block">Description</label>
              <textarea
                placeholder="Optional description..."
                className="w-full min-h-[80px] px-3 py-2 rounded-md border border-dna-alto bg-white text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                value={newMilestone.description || ''}
                onChange={e => setNewMilestone(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="bg-white border-dna-alto text-dna-tundora"
              onClick={() => {
                setModalOpen(false);
                setNewMilestone({ status: 'upcoming', priority: 'medium', item_type: 'milestone' });
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-dna-pomegranate text-white hover:bg-dna-pomegranate/90"
              onClick={handleCreateMilestone}
              disabled={!newMilestone.title}
            >
              Create Milestone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
