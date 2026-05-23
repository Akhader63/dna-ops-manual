import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Mail,
  Phone,
  Globe,
  Calendar,
  FileText,
  Users,
  Activity,
  Settings,
  Pencil,
  MoreVertical,
  Trash2,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { getClientById, deleteClient, updateClient } from '@/services/dataService';
import type { Client } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    // Navigate back to clients page with edit dialog open
    navigate('/clients', { state: { editClientId: client?.id } });
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
      <div className="flex flex-col h-screen bg-background">
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
      <div className="flex flex-col items-center justify-center h-screen bg-background p-8">
        <div className="text-center max-w-md space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="size-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-semibold">Client Not Found</h2>
          <p className="text-muted-foreground">{error || 'The client you\'re looking for doesn\'t exist.'}</p>
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
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-card flex-shrink-0">
        <div className="max-w-[1600px] mx-auto px-6 py-3">
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
            <Button variant="outline" onClick={handleEdit}>
              <Pencil className="size-4 mr-2" />
              Edit Client
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex-1 flex flex-col overflow-hidden w-full">
          <Tabs defaultValue="overview" className="flex flex-col flex-1 overflow-hidden space-y-2">
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
            <TabsContent value="overview" className="flex-1 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 h-full overflow-hidden">
                {/* Left Column: Client Details */}
                <Card className="lg:col-span-2 flex flex-col overflow-hidden">
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-sm">Client Information</CardTitle>
                    <CardDescription className="text-xs">
                      Basic details and contact information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 flex-1 overflow-y-auto px-4 py-3">
                    {/* Description */}
                    {client.description && (
                      <div>
                        <h3 className="text-sm font-medium mb-2">Description</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {client.description}
                        </p>
                      </div>
                    )}

                    {/* Contact Information */}
                    <div>
                      <h3 className="text-sm font-medium mb-3">Contact Information</h3>
                      <div className="space-y-3">
                        {client.contact_name && (
                          <div className="flex items-center gap-3">
                            <Users className="size-4 text-muted-foreground shrink-0" />
                            <span className="text-sm">{client.contact_name}</span>
                          </div>
                        )}
                        {client.contact_email && (
                          <div className="flex items-center gap-3">
                            <Mail className="size-4 text-muted-foreground shrink-0" />
                            <a
                              href={`mailto:${client.contact_email}`}
                              className="text-sm text-pomegranate hover:underline"
                            >
                              {client.contact_email}
                            </a>
                          </div>
                        )}
                        {client.contact_phone && (
                          <div className="flex items-center gap-3">
                            <Phone className="size-4 text-muted-foreground shrink-0" />
                            <a
                              href={`tel:${client.contact_phone}`}
                              className="text-sm text-pomegranate hover:underline"
                            >
                              {client.contact_phone}
                            </a>
                          </div>
                        )}
                        {client.website && (
                          <div className="flex items-center gap-3">
                            <Globe className="size-4 text-muted-foreground shrink-0" />
                            <a
                              href={client.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-pomegranate hover:underline"
                            >
                              {client.website}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Location */}
                    {(client.city || client.country || client.address) && (
                      <div>
                        <h3 className="text-sm font-medium mb-3">Location</h3>
                        <div className="space-y-2">
                          {client.address && (
                            <div className="flex items-start gap-3">
                              <MapPin className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                              <span className="text-sm">{client.address}</span>
                            </div>
                          )}
                          {(client.city || client.country) && (
                            <div className="flex items-center gap-3">
                              <MapPin className="size-4 text-muted-foreground shrink-0" />
                              <span className="text-sm">
                                {[client.city, client.country].filter(Boolean).join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Right Column: Quick Stats */}
                <div className="space-y-2 flex flex-col overflow-y-auto">
                  {/* Metadata Card */}
                  <Card className="flex-shrink-0">
                    <CardHeader className="pb-1 pt-3 px-4">
                      <CardTitle className="text-sm">Metadata</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1.5 px-4 py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Client Code</span>
                        <span className="text-sm font-medium">{client.code}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <Badge variant="outline" className={getStatusClass(client.status)}>
                          {client.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      {client.industry && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Industry</span>
                          <Badge variant="outline" className={getIndustryClass(client.industry)}>
                            {client.industry}
                          </Badge>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Created</span>
                        <span className="text-sm">
                          {new Date(client.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Last Updated</span>
                        <span className="text-sm">
                          {new Date(client.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Stats Card */}
                  <Card className="flex-shrink-0">
                    <CardHeader className="pb-1 pt-3 px-4">
                      <CardTitle className="text-sm">Quick Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1.5 px-4 py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Manuals</span>
                        <span className="text-lg font-semibold">0</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Roles</span>
                        <span className="text-lg font-semibold">0</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Users</span>
                        <span className="text-lg font-semibold">0</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Manuals Tab */}
            <TabsContent value="manuals" className="flex-1 overflow-y-auto">
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Client Manuals</CardTitle>
                  <CardDescription className="text-xs">
                    Operation manuals created for this client
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-8 text-center">
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
            <TabsContent value="contacts" className="flex-1 overflow-y-auto">
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Client Contacts</CardTitle>
                  <CardDescription className="text-xs">
                    Manage contact persons for this client
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
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
            <TabsContent value="activity" className="flex-1 overflow-y-auto">
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Activity Timeline</CardTitle>
                  <CardDescription className="text-xs">
                    Recent changes and activities for this client
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
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
            <TabsContent value="settings" className="flex-1 overflow-y-auto">
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Client Settings</CardTitle>
                  <CardDescription className="text-xs">
                    Manage client-specific settings and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
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
