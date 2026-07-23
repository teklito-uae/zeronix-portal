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
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DocumentDesigner } from './settings/DocumentDesigner';
import { CURRENCY_LIST, type CurrencyCode } from '@/lib/currency';
import { CurrencyIcon } from '@/components/shared/CurrencyIcon';
import { useCurrencyStore } from '@/store/useCurrencyStore';

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
    },
    onError: () => toast.error('Failed to save brand settings'),
  });

  const handleBrandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    const settingsPayload: any = { ...brandForm };
    delete settingsPayload.logo;

    // Append JSON as a blob or array syntax
    Object.keys(settingsPayload).forEach(key => {
      formData.append(`settings[${key}]`, settingsPayload[key]);
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
    mutationFn: async (data: any) => {
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
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to send test email');
    }
  });

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = { ...emailForm };
    if (!payload.smtp_password) delete payload.smtp_password;
    if (!payload.imap_password) delete payload.imap_password;
    if (payload.smtp_port) payload.smtp_port = parseInt(payload.smtp_port);
    if (payload.imap_port) payload.imap_port = parseInt(payload.imap_port);
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
      {/* Ambient background glow */}
      <div className="absolute -inset-4 bg-gradient-to-br from-zeronix-blue/5 via-transparent to-purple-500/5 blur-3xl pointer-events-none -z-10" />

      {/* HORIZONTAL TABS -> VERTICAL SUB-SIDEBAR */}
      <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="flex flex-col lg:flex-row gap-8 w-full relative z-10 pt-2">
        
        {/* Sub-Sidebar */}
        <aside className="w-full lg:w-64 shrink-0 space-y-8">
          <div>
            <h2 className="text-xl font-bold text-admin-text-primary tracking-tight">Settings</h2>
            <p className="text-[10px] text-admin-text-muted mt-1 uppercase tracking-widest font-bold">Manage workspace preferences</p>
          </div>
          <TabsList className="flex flex-col h-auto bg-transparent border-none p-0 space-y-6 items-stretch">
            {MENU_GROUPS.map((group, idx) => (
              <div key={idx} className="space-y-2">
                <h4 className="text-[9px] font-bold text-admin-text-muted uppercase tracking-[0.2em] px-2">{group.title}</h4>
                <nav className="flex flex-col space-y-1">
                  {group.items.map(t => (
                    <TabsTrigger 
                      key={t.id} 
                      value={t.id}
                      className="w-full justify-start rounded-lg px-3 py-2.5 data-[state=active]:bg-zeronix-blue data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-zeronix-blue/30 text-admin-text-secondary hover:text-admin-text-primary hover:bg-admin-surface/50 transition-all duration-300"
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
              <div className="flex justify-between items-center bg-admin-surface/90 backdrop-blur-xl border border-white/5 p-6 rounded-2xl shadow-xl">
                <div>
                  <h3 className="text-lg font-bold text-admin-text-primary">Brand & PDF Settings</h3>
                  <p className="text-sm text-admin-text-muted">Configure your company identity for the portal and generated PDFs.</p>
                </div>
                <Button 
                  onClick={handleBrandSubmit} 
                  disabled={saveBrandMutation.isPending}
                  className="bg-gradient-to-r from-zeronix-blue to-blue-600 hover:from-blue-600 hover:to-zeronix-blue text-white rounded-xl shadow-lg shadow-zeronix-blue/30 gap-2 h-10 px-6 transition-all duration-300"
                >
                  {saveBrandMutation.isPending ? <Spinner size={16} /> : <Save size={16} />}
                  Save Brand
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6">
                <Card className="bg-admin-surface/80 backdrop-blur-xl border-white/5 rounded-2xl overflow-hidden shadow-xl">
                  <CardContent className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label className="text-[10px] tracking-widest font-bold text-admin-text-muted uppercase">Company Name</Label>
                        <Input value={brandForm.company_name} onChange={e => setBrandForm({...brandForm, company_name: e.target.value})} className="bg-admin-bg/50 border-admin-border/50 h-10 focus-visible:ring-zeronix-blue/30 focus-visible:bg-admin-bg transition-colors" placeholder="Zeronix LLC" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] tracking-widest font-bold text-admin-text-muted uppercase">Brand Color</Label>
                        <div className="flex items-center gap-3">
                          <input 
                            type="color" 
                            value={brandForm.primary_color} 
                            onChange={e => setBrandForm({...brandForm, primary_color: e.target.value})} 
                            className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent p-0 shadow-sm" 
                          />
                          <Input value={brandForm.primary_color} onChange={e => setBrandForm({...brandForm, primary_color: e.target.value})} className="bg-admin-bg/50 border-admin-border/50 h-10 flex-1 font-mono uppercase focus-visible:ring-zeronix-blue/30" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label className="text-[10px] tracking-widest font-bold text-admin-text-muted uppercase">Email Address</Label>
                        <Input type="email" value={brandForm.company_email} onChange={e => setBrandForm({...brandForm, company_email: e.target.value})} className="bg-admin-bg/50 border-admin-border/50 h-10 focus-visible:ring-zeronix-blue/30" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] tracking-widest font-bold text-admin-text-muted uppercase">Phone Number</Label>
                        <Input value={brandForm.company_phone} onChange={e => setBrandForm({...brandForm, company_phone: e.target.value})} className="bg-admin-bg/50 border-admin-border/50 h-10 focus-visible:ring-zeronix-blue/30" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-[10px] tracking-widest font-bold text-admin-text-muted uppercase">Physical Address</Label>
                      <Textarea value={brandForm.company_address} onChange={e => setBrandForm({...brandForm, company_address: e.target.value})} className="bg-admin-bg/50 border-admin-border/50 resize-none focus-visible:ring-zeronix-blue/30" rows={3} />
                    </div>

                    <div className="grid grid-cols-2 gap-5 border-t border-white/5 pt-6 mt-2">
                      <div className="space-y-2">
                        <Label className="text-[10px] tracking-widest font-bold text-admin-text-muted uppercase">Tax Label (e.g., TRN, VAT, GST)</Label>
                        <Input value={brandForm.tax_number_label} onChange={e => setBrandForm({...brandForm, tax_number_label: e.target.value})} className="bg-admin-bg/50 border-admin-border/50 h-10 focus-visible:ring-zeronix-blue/30" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] tracking-widest font-bold text-admin-text-muted uppercase">Tax Number</Label>
                        <Input value={brandForm.tax_number} onChange={e => setBrandForm({...brandForm, tax_number: e.target.value})} className="bg-admin-bg/50 border-admin-border/50 h-10 focus-visible:ring-zeronix-blue/30" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 border-t border-white/5 pt-6 mt-2">
                      <div className="space-y-2">
                        <Label className="text-[10px] tracking-widest font-bold text-admin-text-muted uppercase">Bank Details (For Invoices)</Label>
                        <Textarea value={brandForm.bank_details} onChange={e => setBrandForm({...brandForm, bank_details: e.target.value})} className="bg-admin-bg/50 border-admin-border/50 resize-none focus-visible:ring-zeronix-blue/30" rows={3} placeholder="Bank Name: ...&#10;Account Number: ...&#10;IBAN: ..." />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] tracking-widest font-bold text-admin-text-muted uppercase">Terms & Conditions</Label>
                        <Textarea value={brandForm.terms_conditions} onChange={e => setBrandForm({...brandForm, terms_conditions: e.target.value})} className="bg-admin-bg/50 border-admin-border/50 resize-none focus-visible:ring-zeronix-blue/30" rows={4} placeholder="1. Goods once sold will not be returned...&#10;2. Warranty void if seal broken..." />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-admin-surface/80 backdrop-blur-xl border-white/5 rounded-2xl overflow-hidden shadow-xl self-start">
                  <CardHeader className="bg-admin-bg/30 border-b border-white/5 pb-4">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-admin-text-muted flex items-center gap-2"><Upload size={14} /> Brand Logo</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {brandForm.logo_path && !brandForm.logo ? (
                      <div className="w-full h-32 rounded-xl bg-white border border-admin-border flex items-center justify-center overflow-hidden p-2">
                        <img src={import.meta.env.VITE_API_URL?.replace('/api', '') + brandForm.logo_path} alt="Logo" className="max-h-full max-w-full object-contain" />
                      </div>
                    ) : brandForm.logo ? (
                      <div className="w-full h-32 rounded-xl bg-white border border-admin-border flex items-center justify-center p-2 text-[12px] font-medium text-admin-text-primary text-center">
                        {brandForm.logo.name} <br /> (Pending Save)
                      </div>
                    ) : (
                      <div className="w-full h-32 rounded-xl bg-admin-bg border border-admin-border border-dashed flex items-center justify-center flex-col gap-2 text-admin-text-muted">
                        <Upload size={24} />
                        <span className="text-[12px]">No logo uploaded</span>
                      </div>
                    )}
                    
                    <div className="pt-2">
                      <Input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setBrandForm({ ...brandForm, logo: e.target.files[0] });
                          }
                        }}
                        className="text-xs file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-zeronix-blue/10 file:text-zeronix-blue hover:file:bg-zeronix-blue/20"
                      />
                    </div>
                    <p className="text-[11px] text-admin-text-muted mt-2">Upload a PNG or JPG (max 2MB). Used in PDF generation.</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* EMAIL TAB */}
          <TabsContent value="email" className="mt-0">
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-admin-surface/90 backdrop-blur-xl border border-white/5 p-6 rounded-2xl shadow-xl">
                <div>
                  <h3 className="text-lg font-bold text-admin-text-primary">Email & Communication</h3>
                  <p className="text-sm text-admin-text-muted">Configure SMTP for outgoing and IMAP for incoming mail.</p>
                </div>
                <Button variant="outline" onClick={loadHostingerDefaults} className="border-zeronix-blue text-zeronix-blue hover:bg-zeronix-blue/10 rounded-xl h-10 px-4">
                  Hostinger Defaults
                </Button>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* SMTP */}
                  <Card className="bg-admin-surface/80 backdrop-blur-xl border-white/5 rounded-2xl overflow-hidden shadow-xl">
                    <CardHeader className="bg-admin-bg/30 border-b border-white/5 pb-4">
                      <div className="flex items-center gap-2">
                        <ArrowUpRight className="text-green-500" size={16} />
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-admin-text-muted">Outgoing (SMTP)</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-5">
                      <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase font-bold text-admin-text-muted tracking-widest">Host</Label>
                          <Input value={emailForm.smtp_host} onChange={e => setEmailForm({...emailForm, smtp_host: e.target.value})} className="bg-admin-bg/50 border-admin-border/50 h-10 focus-visible:ring-zeronix-blue/30" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase font-bold text-admin-text-muted tracking-widest">Port</Label>
                          <Input value={emailForm.smtp_port} onChange={e => setEmailForm({...emailForm, smtp_port: e.target.value})} className="bg-admin-bg/50 border-admin-border/50 h-10 focus-visible:ring-zeronix-blue/30" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-admin-text-muted tracking-widest">Username</Label>
                        <Input value={emailForm.smtp_username} onChange={e => setEmailForm({...emailForm, smtp_username: e.target.value})} className="bg-admin-bg/50 border-admin-border/50 h-10 focus-visible:ring-zeronix-blue/30" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-admin-text-muted tracking-widest">Password</Label>
                        <Input type="password" placeholder="••••••••" value={emailForm.smtp_password} onChange={e => setEmailForm({...emailForm, smtp_password: e.target.value})} className="bg-admin-bg/50 border-admin-border/50 h-10 focus-visible:ring-zeronix-blue/30" />
                      </div>
                    </CardContent>
                  </Card>

                  {/* IMAP */}
                  <Card className="bg-admin-surface/80 backdrop-blur-xl border-white/5 rounded-2xl overflow-hidden shadow-xl">
                    <CardHeader className="bg-admin-bg/30 border-b border-white/5 pb-4 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ArrowDownLeft className="text-blue-500" size={16} />
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-admin-text-muted">Incoming (IMAP)</CardTitle>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={copySmtpToImap} className="text-[10px] h-6 text-zeronix-blue hover:bg-zeronix-blue/10 px-2 rounded">Copy Credentials</Button>
                    </CardHeader>
                    <CardContent className="p-8 space-y-5">
                      <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase font-bold text-admin-text-muted tracking-widest">Host</Label>
                          <Input value={emailForm.imap_host} onChange={e => setEmailForm({...emailForm, imap_host: e.target.value})} className="bg-admin-bg/50 border-admin-border/50 h-10 focus-visible:ring-zeronix-blue/30" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase font-bold text-admin-text-muted tracking-widest">Port</Label>
                          <Input value={emailForm.imap_port} onChange={e => setEmailForm({...emailForm, imap_port: e.target.value})} className="bg-admin-bg/50 border-admin-border/50 h-10 focus-visible:ring-zeronix-blue/30" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-admin-text-muted tracking-widest">Username</Label>
                        <Input value={emailForm.imap_username} onChange={e => setEmailForm({...emailForm, imap_username: e.target.value})} className="bg-admin-bg/50 border-admin-border/50 h-10 focus-visible:ring-zeronix-blue/30" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-admin-text-muted tracking-widest">Password</Label>
                        <Input type="password" placeholder="••••••••" value={emailForm.imap_password} onChange={e => setEmailForm({...emailForm, imap_password: e.target.value})} className="bg-admin-bg/50 border-admin-border/50 h-10 focus-visible:ring-zeronix-blue/30" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-admin-surface/80 backdrop-blur-xl border border-white/5 rounded-2xl shadow-xl">
                  <div className="flex items-center gap-4 flex-1 w-full">
                    <div className="flex-1 space-y-1">
                      <Label className="text-[10px] text-admin-text-muted uppercase font-bold tracking-widest">Test Delivery</Label>
                      <Input placeholder="Recipient email..." id="test-email-input" className="h-10 bg-admin-bg/50 border-admin-border/50 text-sm focus-visible:ring-zeronix-blue/30" />
                    </div>
                    <Button type="button" variant="outline" onClick={() => {
                        const input = document.getElementById('test-email-input') as HTMLInputElement;
                        testMailMutation.mutate(input?.value || undefined);
                      }} disabled={testMailMutation.isPending} className="h-9 self-end border-admin-border">
                      {testMailMutation.isPending ? <Spinner size={16} /> : <Mail size={16} />}
                      <span className="ml-2 hidden sm:inline text-xs">Test Email</span>
                    </Button>
                  </div>
                  <Button type="submit" disabled={saveEmailMutation.isPending} className="bg-zeronix-blue text-white hover:bg-zeronix-blue-hover h-11 px-8 rounded-xl w-full sm:w-auto shadow-lg shadow-zeronix-blue/20">
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

          {/* PROFILE TAB */}
          <TabsContent value="profile" className="mt-0">
            <Card className="bg-admin-surface/80 backdrop-blur-xl border-white/5 rounded-2xl p-12 text-center max-w-2xl mx-auto shadow-xl">
              <div className="mx-auto w-24 h-24 rounded-full bg-zeronix-blue/10 flex items-center justify-center mb-6">
                <User size={48} className="text-zeronix-blue" />
              </div>
              <h3 className="text-xl font-bold text-admin-text-primary">{adminUser?.name}</h3>
              <p className="text-admin-text-muted mb-6">{adminUser?.email}</p>
              <div className="max-w-xs mx-auto space-y-4 text-left">
                <div>
                  <Label className="text-[10px] uppercase text-admin-text-muted">Role</Label>
                  <p className="text-sm font-medium capitalize">{adminUser?.role}</p>
                </div>
                <div>
                  <Label className="text-[10px] uppercase text-admin-text-muted">Member Since</Label>
                  <p className="text-sm font-medium">{adminUser?.created_at ? new Date(adminUser.created_at).toLocaleDateString() : '—'}</p>
                </div>
              </div>
              <Separator className="my-8 bg-admin-border" />
              <p className="text-xs text-admin-text-muted italic">Profile editing is currently managed by System Administrators.</p>
            </Card>
          </TabsContent>
          <TabsContent value="tags" className="mt-0">
            <Card className="bg-admin-surface/80 backdrop-blur-xl border-white/5 rounded-2xl p-12 text-center max-w-2xl mx-auto shadow-xl">
               <Tag size={48} className="mx-auto text-zeronix-blue opacity-50 mb-4" />
               <h3 className="text-xl font-bold text-admin-text-primary mb-2">Global Tags Manager</h3>
               <p className="text-admin-text-muted">Coming soon...</p>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="mt-0">
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-admin-surface/90 backdrop-blur-xl border border-white/5 p-6 rounded-2xl shadow-xl">
                <div>
                  <h3 className="text-lg font-bold text-admin-text-primary tracking-tight">Currency &amp; Document Prefixes</h3>
                  <p className="text-xs text-admin-text-muted mt-1">Set your workspace currency and the auto-generated numbering format for transactions.</p>
                </div>
                <Button 
                  onClick={handleBrandSubmit} 
                  disabled={saveBrandMutation.isPending}
                  className="bg-gradient-to-r from-zeronix-blue to-purple-500 hover:opacity-90 text-white rounded-xl h-10 px-6 font-bold shadow-lg shadow-zeronix-blue/20 transition-all active:scale-95"
                >
                  {saveBrandMutation.isPending ? <Spinner size={16} /> : <Save size={16} className="mr-2" />}
                  Save Changes
                </Button>
              </div>

              <Card className="bg-admin-surface/80 backdrop-blur-xl border-white/5 rounded-2xl p-6 shadow-xl">
                <div className="space-y-2 max-w-2xl mb-2">
                  <h4 className="text-sm font-bold text-admin-text-primary">Currency</h4>
                  <p className="text-xs text-admin-text-muted">Choose the currency used across quotes, invoices, and reports.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mb-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-admin-text-muted tracking-widest">Currency</Label>
                    <Select
                      value={brandForm.currency}
                      onValueChange={(value: CurrencyCode) => setBrandForm({ ...brandForm, currency: value })}
                    >
                      <SelectTrigger className="bg-admin-bg/50 border-admin-border/50 h-10">
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
                    <p className="text-[10px] text-admin-text-muted">Example: <strong>{brandForm.currency === 'USD' ? '$1,250.00' : '1,250.00 AED'}</strong></p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-admin-text-muted tracking-widest">Base Currency</Label>
                    <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-admin-border/50 bg-admin-bg/30 text-sm font-medium text-admin-text-secondary">
                      <CurrencyIcon currency={brandForm.base_currency} size={14} />
                      <span>{brandForm.base_currency} (fixed)</span>
                    </div>
                    <p className="text-[10px] text-admin-text-muted">All amounts are recorded in this base currency; no conversion is applied yet.</p>
                  </div>
                </div>
                <Separator className="bg-admin-border/50 mb-6" />
                <form className="space-y-6 max-w-2xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-admin-text-muted tracking-widest">Quote Prefix</Label>
                      <Input 
                        value={brandForm.quote_prefix || ''} 
                        onChange={e => setBrandForm({...brandForm, quote_prefix: e.target.value})}
                        placeholder="e.g. QT-"
                        className="bg-admin-bg/50 border-admin-border/50 h-10 font-medium focus-visible:ring-zeronix-blue/30" 
                      />
                      <p className="text-[10px] text-admin-text-muted">Example: <strong>{brandForm.quote_prefix || 'QT-'}2024-001</strong></p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-admin-text-muted tracking-widest">Invoice Prefix</Label>
                      <Input 
                        value={brandForm.invoice_prefix || ''} 
                        onChange={e => setBrandForm({...brandForm, invoice_prefix: e.target.value})}
                        placeholder="e.g. INV-"
                        className="bg-admin-bg/50 border-admin-border/50 h-10 font-medium focus-visible:ring-zeronix-blue/30" 
                      />
                      <p className="text-[10px] text-admin-text-muted">Example: <strong>{brandForm.invoice_prefix || 'INV-'}2024-001</strong></p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-admin-text-muted tracking-widest">Sales Order Prefix</Label>
                      <Input 
                        value={brandForm.sales_order_prefix || ''} 
                        onChange={e => setBrandForm({...brandForm, sales_order_prefix: e.target.value})}
                        placeholder="e.g. SO-"
                        className="bg-admin-bg/50 border-admin-border/50 h-10 font-medium focus-visible:ring-zeronix-blue/30" 
                      />
                      <p className="text-[10px] text-admin-text-muted">Example: <strong>{brandForm.sales_order_prefix || 'SO-'}2024-001</strong></p>
                    </div>
                  </div>
                </form>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="payment_terms" className="mt-0">
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-admin-surface/90 backdrop-blur-xl border border-white/5 p-6 rounded-2xl shadow-xl">
                <div>
                  <h3 className="text-lg font-bold text-admin-text-primary tracking-tight">Payment Terms</h3>
                  <p className="text-xs text-admin-text-muted mt-1">Manage the standard payment terms available when creating quotes and invoices.</p>
                </div>
                <Button 
                  onClick={handleBrandSubmit} 
                  disabled={saveBrandMutation.isPending}
                  className="bg-gradient-to-r from-zeronix-blue to-purple-500 hover:opacity-90 text-white rounded-xl h-10 px-6 font-bold shadow-lg shadow-zeronix-blue/20 transition-all active:scale-95"
                >
                  {saveBrandMutation.isPending ? <Spinner size={16} /> : <Save size={16} className="mr-2" />}
                  Save Changes
                </Button>
              </div>

              <Card className="bg-admin-surface/80 backdrop-blur-xl border-white/5 rounded-2xl p-6 shadow-xl max-w-2xl">
                <div className="space-y-6">
                  {/* Add New Term */}
                  <div className="flex gap-4 items-end">
                    <div className="flex-1 space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-admin-text-muted tracking-widest">Add New Term</Label>
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
                        className="bg-admin-bg/50 border-admin-border/50 h-10 focus-visible:ring-zeronix-blue/30"
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
                      className="bg-admin-bg border border-admin-border hover:bg-admin-surface-hover text-admin-text-primary h-10 px-4 rounded-xl"
                    >
                      <Plus size={16} className="mr-2 text-zeronix-blue" />
                      Add Term
                    </Button>
                  </div>

                  <Separator className="bg-white/5" />

                  {/* List of Terms */}
                  <div className="space-y-3">
                    <Label className="text-[10px] uppercase font-bold text-admin-text-muted tracking-widest">Available Options</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(Array.isArray(brandForm.payment_terms) ? brandForm.payment_terms : []).map((term, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-admin-bg/30 border border-white/5 rounded-xl group hover:bg-admin-surface-hover transition-colors">
                          <span className="text-sm font-medium text-admin-text-primary">{term}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...(Array.isArray(brandForm.payment_terms) ? brandForm.payment_terms : [])];
                              updated.splice(index, 1);
                              setBrandForm(prev => ({ ...prev, payment_terms: updated }));
                            }}
                            className="text-admin-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      {(!Array.isArray(brandForm.payment_terms) || brandForm.payment_terms.length === 0) && (
                        <p className="text-sm text-admin-text-muted italic col-span-full">No payment terms defined.</p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="statuses" className="mt-0">
            <Card className="bg-admin-surface/80 backdrop-blur-xl border-white/5 rounded-2xl p-12 text-center max-w-2xl mx-auto shadow-xl">
               <CheckCircle2 size={48} className="mx-auto text-zeronix-blue opacity-50 mb-4" />
               <h3 className="text-xl font-bold text-admin-text-primary mb-2">Statuses & Colors</h3>
               <p className="text-admin-text-muted">Coming soon...</p>
            </Card>
          </TabsContent>

        </div>
      </Tabs>
    </div>
  );
};
