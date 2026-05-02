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

export const useAuthStore = create<AuthState>((set) => ({
  admin: null,
  customer: null,
  adminToken: typeof window !== 'undefined' 
    ? (window.location.pathname.startsWith('/staff') 
        ? (localStorage.getItem('zeronix_staff_token') || localStorage.getItem('zeronix_admin_token'))
        : (localStorage.getItem('zeronix_admin_token') || localStorage.getItem('zeronix_staff_token')))
    : null,
  customerToken: localStorage.getItem('zeronix_customer_portal_token'),
  isLoading: typeof window !== 'undefined' && !!(
    localStorage.getItem('zeronix_admin_token') || 
    localStorage.getItem('zeronix_staff_token') || 
    localStorage.getItem('zeronix_customer_portal_token')
  ),
  
  setAdmin: (admin, token) => {
    if (admin) {
      const key = admin.role === 'admin' ? 'zeronix_admin_token' : 'zeronix_staff_token';
      const otherKey = admin.role === 'admin' ? 'zeronix_staff_token' : 'zeronix_admin_token';
      
      if (token) {
        localStorage.setItem(key, token);
        localStorage.removeItem(otherKey); // Ensure no old session from other role persists
      }
    } else {
      localStorage.removeItem('zeronix_admin_token');
      localStorage.removeItem('zeronix_staff_token');
    }

    set({ 
      admin, 
      adminToken: token || (admin ? (localStorage.getItem('zeronix_admin_token') || localStorage.getItem('zeronix_staff_token')) : null), 
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
      localStorage.removeItem('zeronix_staff_token');
      set({ admin: null, adminToken: null });
    } else if (role === 'customer') {
      localStorage.removeItem('zeronix_customer_portal_token');
      set({ customer: null, customerToken: null });
    } else {
      localStorage.removeItem('zeronix_admin_token');
      localStorage.removeItem('zeronix_staff_token');
      localStorage.removeItem('zeronix_customer_portal_token');
      set({ admin: null, adminToken: null, customer: null, customerToken: null });
    }
    set({ isLoading: false });
  }
}));
