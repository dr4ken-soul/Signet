import type { Chain } from 'viem';

export type SignetChainConfig = {
  id: number;
  name: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  rpcUrls: { default: { http: readonly [string] } };
  blockExplorers: { default: { name: string; url: string } };
  testnet: true;
};

export function defineSignetChain(env: {
  NEXT_PUBLIC_CHAIN_ID?: string;
  NEXT_PUBLIC_AEVUM_RPC_URL?: string;
  NEXT_PUBLIC_AEVUM_EXPLORER_URL?: string;
}): Chain {
  const id = Number(env.NEXT_PUBLIC_CHAIN_ID ?? '44005');
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`Invalid NEXT_PUBLIC_CHAIN_ID: ${env.NEXT_PUBLIC_CHAIN_ID}`);
  }
  const rpcUrl = env.NEXT_PUBLIC_AEVUM_RPC_URL ?? 'https://rpc-test.qday.info';
  const explorerUrl = env.NEXT_PUBLIC_AEVUM_EXPLORER_URL ?? 'https://explorer-test.qday.info';
  return {
    id,
    name: 'QDay Aevum Testnet',
    nativeCurrency: { name: 'tQDAY', symbol: 'tQDAY', decimals: 18 },
    rpcUrls: { default: { http: [rpcUrl] } },
    blockExplorers: { default: { name: 'Aevum Explorer', url: explorerUrl } },
    testnet: true,
  };
}

export function explorerTxUrl(base: string, txHash: string): string {
  return `${base.replace(/\/$/, '')}/tx/${txHash}`;
}

export function explorerAddressUrl(base: string, address: string): string {
  return `${base.replace(/\/$/, '')}/address/${address}`;
}
