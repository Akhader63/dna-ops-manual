import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Building2, Lock, AlertCircle, Loader2, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

export default function SetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailFromUrl = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailFromUrl);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [userAccount, setUserAccount] = useState<any>(null);

  // Password strength indicators
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  // Verify user exists and hasn't set password yet
  useEffect(() => {
    const verifyUser = async () => {
      if (!email) {
        setError('No email provided. Please start from the login page.');
        setIsVerifying(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_accounts')
          .select('*')
          .eq('email', email.toLowerCase())
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          setError('User account not found. Please contact your administrator.');
          setIsVerifying(false);
          return;
        }

        if (!data.email_verified) {
          setError('Please verify your email address first. Check your inbox for the verification link.');
          setIsVerifying(false);
          return;
        }

        if (data.auth_user_id) {
          setError('This account already has a password. Please use the regular login page.');
          setIsVerifying(false);
          return;
        }

        setUserAccount(data);
      } catch (err) {
        console.error('Error verifying user:', err);
        setError('Failed to verify user account. Please try again.');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyUser();
  }, [email]);

  // Check password strength
  useEffect(() => {
    setPasswordStrength({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    });
  }, [password]);

  const isPasswordStrong = Object.values(passwordStrength).every(v => v);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Validation
    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (!isPasswordStrong) {
      setError('Password does not meet strength requirements');
      setIsLoading(false);
      return;
    }

    try {
      console.log('[SetPassword] Starting password creation for:', email);

      // Step 1: Create Supabase Auth user
      // The handle_new_user trigger will automatically update existing user_accounts with auth_user_id
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        console.error('[SetPassword] SignUp error:', signUpError);

        // Handle rate limit error specifically
        if (signUpError.message?.includes('email_send_rate_limit') || signUpError.message?.includes('rate limit')) {
          throw new Error('Please wait a moment before trying again. For security, there is a brief delay between password creation attempts.');
        }

        throw signUpError;
      }

      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      console.log('[SetPassword] Auth user created successfully:', authData.user.id);

      // Step 2: Mark email as verified in user_accounts (already done via email verification flow)
      // The trigger already updated auth_user_id, we just need to ensure verification flags are set
      await supabase
        .from('user_accounts')
        .update({
          email_verified: true,
          email_verification_token: null,
          email_verification_expires_at: null,
        })
        .eq('id', userAccount.id);

      // Step 3: Sign in the user
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password: password,
      });

      if (signInError) {
        console.error('[SetPassword] Error signing in:', signInError);
        throw signInError;
      }

      console.log('[SetPassword] User signed in successfully');

      toast.success('Password created successfully!', {
        description: 'You can now access your account.',
      });

      // Step 4: Redirect based on user type
      if (userAccount.user_type === 'consultant_user') {
        // Consultant users must set up 2FA
        navigate('/2fa-setup');
      } else {
        // Client users go directly to dashboard
        navigate('/');
      }
    } catch (err) {
      console.error('[SetPassword] Error creating password:', err);
      const errorMessage = (err as Error).message || 'Failed to create password. Please try again.';
      setError(errorMessage);
      toast.error('Failed to create password', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-dna-cream flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-dna-pomegranate" />
      </div>
    );
  }

  if (error && !userAccount) {
    return (
      <div className="min-h-screen bg-dna-cream flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-2xl border border-dna-alto p-8 shadow-sm">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <AlertCircle size={32} className="text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-dna-black mb-2">Unable to Continue</h1>
              <p className="text-dna-tundora text-sm">{error}</p>
            </div>
            <Button
              onClick={() => navigate('/login')}
              className="w-full bg-dna-pomegranate hover:bg-dna-pomegranate/90 text-white"
            >
              Back to Login
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dna-cream flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-dna-pomegranate rounded-2xl mb-4">
            <Building2 size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-dna-black mb-2">Create Your Password</h1>
          <p className="text-dna-tundora">Welcome, {userAccount?.full_name || 'User'}!</p>
          <p className="text-sm text-dna-tundora mt-1">Set up your password to get started</p>
        </div>

        {/* Set Password Form */}
        <div className="bg-white rounded-2xl border border-dna-alto p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle size={16} />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Email (read-only) */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-dna-black mb-1.5">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                readOnly
                disabled
                className="bg-dna-cream/50"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-dna-black mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dna-silver hover:text-dna-tundora"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-dna-black mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dna-silver hover:text-dna-tundora"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Password Strength Indicators */}
            {password && (
              <div className="space-y-2 p-3 bg-dna-cream/30 rounded-lg">
                <p className="text-xs font-medium text-dna-black">Password Requirements:</p>
                <div className="space-y-1.5">
                  <PasswordRequirement met={passwordStrength.length} text="At least 8 characters" />
                  <PasswordRequirement met={passwordStrength.uppercase} text="One uppercase letter" />
                  <PasswordRequirement met={passwordStrength.lowercase} text="One lowercase letter" />
                  <PasswordRequirement met={passwordStrength.number} text="One number" />
                  <PasswordRequirement met={passwordStrength.special} text="One special character" />
                </div>
              </div>
            )}

            {/* User Type Info */}
            {userAccount?.user_type === 'consultant_user' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-800">
                  <strong>Note:</strong> As a Consultant user, you will be required to set up Two-Factor Authentication (2FA) after creating your password.
                </p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-dna-pomegranate hover:bg-dna-pomegranate/90 text-white"
              disabled={isLoading || !isPasswordStrong || password !== confirmPassword}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Password...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Create Password & Continue
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-dna-tundora mt-6">
          © {new Date().getFullYear()} DNA Advisory. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}

// Helper Component: Password Requirement Indicator
function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {met ? (
        <CheckCircle2 size={14} className="text-green-600 shrink-0" />
      ) : (
        <XCircle size={14} className="text-dna-silver shrink-0" />
      )}
      <span className={met ? 'text-green-700 font-medium' : 'text-dna-tundora'}>
        {text}
      </span>
    </div>
  );
}
