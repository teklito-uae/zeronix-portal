import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export const CustomerRegister = () => {
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cust-bg py-12">
      <div className="bg-white p-8 rounded-brand shadow-lg max-w-md w-full border border-cust-border">
        <h2 className="text-2xl font-bold mb-6 text-center text-zeronix-blue">Register Account</h2>
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm mb-1 text-cust-text-secondary">Full Name</label>
            <input type="text" required className="w-full border border-cust-border rounded-brand px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1 text-cust-text-secondary">Email</label>
            <input type="email" required className="w-full border border-cust-border rounded-brand px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1 text-cust-text-secondary">Company Name (Optional)</label>
            <input type="text" className="w-full border border-cust-border rounded-brand px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1 text-cust-text-secondary">Password</label>
            <input type="password" required className="w-full border border-cust-border rounded-brand px-3 py-2" />
          </div>
          <button type="submit" className="w-full bg-zeronix-green text-white py-2 rounded-brand font-bold hover:opacity-90">Create Account</button>
        </form>
        <p className="mt-4 text-center text-sm text-cust-text-secondary">
          Already have an account? <Link to="/login" className="text-zeronix-blue hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
};
