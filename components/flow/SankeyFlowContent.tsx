'use client';

import { useAccount } from 'wagmi';
import { useTransactionHistory, useCashFlowMetrics } from '@/hooks/useOnChainData';
import { motion } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import SankeyDiagram from './SankeyDiagram';
import { RefreshCw } from 'lucide-react';
import { WalletEmptyState } from '@/components/ui/WalletEmptyState';

export default function SankeyFlowContent() {
  const { isConnected } = useAccount();
  const { transactions, isLoading, refetch } = useTransactionHistory();
  const metrics = useCashFlowMetrics(transactions);

  if (!isConnected) {
    return (
      <WalletEmptyState
        title="Connect Wallet to View Flow Map"
        description="The Sankey diagram visualizes your USDC money flows in real-time from on-chain events."
        svgIcon={
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 32C8 32 16 24 24 32C32 40 40 24 48 32C56 40 64 32 64 32" stroke="url(#flow_grad)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M0 48C0 48 8 40 16 48C24 56 32 40 40 48C48 56 56 40 64 48" stroke="url(#flow_grad_2)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <defs>
              <linearGradient id="flow_grad" x1="8" y1="24" x2="64" y2="40" gradientUnits="userSpaceOnUse">
                <stop stopColor="#1D4AFF" />
                <stop offset="1" stopColor="#7091FF" />
              </linearGradient>
              <linearGradient id="flow_grad_2" x1="0" y1="40" x2="64" y2="56" gradientUnits="userSpaceOnUse">
                <stop stopColor="#1D4AFF" stopOpacity="0.5" />
                <stop offset="1" stopColor="#7091FF" stopOpacity="0.5" />
              </linearGradient>
            </defs>
          </svg>
        }
      />
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
