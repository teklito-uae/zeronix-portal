import React from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate } from 'react-router-dom';


export const AdminLogin = () => {
  const setAdmin = useAuthStore((state) => state.setAdmin);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    // Dummy bypass for now, to be integrated with API
    try {
      // await api.get('/sanctum/csrf-cookie');
      // const res = await api.post('/api/admin/login', { email, password });
      setAdmin({ id: 1, name: 'Admin', email: 'admin@zeronix.com' });
      navigate('/admin/dashboard');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-admin-bg">
      <div className="bg-admin-surface p-8 rounded-brand shadow-lg max-w-md w-full border border-admin-border">
        <h2 className="text-2xl font-bold mb-6 text-center text-zeronix-blue">Zeronix Admin Login</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm mb-1 text-admin-text-secondary">Email</label>
            <input type="email" required className="w-full border border-admin-border rounded-brand px-3 py-2 bg-admin-bg text-admin-text-primary" />
          </div>
          <div>
            <label className="block text-sm mb-1 text-admin-text-secondary">Password</label>
            <input type="password" required className="w-full border border-admin-border rounded-brand px-3 py-2 bg-admin-bg text-admin-text-primary" />
          </div>
          <button type="submit" className="w-full bg-zeronix-blue text-white py-2 rounded-brand hover:opacity-90">Login</button>
        </form>
      </div>
    </div>
  );
};
