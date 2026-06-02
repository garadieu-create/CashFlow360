'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, HelpCircle } from 'lucide-react';

interface InfoTooltipProps {
  title: string;
  definition: string;
  importance: string;
  calculation?: string;
  guidance: string;
  goodVsBad?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function InfoTooltip({
  title,
  definition,
  importance,
  calculation,
  guidance,
  goodVsBad,
  position = 'top',
}: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Position styles mapping
  const positionStyles = {
    top: { bottom: '100%', left: '50%', translateX: '-50%', translateY: '-8px' },
    bottom: { top: '100%', left: '50%', translateX: '-50%', translateY: '8px' },
    left: { right: '100%', top: '50%', translateY: '-50%', translateX: '-8px' },
    right: { left: '100%', top: '50%', translateY: '-50%', translateX: '8px' },
  };

  return (
    <div 
      className="info-tooltip-wrapper"
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-tertiary)',
          cursor: 'pointer',
          padding: 2,
          display: 'inline-flex',
          alignItems: 'center',
          transition: 'color var(--transition-fast)',
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        aria-label={`About ${title}`}
      >
        <HelpCircle size={13} style={{ opacity: 0.7 }} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: position === 'top' ? 5 : position === 'bottom' ? -5 : 0 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              zIndex: 1000,
              width: '280px',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-active)',
              boxShadow: 'var(--shadow-lg)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              color: 'var(--text-primary)',
              fontSize: '12px',
              pointerEvents: 'none',
              ...positionStyles[position],
            }}
          >
            {/* Tooltip Arrow */}
            <div
              style={{
                position: 'absolute',
                width: '8px',
                height: '8px',
                backgroundColor: 'var(--bg-elevated)',
                borderLeft: '1px solid var(--border-active)',
                borderBottom: '1px solid var(--border-active)',
                transform: 
                  position === 'top' ? 'rotate(-45deg) translateX(-50%)' :
                  position === 'bottom' ? 'rotate(135deg) translateX(-50%)' :
                  position === 'left' ? 'rotate(225deg) translateY(-50%)' :
                  'rotate(45deg) translateY(-50%)',
                left: position === 'top' || position === 'bottom' ? '50%' : position === 'right' ? '-4px' : 'auto',
                right: position === 'left' ? '-4px' : 'auto',
                bottom: position === 'top' ? '-5px' : 'auto',
                top: position === 'bottom' ? '-5px' : 'auto',
              }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontWeight: 700, borderBottom: '1px solid var(--border-primary)', paddingBottom: '4px', color: 'var(--ph-red)' }}>
                {title}
              </div>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>What it is:</strong>{' '}
                <span style={{ color: 'var(--text-secondary)' }}>{definition}</span>
              </div>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Why it matters:</strong>{' '}
                <span style={{ color: 'var(--text-secondary)' }}>{importance}</span>
              </div>
              {calculation && (
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Formula:</strong>{' '}
                  <code style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', background: 'var(--bg-secondary)', padding: '2px 4px', borderRadius: '4px', color: 'var(--ph-yellow)' }}>
                    {calculation}
                  </code>
                </div>
              )}
              {goodVsBad && (
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Benchmark:</strong>{' '}
                  <span style={{ color: 'var(--text-secondary)' }}>{goodVsBad}</span>
                </div>
              )}
              <div style={{ marginTop: '4px', paddingTop: '6px', borderTop: '1px dashed var(--border-secondary)', fontStyle: 'italic', color: 'var(--text-primary)' }}>
                👉 {guidance}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
