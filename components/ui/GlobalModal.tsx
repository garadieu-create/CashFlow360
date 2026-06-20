'use client';

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useModal, ModalConfig } from '@/context/ModalContext';
import { ModalPortal, ModalOverlay, ModalErrorBoundary } from './modal/ModalBase';
import { 
  ConfirmationModal, LoadingModal, SuccessModal, ErrorModal, WarningModal, TransactionModal, SystemModal 
} from './modal/ModalVariants';

export function GlobalModal() {
  const { activeModals, closeModal } = useModal();

  const renderModalContent = (config: ModalConfig) => {
    switch (config.type) {
      case 'confirm':
      case 'destructive':
        return <ConfirmationModal config={config} onClose={closeModal} />;
      case 'loading':
        return <LoadingModal config={config} onClose={closeModal} />;
      case 'success':
        return <SuccessModal config={config} onClose={closeModal} />;
      case 'error':
        return <ErrorModal config={config} onClose={closeModal} />;
      case 'warning':
        return <WarningModal config={config} onClose={closeModal} />;
      case 'transaction':
        return <TransactionModal config={config} onClose={closeModal} />;
      case 'system':
        return <SystemModal config={config} onClose={closeModal} />;
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {activeModals.map((config, index) => {
        const id = config.id || `modal-${index}`;
        return (
          <ModalPortal
            key={id}
            isOpen={true}
            onClose={() => closeModal(id)}
            isDismissable={config.isDismissable}
          >
            <ModalOverlay 
              onClose={() => closeModal(id)} 
              isDismissable={config.isDismissable}
            >
              <div 
                className="modal-stack-item"
                style={{ 
                  zIndex: 3000 + index * 10,
                  pointerEvents: 'auto',
                  position: 'relative'
                }}
              >
                <ModalErrorBoundary>
                  {renderModalContent(config)}
                </ModalErrorBoundary>
              </div>
            </ModalOverlay>
          </ModalPortal>
        );
      })}
    </AnimatePresence>
  );
}
