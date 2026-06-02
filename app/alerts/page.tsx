'use client';

import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  TrendingDown, 
  AlertTriangle, 
  DollarSign, 
  ArrowUpRight, 
  Trash2, 
  Edit3, 
  Plus, 
  Check, 
  X, 
  Play, 
  Pause,
  AlertCircle
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface AlertRule {
  id: number;
  type: string;
  condition: string;
  status: 'active' | 'paused';
  severity: 'critical' | 'warning' | 'info';
}

const initialAlertRules: AlertRule[] = [
  { id: 1, type: 'Low Balance', condition: 'USDC balance < $1,000', status: 'active', severity: 'critical' },
  { id: 2, type: 'Large Outflow', condition: 'Single transfer > $5,000', status: 'active', severity: 'warning' },
  { id: 3, type: 'Unusual Pattern', condition: 'Daily outflow > 3x average', status: 'active', severity: 'warning' },
  { id: 4, type: 'Runway Alert', condition: 'Runway drops below 30 days', status: 'active', severity: 'critical' },
  { id: 5, type: 'Inflow Spike', condition: 'Daily inflow > 5x average', status: 'paused', severity: 'info' },
];

export default function AlertsPage() {
  const [rules, setRules] = useState<AlertRule[]>(initialAlertRules);
  const [activeRule, setActiveRule] = useState<AlertRule | null>(null);
  
  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Form states
  const [ruleType, setRuleType] = useState('Low Balance');
  const [condition, setCondition] = useState('USDC balance < $500');
  const [severity, setSeverity] = useState<'critical' | 'warning' | 'info'>('warning');
  const [status, setStatus] = useState<'active' | 'paused'>('active');

  const handleToggleStatus = (id: number) => {
    setRules(prev => prev.map(r => {
      if (r.id === id) {
        const nextStatus = r.status === 'active' ? 'paused' : 'active';
        toast.success(`Rule "${r.type}" is now ${nextStatus}`);
        return { ...r, status: nextStatus };
      }
      return r;
    }));
  };

  const openCreateModal = () => {
    setRuleType('Low Balance');
    setCondition('USDC balance < $1,000');
    setSeverity('critical');
    setStatus('active');
    setIsCreateOpen(true);
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!condition) {
      toast.error('Please specify a condition rule.');
      return;
    }
    const newRule: AlertRule = {
      id: Date.now(),
      type: ruleType,
      condition,
      severity,
      status,
    };
    setRules(prev => [...prev, newRule]);
    setIsCreateOpen(false);
    toast.success(`Alert rule "${ruleType}" created successfully!`);
  };

  const openEditModal = (rule: AlertRule) => {
    setActiveRule(rule);
    setRuleType(rule.type);
    setCondition(rule.condition);
    setSeverity(rule.severity);
    setStatus(rule.status);
    setIsEditOpen(true);
  };

  const handleEditRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRule) return;
    
    setRules(prev => prev.map(r => {
      if (r.id === activeRule.id) {
        return {
          ...r,
          type: ruleType,
          condition,
          severity,
          status,
        };
      }
      return r;
    }));
    setIsEditOpen(false);
    setActiveRule(null);
    toast.success('Alert rule updated successfully!');
  };

  const openDeleteModal = (rule: AlertRule) => {
    setActiveRule(rule);
    setIsDeleteOpen(true);
  };

  const handleDeleteRule = () => {
    if (!activeRule) return;
    setRules(prev => prev.filter(r => r.id !== activeRule.id));
    setIsDeleteOpen(false);
    toast.success(`Rule "${activeRule.type}" deleted.`);
    setActiveRule(null);
  };

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
              <button className="btn btn-primary" onClick={openCreateModal}>
                <Plus size={14} /> Create Alert
              </button>
            </div>

            {/* Active Alert Rules */}
            <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="card-header">
                <span className="card-title">Alert Rules</span>
                <span className="badge badge-yellow">{rules.filter(r => r.status === 'active').length} active</span>
              </div>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Condition</th>
                      <th>Severity</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rules.map((rule) => (
                      <tr key={rule.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            {rule.type === 'Low Balance' && <DollarSign size={14} style={{ color: 'var(--ph-red)' }} />}
                            {rule.type === 'Large Outflow' && <ArrowUpRight size={14} style={{ color: 'var(--ph-yellow)' }} />}
                            {rule.type === 'Runway Alert' && <TrendingDown size={14} style={{ color: 'var(--ph-red)' }} />}
                            {rule.type === 'Unusual Pattern' && <AlertTriangle size={14} style={{ color: 'var(--ph-purple)' }} />}
                            {rule.type}
                          </span>
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
                          <button 
                            className={`badge ${rule.status === 'active' ? 'badge-green' : 'badge-yellow'}`}
                            onClick={() => handleToggleStatus(rule.id)}
                            style={{ border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                            title="Click to toggle status"
                          >
                            {rule.status === 'active' ? <Pause size={10} /> : <Play size={10} />}
                            {rule.status}
                          </button>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 8 }}>
                            <button 
                              className="btn btn-ghost btn-sm"
                              onClick={() => openEditModal(rule)}
                              title="Edit rule"
                            >
                              <Edit3 size={12} />
                            </button>
                            <button 
                              className="btn btn-ghost btn-sm"
                              onClick={() => openDeleteModal(rule)}
                              style={{ color: 'var(--ph-red)' }}
                              title="Delete rule"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
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

      {/* CREATE ALERT MODAL */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="modal-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}>
            <motion.div 
              className="card"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{ width: '100%', maxWidth: '480px', margin: '20px' }}
            >
              <div className="card-header">
                <span className="card-title">Create Alert Rule</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setIsCreateOpen(false)}>
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleCreateRule} className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="input-group">
                  <label className="input-label">Rule Type</label>
                  <select className="input" value={ruleType} onChange={(e) => setRuleType(e.target.value)}>
                    <option value="Low Balance">Low Balance</option>
                    <option value="Large Outflow">Large Outflow</option>
                    <option value="Unusual Pattern">Unusual Pattern</option>
                    <option value="Runway Alert">Runway Alert</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Condition (Expression)</label>
                  <input 
                    type="text" 
                    className="input input-mono" 
                    value={condition} 
                    onChange={(e) => setCondition(e.target.value)} 
                    placeholder="e.g. USDC balance < $1,000"
                    required
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Severity Level</label>
                  <select className="input" value={severity} onChange={(e) => setSeverity(e.target.value as any)}>
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Initial Status</label>
                  <select className="input" value={status} onChange={(e) => setStatus(e.target.value as any)}>
                    <option value="active">Active (Enabled)</option>
                    <option value="paused">Paused (Disabled)</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    Create Rule
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT ALERT MODAL */}
      <AnimatePresence>
        {isEditOpen && (
          <div className="modal-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}>
            <motion.div 
              className="card"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{ width: '100%', maxWidth: '480px', margin: '20px' }}
            >
              <div className="card-header">
                <span className="card-title">Edit Alert Rule</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setIsEditOpen(false)}>
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleEditRule} className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="input-group">
                  <label className="input-label">Rule Type</label>
                  <select className="input" value={ruleType} onChange={(e) => setRuleType(e.target.value)}>
                    <option value="Low Balance">Low Balance</option>
                    <option value="Large Outflow">Large Outflow</option>
                    <option value="Unusual Pattern">Unusual Pattern</option>
                    <option value="Runway Alert">Runway Alert</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Condition (Expression)</label>
                  <input 
                    type="text" 
                    className="input input-mono" 
                    value={condition} 
                    onChange={(e) => setCondition(e.target.value)} 
                    placeholder="e.g. USDC balance < $1,000"
                    required
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Severity Level</label>
                  <select className="input" value={severity} onChange={(e) => setSeverity(e.target.value as any)}>
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Status</label>
                  <select className="input" value={status} onChange={(e) => setStatus(e.target.value as any)}>
                    <option value="active">Active (Enabled)</option>
                    <option value="paused">Paused (Disabled)</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsEditOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {isDeleteOpen && activeRule && (
          <div className="modal-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}>
            <motion.div 
              className="card"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{ width: '100%', maxWidth: '400px', margin: '20px', borderColor: 'var(--ph-red)' }}
            >
              <div className="card-header" style={{ borderBottom: 'none' }}>
                <span className="card-title" style={{ color: 'var(--ph-red)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertCircle size={16} />
                  Delete Alert Rule
                </span>
                <button className="btn btn-ghost btn-sm" onClick={() => setIsDeleteOpen(false)}>
                  <X size={16} />
                </button>
              </div>
              <div className="card-body" style={{ paddingTop: 0 }}>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
                  Are you sure you want to delete the <strong>{activeRule.type}</strong> alert rule?
                  This will immediately halt automated event polling and trigger notifications for this condition.
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsDeleteOpen(false)}>
                    Cancel
                  </button>
                  <button type="button" className="btn btn-primary" style={{ flex: 1, background: 'var(--ph-red)' }} onClick={handleDeleteRule}>
                    Confirm Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
