'use client';

import { useBalance, useReadContract, usePublicClient, useWatchContractEvent } from 'wagmi';
import { formatUnits } from 'viem';
import { USDC_ADDRESS, EURC_ADDRESS, arcTestnet } from '@/lib/arc-config';
import { USDC_ABI, CASHFLOW_VAULT_ADDRESS, CASHFLOW_VAULT_ABI, PAYROLL_JOB_ADDRESS, PAYROLL_JOB_ABI } from '@/lib/contracts';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useCircleWallet } from '@/context/CircleWalletContext';

export function useAccount() {
  const { address, isConnected, isLoading } = useCircleWallet();
  return { address, isConnected, isConnecting: isLoading };
}

export function useWriteContract() {
  const { executeContractWrite } = useCircleWallet();
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<any>(null);

  const writeContractAsync = useCallback(async ({ address, abi, functionName, args, chainId }: any) => {
    setIsPending(true);
    setIsSuccess(false);
    setIsError(false);
    setError(null);
    try {
      const hash = await executeContractWrite(address, abi, functionName, args || [], chainId);
      setIsSuccess(true);
      return hash;
    } catch (err) {
      setIsError(true);
      setError(err);
      throw err;
    } finally {
      setIsPending(false);
    }
  }, [executeContractWrite]);

  const writeContract = useCallback(({ address, abi, functionName, args, chainId }: any) => {
    writeContractAsync({ address, abi, functionName, args, chainId }).catch(() => {});
  }, [writeContractAsync]);

  return {
    writeContract,
    writeContractAsync,
    isPending,
    isSuccess,
    isError,
    error,
    status: isPending ? 'pending' : isSuccess ? 'success' : isError ? 'error' : 'idle',
    data: null as any,
    reset: () => {
      setIsPending(false);
      setIsSuccess(false);
      setIsError(false);
      setError(null);
    }
  };
}

// USDC on Arc has 6 decimals for ERC-20 interface
const USDC_DECIMALS = 6;

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  type: 'inflow' | 'outflow';
  category: string;
  blockNumber: bigint;
}

export function useUSDCBalance() {
  const { address } = useAccount();

  const { data: balance, isLoading, refetch } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: arcTestnet.id,
    query: {
      enabled: !!address,
      refetchInterval: 10000,
    },
  });

  const { isDemo } = useTransactionHistory();

  const formatted = isDemo 
    ? '14,250.00' 
    : (balance ? formatUnits(balance as bigint, USDC_DECIMALS) : '0.00');

  return {
    balance: isDemo ? 14250000000n : (balance as bigint | undefined),
    formatted,
    isLoading: isDemo ? false : isLoading,
    refetch,
    isDemo,
  };
}

export function useVaultBalance() {
  const { address } = useAccount();

  const { data: balance, isLoading, refetch } = useReadContract({
    address: CASHFLOW_VAULT_ADDRESS,
    abi: CASHFLOW_VAULT_ABI,
    functionName: 'getVaultBalance',
    args: address ? [address] : undefined,
    chainId: arcTestnet.id,
    query: {
      enabled: !!address,
      refetchInterval: 10000,
    },
  });

  const { isDemo } = useTransactionHistory();

  const formatted = isDemo 
    ? '25,000.00' 
    : (balance ? formatUnits(balance as bigint, USDC_DECIMALS) : '0.00');

  return {
    balance: isDemo ? 25000000000n : (balance as bigint | undefined),
    formatted,
    isLoading: isDemo ? false : isLoading,
    refetch,
    isDemo,
  };
}

export function useEURCBalance() {
  const { address } = useAccount();

  const { data: balance, isLoading } = useReadContract({
    address: EURC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: arcTestnet.id,
    query: {
      enabled: !!address,
      refetchInterval: 15000,
    },
  });

  const { isDemo } = useTransactionHistory();

  const formatted = isDemo 
    ? '3,200.00' 
    : (balance ? formatUnits(balance as bigint, USDC_DECIMALS) : '0.00');

  return { 
    balance: isDemo ? 3200000000n : (balance as bigint | undefined), 
    formatted, 
    isLoading: isDemo ? false : isLoading,
    isDemo
  };
}

