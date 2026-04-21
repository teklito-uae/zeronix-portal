import React from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate, Link } from 'react-router-dom';

export const CustomerLogin = () => {
  const setCustomer = useAuthStore((state) => state.setCustomer);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomer({ id: 1, name: 'Test Customer', email: 'customer@example.com' });
    navigate('/portal');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cust-bg">
      <div className="bg-white p-8 rounded-brand shadow-lg max-w-md w-full border border-cust-border">
        <h2 className="text-2xl font-bold mb-6 text-center text-zeronix-blue">Customer Login</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm mb-1 text-cust-text-secondary">Email</label>
            <input type="email" required className="w-full border border-cust-border rounded-brand px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1 text-cust-text-secondary">Password</label>
            <input type="password" required className="w-full border border-cust-border rounded-brand px-3 py-2" />
          </div>
          <button type="submit" className="w-full bg-zeronix-green text-white py-2 rounded-brand font-bold hover:opacity-90">Login</button>
        </form>
        <p className="mt-4 text-center text-sm text-cust-text-secondary">
          Don't have an account? <Link to="/register" className="text-zeronix-blue hover:underline">Register here</Link>
        </p>
      </div>
    </div>
  );
};
