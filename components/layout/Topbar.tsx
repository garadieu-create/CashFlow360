'use client';

import { useState } from 'react';
import { useCircleWallet } from '@/context/CircleWalletContext';
import { LogOut, Key, Mail, ShieldCheck, Copy, Check, X, Shield, Cpu, ExternalLink } from 'lucide-react';
import Breadcrumb from './Breadcrumb';
import { useUSDCBalance } from '@/hooks/useOnChainData';
import { motion, AnimatePresence } from 'framer-motion';

export default function Topbar({ title }: { title: string }) {
  const { address, isConnected, socialEmail, logout, gasSponsoredCount } = useCircleWallet();
  const { isDemo } = useUSDCBalance();
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="app-topbar">
      <div className="topbar-left">
        <Breadcrumb />
      </div>
      <div className="topbar-right">
        {isConnected && isDemo && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            padding: '4px 10px',
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: 6,
            color: '#3B82F6',
            fontWeight: 'bold'
          }}>
            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#3B82F6' }} />
            <span>Demo Mode</span>
          </div>
        )}

        {isConnected && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            padding: '4px 10px',
            background: 'rgba(245, 78, 0, 0.08)',
            border: '1px solid rgba(245, 78, 0, 0.2)',
            borderRadius: 6,
            color: '#F54E00'
          }}>
            <ShieldCheck size={13} />
            <span>Sponsored ({gasSponsoredCount} txs)</span>
          </div>
        )}

        <div className="topbar-chain-badge">
          <div className="topbar-chain-dot" />
          Arc Testnet
        </div>

        {isConnected && address ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div 
              onClick={() => setShowDetailsModal(true)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: 2,
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '4px',
                transition: 'all var(--transition-fast)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
              title="View Smart Account Details"
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: '#F7A501', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'underline', textDecorationColor: 'rgba(247, 165, 1, 0.4)' }}>
                {socialEmail ? <Mail size={12} color="var(--text-secondary)" /> : <Key size={12} color="var(--text-secondary)" />}
                {truncateAddress(address)}
              </span>
              {socialEmail && (
                <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                  {socialEmail}
                </span>
              )}
            </div>
            <button
              onClick={logout}
              title="Disconnect Session"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'var(--text-secondary)',
                borderRadius: 8,
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 0, 0, 0.1)';
                e.currentTarget.style.color = '#FF4444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => window.location.reload()}
            className="btn btn-sm btn-primary"
            style={{
              background: '#F54E00',
              border: 'none',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700
            }}
          >
            Connect Smart Account
          </button>
        )}
      </div>

      {/* Account Details Modal */}
      <AnimatePresence>
        {showDetailsModal && isConnected && address && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(9, 11, 15, 0.85)',
              backdropFilter: 'blur(8px)',
              zIndex: 20000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
            }}
          >
            <motion.div
              initial={{ scale: 0.96, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 10 }}
              transition={{ type: 'spring', duration: 0.3 }}
              style={{
                background: 'var(--bg-surface)',
                border: '2px solid var(--text-primary)',
                borderRadius: '0px',
                maxWidth: 480,
                width: '100%',
                padding: '24px 28px 28px',
                boxShadow: '8px 8px 0px rgba(0,0,0,0.95)',
                color: 'var(--text-primary)',
                position: 'relative'
              }}
            >
              {/* Close button */}
              <button
                onClick={() => setShowDetailsModal(false)}
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.15s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                <X size={18} />
              </button>

              {/* Modal Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, borderBottom: '2px solid var(--text-primary)', paddingBottom: 12 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  background: 'rgba(247, 165, 1, 0.1)',
                  border: '1.5px solid var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Cpu size={18} color="#F7A501" />
                </div>
                <div>
                  <h3 style={{ fontSize: 13, fontWeight: 900, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-primary)', letterSpacing: '0.05em', margin: 0 }}>
                    Circle Smart Account Details
                  </h3>
                  <span style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>
                    ERC-4337 Multi-Party Computation Wallet
                  </span>
                </div>
              </div>

              {/* Details Content */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Account Owner/User ID */}
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>
                    Owner ID / Account Alias
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-secondary)', padding: '8px 12px', border: '1px solid var(--border-secondary)', fontSize: 13 }}>
                    {socialEmail ? <Mail size={14} color="#F54E00" /> : <Key size={14} color="#F54E00" />}
                    <span style={{ fontWeight: 600 }}>{socialEmail || 'Registered Passkey User'}</span>
                  </div>
                </div>

                {/* Smart Account Address */}
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>
                    On-Chain Address
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)', padding: '8px 12px', border: '1px solid var(--border-secondary)' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, wordBreak: 'break-all', color: 'var(--text-primary)', marginRight: 8 }}>
                      {address}
                    </span>
                    <button
                      onClick={handleCopy}
                      style={{
                        background: copied ? 'var(--ph-green)' : 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--text-primary)',
                        color: copied ? 'black' : 'var(--text-primary)',
                        padding: 6,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '0px',
                        transition: 'all 0.15s',
                        flexShrink: 0
                      }}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                {/* Network & Gas Sponsor Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', border: '1px solid var(--border-secondary)' }}>
                    <label style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)', display: 'block', marginBottom: 2 }}>
                      Blockchain Network
                    </label>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                      Arc Testnet
                    </span>
                  </div>
                  <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', border: '1px solid var(--border-secondary)' }}>
                    <label style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)', display: 'block', marginBottom: 2 }}>
                      Gas Fee Policy
                    </label>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ph-green)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Shield size={12} /> Sponsored
                    </span>
                  </div>
                </div>

                {/* Account Actions */}
                <div style={{ borderTop: '1px dashed var(--border-secondary)', paddingTop: 16, marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    Sponsorship count: <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{gasSponsoredCount} txs</strong>
                  </span>
                  <a
                    href={`https://arc-scan-testnet.thecanteenapp.com/address/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: 11,
                      color: 'var(--ph-red)',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      textDecoration: 'underline'
                    }}
                  >
                    View on ArcScan <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
