'use client';

import React from 'react';
import { 
  Modal, ModalHeader, ModalBody, ModalFooter, ModalActions, ModalIcon, ModalProgress
} from './ModalBase';
import { ModalConfig, TransactionStep } from '@/context/ModalContext';
import { Shield, ExternalLink, RefreshCw, AlertTriangle, Info } from 'lucide-react';
import toast from 'react-hot-toast';

interface ModalVariantProps {
  config: ModalConfig;
  onClose: (id: string) => void;
}

/* ==========================================================================
   1. CONFIRMATION MODAL
   ========================================================================== */
export function ConfirmationModal({ config, onClose }: ModalVariantProps) {
  const handleClose = () => onClose(config.id!);

  return (
    <Modal type={config.type} isDismissable={config.isDismissable} onClose={handleClose}>
      <div style={{ padding: '24px' }}>
        <ModalHeader>
          <ModalIcon type={config.type} />
          <div>
            {config.badge && (
              <span className={`badge ${
                config.type === 'destructive' ? 'badge-red' : 
                config.type === 'warning' ? 'badge-yellow' : 'badge-blue'
              }`} style={{ fontSize: '9px', marginBottom: 4, letterSpacing: '0.04em' }}>
                {config.badge}
              </span>
            )}
            <h3 style={{ fontSize: 16, fontWeight: 800, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              {config.title}
            </h3>
          </div>
        </ModalHeader>

        <ModalBody>
          <p style={{ margin: 0 }}>{config.description}</p>
          {config.children}
        </ModalBody>

        {config.buttons && config.buttons.length > 0 && (
          <ModalFooter>
            <ModalActions>
              {config.buttons.map((btn, i) => (
                <button
                  key={i}
                  className={`btn ${
                    btn.variant === 'danger' ? 'btn-primary' : 
                    btn.variant === 'secondary' ? 'btn-secondary' : 
                    btn.variant === 'ghost' ? 'btn-ghost' : 'btn-primary'
                  }`}
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    background: btn.variant === 'danger' ? 'var(--ph-red)' : undefined,
                    borderColor: btn.variant === 'danger' ? 'var(--text-primary)' : undefined,
                    color: btn.variant === 'danger' ? '#FFFFFF' : undefined,
                  }}
                  onClick={async () => {
                    if (btn.onClick) {
                      try {
                        await btn.onClick();
                      } catch (err) {
                        console.error(err);
                      }
                    }
                    if (btn.closeModalAfterClick !== false) {
                      handleClose();
                    }
                  }}
                >
                  {btn.label}
                </button>
              ))}
            </ModalActions>
          </ModalFooter>
        )}
      </div>
    </Modal>
  );
}

/* ==========================================================================
   2. LOADING MODAL
   ========================================================================== */
