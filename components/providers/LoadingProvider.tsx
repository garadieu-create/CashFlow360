'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

interface LoadingContextType {
  startLoading: (key?: string) => void;
  stopLoading: (key?: string) => void;
  isLoading: boolean;
  activeKeys: string[];
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [activeKeys, setActiveKeys] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Clear active keys when navigation finishes
    setActiveKeys([]);
  }, [pathname]);

  const startLoading = (key = 'global') => {
    setActiveKeys((prev) => {
      if (prev.includes(key)) return prev;
      return [...prev, key];
    });
  };

  const stopLoading = (key = 'global') => {
    setActiveKeys((prev) => prev.filter((k) => k !== key));
  };

  const isLoading = activeKeys.length > 0;

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      setVisible(true);
      setProgress(0);
      
      // Simulate progressive incremental load
      const tick = () => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          const next = prev + (90 - prev) * 0.15;
          return next;
        });
        timer = setTimeout(tick, 200 + Math.random() * 200);
      };
      timer = setTimeout(tick, 100);
    } else {
      if (visible) {
        setProgress(100);
        timer = setTimeout(() => {
          setVisible(false);
          setProgress(0);
        }, 300); // Wait for the 100% bar transition to complete
      }
    }
    return () => clearTimeout(timer);
  }, [isLoading, visible]);

  return (
    <LoadingContext.Provider value={{ startLoading, stopLoading, isLoading, activeKeys }}>
      {visible && (
        <motion.div
          className="global-progress-bar"
          initial={{ transform: 'scaleX(0)' }}
          animate={{ transform: `scaleX(${progress / 100})` }}
          transition={{
            duration: progress === 100 ? 0.25 : 0.35,
            ease: progress === 100 ? 'easeOut' : 'easeInOut',
          }}
          style={{ transformOrigin: '0%' }}
        />
      )}
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}
