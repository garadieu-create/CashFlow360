import type { Metadata } from 'next';
import './globals.css';
import { Web3Provider } from '@/components/providers/Web3Provider';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'CashFlow360 — SME Cash Flow Intelligence Platform',
  description: 'Analytics-first cash flow management for SMEs on Arc. Real-time visualization, predictive forecasting, and cross-chain treasury management powered by Circle USDC.',
  keywords: ['cashflow', 'sme', 'finance', 'usdc', 'arc', 'blockchain', 'analytics'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Web3Provider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              className: 'toast-custom',
              duration: 4000,
              style: {
                background: '#2C2E38',
                color: '#FFFFFF',
                border: '1px solid rgba(255,255,255,0.08)',
                fontSize: '13px',
                fontFamily: 'Inter, sans-serif',
              },
            }}
          />
        </Web3Provider>
      </body>
    </html>
  );
}
