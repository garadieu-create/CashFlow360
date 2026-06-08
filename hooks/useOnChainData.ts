'use client';

import { useBalance, useReadContract, usePublicClient, useWatchContractEvent } from 'wagmi';
import { formatUnits } from 'viem';
import { USDC_ADDRESS, EURC_ADDRESS, arcTestnet } from '@/lib/arc-config';
import { USDC_ABI, CASHFLOW_VAULT_ADDRESS, CASHFLOW_VAULT_ABI } from '@/lib/contracts';
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

  const writeContractAsync = useCallback(async ({ address, abi, functionName, args }: any) => {
    setIsPending(true);
    setIsSuccess(false);
    setIsError(false);
    setError(null);
    try {
      const hash = await executeContractWrite(address, abi, functionName, args || []);
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

  const writeContract = useCallback(({ address, abi, functionName, args }: any) => {
    writeContractAsync({ address, abi, functionName, args }).catch(() => {});
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

  const formatted = balance ? formatUnits(balance as bigint, USDC_DECIMALS) : '0.00';

  return {
    balance: balance as bigint | undefined,
    formatted,
    isLoading,
    refetch,
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

  const formatted = balance ? formatUnits(balance as bigint, USDC_DECIMALS) : '0.00';

  return {
    balance: balance as bigint | undefined,
    formatted,
    isLoading,
    refetch,
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

  const formatted = balance ? formatUnits(balance as bigint, USDC_DECIMALS) : '0.00';

  return { balance: balance as bigint | undefined, formatted, isLoading };
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

  return {
    balance: data?.value,
    formatted: data?.formatted || '0.00',
    symbol: data?.symbol || 'USDC',
    isLoading,
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
    onLogs(logs) {
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
  const publicClient = usePublicClient({ chainId: arcTestnet.id });

  const query = useQuery({
    queryKey: ['transactions', address, arcTestnet.id],
    queryFn: async () => {
      if (!address || !publicClient) return [];

      const blockNumber = await publicClient.getBlockNumber();
      // Fetch last 5000 blocks to prevent excessive RPC load, or from 0
      const fromBlock = blockNumber > BigInt(5000) ? blockNumber - BigInt(5000) : BigInt(0);

      // Fetch transfer events from USDC contract
      const [sentLogs, receivedLogs] = await Promise.all([
        publicClient.getLogs({
          address: USDC_ADDRESS,
          event: {
            type: 'event',
            name: 'Transfer',
            inputs: [
              { name: 'from', type: 'address', indexed: true },
              { name: 'to', type: 'address', indexed: true },
              { name: 'value', type: 'uint256', indexed: false },
            ],
          },
          args: { from: address },
          fromBlock,
          toBlock: 'latest',
        }),
        publicClient.getLogs({
          address: USDC_ADDRESS,
          event: {
            type: 'event',
            name: 'Transfer',
            inputs: [
              { name: 'from', type: 'address', indexed: true },
              { name: 'to', type: 'address', indexed: true },
              { name: 'value', type: 'uint256', indexed: false },
            ],
          },
          args: { to: address },
          fromBlock,
          toBlock: 'latest',
        }),
      ]);

      const allLogs = [
        ...sentLogs.map(log => ({ log, type: 'outflow' as const })),
        ...receivedLogs.map(log => ({ log, type: 'inflow' as const }))
      ];

      // Optimizing block fetching by extracting unique blocks
      const uniqueBlockNumbers = Array.from(new Set(allLogs.map(x => x.log.blockNumber).filter(Boolean))) as bigint[];
      const blockTimestampMap = new Map<bigint, number>();
      
      // Fetch blocks in parallel chunks
      const CHUNK_SIZE = 10;
      for (let i = 0; i < uniqueBlockNumbers.length; i += CHUNK_SIZE) {
        const chunk = uniqueBlockNumbers.slice(i, i + CHUNK_SIZE);
        await Promise.all(chunk.map(async (bNum) => {
          try {
            const block = await publicClient.getBlock({ blockNumber: bNum });
            blockTimestampMap.set(bNum, Number(block.timestamp));
          } catch(e) {
            console.error('Failed to fetch block', bNum, e);
          }
        }));
      }

      const txs: Transaction[] = allLogs.map(({ log, type }) => {
        const bNum = log.blockNumber;
        const timestamp = (bNum && blockTimestampMap.get(bNum)) || Math.floor(Date.now() / 1000);
        return {
          hash: log.transactionHash as string,
          from: (log.args as any).from as string,
          to: (log.args as any).to as string,
          value: formatUnits((log.args as any).value || BigInt(0), USDC_DECIMALS),
          timestamp,
          type,
          category: type === 'inflow' ? 'Transfer In' : 'Transfer Out',
          blockNumber: bNum || BigInt(0),
        };
      });

      txs.sort((a, b) => b.timestamp - a.timestamp);
      return txs;
    },
    enabled: !!address && !!publicClient,
    refetchInterval: 15000,
    staleTime: 10000,
  });

  return { 
    transactions: query.data || [], 
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
