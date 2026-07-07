import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { AdminLayout } from './components/layout/AdminLayout';
import { AdminRoute, CustomerRoute } from './components/auth/ProtectedRoute';
import api from './lib/axios';
import { Loader2 } from 'lucide-react';
import { UnifiedLogin } from './pages/UnifiedLogin';
import { CustomerRegister } from './pages/portal/Register';
import { NotFound } from './pages/NotFound';

// --- PLATFORM IMPORTS (Super Admin) ---
import { PlatformDashboard } from './pages/platform/PlatformDashboard';
import { TenantManagement } from './pages/platform/TenantManagement';
import { SystemDocs } from './pages/platform/SystemDocs';
import { GlobalActivities } from './pages/platform/GlobalActivities';
import { PlatformSettings } from './pages/platform/PlatformSettings';

// --- WORKSPACE IMPORTS (Tenant Admin & Staff) ---
import { Dashboard as WorkspaceDashboard } from './pages/workspace/Dashboard';
import { CrmDashboard } from './pages/workspace/CrmDashboard';
import { Leads } from './pages/workspace/Leads';
import { Customers } from './pages/workspace/Customers';
import { CustomerProfile as AdminCustomerProfile } from './pages/workspace/CustomerProfile';
import { Suppliers } from './pages/workspace/Suppliers';
import { SupplierProfile } from './pages/workspace/SupplierProfile';
import { Products } from './pages/workspace/Products';
import { Enquiries } from './pages/workspace/Enquiries';
import { Quotes } from './pages/workspace/Quotes';
import { QuoteDetail } from './pages/workspace/QuoteDetail';
import { SalesOrders } from './pages/workspace/SalesOrders';
import { SalesOrderDetail } from './pages/workspace/SalesOrderDetail';
import { Deliveries } from './pages/workspace/Deliveries';
import { DeliveryDetail } from './pages/workspace/DeliveryDetail';
import { Invoices } from './pages/workspace/Invoices';
import { InvoiceDetail } from './pages/workspace/InvoiceDetail';
import { PaymentReceipts } from './pages/workspace/PaymentReceipts';
import { Purchases } from './pages/workspace/Purchases';
import { PurchaseBillDetail } from './pages/workspace/PurchaseBillDetail';
import { Expenses } from './pages/workspace/Expenses';
import { Reports } from './pages/workspace/Reports';
import { Users } from './pages/workspace/Users';
import { Settings as WorkspaceSettings } from './pages/workspace/Settings';
import { Notifications } from './pages/workspace/Notifications';
import { CustomerImport } from './pages/workspace/CustomerImport';
import { AttendanceReport } from './pages/workspace/AttendanceReport';

// --- MARKETING IMPORTS (Workspace module) ---
import { MarketingDashboard } from './pages/workspace/marketing/MarketingDashboard';
import { MarketingCampaigns } from './pages/workspace/marketing/MarketingCampaigns';
import { MarketingCampaignWizard } from './pages/workspace/marketing/MarketingCampaignWizard';
import { MarketingCampaignDetail } from './pages/workspace/marketing/MarketingCampaignDetail';
import { MarketingTemplates } from './pages/workspace/marketing/MarketingTemplates';
import { MarketingTemplateEditor } from './pages/workspace/marketing/MarketingTemplateEditor';
import { MarketingSegments } from './pages/workspace/marketing/MarketingSegments';
import { MarketingSuppressions } from './pages/workspace/marketing/MarketingSuppressions';
import { MarketingQueue } from './pages/workspace/marketing/MarketingQueue';
import { MarketingActivity } from './pages/workspace/marketing/MarketingActivity';
import { MarketingReports } from './pages/workspace/marketing/MarketingReports';
import { MarketingSettings } from './pages/workspace/marketing/MarketingSettings';

// --- PORTAL IMPORTS (End Customers) ---
import { CustomerProducts } from './pages/portal/CustomerProducts';
import { RequestForm } from './pages/portal/RequestForm';
import { CustomerEnquiries } from './pages/portal/CustomerEnquiries';
import { CustomerDashboard } from './pages/portal/CustomerDashboard';
import { CustomerQuotes } from './pages/portal/CustomerQuotes';
import { CustomerInvoices } from './pages/portal/CustomerInvoices';
import { CustomerProfile } from './pages/portal/CustomerProfile';
import { CustomerNotifications } from './pages/portal/CustomerNotifications';

const PortalRedirect = () => {
  const customer = useAuthStore((state) => state.customer);
  const companySlug = (customer?.company || 'company').toLowerCase().replace(/\s+/g, '-');
  return <Navigate to={`/portal/${companySlug}/dashboard`} replace />;
};

const PlatformRoutes = () => (
  <Route element={<AdminLayout />}>
    <Route path="dashboard" element={<PlatformDashboard />} />
    <Route path="companies" element={<TenantManagement />} />
    <Route path="system-docs" element={<SystemDocs />} />
    <Route path="activities" element={<GlobalActivities />} />
    <Route path="settings" element={<PlatformSettings />} />
  </Route>
);

