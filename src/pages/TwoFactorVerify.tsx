import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, AlertCircle, Loader2, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TwoFactorService } from '@/services/twoFactorService';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export default function TwoFactorVerify() {
  const navigate = useNavigate();
  const location = useLocation();
  const { completeTwoFactorLogin } = useAuth();

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [userEmail, setUserEmail] = useState<string>('');
  const [userId, setUserId] = useState<string>('');

  const MAX_ATTEMPTS = 5;

  useEffect(() => {
    // Get pending user data from localStorage (set during login)
    const pendingData = localStorage.getItem('pending_2fa_user');
    if (!pendingData) {
      navigate('/login');
      return;
    }

    try {
      const data = JSON.parse(pendingData);
      setUserId(data.userId);
      setUserEmail(data.email);
    } catch {
      navigate('/login');
    }
  }, [navigate]);

  const handleVerify = async () => {
    if (!code || (useRecoveryCode ? code.length !== 8 : code.length !== 6)) {
      setError(useRecoveryCode ? 'Please enter an 8-character recovery code' : 'Please enter a 6-digit code');
      return;
    }

    if (!userId) {
      setError('Session expired. Please log in again.');
      return;
    }

    if (attemptCount >= MAX_ATTEMPTS) {
      setError('Too many failed attempts. Please try again later.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      // Verify the 2FA code
      const result = await TwoFactorService.verifyTwoFactorLogin(
        userId,
        code,
        useRecoveryCode
      );

      if (result.success) {
        // Code verified! Now complete the login by marking the session as fully authenticated
        const loginResult = await completeTwoFactorLogin();

        if (loginResult.success) {
          // Clear pending data
          localStorage.removeItem('pending_2fa_user');

          toast.success('Verification successful! Redirecting...');

          // Redirect to dashboard or intended destination
          const from = (location.state as any)?.from?.pathname || '/';
          navigate(from);
        } else {
          setError('Session expired. Please log in again.');
          setTimeout(() => navigate('/login'), 2000);
        }
      } else {
        setAttemptCount(prev => prev + 1);
        const attemptsLeft = MAX_ATTEMPTS - attemptCount - 1;

        if (attemptsLeft > 0) {
          setError(`${result.error}. ${attemptsLeft} attempt${attemptsLeft > 1 ? 's' : ''} remaining.`);
        } else {
          setError('Too many failed attempts. Your account has been temporarily locked. Please try again in 15 minutes.');
        }

        setCode('');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      setAttemptCount(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    localStorage.removeItem('pending_2fa_user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-dna-cream flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-dna-pomegranate rounded-2xl mb-4">
            <Shield size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-dna-black mb-2">Two-Factor Verification</h1>
          <p className="text-dna-tundora">
            Enter the {useRecoveryCode ? 'recovery code' : '6-digit code from your authenticator app'}
          </p>
          {userEmail && (
            <p className="text-sm text-dna-silver mt-2">Verifying for: {userEmail}</p>
          )}
        </div>

        {/* Verification Form */}
        <div className="bg-white rounded-2xl border border-dna-alto p-8 shadow-sm">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerify();
            }}
            className="space-y-5"
          >
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle size={16} />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Code Input */}
            <div>
              <label className="block text-sm font-medium text-dna-black mb-2">
                {useRecoveryCode ? 'Recovery Code' : 'Verification Code'}
              </label>
              <Input
                type="text"
                inputMode={useRecoveryCode ? 'text' : 'numeric'}
                pattern={useRecoveryCode ? '[A-Z0-9]{8}' : '[0-9]{6}'}
                maxLength={useRecoveryCode ? 8 : 6}
                value={code}
                onChange={(e) => {
                  const value = useRecoveryCode
                    ? e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
                    : e.target.value.replace(/[^0-9]/g, '');
                  setCode(value);
                  setError(null);
                }}
                placeholder={useRecoveryCode ? 'XXXXXXXX' : '000000'}
                className="text-center text-2xl font-mono tracking-widest"
                autoFocus
                disabled={isLoading || attemptCount >= MAX_ATTEMPTS}
              />
              <p className="text-xs text-dna-silver mt-2 text-center">
                {useRecoveryCode
                  ? 'Enter one of your 8-character recovery codes'
                  : 'The code refreshes every 30 seconds'}
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-dna-pomegranate hover:bg-dna-pomegranate/90 text-white"
              disabled={isLoading || (useRecoveryCode ? code.length !== 8 : code.length !== 6) || attemptCount >= MAX_ATTEMPTS}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify & Continue'
              )}
            </Button>

            {/* Toggle Recovery Code */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setUseRecoveryCode(!useRecoveryCode);
                  setCode('');
                  setError(null);
                }}
                className="text-sm text-dna-pomegranate hover:text-dna-pomegranate/80 font-medium inline-flex items-center gap-1"
                disabled={isLoading}
              >
                <KeyRound size={14} />
                {useRecoveryCode ? 'Use authenticator code instead' : 'Use a recovery code'}
              </button>
            </div>

            {/* Cancel Button */}
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="w-full"
              disabled={isLoading}
            >
              Cancel & Return to Login
            </Button>
          </form>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-900">
              <strong>Lost access to your authenticator?</strong>
              <br />
              Use one of your recovery codes to regain access, then set up a new authenticator device from Settings.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-dna-silver">
          <p>© 2026 DNA Advisory. All rights reserved.</p>
        </div>
      </motion.div>
    </div>
  );
}
