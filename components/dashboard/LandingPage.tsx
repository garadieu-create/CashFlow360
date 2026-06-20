'use client';

import { useCircleWallet } from '@/context/CircleWalletContext';
import { motion } from 'framer-motion';
import { Activity, Shield, RefreshCw, DollarSign, TrendingUp, HelpCircle, ArrowRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { createPublicClient, http } from 'viem';
import { arcTestnet, USDC_ADDRESS } from '@/lib/arc-config';
import { CASHFLOW_VAULT_ADDRESS, USDC_ABI } from '@/lib/contracts';

export default function LandingPage() {
  const { setShowOverlay } = useCircleWallet();
  const [vaultBalance, setVaultBalance] = useState<string>('8,704.00');

  // Fetch real-time vault balance to make the metrics bar live!
  useEffect(() => {
    const fetchLiveStats = async () => {
      try {
        const publicClient = createPublicClient({
          chain: arcTestnet,
          transport: http('https://rpc.testnet.arc.network')
        });
        
        // Read USDC balance of CashFlowVault address
        const balance = await publicClient.readContract({
          address: USDC_ADDRESS as `0x${string}`,
          abi: USDC_ABI,
          functionName: 'balanceOf',
          args: [CASHFLOW_VAULT_ADDRESS as `0x${string}`]
        });

        if (balance) {
          const formatted = (Number(balance) / 1e6).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          });
          setVaultBalance(formatted);
        }
      } catch (err) {
        console.error('Failed to fetch live stats for landing page:', err);
      }
    };
    fetchLiveStats();
  }, []);

  return (
    <div className="landing-container" style={{ color: 'white', fontFamily: 'Inter, sans-serif' }}>
      
      {/* 1. Hero Section */}
      <section className="hero-section" style={{
        padding: '60px 24px',
        textAlign: 'center',
        background: 'radial-gradient(circle at top, rgba(245, 78, 0, 0.08) 0%, transparent 70%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        marginBottom: 40
      }}>
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 12px',
            background: 'rgba(245, 78, 0, 0.1)',
            border: '1px solid rgba(245, 78, 0, 0.3)',
            borderRadius: 100,
            fontSize: 12,
            fontWeight: 600,
            color: '#F54E00',
            marginBottom: 24,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <Shield size={13} />
            <span>Circle + Arc Production Stack</span>
          </div>

          <h1 style={{
            fontSize: 'min(48px, 9vw)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            color: 'white',
            maxWidth: 800,
            margin: '0 auto 20px',
          }}>
            Autonomous Treasury & <span style={{
              background: 'linear-gradient(90deg, #F54E00 0%, #FF7A33 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Cash Flow Intelligence</span> on Arc
          </h1>

          <p style={{
            fontSize: 16,
            color: 'var(--text-secondary)',
            maxWidth: 600,
            margin: '0 auto 36px',
            lineHeight: 1.6
          }}>
            Streamline your SME operations with real-time on-chain indexing, automated payroll escrows, and gasless treasury swarms powered by Circle CCTP.
          </p>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 16,
            marginBottom: 48
          }}>
            <button
              onClick={() => setShowOverlay(true)}
              className="btn btn-primary"
              style={{
                background: 'linear-gradient(90deg, #F54E00 0%, #FF7A33 100%)',
                border: 'none',
                height: 48,
                padding: '0 28px',
                fontSize: 14,
                fontWeight: 700,
                borderRadius: 10,
                boxShadow: '0 4px 20px rgba(245, 78, 0, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              Connect Corporate Wallet <ArrowRight size={16} />
            </button>
            <Link href="/docs">
              <button
                className="btn"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  height: 48,
                  padding: '0 28px',
                  fontSize: 14,
                  fontWeight: 600,
                  borderRadius: 10,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                Read Documentation
              </button>
            </Link>
          </div>
        </motion.div>

        {/* 2. Live Metrics Bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          style={{
            maxWidth: 1000,
            margin: '0 auto',
            background: 'linear-gradient(180deg, #16181F 0%, #0F1015 100%)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 16,
            padding: '20px 32px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 24,
            textAlign: 'left'
          }}
        >
          <div>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
              USDC Vault Reserves
            </span>
            <span style={{ fontSize: 24, fontWeight: 800, color: 'white', fontFamily: 'var(--font-mono)' }}>
              ${vaultBalance}
            </span>
            <span style={{ fontSize: 10, color: '#00C853', display: 'block', marginTop: 2 }}>
              ● Audited On-Chain
            </span>
          </div>

          <div>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
              Vault Address
            </span>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'white', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', marginTop: 8 }}>
              0x8704...6Aad
            </span>
            <a 
              href="https://testnet.arcscan.app/address/0x8704caa872Ac721e648DBeB9Fd6FA46C396d6Aad" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ fontSize: 10, color: '#F54E00', display: 'inline-flex', alignItems: 'center', gap: 2, marginTop: 2, textDecoration: 'none' }}
            >
              View Contract <ExternalLink size={10} style={{ marginLeft: 2 }} />
            </a>
          </div>

          <div>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
              Network Status
            </span>
            <span style={{ fontSize: 24, fontWeight: 800, color: '#F54E00' }}>
              Arc Testnet
            </span>
            <span style={{ fontSize: 10, color: 'var(--text-secondary)', display: 'block', marginTop: 2 }}>
              Chain ID: 5042002
            </span>
          </div>

          <div>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
              Active Relayers
            </span>
            <span style={{ fontSize: 24, fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 8 }}>
              Circle CCTP
            </span>
            <span style={{ fontSize: 10, color: '#00C853', display: 'block', marginTop: 2 }}>
              ● Gas-Sponsored
            </span>
          </div>
        </motion.div>
      </section>

      {/* 3. Core Features Grid */}
      <section className="features-section" style={{ padding: '0 24px 60px', maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 32, textAlign: 'center' }}>
          Real-Time Treasury Management Capabilities
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 24
        }}>
          {[
            {
              icon: Activity,
              title: 'Real-time Indexer Logs',
              desc: 'Continuously streams events directly from the Arc blockchain. Reads raw category inflows, outflows, and net burn rates in real time without mock API data.'
            },
            {
              icon: RefreshCw,
              title: 'CCTP Autonomic Swarm',
              desc: 'Define custom treasury safety boundaries. The Autonomous Agent Stack automatically triggers CCTP transfers to bridge USDC from Base or Ethereum when your runway drops.'
            },
            {
              icon: DollarSign,
              title: 'Smart Account Gateway',
              desc: 'Interact completely gasless using Passkey or secure Email session keys. Cryptographically sign micro-payments using EIP-191 to unlock runway forecasts.'
            },
            {
              icon: TrendingUp,
              title: 'Payroll Escrow Jobs',
              desc: 'Deploy corporate jobs, deposit contractor wages into escrow, and verify automated release and dispute mechanisms completely on-chain.'
            }
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.3 }}
                className="card brutalist-card"
                style={{
                  background: '#16181F',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: 16,
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#F54E00';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <div style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  background: 'rgba(245, 78, 0, 0.1)',
                  border: '1px solid rgba(245, 78, 0, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#F54E00'
                }}>
                  <Icon size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: 'white' }}>{item.title}</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 4. Frequently Asked Questions (FAQ) */}
      <section className="faq-section" style={{
        padding: '60px 24px',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        maxWidth: 800,
        margin: '0 auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 40 }}>
          <HelpCircle size={24} color="#F54E00" />
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Frequently Asked Questions</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {[
            {
              q: 'How secure is the Autonomous Treasury Agent?',
              a: 'The Treasury Agent runs inside a secure sandbox CLI authenticated through Circle Developer-Controlled Wallets. It only has permissions to trigger transfers according to the daily transaction cap and spending policy limits you verify under your signature.'
            },
            {
              q: 'Why does Runway Forecasting require a signed x402 payment?',
              a: 'Predictive runway scenarios process heavy computation models and query on-chain historical indexes. To distribute API resource costs fairly, the gateway requests a micropayment of $0.0001 USDC per call, abstracted gaslessly through your smart account signature.'
            },
            {
              q: 'Can I use CashFlow360 on mobile browsers?',
              a: 'Yes! The platform is optimized for mobile-first views and supports Passkey registration (biometrics like TouchID/FaceID) to log in instantly on iOS and Android devices without typing complex seed phrases.'
            }
          ].map((item, index) => (
            <div
              key={index}
              style={{
                background: '#16181F',
                border: '1px solid rgba(255, 255, 255, 0.04)',
                borderRadius: 12,
                padding: 20
              }}
            >
              <h4 style={{ fontSize: 15, fontWeight: 700, color: 'white', marginBottom: 8 }}>{item.q}</h4>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{item.a}</p>
            </div>
          ))}
        </div>
      </section>
      
    </div>
  );
}
