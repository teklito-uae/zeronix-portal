import axios from 'axios';
import { queryClient } from './queryClient';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Required for Sanctum CSRF cookies
});

// Request interceptor to attach bearer token based on route
api.interceptors.request.use((config) => {
  // Rewrite UI-based path prefixes to the actual backend API prefix
  if (config.url?.includes('/workspace/')) {
    config.url = config.url.replace('/workspace/', '/admin/');
  } else if (config.url?.includes('/saas-admin/')) {
    config.url = config.url.replace('/saas-admin/', '/admin/');
  }

  // For FormData uploads, remove the global Content-Type so the browser
  // auto-generates the multipart/form-data boundary. Without this, the
  // global 'application/json' override strips the boundary and PHP sees no file.
  if (config.data instanceof FormData && config.headers) {
    delete config.headers['Content-Type'];
  }

  const isCustomerRoute = config.url?.includes('/customer/');
  const isAdminRoute = config.url?.includes('/admin/');
  
  let token = null;
  
  if (isCustomerRoute) {
    token = localStorage.getItem('zeronix_customer_portal_token');
  } else if (isAdminRoute) {
    token = localStorage.getItem('zeronix_admin_token') || localStorage.getItem('zeronix_staff_token');
  } else {
    // Fallback for ambiguous routes
    token = localStorage.getItem('zeronix_admin_token') || 
            localStorage.getItem('zeronix_customer_portal_token');
  }

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor to trigger notification checks on admin/customer mutations.
// Scoped to write methods only (GET requests can't create a notification), so
// browsing list/dashboard pages doesn't fire an extra notifications call per request.
const MUTATING_METHODS = new Set(['post', 'put', 'patch', 'delete']);

api.interceptors.response.use((response) => {
  const url = response.config.url || '';
  const method = response.config.method?.toLowerCase() || '';

  if (!MUTATING_METHODS.has(method) || url.includes('/notifications')) {
    return response;
  }

  if (url.includes('/admin/')) {
    queryClient.refetchQueries({ queryKey: ['topbar-notifications', 'admin'] });
  } else if (url.includes('/customer/')) {
    queryClient.refetchQueries({ queryKey: ['unread-notifications', 'customer'] });
  }

  return response;
}, (error) => {
  return Promise.reject(error);
});

export default api;
