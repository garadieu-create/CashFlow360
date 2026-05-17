'use client';

import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import RunwayContent from '@/components/runway/RunwayContent';

export default function RunwayPage() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <Topbar title="Runway Calculator" />
        <div className="app-content">
          <RunwayContent />
        </div>
      </main>
    </div>
  );
}
