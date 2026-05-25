import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import SMTPTab from '@/components/SMTPTab';

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

export default function SettingsSMTP() {
  const { userAccount } = useAuth();
  const isSuperAdmin = userAccount?.is_super_admin || false;

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
        <h1 className="text-3xl font-semibold tracking-tight text-dna-black">SMTP</h1>
        <p className="mt-1 text-sm text-dna-tundora">
          Configure outgoing email settings used by invitations and notifications.
        </p>
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease, delay: 0.2 }}
      >
        {isSuperAdmin ? (
          <SMTPTab />
        ) : (
          <div className="py-12 text-center">
            <p className="text-dna-tundora">SMTP configuration is only available to Super Administrators.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
