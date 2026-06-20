'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  TrendingUp, 
  ArrowUpDown, 
  Bell, 
  Cpu, 
  FileText, 
  Radar, 
  Send, 
  Shield, 
  ShoppingBag, 
  Settings, 
  LayoutDashboard, 
  HelpCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface RelatedItem {
  title: string;
  description: string;
  href: string;
  icon: any;
  ctaText: string;
  badge?: string;
}

const contentMapping: Record<string, RelatedItem[]> = {
  '/': [
    {
      title: 'Runway Calculator',
      description: 'Model what-if business stress scenarios and calculate days of operational survival.',
      href: '/runway',
      icon: TrendingUp,
      ctaText: 'Calculate Runway',
      badge: 'Analytical'
    },
    {
      title: 'Contractor Payroll',
      description: 'Deploy milestone-locked job escrows or stream wages continuously with ERC-8183.',
      href: '/payroll',
      icon: FileText,
      ctaText: 'Deploy Escrow',
      badge: 'Treasury'
    },
    {
      title: 'Cross-Chain Radar',
      description: 'Scan and visualize your USDC holdings across Ethereum, Base, Arbitrum, and Arc.',
      href: '/treasury',
      icon: Radar,
      ctaText: 'Scan Holdings'
    }
  ],
  '/runway': [
    {
      title: 'Bridge & Swap',
      description: 'Runway critical? Instantly rebalance treasury by bridging USDC from Ethereum or Base Sepolia.',
      href: '/bridge',
      icon: ArrowUpDown,
      ctaText: 'Bridge USDC Now',
      badge: 'CCTP v2'
    },
    {
      title: 'Set Alert Thresholds',
      description: 'Receive real-time notifications on-chain if cash flow levels drop below safety marks.',
      href: '/alerts',
      icon: Bell,
      ctaText: 'Configure Alerts'
    },
    {
      title: 'AI Swarm Coordinator',
      description: 'Deploy autonomous specialist agents to monitor runway safety and execute rebalancing.',
      href: '/swarm',
      icon: Cpu,
      ctaText: 'Launch Swarm'
    }
  ],
  '/payroll': [
    {
      title: 'Send Instant USDC',
      description: 'Dispatch immediate one-off payments to suppliers or contractors on Arc.',
      href: '/send',
      icon: Send,
      ctaText: 'Send Payment'
    },
    {
      title: 'Runway Projections',
      description: 'Simulate contractor payments as monthly recurring expenses to verify cash runway impact.',
      href: '/runway',
      icon: TrendingUp,
      ctaText: 'Model Runway Impact',
      badge: 'Simulation'
    },
    {
      title: 'Multi-Sig Governance',
      description: 'Add multisig approvals for payroll releases to protect your company treasury.',
      href: '/governance',
      icon: Shield,
      ctaText: 'View Governance'
    }
  ],
  '/bridge': [
    {
      title: 'Treasury Radar',
      description: 'Inspect live USDC balances across testnet networks before staging a bridge transfer.',
      href: '/treasury',
      icon: Radar,
      ctaText: 'Check Radar'
    },
    {
      title: 'Fund Payroll Escrow',
      description: 'Put your newly bridged USDC to work by funding pending milestone payroll jobs.',
      href: '/payroll',
      icon: FileText,
      ctaText: 'Manage Payroll'
    },
    {
      title: 'x402 Marketplace',
      description: 'Monetize cash flow endpoints by exposing them to external AI agent queries.',
      href: '/marketplace',
      icon: ShoppingBag,
      ctaText: 'Expose APIs',
      badge: 'Revenue'
    }
  ],
  '/swarm': [
    {
      title: 'x402 API Marketplace',
      description: 'Configure and commercialize financial endpoints queryable by the autonomous swarm.',
      href: '/marketplace',
      icon: ShoppingBag,
      ctaText: 'Manage Marketplace',
      badge: 'x402 protocol'
    },
    {
      title: 'Alert Monitor',
      description: 'Inspect event triggers, low balance flags, and transaction histories audited by agents.',
      href: '/alerts',
      icon: Bell,
      ctaText: 'Review System Alerts'
    },
    {
      title: 'Architecture Guide',
      description: 'Review the technical implementation guidelines for ERC-8004 and ERC-8183 protocol standards.',
      href: '/docs',
      icon: HelpCircle,
      ctaText: 'Read Docs'
    }
  ],
  '/marketplace': [
    {
      title: 'Swarm Terminal',
      description: 'Observe active queries, rebalance consensus rounds, and agent communication logs.',
      href: '/swarm',
      icon: Cpu,
      ctaText: 'Swarm Console'
    },
    {
      title: 'Integrations Panel',
      description: 'Expose webhook hooks, API integrations, and developer secret keys.',
      href: '/integrations',
      icon: Settings,
      ctaText: 'Manage Keys'
    },
    {
      title: 'Developer Docs',
      description: 'Integrate the x402 HTTP stablecoin nanopayment standard into your own external agent scripts.',
      href: '/docs',
      icon: HelpCircle,
      ctaText: 'APIs Reference'
    }
  ],
  '/alerts': [
    {
      title: 'Webhook Integrations',
      description: 'Route critical low-balance alerts directly to Discord or Telegram channels.',
      href: '/integrations',
      icon: Settings,
      ctaText: 'Setup Webhooks',
      badge: 'System Hook'
    },
    {
      title: 'Runway Stress Simulation',
      description: 'Simulate critical drop alerts under different extra expense values.',
      href: '/runway',
      icon: TrendingUp,
      ctaText: 'Model Alert Scenarios'
    },
    {
      title: 'Vault Governance',
      description: 'Upgrade alerts triggers and lock conditions to multi-sig enforcement policies.',
      href: '/governance',
      icon: Shield,
      ctaText: 'Setup Approvers'
    }
  ]
};

