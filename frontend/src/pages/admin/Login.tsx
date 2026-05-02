import React, { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import api from '@/lib/axios';

export const AdminLogin = ({ type = 'admin' }: { type?: 'admin' | 'staff' }) => {
  const setAdmin = useAuthStore((state) => state.setAdmin);
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
      const response = await api.post('/admin/login', { email, password });
      const { user, token } = response.data;
      
      // Strict role enforcement
      if (type === 'admin' && user.role !== 'admin') {
        setError('This portal is restricted to administrators. Please use the Staff login page.');
        setLoading(false);
        return;
      }

      if (type === 'staff' && user.role === 'admin') {
        setError('Administrators must log in through the Admin portal.');
        setLoading(false);
        return;
      }

      setAdmin(user, token);
      if (type === 'staff') {
        navigate('/staff/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials or server error.');
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
          <CardTitle className="text-2xl font-bold text-center text-white">
            {type === 'staff' ? 'Staff Portal' : 'Admin Access'}
          </CardTitle>
          <CardDescription className="text-center text-slate-400">
            {type === 'staff' ? 'Secure login for sales team' : 'Secure login for Zeronix administrators'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium animate-shake">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@zeronix.com" 
                required 
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-emerald-500 h-11"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-300">Password</Label>
              </div>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-emerald-500 h-11"
              />
            </div>
            <Button 
              type="submit" 
              className={`w-full ${type === 'staff' ? 'bg-zeronix-blue hover:bg-zeronix-blue-hover' : 'bg-emerald-600 hover:bg-emerald-500'} text-white font-bold h-12 text-base transition-all active:scale-[0.98]`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                type === 'staff' ? 'Sign In as Staff' : 'Sign In as Admin'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <div className="mt-8 flex items-center gap-6 text-slate-500 text-xs font-medium uppercase tracking-widest">
        <span>Enterprise Secure</span>
        <div className="w-1 h-1 bg-slate-700 rounded-full" />
        <span>v2.0.4</span>
      </div>
    </div>
  );
};
