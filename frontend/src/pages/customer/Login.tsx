import React, { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate, Link } from 'react-router-dom';
import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowRight } from 'lucide-react';
import api from '@/lib/axios';

export const CustomerLogin = () => {
  const setCustomer = useAuthStore((state) => state.setCustomer);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/customer/login', { email, password });
      const { customer, token } = response.data;
      
      if (customer) {
        setCustomer(customer, token);
        navigate('/portal');
      } else {
        console.error('Login response missing customer data:', response.data);
        setError('Login failed: Invalid response from server.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-4 selection:bg-emerald-500/30">
      <div className="mb-10 animate-in fade-in zoom-in duration-1000">
        <Logo size="lg" />
      </div>
      
      <Card className="w-full max-w-md bg-slate-900 border-slate-800 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-white">Customer Portal</CardTitle>
          <CardDescription className="text-center text-slate-400">
            Sign in to manage your enquiries and orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium animate-shake text-center">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="customer@example.com" 
                required 
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-emerald-500 h-11"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" title="Password" className="text-slate-300">Password</Label>
                <Link to="#" className="text-xs text-emerald-500 hover:text-emerald-400">Forgot password?</Link>
              </div>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required 
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-emerald-500 h-11"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 text-base transition-all active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Logging in...
                </>
              ) : (
                <>
                  Access Portal <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-6 pt-6 border-t border-slate-800 text-center">
            <p className="text-sm text-slate-400">
              New to Zeronix? <Link to="/register" className="text-emerald-500 hover:text-emerald-400 font-semibold">Create an account</Link>
            </p>
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-8 flex items-center gap-4 text-slate-600 text-xs font-medium">
        <span>Privacy Policy</span>
        <span>•</span>
        <span>Terms of Service</span>
      </div>
    </div>
  );
};
