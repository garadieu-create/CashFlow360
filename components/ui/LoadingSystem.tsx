'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Loader2 } from 'lucide-react';

// ============================================
// 1. Skeleton Component
// ============================================
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  variant?: 'rect' | 'circle' | 'text';
}

export function Skeleton({
  width = '100%',
  height = '16px',
  variant = 'rect',
  style,
  className = '',
  ...props
}: SkeletonProps) {
  const getShapeStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'circle':
        return { borderRadius: '50%' };
      case 'text':
        return { height: '12px', marginTop: '4px', marginBottom: '4px' };
      default:
        return { borderRadius: '0px' }; // Strict Brutalist sharp corners
    }
  };

  return (
    <div
      className={`brutalist-skeleton ${className}`}
      style={{
        width,
        height,
        ...getShapeStyles(),
        ...style,
      }}
      aria-label="Loading content..."
      role="status"
      {...props}
    />
  );
}

// ============================================
// 2. LoadingButton Component
// ============================================
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  successText?: string;
  errorText?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  successDuration?: number;
}

export function LoadingButton({
  children,
  isLoading = false,
  loadingText,
  successText = 'Success',
  errorText = 'Error',
  variant = 'primary',
  size = 'md',
  successDuration = 2000,
  onClick,
  disabled,
  style,
  className = '',
  ...props
}: LoadingButtonProps) {
  const [buttonState, setButtonState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Capture stable dimensions before switching to loading to prevent layout shifts
  useEffect(() => {
    if (buttonRef.current && buttonState === 'idle') {
      const rect = buttonRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setDimensions({ width: rect.width, height: rect.height });
      }
    }
  }, [children, buttonState]);

  useEffect(() => {
    if (isLoading) {
      setButtonState('loading');
    } else if (buttonState === 'loading') {
      // Transition from loading to idle
      setButtonState('idle');
    }
  }, [isLoading]);

  const handleOnClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (buttonState !== 'idle' || disabled) return;
    if (onClick) {
      onClick(e);
    }
  };

  // Determine classes
  const getButtonClass = () => {
    const base = 'btn';
    let varClass = 'btn-primary';
    if (variant === 'secondary') varClass = 'btn-secondary';
    if (variant === 'ghost') varClass = 'btn-ghost';
    if (variant === 'danger') varClass = 'btn-secondary'; // Custom style mappings for layout

    let sizeClass = '';
    if (size === 'sm') sizeClass = 'btn-sm';
    if (size === 'lg') sizeClass = 'btn-lg';

    return `${base} ${varClass} ${sizeClass} ${className}`;
  };

  const getStyleOverride = (): React.CSSProperties => {
    const overrides: React.CSSProperties = { ...style };
    if (dimensions && buttonState !== 'idle') {
      overrides.width = `${dimensions.width}px`;
      overrides.height = `${dimensions.height}px`;
      overrides.minWidth = `${dimensions.width}px`;
      overrides.minHeight = `${dimensions.height}px`;
    }
    if (variant === 'danger') {
      overrides.borderColor = 'var(--ph-red)';
      overrides.color = 'var(--ph-red)';
      overrides.background = 'rgba(245, 78, 0, 0.05)';
    }
    return overrides;
  };

  return (
    <button
      ref={buttonRef}
      className={getButtonClass()}
      style={getStyleOverride()}
      onClick={handleOnClick}
      disabled={buttonState !== 'idle' || disabled}
      type="button"
      {...props}
    >
      <AnimatePresence mode="wait">
        {buttonState === 'loading' && (
          <motion.span
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Loader2 className="premium-spinner" style={{ width: 14, height: 14 }} />
            <span>{loadingText || 'Processing...'}</span>
          </motion.span>
        )}

        {buttonState === 'success' && (
          <motion.span
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--ph-green)' }}
          >
            <Check size={14} />
            <span>{successText}</span>
          </motion.span>
        )}

        {buttonState === 'error' && (
          <motion.span
            key="error"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--ph-red)' }}
          >
            <X size={14} />
            <span>{errorText}</span>
          </motion.span>
        )}

        {buttonState === 'idle' && (
          <motion.span
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

// ============================================
// 3. LoadingCard Component
// ============================================
export function LoadingCard({ title = 'Card Title', lines = 3 }) {
  return (
    <div className="card motion-scale-in">
      <div className="card-header">
        <Skeleton width="120px" height="14px" />
        <Skeleton width="40px" height="12px" />
      </div>
      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {Array.from({ length: lines }).map((_, idx) => (
          <Skeleton
            key={idx}
            width={idx === lines - 1 ? '60%' : '100%'}
            height="14px"
            variant="text"
          />
        ))}
      </div>
    </div>
  );
}

// ============================================
// 4. LoadingTable Component
// ============================================
export function LoadingTable({ rows = 4, cols = 4 }) {
  return (
    <div className="table-container motion-fade-in" style={{ border: '2px solid var(--text-primary)', background: 'var(--bg-secondary)', padding: '1px' }}>
      <table className="data-table" style={{ width: '100%' }}>
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, idx) => (
              <th key={idx}>
                <Skeleton width={`${40 + Math.random() * 40}%`} height="12px" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={rowIdx}>
              {Array.from({ length: cols }).map((_, colIdx) => (
                <td key={colIdx}>
                  <Skeleton width={`${50 + Math.random() * 40}%`} height="12px" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================
// 5. LoadingGrid Component
// ============================================
export function LoadingGrid({ cards = 3 }) {
  return (
    <div className="grid-3" style={{ marginBottom: 'var(--space-xl)' }}>
      {Array.from({ length: cards }).map((_, idx) => (
        <LoadingCard key={idx} lines={3} />
      ))}
    </div>
  );
}

// ============================================
// 6. LoadingOverlay Component
// ============================================
export function LoadingOverlay({ message = 'Loading System Data...' }) {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(10, 10, 11, 0.85)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      zIndex: 100,
      border: '2px solid var(--text-primary)',
      fontFamily: 'var(--font-mono)'
    }}>
      <Loader2 className="premium-spinner" style={{ width: 32, height: 32, color: 'var(--ph-red)' }} />
      <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-primary)' }}>
        {message}
      </span>
    </div>
  );
}
