import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

export const AdminRoute = () => {
  const { admin, isLoading } = useAuthStore();
  const location = useLocation();
  
  if (isLoading) return null;
  if (!admin) return <Navigate to="/admin/login" replace />;

  // Permission Check for Salesmen
  if (admin.role !== 'admin') {
    const path = location.pathname.split('/')[2]; // /admin/customers -> customers
    
    const publicModules = ['dashboard', 'settings', 'chat', 'profile'];
    const adminOnlyModules = ['users', 'bulk-import', 'activities'];

    if (path && !publicModules.includes(path)) {
        if (adminOnlyModules.includes(path)) {
            return <Navigate to="/admin/dashboard" replace />;
        }
        if (admin.permissions && !admin.permissions.includes(path)) {
            return <Navigate to="/admin/dashboard" replace />;
        }
    }
  }

  return <Outlet />;
};

export const CustomerRoute = () => {
  const { customer, isLoading } = useAuthStore();
  
  if (isLoading) return null; // Wait for hydration
  if (!customer) return <Navigate to="/portal/login" replace />;
  if (customer.is_portal_active === false) return <Navigate to="/portal/login" replace />;
  
  return <Outlet />;
};
