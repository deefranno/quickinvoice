import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, FileText, Users, BarChart3, Settings, CreditCard, LogOut, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DesktopSidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout?.();
    localStorage.removeItem('qi_token');
    navigate('/login');
  };

  return (
    <aside className="desktop-sidebar">
      {/* Logo */}
      <div style={{
        padding: '24px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        borderBottom: '1px solid var(--border)'
      }}>
        <div style={{
          width: '34px', height: '34px',
          background: 'var(--brand)',
          borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 'bold', fontSize: '16px', flexShrink: 0
        }}>Q</div>
        <div>
          <div style={{ fontSize: '15px', fontWeight: '700', lineHeight: 1, color: 'var(--text-primary)' }}>QuickInvoice</div>
          <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>Caribbean</div>
        </div>
      </div>

      {/* New Invoice CTA */}
      <div style={{ padding: '16px 16px 8px' }}>
        <NavLink to="/invoices/new" style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'var(--brand)',
          color: 'white',
          padding: '11px 16px',
          borderRadius: '12px',
          textDecoration: 'none',
          fontWeight: '600',
          fontSize: '14px',
          boxShadow: '0 4px 12px rgba(29,158,117,0.3)'
        }}>
          <Plus size={16} />
          New Invoice
        </NavLink>
      </div>

      {/* Nav */}
      <nav style={{ padding: '8px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <SidebarItem to="/dashboard" icon={<Home size={18} />} label="Dashboard" />
        <SidebarItem to="/invoices" icon={<FileText size={18} />} label="Invoices" />
        <SidebarItem to="/clients" icon={<Users size={18} />} label="Clients" />
        <SidebarItem to="/reports" icon={<BarChart3 size={18} />} label="Reports" />
        <SidebarItem to="/subscription" icon={<CreditCard size={18} />} label="Subscription" />
        <SidebarItem to="/settings" icon={<Settings size={18} />} label="Settings" />
      </nav>

      {/* User + Logout */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px',
          borderRadius: '12px',
          marginBottom: '4px'
        }}>
          <div style={{
            width: '34px', height: '34px',
            background: 'var(--brand)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: '600', fontSize: '14px', flexShrink: 0
          }}>
            {user?.name?.[0] || 'U'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'User'}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email || ''}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
            padding: '9px 10px', background: 'none', border: 'none',
            color: 'var(--danger)', fontWeight: '600', cursor: 'pointer',
            borderRadius: '10px', fontSize: '13px', transition: 'background 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.background = 'var(--danger-light)'}
          onMouseOut={e => e.currentTarget.style.background = 'none'}
        >
          <LogOut size={16} /> Log out
        </button>
      </div>
    </aside>
  );
};

const SidebarItem = ({ to, icon, label }) => (
  <NavLink
    to={to}
    style={({ isActive }) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px 12px',
      borderRadius: '10px',
      textDecoration: 'none',
      color: isActive ? 'white' : 'var(--text-secondary)',
      background: isActive ? 'var(--brand)' : 'transparent',
      fontWeight: isActive ? '600' : '500',
      fontSize: '14px',
      transition: 'all 0.15s'
    })}
    onMouseOver={e => {
      if (!e.currentTarget.classList.contains('active')) {
        e.currentTarget.style.background = 'var(--brand-light)';
        e.currentTarget.style.color = 'var(--brand-dark)';
      }
    }}
    onMouseOut={e => {
      // Let NavLink inline style take over on mouse out
      e.currentTarget.style.background = '';
      e.currentTarget.style.color = '';
    }}
  >
    {icon}
    {label}
  </NavLink>
);

export default DesktopSidebar;
