import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { TwoFactorService } from '@/services/twoFactorService';
import { Building2, Mail, Lock, AlertCircle, Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';

export default function Login() {
  const navigate = useNavigate();
  const { signIn, completeTwoFactorLogin, isAuthenticated, isLoading: authLoading, authState } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 2FA Modal State
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [pending2FAUserId, setPending2FAUserId] = useState<string | null>(null);
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated && authState === 'fully_authenticated') {
      navigate('/');
    }
  }, [isAuthenticated, authLoading, authState, navigate]);

  // Handle redirect for 2FA setup (consultants who haven't set up 2FA yet)
  useEffect(() => {
    if (authState === 'password_verified_pending_2fa_setup') {
      navigate('/2fa-setup');
    }
  }, [authState, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Validation
    if (!email || !password) {
      setError('Please enter both email and password');
      setIsLoading(false);
      return;
    }

    try {
      // First, check if this is a first-time user (no password set yet)
      const { data: userAccount } = await supabase
        .from('user_accounts')
        .select('*')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      // Check if user exists but email is not verified
      if (userAccount && !userAccount.email_verified) {
        setError('Please verify your email address first. Check your inbox for the verification link.');
        setIsLoading(false);
        return;
      }

      // If user exists but has no auth_user_id, they need to set their password
      if (userAccount && !userAccount.auth_user_id) {
        navigate(`/set-password?email=${encodeURIComponent(email.toLowerCase())}`);
        setIsLoading(false);
        return;
      }

      // Proceed with normal login
      const result = await signIn(email, password);

      console.log('🔐 Login result:', result);
      console.log('🔐 requiresVerification:', result.requiresVerification);
      console.log('🔐 requiresSetup:', result.requiresSetup);
      console.log('🔐 success:', result.success);

      setIsLoading(false);

      if (result.success) {
        // Successfully logged in (no 2FA required)
        console.log('✅ Login successful - no 2FA required');
        // The useEffect will handle navigation
      } else if (result.requiresSetup) {
        // Consultant user needs to set up 2FA
        console.log('⚙️ Redirecting to 2FA setup');
        // The useEffect will handle navigation to /2fa-setup
      } else if (result.requiresVerification) {
        // Show 2FA modal instead of redirecting
        console.log('🔒 Showing 2FA modal');
        setPending2FAUserId(result.userId!);
        setShow2FAModal(true);
        setTwoFactorCode('');
        setTwoFactorError(null);
      } else {
        // Login failed
        console.log('❌ Login failed:', result.error?.message);
        setError(result.error?.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const handle2FAVerification = async () => {
    if (twoFactorCode.length !== 6) {
      setTwoFactorError('Please enter a 6-digit code');
      return;
    }

    if (!pending2FAUserId) {
      setTwoFactorError('Session expired. Please login again.');
      return;
    }

    setIsVerifying2FA(true);
    setTwoFactorError(null);

    try {
      // Verify the 2FA code
      const verificationResult = await TwoFactorService.verifyTwoFactorLogin(
        pending2FAUserId,
        twoFactorCode,
        false
      );

      if (!verificationResult.success) {
        setTwoFactorError(verificationResult.error || 'Invalid code. Please try again.');
        setIsVerifying2FA(false);
        setTwoFactorCode('');
        return;
      }

      // Complete the login process
      const loginResult = await completeTwoFactorLogin();

      if (loginResult.success) {
        toast.success('Login successful!');
        setShow2FAModal(false);
        navigate('/');
      } else {
        setTwoFactorError('Failed to complete login. Please try again.');
      }
    } catch (error) {
      console.error('2FA verification error:', error);
      setTwoFactorError('An error occurred during verification. Please try again.');
    } finally {
      setIsVerifying2FA(false);
    }
  };

  const handle2FACancel = () => {
    setShow2FAModal(false);
    setTwoFactorCode('');
    setTwoFactorError(null);
    setPending2FAUserId(null);
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-dna-cream flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-dna-pomegranate" />
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
          <h1 className="text-3xl font-bold text-dna-black mb-2">DNA Ops Manual</h1>
          <p className="text-dna-tundora">Sign in to continue</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl border border-dna-alto p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle size={16} />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-dna-black mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-dna-silver" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="pl-10"
                  disabled={isLoading}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password Field with Visibility Toggle */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-dna-black">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-dna-pomegranate hover:text-dna-pomegranate/80 font-medium transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-dna-silver" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pl-10 pr-10"
                  disabled={isLoading}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dna-silver hover:text-dna-tundora transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-dna-pomegranate hover:bg-dna-pomegranate/90 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Additional Info */}
          <div className="mt-6 text-center text-sm text-dna-tundora">
            <p>Secure access to DNA Client Operations Manual</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-dna-silver">
          <p>© 2026 DNA Advisory. All rights reserved.</p>
        </div>
      </motion.div>

      {/* 2FA Verification Modal */}
      <Dialog open={show2FAModal} onOpenChange={setShow2FAModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-dna-pomegranate/10 rounded-full flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-dna-pomegranate" />
              </div>
            </div>
            <DialogTitle className="text-center">Two-Factor Authentication</DialogTitle>
            <DialogDescription className="text-center">
              Enter the 6-digit code from your authenticator app
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 2FA Error */}
            {twoFactorError && (
              <Alert variant="destructive">
                <AlertCircle size={16} />
                <AlertDescription>{twoFactorError}</AlertDescription>
              </Alert>
            )}

            {/* OTP Input */}
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={twoFactorCode}
                onChange={(value) => setTwoFactorCode(value)}
                disabled={isVerifying2FA}
                onComplete={handle2FAVerification}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <p className="text-xs text-center text-dna-silver">
              The code will auto-verify when you enter all 6 digits
            </p>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handle2FACancel}
                disabled={isVerifying2FA}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-dna-pomegranate hover:bg-dna-pomegranate/90"
                onClick={handle2FAVerification}
                disabled={isVerifying2FA || twoFactorCode.length !== 6}
              >
                {isVerifying2FA ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
