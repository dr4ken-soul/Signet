import { NextResponse } from 'next/server';
import { randomBytes, createHash } from 'node:crypto';
import { seedFixtures } from '@/server/storage/fixtures';
import {
  getInvoice,
  getLatestVerificationRun,
  getPolicyResult,
  putApproval,
  getApproval,
  updateInvoiceState,
  pushAudit,
  getPolicy,
} from '@/server/storage/memory-store';

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

export async function POST(request: Request, { params }: Params) {
  await ensureSeeded();
  const { id } = await params;
  const invoice = getInvoice(id);
  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const decision: 'approved' | 'rejected' | undefined = body?.decision;
  const approverWallet: string | undefined = body?.approver_wallet;

  if (decision !== 'approved' && decision !== 'rejected') {
    return NextResponse.json({ error: 'decision must be "approved" or "rejected"' }, { status: 400 });
  }
  if (!approverWallet || !/^0x[0-9a-fA-F]{40}$/.test(approverWallet)) {
    return NextResponse.json({ error: 'A valid approver_wallet address is required' }, { status: 400 });
  }

  if (decision === 'rejected') {
    updateInvoiceState(id, 'rejected');
    pushAudit({
      workspace_id: invoice.workspace_id,
      actor_type: 'approver',
      actor_id: approverWallet,
      action: 'payment_rejected',
      object_id: id,
      outcome: 'ok',
      detail: 'Buyer rejected the payment.',
    });
    return NextResponse.json({ decision, state: 'rejected' });
  }

  if (invoice.state !== 'ready_for_approval') {
    return NextResponse.json(
      { error: `Invoice is in state ${invoice.state}; approval requires ready_for_approval`, state: invoice.state },
      { status: 409 },
    );
  }

  const run = getLatestVerificationRun(id);
  const policy = getPolicyResult(id);
  if (!run || run.result !== 'valid') {
    return NextResponse.json({ error: 'No valid off-chain verification on record; approval blocked' }, { status: 409 });
  }
  if (!policy || !policy.pass) {
    return NextResponse.json({ error: 'Policy checks have not passed; approval blocked' }, { status: 409 });
  }

  const anchorAddress = process.env.NEXT_PUBLIC_ANCHOR_CONTRACT_ADDRESS;
  const mode: 'contract' | 'transfer' = anchorAddress ? 'contract' : 'transfer';

  const nonce = `0x${randomBytes(16).toString('hex')}`;
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  const intent = {
    intent_version: 1,
    invoice_id: id,
    invoice_ref: invoice.external_ref,
    payer: approverWallet,
    payee: invoice.payee_address,
    token: invoice.token_address,
    amount_units: invoice.amount_units,
    nonce,
    expires_at: expiresAt,
    policy_version: policy.policy_version,
    document_digest: `0x${invoice.document_sha3_256}`,
    verification_record_hash: `0x${run.report_sha3_256}`,
  };
  const intentDigest = `0x${createHash('sha3-256').update(JSON.stringify(intent)).digest('hex')}`;

  putApproval({
    invoice_id: id,
    approver_wallet: approverWallet,
    decision: 'approved',
    policy_version: policy.policy_version,
    nonce,
    expires_at: expiresAt,
    created_at: new Date().toISOString(),
    mode,
    intent_digest: intentDigest,
  });

  updateInvoiceState(id, 'awaiting_wallet');
  pushAudit({
    workspace_id: invoice.workspace_id,
    actor_type: 'approver',
    actor_id: approverWallet,
    action: 'approval_intent_created',
    object_id: id,
    outcome: 'ok',
    detail: `mode=${mode} nonce=${nonce} policy=${policy.policy_version}`,
  });

  return NextResponse.json({
    decision: 'approved',
    state: 'awaiting_wallet',
    mode,
    intent,
    intent_digest: intentDigest,
    anchor_contract: mode === 'contract' ? anchorAddress : null,
    token: {
      address: invoice.token_address,
      symbol: invoice.token_symbol,
      decimals: invoice.token_decimals,
    },
    policy_version_current: getPolicy().version,
    note:
      mode === 'contract'
        ? 'Contract mode: call payAndAnchor on the deployed anchor contract with these fields.'
        : 'Direct transfer mode: no anchor contract is deployed yet; the buyer signs a plain ERC-20 transfer and anchoring will be available after deployment.',
  });
}

export async function GET(_request: Request, { params }: Params) {
  await ensureSeeded();
  const { id } = await params;
  const approval = getApproval(id);
  if (!approval) {
    return NextResponse.json({ error: 'No approval on record for this invoice' }, { status: 404 });
  }
  return NextResponse.json({ approval });
}
