'use client';

import { useAccount } from 'wagmi';
import { useTransactionHistory, useCashFlowMetrics } from '@/hooks/useOnChainData';
import { motion } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import SankeyDiagram from './SankeyDiagram';
import { RefreshCw } from 'lucide-react';

export default function SankeyFlowContent() {
  const { isConnected } = useAccount();
  const { transactions, isLoading, refetch } = useTransactionHistory();
  const metrics = useCashFlowMetrics(transactions);

  if (!isConnected) {
    return (
      <div className="empty-state">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ fontSize: '64px', marginBottom: '24px', opacity: 0.3 }}>🌊</div>
          <h2 className="empty-state-title">Connect Wallet to View Flow Map</h2>
          <p className="empty-state-text" style={{ marginBottom: '24px' }}>
            The Sankey diagram visualizes your USDC money flows in real-time from on-chain events.
          </p>
          <ConnectButton />
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Cash Flow Sankey Map</h1>
          <p className="page-subtitle">
            Live visualization of USDC money flows • Powered by on-chain event streaming
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw size={14} />
          Refresh Data
        </button>
      </div>

      {/* Info Stats */}
      <div className="stat-grid" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="stat-card">
          <div className="stat-label">Total Sources</div>
          <div className="stat-value" style={{ fontSize: 22 }}>
            {new Set(transactions.filter(t => t.type === 'inflow').map(t => t.from)).size}
          </div>
          <div className="stat-change up">Unique inflow addresses</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Destinations</div>
          <div className="stat-value" style={{ fontSize: 22 }}>
            {new Set(transactions.filter(t => t.type === 'outflow').map(t => t.to)).size}
          </div>
          <div className="stat-change down">Unique outflow addresses</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Flow Volume</div>
          <div className="stat-value" style={{ fontSize: 22 }}>
            ${(metrics.totalInflow + metrics.totalOutflow).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="stat-change up">Total USDC moved</div>
        </div>
      </div>

      {/* Sankey Diagram */}
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="card-header">
          <span className="card-title">Money Flow Visualization</span>
          <span className="badge badge-green">
            {transactions.length} events indexed
          </span>
        </div>
        <div className="card-body">
          <SankeyDiagram transactions={transactions} />
        </div>
      </motion.div>
    </motion.div>
  );
}
