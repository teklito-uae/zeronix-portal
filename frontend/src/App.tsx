import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './components/layout/AdminLayout';
import { CustomerLayout } from './components/layout/CustomerLayout';
import { AdminRoute, CustomerRoute } from './components/auth/ProtectedRoute';
import { AdminLogin } from './pages/admin/Login';
import { CustomerLogin } from './pages/customer/Login';
import { CustomerRegister } from './pages/customer/Register';
import { Dashboard } from './pages/admin/Dashboard';

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
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
        </Route>
      </Route>

      {/* Customer Protected Routes */}
      <Route path="/portal" element={<CustomerRoute />}>
        <Route element={<CustomerLayout />}>
          <Route index element={<div className="p-8">Customer Portal Home</div>} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
