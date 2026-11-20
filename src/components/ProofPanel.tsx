export function ProofPanel() {
  const rows = [
    { label: 'Signature', value: 'Verified off-chain', tone: 'text-success' },
    { label: 'Payee', value: 'Review details', tone: 'text-warning' },
    { label: 'Buyer approval', value: 'Required', tone: 'text-warning' },
    { label: 'Digest anchor', value: 'Pending approval', tone: 'text-info' },
  ] as const;

  return (
    <div className="bento-cell bento-noise w-full max-w-md p-6 text-left" aria-label="Sample invoice proof panel">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-white/70">Sample invoice</span>
        <span className="mono-data text-white/60">INV-2041-A</span>
      </div>
      <dl className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 border-t border-white/10 pt-3">
            <dt className="text-sm text-white/70">{row.label}</dt>
            <dd className={`text-sm font-semibold ${row.tone}`}>{row.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-5 border-t border-white/10 pt-3 text-xs leading-relaxed text-white/50">
        ML-DSA verification runs off-chain. Aevum records the document digest and verification-record hash; it never
        verifies the signature itself.
      </p>
    </div>
  );
}