export function useNativeBalance() {
  const { address } = useAccount();

  const { data, isLoading } = useBalance({
    address,
    chainId: arcTestnet.id,
    query: {
      enabled: !!address,
      refetchInterval: 10000,
    },
  });

  const { isDemo } = useTransactionHistory();

  return {
    balance: isDemo ? 150000000n : data?.value,
    formatted: isDemo ? '150.00' : (data?.formatted || '0.00'),
    symbol: data?.symbol || 'USDC',
    isLoading: isDemo ? false : isLoading,
    isDemo,
  };
}

export function useVaultOperations() {
  const { writeContract, writeContractAsync, data, error, isPending, isSuccess, isError, status, reset } = useWriteContract();

  const deposit = useCallback((amount: bigint) => {
    return writeContract({
      address: CASHFLOW_VAULT_ADDRESS,
      abi: CASHFLOW_VAULT_ABI,
      functionName: 'deposit',
      args: [amount],
    });
  }, [writeContract]);

  const depositAsync = useCallback((amount: bigint) => {
    return writeContractAsync({
      address: CASHFLOW_VAULT_ADDRESS,
      abi: CASHFLOW_VAULT_ABI,
      functionName: 'deposit',
      args: [amount],
    });
  }, [writeContractAsync]);

  const withdraw = useCallback((amount: bigint) => {
    return writeContract({
      address: CASHFLOW_VAULT_ADDRESS,
      abi: CASHFLOW_VAULT_ABI,
      functionName: 'withdraw',
      args: [amount],
    });
  }, [writeContract]);

  const withdrawAsync = useCallback((amount: bigint) => {
    return writeContractAsync({
      address: CASHFLOW_VAULT_ADDRESS,
      abi: CASHFLOW_VAULT_ABI,
      functionName: 'withdraw',
      args: [amount],
    });
  }, [writeContractAsync]);

  const transfer = useCallback((to: string, amount: bigint, category: string) => {
    return writeContract({
      address: CASHFLOW_VAULT_ADDRESS,
      abi: CASHFLOW_VAULT_ABI,
      functionName: 'transfer',
      args: [to as `0x${string}`, amount, category],
    });
  }, [writeContract]);

  const transferAsync = useCallback((to: string, amount: bigint, category: string) => {
    return writeContractAsync({
      address: CASHFLOW_VAULT_ADDRESS,
      abi: CASHFLOW_VAULT_ABI,
      functionName: 'transfer',
      args: [to as `0x${string}`, amount, category],
    });
  }, [writeContractAsync]);

  const batchTransfer = useCallback((recipients: string[], amounts: bigint[], categories: string[]) => {
    return writeContract({
      address: CASHFLOW_VAULT_ADDRESS,
      abi: CASHFLOW_VAULT_ABI,
      functionName: 'batchTransfer',
      args: [recipients as `0x${string}`[], amounts, categories],
    });
  }, [writeContract]);

  const batchTransferAsync = useCallback((recipients: string[], amounts: bigint[], categories: string[]) => {
    return writeContractAsync({
      address: CASHFLOW_VAULT_ADDRESS,
      abi: CASHFLOW_VAULT_ABI,
      functionName: 'batchTransfer',
      args: [recipients as `0x${string}`[], amounts, categories],
    });
  }, [writeContractAsync]);

  return {
    deposit,
    depositAsync,
    withdraw,
    withdrawAsync,
    transfer,
    transferAsync,
    batchTransfer,
    batchTransferAsync,
    isPending,
    isSuccess,
    isError,
    error,
    status,
    data,
    reset,
  };
}

