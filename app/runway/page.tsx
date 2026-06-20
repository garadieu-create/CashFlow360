'use client';

import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import RunwayContent from '@/components/runway/RunwayContent';
import RelatedContent from '@/components/ui/RelatedContent';

export default function RunwayPage() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main" id="main-content">
        <Topbar title="Runway Calculator" />
        <div className="app-content">
          <RunwayContent />
          <RelatedContent />
        </div>
      </main>
    </div>
  );
}
