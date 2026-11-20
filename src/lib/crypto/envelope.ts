export type EnvelopeV1 = {
  envelope_version: 1;
  algorithm: 'ML-DSA';
  parameter_set: 'ML-DSA-65';
  invoice_ref: string;
  document_sha3_256: string;
  payment_context: {
    payee_address: string;
    token_address: string;
    token_decimals: number;
    amount_units: string;
    currency_symbol: string;
  };
  signed_at: string;
  signer_note?: string;
};

export const ENVELOPE_DOMAIN = 'signet.invoice.v1';

export function canonicalJson(value: unknown): string {
  return canonicalize(value);
}

function canonicalize(value: unknown): string {
  if (value === null || typeof value === 'number') {
    if (typeof value === 'number' && !Number.isFinite(value)) {
      throw new Error('Cannot canonicalize non-finite number');
    }
    return JSON.stringify(value);
  }
  if (typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalize(v)}`).join(',')}}`;
  }
  throw new Error(`Cannot canonicalize value of type ${typeof value}`);
}
