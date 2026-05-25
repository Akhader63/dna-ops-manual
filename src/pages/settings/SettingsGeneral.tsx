import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

export default function SettingsGeneral() {
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
      const settings = JSON.parse(savedSettings);
      setHasChanges(settings.companyName !== companyName);
    } catch {
      setHasChanges(true);
    }
  }, [companyName]);

  const handleSave = () => {
    setIsSaving(true);
    const settings = { companyName };
    localStorage.setItem('dna_general_settings', JSON.stringify(settings));

    setTimeout(() => {
      setIsSaving(false);
      setJustSaved(true);
      setHasChanges(false);
      toast.success('General settings saved successfully');

      setTimeout(() => setJustSaved(false), 2000);
    }, 800);
  };

  return (
    <div className="py-2">
      {/* Back Button */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, ease }}
        className="mb-4"
      >
        <Link
          to="/settings"
          className="inline-flex items-center gap-2 text-sm text-dna-tundora hover:text-dna-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Settings
        </Link>
      </motion.div>

      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease, delay: 0.1 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-semibold tracking-tight text-dna-black">General</h1>
        <p className="mt-1 text-sm text-dna-tundora">
          Manage company details, branding, and basic workspace information.
        </p>
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease, delay: 0.2 }}
        className="max-w-2xl"
      >
        <div className="bg-white rounded-lg border border-dna-alto p-6">
          <h2 className="text-lg font-semibold text-dna-black mb-4">Company Information</h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter company name"
                className="mt-1"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className={justSaved ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {isSaving ? 'Saving...' : justSaved ? 'Saved!' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
