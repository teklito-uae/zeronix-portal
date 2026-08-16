import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { Spinner } from '@/components/shared/Spinner';
import {
  Mail,
  Save,
  ArrowUpRight, 
  ArrowDownLeft, 
  User, 
  FileText, 
  CheckCircle2,
  Palette,
  Upload,
  Layout,
  Settings as SettingsIcon,
  Tag,
  Trash2,
  Plus,
  Contact2
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DocumentDesigner } from './settings/DocumentDesigner';
import { GoogleContactsSettings } from './settings/GoogleContactsSettings';
import { CURRENCY_LIST, type CurrencyCode } from '@/lib/currency';
import { CurrencyIcon } from '@/components/shared/CurrencyIcon';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import type { AxiosError } from 'axios';

interface EmailSettingsPayload {
  smtp_host?: string;
  smtp_port?: string | number;
  smtp_username?: string;
  smtp_password?: string;
  smtp_encryption?: string;
  imap_host?: string;
  imap_port?: string | number;
  imap_username?: string;
  imap_password?: string;
  imap_encryption?: string;
}

export const Settings = () => {
  const [activeTab, setActiveTab] = useState('brand');
  const [newTerm, setNewTerm] = useState('');
  const adminUser = useAuthStore((state) => state.admin);
  const setAdmin = useAuthStore((state) => state.setAdmin);
  const queryClient = useQueryClient();

  // --- BRAND SETTINGS STATE ---
  const [brandForm, setBrandForm] = useState({
    company_name: '',
    company_email: '',
    company_phone: '',
    company_address: '',
    tax_number: '',
    tax_number_label: 'TRN',
    primary_color: '#0F52BA',
    logo: null as File | null,
    logo_path: '',
    quote_prefix: 'QT-',
    invoice_prefix: 'INV-',
    sales_order_prefix: 'SO-',
    delivery_prefix: 'DN-',
    purchase_bill_prefix: 'PB-',
    deal_prefix: 'ZRNX-DL-',
    lead_prefix: 'ZRNX-LD-',
    customer_prefix: 'ZRNX-CUS-',
    supplier_prefix: 'ZRNX-SUP-',
    receipt_prefix: 'RCP-',
    currency: 'USD' as CurrencyCode,
    base_currency: 'USD' as CurrencyCode,
    payment_terms: ['Due on Receipt', 'Net 7', 'Net 15', 'Net 30', 'Net 45', 'Net 60'] as string[],
    bank_details: '',
    terms_conditions: '',
  });

  const { data: brandSettingsData } = useQuery({
    queryKey: ['brand_settings'],
    queryFn: async () => {
      const res = await api.get('/admin/settings/workspace');
      return res.data?.settings || {};
    },
    enabled: true // Always fetch workspace settings to populate state
  });

  useEffect(() => {
    if (brandSettingsData && Object.keys(brandSettingsData).length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: seeds the brand form from the fetched workspace settings whenever fresh server data lands.
      setBrandForm(prev => ({ ...prev, ...brandSettingsData }));
    }
  }, [brandSettingsData]);

  const saveBrandMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return api.post('/admin/settings/workspace', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: (res) => {
      toast.success('Brand settings saved successfully');
      setBrandForm(prev => ({ ...prev, logo_path: res.data.settings.logo_path || prev.logo_path }));
      useCurrencyStore.getState().setFromSettings(res.data.settings);
      queryClient.invalidateQueries({ queryKey: ['brand_settings'] });
      queryClient.invalidateQueries({ queryKey: ['workspace-settings-currency'] });
    },
    onError: (err: AxiosError<{ message?: string; errors?: Record<string, unknown> }>) => {
      const data = err.response?.data;
      const fieldErrors = data?.errors || data;
      const detail = (fieldErrors && typeof fieldErrors === 'object' ? Object.values(fieldErrors).flat()[0] : null) || data?.message;
      toast.error('Failed to save brand settings', detail ? { description: String(detail) } : undefined);
    },
  });

  const handleBrandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    const settingsPayload: Record<string, unknown> = { ...brandForm };
    delete settingsPayload.logo;

    // Append JSON as a blob or array syntax
    Object.keys(settingsPayload).forEach(key => {
      formData.append(`settings[${key}]`, settingsPayload[key] as string);
    });

    if (brandForm.logo) {
      formData.append('logo', brandForm.logo);
    }
    saveBrandMutation.mutate(formData);
  };

  // --- EMAIL SETTINGS STATE ---
  const [emailForm, setEmailForm] = useState({
    smtp_host: '',
    smtp_port: '',
    smtp_username: '',
    smtp_password: '',
    smtp_encryption: 'tls',
    imap_host: '',
    imap_port: '',
    imap_username: '',
    imap_password: '',
    imap_encryption: 'ssl',
  });

  useEffect(() => {
    if (adminUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: seeds the email form from the auth store's admin user whenever it changes (e.g. after login or a settings save round-trip updates it).
      setEmailForm({
        smtp_host: adminUser.smtp_host || '',
        smtp_port: adminUser.smtp_port?.toString() || '',
        smtp_username: adminUser.smtp_username || '',
        smtp_password: '',
        smtp_encryption: adminUser.smtp_encryption || 'tls',
        imap_host: adminUser.imap_host || '',
        imap_port: adminUser.imap_port?.toString() || '',
        imap_username: adminUser.imap_username || '',
        imap_password: '',
        imap_encryption: adminUser.imap_encryption || 'ssl',
      });
    }
  }, [adminUser]);

  const saveEmailMutation = useMutation({
    mutationFn: async (data: EmailSettingsPayload) => {
      return api.put('/admin/user/smtp', data);
    },
    onSuccess: (res) => {
      setAdmin(res.data.user);
      toast.success('Email settings saved successfully');
    },
    onError: () => {
      toast.error('Failed to save settings');
    }
  });

  const testMailMutation = useMutation({
    mutationFn: async (toEmail?: string) => {
      return api.post('/admin/user/test-email', { to: toEmail });
    },
    onSuccess: (res) => {
      toast.success(res.data.message);
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      toast.error(err.response?.data?.message || 'Failed to send test email');
    }
  });

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: EmailSettingsPayload = { ...emailForm };
    if (!payload.smtp_password) delete payload.smtp_password;
    if (!payload.imap_password) delete payload.imap_password;
    if (payload.smtp_port) payload.smtp_port = parseInt(payload.smtp_port as string);
    if (payload.imap_port) payload.imap_port = parseInt(payload.imap_port as string);
    saveEmailMutation.mutate(payload);
  };

  const copySmtpToImap = () => {
    setEmailForm(prev => ({
      ...prev,
      imap_username: prev.smtp_username,
      imap_password: prev.smtp_password,
    }));
    toast.info('Copied SMTP credentials to IMAP');
  };

  const loadHostingerDefaults = () => {
    setEmailForm(prev => ({
      ...prev,
      smtp_host: 'smtp.hostinger.com',
      smtp_port: '465',
      smtp_encryption: 'ssl',
      imap_host: 'imap.hostinger.com',
      imap_port: '993',
      imap_encryption: 'ssl',
    }));
    toast.info('Hostinger defaults loaded');
  };


  // --- SUB-COMPONENTS ---
  const MENU_GROUPS = [
    {
      title: 'General',
      items: [
        { id: 'brand', label: 'Brand & PDFs', icon: Palette },
        { id: 'templates', label: 'Document Designer', icon: Layout },
      ]
    },
    {
      title: 'Modules & Workflows',
      items: [
        { id: 'preferences', label: 'Currency & Prefixes', icon: SettingsIcon },
        { id: 'payment_terms', label: 'Payment Terms', icon: FileText },
        { id: 'statuses', label: 'Statuses & Colors', icon: CheckCircle2 },
        { id: 'tags', label: 'Global Tags', icon: Tag },
      ]
    },
    {
      title: 'Integrations',
      items: [
        { id: 'email', label: 'Email Config', icon: Mail },
        { id: 'google_contacts', label: 'Google Contacts', icon: Contact2 },
      ]
    },
    {
      title: 'Account',
      items: [
        { id: 'profile', label: 'My Profile', icon: User },
      ]
    }
  ];

  return (
    <div className="relative min-h-[calc(100vh-10rem)] w-full max-w-7xl mx-auto space-y-6">
      {/* HORIZONTAL TABS -> VERTICAL SUB-SIDEBAR */}
      <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="flex flex-col lg:flex-row gap-8 w-full relative z-10 pt-2">
        
        {/* Sub-Sidebar */}
        <aside className="w-full lg:w-64 shrink-0 space-y-8">
          <div>
            <h2 className="text-xl font-bold text-brand-primary tracking-tight">Settings</h2>
            <p className="text-[10px] text-brand-subtle mt-1 uppercase tracking-widest font-bold">Manage workspace preferences</p>
          </div>
          <TabsList className="flex flex-col h-auto bg-transparent border-none p-0 space-y-6 items-stretch">
            {MENU_GROUPS.map((group, idx) => (
              <div key={idx} className="space-y-2">
                <h4 className="text-[9px] font-bold text-brand-subtle uppercase tracking-[0.2em] px-2">{group.title}</h4>
                <nav className="flex flex-col space-y-1">
                  {group.items.map(t => (
                    <TabsTrigger 
                      key={t.id} 
                      value={t.id}
                      className="w-full justify-start rounded-lg px-3 py-2.5 data-[state=active]:bg-brand-accent data-[state=active]:text-white text-brand-secondary hover:text-brand-primary hover:bg-brand-bg transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <t.icon size={16} />
                        <span className="font-bold tracking-wide text-xs">{t.label}</span>
                      </div>
                    </TabsTrigger>
                  ))}
                </nav>
              </div>
            ))}
          </TabsList>
        </aside>

        {/* Content Area */}
        <div className="flex-1 min-w-0 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* BRAND TAB */}
          <TabsContent value="brand" className="mt-0">
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-brand-white border border-brand-border p-6 rounded-xl shadow-sm">
                <div>
                  <h3 className="text-lg font-bold text-brand-primary">Brand & PDF Settings</h3>
                  <p className="text-sm text-brand-subtle">Configure your company identity for the portal and generated PDFs.</p>
                </div>
                <Button 
                  onClick={handleBrandSubmit} 
                  disabled={saveBrandMutation.isPending}
                  className="bg-brand-accent hover:bg-brand-accent-hover text-white rounded-xl gap-2 h-10 px-6 transition-colors"
                >
                  {saveBrandMutation.isPending ? <Spinner size={16} /> : <Save size={16} />}
                  Save Brand
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6">
                <Card className="bg-brand-white border border-brand-border rounded-xl overflow-hidden shadow-sm">
                  <CardContent className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label className="text-[10px] tracking-widest font-bold text-brand-subtle uppercase">Company Name</Label>
                        <Input value={brandForm.company_name} onChange={e => setBrandForm({...brandForm, company_name: e.target.value})} className="bg-brand-bg/50 border-brand-border/50 h-10 focus-visible:ring-brand-accent/30 focus-visible:bg-brand-bg transition-colors" placeholder="Zeronix LLC" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] tracking-widest font-bold text-brand-subtle uppercase">Brand Color</Label>
                        <div className="flex items-center gap-3">
                          <input 
                            type="color" 
                            value={brandForm.primary_color} 
                            onChange={e => setBrandForm({...brandForm, primary_color: e.target.value})} 
                            className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent p-0 shadow-sm" 
                          />
                          <Input value={brandForm.primary_color} onChange={e => setBrandForm({...brandForm, primary_color: e.target.value})} className="bg-brand-bg/50 border-brand-border/50 h-10 flex-1 font-mono uppercase focus-visible:ring-brand-accent/30" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label className="text-[10px] tracking-widest font-bold text-brand-subtle uppercase">Email Address</Label>
                        <Input type="email" value={brandForm.company_email} onChange={e => setBrandForm({...brandForm, company_email: e.target.value})} className="bg-brand-bg/50 border-brand-border/50 h-10 focus-visible:ring-brand-accent/30" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] tracking-widest font-bold text-brand-subtle uppercase">Phone Number</Label>
                        <Input value={brandForm.company_phone} onChange={e => setBrandForm({...brandForm, company_phone: e.target.value})} className="bg-brand-bg/50 border-brand-border/50 h-10 focus-visible:ring-brand-accent/30" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-[10px] tracking-widest font-bold text-brand-subtle uppercase">Physical Address</Label>
                      <Textarea value={brandForm.company_address} onChange={e => setBrandForm({...brandForm, company_address: e.target.value})} className="bg-brand-bg/50 border-brand-border/50 resize-none focus-visible:ring-brand-accent/30" rows={3} />
                    </div>

                    <div className="grid grid-cols-2 gap-5 border-t border-brand-border pt-6 mt-2">
                      <div className="space-y-2">
                        <Label className="text-[10px] tracking-widest font-bold text-brand-subtle uppercase">Tax Label (e.g., TRN, VAT, GST)</Label>
                        <Input value={brandForm.tax_number_label} onChange={e => setBrandForm({...brandForm, tax_number_label: e.target.value})} className="bg-brand-bg/50 border-brand-border/50 h-10 focus-visible:ring-brand-accent/30" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] tracking-widest font-bold text-brand-subtle uppercase">Tax Number</Label>
                        <Input value={brandForm.tax_number} onChange={e => setBrandForm({...brandForm, tax_number: e.target.value})} className="bg-brand-bg/50 border-brand-border/50 h-10 focus-visible:ring-brand-accent/30" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 border-t border-brand-border pt-6 mt-2">
                      <div className="space-y-2">
                        <Label className="text-[10px] tracking-widest font-bold text-brand-subtle uppercase">Bank Details (For Invoices)</Label>
                        <Textarea value={brandForm.bank_details} onChange={e => setBrandForm({...brandForm, bank_details: e.target.value})} className="bg-brand-bg/50 border-brand-border/50 resize-none focus-visible:ring-brand-accent/30" rows={3} placeholder="Bank Name: ...&#10;Account Number: ...&#10;IBAN: ..." />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] tracking-widest font-bold text-brand-subtle uppercase">Terms & Conditions</Label>
                        <Textarea value={brandForm.terms_conditions} onChange={e => setBrandForm({...brandForm, terms_conditions: e.target.value})} className="bg-brand-bg/50 border-brand-border/50 resize-none focus-visible:ring-brand-accent/30" rows={4} placeholder="1. Goods once sold will not be returned...&#10;2. Warranty void if seal broken..." />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-brand-white border border-brand-border rounded-xl overflow-hidden shadow-sm self-start">
                  <CardHeader className="bg-brand-bg border-b border-brand-border pb-4">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-brand-subtle flex items-center gap-2"><Upload size={14} /> Brand Logo</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {brandForm.logo_path && !brandForm.logo ? (
                      <div className="w-full h-32 rounded-xl bg-white border border-brand-border flex items-center justify-center overflow-hidden p-2">
                        <img src={import.meta.env.VITE_API_URL?.replace('/api', '') + brandForm.logo_path} alt="Logo" className="max-h-full max-w-full object-contain" />
                      </div>
                    ) : brandForm.logo ? (
                      <div className="w-full h-32 rounded-xl bg-white border border-brand-border flex items-center justify-center p-2 text-[12px] font-medium text-brand-primary text-center">
                        {brandForm.logo.name} <br /> (Pending Save)
                      </div>
                    ) : (
                      <div className="w-full h-32 rounded-xl bg-brand-bg border border-brand-border border-dashed flex items-center justify-center flex-col gap-2 text-brand-subtle">
                        <Upload size={24} />
                        <span className="text-[12px]">No logo uploaded</span>
                      </div>
                    )}
                    
                    <div className="pt-2">
                      <Input
                        type="file"
                        accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
                          if (!allowedTypes.includes(file.type)) {
                            toast.error('Unsupported file type', { description: 'Please upload a PNG, JPG, or SVG file.' });
                            e.target.value = '';
                            return;
                          }
                          if (file.size > 2 * 1024 * 1024) {
                            toast.error('File too large', { description: 'Logo must be 2MB or smaller.' });
                            e.target.value = '';
                            return;
                          }
                          setBrandForm({ ...brandForm, logo: file });
                        }}
                        className="text-xs file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-accent/10 file:text-brand-accent hover:file:bg-brand-accent/20"
                      />
                    </div>
                    <p className="text-[11px] text-brand-subtle mt-2">Upload a PNG or JPG (max 2MB). Used in PDF generation.</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* EMAIL TAB */}
          <TabsContent value="email" className="mt-0">
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-brand-white border border-brand-border p-6 rounded-xl shadow-sm">
                <div>
                  <h3 className="text-lg font-bold text-brand-primary">Email & Communication</h3>
                  <p className="text-sm text-brand-subtle">Configure SMTP for outgoing and IMAP for incoming mail.</p>
                </div>
                <Button variant="outline" onClick={loadHostingerDefaults} className="border-brand-accent text-brand-accent hover:bg-brand-accent/10 rounded-xl h-10 px-4">
                  Hostinger Defaults
                </Button>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* SMTP */}
                  <Card className="bg-brand-white border border-brand-border rounded-xl overflow-hidden shadow-sm">
                    <CardHeader className="bg-brand-bg border-b border-brand-border pb-4">
                      <div className="flex items-center gap-2">
                        <ArrowUpRight className="text-green-500" size={16} />
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-brand-subtle">Outgoing (SMTP)</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-5">
                      <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase font-bold text-brand-subtle tracking-widest">Host</Label>
                          <Input value={emailForm.smtp_host} onChange={e => setEmailForm({...emailForm, smtp_host: e.target.value})} className="bg-brand-bg/50 border-brand-border/50 h-10 focus-visible:ring-brand-accent/30" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase font-bold text-brand-subtle tracking-widest">Port</Label>
                          <Input value={emailForm.smtp_port} onChange={e => setEmailForm({...emailForm, smtp_port: e.target.value})} className="bg-brand-bg/50 border-brand-border/50 h-10 focus-visible:ring-brand-accent/30" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-brand-subtle tracking-widest">Username</Label>
                        <Input value={emailForm.smtp_username} onChange={e => setEmailForm({...emailForm, smtp_username: e.target.value})} className="bg-brand-bg/50 border-brand-border/50 h-10 focus-visible:ring-brand-accent/30" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-brand-subtle tracking-widest">Password</Label>
                        <Input type="password" placeholder="••••••••" value={emailForm.smtp_password} onChange={e => setEmailForm({...emailForm, smtp_password: e.target.value})} className="bg-brand-bg/50 border-brand-border/50 h-10 focus-visible:ring-brand-accent/30" />
                      </div>
                    </CardContent>
                  </Card>

                  {/* IMAP */}
                  <Card className="bg-brand-white border border-brand-border rounded-xl overflow-hidden shadow-sm">
                    <CardHeader className="bg-brand-bg border-b border-brand-border pb-4 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ArrowDownLeft className="text-blue-500" size={16} />
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-brand-subtle">Incoming (IMAP)</CardTitle>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={copySmtpToImap} className="text-[10px] h-6 text-brand-accent hover:bg-brand-accent/10 px-2 rounded">Copy Credentials</Button>
                    </CardHeader>
                    <CardContent className="p-8 space-y-5">
                      <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase font-bold text-brand-subtle tracking-widest">Host</Label>
                          <Input value={emailForm.imap_host} onChange={e => setEmailForm({...emailForm, imap_host: e.target.value})} className="bg-brand-bg/50 border-brand-border/50 h-10 focus-visible:ring-brand-accent/30" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase font-bold text-brand-subtle tracking-widest">Port</Label>
                          <Input value={emailForm.imap_port} onChange={e => setEmailForm({...emailForm, imap_port: e.target.value})} className="bg-brand-bg/50 border-brand-border/50 h-10 focus-visible:ring-brand-accent/30" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-brand-subtle tracking-widest">Username</Label>
                        <Input value={emailForm.imap_username} onChange={e => setEmailForm({...emailForm, imap_username: e.target.value})} className="bg-brand-bg/50 border-brand-border/50 h-10 focus-visible:ring-brand-accent/30" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-brand-subtle tracking-widest">Password</Label>
                        <Input type="password" placeholder="••••••••" value={emailForm.imap_password} onChange={e => setEmailForm({...emailForm, imap_password: e.target.value})} className="bg-brand-bg/50 border-brand-border/50 h-10 focus-visible:ring-brand-accent/30" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-brand-white border border-brand-border rounded-xl shadow-sm">
                  <div className="flex items-center gap-4 flex-1 w-full">
                    <div className="flex-1 space-y-1">
                      <Label className="text-[10px] text-brand-subtle uppercase font-bold tracking-widest">Test Delivery</Label>
                      <Input placeholder="Recipient email..." id="test-email-input" className="h-10 bg-brand-bg/50 border-brand-border/50 text-sm focus-visible:ring-brand-accent/30" />
                    </div>
                    <Button type="button" variant="outline" onClick={() => {
                        const input = document.getElementById('test-email-input') as HTMLInputElement;
                        testMailMutation.mutate(input?.value || undefined);
                      }} disabled={testMailMutation.isPending} className="h-9 self-end border-brand-border">
                      {testMailMutation.isPending ? <Spinner size={16} /> : <Mail size={16} />}
                      <span className="ml-2 hidden sm:inline text-xs">Test Email</span>
                    </Button>
                  </div>
                  <Button type="submit" disabled={saveEmailMutation.isPending} className="bg-brand-accent text-white hover:bg-brand-accent-hover h-11 px-8 rounded-xl w-full sm:w-auto">
                    {saveEmailMutation.isPending ? <Spinner size={18} /> : <Save size={18} />}
                    <span className="ml-2 font-medium">Save All Changes</span>
                  </Button>
                </div>
              </form>
            </div>
          </TabsContent>

          {/* TEMPLATES / DOCUMENT DESIGNER TAB */}
          <TabsContent value="templates" className="mt-0">
            <DocumentDesigner />
          </TabsContent>

          {/* GOOGLE CONTACTS TAB */}
          <TabsContent value="google_contacts" className="mt-0">
            <GoogleContactsSettings />
          </TabsContent>

          {/* PROFILE TAB */}
          <TabsContent value="profile" className="mt-0">
            <Card className="bg-brand-white border border-brand-border rounded-xl p-12 text-center max-w-2xl mx-auto shadow-sm">
              <div className="mx-auto w-24 h-24 rounded-full bg-brand-accent/10 flex items-center justify-center mb-6">
                <User size={48} className="text-brand-accent" />
              </div>
              <h3 className="text-xl font-bold text-brand-primary">{adminUser?.name}</h3>
              <p className="text-brand-subtle mb-6">{adminUser?.email}</p>
              <div className="max-w-xs mx-auto space-y-4 text-left">
                <div>
                  <Label className="text-[10px] uppercase text-brand-subtle">Role</Label>
                  <p className="text-sm font-medium capitalize">{adminUser?.role}</p>
                </div>
                <div>
                  <Label className="text-[10px] uppercase text-brand-subtle">Member Since</Label>
                  <p className="text-sm font-medium">{adminUser?.created_at ? new Date(adminUser.created_at).toLocaleDateString() : '—'}</p>
                </div>
              </div>
              <Separator className="my-8 bg-brand-border" />
              <p className="text-xs text-brand-subtle italic">Profile editing is currently managed by System Administrators.</p>
            </Card>
          </TabsContent>
          <TabsContent value="tags" className="mt-0">
            <Card className="bg-brand-white border border-brand-border rounded-xl p-12 text-center max-w-2xl mx-auto shadow-sm">
               <Tag size={48} className="mx-auto text-brand-accent opacity-50 mb-4" />
               <h3 className="text-xl font-bold text-brand-primary mb-2">Global Tags Manager</h3>
               <p className="text-brand-subtle">Coming soon...</p>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="mt-0">
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-brand-white border border-brand-border p-6 rounded-xl shadow-sm">
                <div>
                  <h3 className="text-lg font-bold text-brand-primary tracking-tight">Currency &amp; Document Prefixes</h3>
                  <p className="text-xs text-brand-subtle mt-1">Set your workspace currency and the auto-generated numbering format for transactions.</p>
                </div>
                <Button 
                  onClick={handleBrandSubmit} 
                  disabled={saveBrandMutation.isPending}
                  className="bg-brand-accent hover:bg-brand-accent-hover text-white rounded-xl h-10 px-6 font-bold transition-colors"
                >
                  {saveBrandMutation.isPending ? <Spinner size={16} /> : <Save size={16} className="mr-2" />}
                  Save Changes
                </Button>
              </div>

              <Card className="bg-brand-white border border-brand-border rounded-xl p-6 shadow-sm">
                <div className="space-y-2 max-w-2xl mb-2">
                  <h4 className="text-sm font-bold text-brand-primary">Currency</h4>
                  <p className="text-xs text-brand-subtle">Choose the currency used across quotes, invoices, and reports.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mb-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-brand-subtle tracking-widest">Currency</Label>
                    <Select
                      value={brandForm.currency}
                      onValueChange={(value: CurrencyCode) => setBrandForm({ ...brandForm, currency: value })}
                    >
                      <SelectTrigger className="bg-brand-bg/50 border-brand-border/50 h-10">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCY_LIST.map(c => (
                          <SelectItem key={c.code} value={c.code}>
                            <div className="flex items-center gap-2">
                              <CurrencyIcon currency={c.code} size={14} />
                              <span>{c.name} ({c.code})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-brand-subtle">Example: <strong>{brandForm.currency === 'USD' ? '$1,250.00' : '1,250.00 AED'}</strong></p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-brand-subtle tracking-widest">Base Currency</Label>
                    <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-brand-border/50 bg-brand-bg/30 text-sm font-medium text-brand-secondary">
                      <CurrencyIcon currency={brandForm.base_currency} size={14} />
                      <span>{brandForm.base_currency} (fixed)</span>
                    </div>
                    <p className="text-[10px] text-brand-subtle">All amounts are recorded in this base currency; no conversion is applied yet.</p>
                  </div>
                </div>
                <Separator className="bg-brand-border/50 mb-6" />
                <form className="space-y-6 max-w-2xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-brand-subtle tracking-widest">Quote Prefix</Label>
                      <Input 
                        value={brandForm.quote_prefix || ''} 
                        onChange={e => setBrandForm({...brandForm, quote_prefix: e.target.value})}
                        placeholder="e.g. QT-"
                        className="bg-brand-bg/50 border-brand-border/50 h-10 font-medium focus-visible:ring-brand-accent/30" 
                      />
                      <p className="text-[10px] text-brand-subtle">Example: <strong>{brandForm.quote_prefix || 'QT-'}2024-001</strong></p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-brand-subtle tracking-widest">Invoice Prefix</Label>
                      <Input 
                        value={brandForm.invoice_prefix || ''} 
                        onChange={e => setBrandForm({...brandForm, invoice_prefix: e.target.value})}
                        placeholder="e.g. INV-"
                        className="bg-brand-bg/50 border-brand-border/50 h-10 font-medium focus-visible:ring-brand-accent/30" 
                      />
                      <p className="text-[10px] text-brand-subtle">Example: <strong>{brandForm.invoice_prefix || 'INV-'}2024-001</strong></p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-brand-subtle tracking-widest">Sales Order Prefix</Label>
                      <Input 
                        value={brandForm.sales_order_prefix || ''} 
                        onChange={e => setBrandForm({...brandForm, sales_order_prefix: e.target.value})}
                        placeholder="e.g. SO-"
                        className="bg-brand-bg/50 border-brand-border/50 h-10 font-medium focus-visible:ring-brand-accent/30" 
                      />
                      <p className="text-[10px] text-brand-subtle">Example: <strong>{brandForm.sales_order_prefix || 'SO-'}2024-001</strong></p>
                    </div>
                  </div>
                </form>
              </Card>

              <Card className="bg-brand-white border border-brand-border rounded-xl p-6 shadow-sm">
                <div className="space-y-2 max-w-2xl mb-6">
                  <h4 className="text-sm font-bold text-brand-primary">Document Numbering</h4>
                  <p className="text-xs text-brand-subtle">Customize the prefix used for auto-generated codes on the remaining record types. Leave as-is to keep the default numbering.</p>
                </div>
                <form className="space-y-6 max-w-2xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-brand-subtle tracking-widest">Delivery Prefix</Label>
                      <Input
                        value={brandForm.delivery_prefix || ''}
                        onChange={e => setBrandForm({...brandForm, delivery_prefix: e.target.value})}
                        placeholder="e.g. DN-"
                        className="bg-brand-bg/50 border-brand-border/50 h-10 font-medium focus-visible:ring-brand-accent/30"
                      />
                      <p className="text-[10px] text-brand-subtle">Example: <strong>{brandForm.delivery_prefix || 'DN-'}20240115-001</strong></p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-brand-subtle tracking-widest">Purchase Bill Prefix</Label>
                      <Input
                        value={brandForm.purchase_bill_prefix || ''}
                        onChange={e => setBrandForm({...brandForm, purchase_bill_prefix: e.target.value})}
                        placeholder="e.g. PB-"
                        className="bg-brand-bg/50 border-brand-border/50 h-10 font-medium focus-visible:ring-brand-accent/30"
                      />
                      <p className="text-[10px] text-brand-subtle">Example: <strong>{brandForm.purchase_bill_prefix || 'PB-'}20240115-001</strong></p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-brand-subtle tracking-widest">Deal Prefix</Label>
                      <Input
                        value={brandForm.deal_prefix || ''}
                        onChange={e => setBrandForm({...brandForm, deal_prefix: e.target.value})}
                        placeholder="e.g. ZRNX-DL-"
                        className="bg-brand-bg/50 border-brand-border/50 h-10 font-medium focus-visible:ring-brand-accent/30"
                      />
                      <p className="text-[10px] text-brand-subtle">Example: <strong>{brandForm.deal_prefix || 'ZRNX-DL-'}20240115-001</strong></p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-brand-subtle tracking-widest">Lead Prefix</Label>
                      <Input
                        value={brandForm.lead_prefix || ''}
                        onChange={e => setBrandForm({...brandForm, lead_prefix: e.target.value})}
                        placeholder="e.g. ZRNX-LD-"
                        className="bg-brand-bg/50 border-brand-border/50 h-10 font-medium focus-visible:ring-brand-accent/30"
                      />
                      <p className="text-[10px] text-brand-subtle">Example: <strong>{brandForm.lead_prefix || 'ZRNX-LD-'}20240115-001</strong></p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-brand-subtle tracking-widest">Customer Prefix</Label>
                      <Input
                        value={brandForm.customer_prefix || ''}
                        onChange={e => setBrandForm({...brandForm, customer_prefix: e.target.value})}
                        placeholder="e.g. ZRNX-CUS-"
                        className="bg-brand-bg/50 border-brand-border/50 h-10 font-medium focus-visible:ring-brand-accent/30"
                      />
                      <p className="text-[10px] text-brand-subtle">Example: <strong>{brandForm.customer_prefix || 'ZRNX-CUS-'}20240115-001</strong></p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-brand-subtle tracking-widest">Supplier Prefix</Label>
                      <Input
                        value={brandForm.supplier_prefix || ''}
                        onChange={e => setBrandForm({...brandForm, supplier_prefix: e.target.value})}
                        placeholder="e.g. ZRNX-SUP-"
                        className="bg-brand-bg/50 border-brand-border/50 h-10 font-medium focus-visible:ring-brand-accent/30"
                      />
                      <p className="text-[10px] text-brand-subtle">Example: <strong>{brandForm.supplier_prefix || 'ZRNX-SUP-'}20240115-001</strong></p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-brand-subtle tracking-widest">Receipt Prefix</Label>
                      <Input
                        value={brandForm.receipt_prefix || ''}
                        onChange={e => setBrandForm({...brandForm, receipt_prefix: e.target.value})}
                        placeholder="e.g. RCP-"
                        className="bg-brand-bg/50 border-brand-border/50 h-10 font-medium focus-visible:ring-brand-accent/30"
                      />
                      <p className="text-[10px] text-brand-subtle">Example: <strong>{brandForm.receipt_prefix || 'RCP-'}1736928000</strong></p>
                    </div>
                  </div>
                </form>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="payment_terms" className="mt-0">
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-brand-white border border-brand-border p-6 rounded-xl shadow-sm">
                <div>
                  <h3 className="text-lg font-bold text-brand-primary tracking-tight">Payment Terms</h3>
                  <p className="text-xs text-brand-subtle mt-1">Manage the standard payment terms available when creating quotes and invoices.</p>
                </div>
                <Button 
                  onClick={handleBrandSubmit} 
                  disabled={saveBrandMutation.isPending}
                  className="bg-brand-accent hover:bg-brand-accent-hover text-white rounded-xl h-10 px-6 font-bold transition-colors"
                >
                  {saveBrandMutation.isPending ? <Spinner size={16} /> : <Save size={16} className="mr-2" />}
                  Save Changes
                </Button>
              </div>

              <Card className="bg-brand-white border border-brand-border rounded-xl p-6 shadow-sm max-w-2xl">
                <div className="space-y-6">
                  {/* Add New Term */}
                  <div className="flex gap-4 items-end">
                    <div className="flex-1 space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-brand-subtle tracking-widest">Add New Term</Label>
                      <Input 
                        value={newTerm}
                        onChange={(e) => setNewTerm(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newTerm.trim()) {
                            e.preventDefault();
                            setBrandForm(prev => ({...prev, payment_terms: [...(Array.isArray(prev.payment_terms) ? prev.payment_terms : []), newTerm.trim()]}));
                            setNewTerm('');
                          }
                        }}
                        placeholder="e.g. Net 90, 50% Upfront, Cash on Delivery"
                        className="bg-brand-bg/50 border-brand-border/50 h-10 focus-visible:ring-brand-accent/30"
                      />
                    </div>
                    <Button 
                      type="button"
                      onClick={() => {
                        if (newTerm.trim()) {
                          setBrandForm(prev => ({...prev, payment_terms: [...(Array.isArray(prev.payment_terms) ? prev.payment_terms : []), newTerm.trim()]}));
                          setNewTerm('');
                        }
                      }}
                      className="bg-brand-bg border border-brand-border hover:bg-brand-bg text-brand-primary h-10 px-4 rounded-xl"
                    >
                      <Plus size={16} className="mr-2 text-brand-accent" />
                      Add Term
                    </Button>
                  </div>

                  <Separator className="bg-brand-border" />

                  {/* List of Terms */}
                  <div className="space-y-3">
                    <Label className="text-[10px] uppercase font-bold text-brand-subtle tracking-widest">Available Options</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(Array.isArray(brandForm.payment_terms) ? brandForm.payment_terms : []).map((term, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-brand-bg border border-brand-border rounded-xl group hover:bg-brand-accent-light transition-colors">
                          <span className="text-sm font-medium text-brand-primary">{term}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...(Array.isArray(brandForm.payment_terms) ? brandForm.payment_terms : [])];
                              updated.splice(index, 1);
                              setBrandForm(prev => ({ ...prev, payment_terms: updated }));
                            }}
                            className="text-brand-subtle hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      {(!Array.isArray(brandForm.payment_terms) || brandForm.payment_terms.length === 0) && (
                        <p className="text-sm text-brand-subtle italic col-span-full">No payment terms defined.</p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="statuses" className="mt-0">
            <Card className="bg-brand-white border border-brand-border rounded-xl p-12 text-center max-w-2xl mx-auto shadow-sm">
               <CheckCircle2 size={48} className="mx-auto text-brand-accent opacity-50 mb-4" />
               <h3 className="text-xl font-bold text-brand-primary mb-2">Statuses & Colors</h3>
               <p className="text-brand-subtle">Coming soon...</p>
            </Card>
          </TabsContent>

        </div>
      </Tabs>
    </div>
  );
};
