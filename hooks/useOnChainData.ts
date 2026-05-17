'use client';

import { useAccount, useBalance, useReadContract, usePublicClient } from 'wagmi';
import { formatUnits } from 'viem';
import { USDC_ADDRESS, EURC_ADDRESS, arcTestnet } from '@/lib/arc-config';
import { USDC_ABI } from '@/lib/contracts';
import { useState, useEffect, useCallback } from 'react';

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

export function useTransactionHistory() {
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId: arcTestnet.id });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTransactions = useCallback(async () => {
    if (!address || !publicClient) return;

    setIsLoading(true);
    try {
      const blockNumber = await publicClient.getBlockNumber();
      const fromBlock = blockNumber > 5000n ? blockNumber - 5000n : 0n;

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

      const txs: Transaction[] = [];

      for (const log of sentLogs) {
        const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
        txs.push({
          hash: log.transactionHash,
          from: (log.args as any).from,
          to: (log.args as any).to,
          value: formatUnits((log.args as any).value || 0n, USDC_DECIMALS),
          timestamp: Number(block.timestamp),
          type: 'outflow',
          category: 'Transfer Out',
          blockNumber: log.blockNumber,
        });
      }

      for (const log of receivedLogs) {
        const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
        txs.push({
          hash: log.transactionHash,
          from: (log.args as any).from,
          to: (log.args as any).to,
          value: formatUnits((log.args as any).value || 0n, USDC_DECIMALS),
          timestamp: Number(block.timestamp),
          type: 'inflow',
          category: 'Transfer In',
          blockNumber: log.blockNumber,
        });
      }

      txs.sort((a, b) => b.timestamp - a.timestamp);
      setTransactions(txs);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [address, publicClient]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return { transactions, isLoading, refetch: fetchTransactions };
}

export function useCashFlowMetrics(transactions: Transaction[]) {
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
}
