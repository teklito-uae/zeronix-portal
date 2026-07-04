import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ShieldCheck, CheckCircle2 } from 'lucide-react';
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
  const [error, setError] = useState<string | null>(null);
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
          setError('Invalid client response');
        }
      } else {
        // Authenticate against users table
        const response = await api.post('/admin/login', { email, password });
        const { user, token } = response.data;
        if (user) {
          setAdmin(user, token);
          if (user.role === 'super_admin') {
            if (!isPlatform) {
              navigate('/saas-admin/dashboard');
            } else {
              navigate('/saas-admin/dashboard');
            }
          } else {
            navigate('/workspace/dashboard');
          }
        } else {
          setError('Invalid workspace response');
        }
      }
    } catch (err: any) {
      // If workspace login fails, try portal as fallback if not explicitly platform
      if (isWorkspace && err.response?.status === 401) {
        try {
          const fallbackRes = await api.post('/customer/login', { email, password });
          const { customer, token } = fallbackRes.data;
          if (customer) {
            setCustomer(customer, token);
            navigate(`/portal/${customer.company_id || 'company'}/dashboard`);
            return;
          }
        } catch (fallbackErr) {
          setError('Invalid email or password');
        }
      } else {
        setError(err.response?.data?.message || 'Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-slate-950 font-sans">
      {/* Left Column - Form */}
      <div className="flex flex-col justify-center px-8 sm:px-16 lg:px-24 xl:px-32 py-12 relative z-10 bg-slate-950 border-r border-slate-900 shadow-2xl">
        <div className="w-full max-w-sm mx-auto">
          <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 text-center">
            <div className="flex justify-center mb-6">
              <Logo size="lg" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              {isPlatform ? 'Zeronix Platform' : isPortal ? 'Client Portal' : 'Workspace Login'}
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              {isPlatform ? 'Sign in to God Mode.' : 'Enter your credentials to sign in.'}
            </p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-5 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium flex items-center gap-2 animate-shake">
                <ShieldCheck size={16} />
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300 text-xs uppercase tracking-wider font-semibold">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={loginType === 'client' ? 'client@company.com' : 'staff@zeronix.com'} 
                required 
                className="bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-emerald-500 h-12 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" title="Password" className="text-slate-300 text-xs uppercase tracking-wider font-semibold">Password</Label>
                <Link to="#" className="text-xs text-emerald-500 hover:text-emerald-400 font-medium">Forgot password?</Link>
              </div>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required 
                className="bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-emerald-500 h-12 rounded-xl"
              />
            </div>
            <Button 
              type="submit" 
              className={`w-full ${loginType === 'client' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20' : 'bg-zeronix-blue hover:bg-blue-600 shadow-blue-900/20'} text-white font-bold h-12 rounded-xl text-base transition-all active:scale-[0.98] shadow-lg`}
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Sign In securely'}
            </Button>
          </form>

          {loginType === 'client' && (
            <div className="mt-8 text-center animate-in fade-in duration-1000 delay-300">
              <p className="text-sm text-slate-400">
                New to Zeronix?{' '}
                <Link to="/register" className="text-emerald-500 hover:text-emerald-400 font-bold hover:underline transition-all">
                  Register your company
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Column - Showcase */}
      <div className={`hidden lg:flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-1000 ${loginType === 'client' ? 'bg-emerald-950' : 'bg-slate-900'}`}>
        {/* Pattern Overlay */}
        <div className={`absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] ${loginType === 'client' ? 'from-emerald-400/40 via-emerald-900/20 to-transparent' : 'from-blue-400/40 via-blue-900/20 to-transparent'}`}></div>
        <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(${loginType === 'client' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)'} 1px, transparent 1px)`, backgroundSize: '32px 32px' }}></div>
        
        <div className="relative z-10 p-12 max-w-lg text-center">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-8 border transition-all duration-1000 ${loginType === 'client' ? 'bg-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.3)] border-emerald-500/30' : 'bg-blue-500/20 shadow-[0_0_40px_rgba(59,130,246,0.3)] border-blue-500/30'}`}>
            <ShieldCheck size={32} className={loginType === 'client' ? 'text-emerald-400' : 'text-blue-400'} />
          </div>
          <h2 className="text-4xl font-extrabold text-white tracking-tight mb-4" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            {loginType === 'client' ? 'Welcome to the Hub' : 'Zeronix Mission Control'}
          </h2>
          <p className={`text-lg mb-12 ${loginType === 'client' ? 'text-emerald-200/80' : 'text-blue-200/80'}`}>
            {loginType === 'client' 
              ? 'The all-in-one portal designed to elevate your experience with Zeronix.' 
              : 'Secure access to manage the SaaS platform and oversee global operations.'}
          </p>
          
          <div className="h-16 relative flex items-center justify-center">
            {FEATURES.map((feature, idx) => (
              <div 
                key={idx}
                className={`absolute transition-all duration-500 flex items-center gap-3 text-2xl font-bold ${loginType === 'client' ? 'text-emerald-300' : 'text-blue-300'} ${
                  idx === featureIndex ? 'opacity-100 transform-none' : 'opacity-0 translate-y-4'
                }`}
              >
                <CheckCircle2 size={28} className={loginType === 'client' ? 'text-emerald-400' : 'text-blue-400'} />
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
