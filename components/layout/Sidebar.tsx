'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Radar,
  TrendingUp,
  Bell,
  Send,
  ArrowUpDown,
  Settings,
  ExternalLink,
  FileText,
} from 'lucide-react';

const navItems = [
  {
    section: 'Analytics',
    items: [
      { label: 'Dashboard', href: '/', icon: LayoutDashboard },
      { label: 'Cash Flow Map', href: '/flow', icon: ArrowLeftRight },
      { label: 'Runway Calculator', href: '/runway', icon: TrendingUp },
    ],
  },
  {
    section: 'Treasury',
    items: [
      { label: 'Cross-Chain Radar', href: '/treasury', icon: Radar },
      { label: 'Send USDC', href: '/send', icon: Send },
      { label: 'Bridge & Swap', href: '/bridge', icon: ArrowUpDown },
    ],
  },
  {
    section: 'System',
    items: [
      { label: 'Alerts', href: '/alerts', icon: Bell },
      { label: 'Integrations', href: '/integrations', icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="app-sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">C</div>
        <div>
          <div className="sidebar-logo-text">CashFlow360</div>
          <div className="sidebar-logo-badge">SME Finance</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((section) => (
          <div key={section.section}>
            <div className="sidebar-section-label">{section.section}</div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <Icon />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <a
          href="https://testnet.arcscan.app"
          target="_blank"
          rel="noopener noreferrer"
          className="sidebar-link"
        >
          <ExternalLink />
          Arcscan Explorer
        </a>
        <a
          href="https://faucet.circle.com"
          target="_blank"
          rel="noopener noreferrer"
          className="sidebar-link"
        >
          <ExternalLink />
          Get Testnet USDC
        </a>
        <Link href="/docs" className="sidebar-link">
          <FileText />
          Documentation
        </Link>
      </div>
    </aside>
  );
}