export function LoadingModal({ config }: ModalVariantProps) {
  return (
    <Modal type="loading" isDismissable={false} onClose={() => {}}>
      <div style={{ padding: '24px' }}>
        <ModalHeader>
          <ModalIcon type="loading" />
          <div>
            {config.badge && (
              <span className="badge badge-purple" style={{ fontSize: '9px', marginBottom: 4, letterSpacing: '0.04em' }}>
                {config.badge}
              </span>
            )}
            <h3 style={{ fontSize: 16, fontWeight: 800, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              {config.title}
            </h3>
          </div>
        </ModalHeader>

        <ModalBody>
          <p style={{ margin: 0 }}>{config.description}</p>
          {config.progress !== undefined && <ModalProgress progress={config.progress} />}
          {config.children}
        </ModalBody>
      </div>
    </Modal>
  );
}

/* ==========================================================================
   3. SUCCESS MODAL
   ========================================================================== */
export function SuccessModal({ config, onClose }: ModalVariantProps) {
  const handleClose = () => onClose(config.id!);

  return (
    <Modal type="success" isDismissable={config.isDismissable} onClose={handleClose}>
      <div style={{ padding: '24px' }}>
        <ModalHeader>
          <ModalIcon type="success" />
          <div>
            {config.badge && (
              <span className="badge badge-green" style={{ fontSize: '9px', marginBottom: 4, letterSpacing: '0.04em' }}>
                {config.badge}
              </span>
            )}
            <h3 style={{ fontSize: 16, fontWeight: 800, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              {config.title}
            </h3>
          </div>
        </ModalHeader>

        <ModalBody>
          <p style={{ margin: 0 }}>{config.description}</p>
          {config.children}
        </ModalBody>

        {config.buttons && config.buttons.length > 0 && (
          <ModalFooter>
            <ModalActions>
              {config.buttons.map((btn, i) => (
                <button
                  key={i}
                  className={`btn ${
                    btn.variant === 'secondary' ? 'btn-secondary' : 'btn-primary'
                  }`}
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={async () => {
                    if (btn.onClick) {
                      try {
                        await btn.onClick();
                      } catch (err) {
                        console.error(err);
                      }
                    }
                    if (btn.closeModalAfterClick !== false) {
                      handleClose();
                    }
                  }}
                >
                  {btn.label}
                </button>
              ))}
            </ModalActions>
          </ModalFooter>
        )}
      </div>
    </Modal>
  );
}

/* ==========================================================================
   4. ERROR MODAL
   ========================================================================== */
export function ErrorModal({ config, onClose }: ModalVariantProps) {
  const handleClose = () => onClose(config.id!);

  return (
    <Modal type="error" isDismissable={config.isDismissable} onClose={handleClose}>
      <div style={{ padding: '24px' }}>
        <ModalHeader>
          <ModalIcon type="error" />
          <div>
            {config.badge && (
              <span className="badge badge-red" style={{ fontSize: '9px', marginBottom: 4, letterSpacing: '0.04em' }}>
                {config.badge}
              </span>
            )}
            <h3 style={{ fontSize: 16, fontWeight: 800, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              {config.title}
            </h3>
          </div>
        </ModalHeader>

        <ModalBody>
          <p style={{ margin: 0 }}>{config.description}</p>
          {config.errorCode && (
            <div style={{ 
              background: 'rgba(245, 78, 0, 0.05)', 
              border: '1px solid rgba(245, 78, 0, 0.15)',
              padding: '8px 12px',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--ph-red)',
              textTransform: 'uppercase'
            }}>
              ERROR CODE: {config.errorCode}
            </div>
          )}
          {config.children}
        </ModalBody>

        <ModalFooter>
          <ModalActions>
            {config.buttons?.map((btn, i) => (
              <button
                key={i}
                className={`btn ${btn.variant === 'secondary' ? 'btn-secondary' : 'btn-primary'}`}
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={async () => {
                  if (btn.onClick) {
                    await btn.onClick();
                  }
                  if (btn.closeModalAfterClick !== false) {
                    handleClose();
                  }
                }}
              >
                {btn.label}
              </button>
            )) || (
              <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleClose}>
                Dismiss
              </button>
            )}

            {config.retryAction && !config.buttons?.some(b => b.onClick === config.retryAction) && (
              <button
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: 'center', gap: 6 }}
                onClick={async () => {
                  if (config.retryAction) {
                    await config.retryAction();
                  }
                  handleClose();
                }}
              >
                <RefreshCw size={12} />
                Retry
              </button>
            )}
          </ModalActions>
        </ModalFooter>
      </div>
    </Modal>
  );
}

/* ==========================================================================
   5. WARNING MODAL
   ========================================================================== */
export function WarningModal({ config, onClose }: ModalVariantProps) {
  const handleClose = () => onClose(config.id!);

  return (
    <Modal type="warning" isDismissable={config.isDismissable} onClose={handleClose}>
      <div style={{ padding: '24px' }}>
        <ModalHeader>
          <ModalIcon type="warning" />
          <div>
            {config.badge && (
              <span className="badge badge-yellow" style={{ fontSize: '9px', marginBottom: 4, letterSpacing: '0.04em' }}>
                {config.badge}
              </span>
            )}
            <h3 style={{ fontSize: 16, fontWeight: 800, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              {config.title}
            </h3>
          </div>
        </ModalHeader>

        <ModalBody>
          <div style={{ 
            display: 'flex', 
            gap: 12, 
            background: 'rgba(247, 165, 1, 0.05)', 
            borderLeft: '4px solid var(--ph-yellow)', 
            padding: 12 
          }}>
            <AlertTriangle size={18} style={{ color: 'var(--ph-yellow)', flexShrink: 0 }} />
            <div style={{ fontSize: 12, lineHeight: 1.5 }}>
              <strong>Operational Warning:</strong> {config.description}
            </div>
          </div>
          {config.children}
        </ModalBody>

        {config.buttons && config.buttons.length > 0 && (
          <ModalFooter>
            <ModalActions>
              {config.buttons.map((btn, i) => (
                <button
                  key={i}
                  className={`btn ${
                    btn.variant === 'danger' ? 'btn-primary' : 
                    btn.variant === 'secondary' ? 'btn-secondary' : 'btn-primary'
                  }`}
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    background: btn.variant === 'danger' ? 'var(--ph-red)' : undefined,
                  }}
                  onClick={async () => {
                    if (btn.onClick) {
                      await btn.onClick();
                    }
                    if (btn.closeModalAfterClick !== false) {
                      handleClose();
                    }
                  }}
                >
                  {btn.label}
                </button>
              ))}
            </ModalActions>
          </ModalFooter>
        )}
      </div>
    </Modal>
  );
}

/* ==========================================================================
   6. TRANSACTION MODAL
   ========================================================================== */
export function TransactionModal({ config, onClose }: ModalVariantProps) {
  const handleClose = () => onClose(config.id!);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Transaction hash copied!');
  };

  return (
    <Modal type="transaction" isDismissable={config.isDismissable} onClose={handleClose} maxWidth="500px">
      <div style={{ padding: '24px' }}>
        <ModalHeader>
          <ModalIcon type="transaction" txStatus={config.txStatus} />
          <div>
            {config.badge && (
              <span className="badge badge-blue" style={{ fontSize: '9px', marginBottom: 4, letterSpacing: '0.04em' }}>
                {config.badge}
              </span>
            )}
            <h3 style={{ fontSize: 16, fontWeight: 800, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              {config.title}
            </h3>
          </div>
        </ModalHeader>

        <ModalBody>
          <p style={{ margin: 0 }}>{config.description}</p>

          {/* Status banner */}
          <div style={{
            background: 
              config.txStatus === 'success' ? 'var(--ph-green-light)' :
              config.txStatus === 'failed' ? 'var(--ph-red-light)' :
              config.txStatus === 'rejected' ? 'rgba(247,165,1,0.06)' : 'var(--bg-elevated)',
            border: 
              config.txStatus === 'success' ? '1px solid rgba(119,185,108,0.2)' :
              config.txStatus === 'failed' ? '1px solid rgba(245,78,0,0.2)' : '1px solid var(--border-primary)',
            padding: '10px 14px',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: 'var(--font-mono)',
          }}>
            <Shield size={14} style={{ 
              color: config.txStatus === 'success' ? 'var(--ph-green)' : 'var(--text-secondary)' 
            }} />
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>STATUS: </span>
              <strong style={{
                color: 
                  config.txStatus === 'success' ? 'var(--ph-green)' :
                  config.txStatus === 'failed' ? 'var(--ph-red)' :
                  config.txStatus === 'rejected' ? 'var(--ph-yellow)' : 'var(--text-primary)'
              }}>
                {(config.txStatus || 'preparing').toUpperCase()}
              </strong>
            </div>
          </div>

          {/* Horizontal/Vertical pipeline steps */}
          {config.txSteps && config.txSteps.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '4px 8px' }}>
              {config.txSteps.map((step, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  {/* Pipeline node */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                      width: 18,
                      height: 18,
                      border: step.status === 'success' ? 'none' : '2px solid var(--text-primary)',
                      background: 
                        step.status === 'success' ? 'var(--ph-green)' :
                        step.status === 'pending' ? 'var(--ph-blue)' : 'var(--bg-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 2,
                    }}>
                      {step.status === 'success' && <span style={{ color: 'white', fontSize: 10 }}>✓</span>}
                      {step.status === 'pending' && (
                        <div className="spinner" style={{ 
                          width: 8, height: 8, border: '1.5px solid white', borderTopColor: 'transparent' 
                        }} />
                      )}
                    </div>
                    {idx < config.txSteps!.length - 1 && (
                      <div style={{
                        width: 2,
                        height: 22,
                        background: step.status === 'success' ? 'var(--ph-green)' : 'var(--border-primary)',
                        marginTop: 2,
                        marginBottom: 2,
                      }} />
                    )}
                  </div>
                  {/* Step label & secondary tools */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{
                      fontSize: 12,
                      fontWeight: step.status === 'pending' ? 700 : 500,
                      fontFamily: 'var(--font-mono)',
                      color: 
                        step.status === 'success' ? 'var(--text-primary)' :
                        step.status === 'pending' ? 'var(--ph-blue)' : 'var(--text-tertiary)'
                    }}>
                      {step.label}
                    </span>
                    {step.txHash && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-tertiary)' }}>
                          {step.txHash.slice(0, 8)}...{step.txHash.slice(-8)}
                        </span>
                        <button
                          type="button"
                          className="btn-xs"
                          style={{ padding: '1px 4px', border: '1px solid var(--border-secondary)', fontFamily: 'var(--font-mono)', fontSize: 9 }}
                          onClick={() => copyToClipboard(step.txHash!)}
                        >
                          COPY
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Block explorer links */}
          {config.txHash && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: 12,
              borderTop: '1px solid var(--border-secondary)',
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
            }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: 10, padding: '4px 8px' }}
                onClick={() => copyToClipboard(config.txHash!)}
              >
                COPY TX HASH
              </button>
              {config.explorerUrl && (
                <a
                  href={config.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', fontSize: 10 }}
                >
                  <ExternalLink size={10} /> VIEW ON EXPLORER
                </a>
              )}
            </div>
          )}

          {config.children}
        </ModalBody>

        {config.buttons && config.buttons.length > 0 && (
          <ModalFooter>
            <ModalActions>
              {config.buttons.map((btn, i) => (
                <button
                  key={i}
                  className={`btn ${
                    btn.variant === 'secondary' ? 'btn-secondary' : 'btn-primary'
                  }`}
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={async () => {
                    if (btn.onClick) {
                      await btn.onClick();
                    }
                    if (btn.closeModalAfterClick !== false) {
                      handleClose();
                    }
                  }}
                >
                  {btn.label}
                </button>
              ))}
            </ModalActions>
          </ModalFooter>
        )}
      </div>
    </Modal>
  );
}

