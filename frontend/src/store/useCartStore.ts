import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/types';

interface CartItem {
  product?: Product;
  quantity: number;
  description?: string; // For manual entries
  isManual: boolean;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product) => void;
  addManualItem: (description: string, quantity: number) => void;
  removeItem: (productId?: number | string, description?: string) => void;
  updateQuantity: (quantity: number, productId?: number | string, description?: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (product) => set((state) => {
        const existing = state.items.find(i => i.product?.id === product.id);
        if (existing) {
          return {
            items: state.items.map(i => 
              i.product?.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
            )
          };
        }
        return { items: [...state.items, { product, quantity: 1, isManual: false }] };
      }),
      addManualItem: (description, quantity) => set((state) => ({
        items: [...state.items, { description, quantity, isManual: true }]
      })),
      removeItem: (productId, description) => set((state) => ({
        items: state.items.filter(i => {
          if (i.isManual) return i.description !== description;
          const pid = typeof productId === 'string' ? Number(productId) : productId;
          return i.product?.id !== pid;
        })
      })),
      updateQuantity: (quantity, productId, description) => set((state) => ({
        items: state.items.map(i => {
          const pid = typeof productId === 'string' ? Number(productId) : productId;
          const match = i.isManual ? i.description === description : i.product?.id === pid;
          return match ? { ...i, quantity: Math.max(1, quantity) } : i;
        })
      })),
      clearCart: () => set({ items: [] }),
    }),
    { name: 'zeronix_enquiry_cart' }
  )
);
