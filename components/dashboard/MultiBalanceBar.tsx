import { motion } from 'framer-motion';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { TokenOrChainIcon } from '@/components/ui/USDCIcon';

interface MultiBalanceBarProps {
  usdcBalance: string;
  eurcBalance: string;
  nativeBalance: string;
  address?: string;
}

export function MultiBalanceBar({ usdcBalance, eurcBalance, nativeBalance, address }: MultiBalanceBarProps) {
  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      style={{ marginBottom: 'var(--space-lg)', overflowX: 'auto' }}
    >
      <div className="card-body-compact" style={{ display: 'flex', gap: 'var(--space-2xl)', alignItems: 'center', minWidth: 'max-content' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <TokenOrChainIcon name="usdc" size={14} />
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              USDC (ERC-20)
            </span>
            <InfoTooltip
              title="USDC (ERC-20)"
              definition="USD Coin on the Arc network, representing dollar-pegged cash."
              importance="Acts as the primary payment and settlement instrument for customer billing, supplier invoices, and runway computations."
              calculation="ERC-20 standard balance read"
              goodVsBad="Pegged 1:1 to USD. Zero volatility risk."
              guidance="This is your core operational asset. All cash flow maps and runways are calculated against this balance."
            />
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700 }}>
            ${parseFloat(usdcBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div style={{ width: 1, height: 40, background: 'var(--border-primary)' }} />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <TokenOrChainIcon name="eurc" size={14} />
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              EURC
            </span>
            <InfoTooltip
              title="EURC Stablecoin"
              definition="Euro Coin (EURC) is Circle's euro-pegged stablecoin, 100% backed by euros."
              importance="Enables seamless cross-border trade with European clients or suppliers without foreign exchange lag or wire fees."
              calculation="ERC-20 standard balance read"
              goodVsBad="Pegged 1:1 to EUR."
              guidance="Perfect for locking in euro-denominated invoices or hedging currency risk. Swap USDC to EURC using our Swap tool."
            />
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700 }}>
            €{parseFloat(eurcBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div style={{ width: 1, height: 40, background: 'var(--border-primary)' }} />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <TokenOrChainIcon name="arc" size={14} />
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Native (Gas)
            </span>
            <InfoTooltip
              title="Native Gas Token"
              definition="The gas token of the blockchain. In the Arc network, this is USDC itself used as native gas!"
              importance="Required to execute on-chain transactions, pay fees, and submit smart contract interactions."
              calculation="Direct blockchain network balance"
              goodVsBad="Extremely predictable and affordable on Arc (less than $0.001 per transaction)."
              guidance="Unlike other chains that require a separate utility token (like ETH or MATIC) for gas, Arc is optimized for USDC-first gas execution!"
            />
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700 }}>
            {parseFloat(nativeBalance).toLocaleString('en-US', { minimumFractionDigits: 4 })}
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
          Wallet: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
