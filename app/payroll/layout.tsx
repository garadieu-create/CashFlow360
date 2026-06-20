import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contractor Escrow Payroll (ERC-8183)',
  description: 'Manage milestones and release secure contractor payments dynamically via smart contract escrows with built-in arbitration.',
  alternates: {
    canonical: 'https://cashflow360.finance/payroll',
  },
};

export default function PayrollLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