/* ==========================================================================
   7. SYSTEM MODAL
   ========================================================================== */
export function SystemModal({ config, onClose }: ModalVariantProps) {
  const handleClose = () => onClose(config.id!);

  return (
    <Modal type="system" isDismissable={config.isDismissable} onClose={handleClose} maxWidth="520px">
      <div style={{ padding: '24px' }}>
        <ModalHeader>
          <ModalIcon type="system" />
          <div>
            <span className="badge badge-purple" style={{ fontSize: '9px', marginBottom: 4, letterSpacing: '0.04em' }}>
              {config.badge || 'SYSTEM ANNOUNCEMENT'}
            </span>
            <h3 style={{ fontSize: 16, fontWeight: 800, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              {config.title}
            </h3>
          </div>
        </ModalHeader>

        <ModalBody>
          <div style={{ 
            background: 'var(--bg-elevated)', 
            border: '2px solid var(--text-primary)', 
            padding: 16,
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            lineHeight: 1.5,
            color: 'var(--text-primary)',
          }}>
            {config.description}
          </div>
          {config.children}
        </ModalBody>

        <ModalFooter>
          <ModalActions>
            {config.buttons?.map((btn, i) => (
              <button
                key={i}
                className={`btn ${btn.variant === 'secondary' ? 'btn-secondary' : 'btn-primary'}`}
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={async () => {
                  if (btn.onClick) {
                    await btn.onClick();
                  }
                  if (btn.closeModalAfterClick !== false) {
                    handleClose();
                  }
                }}
              >
                {btn.label}
              </button>
            )) || (
              <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleClose}>
                Acknowledge & Dismiss
              </button>
            )}
          </ModalActions>
        </ModalFooter>
      </div>
    </Modal>
  );
}
