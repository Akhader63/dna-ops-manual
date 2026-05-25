import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sliders,
  Users,
  Settings2,
  Layers,
  Library,
  ShieldCheck,
  Bell,
  ClipboardList,
  Mail,
  ChevronRight,
  Search,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

interface SettingCard {
  id: string;
  title: string;
  description: string;
  icon: any;
  path: string;
  category: string;
  badge?: string;
}

export default function SettingsIndex() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const settingCards: SettingCard[] = [
    // Organization
    {
      id: 'general',
      title: 'General',
      description: 'Manage company details, branding, and basic workspace information.',
      icon: Sliders,
      path: '/settings/general',
      category: 'organization',
    },
    {
      id: 'users',
      title: 'Users',
      description: 'Create, manage, deactivate, and secure user accounts.',
      icon: Users,
      path: '/settings/users',
      category: 'organization',
    },
    // Configuration
    {
      id: 'variables',
      title: 'Variables',
      description: 'Define reusable dropdown values such as positions and departments.',
      icon: Settings2,
      path: '/settings/variables',
      category: 'configuration',
    },
    {
      id: 'modules',
      title: 'Modules',
      description: 'Activate or deactivate available app modules.',
      icon: Layers,
      path: '/settings/modules',
      category: 'configuration',
    },
    {
      id: 'module-library',
      title: 'Module Library',
      description: 'Configure ERP module references, transactions, and manual-building structure.',
      icon: Library,
      path: '/settings/module-library',
      category: 'configuration',
    },
    {
      id: 'approval-gateways',
      title: 'Approval Gateways',
      description: 'Define approval paths, workflow gates, and validation checkpoints.',
      icon: ShieldCheck,
      path: '/settings/approval-gateways',
      category: 'configuration',
    },
    // Administration
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Control when and how users receive system alerts.',
      icon: Bell,
      path: '/settings/notifications',
      category: 'administration',
    },
    {
      id: 'audit-log',
      title: 'Audit Log',
      description: 'Review recorded system activity and user actions.',
      icon: ClipboardList,
      path: '/settings/audit-log',
      category: 'administration',
    },
    {
      id: 'smtp',
      title: 'SMTP',
      description: 'Configure outgoing email settings used by invitations and notifications.',
      icon: Mail,
      path: '/settings/smtp',
      category: 'administration',
      badge: 'Super Admin',
    },
  ];

  // Filter cards based on search and category
  const filteredCards = settingCards.filter((card) => {
    const matchesSearch =
      card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || card.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group cards by category
  const categories = [
    {
      id: 'organization',
      title: 'Organization',
      description: 'Manage your company profile, user access, and organization-level setup.',
    },
    {
      id: 'configuration',
      title: 'Configuration',
      description: 'Configure the values, modules, libraries, and workflow rules used across operation manuals.',
    },
    {
      id: 'administration',
      title: 'Administration',
      description: 'Control notifications, audit visibility, and system email communication settings.',
    },
  ];

  const categoryFilters = [
    { id: 'all', label: 'All Categories' },
    { id: 'organization', label: 'Organization' },
    { id: 'configuration', label: 'Configuration' },
    { id: 'administration', label: 'Administration' },
  ];

  return (
    <div className="py-2">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="mb-6"
      >
        <h1 className="text-3xl font-semibold tracking-tight text-dna-black">Settings</h1>
        <p className="mt-1 text-sm text-dna-tundora">
          Configure your workspace, manage users, and control how the DNA Client Operations Manual App works for your team.
        </p>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease, delay: 0.1 }}
        className="mb-6"
      >
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dna-tundora" />
          <Input
            type="text"
            placeholder="Search settings, users, modules, approvals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </motion.div>

      {/* Category Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease, delay: 0.15 }}
        className="mb-8 flex gap-2"
      >
        {categoryFilters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setSelectedCategory(filter.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedCategory === filter.id
                ? 'bg-dna-pomegranate text-white'
                : 'bg-white text-dna-tundora border border-dna-alto hover:border-dna-tundora'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </motion.div>

      {/* Categories and Cards */}
      <div className="space-y-8">
        {categories.map((category, categoryIndex) => {
          const categoryCards = filteredCards.filter((card) => card.category === category.id);

          if (categoryCards.length === 0) return null;

          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease, delay: 0.2 + categoryIndex * 0.1 }}
            >
              {/* Category Header */}
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-dna-black">{category.title}</h2>
                <p className="text-sm text-dna-tundora mt-1">{category.description}</p>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <Card
                      key={card.id}
                      onClick={() => navigate(card.path)}
                      className="cursor-pointer hover:shadow-md hover:border-dna-tundora transition-all group"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 rounded-lg bg-dna-pomegranate/10 flex items-center justify-center">
                                <Icon className="w-5 h-5 text-dna-pomegranate" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-dna-black">{card.title}</h3>
                                {card.badge && (
                                  <Badge variant="secondary" className="text-xs mt-1">
                                    {card.badge}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-dna-tundora leading-relaxed">{card.description}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-dna-tundora group-hover:text-dna-pomegranate transition-colors flex-shrink-0 ml-2" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* No Results */}
      {filteredCards.length === 0 && (
        <div className="text-center py-12">
          <p className="text-dna-tundora">No settings found matching your search.</p>
        </div>
      )}
    </div>
  );
}
