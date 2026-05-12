import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import TopHeader from './TopHeader';
import Footer from './Footer';

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const sidebarWidth = sidebarCollapsed ? 72 : 260;

  return (
    <div className="min-h-screen bg-dna-pampas dark:bg-dna-cream">
      {/* Sidebar - fixed left */}
      <Navbar onCollapseChange={setSidebarCollapsed} />

      {/* Top Header - fixed top, right of sidebar */}
      <TopHeader sidebarWidth={sidebarWidth} />

      {/* Main content area */}
      <div
        className="pt-header min-h-screen flex flex-col"
        style={{
          marginLeft: `${sidebarWidth}px`,
          transition: 'margin-left 0.3s ease',
        }}
      >
        <main className="flex-1 p-6">
          <div className="max-w-content mx-auto">
            <Outlet />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
