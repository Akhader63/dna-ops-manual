import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function PrivateRoute() {
  const { isAuthenticated, isLoading, authState } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
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
    return <Outlet />;
  }

  // If not authenticated and no pending states - redirect to login
  if (authState === 'unauthenticated') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Fallback - redirect to login
  return <Navigate to="/login" state={{ from: location }} replace />;
}
