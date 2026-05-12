import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Building2, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [isVerifying, setIsVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);

  // Verify email token
  useEffect(() => {
    const verifyEmailToken = async () => {
      if (!token) {
        setError('No verification token provided.');
        setIsVerifying(false);
        return;
      }

      try {
        // Find user with this verification token
        const { data: userAccount, error: fetchError } = await supabase
          .from('user_accounts')
          .select('*')
          .eq('email_verification_token', token)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (!userAccount) {
          setError('Invalid or expired verification token.');
          setIsVerifying(false);
          return;
        }

        // Check if token is expired
        if (userAccount.email_verification_expires_at) {
          const expiresAt = new Date(userAccount.email_verification_expires_at);
          if (expiresAt < new Date()) {
            setError('This verification link has expired. Please contact your administrator.');
            setIsVerifying(false);
            return;
          }
        }

        // Check if already verified AND password already set
        if (userAccount.email_verified && userAccount.auth_user_id) {
          setError('This email has already been verified and password set. Please proceed to login.');
          setIsVerifying(false);
          return;
        }

        // If already verified but no password yet, allow continuation
        if (userAccount.email_verified && !userAccount.auth_user_id) {
          console.log('[VerifyEmail] Email already verified, allowing user to continue to set password');
          setUserEmail(userAccount.email);
          setVerified(true);
          setIsVerifying(false);
          toast.success('Email already verified!', {
            description: 'You can now set up your password.',
          });
          return;
        }

        // Mark email as verified but KEEP the token active
        // Token will be cleared only after password is set in SetPassword page
        const { error: updateError } = await supabase
          .from('user_accounts')
          .update({
            email_verified: true,
            // DO NOT clear token yet - keep it active until password is set
            // email_verification_token: null,
            // email_verification_expires_at: null,
          })
          .eq('id', userAccount.id);

        if (updateError) throw updateError;

        setUserEmail(userAccount.email);
        setVerified(true);
        setIsVerifying(false);

        toast.success('Email verified successfully!', {
          description: 'You can now set up your password.',
        });
      } catch (err) {
        console.error('Error verifying email:', err);
        setError((err as Error).message || 'Failed to verify email. Please try again.');
        setIsVerifying(false);
      }
    };

    verifyEmailToken();
  }, [token]);

  // Auto-redirect countdown
  useEffect(() => {
    if (verified && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }

    if (verified && countdown === 0) {
      handleContinue();
    }
  }, [verified, countdown]);

  const handleContinue = () => {
    if (userEmail) {
      navigate(`/set-password?email=${encodeURIComponent(userEmail)}`);
    }
  };

  // Loading state
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-dna-cream flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <Loader2 className="w-12 h-12 animate-spin text-dna-pomegranate mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-dna-black">Verifying your email...</h2>
          <p className="text-sm text-dna-tundora mt-2">Please wait a moment</p>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error) {
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
              <h1 className="text-2xl font-bold text-dna-black mb-2">Verification Failed</h1>
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

  // Success state
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
        </div>

        {/* Success Card */}
        <div className="bg-white rounded-2xl border border-dna-alto p-8 shadow-sm">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle2 size={32} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-dna-black mb-2">Email Verified!</h2>
            <p className="text-dna-tundora">
              Your email address has been successfully verified.
            </p>
          </div>

          <div className="space-y-4">
            {/* Auto-redirect message */}
            <div className="p-4 bg-dna-cream/50 rounded-lg text-center">
              <p className="text-sm text-dna-tundora">
                Redirecting to password setup in{' '}
                <span className="font-bold text-dna-pomegranate text-lg">{countdown}</span>{' '}
                seconds...
              </p>
            </div>

            {/* Manual continue button */}
            <Button
              onClick={handleContinue}
              className="w-full bg-dna-pomegranate hover:bg-dna-pomegranate/90 text-white gap-2"
            >
              Set Up Password Now
              <ArrowRight size={16} />
            </Button>

            {/* Help text */}
            <p className="text-xs text-center text-dna-tundora">
              Next step: Create a secure password for your account
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-dna-tundora mt-6">
          © {new Date().getFullYear()} DNA Advisory. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}
