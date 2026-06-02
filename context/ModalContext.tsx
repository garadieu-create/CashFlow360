'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export type ModalType =
  | 'confirm'
  | 'loading'
  | 'success'
  | 'error'
  | 'warning'
  | 'transaction';

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
  title: string;
  description: string;
  badge?: string;
  buttons?: ModalButton[];
  onClose?: () => void;
  // Specific parameters
  progress?: number; // 0 to 100
  retryAction?: () => void | Promise<void>;
  txHash?: string;
  txStatus?: 'pending' | 'confirming' | 'success' | 'failed' | 'timeout' | 'rejected';
  txSteps?: TransactionStep[];
  explorerUrl?: string;
  isDismissable?: boolean;
  errorCode?: string; // e.g. 'INSUFFICIENT_BALANCE', 'USER_REJECTED'
}

interface ModalContextType {
  activeModal: ModalConfig | null;
  modalQueue: ModalConfig[];
  openModal: (config: ModalConfig) => string;
  closeModal: (id?: string) => void;
  closeAllModals: () => void;
  updateActiveModal: (updates: Partial<ModalConfig>) => void;
  triggerGlobalError: (errorType: 'timeout' | 'rejected' | 'insufficient' | 'disconnected' | 'unknown', retryAction?: () => void) => string;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [activeModal, setActiveModal] = useState<ModalConfig | null>(null);
  const [modalQueue, setModalQueue] = useState<ModalConfig[]>([]);

  // Open a modal and return its unique ID
  const openModal = useCallback((config: ModalConfig) => {
    const id = config.id || `modal-${Math.random().toString(36).slice(2, 9)}`;
    const newConfig = { ...config, id, isDismissable: config.isDismissable ?? true };

    setActiveModal((current) => {
      if (!current) {
        return newConfig;
      } else {
        // Queue it if a modal is already active
        setModalQueue((queue) => [...queue, newConfig]);
        return current;
      }
    });

    return id;
  }, []);

  // Close active or a specific modal
  const closeModal = useCallback((id?: string) => {
    setActiveModal((current) => {
      if (!current) return null;
      
      // If closing a specific modal and it's not active, remove it from queue
      if (id && current.id !== id) {
        setModalQueue((queue) => queue.filter((m) => m.id !== id));
        return current;
      }

      // Execute close callback
      if (current.onClose) {
        try {
          current.onClose();
        } catch (e) {
          console.error('Error during modal onClose execution:', e);
        }
      }

      // Pull next from queue
      setModalQueue((queue) => {
        if (queue.length > 0) {
          const next = queue[0];
          setTimeout(() => setActiveModal(next), 50); // slight delay for smooth exit/enter animation transitions
          return queue.slice(1);
        } else {
          setActiveModal(null);
          return queue;
        }
      });

      return null;
    });
  }, []);

  // Close everything
  const closeAllModals = useCallback(() => {
    setModalQueue([]);
    setActiveModal(null);
  }, []);

  // Hot update active modal fields (e.g. updating progress, changing txStatus pending -> success)
  const updateActiveModal = useCallback((updates: Partial<ModalConfig>) => {
    setActiveModal((current) => {
      if (!current) return null;
      return { ...current, ...updates };
    });
  }, []);

  // Global Error Mapping Helper
  const triggerGlobalError = useCallback((
    errorType: 'timeout' | 'rejected' | 'insufficient' | 'disconnected' | 'unknown',
    retryAction?: () => void
  ) => {
    const errorConfigs: Record<string, Partial<ModalConfig>> = {
      timeout: {
        title: 'API Request Timeout',
        description: 'The connection to the blockchain node has timed out. Please check your internet connection or verify transaction status on Arcscan.',
        errorCode: 'API_TIMEOUT',
        badge: 'Network Error',
      },
      rejected: {
        title: 'Transaction Signature Rejected',
        description: 'You declined the transaction signature in your wallet. If this was a mistake, you can trigger it again below.',
        errorCode: 'USER_REJECTED',
        badge: 'Wallet Alert',
      },
      insufficient: {
        title: 'Insufficient Balance',
        description: 'Your wallet does not have enough USDC native gas tokens to complete this transaction. Please request funds from the faucet.',
        errorCode: 'INSUFFICIENT_FUNDS',
        badge: 'Gas Shortage',
      },
      disconnected: {
        title: 'Network Disconnected',
        description: 'Your wallet connection was interrupted. Please check your network and reconnect your wallet to continue.',
        errorCode: 'NETWORK_DISCONNECTED',
        badge: 'Connection Lost',
      },
      unknown: {
        title: 'Unexpected System Error',
        description: 'An unexpected smart contract runtime error occurred. Please try again or explore our system integrations panel.',
        errorCode: 'UNKNOWN_ERROR',
        badge: 'System Failure',
      },
    };

    const targetConfig = errorConfigs[errorType] || errorConfigs.unknown;

    return openModal({
      type: 'error',
      title: targetConfig.title!,
      description: targetConfig.description!,
      badge: targetConfig.badge,
      errorCode: targetConfig.errorCode,
      isDismissable: true,
      retryAction,
      buttons: [
        ...(retryAction ? [{
          label: 'Retry Execution',
          variant: 'primary' as const,
          onClick: retryAction,
          closeModalAfterClick: true
        }] : []),
        {
          label: 'Dismiss',
          variant: 'secondary' as const,
          closeModalAfterClick: true
        }
      ]
    });
  }, [openModal]);

  return (
    <ModalContext.Provider
      value={{
        activeModal,
        modalQueue,
        openModal,
        closeModal,
        closeAllModals,
        updateActiveModal,
        triggerGlobalError,
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
