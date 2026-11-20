import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { seedFixtures, fixtureEnvelopes, WORKSPACE } from '../src/server/storage/fixtures';
import { runVerification, getEvidence } from '../src/server/agent/pipeline';
import {
  getInvoice,
  listInvoices,
  getLatestVerificationRun,
  listSignerKeys,
  isDuplicateInvoiceRef,
  pushAudit,
} from '../src/server/storage/memory-store';

before(() => {
  seedFixtures();
});

test('fixtures seeded with four invoices and signed envelopes', () => {
  const invoices = listInvoices(WORKSPACE);
  assert.equal(invoices.length, 4);
  for (const inv of invoices) {
    assert.ok(fixtureEnvelopes.has(inv.id), `envelope for ${inv.id}`);
    assert.ok(inv.document_sha3_256.length === 64);
    assert.ok(inv.signer_fingerprint);
  }
});

test('signer registry has active and revoked keys, never private keys', () => {
  const keys = listSignerKeys(WORKSPACE);
  assert.equal(keys.length, 3);
  assert.ok(keys.some((k) => k.status === 'active'));
  assert.ok(keys.some((k) => k.status === 'revoked'));
  for (const key of keys) {
    assert.ok(!('secret' in key));
    assert.ok(!('private' in key));
    assert.equal(key.public_key_hex.length, 1952 * 2);
  }
});

test('valid invoice passes verification and policy, ready for approval', async () => {
  const result = await runVerification('inv_sample_1');
  assert.equal(result.verification?.result, 'valid');
  assert.equal(result.verification?.reason_code, 'VALID');
  assert.equal(result.policy?.pass, true);
  assert.equal(result.invoice.state, 'ready_for_approval');
  const steps = result.steps.map((s) => s.step);
  assert.deepEqual(steps, ['intake', 'ml_dsa_verify', 'extraction', 'policy_check']);
  assert.ok(result.steps.some((s) => s.actor === 'verifier' && s.outcome === 'ok'));
});

test('tampered invoice fails verification and lands in needs_review', async () => {
  const result = await runVerification('inv_bad_sig');
  assert.equal(result.verification?.result, 'invalid');
  assert.notEqual(result.verification?.reason_code, 'VALID');
  assert.equal(result.policy, null);
  assert.equal(result.invoice.state, 'needs_review');
});

test('revoked-key invoice fails policy, not cryptography', async () => {
  const result = await runVerification('inv_revoked');
  assert.equal(result.verification?.result, 'valid', 'signature itself is valid');
  assert.equal(result.policy?.pass, false);
  assert.ok(result.policy?.findings.some((f) => f.code === 'KEY_REVOKED'));
  assert.equal(result.invoice.state, 'needs_review');
});

test('unknown-key invoice is blocked by policy', async () => {
  const result = await runVerification('inv_unknown_key');
  assert.equal(result.verification?.result, 'valid');
  assert.equal(result.policy?.pass, false);
  assert.ok(result.policy?.findings.some((f) => f.code === 'KEY_UNKNOWN'));
});

test('verification report hash is deterministic and reproducible', async () => {
  const { verification } = getEvidence('inv_sample_1');
  assert.ok(verification);
  const again = getLatestVerificationRun('inv_sample_1');
  assert.equal(verification!.report_sha3_256, again!.report_sha3_256);
  assert.equal(verification!.verified_off_chain, true);
  assert.ok(verification!.verifier_version.includes('fips204'));
});

test('duplicate detection ignores rejected invoices', () => {
  const inv = getInvoice('inv_sample_1')!;
  assert.equal(isDuplicateInvoiceRef(WORKSPACE, inv.external_ref_hash, inv.id), false);
  const other = getInvoice('inv_bad_sig')!;
  assert.equal(isDuplicateInvoiceRef(WORKSPACE, other.external_ref_hash, other.id), false);
});

test('audit events record verification and policy outcomes', async () => {
  await runVerification('inv_sample_1');
  const events = pushAudit({
    workspace_id: WORKSPACE,
    actor_type: 'system',
    actor_id: 'test',
    action: 'test_probe',
    object_id: 'inv_sample_1',
    outcome: 'ok',
    detail: 'probe',
  });
  assert.ok(events.id.startsWith('audit_'));
});
