import { verifySignature, type VerifyReport } from '@/server/verifier/ml-dsa';
import { evaluatePolicy, type PolicyResult, type PolicyRuleSet } from '@/server/agent/policy';
import {
  store,
  getInvoice,
  getLatestVerificationRun,
  getVerificationRun,
  putVerificationRun,
  findSignerKeyByFingerprint,
  isDuplicateInvoiceRef,
  putPolicyResult,
  updateInvoiceState,
  pushAudit,
  newId,
} from '@/server/storage/memory-store';
import { fixtureEnvelopes } from '@/server/storage/fixtures';
import type { InvoiceRecord, VerificationRun } from '@/features/invoices/types';

export type AgentStep = {
  step: string;
  actor: 'agent' | 'verifier' | 'policy';
  outcome: 'ok' | 'blocked';
  detail: string;
};

export type AgentRunResult = {
  invoice: InvoiceRecord;
  verification: VerificationRun | null;
  policy: PolicyResult | null;
  steps: AgentStep[];
};

export async function runVerification(invoiceId: string): Promise<AgentRunResult> {
  const steps: AgentStep[] = [];
  const invoice = getInvoice(invoiceId);
  if (!invoice) throw new Error(`Invoice not found: ${invoiceId}`);

  const fixture = fixtureEnvelopes.get(invoiceId);
  if (!fixture) {
    throw new Error('No signed envelope is available for this invoice in the demo dataset');
  }

  updateInvoiceState(invoiceId, 'verifying');
  steps.push({
    step: 'intake',
    actor: 'agent',
    outcome: 'ok',
    detail: `Loaded signed envelope for ${invoice.external_ref}. Document digest ${invoice.document_sha3_256.slice(0, 16)}... computed from exact bytes.`,
  });

  const report: VerifyReport = verifySignature({
    payloadJson: fixture.payloadJson,
    signatureHex: fixture.signatureHex,
    publicKeyHex: fixture.publicKeyHex,
  });

  const keyRecord = report.reason_code === 'VALID' ? findSignerKeyByFingerprint(report.signer_key_fingerprint) : undefined;
  let keyStatus: 'active' | 'unknown' | 'revoked' = 'unknown';
  if (keyRecord) keyStatus = keyRecord.status;

  const { createHash } = await import('node:crypto');
  const runBase = {
    invoice_id: invoiceId,
    result: report.result,
    reason_code: report.reason_code,
    algorithm: report.algorithm,
    parameter_set: report.parameter_set,
    key_fingerprint: report.signer_key_fingerprint,
    payload_sha3_256: report.payload_sha3_256,
    envelope_sha3_256: report.envelope_sha3_256,
    verifier_version: report.verifier_version,
    verified_off_chain: true as const,
    verified_at: report.verified_at,
  };
  const report_sha3_256 = createHash('sha3-256').update(JSON.stringify(runBase)).digest('hex');
  const run: VerificationRun = { id: newId('vr'), ...runBase, report_sha3_256 };
  putVerificationRun(run);

  const inv = getInvoice(invoiceId)!;
  inv.verification_run_id = run.id;
  inv.signer_fingerprint = report.signer_key_fingerprint === 'n/a' ? inv.signer_fingerprint : report.signer_key_fingerprint;

  steps.push({
    step: 'ml_dsa_verify',
    actor: 'verifier',
    outcome: report.result === 'valid' ? 'ok' : 'blocked',
    detail: `Deterministic ${report.parameter_set} verification ran off-chain: result ${report.result} (${report.reason_code}), verifier ${report.verifier_version}.`,
  });
  pushAudit({
    workspace_id: inv.workspace_id,
    actor_type: 'agent',
    actor_id: 'verification-pipeline',
    action: 'verification_run',
    object_id: invoiceId,
    outcome: report.result === 'valid' ? 'ok' : 'blocked',
    detail: `${report.result} / ${report.reason_code}`,
  });

  let policyResult: PolicyResult | null = null;
  if (report.result === 'valid') {
    updateInvoiceState(invoiceId, 'extracting');
    steps.push({
      step: 'extraction',
      actor: 'agent',
      outcome: 'ok',
      detail: `Extracted ${Object.keys(inv.extracted_fields).length} fields with confidence scores. Human review can correct them before approval.`,
    });

    const rules: PolicyRuleSet = store().policy;
    policyResult = evaluatePolicy(
      {
        payee_address: inv.payee_address,
        token_address: inv.token_address,
        amount_units: inv.amount_units,
        due_at: inv.due_at,
        external_ref: inv.external_ref,
        signature_valid: true,
        signature_reason_code: report.reason_code,
        key_status: keyStatus === 'active' ? 'active' : keyStatus,
        duplicate: isDuplicateInvoiceRef(inv.workspace_id, inv.external_ref_hash, inv.id),
      },
      rules,
    );
    putPolicyResult(invoiceId, policyResult);
    steps.push({
      step: 'policy_check',
      actor: 'policy',
      outcome: policyResult.pass ? 'ok' : 'blocked',
      detail: policyResult.pass
        ? `Policy ${policyResult.policy_version} passed. Invoice is ready for buyer approval.`
        : policyResult.findings.map((f) => `${f.code}: ${f.detail}`).join(' | '),
    });
    pushAudit({
      workspace_id: inv.workspace_id,
      actor_type: 'agent',
      actor_id: 'policy-engine',
      action: 'policy_evaluated',
      object_id: invoiceId,
      outcome: policyResult.pass ? 'ok' : 'blocked',
      detail: policyResult.pass ? 'pass' : policyResult.findings.map((f) => f.code).join(','),
    });

    updateInvoiceState(invoiceId, policyResult.pass ? 'ready_for_approval' : 'needs_review');
  } else {
    updateInvoiceState(invoiceId, 'needs_review');
    pushAudit({
      workspace_id: inv.workspace_id,
      actor_type: 'agent',
      actor_id: 'policy-engine',
      action: 'policy_skipped',
      object_id: invoiceId,
      outcome: 'blocked',
      detail: 'Signature invalid; policy checks skipped and payment controls remain blocked.',
    });
  }

  const finalInvoice = getInvoice(invoiceId)!;
  return { invoice: finalInvoice, verification: run, policy: policyResult, steps };
}

export function getEvidence(invoiceId: string): {
  verification: VerificationRun | null;
  policy: PolicyResult | null;
} {
  const run = getLatestVerificationRun(invoiceId);
  const policy = store().policyResultByInvoice.get(invoiceId) ?? null;
  return { verification: run ?? null, policy };
}

export function getVerificationById(runId: string): VerificationRun | undefined {
  return getVerificationRun(runId);
}
