import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

// Every other module's URL segment is identical to its permission string
// (e.g. `deals` route -> `deals` permission). Supplier Broadcast is the
// first module with a namespaced/granular permission scheme
// (`supplier-broadcast.view`, `.edit`, ...), so its route segment
// (`supplier-broadcast`) doesn't match its gating permission string
// (`supplier-broadcast.view`) 1:1 — this map bridges that gap without
// touching the generic path-based check used by every other route.
const ROUTE_PERMISSION_OVERRIDES: Record<string, string> = {
  'supplier-broadcast': 'supplier-broadcast.view',
};

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
    const path = location.pathname.split('/')[2]; // /workspace/companies -> companies

    const publicModules = ['dashboard', 'settings', 'profile', 'notifications', 'documentation'];
    const adminOnlyModules = ['users', 'activities', 'system-docs'];

    if (path && !publicModules.includes(path)) {
        if (adminOnlyModules.includes(path)) {
            return <Navigate to="/workspace/dashboard" replace />;
        }
        const requiredPermission = ROUTE_PERMISSION_OVERRIDES[path] ?? path;
        if (admin.permissions && !admin.permissions.includes(requiredPermission)) {
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
