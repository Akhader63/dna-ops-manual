import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2,
  FileText,
  CheckCircle,
  GitPullRequest,
  Layers,
  Users,
  Map,
  Plus,
  ArrowRight,
} from 'lucide-react';
import {
  getDashboardStats,
  getModules,
  getClients,
  getIssues,
} from '@/services/dataService';
import type { Module, Client, BugIssue } from '@/services/dataService';

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

/* ──────────── Animated counter ──────────── */
function useCountUp(target: number, duration: number = 1000, delay: number = 0) {
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      started.current = true;
      const startTime = performance.now();
      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - (1 - progress) * (1 - progress); // ease-out quad
        setValue(Math.round(eased * target));
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }, delay);
    return () => clearTimeout(timer);
  }, [target, duration, delay]);

  return value;
}

interface Stats {
  totalModules: number;
  totalTransactions: number;
  totalUseCases: number;
  totalClients: number;
  totalManuals: number;
  totalRoles: number;
  openIssues: number;
  totalPlanItems: number;
}

/* ──────────── Hero Stats ──────────── */
function HeroStats({ stats }: { stats: Stats }) {
  const activeClients = useCountUp(stats.totalClients, 1000, 200);
  const inProgress = useCountUp(stats.totalManuals, 1000, 300);
  const completed = useCountUp(Math.floor(stats.totalManuals * 0.67), 1000, 400);
  const pending = useCountUp(stats.openIssues, 1000, 500);

  const heroStats = [
    { value: activeClients, label: 'Active Clients', icon: Building2 },
    { value: inProgress, label: 'In-Progress Manuals', icon: FileText },
    { value: completed, label: 'Completed Manuals', icon: CheckCircle },
    { value: pending, label: 'Open Issues', icon: GitPullRequest },
  ];

  return (
    <div className="grid grid-cols-4 gap-4 mt-6">
      {heroStats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1, duration: 0.4, ease }}
            className="relative"
          >
            <Icon size={20} className="absolute top-0 right-0 text-dna-silver" />
            <div className="text-[32px] font-bold text-white leading-tight">{stat.value}</div>
            <div className="text-xs text-dna-silver mt-1">{stat.label}</div>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ──────────── Hero Welcome Bar ──────────── */
function HeroBar({ stats }: { stats: Stats }) {
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState('Good morning');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 17) setGreeting('Good evening');
    else if (hour >= 12) setGreeting('Good afternoon');
    else setGreeting('Good morning');
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease }}
      className="relative bg-dna-black rounded-2xl p-8 overflow-hidden"
      style={{
        background: 'radial-gradient(circle at 80% 50%, rgba(243,53,12,0.12) 0%, transparent 50%), #000000',
      }}
    >
      {/* Top row: greeting + quick actions */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight">
            {greeting}
          </h2>
          <p className="text-sm text-dna-silver mt-1">
            Here&apos;s what&apos;s happening across your client manuals today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/clients')}
            className="flex items-center gap-2 px-5 py-2.5 bg-dna-pomegranate text-white text-sm font-medium rounded-lg hover:bg-[#D42D0A] transition-colors duration-150"
          >
            <Plus size={16} />
            New Client
          </button>
          <button
            onClick={() => navigate('/manual-builder')}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-dna-black text-sm font-medium rounded-lg hover:bg-dna-mercury transition-colors duration-150"
          >
            <Plus size={16} />
            New Manual
          </button>
          <button
            onClick={() => navigate('/module-library')}
            className="flex items-center gap-2 px-5 py-2.5 border border-white/30 text-white text-sm font-medium rounded-lg hover:bg-white/5 transition-colors duration-150"
          >
            Browse Modules
          </button>
        </div>
      </div>

      {/* Stats row */}
      <HeroStats stats={stats} />
    </motion.div>
  );
}

/* ──────────── Activity Feed ──────────── */
function ActivityFeed() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4, ease }}
      className="bg-white rounded-xl border border-dna-alto p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-semibold tracking-tight">Recent Activity</h3>
        <button className="text-sm font-medium text-dna-pomegranate hover:underline">View All</button>
      </div>
      <div className="flex flex-col">
        <div className="py-10 text-center text-sm text-dna-silver">No activity yet.</div>
      </div>
    </motion.div>
  );
}

