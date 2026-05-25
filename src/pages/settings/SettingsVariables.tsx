import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import VariablesTab from '@/components/VariablesTab';

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

export default function SettingsVariables() {
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
        <h1 className="text-3xl font-semibold tracking-tight text-dna-black">Variables</h1>
        <p className="mt-1 text-sm text-dna-tundora">
          Manage predefined values used across the app to keep user and manual data consistent.
        </p>
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease, delay: 0.2 }}
      >
        <VariablesTab />
      </motion.div>
    </div>
  );
}
