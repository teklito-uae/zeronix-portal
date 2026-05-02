import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Expose Pusher to window object for Echo to pick up
(window as any).Pusher = Pusher;

export const getEchoInstance = (type: 'admin' | 'customer') => {
  const token = type === 'admin' 
    ? (localStorage.getItem('zeronix_admin_token') || localStorage.getItem('zeronix_staff_token')) 
    : localStorage.getItem('zeronix_customer_portal_token');

  return new Echo({
    broadcaster: 'pusher',
    key: import.meta.env.VITE_PUSHER_APP_KEY,
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
    forceTLS: true,
    authEndpoint: `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
};
