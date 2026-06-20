import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cross-Chain USDC Bridging & Swap Engine',
  description: 'Bridge USDC across Ethereum, Base, and Solana using Circle CCTP or swap USDC ⇄ EURC on Arc instantly with StableFX.',
  alternates: {
    canonical: 'https://cashflow360.finance/bridge',
  },
};

export default function BridgeLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'CashFlow360 Bridge & StableFX Swap Engine',
    applicationCategory: 'FinanceApplication',
    description: 'Bridge USDC across Ethereum, Base, and Solana using Circle CCTP or swap USDC ⇄ EURC on Arc instantly with StableFX.',
    operatingSystem: 'Web',
    publisher: {
      '@type': 'Organization',
      name: 'CashFlow360',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
