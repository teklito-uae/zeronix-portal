import { create } from 'zustand';
import type { User, Customer } from '../types';

interface AuthState {
  admin: User | null;
  customer: Customer | null;
  adminToken: string | null;
  customerToken: string | null;
  isLoading: boolean;
  setAdmin: (user: User | null, token?: string | null) => void;
  setCustomer: (customer: Customer | null, token?: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  logout: (role?: 'admin' | 'customer') => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  admin: null,
  customer: null,
  adminToken: localStorage.getItem('zeronix_admin_token'),
  customerToken: localStorage.getItem('zeronix_customer_portal_token'),
  isLoading: !!(localStorage.getItem('zeronix_admin_token') || localStorage.getItem('zeronix_customer_portal_token')),
  
  setAdmin: (admin, token) => {
    if (token) localStorage.setItem('zeronix_admin_token', token);
    if (admin === null && !token) localStorage.removeItem('zeronix_admin_token');
    set({ 
      admin, 
      adminToken: token || (admin ? localStorage.getItem('zeronix_admin_token') : null), 
      isLoading: false 
    });
  },

  setCustomer: (customer, token) => {
    if (token) localStorage.setItem('zeronix_customer_portal_token', token);
    if (customer === null && !token) localStorage.removeItem('zeronix_customer_portal_token');
    set({ 
      customer, 
      customerToken: token || (customer ? localStorage.getItem('zeronix_customer_portal_token') : null), 
      isLoading: false 
    });
  },

  setIsLoading: (isLoading) => set({ isLoading }),

  logout: (role) => {
    if (role === 'admin') {
      localStorage.removeItem('zeronix_admin_token');
      set({ admin: null, adminToken: null });
    } else if (role === 'customer') {
      localStorage.removeItem('zeronix_customer_portal_token');
      set({ customer: null, customerToken: null });
    } else {
      localStorage.removeItem('zeronix_admin_token');
      localStorage.removeItem('zeronix_customer_portal_token');
      set({ admin: null, adminToken: null, customer: null, customerToken: null });
    }
    set({ isLoading: false });
  }
}));
