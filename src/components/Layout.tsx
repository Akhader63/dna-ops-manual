import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import TopHeader from './TopHeader';

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const sidebarWidth = sidebarCollapsed ? 72 : 260;

  return (
    <div className="app-shell bg-dna-pampas dark:bg-dna-cream">
      {/* Sidebar - fixed left */}
      <div className="sidebar">
        <Navbar onCollapseChange={setSidebarCollapsed} />
      </div>

      {/* Main app area - header + content */}
      <div className="app-main">
        {/* Top Header */}
        <div className="app-header">
          <TopHeader sidebarWidth={sidebarWidth} />
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
