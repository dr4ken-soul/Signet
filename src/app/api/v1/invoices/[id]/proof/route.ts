import { NextResponse } from 'next/server';
import { seedFixtures } from '@/server/storage/fixtures';
import { getInvoice, getLatestVerificationRun, listAudit } from '@/server/storage/memory-store';
import { defineSignetChain, explorerTxUrl, explorerAddressUrl } from '@/lib/chains/aevum';

declare global {
  var __signetSeeded: boolean | undefined;
}

async function ensureSeeded() {
  if (!globalThis.__signetSeeded) {
    seedFixtures();
    globalThis.__signetSeeded = true;
  }
}

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  await ensureSeeded();
  const { id } = await params;
  const invoice = getInvoice(id);
  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  const run = getLatestVerificationRun(id);
  const chain = defineSignetChain({
    NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
    NEXT_PUBLIC_AEVUM_RPC_URL: process.env.NEXT_PUBLIC_AEVUM_RPC_URL,
    NEXT_PUBLIC_AEVUM_EXPLORER_URL: process.env.NEXT_PUBLIC_AEVUM_EXPLORER_URL,
  });

  return NextResponse.json({
    invoice: {
      id: invoice.id,
      external_ref: invoice.external_ref,
      document_digest: `0x${invoice.document_sha3_256}`,
      state: invoice.state,
      amount_display: `${Number(invoice.amount_units) / 10 ** invoice.token_decimals} ${invoice.token_symbol}`,
      payee_address: invoice.payee_address,
      signer_fingerprint: invoice.signer_fingerprint,
    },
    verification: run
      ? {
          result: run.result,
          reason_code: run.reason_code,
          algorithm: run.algorithm,
          parameter_set: run.parameter_set,
          key_fingerprint: run.key_fingerprint,
          payload_sha3_256: run.payload_sha3_256,
          envelope_sha3_256: run.envelope_sha3_256,
          report_sha3_256: run.report_sha3_256,
          verifier_version: run.verifier_version,
          verified_off_chain: run.verified_off_chain,
          verified_at: run.verified_at,
          claim_supported: 'Off-chain verification record. Reproducible with the signed envelope, public key, and this verifier version.',
        }
      : null,
    chain_reference:
      invoice.chain && invoice.chain.status === 'confirmed'
        ? {
            chain_id: invoice.chain.chain_id,
            contract_address: invoice.chain.contract_address,
            tx_hash: invoice.chain.tx_hash,
            block_number: invoice.chain.block_number,
            event_name: invoice.chain.event_name,
            explorer_url: invoice.chain.tx_hash ? explorerTxUrl(chain.blockExplorers!.default.url, invoice.chain.tx_hash) : null,
            confirmed_at: invoice.chain.confirmed_at,
            claim_supported: 'On-chain digest and verification-record hash reference. Not an EVM proof of ML-DSA validity.',
          }
        : null,
    audit: listAudit(invoice.workspace_id, 20)
      .filter((e) => e.object_id === id)
      .map((e) => ({ action: e.action, outcome: e.outcome, actor: e.actor_type, detail: e.detail, at: e.created_at })),
    explorer: {
      base: explorerAddressUrl(chain.blockExplorers!.default.url, invoice.payee_address),
    },
  });
}
