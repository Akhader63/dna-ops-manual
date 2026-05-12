import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Shield, Copy, Check, Smartphone, Key, AlertCircle, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { TwoFactorService } from '@/services/twoFactorService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function TwoFactorSetup() {
  const navigate = useNavigate();
  const { user, userAccount, refreshUser } = useAuth();

  const [step, setStep] = useState<'qr' | 'verify' | 'recovery'>('qr');
  const [secret, setSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [recoveryCodesSaved, setRecoveryCodesSaved] = useState(false);

  // Generate QR code on mount
  useEffect(() => {
    if (!userAccount) {
      // Wait for userAccount to load, don't redirect immediately
      return;
    }

    const { secret: newSecret, qrCodeUrl: qrUrl } = TwoFactorService.generateSecret(
      userAccount.email,
      userAccount.full_name || userAccount.email
    );

    setSecret(newSecret);
    qrUrl.then(setQrCodeUrl);
  }, [userAccount]);

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    toast.success('Secret key copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    if (!user?.id) {
      setError('User not found');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const result = await TwoFactorService.setupTwoFactor(
        userAccount.id,
        secret,
        verificationCode
      );

      if (result.success && result.recoveryCodes) {
        setRecoveryCodes(result.recoveryCodes);
        setStep('recovery');
        toast.success('Two-Factor Authentication enabled successfully!');
      } else {
        setError(result.error || 'Failed to verify code');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadRecoveryCodes = () => {
    const text = `DNA Ops Manual - Recovery Codes\n\nThese codes can be used to access your account if you lose access to your authenticator app.\n\n${recoveryCodes.join('\n')}\n\nEach code can only be used once. Store these codes in a secure location.`;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dna-ops-recovery-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setRecoveryCodesSaved(true);
    toast.success('Recovery codes downloaded');
  };

  const handleComplete = async () => {
    if (!recoveryCodesSaved) {
      toast.error('Please download your recovery codes before continuing');
      return;
    }

    // Refresh user data and navigate
    await refreshUser();
    navigate('/');
    toast.success('Setup complete! You can now access the application.');
  };

    // Show loading while waiting for user data
  if (!userAccount) {
    return (
      <div className="min-h-screen bg-dna-cream flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-dna-pomegranate" />
      </div>
    );
  }

  const isMandatory = userAccount?.two_factor_required || userAccount?.user_type === 'consultant_user';

  return (
    <div className="min-h-screen bg-dna-cream flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-dna-pomegranate rounded-2xl mb-4">
            <Shield size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-dna-black mb-2">
            {isMandatory ? 'Required: ' : ''}Two-Factor Authentication Setup
          </h1>
          <p className="text-dna-tundora">
            {isMandatory
              ? 'Two-Factor Authentication is required for Consultant and Implementer accounts because these accounts have elevated access across client projects and operational manuals.'
              : 'Add an extra layer of security to your account with Two-Factor Authentication.'}
          </p>
        </div>

        {/* Setup Steps */}
        <Card className="bg-white border-dna-alto shadow-sm">
          <CardContent className="p-8">
            {step === 'qr' && (
              <div className="space-y-6">
                {/* Step 1: Scan QR Code */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-dna-pomegranate text-white flex items-center justify-center font-semibold text-sm">
                      1
                    </div>
                    <h3 className="text-lg font-semibold text-dna-black">
                      Scan QR Code with Microsoft Authenticator
                    </h3>
                  </div>

                  <p className="text-sm text-dna-tundora mb-4">
                    Open Microsoft Authenticator (or any compatible authenticator app) and scan this QR code:
                  </p>

                  {qrCodeUrl ? (
                    <div className="flex justify-center mb-6">
                      <div className="p-4 bg-white border-2 border-dna-alto rounded-lg">
                        <img src={qrCodeUrl} alt="2FA QR Code" className="w-64 h-64" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-center mb-6">
                      <Loader2 className="w-12 h-12 animate-spin text-dna-pomegranate" />
                    </div>
                  )}

                  {/* Manual Entry */}
                  <div className="mt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Key size={18} className="text-dna-silver" />
                      <h4 className="text-sm font-medium text-dna-black">
                        Or enter this key manually:
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-4 py-3 bg-dna-cream border border-dna-alto rounded-lg font-mono text-sm text-dna-black break-all">
                        {secret}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopySecret}
                        className="shrink-0"
                      >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                      </Button>
                    </div>

                    <p className="text-xs text-dna-silver mt-2">
                      Use this key if you cannot scan the QR code. Your authenticator app will generate a new 6-digit code every 30 seconds.
                    </p>
                  </div>
                </div>

                {/* Next Button */}
                <Button
                  onClick={() => setStep('verify')}
                  className="w-full bg-dna-pomegranate hover:bg-dna-pomegranate/90 text-white"
                  disabled={!qrCodeUrl}
                >
                  Continue to Verification
                </Button>
              </div>
            )}

            {step === 'verify' && (
              <div className="space-y-6">
                {/* Step 2: Verify Code */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-dna-pomegranate text-white flex items-center justify-center font-semibold text-sm">
                      2
                    </div>
                    <h3 className="text-lg font-semibold text-dna-black">
                      Verify Your Authenticator
                    </h3>
                  </div>

                  <p className="text-sm text-dna-tundora mb-4">
                    Enter the 6-digit code from your authenticator app to verify the setup:
                  </p>

                  {error && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle size={16} />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="mb-4">
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setVerificationCode(value);
                        setError(null);
                      }}
                      placeholder="000000"
                      className="text-center text-2xl font-mono tracking-widest"
                      autoFocus
                    />
                  </div>

                  <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <Smartphone size={18} className="text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-900">
                      Open your authenticator app and enter the 6-digit code shown for "DNA Ops Manual".
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep('qr')}
                    className="flex-1"
                    disabled={isLoading}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleVerifyCode}
                    className="flex-1 bg-dna-pomegranate hover:bg-dna-pomegranate/90 text-white"
                    disabled={isLoading || verificationCode.length !== 6}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify & Enable 2FA'
                    )}
                  </Button>
                </div>
              </div>
            )}

            {step === 'recovery' && (
              <div className="space-y-6">
                {/* Step 3: Save Recovery Codes */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-semibold text-sm">
                      <Check size={20} />
                    </div>
                    <h3 className="text-lg font-semibold text-dna-black">
                      Save Your Recovery Codes
                    </h3>
                  </div>

                  <Alert className="mb-4 bg-yellow-50 border-yellow-200">
                    <AlertCircle size={16} className="text-yellow-600" />
                    <AlertDescription className="text-yellow-900">
                      <strong>Important:</strong> Save these recovery codes in a secure location. Each code can only be used once. You'll need them to access your account if you lose your authenticator device.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-2 gap-2 mb-4 p-4 bg-gray-50 border border-dna-alto rounded-lg">
                    {recoveryCodes.map((code, index) => (
                      <code key={index} className="px-3 py-2 bg-white border border-gray-200 rounded font-mono text-sm text-center">
                        {code}
                      </code>
                    ))}
                  </div>

                  <Button
                    onClick={handleDownloadRecoveryCodes}
                    variant="outline"
                    className="w-full mb-4"
                  >
                    <Download size={16} className="mr-2" />
                    {recoveryCodesSaved ? 'Downloaded ✓' : 'Download Recovery Codes'}
                  </Button>
                </div>

                {/* Complete Button */}
                <Button
                  onClick={handleComplete}
                  className="w-full bg-dna-pomegranate hover:bg-dna-pomegranate/90 text-white"
                  disabled={!recoveryCodesSaved}
                >
                  Complete Setup & Continue
                </Button>

                {!recoveryCodesSaved && (
                  <p className="text-xs text-center text-dna-silver">
                    Please download your recovery codes before continuing
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        {isMandatory && (
          <div className="mt-6 text-center text-xs text-dna-silver">
            <p>This step is required to access the DNA Ops Manual application.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
