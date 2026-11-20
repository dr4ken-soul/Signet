export type InvoiceState =
  | 'received'
  | 'extracting'
  | 'verifying'
  | 'needs_review'
  | 'ready_for_approval'
  | 'awaiting_wallet'
  | 'submitted'
  | 'confirmed'
  | 'rejected'
  | 'expired'
  | 'failed';

export type InvoiceLine = {
  description: string;
  quantity: number;
  unit: string;
  unit_price_units: string;
  total_units: string;
};

export type InvoiceRecord = {
  id: string;
  workspace_id: string;
  external_ref: string;
  external_ref_hash: string;
  supplier_name: string;
  payee_address: string;
  token_address: string;
  token_symbol: string;
  token_decimals: number;
  amount_units: string;
  currency_symbol: string;
  issue_date: string;
  due_at: string;
  state: InvoiceState;
  document_sha3_256: string;
  document_text: string;
  lines: InvoiceLine[];
  extracted_fields: Record<string, { value: string; confidence: number; source: string }>;
  signer_key_id: string;
  signer_fingerprint: string | null;
  created_at: string;
  updated_at: string;
  verification_run_id: string | null;
  policy_version: string | null;
  approval: {
    approver_wallet: string | null;
    decision: 'approved' | 'rejected' | null;
    nonce: string | null;
    expires_at: string | null;
    tx_hash: string | null;
  } | null;
  chain: {
    chain_id: number | null;
    contract_address: string | null;
    tx_hash: string | null;
    block_number: number | null;
    event_name: string | null;
    status: 'unknown' | 'pending' | 'confirmed' | 'reverted' | 'failed';
    confirmed_at: string | null;
  } | null;
};

export type VerificationRun = {
  id: string;
  invoice_id: string;
  result: 'valid' | 'invalid';
  reason_code: string;
  algorithm: string;
  parameter_set: string;
  key_fingerprint: string;
  payload_sha3_256: string;
  envelope_sha3_256: string;
  verifier_version: string;
  verified_off_chain: true;
  verified_at: string;
  report_sha3_256: string;
};

export const STATE_LABELS: Record<InvoiceState, string> = {
  received: 'Received',
  extracting: 'Extracting',
  verifying: 'Verifying',
  needs_review: 'Needs review',
  ready_for_approval: 'Ready for approval',
  awaiting_wallet: 'Approval required',
  submitted: 'Transaction submitted',
  confirmed: 'Anchored on-chain',
  rejected: 'Rejected',
  expired: 'Expired',
  failed: 'Failed',
};

export const STATE_TONES: Record<InvoiceState, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  received: 'neutral',
  extracting: 'info',
  verifying: 'info',
  needs_review: 'warning',
  ready_for_approval: 'info',
  awaiting_wallet: 'warning',
  submitted: 'info',
  confirmed: 'success',
  rejected: 'error',
  expired: 'error',
  failed: 'error',
};

export const VERIFICATION_OFF_CHAIN_LABEL = 'Verified off-chain';
export const ANCHOR_ON_CHAIN_LABEL = 'Anchored on-chain';
