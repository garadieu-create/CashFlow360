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
          <div style={{ fontSize: 32, opacity: 0.3, marginBottom: 12 }}>📋</div>
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
