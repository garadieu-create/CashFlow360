import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Real-Time Financial Alerts & Triggers',
  description: 'Monitor account balance thresholds, track payroll escrow status milestones, and configure webhook event notifications.',
  alternates: {
    canonical: 'https://cashflow360.finance/alerts',
  },
};

export default function AlertsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
