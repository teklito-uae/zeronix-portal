import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/shared/Spinner';
import { toast } from 'sonner';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { formatMoney, type CurrencyCode } from '@/lib/currency';
import type { Template } from '@/types';
import {
  FileText,
  Receipt,
  ShoppingCart,
  CreditCard,
  ClipboardList,
  Truck,
  Save,
  CheckCircle2,
  Info,
  Code,
  Eye,
  Star,
  ChevronRight,
  Layout,
  Mail,
} from 'lucide-react';

/* ── Constants ──────────────────────────────────────── */

const DOC_TYPES = [
  { type: 'quote',         label: 'Quotation',       icon: FileText },
  { type: 'invoice',       label: 'Tax Invoice',     icon: Receipt },
  { type: 'sales_order',   label: 'Sales Order',     icon: ShoppingCart },
  { type: 'payment_slip',  label: 'Payment Receipt', icon: CreditCard },
  { type: 'purchase_bill', label: 'Purchase Bill',   icon: ClipboardList },
  { type: 'delivery_note', label: 'Delivery Note',   icon: Truck },
] as const;

type DocType = typeof DOC_TYPES[number]['type'];

/* ── Mock data for preview ──────────────────────────── */

const buildMockData = (currency: CurrencyCode): Record<string, string> => ({
  '{brand_color}': '#0F52BA',
  '{logo}': '<h2 style="color:#0F52BA;margin:0;">COMPANY</h2>',
  '{logo_url}': '',
  '{company_name}': 'Zeronix Trading LLC',
  '{company_email}': 'info@zeronix.ae',
  '{company_phone}': '+971 4 123 4567',
  '{company_address}': 'Business Bay, Dubai, UAE',
  '{tax_number_label}': 'TRN',
  '{tax_number}': '100123456700003',
  '{customer_name}': 'Ahmed Al-Rashid',
  '{customer_company}': 'Gulf Enterprises FZE',
  '{customer_email}': 'ahmed@gulfent.ae',
  '{customer_address}': 'Deira, Dubai, UAE',
  '{date}': '22 Jul 2026',
  '{valid_until}': '22 Aug 2026',
  '{due_date}': '21 Aug 2026',
  '{quote_number}': 'QT-2026-001',
  '{invoice_number}': 'INV-2026-001',
  '{order_number}': 'SO-2026-001',
  '{receipt_number}': 'RCP-2026-001',
  '{bill_number}': 'PB-2026-001',
  '{delivery_number}': 'DN-2026-001',
  '{delivery_date}': '25 Jul 2026',
  '{order_reference}': 'SO-2026-001',
  '{payment_date}': '20 Jul 2026',
  '{payment_method}': 'Bank Transfer',
  '{reference_id}': 'TXN-789456',
  '{amount}': formatMoney(5250, currency),
  '{amount_in_words}': 'FIVE THOUSAND TWO HUNDRED AND FIFTY DIRHAMS ONLY',
  '{notes}': 'Thank you for your business.',
  '{supplier_name}': 'Al Futtaim Electronics',
  '{supplier_email}': 'orders@alfuttaim.ae',
  '{supplier_phone}': '+971 4 987 6543',
  '{supplier_address}': 'Jebel Ali, Dubai, UAE',
  '{subtotal}': formatMoney(5000, currency),
  '{vat_amount}': formatMoney(250, currency),
  '{total_amount}': formatMoney(5250, currency),
  '{total_in_words}': 'FIVE THOUSAND TWO HUNDRED AND FIFTY DIRHAMS ONLY',
  '{items}': `
    <tr class="item-row">
      <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 10px;">1</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 10px;">
        <div style="font-weight: 700; color: #111827;">Premium Service Package</div>
        <div style="font-size: 9px; color: #6b7280;">Monthly maintenance & support</div>
      </td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 10px;">2.00</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 10px;">1,500.00</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 10px;">150.00</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 10px;">3,000.00</td>
    </tr>
    <tr class="item-row">
      <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 10px;">2</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 10px;">
        <div style="font-weight: 700; color: #111827;">Installation Fee</div>
        <div style="font-size: 9px; color: #6b7280;">One-time setup charge</div>
      </td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 10px;">1.00</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 10px;">2,000.00</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 10px;">100.00</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 10px;">2,000.00</td>
    </tr>
  `,
  '{tax_summary}': `
    <table style="width: 100%; margin-top: 15px;">
      <thead>
        <tr style="background: #f9fafb;">
          <th style="padding: 6px 12px; text-align: left; border-bottom: 2px solid #eee; font-size: 9px;">Tax Details</th>
          <th style="padding: 6px 12px; text-align: right; border-bottom: 2px solid #eee; font-size: 9px;">Taxable Amount</th>
          <th style="padding: 6px 12px; text-align: right; border-bottom: 2px solid #eee; font-size: 9px;">Tax Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding: 6px 12px; border-bottom: 1px solid #eee; font-size: 9px;">Standard Rate (5%)</td>
          <td style="padding: 6px 12px; border-bottom: 1px solid #eee; text-align: right; font-size: 9px;">${formatMoney(5000, currency)}</td>
          <td style="padding: 6px 12px; border-bottom: 1px solid #eee; text-align: right; font-size: 9px;">${formatMoney(250, currency)}</td>
        </tr>
      </tbody>
    </table>
  `,
});

