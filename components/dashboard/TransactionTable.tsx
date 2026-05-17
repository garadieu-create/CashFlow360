'use client';

import { Transaction } from '@/hooks/useOnChainData';
import { getExplorerTxUrl } from '@/lib/arc-config';
import { ExternalLink, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  isLoading: boolean;
}

export default function TransactionTable({ transactions, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="card-body" style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-3xl)' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="card-body">
        <div className="empty-state" style={{ padding: 'var(--space-2xl)' }}>
          <div style={{ marginBottom: 12, opacity: 0.8 }}>
            <svg width="48" height="48" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="12" y="16" width="40" height="40" rx="4" stroke="var(--border-primary)" strokeWidth="4" />
              <rect x="24" y="8" width="16" height="16" rx="2" stroke="url(#table_grad)" strokeWidth="4" fill="var(--bg-surface)" />
              <path d="M24 36H40M24 44H32" stroke="url(#table_grad)" strokeWidth="4" strokeLinecap="round" />
              <defs>
                <linearGradient id="table_grad" x1="24" y1="8" x2="40" y2="44" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#B62AD9" />
                  <stop offset="1" stopColor="#E26DF8" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <p className="empty-state-text">
            No USDC transactions found. Use the faucet to get testnet USDC, then send or receive tokens.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Amount</th>
            <th>From / To</th>
            <th>Category</th>
            <th>Time</th>
            <th>Tx</th>
          </tr>
        </thead>
        <tbody>
          {transactions.slice(0, 50).map((tx) => (
            <tr key={`${tx.hash}-${tx.type}`}>
              <td>
                {tx.type === 'inflow' ? (
                  <span className="badge badge-green">
                    <ArrowDownRight size={12} /> In
                  </span>
                ) : (
                  <span className="badge badge-red">
                    <ArrowUpRight size={12} /> Out
                  </span>
                )}
              </td>
              <td className="cell-amount">
                {tx.type === 'inflow' ? '+' : '-'}${parseFloat(tx.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </td>
              <td className="cell-mono" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {tx.type === 'inflow' ? (
                  <span title={tx.from}>{tx.from.slice(0, 8)}...{tx.from.slice(-6)}</span>
                ) : (
                  <span title={tx.to}>{tx.to.slice(0, 8)}...{tx.to.slice(-6)}</span>
                )}
              </td>
              <td>
                <span className="badge badge-blue">{tx.category}</span>
              </td>
              <td style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                {new Date(tx.timestamp * 1000).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </td>
              <td>
                <a
                  href={getExplorerTxUrl(tx.hash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost btn-sm"
                  title="View on Arcscan"
                >
                  <ExternalLink size={12} />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
