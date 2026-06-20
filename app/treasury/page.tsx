'use client';

import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import TreasuryRadarContent from '@/components/treasury/TreasuryRadarContent';
import RelatedContent from '@/components/ui/RelatedContent';

export default function TreasuryPage() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main" id="main-content">
        <Topbar title="Cross-Chain Treasury" />
        <div className="app-content">
          <TreasuryRadarContent />
          <RelatedContent />
        </div>
      </main>
    </div>
  );
}
