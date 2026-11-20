'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAccount, useSwitchChain } from 'wagmi';
import { encodeFunctionData, getAddress } from 'viem';
import { config } from '@/lib/chains/wagmi-config';
import { ConnectWalletButton } from '@/features/payments/ConnectWalletButton';
import { StateBadge } from '@/features/invoices/StateBadge';
import { formatAmount, shortenHex } from '@/features/invoices/format';
import type { InvoiceRecord } from '@/features/invoices/types';

type InvoiceSummary = {
  id: string;
  external_ref: string;
  supplier_name: string;
  amount_units: string;
  token_symbol: string;
  state: InvoiceRecord['state'];
  due_at: string;
};

type VerificationRun = {
  id: string;
  result: 'valid' | 'invalid';
  reason_code: string;
  parameter_set: string;
  key_fingerprint: string;
  report_sha3_256: string;
  verifier_version: string;
  verified_off_chain: boolean;
  verified_at: string;
};

type PolicyFinding = { code: string; detail: string };
type PolicyResult = { pass: boolean; policy_version: string; findings: PolicyFinding[] };

type AgentStep = { step: string; actor: string; outcome: string; detail: string };

type InvoiceDetail = InvoiceSummary & {
  payee_address: string;
  token_address: string;
  document_sha3_256: string;
  extracted_fields: Record<string, { value: string; confidence: number; source: string }>;
  signer_fingerprint: string | null;
};

type ApprovalIntent = {
  mode: 'contract' | 'transfer';
  intent: {
    payee: string;
    token: string;
    amount_units: string;
    nonce: string;
    expires_at: string;
    document_digest: string;
    verification_record_hash: string;
  };
  intent_digest: string;
  anchor_contract: string | null;
  note: string;
};

type ProofResponse = {
  verification: VerificationRun | null;
  chain_reference: {
    tx_hash: string;
    block_number: number;
    event_name: string;
    explorer_url: string;
    confirmed_at: string;
  } | null;
};

const EXPECTED_CHAIN_ID = config.chains[0].id;

