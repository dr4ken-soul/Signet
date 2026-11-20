import { createHash, randomBytes } from 'node:crypto';
import type {
  InvoiceRecord,
  InvoiceState,
  VerificationRun,
} from '@/features/invoices/types';
import type { PolicyRuleSet, PolicyResult } from '@/server/agent/policy';

export type SignerKeyRecord = {
  id: string;
  workspace_id: string;
  label: string;
  public_key_hex: string;
  algorithm: string;
  parameter_set: string;
  fingerprint: string;
  status: 'active' | 'revoked';
  created_at: string;
  revoked_at: string | null;
};

export type AuditEvent = {
  id: string;
  workspace_id: string;
  actor_type: 'agent' | 'approver' | 'system';
  actor_id: string;
  action: string;
  object_id: string;
  outcome: 'ok' | 'blocked' | 'error';
  detail: string;
  created_at: string;
};

export type ApprovalRecord = {
  invoice_id: string;
  approver_wallet: string;
  decision: 'approved' | 'rejected';
  policy_version: string;
  nonce: string;
  expires_at: string;
  created_at: string;
  mode: 'contract' | 'transfer';
  intent_digest: string;
};

type StoreShape = {
  invoices: Map<string, InvoiceRecord>;
  verificationRuns: Map<string, VerificationRun>;
  signerKeys: Map<string, SignerKeyRecord>;
  approvals: Map<string, ApprovalRecord>;
  auditEvents: AuditEvent[];
  policy: PolicyRuleSet;
  policyResultByInvoice: Map<string, PolicyResult>;
};

const globalForStore = globalThis as unknown as { __signetStore?: StoreShape };

function createStore(): StoreShape {
  return {
    invoices: new Map(),
    verificationRuns: new Map(),
    signerKeys: new Map(),
    approvals: new Map(),
    auditEvents: [],
    policy: {
      version: 'policy-1.0.0',
      allowed_payees: [],
      allowed_tokens: [],
      max_amount_units: '500000000000',
      require_future_due_date: false,
    },
    policyResultByInvoice: new Map(),
  };
}

export function store(): StoreShape {
  if (!globalForStore.__signetStore) {
    globalForStore.__signetStore = createStore();
  }
  return globalForStore.__signetStore;
}

export function newId(prefix: string): string {
  return `${prefix}_${randomBytes(8).toString('hex')}`;
}

export function sha256Hex(data: string | Uint8Array): string {
  const h = createHash('sha3-256');
  h.update(typeof data === 'string' ? Buffer.from(data, 'utf8') : Buffer.from(data));
  return h.digest('hex');
}

export function refHash(externalRef: string): string {
  return sha256Hex(`signet.invoice-ref.v1:${externalRef.trim().toLowerCase()}`);
}

export function listInvoices(workspaceId: string): InvoiceRecord[] {
  return [...store().invoices.values()]
    .filter((i) => i.workspace_id === workspaceId)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export function getInvoice(id: string): InvoiceRecord | undefined {
  return store().invoices.get(id);
}

export function putInvoice(invoice: InvoiceRecord): void {
  store().invoices.set(invoice.id, invoice);
}

export function updateInvoiceState(id: string, state: InvoiceState): InvoiceRecord | undefined {
  const inv = store().invoices.get(id);
  if (!inv) return undefined;
  inv.state = state;
  inv.updated_at = new Date().toISOString();
  return inv;
}

export function putVerificationRun(run: VerificationRun): void {
  store().verificationRuns.set(run.id, run);
}

export function getVerificationRun(id: string): VerificationRun | undefined {
  return store().verificationRuns.get(id);
}

export function getLatestVerificationRun(invoiceId: string): VerificationRun | undefined {
  let latest: VerificationRun | undefined;
  for (const run of store().verificationRuns.values()) {
    if (run.invoice_id === invoiceId && (!latest || run.verified_at > latest.verified_at)) {
      latest = run;
    }
  }
  return latest;
}

export function findSignerKeyByFingerprint(fingerprint: string): SignerKeyRecord | undefined {
  for (const key of store().signerKeys.values()) {
    if (key.fingerprint === fingerprint) return key;
  }
  return undefined;
}

export function putSignerKey(key: SignerKeyRecord): void {
  store().signerKeys.set(key.id, key);
}

export function listSignerKeys(workspaceId: string): SignerKeyRecord[] {
  return [...store().signerKeys.values()].filter((k) => k.workspace_id === workspaceId);
}

export function isDuplicateInvoiceRef(workspaceId: string, externalRefHash: string, excludeInvoiceId?: string): boolean {
  for (const inv of store().invoices.values()) {
    if (inv.workspace_id === workspaceId && inv.external_ref_hash === externalRefHash && inv.id !== excludeInvoiceId) {
      return inv.state !== 'rejected';
    }
  }
  return false;
}

export function putApproval(approval: ApprovalRecord): void {
  store().approvals.set(approval.invoice_id, approval);
}

export function getApproval(invoiceId: string): ApprovalRecord | undefined {
  return store().approvals.get(invoiceId);
}

export function putPolicyResult(invoiceId: string, result: PolicyResult): void {
  store().policyResultByInvoice.set(invoiceId, result);
}

export function getPolicyResult(invoiceId: string): PolicyResult | undefined {
  return store().policyResultByInvoice.get(invoiceId);
}

export function getPolicy(): PolicyRuleSet {
  return store().policy;
}

export function pushAudit(event: Omit<AuditEvent, 'id' | 'created_at'>): AuditEvent {
  const full: AuditEvent = {
    ...event,
    id: newId('audit'),
    created_at: new Date().toISOString(),
  };
  store().auditEvents.push(full);
  return full;
}

export function listAudit(workspaceId: string, limit = 50): AuditEvent[] {
  return store()
    .auditEvents.filter((e) => e.workspace_id === workspaceId)
    .slice(-limit)
    .reverse();
}
