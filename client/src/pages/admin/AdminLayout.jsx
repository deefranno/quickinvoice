import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, Receipt, Megaphone, List, Settings, LogOut } from 'lucide-react';

const AdminLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('qi_admin_token');
    navigate('/admin/login');
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      width: '100%',
      maxWidth: 'none',
      background: '#F7F9F8',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'auto'
    }}>
      {/* Sidebar */}
      <aside style={{
        width: '240px',
        background: 'white',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        top: 0,
        left: 0,
        zIndex: 100
      }}>
        <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ width: '32px', height: '32px', background: 'var(--brand)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>Q</div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '15px', lineHeight: 1 }}>QuickInvoice</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Admin Panel</div>
          </div>
        </div>

        <nav style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
          <AdminNavItem to="/admin" exact icon={<LayoutDashboard size={18} />} label="Overview" />
          <AdminNavItem to="/admin/users" icon={<Users size={18} />} label="Users" />
          <AdminNavItem to="/admin/subscriptions" icon={<CreditCard size={18} />} label="Subscriptions" />
          <AdminNavItem to="/admin/payments" icon={<Receipt size={18} />} label="Payments" />
          <AdminNavItem to="/admin/announcements" icon={<Megaphone size={18} />} label="Announcements" />
          <AdminNavItem to="/admin/logs" icon={<List size={18} />} label="Logs" />
          <AdminNavItem to="/admin/settings" icon={<Settings size={18} />} label="Settings" />
        </nav>

        <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={handleLogout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'none', border: 'none', color: 'var(--danger)', fontWeight: '600', cursor: 'pointer', borderRadius: '10px', fontSize: '14px' }}
            onMouseOver={e => e.currentTarget.style.background = 'var(--danger-light)'}
            onMouseOut={e => e.currentTarget.style.background = 'none'}
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, marginLeft: '240px', padding: '36px 40px', minHeight: '100vh', overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
};

const AdminNavItem = ({ to, icon, label, exact }) => (
  <NavLink
    to={to}
    end={exact}
    style={({ isActive }) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '11px 12px',
      borderRadius: '10px',
      textDecoration: 'none',
      color: isActive ? 'white' : 'var(--text-secondary)',
      background: isActive ? 'var(--brand)' : 'transparent',
      fontWeight: isActive ? '600' : '500',
      fontSize: '14px',
      transition: 'all 0.15s'
    })}
  >
    {icon}
    {label}
  </NavLink>
);

export default AdminLayout;
