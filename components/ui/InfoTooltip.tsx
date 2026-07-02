'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle } from 'lucide-react';

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
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const updateCoords = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      let top = 0;
      let left = 0;

      if (position === 'top') {
        top = rect.top + window.scrollY;
        left = rect.left + window.scrollX + rect.width / 2;
      } else if (position === 'bottom') {
        top = rect.bottom + window.scrollY;
        left = rect.left + window.scrollX + rect.width / 2;
      } else if (position === 'left') {
        top = rect.top + window.scrollY + rect.height / 2;
        left = rect.left + window.scrollX;
      } else if (position === 'right') {
        top = rect.top + window.scrollY + rect.height / 2;
        left = rect.right + window.scrollX;
      }

      setCoords({ top, left });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      // Listen to window events to keep tooltip in sync
      window.addEventListener('resize', updateCoords);
      window.addEventListener('scroll', updateCoords, true);
    }
    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
    };
  }, [isOpen]);

  // Check client-side render environment
  const isMounted = typeof window !== 'undefined' && !!document.body;

  return (
    <div 
      className="info-tooltip-wrapper"
      style={{ display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        ref={buttonRef}
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

      {isMounted && createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: position === 'top' ? 5 : position === 'bottom' ? -5 : 0 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.12 }}
              style={{
                position: 'absolute',
                zIndex: 99999, // Ensure it floats on top of everything
                width: '280px',
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-active)',
                boxShadow: 'var(--shadow-lg)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                color: 'var(--text-primary)',
                fontSize: '12px',
                pointerEvents: 'none',
                top: `${coords.top}px`,
                left: `${coords.left}px`,
                transform: 
                  position === 'top' ? 'translate(-50%, calc(-100% - 8px))' :
                  position === 'bottom' ? 'translate(-50%, 8px)' :
                  position === 'left' ? 'translate(calc(-100% - 8px), -50%)' :
                  'translate(8px, -50%)',
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
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
