import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { User, Mail, Briefcase, Building2, Phone, Shield, ShieldCheck, ShieldOff, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

export default function Profile() {
  const navigate = useNavigate();
  const { userAccount, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const isConsultant = userAccount?.user_type === 'consultant_user';
  const twoFactorEnabled = userAccount?.two_factor_enabled || false;

  const handleToggle2FA = async (enabled: boolean) => {
    if (isConsultant) {
      toast.error('Two-Factor Authentication is mandatory for Consultant users and cannot be disabled.');
      return;
    }

    if (enabled) {
      // Navigate to 2FA setup
      navigate('/2fa-setup');
    } else {
      // Disable 2FA
      setIsLoading(true);
      try {
        const { error } = await supabase
          .from('user_accounts')
          .update({
            two_factor_enabled: false,
            two_factor_secret: null,
            two_factor_configured_at: null,
          })
          .eq('id', userAccount?.id);

        if (error) throw error;

        toast.success('Two-Factor Authentication disabled', {
          description: 'You will no longer be required to enter a code when logging in.',
        });

        // Reload the page to reflect changes
        window.location.reload();
      } catch (err) {
        console.error('Error disabling 2FA:', err);
        toast.error('Failed to disable 2FA');
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (authLoading || !userAccount) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-dna-pomegranate" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="space-y-6"
      >
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-dna-black">Profile</h1>
          <p className="text-dna-tundora mt-1">Manage your account settings and preferences</p>
        </div>

        {/* User Information Card */}
        <div className="bg-white rounded-lg border border-dna-alto p-6 space-y-4">
          <h2 className="text-xl font-semibold text-dna-black flex items-center gap-2">
            <User size={20} />
            Personal Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-dna-tundora mb-1">Full Name</label>
              <div className="flex items-center gap-2 text-dna-black">
                <User size={16} className="text-dna-silver" />
                <span>{userAccount.full_name || 'N/A'}</span>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-dna-tundora mb-1">Email Address</label>
              <div className="flex items-center gap-2 text-dna-black">
                <Mail size={16} className="text-dna-silver" />
                <span>{userAccount.email}</span>
              </div>
            </div>

            {/* Department */}
            {userAccount.department && (
              <div>
                <label className="block text-sm font-medium text-dna-tundora mb-1">Department</label>
                <div className="flex items-center gap-2 text-dna-black">
                  <Building2 size={16} className="text-dna-silver" />
                  <span>{userAccount.department}</span>
                </div>
              </div>
            )}

            {/* Position */}
            {userAccount.position && (
              <div>
                <label className="block text-sm font-medium text-dna-tundora mb-1">Position</label>
                <div className="flex items-center gap-2 text-dna-black">
                  <Briefcase size={16} className="text-dna-silver" />
                  <span>{userAccount.position}</span>
                </div>
              </div>
            )}

            {/* Phone */}
            {userAccount.phone && (
              <div>
                <label className="block text-sm font-medium text-dna-tundora mb-1">Phone</label>
                <div className="flex items-center gap-2 text-dna-black">
                  <Phone size={16} className="text-dna-silver" />
                  <span>{userAccount.phone}</span>
                </div>
              </div>
            )}

            {/* User Type */}
            <div>
              <label className="block text-sm font-medium text-dna-tundora mb-1">User Type</label>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={
                  isConsultant
                    ? 'bg-blue-100 text-blue-700 border-blue-200'
                    : 'bg-green-100 text-green-700 border-green-200'
                }>
                  {isConsultant ? 'Consultant User' : 'Client User'}
                </Badge>
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-dna-tundora mb-1">Role</label>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200 capitalize">
                  {userAccount.role.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings Card */}
        <div className="bg-white rounded-lg border border-dna-alto p-6 space-y-4">
          <h2 className="text-xl font-semibold text-dna-black flex items-center gap-2">
            <Shield size={20} />
            Security Settings
          </h2>

          {/* 2FA Section */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-dna-black">Two-Factor Authentication</h3>
                  {twoFactorEnabled && (
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                      <ShieldCheck size={12} className="mr-1" />
                      Enabled
                    </Badge>
                  )}
                  {!twoFactorEnabled && (
                    <Badge variant="outline" className="text-dna-tundora">
                      <ShieldOff size={12} className="mr-1" />
                      Disabled
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-dna-tundora">
                  {isConsultant
                    ? 'Two-Factor Authentication is mandatory for all Consultant users and cannot be disabled.'
                    : 'Add an extra layer of security to your account by requiring a verification code when logging in.'}
                </p>
              </div>

              {/* Toggle Switch (only for Client users) */}
              {!isConsultant && (
                <Switch
                  checked={twoFactorEnabled}
                  onCheckedChange={handleToggle2FA}
                  disabled={isLoading}
                />
              )}

              {/* Consultant - Cannot Disable */}
              {isConsultant && (
                <div className="flex items-center gap-2 text-sm text-dna-tundora">
                  <Shield size={16} className="text-blue-600" />
                  <span className="font-medium">Mandatory</span>
                </div>
              )}
            </div>

            {/* Consultant Alert */}
            {isConsultant && (
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle size={16} className="text-blue-600" />
                <AlertDescription className="text-blue-800 text-sm">
                  As a Consultant user, Two-Factor Authentication is required for your account and cannot be disabled for security reasons.
                </AlertDescription>
              </Alert>
            )}

            {/* Client - 2FA Details */}
            {!isConsultant && twoFactorEnabled && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                <p className="font-medium mb-1">2FA is currently active</p>
                <p>You will be required to enter a verification code from your authenticator app when logging in.</p>
              </div>
            )}

            {/* Reconfigure Option */}
            {twoFactorEnabled && (
              <Button
                variant="outline"
                onClick={() => navigate('/2fa-setup')}
                className="gap-2"
              >
                <Shield size={16} />
                Reconfigure 2FA
              </Button>
            )}
          </div>

          {/* Last 2FA Verification */}
          {userAccount.last_two_factor_verification && (
            <div className="pt-3 border-t border-dna-alto">
              <p className="text-xs text-dna-tundora">
                Last 2FA verification:{' '}
                <span className="font-medium">
                  {new Date(userAccount.last_two_factor_verification).toLocaleString()}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Account Status */}
        <div className="bg-white rounded-lg border border-dna-alto p-6 space-y-3">
          <h2 className="text-xl font-semibold text-dna-black">Account Status</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-dna-tundora">Status:</span>{' '}
              <Badge className={userAccount.is_active ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-700 border-gray-200'}>
                {userAccount.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            <div>
              <span className="text-dna-tundora">Account Created:</span>{' '}
              <span className="font-medium text-dna-black">
                {new Date(userAccount.created_at).toLocaleDateString()}
              </span>
            </div>

            {userAccount.last_login && (
              <div>
                <span className="text-dna-tundora">Last Login:</span>{' '}
                <span className="font-medium text-dna-black">
                  {new Date(userAccount.last_login).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
