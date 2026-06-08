'use client';

import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { useState, useMemo } from 'react';
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

export default function PayrollPage() {
  const { address, isConnected } = useAccount();
  const { jobs, isLoading: loadingJobs, refetch: refetchJobs } = usePayrollJobs();
  const { createJob, fundJob, releasePayment, disputeJob } = usePayrollJobOperations();
  const { balance: rawUSDCBalance, refetch: refetchBalance } = useUSDCBalance();
  const { writeContractAsync: approveAsync } = useWriteContract();

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [contractorAddress, setContractorAddress] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Operation Pending State per job
  const [pendingJobId, setPendingJobId] = useState<number | null>(null);

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

    setIsSubmitting(true);
    const toastId = toast.loading('Initiating contractor payroll agreement...');
    try {
      const parsedAmount = parseUnits(paymentAmount, 6);
      await createJob(contractorAddress, parsedAmount);
      toast.success('Agreement created! Proceeding to fund escrow.', { id: toastId });
      setShowCreateModal(false);
      setContractorAddress('');
      setPaymentAmount('');
      refetchJobs();
    } catch (err: any) {
      toast.error(err.message || 'Agreement initialization failed.', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFundEscrow = async (jobId: number, amountRaw: bigint) => {
    setPendingJobId(jobId);
    const toastId = toast.loading('Funding escrow contract...');
    try {
      // Check if allowance is sufficient
      if (allowance === undefined || allowance < amountRaw) {
        toast.loading('Requesting approval for USDC transfers...', { id: toastId });
        await approveAsync({
          address: USDC_ADDRESS,
          abi: USDC_ABI,
          functionName: 'approve',
          args: [PAYROLL_JOB_ADDRESS, amountRaw],
        });
        toast.loading('USDC Approved! Sending escrow deposit...', { id: toastId });
        await new Promise(r => setTimeout(r, 2000));
        refetchAllowance();
      }

      await fundJob(BigInt(jobId));
      toast.success('Escrow funded successfully! Funds locked in job contract.', { id: toastId });
      setTimeout(() => {
        refetchJobs();
        refetchBalance();
        refetchAllowance();
      }, 2000);
    } catch (err: any) {
      toast.error(err.message || 'Escrow funding failed.', { id: toastId });
    } finally {
      setPendingJobId(null);
    }
  };

  const handleReleasePayment = async (jobId: number) => {
    setPendingJobId(jobId);
    const toastId = toast.loading('Releasing escrow payment to contractor...');
    try {
      await releasePayment(BigInt(jobId));
      toast.success('Payroll released! Contractor paid in full.', { id: toastId });
      setTimeout(() => {
        refetchJobs();
        refetchBalance();
      }, 2000);
    } catch (err: any) {
      toast.error(err.message || 'Failed to release escrow payment.', { id: toastId });
    } finally {
      setPendingJobId(null);
    }
  };

  const handleDispute = async (jobId: number) => {
    setPendingJobId(jobId);
    const toastId = toast.loading('Initiating arbitration dispute...');
    try {
      await disputeJob(BigInt(jobId));
      toast.success('Dispute locked. Awaiting arbitration resolution.', { id: toastId });
      refetchJobs();
    } catch (err: any) {
      toast.error(err.message || 'Dispute execution failed.', { id: toastId });
    } finally {
      setPendingJobId(null);
    }
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
      <main className="app-main">
        <Topbar title="Contractor Payroll (ERC-8183)" />
        <div className="app-content">
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

          {/* Agreements Table */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Payroll Escrow Agreements</span>
              <span className="badge badge-secondary">{jobs.length} total</span>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {loadingJobs ? (
                <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
                  <RefreshCw className="spinning" size={24} />
                </div>
              ) : jobs.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table className="table" style={{ width: '100%' }}>
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
                                {job.status === 1 && ( // FUNDED
                                  <>
                                    <button
                                      className="btn btn-success btn-sm"
                                      onClick={() => handleReleasePayment(jobId)}
                                      disabled={pendingJobId === jobId}
                                    >
                                      Approve & Settle
                                    </button>
                                    <button
                                      className="btn btn-secondary btn-sm"
                                      style={{ border: '1px solid var(--ph-red)', color: 'var(--ph-red)' }}
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

          {/* Create Agreement Modal */}
          <AnimatePresence>
            {showCreateModal && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: 16
              }}>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="card" 
                  style={{ width: '100%', maxWidth: '480px', border: '3px solid var(--text-primary)', boxShadow: '8px 8px 0px rgba(0,0,0,0.95)' }}
                >
                  <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--text-primary)' }}>
                    <span className="card-title">Establish Escrow Payroll</span>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: 4 }} 
                      onClick={() => setShowCreateModal(false)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="card-body" style={{ padding: 20 }}>
                    <form onSubmit={handleCreateJob} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
                        <label style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 11,
                        lineHeight: 1.4,
                        color: 'var(--text-secondary)',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                      }}>
                        <strong>Note:</strong> Creating this agreement initializes the escrow contract. You will need to explicitly fund the escrow in the next step to lock the payout funds.
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '12px' }}
                        disabled={isSubmitting}
                      >
                        Submit Agreement
                      </button>
                    </form>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
