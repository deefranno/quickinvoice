import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import InvoiceList from './pages/InvoiceList';
import InvoiceForm from './pages/InvoiceForm';
import InvoiceDetail from './pages/InvoiceDetail';
import Clients from './pages/Clients';
import Reports from './pages/Reports';
import Pricing from './pages/Pricing';
import Subscribe from './pages/Subscribe';
import SubscriptionSuccess from './pages/SubscriptionSuccess';
import Settings from './pages/Settings';
import Subscription from './pages/Subscription';

// Admin
import AdminLayout from './pages/admin/AdminLayout';
import AdminLogin from './pages/admin/AdminLogin';
import AdminOverview from './pages/admin/AdminOverview';
import AdminUsers from './pages/admin/AdminUsers';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';
import AdminSettings from './pages/admin/AdminSettings';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/invoices" element={<ProtectedRoute><InvoiceList /></ProtectedRoute>} />
        <Route path="/invoices/new" element={<ProtectedRoute><InvoiceForm /></ProtectedRoute>} />
        <Route path="/invoices/:id" element={<ProtectedRoute><InvoiceDetail /></ProtectedRoute>} />
        <Route path="/invoices/:id/edit" element={<ProtectedRoute><InvoiceForm /></ProtectedRoute>} />
        <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/subscribe" element={<ProtectedRoute><Subscribe /></ProtectedRoute>} />
        <Route path="/subscription/success" element={<ProtectedRoute><SubscriptionSuccess /></ProtectedRoute>} />
        
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminOverview />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="subscriptions" element={<div className="card">Subscriptions table coming soon</div>} />
        <Route path="payments" element={<div className="card">Payments tracking coming soon</div>} />
        <Route path="announcements" element={<AdminAnnouncements />} />
        <Route path="logs" element={<div className="card">System logs coming soon</div>} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
    </Routes>
  );
}

export default App;
