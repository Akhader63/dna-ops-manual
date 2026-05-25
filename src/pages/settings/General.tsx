import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

export default function SettingsGeneral() {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState('DNA Advisory');
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('dna_general_settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setCompanyName(settings.companyName || 'DNA Advisory');
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    }
  }, []);

  // Track changes
  useEffect(() => {
    const savedSettings = localStorage.getItem('dna_general_settings');

    if (!savedSettings) {
      setHasChanges(true);
      return;
    }

    try {
      const saved = JSON.parse(savedSettings);
      const changed = saved.companyName !== companyName;
      setHasChanges(changed);

      // Reset justSaved flag when user makes changes after saving
      if (changed) {
        setJustSaved(false);
      }
    } catch {
      setHasChanges(true);
    }
  }, [companyName]);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Simulate brief save delay for UX
      await new Promise(resolve => setTimeout(resolve, 500));

      const settings = { companyName };
      localStorage.setItem('dna_general_settings', JSON.stringify(settings));

      setHasChanges(false);
      setJustSaved(true);

      toast.success('Settings saved successfully', {
        description: 'Your preferences have been updated.',
      });

      // Reset justSaved after 2 seconds
      setTimeout(() => {
        setJustSaved(false);
      }, 2000);
    } catch {
      toast.error('Failed to save settings', {
        description: 'Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button + Title */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="flex items-center gap-4"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/settings')}
          className="shrink-0"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-semibold tracking-tight text-dna-black dark:text-white">General</h1>
          <p className="text-sm text-dna-tundora dark:text-dna-text-secondary mt-1">
            Manage company details, branding, and basic workspace information.
          </p>
        </div>
      </motion.div>

      {/* Settings Form */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease }}
        className="max-w-lg space-y-6"
      >
        <div>
          <label className="block text-sm font-medium text-dna-black dark:text-white mb-1.5">
            Company Name
          </label>
          <Input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Enter company name"
          />
          <p className="text-xs text-dna-tundora dark:text-dna-text-secondary mt-1">
            This will be displayed across the application.
          </p>
        </div>

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
              <>Save Changes</>
            )}
          </Button>
          {hasChanges && !justSaved && (
            <span className="text-xs text-dna-silver">You have unsaved changes</span>
          )}
          {justSaved && (
            <span className="text-xs text-green-600">Settings saved successfully</span>
          )}
        </div>
      </motion.div>
    </div>
  );
}
