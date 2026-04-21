import { create } from 'zustand';
import { User, Customer } from '../types';

interface AuthState {
  admin: User | null;
  customer: Customer | null;
  setAdmin: (user: User | null) => void;
  setCustomer: (customer: Customer | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  admin: null,
  customer: null,
  setAdmin: (admin) => set({ admin }),
  setCustomer: (customer) => set({ customer }),
}));
