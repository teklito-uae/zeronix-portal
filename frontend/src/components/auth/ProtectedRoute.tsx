import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

export const AdminRoute = () => {
  const admin = useAuthStore((state) => state.admin);
  return admin ? <Outlet /> : <Navigate to="/admin/login" replace />;
};

export const CustomerRoute = () => {
  const customer = useAuthStore((state) => state.customer);
  return customer ? <Outlet /> : <Navigate to="/login" replace />;
};
