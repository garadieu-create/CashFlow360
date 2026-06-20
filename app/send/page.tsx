'use client';

import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import SendContent from '@/components/send/SendContent';
import RelatedContent from '@/components/ui/RelatedContent';

export default function SendPage() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main" id="main-content">
        <Topbar title="Send USDC" />
        <div className="app-content">
          <SendContent />
          <RelatedContent />
        </div>
      </main>
    </div>
  );
}
