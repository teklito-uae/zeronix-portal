import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { 
  Mail, 
  Loader2, 
  Save, 
  ArrowUpRight, 
  ArrowDownLeft, 
  User, 
  FileText, 
  ChevronRight,
  Info,
  Eye,
  Layout,
  CheckCircle2,
  Receipt
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { Quote, PaginatedResponse, Template } from '@/types';

const PLACEHOLDERS = [
  { key: '{quote_number}', label: 'Quote Number', type: 'quote' },
  { key: '{invoice_number}', label: 'Invoice Number', type: 'invoice' },
  { key: '{customer_name}', label: 'Customer Name', type: 'both' },
  { key: '{customer_company}', label: 'Customer Company', type: 'both' },
  { key: '{customer_email}', label: 'Customer Email', type: 'both' },
  { key: '{customer_address}', label: 'Customer Address', type: 'both' },
  { key: '{date}', label: 'Date', type: 'both' },
  { key: '{valid_until}', label: 'Valid Until', type: 'quote' },
  { key: '{due_date}', label: 'Due Date', type: 'invoice' },
  { key: '{subtotal}', label: 'Subtotal', type: 'both' },
  { key: '{vat_amount}', label: 'VAT Amount', type: 'both' },
  { key: '{total_amount}', label: 'Total Amount', type: 'both' },
  { key: '{total_in_words}', label: 'Total in Words', type: 'both' },
  { key: '{items}', label: 'Items Table (HTML)', type: 'both' },
];

export const Settings = () => {
  const [activeTab, setActiveTab] = useState('email');
  const adminUser = useAuthStore((state) => state.admin);
  const setAdmin = useAuthStore((state) => state.setAdmin);
  const queryClient = useQueryClient();

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

  // --- TEMPLATE SETTINGS STATE ---
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templateForm, setTemplateForm] = useState<Partial<Template>>({});

  const { data: templates, isLoading: isLoadingTemplates } = useQuery<Template[]>({
    queryKey: ['templates'],
    queryFn: async () => {
      const res = await api.get('/admin/templates');
      return res.data;
    },
    enabled: activeTab === 'templates'
  });

  useEffect(() => {
    if (templates && !selectedTemplate) {
      const defaultQuote = templates.find(t => t.type === 'quote' && t.is_default) || templates.find(t => t.type === 'quote');
      if (defaultQuote) handleSelectTemplate(defaultQuote);
    }
  }, [templates]);

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setTemplateForm(template);
  };

  const updateTemplateMutation = useMutation({
    mutationFn: async (data: Partial<Template>) => {
      const res = await api.put(`/admin/templates/${selectedTemplate?.id}`, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Template updated successfully');
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
    onError: () => {
      toast.error('Failed to update template');
    }
  });

  const handleTemplateSave = () => {
    if (templateForm) updateTemplateMutation.mutate(templateForm);
  };

  const renderPreview = (content: string) => {
    let preview = content;
    const mockData: Record<string, string> = {
      '{quote_number}': 'QT-2024-001',
      '{invoice_number}': 'INV-2024-001',
      '{customer_name}': 'John Doe',
      '{customer_company}': 'Doe Enterprises',
      '{customer_email}': 'john@example.com',
      '{customer_address}': '123 Business Way, Downtown Dubai, UAE',
      '{date}': '26 Apr 2024',
      '{valid_until}': '10 May 2024',
      '{due_date}': '03 May 2024',
      '{subtotal}': '1,000.00 AED',
      '{vat_amount}': '50.00 AED',
      '{total_amount}': '1,050.00 AED',
      '{total_in_words}': 'ONE THOUSAND AND FIFTY ONLY',
      '{items}': `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">1</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Premium Service</strong><br><span style="font-size: 11px; color: #666;">Standard monthly maintenance</span></td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">1.00</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">1,000.00</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">1,000.00</td>
        </tr>
      `
    };
    Object.entries(mockData).forEach(([key, val]) => {
      preview = preview.replace(new RegExp(key, 'g'), val);
    });
    return preview;
  };

  // --- SUB-COMPONENTS ---
  const SidebarItem = ({ id, label, icon: Icon }: any) => (
    <button
      onClick={() => setActiveTab(id)}
      className={cn(
        "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group",
        activeTab === id 
          ? "bg-zeronix-blue text-white shadow-lg shadow-zeronix-blue/20 font-medium" 
          : "text-admin-text-secondary hover:bg-admin-surface-hover hover:text-admin-text-primary"
      )}
    >
      <div className="flex items-center gap-3">
        <Icon size={18} className={cn(activeTab === id ? "text-white" : "text-admin-text-muted group-hover:text-zeronix-blue")} />
        <span className="text-sm">{label}</span>
      </div>
      <ChevronRight size={14} className={cn("transition-transform", activeTab === id ? "rotate-90 opacity-100" : "opacity-0")} />
    </button>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-10rem)]">
      {/* Settings Internal Sidebar */}
      <div className="w-full lg:w-64 flex-shrink-0 space-y-2">
        <div className="px-4 mb-4">
          <h2 className="text-xl font-bold text-admin-text-primary">Settings</h2>
          <p className="text-xs text-admin-text-muted">Manage your workspace</p>
        </div>
        <div className="space-y-1">
          <SidebarItem id="email" label="Email Integration" icon={Mail} />
          <SidebarItem id="templates" label="Document Templates" icon={FileText} />
          <SidebarItem id="profile" label="My Profile" icon={User} />
        </div>
      </div>

      {/* Main Settings Content */}
      <div className="flex-1 min-w-0">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* EMAIL TAB */}
          {activeTab === 'email' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-admin-surface border border-admin-border p-6 rounded-2xl">
                <div>
                  <h3 className="text-lg font-bold text-admin-text-primary">Email & Communication</h3>
                  <p className="text-sm text-admin-text-muted">Configure SMTP for outgoing and IMAP for incoming mail.</p>
                </div>
                <Button variant="outline" onClick={loadHostingerDefaults} className="border-zeronix-blue text-zeronix-blue hover:bg-zeronix-blue/10 rounded-xl">
                  Hostinger Defaults
                </Button>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* SMTP */}
                  <Card className="bg-admin-surface border-admin-border rounded-2xl overflow-hidden">
                    <CardHeader className="bg-admin-bg/50 border-b border-admin-border pb-4">
                      <div className="flex items-center gap-2">
                        <ArrowUpRight className="text-green-500" size={18} />
                        <CardTitle className="text-base">Outgoing (SMTP)</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs text-admin-text-muted uppercase">Host</Label>
                          <Input value={emailForm.smtp_host} onChange={e => setEmailForm({...emailForm, smtp_host: e.target.value})} className="bg-admin-bg border-admin-border h-10" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-admin-text-muted uppercase">Port</Label>
                          <Input value={emailForm.smtp_port} onChange={e => setEmailForm({...emailForm, smtp_port: e.target.value})} className="bg-admin-bg border-admin-border h-10" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-admin-text-muted uppercase">Username</Label>
                        <Input value={emailForm.smtp_username} onChange={e => setEmailForm({...emailForm, smtp_username: e.target.value})} className="bg-admin-bg border-admin-border h-10" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-admin-text-muted uppercase">Password</Label>
                        <Input type="password" placeholder="••••••••" value={emailForm.smtp_password} onChange={e => setEmailForm({...emailForm, smtp_password: e.target.value})} className="bg-admin-bg border-admin-border h-10" />
                      </div>
                    </CardContent>
                  </Card>

                  {/* IMAP */}
                  <Card className="bg-admin-surface border-admin-border rounded-2xl overflow-hidden">
                    <CardHeader className="bg-admin-bg/50 border-b border-admin-border pb-4 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ArrowDownLeft className="text-blue-500" size={18} />
                        <CardTitle className="text-base">Incoming (IMAP)</CardTitle>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={copySmtpToImap} className="text-[10px] h-6 text-zeronix-blue hover:bg-zeronix-blue/10">Copy Credentials</Button>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs text-admin-text-muted uppercase">Host</Label>
                          <Input value={emailForm.imap_host} onChange={e => setEmailForm({...emailForm, imap_host: e.target.value})} className="bg-admin-bg border-admin-border h-10" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-admin-text-muted uppercase">Port</Label>
                          <Input value={emailForm.imap_port} onChange={e => setEmailForm({...emailForm, imap_port: e.target.value})} className="bg-admin-bg border-admin-border h-10" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-admin-text-muted uppercase">Username</Label>
                        <Input value={emailForm.imap_username} onChange={e => setEmailForm({...emailForm, imap_username: e.target.value})} className="bg-admin-bg border-admin-border h-10" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-admin-text-muted uppercase">Password</Label>
                        <Input type="password" placeholder="••••••••" value={emailForm.imap_password} onChange={e => setEmailForm({...emailForm, imap_password: e.target.value})} className="bg-admin-bg border-admin-border h-10" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-admin-surface border border-admin-border rounded-2xl">
                  <div className="flex items-center gap-4 flex-1 w-full">
                    <div className="flex-1 space-y-1">
                      <Label className="text-[10px] text-admin-text-muted uppercase font-bold">Test Delivery</Label>
                      <Input placeholder="Recipient email..." id="test-email-input" className="h-9 bg-admin-bg border-admin-border text-sm" />
                    </div>
                    <Button type="button" variant="outline" onClick={() => {
                        const input = document.getElementById('test-email-input') as HTMLInputElement;
                        testMailMutation.mutate(input?.value || undefined);
                      }} disabled={testMailMutation.isPending} className="h-9 self-end border-admin-border">
                      {testMailMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                      <span className="ml-2 hidden sm:inline text-xs">Test Email</span>
                    </Button>
                  </div>
                  <Button type="submit" disabled={saveEmailMutation.isPending} className="bg-zeronix-blue text-white hover:bg-zeronix-blue-hover h-11 px-8 rounded-xl w-full sm:w-auto shadow-lg shadow-zeronix-blue/20">
                    {saveEmailMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    <span className="ml-2 font-medium">Save All Changes</span>
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* TEMPLATES TAB */}
          {activeTab === 'templates' && (
            <div className="space-y-8">
              <div className="bg-admin-surface border border-admin-border p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold text-admin-text-primary">Document Brand Designer</h3>
                  <p className="text-sm text-admin-text-muted">Choose a base format and customize the layout, colors, and content.</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex-1 md:flex-none border-admin-border text-xs gap-2 h-10">
                        <Eye size={14} /> Live Preview
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl h-[90vh] p-0 overflow-hidden border-admin-border bg-admin-surface">
                       <div className="flex items-center justify-between p-4 border-b border-admin-border bg-admin-bg/50">
                          <h4 className="font-bold text-sm">PDF View: {templateForm.name}</h4>
                          <span className="text-[10px] bg-zeronix-blue/10 text-zeronix-blue px-2 py-0.5 rounded font-bold">A4 PORTRAIT</span>
                       </div>
                       <iframe srcDoc={renderPreview(templateForm.content || '')} className="w-full h-full border-none bg-slate-100" />
                    </DialogContent>
                  </Dialog>
                  <Button onClick={handleTemplateSave} disabled={updateTemplateMutation.isPending} className="flex-1 md:flex-none bg-zeronix-blue text-white hover:bg-zeronix-blue-hover h-10 px-8 rounded-xl shadow-lg shadow-zeronix-blue/20">
                    {updateTemplateMutation.isPending ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                    Save Template
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Left: Selection & Info */}
                <div className="xl:col-span-3 space-y-6">
                  <Card className="bg-admin-surface border-admin-border rounded-2xl overflow-hidden shadow-sm">
                    <CardHeader className="bg-admin-bg/50 border-b border-admin-border p-4">
                      <div className="flex items-center gap-2 text-zeronix-blue">
                        <Layout size={16} />
                        <CardTitle className="text-[11px] uppercase tracking-widest font-bold">Select Document</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-2">
                      <Tabs defaultValue="quote" className="w-full">
                        <TabsList className="w-full grid grid-cols-2 bg-admin-bg/50 rounded-lg p-1 mb-2">
                          <TabsTrigger value="quote" className="text-[11px] h-8 rounded-md data-[state=active]:bg-admin-surface data-[state=active]:shadow-sm">Quotes</TabsTrigger>
                          <TabsTrigger value="invoice" className="text-[11px] h-8 rounded-md data-[state=active]:bg-admin-surface data-[state=active]:shadow-sm">Invoices</TabsTrigger>
                        </TabsList>
                        <TabsContent value="quote" className="space-y-1">
                          {templates?.filter(t => t.type === 'quote').map(t => (
                            <button 
                              key={t.id} 
                              onClick={() => handleSelectTemplate(t)} 
                              className={cn(
                                "w-full text-left px-4 py-3 rounded-xl text-xs transition-all flex justify-between items-center group",
                                selectedTemplate?.id === t.id 
                                  ? "bg-zeronix-blue/10 text-zeronix-blue border border-zeronix-blue/20 font-bold" 
                                  : "hover:bg-admin-bg text-admin-text-secondary border border-transparent"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <FileText size={14} className={selectedTemplate?.id === t.id ? "text-zeronix-blue" : "text-admin-text-muted"} />
                                {t.name}
                              </div>
                              {t.is_default && <span className="text-[8px] bg-zeronix-blue text-white px-1.5 py-0.5 rounded-full font-bold">DEF</span>}
                            </button>
                          ))}
                        </TabsContent>
                        <TabsContent value="invoice" className="space-y-1">
                          {templates?.filter(t => t.type === 'invoice').map(t => (
                            <button 
                              key={t.id} 
                              onClick={() => handleSelectTemplate(t)} 
                              className={cn(
                                "w-full text-left px-4 py-3 rounded-xl text-xs transition-all flex justify-between items-center group",
                                selectedTemplate?.id === t.id 
                                  ? "bg-zeronix-blue/10 text-zeronix-blue border border-zeronix-blue/20 font-bold" 
                                  : "hover:bg-admin-bg text-admin-text-secondary border border-transparent"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <Receipt size={14} className={selectedTemplate?.id === t.id ? "text-zeronix-blue" : "text-admin-text-muted"} />
                                {t.name}
                              </div>
                              {t.is_default && <span className="text-[8px] bg-zeronix-blue text-white px-1.5 py-0.5 rounded-full font-bold">DEF</span>}
                            </button>
                          ))}
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>

                  <Card className="bg-admin-surface border-admin-border rounded-2xl overflow-hidden shadow-sm">
                    <CardHeader className="bg-admin-bg/50 border-b border-admin-border p-4">
                      <div className="flex items-center gap-2 text-zeronix-blue">
                        <Info size={16} />
                        <CardTitle className="text-[11px] uppercase tracking-widest font-bold">Variables</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 gap-2">
                        {PLACEHOLDERS.filter(p => p.type === 'both' || p.type === selectedTemplate?.type).map(p => (
                          <div key={p.key} className="flex items-center justify-between group p-2 rounded-lg hover:bg-admin-bg transition-colors cursor-help">
                            <span className="text-[10px] text-admin-text-muted font-medium">{p.label}</span>
                            <code className="text-[10px] text-zeronix-blue font-mono bg-zeronix-blue/5 px-1.5 py-0.5 rounded border border-zeronix-blue/10">{p.key}</code>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right: Detailed Editor */}
                <div className="xl:col-span-9 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Basic Info */}
                    <Card className="md:col-span-1 bg-admin-surface border-admin-border rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-admin-text-muted tracking-wider">Format Name</Label>
                        <Input 
                          value={templateForm.name || ''} 
                          onChange={e => setTemplateForm({...templateForm, name: e.target.value})} 
                          className="bg-admin-bg border-admin-border h-10 font-medium" 
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-admin-bg/50 rounded-xl border border-admin-border mt-2">
                        <div className="space-y-0.5">
                          <Label htmlFor="def-toggle" className="text-xs font-bold cursor-pointer">Default Template</Label>
                          <p className="text-[10px] text-admin-text-muted">Use this as the primary design</p>
                        </div>
                        <input 
                          type="checkbox" 
                          id="def-toggle"
                          className="w-4 h-4 rounded border-admin-border text-zeronix-blue focus:ring-zeronix-blue"
                          checked={templateForm.is_default || false} 
                          onChange={e => setTemplateForm({...templateForm, is_default: e.target.checked})} 
                        />
                      </div>
                    </Card>

                    {/* Email Config */}
                    <Card className="md:col-span-2 bg-admin-surface border-admin-border rounded-2xl p-6 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Mail size={16} className="text-zeronix-blue" />
                        <h4 className="text-sm font-bold">Email Notification Settings</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase font-bold text-admin-text-muted tracking-wider">Email Subject Line</Label>
                          <Input 
                            value={templateForm.subject || ''} 
                            onChange={e => setTemplateForm({...templateForm, subject: e.target.value})} 
                            className="bg-admin-bg border-admin-border h-10 text-xs" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase font-bold text-admin-text-muted tracking-wider">Greeting & Message</Label>
                          <Textarea 
                            value={templateForm.email_body || ''} 
                            onChange={e => setTemplateForm({...templateForm, email_body: e.target.value})} 
                            className="bg-admin-bg border-admin-border min-h-[80px] text-xs resize-none" 
                          />
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* HTML Editor */}
                  <Card className="bg-[#0d1117] border border-admin-border rounded-2xl overflow-hidden shadow-2xl">
                    <div className="bg-[#161b22] border-b border-[#30363d] px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"></div>
                          <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"></div>
                          <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]"></div>
                        </div>
                        <span className="text-[10px] font-mono text-[#8b949e] ml-2">layout.blade.php</span>
                      </div>
                      <div className="flex items-center gap-4">
                         <span className="text-[10px] text-emerald-500 font-mono flex items-center gap-1">
                           <CheckCircle2 size={12} /> Valid HTML5
                         </span>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute left-0 top-0 bottom-0 w-12 bg-[#0d1117] border-r border-[#30363d] flex flex-col items-center py-6 text-[10px] text-[#484f58] font-mono select-none">
                        {Array.from({length: 25}).map((_, i) => <div key={i} className="h-[22px] leading-[22px]">{i+1}</div>)}
                      </div>
                      <textarea 
                        value={templateForm.content || ''} 
                        onChange={e => setTemplateForm({...templateForm, content: e.target.value})}
                        className="w-full h-[600px] bg-transparent text-[#e6edf3] p-6 pl-16 font-mono text-xs leading-[22px] resize-none focus:outline-none scrollbar-thin scrollbar-thumb-[#30363d]"
                        spellCheck={false}
                      />
                    </div>
                    <div className="bg-[#161b22] border-t border-[#30363d] px-6 py-2 flex justify-between items-center">
                       <p className="text-[9px] text-[#8b949e]">UTF-8 • HTML • Pre-render enabled</p>
                       <p className="text-[9px] text-[#8b949e]">Line {templateForm.content?.split('\n').length || 0}</p>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <Card className="bg-admin-surface border-admin-border rounded-2xl p-8 text-center">
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
          )}

        </div>
      </div>
    </div>
  );
};
