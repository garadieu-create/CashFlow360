'use client';

import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import TreasuryRadarContent from '@/components/treasury/TreasuryRadarContent';

export default function TreasuryPage() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <Topbar title="Cross-Chain Treasury" />
        <div className="app-content">
          <TreasuryRadarContent />
        </div>
      </main>
    </div>
  );
}
