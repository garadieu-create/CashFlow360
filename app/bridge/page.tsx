'use client';

import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ArrowUpDown, ExternalLink, Info } from 'lucide-react';

export default function BridgePage() {
  const { isConnected } = useAccount();

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <Topbar title="Bridge & Swap" />
        <div className="app-content">
          {!isConnected ? (
            <div className="empty-state">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ marginBottom: '24px', opacity: 0.8 }}>
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 48C16 32 48 32 56 48" stroke="url(#bridge_grad)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M16 42V56M48 42V56M32 35V56" stroke="var(--border-primary)" strokeWidth="4" strokeLinecap="round" />
                  <path d="M4 56H60" stroke="url(#bridge_grad)" strokeWidth="4" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="bridge_grad" x1="4" y1="32" x2="60" y2="56" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#1D4AFF" />
                      <stop offset="1" stopColor="#B62AD9" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
                <h2 className="empty-state-title">Connect Wallet</h2>
                <p className="empty-state-text" style={{ marginBottom: 24 }}>Bridge USDC across chains using Circle CCTP.</p>
                <ConnectButton />
              </motion.div>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="page-header">
                <div>
                  <h1 className="page-title">Bridge & Swap</h1>
                  <p className="page-subtitle">
                    Cross-chain USDC transfers via Circle CCTP • USDC↔EURC swap via App Kit
                  </p>
                </div>
              </div>

              <div className="grid-2">
                {/* Bridge Card */}
                <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="card-header">
                    <span className="card-title">
                      <ArrowUpDown size={14} style={{ display: 'inline', marginRight: 6 }} />
                      Bridge USDC
                    </span>
                    <span className="badge badge-green">CCTP v2</span>
                  </div>
                  <div className="card-body">
                    <div style={{ padding: 'var(--space-lg)', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-lg)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <Info size={14} color="var(--ph-blue)" />
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          Bridge uses Circle's burn-and-mint CCTP — native USDC on every chain
                        </span>
                      </div>
                    </div>

                    <div className="input-group" style={{ marginBottom: 'var(--space-lg)' }}>
                      <label className="input-label">From Chain</label>
                      <select className="input" defaultValue="sepolia">
                        <option value="sepolia">Ethereum Sepolia</option>
                        <option value="base">Base Sepolia</option>
                        <option value="arbitrum">Arbitrum Sepolia</option>
                      </select>
                    </div>

                    <div style={{ textAlign: 'center', padding: 'var(--space-sm)', color: 'var(--text-tertiary)' }}>↓</div>

                    <div className="input-group" style={{ marginBottom: 'var(--space-lg)' }}>
                      <label className="input-label">To Chain</label>
                      <div className="input" style={{ background: 'var(--ph-red-light)', borderColor: 'var(--ph-red)', color: 'var(--ph-red)', fontWeight: 600 }}>
                        Arc Testnet (Primary)
                      </div>
                    </div>

                    <div className="input-group" style={{ marginBottom: 'var(--space-lg)' }}>
                      <label className="input-label">Amount (USDC)</label>
                      <input type="number" className="input input-mono" placeholder="0.00" step="0.01" />
                    </div>

                    <button className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                      Bridge to Arc
                    </button>

                    <div style={{ textAlign: 'center', marginTop: 12 }}>
                      <a
                        href="https://docs.arc.io/app-kit/bridge"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--text-tertiary)' }}
                      >
                        <ExternalLink size={10} /> App Kit Bridge Documentation
                      </a>
                    </div>
                  </div>
                </motion.div>

                {/* Swap Card */}
                <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <div className="card-header">
                    <span className="card-title">Swap Stablecoins</span>
                    <span className="badge badge-purple">FX</span>
                  </div>
                  <div className="card-body">
                    <div style={{ padding: 'var(--space-lg)', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-lg)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <Info size={14} color="var(--ph-purple)" />
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          Swap USDC↔EURC on Arc using App Kit Swap or StableFX engine
                        </span>
                      </div>
                    </div>

                    <div className="input-group" style={{ marginBottom: 'var(--space-lg)' }}>
                      <label className="input-label">From Token</label>
                      <select className="input" defaultValue="usdc">
                        <option value="usdc">USDC</option>
                        <option value="eurc">EURC</option>
                      </select>
                    </div>

                    <div style={{ textAlign: 'center', padding: 'var(--space-sm)', color: 'var(--text-tertiary)' }}>⇄</div>

                    <div className="input-group" style={{ marginBottom: 'var(--space-lg)' }}>
                      <label className="input-label">To Token</label>
                      <select className="input" defaultValue="eurc">
                        <option value="usdc">USDC</option>
                        <option value="eurc">EURC</option>
                      </select>
                    </div>

                    <div className="input-group" style={{ marginBottom: 'var(--space-lg)' }}>
                      <label className="input-label">Amount</label>
                      <input type="number" className="input input-mono" placeholder="0.00" step="0.01" />
                    </div>

                    <button className="btn btn-secondary btn-lg" style={{ width: '100%' }}>
                      Get Quote & Swap
                    </button>

                    <div style={{ textAlign: 'center', marginTop: 12 }}>
                      <a
                        href="https://docs.arc.io/app-kit/swap"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--text-tertiary)' }}
                      >
                        <ExternalLink size={10} /> App Kit Swap Documentation
                      </a>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