const WorkspaceRoutes = () => (
  <Route element={<AdminLayout />}>
    <Route path="dashboard" element={<WorkspaceDashboard />} />
    <Route path="crm-dashboard" element={<CrmDashboard />} />
    <Route path="leads" element={<Leads />} />
    <Route path="customers" element={<Customers />} />
    <Route path="customers/:id" element={<AdminCustomerProfile />} />
    <Route path="suppliers" element={<Suppliers />} />
    <Route path="suppliers/:id" element={<SupplierProfile />} />
    <Route path="products" element={<Products />} />
    <Route path="enquiries" element={<Enquiries />} />
    <Route path="quotes" element={<Quotes />} />
    <Route path="quotes/:id" element={<QuoteDetail />} />
    <Route path="sales-orders" element={<SalesOrders />} />
    <Route path="sales-orders/:id" element={<SalesOrderDetail />} />
    <Route path="deliveries" element={<Deliveries />} />
    <Route path="deliveries/:id" element={<DeliveryDetail />} />
    <Route path="invoices" element={<Invoices />} />
    <Route path="invoices/:id" element={<InvoiceDetail />} />
    <Route path="payment-receipts" element={<PaymentReceipts />} />
    <Route path="purchases" element={<Purchases />} />
    <Route path="purchases/:id" element={<PurchaseBillDetail />} />
    <Route path="expenses" element={<Expenses />} />
    <Route path="reports" element={<Reports />} />
    <Route path="users" element={<Users />} />
    <Route path="settings" element={<WorkspaceSettings />} />
    <Route path="notifications" element={<Notifications />} />
    <Route path="customers/import" element={<CustomerImport />} />
    <Route path="attendance" element={<AttendanceReport />} />
    <Route path="marketing" element={<Navigate to="dashboard" replace />} />
    <Route path="marketing/dashboard" element={<MarketingDashboard />} />
    <Route path="marketing/campaigns" element={<MarketingCampaigns />} />
    <Route path="marketing/campaigns/new" element={<MarketingCampaignWizard />} />
    <Route path="marketing/campaigns/:id/edit" element={<MarketingCampaignWizard />} />
    <Route path="marketing/campaigns/:id" element={<MarketingCampaignDetail />} />
    <Route path="marketing/templates" element={<MarketingTemplates />} />
    <Route path="marketing/templates/new" element={<MarketingTemplateEditor />} />
    <Route path="marketing/templates/:id/edit" element={<MarketingTemplateEditor />} />
    <Route path="marketing/segments" element={<MarketingSegments />} />
    <Route path="marketing/suppressions" element={<MarketingSuppressions />} />
    <Route path="marketing/queue" element={<MarketingQueue />} />
    <Route path="marketing/activity" element={<MarketingActivity />} />
    <Route path="marketing/reports" element={<MarketingReports />} />
    <Route path="marketing/settings" element={<MarketingSettings />} />
  </Route>
);

function App() {
  const { adminToken, customerToken, setAdmin, setCustomer, setIsLoading, isLoading } = useAuthStore();

  useEffect(() => {
    const initAuth = async () => {
      if (!adminToken && !customerToken) {
        setIsLoading(false);
        return;
      }

      const tasks: Promise<void>[] = [];

      if (adminToken && !useAuthStore.getState().admin) {
        tasks.push((async () => {
          try {
            const res = await api.get('/admin/user');
            setAdmin(res.data.user);
          } catch (err: any) {
            if (err.response?.status === 401 || err.response?.status === 403) {
              (localStorage.removeItem('zeronix_admin_token'), localStorage.removeItem('zeronix_staff_token'));
              setAdmin(null);
            }
          }
        })());
      }

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
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<UnifiedLogin />} />
      
      <Route path="/saas-admin/login" element={<UnifiedLogin />} />
      
      <Route path="/register" element={<CustomerRegister />} />

      {/* PLATFORM ROUTES (Super Admin) */}
      <Route path="/saas-admin" element={<AdminRoute />}>
        {PlatformRoutes()}
        <Route index element={<Navigate to="/saas-admin/dashboard" replace />} />
      </Route>

      {/* WORKSPACE ROUTES (Tenant Admin & Staff) */}
      <Route path="/workspace" element={<AdminRoute />}>
        {WorkspaceRoutes()}
        <Route index element={<Navigate to="/workspace/dashboard" replace />} />
      </Route>

      <Route path="/admin" element={<Navigate to="/workspace" replace />} />
      <Route path="/staff" element={<Navigate to="/workspace" replace />} />

      {/* PORTAL ROUTES (End Customers) */}
      <Route path="/portal" element={<CustomerRoute />}>
        <Route index element={<PortalRedirect />} />
        <Route path=":company" element={<AdminLayout />}>
          <Route path="dashboard" element={<CustomerDashboard />} />
          <Route path="products" element={<CustomerProducts />} />
          <Route path="request-form" element={<RequestForm />} />
          <Route path="enquiries" element={<CustomerEnquiries />} />
          <Route path="quotes" element={<CustomerQuotes />} />
          <Route path="invoices" element={<CustomerInvoices />} />
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
