import { sha3Hex, buildPayload, signPayload, generateKeyPair, keyFingerprint } from '@/server/verifier/ml-dsa';
import type { EnvelopeV1 } from '@/lib/crypto/envelope';
import type { InvoiceRecord } from '@/features/invoices/types';
import { refHash, putInvoice, putSignerKey, type SignerKeyRecord } from '@/server/storage/memory-store';

const TUSD8 = '0x456569838f1d43009A91ebA4263147Afd7233483';
export const WORKSPACE = 'ws_demo';

export type FixtureEnvelope = {
  invoiceId: string;
  payloadJson: string;
  signatureHex: string;
  publicKeyHex: string;
};

export const fixtureEnvelopes = new Map<string, FixtureEnvelope>();

const FIXED_SEED_SUPPLIER_A = Uint8Array.from({ length: 32 }, (_, i) => (i * 7 + 11) & 0xff);
const FIXED_SEED_SUPPLIER_A2 = Uint8Array.from({ length: 32 }, (_, i) => (i * 17 + 23) & 0xff);
const FIXED_SEED_SUPPLIER_B = Uint8Array.from({ length: 32 }, (_, i) => (i * 13 + 5) & 0xff);
const FIXED_SEED_ATTACKER = Uint8Array.from({ length: 32 }, (_, i) => (i * 29 + 3) & 0xff);

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function makeEnvelope(params: {
  invoiceRef: string;
  documentText: string;
  payee: string;
  amountUnits: string;
  signedAt: string;
}): { envelope: EnvelopeV1; payloadJson: string } {
  const envelope: EnvelopeV1 = {
    envelope_version: 1,
    algorithm: 'ML-DSA',
    parameter_set: 'ML-DSA-65',
    invoice_ref: params.invoiceRef,
    document_sha3_256: sha3Hex(new TextEncoder().encode(params.documentText)),
    payment_context: {
      payee_address: params.payee,
      token_address: TUSD8,
      token_decimals: 6,
      amount_units: params.amountUnits,
      currency_symbol: 'tUSD8',
    },
    signed_at: params.signedAt,
  };
  return { envelope, payloadJson: buildPayload(envelope) };
}

type SeededKey = { record: SignerKeyRecord; secretKeyHex: string };

function seedKey(workspaceId: string, id: string, label: string, seed: Uint8Array, status: 'active' | 'revoked', registerInStore = true): SeededKey {
  const kp = generateKeyPair(seed);
  const record: SignerKeyRecord = {
    id,
    workspace_id: workspaceId,
    label,
    public_key_hex: kp.publicKeyHex,
    algorithm: 'ML-DSA',
    parameter_set: 'ML-DSA-65',
    fingerprint: keyFingerprint(kp.publicKeyHex),
    status,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    revoked_at: status === 'revoked' ? new Date().toISOString() : null,
  };
  if (registerInStore) putSignerKey(record);
  return { record, secretKeyHex: kp.secretKeyHex };
}

function buildInvoice(params: {
  id: string;
  externalRef: string;
  supplierName: string;
  payee: string;
  amountUnits: string;
  dueAt: string;
  documentText: string;
  state: InvoiceRecord['state'];
  signerKeyId: string;
  signerFingerprint: string;
}): InvoiceRecord {
  const docBytes = new TextEncoder().encode(params.documentText);
  return {
    id: params.id,
    workspace_id: WORKSPACE,
    external_ref: params.externalRef,
    external_ref_hash: refHash(params.externalRef),
    supplier_name: params.supplierName,
    payee_address: params.payee,
    token_address: TUSD8,
    token_symbol: 'tUSD8',
    token_decimals: 6,
    amount_units: params.amountUnits,
    currency_symbol: 'tUSD8',
    issue_date: new Date().toISOString().slice(0, 10),
    due_at: params.dueAt,
    state: params.state,
    document_sha3_256: sha3Hex(docBytes),
    document_text: params.documentText,
    lines: [
      {
        description: 'ML-DSA signing service, monthly batch (sample)',
        quantity: 12,
        unit: 'hour',
        unit_price_units: (BigInt(params.amountUnits) / 12n).toString(),
        total_units: params.amountUnits,
      },
    ],
    extracted_fields: {
      invoice_number: { value: params.externalRef, confidence: 0.99, source: 'document text' },
      supplier: { value: params.supplierName, confidence: 0.97, source: 'document text' },
      amount: { value: `${Number(params.amountUnits) / 1e6} tUSD8`, confidence: 0.96, source: 'document text' },
      payee: { value: params.payee, confidence: 0.94, source: 'document text' },
      due_date: { value: params.dueAt.slice(0, 10), confidence: 0.98, source: 'document text' },
    },
    signer_key_id: params.signerKeyId,
    signer_fingerprint: params.signerFingerprint,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    verification_run_id: null,
    policy_version: null,
    approval: null,
    chain: null,
  };
}

