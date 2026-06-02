'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useModal } from '@/context/ModalContext';
import { 
  X, 
  CheckCircle2, 
  AlertOctagon, 
  AlertTriangle, 
  HelpCircle, 
  Loader2, 
  ExternalLink,
  Shield,
  Layers,
  ArrowRight,
  RefreshCw,
  Copy
} from 'lucide-react';
import toast from 'react-hot-toast';

export function GlobalModal() {
  const { activeModal, closeModal } = useModal();
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close modal on ESC keypress
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeModal?.isDismissable) {
        closeModal(activeModal.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal, closeModal]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current && activeModal?.isDismissable) {
      closeModal(activeModal.id);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  if (!activeModal) return null;

  // Icon mapping depending on modal variant
  const getIcon = () => {
    switch (activeModal.type) {
      case 'success':
        return (
          <div className="modal-icon-wrapper success">
            <CheckCircle2 size={32} />
          </div>
        );
      case 'error':
        return (
          <div className="modal-icon-wrapper error">
            <AlertOctagon size={32} />
          </div>
        );
      case 'warning':
        return (
          <div className="modal-icon-wrapper warning">
            <AlertTriangle size={32} />
          </div>
        );
      case 'confirm':
        return (
          <div className="modal-icon-wrapper confirm">
            <HelpCircle size={32} />
          </div>
        );
      case 'loading':
        return (
          <div className="modal-icon-wrapper loading">
            <Loader2 size={32} className="spinning" />
          </div>
        );
      case 'transaction':
        return (
          <div className="modal-icon-wrapper transaction">
            {activeModal.txStatus === 'success' && <CheckCircle2 size={32} style={{ color: 'var(--ph-green)' }} />}
            {activeModal.txStatus === 'failed' && <AlertOctagon size={32} style={{ color: 'var(--ph-red)' }} />}
            {activeModal.txStatus === 'rejected' && <AlertTriangle size={32} style={{ color: 'var(--ph-yellow)' }} />}
            {['pending', 'confirming'].includes(activeModal.txStatus || '') && <Loader2 size={32} className="spinning" style={{ color: 'var(--ph-blue)' }} />}
            {!activeModal.txStatus && <Layers size={32} />}
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      <div 
        ref={overlayRef}
        className="modal-overlay" 
        onClick={handleOverlayClick}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 5, 8, 0.85)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3000,
        }}
      >
        <motion.div 
          className={`card modal-container modal-${activeModal.type}`}
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          style={{ 
            width: '100%', 
            maxWidth: activeModal.type === 'transaction' ? '500px' : '440px', 
            margin: '16px', 
            position: 'relative',
            overflow: 'visible',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
            border: activeModal.type === 'error' ? '1px solid rgba(245, 78, 0, 0.25)' : 
                    activeModal.type === 'success' ? '1px solid rgba(119, 185, 108, 0.25)' : '1px solid var(--border-primary)'
          }}
        >
          {/* Close button - Top right */}
          {activeModal.isDismissable && (
            <button 
              className="btn btn-ghost btn-sm" 
              onClick={() => closeModal(activeModal.id)}
              style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, padding: 6, borderRadius: '50%' }}
              title="Close modal"
            >
              <X size={16} />
            </button>
          )}

          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '24px' }}>
            
            {/* Visual Indicator (Big glowing icon) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {getIcon()}
              <div>
                {activeModal.badge && (
                  <span className={`badge ${
                    activeModal.type === 'error' ? 'badge-red' : 
                    activeModal.type === 'success' ? 'badge-green' : 
                    activeModal.type === 'warning' ? 'badge-yellow' : 'badge-purple'
                  }`} style={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '9px', marginBottom: 4 }}>
                    {activeModal.badge}
                  </span>
                )}
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                  {activeModal.title}
                </h3>
              </div>
            </div>

            {/* Description */}
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              {activeModal.description}
            </p>

            {/* ERROR DETAILS EXPANSION */}
            {activeModal.type === 'error' && activeModal.errorCode && (
              <div style={{ 
                background: 'rgba(245, 78, 0, 0.05)', 
                border: '1px solid rgba(245, 78, 0, 0.15)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 12px',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--ph-red)'
              }}>
                Code: {activeModal.errorCode}
              </div>
            )}

            {/* LOADING PROCESS BAR */}
            {activeModal.type === 'loading' && activeModal.progress !== undefined && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)' }}>
                  <span>Progress</span>
                  <span style={{ fontWeight: 700 }}>{activeModal.progress}%</span>
                </div>
                <div style={{ width: '100%', height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
                  <motion.div 
                    style={{ height: '100%', background: 'var(--ph-red)' }} 
                    animate={{ width: `${activeModal.progress}%` }}
                    transition={{ ease: 'easeInOut', duration: 0.3 }}
                  />
                </div>
              </div>
            )}

            {/* BLOCKCHAIN TX PROGRESS COMPONENT */}
            {activeModal.type === 'transaction' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
                {/* Status indicator banner */}
                <div style={{ 
                  background: activeModal.txStatus === 'success' ? 'var(--ph-green-light)' :
                              activeModal.txStatus === 'failed' ? 'var(--ph-red-light)' :
                              activeModal.txStatus === 'rejected' ? 'rgba(247,165,1,0.06)' : 'var(--bg-elevated)',
                  border: activeModal.txStatus === 'success' ? '1px solid rgba(119,185,108,0.2)' :
                          activeModal.txStatus === 'failed' ? '1px solid rgba(245,78,0,0.2)' : '1px solid var(--border-primary)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <Shield size={14} style={{ color: activeModal.txStatus === 'success' ? 'var(--ph-green)' : 'var(--text-secondary)' }} />
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Status: </span>
                    <strong style={{ 
                      color: activeModal.txStatus === 'success' ? 'var(--ph-green)' :
                             activeModal.txStatus === 'failed' ? 'var(--ph-red)' :
                             activeModal.txStatus === 'rejected' ? 'var(--ph-yellow)' : 'var(--text-primary)'
                    }}>
                      {activeModal.txStatus ? activeModal.txStatus.toUpperCase() : 'INITIALIZING'}
                    </strong>
                  </div>
                </div>

                {/* Vertical blockchain execution steps */}
                {activeModal.txSteps && activeModal.txSteps.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '4px 8px' }}>
                    {activeModal.txSteps.map((step, i) => (
                      <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        {/* Dot indicator */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                          <div style={{ 
                            width: 16, 
                            height: 16, 
                            borderRadius: '50%', 
                            border: step.status === 'success' ? 'none' : '2px solid var(--border-active)',
                            background: step.status === 'success' ? 'var(--ph-green)' : 
                                        step.status === 'pending' ? 'var(--ph-blue)' : 'var(--bg-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 2
                          }}>
                            {step.status === 'success' && <CheckCircle2 size={10} style={{ color: 'white' }} />}
                            {step.status === 'pending' && <div className="spinner" style={{ width: 8, height: 8, border: '1.5px solid white', borderTopColor: 'transparent' }} />}
                          </div>
                          {i < activeModal.txSteps!.length - 1 && (
                            <div style={{ 
                              width: 2, 
                              height: 24, 
                              background: step.status === 'success' ? 'var(--ph-green)' : 'var(--border-primary)',
                              marginTop: 2,
                              marginBottom: 2
                            }} />
                          )}
                        </div>
                        {/* Label */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ 
                            fontSize: 12, 
                            fontWeight: step.status === 'pending' ? 700 : 500,
                            color: step.status === 'success' ? 'var(--text-primary)' :
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
                                className="btn btn-ghost btn-xs" 
                                style={{ padding: 2 }}
                                onClick={() => copyToClipboard(step.txHash!)}
                              >
                                <Copy size={10} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Explorer and Copy hash tools */}
                {activeModal.txHash && (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    paddingTop: 8,
                    borderTop: '1px solid var(--border-secondary)',
                    fontSize: 11
                  }}>
                    <button 
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: 11, padding: '4px 8px' }}
                      onClick={() => copyToClipboard(activeModal.txHash!)}
                    >
                      Copy Transaction Hash
                    </button>
                    {activeModal.explorerUrl && (
                      <a 
                        href={activeModal.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', fontSize: 11 }}
                      >
                        <ExternalLink size={10} /> View on Arcscan
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* BUTTON CONTROLS AND CUSTOM CTAS */}
            {((activeModal.buttons && activeModal.buttons.length > 0) || activeModal.retryAction) && (
              <div style={{ 
                display: 'flex', 
                gap: 12, 
                marginTop: 8,
                paddingTop: 16,
                borderTop: '1px solid var(--border-secondary)'
              }}>
                {activeModal.buttons?.map((btn, index) => (
                  <button
                    key={index}
                    className={`btn ${
                      btn.variant === 'danger' ? 'btn-danger' : 
                      btn.variant === 'secondary' ? 'btn-secondary' : 
                      btn.variant === 'ghost' ? 'btn-ghost' : 'btn-primary'
                    }`}
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={async () => {
                      if (btn.onClick) {
                        try {
                          await btn.onClick();
                        } catch (e) {
                          console.error('Error during modal button click:', e);
                        }
                      }
                      if (btn.closeModalAfterClick ?? true) {
                        closeModal(activeModal.id);
                      }
                    }}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            )}

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
