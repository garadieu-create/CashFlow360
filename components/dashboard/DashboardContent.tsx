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
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Cash Flow Dashboard</h1>
          <p className="page-subtitle">
            Real-time analytics from Arc Testnet • {transactions.length} transactions indexed
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <OnboardingTour />
          <button className="btn btn-secondary" onClick={handleRefresh} disabled={loadingTx}>
            <RefreshCw size={14} className={loadingTx ? 'spinning' : ''} />
            Refresh
          </button>
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
