import axios from 'axios';

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
  const isCustomerRoute = config.url?.includes('/customer/');
  const isAdminRoute = config.url?.includes('/admin/');
  
  let token = null;
  
  if (isCustomerRoute) {
    token = localStorage.getItem('zeronix_customer_portal_token');
  } else if (isAdminRoute) {
    token = localStorage.getItem('zeronix_admin_token');
  } else {
    // Fallback to any token found if route is ambiguous
    token = localStorage.getItem('zeronix_admin_token') || localStorage.getItem('zeronix_customer_portal_token');
  }

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor to trigger notification checks on any admin API activity
import { queryClient } from './queryClient';

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
