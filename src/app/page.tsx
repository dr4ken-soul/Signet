import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { PublicNav } from '@/components/PublicNav';
import { ProofPanel } from '@/components/ProofPanel';
import { PinnedWorkflow } from '@/components/PinnedWorkflow';

export const metadata: Metadata = {
  title: 'Signet | Verify the invoice before money moves',
};

const ADAPTERS = [
  {
    title: 'Document adapters',
    body: 'Invoice bytes, digests, and canonical envelopes are read through a document interface. The MVP reads text documents and signed envelope fixtures.',
    status: 'Shipped for the challenge',
  },
  {
    title: 'Verifier adapters',
    body: 'Deterministic FIPS 204 ML-DSA-65 verification behind a typed interface, with versioned reports and reason codes.',
    status: 'Shipped for the challenge',
  },
  {
    title: 'Agent adapters',
    body: 'The bounded agent pipeline orchestrates extraction, verification, and policy. Model providers plug in without touching payment truth.',
    status: 'Extraction is rule-based in the MVP',
  },
  {
    title: 'Wallet adapters',
    body: 'The buyer signs with any EIP-1193 wallet through wagmi. The server never holds a buyer key.',
    status: 'Shipped for the challenge',
  },
  {
    title: 'Token adapters',
    body: 'tUSD8 (6 decimals) is the configured challenge token. Other tokens are configuration, not code changes.',
    status: 'Aevum tUSD8 only today',
  },
  {
    title: 'Chain adapters',
    body: 'Aevum testnet (chain 44005) is the first chain adapter. Receipt and event reconciliation read from RPC, not from the browser.',
    status: 'Aevum testnet only today',
  },
];

const SECURITY_ROWS = [
  {
    zone: 'Off-chain checks',
    tone: 'border-l-info',
    items: [
      'Deterministic ML-DSA-65 signature verification with versioned reports',
      'Signer key registry with fingerprints, rotation, and revocation',
      'Policy rules: duplicates, payee allowlist, amount limits, expiry',
      'Extracted fields with confidence scores and human correction',
    ],
  },
  {
    zone: 'On-chain references',
    tone: 'border-l-accent',
    items: [
      'Document digest recorded with the payment event on Aevum',
      'Hash of the versioned verification record for later reproduction',
      'Unique invoice reference hash and nonce stop replay',
      'Explorer-verifiable transaction, receipt, and event',
    ],
  },
];

const SCENARIOS = [
  {
    audience: 'Accounts-payable teams',
    body: 'Review a signed invoice with its verification evidence in one place. Approve only what policy allows, with a record of who approved what and when.',
    span: 'lg:col-span-2',
  },
  {
    audience: 'Suppliers',
    body: 'Sign invoices with an ML-DSA key you control. Signet never collects your private key; only your public key fingerprint is registered.',
    span: '',
  },
  {
    audience: 'Agent operators',
    body: 'Run bounded automation that prepares decisions without payment authority. Every step is audited and every cryptographic result comes from a deterministic verifier.',
    span: '',
  },
  {
    audience: 'Auditors',
    body: 'Reproduce verification: fetch the signed envelope, the public key, and the versioned record, then rerun the check against the recorded hashes.',
    span: 'lg:col-span-2',
  },
];

