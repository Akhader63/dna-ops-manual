import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Mail, ArrowLeft, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Validation
    if (!email) {
      setError('Please enter your email address');
      setIsLoading(false);
      return;
    }

    // Send password reset email
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (resetError) {
      // Don't reveal whether email exists for security
      console.error('Password reset error:', resetError);
    }

    // Always show success message to prevent account enumeration
    setSuccess(true);
    setIsLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-dna-cream flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-2xl mb-4">
              <CheckCircle2 size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-dna-black mb-2">Check Your Email</h1>
            <p className="text-dna-tundora">
              If an account exists for {email}, password reset instructions have been sent.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-dna-alto p-8 shadow-sm text-center">
            <p className="text-sm text-dna-tundora mb-6">
              Please check your email inbox and spam folder for the password reset link.
              The link will expire in 15 minutes.
            </p>
            <Link to="/login">
              <Button className="w-full bg-dna-pomegranate hover:bg-dna-pomegranate/90 text-white">
                <ArrowLeft size={16} className="mr-2" />
                Back to Login
              </Button>
            </Link>
          </div>

          <div className="mt-8 text-center text-xs text-dna-silver">
            <p>© 2026 DNA Advisory. All rights reserved.</p>
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
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-dna-pomegranate rounded-2xl mb-4">
            <Building2 size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-dna-black mb-2">Reset Password</h1>
          <p className="text-dna-tundora">Enter your email to receive reset instructions</p>
        </div>

        <div className="bg-white rounded-2xl border border-dna-alto p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertCircle size={16} />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

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
                  autoFocus
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-dna-pomegranate hover:bg-dna-pomegranate/90 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </Button>

            <div className="text-center">
              <Link
                to="/login"
                className="text-sm text-dna-tundora hover:text-dna-black transition-colors inline-flex items-center gap-1"
              >
                <ArrowLeft size={14} />
                Back to Login
              </Link>
            </div>
          </form>
        </div>

        <div className="mt-8 text-center text-xs text-dna-silver">
          <p>© 2026 DNA Advisory. All rights reserved.</p>
        </div>
      </motion.div>
    </div>
  );
}
