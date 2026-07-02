'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, 
  Shield, 
  Settings, 
  Clock, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink,
  Zap,
  Mail,
  Lock
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AgentSettingsData {
  runwayThresholdDays: number;
  agentWalletAddress: string;
  spendingLimitDaily: number;
  targetVaultAddress: string;
  mode: string;
  isAuthenticated: boolean;
  registeredOnChain?: boolean;
  reputationScore?: number;
  registryTx?: string;
  agentType?: string;
}

interface LogEntry {
  timestamp: number;
  message: string;
  level: string;
}

export function AgentSettings() {
  const [settings, setSettings] = useState<AgentSettingsData>({
    runwayThresholdDays: 30,
    agentWalletAddress: '0xfb5FEeDA927C63AF2Dd87c81F53eBF6b58512F7b',
    spendingLimitDaily: 5000,
    targetVaultAddress: '',
    mode: 'live',
    isAuthenticated: false,
    registeredOnChain: false,
    reputationScore: 0,
    registryTx: '',
    agentType: 'Treasury Manager'
  });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // OTP verification states
  const [email, setEmail] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [authenticating, setAuthenticating] = useState(false);
  const [requestId, setRequestId] = useState('');

  const fetchAgentData = async () => {
    try {
      const res = await fetch('/api/agent');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSettings(data.settings);
          setLogs(data.logs);
        }
      }
    } catch (err) {
      console.error('Failed to fetch agent details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentData();
    const interval = setInterval(fetchAgentData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const toastId = toast.loading('Saving Treasury Agent policies...');
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        toast.success('Agent policies and spending limits updated successfully!', { id: toastId });
        fetchAgentData();
      } else {
        toast.error('Failed to update agent policies.', { id: toastId });
      }
    } catch (err) {
      toast.error('Connection error occurred.', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const handleSendOtp = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    setAuthenticating(true);
    const toastId = toast.loading('Requesting Circle Agent Stack OTP...');
    try {
      const res = await fetch('/api/agent/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'init', email })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRequestId(data.requestId);
        setShowOtp(true);
        toast.success('Verification code dispatched to email!', { id: toastId });
      } else {
        toast.error(data.error || 'Error dispatching verification code', { id: toastId });
      }
    } catch (err: any) {
      toast.error(`Connection error: ${err.message}`, { id: toastId });
    } finally {
      setAuthenticating(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length < 6) {
      toast.error('Enter 6-digit verification code');
      return;
    }
    setAuthenticating(true);
    const toastId = toast.loading('Establishing secure Agent Session...');
    try {
      const res = await fetch('/api/agent/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', requestId, otp: otpCode })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Agent Stack authenticated successfully!', { id: toastId });
        setShowOtp(false);
        setSettings(prev => ({ ...prev, isAuthenticated: true }));
        fetchAgentData();
      } else {
        toast.error(data.error || 'Failed to establish session', { id: toastId });
      }
    } catch (err: any) {
      toast.error(`Connection error: ${err.message}`, { id: toastId });
    } finally {
      setAuthenticating(false);
    }
  };

  const triggerLiveReplenish = async () => {
    const toastId = toast.loading('Manually triggering agent runway analysis...');
    try {
      const res = await fetch('/api/swarm/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggerRebalance: true })
      });
      if (res.ok) {
        toast.success('Agent replenishment cycle executed successfully!', { id: toastId });
        fetchAgentData();
      } else {
        const data = await res.json();
        toast.error(`Execution error: ${data.error || 'Unknown error'}`, { id: toastId });
      }
    } catch (err: any) {
      toast.error(`Connection error: ${err.message}`, { id: toastId });
    }
  };

  return (
    <div className="grid-2" style={{ marginBottom: 'var(--space-lg)', gap: 'var(--space-lg)' }}>
      {/* Policy Card */}
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Cpu size={20} style={{ color: 'var(--ph-red)' }} />
            <span className="card-title">Autonomous Treasury Agent</span>
          </div>
          <span className={`badge ${settings.isAuthenticated ? 'badge-green' : 'badge-yellow'}`}>
            {settings.isAuthenticated ? 'Agent Active' : 'Requires Login'}
          </span>
        </div>

        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Status Block */}
          <div style={{
            background: 'var(--bg-elevated)',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}>
            {settings.registeredOnChain && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: 'rgba(59, 130, 246, 0.06)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: 4
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={13} style={{ color: 'var(--ph-blue)' }} />
                  <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--ph-blue)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    ERC-8004 Registered Badge
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Reputation:</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--ph-green)' }}>{settings.reputationScore}%</span>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Agent Wallet Address</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>
                {settings.agentWalletAddress.slice(0, 6)}...{settings.agentWalletAddress.slice(-4)}
              </span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Spending Policy (Daily Limit)</span>
              <span style={{ fontWeight: 700, color: 'var(--ph-green)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Shield size={13} /> ${settings.spendingLimitDaily.toLocaleString()} USDC
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Allowed Outflow Destination</span>
              <span style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={13} style={{ color: 'var(--ph-green)' }} /> CashFlowVault
              </span>
            </div>

            {settings.registeredOnChain && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: 10 }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>ERC-8004 Registry Tx</span>
                <a 
                  href={`https://testnet.arcscan.app/tx/${settings.registryTx}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 11, color: 'var(--ph-blue)', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  View on Arcscan <ExternalLink size={10} />
                </a>
              </div>
            )}
          </div>

          {/* Form Settings */}
          <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ display: 'flex', alignItems: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                Runway Alert Threshold (Days)
                <span className="tooltip-container">
                  <span className="tooltip-trigger">?</span>
                  <span className="tooltip-content">
                    The minimum runway days before triggering security alerts and automated bridging mechanisms.
                  </span>
                </span>
              </label>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <input
                  type="range"
                  min="10"
                  max="90"
                  step="5"
                  value={settings.runwayThresholdDays}
                  onChange={(e) => setSettings({ ...settings, runwayThresholdDays: parseInt(e.target.value) })}
                  style={{ flex: 1, accentColor: 'var(--ph-red)' }}
                />
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, minWidth: 60, textAlign: 'right' }}>
                  {settings.runwayThresholdDays} Days
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ display: 'flex', alignItems: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Daily Spend Limit (USDC)
                  <span className="tooltip-container">
                    <span className="tooltip-trigger">?</span>
                    <span className="tooltip-content">
                      The maximum value of transaction volume the autonomous agent can execute per day.
                    </span>
                  </span>
                </label>
                <input
                  type="number"
                  className="input input-mono"
                  placeholder="0.00 (e.g. 5000.00)"
                  style={{ fontSize: 13 }}
                  value={settings.spendingLimitDaily}
                  onChange={(e) => setSettings({ ...settings, spendingLimitDaily: parseFloat(e.target.value) })}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ display: 'flex', alignItems: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Agent Mode
                  <span className="tooltip-container">
                    <span className="tooltip-trigger">?</span>
                    <span className="tooltip-content">
                      Simulation mode runs client-side modeling; Live mode routes actual USDC transfers via the Circle CLI agent wallet.
                    </span>
                  </span>
                </label>
                <select
                  className="input input-mono"
                  style={{ 
                    fontSize: 13, 
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '16px',
                    paddingRight: '40px'
                  }}
                  value={settings.mode}
                  onChange={(e) => setSettings({ ...settings, mode: e.target.value })}
                >
                  <option value="simulation">Simulation</option>
                  <option value="live">Live (Circle CLI)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ flex: 1, padding: '10px' }}
                disabled={saving}
              >
                Save Policies
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={triggerLiveReplenish}
                style={{ padding: '10px 14px' }}
              >
                <Zap size={14} fill="currentColor" />
              </button>
            </div>
          </form>

          {/* Authentication Panel */}
          {!settings.isAuthenticated && (
            <div style={{
              border: '2px dashed var(--border-primary)',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(245, 78, 0, 0.02)',
              marginTop: 12
            }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 12 }}>
                <Lock size={16} style={{ color: 'var(--ph-red)', marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Authenticate Agent Wallet</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Sign in with email OTP to permit the autonomous CCTP rebalancing logic.</div>
                </div>
              </div>

              {!showOtp ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
                  <label style={{ display: 'flex', alignItems: 'center', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Agent Email Address
                    <span className="tooltip-container">
                      <span className="tooltip-trigger">?</span>
                      <span className="tooltip-content">
                        Enter the registered email associated with your Circle agent wallet.
                      </span>
                    </span>
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="email"
                      placeholder="agent-email@domain.com (e.g. dev-agent@company.com)"
                      className="input input-mono"
                      style={{ flex: 1, fontSize: 12 }}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <button 
                      type="button" 
                      className="btn btn-primary btn-sm"
                      onClick={handleSendOtp}
                      disabled={authenticating}
                    >
                      Request OTP
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
                  <label style={{ display: 'flex', alignItems: 'center', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Verification Code (OTP)
                    <span className="tooltip-container">
                      <span className="tooltip-trigger">?</span>
                      <span className="tooltip-content">
                        Enter the 6-digit confirmation code sent to your email inbox.
                      </span>
                    </span>
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="123456 (6-digit OTP)"
                      className="input input-mono"
                      style={{ flex: 1, fontSize: 12, textAlign: 'center', letterSpacing: '0.2em' }}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                    />
                    <button 
                      type="button" 
                      className="btn btn-primary btn-sm"
                      onClick={handleVerifyOtp}
                      disabled={authenticating}
                    >
                      Verify & Mount
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Logs Card */}
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={20} style={{ color: 'var(--ph-red)' }} />
            <span className="card-title">Agent Execution Stream</span>
          </div>
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
            POLLING LIVE
          </span>
        </div>

        <div className="card-body" style={{ flex: 1, overflowY: 'auto', maxHeight: 380, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {logs.length > 0 ? (
            logs.map((log, index) => (
              <div 
                key={index} 
                style={{
                  padding: '10px 12px',
                  background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-sm)',
                  borderLeft: `3px solid ${
                    log.level === 'SUCCESS' ? 'var(--ph-green)' :
                    log.level === 'TRIGGER' ? 'var(--ph-yellow)' :
                    log.level === 'ERROR' ? 'var(--ph-red)' :
                    'var(--border-primary)'
                  }`,
                  fontSize: 11,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.6, fontSize: 9, fontFamily: 'var(--font-mono)' }}>
                  <span>{log.level}</span>
                  <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
                <div style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {log.message}
                </div>
              </div>
            ))
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              padding: '40px 0',
              opacity: 0.5,
              gap: 8
            }}>
              <RefreshCw className="spinning" size={24} />
              <div style={{ fontSize: 12 }}>Awaiting autonomous execution logs...</div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
