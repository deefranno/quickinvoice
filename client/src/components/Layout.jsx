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
        .layout-main {
          padding: 0;
          padding-bottom: 80px;
          min-height: 100vh;
          width: 100%;
        }
        @media (min-width: 768px) {
          .layout-main {
            margin-left: 240px;
            padding-bottom: 0;
            width: calc(100% - 240px);
            max-width: none;
          }
        }
      `}</style>

      <div className="app-shell">
        <DesktopSidebar />
        <main className="layout-main">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </>
  );
};

export default Layout;