export function useVaultAlerts() {
  const { address } = useAccount();

  const { data: thresholdRaw, isLoading: loadingThreshold, refetch } = useReadContract({
    address: CASHFLOW_VAULT_ADDRESS,
    abi: CASHFLOW_VAULT_ABI,
    functionName: 'lowBalanceThreshold',
    args: address ? [address] : undefined,
    chainId: arcTestnet.id,
    query: {
      enabled: !!address,
      refetchInterval: 10000,
    },
  });

  const { writeContract, writeContractAsync, isPending, error, status, data: txHash } = useWriteContract();

  const setAlertThreshold = useCallback((threshold: bigint) => {
    return writeContract({
      address: CASHFLOW_VAULT_ADDRESS,
      abi: CASHFLOW_VAULT_ABI,
      functionName: 'setAlertThreshold',
      args: [threshold],
    });
  }, [writeContract]);

  const setAlertThresholdAsync = useCallback((threshold: bigint) => {
    return writeContractAsync({
      address: CASHFLOW_VAULT_ADDRESS,
      abi: CASHFLOW_VAULT_ABI,
      functionName: 'setAlertThreshold',
      args: [threshold],
    });
  }, [writeContractAsync]);

  const formatted = thresholdRaw ? formatUnits(thresholdRaw as bigint, 6) : '0';

  return {
    threshold: thresholdRaw as bigint | undefined,
    formatted,
    isLoading: loadingThreshold,
    refetch,
    setAlertThreshold,
    setAlertThresholdAsync,
    isPending,
    error,
    status,
    txHash,
  };
}

export function useLowBalanceWatcher() {
  const { address } = useAccount();

  useWatchContractEvent({
    address: CASHFLOW_VAULT_ADDRESS,
    abi: CASHFLOW_VAULT_ABI,
    eventName: 'LowBalanceAlert',
    onLogs(logs: any[]) {
      logs.forEach((log) => {
        const { user, balance, threshold } = log.args as any;
        if (address && user && user.toLowerCase() === address.toLowerCase()) {
          const balFormatted = balance ? formatUnits(balance, 6) : '0';
          const threshFormatted = threshold ? formatUnits(threshold, 6) : '0';
          
          toast.custom((t) => (
            React.createElement('div', {
              className: `brutalist-alert ${t.visible ? 'animate-enter' : 'animate-leave'}`,
              style: {
                position: 'fixed',
                top: '24px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 9999,
                background: 'var(--ph-red-light)',
                border: '3px solid var(--text-primary)',
                padding: '16px 24px',
                boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.9)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                maxWidth: '480px',
                width: 'calc(100vw - 32px)',
                borderRadius: '0px'
              }
            }, [
              React.createElement('div', {
                key: 'title',
                style: { display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '14px', color: 'var(--ph-red)' }
              }, [
                React.createElement('span', { key: 'icon', style: { fontSize: '18px' } }, '⚠️'),
                ' VAULT LOW BALANCE WARNING'
              ]),
              React.createElement('div', {
                key: 'body',
                style: { fontSize: '12px', lineHeight: 1.4 }
              }, [
                'Your CashFlowVault balance is ',
                React.createElement('strong', { key: 'bal', style: { color: 'var(--ph-red)' } }, `$${parseFloat(balFormatted).toLocaleString('en-US', { minimumFractionDigits: 2 })}`),
                ', which is below your set alert threshold of ',
                React.createElement('strong', { key: 'thresh' }, `$${parseFloat(threshFormatted).toLocaleString('en-US', { minimumFractionDigits: 2 })}`),
                '.'
              ]),
              React.createElement('div', {
                key: 'footer',
                style: { display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }
              }, [
                React.createElement('button', {
                  key: 'btn',
                  onClick: () => toast.dismiss(t.id),
                  style: {
                    background: 'var(--text-primary)',
                    color: 'var(--bg-primary)',
                    border: 'none',
                    padding: '4px 12px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    fontFamily: 'var(--font-mono)'
                  }
                }, 'DISMISS')
              ])
            ])
          ), { duration: Infinity });
        }
      });
    },
  });
}

