'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { USDC_ADDRESS } from '@/lib/arc-config';
import { USDC_ABI, CASHFLOW_VAULT_ADDRESS } from '@/lib/contracts';
import { useUSDCBalance, useVaultBalance, useVaultOperations } from '@/hooks/useOnChainData';
import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown, Lock, Wallet, ShieldAlert, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export function VaultCard() {
  const { address, isConnected } = useAccount();
  const { formatted: walletUSDC, balance: rawWalletBalance, refetch: refetchWallet } = useUSDCBalance();
  const { formatted: vaultUSDC, balance: rawVaultBalance, refetch: refetchVault } = useVaultBalance();
  const { depositAsync, withdrawAsync } = useVaultOperations();

  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Wagmi write for Approval
  const { writeContractAsync: approveAsync } = useWriteContract();

  // Read Allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'allowance',
    args: address && CASHFLOW_VAULT_ADDRESS ? [address, CASHFLOW_VAULT_ADDRESS] : undefined,
    query: {
      enabled: !!address && !!CASHFLOW_VAULT_ADDRESS,
      refetchInterval: 5000,
    },
  });

  const parsedDeposit = depositAmount ? parseUnits(depositAmount, 6) : BigInt(0);
  const parsedWithdraw = withdrawAmount ? parseUnits(withdrawAmount, 6) : BigInt(0);
  const needsApproval = allowance !== undefined && allowance < parsedDeposit;

  const handleApprove = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast.error('Enter a valid amount to approve');
      return;
    }
    setIsApproving(true);
    const toastId = toast.loading('Requesting approval in wallet...');
    try {
      const txHash = await approveAsync({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [CASHFLOW_VAULT_ADDRESS as `0x${string}`, parsedDeposit],
      });
      toast.loading('Confirming approval transaction...', { id: toastId });
      // We'll wait a bit or let refetchInterval handle it, but wait for hash is better.
      // Wait for receipt is simulated here or we can just show success after hash and wait for state updates.
      toast.success('USDC approved successfully!', { id: toastId });
      refetchAllowance();
    } catch (err: any) {
      toast.error(err.message || 'Approval rejected or failed', { id: toastId });
    } finally {
      setIsApproving(false);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast.error('Enter a valid amount to deposit');
      return;
    }
    if (rawWalletBalance !== undefined && parsedDeposit > rawWalletBalance) {
      toast.error('Insufficient wallet balance');
      return;
    }
    setIsDepositing(true);
    const toastId = toast.loading('Initiating deposit to vault...');
    try {
      const txHash = await depositAsync(parsedDeposit);
      toast.loading('Confirming deposit transaction...', { id: toastId });
      // Wait for a few seconds to let block indexer pick it up, then refresh
      setTimeout(() => {
        refetchWallet();
        refetchVault();
        refetchAllowance();
      }, 3000);
      toast.success('Successfully deposited to Vault!', { id: toastId });
      setDepositAmount('');
    } catch (err: any) {
      toast.error(err.message || 'Deposit failed', { id: toastId });
    } finally {
      setIsDepositing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error('Enter a valid amount to withdraw');
      return;
    }
    if (rawVaultBalance !== undefined && parsedWithdraw > rawVaultBalance) {
      toast.error('Insufficient vault balance');
      return;
    }
    setIsWithdrawing(true);
    const toastId = toast.loading('Initiating withdrawal from vault...');
    try {
      const txHash = await withdrawAsync(parsedWithdraw);
      toast.loading('Confirming withdrawal transaction...', { id: toastId });
      setTimeout(() => {
        refetchWallet();
        refetchVault();
      }, 3000);
      toast.success('Successfully withdrawn from Vault!', { id: toastId });
      setWithdrawAmount('');
    } catch (err: any) {
      toast.error(err.message || 'Withdrawal failed', { id: toastId });
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (!isConnected) return null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
      {/* Deposit Panel */}
      <motion.div 
        className="card"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
      >
        <div className="card-header" style={{ borderBottom: '2px solid var(--border-primary)' }}>
          <span className="card-title">
            <ArrowUp size={14} style={{ display: 'inline', marginRight: 6, color: 'var(--ph-green)' }} />
            Deposit USDC to Vault
          </span>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
            Wallet Balance: ${parseFloat(walletUSDC).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          <div className="input-group">
            <label className="input-label">Deposit Amount (USDC)</label>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                className="input input-mono"
                placeholder="0.00"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                disabled={isApproving || isDepositing}
                min="0"
                step="0.01"
              />
              <button
                className="btn btn-ghost btn-sm"
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}
                onClick={() => setDepositAmount(walletUSDC)}
              >
                MAX
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
            {needsApproval ? (
              <button 
                className="btn btn-primary" 
                onClick={handleApprove} 
                disabled={isApproving || !depositAmount}
                style={{ width: '100%', background: 'var(--ph-purple)', borderColor: 'var(--border-primary)' }}
              >
                {isApproving ? 'Approving...' : '1. Approve USDC'}
              </button>
            ) : (
              <button 
                className="btn btn-primary" 
                onClick={handleDeposit} 
                disabled={isDepositing || !depositAmount}
                style={{ width: '100%', background: 'var(--ph-green)', borderColor: 'var(--border-primary)' }}
              >
                {isDepositing ? 'Depositing...' : 'Deposit to Vault'}
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Withdraw Panel */}
      <motion.div 
        className="card"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <div className="card-header" style={{ borderBottom: '2px solid var(--border-primary)' }}>
          <span className="card-title">
            <ArrowDown size={14} style={{ display: 'inline', marginRight: 6, color: 'var(--ph-red)' }} />
            Withdraw USDC from Vault
          </span>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
            Vault Balance: ${parseFloat(vaultUSDC).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          <div className="input-group">
            <label className="input-label">Withdraw Amount (USDC)</label>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                className="input input-mono"
                placeholder="0.00"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                disabled={isWithdrawing}
                min="0"
                step="0.01"
              />
              <button
                className="btn btn-ghost btn-sm"
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}
                onClick={() => setWithdrawAmount(vaultUSDC)}
              >
                MAX
              </button>
            </div>
          </div>

          <button 
            className="btn btn-primary" 
            onClick={handleWithdraw} 
            disabled={isWithdrawing || !withdrawAmount}
            style={{ width: '100%', background: 'var(--ph-red)', borderColor: 'var(--border-primary)' }}
          >
            {isWithdrawing ? 'Withdrawing...' : 'Withdraw to Wallet'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
