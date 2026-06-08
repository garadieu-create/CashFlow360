'use client';

import { useCircleWallet } from '@/context/CircleWalletContext';
import { LogOut, Key, Mail, ShieldCheck } from 'lucide-react';

export default function Topbar({ title }: { title: string }) {
  const { address, isConnected, socialEmail, logout, gasSponsoredCount } = useCircleWallet();

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <header className="app-topbar">
      <div className="topbar-left">
        <span className="topbar-breadcrumb">
          <span className="topbar-brand-prefix">CashFlow360 / </span>
          <span className="topbar-active-title">{title}</span>
        </span>
      </div>
      <div className="topbar-right">
        {isConnected && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            padding: '4px 10px',
            background: 'rgba(245, 78, 0, 0.08)',
            border: '1px solid rgba(245, 78, 0, 0.2)',
            borderRadius: 6,
            color: '#F54E00'
          }}>
            <ShieldCheck size={13} />
            <span>Sponsored ({gasSponsoredCount} txs)</span>
          </div>
        )}

        <div className="topbar-chain-badge">
          <div className="topbar-chain-dot" />
          Arc Testnet
        </div>

        {isConnected && address ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 2
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 4 }}>
                {socialEmail ? <Mail size={12} color="var(--text-secondary)" /> : <Key size={12} color="var(--text-secondary)" />}
                {truncateAddress(address)}
              </span>
              {socialEmail && (
                <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                  {socialEmail}
                </span>
              )}
            </div>
            <button
              onClick={logout}
              title="Disconnect Session"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'var(--text-secondary)',
                borderRadius: 8,
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 0, 0, 0.1)';
                e.currentTarget.style.color = '#FF4444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => window.location.reload()}
            className="btn btn-sm btn-primary"
            style={{
              background: '#F54E00',
              border: 'none',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700
            }}
          >
            Connect Smart Account
          </button>
        )}
      </div>
    </header>
  );
}
