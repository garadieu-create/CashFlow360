'use client';

import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from '@/lib/wagmi-config';
import { ModalProvider } from '@/context/ModalContext';
import { GlobalModal } from '@/components/ui/GlobalModal';
import { useLowBalanceWatcher } from '@/hooks/useOnChainData';
import { CircleWalletProvider } from '@/context/CircleWalletContext';
import { LoadingProvider } from '@/components/providers/LoadingProvider';
import { FloatingWidgets } from '@/components/ui/FloatingWidgets';

const queryClient = new QueryClient();

function LowBalanceWatcher() {
  useLowBalanceWatcher();
  return null;
}

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <CircleWalletProvider>
          <LoadingProvider>
            <ModalProvider>
              <LowBalanceWatcher />
              {children}
              <GlobalModal />
              <FloatingWidgets />
            </ModalProvider>
          </LoadingProvider>
        </CircleWalletProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
