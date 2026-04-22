import React, { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export const AdminLogin = () => {
  const setAdmin = useAuthStore((state) => state.setAdmin);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API delay for a professional feel
    setTimeout(() => {
      setAdmin({ id: 1, name: 'Admin User', email: 'admin@zeronix.com' });
      navigate('/admin/dashboard');
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-4 selection:bg-emerald-500/30">
      <div className="mb-10 animate-in fade-in zoom-in duration-1000">
        <Logo size="lg" />
      </div>
      
      <Card className="w-full max-w-md bg-slate-900 border-slate-800 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-white">Admin Access</CardTitle>
          <CardDescription className="text-center text-slate-400">
            Secure login for Zeronix administrators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="admin@zeronix.com" 
                required 
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-emerald-500 h-11"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" title="Password" className="text-slate-300">Password</Label>
              </div>
              <Input 
                id="password" 
                type="password" 
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
                  Verifying...
                </>
              ) : (
                'Sign In to Dashboard'
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
