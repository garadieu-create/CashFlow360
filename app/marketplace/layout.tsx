import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Developer API Marketplace',
  description: 'Expose corporate cash flow endpoints to third-party Web3 AI agents. Leverage Circle stablecoins for pay-per-query microtransactions.',
  alternates: {
    canonical: 'https://cashflow360.finance/marketplace',
  },
};

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
