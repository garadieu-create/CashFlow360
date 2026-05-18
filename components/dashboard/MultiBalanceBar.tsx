import { motion } from 'framer-motion';

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
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            USDC (ERC-20)
          </span>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700 }}>
            ${parseFloat(usdcBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div style={{ width: 1, height: 40, background: 'var(--border-primary)' }} />
        <div>
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            EURC
          </span>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700 }}>
            €{parseFloat(eurcBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div style={{ width: 1, height: 40, background: 'var(--border-primary)' }} />
        <div>
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Native (Gas)
          </span>
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
