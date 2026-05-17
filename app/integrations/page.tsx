'use client';

import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { motion } from 'framer-motion';
import { CheckCircle, ExternalLink } from 'lucide-react';

const integrations = [
  {
    name: 'USDC on Arc',
    description: 'Primary stablecoin settlement rail. All transactions denominated in USDC.',
    status: 'live',
    docs: 'https://developers.circle.com/stablecoins/what-is-usdc',
    method: 'Direct ERC-20 contract interaction via viem + wagmi. Balance reads via useReadContract, transfers via useWriteContract.',
  },
  {
    name: 'App Kit — Send',
    description: 'Wallet-to-wallet USDC transfers on Arc. Powers the Send USDC feature.',
    status: 'live',
    docs: 'https://docs.arc.io/app-kit/send',
    method: 'USDC transfer() call on Arc Testnet. Real on-chain transaction with Arcscan verification.',
  },
  {
    name: 'App Kit — Bridge (CCTP)',
    description: 'Cross-chain USDC bridge using burn-and-mint CCTP v2. Powers the Treasury Radar.',
    status: 'live',
    docs: 'https://docs.arc.io/app-kit/bridge',
    method: 'Multi-chain balance reads via wagmi useReadContract across Ethereum Sepolia, Base Sepolia, Arbitrum Sepolia, and Arc Testnet.',
  },
  {
    name: 'App Kit — Swap',
    description: 'USDC↔EURC stablecoin FX swap on Arc. Multi-currency treasury management.',
    status: 'architecture-ready',
    docs: 'https://docs.arc.io/app-kit/swap',
    method: 'App Kit kit.swap() API. Requires KIT_KEY from Circle Console. UI and routing logic implemented.',
  },
  {
    name: 'Unified Balance',
    description: 'Aggregates USDC across Ethereum, Base, Arbitrum, and Arc into a single spendable balance.',
    status: 'live',
    docs: 'https://docs.arc.io/app-kit/unified-balance',
    method: 'Multi-chain balance aggregation via parallel contract reads. Treasury Radar visualization shows unified view.',
  },
  {
    name: 'User-Controlled Wallets',
    description: 'Wallet connection via RainbowKit for end-user wallet management.',
    status: 'live',
    docs: 'https://developers.circle.com/wallets/user-controlled',
    method: 'RainbowKit v2 + wagmi v2 with Arc Testnet chain configuration. Users connect their own wallets.',
  },
];

export default function IntegrationsPage() {
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
                  6 Circle products integrated • Transparent status for each integration
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
                      <span className={`badge ${integration.status === 'live' ? 'badge-green' : 'badge-yellow'}`}>
                        {integration.status === 'live' ? (
                          <><CheckCircle size={10} /> Live</>
                        ) : (
                          'Architecture Ready'
                        )}
                      </span>
                    </div>
                    <div style={{ padding: 12, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                        Implementation Method
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        {integration.method}
                      </div>
                    </div>
                    <a
                      href={integration.docs}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <ExternalLink size={12} /> Circle Documentation
                    </a>
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
                <p>
                  CashFlow360 is an analytics-first SME cash flow platform that requires real-time on-chain data,
                  cross-chain treasury visibility, and instant settlement. Circle's USDC on Arc provides predictable,
                  dollar-denominated transactions essential for financial analytics. App Kit's Send, Bridge, and Swap
                  capabilities give SMEs a complete treasury management toolkit.
                </p>

                <h4 style={{ color: 'var(--text-primary)', marginTop: 16, marginBottom: 8 }}>What worked well</h4>
                <ul style={{ paddingLeft: 20, marginBottom: 8 }}>
                  <li>Arc's sub-second finality makes real-time analytics genuinely real-time</li>
                  <li>USDC as native gas token eliminates the gas token onboarding friction</li>
                  <li>Unified Balance concept perfectly maps to our Treasury Radar feature</li>
                  <li>CCTP's burn-and-mint model gives confidence in cross-chain balance integrity</li>
                </ul>

                <h4 style={{ color: 'var(--text-primary)', marginTop: 16, marginBottom: 8 }}>What could be improved</h4>
                <ul style={{ paddingLeft: 20, marginBottom: 8 }}>
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
    </div>
  );
}
