import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Circle & Arc SDK Integration Architecture',
  description: 'Technical integrations breakdown including Circle Developer Controlled Wallets, CCTP, Swap Kit, and Arc native USDC gas fees.',
  alternates: {
    canonical: 'https://cashflow360.finance/integrations',
  },
};

export default function IntegrationsLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What blockchain does CashFlow360 build on?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'CashFlow360 is built natively on the Arc network, using USDC as the native transaction gas token to enable stable and predictable fees.',
        },
      },
      {
        '@type': 'Question',
        name: 'How does CashFlow360 integrate Circle APIs?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The platform leverages Circle Developer Controlled Wallets, Cross-Chain Transfer Protocol (CCTP) for instant bridging, and modular smart accounts for biometric passkey authorization.',
        },
      },
    ],
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
