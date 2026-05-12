import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Mail, Send, Check, RefreshCw, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import type { SMTPSettings } from '@/types/database';
import { testSMTPSettings } from '@/services/emailService';

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

export default function SMTPTab() {
  const [settings, setSettings] = useState<SMTPSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    smtp_from_email: '',
    smtp_from_name: 'DNA Ops Manual',
    smtp_use_tls: true,
    is_active: true,
  });

  // Load SMTP settings
  useEffect(() => {
    fetchSMTPSettings();
  }, []);

  const fetchSMTPSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('smtp_settings')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data);
        setFormData({
          smtp_host: data.smtp_host,
          smtp_port: data.smtp_port,
          smtp_username: data.smtp_username,
          smtp_password: data.smtp_password,
          smtp_from_email: data.smtp_from_email,
          smtp_from_name: data.smtp_from_name,
          smtp_use_tls: data.smtp_use_tls,
          is_active: data.is_active,
        });
      }
    } catch (err) {
      console.error('Error loading SMTP settings:', err);
      toast.error('Failed to load SMTP settings');
    } finally {
      setLoading(false);
    }
  };

  // Track changes
  useEffect(() => {
    if (!settings) {
      setHasChanges(true);
      return;
    }

    const changed =
      settings.smtp_host !== formData.smtp_host ||
      settings.smtp_port !== formData.smtp_port ||
      settings.smtp_username !== formData.smtp_username ||
      settings.smtp_password !== formData.smtp_password ||
      settings.smtp_from_email !== formData.smtp_from_email ||
      settings.smtp_from_name !== formData.smtp_from_name ||
      settings.smtp_use_tls !== formData.smtp_use_tls ||
      settings.is_active !== formData.is_active;

    setHasChanges(changed);

    if (changed) {
      setJustSaved(false);
    }
  }, [formData, settings]);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Validation
      if (!formData.smtp_host || !formData.smtp_username || !formData.smtp_password || !formData.smtp_from_email) {
        toast.error('Please fill in all required fields');
        setIsSaving(false);
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.smtp_from_email)) {
        toast.error('Please enter a valid from email address');
        setIsSaving(false);
        return;
      }

      if (settings) {
        // Update existing settings
        const { error } = await supabase
          .from('smtp_settings')
          .update({
            smtp_host: formData.smtp_host,
            smtp_port: formData.smtp_port,
            smtp_username: formData.smtp_username,
            smtp_password: formData.smtp_password,
            smtp_from_email: formData.smtp_from_email,
            smtp_from_name: formData.smtp_from_name,
            smtp_use_tls: formData.smtp_use_tls,
            is_active: formData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        // Insert new settings
        const { error } = await supabase
          .from('smtp_settings')
          .insert({
            smtp_host: formData.smtp_host,
            smtp_port: formData.smtp_port,
            smtp_username: formData.smtp_username,
            smtp_password: formData.smtp_password,
            smtp_from_email: formData.smtp_from_email,
            smtp_from_name: formData.smtp_from_name,
            smtp_use_tls: formData.smtp_use_tls,
            is_active: formData.is_active,
          });

        if (error) throw error;
      }

      setHasChanges(false);
      setJustSaved(true);

      toast.success('SMTP settings saved successfully', {
        description: 'Email configuration has been updated.',
      });

      // Reload settings
      await fetchSMTPSettings();

      // Reset justSaved after 2 seconds
      setTimeout(() => {
        setJustSaved(false);
      }, 2000);
    } catch (err) {
      console.error('Error saving SMTP settings:', err);
      toast.error('Failed to save SMTP settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);

    try {
      // Validation
      if (!formData.smtp_host || !formData.smtp_username || !formData.smtp_password || !formData.smtp_from_email) {
        toast.error('Please fill in all fields before testing');
        setIsTesting(false);
        return;
      }

      const testSettings: SMTPSettings = {
        id: settings?.id || '',
        smtp_host: formData.smtp_host,
        smtp_port: formData.smtp_port,
        smtp_username: formData.smtp_username,
        smtp_password: formData.smtp_password,
        smtp_from_email: formData.smtp_from_email,
        smtp_from_name: formData.smtp_from_name,
        smtp_use_tls: formData.smtp_use_tls,
        is_active: formData.is_active,
        created_at: settings?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const result = await testSMTPSettings(testSettings);

      if (result.success) {
        toast.success('SMTP configuration is working!', {
          description: 'Test email was sent successfully (check console for details).',
        });
      } else {
        toast.error('SMTP test failed', {
          description: result.error || 'Please check your configuration.',
        });
      }
    } catch (err) {
      console.error('Error testing SMTP:', err);
      toast.error('Failed to test SMTP configuration');
    } finally {
      setIsTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-dna-pomegranate" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease }}
      className="space-y-6 max-w-2xl"
    >
      {/* Info Alert */}
      <Alert className="bg-blue-50 border-blue-200">
        <Mail className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 text-sm">
          Configure SMTP settings to enable email notifications for user verification, password resets, and system updates.
        </AlertDescription>
      </Alert>

      {/* SMTP Host */}
      <div>
        <label className="block text-sm font-medium text-dna-black mb-1.5">
          SMTP Host <span className="text-red-500">*</span>
        </label>
        <Input
          type="text"
          value={formData.smtp_host}
          onChange={(e) => setFormData({ ...formData, smtp_host: e.target.value })}
          placeholder="smtp.gmail.com"
          required
        />
        <p className="text-xs text-dna-tundora mt-1">SMTP server hostname (e.g., smtp.gmail.com, smtp.office365.com)</p>
      </div>

      {/* SMTP Port */}
      <div>
        <label className="block text-sm font-medium text-dna-black mb-1.5">
          SMTP Port <span className="text-red-500">*</span>
        </label>
        <Input
          type="number"
          value={formData.smtp_port}
          onChange={(e) => setFormData({ ...formData, smtp_port: parseInt(e.target.value) || 587 })}
          placeholder="587"
          required
        />
        <p className="text-xs text-dna-tundora mt-1">Common ports: 587 (TLS), 465 (SSL), 25 (non-secure)</p>
      </div>

      {/* SMTP Username */}
      <div>
        <label className="block text-sm font-medium text-dna-black mb-1.5">
          SMTP Username <span className="text-red-500">*</span>
        </label>
        <Input
          type="text"
          value={formData.smtp_username}
          onChange={(e) => setFormData({ ...formData, smtp_username: e.target.value })}
          placeholder="your-email@domain.com"
          required
        />
        <p className="text-xs text-dna-tundora mt-1">Usually your email address</p>
      </div>

      {/* SMTP Password */}
      <div>
        <label className="block text-sm font-medium text-dna-black mb-1.5">
          SMTP Password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            value={formData.smtp_password}
            onChange={(e) => setFormData({ ...formData, smtp_password: e.target.value })}
            placeholder="••••••••"
            className="pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-dna-silver hover:text-dna-tundora"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <p className="text-xs text-dna-tundora mt-1">Your email password or app-specific password</p>
      </div>

      {/* From Email */}
      <div>
        <label className="block text-sm font-medium text-dna-black mb-1.5">
          From Email <span className="text-red-500">*</span>
        </label>
        <Input
          type="email"
          value={formData.smtp_from_email}
          onChange={(e) => setFormData({ ...formData, smtp_from_email: e.target.value })}
          placeholder="noreply@yourdomain.com"
          required
        />
        <p className="text-xs text-dna-tundora mt-1">Email address that appears as sender</p>
      </div>

      {/* From Name */}
      <div>
        <label className="block text-sm font-medium text-dna-black mb-1.5">
          From Name <span className="text-red-500">*</span>
        </label>
        <Input
          type="text"
          value={formData.smtp_from_name}
          onChange={(e) => setFormData({ ...formData, smtp_from_name: e.target.value })}
          placeholder="DNA Ops Manual"
          required
        />
        <p className="text-xs text-dna-tundora mt-1">Display name that appears as sender</p>
      </div>

      {/* Use TLS */}
      <div className="flex items-center justify-between p-4 bg-dna-cream/30 rounded-lg">
        <div>
          <label className="text-sm font-medium text-dna-black">Use TLS/SSL</label>
          <p className="text-xs text-dna-tundora mt-0.5">Enable secure connection (recommended)</p>
        </div>
        <Switch
          checked={formData.smtp_use_tls}
          onCheckedChange={(checked) => setFormData({ ...formData, smtp_use_tls: checked })}
        />
      </div>

      {/* Is Active */}
      <div className="flex items-center justify-between p-4 bg-dna-cream/30 rounded-lg">
        <div>
          <label className="text-sm font-medium text-dna-black">Active Configuration</label>
          <p className="text-xs text-dna-tundora mt-0.5">Enable email notifications</p>
        </div>
        <Switch
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <Button
          className="bg-dna-black text-white hover:bg-dna-tundora transition-colors disabled:opacity-50"
          onClick={handleSave}
          disabled={isSaving || !hasChanges || justSaved}
        >
          {isSaving ? (
            <>
              <RefreshCw size={16} className="mr-2 animate-spin" />
              Saving...
            </>
          ) : justSaved ? (
            <>
              <Check size={16} className="mr-2" />
              Saved!
            </>
          ) : (
            'Save Configuration'
          )}
        </Button>

        <Button
          variant="outline"
          className="gap-2"
          onClick={handleTest}
          disabled={isTesting || !formData.smtp_host}
        >
          {isTesting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <Send size={16} />
              Test Email
            </>
          )}
        </Button>
      </div>

      {/* Help Text */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Note:</strong> Save your changes before testing. The test email will be sent to your "From Email" address.
        </AlertDescription>
      </Alert>
    </motion.div>
  );
}
