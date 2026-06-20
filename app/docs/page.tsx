'use client';

import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { motion } from 'framer-motion';
import { ExternalLink, FileText, Github, Video, Code } from 'lucide-react';
import RelatedContent from '@/components/ui/RelatedContent';

export default function DocsPage() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main" id="main-content">
        <Topbar title="Documentation" />
        <div className="app-content">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: 800 }}>
            <div className="page-header">
              <div>
                <h1 className="page-title">CashFlow360 Documentation</h1>
                <p className="page-subtitle">
                  Technical documentation for the SME Cash Flow Intelligence Platform
                </p>
              </div>
            </div>

            {/* Architecture Overview */}
            <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 'var(--space-lg)' }}>
              <div className="card-header">
                <span className="card-title">Architecture Overview</span>
              </div>
              <div className="card-body" style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--text-secondary)' }}>
                <pre style={{ fontFamily: 'var(--font-mono)', fontSize: 11, padding: 16, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', overflow: 'auto', color: 'var(--text-primary)', lineHeight: 1.6 }}>
{`┌─────────────────────────────────────────────────────┐
│                    Frontend Layer                     │
│  Next.js 14 App Router + TypeScript + PostHog Design │
│                                                       │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │Dashboard│ │Sankey Map│ │Treasury  │ │ Runway   │ │
│  │  (KPIs) │ │ (D3.js)  │ │  Radar   │ │Calculator│ │
│  └────┬────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ │
│       └────────────┴────────────┴────────────┘       │
│                        │                              │
│              RainbowKit + wagmi v2                    │
│              (Wallet Connection Layer)                │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│                  Circle SDK Layer                     │
│                                                       │
│  App Kit Send  │  App Kit Bridge  │  App Kit Swap    │
│  (USDC xfer)   │  (CCTP v2)       │  (USDC↔EURC)    │
│                                                       │
│  Unified Balance   │   User-Controlled Wallets       │
│  (Multi-chain)     │   (RainbowKit integration)      │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│               Arc Testnet (Chain ID: 5042002)         │
│                                                       │
│  CashFlowVault.sol    USDC (0x3600...0000)           │
│  - deposit()          EURC (0x89B5...D72a)           │
│  - withdraw()                                         │
│  - transfer()         Events → On-chain Indexing     │
│  - batchTransfer()    → Real-time Dashboard          │
│  - setAlertThreshold()                               │
└──────────────────────────────────────────────────────┘`}
                </pre>
              </div>
            </motion.div>

            {/* Tech Stack */}
            <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ marginBottom: 'var(--space-lg)' }}>
              <div className="card-header">
                <span className="card-title">Technology Stack</span>
              </div>
              <div className="card-body">
                <table className="data-table">
                  <thead>
                    <tr><th>Layer</th><th>Technology</th><th>Purpose</th></tr>
                  </thead>
                  <tbody>
                    <tr><td style={{fontWeight:600,color:'var(--text-primary)'}}>Framework</td><td>Next.js 14 App Router</td><td>SSR + Client Components</td></tr>
                    <tr><td style={{fontWeight:600,color:'var(--text-primary)'}}>Language</td><td>TypeScript (strict)</td><td>Type safety</td></tr>
                    <tr><td style={{fontWeight:600,color:'var(--text-primary)'}}>Wallet</td><td>RainbowKit v2 + wagmi v2</td><td>Multi-wallet connect</td></tr>
                    <tr><td style={{fontWeight:600,color:'var(--text-primary)'}}>Chain</td><td>viem + Arc Testnet</td><td>On-chain interaction</td></tr>
                    <tr><td style={{fontWeight:600,color:'var(--text-primary)'}}>Charts</td><td>Recharts + D3.js</td><td>Data visualization</td></tr>
                    <tr><td style={{fontWeight:600,color:'var(--text-primary)'}}>Animation</td><td>Framer Motion</td><td>UI transitions</td></tr>
                    <tr><td style={{fontWeight:600,color:'var(--text-primary)'}}>Design</td><td>PostHog Design System</td><td>Analytics-dense UI</td></tr>
                    <tr><td style={{fontWeight:600,color:'var(--text-primary)'}}>Contracts</td><td>Solidity + Hardhat</td><td>Smart contract deployment</td></tr>
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Quick Links */}
            <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="card-header">
                <span className="card-title">Resources</span>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {[
                  { label: 'Arc Network Documentation', url: 'https://docs.arc.io', icon: FileText },
                  { label: 'Circle Developer Docs', url: 'https://developers.circle.com', icon: Code },
                  { label: 'Arc Testnet Explorer', url: 'https://testnet.arcscan.app', icon: ExternalLink },
                  { label: 'Testnet USDC Faucet', url: 'https://faucet.circle.com', icon: ExternalLink },
                  { label: 'App Kit SDK Reference', url: 'https://docs.arc.io/app-kit/references/sdk-reference', icon: Code },
                ].map((link) => {
                  const Icon = link.icon;
                  return (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sidebar-link"
                      style={{ padding: 'var(--space-md)' }}
                    >
                      <Icon size={16} />
                      {link.label}
                      <ExternalLink size={12} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                    </a>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
          <RelatedContent />
        </div>
      </main>
    </div>
  );
}
