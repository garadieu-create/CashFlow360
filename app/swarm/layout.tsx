import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Autonomous Swarm Intelligence Agents',
  description: 'Deploy cooperative on-chain AI agent swarms to monitor business metrics, manage escrow contracts, and execute audits.',
  alternates: {
    canonical: 'https://cashflow360.finance/swarm',
  },
};

export default function SwarmLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
