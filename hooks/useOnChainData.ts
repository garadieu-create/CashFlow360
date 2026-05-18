'use client';

import { useAccount, useBalance, useReadContract, usePublicClient } from 'wagmi';
import { formatUnits } from 'viem';
import { USDC_ADDRESS, EURC_ADDRESS, arcTestnet } from '@/lib/arc-config';
import { USDC_ABI } from '@/lib/contracts';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

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

  const query = useQuery({
    queryKey: ['transactions', address, arcTestnet.id],
    queryFn: async () => {
      if (!address || !publicClient) return [];

      const blockNumber = await publicClient.getBlockNumber();
      // Fetch last 5000 blocks to prevent excessive RPC load, or from 0
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
          value: formatUnits((log.args as any).value || 0n, USDC_DECIMALS),
          timestamp,
          type,
          category: type === 'inflow' ? 'Transfer In' : 'Transfer Out',
          blockNumber: bNum || 0n,
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
