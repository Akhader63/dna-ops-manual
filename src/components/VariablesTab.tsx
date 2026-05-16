import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PositionManagement from './PositionManagement';
import DepartmentManagement from './DepartmentManagement';

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

export default function VariablesTab() {
  const [activeTab, setActiveTab] = useState('positions');

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="flex items-center gap-3"
      >
        <div className="p-2 bg-dna-pomegranate/10 rounded-lg">
          <Settings2 className="w-6 h-6 text-dna-pomegranate" />
        </div>
        <div>
          <h1 className="text-3xl font-semibold text-dna-black">Variables Management</h1>
          <p className="text-dna-tundora">Manage predefined variables for users and system settings</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="border-b border-dna-alto bg-transparent p-0 h-auto rounded-none">
            <TabsTrigger
              value="positions"
              className="data-[state=active]:border-b-2 data-[state=active]:border-dna-pomegranate rounded-none px-6 py-3 data-[state=active]:bg-transparent"
            >
              Positions
            </TabsTrigger>
            <TabsTrigger
              value="departments"
              className="data-[state=active]:border-b-2 data-[state=active]:border-dna-pomegranate rounded-none px-6 py-3 data-[state=active]:bg-transparent"
            >
              Departments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="positions" className="mt-0">
            <PositionManagement />
          </TabsContent>

          <TabsContent value="departments" className="mt-0">
            <DepartmentManagement />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