/* ── Component ──────────────────────────────────────── */

export const DocumentDesigner = () => {
  const queryClient = useQueryClient();
  const currency = useCurrencyStore((s) => s.currency);
  const mockData = useMemo(() => buildMockData(currency), [currency]);
  const [activeDocType, setActiveDocType] = useState<DocType>('quote');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templateForm, setTemplateForm] = useState<Partial<Template>>({});
  const [editorView, setEditorView] = useState<'code' | 'preview'>('code');

  /* ── Data Fetching ── */

  const { data: templates = [] } = useQuery<Template[]>({
    queryKey: ['templates'],
    queryFn: async () => {
      const res = await api.get('/admin/templates');
      return res.data;
    },
  });

  const { data: docTypes } = useQuery({
    queryKey: ['template-types'],
    queryFn: async () => {
      const res = await api.get('/admin/templates/types');
      return res.data as { type: string; label: string; icon: string; placeholders: { key: string; label: string }[] }[];
    },
  });

  /* ── Filter templates by active doc type ── */

  const filteredTemplates = useMemo(
    () => templates.filter((t) => t.type === activeDocType),
    [templates, activeDocType]
  );

  /* ── Auto-select first template on doc type change ── */

  useEffect(() => {
    if (filteredTemplates.length > 0) {
      const def = filteredTemplates.find((t) => t.is_default) || filteredTemplates[0];
      handleSelectTemplate(def);
    } else {
      setSelectedTemplate(null);
      setTemplateForm({});
    }
  }, [activeDocType, filteredTemplates.length]);

  const handleSelectTemplate = (t: Template) => {
    setSelectedTemplate(t);
    setTemplateForm({ ...t });
    setEditorView('code');
  };

  /* ── Mutations ── */

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Template>) => {
      const res = await api.put(`/admin/templates/${selectedTemplate?.id}`, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Template saved');
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
    onError: () => toast.error('Failed to save template'),
  });

  const handleSave = () => {
    if (templateForm) updateMutation.mutate(templateForm);
  };

  /* ── Preview renderer ── */

  const renderPreview = (content: string) => {
    let preview = content;
    Object.entries(mockData).forEach(([key, val]) => {
      preview = preview.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), val);
    });
    return preview;
  };

  /* ── Get placeholders for current doc type ── */

  const currentPlaceholders = useMemo(() => {
    if (!docTypes) return [];
    const dt = docTypes.find((d) => d.type === activeDocType);
    return dt?.placeholders || [];
  }, [docTypes, activeDocType]);

  /* ── Template count per type ── */

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    templates.forEach((t) => {
      counts[t.type] = (counts[t.type] || 0) + 1;
    });
    return counts;
  }, [templates]);

  /* ── Render ── */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-admin-surface/90 backdrop-blur-xl border border-white/5 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-admin-text-primary tracking-tight">Document Designer</h3>
          <p className="text-xs text-admin-text-muted mt-1">Choose a document type, select a template, and customize. Brand settings apply automatically.</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending || !selectedTemplate}
          className="bg-gradient-to-r from-zeronix-blue to-blue-600 hover:from-blue-600 hover:to-zeronix-blue text-white h-10 px-8 rounded-xl shadow-lg shadow-zeronix-blue/30 transition-all duration-300"
        >
          {updateMutation.isPending ? <Spinner size={16} className="mr-2" /> : <Save size={16} className="mr-2" />}
          Save Template
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* ── Left Sidebar: Doc Type + Template Picker ── */}
        <div className="xl:col-span-3 space-y-4">
          {/* Doc Type Switcher */}
          <Card className="bg-admin-surface/80 backdrop-blur-xl border-white/5 rounded-2xl overflow-hidden shadow-xl">
            <CardHeader className="bg-admin-bg/30 border-b border-white/5 p-4">
              <div className="flex items-center gap-2 text-zeronix-blue">
                <Layout size={16} />
                <CardTitle className="text-[11px] uppercase tracking-widest font-bold">Document Type</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-2">
              <nav className="flex flex-col space-y-1">
                {DOC_TYPES.map((dt) => {
                  const Icon = dt.icon;
                  const count = typeCounts[dt.type] || 0;
                  const isActive = activeDocType === dt.type;
                  return (
                    <button
                      key={dt.type}
                      onClick={() => setActiveDocType(dt.type)}
                      className={cn(
                        'w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all flex items-center justify-between group',
                        isActive
                          ? 'bg-zeronix-blue text-white shadow-lg shadow-zeronix-blue/30 font-bold'
                          : 'text-admin-text-secondary hover:text-admin-text-primary hover:bg-admin-bg/50'
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon size={15} className={isActive ? 'text-white' : 'text-admin-text-muted group-hover:text-zeronix-blue'} />
                        <span className="tracking-wide">{dt.label}</span>
                      </div>
                      <span
                        className={cn(
                          'text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center',
                          isActive ? 'bg-white/20 text-white' : 'bg-admin-bg text-admin-text-muted'
                        )}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>

          {/* Template List for this Type */}
          <Card className="bg-admin-surface/80 backdrop-blur-xl border-white/5 rounded-2xl overflow-hidden shadow-xl">
            <CardHeader className="bg-admin-bg/30 border-b border-white/5 p-4">
              <div className="flex items-center gap-2 text-zeronix-blue">
                <FileText size={16} />
                <CardTitle className="text-[11px] uppercase tracking-widest font-bold">Templates</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-2">
              {filteredTemplates.length === 0 ? (
                <p className="text-xs text-admin-text-muted text-center py-6 italic">No templates found</p>
              ) : (
                <div className="space-y-1">
                  {filteredTemplates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleSelectTemplate(t)}
                      className={cn(
                        'w-full text-left px-4 py-3 rounded-xl text-xs transition-all flex justify-between items-center group',
                        selectedTemplate?.id === t.id
                          ? 'bg-zeronix-blue/10 text-zeronix-blue border border-zeronix-blue/20 font-bold'
                          : 'hover:bg-admin-bg text-admin-text-secondary border border-transparent'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <ChevronRight
                          size={12}
                          className={cn(
                            'transition-transform',
                            selectedTemplate?.id === t.id ? 'text-zeronix-blue rotate-90' : 'text-admin-text-muted'
                          )}
                        />
                        {t.name}
                      </div>
                      {t.is_default && (
                        <span className="text-[8px] bg-zeronix-blue text-white px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                          <Star size={8} />
                          DEFAULT
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Placeholders */}
          <Card className="bg-admin-surface/80 backdrop-blur-xl border-white/5 rounded-2xl overflow-hidden shadow-xl">
            <CardHeader className="bg-admin-bg/30 border-b border-white/5 p-4">
              <div className="flex items-center gap-2 text-zeronix-blue">
                <Info size={16} />
                <CardTitle className="text-[11px] uppercase tracking-widest font-bold">Variables</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-3 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-admin-border">
              <div className="grid grid-cols-1 gap-1">
                {currentPlaceholders.map((p) => (
                  <div
                    key={p.key}
                    className="flex items-center justify-between group p-2 rounded-lg hover:bg-admin-bg/50 transition-colors cursor-help border border-transparent hover:border-white/5"
                  >
                    <span className="text-[9px] text-admin-text-muted font-bold tracking-wide truncate mr-2">{p.label}</span>
                    <code className="text-[9px] text-zeronix-blue font-mono bg-zeronix-blue/10 px-1.5 py-0.5 rounded-md border border-zeronix-blue/20 shrink-0">
                      {p.key}
                    </code>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right: Editor ── */}
        <div className="xl:col-span-9 space-y-4">
          {!selectedTemplate ? (
            <Card className="bg-admin-surface/80 backdrop-blur-xl border-white/5 rounded-2xl p-12 text-center shadow-xl">
              <Layout size={48} className="mx-auto text-zeronix-blue opacity-50 mb-4" />
              <h3 className="text-xl font-bold text-admin-text-primary mb-2">Select a Template</h3>
              <p className="text-admin-text-muted text-sm">Choose a document type and template from the sidebar to begin editing.</p>
            </Card>
          ) : (
            <>
              {/* Template Info Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Name & Default */}
                <Card className="md:col-span-1 bg-admin-surface/80 backdrop-blur-xl border-white/5 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-admin-text-muted tracking-widest">Template Name</Label>
                    <Input
                      value={templateForm.name || ''}
                      onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                      className="bg-admin-bg/50 border-admin-border/50 h-10 font-bold focus-visible:ring-zeronix-blue/30"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-admin-bg/30 rounded-xl border border-white/5 shadow-inner">
                    <div className="space-y-0.5">
                      <Label htmlFor="def-toggle" className="text-xs font-bold cursor-pointer text-admin-text-primary">Default Template</Label>
                      <p className="text-[10px] text-admin-text-muted">Use as primary design</p>
                    </div>
                    <input
                      type="checkbox"
                      id="def-toggle"
                      className="w-4 h-4 rounded border-admin-border text-zeronix-blue focus:ring-zeronix-blue/50 focus:ring-offset-admin-surface"
                      checked={templateForm.is_default || false}
                      onChange={(e) => setTemplateForm({ ...templateForm, is_default: e.target.checked })}
                    />
                  </div>
                </Card>

                {/* Email Settings */}
                <Card className="md:col-span-2 bg-admin-surface/80 backdrop-blur-xl border-white/5 rounded-2xl p-5 shadow-xl space-y-4">
                  <div className="flex items-center gap-2 mb-1 pb-3 border-b border-white/5">
                    <Mail size={16} className="text-zeronix-blue" />
                    <h4 className="text-sm font-bold tracking-wide">Email Notification Settings</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-admin-text-muted tracking-widest">Email Subject Line</Label>
                      <Input
                        value={templateForm.subject || ''}
                        onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                        className="bg-admin-bg/50 border-admin-border/50 h-10 text-xs focus-visible:ring-zeronix-blue/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-admin-text-muted tracking-widest">Greeting & Message</Label>
                      <Textarea
                        value={templateForm.email_body || ''}
                        onChange={(e) => setTemplateForm({ ...templateForm, email_body: e.target.value })}
                        className="bg-admin-bg/50 border-admin-border/50 min-h-[72px] text-xs resize-none focus-visible:ring-zeronix-blue/30"
                      />
                    </div>
                  </div>
                </Card>
              </div>

              {/* Code / Preview Toggle Editor */}
              <Card className="bg-[#0d1117] border border-admin-border rounded-2xl overflow-hidden shadow-2xl">
                {/* Tab Bar */}
                <div className="bg-[#161b22] border-b border-[#30363d] px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {/* macOS dots */}
                    <div className="flex gap-1.5 mr-4">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]"></div>
                    </div>

                    {/* Toggle Tabs */}
                    <div className="flex bg-[#0d1117] rounded-lg p-0.5 border border-[#30363d]">
                      <button
                        onClick={() => setEditorView('code')}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold transition-all',
                          editorView === 'code'
                            ? 'bg-zeronix-blue text-white shadow-sm'
                            : 'text-[#8b949e] hover:text-[#c9d1d9]'
                        )}
                      >
                        <Code size={12} />
                        Code
                      </button>
                      <button
                        onClick={() => setEditorView('preview')}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold transition-all',
                          editorView === 'preview'
                            ? 'bg-zeronix-blue text-white shadow-sm'
                            : 'text-[#8b949e] hover:text-[#c9d1d9]'
                        )}
                      >
                        <Eye size={12} />
                        PDF Preview
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {editorView === 'code' && (
                      <span className="text-[10px] text-emerald-500 font-mono flex items-center gap-1">
                        <CheckCircle2 size={12} /> HTML5
                      </span>
                    )}
                    {editorView === 'preview' && (
                      <span className="text-[10px] bg-zeronix-blue/20 text-zeronix-blue border border-zeronix-blue/30 px-2 py-0.5 rounded font-bold tracking-widest shadow-[0_0_10px_rgba(15,82,186,0.2)]">
                        A4 PORTRAIT
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                {editorView === 'code' ? (
                  <div className="relative">
                    {/* Line numbers */}
                    <div className="absolute left-0 top-0 bottom-0 w-12 bg-[#0d1117] border-r border-[#30363d] flex flex-col items-center py-6 text-[10px] text-[#484f58] font-mono select-none overflow-hidden">
                      {Array.from({ length: Math.max(25, (templateForm.content?.split('\n').length || 0) + 5) }).map((_, i) => (
                        <div key={i} className="h-[22px] leading-[22px]">{i + 1}</div>
                      ))}
                    </div>
                    <textarea
                      value={templateForm.content || ''}
                      onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
                      className="w-full h-[600px] bg-transparent text-[#e6edf3] p-6 pl-16 font-mono text-xs leading-[22px] resize-none focus:outline-none scrollbar-thin scrollbar-thumb-[#30363d]"
                      spellCheck={false}
                    />
                    <div className="bg-[#161b22] border-t border-[#30363d] px-6 py-2 flex justify-between items-center">
                      <p className="text-[9px] text-[#8b949e]">UTF-8 • HTML • Pre-render enabled</p>
                      <p className="text-[9px] text-[#8b949e]">Lines: {templateForm.content?.split('\n').length || 0}</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-[#1e1e2e] flex justify-center overflow-auto" style={{ minHeight: 650 }}>
                    {/* A4 page container */}
                    <div
                      className="bg-white shadow-2xl"
                      style={{
                        width: '210mm',
                        minHeight: '297mm',
                        padding: '15mm 20mm',
                        transformOrigin: 'top center',
                      }}
                    >
                      <iframe
                        srcDoc={renderPreview(templateForm.content || '')}
                        className="w-full border-none"
                        style={{ minHeight: '267mm', height: '100%' }}
                        title="Template Preview"
                      />
                    </div>
                  </div>
                )}
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
