import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js';
import { sha3_256 } from '@noble/hashes/sha3.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { canonicalJson, ENVELOPE_DOMAIN, type EnvelopeV1 } from '@/lib/crypto/envelope';

export const VERIFIER_VERSION = 'signet-verifier 1.0.0 (ml-dsa-65, fips204, @noble/post-quantum 0.7.1)';
export const ALGORITHM = 'ML-DSA' as const;
export const PARAMETER_SET = 'ML-DSA-65' as const;

export const ML_DSA_PK_LEN = 1952;
export const ML_DSA_SK_LEN = 4032;
export const ML_DSA_SIG_LEN = 3309;

export type VerifyReasonCode =
  | 'VALID'
  | 'MALFORMED_SIGNATURE'
  | 'MALFORMED_PUBLIC_KEY'
  | 'MALFORMED_PAYLOAD'
  | 'INVALID_SIGNATURE'
  | 'UNKNOWN_KEY'
  | 'REVOKED_KEY'
  | 'KEY_MISMATCH';

export type VerifyRequest = {
  payloadJson: string;
  signatureHex: string;
  publicKeyHex: string;
};

export type VerifyReport = {
  algorithm: 'ML-DSA';
  parameter_set: 'ML-DSA-65' | 'ML-DSA-44';
  result: 'valid' | 'invalid';
  reason_code: VerifyReasonCode;
  signer_key_fingerprint: string;
  payload_sha3_256: string;
  envelope_sha3_256: string;
  signature_bytes: number;
  public_key_bytes: number;
  verifier_version: string;
  verified_off_chain: true;
  verified_at: string;
};

export function sha3Hex(data: Uint8Array): string {
  return bytesToHex(sha3_256(data));
}

export function sha3Text(text: string): string {
  return sha3Hex(new TextEncoder().encode(text));
}

export function keyFingerprint(publicKeyHex: string): string {
  const pk = hexToBytes(publicKeyHex);
  return bytesToHex(sha3_256(pk)).slice(0, 16);
}

export function buildPayload(envelope: EnvelopeV1): string {
  return JSON.stringify({ domain: ENVELOPE_DOMAIN, envelope });
}

export function envelopeDigest(envelope: EnvelopeV1): string {
  return sha3Text(canonicalJson(envelope));
}

export const ENVELOPE_CONTEXT = new TextEncoder().encode(ENVELOPE_DOMAIN);

export function verifySignature(request: VerifyRequest): VerifyReport {
  const verified_at = new Date().toISOString();
  const base: Pick<
    VerifyReport,
    'algorithm' | 'parameter_set' | 'verifier_version' | 'verified_off_chain' | 'verified_at'
  > = {
    algorithm: 'ML-DSA',
    parameter_set: PARAMETER_SET,
    verifier_version: VERIFIER_VERSION,
    verified_off_chain: true,
    verified_at,
  };

  let payloadBytes: Uint8Array;
  try {
    payloadBytes = new TextEncoder().encode(request.payloadJson);
  } catch {
    return {
      ...base,
      result: 'invalid',
      reason_code: 'MALFORMED_PAYLOAD',
      signer_key_fingerprint: 'n/a',
      payload_sha3_256: 'n/a',
      envelope_sha3_256: 'n/a',
      signature_bytes: 0,
      public_key_bytes: 0,
    };
  }

  const payload_sha3_256 = sha3Hex(payloadBytes);
  let signature: Uint8Array;
  let publicKey: Uint8Array;
  try {
    signature = hexToBytes(request.signatureHex);
    publicKey = hexToBytes(request.publicKeyHex);
  } catch {
    return {
      ...base,
      result: 'invalid',
      reason_code: 'MALFORMED_SIGNATURE',
      signer_key_fingerprint: 'n/a',
      payload_sha3_256,
      envelope_sha3_256: 'n/a',
      signature_bytes: 0,
      public_key_bytes: 0,
    };
  }

  const fingerprint = keyFingerprint(request.publicKeyHex);

  if (signature.length !== ML_DSA_SIG_LEN) {
    return fail(base, 'MALFORMED_SIGNATURE', fingerprint, payload_sha3_256, signature.length, publicKey.length);
  }
  if (publicKey.length !== ML_DSA_PK_LEN) {
    return fail(base, 'MALFORMED_PUBLIC_KEY', fingerprint, payload_sha3_256, signature.length, publicKey.length);
  }

  let valid: boolean;
  try {
    valid = ml_dsa65.verify(signature, payloadBytes, publicKey, { context: ENVELOPE_CONTEXT });
  } catch {
    return fail(base, 'INVALID_SIGNATURE', fingerprint, payload_sha3_256, signature.length, publicKey.length);
  }

  return {
    ...base,
    result: valid ? 'valid' : 'invalid',
    reason_code: valid ? 'VALID' : 'INVALID_SIGNATURE',
    signer_key_fingerprint: fingerprint,
    payload_sha3_256,
    envelope_sha3_256: extractEnvelopeDigest(request.payloadJson),
    signature_bytes: signature.length,
    public_key_bytes: publicKey.length,
  };
}

function fail(
  base: Pick<VerifyReport, 'algorithm' | 'parameter_set' | 'verifier_version' | 'verified_off_chain' | 'verified_at'>,
  reason: VerifyReasonCode,
  fingerprint: string,
  payload_sha3_256: string,
  sigLen: number,
  pkLen: number,
): VerifyReport {
  return {
    ...base,
    result: 'invalid',
    reason_code: reason,
    signer_key_fingerprint: fingerprint,
    payload_sha3_256,
    envelope_sha3_256: 'n/a',
    signature_bytes: sigLen,
    public_key_bytes: pkLen,
  };
}

function extractEnvelopeDigest(payloadJson: string): string {
  try {
    const parsed = JSON.parse(payloadJson) as { envelope?: EnvelopeV1 };
    if (parsed.envelope) return envelopeDigest(parsed.envelope);
  } catch {}
  return 'n/a';
}

export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.toLowerCase().replace(/^0x/, '');
  if (!/^[0-9a-f]*$/.test(clean) || clean.length % 2 !== 0) throw new Error('Invalid hex');
  return Uint8Array.from(clean.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
}

export function bytesToHexLocal(bytes: Uint8Array): string {
  return bytesToHex(bytes);
}

export function generateKeyPair(seed?: Uint8Array): { publicKeyHex: string; secretKeyHex: string } {
  const keys = seed ? ml_dsa65.keygen(seed) : ml_dsa65.keygen();
  return {
    publicKeyHex: bytesToHex(keys.publicKey),
    secretKeyHex: bytesToHex(keys.secretKey),
  };
}

export function signPayload(payloadJson: string, secretKeyHex: string): string {
  const sk = hexToBytes(secretKeyHex);
  const message = new TextEncoder().encode(payloadJson);
  const sig = ml_dsa65.sign(message, sk, { context: ENVELOPE_CONTEXT });
  return bytesToHex(sig);
}
