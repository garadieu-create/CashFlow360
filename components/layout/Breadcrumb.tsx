'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href: string;
  isLast: boolean;
}

const routeMapping: Record<string, { section: string; label: string }> = {
  '/': { section: 'Analytics', label: 'Dashboard' },
  '/flow': { section: 'Analytics', label: 'Cash Flow Map' },
  '/runway': { section: 'Analytics', label: 'Runway Calculator' },
  '/swarm': { section: 'Lepton Agents', label: 'AI Swarm Terminal' },
  '/marketplace': { section: 'Lepton Agents', label: 'x402 Marketplace' },
  '/treasury': { section: 'Treasury', label: 'Cross-Chain Radar' },
  '/send': { section: 'Treasury', label: 'Send USDC' },
  '/bridge': { section: 'Treasury', label: 'Bridge & Swap' },
  '/payroll': { section: 'Treasury', label: 'Contractor Payroll' },
  '/governance': { section: 'Treasury', label: 'Multi-Sig Governance' },
  '/alerts': { section: 'System', label: 'Alerts' },
  '/integrations': { section: 'System', label: 'Integrations' },
  '/modals': { section: 'System', label: 'Modal Showcase' },
  '/docs': { section: 'System', label: 'Documentation' },
};

export default function Breadcrumb() {
  const pathname = usePathname();
  const currentRoute = routeMapping[pathname || '/'] || { section: 'System', label: 'Page' };

  const items: BreadcrumbItem[] = [
    { label: 'Home', href: '/', isLast: pathname === '/' },
  ];

  if (pathname !== '/') {
    items.push({
      label: currentRoute.section,
      href: pathname === '/docs' ? '/docs' : '#', // fallback or placeholder if section is not directly clickable
      isLast: false,
    });
    items.push({
      label: currentRoute.label,
      href: pathname,
      isLast: true,
    });
  }

  // Schema.org Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: `https://cashflow360.finance${item.href === '#' ? pathname : item.href}`,
    })),
  };

  return (
    <nav aria-label="Breadcrumb" className="breadcrumb-nav">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ol className="breadcrumb-list" style={{ display: 'flex', alignItems: 'center', gap: '6px', listStyle: 'none', padding: 0, margin: 0 }}>
        {items.map((item, index) => (
          <li key={index} style={{ display: 'flex', alignItems: 'center', fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
            {index > 0 && <ChevronRight size={10} style={{ margin: '0 6px', color: 'var(--text-tertiary)' }} />}
            {item.isLast ? (
              <span
                aria-current="page"
                style={{
                  color: 'var(--text-primary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: 700
                }}
              >
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href === '#' ? pathname : item.href}
                className="breadcrumb-link"
                style={{
                  color: 'var(--text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'color var(--transition-fast)'
                }}
              >
                {index === 0 && <Home size={12} style={{ marginTop: '-1px' }} />}
                <span>{item.label}</span>
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
