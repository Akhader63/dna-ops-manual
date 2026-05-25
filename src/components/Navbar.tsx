import { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Building2,
  FilePlus,
  Library,
  ShieldCheck,
  Users,
  GitBranch,
  Eye,
  GanttChart,
  Bug,
  Settings,
} from 'lucide-react';
import { useActiveModules, isModuleActive } from '@/hooks/useActiveModules';

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  moduleCode: string; // Maps to modules.code in database
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/', moduleCode: 'dashboard' },
  { label: 'Clients', icon: Building2, path: '/clients', moduleCode: 'clients' },
  { label: 'Manual Builder', icon: FilePlus, path: '/manual-builder', moduleCode: 'manual_builder' },
  { label: 'Role Setup', icon: Users, path: '/role-setup', moduleCode: 'role_setup' },
  { label: 'Roadmap Generator', icon: GitBranch, path: '/roadmap-generator', moduleCode: 'roadmap_generator' },
  { label: 'Manual Preview', icon: Eye, path: '/manual-preview', moduleCode: 'manual_preview' },
  { label: 'Project Tracker', icon: GanttChart, path: '/project-tracker', moduleCode: 'project_tracker' },
  { label: 'Issues Tracker', icon: Bug, path: '/issues-tracker', moduleCode: 'issues_tracker' },
  { label: 'Settings', icon: Settings, path: '/settings', moduleCode: 'settings' }, // Always visible
];

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

interface NavbarProps {
  onCollapseChange?: (collapsed: boolean) => void;
}

export default function Navbar({ onCollapseChange }: NavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(true);

  // Fetch active modules from database
  const { activeModules, loading } = useActiveModules();

  // Filter nav items to only show active modules
  const visibleNavItems = useMemo(() => {
    if (loading) {
      // While loading, show all items to avoid flickering
      return navItems;
    }

    return navItems.filter((item) => isModuleActive(item.moduleCode, activeModules));
  }, [activeModules, loading]);

  const handleToggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    onCollapseChange?.(next);
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <motion.aside
      initial={{ x: -260 }}
      animate={{ x: 0, width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.4, ease }}
      className="h-screen bg-dna-black border-r border-white/10 flex flex-col z-50 overflow-hidden"
    >
      {/* Logo - Clickable to toggle sidebar */}
      <div
        className="flex items-center h-header px-6 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Toggle navigation"
        aria-expanded={!collapsed}
      >
        {collapsed ? (
          <span className="text-xl font-bold text-dna-pomegranate">D</span>
        ) : (
          <div className="flex items-center gap-0">
            <span className="text-xl font-bold text-dna-pomegranate tracking-tight">DNA</span>
            <span className="text-xl font-bold text-white tracking-tight">Ops</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4">
        <ul className="flex flex-col gap-1 px-3">
          {visibleNavItems.map((item, index) => {
            const active = isActive(item.path);
            const Icon = item.icon;

            return (
              <motion.li
                key={item.path}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3, ease }}
              >
                <button
                  onClick={() => navigate(item.path)}
                  className={
                    "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-150 text-left " +
                    (active
                      ? "bg-[rgba(243,53,12,0.08)] text-white border-l-[3px] border-l-dna-pomegranate"
                      : "text-[#C7C7C7] border-l-[3px] border-l-transparent hover:bg-[rgba(255,255,255,0.05)] hover:text-white"
                    )
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <Icon size={20} className="shrink-0" />
                  {!collapsed && (
                    <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                  )}
                </button>
              </motion.li>
            );
          })}
        </ul>
      </nav>
    </motion.aside>
  );
}
