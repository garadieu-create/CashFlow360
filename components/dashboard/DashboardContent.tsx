'use client';

import { useAccount } from 'wagmi';
import { useUSDCBalance, useEURCBalance, useNativeBalance, useTransactionHistory, useCashFlowMetrics } from '@/hooks/useOnChainData';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Activity, DollarSign, Wallet, RefreshCw } from 'lucide-react';
import CashFlowChart from './CashFlowChart';
import TransactionTable from './TransactionTable';

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
      <div className="empty-state">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div style={{ marginBottom: '24px', opacity: 0.8 }}>
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
          </div>
          <h2 className="empty-state-title">Connect Your Wallet</h2>
          <p className="empty-state-text" style={{ marginBottom: '24px' }}>
            Connect your wallet to see real-time cash flow analytics from the Arc blockchain.
            All data is sourced directly from on-chain events — no mock data.
          </p>
          <ConnectButton />
        </motion.div>
      </div>
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
        <button className="btn btn-secondary" onClick={handleRefresh} disabled={loadingTx}>
          <RefreshCw size={14} className={loadingTx ? 'spinning' : ''} />
          Refresh
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="stat-grid">
        <motion.div
          className="stat-card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="stat-label">
            <Wallet size={12} style={{ display: 'inline', marginRight: 4 }} />
            USDC Balance
          </div>
          <div className="stat-value">
            {loadingUSDC ? '—' : `$${parseFloat(usdcBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          </div>
          <div className="stat-change up">
            Arc Testnet
          </div>
        </motion.div>

        <motion.div
          className="stat-card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="stat-label">
            <ArrowUpRight size={12} style={{ display: 'inline', marginRight: 4 }} />
            Total Inflow
          </div>
          <div className="stat-value positive">
            {formatUSD(metrics.totalInflow)}
          </div>
          <div className="stat-change up">
            <TrendingUp size={12} />
            {transactions.filter(t => t.type === 'inflow').length} transactions
          </div>
        </motion.div>

        <motion.div
          className="stat-card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="stat-label">
            <ArrowDownRight size={12} style={{ display: 'inline', marginRight: 4 }} />
            Total Outflow
          </div>
          <div className="stat-value negative">
            {formatUSD(metrics.totalOutflow)}
          </div>
          <div className="stat-change down">
            <TrendingDown size={12} />
            {transactions.filter(t => t.type === 'outflow').length} transactions
          </div>
        </motion.div>

        <motion.div
          className="stat-card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="stat-label">
            <Activity size={12} style={{ display: 'inline', marginRight: 4 }} />
            Net Cash Flow
          </div>
          <div className={`stat-value ${metrics.netFlow >= 0 ? 'positive' : 'negative'}`}>
            {metrics.netFlow >= 0 ? '+' : ''}{formatUSD(metrics.netFlow)}
          </div>
          <div className={`stat-change ${metrics.netFlow >= 0 ? 'up' : 'down'}`}>
            {metrics.netFlow >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {metrics.netFlow >= 0 ? 'Positive' : 'Negative'} flow
          </div>
        </motion.div>
      </div>

      {/* Multi-Balance Bar */}
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        style={{ marginBottom: 'var(--space-lg)' }}
      >
        <div className="card-body-compact" style={{ display: 'flex', gap: 'var(--space-2xl)', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              USDC (ERC-20)
            </span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700 }}>
              ${parseFloat(usdcBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div style={{ width: 1, height: 40, background: 'var(--border-primary)' }} />
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              EURC
            </span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700 }}>
              €{parseFloat(eurcBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div style={{ width: 1, height: 40, background: 'var(--border-primary)' }} />
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Native (Gas)
            </span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700 }}>
              {parseFloat(nativeBalance).toLocaleString('en-US', { minimumFractionDigits: 4 })}
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
            Wallet: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
          </div>
        </div>
      </motion.div>

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
            <CashFlowChart data={metrics.chartData} />
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
            {metrics.categoryBreakdown.length > 0 ? (
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
