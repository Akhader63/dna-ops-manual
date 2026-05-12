// ============================================
// IssuesTracker.tsx
// Bug/issue tracking table with filters, status management,
// detail drawer, and new issue modal
// ============================================

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bug,
  Plus,
  Search,
  FileDown,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,

} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useIssues, useClients } from '@/hooks/useData';
// Supabase available via useData hook
import type { BugIssue, Client, IssueType, IssuePriority, IssueStatus } from '@/types/database';

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

// ─── Animation Variants ───
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.1 },
  },
};

const rowVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease } },
};

// ─── Empty Data ───
// ─── Helpers ───
const typeLabel = (t: string) =>
  t === 'bug' ? 'Bug' :
  t === 'feature' ? 'Feature Request' :
  t === 'change_request' ? 'Change Request' :
  t === 'task' ? 'Task' : t;

const typeBadgeClass = (t: string) => {
  switch (t) {
    case 'bug': return 'bg-red-100 text-red-600 border-red-200';
    case 'feature': return 'bg-blue-100 text-blue-600 border-blue-200';
    case 'change_request': return 'bg-purple-100 text-purple-600 border-purple-200';
    case 'task': return 'bg-emerald-100 text-emerald-600 border-emerald-200';
    default: return 'bg-gray-100 text-gray-600 border-gray-200';
  }
};

const priorityConfig = (p: string) => {
  switch (p) {
    case 'critical': return { color: 'bg-red-500', label: 'Critical' };
    case 'high': return { color: 'bg-orange-500', label: 'High' };
    case 'medium': return { color: 'bg-yellow-500', label: 'Medium' };
    case 'low': return { color: 'bg-gray-400', label: 'Low' };
    default: return { color: 'bg-gray-400', label: p };
  }
};

const statusBadgeClass = (s: string) => {
  switch (s) {
    case 'open': return 'bg-red-100 text-red-600 border-red-200';
    case 'in_progress': return 'bg-amber-100 text-amber-600 border-amber-200';
    case 'in_review': return 'bg-blue-100 text-blue-600 border-blue-200';
    case 'resolved': return 'bg-emerald-100 text-emerald-600 border-emerald-200';
    case 'closed': return 'bg-gray-100 text-gray-600 border-gray-200';
    default: return 'bg-gray-100 text-gray-600 border-gray-200';
  }
};

