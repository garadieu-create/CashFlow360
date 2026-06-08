'use client';

import { createConfig } from 'wagmi';
import { arcTestnet } from './arc-config';
import { http } from 'wagmi';
import { sepolia, baseSepolia, arbitrumSepolia } from 'wagmi/chains';

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
