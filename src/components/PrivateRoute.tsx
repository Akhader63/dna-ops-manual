import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useActiveModules, isModuleActive } from '@/hooks/useActiveModules';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Map routes to module codes
const routeToModuleMap: Record<string, string> = {
  '/': 'dashboard',
  '/clients': 'clients',
  '/manual-builder': 'manual_builder',
  '/module-library': 'module_library',
  '/approval-gateways': 'approval_gateways',
  '/role-setup': 'role_setup',
  '/roadmap-generator': 'roadmap_generator',
  '/manual-preview': 'manual_preview',
  '/project-tracker': 'project_tracker',
  '/issues-tracker': 'issues_tracker',
  // Settings is always accessible
  '/settings': 'settings',
  '/profile': 'settings', // Profile is part of settings
};

export default function PrivateRoute() {
  const { isAuthenticated, isLoading, authState } = useAuth();
  const { activeModules, loading: modulesLoading } = useActiveModules();
  const location = useLocation();

  // Show loading spinner while checking authentication or modules
  if (isLoading || modulesLoading) {
    return (
      <div className="min-h-screen bg-dna-cream flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-dna-pomegranate" />
      </div>
    );
  }

  // Check authentication states - IMPORTANT: Check these BEFORE isAuthenticated
  // because pending 2FA states have isAuthenticated: false but still have a session

  // Check if pending 2FA setup (Consultant users)
  if (authState === 'password_verified_pending_2fa_setup') {
    return <Navigate to="/2fa-setup" replace />;
  }

  // Check if pending 2FA verification - redirect to login to show modal
  if (authState === 'password_verified_pending_2fa_verification') {
    return <Navigate to="/login" replace />;
  }

  // Check if user is fully authenticated
  if (authState === 'fully_authenticated' && isAuthenticated) {
    // Check module activation status
    const currentPath = location.pathname;

    // Find the matching module code for the current route
    const moduleCode = Object.entries(routeToModuleMap).find(([route]) => {
      if (route === '/') return currentPath === '/';
      return currentPath.startsWith(route);
    })?.[1];

    // If we found a module code and it's not active, redirect to dashboard
    if (moduleCode && !isModuleActive(moduleCode, activeModules)) {
      // Get the module name from the route
      const moduleName = moduleCode
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      // Show warning toast (setTimeout to avoid React warning)
      setTimeout(() => {
        toast.warning(`${moduleName} Module Disabled`, {
          description: 'This module has been deactivated by an administrator.',
        });
      }, 0);

      return <Navigate to="/" replace />;
    }

    return <Outlet />;
  }

  // If not authenticated and no pending states - redirect to login
  if (authState === 'unauthenticated') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Fallback - redirect to login
  return <Navigate to="/login" state={{ from: location }} replace />;
}
