import { useAuth } from '@/hooks/useAuth';

export default function DebugAuth() {
  const auth = useAuth();
  
  return (
    <div className="p-8 bg-white">
      <h1 className="text-2xl font-bold mb-4">Auth Debug Info</h1>
      <div className="space-y-2 font-mono text-sm">
        <div>isLoading: <strong>{String(auth.isLoading)}</strong></div>
        <div>isAuthenticated: <strong>{String(auth.isAuthenticated)}</strong></div>
        <div>authState: <strong>{auth.authState}</strong></div>
        <div>user: <strong>{auth.user ? auth.user.email : 'null'}</strong></div>
        <div>userAccount: <strong>{auth.userAccount ? auth.userAccount.email : 'null'}</strong></div>
        <div>pendingUserId: <strong>{auth.pendingUserId || 'null'}</strong></div>
        <div>error: <strong>{auth.error?.message || 'null'}</strong></div>
      </div>
    </div>
  );
}
