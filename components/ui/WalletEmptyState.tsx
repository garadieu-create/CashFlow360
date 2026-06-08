import { motion } from 'framer-motion';

interface WalletEmptyStateProps {
  title: string;
  description: string;
  svgIcon: React.ReactNode;
}

export function WalletEmptyState({ title, description, svgIcon }: WalletEmptyStateProps) {
  return (
    <div className="empty-state">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ marginBottom: '24px', opacity: 0.8, display: 'flex', justifyContent: 'center' }}>
          {svgIcon}
        </div>
        <h2 className="empty-state-title">{title}</h2>
        <p className="empty-state-text" style={{ marginBottom: '24px' }}>
          {description}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Initialize Smart Account
          </button>
        </div>
      </motion.div>
    </div>
  );
}
