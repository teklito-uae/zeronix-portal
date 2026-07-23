import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupInput, InputGroupAddon, InputGroupButton } from '@/components/ui/input-group';
import { Loader2, AlertCircle, Clock, CheckCircle2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import api from '@/lib/axios';

const FEATURES = [
  "Seamless Workspace",
  "Instant Invoicing",
  "Real-time Updates",
  "Dedicated Support"
];

export const UnifiedLogin = () => {
  const { setAdmin, setCustomer } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<{ message: string; pending?: boolean } | null>(null);
  const [featureIndex, setFeatureIndex] = useState(0);

  // Determine context from URL
  const isPlatform = location.pathname.includes('/saas-admin');
  const isPortal = location.pathname.includes('/portal');
  const isWorkspace = !isPlatform && !isPortal;

  const loginType = isPortal ? 'client' : 'team';

  useEffect(() => {
    const interval = setInterval(() => {
      setFeatureIndex((prev) => (prev + 1) % FEATURES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isPortal) {
        // Authenticate against customers table
        const response = await api.post('/customer/login', { email, password });
        const { customer, token } = response.data;
        if (customer) {
          setCustomer(customer, token);
          navigate(`/portal/${customer.company_id || 'company'}/dashboard`);
        } else {
          setError({ message: 'Invalid client response' });
        }
      } else {
        // Authenticate against users table
        const response = await api.post('/admin/login', { email, password });
        const { user, token } = response.data;
        if (user) {
          setAdmin(user, token);
          navigate(user.role === 'super_admin' ? '/saas-admin/dashboard' : '/workspace/dashboard');
        } else {
          setError({ message: 'Invalid workspace response' });
        }
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError({ message: err.response?.data?.message || 'Your account is pending approval.', pending: true });
      } else if (isWorkspace && err.response?.status === 401) {
        // If workspace login fails, try portal as fallback if not explicitly platform
        try {
          const fallbackRes = await api.post('/customer/login', { email, password });
          const { customer, token } = fallbackRes.data;
          if (customer) {
            setCustomer(customer, token);
            navigate(`/portal/${customer.company_id || 'company'}/dashboard`);
            return;
          }
        } catch (fallbackErr) {
          setError({ message: 'Invalid email or password' });
        }
      } else {
        setError({ message: err.response?.data?.message || 'Invalid email or password' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-background font-sans">
      {/* Left Column - Form */}
      <div className="flex flex-col justify-center px-8 sm:px-16 lg:px-24 xl:px-32 py-12 relative z-10 bg-background">
        <div className="w-full max-w-sm mx-auto">
          <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 text-center">
            <div className="flex justify-center mb-6">
              <Logo size="lg" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-brand-primary">
              {isPlatform ? 'Zeronix Platform' : isPortal ? 'Client Portal' : 'Workspace Login'}
            </h1>
            <p className="mt-2 text-sm text-brand-muted">
              {isPlatform ? 'Sign in to God Mode.' : 'Enter your credentials to sign in.'}
            </p>
          </div>

          <form onSubmit={handleLogin} className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <FieldGroup>
              {error && (
                <Alert
                  variant={error.pending ? 'default' : 'destructive'}
                  className={error.pending ? 'border-brand-warning/30 bg-brand-warning-bg [&>svg]:text-brand-warning-text' : undefined}
                >
                  {error.pending ? <Clock className="size-4" /> : <AlertCircle className="size-4" />}
                  <AlertDescription className={error.pending ? 'text-brand-warning-text' : undefined}>
                    {error.message}
                  </AlertDescription>
                </Alert>
              )}
              <Field>
                <FieldLabel htmlFor="email">Email Address</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={loginType === 'client' ? 'client@company.com' : 'staff@zeronix.com'}
                  required
                  className="h-11 rounded-lg"
                />
              </Field>
              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Link to="#" className="text-xs text-brand-accent hover:text-brand-accent-hover font-medium">Forgot password?</Link>
                </div>
                <InputGroup className="h-11 rounded-lg">
                  <InputGroupInput
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
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
              </Field>
              <Button
                type="submit"
                size="lg"
                className={`w-full h-11 rounded-lg text-base font-bold ${loginType === 'client' ? 'bg-brand-success hover:opacity-90' : ''}`}
                disabled={loading}
              >
                {loading ? <Loader2 className="size-5 animate-spin" /> : 'Sign In securely'}
              </Button>
            </FieldGroup>
          </form>

          {loginType === 'client' && (
            <div className="mt-8 text-center animate-in fade-in duration-1000 delay-300">
              <p className="text-sm text-brand-muted">
                New to Zeronix?{' '}
                <Link to="/register" className="text-brand-accent hover:text-brand-accent-hover font-bold hover:underline transition-all">
                  Register your company
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Column - Showcase */}
      <div className={`hidden lg:flex flex-col items-center justify-center relative overflow-hidden border-l border-brand-border transition-colors duration-1000 ${loginType === 'client' ? 'bg-brand-success-bg' : 'bg-brand-accent-light'}`}>
        {/* Pattern Overlay */}
        <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(${loginType === 'client' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(79, 70, 229, 0.14)'} 1px, transparent 1px)`, backgroundSize: '32px 32px' }}></div>

        <div className="relative z-10 p-12 max-w-lg text-center">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-8 border transition-all duration-1000 ${loginType === 'client' ? 'bg-brand-success/10 border-brand-success/30' : 'bg-brand-accent/10 border-brand-accent/30'}`}>
            <ShieldCheck size={32} className={loginType === 'client' ? 'text-brand-success' : 'text-brand-accent'} />
          </div>
          <h2 className="text-4xl font-extrabold text-brand-primary tracking-tight mb-4">
            {loginType === 'client' ? 'Welcome to the Hub' : 'Zeronix Mission Control'}
          </h2>
          <p className={`text-lg mb-12 ${loginType === 'client' ? 'text-brand-success-text' : 'text-brand-secondary'}`}>
            {loginType === 'client'
              ? 'The all-in-one portal designed to elevate your experience with Zeronix.'
              : 'Secure access to manage the SaaS platform and oversee global operations.'}
          </p>

          <div className="h-16 relative flex items-center justify-center">
            {FEATURES.map((feature, idx) => (
              <div
                key={idx}
                className={`absolute transition-all duration-500 flex items-center gap-3 text-2xl font-bold ${loginType === 'client' ? 'text-brand-success-text' : 'text-brand-accent'} ${
                  idx === featureIndex ? 'opacity-100 transform-none' : 'opacity-0 translate-y-4'
                }`}
              >
                <CheckCircle2 size={28} className={loginType === 'client' ? 'text-brand-success' : 'text-brand-accent'} />
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
