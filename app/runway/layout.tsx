import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Runway Analytics & Scenario Forecasts',
  description: 'Simulate business revenue and expense scenario models to forecast your SME runway days in real-time.',
  alternates: {
    canonical: 'https://cashflow360.finance/runway',
  },
};

export default function RunwayLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
