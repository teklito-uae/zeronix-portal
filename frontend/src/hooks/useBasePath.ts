import { useAuthStore } from '@/store/useAuthStore';

export const getBasePath = () => {
  const admin = useAuthStore.getState().admin;
  if (!admin) return '/login';
  return admin.role === 'super_admin' ? '/saas-admin' : '/workspace';
};
