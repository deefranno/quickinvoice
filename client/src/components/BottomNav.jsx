import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, FileText, Plus, Users, Settings } from 'lucide-react';

const BottomNav = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  if (isAdmin) return null;

  return (
    <>
      {/* Hide via CSS on desktop — this keeps it fully in the DOM for mobile */}
      <style>{`
        @media (min-width: 768px) {
          .bottom-nav-bar { display: none !important; }
        }
      `}</style>
      <nav className="bottom-nav-bar" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        maxWidth: '430px',
        margin: '0 auto',
        background: '#fff',
        borderTop: '1px solid var(--border)',
        height: '64px',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        zIndex: 1000
      }}>
        <NavItem to="/dashboard" icon={<Home size={20} />} label="Home" />
        <NavItem to="/invoices" icon={<FileText size={20} />} label="Invoices" />
        <div style={{ position: 'relative', marginTop: '-32px' }}>
          <NavLink to="/invoices/new" style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: 'var(--brand)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 20px rgba(29,158,117,0.4)',
            textDecoration: 'none'
          }}>
            <Plus size={24} />
          </NavLink>
        </div>
        <NavItem to="/clients" icon={<Users size={20} />} label="Clients" />
        <NavItem to="/settings" icon={<Settings size={20} />} label="Settings" />
      </nav>
    </>
  );
};

const NavItem = ({ to, icon, label }) => (
  <NavLink to={to} style={({ isActive }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textDecoration: 'none',
    color: isActive ? 'var(--brand)' : 'var(--text-hint)',
    fontWeight: isActive ? '600' : '400',
    fontSize: '10px',
    gap: '4px'
  })}>
    {icon}
    <span>{label}</span>
  </NavLink>
);

export default BottomNav;
