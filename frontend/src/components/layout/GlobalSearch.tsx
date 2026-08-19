import { getBasePath } from '@/hooks/useBasePath';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Command as CommandPrimitive } from 'cmdk';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, Package, MessageSquare, FileText,
  Receipt, CreditCard, Settings, Activity, Truck,
  User, Clock, Search, ArrowRight, Loader2, X, AlertTriangle,
} from 'lucide-react';
import { getApiErrorMessage } from '@/lib/apiError';
import type { Customer, Supplier, Product, Quote, Invoice } from '@/types';

// ── Types ──────────────────────────────────────────────────────────────────────
interface ResultItem {
  id: string;
  label: string;
  sublabel?: string;
  href: string;
  icon: React.ReactNode;
  group: string;
}

// ── Recent routes ──────────────────────────────────────────────────────────────
const RECENT_KEY = 'zeronix_recent_routes';
const MAX_RECENT = 5;

function getRecent(): { label: string; href: string }[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
}
function pushRecent(label: string, href: string) {
  const next = [{ label, href }, ...getRecent().filter((r) => r.href !== href)].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

// ── Static nav ─────────────────────────────────────────────────────────────────
const getNavItems = (): ResultItem[] => [
  { id: 'nav-dash',  label: 'Dashboard',        href: `${getBasePath()}/dashboard`,        icon: <LayoutDashboard size={14} />, group: 'Navigation' },
  { id: 'nav-comp',  label: 'Companies',         href: `${getBasePath()}/companies`,         icon: <Users size={14} />,           group: 'Navigation' },
  { id: 'nav-supp',  label: 'Suppliers',          href: `${getBasePath()}/suppliers`,          icon: <Truck size={14} />,           group: 'Navigation' },
  { id: 'nav-prod',  label: 'Products',           href: `${getBasePath()}/products`,           icon: <Package size={14} />,         group: 'Navigation' },
  { id: 'nav-enq',   label: 'Enquiries',          href: `${getBasePath()}/enquiries`,          icon: <MessageSquare size={14} />,   group: 'Navigation' },
  { id: 'nav-qt',    label: 'Quotes',             href: `${getBasePath()}/quotes`,             icon: <FileText size={14} />,        group: 'Navigation' },
  { id: 'nav-inv',   label: 'Invoices',           href: `${getBasePath()}/invoices`,           icon: <Receipt size={14} />,         group: 'Navigation' },
  { id: 'nav-pay',   label: 'Payment Receipts',   href: `${getBasePath()}/payment-receipts`,   icon: <CreditCard size={14} />,      group: 'Navigation' },
  { id: 'nav-usr',   label: 'Users',              href: `${getBasePath()}/users`,              icon: <User size={14} />,            group: 'Navigation' },
  { id: 'nav-act',   label: 'Activities',         href: `${getBasePath()}/activities`,         icon: <Activity size={14} />,        group: 'Navigation' },
  { id: 'nav-set',   label: 'Settings',           href: `${getBasePath()}/settings`,           icon: <Settings size={14} />,        group: 'Navigation' },
];

// ── Component ──────────────────────────────────────────────────────────────────
interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GlobalSearch = ({ open, onOpenChange }: GlobalSearchProps) => {
  const navigate = useNavigate();
  const admin = useAuthStore((s) => s.admin);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [recent, setRecent] = useState<{ label: string; href: string }[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: this dialog instance persists across opens/closes, so state is reset via an `open` effect rather than on mount; also focuses the input, a real DOM side effect.
      setQuery('');
      setResults([]);
      setSearchError(null);
      setRecent(getRecent());
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Debounced search
  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); return; }

    const navItems = getNavItems();
    const navMatches = navItems.filter((item) =>
      item.label.toLowerCase().includes(q.toLowerCase())
    );

    setIsSearching(true);
    setSearchError(null);
    try {
      const [customers, suppliers, products, quotes, invoices] = await Promise.allSettled([
        api.get(`/admin/customers`, { params: { search: q, per_page: 5 } }),
        api.get(`/admin/suppliers`,  { params: { search: q, per_page: 5 } }),
        api.get(`/admin/products`,   { params: { search: q, per_page: 5 } }),
        api.get(`/admin/quotes`,     { params: { search: q, per_page: 5 } }),
        api.get(`/admin/invoices`,   { params: { search: q, per_page: 5 } }),
      ]);

      const items: ResultItem[] = [...navMatches];

      if (customers.status === 'fulfilled') {
        (customers.value.data.data ?? customers.value.data ?? []).forEach((c: Customer) => items.push({
          id: `c-${c.id}`, label: c.name, sublabel: c.company || c.email,
          href: `${getBasePath()}/companies/${c.id}`, icon: <Users size={14} />, group: 'Companies',
        }));
      }
      if (suppliers.status === 'fulfilled') {
        (suppliers.value.data.data ?? suppliers.value.data ?? []).forEach((s: Supplier) => items.push({
          id: `s-${s.id}`, label: s.name, sublabel: s.email,
          href: `${getBasePath()}/suppliers/${s.id}`, icon: <Truck size={14} />, group: 'Suppliers',
        }));
      }
      if (products.status === 'fulfilled') {
        (products.value.data.data ?? products.value.data ?? []).forEach((p: Product) => items.push({
          id: `p-${p.id}`, label: p.name, sublabel: p.model_code,
          href: `${getBasePath()}/products/${p.id}`, icon: <Package size={14} />, group: 'Products',
        }));
      }
      if (quotes.status === 'fulfilled') {
        (quotes.value.data.data ?? []).forEach((q: Quote) => items.push({
          id: `qt-${q.id}`, label: q.quote_number || `#${q.id}`, sublabel: q.customer?.name,
          href: `${getBasePath()}/quotes/${q.id}`, icon: <FileText size={14} />, group: 'Quotes',
        }));
      }
      if (invoices.status === 'fulfilled') {
        (invoices.value.data.data ?? []).forEach((inv: Invoice) => items.push({
          id: `inv-${inv.id}`, label: inv.invoice_number || `#${inv.id}`, sublabel: inv.customer?.name,
          href: `${getBasePath()}/invoices/${inv.id}`, icon: <Receipt size={14} />, group: 'Invoices',
        }));
      }

      const failed = [customers, suppliers, products, quotes, invoices].filter((r) => r.status === 'rejected');
      if (failed.length > 0) {
        setSearchError(`${failed.length} of 5 search sources failed — results may be incomplete.`);
      }

      setResults(items);
    } catch (err) {
      setResults(navMatches);
      setSearchError(getApiErrorMessage(err, 'Search failed — showing navigation matches only.'));
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: schedules a debounced async search (external timer + API calls) each time `query` changes; setResults/setIsSearching here are cancelling/kicking off that side effect, not deriving render output.
    if (query.trim().length < 2) { setResults([]); setIsSearching(false); return; }
    setIsSearching(true);
    debounceRef.current = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, doSearch]);

  const handleSelect = (label: string, href: string) => {
    pushRecent(label, href);
    navigate(href);
    onOpenChange(false);
  };

  // Group results
  const grouped = results.reduce<Record<string, ResultItem[]>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  const showEmpty = query.trim().length >= 2 && !isSearching && results.length === 0;
  const showRecent = query.trim().length < 2;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-full max-w-xl -translate-x-1/2 -translate-y-1/2",
            "bg-brand-white border border-brand-border rounded-xl shadow-2xl overflow-hidden",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-100",
            "duration-150"
          )}
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">Global Search</DialogPrimitive.Title>

          <CommandPrimitive shouldFilter={false} className="flex flex-col">
            <div className="flex items-center gap-2 px-4 h-12 border-b border-brand-border">
              {isSearching
                ? <Loader2 size={15} className="text-brand-subtle shrink-0 animate-spin" />
                : <Search size={15} className="text-brand-subtle shrink-0" />
              }
              <CommandPrimitive.Input
                ref={inputRef}
                value={query}
                onValueChange={setQuery}
                placeholder="Search customers, suppliers, products, quotes…"
                className="flex-1 bg-transparent text-sm text-brand-primary placeholder:text-brand-subtle outline-none border-none focus:ring-0"
              />
              {query && (
                <button onClick={() => setQuery('')} className="text-brand-subtle hover:text-brand-primary transition-colors">
                  <X size={14} />
                </button>
              )}
              <div className="flex items-center gap-0.5 text-[11px] text-brand-subtle border border-brand-border rounded px-1.5 py-0.5 bg-brand-bg">
                ESC
              </div>
            </div>

            <CommandPrimitive.List className="overflow-y-auto max-h-[400px] py-1">
              {searchError && (
                <div className="flex items-start gap-2 mx-2 my-1 px-3 py-2 rounded-md bg-danger/10 text-[11px] text-danger">
                  <AlertTriangle size={12} className="shrink-0 mt-px" />
                  <span>{searchError}</span>
                </div>
              )}

              {showEmpty && (
                <div className="py-10 text-center text-sm text-brand-subtle">
                  No results for "<span className="text-brand-primary font-medium">{query}</span>"
                </div>
              )}

              {showRecent && recent.length > 0 && (
                <CommandPrimitive.Group>
                  <div className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-medium text-brand-subtle uppercase tracking-wider">
                    <Clock size={10} /> Recent
                  </div>
                  {recent.map((r, i) => (
                    <CommandPrimitive.Item
                      key={i}
                      value={`recent-${r.href}`}
                      onSelect={() => handleSelect(r.label, r.href)}
                      className="flex items-center gap-3 px-4 py-2 mx-1 rounded-md cursor-pointer text-sm data-[selected=true]:bg-brand-bg transition-colors"
                    >
                      <ArrowRight size={12} className="text-brand-subtle shrink-0" />
                      <span className="text-brand-primary flex-1">{r.label}</span>
                      <span className="text-[11px] text-brand-subtle truncate max-w-[160px]">{r.href}</span>
                    </CommandPrimitive.Item>
                  ))}
                </CommandPrimitive.Group>
              )}

              {showRecent && (
                <>
                  {recent.length > 0 && <div className="mx-4 my-1 h-px bg-brand-border" />}
                  <CommandPrimitive.Group>
                    <div className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-medium text-brand-subtle uppercase tracking-wider">
                      Quick Navigate
                    </div>
                    <div className="grid grid-cols-2 gap-1 px-2 pb-2">
                      {getNavItems().map((item) => (
                        <CommandPrimitive.Item
                          key={item.id}
                          value={item.id}
                          onSelect={() => handleSelect(item.label, item.href)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-md cursor-pointer text-sm data-[selected=true]:bg-brand-bg transition-colors"
                        >
                          <span className="text-brand-subtle">{item.icon}</span>
                          <span className="text-brand-secondary text-xs">{item.label}</span>
                        </CommandPrimitive.Item>
                      ))}
                    </div>
                  </CommandPrimitive.Group>
                </>
              )}

              {!showRecent && Object.entries(grouped).map(([group, items], gi) => (
                <React.Fragment key={group}>
                  {gi > 0 && <div className="mx-4 my-1 h-px bg-brand-border" />}
                  <CommandPrimitive.Group>
                    <div className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-medium text-brand-subtle uppercase tracking-wider">
                      {group}
                      <span className="ml-1 bg-brand-bg text-brand-subtle px-1 rounded text-[10px]">{items.length}</span>
                    </div>
                    {items.map((item) => (
                      <CommandPrimitive.Item
                        key={item.id}
                        value={item.id}
                        onSelect={() => handleSelect(item.label, item.href)}
                        className="flex items-center gap-2.5 px-4 py-2 mx-1 rounded-md cursor-pointer text-sm data-[selected=true]:bg-brand-bg group transition-colors"
                      >
                        <span className="text-brand-subtle shrink-0">{item.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-brand-primary text-sm truncate">{item.label}</p>
                          {item.sublabel && (
                            <p className="text-[11px] text-brand-subtle truncate">{item.sublabel}</p>
                          )}
                        </div>
                        <ArrowRight size={12} className="text-brand-subtle opacity-0 group-data-[selected=true]:opacity-100 shrink-0 transition-opacity" />
                      </CommandPrimitive.Item>
                    ))}
                  </CommandPrimitive.Group>
                </React.Fragment>
              ))}
            </CommandPrimitive.List>

            <div className="border-t border-brand-border px-4 py-2 flex items-center gap-4 text-[11px] text-brand-subtle bg-brand-bg/50">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded border border-brand-border bg-brand-bg text-[10px]">↑↓</kbd> Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded border border-brand-border bg-brand-bg text-[10px]">↵</kbd> Open
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded border border-brand-border bg-brand-bg text-[10px]">ESC</kbd> Close
              </span>
              {admin && (
                <span className="ml-auto flex items-center gap-1.5 text-[11px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
                  {admin.name}
                </span>
              )}
            </div>
          </CommandPrimitive>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
