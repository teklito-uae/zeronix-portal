import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

export const AdminRoute = () => {
  const { admin, isLoading } = useAuthStore();
  const location = useLocation();
  
  if (isLoading) return null;
  if (!admin) {
    const isPlatformPath = location.pathname.startsWith('/saas-admin');
    return <Navigate to={isPlatformPath ? "/saas-admin/login" : "/login"} replace />;
  }

  // Enforce Route Segregation
  const isPlatformPath = location.pathname.startsWith('/saas-admin');
  const isWorkspacePath = location.pathname.startsWith('/workspace');

  if (isPlatformPath && admin.role !== 'super_admin') {
    return <Navigate to="/workspace/dashboard" replace />;
  }
  
  if (isWorkspacePath && admin.role === 'super_admin') {
    return <Navigate to="/saas-admin/dashboard" replace />;
  }

  // Permission Check for Salesmen/Staff in Workspace
  if (isWorkspacePath && admin.role !== 'admin' && admin.role !== 'super_admin') {
    const path = location.pathname.split('/')[2]; // /workspace/customers -> customers
    
    const publicModules = ['dashboard', 'settings', 'chat', 'profile', 'notifications'];
    const adminOnlyModules = ['users', 'bulk-import', 'activities', 'companies', 'system-docs'];

    if (path && !publicModules.includes(path)) {
        if (adminOnlyModules.includes(path)) {
            return <Navigate to="/workspace/dashboard" replace />;
        }
        if (admin.permissions && !admin.permissions.includes(path)) {
            return <Navigate to="/workspace/dashboard" replace />;
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
