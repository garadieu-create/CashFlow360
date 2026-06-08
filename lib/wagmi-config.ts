'use client';

import { createConfig } from 'wagmi';
import { arcTestnet } from './arc-config';
import { http } from 'wagmi';
import { sepolia, baseSepolia, arbitrumSepolia } from 'viem/chains';

export const wagmiConfig = createConfig({
  chains: [arcTestnet, sepolia, baseSepolia, arbitrumSepolia],
  transports: {
    [arcTestnet.id]: http('https://rpc.testnet.arc.network'),
    [sepolia.id]: http(),
    [baseSepolia.id]: http(),
    [arbitrumSepolia.id]: http(),
  },
  ssr: true,
});

export const circlePaymasterConfig = {
  apiKey: process.env.NEXT_PUBLIC_CIRCLE_KIT_KEY || 'sandbox_kit_key_placeholder',
  endpoints: {
    sepolia: 'https://api.circle.com/v1/w3s/paymaster/sepolia',
    baseSepolia: 'https://api.circle.com/v1/w3s/paymaster/baseSepolia',
    arbitrumSepolia: 'https://api.circle.com/v1/w3s/paymaster/arbitrumSepolia',
  },
  feeToken: 'USDC',
  sponsorshipPolicyId: 'sp_default_bridge_policy'
};
