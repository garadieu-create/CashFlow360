'use client';

import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import SankeyFlowContent from '@/components/flow/SankeyFlowContent';
import RelatedContent from '@/components/ui/RelatedContent';

export default function FlowPage() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main" id="main-content">
        <Topbar title="Cash Flow Map" />
        <div className="app-content">
          <SankeyFlowContent />
          <RelatedContent />
        </div>
      </main>
    </div>
  );
}
