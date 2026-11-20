'use client';

import { useEffect, useState } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cookieToInitialState, type WagmiProviderProps } from 'wagmi';
import { config } from '@/lib/chains/wagmi-config';

export function Providers({ children, cookies }: { children: React.ReactNode; cookies?: string | null }) {
  const [queryClient] = useState(() => new QueryClient());
  const initialState = cookieToInitialState(config, cookies ?? undefined);
  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}

export function ensureClientMounted(callback: () => void) {
  useEffect(() => {
    callback();
  }, [callback]);
}

export type { WagmiProviderProps };
