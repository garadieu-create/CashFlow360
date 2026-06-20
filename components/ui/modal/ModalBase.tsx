'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { 
  X, CheckCircle2, AlertOctagon, AlertTriangle, HelpCircle, Loader2, Shield, Info
} from 'lucide-react';

/* ==========================================================================
   1. MODAL PORTAL & ACCESSIBILITY FOCUS TRAP
   ========================================================================== */
export interface ModalPortalProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  isDismissable?: boolean;
}

export function ModalPortal({ children, isOpen, onClose, isDismissable = true }: ModalPortalProps) {
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const portalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isDismissable) {
          onClose();
          return;
        }

        if (e.key === 'Tab' && portalRef.current) {
          const focusable = portalRef.current.querySelectorAll<HTMLElement>(
            'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]'
          );
          if (focusable.length === 0) return;

          const first = focusable[0];
          const last = focusable[focusable.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === first) {
              last.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === last) {
              first.focus();
              e.preventDefault();
            }
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);

      // Focus management
      const timer = setTimeout(() => {
        if (portalRef.current) {
          const focusable = portalRef.current.querySelectorAll<HTMLElement>(
            'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]'
          );
          
          if (focusable.length > 0) {
            // Focus primary/danger button first if available, otherwise first focusable element
            const primaryBtn = Array.from(focusable).find(
              el => el.classList.contains('btn-primary') || el.classList.contains('btn-danger')
            );
            if (primaryBtn) {
              primaryBtn.focus();
            } else {
              focusable[0].focus();
            }
          } else {
            portalRef.current.focus();
          }
        }
      }, 80);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        clearTimeout(timer);
        if (previousFocusRef.current) {
          previousFocusRef.current.focus();
        }
      };
    }
  }, [isOpen, onClose, isDismissable]);

  if (!isOpen) return null;

  return createPortal(
    <div ref={portalRef} className="modal-portal-wrapper" style={{ position: 'relative', zIndex: 3000 }}>
      {children}
    </div>,
    document.body
  );
}

/* ==========================================================================
   2. MODAL OVERLAY
   ========================================================================== */
export interface ModalOverlayProps {
  children: React.ReactNode;
  onClose: () => void;
  isDismissable?: boolean;
}

export function ModalOverlay({ children, onClose, isDismissable = true }: ModalOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current && isDismissable) {
      onClose();
    }
  };

  return (
    <div
      ref={overlayRef}
      className="modal-overlay"
      onClick={handleClick}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
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
        padding: '16px',
      }}
    >
      {children}
    </div>
  );
}

/* ==========================================================================
   3. STRUCTURAL WRAPPERS & NEO-BRUTALIST STYLING
   ========================================================================== */
export interface ModalProps {
  children: React.ReactNode;
  type: string;
  isDismissable?: boolean;
  onClose: () => void;
  maxWidth?: string;
}

export function Modal({ children, type, isDismissable = true, onClose, maxWidth = '460px' }: ModalProps) {
  const accentColor = 
    type === 'error' || type === 'destructive' ? 'var(--ph-red)' :
    type === 'success' ? 'var(--ph-green)' :
    type === 'warning' ? 'var(--ph-yellow)' : 'var(--ph-blue)';

  return (
    <motion.div
      className={`card modal-container modal-${type}`}
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.98 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{
        width: '100%',
        maxWidth,
        position: 'relative',
        overflow: 'visible',
        border: `2px solid ${accentColor}`,
        boxShadow: '8px 8px 0px rgba(0, 0, 0, 1)',
        background: 'var(--bg-surface)',
        borderRadius: 0,
      }}
    >
      {/* Top Border Accent Line */}
      <div style={{
        position: 'absolute',
        top: -2,
        left: -2,
        right: -2,
        height: 4,
        background: accentColor,
        zIndex: 1,
      }} />

      {/* Dismiss Button */}
      {isDismissable && (
        <button
          className="btn btn-ghost btn-sm"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 10,
            padding: 6,
            border: '1px solid var(--border-primary)',
            background: 'var(--bg-elevated)',
            borderRadius: 0,
          }}
          title="Close dialog"
        >
          <X size={16} />
        </button>
      )}

      {children}
    </motion.div>
  );
}

export function ModalHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      borderBottom: '1px solid var(--border-secondary)',
      paddingBottom: 16,
    }}>
      {children}
    </div>
  );
}