export default function WorkbenchPage() {
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<InvoiceDetail | null>(null);
  const [verification, setVerification] = useState<VerificationRun | null>(null);
  const [policy, setPolicy] = useState<PolicyResult | null>(null);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [intent, setIntent] = useState<ApprovalIntent | null>(null);
  const [proof, setProof] = useState<ProofResponse['chain_reference']>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const { address, chainId, isConnected } = useAccount();
  const { switchChain } = useSwitchChain();
  const wrongChain = isConnected && chainId !== EXPECTED_CHAIN_ID;

  const loadInvoices = useCallback(async () => {
    const res = await fetch('/api/v1/invoices');
    const data = await res.json();
    setInvoices(data.invoices ?? []);
    if (!selectedId && data.invoices?.length) setSelectedId(data.invoices[0].id);
  }, [selectedId]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  useEffect(() => {
    if (!selectedId) return;
    setIntent(null);
    setProof(null);
    setSteps([]);
    setVerification(null);
    setPolicy(null);
    setMessage(null);
    (async () => {
      const res = await fetch('/api/v1/invoices', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: selectedId }),
      });
      if (res.ok) {
        const data = await res.json();
        setDetail(data.invoice);
      }
      const proofRes = await fetch(`/api/v1/invoices/${selectedId}/proof`);
      if (proofRes.ok) {
        const proofData = await proofRes.json();
        setVerification(proofData.verification);
        setProof(proofData.chain_reference);
      }
    })();
  }, [selectedId]);

  async function runVerification() {
    if (!selectedId) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/v1/invoices/${selectedId}/verification`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? 'Verification failed');
        return;
      }
      setVerification(data.verification);
      setPolicy(data.policy);
      setSteps(data.steps ?? []);
      const stateRes = await fetch(`/api/v1/invoices/${selectedId}/verification`);
      if (stateRes.ok) {
        const stateData = await stateRes.json();
        setInvoices((prev) => prev.map((i) => (i.id === selectedId ? { ...i, state: stateData.state } : i)));
      }
      const detailRes = await fetch('/api/v1/invoices', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: selectedId }),
      });
      if (detailRes.ok) setDetail((await detailRes.json()).invoice);
    } finally {
      setBusy(false);
    }
  }

  async function submitDecision(decision: 'approved' | 'rejected') {
    if (!selectedId || !address) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/v1/invoices/${selectedId}/approval-intent`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ decision, approver_wallet: address }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? 'Approval blocked');
        if (data.state) setInvoices((prev) => prev.map((i) => (i.id === selectedId ? { ...i, state: data.state } : i)));
        return;
      }
      if (decision === 'rejected') {
        setInvoices((prev) => prev.map((i) => (i.id === selectedId ? { ...i, state: 'rejected' } : i)));
        setMessage('Invoice rejected. Payment controls stay blocked.');
        return;
      }
      setIntent(data);
      setInvoices((prev) => prev.map((i) => (i.id === selectedId ? { ...i, state: 'awaiting_wallet' } : i)));
    } finally {
      setBusy(false);
    }
  }

  const intentSummary = useMemo(() => {
    if (!intent || !detail) return null;
    return {
      ...intent,
      amountDisplay: formatAmount(intent.intent.amount_units, detail.token_address === intent.intent.token ? 6 : 6),
    };
  }, [intent, detail]);

  return (
    <div className="min-h-screen bg-bg-primary">
      <header className="border-b border-border-default bg-bg-surface">
        <div className="mx-auto flex h-16 max-w-page items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-display text-lg font-bold text-ink-primary">
              Signet
            </Link>
            <span className="hidden rounded border border-border-default px-2 py-1 text-xs font-medium text-ink-muted sm:inline">
              Demo workspace, synthetic data
            </span>
          </div>
          <ConnectWalletButton />
        </div>
      </header>

      <main className="mx-auto grid max-w-page gap-8 px-6 py-10 lg:grid-cols-[320px_1fr]">
        <aside aria-label="Invoice queue">
          <h1 className="font-display text-xl font-bold text-ink-primary">Invoice queue</h1>
          <p className="mt-1 text-xs text-ink-muted">Sample workspace. Every record is synthetic.</p>
          <ul className="mt-4 space-y-2">
            {invoices.map((inv) => (
              <li key={inv.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(inv.id)}
                  className={`w-full rounded-lg border p-4 text-left transition-colors duration-fast ${
                    selectedId === inv.id
                      ? 'border-accent bg-accent-glow'
                      : 'border-border-default bg-bg-surface hover:border-accent'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="mono-data font-semibold text-ink-primary">{inv.external_ref}</span>
                    <StateBadge state={inv.state} />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-ink-secondary">
                    <span>{inv.supplier_name}</span>
                    <span className="mono-data">
                      {formatAmount(inv.amount_units, 6)} {inv.token_symbol}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section aria-label="Invoice detail" className="space-y-6">
          {!detail && <p className="text-sm text-ink-secondary">Select an invoice from the queue.</p>}

          {detail && (
            <>
              <div className="bento-cell bento-noise p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-ink-primary">{detail.external_ref}</h2>
                    <p className="mt-1 text-sm text-ink-secondary">
                      {detail.supplier_name} · {formatAmount(detail.amount_units, 6)} {detail.token_symbol} · due{' '}
                      {new Date(detail.due_at).toLocaleDateString()}
                    </p>
                  </div>
                  <StateBadge state={invoices.find((i) => i.id === detail.id)?.state ?? 'received'} />
                </div>

                <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Payee</dt>
                    <dd className="mono-data mt-1 text-ink-primary" title={detail.payee_address}>
                      {shortenHex(detail.payee_address, 14, 10)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Document digest (SHA3-256)</dt>
                    <dd className="mono-data mt-1 text-ink-primary" title={detail.document_sha3_256}>
                      {shortenHex(detail.document_sha3_256, 14, 10)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Signer fingerprint</dt>
                    <dd className="mono-data mt-1 text-ink-primary">{detail.signer_fingerprint ?? 'not verified yet'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Token</dt>
                    <dd className="mono-data mt-1 text-ink-primary">tUSD8 (6 decimals)</dd>
                  </div>
                </dl>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button type="button" onClick={runVerification} disabled={busy} className="btn-primary">
                    {busy ? 'Running...' : 'Run agent verification'}
                  </button>
                  <button
                    type="button"
                    onClick={() => submitDecision('rejected')}
                    disabled={busy || !isConnected}
                    className="btn-secondary !text-error"
                    title={isConnected ? 'Reject this payment' : 'Connect a wallet to record a rejection'}
                  >
                    Reject
                  </button>
                </div>
                {message && <p className="mt-3 text-sm font-medium text-error">{message}</p>}
              </div>

              {steps.length > 0 && (
                <div className="bento-cell bento-noise p-6">
                  <h3 className="font-display text-lg font-semibold text-ink-primary">Agent pipeline</h3>
                  <ol className="mt-4 space-y-3">
                    {steps.map((s, i) => (
                      <li key={`${s.step}-${i}`} className="flex gap-3 text-sm">
                        <span
                          className={`mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full ${
                            s.outcome === 'ok' ? 'bg-success' : 'bg-error'
                          }`}
                          aria-hidden="true"
                        />
                        <div>
                          <p className="font-semibold text-ink-primary">
                            {s.step} <span className="font-normal text-ink-muted">({s.actor})</span>
                          </p>
                          <p className="text-ink-secondary">{s.detail}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {verification && (
                <div className="bento-cell bento-noise p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-semibold text-ink-primary">Verification evidence</h3>
                    <span className={`status-label ${verification.result === 'valid' ? 'text-success' : 'text-error'}`}>
                      {verification.result === 'valid' ? 'Verified off-chain' : `Invalid (${verification.reason_code})`}
                    </span>
                  </div>
                  <dl className="mt-4 space-y-2 text-sm">
                    <Row label="Parameter set" value={verification.parameter_set} />
                    <Row label="Key fingerprint" value={verification.key_fingerprint} mono />
                    <Row label="Verification record hash" value={verification.report_sha3_256} mono />
                    <Row label="Verifier version" value={verification.verifier_version} />
                    <Row label="Checked at" value={new Date(verification.verified_at).toLocaleString()} />
                  </dl>
                  <p className="mt-4 border-t border-border-subtle pt-3 text-xs leading-relaxed text-ink-muted">
                    This check ran off-chain with a deterministic FIPS 204 implementation. The language model did not
                    decide this result and cannot override it. Aevum will store only a hash reference to this record.
                  </p>
                </div>
              )}

              {policy && (
                <div className="bento-cell bento-noise p-6">
                  <h3 className="font-display text-lg font-semibold text-ink-primary">Policy review</h3>
                  {policy.pass ? (
                    <p className="mt-2 text-sm text-success">
                      All checks passed under {policy.policy_version}. The invoice is ready for buyer approval.
                    </p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {policy.findings.map((f) => (
                        <li key={f.code} className="rounded border border-error/30 bg-error/5 p-3 text-sm">
                          <span className="font-semibold text-error">{f.code}</span>
                          <span className="ml-2 text-ink-secondary">{f.detail}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {intent && (
                <div className="bento-cell bento-noise border-l-4 border-l-warning p-6">
                  <h3 className="font-display text-lg font-semibold text-ink-primary">Approval required</h3>
                  <p className="mt-2 text-sm text-ink-secondary">{intent.note}</p>
                  <dl className="mt-4 space-y-2 text-sm">
                    <Row label="You are authorizing a payment of" value={`${intentSummary?.amountDisplay} tUSD8`} />
                    <Row label="To payee" value={intent.intent.payee} mono />
                    <Row label="Token" value={intent.intent.token} mono />
                    <Row label="Nonce" value={intent.intent.nonce} mono />
                    <Row label="Expires at" value={new Date(intent.intent.expires_at).toLocaleTimeString()} />
                    <Row label="Document digest" value={intent.intent.document_digest} mono />
                    <Row label="Verification record hash" value={intent.intent.verification_record_hash} mono />
                    <Row label="Intent digest" value={intent.intent_digest} mono />
                  </dl>
                  {wrongChain && (
                    <button
                      type="button"
                      onClick={() => switchChain({ chainId: EXPECTED_CHAIN_ID })}
                      className="btn-secondary mt-4 !text-warning"
                    >
                      Switch to QDay Aevum testnet
                    </button>
                  )}
                  <p className="mt-4 text-xs text-ink-muted">
                    Aevum testnet (chain {EXPECTED_CHAIN_ID}), tUSD8 test token. Test tokens have no monetary value. The
                    next wallet prompt is you signing the payment; the agent cannot sign for you.
                  </p>
                  <ContractPaymentPanel invoiceId={detail.id} intent={intent} onDone={() => loadInvoices()} />
                </div>
              )}

              {proof && (
                <div className="bento-cell bento-noise border-l-4 border-l-success p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-semibold text-ink-primary">Anchored on-chain</h3>
                    <span className="status-label text-success">Anchored on-chain</span>
                  </div>
                  <dl className="mt-4 space-y-2 text-sm">
                    <Row label="Event" value={proof.event_name} />
                    <Row label="Block" value={String(proof.block_number)} />
                    <Row label="Confirmed at" value={new Date(proof.confirmed_at).toLocaleString()} />
                  </dl>
                  <a
                    href={proof.explorer_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mono-data mt-3 inline-block text-accent underline"
                  >
                    View transaction in explorer
                  </a>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</dt>
      <dd className={`${mono ? 'mono-data' : 'text-sm'} text-ink-primary sm:text-right`}>{value}</dd>
    </div>
  );
}

function ContractPaymentPanel({ invoiceId, intent, onDone }: { invoiceId: string; intent: ApprovalIntent; onDone: () => void }) {
  const { connector } = useAccount();
  const [status, setStatus] = useState<'idle' | 'signing' | 'submitted' | 'confirmed' | 'failed'>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    if (!connector) return;
    setStatus('signing');
    setError(null);
    try {
      const provider = (await connector.getProvider()) as {
        request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      };

      const contractAddress = intent.anchor_contract;
      const { intent: i } = intent;
      const nonceBytes = i.nonce.replace(/^0x/, '').toLowerCase().padStart(64, '0');
      const invoiceRefHash = ('0x' + nonceBytes) as `0x${string}`;
      const expiry = BigInt(Math.floor(Date.now() / 1000) + 15 * 60);

      const txParams = contractAddress
        ? {
            to: contractAddress as `0x${string}`,
            data: encodeFunctionData({
              abi: PAY_AND_ANCHOR_ABI,
              functionName: 'payAndAnchor',
              args: [
                getAddress(i.payee),
                getAddress(i.token),
                BigInt(i.amount_units),
                BigInt('0x' + nonceBytes.slice(0, 32)),
                expiry,
                invoiceRefHash,
                i.document_digest as `0x${string}`,
                i.verification_record_hash as `0x${string}`,
              ],
            }),
            value: '0x0',
          }
        : {
            to: getAddress(i.payee),
            data: encodeFunctionData({
              abi: ERC20_TRANSFER_ABI,
              functionName: 'transfer',
              args: [getAddress(i.payee), BigInt(i.amount_units)],
            }),
            value: '0x0',
          };

      const hash = (await provider.request({
        method: 'eth_sendTransaction',
        params: [txParams],
      })) as string;
      setTxHash(hash);
      setStatus('submitted');

      const res = await fetch(`/api/v1/invoices/${invoiceId}/chain-confirmation`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tx_hash: hash }),
      });
      const result = await res.json();
      if (result.state === 'confirmed') {
        setStatus('confirmed');
        onDone();
      } else if (result.state === 'submitted') {
        setStatus('submitted');
        setError('Not confirmed yet. Reopen this invoice after a few seconds to reconcile.');
      } else {
        setStatus('failed');
        setError(result.detail ?? 'The transaction did not confirm.');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Wallet request failed';
      if (/denied|rejected/i.test(msg)) {
        setStatus('idle');
        setError('You rejected the transaction in the wallet. Nothing was sent.');
      } else {
        setStatus('failed');
        setError(msg);
      }
    }
  }

  return (
    <div className="mt-6 border-t border-border-default pt-4">
      <button
        type="button"
        onClick={pay}
        disabled={status === 'signing' || status === 'submitted' || status === 'confirmed' || !connector}
        className="btn-primary w-full sm:w-auto"
      >
        {status === 'idle' && 'Sign payment in wallet'}
        {status === 'signing' && 'Waiting for wallet...'}
        {status === 'submitted' && 'Transaction submitted'}
        {status === 'confirmed' && 'Confirmed'}
        {status === 'failed' && 'Retry payment'}
      </button>
      {txHash && <p className="mono-data mt-3 text-ink-secondary">tx: {shortenHex(txHash, 14, 10)}</p>}
      {error && <p className="mt-2 text-sm text-error">{error}</p>}
      {status === 'submitted' && (
        <p className="mt-2 text-sm text-info">
          Transaction submitted. Confirmation is reconciled from the chain receipt, not from this page.
        </p>
      )}
    </div>
  );
}

const PAY_AND_ANCHOR_ABI = [
  {
    name: 'payAndAnchor',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'payee', type: 'address' },
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'expiry', type: 'uint64' },
      { name: 'invoiceRefHash', type: 'bytes32' },
      { name: 'documentDigest', type: 'bytes32' },
      { name: 'verificationRecordHash', type: 'bytes32' },
    ],
    outputs: [],
  },
] as const;

const ERC20_TRANSFER_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;
