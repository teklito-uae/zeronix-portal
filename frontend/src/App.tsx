import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { AdminLayout } from './components/layout/AdminLayout';
import { AdminRoute, CustomerRoute } from './components/auth/ProtectedRoute';
import api from './lib/axios';
import { Loader2 } from 'lucide-react';
import { AdminLogin } from './pages/admin/Login';
import { CustomerLogin } from './pages/customer/Login';
import { CustomerRegister } from './pages/customer/Register';
import { Dashboard } from './pages/admin/Dashboard';
import { Customers } from './pages/admin/Customers';
import { CustomerProfile as AdminCustomerProfile } from './pages/admin/CustomerProfile';
import { Suppliers } from './pages/admin/Suppliers';
import { SupplierProfile } from './pages/admin/SupplierProfile';
import { Products } from './pages/admin/Products';
import { ProductDetail } from './pages/admin/ProductDetail';
import { Enquiries } from './pages/admin/Enquiries';
import { Quotes } from './pages/admin/Quotes';
import { QuoteDetail } from './pages/admin/QuoteDetail';
import { Invoices } from './pages/admin/Invoices';
import { InvoiceDetail } from './pages/admin/InvoiceDetail';
import { PaymentReceipts } from './pages/admin/PaymentReceipts';
import { Chat } from './pages/admin/Chat';
import { BulkImport } from './pages/admin/BulkImport';
import { Users } from './pages/admin/Users';
import { Settings } from './pages/admin/Settings';
import { Activities } from './pages/admin/Activities';
import { Notifications } from './pages/admin/Notifications';
import { CustomerProducts } from './pages/customer/CustomerProducts';
import { RequestForm } from './pages/customer/RequestForm';
import { CustomerEnquiries } from './pages/customer/CustomerEnquiries';
import { CustomerDashboard } from './pages/customer/CustomerDashboard';
import { CustomerQuotes } from './pages/customer/CustomerQuotes';
import { CustomerInvoices } from './pages/customer/CustomerInvoices';
import { CustomerChat } from './pages/customer/CustomerChat';
import { CustomerProfile } from './pages/customer/CustomerProfile';
import { CustomerNotifications } from './pages/customer/CustomerNotifications';
import { NotFound } from './pages/NotFound';

const PortalRedirect = () => {
  const customer = useAuthStore((state) => state.customer);
  const companySlug = (customer?.company || 'company').toLowerCase().replace(/\s+/g, '-');
  return <Navigate to={`/portal/${companySlug}/dashboard`} replace />;
};

function App() {
  const { adminToken, customerToken, setAdmin, setCustomer, setIsLoading, isLoading } = useAuthStore();

  useEffect(() => {
    const initAuth = async () => {
      // If no tokens at all, stop loading
      if (!adminToken && !customerToken) {
        setIsLoading(false);
        return;
      }

      const tasks: Promise<void>[] = [];

      // Hydrate Admin if token exists
      if (adminToken && !useAuthStore.getState().admin) {
        tasks.push((async () => {
          try {
            const res = await api.get('/admin/user');
            setAdmin(res.data.user);
          } catch (err: any) {
            if (err.response?.status === 401 || err.response?.status === 403) {
              localStorage.removeItem('zeronix_admin_token');
              setAdmin(null);
            }
          }
        })());
      }

      // Hydrate Customer if token exists
      if (customerToken && !useAuthStore.getState().customer) {
        tasks.push((async () => {
          try {
            const res = await api.get('/customer/user');
            setCustomer(res.data.customer);
          } catch (err: any) {
            if (err.response?.status === 401 || err.response?.status === 403) {
              localStorage.removeItem('zeronix_customer_portal_token');
              setCustomer(null);
            }
          }
        })());
      }

      if (tasks.length > 0) {
        await Promise.all(tasks);
      }
      
      setIsLoading(false);
    };

    initAuth();
  }, [adminToken, customerToken, setAdmin, setCustomer, setIsLoading]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500 mb-4" />
        <p className="text-slate-400 font-medium animate-pulse">Initializing Secure Portal...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/portal/login" replace />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/sales/login" element={<AdminLogin />} />
      <Route path="/portal/login" element={<CustomerLogin />} />
      <Route path="/register" element={<CustomerRegister />} />

      <Route path="/admin" element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="customers" element={<Customers />} />
          <Route path="customers/:id" element={<AdminCustomerProfile />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="suppliers/:id" element={<SupplierProfile />} />
          <Route path="products" element={<Products />} />
          <Route path="products/:id" element={<ProductDetail />} />
          <Route path="enquiries" element={<Enquiries />} />
          <Route path="quotes" element={<Quotes />} />
          <Route path="quotes/:id" element={<QuoteDetail />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="invoices/:id" element={<InvoiceDetail />} />
          <Route path="payment-receipts" element={<PaymentReceipts />} />
          <Route path="chat" element={<Chat />} />
          <Route path="bulk-import" element={<BulkImport />} />
          <Route path="users" element={<Users />} />
          <Route path="settings" element={<Settings />} />
          <Route path="activities" element={<Activities />} />
          <Route path="notifications" element={<Notifications />} />
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
        </Route>
      </Route>

      <Route path="/portal" element={<CustomerRoute />}>
        <Route index element={<PortalRedirect />} />
        <Route path=":company" element={<AdminLayout />}>
          <Route path="dashboard" element={<CustomerDashboard />} />
          <Route path="products" element={<CustomerProducts />} />
          <Route path="request-form" element={<RequestForm />} />
          <Route path="enquiries" element={<CustomerEnquiries />} />
          <Route path="quotes" element={<CustomerQuotes />} />
          <Route path="invoices" element={<CustomerInvoices />} />
          <Route path="chat" element={<CustomerChat />} />
          <Route path="profile" element={<CustomerProfile />} />
          <Route path="notifications" element={<CustomerNotifications />} />
          <Route index element={<PortalRedirect />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
