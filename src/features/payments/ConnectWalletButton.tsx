'use client';

import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { config } from '@/lib/chains/wagmi-config';

export function ConnectWalletButton() {
  const { address, chainId, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  const expectedChainId = config.chains[0].id;
  const wrongChain = isConnected && chainId !== expectedChainId;

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        {wrongChain && (
          <button
            type="button"
            onClick={() => switchChain({ chainId: expectedChainId })}
            className="rounded border border-warning px-3 py-1.5 text-xs font-semibold text-warning hover:bg-accent-glow transition-colors duration-fast"
          >
            Switch to Aevum
          </button>
        )}
        <span className="mono-data hidden sm:inline" title={address}>
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <button
          type="button"
          onClick={() => disconnect()}
          className="rounded border border-border-default px-3 py-1.5 text-xs font-semibold text-ink-secondary hover:border-accent transition-colors duration-fast"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {connectors.map((connector) => (
        <button
          key={connector.uid}
          type="button"
          disabled={isPending}
          onClick={() => connect({ connector })}
          className="rounded border border-accent px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent-glow transition-colors duration-fast disabled:opacity-50"
        >
          {connector.name}
        </button>
      ))}
    </div>
  );
}
