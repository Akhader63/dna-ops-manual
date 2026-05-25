import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

export default function SettingsAuditLog() {
  // Sample audit log data
  const auditLogs = [
    { id: 1, action: 'User Created', user: 'Admin', timestamp: '2024-05-25 14:30:00', status: 'Success' },
    { id: 2, action: 'Manual Updated', user: 'John Doe', timestamp: '2024-05-25 13:15:00', status: 'Success' },
    { id: 3, action: 'Module Activated', user: 'Admin', timestamp: '2024-05-25 12:00:00', status: 'Success' },
  ];

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
        <h1 className="text-3xl font-semibold tracking-tight text-dna-black">Audit Log</h1>
        <p className="mt-1 text-sm text-dna-tundora">
          Review recorded system activity and user actions.
        </p>
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease, delay: 0.2 }}
      >
        <Card>
          <CardContent className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.action}</TableCell>
                    <TableCell>{log.user}</TableCell>
                    <TableCell>{log.timestamp}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{log.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
