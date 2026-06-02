'use client';

import { useAccount } from 'wagmi';
import { useUSDCBalance, useEURCBalance, useNativeBalance, useTransactionHistory, useCashFlowMetrics } from '@/hooks/useOnChainData';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, DollarSign, RefreshCw } from 'lucide-react';
import CashFlowChart from './CashFlowChart';
import TransactionTable from './TransactionTable';
import { WalletEmptyState } from '@/components/ui/WalletEmptyState';
import { StatGrid } from './StatGrid';
import { MultiBalanceBar } from './MultiBalanceBar';
import { OnboardingTour } from '@/components/ui/OnboardingTour';

function formatUSD(val: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
}

export default function DashboardContent() {
  const { address, isConnected } = useAccount();
  const { formatted: usdcBalance, isLoading: loadingUSDC, refetch: refetchBalance } = useUSDCBalance();
  const { formatted: eurcBalance } = useEURCBalance();
  const { formatted: nativeBalance } = useNativeBalance();
  const { transactions, isLoading: loadingTx, refetch: refetchTx } = useTransactionHistory();
  const metrics = useCashFlowMetrics(transactions);

  if (!isConnected) {
    return (
      <WalletEmptyState
        title="Connect Your Wallet"
        description="Connect your wallet to see real-time cash flow analytics from the Arc blockchain. All data is sourced directly from on-chain events — no mock data."
        svgIcon={
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="32" width="12" height="24" rx="2" fill="url(#dash_grad)" />
            <rect x="26" y="16" width="12" height="40" rx="2" fill="url(#dash_grad)" />
            <rect x="44" y="24" width="12" height="32" rx="2" fill="url(#dash_grad)" />
            <path d="M4 56H60" stroke="var(--border-primary)" strokeWidth="4" strokeLinecap="round" />
            <defs>
              <linearGradient id="dash_grad" x1="8" y1="16" x2="56" y2="56" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F54E00" />
                <stop offset="1" stopColor="#FF7A33" />
              </linearGradient>
            </defs>
          </svg>
        }
      />
    );
  }

  const handleRefresh = () => {
    refetchBalance();
    refetchTx();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Neo-Brutalist Architectural Hero Block */}
      <div className="brutalist-hero" style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1.2fr 1fr',
        border: '2px solid var(--text-primary)',
        background: 'var(--bg-secondary)',
        marginBottom: 'var(--space-2xl)',
        boxShadow: '8px 8px 0px rgba(0,0,0,0.9)'
      }}>
        {/* Left Column: Branding, dynamic status, and quick tour/refresh CTAs */}
        <div style={{
          padding: '24px',
          borderRight: '2px solid var(--text-primary)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '240px'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span className="badge badge-purple" style={{ border: '1px solid var(--ph-purple)' }}>AXIS No. 01 // PLATFORM</span>
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>SYS_VER_4.12</span>
            </div>
            <h1 className="brutalist-outline-title" style={{ fontSize: 44, margin: '12px 0 6px', color: 'var(--text-primary)', WebkitTextStroke: 'unset', fontWeight: 900 }}>
              CASHFLOW<span style={{ color: 'var(--ph-red)' }}>360</span>
            </h1>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: '460px', lineHeight: 1.5 }}>
              Real-time cash flow intelligence for SMEs on Arc Testnet. Tracking transaction velocity, automated liquidity thresholds, and instant USDC bridges.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <OnboardingTour />
            <button className="btn btn-primary" onClick={handleRefresh} disabled={loadingTx}>
              <RefreshCw size={12} className={loadingTx ? 'spinning' : ''} />
              Refetch Stream
            </button>
          </div>
        </div>

        {/* Center Column: Giant overlapping geometric typography artwork */}
        <div style={{
          padding: '24px',
          borderRight: '2px solid var(--text-primary)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'var(--bg-primary)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            fontSize: 72,
            fontWeight: 900,
            fontFamily: 'var(--font-mono)',
            lineHeight: 0.8,
            color: 'transparent',
            WebkitTextStroke: '2px rgba(255, 255, 255, 0.08)',
            transform: 'rotate(-90deg) scale(1.3)',
            whiteSpace: 'nowrap'
          }}>
            FLOWS
          </div>
          <div style={{
            position: 'absolute',
            bottom: 12,
            right: 12,
            fontSize: 10,
            fontFamily: 'var(--font-mono)',
            color: 'var(--ph-red)',
            fontWeight: 700
          }}>
            ACTIVE_INDEXER
          </div>
        </div>

        {/* Right Column: Architectural specs & transaction stats */}
        <div style={{
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'var(--bg-secondary)'
        }}>
          <div>
            <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              ©2026 CORE_SYSTEM
            </span>
            <div style={{ 
              fontSize: 32, 
              fontWeight: 800, 
              fontFamily: 'var(--font-mono)', 
              color: 'var(--ph-red)', 
              marginTop: 12 
            }}>
              {transactions.length}
            </div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontWeight: 700 }}>
              On-Chain Tx Indexed
            </div>
          </div>
          <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
            Direct data aggregation stream via Arc Testnet. 1:1 USDC reserves audited.
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <StatGrid 
        usdcBalance={usdcBalance} 
        loadingUSDC={loadingUSDC} 
        loadingTx={loadingTx} 
        metrics={metrics} 
        transactions={transactions} 
      />

      {/* Multi-Balance Bar */}
      <MultiBalanceBar 
        usdcBalance={usdcBalance}
        eurcBalance={eurcBalance}
        nativeBalance={nativeBalance}
        address={address}
      />

      {/* Cash Flow Chart + Transaction Table */}
      <div className="grid-2" style={{ marginBottom: 'var(--space-lg)' }}>
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="card-header">
            <span className="card-title">Cash Flow Over Time</span>
            <span className="badge badge-green">Live</span>
          </div>
          <div className="card-body">
            {loadingTx ? (
              <div className="skeleton" style={{ width: '100%', height: 260, borderRadius: 'var(--radius-md)' }} />
            ) : (
              <CashFlowChart data={metrics.chartData} />
            )}
          </div>
        </motion.div>

        <motion.div
          className="card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <div className="card-header">
            <span className="card-title">Category Breakdown</span>
            <span className="badge badge-blue">{metrics.categoryBreakdown.length} categories</span>
          </div>
          <div className="card-body">
            {loadingTx ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ width: '100%', height: 40, borderRadius: 'var(--radius-sm)' }} />)}
              </div>
            ) : metrics.categoryBreakdown.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {metrics.categoryBreakdown.map((cat) => (
                  <div key={cat.category} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>{cat.category}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{cat.count} txns</div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {formatUSD(cat.amount)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: 'var(--space-2xl)' }}>
                <DollarSign size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
                <p className="empty-state-text">No transactions yet. Send or receive USDC to see categories.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Transaction Table */}
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="card-header">
          <span className="card-title">Recent Transactions</span>
          <span className="badge badge-yellow">{transactions.length} indexed</span>
        </div>
        <TransactionTable transactions={transactions} isLoading={loadingTx} />
      </motion.div>
    </motion.div>
  );
}
