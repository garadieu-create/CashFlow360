import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Real-Time D3 Sankey Cash Flow Map',
  description: 'Interactive visualization of SME financial flows, showing real-time revenue streams, operational expenses, and escrow lockups.',
  alternates: {
    canonical: 'https://cashflow360.finance/flow',
  },
};

export default function FlowLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
