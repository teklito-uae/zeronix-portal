import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, ArrowRight, ArrowLeft, UploadCloud, FileText, Building2, UserCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/axios';

const STEPS = [
  { id: 1, title: 'Business Profile', icon: Building2 },
  { id: 2, title: 'Primary Contact & Docs', icon: UserCircle },
  { id: 3, title: 'Review & Submit', icon: CheckCircle2 }
];

export const CustomerRegister = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    number: '',
    tax_number: '',
    website: '',
    description: '',
    currency: 'AED',
    instagram: '',
    facebook: '',
    linkedin: '',
    twitter: '',
    salutation: 'Mr.',
    first_name: '',
    last_name: '',
    job_title: '',
    email: '',
    phone: '',
  });

  const [files, setFiles] = useState<{ license: File | null; vat: File | null }>({
    license: null,
    vat: null
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (type: 'license' | 'vat', e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFiles(prev => ({ ...prev, [type]: e.target.files![0] }));
    }
  };

  const handleNext = () => setStep(s => Math.min(3, s + 1));
  const handleBack = () => setStep(s => Math.max(1, s - 1));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        payload.append(key, value);
      });
      if (files.license) payload.append('license_attachment', files.license);
      if (files.vat) payload.append('vat_attachment', files.vat);

      await api.post('/public/register-company', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Registration Submitted', {
        description: 'Your company details have been successfully received.'
      });
      navigate('/portal/login');
    } catch (err: any) {
      toast.error('Registration Failed', {
        description: err.response?.data?.message || 'Please check your inputs and try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const isStep1Valid = formData.name.trim() !== '';
  const isStep2Valid = formData.first_name.trim() !== '' && formData.email.trim() !== '';

  return (
    <div className="min-h-screen bg-slate-950 font-sans flex flex-col pt-8 pb-16 px-4">
      <div className="max-w-4xl w-full mx-auto">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-10">
          <Logo size="lg" />
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-white">Partner with Zeronix</h1>
          <p className="mt-2 text-slate-400">Join our ecosystem to streamline your procurement</p>
        </div>

        {/* Stepper Progress */}
        <div className="flex items-center justify-between relative mb-12 max-w-2xl mx-auto before:absolute before:top-1/2 before:-translate-y-1/2 before:h-0.5 before:w-full before:bg-slate-800 before:-z-10">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const isActive = step >= s.id;
            return (
              <div key={s.id} className="flex flex-col items-center gap-3 relative z-10 bg-slate-950 px-2">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-xl ${
                  isActive ? 'bg-emerald-600 text-white shadow-emerald-900/30' : 'bg-slate-900 border border-slate-800 text-slate-500'
                }`}>
                  <Icon size={24} />
                </div>
                <span className={`text-xs font-semibold uppercase tracking-wider ${isActive ? 'text-emerald-400' : 'text-slate-600'}`}>
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Form Card */}
        <Card className="bg-slate-900 border-slate-800 shadow-2xl rounded-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
          <CardContent className="p-8">
            
            {/* STEP 1 */}
            {step === 1 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-white border-b border-slate-800 pb-2">Business Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Company Name <span className="text-red-500">*</span></Label>
                      <Input value={formData.name} onChange={e => handleChange('name', e.target.value)} placeholder="e.g. Acme Corp" className="bg-slate-950 border-slate-800 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Registration Number</Label>
                      <Input value={formData.number} onChange={e => handleChange('number', e.target.value)} placeholder="Trade License No." className="bg-slate-950 border-slate-800 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Tax Registration Number (TRN)</Label>
                      <Input value={formData.tax_number} onChange={e => handleChange('tax_number', e.target.value)} placeholder="VAT No." className="bg-slate-950 border-slate-800 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Website</Label>
                      <Input value={formData.website} onChange={e => handleChange('website', e.target.value)} placeholder="https://www.example.com" className="bg-slate-950 border-slate-800 text-white" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-slate-300">Company Description</Label>
                      <Textarea value={formData.description} onChange={e => handleChange('description', e.target.value)} placeholder="Briefly describe your business..." className="bg-slate-950 border-slate-800 text-white min-h-[80px]" />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-white border-b border-slate-800 pb-2">Preferences & Social (Optional)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Preferred Currency</Label>
                      <Select value={formData.currency} onValueChange={v => handleChange('currency', v)}>
                        <SelectTrigger className="bg-slate-950 border-slate-800 text-white h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800 text-white">
                          <SelectItem value="AED">AED (UAE Dirham)</SelectItem>
                          <SelectItem value="INR">INR (Indian Rupee)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">LinkedIn Profile</Label>
                      <Input value={formData.linkedin} onChange={e => handleChange('linkedin', e.target.value)} placeholder="linkedin.com/company/..." className="bg-slate-950 border-slate-800 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Facebook Page</Label>
                      <Input value={formData.facebook} onChange={e => handleChange('facebook', e.target.value)} placeholder="facebook.com/..." className="bg-slate-950 border-slate-800 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Instagram Handle</Label>
                      <Input value={formData.instagram} onChange={e => handleChange('instagram', e.target.value)} placeholder="@acmecorp" className="bg-slate-950 border-slate-800 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-white border-b border-slate-800 pb-2">Primary Contact Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Salutation</Label>
                      <Select value={formData.salutation} onValueChange={v => handleChange('salutation', v)}>
                        <SelectTrigger className="bg-slate-950 border-slate-800 text-white h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800 text-white">
                          {['Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.'].map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">First Name <span className="text-red-500">*</span></Label>
                      <Input value={formData.first_name} onChange={e => handleChange('first_name', e.target.value)} placeholder="John" className="bg-slate-950 border-slate-800 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Last Name</Label>
                      <Input value={formData.last_name} onChange={e => handleChange('last_name', e.target.value)} placeholder="Doe" className="bg-slate-950 border-slate-800 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Job Title</Label>
                      <Input value={formData.job_title} onChange={e => handleChange('job_title', e.target.value)} placeholder="Procurement Manager" className="bg-slate-950 border-slate-800 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Email Address <span className="text-red-500">*</span></Label>
                      <Input type="email" value={formData.email} onChange={e => handleChange('email', e.target.value)} placeholder="john@example.com" className="bg-slate-950 border-slate-800 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Phone Number</Label>
                      <Input value={formData.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="+971 50..." className="bg-slate-950 border-slate-800 text-white" />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-white border-b border-slate-800 pb-2">Document Verification</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 border border-slate-800 border-dashed rounded-xl bg-slate-950/50 flex flex-col items-center justify-center text-center hover:bg-slate-900 transition-colors relative cursor-pointer">
                      <input type="file" onChange={e => handleFileChange('license', e)} className="absolute inset-0 opacity-0 cursor-pointer" accept=".pdf,.jpg,.jpeg,.png" />
                      <FileText className="text-emerald-500 mb-3" size={32} />
                      <h4 className="text-sm font-semibold text-white">Trade License</h4>
                      <p className="text-xs text-slate-400 mt-1">{files.license ? files.license.name : 'Click or drag file to upload'}</p>
                    </div>
                    <div className="p-6 border border-slate-800 border-dashed rounded-xl bg-slate-950/50 flex flex-col items-center justify-center text-center hover:bg-slate-900 transition-colors relative cursor-pointer">
                      <input type="file" onChange={e => handleFileChange('vat', e)} className="absolute inset-0 opacity-0 cursor-pointer" accept=".pdf,.jpg,.jpeg,.png" />
                      <FileText className="text-emerald-500 mb-3" size={32} />
                      <h4 className="text-sm font-semibold text-white">VAT Certificate</h4>
                      <p className="text-xs text-slate-400 mt-1">{files.vat ? files.vat.name : 'Click or drag file to upload'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="text-center max-w-lg mx-auto">
                  <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Building2 className="text-emerald-400" size={40} />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Almost Done!</h2>
                  <p className="text-slate-400 mb-8">Please review your company profile before submitting.</p>
                </div>

                <div className="bg-slate-950 rounded-xl border border-slate-800 p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500 block mb-1">Company Name</span>
                      <span className="text-white font-medium">{formData.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-1">Contact Person</span>
                      <span className="text-white font-medium">{formData.salutation} {formData.first_name} {formData.last_name}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-1">Email</span>
                      <span className="text-white font-medium">{formData.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-1">Currency</span>
                      <span className="text-white font-medium">{formData.currency}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-1">Documents</span>
                      <div className="flex items-center gap-2 text-emerald-400">
                        {files.license && <span className="flex items-center text-xs bg-emerald-500/10 px-2 py-1 rounded"><CheckCircle2 size={12} className="mr-1"/> License</span>}
                        {files.vat && <span className="flex items-center text-xs bg-emerald-500/10 px-2 py-1 rounded"><CheckCircle2 size={12} className="mr-1"/> VAT</span>}
                        {!files.license && !files.vat && <span className="text-slate-500">No documents attached</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </CardContent>
          <CardFooter className="p-8 pt-0 flex items-center justify-between">
            {step > 1 ? (
              <Button variant="ghost" onClick={handleBack} className="text-slate-400 hover:text-white">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
            ) : (
              <Link to="/portal/login">
                <Button variant="ghost" className="text-slate-400 hover:text-white">Cancel</Button>
              </Link>
            )}

            {step < 3 ? (
              <Button 
                onClick={handleNext} 
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold min-w-[120px]"
                disabled={(step === 1 && !isStep1Valid) || (step === 2 && !isStep2Valid)}
              >
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold min-w-[160px] shadow-lg shadow-emerald-900/30"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Submit Registration'}
              </Button>
            )}
          </CardFooter>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-400">
            Already have an account? <Link to="/portal/login" className="text-emerald-500 hover:text-emerald-400 font-semibold hover:underline">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
