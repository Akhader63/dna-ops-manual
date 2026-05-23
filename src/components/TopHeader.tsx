import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, ChevronDown, LogOut, User, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const routeNames: Record<string, string> = {
  '/': 'Dashboard',
  '/clients': 'Clients',
  '/manual-builder': 'Manual Builder',
  '/module-library': 'Module Library',
  '/approval-gateways': 'Approval Gateways',
  '/role-setup': 'Role Setup',
  '/roadmap-generator': 'Roadmap Generator',
  '/manual-preview': 'Manual Preview',
  '/project-tracker': 'Project Tracker',
  '/issues-tracker': 'Issues Tracker',
  '/settings': 'Settings',
  '/profile': 'Profile',
};

function getBreadcrumbs(pathname: string): string[] {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return ['Dashboard'];

  const crumbs: string[] = ['Home'];
  let currentPath = '';
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    currentPath += '/' + segment;
    if (routeNames[currentPath]) {
      crumbs.push(routeNames[currentPath]);
    } else {
      // Check if this is a client detail page (UUID pattern)
      if (i === 1 && segments[0] === 'clients' && segment.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        // Extract client name from document title
        const titleParts = document.title.split(' - ');
        if (titleParts.length > 1 && titleParts[0] !== 'DNA Ops Manual') {
          crumbs.push(titleParts[0]);
        } else {
          crumbs.push('Client Details');
        }
      } else {
        crumbs.push(segment.charAt(0).toUpperCase() + segment.slice(1));
      }
    }
  }
  return crumbs;
}

interface TopHeaderProps {
  sidebarWidth: number;
}

export default function TopHeader({ sidebarWidth }: TopHeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [searchFocused, setSearchFocused] = useState(false);
  const breadcrumbs = getBreadcrumbs(location.pathname);

  const handleSignOut = async () => {
    const { success } = await signOut();
    if (success) {
      navigate('/login');
    }
  };

  // Get user initials from user data
  const getUserInitials = () => {
    if (user?.user_metadata?.full_name) {
      const names = user.user_metadata.full_name.split(' ');
      return names.length > 1
        ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
        : names[0].substring(0, 2).toUpperCase();
    }
    return user?.email?.substring(0, 2).toUpperCase() || 'U';
  };

  return (
    <header
      className="fixed top-0 right-0 h-header bg-dna-black border-b border-white/10 z-40 flex items-center justify-between px-6"
      style={{ left: `${sidebarWidth}px`, transition: 'left 0.3s ease' }}
    >
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-dna-silver">
        {breadcrumbs.map((crumb, index) => (
          <span key={index} className="flex items-center gap-2">
            {index > 0 && <span className="text-dna-tundora">/</span>}
            <span
              className={
                index === breadcrumbs.length - 1
                  ? 'text-white font-medium'
                  : 'hover:text-white transition-colors cursor-pointer'
              }
            >
              {crumb}
            </span>
          </span>
        ))}
      </nav>

      {/* Search */}
      <div
        className={
          "hidden md:flex items-center gap-2 w-[400px] h-10 px-3 rounded-lg border transition-all duration-200 " +
          (searchFocused
            ? "bg-dna-surface-darker border-dna-tundora"
            : "bg-dna-surface-darker border-[#333]"
          )
        }
      >
        <Search size={18} className="text-dna-silver shrink-0" />
        <input
          type="text"
          placeholder="Search modules, transactions, clients..."
          className="bg-transparent text-white text-sm placeholder-dna-silver outline-none w-full"
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-4">
        {/* Notification bell */}
        <button className="relative p-2 text-dna-silver hover:text-white transition-colors">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-status-red rounded-full" />
        </button>

        {/* User avatar with dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none">
              <div className="w-9 h-9 rounded-full bg-dna-pomegranate flex items-center justify-center text-white text-sm font-semibold">
                {getUserInitials()}
              </div>
              <ChevronDown size={16} className="text-dna-silver" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-dna-black border-dna-tundora text-white">
            <DropdownMenuLabel className="text-dna-silver">
              <div className="flex flex-col">
                <span className="text-white font-medium">{user?.user_metadata?.full_name || 'User'}</span>
                <span className="text-xs text-dna-silver font-normal">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-dna-tundora" />
            <DropdownMenuItem
              className="text-white hover:bg-dna-surface-darker cursor-pointer"
              onClick={() => navigate('/profile')}
            >
              <User size={16} className="mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-white hover:bg-dna-surface-darker cursor-pointer"
              onClick={() => navigate('/settings')}
            >
              <SettingsIcon size={16} className="mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-dna-tundora" />
            <DropdownMenuItem
              className="text-status-red hover:bg-dna-surface-darker cursor-pointer"
              onClick={handleSignOut}
            >
              <LogOut size={16} className="mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
