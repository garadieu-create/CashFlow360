'use client';

import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import RelatedContent from '@/components/ui/RelatedContent';
import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  UserPlus, 
  DollarSign, 
  ShieldCheck, 
  Send, 
  AlertTriangle, 
  Lock, 
  Calendar, 
  Plus, 
  X,
  Clock,
  CheckCircle2,
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import { 
  useAccount, 
  usePayrollJobs, 
  usePayrollJobOperations, 
  useUSDCBalance, 
  useWriteContract
} from '@/hooks/useOnChainData';
import { useReadContract } from 'wagmi';
import { USDC_ADDRESS } from '@/lib/arc-config';
import { USDC_ABI, PAYROLL_JOB_ADDRESS } from '@/lib/contracts';
import { parseUnits, formatUnits } from 'viem';
import toast from 'react-hot-toast';
import { useModal } from '@/context/ModalContext';
import { ModalPortal, ModalOverlay, Modal, ModalHeader, ModalIcon, ModalBody } from '@/components/ui/modal/ModalBase';
import { LoadingTable, LoadingButton } from '@/components/ui/LoadingSystem';

export default function PayrollPage() {
  const { address, isConnected } = useAccount();
  const { jobs, isLoading: loadingJobs, refetch: refetchJobs, isDemo } = usePayrollJobs();
  const { createJob, fundJob, releasePayment, disputeJob } = usePayrollJobOperations();
  const { balance: rawUSDCBalance, refetch: refetchBalance } = useUSDCBalance();
  const { writeContractAsync: approveAsync } = useWriteContract();
  const { openModal, updateModal, closeModal, triggerGlobalError } = useModal();

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [contractorAddress, setContractorAddress] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Operation Pending State per job
  const [pendingJobId, setPendingJobId] = useState<number | null>(null);

  // Continuous Streaming State
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamRate, setStreamRate] = useState(0.0001); // USDC per second
  const [streamAccumulated, setStreamAccumulated] = useState(0);
  const [streamContractor, setStreamContractor] = useState('0xfb5FEeDA927C63AF2Dd87c81F53eBF6b58512F7b');

  useEffect(() => {
    let interval: any;
    if (isStreaming) {
      interval = setInterval(() => {
        setStreamAccumulated(prev => prev + (streamRate / 10));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isStreaming, streamRate]);

  // Read allowance for Payroll Job contract
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'allowance',
    args: address && PAYROLL_JOB_ADDRESS ? [address, PAYROLL_JOB_ADDRESS] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 5000,
    },
  });

  // Analytics
  const analytics = useMemo(() => {
    let totalEscrowed = 0;
    let totalPaid = 0;
    let activeAgreements = 0;

    jobs.forEach(job => {
      const amt = parseFloat(formatUnits(job.paymentAmount || BigInt(0), 6));
      if (job.status === 1) { // FUNDED
        totalEscrowed += amt;
        activeAgreements++;
      } else if (job.status === 2) { // SETTLED
        totalPaid += amt;
      } else if (job.status === 0) { // CREATED
        activeAgreements++;
      }
    });

    return {
      totalEscrowed,
      totalPaid,
      activeAgreements,
      totalAgreements: jobs.length
    };
  }, [jobs]);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractorAddress || !contractorAddress.startsWith('0x')) {
      toast.error('Please enter a valid contractor wallet address.');
      return;
    }
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error('Please enter a positive payment amount.');
      return;
    }

    setShowCreateModal(false);

    const modalId = openModal({
      type: 'transaction',
      title: 'Initiating Payroll Agreement',
      description: `Initializing contractor payroll agreement of ${paymentAmount} USDC for contractor ${contractorAddress.slice(0, 6)}...${contractorAddress.slice(-4)}.`,
      badge: 'Escrow Initialization',
      txStatus: 'pending',
      txSteps: [{ label: 'Initiating contractor payroll agreement', status: 'pending' }],
      isDismissable: false
    });

    try {
      const parsedAmount = parseUnits(paymentAmount, 6);
      await createJob(contractorAddress, parsedAmount);

      updateModal(modalId, {
        type: 'success',
        txStatus: 'success',
        title: 'Agreement Created',
        description: `Contractor agreement created successfully! Proceed to fund the escrow to secure funds.`,
        badge: 'Agreement Initialized',
        txSteps: [{ label: 'Initiating contractor payroll agreement', status: 'success' }],
        isDismissable: true,
        buttons: [{ label: 'Close', variant: 'secondary', closeModalAfterClick: true }]
      });

      setContractorAddress('');
      setPaymentAmount('');
      refetchJobs();
    } catch (err: any) {
      closeModal(modalId);
      triggerGlobalError(err);
    }
  };

  const handleFundEscrow = async (jobId: number, amountRaw: bigint) => {
    const amountFormatted = formatUnits(amountRaw, 6);
    const modalId = openModal({
      type: 'transaction',
      title: 'Fund Escrow Contract',
      description: `Funding escrow #${jobId} with ${amountFormatted} USDC to lock payments.`,
      badge: 'Escrow Deposit',
      txStatus: 'pending',
      txSteps: [
        { label: 'Checking and requesting USDC allowance', status: 'pending' },
        { label: 'Sending escrow deposit transaction', status: 'idle' }
      ],
      isDismissable: false
    });

    try {
      // Check if allowance is sufficient
      if (allowance === undefined || allowance < amountRaw) {
        updateModal(modalId, {
          txSteps: [
            { label: 'Requesting USDC approval in wallet', status: 'pending' },
            { label: 'Sending escrow deposit transaction', status: 'idle' }
          ]
        });

        await approveAsync({
          address: USDC_ADDRESS,
          abi: USDC_ABI,
          functionName: 'approve',
          args: [PAYROLL_JOB_ADDRESS, amountRaw],
        });

        updateModal(modalId, {
          txSteps: [
            { label: 'USDC approved and allowance set', status: 'success' },
            { label: 'Sending escrow deposit transaction', status: 'pending' }
          ]
        });

        await new Promise(r => setTimeout(r, 2000));
        refetchAllowance();
      } else {
        updateModal(modalId, {
          txSteps: [
            { label: 'USDC allowance already sufficient', status: 'success' },
            { label: 'Sending escrow deposit transaction', status: 'pending' }
          ]
        });
      }

      await fundJob(BigInt(jobId));

      updateModal(modalId, {
        type: 'success',
        txStatus: 'success',
        title: 'Escrow Funded Successfully',
        description: `Escrow for job #${jobId} funded successfully! Funds are now locked.`,
        badge: 'Secure Escrow Locked',
        txSteps: [
          { label: 'USDC approved and allowance set', status: 'success' },
          { label: 'Escrow funded on-chain', status: 'success' }
        ],
        isDismissable: true,
        buttons: [{ label: 'Close', variant: 'secondary', closeModalAfterClick: true }]
      });

      setTimeout(() => {
        refetchJobs();
        refetchBalance();
        refetchAllowance();
      }, 1000);
    } catch (err: any) {
      closeModal(modalId);
      triggerGlobalError(err);
    }
  };

  const handleReleasePayment = (jobId: number, amount: string, contractor: string) => {
    openModal({
      type: 'confirm',
      title: 'Release Escrow Payment?',
      description: `Are you sure you want to release ${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} USDC to contractor ${contractor}? This will immediately transfer locked funds. This action is irreversible.`,
      badge: 'Escrow Finalization',
      buttons: [
        {
          label: 'Cancel',
          variant: 'secondary',
          closeModalAfterClick: true
        },
        {
          label: 'Release Funds',
          variant: 'primary',
          closeModalAfterClick: true,
          onClick: async () => {
            const modalId = openModal({
              type: 'transaction',
              title: 'Releasing Escrow Payout',
              description: `Releasing payment of ${amount} USDC to contractor.`,
              badge: 'Treasury Outflow',
              txStatus: 'pending',
              txSteps: [{ label: 'Releasing escrow payment to contractor', status: 'pending' }],
              isDismissable: false
            });

            try {
              await releasePayment(BigInt(jobId));
              updateModal(modalId, {
                type: 'success',
                txStatus: 'success',
                title: 'Payroll Released',
                description: `Successfully released ${amount} USDC. Contractor paid in full.`,
                badge: 'Escrow Settled',
                txSteps: [{ label: 'Releasing escrow payment to contractor', status: 'success' }],
                isDismissable: true,
                buttons: [{ label: 'Close', variant: 'secondary', closeModalAfterClick: true }]
              });
              setTimeout(() => {
                refetchJobs();
                refetchBalance();
              }, 1000);
            } catch (err: any) {
              closeModal(modalId);
              triggerGlobalError(err);
            }
          }
        }
      ]
    });
  };

  const handleDispute = (jobId: number) => {
    openModal({
      type: 'destructive',
      title: 'Initiate Arbitration Dispute?',
      description: `Are you sure you want to flag job #${jobId} as disputed? This will lock all escrowed funds and prevent any payouts until resolved.`,
      badge: 'Arbitration Gate',
      buttons: [
        {
          label: 'Cancel',
          variant: 'secondary',
          closeModalAfterClick: true
        },
        {
          label: 'Initiate Dispute',
          variant: 'danger',
          closeModalAfterClick: true,
          onClick: async () => {
            const modalId = openModal({
              type: 'transaction',
              title: 'Initiating Arbitration Dispute',
              description: `Locking escrowed funds for job #${jobId} into dispute status.`,
              badge: 'Protocol Lock',
              txStatus: 'pending',
              txSteps: [{ label: 'Initiating arbitration lock', status: 'pending' }],
              isDismissable: false
            });

            try {
              await disputeJob(BigInt(jobId));
              updateModal(modalId, {
                type: 'success',
                txStatus: 'success',
                title: 'Arbitration Locked',
                description: `Dispute locked successfully. Escrow funds are locked pending arbitrator decision.`,
                badge: 'Dispute Locked',
                txSteps: [{ label: 'Initiating arbitration lock', status: 'success' }],
                isDismissable: true,
                buttons: [{ label: 'Close', variant: 'secondary', closeModalAfterClick: true }]
              });
              refetchJobs();
            } catch (err: any) {
              closeModal(modalId);
              triggerGlobalError(err);
            }
          }
        }
      ]
    });
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return <span className="badge badge-yellow" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Clock size={11} /> Funding Pending</span>;
      case 1:
        return <span className="badge badge-blue" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Lock size={11} /> Escrow Active</span>;
      case 2:
        return <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={11} /> Settled</span>;
      case 3:
        return <span className="badge badge-red" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><AlertTriangle size={11} /> Disputed</span>;
      default:
        return <span className="badge badge-secondary">Unknown</span>;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main" id="main-content">
        <Topbar title="Contractor Payroll (ERC-8183)" />
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
                  Showing simulated active payroll agreements and streams. To configure a real payroll agreement, deploy a contractor escrow job to Arc using the dashboard or smart wallets.
                </div>
              </div>
            </div>
          )}

          <div className="brutalist-hero" style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            border: '2px solid var(--text-primary)',
            background: 'var(--bg-secondary)',
            marginBottom: 'var(--space-2xl)',
            boxShadow: '8px 8px 0px rgba(0,0,0,0.9)'
          }}>
            <div style={{ padding: '24px', borderRight: '2px solid var(--text-primary)' }}>
              <span className="badge badge-purple" style={{ marginBottom: 12 }}>ERC-8183 Job Protocol</span>
              <h1 className="brutalist-outline-title" style={{ fontSize: 36, margin: '6px 0', fontWeight: 900 }}>
                ESCROW PAYROLL
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: '580px', lineHeight: 1.5 }}>
                Enforce milestone payroll safety by locking USDC funds into standardized Job Escrows. Release payments autonomously upon verification, or flag disputes for arbitration.
              </p>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-primary)' }}>
              <button 
                className="btn btn-primary btn-lg" 
                style={{ width: '100%', gap: 8 }}
                onClick={() => setShowCreateModal(true)}
              >
                <Plus size={16} /> New Payroll Agreement
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid-3" style={{ marginBottom: 'var(--space-xl)' }}>
            <div className="card">
              <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ background: 'rgba(245, 78, 0, 0.1)', padding: 12, borderRadius: 'var(--radius-md)', color: 'var(--ph-red)' }}>
                  <FileText size={24} />
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                    {analytics.totalAgreements}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Total Agreements
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: 12, borderRadius: 'var(--radius-md)', color: 'var(--ph-blue)' }}>
                  <Lock size={24} />
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--ph-blue)' }}>
                    ${analytics.totalEscrowed.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Active Escrowed USDC
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: 12, borderRadius: 'var(--radius-md)', color: 'var(--ph-green)' }}>
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--ph-green)' }}>
                    ${analytics.totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Settled Payroll
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Payroll Escrow Agreements</span>
              <span className="badge badge-secondary">{jobs.length} total</span>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {loadingJobs ? (
                <div style={{ padding: '24px' }}>
                  <LoadingTable rows={4} cols={6} />
                </div>
              ) : jobs.length > 0 ? (
                <div className="table-container">
                  <table className="table data-table" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th>Job ID</th>
                        <th>Client</th>
                        <th>Contractor</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.map((job) => {
                        const jobId = Number(job.id);
                        const paymentFormatted = formatUnits(job.paymentAmount || BigInt(0), 6);
                        
                        return (
                          <tr key={jobId}>
                            <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>#{jobId}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                              {job.client.slice(0, 6)}...{job.client.slice(-4)}
                            </td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                              {job.contractor.slice(0, 6)}...{job.contractor.slice(-4)}
                            </td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                              {parseFloat(paymentFormatted).toLocaleString(undefined, { minimumFractionDigits: 2 })} USDC
                            </td>
                            <td>{getStatusBadge(job.status)}</td>
                            <td style={{ fontSize: 12 }}>
                              {new Date(Number(job.createdAt) * 1000).toLocaleDateString()}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                {job.status === 0 && ( // CREATED
                                  <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => handleFundEscrow(jobId, job.paymentAmount)}
                                    disabled={pendingJobId === jobId}
                                  >
                                    Fund Escrow
                                  </button>
                                )}
                                  {job.status === 1 && address && job.client.toLowerCase() === address.toLowerCase() && ( // FUNDED & CLIENT
                                    <>
                                      <button
                                        className="btn btn-success btn-sm"
                                        onClick={() => handleReleasePayment(jobId, paymentFormatted, job.contractor)}
                                        disabled={pendingJobId === jobId}
                                      >
                                        Release
                                      </button>
                                      <button
                                        className="btn btn-red btn-sm"
                                        onClick={() => handleDispute(jobId)}
                                        disabled={pendingJobId === jobId}
                                      >
                                        Dispute
                                      </button>
                                    </>
                                  )}
                                {job.status === 2 && (
                                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Payout Released</span>
                                )}
                                {job.status === 3 && (
                                  <span style={{ fontSize: 12, color: 'var(--ph-red)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <AlertTriangle size={12} /> Pending Arbitration
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '60px 0', textAlign: 'center', opacity: 0.5 }}>
                  <FileText size={48} style={{ margin: '0 auto 12px' }} />
                  <div style={{ fontSize: 14, fontWeight: 600 }}>No agreements found</div>
                  <div style={{ fontSize: 12 }}>Create a job to establish an escrow payroll.</div>
                </div>
              )}
            </div>
          </div>

          {/* Continuous Wage Streaming Card */}
          <div className="card" style={{ marginTop: '24px', border: '2px solid var(--text-primary)', boxShadow: '8px 8px 0px rgba(0,0,0,0.9)' }}>
            <div className="card-header" style={{ borderBottom: '2px solid var(--text-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={18} style={{ color: 'var(--ph-green)' }} />
                <span className="card-title">Continuous Wage Streaming Portal</span>
              </div>
              <span className={`badge ${isStreaming ? 'badge-green' : 'badge-secondary'}`}>
                {isStreaming ? 'STREAM ACTIVE' : 'STREAM IDLE'}
              </span>
            </div>
            <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', padding: '20px' }}>
              
              {/* Left Column: Ticker & Visual stream */}
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 8, padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '220px' }}>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                  Accumulated Streamed Payroll
                </span>
                <div style={{ fontSize: 32, fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--ph-green)', marginBottom: 16 }}>
                  ${streamAccumulated.toFixed(6)} <span style={{ fontSize: 16 }}>USDC</span>
                </div>
                
                {/* Visual arrow flow animation */}
                <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', background: 'var(--bg-primary)', borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Corporate Vault</span>
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', margin: '0 12px' }}>
                    <div style={{ width: '100%', height: '2px', background: isStreaming ? 'var(--ph-green)' : 'var(--border-primary)' }} />
                    {isStreaming && (
                      <motion.div 
                        animate={{ x: [-30, 30] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                        style={{ position: 'absolute', width: 6, height: 6, borderRadius: '50%', background: 'var(--ph-green)' }}
                      />
                    )}
                  </div>
                  <span style={{ color: 'var(--ph-blue)' }}>
                    {streamContractor.slice(0, 6)}...{streamContractor.slice(-4)}
                  </span>
                </div>
              </div>

              {/* Right Column: Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                    Recipient Contractor Wallet
                  </label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={streamContractor}
                    onChange={(e) => setStreamContractor(e.target.value)}
                    placeholder="0x..."
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                    <span>Streaming rate</span>
                    <span style={{ color: 'var(--ph-green)', fontFamily: 'var(--font-mono)' }}>{(streamRate * 60).toFixed(4)} USDC/min</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.00001" 
                    max="0.001" 
                    step="0.00001"
                    value={streamRate}
                    onChange={(e) => setStreamRate(parseFloat(e.target.value))}
                    style={{ cursor: 'pointer', accentColor: 'var(--ph-green)' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                  <button 
                    className={`btn ${isStreaming ? 'btn-secondary' : 'btn-primary'}`} 
                    style={{ flex: 1, padding: 12 }}
                    onClick={() => {
                      setIsStreaming(!isStreaming);
                      if (!isStreaming) {
                        toast.success('Continuous wage stream initiated!');
                      } else {
                        toast('Wage stream paused.');
                      }
                    }}
                  >
                    {isStreaming ? 'Pause Wage Stream' : 'Initiate Wage Stream'}
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: 12 }}
                    onClick={() => {
                      setStreamAccumulated(0);
                      toast('Stream accumulated reset.');
                    }}
                  >
                    Reset Accumulator
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Create Agreement Modal */}
          <ModalPortal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
            <ModalOverlay onClose={() => setShowCreateModal(false)}>
              <Modal type="confirm" onClose={() => setShowCreateModal(false)} maxWidth="480px">
                <div style={{ padding: '24px' }}>
                  <ModalHeader>
                    <ModalIcon type="confirm" />
                    <div>
                      <span className="badge badge-purple" style={{ fontSize: '9px', marginBottom: 4, letterSpacing: '0.04em' }}>
                        ERC-8183 PROTOCOL
                      </span>
                      <h3 style={{ fontSize: 16, fontWeight: 800, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                        Establish Escrow Payroll
                      </h3>
                    </div>
                  </ModalHeader>
                  <ModalBody>
                    <form onSubmit={handleCreateJob} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)' }}>
                          Contractor Wallet Address
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="0x..."
                          className="form-control"
                          value={contractorAddress}
                          onChange={(e) => setContractorAddress(e.target.value)}
                          style={{ fontFamily: 'var(--font-mono)' }}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)' }}>
                          Payroll Payout Amount (USDC)
                        </label>
                        <input
                          type="number"
                          required
                          step="0.01"
                          placeholder="0.00"
                          className="form-control"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                        />
                      </div>

                      <div style={{
                        background: 'var(--bg-elevated)',
                        padding: '12px',
                        fontSize: 11,
                        lineHeight: 1.4,
                        color: 'var(--text-secondary)',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                      }}>
                        <strong>Note:</strong> Creating this agreement initializes the escrow contract. You will need to explicitly fund the escrow in the next step to lock the payout funds.
                      </div>

                      <LoadingButton
                        type="submit"
                        variant="primary"
                        isLoading={isSubmitting}
                        loadingText="Establishing Escrow..."
                        style={{ width: '100%', padding: '12px' }}
                      >
                        Submit Agreement
                      </LoadingButton>
                    </form>
                  </ModalBody>
                </div>
              </Modal>
            </ModalOverlay>
          </ModalPortal>
          <RelatedContent />
        </div>
      </main>
    </div>
  );
}
