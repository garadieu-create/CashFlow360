import type { Metadata } from 'next';
import './globals.css';
import { Web3Provider } from '@/components/providers/Web3Provider';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  metadataBase: new URL('https://cashflow360.finance'),
  title: {
    default: 'CashFlow360 | AI Cash Flow Intelligence for SMEs',
    template: '%s | CashFlow360',
  },
  description: 'Institutional-grade on-chain cash flow intelligence, real-time analytics, predictive forecasting, and automated payroll for SMEs on Arc. Powered by Circle USDC.',
  keywords: ['cashflow', 'sme', 'finance', 'usdc', 'arc', 'blockchain', 'analytics', 'treasury', 'escrow', 'passkey'],
  alternates: {
    canonical: './',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://cashflow360.finance',
    siteName: 'CashFlow360',
    title: 'CashFlow360 | AI Cash Flow Intelligence for SMEs',
    description: 'Analytics-first cash flow management for SMEs on Arc. Real-time visualization, predictive forecasting, and cross-chain treasury management powered by Circle USDC.',
    images: [
      {
        url: '/logo.png',
        width: 512,
        height: 512,
        alt: 'CashFlow360 Platform Branding Logo',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'CashFlow360 | AI Cash Flow Intelligence for SMEs',
    description: 'Analytics-first cash flow management for SMEs on Arc. Real-time visualization, predictive forecasting, and cross-chain treasury management powered by Circle USDC.',
    images: ['/logo.png'],
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicon-64x64.png', sizes: '64x64', type: 'image/png' },
      { url: '/favicon-128x128.png', sizes: '128x128', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        color: '#f54e00',
      },
    ],
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#111216" />
        <meta name="msapplication-TileColor" content="#111216" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Web3Provider>
          <a href="#main-content" className="skip-link">Skip to main content</a>
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
