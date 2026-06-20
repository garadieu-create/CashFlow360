import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documentation & API References',
  description: 'Deep dive into the system architecture, smart contract addresses, and integration guides of CashFlow360.',
  alternates: {
    canonical: 'https://cashflow360.finance/docs',
  },
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    name: 'CashFlow360 Documentation & API References',
    headline: 'Technical Architecture and Protocol Implementation of CashFlow360',
    description: 'Deep dive into the system architecture, smart contract addresses, and integration guides of CashFlow360.',
    inLanguage: 'en-US',
    publisher: {
      '@type': 'Organization',
      name: 'CashFlow360',
      logo: {
        '@type': 'ImageObject',
        url: 'https://cashflow360.finance/logo.png',
      },
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
