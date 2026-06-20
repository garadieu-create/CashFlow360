'use client';

import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { useState, useEffect, useRef } from 'react';
import RelatedContent from '@/components/ui/RelatedContent';
import { motion } from 'framer-motion';
import { 
  Terminal, 
  Cpu, 
  Play, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Sliders, 
  UserCheck, 
  ArrowRightLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import { LoadingButton, Skeleton } from '@/components/ui/LoadingSystem';

interface Log {
  timestamp: number;
  message: string;
  level: string;
}

export default function SwarmPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [triggerRebalance, setTriggerRebalance] = useState(false);
  const [mode, setMode] = useState<'simulation' | 'live'>('live');
  const [activeTab, setActiveTab] = useState<'visual' | 'logs'>('visual');
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Fetch initial logs and state
  const fetchState = async () => {
    try {
      const res = await fetch('/api/agent');
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
        setMode(data.settings?.mode || 'live');
      }
    } catch (err) {
      console.error('Failed to load agent logs', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const handleRunSwarm = async () => {
    setIsSimulating(true);
    const toastId = toast.loading('Waking up Swarm Agents...');
    try {
      const res = await fetch('/api/swarm/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggerRebalance })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(triggerRebalance ? 'Swarm Rebalanced Successfully!' : 'Swarm Runway Analysis Clean!', { id: toastId });
        fetchState();
      } else {
        toast.error('Swarm simulation cycle failed', { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message || 'Swarm cycle failed', { id: toastId });
    } finally {
      setIsSimulating(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'SUCCESS': return 'var(--ph-green)';
      case 'TRIGGER': return 'var(--ph-red)';
      case 'EXEC': return 'var(--ph-blue)';
      case 'ERROR': return '#EF4444';
      case 'SYSTEM': return '#A78BFA';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main" id="main-content">
        <Topbar title="Multi-Agent Swarm" />
        <div className="app-content">
          
          {/* Header Banner */}
          <div className="brutalist-hero" style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            border: '2px solid var(--text-primary)',
            background: 'var(--bg-secondary)',
            marginBottom: 'var(--space-xl)',
            boxShadow: '8px 8px 0px rgba(0,0,0,0.9)'
          }}>
            <div style={{ padding: '24px', borderRight: '2px solid var(--text-primary)' }}>
              <span className="badge badge-purple" style={{ marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Cpu size={12} /> Autonomous Swarm Network
              </span>
              <h1 className="brutalist-outline-title" style={{ fontSize: 32, margin: '6px 0', fontWeight: 900 }}>
                AGENT SWARM CONTROLLER
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: '580px', lineHeight: 1.5 }}>
                CashFlow360 distributes treasury governance to a coordinated swarm of 4 specialist AI agents. The swarm handles continuous monitoring, x402-based threat modeling, CCTP rebalancing, and EIP-712 payment authorization.
              </p>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12, background: 'var(--bg-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>System Mode:</span>
                <span className={`badge ${mode === 'live' ? 'badge-red' : 'badge-purple'}`} style={{ textTransform: 'uppercase' }}>
                  {mode}
                </span>
              </div>
              <LoadingButton 
                variant="primary" 
                style={{ width: '100%' }}
                onClick={handleRunSwarm}
                isLoading={isSimulating}
                loadingText="Running Swarm..."
              >
                <Play size={16} /> Trigger Swarm Evaluation
              </LoadingButton>
            </div>
          </div>

          {/* Quick Config / Sliders */}
          <div className="grid-3" style={{ marginBottom: 'var(--space-lg)' }}>
            <div className="card">
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <Sliders size={18} style={{ color: 'var(--ph-red)' }} />
                  <span style={{ fontSize: 13, fontWeight: 800 }}>REBALANCE SETTING</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input 
                      type="checkbox" 
                      checked={triggerRebalance} 
                      onChange={(e) => setTriggerRebalance(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    Force CCTP Bridging Trigger
                  </label>
                  <p style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                    If checked, the swarm execution agent will simulate bridging $1,500 USDC from Base Sepolia.
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <Activity size={18} style={{ color: 'var(--ph-blue)' }} />
                  <span style={{ fontSize: 13, fontWeight: 800 }}>SWARM HEALTH</span>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-mono)' }}>4 / 4</div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Agents Active</div>
                  </div>
                  <div style={{ borderLeft: '1px solid var(--border-primary)', paddingLeft: 12 }}>
                    <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--ph-green)' }}>100%</div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Consensus</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <Sparkles size={18} style={{ color: 'var(--ph-purple)' }} />
                  <span style={{ fontSize: 13, fontWeight: 800 }}>REGISTRY INDEX (ERC-8004)</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    Score: <span style={{ color: 'white', fontWeight: 'bold' }}>95/100</span>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    Tx: 0x884c...c5e2
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Toggle Tab */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button 
              className={`btn btn-sm ${activeTab === 'visual' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('visual')}
            >
              Swarm Topology Diagram
            </button>
            <button 
              className={`btn btn-sm ${activeTab === 'logs' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('logs')}
            >
              Live Terminal Log
            </button>
          </div>

          {/* Main Visual Swarm Workspace */}
          {activeTab === 'visual' ? (
            <div className="card" style={{ padding: '30px 20px', minHeight: '380px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'var(--bg-secondary)', border: '2px solid var(--text-primary)' }}>
              
              {/* Swarm Visual Grid Node Map */}
              <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', position: 'relative', margin: '20px 0' }}>
                
                {/* SVG Connections */}
                <svg style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, zIndex: 0, pointerEvents: 'none' }}>
                  <line x1="20%" y1="50%" x2="40%" y2="25%" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeDasharray="4 4" />
                  <line x1="20%" y1="50%" x2="40%" y2="75%" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeDasharray="4 4" />
                  <line x1="40%" y1="25%" x2="60%" y2="50%" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeDasharray="4 4" />
                  <line x1="40%" y1="75%" x2="60%" y2="50%" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeDasharray="4 4" />
                  <line x1="60%" y1="50%" x2="80%" y2="50%" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeDasharray="4 4" />
                </svg>

                {/* Node 1: Coordinator */}
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="card" 
                  style={{ width: '180px', background: 'var(--bg-primary)', zIndex: 1, border: '2px solid var(--text-primary)' }}
                >
                  <div style={{ padding: 12, textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', padding: 8, background: 'rgba(167, 139, 250, 0.1)', borderRadius: '50%', color: '#A78BFA', marginBottom: 8 }}>
                      <Cpu size={20} />
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 800 }}>Coordinator Agent</div>
                    <div style={{ fontSize: 9, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>0x2724...396a</div>
                    <span className="badge badge-purple" style={{ fontSize: 8, padding: '1px 4px', marginTop: 6 }}>ORCHESTRATOR</span>
                  </div>
                </motion.div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
                  {/* Node 2: Researcher (x402 paywall buyer) */}
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="card" 
                    style={{ width: '180px', background: 'var(--bg-primary)', zIndex: 1, border: '2px solid var(--text-primary)' }}
                  >
                    <div style={{ padding: 12, textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', padding: 8, background: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%', color: 'var(--ph-blue)', marginBottom: 8 }}>
                        <Terminal size={20} />
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 800 }}>Research Agent</div>
                      <div style={{ fontSize: 9, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>x402 Client</div>
                      <span className="badge badge-blue" style={{ fontSize: 8, padding: '1px 4px', marginTop: 6 }}>BUYER RAILS</span>
                    </div>
                  </motion.div>

                  {/* Node 3: Execution Agent */}
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="card" 
                    style={{ width: '180px', background: 'var(--bg-primary)', zIndex: 1, border: '2px solid var(--text-primary)' }}
                  >
                    <div style={{ padding: 12, textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', padding: 8, background: 'rgba(245, 78, 0, 0.1)', borderRadius: '50%', color: 'var(--ph-red)', marginBottom: 8 }}>
                        <ArrowRightLeft size={20} />
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 800 }}>Execution Agent</div>
                      <div style={{ fontSize: 9, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>Circle CCTP</div>
                      <span className="badge badge-yellow" style={{ fontSize: 8, padding: '1px 4px', marginTop: 6 }}>REBALANCER</span>
                    </div>
                  </motion.div>
                </div>

                {/* Node 4: Verification Agent */}
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="card" 
                  style={{ width: '180px', background: 'var(--bg-primary)', zIndex: 1, border: '2px solid var(--text-primary)' }}
                >
                  <div style={{ padding: 12, textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', padding: 8, background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', color: 'var(--ph-green)', marginBottom: 8 }}>
                      <UserCheck size={20} />
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 800 }}>Verifier Agent</div>
                    <div style={{ fontSize: 9, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>ERC-8004 Registry</div>
                    <span className="badge badge-green" style={{ fontSize: 8, padding: '1px 4px', marginTop: 6 }}>AUDITOR</span>
                  </div>
                </motion.div>

              </div>

              {/* Console preview */}
              <div style={{ background: '#1A1C23', border: '1px solid var(--border-primary)', padding: '12px 16px', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#A78BFA', fontWeight: 'bold', marginBottom: 4 }}>
                  <ChevronRight size={14} /> ACTIVE EXECUTION
                </div>
                <div>{logs.length > 0 ? logs[0].message : 'Initializing connection...'}</div>
              </div>
            </div>
          ) : (
            /* Terminal logs view */
            <div className="card" style={{ background: '#13151A', border: '2px solid var(--text-primary)', boxShadow: '8px 8px 0px rgba(0,0,0,0.95)', padding: 0 }}>
              <div className="card-header" style={{ borderBottom: '2px solid var(--text-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1A1C23' }}>
                <span className="card-title" style={{ color: 'white', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <Terminal size={14} style={{ color: '#A78BFA' }} /> Swarm Console Output
                </span>
                <span className="badge badge-secondary" style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>{logs.length} lines</span>
              </div>
              <div style={{
                height: '420px',
                overflowY: 'auto',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                lineHeight: '1.6',
                color: '#E2E8F0'
              }}>
                {isLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
                    <Skeleton width="100%" height="20px" />
                    <Skeleton width="90%" height="20px" />
                    <Skeleton width="95%" height="20px" />
                    <Skeleton width="75%" height="20px" />
                    <Skeleton width="85%" height="20px" />
                  </div>
                ) : logs.length > 0 ? (
                  logs.map((log, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: 4 }}>
                      <span style={{ color: 'var(--text-tertiary)', fontSize: 10, flexShrink: 0 }}>
                        [{new Date(log.timestamp).toLocaleTimeString()}]
                      </span>
                      <span style={{ color: getLevelColor(log.level), fontWeight: 'bold', fontSize: 10, width: '70px', flexShrink: 0 }}>
                        {log.level}
                      </span>
                      <span>{log.message}</span>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: 40, textAlign: 'center', opacity: 0.5 }}>
                    No terminal log data found.
                  </div>
                )}
                <div ref={terminalEndRef} />
              </div>
            </div>
          )}
          <RelatedContent />
        </div>
      </main>
    </div>
  );
}
