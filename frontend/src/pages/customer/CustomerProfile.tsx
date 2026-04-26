import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { User, Mail, Building, Phone, MapPin, FileText, CheckCircle2, Edit3, Send, Loader2 } from 'lucide-react';
import { SEO } from '@/components/shared/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import api from '@/lib/axios';

export const CustomerProfile = () => {
  const customer = useAuthStore((s) => s.customer);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [form, setForm] = useState({
    name: customer?.name || '',
    company: customer?.company || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    trn: customer?.trn || '',
  });

  if (!customer) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/customer/profile/request-update', form);
      toast.success('Update request sent to administrator for approval');
      setIsEditing(false);
    } catch (err) {
      toast.error('Failed to send update request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <SEO title="My Profile" description="Manage your personal and company details." />
      
      <div className="bg-admin-surface border border-admin-border rounded-2xl p-8 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-zeronix-blue to-zeronix-blue-hover opacity-10"></div>
        
        <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="flex-shrink-0">
            <div className="h-32 w-32 rounded-3xl border-4 border-admin-surface shadow-md overflow-hidden bg-admin-bg ring-1 ring-admin-border">
              <img 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${customer.name}`} 
                alt={customer.name}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
          
          <div className="flex-1 text-center md:text-left pt-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black text-admin-text-primary tracking-tight uppercase">{customer.name}</h1>
                <p className="text-admin-text-secondary mt-1 flex items-center justify-center md:justify-start gap-2 font-medium">
                  <Mail size={16} className="text-zeronix-blue" /> {customer.email}
                </p>
              </div>
              <Button 
                onClick={() => setIsEditing(!isEditing)}
                variant={isEditing ? "ghost" : "outline"}
                className={isEditing ? "text-admin-text-muted" : "bg-zeronix-blue/10 border-zeronix-blue/30 text-zeronix-blue hover:bg-zeronix-blue hover:text-white transition-all font-bold"}
              >
                {isEditing ? 'Cancel Editing' : <><Edit3 size={16} className="mr-2" /> Edit Account Details</>}
              </Button>
            </div>
            
            <div className="mt-8 flex flex-wrap justify-center md:justify-start gap-4">
              <div className="px-4 py-1.5 bg-admin-bg border border-admin-border rounded-xl flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-zeronix-blue animate-pulse shadow-[0_0_8px_rgba(15,82,186,0.5)]"></div>
                <span className="text-[10px] font-black uppercase text-admin-text-muted tracking-widest">B2B Verified</span>
              </div>
              <div className="px-4 py-1.5 bg-admin-bg border border-admin-border rounded-xl flex items-center gap-2">
                <CheckCircle2 size={12} className="text-emerald-500" />
                <span className="text-[10px] font-black uppercase text-admin-text-muted tracking-widest">Portal Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="bg-admin-surface border border-admin-border rounded-2xl p-8 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
           <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-zeronix-blue/10 rounded-xl border border-zeronix-blue/20">
                <Edit3 size={20} className="text-zeronix-blue" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-admin-text-primary tracking-tight uppercase">Update Request</h3>
                <p className="text-xs text-admin-text-muted font-medium italic">Changes will be visible after administrator approval.</p>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-admin-text-muted tracking-widest ml-1">Contact Name</label>
                    <Input 
                      value={form.name} 
                      onChange={e => setForm({...form, name: e.target.value})}
                      className="bg-admin-bg border-admin-border h-12 text-admin-text-primary focus:ring-zeronix-blue/20"
                      placeholder="Your Full Name"
                      required
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-admin-text-muted tracking-widest ml-1">Company Name</label>
                    <Input 
                      value={form.company} 
                      onChange={e => setForm({...form, company: e.target.value})}
                      className="bg-admin-bg border-admin-border h-12 text-admin-text-primary focus:ring-zeronix-blue/20"
                      placeholder="Official Company Name"
                      required
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-admin-text-muted tracking-widest ml-1">TRN (Tax ID)</label>
                    <Input 
                      value={form.trn} 
                      onChange={e => setForm({...form, trn: e.target.value})}
                      className="bg-admin-bg border-admin-border h-12 text-admin-text-primary focus:ring-zeronix-blue/20 uppercase font-mono"
                      placeholder="TRNXXXXXXXXXX"
                    />
                 </div>
              </div>
              
              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-admin-text-muted tracking-widest ml-1">Phone Number</label>
                    <Input 
                      value={form.phone} 
                      onChange={e => setForm({...form, phone: e.target.value})}
                      className="bg-admin-bg border-admin-border h-12 text-admin-text-primary focus:ring-zeronix-blue/20"
                      placeholder="+971 XX XXX XXXX"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-admin-text-muted tracking-widest ml-1">Office Address</label>
                    <Textarea 
                      value={form.address} 
                      onChange={e => setForm({...form, address: e.target.value})}
                      className="bg-admin-bg border-admin-border min-h-[128px] text-admin-text-primary focus:ring-zeronix-blue/20 resize-none"
                      placeholder="Building, Street, Area, City, UAE"
                    />
                 </div>
              </div>
           </div>

           <div className="mt-10 pt-8 border-t border-admin-border flex justify-end gap-4">
              <Button 
                type="button"
                variant="ghost" 
                onClick={() => setIsEditing(false)}
                className="h-12 px-8 text-admin-text-muted font-bold hover:bg-admin-bg"
              >
                Discard Changes
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
                className="h-12 px-10 bg-zeronix-blue hover:bg-zeronix-blue-hover text-white font-black uppercase tracking-widest shadow-xl shadow-zeronix-blue/20 flex items-center gap-2"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <><Send size={18} /> Submit for Approval</>}
              </Button>
           </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-500">
          <div className="bg-admin-surface border border-admin-border rounded-2xl p-8 shadow-sm group hover:border-zeronix-blue/20 transition-all">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-admin-text-muted mb-8 flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-zeronix-blue" />
              Company Intelligence
            </h3>
            <div className="space-y-6">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-admin-text-muted uppercase tracking-widest">Business Legal Name</span>
                <span className="text-sm font-bold text-admin-text-primary tracking-tight">{customer.company || '—'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-admin-text-muted uppercase tracking-widest">Tax Registration Number</span>
                <span className="text-sm font-bold text-admin-text-primary font-mono tracking-tighter">{customer.trn || 'Not Provided'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-admin-text-muted uppercase tracking-widest">Office Location</span>
                <span className="text-sm font-bold text-admin-text-secondary leading-relaxed italic">
                  <MapPin size={12} className="inline mr-1 text-zeronix-blue" />
                  {customer.address || 'Address not listed'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-admin-surface border border-admin-border rounded-2xl p-8 shadow-sm group hover:border-zeronix-blue/20 transition-all">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-admin-text-muted mb-8 flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Primary Representative
            </h3>
            <div className="space-y-6">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-admin-text-muted uppercase tracking-widest">Authorized Person</span>
                <span className="text-sm font-bold text-admin-text-primary tracking-tight">{customer.name}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-admin-text-muted uppercase tracking-widest">Verified Email</span>
                <span className="text-sm font-bold text-zeronix-blue tracking-tight">{customer.email}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-admin-text-muted uppercase tracking-widest">Mobile Contact</span>
                <span className="text-sm font-bold text-admin-text-primary tracking-tight">
                  <Phone size={12} className="inline mr-2 text-zeronix-blue" />
                  {customer.phone || '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
