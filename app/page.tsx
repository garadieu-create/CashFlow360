import { Metadata } from 'next';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import DashboardContent from '@/components/dashboard/DashboardContent';
import RelatedContent from '@/components/ui/RelatedContent';

export const metadata: Metadata = {
  title: 'Dashboard | AI Cash Flow Intelligence for SMEs',
  description: 'Manage and forecast SME cash flows, run predictive runway analytics, and deploy autonomous agent swarms on Arc.',
  alternates: {
    canonical: 'https://cashflow360.finance/',
  },
};

export default function HomePage() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'CashFlow360',
    url: 'https://cashflow360.finance/',
    logo: 'https://cashflow360.finance/logo.png',
    sameAs: [
      'https://github.com/garadieu-create/CashFlow360',
    ],
  };

  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'CashFlow360',
    operatingSystem: 'Web',
    applicationCategory: 'FinanceApplication',
    description: 'Analytics-first cash flow management for SMEs on Arc. Real-time visualization, predictive forecasting, and cross-chain treasury management powered by Circle USDC.',
    offers: {
      '@type': 'Offer',
      price: '0.00',
      priceCurrency: 'USD',
    },
  };

  return (
    <div className="app-layout">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <Sidebar />
      <main className="app-main" id="main-content">
        <Topbar title="Dashboard" />
        <div className="app-content">
          <DashboardContent />
          <RelatedContent />
        </div>
      </main>
    </div>
  );
}
