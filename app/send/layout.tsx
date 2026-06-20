import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Send USDC & Global Stablecoin Transfers',
  description: 'Fast, secure on-chain USDC payments for contractors and suppliers, optimized for sub-cent gas fees on Arc.',
  alternates: {
    canonical: 'https://cashflow360.finance/send',
  },
};

export default function SendLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
