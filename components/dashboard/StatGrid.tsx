import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Activity, Wallet } from 'lucide-react';
import { Transaction } from '@/hooks/useOnChainData';

function formatUSD(val: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
}

interface StatGridProps {
  usdcBalance: string;
  loadingUSDC: boolean;
  loadingTx: boolean;
  metrics: {
    totalInflow: number;
    totalOutflow: number;
    netFlow: number;
  };
  transactions: Transaction[];
}

export function StatGrid({ usdcBalance, loadingUSDC, loadingTx, metrics, transactions }: StatGridProps) {
  return (
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
        <div className={`stat-value ${loadingUSDC ? 'skeleton' : ''}`} style={{ display: 'inline-block', minWidth: 100 }}>
          {loadingUSDC ? '0.00' : `$${parseFloat(usdcBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
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
        <div className={`stat-value positive ${loadingTx ? 'skeleton' : ''}`} style={{ display: 'inline-block', minWidth: 100 }}>
          {loadingTx ? '0.00' : formatUSD(metrics.totalInflow)}
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
        <div className={`stat-value negative ${loadingTx ? 'skeleton' : ''}`} style={{ display: 'inline-block', minWidth: 100 }}>
          {loadingTx ? '0.00' : formatUSD(metrics.totalOutflow)}
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
        <div className={`stat-value ${loadingTx ? 'skeleton' : metrics.netFlow >= 0 ? 'positive' : 'negative'}`} style={{ display: 'inline-block', minWidth: 100 }}>
          {loadingTx ? '0.00' : `${metrics.netFlow >= 0 ? '+' : ''}${formatUSD(metrics.netFlow)}`}
        </div>
        <div className={`stat-change ${metrics.netFlow >= 0 ? 'up' : 'down'}`}>
          {metrics.netFlow >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {metrics.netFlow >= 0 ? 'Positive' : 'Negative'} flow
        </div>
      </motion.div>
    </div>
  );
}
