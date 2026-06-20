'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { mapRawError, UserFriendlyError } from '@/lib/error-mapping';

export type ModalType =
  | 'confirm'
  | 'destructive'
  | 'loading'
  | 'success'
  | 'error'
  | 'warning'
  | 'transaction'
  | 'system';

export type ModalPriority = 'P0' | 'P1' | 'P2' | 'P3';

export interface ModalButton {
  label: string;
  onClick?: () => void | Promise<void>;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  closeModalAfterClick?: boolean;
}

export interface TransactionStep {
  label: string;
  status: 'idle' | 'pending' | 'success' | 'failed';
  txHash?: string;
}

export interface ModalConfig {
  id?: string;
  type: ModalType;
  priority?: ModalPriority;
  title: string;
  description: string;
  badge?: string;
  buttons?: ModalButton[];
  onClose?: () => void;
  children?: React.ReactNode;
  
  // Specific parameters
  progress?: number; // 0 to 100
  retryAction?: () => void | Promise<void>;
  txHash?: string;
  txStatus?: 'pending' | 'confirming' | 'success' | 'failed' | 'timeout' | 'rejected' | 'idle';
  txSteps?: TransactionStep[];
  explorerUrl?: string;
  isDismissable?: boolean;
  isStackable?: boolean; // Can render on top of another modal
  preventDuplicate?: boolean; // Avoid spawning duplicates
  errorCode?: string;
}

interface ModalContextType {
  activeModals: ModalConfig[]; // Stack of active modals
  modalQueue: ModalConfig[]; // Queue of modals
  openModal: (config: ModalConfig) => string;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  updateModal: (id: string, updates: Partial<ModalConfig>) => void;
  updateActiveModal: (updates: Partial<ModalConfig>) => void; // Convenience updater for top-most
  triggerGlobalError: (error: any, retryAction?: () => void) => string;
  replaceModal: (idToReplace: string, newConfig: ModalConfig) => string;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

// Priority sorting helper: P0 (0) is highest, P3 (3) is lowest
const PRIORITY_MAP: Record<ModalPriority, number> = {
  P0: 0,
  P1: 1,
  P2: 2,
  P3: 3,
};

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [activeModals, setActiveModals] = useState<ModalConfig[]>([]);
  const [modalQueue, setModalQueue] = useState<ModalConfig[]>([]);
  
  // Ref for debouncing click-spamming
  const lastOpenTimestamp = useRef<number>(0);
  const lastOpenedTitle = useRef<string>('');

  // 1. Open Modal (with Priority Queueing, Deduplication, Debouncing)
  const openModal = useCallback((config: ModalConfig) => {
    const now = Date.now();
    const id = config.id || `modal-${Math.random().toString(36).slice(2, 9)}`;
    const priority = config.priority || 'P2';
    const newConfig = {
      ...config,
      id,
      priority,
      isDismissable: config.isDismissable ?? (config.type !== 'loading' && config.type !== 'system'),
      isStackable: config.isStackable ?? (priority === 'P0' || config.type === 'error'),
      preventDuplicate: config.preventDuplicate ?? true,
    };

    // Debouncing: prevent spawning identical modals in rapid succession (e.g. double click)
    if (
      now - lastOpenTimestamp.current < 300 &&
      lastOpenedTitle.current === newConfig.title
    ) {
      return id;
    }
    
    lastOpenTimestamp.current = now;
    lastOpenedTitle.current = newConfig.title;

    // Deduplication check
    if (newConfig.preventDuplicate) {
      const alreadyActive = activeModals.some(
        (m) => m.id === newConfig.id || m.title === newConfig.title
      );
      const alreadyQueued = modalQueue.some(
        (m) => m.id === newConfig.id || m.title === newConfig.title
      );
      if (alreadyActive || alreadyQueued) {
        return newConfig.id;
      }
    }

    setActiveModals((currentStack) => {
      // If there are no open modals, or the new modal is "stackable" (we can render it on top of current stack)
      if (currentStack.length === 0 || newConfig.isStackable) {
        return [...currentStack, newConfig];
      } else {
        // Otherwise, add to the priority queue
        setModalQueue((currentQueue) => {
          const updatedQueue = [...currentQueue, newConfig];
          // Sort queue by priority (P0 -> P1 -> P2 -> P3), then order of entry (stable sort)
          return updatedQueue.sort((a, b) => {
            const pA = PRIORITY_MAP[a.priority || 'P2'];
            const pB = PRIORITY_MAP[b.priority || 'P2'];
            return pA - pB;
          });
        });
        return currentStack;
      }
    });

    return id;
  }, [activeModals, modalQueue]);

