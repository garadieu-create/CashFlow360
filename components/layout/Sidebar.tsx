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
  Code,
  Menu,
  X,
  Shield,
  Cpu,
  ShoppingBag,
} from 'lucide-react';
import { useLoading } from '@/components/providers/LoadingProvider';
import { motion, AnimatePresence } from 'framer-motion';

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
    section: 'Lepton Agents',
    items: [
      { label: 'AI Swarm Terminal', href: '/swarm', icon: Cpu },
      { label: 'x402 Marketplace', href: '/marketplace', icon: ShoppingBag },
    ],
  },
  {
    section: 'Treasury',
    items: [
      { label: 'Cross-Chain Radar', href: '/treasury', icon: Radar },
      { label: 'Send USDC', href: '/send', icon: Send },
      { label: 'Bridge & Swap', href: '/bridge', icon: ArrowUpDown },
      { label: 'Contractor Payroll', href: '/payroll', icon: FileText },
      { label: 'Multi-Sig Governance', href: '/governance', icon: Shield },
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
  const { startLoading } = useLoading();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const toggleDrawer = () => setIsDrawerOpen(!isDrawerOpen);
  const closeDrawer = () => setIsDrawerOpen(false);

  const handleLinkClick = (href: string) => {
    if (pathname !== href) {
      startLoading(`nav-${href}`);
    }
  };

  return (
    <>
      {/* 1. PERSISTENT DESKTOP SIDEBAR */}
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
                    onClick={() => handleLinkClick(item.href)}
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
          <Link 
            href="/docs" 
            onClick={() => handleLinkClick('/docs')}
            className="sidebar-link"
          >
            <FileText />
            Documentation
          </Link>
        </div>
      </aside>

      {/* 2. MOBILE BOTTOM NAVIGATION BAR (Thumb Zone Optimized) */}
      <div className="mobile-bottom-nav">
        <Link 
          href="/" 
          onClick={() => handleLinkClick('/')}
          className={`mobile-nav-item ${pathname === '/' ? 'active' : ''}`}
        >
          <LayoutDashboard />
          <span>Dash</span>
        </Link>
        <Link 
          href="/send" 
          onClick={() => handleLinkClick('/send')}
          className={`mobile-nav-item ${pathname === '/send' ? 'active' : ''}`}
        >
          <Send />
          <span>Send</span>
        </Link>
        <Link 
          href="/runway" 
          onClick={() => handleLinkClick('/runway')}
          className={`mobile-nav-item ${pathname === '/runway' ? 'active' : ''}`}
        >
          <TrendingUp />
          <span>Runway</span>
        </Link>
        <Link 
          href="/bridge" 
          onClick={() => handleLinkClick('/bridge')}
          className={`mobile-nav-item ${pathname === '/bridge' ? 'active' : ''}`}
        >
          <ArrowUpDown />
          <span>Bridge</span>
        </Link>
        <button className={`mobile-nav-item ${isDrawerOpen ? 'active' : ''}`} onClick={toggleDrawer}>
          <Menu />
          <span>More</span>
        </button>
      </div>

      {/* 3. MOBILE OVERLAY DRAWER (Sliding Navigation Drawer) */}
      <AnimatePresence>
        {isDrawerOpen && (
          <motion.div
            className="mobile-drawer-overlay"
            onClick={closeDrawer}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="mobile-drawer-content"
              onClick={(e) => e.stopPropagation()} // Prevent overlay close on content tap
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            >
              <div className="mobile-drawer-header">
                <div>
                  <div style={{ fontSize: 13, fontWeight: 900, fontFamily: 'var(--font-mono)' }}>
                    CASHFLOW<span style={{ color: 'var(--ph-red)' }}>360</span>
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    System Navigation
                  </div>
                </div>
                <button className="mobile-drawer-close" onClick={closeDrawer}>
                  <X size={14} />
                </button>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {navItems.map((section) => (
                  <div key={section.section}>
                    <div style={{
                      fontSize: 9,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: 'var(--text-tertiary)',
                      marginBottom: '8px'
                    }}>
                      {section.section
                    }</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`sidebar-link ${isActive ? 'active' : ''}`}
                            onClick={() => {
                              closeDrawer();
                              handleLinkClick(item.href);
                            }}
                            style={{ border: isActive ? '1px solid #FFF' : '1px solid transparent' }}
                          >
                            <Icon size={14} />
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{
                borderTop: '1px solid var(--border-primary)',
                paddingTop: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <a
                  href="https://testnet.arcscan.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sidebar-link"
                  style={{ fontSize: 12 }}
                >
                  <ExternalLink size={12} />
                  Arcscan Explorer
                </a>
                <a
                  href="https://faucet.circle.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sidebar-link"
                  style={{ fontSize: 12 }}
                >
                  <ExternalLink size={12} />
                  Get Testnet USDC
                </a>
                <Link
                  href="/docs"
                  className="sidebar-link"
                  style={{ fontSize: 12 }}
                  onClick={() => {
                    closeDrawer();
                    handleLinkClick('/docs');
                  }}
                >
                  <FileText size={12} />
                  Documentation
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