export function useTransactionHistory() {
  const { address } = useAccount();

  const query = useQuery({
    queryKey: ['transactions', address],
    queryFn: async () => {
      if (!address) return { txs: [], isDemo: false };

      const response = await fetch(`/api/indexer?address=${address}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query {
              deposits {
                id
                from
                amount
                timestamp
                txHash
              }
              withdrawals {
                id
                to
                amount
                timestamp
                txHash
              }
              transfers {
                id
                from
                to
                amount
                category
                timestamp
                txHash
              }
            }
          `
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch indexed transactions');
      }

      const result = await response.json();
      const data = result.data || {};
      const deposits = data.deposits || [];
      const withdrawals = data.withdrawals || [];
      const transfers = data.transfers || [];
      const isDemo = result.indexerStatus?.isDemoMode || false;

      const txs: Transaction[] = [];

      // Add transfers
      transfers.forEach((t: any) => {
        const isFromUser = t.from.toLowerCase() === address.toLowerCase();
        const isToUser = t.to.toLowerCase() === address.toLowerCase();
        
        if (isFromUser || isToUser) {
          txs.push({
            hash: t.txHash,
            from: t.from,
            to: t.to,
            value: t.amount,
            timestamp: t.timestamp,
            type: isFromUser ? 'outflow' : 'inflow',
            category: t.category || 'Transfer',
            blockNumber: BigInt(0)
          });
        }
      });

      // Add deposits
      deposits.forEach((d: any) => {
        if (d.from.toLowerCase() === address.toLowerCase()) {
          txs.push({
            hash: d.txHash,
            from: d.from,
            to: CASHFLOW_VAULT_ADDRESS,
            value: d.amount,
            timestamp: d.timestamp,
            type: 'outflow',
            category: 'Vault Deposit',
            blockNumber: BigInt(0)
          });
        }
      });

      // Add withdrawals
      withdrawals.forEach((w: any) => {
        if (w.to.toLowerCase() === address.toLowerCase()) {
          txs.push({
            hash: w.txHash,
            from: CASHFLOW_VAULT_ADDRESS,
            to: w.to,
            value: w.amount,
            timestamp: w.timestamp,
            type: 'inflow',
            category: 'Vault Withdrawal',
            blockNumber: BigInt(0)
          });
        }
      });

      txs.sort((a, b) => b.timestamp - a.timestamp);
      return { txs, isDemo };
    },
    enabled: !!address,
    refetchInterval: 10000,
    staleTime: 5000,
  });

  return { 
    transactions: query.data?.txs || [], 
    isDemo: query.data?.isDemo || false,
    isLoading: query.isLoading, 
    refetch: query.refetch 
  };
}

export function useCashFlowMetrics(transactions: Transaction[]) {
  return useMemo(() => {
    const totalInflow = transactions
      .filter((t) => t.type === 'inflow')
      .reduce((sum, t) => sum + parseFloat(t.value), 0);

    const totalOutflow = transactions
      .filter((t) => t.type === 'outflow')
      .reduce((sum, t) => sum + parseFloat(t.value), 0);

    const netFlow = totalInflow - totalOutflow;

    // Group by day for chart data
    const dailyData = transactions.reduce((acc, tx) => {
      const day = new Date(tx.timestamp * 1000).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      if (!acc[day]) acc[day] = { day, inflow: 0, outflow: 0, net: 0 };
      if (tx.type === 'inflow') {
        acc[day].inflow += parseFloat(tx.value);
      } else {
        acc[day].outflow += parseFloat(tx.value);
      }
      acc[day].net = acc[day].inflow - acc[day].outflow;
      return acc;
    }, {} as Record<string, { day: string; inflow: number; outflow: number; net: number }>);

    const chartData = Object.values(dailyData).reverse();

    // Category breakdown
    const categoryBreakdown = transactions.reduce((acc, tx) => {
      const cat = tx.category || 'Uncategorized';
      if (!acc[cat]) acc[cat] = { category: cat, amount: 0, count: 0 };
      acc[cat].amount += parseFloat(tx.value);
      acc[cat].count++;
      return acc;
    }, {} as Record<string, { category: string; amount: number; count: number }>);

    return {
      totalInflow,
      totalOutflow,
      netFlow,
      transactionCount: transactions.length,
      chartData,
      categoryBreakdown: Object.values(categoryBreakdown),
    };
  }, [transactions]);
}

