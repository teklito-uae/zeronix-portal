import { useAuthStore } from '@/store/useAuthStore';

export const getBasePath = () => {
  const admin = useAuthStore.getState().admin;
  return admin?.role === 'salesman' ? '/staff' : '/admin';
};
