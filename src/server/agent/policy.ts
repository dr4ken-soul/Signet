export type PolicyInput = {
  payee_address: string;
  token_address: string;
  amount_units: string;
  due_at: string;
  external_ref: string;
  signature_valid: boolean;
  signature_reason_code: string;
  key_status: 'active' | 'unknown' | 'revoked';
  duplicate: boolean;
};

export type PolicyRuleSet = {
  version: string;
  allowed_payees: string[];
  allowed_tokens: string[];
  max_amount_units: string;
  require_future_due_date: boolean;
};

export type PolicyFinding = {
  code: string;
  detail: string;
};

export type PolicyResult = {
  pass: boolean;
  policy_version: string;
  findings: PolicyFinding[];
};

const UINT_RE = /^\d+$/;

function cmp(a: string, b: string): number {
  const ab = a.replace(/^0+(?=\d)/, '');
  const bb = b.replace(/^0+(?=\d)/, '');
  if (ab.length !== bb.length) return ab.length - bb.length;
  return ab < bb ? -1 : ab > bb ? 1 : 0;
}

function normalizeAddress(address: string): string {
  return address.toLowerCase();
}

export const DEFAULT_POLICY: PolicyRuleSet = {
  version: 'policy-1.0.0',
  allowed_payees: [],
  allowed_tokens: [],
  max_amount_units: '500000000000',
  require_future_due_date: true,
};

export function evaluatePolicy(input: PolicyInput, rules: PolicyRuleSet): PolicyResult {
  const findings: PolicyFinding[] = [];

  if (!input.signature_valid) {
    findings.push({
      code: 'SIGNATURE_INVALID',
      detail: `Off-chain verification reported ${input.signature_reason_code}. Payment is blocked until a valid signature is present.`,
    });
  }

  if (input.key_status === 'unknown') {
    findings.push({
      code: 'KEY_UNKNOWN',
      detail: 'The signer key fingerprint is not registered in this workspace. Onboard and verify the key before payment.',
    });
  } else if (input.key_status === 'revoked') {
    findings.push({
      code: 'KEY_REVOKED',
      detail: 'The signer key has been revoked. Payment is blocked.',
    });
  }

  if (input.duplicate) {
    findings.push({
      code: 'DUPLICATE_INVOICE',
      detail: 'This invoice reference was already paid or submitted. Duplicates are blocked to prevent replay.',
    });
  }

  if (!UINT_RE.test(input.amount_units) || BigInt(input.amount_units) <= 0n) {
    findings.push({
      code: 'AMOUNT_INVALID',
      detail: 'The payment amount must be a positive whole number of token units.',
    });
  } else {
    if (rules.max_amount_units && cmp(input.amount_units, rules.max_amount_units) > 0) {
      findings.push({
        code: 'AMOUNT_OVER_LIMIT',
        detail: 'The amount exceeds the workspace payment limit configured in policy.',
      });
    }
    const tokenAllowed = rules.allowed_tokens.some((t) => normalizeAddress(t) === normalizeAddress(input.token_address));
    if (rules.allowed_tokens.length > 0 && !tokenAllowed) {
      findings.push({
        code: 'TOKEN_NOT_ALLOWED',
        detail: 'The payment token is not in the workspace allowlist.',
      });
    }
  }

  const payeeAllowed = rules.allowed_payees.some((p) => normalizeAddress(p) === normalizeAddress(input.payee_address));
  if (rules.allowed_payees.length > 0 && !payeeAllowed) {
    findings.push({
      code: 'PAYEE_NOT_ALLOWED',
      detail: 'The payee address is not in the workspace allowlist. Confirm the destination with an administrator.',
    });
  }

  if (rules.require_future_due_date && input.due_at) {
    const due = new Date(input.due_at).getTime();
    if (!Number.isFinite(due)) {
      findings.push({
        code: 'DUE_DATE_INVALID',
        detail: 'The invoice due date could not be parsed.',
      });
    }
  }

  if (!input.external_ref.trim()) {
    findings.push({
      code: 'REF_MISSING',
      detail: 'A unique invoice reference is required before payment.',
    });
  }

  return {
    pass: findings.length === 0,
    policy_version: rules.version,
    findings,
  };
}

export function explainFindings(findings: PolicyFinding[]): string {
  if (findings.length === 0) return 'All configured policy checks passed.';
  return findings.map((f) => `${f.code}: ${f.detail}`).join(' ');
}
