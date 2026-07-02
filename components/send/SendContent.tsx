'use client';

import { useState, useEffect, useRef } from 'react';
import { useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { USDC_ADDRESS, getExplorerTxUrl } from '@/lib/arc-config';
import { useUSDCBalance, useVaultOperations, useVaultBalance, useAccount, useWriteContract } from '@/hooks/useOnChainData';
import { motion } from 'framer-motion';
import { Send, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useModal } from '@/context/ModalContext';
import { LoadingButton } from '@/components/ui/LoadingSystem';

function parseError(error: any): string {
  if (!error) return '';
  const msg = error.message || error.toString();
  if (msg.includes('User rejected')) return 'Transaction rejected by user in wallet.';
  if (msg.includes('insufficient funds')) return 'Insufficient native tokens for gas fees.';
  if (msg.includes('ERC20: transfer amount exceeds balance') || msg.includes('transfer amount exceeds balance')) return 'Transfer amount exceeds USDC balance.';
  if (msg.includes('execution reverted')) return 'Transaction was reverted by the smart contract.';
  if (msg.includes('Connector not connected')) return 'Wallet disconnected. Please reconnect.';
  return 'Transaction failed. Please check your inputs and try again.';
}

export default function SendContent() {
  const { isConnected, address, isConnecting } = useAccount();
  const { formatted: balance, refetch: refetchUSDC } = useUSDCBalance();
  const { formatted: vaultBalance, refetch: refetchVault } = useVaultBalance();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Operations');

  const { transfer, data: txHash, isPending, error, reset } = useVaultOperations();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash || undefined });

  const { openModal, updateModal, closeModal, triggerGlobalError } = useModal();
  const modalIdRef = useRef<string | null>(null);

  const refetch = () => {
    refetchUSDC();
    refetchVault();
  };

  useEffect(() => {
    // 1. Awaiting Wallet Signature
    if (isPending) {
      if (!modalIdRef.current) {
        const id = openModal({
          type: 'transaction',
          title: 'Authorize Treasury Transfer',
          description: `Please authorize the payment of ${amount} USDC to ${recipient.slice(0, 6)}...${recipient.slice(-4)} in your wallet.`,
          badge: 'Wallet Request',
          txStatus: 'pending',
          txSteps: [
            { label: 'Awaiting signature in wallet', status: 'pending' },
            { label: 'Blockchain confirmation', status: 'idle' }
          ],
          isDismissable: false
        });
        modalIdRef.current = id;
      } else {
        updateModal(modalIdRef.current, {
          txStatus: 'pending',
          txSteps: [
            { label: 'Awaiting signature in wallet', status: 'pending' },
            { label: 'Blockchain confirmation', status: 'idle' }
          ]
        });
      }
    }

    // 2. Waiting for Block Confirmation
    if (isConfirming && txHash) {
      if (!modalIdRef.current) {
        const id = openModal({
          type: 'transaction',
          title: 'Transfer Broadcasting',
          description: `Broadcasting payment of ${amount} USDC on Arc Testnet.`,
          badge: 'On-Chain Execution',
          txStatus: 'confirming',
          txHash,
          explorerUrl: getExplorerTxUrl(txHash),
          txSteps: [
            { label: 'Awaiting signature in wallet', status: 'success' },
            { label: 'Blockchain confirmation', status: 'pending' }
          ],
          isDismissable: false
        });
        modalIdRef.current = id;
      } else {
        updateModal(modalIdRef.current, {
          txStatus: 'confirming',
          txHash,
          explorerUrl: getExplorerTxUrl(txHash),
          txSteps: [
            { label: 'Awaiting signature in wallet', status: 'success' },
            { label: 'Blockchain confirmation', status: 'pending' }
          ]
        });
      }
    }

    // 3. Success state
    if (isSuccess && txHash) {
      if (modalIdRef.current) {
        updateModal(modalIdRef.current, {
          type: 'success',
          txStatus: 'success',
          title: 'Transfer Settled Successfully',
          description: `Successfully sent ${amount} USDC to ${recipient.slice(0, 6)}...${recipient.slice(-4)} with sub-second EVM finality on Arc Testnet.`,
          badge: 'Payment Cleared',
          txSteps: [
            { label: 'Awaiting signature in wallet', status: 'success' },
            { label: 'Blockchain confirmation', status: 'success' }
          ],
          isDismissable: true,
          buttons: [
            {
              label: 'Done',
              variant: 'secondary',
              closeModalAfterClick: true,
              onClick: () => {
                setAmount('');
                setRecipient('');
                reset();
                modalIdRef.current = null;
              }
            }
          ]
        });
      }
    }

    // 4. Error State
    if (error) {
      if (modalIdRef.current) {
        closeModal(modalIdRef.current);
        modalIdRef.current = null;
      }
      triggerGlobalError(error, () => {
        transfer(recipient, parseUnits(amount, 6), category);
      });
      reset();
    }
  }, [isPending, isConfirming, isSuccess, error, txHash]);

  if (isConnecting) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '16px' }}>
        <div className="spinner" style={{ width: '32px', height: '32px' }} />
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>Restoring secure session...</span>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="empty-state">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ marginBottom: '24px', opacity: 0.8 }}>
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="8" y="16" width="48" height="32" rx="4" stroke="url(#send_grad)" strokeWidth="4" />
              <circle cx="32" cy="32" r="8" stroke="url(#send_grad)" strokeWidth="4" />
              <path d="M8 24H16M8 40H16M48 24H56M48 40H56" stroke="url(#send_grad)" strokeWidth="4" strokeLinecap="round" />
              <path d="M40 8L48 16M48 16L56 8" stroke="url(#send_grad)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <defs>
                <linearGradient id="send_grad" x1="8" y1="8" x2="56" y2="48" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#77B96C" />
                  <stop offset="1" stopColor="#FF7A33" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h2 className="empty-state-title">Connect Wallet to Send</h2>
          <p className="empty-state-text" style={{ marginBottom: '24px' }}>
            Send USDC to any address on Arc Testnet using Circle App Kit Send.
          </p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Initialize Smart Account
          </button>
        </motion.div>
      </div>
    );
  }

  const handleSend = () => {
    if (!recipient || !amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid recipient and amount');
      return;
    }

    if (parseFloat(amount) > parseFloat(vaultBalance)) {
      toast.error('Amount exceeds your vault balance');
      return;
    }

    // Open Confirmation modal before executing transaction
    openModal({
      type: 'confirm',
      title: 'Confirm Outflow Transfer',
      description: `You are about to transfer ${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} USDC from your treasury vault to recipient ${recipient}. This will immediately lock and transfer the funds.`,
      badge: 'Security Verification',
      buttons: [
        {
          label: 'Cancel',
          variant: 'secondary',
          closeModalAfterClick: true
        },
        {
          label: 'Confirm & Sign',
          variant: 'primary',
          closeModalAfterClick: true,
          onClick: () => {
            try {
              transfer(recipient, parseUnits(amount, 6), category);
            } catch (err) {
              triggerGlobalError(err);
            }
          }
        }
      ]
    });
  };

  if (isSuccess && txHash) {
    setTimeout(() => refetch(), 2000);
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Send USDC</h1>
          <p className="page-subtitle">
            Transfer USDC to any address on Arc Testnet • Powered by Circle USDC
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="card-header">
            <span className="card-title">
              <Send size={14} style={{ display: 'inline', marginRight: 6 }} />
              New Transfer
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>
                Wallet Balance: ${parseFloat(balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-primary)', fontWeight: 600 }}>
                Vault Balance: ${parseFloat(vaultBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
            {/* Recipient */}
            <div className="input-group">
              <label className="input-label" style={{ display: 'flex', alignItems: 'center' }}>
                Recipient Address
                <span className="tooltip-container">
                  <span className="tooltip-trigger">?</span>
                  <span className="tooltip-content">
                    The destination EOA or contract address on Arc Testnet. Double check to prevent loss of funds.
                  </span>
                </span>
              </label>
              <input
                id="send-recipient-input"
                type="text"
                className="input input-mono"
                placeholder="0x... (e.g. 0x71C7656EC7ab88b098defB751B7401B5f6d8976F)"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                disabled={isPending || isConfirming}
              />
            </div>

            {/* Amount */}
            <div className="input-group">
              <label className="input-label" style={{ display: 'flex', alignItems: 'center' }}>
                Amount (USDC)
                <span className="tooltip-container">
                  <span className="tooltip-trigger">?</span>
                  <span className="tooltip-content">
                    The exact amount of USDC you want to transfer. Maximum transfer is bounded by your Vault Balance.
                  </span>
                </span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="send-amount-input"
                  type="number"
                  className="input input-mono"
                  style={{ paddingRight: '68px' }}
                  placeholder="0.00 (e.g. 150.00)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isPending || isConfirming}
                  step="0.01"
                  min="0"
                />
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}
                  onClick={() => setAmount(vaultBalance)}
                >
                  MAX
                </button>
              </div>
            </div>

            {/* Category Dropdown */}
            <div className="input-group">
              <label className="input-label" style={{ display: 'flex', alignItems: 'center' }}>
                Transaction Category
                <span className="tooltip-container">
                  <span className="tooltip-trigger">?</span>
                  <span className="tooltip-content">
                    Helps classify the transfer for runway analytics and cash flow mapping (Sankey visualization).
                  </span>
                </span>
              </label>
              <select
                id="send-category-select"
                className="input input-mono"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isPending || isConfirming}
                style={{
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  backgroundSize: '16px',
                  paddingRight: '40px',
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  border: '2px solid var(--border-primary)',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <option value="Payroll">Payroll</option>
                <option value="Inventory">Inventory</option>
                <option value="Operations">Operations</option>
                <option value="Tax">Tax</option>
                <option value="Marketing">Marketing</option>
              </select>
            </div>

            {/* Network Fee Preview */}
            <div style={{ padding: 'var(--space-md)', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Network Fee (Est.)</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>~0.00015 ARC</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Estimated Balance After</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>
                  ${amount ? Math.max(0, parseFloat(vaultBalance) - parseFloat(amount)).toLocaleString('en-US', { minimumFractionDigits: 2 }) : vaultBalance}
                </span>
              </div>
            </div>

            <LoadingButton
              id="send-submit-btn"
              variant="primary"
              size="lg"
              onClick={handleSend}
              isLoading={isPending || isConfirming}
              loadingText={isPending ? 'Confirming in wallet...' : 'Waiting for confirmation...'}
              disabled={!recipient || !amount}
              style={{ width: '100%' }}
            >
              <Send size={16} /> Send USDC
            </LoadingButton>

            {/* Success State */}
            {isSuccess && txHash && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: 'var(--space-lg)',
                  background: 'var(--ph-green-light)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(119, 185, 108, 0.3)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <CheckCircle size={16} color="var(--ph-green)" />
                  <span style={{ fontWeight: 600, color: 'var(--ph-green)' }}>Transaction Confirmed!</span>
                </div>
                <a
                  href={getExplorerTxUrl(txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}
                >
                  <ExternalLink size={12} />
                  View on Arcscan
                </a>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)', wordBreak: 'break-all', marginBottom: 12 }}>
                  {txHash}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
                    Recommended Next Steps
                  </div>
                  <Link 
                    href="/runway" 
                    className="btn btn-secondary btn-sm" 
                    style={{ width: '100%', justifyContent: 'flex-start', background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)' }}
                  >
                    📈 Explore Cash Runway Impact
                  </Link>
                  <Link 
                    href="/flow" 
                    className="btn btn-secondary btn-sm" 
                    style={{ width: '100%', justifyContent: 'flex-start', background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)' }}
                  >
                    🗺️ Analyze Money Flows (Sankey Map)
                  </Link>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%', marginTop: 4 }}
                    onClick={() => {
                      setAmount('');
                      setRecipient('');
                      reset();
                    }}
                  >
                    Send Another USDC Transfer
                  </button>
                </div>
              </motion.div>
            )}

            {/* Error State */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: 'var(--space-lg)',
                  background: 'var(--ph-red-light)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(245, 78, 0, 0.3)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <AlertCircle size={16} color="var(--ph-red)" />
                  <span style={{ fontWeight: 600, color: 'var(--ph-red)', fontSize: 13 }}>
                    Transaction Failed
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--ph-red)', opacity: 0.9, paddingLeft: 24, lineHeight: 1.5 }}>
                  {parseError(error)}
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ marginTop: 12, color: 'var(--ph-red)', width: '100%', background: 'rgba(245, 78, 0, 0.1)' }}
                  onClick={() => reset()}
                >
                  Dismiss
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
