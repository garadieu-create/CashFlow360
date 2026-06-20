'use client';

import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, 
  ArrowRight, 
  Key, 
  Coins, 
  Database, 
  Clock, 
  ShieldCheck, 
  Zap,
  Code,
  TrendingUp,
  Award,
  RefreshCw,
  Lock
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import toast from 'react-hot-toast';

interface Metrics {
  vaultBalanceUSDC: number;
  dailyAverageOutflowUSDC: number;
  projectedRunwayDays: number;
  solvencyRating: string;
}

export default function MarketplacePage() {
  const [revenue, setRevenue] = useState<number>(0.00);
  const [queriesCount, setQueriesCount] = useState<number>(0);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<number>(0);
  const [unlockedData, setUnlockedData] = useState<any | null>(null);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/agent');
      const data = await res.json();
      if (data.success && data.settings) {
        setRevenue(data.settings.nanopaymentsRevenue || 0.00);
        setQueriesCount(data.settings.nanopaymentsQueriesCount || 0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 6000);
    return () => clearInterval(interval);
  }, []);

  const handlePurchase = async () => {
    setIsPurchasing(true);
    setPaymentStep(1); // EIP-712 Sign
    
    await new Promise(r => setTimeout(r, 1800));
    setPaymentStep(2); // Facilitator settle

    await new Promise(r => setTimeout(r, 1500));
    setPaymentStep(3); // SubmitBatch Relayer

    try {
      const res = await fetch('/api/premium/runway-forecast', {
        headers: {
          'payment-signature': 'mock-agent-signature-token-premium-runway'
        }
      });
      const data = await res.json();
      if (data.success) {
        setUnlockedData(data);
        setPaymentStep(4); // Completed
        toast.success('Premium Forecast Report Unlocked!');
        fetchStats();
      } else {
        toast.error('Failed to settle report payment.');
        setPaymentStep(0);
      }
    } catch (err) {
      toast.error('Network error during report unlock.');
      setPaymentStep(0);
    } finally {
      setIsPurchasing(false);
    }
  };

  const getStepText = (step: number) => {
    switch (step) {
      case 1: return '1. Signing EIP-712 payment authorization...';
      case 2: return '2. Settling authorization via Circle Facilitator...';
      case 3: return '3. Relayer batching & broadcasting submitBatch transaction...';
      case 4: return '4. Payment settled on Arc Testnet!';
      default: return '';
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <Topbar title="x402 Marketplace" />
        <div className="app-content">

          {/* Header */}
          <div className="brutalist-hero" style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            border: '2px solid var(--text-primary)',
            background: 'var(--bg-secondary)',
            marginBottom: 'var(--space-xl)',
            boxShadow: '8px 8px 0px rgba(0,0,0,0.9)'
          }}>
            <div style={{ padding: '24px', borderRight: '2px solid var(--text-primary)' }}>
              <span className="badge badge-yellow" style={{ marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Coins size={12} /> x402 HTTP Nanopayments
              </span>
              <h1 className="brutalist-outline-title" style={{ fontSize: 32, margin: '6px 0', fontWeight: 900 }}>
                STABLECOIN API MARKETPLACE
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: '580px', lineHeight: 1.5 }}>
                Expose advanced cash flow intelligence endpoints to third-party Web3 AI agents. Leverage the Circle Gateway protocol to batch signed off-chain authorizations into sub-cent settlement transactions.
              </p>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6, background: 'var(--bg-primary)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Accumulated API Revenue
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--ph-green)' }}>
                ${revenue.toFixed(4)} USDC
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                {queriesCount} Queries Settled
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '24px' }}>
            
            {/* Left side: Protected Endpoints */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="card">
                <div className="card-header" style={{ borderBottom: '2px solid var(--text-primary)' }}>
                  <span className="card-title" style={{ fontSize: 14 }}>My Exposed Endpoints</span>
                </div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  
                  {/* Endpoint 1 */}
                  <div style={{ padding: 12, border: '1px solid var(--border-primary)', borderRadius: 8, background: 'var(--bg-secondary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span className="badge badge-purple" style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>GET</span>
                      <span style={{ fontSize: 11, fontWeight: 'bold', color: 'var(--ph-green)', fontFamily: 'var(--font-mono)' }}>$0.0001 USDC</span>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 'bold', fontFamily: 'var(--font-mono)', color: 'white', marginBottom: 4 }}>
                      /api/metrics
                    </div>
                    <p style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                      Provides company financial solvency rating and average daily outflows. Used by AI credit evaluators.
                    </p>
                  </div>

                  {/* Endpoint 2 */}
                  <div style={{ padding: 12, border: '1px solid var(--border-primary)', borderRadius: 8, background: 'var(--bg-secondary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span className="badge badge-purple" style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>GET</span>
                      <span style={{ fontSize: 11, fontWeight: 'bold', color: 'var(--ph-green)', fontFamily: 'var(--font-mono)' }}>$0.0050 USDC</span>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 'bold', fontFamily: 'var(--font-mono)', color: 'white', marginBottom: 4 }}>
                      /api/premium/runway-forecast
                    </div>
                    <p style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                      Generates premium future cash flow runway and risk forecasting data with D3 projection trends.
                    </p>
                  </div>

                </div>
              </div>

              {/* Gateway Status info */}
              <div className="card">
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                    Circle Gateway Config
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-tertiary)' }}>RPC Node:</span>
                      <span style={{ color: 'white' }}>Arc Testnet</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-tertiary)' }}>Facilitator:</span>
                      <span style={{ color: 'white' }}>api.circle.com</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-tertiary)' }}>Scheme:</span>
                      <span style={{ color: 'white' }}>exact (EIP-712)</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Right side: Interactive Report buyer simulator */}
            <div>
              {!unlockedData ? (
                <div className="card" style={{ border: '2px solid var(--text-primary)', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '380px', background: 'var(--bg-secondary)', textAlign: 'center', padding: '24px' }}>
                  
                  <div style={{ display: 'inline-flex', padding: 16, background: 'rgba(245, 78, 0, 0.08)', borderRadius: '50%', color: 'var(--ph-red)', marginBottom: 16 }}>
                    <Lock size={32} />
                  </div>

                  <h3 style={{ fontSize: 18, fontWeight: 800, color: 'white', marginBottom: 8 }}>
                    Premium Volatility Forecast Report
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: '320px', margin: '0 auto 20px', lineHeight: 1.5 }}>
                    Access detailed cash runway projection reports and solvency risk charts. Unlock instantly via Circle Gateway for $0.0050 USDC.
                  </p>

                  {paymentStep > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
                      <RefreshCw className="spinning" style={{ color: 'var(--ph-red)' }} size={20} />
                      <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                        {getStepText(paymentStep)}
                      </div>
                    </div>
                  ) : (
                    <button 
                      className="btn btn-primary"
                      onClick={handlePurchase}
                      disabled={isPurchasing}
                    >
                      Unlock Report ($0.0050 USDC)
                    </button>
                  )}

                </div>
              ) : (
                /* Renders report data post-purchase */
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="card" 
                  style={{ border: '2px solid var(--text-primary)', background: 'var(--bg-secondary)' }}
                >
                  <div className="card-header" style={{ borderBottom: '2px solid var(--text-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ph-green)' }}>
                      <Award size={16} /> Volatility & Runway unlocked
                    </span>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => setUnlockedData(null)}
                    >
                      Lock Report
                    </button>
                  </div>
                  <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    
                    {/* Insights list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                        Agent Volatility Insights:
                      </span>
                      {unlockedData.insights.map((insight: string, idx: number) => (
                        <div key={idx} style={{ display: 'flex', gap: 8, fontSize: 11, color: 'white', background: 'var(--bg-primary)', padding: 8, borderRadius: 6, borderLeft: '3px solid var(--ph-blue)' }}>
                          <Zap size={12} style={{ flexShrink: 0, color: 'var(--ph-blue)', marginTop: 2 }} />
                          <span>{insight}</span>
                        </div>
                      ))}
                    </div>

                    {/* Volatility Trend chart */}
                    <div style={{ height: '220px', width: '100%', padding: '10px 0' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>
                        Projected Runway Forecast Trend
                      </span>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={unlockedData.forecastMonths}>
                          <defs>
                            <linearGradient id="colorOrganic" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--ph-blue)" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="var(--ph-blue)" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--ph-green)" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="var(--ph-green)" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={10} />
                          <YAxis stroke="var(--text-secondary)" fontSize={10} />
                          <Tooltip contentStyle={{ background: '#2C2E38', border: 'none', borderRadius: 8 }} labelStyle={{ color: 'white' }} />
                          <Area type="monotone" dataKey="organic" name="Organic Revenue" stroke="var(--ph-blue)" fillOpacity={1} fill="url(#colorOrganic)" />
                          <Area type="monotone" dataKey="projected" name="Projected Runway" stroke="var(--ph-green)" fillOpacity={1} fill="url(#colorProjected)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                  </div>
                </motion.div>
              )}
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
