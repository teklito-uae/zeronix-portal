import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import api from '@/lib/axios';
import { getBasePath } from '@/hooks/useBasePath';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { CurrencyAmount } from '@/components/shared/CurrencyAmount';
import { Avatar } from '@/components/shared/Avatar';
import { PageTabs, type PageTab } from '@/components/shared/PageTabs';
import { StatCard } from '@/components/shared/StatCard';
import { PageLoader } from '@/components/shared/PageLoader';
import { Spinner } from '@/components/shared/Spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  X,
  Mail,
  Phone,
  Building2,
  Globe,
  Briefcase,
  Calendar,
  MapPin,
  StickyNote,
  ListTodo,
  CalendarClock,
  Handshake,
  FileText,
  Receipt,
  Wallet,
  Plus,
} from 'lucide-react';
import type { CustomerContact, ContactActivity, Tag, Deal, Quote, Invoice } from '@/types';

interface ContactDetailResponse {
  contact: CustomerContact;
  deals: Deal[];
  quotes: Quote[];
  invoices: Invoice[];
  activities: ContactActivity[];
}

const ACTIVITY_TYPES: { id: ContactActivity['type']; label: string; icon: typeof ListTodo }[] = [
  { id: 'note', label: 'Note', icon: StickyNote },
  { id: 'task', label: 'Task', icon: ListTodo },
  { id: 'call', label: 'Call', icon: Phone },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'meeting', label: 'Meeting', icon: CalendarClock },
];

const InfoRow = ({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value?: string | null;
}) => (
  <div className="flex items-center gap-3 px-4 py-2.5">
    <Icon size={14} className="text-admin-text-muted flex-shrink-0" />
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-bold uppercase tracking-wider text-admin-text-muted">{label}</p>
      <p className="text-xs font-medium text-admin-text-primary truncate">{value || '—'}</p>
    </div>
  </div>
);

interface ContactDetailPanelProps {
  contactId: number | null;
  onClose: () => void;
}