/* ──────────── Progress Cards ──────────── */
function ProgressBar({ percent, delay }: { percent: number; delay: number }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(percent), delay);
    return () => clearTimeout(timer);
  }, [percent, delay]);

  return (
    <div className="w-full h-1.5 bg-dna-mercury rounded-full overflow-hidden mt-2">
      <motion.div
        className="h-full bg-dna-pomegranate rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${width}%` }}
        transition={{ duration: 0.8, ease }}
      />
    </div>
  );
}

function ManualProgress({ clients }: { clients: Client[] }) {
  const displayClients = clients.slice(0, 5).map((client, i) => ({
    name: client.name,
    industry: client.industry ?? 'General',
    step: Math.min(i + 2, 8),
    total: 8,
    percent: Math.min((i + 2) * 12 + 10, 95),
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.4, ease }}
      className="bg-white rounded-xl border border-dna-alto p-6 mt-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-semibold tracking-tight">Manual Progress</h3>
        <button className="text-sm font-medium text-dna-pomegranate hover:underline">View All Clients</button>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {displayClients.length === 0 ? (
          <div className="py-10 text-center text-sm text-dna-silver">No client manuals yet.</div>
        ) : displayClients.map((client, i) => (
          <motion.div
            key={client.name}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.06, duration: 0.4, ease }}
            className="min-w-[240px] bg-white rounded-xl border border-dna-alto p-5 cursor-pointer hover:shadow-lg hover:border-dna-silver transition-all duration-200 shrink-0"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-dna-black">{client.name}</span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-dna-cream text-dna-tundora">
                {client.industry}
              </span>
            </div>
            <ProgressBar percent={client.percent} delay={600 + i * 100} />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-dna-tundora">Step {client.step} of {client.total}</span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#D97706]">
                In Progress
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ──────────── Quick Access Shortcuts ──────────── */
const shortcuts = [
  { label: 'Module Library', desc: 'Browse ERP modules', icon: Layers, bg: '#FEF3C7', color: '#D97706', path: '/module-library' },
  { label: 'Role Manager', desc: 'Define user roles', icon: Users, bg: '#D1FAE5', color: '#059669', path: '/role-setup' },
  { label: 'Approval Flows', desc: 'Configure approvals', icon: GitPullRequest, bg: '#FEE2E2', color: '#DC2626', path: '/approval-gateways' },
  { label: 'Roadmap Builder', desc: 'Generate roadmaps', icon: Map, bg: '#DBEAFE', color: '#2563EB', path: '/roadmap-generator' },
];

function QuickAccess() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4, ease }}
      className="bg-white rounded-xl border border-dna-alto p-6"
    >
      <h3 className="text-2xl font-semibold tracking-tight mb-4">Quick Access</h3>
      <div className="grid grid-cols-2 gap-3">
        {shortcuts.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.button
              key={s.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.08, duration: 0.3, ease }}
              onClick={() => navigate(s.path)}
              className="flex flex-col items-start p-4 bg-white border border-dna-alto rounded-xl cursor-pointer hover:border-dna-silver hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: s.bg }}
              >
                <Icon size={22} style={{ color: s.color }} />
              </div>
              <span className="text-sm font-semibold text-dna-black mt-3">{s.label}</span>
              <span className="text-xs text-dna-tundora">{s.desc}</span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ──────────── Platform Overview ──────────── */
function PlatformOverview({ stats }: { stats: Stats }) {
  const modules = useCountUp(stats.totalModules, 1000, 600);
  const transactions = useCountUp(stats.totalTransactions, 1000, 700);
  const useCases = useCountUp(stats.totalUseCases, 1000, 800);

  const rows = [
    { label: 'Total Modules', value: modules },
    { label: 'Total Transactions', value: transactions },
    { label: 'Total Use Cases', value: useCases },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4, ease }}
      className="bg-white rounded-xl border border-dna-alto p-6 mt-6"
    >
      <h3 className="text-2xl font-semibold tracking-tight mb-4">Platform Overview</h3>
      <div className="flex flex-col gap-4">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between pb-3 border-b border-dna-mercury last:border-b-0 last:pb-0">
            <span className="text-sm text-dna-tundora">{row.label}</span>
            <span className="text-sm font-semibold text-dna-black">{row.value}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ──────────── Recent Issues ──────────── */
function RecentIssues({ issues }: { issues: BugIssue[] }) {
  const priorityColor: Record<string, string> = {
    critical: 'bg-status-red',
    high: 'bg-status-red',
    medium: 'bg-status-amber',
    low: 'bg-status-blue',
  };

  const statusLabel: Record<string, string> = {
    open: 'Open',
    in_progress: 'In Progress',
    in_review: 'In Review',
    resolved: 'Resolved',
    closed: 'Closed',
  };

  const statusBg: Record<string, string> = {
    open: 'bg-[#FEE2E2] text-[#DC2626]',
    in_progress: 'bg-[#FEF3C7] text-[#D97706]',
    in_review: 'bg-[#DBEAFE] text-[#2563EB]',
    resolved: 'bg-[#D1FAE5] text-[#059669]',
    closed: 'bg-dna-cream text-dna-tundora',
  };

  const displayIssues = issues.slice(0, 5);
    return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.4, ease }}
      className="bg-white rounded-xl border border-dna-alto p-6 mt-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-semibold tracking-tight">Recent Issues</h3>
        <button className="text-sm font-medium text-dna-pomegranate hover:underline">View All</button>
      </div>
      <div className="flex flex-col gap-3">
        {displayIssues.length > 0
          ? displayIssues.map((issue, i) => (
              <motion.div
                key={issue.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 + i * 0.1, duration: 0.3 }}
                className="flex items-start gap-3"
              >
                <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${priorityColor[issue.priority] ?? 'bg-status-blue'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dna-black">{issue.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-dna-tundora">{(issue as any).client_id ?? 'General'}</span>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${statusBg[issue.status] ?? 'bg-dna-cream text-dna-tundora'}`}>
                      {statusLabel[issue.status] ?? issue.status}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))
          : <div className="py-8 text-center text-sm text-dna-silver">No recent issues.</div>}
      </div>
    </motion.div>
  );
}

/* ──────────── Module Coverage Chart ──────────── */
function ModuleCoverage({ modules }: { modules: Module[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7, duration: 0.5, ease }}
      className="bg-white rounded-xl border border-dna-alto p-6 mt-8"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-semibold tracking-tight">Module Coverage</h3>
        <button
          onClick={() => navigate('/module-library')}
          className="text-sm font-medium text-dna-pomegranate hover:underline flex items-center gap-1"
        >
          View Module Library <ArrowRight size={14} />
        </button>
      </div>
      <div className="flex flex-col gap-3">
        {modules.length === 0 ? (
          <div className="py-10 text-center text-sm text-dna-silver">No active modules found.</div>
        ) : modules.map((mod, i) => (
          <div
            key={mod.id ?? mod.name}
            className="flex items-center gap-4"
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <span className="text-sm font-medium text-dna-black w-40 shrink-0 text-right">{mod.name}</span>
            <div className="flex-1 h-6 bg-dna-mercury rounded overflow-hidden relative">
              <motion.div
                className="h-full rounded"
                initial={{ width: 0 }}
                animate={{ width: '0%' }}
                transition={{ delay: 0.8 + i * 0.1, duration: 0.8, ease }}
                style={{
                  backgroundColor: hoveredIdx === i ? '#F3350C' : '#000000',
                  transition: 'background-color 200ms',
                }}
              />
            </div>
            <span className="text-xs font-semibold text-dna-black w-10 shrink-0">0%</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ──────────── Main Dashboard Page ──────────── */
export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalModules: 0,
    totalTransactions: 0,
    totalUseCases: 0,
    totalClients: 0,
    totalManuals: 0,
    totalRoles: 0,
    openIssues: 0,
    totalPlanItems: 0,
  });
  const [, setLoading] = useState(true);
  const [recentModules, setRecentModules] = useState<Module[]>([]);
  const [recentClients, setRecentClients] = useState<Client[]>([]);
  const [recentIssues, setRecentIssues] = useState<BugIssue[]>([]);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    getModules().then(setRecentModules).catch(console.error);
    getClients().then(setRecentClients).catch(console.error);
    getIssues().then(setRecentIssues).catch(console.error);
  }, []);

  return (
    <div className="py-2">
      {/* Hero Bar */}
      <HeroBar stats={stats} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-5 gap-6 mt-8">
        {/* Left Column (3/5 = 60%) */}
        <div className="col-span-3">
          <ActivityFeed />
          <ManualProgress clients={recentClients} />
        </div>

        {/* Right Column (2/5 = 40%) */}
        <div className="col-span-2">
          <QuickAccess />
          <PlatformOverview stats={stats} />
          <RecentIssues issues={recentIssues} />
        </div>
      </div>

      {/* Module Coverage - Full Width */}
      <ModuleCoverage modules={recentModules} />
    </div>
  );
}
