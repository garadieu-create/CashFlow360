'use client';

import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import SankeyFlowContent from '@/components/flow/SankeyFlowContent';

export default function FlowPage() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <Topbar title="Cash Flow Map" />
        <div className="app-content">
          <SankeyFlowContent />
        </div>
      </main>
    </div>
  );
}
