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
    delete (config.headers as any)['Content-Type'];
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

// Response interceptor to trigger notification checks on any admin API activity
api.interceptors.response.use((response) => {
  const url = response.config.url || '';
  
  // If an API call was made (excluding the notification fetch itself to prevent loops)
  // we refetch the notifications query so it instantly updates.
  if (url.includes('/admin/') && !url.includes('/notifications')) {
    queryClient.refetchQueries({ queryKey: ['unread-notifications', 'admin'] });
  }
  
  if (url.includes('/customer/') && !url.includes('/notifications')) {
    queryClient.refetchQueries({ queryKey: ['unread-notifications', 'customer'] });
  }
  
  return response;
}, (error) => {
  return Promise.reject(error);
});

export default api;
