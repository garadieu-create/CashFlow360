import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Multi-Sig Policy & Biometric Passkey Governance',
  description: 'Manage corporate spending limits and authorize high-value transactions using co-signing policies backed by device-bound passkeys.',
  alternates: {
    canonical: 'https://cashflow360.finance/governance',
  },
};

export default function GovernanceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
