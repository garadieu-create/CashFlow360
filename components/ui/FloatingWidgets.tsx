'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAccount, useUSDCBalance, useTransactionHistory } from '@/hooks/useOnChainData';
import { useCircleWallet } from '@/context/CircleWalletContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Cpu, 
  Terminal, 
  X, 
  CheckCircle2, 
  Circle, 
  Play, 
  ChevronRight,
  ExternalLink,
  Loader2,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Log {
  timestamp: number;
  message: string;
  level: string;
}

export function FloatingWidgets() {
  const { isConnected, address, showOverlay, setShowOverlay } = useCircleWallet();
  const { formatted: usdcBalanceRaw } = useUSDCBalance();
  const { transactions, isLoading: txsLoading } = useTransactionHistory();

  // Onboarding Checklist States
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [hasRunSwarm, setHasRunSwarm] = useState(false);

  // Swarm Telemetry Portal States
  const [telemetryOpen, setTelemetryOpen] = useState(false);
  const [logs, setLogs] = useState<Log[]>([]);
  const [telemetryLoading, setTelemetryLoading] = useState(false);

  // Transaction Tracker States
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [showTxTracker, setShowTxTracker] = useState(false);

  // Load swarm status from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const runCount = localStorage.getItem('swarm_run_count');
      if (runCount && parseInt(runCount) > 0) {
        setHasRunSwarm(true);
      }
    }
  }, []);

  // Poll logs for Swarm Telemetry
  const fetchTelemetry = async () => {
    try {
      const res = await fetch('/api/agent');
      const data = await res.json();
      if (data.success) {
        setLogs((data.logs || []).slice(0, 5));
      }
    } catch (err) {
      console.error('Failed to load telemetry logs', err);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 12000);
    return () => clearInterval(interval);
  }, []);

  // Monitor latest transaction for the Transaction Status Queue
  useEffect(() => {
    if (transactions && transactions.length > 0) {
      const latestTx = transactions[0];
      const txTime = latestTx.timestamp * 1000;
      // If the latest transaction happened in the last 60 seconds, display the tracker widget
      if (Date.now() - txTime < 60000 && latestTx.hash !== lastTxHash) {
        setLastTxHash(latestTx.hash);
        setShowTxTracker(true);
        // Auto-dismiss transaction tracker after 12 seconds
        const timer = setTimeout(() => {
          setShowTxTracker(false);
        }, 12000);
        return () => clearTimeout(timer);
      }
    }
  }, [transactions, lastTxHash]);

  // Checklist Step evaluation
  const balance = parseFloat((usdcBalanceRaw || '0').replace(/,/g, ''));
  const isStep1Done = isConnected && !!address;
  const isStep2Done = isStep1Done && balance > 0;
  const isStep3Done = hasRunSwarm;
  const isAllStepsDone = isStep1Done && isStep2Done && isStep3Done;

  // Key handlers for Accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setChecklistOpen(false);
        setTelemetryOpen(false);
        setShowTxTracker(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Listen to custom event for swarm run to dynamically check off step 3
  useEffect(() => {
    const handleSwarmRun = () => {
      setHasRunSwarm(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('swarm_run_count', '1');
      }
    };
    window.addEventListener('swarm-cycle-triggered', handleSwarmRun);
    return () => window.removeEventListener('swarm-cycle-triggered', handleSwarmRun);
  }, []);

  return (
    <>
      {/* 1. Onboarding Checklist Indicator (Left Middle) */}
      <AnimatePresence>
        {!isAllStepsDone && (
          <div style={{ position: 'fixed', left: 0, top: '45%', transform: 'translateY(-50%)', zIndex: 9999 }}>
            {!checklistOpen ? (
              <motion.button
                initial={{ x: -40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -40, opacity: 0 }}
                onClick={() => setChecklistOpen(true)}
                aria-label="Open Onboarding Checklist"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '2px solid var(--text-primary)',
                  borderLeft: 'none',
                  padding: '12px 8px',
                  cursor: 'pointer',
                  boxShadow: '4px 4px 0px rgba(0,0,0,1)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  color: 'var(--text-primary)'
                }}
              >
                <Shield size={16} color="#F54E00" />
                <span style={{ 
                  writingMode: 'vertical-rl', 
                  fontSize: 10, 
                  fontWeight: 800, 
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  fontFamily: 'var(--font-mono)' 
                }}>
                  Checklist
                </span>
                <div style={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  background: isStep2Done ? 'var(--ph-green)' : 'var(--ph-red)',
                  animation: 'telemetry-pulse 2s infinite'
                }} />
              </motion.button>
            ) : (
              <motion.div
                initial={{ x: -280, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -280, opacity: 0 }}
                style={{
                  background: 'var(--bg-surface)',
                  border: '2px solid var(--text-primary)',
                  borderLeft: 'none',
                  width: 280,
                  padding: 20,
                  boxShadow: '6px 6px 0px rgba(0,0,0,0.95)',
                  fontFamily: 'Inter, sans-serif',
                  color: 'var(--text-primary)'
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    Treasury Onboarding
                  </span>
                  <button 
                    onClick={() => setChecklistOpen(false)}
                    aria-label="Close Checklist"
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-primary)' }}
                  >
                    <X size={16} />
                  </button>
                </div>

                <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12, textTransform: 'uppercase' }}>
                  Smart Treasury Setup
                </h3>

                {/* Steps */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Step 1 */}
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    {isStep1Done ? (
                      <CheckCircle2 size={16} color="var(--ph-green)" style={{ flexShrink: 0, marginTop: 1 }} />
                    ) : (
                      <Circle size={16} style={{ flexShrink: 0, marginTop: 1, color: 'var(--text-tertiary)' }} />
                    )}
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, textDecoration: isStep1Done ? 'line-through' : 'none', color: isStep1Done ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                        Connect Smart Account
                      </div>
                      {!isStep1Done && (
                        <button 
                          onClick={() => setShowOverlay(true)}
                          style={{ fontSize: 10, color: '#F54E00', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', fontWeight: 800, marginTop: 2 }}
                        >
                          Initialize Wallet &rarr;
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    {isStep2Done ? (
                      <CheckCircle2 size={16} color="var(--ph-green)" style={{ flexShrink: 0, marginTop: 1 }} />
                    ) : (
                      <Circle size={16} style={{ flexShrink: 0, marginTop: 1, color: 'var(--text-tertiary)' }} />
                    )}
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, textDecoration: isStep2Done ? 'line-through' : 'none', color: isStep2Done ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                        Fund with gasless USDC
                      </div>
                      {!isStep2Done && isStep1Done && (
                        <span style={{ fontSize: 10, color: 'var(--text-tertiary)', display: 'block', marginTop: 2 }}>
                          Send stablecoins to your smart address: <code style={{ fontFamily: 'var(--font-mono)', fontSize: 9 }}>{address?.slice(0, 6)}...{address?.slice(-4)}</code>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    {isStep3Done ? (
                      <CheckCircle2 size={16} color="var(--ph-green)" style={{ flexShrink: 0, marginTop: 1 }} />
                    ) : (
                      <Circle size={16} style={{ flexShrink: 0, marginTop: 1, color: 'var(--text-tertiary)' }} />
                    )}
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, textDecoration: isStep3Done ? 'line-through' : 'none', color: isStep3Done ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                        Execute Swarm Evaluation
                      </div>
                      {!isStep3Done && (
                        <span style={{ fontSize: 10, color: 'var(--text-tertiary)', display: 'block', marginTop: 2 }}>
                          Run your first autonomous simulation inside the "Swarm" tab.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>

      {/* 2. Swarm Telemetry Portal (Bottom Left) */}
      {isConnected && (
        <div style={{ position: 'fixed', left: 24, bottom: 24, zIndex: 9999 }}>
          {!telemetryOpen ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => setTelemetryOpen(true)}
              aria-label="Expand Swarm Telemetry"
              style={{
                background: 'var(--bg-secondary)',
                border: '2px solid var(--text-primary)',
                padding: '8px 16px',
                cursor: 'pointer',
                boxShadow: '4px 4px 0px rgba(0,0,0,1)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: 'var(--text-primary)',
                height: 38
              }}
            >
              <div style={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                background: 'var(--ph-green)',
                boxShadow: '0px 0px 8px var(--ph-green)'
              }} />
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                Swarm: Active
              </span>
              <ChevronUp size={14} />
            </motion.button>
          ) : (
            <motion.div
              initial={{ y: 150, scale: 0.95, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 150, scale: 0.95, opacity: 0 }}
              style={{
                width: 380,
                background: '#13151A',
                border: '2px solid var(--text-primary)',
                boxShadow: '6px 6px 0px rgba(0,0,0,0.95)',
                color: '#E2E8F0',
                fontFamily: 'var(--font-mono)',
                overflow: 'hidden'
              }}
            >
              {/* Telemetry Header */}
              <div style={{ 
                background: '#1A1C23', 
                borderBottom: '2px solid var(--text-primary)',
                padding: '8px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#A78BFA', fontWeight: 'bold' }}>
                  <Terminal size={14} />
                  <span>SWARM TELEMETRY CONSOLE</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button 
                    onClick={() => setTelemetryOpen(false)}
                    aria-label="Minimize Console"
                    style={{ background: 'transparent', border: 'none', color: '#E2E8F0', cursor: 'pointer', padding: 0 }}
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
              </div>

              {/* Logs area */}
              <div style={{ padding: 12, height: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 10, scrollbarWidth: 'thin' }}>
                {logs.length > 0 ? (
                  logs.map((log, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: 4 }}>
                      <span style={{ color: 'var(--text-tertiary)', flexShrink: 0 }}>
                        [{new Date(log.timestamp).toLocaleTimeString()}]
                      </span>
                      <span style={{ 
                        color: log.level === 'SUCCESS' ? 'var(--ph-green)' : log.level === 'TRIGGER' ? 'var(--ph-red)' : '#A78BFA', 
                        fontWeight: 'bold', 
                        flexShrink: 0,
                        width: 54 
                      }}>
                        {log.level}
                      </span>
                      <span style={{ color: '#F8FAFC' }}>{log.message}</span>
                    </div>
                  ))
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-tertiary)' }}>
                    <Loader2 size={16} className="spinning" style={{ marginRight: 6 }} /> Connecting telemetry stream...
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* 3. Transaction Status Queue (Bottom Right) */}
      <AnimatePresence>
        {showTxTracker && transactions && transactions.length > 0 && (
          <motion.div
            initial={{ x: 200, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 200, opacity: 0 }}
            style={{
              position: 'fixed',
              right: 24,
              bottom: 24,
              zIndex: 9999,
              width: 320,
              background: 'var(--bg-surface)',
              border: '2px solid var(--text-primary)',
              padding: 16,
              boxShadow: '6px 6px 0px rgba(0,0,0,1)',
              fontFamily: 'Inter, sans-serif',
              color: 'var(--text-primary)'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', fontFamily: 'var(--font-mono)', color: 'var(--ph-green)' }}>
                Transaction Success
              </span>
              <button 
                onClick={() => setShowTxTracker(false)}
                aria-label="Dismiss Alert"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-primary)' }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 800 }}>
                {transactions[0].category || 'On-chain Transfer'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Amount:</span>
                <span style={{ fontWeight: 700, color: transactions[0].type === 'inflow' ? 'var(--ph-green)' : 'var(--ph-red)' }}>
                  {transactions[0].type === 'inflow' ? '+' : '-'}${parseFloat(transactions[0].value).toLocaleString('en-US', { minimumFractionDigits: 2 })} USDC
                </span>
              </div>
              
              <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: 8, marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <a 
                  href={`https://explorer.testnet.arc.network/tx/${transactions[0].hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ 
                    fontSize: 10, 
                    color: '#F54E00', 
                    fontWeight: 700, 
                    textDecoration: 'none', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 4 
                  }}
                >
                  View on Explorer <ExternalLink size={10} />
                </a>
                <span style={{ fontSize: 9, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                  {transactions[0].hash.slice(0, 6)}...{transactions[0].hash.slice(-6)}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
