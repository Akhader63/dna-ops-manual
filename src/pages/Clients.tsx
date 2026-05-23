import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Mail,
  Phone,
  AlertCircle,
  RefreshCw,
  Pencil,
  Trash2,
} from 'lucide-react';
import {
  getClients,
  createClient,
  updateClient,
  deleteClient,
  generateNextClientCode,
} from '@/services/dataService';
import type { Client } from '@/services/dataService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
import { PhoneInput } from '@/components/ui/phone-input';

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

// ─── Status Color Map ───
const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700 border-green-200',
  inactive: 'bg-gray-100 text-gray-600 border-gray-200',
  on_hold: 'bg-amber-100 text-amber-700 border-amber-200',
};

function getStatusClass(status: string): string {
  return statusColors[status] ?? statusColors.inactive;
}

function getStatusLabel(status: string): string {
  return status === 'on_hold'
    ? 'On Hold'
    : status.charAt(0).toUpperCase() + status.slice(1);
}

// ─── Skeleton Card ───
function ClientSkeletonCard() {
  return (
    <div className="bg-white rounded-lg border border-dna-silver/50 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  );
}

// ─── Client Card (Simplified - Click to View Details) ───
function ClientCard({
  client,
  onView,
}: {
  client: Client;
  onView: () => void;
}) {
  return (
    <div
      className="bg-white rounded-lg border border-dna-silver/50 shadow-sm p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-md group cursor-pointer"
      onClick={onView}
    >
        {/* Top: Name + Industry Badge */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-lg font-semibold text-gray-900 leading-tight group-hover:text-dna-pomegranate transition-colors">
            {client.name}
          </h3>
          {client.industry && (
            <Badge
              variant="outline"
              className={`text-xs font-medium shrink-0 ${getIndustryClass(
                client.industry
              )}`}
            >
              {client.industry}
            </Badge>
          )}
        </div>

        {/* Middle: Description */}
        <p className="text-sm text-gray-500 line-clamp-2 mb-4 min-h-[2.5rem]">
          {client.description ?? 'No description available.'}
        </p>

        {/* Bottom: Location + Status */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-sm text-dna-tundora">
            <MapPin className="size-3.5 text-dna-silver" />
            <span className="truncate max-w-[140px]">
              {client.city && client.country
                ? `${client.city}, ${client.country}`
                : client.city ?? client.country ?? '—'}
            </span>
          </div>
          <Badge
            variant="outline"
            className={`text-xs font-medium capitalize ${getStatusClass(
              client.status
            )}`}
          >
            {getStatusLabel(client.status)}
          </Badge>
        </div>

        {/* Contact info (if available) */}
        {(client.contact_name || client.contact_email) && (
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50 text-xs text-gray-400">
            {client.contact_name && (
              <span className="flex items-center gap-1">
                <Building2 className="size-3" />
                {client.contact_name}
              </span>
            )}
            {client.contact_email && (
              <span className="flex items-center gap-1 truncate">
                <Mail className="size-3" />
                {client.contact_email}
              </span>
            )}
          </div>
        )}
    </div>
  );
}

// ─── Add/Edit Client Form Data ───
interface ClientFormData {
  name: string;
  code: string;
  industry: string;
  description: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  city: string;
  country: string;
}

const initialFormData: ClientFormData = {
  name: '',
  code: '',
  industry: '',
  description: '',
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  city: '',
  country: '',
};

const INDUSTRY_OPTIONS = [
  'Construction',
  'Manufacturing',
  'Retail',
  'Healthcare',
  'Logistics',
];

// ─── Main Clients Page (Enhanced) ───
export default function Clients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Add Client Dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addFormData, setAddFormData] = useState<ClientFormData>(initialFormData);
  const [addFormErrors, setAddFormErrors] = useState<Record<string, string>>({});
  const [addSubmitting, setAddSubmitting] = useState(false);

  // Edit Client Dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editFormData, setEditFormData] = useState<ClientFormData>(initialFormData);
  const [editFormErrors, setEditFormErrors] = useState<Record<string, string>>({});
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Delete Client Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Client Detail Sheet
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);

  // Fetch clients
  const loadClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getClients();
      setClients(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load clients';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  // Filtered clients
  const filteredClients = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.industry?.toLowerCase() ?? '').includes(q) ||
        (c.city?.toLowerCase() ?? '').includes(q) ||
        (c.country?.toLowerCase() ?? '').includes(q)
    );
  }, [clients, search]);

  // Add Client Form handlers
  const handleAddInputChange = (field: keyof ClientFormData, value: string) => {
    setAddFormData((prev) => ({ ...prev, [field]: value }));
    if (addFormErrors[field]) {
      setAddFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateAddForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!addFormData.name.trim()) errors.name = 'Client name is required';
    if (!addFormData.code.trim())
      errors.code =
        'Client code generation failed. Please close and reopen the form.';
    setAddFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAddForm()) return;

    setAddSubmitting(true);
    try {
      await createClient({
        name: addFormData.name.trim(),
        code: addFormData.code.trim(),
        industry: addFormData.industry || null,
        description: addFormData.description.trim() || null,
        contact_name: addFormData.contact_name.trim() || null,
        contact_email: addFormData.contact_email.trim() || null,
        contact_phone: addFormData.contact_phone.trim() || null,
        city: addFormData.city.trim() || null,
        country: addFormData.country.trim() || null,
        logo_url: null,
        website: null,
        address: null,
        status: 'active',
        metadata: null,
        deleted_at: null,
      });
      setAddDialogOpen(false);
      setAddFormData(initialFormData);
      await loadClients();
      toast.success('Client created successfully');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create client';
      setAddFormErrors((prev) => ({ ...prev, submit: msg }));
      toast.error('Failed to create client', { description: msg });
    } finally {
      setAddSubmitting(false);
    }
  };

  const handleAddDialogOpenChange = async (open: boolean) => {
    setAddDialogOpen(open);
    if (open) {
      try {
        const nextCode = await generateNextClientCode();
        setAddFormData({ ...initialFormData, code: nextCode });
      } catch (err) {
        setAddFormErrors({
          code: 'Failed to generate client code. Please try again.',
        });
      }
    } else {
      setAddFormData(initialFormData);
      setAddFormErrors({});
    }
  };

  // Edit Client handlers
  const handleEditInputChange = (field: keyof ClientFormData, value: string) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
    if (editFormErrors[field]) {
      setEditFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleEditClick = (client: Client) => {
    setEditingClient(client);
    setEditFormData({
      name: client.name || '',
      code: client.code || '',
      industry: client.industry || '',
      description: client.description || '',
      contact_name: client.contact_name || '',
      contact_email: client.contact_email || '',
      contact_phone: client.contact_phone || '',
      city: client.city || '',
      country: client.country || '',
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;

    const errors: Record<string, string> = {};
    if (!editFormData.name.trim()) errors.name = 'Client name is required';
    setEditFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setEditSubmitting(true);
    try {
      await updateClient(editingClient.id, {
        name: editFormData.name.trim(),
        industry: editFormData.industry || null,
        description: editFormData.description.trim() || null,
        contact_name: editFormData.contact_name.trim() || null,
        contact_email: editFormData.contact_email.trim() || null,
        contact_phone: editFormData.contact_phone.trim() || null,
        city: editFormData.city.trim() || null,
        country: editFormData.country.trim() || null,
      });

      toast.success('Client updated successfully');
      setEditDialogOpen(false);
      setEditingClient(null);
      await loadClients();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update client';
      toast.error('Failed to update client', { description: msg });
    } finally {
      setEditSubmitting(false);
    }
  };

  // Delete Client handlers
  const handleDeleteClick = (client: Client) => {
    setDeletingClient(client);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingClient) return;

    setDeleteSubmitting(true);
    try {
      await deleteClient(deletingClient.id);
      toast.success('Client deleted successfully');
      setDeleteDialogOpen(false);
      setDeletingClient(null);
      await loadClients();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete client';
      toast.error('Failed to delete client', { description: msg });
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // Client Detail handlers
  const handleViewClient = (client: Client) => {
    navigate(`/clients/${client.id}`);
  };

  return (
    <div className="p-6 max-w-content">
      {/* ─── Page Header ─── */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Client Archive</h1>
        <p className="mt-1 text-dna-tundora">
          Manage all your client operation manuals
        </p>
      </div>

      {/* ─── Toolbar: Search + Add ─── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-dna-silver pointer-events-none" />
          <Input
            placeholder="Search by name, industry, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white border-dna-silver/50"
          />
        </div>

        <Dialog open={addDialogOpen} onOpenChange={handleAddDialogOpenChange}>
          <DialogTrigger asChild>
            <Button className="bg-dna-pomegranate hover:bg-dna-pomegranate/90 text-white gap-2 shrink-0">
              <Plus className="size-4" />
              Add Client
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
              <DialogDescription>
                Create a new client to manage their operation manuals.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddSubmit} className="space-y-4 mt-2">
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name">
                  Client Name <span className="text-dna-pomegranate">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Company name"
                  value={addFormData.name}
                  onChange={(e) => handleAddInputChange('name', e.target.value)}
                  aria-invalid={!!addFormErrors.name}
                />
                {addFormErrors.name && (
                  <p className="text-xs text-dna-pomegranate">
                    {addFormErrors.name}
                  </p>
                )}
              </div>

              {/* Code */}
              <div className="space-y-1.5">
                <Label htmlFor="code">
                  Client Code <span className="text-dna-pomegranate">*</span>
                </Label>
                <Input
                  id="code"
                  placeholder="Auto-generated"
                  value={addFormData.code}
                  readOnly
                  disabled
                  className="bg-gray-50 cursor-not-allowed"
                  aria-invalid={!!addFormErrors.code}
                />
                <p className="text-xs text-dna-tundora">
                  Client Code is automatically generated by the system and cannot be edited.
                </p>
                {addFormErrors.code && (
                  <p className="text-xs text-dna-pomegranate">
                    {addFormErrors.code}
                  </p>
                )}
              </div>

              {/* Industry */}
              <div className="space-y-1.5">
                <Label htmlFor="industry">Industry</Label>
                <Select
                  value={addFormData.industry}
                  onValueChange={(value) =>
                    handleAddInputChange('industry', value)
                  }
                >
                  <SelectTrigger id="industry" className="w-full">
                    <SelectValue placeholder="Select an industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRY_OPTIONS.map((ind) => (
                      <SelectItem key={ind} value={ind}>
                        {ind}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  placeholder="Brief description of the client..."
                  value={addFormData.description}
                  onChange={(e) =>
                    handleAddInputChange('description', e.target.value)
                  }
                  rows={3}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                />
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="contact_name" className="flex items-center gap-1.5">
                    <Building2 className="size-3.5" />
                    Contact Name
                  </Label>
                  <Input
                    id="contact_name"
                    placeholder="Full name"
                    value={addFormData.contact_name}
                    onChange={(e) =>
                      handleAddInputChange('contact_name', e.target.value)
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="contact_email" className="flex items-center gap-1.5">
                    <Mail className="size-3.5" />
                    Contact Email
                  </Label>
                  <Input
                    id="contact_email"
                    type="email"
                    placeholder="email@company.com"
                    value={addFormData.contact_email}
                    onChange={(e) =>
                      handleAddInputChange('contact_email', e.target.value)
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="contact_phone" className="flex items-center gap-1.5">
                    <Phone className="size-3.5" />
                    Contact Phone
                  </Label>
                  <PhoneInput
                    value={addFormData.contact_phone}
                    onChange={(value) =>
                      handleAddInputChange('contact_phone', value)
                    }
                    placeholder="Phone number"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="city" className="flex items-center gap-1.5">
                    <MapPin className="size-3.5" />
                    City
                  </Label>
                  <Input
                    id="city"
                    placeholder="City name"
                    value={addFormData.city}
                    onChange={(e) =>
                      handleAddInputChange('city', e.target.value)
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="country" className="flex items-center gap-1.5">
                    <MapPin className="size-3.5" />
                    Country
                  </Label>
                  <Input
                    id="country"
                    placeholder="Country name"
                    value={addFormData.country}
                    onChange={(e) =>
                      handleAddInputChange('country', e.target.value)
                    }
                  />
                </div>
              </div>

              {addFormErrors.submit && (
                <div className="flex items-center gap-2 text-sm text-dna-pomegranate bg-red-50 rounded-md px-3 py-2">
                  <AlertCircle className="size-4 shrink-0" />
                  {addFormErrors.submit}
                </div>
              )}

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleAddDialogOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={addSubmitting}
                  className="bg-dna-pomegranate hover:bg-dna-pomegranate/90 text-white"
                >
                  {addSubmitting ? 'Creating...' : 'Create Client'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* ─── Error State ─── */}
      {error && !loading && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="size-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={loadClients}
            className="gap-1.5 shrink-0"
          >
            <RefreshCw className="size-3.5" />
            Retry
          </Button>
        </div>
      )}

      {/* ─── Loading State ─── */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ClientSkeletonCard />
          <ClientSkeletonCard />
          <ClientSkeletonCard />
        </div>
      )}

      {/* ─── Empty State ─── */}
      {!loading && !error && filteredClients.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-dna-silver bg-white py-16 px-6 text-center">
          <Building2 className="size-12 text-dna-silver mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {search ? 'No matching clients' : 'No clients found'}
          </h3>
          <p className="text-sm text-dna-tundora max-w-xs">
            {search
              ? "Try adjusting your search terms to find what you're looking for."
              : 'Use the "Add Client" button above to create your first client and start managing operation manuals.'}
          </p>
        </div>
      )}

      {/* ─── Client Grid (Updated with Actions) ─── */}
      {!loading && !error && filteredClients.length > 0 && (
        <>
          <p className="text-sm text-dna-tundora mb-3">
            {filteredClients.length}{' '}
            {filteredClients.length === 1 ? 'client' : 'clients'}
            {search && ` matching "${search}"`}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onView={() => handleViewClient(client)}
              />
            ))}
          </div>
        </>
      )}

      {/* ─── Edit Client Dialog ─── */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>
              Update client information and contact details.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 mt-2">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="edit_name">
                Client Name <span className="text-dna-pomegranate">*</span>
              </Label>
              <Input
                id="edit_name"
                placeholder="Company name"
                value={editFormData.name}
                onChange={(e) =>
                  handleEditInputChange('name', e.target.value)
                }
                aria-invalid={!!editFormErrors.name}
              />
              {editFormErrors.name && (
                <p className="text-xs text-dna-pomegranate">
                  {editFormErrors.name}
                </p>
              )}
            </div>

            {/* Code (read-only) */}
            <div className="space-y-1.5">
              <Label htmlFor="edit_code">
                Client Code
              </Label>
              <Input
                id="edit_code"
                value={editFormData.code}
                readOnly
                disabled
                className="bg-gray-50 cursor-not-allowed"
              />
              <p className="text-xs text-dna-tundora">
                Client Code cannot be changed.
              </p>
            </div>

            {/* Industry */}
            <div className="space-y-1.5">
              <Label htmlFor="edit_industry">Industry</Label>
              <Select
                value={editFormData.industry}
                onValueChange={(value) =>
                  handleEditInputChange('industry', value)
                }
              >
                <SelectTrigger id="edit_industry" className="w-full">
                  <SelectValue placeholder="Select an industry" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRY_OPTIONS.map((ind) => (
                    <SelectItem key={ind} value={ind}>
                      {ind}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="edit_description">Description</Label>
              <textarea
                id="edit_description"
                placeholder="Brief description of the client..."
                value={editFormData.description}
                onChange={(e) =>
                  handleEditInputChange('description', e.target.value)
                }
                rows={3}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              />
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit_contact_name" className="flex items-center gap-1.5">
                  <Building2 className="size-3.5" />
                  Contact Name
                </Label>
                <Input
                  id="edit_contact_name"
                  placeholder="Full name"
                  value={editFormData.contact_name}
                  onChange={(e) =>
                    handleEditInputChange('contact_name', e.target.value)
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit_contact_email" className="flex items-center gap-1.5">
                  <Mail className="size-3.5" />
                  Contact Email
                </Label>
                <Input
                  id="edit_contact_email"
                  type="email"
                  placeholder="email@company.com"
                  value={editFormData.contact_email}
                  onChange={(e) =>
                    handleEditInputChange('contact_email', e.target.value)
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit_contact_phone" className="flex items-center gap-1.5">
                  <Phone className="size-3.5" />
                  Contact Phone
                </Label>
                <PhoneInput
                  value={editFormData.contact_phone}
                  onChange={(value) =>
                    handleEditInputChange('contact_phone', value)
                  }
                  placeholder="Phone number"
                />
              </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit_city" className="flex items-center gap-1.5">
                  <MapPin className="size-3.5" />
                  City
                </Label>
                <Input
                  id="edit_city"
                  placeholder="City name"
                  value={editFormData.city}
                  onChange={(e) =>
                    handleEditInputChange('city', e.target.value)
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit_country" className="flex items-center gap-1.5">
                  <MapPin className="size-3.5" />
                  Country
                </Label>
                <Input
                  id="edit_country"
                  placeholder="Country name"
                  value={editFormData.country}
                  onChange={(e) =>
                    handleEditInputChange('country', e.target.value)
                  }
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={editSubmitting}
                className="bg-dna-pomegranate hover:bg-dna-pomegranate/90 text-white"
              >
                {editSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ─── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <strong>{deletingClient?.name}</strong>? This action cannot be
              undone and will also delete all associated manuals and data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteSubmitting ? 'Deleting...' : 'Delete Client'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Client Detail Sheet ─── */}
      <Sheet open={detailSheetOpen} onOpenChange={setDetailSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {viewingClient && (
            <>
              <SheetHeader>
                <SheetTitle>{viewingClient.name}</SheetTitle>
                <SheetDescription>
                  Client Code: {viewingClient.code}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Status & Industry */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-500">Status</Label>
                    <Badge
                      variant="outline"
                      className={`mt-1 ${getStatusClass(viewingClient.status)}`}
                    >
                      {getStatusLabel(viewingClient.status)}
                    </Badge>
                  </div>
                  {viewingClient.industry && (
                    <div>
                      <Label className="text-xs text-gray-500">Industry</Label>
                      <Badge
                        variant="outline"
                        className={`mt-1 ${getIndustryClass(
                          viewingClient.industry
                        )}`}
                      >
                        {viewingClient.industry}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Description */}
                {viewingClient.description && (
                  <div>
                    <Label className="text-xs text-gray-500">Description</Label>
                    <p className="mt-1 text-sm text-gray-900">
                      {viewingClient.description}
                    </p>
                  </div>
                )}

                {/* Contact Information */}
                <div className="space-y-3">
                  <Label className="text-xs text-gray-500">
                    Contact Information
                  </Label>
                  {viewingClient.contact_name && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <span>{viewingClient.contact_name}</span>
                    </div>
                  )}
                  {viewingClient.contact_email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <a
                        href={`mailto:${viewingClient.contact_email}`}
                        className="text-dna-pomegranate hover:underline"
                      >
                        {viewingClient.contact_email}
                      </a>
                    </div>
                  )}
                  {viewingClient.contact_phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <a
                        href={`tel:${viewingClient.contact_phone}`}
                        className="text-dna-pomegranate hover:underline"
                      >
                        {viewingClient.contact_phone}
                      </a>
                    </div>
                  )}
                </div>

                {/* Location */}
                {(viewingClient.city || viewingClient.country) && (
                  <div>
                    <Label className="text-xs text-gray-500">Location</Label>
                    <div className="flex items-center gap-2 text-sm mt-1">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>
                        {viewingClient.city && viewingClient.country
                          ? `${viewingClient.city}, ${viewingClient.country}`
                          : viewingClient.city ?? viewingClient.country}
                      </span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-4 space-y-2">
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => {
                      setDetailSheetOpen(false);
                      handleEditClick(viewingClient);
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Client
                  </Button>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => {
                      toast.info('Manuals feature coming soon');
                    }}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    View Manuals
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
