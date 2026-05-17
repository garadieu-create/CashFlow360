'use client';

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { arcTestnet } from './arc-config';
import { http } from 'wagmi';
import { sepolia, baseSepolia, arbitrumSepolia } from 'wagmi/chains';

export const wagmiConfig = getDefaultConfig({
  appName: 'CashFlow360',
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || 'cashflow360-demo-project',
  chains: [arcTestnet, sepolia, baseSepolia, arbitrumSepolia],
  transports: {
    [arcTestnet.id]: http('https://rpc.testnet.arc.network'),
    [sepolia.id]: http(),
    [baseSepolia.id]: http(),
    [arbitrumSepolia.id]: http(),
  },
  ssr: true,
});