  // 2. Close Modal (and pop next from queue if the stack clears)
  const closeModal = useCallback((id: string) => {
    let wasClosed = false;

    setActiveModals((currentStack) => {
      const target = currentStack.find((m) => m.id === id);
      if (target && target.onClose) {
        try {
          target.onClose();
        } catch (err) {
          console.error('Error in modal onClose callback:', err);
        }
      }
      
      const filtered = currentStack.filter((m) => m.id !== id);
      if (filtered.length < currentStack.length) {
        wasClosed = true;
      }
      return filtered;
    });

    // If it wasn't in activeModals, remove it from queue
    if (!wasClosed) {
      setModalQueue((currentQueue) => currentQueue.filter((m) => m.id !== id));
    }
  }, []);

  // 3. Replace Modal (Replaces a specific modal without triggering queue delay or slide animations)
  const replaceModal = useCallback((idToReplace: string, newConfig: ModalConfig) => {
    const id = newConfig.id || idToReplace;
    const priority = newConfig.priority || 'P2';
    const configWithId = {
      ...newConfig,
      id,
      priority,
      isDismissable: newConfig.isDismissable ?? (newConfig.type !== 'loading' && newConfig.type !== 'system'),
    };

    setActiveModals((currentStack) => {
      const idx = currentStack.findIndex((m) => m.id === idToReplace);
      if (idx !== -1) {
        const updated = [...currentStack];
        updated[idx] = configWithId;
        return updated;
      }
      return [...currentStack, configWithId];
    });

    return id;
  }, []);

  // 4. Update Modal (hot patch properties, e.g., steps or transaction progress)
  const updateModal = useCallback((id: string, updates: Partial<ModalConfig>) => {
    setActiveModals((currentStack) =>
      currentStack.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
  }, []);

  // 5. Update Active Modal (convenience helper for the top-most modal)
  const updateActiveModal = useCallback((updates: Partial<ModalConfig>) => {
    setActiveModals((currentStack) => {
      if (currentStack.length === 0) return currentStack;
      const updated = [...currentStack];
      const topIdx = updated.length - 1;
      updated[topIdx] = { ...updated[topIdx], ...updates };
      return updated;
    });
  }, []);

  // 6. Close All Modals
  const closeAllModals = useCallback(() => {
    setActiveModals([]);
    setModalQueue([]);
  }, []);

  // 7. Trigger Global Error (utilizes error-mapping)
  const triggerGlobalError = useCallback((error: any, retryAction?: () => void) => {
    const mapped: UserFriendlyError = mapRawError(error);
    const id = `error-modal-${Math.random().toString(36).slice(2, 9)}`;

    return openModal({
      id,
      type: 'error',
      priority: 'P0', // Critical blocking overlay
      title: mapped.title,
      description: mapped.description,
      badge: mapped.badge,
      errorCode: mapped.code,
      isDismissable: true,
      retryAction,
      buttons: [
        ...(retryAction
          ? [
              {
                label: 'Retry Action',
                variant: 'primary' as const,
                onClick: retryAction,
                closeModalAfterClick: true,
              },
            ]
          : []),
        {
          label: 'Dismiss',
          variant: 'secondary' as const,
          closeModalAfterClick: true,
        },
      ],
    });
  }, [openModal]);

  // Queue polling: when active stack is empty, pull the next highest priority item from the queue
  useEffect(() => {
    if (activeModals.length === 0 && modalQueue.length > 0) {
      const timer = setTimeout(() => {
        setModalQueue((currentQueue) => {
          if (currentQueue.length === 0) return currentQueue;
          const [next, ...rest] = currentQueue;
          setActiveModals([next]);
          return rest;
        });
      }, 100); // Small transition cooldown between queue runs
      return () => clearTimeout(timer);
    }
  }, [activeModals.length, modalQueue]);

  return (
    <ModalContext.Provider
      value={{
        activeModals,
        modalQueue,
        openModal,
        closeModal,
        closeAllModals,
        updateModal,
        updateActiveModal,
        triggerGlobalError,
        replaceModal,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}
