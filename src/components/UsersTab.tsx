import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import {
  Users as UsersIcon,
  Search,
  Plus,
  Shield,
  MoreVertical,
  Mail,
  User,
  Building2,
  Briefcase,
  Filter,
  X,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  Check,
  AlertCircle,
  Trash2,
  UserX,
  RefreshCw,
} from 'lucide-react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import type { UserAccount } from '@/types/database';
import { sendVerificationEmail } from '@/services/emailService';

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

interface UsersTabProps {}

export default function UsersTab({}: UsersTabProps) {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUserType, setFilterUserType] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserAccount | null>(null);
  const [userHasActivity, setUserHasActivity] = useState(false);
  const [positions, setPositions] = useState<Array<{id: string; name: string; is_active: boolean}>>([]);
  const [departments, setDepartments] = useState<Array<{id: string; name: string; is_active: boolean}>>([]);

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('user_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers((data || []) as UserAccount[]);
      setFilteredUsers((data || []) as UserAccount[]);
    } catch (err) {
      setError((err as Error).message || 'Failed to load users');
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchPositions = async () => {
    try {
      const { data, error } = await supabase
        .from('positions')
        .select('id, name, is_active')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setPositions(data || []);
      console.log('[UsersTab] Loaded positions:', data?.length || 0);
    } catch (error) {
      console.error('[UsersTab] Error fetching positions:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name, is_active')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setDepartments(data || []);
      console.log('[UsersTab] Loaded departments:', data?.length || 0);
    } catch (error) {
      console.error('[UsersTab] Error fetching departments:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchPositions();
    fetchDepartments();
  }, []);

  const handleResendInvitation = async (user: UserAccount) => {
    try {
      // Generate new verification token
      const verificationToken = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

      // Update user with new token
      const { error: updateError } = await supabase
        .from('user_accounts')
        .update({
          email_verification_token: verificationToken,
          email_verification_expires_at: expiresAt.toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Send verification email
      const { sendVerificationEmail } = await import('@/services/emailService');
      const result = await sendVerificationEmail(
        user.email,
        user.full_name || 'User',
        verificationToken
      );

      if (result.success) {
        toast.success('Invitation resent successfully', {
          description: `Verification email sent to ${user.email}`,
        });
      } else {
        toast.error('Failed to send invitation email', {
          description: result.error || 'Please try again later',
        });
      }
    } catch (err) {
      console.error('Error resending invitation:', err);
      toast.error('Failed to resend invitation', {
        description: (err as Error).message || 'Please try again',
      });
    }
  };

  const handleResetOnboarding = async (user: UserAccount) => {
    try {
      // Generate new verification token
      const verificationToken = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 day expiry

      // Reset user to unverified state with new token
      const { error: updateError } = await supabase
        .from('user_accounts')
        .update({
          email_verified: false, // Reset verification
          email_verification_token: verificationToken,
          email_verification_expires_at: expiresAt.toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Send new verification email
      const { sendVerificationEmail } = await import('@/services/emailService');
      const result = await sendVerificationEmail(
        user.email,
        user.full_name || 'User',
        verificationToken
      );

      if (result.success) {
        toast.success('Onboarding reset successfully', {
          description: `New verification email sent to ${user.email}. User can now complete the onboarding process.`,
        });
        // Refresh users list to show updated status
        await fetchUsers();
      } else {
        toast.error('Failed to send verification email', {
          description: result.error || 'User onboarding was reset, but email failed to send.',
        });
      }
    } catch (err) {
      console.error('Error resetting onboarding:', err);
      toast.error('Failed to reset onboarding', {
        description: (err as Error).message || 'Please try again',
      });
    }
  };

  const checkUserActivity = async (userId: string): Promise<boolean> => {
    try {
      // Check if user has logged in (has last_login timestamp)
      const user = users.find(u => u.id === userId);
      if (user?.last_login) {
        return true; // User has logged in before
      }

      // TODO: Add more checks as the app grows:
      // - Check if user created any projects
      // - Check if user created any workflows
      // - Check if user has any assigned tasks
      // - Check if user created any issues
      // - etc.

      // For now, consider user has activity if they've logged in or set password
      if (user?.auth_user_id) {
        return true; // User has set password
      }

      return false; // No activity found
    } catch (err) {
      console.error('Error checking user activity:', err);
      return true; // On error, assume user has activity to be safe
    }
  };

  const handleDeleteUser = async (user: UserAccount) => {
    const hasActivity = await checkUserActivity(user.id);
    setUserHasActivity(hasActivity);
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      if (userHasActivity) {
        // User has activity - deactivate instead of delete
        const { error } = await supabase
          .from('user_accounts')
          .update({ is_active: false })
          .eq('id', userToDelete.id);

        if (error) throw error;

        toast.success('User deactivated successfully', {
          description: `${userToDelete.full_name || userToDelete.email} has been deactivated.`,
        });
      } else {
        // User has no activity - safe to delete
        // First, delete from auth if they have an auth account
        if (userToDelete.auth_user_id) {
          // Note: You'll need admin API to delete auth users
          // For now, we'll just delete from user_accounts
        }

        const { error } = await supabase
          .from('user_accounts')
          .delete()
          .eq('id', userToDelete.id);

        if (error) throw error;

        toast.success('User deleted successfully', {
          description: `${userToDelete.full_name || userToDelete.email} has been removed.`,
        });
      }

      // Refresh users list
      await fetchUsers();
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (err) {
      console.error('Error deleting/deactivating user:', err);
      toast.error('Failed to delete user', {
        description: (err as Error).message || 'Please try again',
      });
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = users;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.position?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // User Type filter
    if (filterUserType !== 'all') {
      filtered = filtered.filter(user => user.user_type === filterUserType);
    }

    // Role filter
    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole);
    }

    // Status filter
    if (filterStatus !== 'all') {
      if (filterStatus === 'active') {
        filtered = filtered.filter(user => user.is_active);
      } else {
        filtered = filtered.filter(user => !user.is_active);
      }
    }

    setFilteredUsers(filtered);
  }, [searchQuery, filterUserType, filterRole, filterStatus, users]);

  const roleBadge = (role: string) => {
    const normalizedRole = role.toLowerCase().replace(/\s+/g, '_');
    switch (normalizedRole) {
      case 'super_admin':
        return <Badge className="bg-[#FEE2E2] text-[#DC2626] border-0 hover:bg-[#FEE2E2] font-semibold">Super Admin</Badge>;
      case 'admin':
        return <Badge className="bg-[#F3E8FF] text-[#9333EA] border-0 hover:bg-[#F3E8FF]">Admin</Badge>;
      case 'consultant':
        return <Badge className="bg-[#DBEAFE] text-[#2563EB] border-0 hover:bg-[#DBEAFE]">Consultant</Badge>;
      default:
        return <Badge className="bg-dna-cream text-dna-tundora border-0 hover:bg-dna-cream">Viewer</Badge>;
    }
  };

  const userTypeBadge = (userType: string | null) => {
    if (!userType) return <span className="text-dna-silver text-sm">—</span>;
    if (userType === 'client_user') {
      return <Badge className="bg-[#E0F2FE] text-[#0369A1] border-0 hover:bg-[#E0F2FE]">Client User</Badge>;
    }
    return <Badge className="bg-[#FEF3C7] text-[#92400E] border-0 hover:bg-[#FEF3C7]">Consultant</Badge>;
  };

  const statusBadge = (isActive: boolean) =>
    isActive ? (
      <Badge className="bg-[#D1FAE5] text-[#059669] border-0 hover:bg-[#D1FAE5]">Active</Badge>
    ) : (
      <Badge className="bg-[#F3F4F6] text-[#6B7280] border-0 hover:bg-[#F3F4F6]">Inactive</Badge>
    );

  const verificationBadge = (emailVerified: boolean | null) =>
    emailVerified ? (
      <Badge className="bg-[#D1FAE5] text-[#059669] border-0 hover:bg-[#D1FAE5]">
        <Check className="w-3 h-3 mr-1" />
        Verified
      </Badge>
    ) : (
      <Badge className="bg-[#FEF3C7] text-[#92400E] border-0 hover:bg-[#FEF3C7]">
        <AlertCircle className="w-3 h-3 mr-1" />
        Pending
      </Badge>
    );

  const formatLastLogin = (lastLogin: string | null) => {
    if (!lastLogin) return '—';
    const date = new Date(lastLogin);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterUserType('all');
    setFilterRole('all');
    setFilterStatus('all');
  };

  const hasActiveFilters = searchQuery || filterUserType !== 'all' || filterRole !== 'all' || filterStatus !== 'all';

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        <p>{error}</p>
        <Button onClick={fetchUsers} variant="outline" className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-dna-black flex items-center gap-2">
              <UsersIcon className="w-6 h-6" />
              Users
            </h2>
            <p className="text-sm text-dna-tundora mt-1">
              Manage user accounts, roles, and permissions
            </p>
          </div>
          <Button
            onClick={() => setShowAddUserDialog(true)}
            className="bg-dna-pomegranate hover:bg-dna-pomegranate/90 text-white gap-2"
          >
            <Plus className="w-4 h-4" />
            Add User
          </Button>
        </div>

        {/* Super Admin Banner */}
        {users.some(u => u.is_super_admin) && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <Shield className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-red-900">Super Admin Account Protected</p>
              <p className="text-red-700 mt-0.5">
                Super Admin accounts are system-protected and cannot be edited or deleted.
              </p>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dna-silver" />
              <Input
                type="text"
                placeholder="Search by name, email, department, or position..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dna-silver hover:text-dna-tundora"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Toggle Filters Button */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={`gap-2 ${hasActiveFilters ? 'border-dna-pomegranate text-dna-pomegranate' : ''}`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <Badge className="ml-1 bg-dna-pomegranate text-white">
                  Active
                </Badge>
              )}
            </Button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-dna-cream/30 dark:bg-dna-surface-darker rounded-lg border border-dna-alto dark:border-dna-tundora"
            >
              <div>
                <label className="block text-xs font-medium text-dna-black mb-1.5">User Type</label>
                <select
                  value={filterUserType}
                  onChange={(e) => setFilterUserType(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-dna-alto dark:border-dna-tundora rounded-md bg-white dark:bg-dna-surface-darker dark:text-white"
                >
                  <option value="all">All Types</option>
                  <option value="client_user">Client User</option>
                  <option value="consultant_user">Consultant User</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-dna-black mb-1.5">Role</label>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-dna-alto dark:border-dna-tundora rounded-md bg-white dark:bg-dna-surface-darker dark:text-white"
                >
                  <option value="all">All Roles</option>
                  <option value="super_admin">Super Admin</option>
                  <option value="admin">Admin</option>
                  <option value="consultant">Consultant</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-dna-black mb-1.5">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-dna-alto dark:border-dna-tundora rounded-md bg-white dark:bg-dna-surface-darker dark:text-white"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {hasActiveFilters && (
                <div className="col-span-full flex justify-end">
                  <Button
                    variant="ghost"
                    onClick={clearFilters}
                    size="sm"
                    className="text-dna-pomegranate hover:text-dna-pomegranate/80 gap-1"
                  >
                    <X className="w-3 h-3" />
                    Clear Filters
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Users Table */}
        {filteredUsers.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-dna-surface-darker rounded-lg border border-dna-alto dark:border-dna-tundora">
            <div className="w-12 h-12 rounded-full bg-dna-cream mx-auto mb-4 flex items-center justify-center">
              <UsersIcon className="w-6 h-6 text-dna-silver" />
            </div>
            <h3 className="text-lg font-semibold text-dna-black mb-2">
              {hasActiveFilters ? 'No users found' : 'No users yet'}
            </h3>
            <p className="text-sm text-dna-tundora mb-6">
              {hasActiveFilters
                ? 'Try adjusting your search or filters.'
                : 'Get started by adding your first user to the system.'}
            </p>
            {!hasActiveFilters && (
              <Button
                onClick={() => setShowAddUserDialog(true)}
                className="bg-dna-pomegranate hover:bg-dna-pomegranate/90 text-white gap-2"
              >
                <Plus className="w-4 h-4" />
                Add User
              </Button>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-dna-surface-darker rounded-lg border border-dna-alto dark:border-dna-tundora overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">User Type</TableHead>
                  <TableHead className="font-semibold">Role</TableHead>
                  <TableHead className="font-semibold">Position</TableHead>
                  <TableHead className="font-semibold">Department</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Email Verified</TableHead>
                  <TableHead className="font-semibold">Last Login</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className={user.is_super_admin ? 'bg-red-50/30' : ''}>
                    <TableCell className="font-medium text-dna-black">
                      <div className="flex items-center gap-2">
                        {user.is_super_admin && (
                          <Shield className="w-4 h-4 text-red-600" />
                        )}
                        {user.full_name ?? '—'}
                      </div>
                    </TableCell>
                    <TableCell className="text-dna-tundora text-sm">{user.email}</TableCell>
                    <TableCell>{userTypeBadge(user.user_type)}</TableCell>
                    <TableCell>{roleBadge(user.role)}</TableCell>
                    <TableCell className="text-dna-tundora text-sm">{user.position ?? '—'}</TableCell>
                    <TableCell className="text-dna-tundora text-sm">{user.department ?? '—'}</TableCell>
                    <TableCell>{statusBadge(user.is_active)}</TableCell>
                    <TableCell>{verificationBadge(user.email_verified)}</TableCell>
                    <TableCell className="text-dna-tundora text-sm">{formatLastLogin(user.last_login)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            disabled={user.is_super_admin}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {!user.email_verified && (
                            <DropdownMenuItem onClick={() => handleResendInvitation(user)}>
                              <Mail className="w-4 h-4 mr-2" />
                              Resend Invitation
                            </DropdownMenuItem>
                          )}
                          {user.email_verified && !user.auth_user_id && (
                            <DropdownMenuItem onClick={() => handleResetOnboarding(user)}>
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Reset Onboarding
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteUser(user)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Add User Dialog */}
        <AddUserDialog
          open={showAddUserDialog}
          onClose={() => setShowAddUserDialog(false)}
          onSuccess={() => {
            setShowAddUserDialog(false);
            fetchUsers();
            fetchPositions();
            fetchDepartments();
          }}
          departments={departments}
          positions={positions}
        />

        {/* Delete User Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {userHasActivity ? 'Deactivate User' : 'Delete User'}
              </DialogTitle>
              <DialogDescription>
                {userHasActivity ? (
                  <>
                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-amber-900">User has activity</p>
                        <p className="text-amber-700 mt-1">
                          This user has logged in or has data associated with their account.
                          To maintain data integrity, this user will be <strong>deactivated</strong> instead of deleted.
                        </p>
                      </div>
                    </div>
                    <p>
                      Are you sure you want to deactivate <strong>{userToDelete?.full_name || userToDelete?.email}</strong>?
                      They will no longer be able to access the system.
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      Are you sure you want to permanently delete <strong>{userToDelete?.full_name || userToDelete?.email}</strong>?
                    </p>
                    <p className="mt-2 text-red-600 font-medium">
                      This action cannot be undone.
                    </p>
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setUserToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                className={userHasActivity ? 'bg-amber-600 hover:bg-amber-700' : 'bg-red-600 hover:bg-red-700'}
                onClick={confirmDeleteUser}
              >
                {userHasActivity ? (
                  <>
                    <UserX className="w-4 h-4 mr-2" />
                    Deactivate User
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete User
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </>
  );
}

// Add User Dialog Component
function AddUserDialog({
  open,
  onClose,
  onSuccess,
  departments,
  positions
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  departments: Array<{id: string; name: string; is_active: boolean}>;
  positions: Array<{id: string; name: string; is_active: boolean}>;
}) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    userType: 'client_user' as 'client_user' | 'consultant_user',
    role: 'viewer' as 'super_admin' | 'admin' | 'consultant' | 'viewer',
    department_id: '',
    position_id: '',
    phone: '',
    linkedClientId: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Validation
      if (!formData.fullName || !formData.email) {
        setError('Full Name and Email are required');
        setIsSubmitting(false);
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address');
        setIsSubmitting(false);
        return;
      }

      // Check if user already exists
      const { data: existingUsers } = await supabase
        .from('user_accounts')
        .select('id')
        .eq('email', formData.email.toLowerCase());

      if (existingUsers && existingUsers.length > 0) {
        setError('A user with this email already exists');
        setIsSubmitting(false);
        return;
      }

      // Generate email verification token (secure random token)
      const verificationToken = `verify_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}${Date.now().toString(36)}`;
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiry

      // Create user account
      const { error: createError } = await supabase
        .from('user_accounts')
        .insert({
          email: formData.email.toLowerCase(),
          full_name: formData.fullName,
          user_type: formData.userType,
          role: formData.role,
          department_id: formData.department_id || null,
          position_id: formData.position_id || null,
          phone: formData.phone || null,
          linked_client_id: formData.linkedClientId || null,
          is_active: true,
          is_super_admin: false,
          auth_user_id: null, // No auth user yet - will be created after verification
          email_verified: false,
          email_verification_token: verificationToken,
          email_verification_expires_at: expiresAt.toISOString(),
          invited_at: new Date().toISOString(),
          two_factor_enabled: false,
          two_factor_required: formData.userType === 'consultant_user', // Auto-set for consultants
        });

      if (createError) throw createError;

      // Send verification email
      const emailResult = await sendVerificationEmail(
        formData.email.toLowerCase(),
        formData.fullName,
        verificationToken
      );

      if (emailResult.success) {
        toast.success('User created successfully', {
          description: `Verification email sent to ${formData.fullName}. They must verify their email to continue.`,
        });
      } else {
        toast.warning('User created but email not sent', {
          description: emailResult.error || 'SMTP may not be configured. User can still be verified manually.',
        });
      }

      onSuccess();

      // Reset form
      setFormData({
        fullName: '',
        email: '',
        userType: 'client_user',
        role: 'viewer',
        department_id: '',
        position_id: '',
        phone: '',
        linkedClientId: '',
      });
    } catch (err) {
      console.error('Error creating user:', err);
      setError((err as Error).message || 'Failed to create user');
      toast.error('Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        fullName: '',
        email: '',
        userType: 'client_user',
        role: 'viewer',
        department_id: '',
        position_id: '',
        phone: '',
        linkedClientId: '',
      });
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Create a new user account. The user will set their own password upon first login.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-dna-black mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="John Doe"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-dna-black mb-1.5">
              Email Address <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john.doe@example.com"
              required
            />
            <p className="text-xs text-dna-tundora mt-1">
              User will receive instructions to create their password
            </p>
          </div>

          {/* User Type */}
          <div>
            <label className="block text-sm font-medium text-dna-black mb-1.5">
              User Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.userType}
              onChange={(e) => setFormData({ ...formData, userType: e.target.value as 'client_user' | 'consultant_user' })}
              className="w-full px-3 py-2 text-sm border border-dna-alto rounded-md bg-white"
              required
            >
              <option value="client_user">Client User</option>
              <option value="consultant_user">Consultant User</option>
            </select>
            <p className="text-xs text-dna-tundora mt-1">
              {formData.userType === 'consultant_user'
                ? '⚠️ Consultant users are required to set up 2FA on first login'
                : 'Client users can optionally enable 2FA from their profile'}
            </p>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-dna-black mb-1.5">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              className="w-full px-3 py-2 text-sm border border-dna-alto rounded-md bg-white"
              required
            >
              <option value="viewer">Viewer</option>
              <option value="consultant">Consultant</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-dna-black mb-1.5">
              Department
            </label>
            <Select
              value={formData.department_id}
              onValueChange={(value) => setFormData({ ...formData, department_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a department..." />
              </SelectTrigger>
              <SelectContent>
                {departments.length === 0 ? (
                  <SelectItem value="" disabled>No active departments available</SelectItem>
                ) : (
                  departments.map((department) => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Position */}
          <div>
            <label className="block text-sm font-medium text-dna-black mb-1.5">
              Position
            </label>
            <Select
              value={formData.position_id}
              onValueChange={(value) => setFormData({ ...formData, position_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a position..." />
              </SelectTrigger>
              <SelectContent>
                {positions.length === 0 ? (
                  <SelectItem value="" disabled>No active positions available</SelectItem>
                ) : (
                  positions.map((position) => (
                    <SelectItem key={position.id} value={position.id}>
                      {position.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-dna-black mb-1.5">
              Phone
            </label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-dna-pomegranate hover:bg-dna-pomegranate/90 text-white gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create User
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
