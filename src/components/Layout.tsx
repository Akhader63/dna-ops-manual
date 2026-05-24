import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import TopHeader from './TopHeader';

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="app-shell bg-dna-pampas dark:bg-dna-cream">
      {/* Sidebar */}
      <div
        className="sidebar"
        style={{
          width: sidebarCollapsed ? 72 : 260,
          transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <Navbar onCollapseChange={setSidebarCollapsed} />
      </div>

      {/* Main app area - header + content */}
      <div className="app-main">
        {/* Top Header */}
        <div className="app-header">
          <TopHeader />
        </div>

        {/* Scrollable page content */}
        <div className="page-content">
          <main className="h-full">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
