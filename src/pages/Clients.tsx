import { useState, useEffect, useMemo, useCallback } from 'react';
import { Building2, Plus, Search, MapPin, Mail, Phone, AlertCircle, RefreshCw } from 'lucide-react';
import { getClients, createClient, generateNextClientCode } from '@/services/dataService';
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
  return status === 'on_hold' ? 'On Hold' : status.charAt(0).toUpperCase() + status.slice(1);
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

// ─── Client Card ───
function ClientCard({ client }: { client: Client }) {
  return (
    <div className="bg-white rounded-lg border border-dna-silver/50 shadow-sm p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer group">
      {/* Top: Name + Industry Badge */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-lg font-semibold text-gray-900 leading-tight group-hover:text-dna-pomegranate transition-colors">
          {client.name}
        </h3>
        {client.industry && (
          <Badge
            variant="outline"
            className={`text-xs font-medium shrink-0 ${getIndustryClass(client.industry)}`}
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
          className={`text-xs font-medium capitalize ${getStatusClass(client.status)}`}
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

// ─── Add Client Form ───
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

const INDUSTRY_OPTIONS = ['Construction', 'Manufacturing', 'Retail', 'Healthcare', 'Logistics'];

// ─── Main Clients Page ───
export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ClientFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

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

  // Form handlers
  const handleInputChange = (field: keyof ClientFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Client name is required';
    // Client code is auto-generated, so we just verify it exists
    if (!formData.code.trim()) errors.code = 'Client code generation failed. Please close and reopen the form.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await createClient({
        name: formData.name.trim(),
        code: formData.code.trim(),
        industry: formData.industry || null,
        description: formData.description.trim() || null,
        contact_name: formData.contact_name.trim() || null,
        contact_email: formData.contact_email.trim() || null,
        contact_phone: formData.contact_phone.trim() || null,
        city: formData.city.trim() || null,
        country: formData.country.trim() || null,
        logo_url: null,
        website: null,
        address: null,
        status: 'active',
        metadata: null,
      deleted_at: null,
      });
      setDialogOpen(false);
      setFormData(initialFormData);
      await loadClients();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create client';
      setFormErrors((prev) => ({ ...prev, submit: msg }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDialogOpenChange = async (open: boolean) => {
    setDialogOpen(open);
    if (open) {
      // Auto-generate client code when opening the dialog
      try {
        const nextCode = await generateNextClientCode();
        setFormData({ ...initialFormData, code: nextCode });
      } catch (err) {
        console.error('Failed to generate client code:', err);
        setFormErrors({ code: 'Failed to generate client code. Please try again.' });
      }
    } else {
      setFormData(initialFormData);
      setFormErrors({});
    }
  };

  return (
    <div className="p-6 max-w-content">
      {/* ─── Page Header ─── */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Client Archive</h1>
        <p className="mt-1 text-dna-tundora">Manage all your client operation manuals</p>
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

        <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
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

            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name">
                  Client Name <span className="text-dna-pomegranate">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Company name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  aria-invalid={!!formErrors.name}
                />
                {formErrors.name && (
                  <p className="text-xs text-dna-pomegranate">{formErrors.name}</p>
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
                  value={formData.code}
                  readOnly
                  disabled
                  className="bg-gray-50 cursor-not-allowed"
                  aria-invalid={!!formErrors.code}
                />
                <p className="text-xs text-dna-tundora">
                  Client Code is automatically generated by the system and cannot be edited.
                </p>
                {formErrors.code && (
                  <p className="text-xs text-dna-pomegranate">{formErrors.code}</p>
                )}
              </div>

              {/* Industry */}
              <div className="space-y-1.5">
                <Label htmlFor="industry">Industry</Label>
                <Select
                  value={formData.industry}
                  onValueChange={(value) => handleInputChange('industry', value)}
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
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
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
                    value={formData.contact_name}
                    onChange={(e) => handleInputChange('contact_name', e.target.value)}
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
                    value={formData.contact_email}
                    onChange={(e) => handleInputChange('contact_email', e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="contact_phone" className="flex items-center gap-1.5">
                    <Phone className="size-3.5" />
                    Contact Phone
                  </Label>
                  <Input
                    id="contact_phone"
                    placeholder="+1 234 567 890"
                    value={formData.contact_phone}
                    onChange={(e) => handleInputChange('contact_phone', e.target.value)}
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
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
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
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                  />
                </div>
              </div>

              {formErrors.submit && (
                <div className="flex items-center gap-2 text-sm text-dna-pomegranate bg-red-50 rounded-md px-3 py-2">
                  <AlertCircle className="size-4 shrink-0" />
                  {formErrors.submit}
                </div>
              )}

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDialogOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-dna-pomegranate hover:bg-dna-pomegranate/90 text-white"
                >
                  {submitting ? 'Creating...' : 'Create Client'}
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
              ? 'Try adjusting your search terms to find what you\'re looking for.'
              : 'Use the "Add Client" button above to create your first client and start managing operation manuals.'}
          </p>
        </div>
      )}

      {/* ─── Client Grid ─── */}
      {!loading && !error && filteredClients.length > 0 && (
        <>
          <p className="text-sm text-dna-tundora mb-3">
            {filteredClients.length} {filteredClients.length === 1 ? 'client' : 'clients'}
            {search && ` matching "${search}"`}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map((client) => (
              <ClientCard key={client.id} client={client} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
