'use client';

import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { motion } from 'framer-motion';
import { useModal } from '@/context/ModalContext';
import { 
  HelpCircle, 
  Loader2, 
  CheckCircle2, 
  AlertOctagon, 
  AlertTriangle, 
  Layers, 
  Network,
  Settings,
  Code,
  ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useState } from 'react';

export default function ModalsShowcasePage() {
  const { openModal, closeModal, updateActiveModal, triggerGlobalError, activeModal } = useModal();
  const [simulatedTxStatus, setSimulatedTxStatus] = useState<string>('idle');

  // Trigger Confirmation Modal
  const handleConfirm = () => {
    openModal({
      type: 'confirm',
      title: 'Disconnect SME Treasury Wallet?',
      description: 'You are about to disconnect your corporate Metamask wallet from the Arc blockchain. This will clear temporary caching and suspend real-time inflow/outflow notifications.',
      badge: 'Security Alert',
      isDismissable: true,
      buttons: [
        {
          label: 'Cancel Connection Cut',
          variant: 'secondary',
          closeModalAfterClick: true
        },
        {
          label: 'Disconnect Wallet',
          variant: 'danger',
          onClick: () => {
            toast.success('Wallet disconnected safely.');
          },
          closeModalAfterClick: true
        }
      ]
    });
  };

  // Trigger Loading / Progress Modal
  const handleLoadingProgress = () => {
    const modalId = openModal({
      type: 'loading',
      title: 'Compiling Treasury Analytics...',
      description: 'Analyzing 2,400+ on-chain USDC transfer events to calculate average monthly cash flow burn. Please do not close this window.',
      badge: 'Calculating',
      progress: 0,
      isDismissable: false // Lock interaction to avoid spam
    });

    // Animate progress bar incrementally
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 10;
      updateActiveModal({ progress: currentProgress });

      if (currentProgress >= 100) {
        clearInterval(interval);
        // Transition to Success Modal
        updateActiveModal({
          type: 'success',
          title: 'Analytics Compiled Successfully!',
          description: 'Calculations complete. Average monthly outflow settled at $14,284 USDC. All metrics are now mapped on your cash runway dashboards.',
          badge: 'Success',
          progress: undefined,
          isDismissable: true,
          buttons: [
            {
              label: 'View Runway Impact',
              variant: 'primary',
              closeModalAfterClick: true
            }
          ]
        });
      }
    }, 400);
  };

  // Trigger Success Modal
  const handleSuccess = () => {
    openModal({
      type: 'success',
      title: 'Vendor Invoice Paid Successfully',
      description: 'Transaction settled on Arc Testnet. 150.00 USDC has been sent to vendors.eth with sub-second EVM finality.',
      badge: 'Payment Cleared',
      isDismissable: true,
      buttons: [
        {
          label: 'Done',
          variant: 'secondary',
          closeModalAfterClick: true
        },
        {
          label: 'Send Another Payment',
          variant: 'primary',
          closeModalAfterClick: true
        }
      ]
    });
  };

  // Trigger Error with Retry action
  const handleErrorRetry = () => {
    const retryFunction = () => {
      toast.loading('Retrying secure calculation...', { id: 'retry-toast' });
      setTimeout(() => {
        toast.success('Calculations recovered!', { id: 'retry-toast' });
      }, 1000);
    };

    openModal({
      type: 'error',
      title: 'Smart Contract Execution Reverted',
      description: 'The transaction was reverted because the requested burn amount exceeds your pre-approved ERC-20 allowances. Please adjust your key limits or retry.',
      badge: 'Transaction Reverted',
      errorCode: 'ALLOWANCE_EXCEEDED',
      isDismissable: true,
      retryAction: retryFunction,
      buttons: [
        {
          label: 'Cancel Trade',
          variant: 'secondary',
          closeModalAfterClick: true
        },
        {
          label: 'Retry allowance verification',
          variant: 'primary',
          onClick: retryFunction,
          closeModalAfterClick: true
        }
      ]
    });
  };

  // Trigger Warning Modal
  const handleWarning = () => {
    openModal({
      type: 'warning',
      title: 'Critical Scenario Simulation Warning',
      description: 'You are adjusting the scenario runway slider to a 75% monthly revenue loss. This puts your estimated cash runway at risk, falling below our standard 90-day security margin.',
      badge: 'Runway Hazard',
      isDismissable: true,
      buttons: [
        {
          label: 'Review Safe Parameters',
          variant: 'secondary',
          closeModalAfterClick: true
        },
        {
          label: 'Acknowledge Risk & Simulate',
          variant: 'danger',
          onClick: () => {
            toast.success('Simulation constraints adjusted.');
          },
          closeModalAfterClick: true
        }
      ]
    });
  };

  // Trigger Multi-step Blockchain Transaction Modal
  const handleBlockchainTx = async () => {
    const initialSteps = [
      { label: 'Request ERC-20 spending approval', status: 'pending' as const },
      { label: 'Burn USDC on Ethereum Sepolia', status: 'idle' as const },
      { label: 'Pinging Circle Attestation consensus signature', status: 'idle' as const },
      { label: 'Mint 1:1 USDC on Arc Testnet', status: 'idle' as const }
    ];

    const modalId = openModal({
      type: 'transaction',
      title: 'Circle CCTP Cross-Chain Bridge',
      description: 'Transferring 500 USDC from Base Sepolia to Arc Testnet. Native USDC is burned on source and minted 1:1 on target.',
      badge: 'Bridging Tokens',
      txStatus: 'pending',
      txSteps: initialSteps,
      txHash: '0x32cfbe7591f68cfb967a1293e3ead9e347bbae978aea79858ed8...',
      explorerUrl: 'https://testnet.arcscan.app',
      isDismissable: false
    });

    // Step 1 Complete -> Step 2 Pending
    await new Promise(resolve => setTimeout(resolve, 2000));
    updateActiveModal({
      txSteps: [
        { label: 'Request ERC-20 spending approval', status: 'success' },
        { label: 'Burn USDC on Ethereum Sepolia', status: 'pending' },
        { label: 'Pinging Circle Attestation consensus signature', status: 'idle' },
        { label: 'Mint 1:1 USDC on Arc Testnet', status: 'idle' }
      ]
    });

    // Step 2 Complete -> Step 3 Pending
    await new Promise(resolve => setTimeout(resolve, 2500));
    updateActiveModal({
      txSteps: [
        { label: 'Request ERC-20 spending approval', status: 'success' },
        { label: 'Burn USDC on Ethereum Sepolia', status: 'success' },
        { label: 'Pinging Circle Attestation consensus signature', status: 'pending' },
        { label: 'Mint 1:1 USDC on Arc Testnet', status: 'idle' }
      ]
    });

    // Step 3 Complete -> Step 4 Pending
    await new Promise(resolve => setTimeout(resolve, 3000));
    updateActiveModal({
      txSteps: [
        { label: 'Request ERC-20 spending approval', status: 'success' },
        { label: 'Burn USDC on Ethereum Sepolia', status: 'success' },
        { label: 'Pinging Circle Attestation consensus signature', status: 'success' },
        { label: 'Mint 1:1 USDC on Arc Testnet', status: 'pending' }
      ]
    });

    // Step 4 Complete -> Bridge Success
    await new Promise(resolve => setTimeout(resolve, 2000));
    updateActiveModal({
      txStatus: 'success',
      description: 'Transfer complete! 500 USDC successfully minted on Arc Testnet with sub-second deterministic consensus.',
      txSteps: [
        { label: 'Request ERC-20 spending approval', status: 'success' },
        { label: 'Burn USDC on Ethereum Sepolia', status: 'success' },
        { label: 'Pinging Circle Attestation consensus signature', status: 'success' },
        { label: 'Mint 1:1 USDC on Arc Testnet', status: 'success' }
      ],
      isDismissable: true,
      buttons: [
        {
          label: 'Done',
          variant: 'secondary',
          closeModalAfterClick: true
        },
        {
          label: 'View Wallet Radar',
          variant: 'primary',
          closeModalAfterClick: true
        }
      ]
    });
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <Topbar title="Modal System Showcase" />
        <div className="app-content">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            
            {/* Header */}
            <div className="page-header">
              <div>
                <h1 className="page-title">Interaction & Modal Architecture</h1>
                <p className="page-subtitle">
                  State-driven components built on React Context, Framer Motion, and accessible focus rules
                </p>
              </div>
            </div>

            {/* Live Interactive Trigger Panel */}
            <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
              <div className="card-header">
                <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Settings size={14} /> Live Modal Variant Demonstrator
                </span>
                <span className="badge badge-purple">9 Interactive Triggers</span>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                  
                  {/* Confirm */}
                  <button className="btn btn-secondary" onClick={handleConfirm} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <HelpCircle size={14} /> 1. Confirm Modal
                  </button>

                  {/* Loading */}
                  <button className="btn btn-secondary" onClick={handleLoadingProgress} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Loader2 size={14} /> 2. Progress / Loading
                  </button>

                  {/* Success */}
                  <button className="btn btn-secondary" onClick={handleSuccess} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={14} /> 3. Success Feedback
                  </button>

                  {/* Error & Retry */}
                  <button className="btn btn-secondary" onClick={handleErrorRetry} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertOctagon size={14} /> 4. Custom Error + Retry
                  </button>

                  {/* Warning */}
                  <button className="btn btn-secondary" onClick={handleWarning} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertTriangle size={14} /> 5. Warning Simulation
                  </button>

                  {/* Blockchain CCTP */}
                  <button className="btn btn-secondary" onClick={handleBlockchainTx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Layers size={14} /> 6. Blockchain Tx (CCTP)
                  </button>

                </div>

                <div style={{ 
                  borderTop: '1px solid var(--border-secondary)', 
                  paddingTop: 16,
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 8 
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    7. Unified Global Error Mapping (Wagmi / API Integration)
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => triggerGlobalError('timeout')} style={{ borderColor: 'var(--ph-red)' }}>
                      API Timeout
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => triggerGlobalError('rejected')} style={{ borderColor: 'var(--ph-yellow)' }}>
                      Signature Rejected (User)
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => triggerGlobalError('insufficient')} style={{ borderColor: 'var(--ph-red)' }}>
                      Insufficient Native Gas
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => triggerGlobalError('disconnected')} style={{ borderColor: 'var(--text-tertiary)' }}>
                      Network Disconnected
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => triggerGlobalError('unknown')}>
                      Unknown contract error
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* System Specifications Documentation */}
            <div className="grid-2">
              
              {/* Box 1: Architecture Specifications */}
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Modal Component Architecture</span>
                </div>
                <div className="card-body" style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <p style={{ marginBottom: 12 }}>
                    Our modal subsystem is architected as a **fat stateless client popover** mapping to a **centralized FIFO queue store**. 
                    This ensures visual consistency and accessibility regardless of which sub-route or blockchain transaction launches the popup.
                  </p>
                  
                  <h4 style={{ color: 'var(--text-primary)', fontWeight: 700, margin: '12px 0 6px' }}>State Pipeline Mechanics</h4>
                  <ul style={{ paddingLeft: 16, marginBottom: 12 }}>
                    <li><strong>Context Dispatcher:</strong> `useModal()` pushes configurations to an ephemeral memory queue.</li>
                    <li><strong>Hot Update Stream:</strong> Blockchain bridges (`app/bridge/page.tsx`) can patch the current modal's layout (e.g. step indices, status flags) while it remains open.</li>
                    <li><strong>Transition delays:</strong> 50ms delay between modal pops in the queue allows smooth unmounting before the next item slides in.</li>
                  </ul>

                  <h4 style={{ color: 'var(--text-primary)', fontWeight: 700, margin: '12px 0 6px' }}>UX & Frictionless Guardrails</h4>
                  <ul style={{ paddingLeft: 16 }}>
                    <li><strong>Double Action Prevention:</strong> Critical transactional modes lock the interface (setting `isDismissable: false`), preventing background spam clicking.</li>
                    <li><strong>Keyboard friendly:</strong> Binds the `Escape` key to safety close modals automatically when permitted.</li>
                    <li><strong>Human-readable mappings:</strong> Converts blockchain-level technical trace errors into explicit SME advice (e.g. directing to the testnet USDC gas faucet).</li>
                  </ul>
                </div>
              </div>

              {/* Box 2: Code Integration Guide */}
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Code Integration Guide</span>
                </div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ background: '#0D0F14', padding: 12, borderRadius: 6, border: '1px solid var(--border-primary)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ph-red)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
                      // 1. Importing & Triggering
                    </div>
                    <pre style={{ fontSize: 11, fontFamily: 'var(--font-mono)', overflowX: 'auto', margin: 0, color: '#A7F3D0' }}>
{`const { openModal } = useModal();

openModal({
  type: 'confirm',
  title: 'Execute Payment?',
  description: 'Send 100 USDC to client.',
  buttons: [
    { label: 'Cancel', variant: 'secondary' },
    { label: 'Send', variant: 'primary', onClick: doSend }
  ]
});`}
                    </pre>
                  </div>

                  <div style={{ background: '#0D0F14', padding: 12, borderRadius: 6, border: '1px solid var(--border-primary)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ph-purple)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
                      // 2. Dynamic Update Steps (Wagmi Bridge)
                    </div>
                    <pre style={{ fontSize: 11, fontFamily: 'var(--font-mono)', overflowX: 'auto', margin: 0, color: '#A7F3D0' }}>
{`updateActiveModal({
  txStatus: 'success',
  description: 'Burn complete!'
});`}
                    </pre>
                  </div>
                </div>
              </div>

            </div>

          </motion.div>
        </div>
      </main>
    </div>
  );
}
