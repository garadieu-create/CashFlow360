import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Activity, Wallet } from 'lucide-react';
import { Transaction } from '@/hooks/useOnChainData';
import { InfoTooltip } from '@/components/ui/InfoTooltip';

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
        <div className="stat-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'center' }}>
            <Wallet size={12} style={{ marginRight: 4 }} />
            USDC Balance
          </span>
          <InfoTooltip
            title="USDC Balance"
            definition="Your current on-chain holding of USD Coin (USDC) on the Arc network."
            importance="USDC is a fully backed stablecoin pegged 1:1 to the US dollar. On Arc, it serves as the liquid asset for SMEs to pay vendors and receive revenue."
            calculation="Direct contract read: balanceOf(address)"
            goodVsBad="Higher is safer. Ideally, maintain at least 3-6 months of average monthly outflows as a treasury buffer."
            guidance="Keep enough USDC on Arc to cover immediate operational runway. Use the bridge to rebalance from Ethereum or Base."
          />
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
        <div className="stat-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'center' }}>
            <ArrowUpRight size={12} style={{ marginRight: 4 }} />
            Total Inflow
          </span>
          <InfoTooltip
            title="Total Inflow"
            definition="The cumulative amount of USDC transferred into your address over the indexed historical period."
            importance="Represents aggregate customer revenue, venture funding, or bridged assets received on-chain."
            calculation="Sum of all Transfer events where 'to' is your address."
            goodVsBad="Strong inflows reflect positive business growth or healthy treasury financing."
            guidance="Analyze customer payment frequency. If inflows are sporadic, negotiate upfront milestones with clients."
          />
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
        <div className="stat-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'center' }}>
            <ArrowDownRight size={12} style={{ marginRight: 4 }} />
            Total Outflow
          </span>
          <InfoTooltip
            title="Total Outflow"
            definition="The cumulative amount of USDC transferred out of your address over the indexed historical period."
            importance="Represents your total business burn rate, including vendor payments, salaries, and gas."
            calculation="Sum of all Transfer events where 'from' is your address."
            goodVsBad="Should ideally be kept lower than Inflows. Keep an eye on non-essential outbound transactions."
            guidance="Review vendor contracts and subscriptions. Automate recurring payouts to smooth out lumpy outflows."
          />
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
        <div className="stat-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'center' }}>
            <Activity size={12} style={{ marginRight: 4 }} />
            Net Cash Flow
          </span>
          <InfoTooltip
            title="Net Cash Flow"
            definition="The net change in your treasury balance over the monitored timeframe."
            importance="The ultimate health check. Positive means you are accumulating treasury; negative means you are burning cash."
            calculation="Total Inflow - Total Outflow"
            goodVsBad="Positive values are healthy. Negative net flow indicates a structural burn that needs monitoring."
            guidance="If Net Flow is persistently negative, use the Runway Calculator to simulate cost reductions or bridge capital."
          />
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
