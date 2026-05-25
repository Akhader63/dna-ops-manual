import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

export default function SettingsNotifications() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [systemAlerts, setSystemAlerts] = useState(true);
  const [manualUpdates, setManualUpdates] = useState(false);

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
        <h1 className="text-3xl font-semibold tracking-tight text-dna-black">Notifications</h1>
        <p className="mt-1 text-sm text-dna-tundora">
          Control when and how users receive system alerts.
        </p>
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease, delay: 0.2 }}
        className="max-w-2xl"
      >
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <p className="text-sm text-dna-tundora">Receive email notifications for important events</p>
              </div>
              <Switch
                id="email-notifications"
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="system-alerts">System Alerts</Label>
                <p className="text-sm text-dna-tundora">Show in-app notifications for system events</p>
              </div>
              <Switch
                id="system-alerts"
                checked={systemAlerts}
                onCheckedChange={setSystemAlerts}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="manual-updates">Manual Updates</Label>
                <p className="text-sm text-dna-tundora">Notify when client manuals are updated</p>
              </div>
              <Switch
                id="manual-updates"
                checked={manualUpdates}
                onCheckedChange={setManualUpdates}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
