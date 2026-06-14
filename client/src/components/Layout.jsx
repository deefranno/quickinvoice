import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';
import DesktopSidebar from './DesktopSidebar';

const AUTH_PATHS = ['/login', '/register', '/admin/login'];

const Layout = () => {
  const location = useLocation();
  const isAuthPage = AUTH_PATHS.includes(location.pathname);
  const isAdmin = location.pathname.startsWith('/admin');

  if (isAuthPage || isAdmin) {
    return <Outlet />;
  }

  return (
    <>
      <style>{`
        /* Mobile: full-width single column with bottom nav clearance */
        .layout-main {
          padding: 0;
          padding-bottom: 80px;
          min-height: 100vh;
        }
        /* Desktop: shifted right of sidebar, no bottom nav clearance */
        @media (min-width: 768px) {
          .layout-main {
            margin-left: 240px;
            padding-bottom: 0;
            max-width: none;
          }
        }
      `}</style>

      <div className="app-shell">
        {/* Desktop sidebar — CSS hides it on mobile */}
        <DesktopSidebar />

        {/* Page content */}
        <main className="layout-main">
          <Outlet />
        </main>

        {/* Mobile bottom nav — CSS hides it on desktop */}
        <BottomNav />
      </div>
    </>
  );
};

export default Layout;