export const ContactDetailPanel = ({ contactId, onClose }: ContactDetailPanelProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currency = useCurrencyStore((s) => s.currency);

  const [activeTab, setActiveTab] = useState('overview');
  const [composerType, setComposerType] = useState<'note' | 'task' | null>(null);
  const [activityNotes, setActivityNotes] = useState('');
  const [activityDueDate, setActivityDueDate] = useState('');
  const [tagPickerOpen, setTagPickerOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['contacts', contactId],
    queryFn: async () => (await api.get(`/admin/contacts/${contactId}`)).data as ContactDetailResponse,
    enabled: !!contactId,
  });

  const { data: allTags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => (await api.get('/admin/tags')).data as Tag[],
    enabled: !!contactId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['contacts', contactId] });

  const addActivity = useMutation({
    mutationFn: (payload: { type: ContactActivity['type']; notes?: string; due_date?: string }) =>
      api.post(`/admin/contacts/${contactId}/activities`, payload),
    onSuccess: () => { invalidate(); toast.success('Activity logged'); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to log activity'),
  });

  const attachTag = useMutation({
    mutationFn: (tagId: number) => api.post(`/admin/contacts/${contactId}/tags`, { tag_id: tagId }),
    onSuccess: () => invalidate(),
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to add tag'),
  });

  const detachTag = useMutation({
    mutationFn: (tagId: number) => api.delete(`/admin/contacts/${contactId}/tags/${tagId}`),
    onSuccess: () => invalidate(),
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to remove tag'),
  });

  const createTag = useMutation({
    mutationFn: async (name: string) => (await api.post('/admin/tags', { name })).data as Tag,
    onSuccess: (tag) => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      attachTag.mutate(tag.id);
      setTagSearch('');
      setTagPickerOpen(false);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to create tag'),
  });

  const resetComposer = () => {
    setComposerType(null);
    setActivityNotes('');
    setActivityDueDate('');
  };

  const openComposer = (type: 'note' | 'task') => {
    setComposerType((prev) => (prev === type ? null : type));
    setActivityNotes('');
    setActivityDueDate('');
  };

  const handleSaveComposer = () => {
    if (!composerType) return;
    addActivity.mutate(
      {
        type: composerType,
        notes: activityNotes || undefined,
        due_date: composerType === 'task' && activityDueDate ? activityDueDate : undefined,
      },
      { onSuccess: resetComposer }
    );
  };

  const contact = data?.contact;
  const contactTags = contact?.tags || [];
  const availableTags = allTags.filter((t) => !contactTags.some((ct) => ct.id === t.id));
  const filteredTags = tagSearch.trim()
    ? availableTags.filter((t) => t.name.toLowerCase().includes(tagSearch.trim().toLowerCase()))
    : availableTags;
  const tagExists = allTags.some((t) => t.name.toLowerCase() === tagSearch.trim().toLowerCase());

  const tabs: PageTab[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'activity', label: 'Activity', count: data?.activities.length ?? 0 },
    { id: 'deals', label: 'Deals', count: contact?.deals_count ?? 0 },
    { id: 'quotes', label: 'Quotes', count: contact?.quotes_count ?? 0 },
    { id: 'invoices', label: 'Invoices', count: contact?.invoices_count ?? 0 },
    { id: 'files', label: 'Files' },
  ];

  return (
    <Sheet open={!!contactId} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl bg-admin-surface border-admin-border p-0 flex flex-col gap-0 overflow-hidden"
      >
        <SheetTitle className="sr-only">{contact?.full_name || 'Contact details'}</SheetTitle>

        {isLoading || !contact ? (
          <div className="flex-1 flex items-center justify-center">
            <PageLoader label="Loading contact..." iconSize={28} />
          </div>
        ) : (
          <>
          {/* Header */}
          <div className="px-5 pr-12 py-5 border-b border-admin-border flex-shrink-0">
            <div className="flex items-start gap-3">
              <Avatar name={contact.full_name} className="h-14 w-14 text-lg flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-admin-text-primary truncate">{contact.full_name}</h3>
                  {contact.is_active ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      ACTIVE
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider bg-admin-bg text-admin-text-muted border border-admin-border">
                      INACTIVE
                    </span>
                  )}
                </div>
                {contact.designation && (
                  <p className="text-xs text-admin-text-secondary mt-0.5 truncate">{contact.designation}</p>
                )}
                {contact.customer && (
                  <button
                    type="button"
                    onClick={() => navigate(`${getBasePath()}/companies/${contact.customer_id}`)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-zeronix-blue hover:underline mt-1.5"
                  >
                    <Building2 size={12} /> {contact.customer.company || contact.customer.name}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-4 gap-2 px-5 py-3 border-b border-admin-border flex-shrink-0">
            <a
              href={contact.email ? `mailto:${contact.email}` : undefined}
              onClick={() => contact.email && addActivity.mutate({ type: 'email' })}
              className={cn(
                'flex flex-col items-center justify-center gap-1 h-14 rounded-xl border text-[11px] font-semibold transition-colors',
                contact.email
                  ? 'border-admin-border bg-admin-bg text-admin-text-secondary hover:border-zeronix-blue/40 hover:text-zeronix-blue cursor-pointer'
                  : 'border-admin-border bg-admin-bg text-admin-text-muted opacity-40 pointer-events-none'
              )}
            >
              <Mail size={15} />
              Email
            </a>
            <a
              href={contact.phone || contact.mobile ? `tel:${contact.phone || contact.mobile}` : undefined}
              onClick={() => (contact.phone || contact.mobile) && addActivity.mutate({ type: 'call' })}
              className={cn(
                'flex flex-col items-center justify-center gap-1 h-14 rounded-xl border text-[11px] font-semibold transition-colors',
                contact.phone || contact.mobile
                  ? 'border-admin-border bg-admin-bg text-admin-text-secondary hover:border-zeronix-blue/40 hover:text-zeronix-blue cursor-pointer'
                  : 'border-admin-border bg-admin-bg text-admin-text-muted opacity-40 pointer-events-none'
              )}
            >
              <Phone size={15} />
              Call
            </a>
            <button
              type="button"
              onClick={() => openComposer('note')}
              className={cn(
                'flex flex-col items-center justify-center gap-1 h-14 rounded-xl border text-[11px] font-semibold transition-colors',
                composerType === 'note'
                  ? 'border-zeronix-blue bg-zeronix-blue/10 text-zeronix-blue'
                  : 'border-admin-border bg-admin-bg text-admin-text-secondary hover:border-zeronix-blue/40 hover:text-zeronix-blue'
              )}
            >
              <StickyNote size={15} />
              Note
            </button>
            <button
              type="button"
              onClick={() => openComposer('task')}
              className={cn(
                'flex flex-col items-center justify-center gap-1 h-14 rounded-xl border text-[11px] font-semibold transition-colors',
                composerType === 'task'
                  ? 'border-zeronix-blue bg-zeronix-blue/10 text-zeronix-blue'
                  : 'border-admin-border bg-admin-bg text-admin-text-secondary hover:border-zeronix-blue/40 hover:text-zeronix-blue'
              )}
            >
              <ListTodo size={15} />
              Task
            </button>
          </div>

          {composerType && (
            <div className="px-5 py-3 border-b border-admin-border flex-shrink-0 space-y-2 bg-admin-bg/50">
              <Textarea
                value={activityNotes}
                onChange={(e) => setActivityNotes(e.target.value)}
                placeholder={`Add ${composerType} notes...`}
                className="rounded-lg resize-none min-h-[60px] text-[13px] bg-admin-bg border-admin-border"
              />
              {composerType === 'task' && (
                <Input
                  type="date"
                  value={activityDueDate}
                  onChange={(e) => setActivityDueDate(e.target.value)}
                  className="h-[34px] text-[13px] rounded-lg w-auto bg-admin-bg border-admin-border"
                />
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={resetComposer} className="h-[30px] text-[12px] rounded-lg">
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveComposer}
                  disabled={addActivity.isPending}
                  className="h-[30px] text-[12px] rounded-lg bg-zeronix-blue text-white hover:bg-zeronix-blue-hover"
                >
                  {addActivity.isPending ? <Spinner size={12} className="mr-1.5" /> : null} Save
                </Button>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="px-5 border-b border-admin-border flex-shrink-0">
            <PageTabs tabs={tabs} value={activeTab} onChange={setActiveTab} />
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'overview' && (
              <div className="p-5 space-y-5">
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-admin-text-muted">About</h4>
                  <div className="bg-admin-bg border border-admin-border rounded-xl divide-y divide-admin-border">
                    <InfoRow icon={Briefcase} label="Job Title" value={contact.designation} />
                    <InfoRow icon={Mail} label="Email" value={contact.email} />
                    <InfoRow icon={Phone} label="Phone" value={contact.phone || contact.mobile} />
                    <InfoRow icon={Building2} label="Company" value={contact.customer?.company} />
                    <InfoRow icon={Globe} label="Website" value={contact.customer?.website} />
                    {contact.customer?.address && (
                      <InfoRow icon={MapPin} label="Location" value={contact.customer.address} />
                    )}
                    <InfoRow
                      icon={Calendar}
                      label="Customer Since"
                      value={
                        contact.created_at
                          ? new Date(contact.created_at).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : undefined
                      }
                    />
                  </div>
                </div>

                {contact.customer && (
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-admin-text-muted">Company</h4>
                    <button
                      type="button"
                      onClick={() => navigate(`${getBasePath()}/companies/${contact.customer_id}`)}
                      className="w-full text-left bg-admin-bg border border-admin-border rounded-xl p-4 hover:border-zeronix-blue/40 transition-colors"
                    >
                      <p className="text-sm font-bold text-admin-text-primary">
                        {contact.customer.company || contact.customer.name}
                      </p>
                      {contact.customer.industry && (
                        <p className="text-xs text-admin-text-secondary mt-0.5">{contact.customer.industry}</p>
                      )}
                      {contact.customer.website && (
                        <p className="text-xs text-zeronix-blue mt-1">{contact.customer.website}</p>
                      )}
                    </button>
                  </div>
                )}

                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-admin-text-muted">Tags</h4>
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {contactTags.map((tag) => (
                      <span
                        key={tag.id}
                        style={tag.color ? { backgroundColor: `${tag.color}1A`, color: tag.color } : undefined}
                        className={cn(
                          'inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-full text-[11px] font-semibold',
                          !tag.color && 'bg-zeronix-blue/10 text-zeronix-blue'
                        )}
                      >
                        {tag.name}
                        <button
                          type="button"
                          onClick={() => detachTag.mutate(tag.id)}
                          className="hover:opacity-70 rounded-full p-0.5"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                    <Popover open={tagPickerOpen} onOpenChange={setTagPickerOpen}>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold border border-dashed border-admin-border text-admin-text-muted hover:border-zeronix-blue/40 hover:text-zeronix-blue transition-colors"
                        >
                          <Plus size={11} /> Add Tag
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-0" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder="Search or create tag..."
                            value={tagSearch}
                            onValueChange={setTagSearch}
                          />
                          <CommandList>
                            {filteredTags.length === 0 && !tagSearch.trim() && (
                              <CommandEmpty>No tags yet.</CommandEmpty>
                            )}
                            <CommandGroup>
                              {filteredTags.map((tag) => (
                                <CommandItem
                                  key={tag.id}
                                  onSelect={() => {
                                    attachTag.mutate(tag.id);
                                    setTagPickerOpen(false);
                                    setTagSearch('');
                                  }}
                                >
                                  {tag.name}
                                </CommandItem>
                              ))}
                              {tagSearch.trim() && !tagExists && (
                                <CommandItem onSelect={() => createTag.mutate(tagSearch.trim())}>
                                  <Plus size={12} /> Create "{tagSearch.trim()}"
                                </CommandItem>
                              )}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-admin-text-muted">
                    Lifetime Value
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <StatCard
                      title="Lifetime Value"
                      value={<CurrencyAmount amount={contact.lifetime_value} currency={currency} />}
                      icon={<Wallet size={14} />}
                    />
                    <StatCard title="Deals" value={contact.deals_count ?? 0} icon={<Handshake size={14} />} />
                    <StatCard title="Invoices" value={contact.invoices_count ?? 0} icon={<Receipt size={14} />} />
                    <StatCard title="Quotes" value={contact.quotes_count ?? 0} icon={<FileText size={14} />} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="p-5">
                {(data?.activities ?? []).length === 0 ? (
                  <p className="text-xs text-admin-text-muted text-center py-10">No activity logged yet.</p>
                ) : (
                  <div className="space-y-2">
                    {(data?.activities ?? []).map((activity) => {
                      const meta = ACTIVITY_TYPES.find((t) => t.id === activity.type);
                      const Icon = meta?.icon ?? StickyNote;
                      return (
                        <div key={activity.id} className="flex gap-2.5 p-3 bg-admin-bg border border-admin-border rounded-lg">
                          <div className="h-8 w-8 rounded-lg bg-zeronix-blue/10 flex items-center justify-center flex-shrink-0">
                            <Icon size={14} className="text-zeronix-blue" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-admin-text-primary capitalize">
                                {meta?.label ?? activity.type}
                              </span>
                              {activity.created_at && (
                                <span className="text-[10px] text-admin-text-muted flex-shrink-0">
                                  {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                                </span>
                              )}
                            </div>
                            {activity.notes && (
                              <p className="text-xs text-admin-text-secondary mt-1 whitespace-pre-wrap">{activity.notes}</p>
                            )}
                            {activity.user?.name && (
                              <p className="text-[10px] text-admin-text-muted mt-1.5">by {activity.user.name}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'deals' && (
              <div className="p-5 space-y-2">
                {(data?.deals ?? []).length === 0 ? (
                  <p className="text-xs text-admin-text-muted text-center py-10">No deals yet.</p>
                ) : (
                  (data?.deals ?? []).map((deal) => (
                    <button
                      key={deal.id}
                      type="button"
                      onClick={() => navigate(`${getBasePath()}/deals`)}
                      className="w-full text-left flex items-center justify-between gap-2 p-3 bg-admin-bg border border-admin-border rounded-lg hover:border-zeronix-blue/40 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-admin-text-primary truncate">{deal.title}</p>
                        <p className="text-[10px] text-admin-text-muted mt-0.5 capitalize">{deal.stage}</p>
                      </div>
                      <span className="text-xs font-semibold text-admin-text-secondary flex-shrink-0">
                        <CurrencyAmount amount={deal.value} currency={currency} />
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}

            {activeTab === 'quotes' && (
              <div className="p-5 space-y-2">
                {(data?.quotes ?? []).length === 0 ? (
                  <p className="text-xs text-admin-text-muted text-center py-10">No quotes yet.</p>
                ) : (
                  (data?.quotes ?? []).map((quote) => (
                    <button
                      key={quote.id}
                      type="button"
                      onClick={() => navigate(`${getBasePath()}/quotes/${quote.id}`)}
                      className="w-full text-left flex items-center justify-between gap-2 p-3 bg-admin-bg border border-admin-border rounded-lg hover:border-zeronix-blue/40 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-admin-text-primary truncate">
                          {quote.quote_number || `Quote #${quote.id}`}
                        </p>
                        <p className="text-[10px] text-admin-text-muted mt-0.5 capitalize">{quote.status}</p>
                      </div>
                      <span className="text-xs font-semibold text-admin-text-secondary flex-shrink-0">
                        <CurrencyAmount amount={quote.total} currency={currency} />
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}

            {activeTab === 'invoices' && (
              <div className="p-5 space-y-2">
                {(data?.invoices ?? []).length === 0 ? (
                  <p className="text-xs text-admin-text-muted text-center py-10">No invoices yet.</p>
                ) : (
                  (data?.invoices ?? []).map((invoice) => (
                    <button
                      key={invoice.id}
                      type="button"
                      onClick={() => navigate(`${getBasePath()}/invoices/${invoice.id}`)}
                      className="w-full text-left flex items-center justify-between gap-2 p-3 bg-admin-bg border border-admin-border rounded-lg hover:border-zeronix-blue/40 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-admin-text-primary truncate">
                          {invoice.invoice_number || `Invoice #${invoice.id}`}
                        </p>
                        <p className="text-[10px] text-admin-text-muted mt-0.5 capitalize">{invoice.status}</p>
                      </div>
                      <span className="text-xs font-semibold text-admin-text-secondary flex-shrink-0">
                        <CurrencyAmount amount={invoice.total} currency={currency} />
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}

            {activeTab === 'files' && (
              <div className="p-5">
                <p className="text-xs text-admin-text-muted text-center py-10">File attachments coming soon.</p>
              </div>
            )}
          </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
