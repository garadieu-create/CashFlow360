'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function Topbar({ title }: { title: string }) {
  return (
    <header className="app-topbar">
      <div className="topbar-left">
        <span className="topbar-breadcrumb">
          <span>CashFlow360</span> / {title}
        </span>
      </div>
      <div className="topbar-right">
        <div className="topbar-chain-badge">
          <div className="topbar-chain-dot" />
          Arc Testnet
        </div>
        <ConnectButton
          chainStatus="icon"
          accountStatus="address"
          showBalance={true}
        />
      </div>
    </header>
  );
}
