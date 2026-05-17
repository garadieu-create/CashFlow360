'use client';

import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import DashboardContent from '@/components/dashboard/DashboardContent';

export default function HomePage() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <Topbar title="Dashboard" />
        <div className="app-content">
          <DashboardContent />
        </div>
      </main>
    </div>
  );
}