export function seedFixtures(): void {
  const keyActive = seedKey(WORKSPACE, 'sk_supplier_a', 'Supplier A', FIXED_SEED_SUPPLIER_A, 'active');
  seedKey(WORKSPACE, 'sk_supplier_a2', 'Supplier A (rotation)', FIXED_SEED_SUPPLIER_A2, 'active');
  const keyRevoked = seedKey(WORKSPACE, 'sk_supplier_b', 'Supplier B (revoked)', FIXED_SEED_SUPPLIER_B, 'revoked');
  const keyAttacker = seedKey(WORKSPACE, 'sk_unregistered', 'Unregistered signer (fixture)', FIXED_SEED_ATTACKER, 'active', false);

  const payeeA = '0x00000000000000000000000000000000000dEEA1';
  const payeeUnknown = '0x00000000000000000000000000000000000dEEB2';

  function register(
    id: string,
    externalRef: string,
    supplierName: string,
    payee: string,
    amountUnits: string,
    documentText: string,
    key: SeededKey,
    tamper: 'none' | 'amount' = 'none',
  ) {
    const { envelope, payloadJson } = makeEnvelope({
      invoiceRef: externalRef,
      documentText,
      payee,
      amountUnits,
      signedAt: new Date().toISOString(),
    });
    const signatureHex = signPayload(payloadJson, key.secretKeyHex);
    let finalPayload = payloadJson;
    if (tamper === 'amount') {
      const parsed = JSON.parse(payloadJson) as { envelope: EnvelopeV1 };
      parsed.envelope.payment_context.amount_units = '990000000';
      finalPayload = JSON.stringify(parsed);
    }
    const invoice = buildInvoice({
      id,
      externalRef,
      supplierName,
      payee,
      amountUnits,
      dueAt: daysFromNow(21),
      documentText,
      state: 'received',
      signerKeyId: key.record.id,
      signerFingerprint: key.record.fingerprint,
    });
    putInvoice(invoice);
    fixtureEnvelopes.set(id, {
      invoiceId: id,
      payloadJson: finalPayload,
      signatureHex,
      publicKeyHex: key.record.public_key_hex,
    });
    void envelope;
  }

  register(
    'inv_sample_1',
    'INV-2041-A',
    'Supplier A (sample)',
    payeeA,
    '1850000000',
    [
      'INVOICE INV-2041-A',
      'Supplier A (sample)',
      'Pay to: ' + payeeA,
      'Amount: 1850.00 tUSD8',
      'Terms: Net 21',
      'Sample data for the Signet walkthrough. Not a real invoice.',
    ].join('\n'),
    keyActive,
  );

  register(
    'inv_bad_sig',
    'INV-2042-B',
    'Supplier A (sample), tampered',
    payeeA,
    '900000000',
    [
      'INVOICE INV-2042-B',
      'Supplier A (sample)',
      'Pay to: ' + payeeA,
      'Amount: 900.00 tUSD8',
      'Sample data for the tamper case. Not a real invoice.',
    ].join('\n'),
    keyActive,
    'amount',
  );

  register(
    'inv_revoked',
    'INV-2043-C',
    'Supplier B (revoked)',
    payeeA,
    '420000000',
    [
      'INVOICE INV-2043-C',
      'Supplier B (revoked)',
      'Pay to: ' + payeeA,
      'Amount: 420.00 tUSD8',
      'Sample data for the revoked-key case. Not a real invoice.',
    ].join('\n'),
    keyRevoked,
  );

  register(
    'inv_unknown_key',
    'INV-2044-D',
    'Unregistered signer',
    payeeUnknown,
    '700000000',
    [
      'INVOICE INV-2044-D',
      'Unregistered signer',
      'Pay to: ' + payeeUnknown,
      'Amount: 700.00 tUSD8',
      'Sample data for the unknown-key case. Not a real invoice.',
    ].join('\n'),
    keyAttacker,
  );
}
