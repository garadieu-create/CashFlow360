import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Component Modal Previews',
  description: 'Interactive modals visual playground for CashFlow360.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ModalsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
