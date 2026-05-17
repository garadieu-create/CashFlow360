'use client';

import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import SendContent from '@/components/send/SendContent';

export default function SendPage() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <Topbar title="Send USDC" />
        <div className="app-content">
          <SendContent />
        </div>
      </main>
    </div>
  );
}
