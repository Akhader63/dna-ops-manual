import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import {
  Briefcase,
  Search,
  Plus,
  Edit2,
  Trash2,
  Users,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

interface Position {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_count?: number;
}

export default function PositionManagement() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [filteredPositions, setFilteredPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPositions();
  }, []);

  useEffect(() => {
    filterPositions();
  }, [searchQuery, positions]);

  const fetchPositions = async () => {
    setLoading(true);
    try {
      const { data: positionsData, error: positionsError } = await supabase
        .from('positions')
        .select('*')
        .order('name', { ascending: true });

      if (positionsError) throw positionsError;

      const { data: userCounts, error: countsError } = await supabase
        .from('user_accounts')
        .select('position_id');

      if (countsError) throw countsError;

      const countMap = userCounts.reduce((acc, user) => {
        if (user.position_id) {
          acc[user.position_id] = (acc[user.position_id] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const positionsWithCounts = (positionsData || []).map((pos) => ({
        ...pos,
        user_count: countMap[pos.id] || 0,
      }));

      setPositions(positionsWithCounts);
      setFilteredPositions(positionsWithCounts);
    } catch (error) {
      console.error('Error fetching positions:', error);
      toast.error('Failed to load positions');
    } finally {
      setLoading(false);
    }
  };

  const filterPositions = () => {
    if (!searchQuery.trim()) {
      setFilteredPositions(positions);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = positions.filter(
      (pos) =>
        pos.name.toLowerCase().includes(query) ||
        (pos.description && pos.description.toLowerCase().includes(query))
    );
    setFilteredPositions(filtered);
  };

  const handleAdd = () => {
    setFormData({ name: '', description: '', is_active: true });
    setShowAddDialog(true);
  };

  const handleEdit = (position: Position) => {
    setSelectedPosition(position);
    setFormData({
      name: position.name,
      description: position.description || '',
      is_active: position.is_active,
    });
    setShowEditDialog(true);
  };

  const handleDelete = (position: Position) => {
    setSelectedPosition(position);
    setShowDeleteDialog(true);
  };

  const handleSubmitAdd = async () => {
    if (!formData.name.trim()) {
      toast.error('Position name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('positions').insert({
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        is_active: formData.is_active,
      });

      if (error) throw error;

      toast.success('Position created successfully');
      setShowAddDialog(false);
      fetchPositions();
    } catch (error: any) {
      console.error('Error creating position:', error);
      toast.error(error.message || 'Failed to create position');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!formData.name.trim() || !selectedPosition) {
      toast.error('Position name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('positions')
        .update({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          is_active: formData.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedPosition.id);

      if (error) throw error;

      toast.success('Position updated successfully');
      setShowEditDialog(false);
      fetchPositions();
    } catch (error: any) {
      console.error('Error updating position:', error);
      toast.error(error.message || 'Failed to update position');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitDelete = async () => {
    if (!selectedPosition) return;

    if (selectedPosition.user_count && selectedPosition.user_count > 0) {
      toast.error(
        `Cannot delete position "${selectedPosition.name}" - it is assigned to ${selectedPosition.user_count} user(s)`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('positions').delete().eq('id', selectedPosition.id);

      if (error) throw error;

      toast.success('Position deleted successfully');
      setShowDeleteDialog(false);
      fetchPositions();
    } catch (error: any) {
      console.error('Error deleting position:', error);
      toast.error(error.message || 'Failed to delete position');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleActive = async (position: Position) => {
    try {
      const { error } = await supabase
        .from('positions')
        .update({
          is_active: !position.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', position.id);

      if (error) throw error;

      toast.success(`Position ${!position.is_active ? 'activated' : 'deactivated'}`);
      fetchPositions();
    } catch (error: any) {
      console.error('Error toggling position:', error);
      toast.error(error.message || 'Failed to update position');
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-dna-pomegranate/10 rounded-lg">
            <Briefcase className="w-6 h-6 text-dna-pomegranate" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-dna-black">Positions</h2>
            <p className="text-sm text-dna-tundora">Manage job positions and titles</p>
          </div>
        </div>
        <Button onClick={handleAdd} className="bg-dna-pomegranate hover:bg-dna-pomegranate/90">
          <Plus className="w-4 h-4 mr-2" />
          Add Position
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease }}
        className="relative"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dna-tundora" />
        <Input
          type="text"
          placeholder="Search positions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease }}
        className="bg-white rounded-lg border border-dna-alto shadow-sm overflow-hidden"
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-dna-pomegranate animate-spin" />
          </div>
        ) : filteredPositions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Briefcase className="w-12 h-12 text-dna-alto mb-4" />
            <p className="text-lg font-medium text-dna-black mb-1">
              {searchQuery ? 'No positions found' : 'No positions yet'}
            </p>
            <p className="text-sm text-dna-tundora">
              {searchQuery
                ? 'Try adjusting your search query'
                : 'Get started by creating your first position'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPositions.map((position) => (
                <TableRow key={position.id}>
                  <TableCell className="font-medium">{position.name}</TableCell>
                  <TableCell className="text-dna-tundora">
                    {position.description || <span className="text-dna-alto italic">No description</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={position.is_active}
                        onCheckedChange={() => toggleActive(position)}
                      />
                      <Badge variant={position.is_active ? 'default' : 'secondary'}>
                        {position.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-dna-tundora">
                      <Users className="w-4 h-4" />
                      <span>{position.user_count || 0} users</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(position)}
                        className="text-dna-tundora hover:text-dna-black"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(position)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </motion.div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Position</DialogTitle>
            <DialogDescription>Create a new position for your organization</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-dna-black mb-1.5">
                Position Name <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Senior Developer"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dna-black mb-1.5">Description</label>
              <Input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the position"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-dna-black">Active</label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitAdd}
              disabled={isSubmitting}
              className="bg-dna-pomegranate hover:bg-dna-pomegranate/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Position'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Position</DialogTitle>
            <DialogDescription>Update position details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-dna-black mb-1.5">
                Position Name <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Senior Developer"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dna-black mb-1.5">Description</label>
              <Input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the position"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-dna-black">Active</label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitEdit}
              disabled={isSubmitting}
              className="bg-dna-pomegranate hover:bg-dna-pomegranate/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Position</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this position? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedPosition && (
            <div className="py-4">
              <div className="p-4 bg-dna-concrete rounded-lg space-y-2">
                <p className="font-medium text-dna-black">{selectedPosition.name}</p>
                {selectedPosition.description && (
                  <p className="text-sm text-dna-tundora">{selectedPosition.description}</p>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-dna-tundora" />
                  <span className="text-dna-tundora">
                    {selectedPosition.user_count || 0} user(s) assigned
                  </span>
                </div>
              </div>
              {selectedPosition.user_count && selectedPosition.user_count > 0 ? (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium">Cannot delete this position</p>
                    <p>
                      This position is assigned to {selectedPosition.user_count} user(s). Please reassign or
                      remove these users before deleting.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <p className="text-sm text-yellow-800">
                    This position is not assigned to any users and can be safely deleted.
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitDelete}
              disabled={isSubmitting || (selectedPosition?.user_count || 0) > 0}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Position'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
