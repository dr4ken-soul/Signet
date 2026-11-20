import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canonicalJson, ENVELOPE_DOMAIN, type EnvelopeV1 } from '../src/lib/crypto/envelope';
import {
  verifySignature,
  buildPayload,
  signPayload,
  generateKeyPair,
  keyFingerprint,
  sha3Text,
} from '../src/server/verifier/ml-dsa';

const PK = '0x456569838f1d43009A91ebA4263147Afd7233483';

function makeEnvelope(overrides: Partial<EnvelopeV1> = {}): EnvelopeV1 {
  return {
    envelope_version: 1,
    algorithm: 'ML-DSA',
    parameter_set: 'ML-DSA-65',
    invoice_ref: 'INV-TEST-1',
    document_sha3_256: 'a'.repeat(64),
    payment_context: {
      payee_address: '0x00000000000000000000000000000000000dEEA1',
      token_address: PK,
      token_decimals: 6,
      amount_units: '1850000000',
      currency_symbol: 'tUSD8',
    },
    signed_at: '2026-11-19T00:00:00.000Z',
    ...overrides,
  };
}

test('canonicalJson sorts keys recursively and drops undefined', () => {
  const input = { b: 1, a: { z: undefined, y: [2, { d: 1, c: 2 }] } };
  assert.equal(canonicalJson(input), '{"a":{"y":[2,{"c":2,"d":1}]},"b":1}');
});

test('canonicalJson rejects non-finite numbers', () => {
  assert.throws(() => canonicalJson({ x: Number.NaN }), /non-finite/);
});

test('keygen is deterministic from a 32-byte seed', () => {
  const seed = new Uint8Array(32).fill(9);
  const a = generateKeyPair(seed);
  const b = generateKeyPair(seed);
  assert.equal(a.publicKeyHex, b.publicKeyHex);
  assert.equal(a.secretKeyHex, b.secretKeyHex);
  assert.equal(a.publicKeyHex.length, 1952 * 2);
});

test('sign/verify roundtrip succeeds and tampering fails', () => {
  const kp = generateKeyPair();
  const envelope = makeEnvelope();
  const payload = buildPayload(envelope);
  const sig = signPayload(payload, kp.secretKeyHex);
  assert.equal(sig.length, 3309 * 2);

  const ok = verifySignature({ payloadJson: payload, signatureHex: sig, publicKeyHex: kp.publicKeyHex });
  assert.equal(ok.result, 'valid');
  assert.equal(ok.reason_code, 'VALID');
  assert.equal(ok.verified_off_chain, true);
  assert.equal(ok.envelope_sha3_256, sha3Text(canonicalJson(envelope)));
  assert.equal(ok.payload_sha3_256, sha3Text(payload));
  assert.equal(ok.signer_key_fingerprint, keyFingerprint(kp.publicKeyHex));

  const tamperedPayload = buildPayload(makeEnvelope({ invoice_ref: 'INV-CHANGED' }));
  const bad = verifySignature({ payloadJson: tamperedPayload, signatureHex: sig, publicKeyHex: kp.publicKeyHex });
  assert.equal(bad.result, 'invalid');
  assert.equal(bad.reason_code, 'INVALID_SIGNATURE');
});

test('modified document digest in envelope fails verification', () => {
  const kp = generateKeyPair();
  const payload = buildPayload(makeEnvelope());
  const sig = signPayload(payload, kp.secretKeyHex);
  const modified = buildPayload(makeEnvelope({ document_sha3_256: 'b'.repeat(64) }));
  const report = verifySignature({ payloadJson: modified, signatureHex: sig, publicKeyHex: kp.publicKeyHex });
  assert.equal(report.result, 'invalid');
});

test('unknown key fails verification', () => {
  const kp1 = generateKeyPair();
  const kp2 = generateKeyPair();
  const payload = buildPayload(makeEnvelope());
  const sig = signPayload(payload, kp1.secretKeyHex);
  const report = verifySignature({ payloadJson: payload, signatureHex: sig, publicKeyHex: kp2.publicKeyHex });
  assert.equal(report.result, 'invalid');
  assert.equal(report.reason_code, 'INVALID_SIGNATURE');
});

test('malformed signature length fails closed with reason code', () => {
  const kp = generateKeyPair();
  const payload = buildPayload(makeEnvelope());
  const report = verifySignature({
    payloadJson: payload,
    signatureHex: '0x00'.repeat(100),
    publicKeyHex: kp.publicKeyHex,
  });
  assert.equal(report.result, 'invalid');
  assert.equal(report.reason_code, 'MALFORMED_SIGNATURE');
});

test('malformed public key length fails closed with reason code', () => {
  const kp = generateKeyPair();
  const payload = buildPayload(makeEnvelope());
  const sig = signPayload(payload, kp.secretKeyHex);
  const report = verifySignature({
    payloadJson: payload,
    signatureHex: sig,
    publicKeyHex: '0x1234',
  });
  assert.equal(report.result, 'invalid');
  assert.equal(report.reason_code, 'MALFORMED_PUBLIC_KEY');
});

test('wrong parameter set in envelope is detectable from the payload', () => {
  const kp = generateKeyPair();
  const wrong = makeEnvelope({ parameter_set: 'ML-DSA-44' as EnvelopeV1['parameter_set'] });
  const payload = buildPayload(wrong);
  const sig = signPayload(payload, kp.secretKeyHex);
  const report = verifySignature({ payloadJson: payload, signatureHex: sig, publicKeyHex: kp.publicKeyHex });
  assert.equal(report.result, 'valid');
  const parsed = JSON.parse(payload) as { envelope: EnvelopeV1 };
  assert.equal(parsed.envelope.parameter_set, 'ML-DSA-44');
  assert.notEqual(parsed.envelope.parameter_set, 'ML-DSA-65');
});

test('envelope binds domain separation and payment context', () => {
  const envelope = makeEnvelope();
  const payload = buildPayload(envelope);
  const parsed = JSON.parse(payload) as { domain: string; envelope: EnvelopeV1 };
  assert.equal(parsed.domain, ENVELOPE_DOMAIN);
  assert.equal(parsed.envelope.payment_context.amount_units, '1850000000');
  assert.equal(parsed.envelope.payment_context.token_address, PK);
});
