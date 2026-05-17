import { defineChain } from 'viem';

export const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network'] },
  },
  blockExplorers: {
    default: { name: 'Arcscan', url: 'https://testnet.arcscan.app' },
  },
  testnet: true,
});

export const USDC_ADDRESS = '0x3600000000000000000000000000000000000000' as const;
export const EURC_ADDRESS = '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a' as const;

export const EXPLORER_URL = 'https://testnet.arcscan.app';

export const getExplorerTxUrl = (hash: string) => `${EXPLORER_URL}/tx/${hash}`;
export const getExplorerAddressUrl = (address: string) => `${EXPLORER_URL}/address/${address}`;