const defaultItems: RelatedItem[] = [
  {
    title: 'Executive Dashboard',
    description: 'Overview of key financial metrics, inflow/outflow ratios, and wallet status.',
    href: '/',
    icon: LayoutDashboard,
    ctaText: 'Main Control Room'
  },
  {
    title: 'Agent Swarm Terminal',
    description: 'Command and configure your autonomous on-chain SME treasury bots.',
    href: '/swarm',
    icon: Cpu,
    ctaText: 'Configure Swarm',
    badge: 'Autonomous'
  },
  {
    title: 'API Integrations',
    description: 'Connect internal reporting and setup webhook alert destinations.',
    href: '/integrations',
    icon: Settings,
    ctaText: 'Settings Panel'
  }
];

export default function RelatedContent() {
  const pathname = usePathname();
  const items = contentMapping[pathname || '/'] || defaultItems;

  return (
    <section className="related-content-section" aria-label="Smart Related Features" style={{ marginTop: 'var(--space-2xl)', paddingTop: 'var(--space-xl)', borderTop: '2px solid var(--border-primary)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-lg)' }}>
        <Sparkles size={16} className="text-primary" style={{ color: 'var(--ph-red)' }} />
        <h2 style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
          Adjacent Workflows & Smart Discovery
        </h2>
      </div>

      <div className="grid-3" style={{ gap: '16px' }}>
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <article 
              key={idx} 
              className="card" 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                borderColor: 'var(--border-primary)',
                background: 'var(--bg-secondary)',
                boxShadow: '4px 4px 0px rgba(0,0,0,0.8)'
              }}
            >
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-primary)', padding: '6px', borderRadius: '4px', color: 'var(--ph-red)' }}>
                    <Icon size={16} />
                  </div>
                  {item.badge && (
                    <span className="badge badge-purple" style={{ fontSize: '8px', padding: '2px 6px' }}>
                      {item.badge}
                    </span>
                  )}
                </div>
                
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'white', marginBottom: '6px' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4, minHeight: '48px' }}>
                  {item.description}
                </p>
              </div>

              <div style={{ padding: '12px 16px', background: 'var(--bg-primary)', borderTop: '1px solid var(--border-secondary)' }}>
                <Link 
                  href={item.href}
                  className="btn btn-sm btn-ghost"
                  style={{ 
                    width: '100%', 
                    justifyContent: 'space-between', 
                    padding: '6px 8px',
                    fontSize: '10px',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                    border: '1px solid var(--border-primary)'
                  }}
                >
                  <span>{item.ctaText}</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