export function ModalBody({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 13,
      color: 'var(--text-secondary)',
      lineHeight: 1.6,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      padding: '16px 0',
    }}>
      {children}
    </div>
  );
}

export function ModalFooter({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex',
      gap: 12,
      borderTop: '1px solid var(--border-secondary)',
      paddingTop: 16,
    }}>
      {children}
    </div>
  );
}

export function ModalActions({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex',
      gap: 12,
      width: '100%',
    }}>
      {children}
    </div>
  );
}

/* ==========================================================================
   4. VISUAL SUB-COMPONENTS
   ========================================================================== */
export function ModalIcon({ type, txStatus }: { type: string; txStatus?: string }) {
  const getColors = () => {
    switch (type) {
      case 'success':
        return { bg: 'rgba(119, 185, 108, 0.1)', color: 'var(--ph-green)' };
      case 'error':
      case 'destructive':
        return { bg: 'rgba(245, 78, 0, 0.1)', color: 'var(--ph-red)' };
      case 'warning':
        return { bg: 'rgba(247, 165, 1, 0.1)', color: 'var(--ph-yellow)' };
      case 'transaction':
        if (txStatus === 'success') return { bg: 'rgba(119, 185, 108, 0.1)', color: 'var(--ph-green)' };
        if (txStatus === 'failed') return { bg: 'rgba(245, 78, 0, 0.1)', color: 'var(--ph-red)' };
        if (txStatus === 'rejected') return { bg: 'rgba(247, 165, 1, 0.1)', color: 'var(--ph-yellow)' };
        return { bg: 'rgba(29, 74, 255, 0.1)', color: 'var(--ph-blue)' };
      default:
        return { bg: 'rgba(29, 74, 255, 0.1)', color: 'var(--ph-blue)' };
    }
  };

  const { bg, color } = getColors();

  const iconStyle: React.CSSProperties = {
    width: 48,
    height: 48,
    border: `2px solid ${color}`,
    background: bg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color,
    boxShadow: '2px 2px 0px rgba(0, 0, 0, 1)',
  };

  if (type === 'success') return <div style={iconStyle}><CheckCircle2 size={24} /></div>;
  if (type === 'error' || type === 'destructive') return <div style={iconStyle}><AlertOctagon size={24} /></div>;
  if (type === 'warning') return <div style={iconStyle}><AlertTriangle size={24} /></div>;
  if (type === 'confirm') return <div style={iconStyle}><HelpCircle size={24} /></div>;
  if (type === 'loading') return <div style={iconStyle}><Loader2 size={24} className="spinning" /></div>;
  if (type === 'system') return <div style={iconStyle}><Info size={24} /></div>;
  
  if (type === 'transaction') {
    if (txStatus === 'success') return <div style={iconStyle}><CheckCircle2 size={24} /></div>;
    if (txStatus === 'failed') return <div style={iconStyle}><AlertOctagon size={24} /></div>;
    if (txStatus === 'rejected') return <div style={iconStyle}><AlertTriangle size={24} /></div>;
    return <div style={iconStyle}><Loader2 size={24} className="spinning" /></div>;
  }

  return <div style={iconStyle}><Shield size={24} /></div>;
}

export function ModalProgress({ progress }: { progress: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4, width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
        <span>PROCESSING TRANSACTION</span>
        <span style={{ fontWeight: 700 }}>{progress}%</span>
      </div>
      <div style={{ width: '100%', height: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)', borderRadius: 0, overflow: 'hidden' }}>
        <motion.div
          style={{ height: '100%', background: 'var(--ph-red)' }}
          animate={{ width: `${progress}%` }}
          transition={{ ease: 'easeInOut', duration: 0.3 }}
        />
      </div>
    </div>
  );
}

/* ==========================================================================
   5. ERROR BOUNDARY WRAPPER
   ========================================================================== */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ModalErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Modal Error Boundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 16, border: '2px solid var(--ph-red)', background: 'rgba(245, 78, 0, 0.05)', color: 'var(--ph-red)', fontFamily: 'var(--font-mono)' }}>
          <h4 style={{ fontWeight: 800, fontSize: 13, marginBottom: 8 }}>MODAL RENDER FAILURE</h4>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{this.state.error?.message || 'Check browser console.'}</p>
        </div>
      );
    }
    return this.props.children;
  }
}
