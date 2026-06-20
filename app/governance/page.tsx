'use client';

import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RelatedContent from '@/components/ui/RelatedContent';
import { 
  Shield, 
  UserCheck, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Fingerprint, 
  ExternalLink,
  Sparkles,
  Users,
  Check,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { LoadingTable, LoadingButton } from '@/components/ui/LoadingSystem';
import { useAccount } from 'wagmi';
import { useMultiSigRequests, useMultiSigOperations } from '@/hooks/useOnChainData';

export default function GovernancePage() {
  const { address, isConnected } = useAccount();
  const { requests, isLoading, refetch, isDemo } = useMultiSigRequests();
  const { approveAndExecute, setCoSigner } = useMultiSigOperations();

  const [coSignerInput, setCoSignerInput] = useState('');
  const [updatingCoSigner, setUpdatingCoSigner] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Passkey simulated co-signing states
  const [passkeyModalOpen, setPasskeyModalOpen] = useState(false);
  const [passkeyVerifying, setPasskeyVerifying] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<number | null>(null);

  const handleUpdateCoSigner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coSignerInput.startsWith('0x') || coSignerInput.length !== 42) {
      toast.error('Invalid Ethereum address format');
      return;
    }
    setUpdatingCoSigner(true);
    const toastId = toast.loading('Registering Treasury Co-Signer on-chain...');
    try {
      await setCoSigner(coSignerInput);
      toast.success('On-Chain Co-Signer address updated successfully!', { id: toastId });
      setCoSignerInput('');
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Transaction failed', { id: toastId });
    } finally {
      setUpdatingCoSigner(false);
    }
  };

  const startApproval = (requestId: number) => {
    setSelectedRequest(requestId);
    setPasskeyModalOpen(true);
  };

  const handleApproveWithPasskey = async () => {
    if (selectedRequest === null) return;
    setPasskeyVerifying(true);
    
    // Simulating secure browser passkey challenge validation
    await new Promise(resolve => setTimeout(resolve, 1800));
    setPasskeyVerifying(false);
    setPasskeyModalOpen(false);

    const toastId = toast.loading('Co-signing and executing payload on Arc...');
    try {
      await approveAndExecute(selectedRequest);
      toast.success('Transaction co-signed and released successfully!', { id: toastId });
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Execution error', { id: toastId });
    } finally {
      setSelectedRequest(null);
    }
  };

  const pendingRequests = requests.filter(r => !r.executed);
  const executedRequests = requests.filter(r => r.executed);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main" id="main-content">
        <Topbar title="Treasury Governance" />
        <div className="app-content">
          {isDemo && (
            <div style={{
              background: 'rgba(59, 130, 246, 0.05)',
              border: '2px dashed #3B82F6',
              padding: '16px 20px',
              marginBottom: '24px',
              color: 'var(--text-primary)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
              boxShadow: '4px 4px 0px rgba(0,0,0,0.9)',
              fontFamily: 'var(--font-mono)'
            }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3B82F6', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>ℹ️</span> SANDBOX DEMO MODE ACTIVE
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
                  Showing simulated active multi-sig requests. To test a real governance request, submit a payout over $10,000 USDC using the dashboard or smart wallets.
                </div>
              </div>
            </div>
          )}

          {/* Header Banner */}
          <div className="brutalist-hero" style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            border: '2px solid var(--text-primary)',
            background: 'var(--bg-secondary)',
            marginBottom: 'var(--space-2xl)',
            boxShadow: '8px 8px 0px rgba(0,0,0,0.9)'
          }}>
            <div style={{ padding: '24px', borderRight: '2px solid var(--text-primary)' }}>
              <span className="badge badge-red" style={{ marginBottom: 12 }}>Dual-Signature Policy</span>
              <h1 className="brutalist-outline-title" style={{ fontSize: 32, margin: '6px 0', fontWeight: 900 }}>
                MULTI-SIG GOVERNANCE
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: '580px', lineHeight: 1.5 }}>
                Review dual-signature payout requests, register secure co-signers, and authorize payouts exceeding limits using device-bound biometric passkeys.
              </p>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-primary)', gap: 8 }}>
              <div className="badge badge-red" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Users size={12} />
                <span>Threshold: &gt; $10,000 USDC</span>
              </div>
            </div>
          </div>

          {!isConnected ? (
            <div className="card text-center" style={{ padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <Shield size={48} style={{ color: 'var(--ph-red)', opacity: 0.5 }} />
              <h3 style={{ margin: 0 }}>Connect Wallet to Access Governance</h3>
              <p className="text-secondary" style={{ maxWidth: 400, margin: 0, fontSize: 13 }}>
                Review pending payout backlogs, register co-signers, and authenticate passkey confirmations.
              </p>
            </div>
          ) : (
            <div className="grid-3-1" style={{ gap: 'var(--space-lg)' }}>
              {/* Main Backlog */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                
                {/* Pending Approvals Backlog */}
                <div className="card">
                  <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Clock size={18} style={{ color: 'var(--ph-yellow)' }} />
                      <span className="card-title">Pending Approvals Backlog</span>
                    </div>
                    <span className="badge badge-yellow">{pendingRequests.length} Pending</span>
                  </div>

                  <div className="card-body" style={{ padding: 0 }}>
                    {isLoading ? (
                      <div style={{ padding: '24px' }}>
                        <LoadingTable rows={3} cols={5} />
                      </div>
                    ) : pendingRequests.length === 0 ? (
                      <div style={{ padding: 40, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                        <CheckCircle2 size={32} style={{ color: 'var(--ph-green)' }} />
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700 }}>Backlog Fully Cleared</div>
                          <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>No payout requests currently exceed the $10,000 limit.</div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {pendingRequests.map((req, idx) => (
                          <div 
                            key={req.id} 
                            style={{
                              padding: '20px',
                              borderBottom: idx === pendingRequests.length - 1 ? 'none' : '1px solid var(--border-primary)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 12
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <span className="badge badge-red" style={{ fontSize: 10, textTransform: 'uppercase', marginBottom: 6, display: 'inline-block' }}>
                                  {req.category}
                                </span>
                                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                                  ${parseFloat(req.amount).toLocaleString()} USDC
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                  <span>To:</span>
                                  <span style={{ fontFamily: 'var(--font-mono)' }}>{req.to}</span>
                                </div>
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                                <div style={{ display: 'flex', gap: 4 }}>
                                  <span className={`badge ${req.ownerApproved ? 'badge-green' : 'badge-yellow'}`} style={{ fontSize: 10 }}>
                                    Owner: {req.ownerApproved ? 'Approved' : 'Pending'}
                                  </span>
                                  <span className={`badge ${req.coSignerApproved ? 'badge-green' : 'badge-yellow'}`} style={{ fontSize: 10 }}>
                                    Co-Signer: {req.coSignerApproved ? 'Approved' : 'Pending'}
                                  </span>
                                </div>
                                
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => startApproval(req.id)}
                                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: 12 }}
                                >
                                  <Fingerprint size={14} />
                                  Co-Sign & Execute
                                </button>
                              </div>
                            </div>

                            <div style={{
                              background: 'var(--bg-elevated)',
                              padding: '10px 12px',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: 11,
                              color: 'var(--text-secondary)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6
                            }}>
                              <AlertCircle size={14} style={{ color: 'var(--ph-red)', flexShrink: 0 }} />
                              <span>This transfer exceeds limits and was safely detoured to escrow storage. Creator: {req.creator.slice(0, 10)}...</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Execution History */}
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Governance Execution History</span>
                  </div>
                  <div className="card-body" style={{ padding: 0 }}>
                    {executedRequests.length === 0 ? (
                      <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 12 }}>
                        No multi-sig executions recorded.
                      </div>
                    ) : (
                      <div>
                        {executedRequests.map((req, idx) => (
                          <div 
                            key={req.id}
                            style={{
                              padding: '14px 20px',
                              borderBottom: idx === executedRequests.length - 1 ? 'none' : '1px solid var(--border-primary)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: 12
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 700 }}>${parseFloat(req.amount).toLocaleString()} USDC</div>
                              <div style={{ color: 'var(--text-tertiary)', fontSize: 10, fontFamily: 'var(--font-mono)' }}>
                                Recipient: {req.to.slice(0, 8)}...{req.to.slice(-6)}
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <span style={{ color: 'var(--ph-green)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <CheckCircle2 size={14} /> Executed
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Sidebar Config */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                
                {/* Co-Signer Settings */}
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Co-Signer Settings</span>
                  </div>
                  <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                      Designate a secondary agent wallet or multi-sig vault address that is permitted to co-sign high-value payouts.
                    </p>

                    <form onSubmit={handleUpdateCoSigner} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="0x... co-signer address"
                        value={coSignerInput}
                        onChange={(e) => setCoSignerInput(e.target.value)}
                        style={{ fontSize: 12, padding: '8px 12px' }}
                      />
                      <LoadingButton
                        type="submit"
                        variant="primary"
                        isLoading={updatingCoSigner}
                        loadingText="Registering..."
                        style={{ width: '100%', padding: '8px', fontSize: '12px' }}
                      >
                        Register Co-Signer
                      </LoadingButton>
                    </form>
                  </div>
                </div>

                {/* Passkey Governance Info */}
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Passkey Governance</span>
                  </div>
                  <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 12, lineHeight: 1.5 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <Fingerprint size={16} style={{ color: 'var(--ph-red)', marginTop: 2 }} />
                      <div>
                        <strong style={{ display: 'block', marginBottom: 2 }}>Secure Passkeys</strong>
                        Review and authorize payments directly through your device biometric authentication (TouchID/FaceID) mapped to smart contracts.
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Passkey Signature Challenge Modal */}
          <AnimatePresence>
            {passkeyModalOpen && (
              <div className="modal-overlay">
                <motion.div
                  className="modal-content"
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  style={{ maxWidth: 360, textAlign: 'center', padding: '30px 24px' }}
                >
                  <div style={{ display: 'inline-flex', padding: 16, background: 'rgba(245, 78, 0, 0.05)', borderRadius: '50%', marginBottom: 16 }}>
                    <Fingerprint size={36} className={passkeyVerifying ? 'pulse' : ''} style={{ color: 'var(--ph-red)' }} />
                  </div>

                  <h3 style={{ margin: 0, fontSize: 18 }}>Passkey Authentication</h3>
                  <p className="text-secondary" style={{ fontSize: 12, marginTop: 8, marginBottom: 24 }}>
                    Please scan your fingerprint or enter your passcode to authorize transaction ID #{selectedRequest} for release.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <LoadingButton
                      variant="primary"
                      onClick={handleApproveWithPasskey}
                      isLoading={passkeyVerifying}
                      loadingText="Verifying Credentials..."
                      style={{ width: '100%' }}
                    >
                      Scan Passkey
                    </LoadingButton>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setPasskeyModalOpen(false)}
                      disabled={passkeyVerifying}
                      style={{ width: '100%' }}
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
          <RelatedContent />
        </div>
      </main>
    </div>
  );
}
