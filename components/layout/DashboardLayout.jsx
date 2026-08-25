'use client';

import { useState } from 'react';
import { ToastProvider } from '@/components/ui/Toast';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import MobileNavigation from './MobileNavigation';

export default function DashboardLayout({ children, profile, unreadCount = 0 }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isAdminRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
  const role = profile?.role || (isAdminRoute ? 'admin' : 'student');

  return (
    <ToastProvider>
      <div className={`app-layout ${!sidebarOpen ? 'sidebar-closed' : ''}`}>
        {/* Backdrop Overlay for mobile navigation */}
        {sidebarOpen && (
          <div
            className="sidebar-backdrop"
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.45)',
              backdropFilter: 'blur(4px)',
              zIndex: 95,
              transition: 'all 0.2s ease'
            }}
          />
        )}

        <Sidebar
          role={role}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="app-main">
          <Topbar
            profile={profile}
            unreadCount={unreadCount}
            onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          />
          <div className="app-content">
            {children}
          </div>
        </main>
        <MobileNavigation role={role} />
      </div>
    </ToastProvider>
  );
}