const statusLabel = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const formatRelativeTime = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getAssigneeInitials = (name: string | null) => {
  if (!name) return '—';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const getAssigneeBg = (name: string | null) => {
  if (!name) return 'bg-dna-silver';
  const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-cyan-500'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

// ─── Activity Item ───
interface ActivityItem {
  id: string;
  user: string;
  action: string;
  timestamp: string;
}

const ACTIVITIES: ActivityItem[] = [];

export default function IssuesTracker() {
  const { data: dbIssues, isLoading: issuesLoading, insert, update } = useIssues();
  const { data: clientsData } = useClients();

  const [issues, setIssues] = useState<BugIssue[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedIssue, setSelectedIssue] = useState<BugIssue | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // New issue form state
  const [newIssue, setNewIssue] = useState<Partial<BugIssue>>({
    type: 'bug',
    priority: 'medium',
    status: 'open',
    description: '',
  });
  useEffect(() => {
    setIssues((dbIssues || []) as BugIssue[]);
  }, [dbIssues]);

  // ─── Derived State ───
  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      const matchesSearch = !searchQuery ||
        issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (issue.metadata?.client as string || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'all' || issue.type === typeFilter;
      const matchesPriority = priorityFilter === 'all' || issue.priority === priorityFilter;
      const matchesClient = clientFilter === 'all' || (issue.metadata?.client as string) === clientFilter;
      const matchesStatus = statusFilter === 'all' || issue.status === statusFilter;
      return matchesSearch && matchesType && matchesPriority && matchesClient && matchesStatus;
    });
  }, [issues, searchQuery, typeFilter, priorityFilter, clientFilter, statusFilter]);

  const counts = useMemo(() => ({
    all: issues.length,
    open: issues.filter(i => i.status === 'open').length,
    in_progress: issues.filter(i => i.status === 'in_progress').length,
    resolved: issues.filter(i => i.status === 'resolved' || i.status === 'closed').length,
  }), [issues]);

  const clientOptions = useMemo(() => {
    const fromIssues = new Set(issues.map(i => i.metadata?.client as string).filter(Boolean));
    const fromClients = new Set((clientsData || []).map((c: Client) => c.name));
    return Array.from(new Set([...fromIssues, ...fromClients])).sort();
  }, [issues, clientsData]);

  const assigneeOptions = useMemo(() => {
    return Array.from(new Set(issues.map(i => i.assignee_id).filter(Boolean))) as string[];
  }, [issues]);

  // ─── Handlers ───
  const openDrawer = (issue: BugIssue) => {
    setSelectedIssue(issue);
    setDrawerOpen(true);
  };

  const handleCreateIssue = async () => {
    if (!newIssue.title) return;
    const issueData: Omit<BugIssue, 'id' | 'created_at' | 'updated_at'> = {
      title: newIssue.title || 'Untitled',
      description: newIssue.description || null,
      type: (newIssue.type as IssueType) || 'bug',
      priority: (newIssue.priority as IssuePriority) || 'medium',
      status: 'open',
      assignee_id: newIssue.assignee_id || null,
      manual_id: null,
      metadata: { client: newIssue.metadata?.client || 'Unassigned' },
      created_by: 'Current User',
      resolved_at: null,
    };
    try {
      const result = await insert(issueData);
      if (result) {
        setIssues(prev => [result as BugIssue, ...prev]);
      }
    } catch (error) {
      console.error('Failed to create issue', error);
    }
    setModalOpen(false);
    setNewIssue({ type: 'bug', priority: 'medium', status: 'open', description: '' });
  };

  const handleStatusChange = async (issueId: string, newStatus: string) => {
    try {
      await update(issueId, { status: newStatus as IssueStatus });
    } catch {
      // fallback - update local state
    }
    setIssues(prev => prev.map(i => i.id === issueId ? { ...i, status: newStatus as IssueStatus } : i));
    if (selectedIssue?.id === issueId) {
      setSelectedIssue(prev => prev ? { ...prev, status: newStatus as IssueStatus } : null);
    }
  };

  const handleExport = () => {
    const csv = [
      ['ID', 'Title', 'Client', 'Type', 'Priority', 'Status', 'Assignee', 'Created'].join(','),
      ...filteredIssues.map(i => [
        `#${i.id.padStart(3, '0')}`,
        `"${i.title}"`,
        `"${i.metadata?.client || ''}"`,
        typeLabel(i.type),
        i.priority,
        statusLabel(i.status),
        i.assignee_id || '—',
        new Date(i.created_at).toLocaleDateString(),
      ].join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `issues-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Render ───
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
          <h1 className="text-4xl font-bold tracking-tight">Issues Tracker</h1>
          <p className="mt-2 text-base text-dna-tundora">
            Log and manage bugs, change requests, and improvements.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="bg-white border-dna-alto text-dna-tundora hover:bg-dna-cream"
            onClick={handleExport}
          >
            <FileDown className="size-4 mr-1.5" />
            Export
          </Button>
          <Button
            className="bg-dna-pomegranate text-white hover:bg-dna-pomegranate/90"
            onClick={() => setModalOpen(true)}
          >
            <Plus className="size-4 mr-1.5" />
            New Issue
          </Button>
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.35, ease }}
        className="flex items-center gap-6 mt-6"
      >
        {[
          { label: 'All', count: counts.all, color: 'text-black' },
          { label: 'Open', count: counts.open, color: 'text-red-500' },
          { label: 'In Progress', count: counts.in_progress, color: 'text-amber-500' },
          { label: 'Resolved', count: counts.resolved, color: 'text-emerald-500' },
        ].map(stat => (
          <button
            key={stat.label}
            onClick={() => setStatusFilter(
              stat.label === 'All' ? 'all' :
              stat.label === 'Open' ? 'open' :
              stat.label === 'In Progress' ? 'in_progress' :
              'resolved'
            )}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
              (stat.label === 'All' && statusFilter === 'all') ||
              (stat.label !== 'All' && statusFilter === stat.label.toLowerCase().replace(' ', '_'))
                ? 'bg-dna-cream' : 'hover:bg-dna-cream/50'
            }`}
          >
            <span className={`text-[13px] font-medium text-dna-tundora`}>{stat.label}</span>
            <span className={`text-[20px] font-bold ${stat.color}`}>{stat.count}</span>
          </button>
        ))}
      </motion.div>

      {/* ── Filters ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.35, ease }}
        className="flex items-center justify-between mt-6"
      >
        <div className="flex items-center gap-3">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px] h-9 bg-white border-dna-alto text-sm">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="bug">Bug</SelectItem>
              <SelectItem value="feature">Feature Request</SelectItem>
              <SelectItem value="change_request">Change Request</SelectItem>
              <SelectItem value="task">Task</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[150px] h-9 bg-white border-dna-alto text-sm">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={clientFilter} onValueChange={setClientFilter}>
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
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-dna-silver" />
          <Input
            placeholder="Search issues..."
            className="w-[240px] h-9 pl-9 bg-white border-dna-alto text-sm"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </motion.div>

      {/* ── Issues Table ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.35, ease }}
        className="mt-6 bg-white rounded-xl border border-dna-alto shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden"
      >
        {/* Table Header */}
        <div className="grid grid-cols-[60px_1fr_140px_110px_110px_70px_110px_80px] gap-3 px-5 py-3 bg-dna-cream border-b border-dna-mercury">
          <span className="text-[13px] font-semibold uppercase text-dna-tundora tracking-wide">ID</span>
          <span className="text-[13px] font-semibold uppercase text-dna-tundora tracking-wide">Title</span>
          <span className="text-[13px] font-semibold uppercase text-dna-tundora tracking-wide">Client</span>
          <span className="text-[13px] font-semibold uppercase text-dna-tundora tracking-wide">Type</span>
          <span className="text-[13px] font-semibold uppercase text-dna-tundora tracking-wide">Priority</span>
          <span className="text-[13px] font-semibold uppercase text-dna-tundora tracking-wide text-center">Assignee</span>
          <span className="text-[13px] font-semibold uppercase text-dna-tundora tracking-wide">Status</span>
          <span className="text-[13px] font-semibold uppercase text-dna-tundora tracking-wide text-right">Updated</span>
        </div>

        {/* Table Body */}
        {issuesLoading ? (
          <div className="p-8 text-center text-dna-silver">Loading issues...</div>
        ) : filteredIssues.length === 0 ? (
          <div className="p-12 text-center">
            <Bug className="size-10 mx-auto text-dna-silver mb-3" />
            <p className="text-dna-tundora font-medium">No issues found</p>
            <p className="text-sm text-dna-silver mt-1">Try adjusting your filters or create a new issue.</p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence>
              {filteredIssues.map(issue => {
                const pConfig = priorityConfig(issue.priority);
                return (
                  <motion.div
                    key={issue.id}
                    variants={rowVariants}
                    onClick={() => openDrawer(issue)}
                    className="grid grid-cols-[60px_1fr_140px_110px_110px_70px_110px_80px] gap-3 px-5 py-3.5 border-b border-dna-mercury last:border-b-0 hover:bg-dna-pampas cursor-pointer transition-colors items-center"
                  >
                    {/* ID */}
                    <span className="text-[14px] font-medium text-dna-silver">#{issue.id.padStart(3, '0')}</span>

                    {/* Title + Type Badge */}
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[14px] font-medium text-black truncate">{issue.title}</span>
                    </div>

                    {/* Client */}
                    <span className="text-[14px] text-dna-tundora truncate">{(issue.metadata?.client as string) || '—'}</span>

                    {/* Type Badge */}
                    <Badge variant="outline" className={`${typeBadgeClass(issue.type)} text-[12px] font-medium w-fit border`}>
                      {typeLabel(issue.type)}
                    </Badge>

                    {/* Priority */}
                    <div className="flex items-center gap-2">
                      <span className={`size-2 rounded-full ${pConfig.color}`} />
                      <span className="text-[13px] text-dna-tundora">{pConfig.label}</span>
                    </div>

                    {/* Assignee */}
                    <div className="flex justify-center">
                      <Avatar className={`size-7 ${getAssigneeBg(issue.assignee_id)}`}>
                        <AvatarFallback className="text-white text-[11px] font-semibold">
                          {getAssigneeInitials(issue.assignee_id)}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    {/* Status */}
                    <Badge variant="outline" className={`${statusBadgeClass(issue.status)} text-[12px] font-medium w-fit border`}>
                      {statusLabel(issue.status)}
                    </Badge>

                    {/* Updated */}
                    <span className="text-[13px] text-dna-silver text-right">{formatRelativeTime(issue.updated_at)}</span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Footer */}
        <div className="px-5 py-3 bg-dna-cream border-t border-dna-mercury flex items-center justify-between">
          <span className="text-[12px] text-dna-silver">
            Showing {filteredIssues.length} of {issues.length} issues
          </span>
          <span className="text-[12px] text-dna-silver">
            Click a row to view details
          </span>
        </div>
      </motion.div>

      {/* ─── Issue Detail Drawer ─── */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-[520px] p-0 bg-white">
          {selectedIssue && (
            <div className="flex flex-col h-full">
              {/* Drawer Header */}
              <SheetHeader className="px-6 pt-6 pb-4 border-b border-dna-mercury">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[13px] text-dna-silver font-mono">#{selectedIssue.id.padStart(3, '0')}</span>
                      <Badge variant="outline" className={`${typeBadgeClass(selectedIssue.type)} text-[11px] border`}>
                        {typeLabel(selectedIssue.type)}
                      </Badge>
                    </div>
                    <SheetTitle className="text-[18px] font-semibold text-black leading-snug">
                      {selectedIssue.title}
                    </SheetTitle>
                  </div>
                </div>
              </SheetHeader>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto px-6 py-5">
                {/* Status Bar */}
                <div className="flex items-center gap-3 mb-6">
                  <Select
                    value={selectedIssue.status}
                    onValueChange={(val) => handleStatusChange(selectedIssue.id, val)}
                  >
                    <SelectTrigger className="w-[150px] h-8 text-[13px] bg-white border-dna-alto">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="in_review">Under Review</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-1.5">
                    <span className={`size-2 rounded-full ${priorityConfig(selectedIssue.priority).color}`} />
                    <span className="text-[13px] text-dna-tundora capitalize">{selectedIssue.priority}</span>
                  </div>

                  {selectedIssue.assignee_id && (
                    <div className="flex items-center gap-1.5 ml-auto">
                      <Avatar className={`size-6 ${getAssigneeBg(selectedIssue.assignee_id)}`}>
                        <AvatarFallback className="text-white text-[10px] font-semibold">
                          {getAssigneeInitials(selectedIssue.assignee_id)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-[13px] text-dna-tundora">{selectedIssue.assignee_id}</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="mb-6">
                  <h3 className="text-[13px] font-semibold uppercase text-dna-tundora tracking-wide mb-2">Description</h3>
                  <p className="text-[14px] text-dna-tundora leading-relaxed">
                    {selectedIssue.description || 'No description provided.'}
                  </p>
                </div>

                {/* Details Grid */}
                <div className="mb-6">
                  <h3 className="text-[13px] font-semibold uppercase text-dna-tundora tracking-wide mb-3">Details</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Client', value: (selectedIssue.metadata?.client as string) || '—' },
                      { label: 'Module', value: (selectedIssue.metadata?.module as string) || '—' },
                      { label: 'Transaction', value: (selectedIssue.metadata?.transaction as string) || '—' },
                      { label: 'Reported by', value: selectedIssue.created_by || '—' },
                      { label: 'Created', value: new Date(selectedIssue.created_at).toLocaleDateString() },
                      { label: 'Due date', value: '—' },
                    ].map(item => (
                      <div key={item.label} className="bg-dna-pampas rounded-lg px-3 py-2.5">
                        <span className="text-[11px] text-dna-silver uppercase tracking-wider">{item.label}</span>
                        <p className="text-[13px] text-black font-medium mt-0.5 truncate">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Activity Feed */}
                <div>
                  <h3 className="text-[13px] font-semibold uppercase text-dna-tundora tracking-wide mb-3">Activity</h3>
                  <div className="space-y-3">
                    {ACTIVITIES.map((activity, idx) => (
                      <div key={activity.id} className="flex items-start gap-3">
                        <div className="relative mt-0.5">
                          <Avatar className={`size-7 ${getAssigneeBg(activity.user)}`}>
                            <AvatarFallback className="text-white text-[10px] font-semibold">
                              {getAssigneeInitials(activity.user)}
                            </AvatarFallback>
                          </Avatar>
                          {idx < ACTIVITIES.length - 1 && (
                            <div className="absolute top-8 left-1/2 -translate-x-1/2 w-px h-5 bg-dna-mercury" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-black">
                            <span className="font-semibold">{activity.user}</span>{' '}
                            <span className="text-dna-tundora">{activity.action}</span>
                          </p>
                          <p className="text-[11px] text-dna-silver mt-0.5">
                            {formatRelativeTime(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="px-6 py-4 border-t border-dna-mercury flex items-center justify-between">
                <span className="text-[12px] text-dna-silver">
                  Updated {formatRelativeTime(selectedIssue.updated_at)}
                </span>
                <Button
                  size="sm"
                  className="bg-dna-pomegranate text-white hover:bg-dna-pomegranate/90"
                  onClick={() => handleStatusChange(selectedIssue.id, 'resolved')}
                  disabled={selectedIssue.status === 'resolved'}
                >
                  <CheckCircle2 className="size-4 mr-1.5" />
                  Mark Resolved
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ─── New Issue Modal ─── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[520px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">Create New Issue</DialogTitle>
            <DialogDescription className="text-[13px] text-dna-silver">
              Fill in the details below to log a new issue or feature request.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-[13px] font-medium text-black mb-1.5 block">Title *</label>
              <Input
                placeholder="Brief description of the issue..."
                className="h-9 bg-white border-dna-alto"
                value={newIssue.title || ''}
                onChange={e => setNewIssue(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[13px] font-medium text-black mb-1.5 block">Client</label>
                <Select
                  value={(newIssue.metadata?.client as string) || ''}
                  onValueChange={val => setNewIssue(prev => ({ ...prev, metadata: { ...prev.metadata, client: val } }))}
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
                <label className="text-[13px] font-medium text-black mb-1.5 block">Type</label>
                <Select
                  value={newIssue.type || 'bug'}
                  onValueChange={val => setNewIssue(prev => ({ ...prev, type: val as IssueType }))}
                >
                  <SelectTrigger className="h-9 bg-white border-dna-alto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bug">Bug</SelectItem>
                    <SelectItem value="feature">Feature Request</SelectItem>
                    <SelectItem value="change_request">Change Request</SelectItem>
                    <SelectItem value="task">Task</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[13px] font-medium text-black mb-1.5 block">Priority</label>
                <Select
                  value={newIssue.priority || 'medium'}
                  onValueChange={val => setNewIssue(prev => ({ ...prev, priority: val as IssuePriority }))}
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
                  value={newIssue.assignee_id || ''}
                  onValueChange={val => setNewIssue(prev => ({ ...prev, assignee_id: val }))}
                >
                  <SelectTrigger className="h-9 bg-white border-dna-alto">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {assigneeOptions.length === 0 ? (
                      <SelectItem value="unassigned" disabled>No assignees</SelectItem>
                    ) : assigneeOptions.map(name => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-[13px] font-medium text-black mb-1.5 block">Description</label>
              <Textarea
                placeholder="Detailed description of the issue..."
                className="min-h-[100px] bg-white border-dna-alto resize-none"
                value={newIssue.description || ''}
                onChange={e => setNewIssue(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="bg-white border-dna-alto text-dna-tundora"
              onClick={() => {
                setModalOpen(false);
                setNewIssue({ type: 'bug', priority: 'medium', status: 'open', description: '' });
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-dna-pomegranate text-white hover:bg-dna-pomegranate/90"
              onClick={handleCreateIssue}
              disabled={!newIssue.title}
            >
              Create Issue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
