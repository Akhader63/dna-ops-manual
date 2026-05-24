import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  FileText,
  Users,
  Pencil,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { getClientById, deleteClient, updateClient } from '@/services/dataService';
import type { Client } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PhoneInput } from '@/components/ui/phone-input';

// ─── Status Color Map ───
const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700 border-green-200',
  inactive: 'bg-gray-100 text-gray-700 border-gray-200',
  on_hold: 'bg-amber-100 text-amber-700 border-amber-200',
};

function getStatusClass(status: string): string {
  return statusColors[status] ?? statusColors.inactive;
}

// ─── Industry Color Map ───
const industryColors: Record<string, string> = {
  Construction: 'bg-orange-100 text-orange-700 border-orange-200',
  Manufacturing: 'bg-blue-100 text-blue-700 border-blue-200',
  Retail: 'bg-pink-100 text-pink-700 border-pink-200',
  Healthcare: 'bg-red-100 text-red-700 border-red-200',
  Logistics: 'bg-purple-100 text-purple-700 border-purple-200',
  default: 'bg-gray-100 text-gray-700 border-gray-200',
};

function getIndustryClass(industry: string | null): string {
  return industryColors[industry ?? ''] ?? industryColors.default;
}

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});
  const [editSubmitting, setEditSubmitting] = useState(false);

  useEffect(() => {
    loadClient();
  }, [id]);

  // Set document title for breadcrumb
  useEffect(() => {
    if (client) {
      document.title = `${client.name} - DNA Ops Manual`;
    }
    return () => {
      document.title = 'DNA Ops Manual';
    };
  }, [client]);

  const loadClient = async () => {
    if (!id) {
      setError('No client ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getClientById(id);
      setClient(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load client';
      setError(msg);
      toast.error('Error', { description: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/clients');
  };

  const handleEdit = () => {
    if (!client) return;
    setEditFormData({
      name: client.name,
      industry: client.industry || '',
      description: client.description || '',
      contact_name: client.contact_name || '',
      contact_email: client.contact_email || '',
      contact_phone: client.contact_phone || '',
      city: client.city || '',
      country: client.country || '',
    });
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditFormData({});
    setIsEditMode(false);
  };

  const handleSaveEdit = async () => {
    if (!client || !editFormData.name?.trim()) {
      toast.error('Client name is required');
      return;
    }

    setEditSubmitting(true);
    try {
      const updates: any = {
        name: editFormData.name.trim(),
        industry: editFormData.industry || null,
        description: editFormData.description || null,
        contact_name: editFormData.contact_name?.trim() || null,
        contact_email: editFormData.contact_email?.trim() || null,
        contact_phone: editFormData.contact_phone?.trim() || null,
        city: editFormData.city?.trim() || null,
        country: editFormData.country?.trim() || null,
      };

      await updateClient(client.id, updates);

      // Update local state
      setClient({ ...client, ...updates });

      toast.success('Client updated successfully');
      setIsEditMode(false);
      setEditFormData({});
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update client';
      toast.error('Failed to update client', { description: msg });
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!client) return;

    setDeleteSubmitting(true);
    try {
      await deleteClient(client.id);
      toast.success('Client deleted successfully');
      navigate('/clients');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete client';
      toast.error('Failed to delete client', { description: msg });
    } finally {
      setDeleteSubmitting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleStatusChange = async (newStatus: 'active' | 'inactive' | 'on_hold') => {
    if (!client || client.status === newStatus) return;

    setStatusUpdating(true);
    try {
      await updateClient(client.id, { status: newStatus });
      setClient({ ...client, status: newStatus });
      toast.success(`Client status updated to ${newStatus.replace('_', ' ')}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update status';
      toast.error('Failed to update status', { description: msg });
    } finally {
      setStatusUpdating(false);
    }
  };

  // ─── Loading State ───
  if (loading) {
    return (
      <div className="flex flex-col h-full bg-background">
        {/* Header Skeleton */}
        <div className="border-b border-border bg-card">
          <div className="max-w-[1600px] mx-auto px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded" />
                <div className="space-y-2">
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-[1600px] mx-auto px-8 py-8 space-y-6">
            <Skeleton className="h-12 w-full" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-64 lg:col-span-2" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Error State ───
  if (error || !client) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-background p-8">
        <div className="text-center max-w-md space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="size-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-semibold">Client Not Found</h2>
          <p className="text-muted-foreground">{error || "The client you're looking for doesn't exist."}</p>
          <Button onClick={handleBack}>
            <ArrowLeft className="size-4 mr-2" />
            Back to Clients
          </Button>
        </div>
      </div>
    );
  }

  // ─── Main Content ───
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-card flex-shrink-0">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Back button and client info */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="shrink-0"
              >
                <ArrowLeft className="size-5" />
              </Button>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-pomegranate/10 flex items-center justify-center shrink-0">
                  <Building2 className="size-6 text-pomegranate" />
                </div>

                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-semibold">{client.name}</h1>
                    <Badge variant="outline" className={getStatusClass(client.status)}>
                      {client.status.replace('_', ' ')}
                    </Badge>
                    {client.industry && (
                      <Badge variant="outline" className={getIndustryClass(client.industry)}>
                        {client.industry}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{client.code}</p>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            {isEditMode ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={editSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={editSubmitting}
                >
                  {editSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            ) : (
              <Button variant="outline" onClick={handleEdit}>
                <Pencil className="size-4 mr-2" />
                Edit Client
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="h-full px-6 py-3 flex flex-col overflow-hidden">
          <Tabs defaultValue="overview" className="flex flex-col h-full overflow-hidden">
            <TabsList className="grid w-full max-w-2xl grid-cols-5 h-8">
              <TabsTrigger value="overview" className="text-xs">
                Overview
              </TabsTrigger>
              <TabsTrigger value="manuals" className="text-xs">
                Manuals
              </TabsTrigger>
              <TabsTrigger value="contacts" className="text-xs">
                Contacts
              </TabsTrigger>
              <TabsTrigger value="activity" className="text-xs">
                Activity
              </TabsTrigger>
              <TabsTrigger value="settings" className="text-xs">
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="flex-1 overflow-hidden mt-0 h-full">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 h-full overflow-auto p-1">
                {/* Left Column: Client Details */}
                <Card className="lg:col-span-2 flex flex-col overflow-hidden h-full">
                  <CardHeader className="pb-1 pt-2 px-3 flex-shrink-0">
                    <CardTitle className="text-xs">Client Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 flex-1 overflow-auto px-3 py-2">
                    {!isEditMode ? (
                      /* READ-ONLY MODE */
                      <div className="space-y-2 text-xs">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                          <span className="text-muted-foreground">Client Name:</span>
                          <span className="font-medium">{client.name}</span>

                          <span className="text-muted-foreground">Industry:</span>
                          <span>{client.industry || '—'}</span>

                          {client.contact_name && (
                            <>
                              <span className="text-muted-foreground">Contact:</span>
                              <span>{client.contact_name}</span>
                            </>
                          )}
                          {client.contact_email && (
                            <>
                              <span className="text-muted-foreground">Email:</span>
                              <a href={`mailto:${client.contact_email}`} className="text-pomegranate hover:underline truncate">
                                {client.contact_email}
                              </a>
                            </>
                          )}
                          {client.contact_phone && (
                            <>
                              <span className="text-muted-foreground">Phone:</span>
                              <a href={`tel:${client.contact_phone}`} className="text-pomegranate hover:underline">
                                {client.contact_phone}
                              </a>
                            </>
                          )}
                          {client.city && (
                            <>
                              <span className="text-muted-foreground">City:</span>
                              <span>{client.city}</span>
                            </>
                          )}
                          {client.country && (
                            <>
                              <span className="text-muted-foreground">Country:</span>
                              <span>{client.country}</span>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* EDIT MODE - INLINE EDITABLE FIELDS */
                      <div className="space-y-2">
                        <div>
                          <Label htmlFor="inline_name" className="text-xs">Client Name *</Label>
                          <Input
                            id="inline_name"
                            value={editFormData.name || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                            className="h-8 text-xs mt-1"
                          />
                        </div>

                        <div>
                          <Label htmlFor="inline_industry" className="text-xs">Industry</Label>
                          <Select
                            value={editFormData.industry || ''}
                            onValueChange={(value) => setEditFormData({ ...editFormData, industry: value })}
                          >
                            <SelectTrigger className="h-8 text-xs mt-1">
                              <SelectValue placeholder="Select industry" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Construction">Construction</SelectItem>
                              <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                              <SelectItem value="Retail">Retail</SelectItem>
                              <SelectItem value="Healthcare">Healthcare</SelectItem>
                              <SelectItem value="Logistics">Logistics</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="inline_contact_name" className="text-xs">Contact Name</Label>
                          <Input
                            id="inline_contact_name"
                            value={editFormData.contact_name || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, contact_name: e.target.value })}
                            className="h-8 text-xs mt-1"
                          />
                        </div>

                        <div>
                          <Label htmlFor="inline_contact_email" className="text-xs">Contact Email</Label>
                          <Input
                            id="inline_contact_email"
                            type="email"
                            value={editFormData.contact_email || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, contact_email: e.target.value })}
                            className="h-8 text-xs mt-1"
                          />
                        </div>

                        <div>
                          <Label htmlFor="inline_contact_phone" className="text-xs">Contact Phone</Label>
                          <div className="mt-1">
                            <PhoneInput
                              value={editFormData.contact_phone || ''}
                              onChange={(value) => setEditFormData({ ...editFormData, contact_phone: value })}
                              placeholder="Phone number"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor="inline_city" className="text-xs">City</Label>
                            <Input
                              id="inline_city"
                              value={editFormData.city || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                              className="h-8 text-xs mt-1"
                            />
                          </div>

                          <div>
                            <Label htmlFor="inline_country" className="text-xs">Country</Label>
                            <Input
                              id="inline_country"
                              value={editFormData.country || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, country: e.target.value })}
                              className="h-8 text-xs mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Right Column: Quick Stats */}
                <div className="space-y-1.5 flex flex-col h-full overflow-hidden">
                  {/* Metadata Card */}
                  <Card className="flex-shrink-0">
                    <CardHeader className="pb-1 pt-2 px-3">
                      <CardTitle className="text-xs">Metadata</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-0.5 px-3 py-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Client Code</span>
                        <span className="font-medium">{client.code}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <Badge variant="outline" className={`text-xs ${getStatusClass(client.status)}`}>
                          {client.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      {client.industry && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Industry</span>
                          <Badge variant="outline" className={`text-xs ${getIndustryClass(client.industry)}`}>
                            {client.industry}
                          </Badge>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Created</span>
                        <span>
                          {new Date(client.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Last Updated</span>
                        <span>
                          {new Date(client.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Stats Card */}
                  <Card className="flex-shrink-0">
                    <CardHeader className="pb-1 pt-2 px-3">
                      <CardTitle className="text-xs">Quick Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-0.5 px-3 py-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Manuals</span>
                        <span className="text-base font-semibold">0</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Roles</span>
                        <span className="text-base font-semibold">0</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Users</span>
                        <span className="text-base font-semibold">0</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Manuals Tab */}
            <TabsContent value="manuals" className="flex-1 overflow-auto mt-0 h-full">
              <Card className="h-full flex flex-col">
                <CardHeader className="pb-2 pt-2 px-3 flex-shrink-0">
                  <CardTitle className="text-xs">Client Manuals</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex items-center justify-center">
                  <div className="flex flex-col items-center justify-center text-center">
                    <FileText className="size-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No manuals yet</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Create your first manual for this client to get started.
                    </p>
                    <Button>
                      <Plus className="size-4 mr-2" />
                      Create Manual
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contacts Tab */}
            <TabsContent value="contacts" className="flex-1 overflow-auto mt-0 h-full">
              <Card className="h-full flex flex-col">
                <CardHeader className="pb-2 pt-2 px-3 flex-shrink-0">
                  <CardTitle className="text-xs">Client Contacts</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto px-3 py-2">
                  <div className="space-y-2">
                    {/* Primary Contact */}
                    {client.contact_name && (
                      <div className="flex items-start gap-4 p-4 border border-border rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-pomegranate/10 flex items-center justify-center shrink-0">
                          <Users className="size-5 text-pomegranate" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{client.contact_name}</h4>
                            <Badge variant="outline" className="text-xs">Primary</Badge>
                          </div>
                          <div className="space-y-1">
                            {client.contact_email && (
                              <p className="text-sm text-muted-foreground">
                                <Mail className="size-3 inline mr-1" />
                                {client.contact_email}
                              </p>
                            )}
                            {client.contact_phone && (
                              <p className="text-sm text-muted-foreground">
                                <Phone className="size-3 inline mr-1" />
                                {client.contact_phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Add More Contacts Button */}
                    <Button variant="outline" className="w-full">
                      <Plus className="size-4 mr-2" />
                      Add Contact
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="flex-1 overflow-auto mt-0 h-full">
              <Card className="h-full flex flex-col">
                <CardHeader className="pb-2 pt-2 px-3 flex-shrink-0">
                  <CardTitle className="text-xs">Activity Timeline</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto px-3 py-2">
                  <div className="space-y-2">
                    {/* Activity Item */}
                    <div className="flex gap-4">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-2 shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium">Client created</p>
                          <span className="text-xs text-muted-foreground">
                            {new Date(client.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Client account was created
                        </p>
                      </div>
                    </div>

                    {client.updated_at !== client.created_at && (
                      <div className="flex gap-4">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium">Client updated</p>
                            <span className="text-xs text-muted-foreground">
                              {new Date(client.updated_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Client information was modified
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="flex-1 overflow-auto mt-0 h-full">
              <Card className="h-full flex flex-col">
                <CardHeader className="pb-2 pt-2 px-3 flex-shrink-0">
                  <CardTitle className="text-xs">Client Settings</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto px-3 py-2">
                  <div className="space-y-3">
                    {/* Status Management */}
                    <div>
                      <h3 className="text-sm font-medium mb-3">Status Management</h3>
                      <div className="flex items-center gap-4">
                        <Button
                          variant={client.status === 'active' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleStatusChange('active')}
                          disabled={statusUpdating || client.status === 'active'}
                        >
                          Active
                        </Button>
                        <Button
                          variant={client.status === 'inactive' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleStatusChange('inactive')}
                          disabled={statusUpdating || client.status === 'inactive'}
                        >
                          Inactive
                        </Button>
                        <Button
                          variant={client.status === 'on_hold' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleStatusChange('on_hold')}
                          disabled={statusUpdating || client.status === 'on_hold'}
                        >
                          On Hold
                        </Button>
                      </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="pt-6 border-t border-border">
                      <h3 className="text-sm font-medium mb-3 text-destructive">
                        Danger Zone
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                          <div>
                            <h4 className="text-sm font-medium">Delete Client</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              Permanently delete this client and all associated data
                            </p>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDelete}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{client.name}</strong> and all associated data including manuals, roles, and history.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteSubmitting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteSubmitting ? 'Deleting...' : 'Delete Client'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
