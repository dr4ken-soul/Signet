import type { Chain } from 'viem';
import { http, createConfig, createStorage, cookieStorage } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { defineSignetChain } from '@/lib/chains/aevum';

const env = {
  NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
  NEXT_PUBLIC_AEVUM_RPC_URL: process.env.NEXT_PUBLIC_AEVUM_RPC_URL,
  NEXT_PUBLIC_AEVUM_EXPLORER_URL: process.env.NEXT_PUBLIC_AEVUM_EXPLORER_URL,
};

export const aevumChain: Chain = defineSignetChain(env);

export const config = createConfig({
  chains: [aevumChain],
  connectors: [injected({ target: 'metaMask' }), injected()],
  transports: {
    [aevumChain.id]: http(env.NEXT_PUBLIC_AEVUM_RPC_URL ?? 'https://rpc-test.qday.info'),
  },
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