export function usePayrollJobs() {
  const { address } = useAccount();

  const { data: jobs, isLoading, refetch } = useReadContract({
    address: PAYROLL_JOB_ADDRESS,
    abi: PAYROLL_JOB_ABI,
    functionName: 'getJobs',
    chainId: arcTestnet.id,
    query: {
      enabled: !!address,
      refetchInterval: 5000,
    },
  });

  const { isDemo } = useTransactionHistory();

  const mockJobs = [
    {
      id: 1n,
      client: address || '0xfb5FEeDA927C63AF2Dd87c81F53eBF6b58512F7b',
      contractor: '0x4296ca872Ac721e648DBeB9Fd6FA46C396d6Aad',
      paymentAmount: 3500000000n, // $3500 USDC
      status: 1, // Escrow Active
      createdAt: BigInt(Math.floor(Date.now() / 1000) - 5 * 86400)
    },
    {
      id: 2n,
      client: address || '0xfb5FEeDA927C63AF2Dd87c81F53eBF6b58512F7b',
      contractor: '0x18a38F6D657bCaA73b2241eC00f53ebF6B58512f',
      paymentAmount: 1200000000n, // $1200 USDC
      status: 2, // Settled
      createdAt: BigInt(Math.floor(Date.now() / 1000) - 12 * 86400)
    },
    {
      id: 3n,
      client: address || '0xfb5FEeDA927C63AF2Dd87c81F53eBF6b58512F7b',
      contractor: '0xbc8e472Ac721e648DBeB9Fd6FA46C396d6Aad887c',
      paymentAmount: 8000000000n, // $8000 USDC
      status: 1, // Escrow Active
      createdAt: BigInt(Math.floor(Date.now() / 1000) - 2 * 86400)
    },
    {
      id: 4n,
      client: address || '0xfb5FEeDA927C63AF2Dd87c81F53eBF6b58512F7b',
      contractor: '0x712aE72Ac721e648DBeB9Fd6FA46C396d6Aad888c',
      paymentAmount: 2500000000n, // $2500 USDC
      status: 3, // Disputed
      createdAt: BigInt(Math.floor(Date.now() / 1000) - 8 * 86400)
    },
    {
      id: 5n,
      client: address || '0xfb5FEeDA927C63AF2Dd87c81F53eBF6b58512F7b',
      contractor: '0xda91E72Ac721e648DBeB9Fd6FA46C396d6Aad999e',
      paymentAmount: 500000000n, // $500 USDC
      status: 0, // Funding Pending
      createdAt: BigInt(Math.floor(Date.now() / 1000) - 1 * 86400)
    }
  ];

  const finalJobs = (jobs && jobs.length > 0) ? jobs : (isDemo ? mockJobs : []);

  return {
    jobs: finalJobs as any[],
    isLoading: (jobs && jobs.length > 0) ? false : (isDemo ? false : isLoading),
    refetch,
    isDemo: (jobs && jobs.length > 0) ? false : isDemo
  };
}

export function usePayrollJobOperations() {
  const { writeContractAsync } = useWriteContract();

  const createJob = useCallback((contractor: string, paymentAmount: bigint) => {
    return writeContractAsync({
      address: PAYROLL_JOB_ADDRESS,
      abi: PAYROLL_JOB_ABI,
      functionName: 'createJob',
      args: [contractor as `0x${string}`, paymentAmount],
    });
  }, [writeContractAsync]);

  const fundJob = useCallback((jobId: bigint) => {
    return writeContractAsync({
      address: PAYROLL_JOB_ADDRESS,
      abi: PAYROLL_JOB_ABI,
      functionName: 'fundJob',
      args: [jobId],
    });
  }, [writeContractAsync]);

  const releasePayment = useCallback((jobId: bigint) => {
    return writeContractAsync({
      address: PAYROLL_JOB_ADDRESS,
      abi: PAYROLL_JOB_ABI,
      functionName: 'releasePayment',
      args: [jobId],
    });
  }, [writeContractAsync]);

  const disputeJob = useCallback((jobId: bigint) => {
    return writeContractAsync({
      address: PAYROLL_JOB_ADDRESS,
      abi: PAYROLL_JOB_ABI,
      functionName: 'disputeJob',
      args: [jobId],
    });
  }, [writeContractAsync]);

  return {
    createJob,
    fundJob,
    releasePayment,
    disputeJob,
  };
}

export interface MultiSigRequest {
  id: number;
  creator: string;
  to: string;
  amount: string;
  category: string;
  executed: boolean;
  ownerApproved: boolean;
  coSignerApproved: boolean;
}