const FAQ_ITEMS = [
  {
    q: 'Does the EVM verify the ML-DSA signature?',
    a: 'No. ML-DSA verification runs off-chain with a deterministic FIPS 204 implementation. Aevum records the document digest and a hash of the verification record as references. The hash is a pointer to evidence, not an on-chain proof that the EVM checked the signature.',
  },
  {
    q: 'Can the AI agent approve or send a payment?',
    a: 'No. The agent extracts fields, calls the verifier, and prepares summaries. Payment requires an explicit wallet signature from the buyer. The agent holds no keys and cannot move funds.',
  },
  {
    q: 'What happens when a signature is invalid or a key is unknown?',
    a: 'The workflow fails closed. Payment controls stay blocked, the invoice moves to needs review, and the reason (invalid signature, unknown key, revoked key, duplicate, over limit, payee mismatch) is shown to the reviewer.',
  },
  {
    q: 'What data goes on-chain?',
    a: 'Only minimal commitments: the document digest, the verification-record hash, an invoice reference hash, payment parties, token, amount, nonce, and expiry. Raw invoices, signatures, personal data, and keys never go on-chain.',
  },
  {
    q: 'Is this real money?',
    a: 'No. Signet runs on QDay Aevum testnet with tUSD8 test tokens, which have no monetary value. This is a challenge prototype, not a production payment service.',
  },
  {
    q: 'Will other chains or tokens be supported?',
    a: 'The design keeps document, verifier, model, wallet, token, and chain integrations behind adapters. Aevum and tUSD8 are the only configured targets for this MVP; nothing else is claimed as supported.',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <PublicNav />

      <section className="relative overflow-hidden" aria-labelledby="hero-headline">
        <Image
          src="/images/hero.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0" style={{ backgroundColor: 'var(--hero-overlay)' }} />
        <div className="relative mx-auto flex min-h-[92vh] max-w-page flex-col justify-center px-6 pt-24 pb-16">
          <div className="max-w-2xl">
            <h1 id="hero-headline" className="font-display text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              Verify the invoice before money moves.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
              An AI-assisted review checks the supplier&apos;s ML-DSA signature off-chain, surfaces payee and amount
              details, and waits for buyer approval before the invoice digest is anchored on Aevum.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/workbench" className="btn-primary">
                Review a sample invoice
              </Link>
              <a href="#how-it-works" className="btn-secondary !border-white/30 !text-white hover:!bg-white/10">
                See how verification works
              </a>
            </div>
          </div>
          <div className="mt-12 flex justify-start lg:justify-end lg:absolute lg:bottom-16 lg:right-6 lg:mt-0">
            <ProofPanel />
          </div>
        </div>
      </section>

      <section id="product" className="scroll-mt-20 py-24" aria-labelledby="product-headline">
        <div className="mx-auto max-w-page px-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">Product</p>
          <h2 id="product-headline" className="mt-3 max-w-2xl font-display text-3xl font-bold text-ink-primary sm:text-4xl">
            An evidence layer between the signed invoice and the payment.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-secondary">
            Signet is not another AP suite. It is a narrow control layer: prove who signed the document, show what is
            being paid, require a human decision, and leave a verifiable trail that links the payment to the exact
            reviewed evidence.
          </p>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <div className="bento-cell bento-noise p-6 lg:col-span-2">
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-display text-lg font-semibold text-ink-primary">Signature first, payment second</h3>
                <span className="mono-data shrink-0 text-success">Verified off-chain</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
                The supplier signs a canonical invoice envelope with ML-DSA-65. Signet verifies that exact signed
                payload off-chain before any payment UI unlocks. If verification fails, payment never unlocks.
              </p>
            </div>
            <div className="bento-cell bento-noise p-6">
              <h3 className="font-display text-lg font-semibold text-ink-primary">Human in the loop</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
                The agent prepares; the buyer decides. Approval is a wallet signature bound to payee, token, amount,
                nonce, and expiry.
              </p>
            </div>
            <div className="bento-cell bento-noise p-6">
              <h3 className="font-display text-lg font-semibold text-ink-primary">Fail closed</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
                Invalid signatures, unknown keys, duplicates, and policy breaches block the payment path with a
                specific reason. Nothing silently retries.
              </p>
            </div>
            <div className="bento-cell bento-noise p-6 lg:col-span-2">
              <h3 className="font-display text-lg font-semibold text-ink-primary">Minimal on-chain disclosure</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
                Aevum stores digests and payment facts, never documents. The invoice, the signature, and personal data
                stay off-chain in private storage. An auditor can reproduce the verification from the signed envelope,
                the public key, and the versioned record.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-20 bg-bg-secondary py-24" aria-labelledby="how-headline">
        <div className="mx-auto max-w-page px-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">How it works</p>
          <h2 id="how-headline" className="mt-3 max-w-2xl font-display text-3xl font-bold text-ink-primary sm:text-4xl">
            From signed document to anchored proof.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-secondary">
            Six steps, two of them on-chain. The workflow below is a sample narrative; the demo workbench runs the same
            sequence on real testnet transactions.
          </p>
        </div>
        <div className="mt-12">
          <PinnedWorkflow />
        </div>
      </section>

      <section className="py-24" aria-labelledby="walkthrough-headline">
        <div className="mx-auto max-w-page px-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">Walkthrough</p>
          <h2 id="walkthrough-headline" className="mt-3 max-w-2xl font-display text-3xl font-bold text-ink-primary sm:text-4xl">
            Read-only walkthrough with a sample invoice.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-secondary">
            The workbench demo uses synthetic invoices and real cryptography. You can run verification, see policy
            checks, and inspect evidence without connecting a wallet. Connecting is only needed to sign a real testnet
            transaction.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <div className="bento-cell bento-noise p-6">
              <span className="mono-data text-ink-muted">Step 1</span>
              <h3 className="mt-2 font-display font-semibold text-ink-primary">Pick a sample</h3>
              <p className="mt-2 text-sm text-ink-secondary">
                Choose the valid invoice, a tampered one, a revoked key, or an unknown signer.
              </p>
            </div>
            <div className="bento-cell bento-noise p-6">
              <span className="mono-data text-ink-muted">Step 2</span>
              <h3 className="mt-2 font-display font-semibold text-ink-primary">Run verification</h3>
              <p className="mt-2 text-sm text-ink-secondary">
                Watch the agent pipeline: intake, ML-DSA verification, extraction, policy. Every result is labeled
                off-chain.
              </p>
            </div>
            <div className="bento-cell bento-noise p-6">
              <span className="mono-data text-ink-muted">Step 3</span>
              <h3 className="mt-2 font-display font-semibold text-ink-primary">Inspect evidence</h3>
              <p className="mt-2 text-sm text-ink-secondary">
                Open the proof view for digests, fingerprints, verifier version, and audit events. Connect a wallet only
                when you want to approve a real testnet payment.
              </p>
            </div>
          </div>
          <div className="mt-8">
            <Link href="/workbench" className="btn-secondary">
              Open the read-only demo
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-bg-secondary py-24" aria-labelledby="adapters-headline">
        <div className="mx-auto max-w-page px-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">Plug-in architecture</p>
          <h2 id="adapters-headline" className="mt-3 max-w-2xl font-display text-3xl font-bold text-ink-primary sm:text-4xl">
            Adapters at every boundary. Aevum tUSD8 first.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-secondary">
            Aevum and tUSD8 are the current challenge target. Everything else is an extension point, not a shipped
            integration, and is not claimed as supported.
          </p>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {ADAPTERS.map((a) => (
              <div key={a.title} className="bento-cell bento-noise flex flex-col p-6">
                <h3 className="font-display text-lg font-semibold text-ink-primary">{a.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-secondary">{a.body}</p>
                <p className="mt-4 border-t border-border-subtle pt-3 text-xs font-semibold text-ink-muted">{a.status}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="security" className="scroll-mt-20 py-24" aria-labelledby="security-headline">
        <div className="mx-auto max-w-page px-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">Security and evidence</p>
          <h2 id="security-headline" className="mt-3 max-w-2xl font-display text-3xl font-bold text-ink-primary sm:text-4xl">
            Two zones. One clear boundary.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-secondary">
            Every claim in the interface names its zone. A signature check is off-chain evidence. A digest on Aevum is
            an on-chain reference. Neither pretends to be the other.
          </p>
          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            {SECURITY_ROWS.map((row) => (
              <div key={row.zone} className={`bento-cell bento-noise border-l-4 p-6 ${row.tone}`}>
                <h3 className="font-display text-lg font-semibold text-ink-primary">{row.zone}</h3>
                <ul className="mt-4 space-y-3">
                  {row.items.map((item) => (
                    <li key={item} className="flex gap-3 text-sm leading-relaxed text-ink-secondary">
                      <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-muted" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-bg-secondary py-24" aria-labelledby="scenarios-headline">
        <div className="mx-auto max-w-page px-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">Real-world scenarios</p>
          <h2 id="scenarios-headline" className="mt-3 max-w-2xl font-display text-3xl font-bold text-ink-primary sm:text-4xl">
            Built for the people who actually touch an invoice.
          </h2>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {SCENARIOS.map((s) => (
              <div key={s.audience} className={`bento-cell bento-noise p-6 ${s.span}`}>
                <h3 className="font-display text-lg font-semibold text-ink-primary">{s.audience}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-secondary">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="scroll-mt-20 py-24" aria-labelledby="faq-headline">
        <div className="mx-auto max-w-page px-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">FAQ</p>
          <h2 id="faq-headline" className="mt-3 max-w-2xl font-display text-3xl font-bold text-ink-primary sm:text-4xl">
            Straight answers about the boundary.
          </h2>
          <div className="mt-12 max-w-3xl space-y-4">
            {FAQ_ITEMS.map((item) => (
              <details key={item.q} className="bento-cell group p-6">
                <summary className="cursor-pointer list-none font-display font-semibold text-ink-primary marker:hidden">
                  <span className="flex items-center justify-between gap-4">
                    {item.q}
                    <span aria-hidden="true" className="text-ink-muted transition-transform duration-fast group-open:rotate-45">
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-4 border-t border-border-subtle pt-4 text-sm leading-relaxed text-ink-secondary">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-bg-secondary py-24" aria-labelledby="cta-headline">
        <div className="mx-auto max-w-page px-6">
          <div className="bento-cell bento-noise p-10 text-center lg:p-16">
            <h2 id="cta-headline" className="mx-auto max-w-xl font-display text-3xl font-bold text-ink-primary sm:text-4xl">
              Run the sample. Judge the evidence yourself.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-ink-secondary">
              The demo workspace loads synthetic invoices signed with real ML-DSA-65 keys. Verification is deterministic
              and reproducible; payment runs on Aevum testnet with tUSD8.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link href="/workbench" className="btn-primary">
                Review a sample invoice
              </Link>
              <a
                href="https://explorer-test.qday.info"
                className="btn-secondary"
                target="_blank"
                rel="noopener noreferrer"
              >
                Aevum explorer
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border-default bg-bg-primary py-12">
        <div className="mx-auto flex max-w-page flex-col gap-6 px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-display text-lg font-bold text-ink-primary">Signet</p>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-ink-muted">
              Challenge prototype for the QDay Aevum Builder Challenge. Testnet only, synthetic data, no real funds.
              ML-DSA verification is off-chain; Aevum stores digest and record-hash references.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-secondary">
            <a href="https://qday.io/build" target="_blank" rel="noopener noreferrer" className="hover:text-accent">
              QDay build docs
            </a>
            <a href="https://explorer-test.qday.info" target="_blank" rel="noopener noreferrer" className="hover:text-accent">
              Aevum explorer
            </a>
            <a href="https://github.com/dr4ken-soul/Signet" target="_blank" rel="noopener noreferrer" className="hover:text-accent">
              Source
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
