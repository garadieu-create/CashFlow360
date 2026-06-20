'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Key, 
  Copy, 
  Check, 
  DollarSign, 
  Terminal, 
  Cpu, 
  HelpCircle,
  Play,
  Activity,
  Layers,
  ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';

export function ApiCredentials() {
  const [copied, setCopied] = useState(false);
  const [revenue, setRevenue] = useState(0.00);
  const [queriesCount, setQueriesCount] = useState(0);
  const [endpoint, setEndpoint] = useState('/api/metrics');

  // Simulation state
  const [simState, setSimState] = useState<'idle' | 'challenging' | 'signing' | 'settled'>('idle');
  const [simLogs, setSimLogs] = useState<string[]>([]);
  const [simResult, setSimResult] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setEndpoint(`${window.location.origin}/api/metrics`);
    }

    const fetchStats = async () => {
      try {
        const res = await fetch('/api/agent');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.settings) {
            setRevenue(data.settings.nanopaymentsRevenue || 0.00);
            setQueriesCount(data.settings.nanopaymentsQueriesCount || 0);
          }
        }
      } catch (err) {
        console.error('Error fetching API metrics stats:', err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(endpoint);
    setCopied(true);
    toast.success('Endpoint URL copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateScorerCall = async () => {
    setSimState('challenging');
    setSimLogs(['[AI Credit Scorer] Dispatching GET request to /api/metrics...']);
    setSimResult(null);

    await new Promise(r => setTimeout(r, 1200));

    try {
      // Step 1: Initial request (should result in 402 challenge)
      const res1 = await fetch('/api/metrics');
      setSimLogs(prev => [
        ...prev, 
        `[Gateway] Status 402 Payment Required: invoice generated.`,
        `[Gateway] Challenge payload received: PAYMENT-REQUIRED headers found.`
      ]);

      if (res1.status === 402) {
        const data1 = await res1.json();
        const paymentRequiredHeader = res1.headers.get('PAYMENT-REQUIRED') || '';

        setSimState('signing');
        setSimLogs(prev => [
          ...prev,
          `[AI Credit Scorer] Requirement: ${data1.requirements[0].maxAmountRequired} atomic USDC to ${data1.requirements[0].payTo.slice(0, 10)}...`,
          `[Agent Wallet] Signing Gateway payment authorization (EIP-3009)...`
        ]);

        await new Promise(r => setTimeout(r, 1500));

        // Step 2: Retry request with signature
        const saved = sessionStorage.getItem('circle_smart_account_session');
        const session = saved ? JSON.parse(saved) : null;
        let signatureStr = '';
        let signerAddress = '';
        if (session && session.ownerPrivateKey) {
          const { privateKeyToAccount } = await import('viem/accounts');
          const ownerAccount = privateKeyToAccount(session.ownerPrivateKey as `0x${string}`);
          signerAddress = ownerAccount.address;
          signatureStr = await ownerAccount.signMessage({
            message: data1.requirements[0].invoiceId
          });
        } else {
          signatureStr = '0x_mock_nanopayment_signature_token';
          signerAddress = '0x0000000000000000000000000000000000000000';
        }

        const realSignature = Buffer.from(JSON.stringify({
          signature: signatureStr,
          signer: signerAddress,
          invoiceId: data1.requirements[0].invoiceId
        })).toString('base64');

        setSimLogs(prev => [
          ...prev,
          `[AI Credit Scorer] Payment token created: ${realSignature.slice(0, 15)}...`,
          `[AI Credit Scorer] Re-dispatching request with payment-signature header...`
        ]);

        await new Promise(r => setTimeout(r, 1200));

        const res2 = await fetch('/api/metrics', {
          headers: {
            'payment-signature': realSignature
          }
        });

        if (res2.ok) {
          const data2 = await res2.json();
          const responseHeader = res2.headers.get('PAYMENT-RESPONSE');

          setSimState('settled');
          setSimLogs(prev => [
            ...prev,
            `[Gateway] Status 200 OK: Nanopayment settled successfully!`,
            `[Gateway] PAYMENT-RESPONSE token: ${responseHeader ? responseHeader.slice(0, 15) : 'N/A'}...`,
            `[AI Credit Scorer] Financial metrics unlocked successfully.`
          ]);
          setSimResult(data2);
          toast.success('Nanopayment settled! Metrics retrieved.');
        } else {
          setSimState('idle');
          setSimLogs(prev => [...prev, `[Error] Failed query with signature: ${res2.statusText}`]);
        }
      } else {
        setSimState('idle');
        setSimLogs(prev => [...prev, `[Error] Expected 402, but received: ${res1.status}`]);
      }
    } catch (err: any) {
      setSimState('idle');
      setSimLogs(prev => [...prev, `[Error] Exception during simulation: ${err.message}`]);
    }
  };

  return (
    <div className="grid-2" style={{ marginBottom: 'var(--space-lg)', gap: 'var(--space-lg)' }}>
      {/* Settings Card */}
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Key size={20} style={{ color: 'var(--ph-red)' }} />
            <span className="card-title">API Monetization Credentials</span>
          </div>
          <span className="badge badge-purple">x402 Active</span>
        </div>

        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Revenue Statistics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12
          }}>
            <div style={{
              background: 'var(--bg-elevated)',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: 4
            }}>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Monetization Revenue
              </span>
              <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--ph-green)', fontFamily: 'var(--font-mono)' }}>
                ${revenue.toFixed(4)} <span style={{ fontSize: 12 }}>USDC</span>
              </span>
            </div>

            <div style={{
              background: 'var(--bg-elevated)',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: 4
            }}>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Paid Queries Served
              </span>
              <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--ph-blue)', fontFamily: 'var(--font-mono)' }}>
                {queriesCount} <span style={{ fontSize: 12 }}>Requests</span>
              </span>
            </div>
          </div>

          {/* Endpoint Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
              x402 Monetized Endpoint URL
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                readOnly
                value={endpoint}
                className="form-control"
                style={{ flex: 1, padding: '8px 12px', fontSize: 12, fontFamily: 'var(--font-mono)', background: 'var(--bg-elevated)' }}
              />
              <button 
                className="btn btn-secondary" 
                style={{ padding: '8px 12px' }}
                onClick={handleCopy}
              >
                {copied ? <Check size={14} style={{ color: 'var(--ph-green)' }} /> : <Copy size={14} />}
              </button>
            </div>
            <p style={{ fontSize: 10, color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
              Exposes real-time cash flow & metrics to external scoring engines. Cost per query: $0.0001 USDC.
            </p>
          </div>

          {/* Developer Call Code snippet */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Integrating in AI Credit Scorers
            </span>
            <div style={{
              background: 'var(--bg-elevated)',
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--text-secondary)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              overflowX: 'auto',
              lineHeight: 1.5,
              marginBottom: 10
            }}>
              {`// Query protected financial metrics
const res = await fetch("${endpoint}", {
  headers: {
    "payment-signature": Buffer.from(JSON.stringify({
      signature: "0x_eip3009_sig...",
      invoiceId: "inv_..."
    })).toString("base64")
  }
});
const metrics = await res.json();`}
            </div>
            
            <a 
              href="/marketplace" 
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', fontSize: 11 }}
            >
              Go to x402 API Marketplace <ArrowRight size={13} />
            </a>
          </div>
        </div>
      </motion.div>

      {/* Simulator Card */}
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Cpu size={20} style={{ color: 'var(--ph-red)' }} />
            <span className="card-title">Nanopayment Flow Simulator</span>
          </div>
          <button
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={handleSimulateScorerCall}
            disabled={simState !== 'idle'}
          >
            <Play size={12} fill="currentColor" /> Run Simulation
          </button>
        </div>

        <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Logs Screen */}
          <div style={{
            background: 'var(--bg-primary)',
            border: '2px solid var(--border-primary)',
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--text-secondary)',
            minHeight: '160px',
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 6
          }}>
            {simLogs.length > 0 ? (
              simLogs.map((log, i) => (
                <div key={i} style={{
                  color: log.includes('Error') ? 'var(--ph-red)' :
                         log.includes('Success') || log.includes('unlocked') ? 'var(--ph-green)' :
                         log.includes('Challenge') || log.includes('402') ? 'var(--ph-yellow)' :
                         'var(--text-secondary)'
                }}>
                  {log}
                </div>
              ))
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', opacity: 0.4, fontSize: 11 }}>
                Click "Run Simulation" to trace the x402 challenge flow
              </div>
            )}
          </div>

          {/* Result Payload */}
          <AnimatePresence>
            {simResult && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  background: 'rgba(16, 185, 129, 0.03)',
                  border: '1px solid var(--ph-green)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  overflowX: 'auto'
                }}
              >
                <div style={{ fontWeight: 800, color: 'var(--ph-green)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Check size={12} /> UNLOCKED METRICS PAYLOAD:
                </div>
                <pre style={{ margin: 0, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                  {JSON.stringify(simResult, null, 2)}
                </pre>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