export function useMultiSigRequests() {
  const { address } = useAccount();

  const { data: count, isLoading: countLoading, refetch } = useReadContract({
    address: CASHFLOW_VAULT_ADDRESS,
    abi: CASHFLOW_VAULT_ABI,
    functionName: 'getMultiSigRequestsCount',
    chainId: arcTestnet.id,
    query: {
      refetchInterval: 10000,
    }
  });

  const publicClient = usePublicClient({ chainId: arcTestnet.id });

  const query = useQuery({
    queryKey: ['multiSigRequests', Number(count || 0), address],
    queryFn: async () => {
      if (!publicClient || !count) return [];
      const requestsCount = Number(count);
      const list: MultiSigRequest[] = [];

      for (let i = 0; i < requestsCount; i++) {
        try {
          const reqData = await publicClient.readContract({
            address: CASHFLOW_VAULT_ADDRESS,
            abi: CASHFLOW_VAULT_ABI,
            functionName: 'multiSigRequests',
            args: [BigInt(i)],
          }) as any;

          list.push({
            id: i,
            creator: reqData[0],
            to: reqData[1],
            amount: formatUnits(reqData[2] || BigInt(0), USDC_DECIMALS),
            category: reqData[3] || 'General',
            executed: reqData[4],
            ownerApproved: reqData[5],
            coSignerApproved: reqData[6],
          });
        } catch (e) {
          console.error('Failed to read request', i, e);
        }
      }
      return list.reverse();
    },
    enabled: !!publicClient && count !== undefined,
  });

  const { isDemo } = useTransactionHistory();

  const mockRequests: MultiSigRequest[] = [
    {
      id: 0,
      creator: '0xfb5FEeDA927C63AF2Dd87c81F53eBF6b58512F7b',
      to: '0x8704caa872Ac721e648DBeB9Fd6FA46C396d6Aad',
      amount: '15000.00',
      category: 'Hosting & Infrastructure',
      executed: false,
      ownerApproved: true,
      coSignerApproved: false
    },
    {
      id: 1,
      creator: '0xfb5FEeDA927C63AF2Dd87c81F53eBF6b58512F7b',
      to: '0x51c9dDdB6a900fa2b585dd299e03d12FA4293BC',
      amount: '12500.00',
      category: 'SaaS Security Audit',
      executed: false,
      ownerApproved: false,
      coSignerApproved: false
    },
    {
      id: 2,
      creator: '0x2724caa872Ac721e648DBeB9Fd6FA46C396d6Aad',
      to: '0x321aD72Ac721e648DBeB9Fd6FA46C396d6Aad888e',
      amount: '20000.00',
      category: 'Liquidity Provision',
      executed: true,
      ownerApproved: true,
      coSignerApproved: true
    },
    {
      id: 3,
      creator: '0x2724caa872Ac721e648DBeB9Fd6FA46C396d6Aad',
      to: '0x9812E72Ac721e648DBeB9Fd6FA46C396d6Aad777d',
      amount: '8500.00',
      category: 'Agent Fuel Topup',
      executed: true,
      ownerApproved: true,
      coSignerApproved: true
    }
  ];

  const finalRequests = (query.data && query.data.length > 0) ? query.data : (isDemo ? mockRequests : []);

  return {
    requests: finalRequests,
    isLoading: (query.data && query.data.length > 0) ? false : (isDemo ? false : (countLoading || query.isLoading)),
    refetch: () => {
      refetch();
      query.refetch();
    },
    isDemo: (query.data && query.data.length > 0) ? false : isDemo
  };
}

export function useMultiSigOperations() {
  const { writeContractAsync } = useWriteContract();

  const approveAndExecute = useCallback((requestId: number) => {
    return writeContractAsync({
      address: CASHFLOW_VAULT_ADDRESS,
      abi: CASHFLOW_VAULT_ABI,
      functionName: 'approveAndExecuteRequest',
      args: [BigInt(requestId)],
    });
  }, [writeContractAsync]);

  const setCoSigner = useCallback((coSignerAddress: string) => {
    return writeContractAsync({
      address: CASHFLOW_VAULT_ADDRESS,
      abi: CASHFLOW_VAULT_ABI,
      functionName: 'setCoSigner',
      args: [coSignerAddress as `0x${string}`],
    });
  }, [writeContractAsync]);

  return {
    approveAndExecute,
    setCoSigner,
  };
}

