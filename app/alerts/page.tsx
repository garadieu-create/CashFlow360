'use client';

import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { motion } from 'framer-motion';
import { Bell, TrendingDown, AlertTriangle, DollarSign, ArrowUpRight } from 'lucide-react';

const alertRules = [
  { id: 1, type: 'Low Balance', condition: 'USDC balance < $1,000', status: 'active', severity: 'critical' },
  { id: 2, type: 'Large Outflow', condition: 'Single transfer > $5,000', status: 'active', severity: 'warning' },
  { id: 3, type: 'Unusual Pattern', condition: 'Daily outflow > 3x average', status: 'active', severity: 'warning' },
  { id: 4, type: 'Runway Alert', condition: 'Runway drops below 30 days', status: 'active', severity: 'critical' },
  { id: 5, type: 'Inflow Spike', condition: 'Daily inflow > 5x average', status: 'paused', severity: 'info' },
];

export default function AlertsPage() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <Topbar title="Alerts" />
        <div className="app-content">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="page-header">
              <div>
                <h1 className="page-title">Alert System</h1>
                <p className="page-subtitle">
                  On-chain event monitoring • Automated notifications for cash flow anomalies
                </p>
              </div>
              <button className="btn btn-primary">
                <Bell size={14} /> Create Alert
              </button>
            </div>

            {/* Active Alert Rules */}
            <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="card-header">
                <span className="card-title">Alert Rules</span>
                <span className="badge badge-yellow">{alertRules.filter(r => r.status === 'active').length} active</span>
              </div>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Condition</th>
                      <th>Severity</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alertRules.map((rule) => (
                      <tr key={rule.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {rule.type === 'Low Balance' && <DollarSign size={14} style={{ display: 'inline', marginRight: 4 }} />}
                          {rule.type === 'Large Outflow' && <ArrowUpRight size={14} style={{ display: 'inline', marginRight: 4 }} />}
                          {rule.type === 'Runway Alert' && <TrendingDown size={14} style={{ display: 'inline', marginRight: 4 }} />}
                          {rule.type === 'Unusual Pattern' && <AlertTriangle size={14} style={{ display: 'inline', marginRight: 4 }} />}
                          {rule.type}
                        </td>
                        <td className="cell-mono">{rule.condition}</td>
                        <td>
                          <span className={`badge ${
                            rule.severity === 'critical' ? 'badge-red' :
                            rule.severity === 'warning' ? 'badge-yellow' :
                            'badge-blue'
                          }`}>
                            {rule.severity}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${rule.status === 'active' ? 'badge-green' : 'badge-yellow'}`}>
                            {rule.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
