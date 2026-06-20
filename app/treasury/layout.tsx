import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Treasury Radar & Cross-Chain Balances',
  description: 'Unify and visualize your SME stablecoin balances across Ethereum, Base, Arbitrum, and Arc using Circle developer wallets.',
  alternates: {
    canonical: 'https://cashflow360.finance/treasury',
  },
};

export default function TreasuryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
