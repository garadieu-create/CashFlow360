'use client';

import { useUSDCBalance, useTransactionHistory, useCashFlowMetrics, useAccount } from '@/hooks/useOnChainData';
import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { TrendingDown, AlertTriangle, Shield, Fuel, DollarSign } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { InfoTooltip } from '@/components/ui/InfoTooltip';

function formatUSD(val: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(val);
}

export default function RunwayContent() {
  const { isConnected } = useAccount();
  const { formatted: usdcBalance } = useUSDCBalance();
  const { transactions } = useTransactionHistory();
  const metrics = useCashFlowMetrics(transactions);

  // Scenario sliders
  const [revenueChange, setRevenueChange] = useState(0); // percentage change
  const [extraExpense, setExtraExpense] = useState(0); // extra monthly expense
  const [bridgeAmount, setBridgeAmount] = useState(0); // simulated bridge-in

  const currentBalance = parseFloat(usdcBalance) + bridgeAmount;

  const runway = useMemo(() => {
    if (transactions.length === 0) {
      return {
        dailyInflow: 0,
        dailyOutflow: 0,
        netBurn: 0,
        runwayDays: Infinity,
        projectedData: [],
        status: 'unknown' as const,
      };
    }

    // Calculate time span of transactions
    const timestamps = transactions.map(t => t.timestamp);
    const earliest = Math.min(...timestamps);
    const latest = Math.max(...timestamps);
    const daySpan = Math.max(1, (latest - earliest) / 86400);

    // Base rates
    const baseDailyInflow = metrics.totalInflow / daySpan;
    const baseDailyOutflow = metrics.totalOutflow / daySpan;

    // Apply scenario modifiers
    const adjustedDailyInflow = baseDailyInflow * (1 + revenueChange / 100);
    const adjustedDailyOutflow = baseDailyOutflow + (extraExpense / 30);
    const netBurn = adjustedDailyOutflow - adjustedDailyInflow;

    // Runway days
    const runwayDays = netBurn > 0 ? currentBalance / netBurn : Infinity;

    // Generate projected data (90 days)
    const projectedData = [];
    let balance = currentBalance;
    for (let day = 0; day <= 90; day++) {
      projectedData.push({
        day: `Day ${day}`,
        dayNum: day,
        balance: Math.max(0, balance),
        dangerLine: currentBalance * 0.1,
        warningLine: currentBalance * 0.3,
      });
      balance += adjustedDailyInflow - adjustedDailyOutflow;
    }

    // Status
    let status: 'safe' | 'warning' | 'danger' | 'unknown' = 'safe';
    if (runwayDays < 30) status = 'danger';
    else if (runwayDays < 60) status = 'warning';
    else if (runwayDays === Infinity) status = 'safe';

    return {
      dailyInflow: adjustedDailyInflow,
      dailyOutflow: adjustedDailyOutflow,
      netBurn,
      runwayDays: Math.min(runwayDays, 999),
      projectedData,
      status,
    };
  }, [transactions, metrics, revenueChange, extraExpense, currentBalance]);

  if (!isConnected) {
    return (
      <div className="empty-state">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ marginBottom: '24px', opacity: 0.8 }}>
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="32" cy="36" r="24" stroke="url(#runway_grad)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M32 20V36L42 42" stroke="url(#runway_grad)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M24 8H40" stroke="url(#runway_grad)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M32 8V12" stroke="url(#runway_grad)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
              <defs>
                <linearGradient id="runway_grad" x1="8" y1="8" x2="56" y2="60" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#F54E00" />
                  <stop offset="1" stopColor="#F7A501" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h2 className="empty-state-title">Connect Wallet for Runway Analysis</h2>
          <p className="empty-state-text" style={{ marginBottom: '24px' }}>
            Calculate your SME cash runway based on real on-chain transaction patterns.
          </p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Initialize Smart Account
          </button>
        </motion.div>
      </div>
    );
  }

  const gaugeWidth = runway.runwayDays === Infinity ? 100 : Math.min(100, (runway.runwayDays / 90) * 100);
  const gaugeClass = runway.status === 'danger' ? 'danger' : runway.status === 'warning' ? 'warning' : 'safe';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Cash Flow Runway Calculator</h1>
          <p className="page-subtitle">
            Predictive analysis from on-chain transaction history • Interactive scenario modeling
          </p>
        </div>
      </div>

      {/* Runway Headline */}
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 'var(--space-xl)' }}
      >
        <div className="card-body" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 8 }}>
            Estimated Cash Runway
            <InfoTooltip
              title="Estimated Cash Runway"
              definition="The projected number of days until your cash balance reaches $0 based on your current net daily burn rate."
              importance="Crucial for operational planning, payroll stability, and determining when you need new capital injections or collections."
              calculation="Current Balance / Net Daily Burn"
              goodVsBad="Healthy: 90+ days. Caution: 30-60 days. Critical: <30 days."
              guidance="If this drops below 60 days, trigger cost controls, speed up invoice collection, or bridge USDC from other treasury chains."
            />
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 56,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: runway.status === 'danger' ? 'var(--ph-red)' : runway.status === 'warning' ? 'var(--ph-yellow)' : 'var(--ph-green)',
          }}>
            {runway.runwayDays === Infinity ? '∞' : Math.floor(runway.runwayDays)}
            <span style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-tertiary)', marginLeft: 8 }}>days</span>
          </div>

          {/* Runway Gauge */}
          <div style={{ maxWidth: 400, margin: '16px auto 0' }}>
            <div className="runway-gauge">
              <motion.div
                className={`runway-gauge-fill ${gaugeClass}`}
                initial={{ width: 0 }}
                animate={{ width: `${gaugeWidth}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 }}>
              <span style={{ color: 'var(--ph-red)' }}>Critical (&lt;30d)</span>
              <span style={{ color: 'var(--ph-yellow)' }}>Caution (&lt;60d)</span>
              <span style={{ color: 'var(--ph-green)' }}>Healthy (60d+)</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 'var(--space-xl)' }}>
        <div className="stat-card">
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Current Balance</span>
            <InfoTooltip
              title="Current Balance"
              definition="Your on-chain liquid assets on Arc, including simulated cross-chain bridge injections."
              importance="Acts as the starting capital for the 90-day runway projection."
              calculation="Arc USDC Balance + Simulated Bridge Amount"
              goodVsBad="Higher is safer. Ensure this covers at least 90 days of burn."
              guidance="If low, bridge in additional USDC from Ethereum or Base Sepolia using our Bridge utility."
            />
          </div>
          <div className="stat-value" style={{ fontSize: 20 }}>{formatUSD(currentBalance)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Avg Daily Inflow</span>
            <InfoTooltip
              title="Avg Daily Inflow"
              definition="The average amount of USDC deposited into your wallet per day, adjusted for what-if revenue change scenarios."
              importance="Represents your daily income run rate."
              calculation="Cumulative Inflows / Monitored Days * (1 + % Revenue Change)"
              goodVsBad="Higher is better. Should ideally exceed daily outflow."
              guidance="Improve collection efficiency by sending invoices earlier or offering early payment discounts."
            />
          </div>
          <div className="stat-value positive" style={{ fontSize: 20 }}>{formatUSD(runway.dailyInflow)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Avg Daily Outflow</span>
            <InfoTooltip
              title="Avg Daily Outflow"
              definition="The average amount of USDC spent from your wallet per day, adjusted for what-if monthly expense scenarios."
              importance="Represents your daily expenditure run rate."
              calculation="(Cumulative Outflows / Monitored Days) + (Extra Monthly Expense / 30)"
              goodVsBad="Lower is safer. Keeps the burn rate controlled."
              guidance="Audit subscriptions and contractor hours to reduce non-essential outbound money flows."
            />
          </div>
          <div className="stat-value negative" style={{ fontSize: 20 }}>{formatUSD(runway.dailyOutflow)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Net Daily Burn</span>
            <InfoTooltip
              title="Net Daily Burn"
              definition="The net amount of cash you lose (burn) or accumulate per day."
              importance="Tells you whether your business is accumulating reserves or bleeding cash daily."
              calculation="Avg Daily Outflow - Avg Daily Inflow"
              goodVsBad="Negative (surplus) is healthy; positive (burn) requires vigilance."
              guidance="If net daily burn is high, consider re-negotiating supplier payouts or raising capital."
            />
          </div>
          <div className={`stat-value ${runway.netBurn <= 0 ? 'positive' : 'negative'}`} style={{ fontSize: 20 }}>
            {runway.netBurn <= 0 ? '+' : '-'}{formatUSD(Math.abs(runway.netBurn))}
          </div>
        </div>
      </div>

      <div className="grid-2-1">
        {/* Projection Chart */}
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="card-header">
            <span className="card-title">90-Day Cash Projection</span>
            <span className={`badge ${runway.status === 'safe' ? 'badge-green' : runway.status === 'warning' ? 'badge-yellow' : 'badge-red'}`}>
              {runway.status === 'safe' ? 'Healthy' : runway.status === 'warning' ? 'Caution' : 'Critical'}
            </span>
          </div>
          <div className="card-body">
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <AreaChart data={runway.projectedData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={runway.status === 'danger' ? '#F54E00' : '#77B96C'} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={runway.status === 'danger' ? '#F54E00' : '#77B96C'} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 10, fill: '#6B7280' }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                    tickLine={false}
                    interval={14}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#6B7280', fontFamily: 'JetBrains Mono, monospace' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#1D1F27',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(val: number) => [formatUSD(val), 'Balance']}
                    labelFormatter={(label) => label}
                  />
                  <ReferenceLine y={0} stroke="var(--ph-red)" strokeDasharray="4 4" strokeOpacity={0.5} />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke={runway.status === 'danger' ? '#F54E00' : '#77B96C'}
                    fill="url(#balanceGrad)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* Scenario Sliders */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}
        >
          <div className="card">
            <div className="card-header">
              <span className="card-title">What-If Scenarios</span>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
              {/* Revenue Change */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <TrendingDown size={12} />
                    Revenue Change
                    <InfoTooltip
                      title="Revenue Change Scenario"
                      definition="Simulates a percentage increase or decrease in customer payments (inflow)."
                      importance="Helpful for preparing for macro downturns, client contract cancellations, or sales spikes."
                      calculation="Adjusted Inflow = Base Inflow * (1 + % Change)"
                      goodVsBad="Positive % is good. Negative % simulates business stress."
                      guidance="Try simulating a -20% downturn to verify if your cash runway remains above the 60-day warning threshold."
                    />
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13, color: revenueChange < 0 ? 'var(--ph-red)' : 'var(--ph-green)' }}>
                    {revenueChange >= 0 ? '+' : ''}{revenueChange}%
                  </span>
                </div>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={revenueChange}
                  onChange={(e) => setRevenueChange(Number(e.target.value))}
                  className="scenario-slider"
                  style={{ width: '100%' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-tertiary)' }}>
                  <span>-100%</span>
                  <span>0%</span>
                  <span>+100%</span>
                </div>
              </div>

              {/* Extra Monthly Expense */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <DollarSign size={12} />
                    Extra Monthly Expense
                    <InfoTooltip
                      title="Extra Monthly Expense Scenario"
                      definition="Simulates additional monthly recurring outflows, such as new hires, tool subscriptions, or rent."
                      importance="Helps evaluate whether the business can afford expansion or new projects."
                      calculation="Adjusted Outflow = Base Outflow + (Extra / 30)"
                      goodVsBad="Adds to net burn. Keep this as low as possible."
                      guidance="Simulate a new hire ($5,000/mo) to see the long-term impact on your business runway before making the hire."
                    />
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13, color: 'var(--ph-red)' }}>
                    +{formatUSD(extraExpense)}/mo
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={10000}
                  step={100}
                  value={extraExpense}
                  onChange={(e) => setExtraExpense(Number(e.target.value))}
                  className="scenario-slider"
                  style={{ width: '100%' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-tertiary)' }}>
                  <span>$0</span>
                  <span>$5,000</span>
                  <span>$10,000</span>
                </div>
              </div>

              {/* Bridge Amount */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Fuel size={12} />
                    Bridge USDC from Other Chain
                    <InfoTooltip
                      title="Bridge USDC Scenario"
                      definition="Simulates instantly injecting USDC into your Arc treasury from other chains (Ethereum, Base, etc.)."
                      importance="Enables you to see how cross-chain treasury rebalancing extends your runway."
                      calculation="Adjusted Balance = Current Balance + Bridged Amount"
                      goodVsBad="Increases your cash balance, extending runway days."
                      guidance="Slide this to match your available balances on other networks (shown on the Treasury Radar) to see if bridging will solve a runway crisis."
                    />
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13, color: 'var(--ph-green)' }}>
                    +{formatUSD(bridgeAmount)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={50000}
                  step={500}
                  value={bridgeAmount}
                  onChange={(e) => setBridgeAmount(Number(e.target.value))}
                  className="scenario-slider"
                  style={{ width: '100%' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-tertiary)' }}>
                  <span>$0</span>
                  <span>$25,000</span>
                  <span>$50,000</span>
                </div>
              </div>
            </div>
          </div>

          {/* Alert Card */}
          {runway.status === 'danger' && (
            <motion.div
              className="card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ borderColor: 'var(--ph-red)', background: 'rgba(245, 78, 0, 0.05)' }}
            >
              <div className="card-body-compact" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <AlertTriangle size={20} color="var(--ph-red)" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, color: 'var(--ph-red)' }}>
                    Critical Runway Warning
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    At current burn rate, cash will be depleted in {Math.floor(runway.runwayDays)} days.
                    Consider bridging USDC from another chain or reducing expenses.
                  </div>
                  <a href="/bridge" className="btn btn-primary btn-sm" style={{ marginTop: 12, textDecoration: 'none' }}>
                    Bridge USDC Now →
                  </a>
                </div>
              </div>
            </motion.div>
          )}

          {runway.status === 'safe' && (
            <div className="card" style={{ borderColor: 'rgba(119, 185, 108, 0.3)' }}>
              <div className="card-body-compact" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <Shield size={20} color="var(--ph-green)" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ph-green)' }}>Healthy Runway</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    Your cash position is strong with {runway.runwayDays === Infinity ? 'unlimited' : `${Math.floor(runway.runwayDays)}+ day`} runway.
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
