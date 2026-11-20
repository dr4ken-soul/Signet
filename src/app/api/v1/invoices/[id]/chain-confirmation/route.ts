import { NextResponse } from 'next/server';
import { createPublicClient, http, formatUnits, parseAbi, toEventHash } from 'viem';
import { seedFixtures } from '@/server/storage/fixtures';
import { getInvoice, getApproval, updateInvoiceState, pushAudit } from '@/server/storage/memory-store';
import { defineSignetChain, explorerTxUrl } from '@/lib/chains/aevum';

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

const ANCHOR_ABI = parseAbi([
  'event PaymentAnchored(bytes32 indexed invoiceRefHash, address indexed payer, address indexed payee, address token, uint256 amount, uint256 nonce, uint64 expiry, bytes32 documentDigest, bytes32 verificationRecordHash)',
]);

const ERC20_ABI = parseAbi(['event Transfer(address indexed from, address indexed to, uint256 value)']);

export async function POST(request: Request, { params }: Params) {
  await ensureSeeded();
  const { id } = await params;
  const invoice = getInvoice(id);
  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const txHash: string | undefined = body?.tx_hash;
  if (!txHash || !/^0x[0-9a-fA-F]{64}$/.test(txHash)) {
    return NextResponse.json({ error: 'A valid 32-byte tx_hash is required' }, { status: 400 });
  }

  const chain = defineSignetChain({
    NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
    NEXT_PUBLIC_AEVUM_RPC_URL: process.env.NEXT_PUBLIC_AEVUM_RPC_URL,
    NEXT_PUBLIC_AEVUM_EXPLORER_URL: process.env.NEXT_PUBLIC_AEVUM_EXPLORER_URL,
  });

  const client = createPublicClient({
    chain,
    transport: http(process.env.NEXT_PUBLIC_AEVUM_RPC_URL ?? 'https://rpc-test.qday.info'),
  });

  let receipt;
  try {
    receipt = await client.getTransactionReceipt({ hash: txHash as `0x${string}` });
  } catch {
    updateInvoiceState(id, 'submitted');
    pushAudit({
      workspace_id: invoice.workspace_id,
      actor_type: 'system',
      actor_id: 'chain-confirmation',
      action: 'receipt_not_found',
      object_id: id,
      outcome: 'blocked',
      detail: `Receipt for ${txHash} is not available yet; state stays submitted, not confirmed.`,
    });
    return NextResponse.json(
      {
        state: 'submitted',
        tx_hash: txHash,
        explorer_url: explorerTxUrl(chain.blockExplorers!.default.url, txHash),
        detail: 'Receipt not found yet. The transaction is submitted but not confirmed.',
      },
      { status: 202 },
    );
  }

  if (receipt.status !== 'success') {
    updateInvoiceState(id, 'failed');
    pushAudit({
      workspace_id: invoice.workspace_id,
      actor_type: 'system',
      actor_id: 'chain-confirmation',
      action: 'tx_reverted',
      object_id: id,
      outcome: 'blocked',
      detail: `Transaction ${txHash} reverted on-chain.`,
    });
    return NextResponse.json({ state: 'failed', tx_hash: txHash, detail: 'Transaction reverted.' }, { status: 200 });
  }

  const approval = getApproval(id);
  const anchorAddress = process.env.NEXT_PUBLIC_ANCHOR_CONTRACT_ADDRESS;
  const expectedPayer = approval?.approver_wallet?.toLowerCase();
  const expectedPayee = invoice.payee_address.toLowerCase();
  const expectedAmount = BigInt(invoice.amount_units);

  const anchorLog = anchorAddress
    ? receipt.logs.find(
        (log) =>
          log.address.toLowerCase() === anchorAddress.toLowerCase() &&
          log.topics[0] === toEventHash(ANCHOR_ABI[0]),
      )
    : undefined;

  const transferLog = receipt.logs.find(
    (log) =>
      log.address.toLowerCase() === invoice.token_address.toLowerCase() &&
      log.topics[0] === toEventHash(ERC20_ABI[0]),
  );

  let anchored = false;
  if (anchorLog) {
    try {
      const [invoiceRefHash, payer, payee, token, amount] = decodeAnchorLog(anchorLog.data, anchorLog.topics);
      anchored =
        payer.toLowerCase() === expectedPayer &&
        payee.toLowerCase() === expectedPayee &&
        token.toLowerCase() === invoice.token_address.toLowerCase() &&
        amount === expectedAmount &&
        invoiceRefHash === `0x${invoice.external_ref_hash}`;
    } catch {
      anchored = false;
    }
  }

  let paid = false;
  if (transferLog && transferLog.topics.length >= 3) {
    const fromTopic = transferLog.topics[1];
    const toTopic = transferLog.topics[2];
    if (fromTopic && toTopic) {
      const from = `0x${fromTopic.slice(26)}`;
      const to = `0x${toTopic.slice(26)}`;
      const value = BigInt(transferLog.data);
      paid = to.toLowerCase() === expectedPayee && value === expectedAmount && (!expectedPayer || from.toLowerCase() === expectedPayer);
    }
  }

  if (!anchored && !paid) {
    updateInvoiceState(id, 'failed');
    pushAudit({
      workspace_id: invoice.workspace_id,
      actor_type: 'system',
      actor_id: 'chain-confirmation',
      action: 'event_mismatch',
      object_id: id,
      outcome: 'blocked',
      detail: 'Receipt confirmed but no expected token transfer or anchor event matched this invoice.',
    });
    return NextResponse.json(
      {
        state: 'failed',
        tx_hash: txHash,
        detail: 'Confirmed transaction did not contain the expected payment event for this invoice. Marked failed for review.',
      },
      { status: 200 },
    );
  }

  const confirmedAt = new Date().toISOString();
  updateInvoiceState(id, 'confirmed');
  const inv = getInvoice(id)!;
  inv.chain = {
    chain_id: chain.id,
    contract_address: anchorAddress ?? null,
    tx_hash: txHash,
    block_number: Number(receipt.blockNumber),
    event_name: anchored ? 'PaymentAnchored' : 'Transfer',
    status: 'confirmed',
    confirmed_at: confirmedAt,
  };

  pushAudit({
    workspace_id: invoice.workspace_id,
    actor_type: 'system',
    actor_id: 'chain-confirmation',
    action: anchored ? 'payment_and_anchor_confirmed' : 'payment_confirmed',
    object_id: id,
    outcome: 'ok',
    detail: `block ${receipt.blockNumber}, event ${anchored ? 'PaymentAnchored' : 'Transfer'}`,
  });

  return NextResponse.json({
    state: 'confirmed',
    anchored,
    event_name: anchored ? 'PaymentAnchored' : 'Transfer',
    tx_hash: txHash,
    block_number: Number(receipt.blockNumber),
    chain_id: chain.id,
    explorer_url: explorerTxUrl(chain.blockExplorers!.default.url, txHash),
    amount_display: `${formatUnits(expectedAmount, invoice.token_decimals)} ${invoice.token_symbol}`,
    document_digest: `0x${invoice.document_sha3_256}`,
  });
}

function decodeAnchorLog(data: string, topics: string[]): [string, string, string, string, bigint] {
  const invoiceRefHash = topics[1];
  const payer = `0x${topics[2].slice(26)}`;
  const payee = `0x${topics[3].slice(26)}`;
  const token = `0x${data.slice(2 + 64, 2 + 128).slice(24)}`;
  const amount = BigInt(`0x${data.slice(2 + 128, 2 + 192)}`);
  return [invoiceRefHash, payer, payee, token, amount];
}
