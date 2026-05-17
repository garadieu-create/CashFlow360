'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { USDC_ADDRESS, getExplorerTxUrl } from '@/lib/arc-config';
import { USDC_ABI } from '@/lib/contracts';
import { useUSDCBalance } from '@/hooks/useOnChainData';
import { motion } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Send, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SendContent() {
  const { isConnected, address } = useAccount();
  const { formatted: balance, refetch } = useUSDCBalance();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');

  const { writeContract, data: txHash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

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
          <ConnectButton />
        </motion.div>
      </div>
    );
  }

  const handleSend = () => {
    if (!recipient || !amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid recipient and amount');
      return;
    }

    try {
      writeContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'transfer',
        args: [recipient as `0x${string}`, parseUnits(amount, 6)],
      });
      toast.loading('Transaction submitted...');
    } catch (err) {
      toast.error('Transaction failed');
    }
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
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>
              Balance: ${parseFloat(balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
            {/* Recipient */}
            <div className="input-group">
              <label className="input-label">Recipient Address</label>
              <input
                type="text"
                className="input input-mono"
                placeholder="0x..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                disabled={isPending || isConfirming}
              />
            </div>

            {/* Amount */}
            <div className="input-group">
              <label className="input-label">Amount (USDC)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  className="input input-mono"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isPending || isConfirming}
                  step="0.01"
                  min="0"
                />
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}
                  onClick={() => setAmount(balance)}
                >
                  MAX
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              className="btn btn-primary btn-lg"
              onClick={handleSend}
              disabled={isPending || isConfirming || !recipient || !amount}
              style={{ width: '100%' }}
            >
              {isPending ? (
                <><div className="spinner" style={{ width: 16, height: 16 }} /> Confirming in wallet...</>
              ) : isConfirming ? (
                <><div className="spinner" style={{ width: 16, height: 16 }} /> Waiting for confirmation...</>
              ) : (
                <><Send size={16} /> Send USDC</>
              )}
            </button>

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
                  style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <ExternalLink size={12} />
                  View on Arcscan
                </a>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, wordBreak: 'break-all' }}>
                  {txHash}
                </div>
              </motion.div>
            )}

            {/* Error State */}
            {error && (
              <div style={{
                padding: 'var(--space-lg)',
                background: 'var(--ph-red-light)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(245, 78, 0, 0.3)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={16} color="var(--ph-red)" />
                  <span style={{ fontWeight: 600, color: 'var(--ph-red)', fontSize: 13 }}>
                    {error.message.includes('User rejected') ? 'Transaction rejected by user' : 'Transaction failed'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
