import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluatePolicy, DEFAULT_POLICY, type PolicyInput } from '../src/server/agent/policy';

const base: PolicyInput = {
  payee_address: '0x00000000000000000000000000000000000dEEA1',
  token_address: '0x456569838f1d43009A91ebA4263147Afd7233483',
  amount_units: '1850000000',
  due_at: new Date(Date.now() + 86400000).toISOString(),
  external_ref: 'INV-1',
  signature_valid: true,
  signature_reason_code: 'VALID',
  key_status: 'active',
  duplicate: false,
};

const rules = {
  ...DEFAULT_POLICY,
  allowed_payees: ['0x00000000000000000000000000000000000dEEA1'],
  allowed_tokens: ['0x456569838f1d43009A91ebA4263147Afd7233483'],
  max_amount_units: '5000000000',
};

test('valid invoice passes policy', () => {
  const result = evaluatePolicy(base, rules);
  assert.equal(result.pass, true);
  assert.equal(result.findings.length, 0);
});

test('invalid signature blocks', () => {
  const result = evaluatePolicy({ ...base, signature_valid: false, signature_reason_code: 'INVALID_SIGNATURE' }, rules);
  assert.equal(result.pass, false);
  assert.ok(result.findings.some((f) => f.code === 'SIGNATURE_INVALID'));
});

test('unknown key blocks', () => {
  const result = evaluatePolicy({ ...base, key_status: 'unknown' }, rules);
  assert.equal(result.pass, false);
  assert.ok(result.findings.some((f) => f.code === 'KEY_UNKNOWN'));
});

test('revoked key blocks', () => {
  const result = evaluatePolicy({ ...base, key_status: 'revoked' }, rules);
  assert.equal(result.pass, false);
  assert.ok(result.findings.some((f) => f.code === 'KEY_REVOKED'));
});

test('duplicate invoice blocks', () => {
  const result = evaluatePolicy({ ...base, duplicate: true }, rules);
  assert.equal(result.pass, false);
  assert.ok(result.findings.some((f) => f.code === 'DUPLICATE_INVOICE'));
});

test('payee mismatch blocks', () => {
  const result = evaluatePolicy({ ...base, payee_address: '0x00000000000000000000000000000000000d9999' }, rules);
  assert.equal(result.pass, false);
  assert.ok(result.findings.some((f) => f.code === 'PAYEE_NOT_ALLOWED'));
});

test('payee comparison is case-insensitive', () => {
  const result = evaluatePolicy({ ...base, payee_address: base.payee_address.toUpperCase() }, rules);
  assert.equal(result.pass, true);
});

test('amount over limit blocks', () => {
  const result = evaluatePolicy({ ...base, amount_units: '5000000001' }, rules);
  assert.equal(result.pass, false);
  assert.ok(result.findings.some((f) => f.code === 'AMOUNT_OVER_LIMIT'));
});

test('zero amount blocks', () => {
  const result = evaluatePolicy({ ...base, amount_units: '0' }, rules);
  assert.equal(result.pass, false);
  assert.ok(result.findings.some((f) => f.code === 'AMOUNT_INVALID'));
});

test('negative amount blocks', () => {
  const result = evaluatePolicy({ ...base, amount_units: '-5' }, rules);
  assert.equal(result.pass, false);
  assert.ok(result.findings.some((f) => f.code === 'AMOUNT_INVALID'));
});

test('token not in allowlist blocks', () => {
  const result = evaluatePolicy({ ...base, token_address: '0x00000000000000000000000000000000000d8888' }, rules);
  assert.equal(result.pass, false);
  assert.ok(result.findings.some((f) => f.code === 'TOKEN_NOT_ALLOWED'));
});

test('missing reference blocks', () => {
  const result = evaluatePolicy({ ...base, external_ref: '  ' }, rules);
  assert.equal(result.pass, false);
  assert.ok(result.findings.some((f) => f.code === 'REF_MISSING'));
});
