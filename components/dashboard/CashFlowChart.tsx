'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface ChartData {
  day: string;
  inflow: number;
  outflow: number;
  net: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div style={{
      background: '#1D1F27',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 8,
      padding: '12px 16px',
      fontSize: 12,
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{ fontWeight: 600, marginBottom: 8, color: '#9BA0AA' }}>{label}</div>
      {payload.map((entry: any) => (
        <div key={entry.name} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: entry.color }} />
          <span style={{ color: '#9BA0AA' }}>{entry.name}:</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: '#FFFFFF' }}>
            ${entry.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function CashFlowChart({ data }: { data: ChartData[] }) {
  if (data.length === 0) {
    return (
      <div className="empty-state" style={{ height: 260, padding: 'var(--space-2xl)' }}>
        <div style={{ marginBottom: 12, opacity: 0.8 }}>
          <svg width="48" height="48" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 56H56" stroke="var(--border-primary)" strokeWidth="4" strokeLinecap="round" />
            <path d="M8 40L24 24L36 32L56 8" stroke="url(#chart_grad)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M56 8V24M56 8H40" stroke="url(#chart_grad)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <defs>
              <linearGradient id="chart_grad" x1="8" y1="8" x2="56" y2="40" gradientUnits="userSpaceOnUse">
                <stop stopColor="#77B96C" />
                <stop offset="1" stopColor="#A8D8A0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <p className="empty-state-text">Send or receive USDC to generate chart data from on-chain events.</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="inflowGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#77B96C" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#77B96C" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="outflowGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F54E00" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#F54E00" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: '#6B7280' }}
            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#6B7280', fontFamily: 'JetBrains Mono, monospace' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(val) => `$${val}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="inflow"
            name="Inflow"
            stroke="#77B96C"
            fill="url(#inflowGrad)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="outflow"
            name="Outflow"
            stroke="#F54E00"
            fill="url(#outflowGrad)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
