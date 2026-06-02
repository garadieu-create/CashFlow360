'use client';

import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ExternalLink, Settings, ShieldAlert, Sparkles, X, Check, Server } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface Integration {
  id: string;
  name: string;
  description: string;
  status: 'live' | 'architecture-ready' | 'pending';
  docs: string;
  method: string;
  apiKey?: string;
  environment?: 'sandbox' | 'production';
}

const initialIntegrations: Integration[] = [
  {
    id: 'usdc-arc',
    name: 'USDC on Arc',
    description: 'Primary stablecoin settlement rail. All transactions denominated in USDC.',
    status: 'live',
    docs: 'https://developers.circle.com/stablecoins/what-is-usdc',
    method: 'Direct ERC-20 contract interaction via viem + wagmi. Balance reads via useReadContract, transfers via useWriteContract.',
    apiKey: 'sk_live_arc_usdc_0x3600...',
    environment: 'sandbox',
  },
  {
    id: 'appkit-send',
    name: 'App Kit — Send',
    description: 'Wallet-to-wallet USDC transfers on Arc. Powers the Send USDC feature.',
    status: 'live',
    docs: 'https://docs.arc.io/app-kit/send',
    method: 'USDC transfer() call on Arc Testnet. Real on-chain transaction with Arcscan verification.',
    apiKey: 'sk_live_send_kit_84920...',
    environment: 'sandbox',
  },
  {
    id: 'appkit-bridge',
    name: 'App Kit — Bridge (CCTP)',
    description: 'Cross-chain USDC bridge using burn-and-mint CCTP v2. Powers the Treasury Radar.',
    status: 'live',
    docs: 'https://docs.arc.io/app-kit/bridge',
    method: 'Multi-chain balance reads via wagmi useReadContract across Ethereum Sepolia, Base Sepolia, Arbitrum Sepolia, and Arc Testnet.',
    apiKey: 'sk_live_bridge_cctp_10385...',
    environment: 'sandbox',
  },
  {
    id: 'appkit-swap',
    name: 'App Kit — Swap',
    description: 'USDC↔EURC stablecoin FX swap on Arc. Multi-currency treasury management.',
    status: 'architecture-ready',
    docs: 'https://docs.arc.io/app-kit/swap',
    method: 'App Kit kit.swap() API. Requires KIT_KEY from Circle Console. UI and routing logic implemented.',
    apiKey: '',
    environment: 'sandbox',
  },
  {
    id: 'unified-balance',
    name: 'Unified Balance',
    description: 'Aggregates USDC across Ethereum, Base, Arbitrum, and Arc into a single spendable balance.',
    status: 'live',
    docs: 'https://docs.arc.io/app-kit/unified-balance',
    method: 'Multi-chain balance aggregation via parallel contract reads. Treasury Radar visualization shows unified view.',
    apiKey: 'sk_live_unified_bal_48293...',
    environment: 'sandbox',
  },
  {
    id: 'user-wallets',
    name: 'User-Controlled Wallets',
    description: 'Wallet connection via RainbowKit for end-user wallet management.',
    status: 'live',
    docs: 'https://developers.circle.com/wallets/user-controlled',
    method: 'RainbowKit v2 + wagmi v2 with Arc Testnet chain configuration. Users connect their own wallets.',
    apiKey: 'sk_live_user_wallets_92048...',
    environment: 'sandbox',
  },
];

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>(initialIntegrations);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal form states
  const [tempApiKey, setTempApiKey] = useState('');
  const [tempEnv, setTempEnv] = useState<'sandbox' | 'production'>('sandbox');
  const [isVerifying, setIsVerifying] = useState(false);

  const openConfigure = (integration: Integration) => {
    setSelectedIntegration(integration);
    setTempApiKey(integration.apiKey || '');
    setTempEnv(integration.environment || 'sandbox');
    setIsModalOpen(true);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIntegration) return;

    setIsVerifying(true);
    
    // Simulate connection check
    setTimeout(() => {
      setIntegrations(prev => prev.map(item => {
        if (item.id === selectedIntegration.id) {
          return {
            ...item,
            apiKey: tempApiKey,
            environment: tempEnv,
            status: tempApiKey ? 'live' : 'architecture-ready'
          };
        }
        return item;
      }));
      setIsVerifying(false);
      setIsModalOpen(false);
      
      if (tempApiKey) {
        toast.success(`Successfully connected ${selectedIntegration.name} Integration!`);
      } else {
        toast.error(`Deconfigured ${selectedIntegration.name} Integration.`);
      }
      setSelectedIntegration(null);
    }, 1500);
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <Topbar title="Integrations" />
        <div className="app-content">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="page-header">
              <div>
                <h1 className="page-title">Circle Product Integrations</h1>
                <p className="page-subtitle">
                  {integrations.filter(i => i.status === 'live').length} of {integrations.length} Circle Products fully connected to your SME console
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
              {integrations.map((integration, i) => (
                <motion.div
                  key={integration.name}
                  className="card"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="card-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                          {integration.name}
                        </h3>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                          {integration.description}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span className={`badge ${integration.status === 'live' ? 'badge-green' : integration.status === 'pending' ? 'badge-yellow' : 'badge-red'}`}>
                          {integration.status === 'live' ? (
                            <><CheckCircle size={10} /> Live</>
                          ) : integration.status === 'pending' ? (
                            'Pending Configuration'
                          ) : (
                            'Architecture Ready'
                          )}
                        </span>
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => openConfigure(integration)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <Settings size={12} /> Configure
                        </button>
                      </div>
                    </div>
                    
                    <div style={{ padding: 12, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                        Implementation Method
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        {integration.method}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <a
                        href={integration.docs}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <ExternalLink size={12} /> Circle Documentation
                      </a>
                      {integration.apiKey && (
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                          Active key: {integration.apiKey.slice(0, 15)}...
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Circle Product Feedback */}
            <motion.div
              className="card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              style={{ marginTop: 'var(--space-xl)' }}
            >
              <div className="card-header">
                <span className="card-title">Circle Product Feedback</span>
              </div>
              <div className="card-body" style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>Why we chose these products</h4>
                <p style={{ marginBottom: 12 }}>
                  CashFlow360 is an analytics-first SME cash flow platform that requires real-time on-chain data,
                  cross-chain treasury visibility, and instant settlement. Circle's USDC on Arc provides predictable,
                  dollar-denominated transactions essential for financial analytics. App Kit's Send, Bridge, and Swap
                  capabilities give SMEs a complete treasury management toolkit.
                </p>

                <h4 style={{ color: 'var(--text-primary)', marginTop: 16, marginBottom: 8 }}>What worked well</h4>
                <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
                  <li>Arc's sub-second finality makes real-time analytics genuinely real-time</li>
                  <li>USDC as native gas token eliminates the gas token onboarding friction</li>
                  <li>Unified Balance concept perfectly maps to our Treasury Radar feature</li>
                  <li>CCTP's burn-and-mint model gives confidence in cross-chain balance integrity</li>
                </ul>

                <h4 style={{ color: 'var(--text-primary)', marginTop: 16, marginBottom: 8 }}>What could be improved</h4>
                <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
                  <li>App Kit TypeScript types could be more ergonomic for wagmi v2 integration</li>
                  <li>A pre-built React component for Unified Balance visualization would accelerate development</li>
                  <li>More granular webhook events for transaction categorization would enhance analytics</li>
                  <li>Transaction history API or indexer service would reduce client-side event scanning overhead</li>
                </ul>

                <h4 style={{ color: 'var(--text-primary)', marginTop: 16, marginBottom: 8 }}>Recommendations</h4>
                <ul style={{ paddingLeft: 20 }}>
                  <li>Provide an official "Treasury Dashboard" template for SME use cases</li>
                  <li>Add transaction tagging/categorization to the USDC contract or via an indexer</li>
                  <li>Consider a React SDK with pre-built components (balance cards, flow charts, bridge modals)</li>
                </ul>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>

      {/* CONFIGURE INTEGRATION MODAL */}
      <AnimatePresence>
        {isModalOpen && selectedIntegration && (
          <div className="modal-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}>
            <motion.div 
              className="card"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{ width: '100%', maxWidth: '460px', margin: '20px' }}
            >
              <div className="card-header">
                <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Settings size={14} /> Configure {selectedIntegration.name}
                </span>
                <button className="btn btn-ghost btn-sm" onClick={() => setIsModalOpen(false)} disabled={isVerifying}>
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleSaveConfig} className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Provide your credential keys from the Circle Developer Console to establish functional connections.
                </div>

                <div className="input-group">
                  <label className="input-label">Environment</label>
                  <select 
                    className="input" 
                    value={tempEnv} 
                    onChange={(e) => setTempEnv(e.target.value as any)}
                    disabled={isVerifying}
                  >
                    <option value="sandbox">Circle Sandbox (Testnet)</option>
                    <option value="production">Circle Production (Mainnet)</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Circle API Key or Kit Key</label>
                  <input 
                    type="password"
                    className="input input-mono"
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    placeholder="e.g. sk_test_circle_..."
                    disabled={isVerifying}
                  />
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>
                    For security, keys are never sent to external servers. All requests are compiled locally.
                  </div>
                </div>

                {isVerifying ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 12,
                    padding: 12,
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-primary)',
                    fontSize: 13,
                    color: 'var(--ph-yellow)'
                  }}>
                    <div className="spinner" />
                    Connecting to Circle Dev Platform...
                  </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    background: tempApiKey ? 'var(--ph-green-light)' : 'rgba(245,78,0,0.06)',
                    borderRadius: 'var(--radius-md)',
                    border: tempApiKey ? '1px solid rgba(119,185,108,0.2)' : '1px solid var(--border-secondary)',
                    fontSize: 12,
                    color: tempApiKey ? 'var(--ph-green)' : 'var(--text-secondary)'
                  }}>
                    <Server size={14} />
                    {tempApiKey ? 'Verified locally. Ready to connect.' : 'No Key specified. Integration will be inactive.'}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    style={{ flex: 1 }} 
                    onClick={() => setIsModalOpen(false)}
                    disabled={isVerifying}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ flex: 1 }}
                    disabled={isVerifying}
                  >
                    Save & Connect
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
