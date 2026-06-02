'use client';

import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from '@/lib/wagmi-config';
import '@rainbow-me/rainbowkit/styles.css';
import { ModalProvider } from '@/context/ModalContext';
import { GlobalModal } from '@/components/ui/GlobalModal';

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#F54E00',
            accentColorForeground: '#FFFFFF',
            borderRadius: 'medium',
            fontStack: 'system',
            overlayBlur: 'small',
          })}
          initialChain={wagmiConfig.chains[0]}
        >
          <ModalProvider>
            {children}
            <GlobalModal />
          </ModalProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
