import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { AdminLayout } from './components/layout/AdminLayout';
import { AdminRoute, CustomerRoute } from './components/auth/ProtectedRoute';
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
import { Chat } from './pages/admin/Chat';
import { CustomerProducts } from './pages/customer/CustomerProducts';
import { RequestForm } from './pages/customer/RequestForm';
import { CustomerEnquiries } from './pages/customer/CustomerEnquiries';
import { CustomerDashboard } from './pages/customer/CustomerDashboard';
import { CustomerQuotes } from './pages/customer/CustomerQuotes';
import { CustomerInvoices } from './pages/customer/CustomerInvoices';
import { CustomerChat } from './pages/customer/CustomerChat';
import { CustomerProfile } from './pages/customer/CustomerProfile';

const PortalRedirect = () => {
  const customer = useAuthStore((state) => state.customer);
  // Default to 'company' if no company name is provided, then slugify it
  const companySlug = (customer?.company || 'company').toLowerCase().replace(/\s+/g, '-');
  return <Navigate to={`/portal/${companySlug}/dashboard`} replace />;
};

function App() {
  return (
    <Routes>
      {/* Public / Auth Routes */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/login" element={<CustomerLogin />} />
      <Route path="/register" element={<CustomerRegister />} />

      {/* Admin Protected Routes */}
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
          <Route path="chat" element={<Chat />} />
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
        </Route>
      </Route>

      {/* Customer Protected Routes */}
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
          <Route index element={<PortalRedirect />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
