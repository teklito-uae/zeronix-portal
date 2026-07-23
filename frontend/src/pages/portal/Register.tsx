import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '@/components/shared/Logo';
import { PhoneInput } from '@/components/shared/PhoneInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel, FieldDescription, FieldError, FieldSeparator } from '@/components/ui/field';
import { InputGroup, InputGroupInput, InputGroupAddon, InputGroupButton } from '@/components/ui/input-group';
import {
  Loader2, ArrowRight, ArrowLeft, FileText, Building2, UserCircle,
  CheckCircle2, Eye, EyeOff, Mail, Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/axios';

const STEPS = [
  { id: 1, title: 'Business Profile', icon: Building2 },
  { id: 2, title: 'Contact & Security', icon: UserCircle },
  { id: 3, title: 'Review & Submit', icon: CheckCircle2 }
];

const INDUSTRIES = [
  'Construction & Contracting',
  'Retail & Trading',
  'IT & Software Services',
  'Manufacturing',
  'Logistics & Transportation',
  'Hospitality & Food Services',
  'Healthcare',
  'Real Estate',
  'Consulting & Professional Services',
  'Other',
];

export const CustomerRegister = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    number: '',
    tax_number: '',
    website: '',
    description: '',
    industry: '',
    address: '',
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
    password: '',
    password_confirmation: '',
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

      setSubmitted(true);
    } catch (err: any) {
      toast.error('Registration Failed', {
        description: err.response?.data?.message || 'Please check your inputs and try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const isStep1Valid = formData.name.trim() !== '';
  const isStep2Valid =
    formData.first_name.trim() !== '' &&
    formData.email.trim() !== '' &&
    formData.password.length >= 8 &&
    formData.password === formData.password_confirmation;

  if (submitted) {
    return (
      <div className="min-h-screen bg-background font-sans flex flex-col items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-center mb-8">
            <Logo size="lg" />
          </div>
          <div className="w-16 h-16 rounded-2xl bg-brand-success/10 border border-brand-success/30 flex items-center justify-center mx-auto mb-6">
            <Clock className="text-brand-success" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-brand-primary mb-2">Registration submitted</h1>
          <p className="text-brand-muted mb-8">
            Thanks for registering <span className="font-semibold text-brand-secondary">{formData.name}</span>.
            An administrator will review your details and documents shortly. You'll be able to sign in with the
            password you set as soon as your account is approved.
          </p>
          <Card className="text-left mb-8">
            <CardContent className="p-5 flex gap-3">
              <Mail className="text-brand-accent shrink-0 mt-0.5" size={18} />
              <div className="text-sm text-brand-muted">
                We'll notify <span className="font-medium text-brand-secondary">{formData.email}</span> once your
                company is approved.
              </div>
            </CardContent>
          </Card>
          <Link to="/login">
            <Button variant="outline" className="w-full h-11">Back to login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col pt-8 pb-16 px-4">
      <div className="max-w-4xl w-full mx-auto">

        {/* Header */}
        <div className="flex flex-col items-center mb-10">
          <Logo size="lg" />
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-brand-primary">Register your business</h1>
          <p className="mt-2 text-brand-muted">Set up your company workspace on Zeronix</p>
        </div>

        {/* Stepper Progress */}
        <div className="flex items-center justify-between relative mb-12 max-w-2xl mx-auto before:absolute before:top-1/2 before:-translate-y-1/2 before:h-0.5 before:w-full before:bg-brand-border before:-z-10">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const isActive = step >= s.id;
            return (
              <div key={s.id} className="flex flex-col items-center gap-3 relative z-10 bg-background px-2">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border ${
                  isActive ? 'bg-brand-primary text-brand-white border-brand-primary' : 'bg-brand-surface border-brand-border text-brand-subtle'
                }`}>
                  <Icon size={24} />
                </div>
                <span className={`text-xs font-semibold uppercase tracking-wider ${isActive ? 'text-brand-primary' : 'text-brand-subtle'}`}>
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Form Card */}
        <Card className="animate-in fade-in slide-in-from-bottom-8 duration-700">
          <CardContent className="p-8">

            {/* STEP 1 */}
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                <FieldGroup>
                  <div>
                    <h3 className="text-lg font-semibold text-brand-primary border-b border-brand-border pb-2 mb-6">Business Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                      <Field>
                        <FieldLabel>Company Name <span className="text-brand-danger">*</span></FieldLabel>
                        <Input value={formData.name} onChange={e => handleChange('name', e.target.value)} placeholder="e.g. Acme Corp" />
                      </Field>
                      <Field>
                        <FieldLabel>Registration Number</FieldLabel>
                        <Input value={formData.number} onChange={e => handleChange('number', e.target.value)} placeholder="Trade License No." />
                      </Field>
                      <Field>
                        <FieldLabel>Tax Registration Number (TRN)</FieldLabel>
                        <Input value={formData.tax_number} onChange={e => handleChange('tax_number', e.target.value)} placeholder="VAT No." />
                      </Field>
                      <Field>
                        <FieldLabel>Industry</FieldLabel>
                        <Select value={formData.industry} onValueChange={v => handleChange('industry', v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an industry" />
                          </SelectTrigger>
                          <SelectContent>
                            {INDUSTRIES.map(i => (
                              <SelectItem key={i} value={i}>{i}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field>
                        <FieldLabel>Website</FieldLabel>
                        <Input value={formData.website} onChange={e => handleChange('website', e.target.value)} placeholder="https://www.example.com" />
                      </Field>
                      <Field>
                        <FieldLabel>Preferred Currency</FieldLabel>
                        <Select value={formData.currency} onValueChange={v => handleChange('currency', v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AED">AED (UAE Dirham)</SelectItem>
                            <SelectItem value="INR">INR (Indian Rupee)</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field className="md:col-span-2">
                        <FieldLabel>Business Address</FieldLabel>
                        <Textarea value={formData.address} onChange={e => handleChange('address', e.target.value)} placeholder="Street, city, emirate/state, country" className="min-h-[70px]" />
                      </Field>
                      <Field className="md:col-span-2">
                        <FieldLabel>Company Description</FieldLabel>
                        <Textarea value={formData.description} onChange={e => handleChange('description', e.target.value)} placeholder="Briefly describe your business..." className="min-h-[80px]" />
                      </Field>
                    </div>
                  </div>

                  <FieldSeparator />

                  <div>
                    <h3 className="text-lg font-semibold text-brand-primary border-b border-brand-border pb-2 mb-6">Social Presence (Optional)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                      <Field>
                        <FieldLabel>LinkedIn Profile</FieldLabel>
                        <Input value={formData.linkedin} onChange={e => handleChange('linkedin', e.target.value)} placeholder="linkedin.com/company/..." />
                      </Field>
                      <Field>
                        <FieldLabel>Facebook Page</FieldLabel>
                        <Input value={formData.facebook} onChange={e => handleChange('facebook', e.target.value)} placeholder="facebook.com/..." />
                      </Field>
                      <Field>
                        <FieldLabel>Instagram Handle</FieldLabel>
                        <Input value={formData.instagram} onChange={e => handleChange('instagram', e.target.value)} placeholder="@acmecorp" />
                      </Field>
                      <Field>
                        <FieldLabel>Twitter / X Handle</FieldLabel>
                        <Input value={formData.twitter} onChange={e => handleChange('twitter', e.target.value)} placeholder="@acmecorp" />
                      </Field>
                    </div>
                  </div>
                </FieldGroup>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                <FieldGroup>
                  <div>
                    <h3 className="text-lg font-semibold text-brand-primary border-b border-brand-border pb-2 mb-6">Primary Contact Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                      <Field>
                        <FieldLabel>Salutation</FieldLabel>
                        <Select value={formData.salutation} onValueChange={v => handleChange('salutation', v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {['Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.'].map(s => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field>
                        <FieldLabel>Job Title</FieldLabel>
                        <Input value={formData.job_title} onChange={e => handleChange('job_title', e.target.value)} placeholder="Procurement Manager" />
                      </Field>
                      <Field>
                        <FieldLabel>First Name <span className="text-brand-danger">*</span></FieldLabel>
                        <Input value={formData.first_name} onChange={e => handleChange('first_name', e.target.value)} placeholder="John" />
                      </Field>
                      <Field>
                        <FieldLabel>Last Name</FieldLabel>
                        <Input value={formData.last_name} onChange={e => handleChange('last_name', e.target.value)} placeholder="Doe" />
                      </Field>
                      <Field>
                        <FieldLabel>Email Address <span className="text-brand-danger">*</span></FieldLabel>
                        <Input type="email" value={formData.email} onChange={e => handleChange('email', e.target.value)} placeholder="john@example.com" />
                      </Field>
                      <Field>
                        <FieldLabel>Phone Number</FieldLabel>
                        <PhoneInput value={formData.phone} onChange={v => handleChange('phone', v || '')} />
                      </Field>
                    </div>
                  </div>

                  <FieldSeparator />

                  <div>
                    <h3 className="text-lg font-semibold text-brand-primary border-b border-brand-border pb-2 mb-6">Set Your Login Password</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                      <Field data-invalid={formData.password.length > 0 && formData.password.length < 8}>
                        <FieldLabel>Password <span className="text-brand-danger">*</span></FieldLabel>
                        <InputGroup>
                          <InputGroupInput
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={e => handleChange('password', e.target.value)}
                            aria-invalid={formData.password.length > 0 && formData.password.length < 8}
                          />
                          <InputGroupAddon align="inline-end">
                            <InputGroupButton
                              type="button"
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                              onClick={() => setShowPassword(v => !v)}
                            >
                              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </InputGroupButton>
                          </InputGroupAddon>
                        </InputGroup>
                        <FieldDescription>At least 8 characters.</FieldDescription>
                      </Field>
                      <Field data-invalid={formData.password_confirmation.length > 0 && formData.password !== formData.password_confirmation}>
                        <FieldLabel>Confirm Password <span className="text-brand-danger">*</span></FieldLabel>
                        <InputGroup>
                          <InputGroupInput
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={formData.password_confirmation}
                            onChange={e => handleChange('password_confirmation', e.target.value)}
                            aria-invalid={formData.password_confirmation.length > 0 && formData.password !== formData.password_confirmation}
                          />
                          <InputGroupAddon align="inline-end">
                            <InputGroupButton
                              type="button"
                              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                              onClick={() => setShowConfirmPassword(v => !v)}
                            >
                              {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </InputGroupButton>
                          </InputGroupAddon>
                        </InputGroup>
                        {formData.password_confirmation.length > 0 && formData.password !== formData.password_confirmation && (
                          <FieldError>Passwords don't match.</FieldError>
                        )}
                      </Field>
                    </div>
                  </div>

                  <FieldSeparator />

                  <div>
                    <h3 className="text-lg font-semibold text-brand-primary border-b border-brand-border pb-2 mb-6">Document Verification (Optional)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 border border-brand-border border-dashed rounded-xl bg-brand-surface flex flex-col items-center justify-center text-center hover:bg-brand-bg transition-colors relative cursor-pointer">
                        <input type="file" onChange={e => handleFileChange('license', e)} className="absolute inset-0 opacity-0 cursor-pointer" accept=".pdf,.jpg,.jpeg,.png" />
                        <FileText className="text-brand-accent mb-3" size={32} />
                        <h4 className="text-sm font-semibold text-brand-primary">Trade License</h4>
                        <p className="text-xs text-brand-muted mt-1">{files.license ? files.license.name : 'Click or drag file to upload'}</p>
                      </div>
                      <div className="p-6 border border-brand-border border-dashed rounded-xl bg-brand-surface flex flex-col items-center justify-center text-center hover:bg-brand-bg transition-colors relative cursor-pointer">
                        <input type="file" onChange={e => handleFileChange('vat', e)} className="absolute inset-0 opacity-0 cursor-pointer" accept=".pdf,.jpg,.jpeg,.png" />
                        <FileText className="text-brand-accent mb-3" size={32} />
                        <h4 className="text-sm font-semibold text-brand-primary">VAT Certificate</h4>
                        <p className="text-xs text-brand-muted mt-1">{files.vat ? files.vat.name : 'Click or drag file to upload'}</p>
                      </div>
                    </div>
                  </div>
                </FieldGroup>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="text-center max-w-lg mx-auto">
                  <div className="w-20 h-20 bg-brand-accent-light rounded-full flex items-center justify-center mx-auto mb-6">
                    <Building2 className="text-brand-accent" size={40} />
                  </div>
                  <h2 className="text-2xl font-bold text-brand-primary mb-2">Almost Done!</h2>
                  <p className="text-brand-muted mb-8">Please review your company profile before submitting.</p>
                </div>

                <div className="bg-brand-surface rounded-xl border border-brand-border p-6 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-brand-subtle block mb-1">Company Name</span>
                    <span className="text-brand-primary font-medium">{formData.name}</span>
                  </div>
                  <div>
                    <span className="text-brand-subtle block mb-1">Industry</span>
                    <span className="text-brand-primary font-medium">{formData.industry || '—'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-brand-subtle block mb-1">Address</span>
                    <span className="text-brand-primary font-medium">{formData.address || '—'}</span>
                  </div>
                  <div>
                    <span className="text-brand-subtle block mb-1">Contact Person</span>
                    <span className="text-brand-primary font-medium">{formData.salutation} {formData.first_name} {formData.last_name}</span>
                  </div>
                  <div>
                    <span className="text-brand-subtle block mb-1">Email</span>
                    <span className="text-brand-primary font-medium">{formData.email}</span>
                  </div>
                  <div>
                    <span className="text-brand-subtle block mb-1">Currency</span>
                    <span className="text-brand-primary font-medium">{formData.currency}</span>
                  </div>
                  <div>
                    <span className="text-brand-subtle block mb-1">Documents</span>
                    <div className="flex items-center gap-2 text-brand-success">
                      {files.license && <span className="flex items-center text-xs bg-brand-success-bg px-2 py-1 rounded"><CheckCircle2 size={12} className="mr-1"/> License</span>}
                      {files.vat && <span className="flex items-center text-xs bg-brand-success-bg px-2 py-1 rounded"><CheckCircle2 size={12} className="mr-1"/> VAT</span>}
                      {!files.license && !files.vat && <span className="text-brand-subtle">No documents attached</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </CardContent>
          <CardFooter className="p-8 pt-0 flex items-center justify-between">
            {step > 1 ? (
              <Button variant="ghost" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
            ) : (
              <Link to="/login">
                <Button variant="ghost">Cancel</Button>
              </Link>
            )}

            {step < 3 ? (
              <Button
                onClick={handleNext}
                className="min-w-[120px]"
                disabled={(step === 1 && !isStep1Valid) || (step === 2 && !isStep2Valid)}
              >
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="min-w-[160px] font-bold"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Submit Registration'}
              </Button>
            )}
          </CardFooter>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-sm text-brand-muted">
            Already have an account? <Link to="/login" className="text-brand-accent hover:text-brand-accent-hover font-semibold hover:underline">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
