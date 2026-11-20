# Signet Product

**Status:** Product definition for a testnet prototype. Not a production payment service.

## What Signet does

Signet helps a team decide whether a signed supplier invoice is safe to pay. It combines an AI-assisted review flow with deterministic cryptographic checks and a human approval step. The AI agent can read and summarize invoice data, compare it with configured rules, and call the signature-verification service. It cannot decide that a signature is cryptographically valid by itself, and it cannot approve or send money.

The target challenge deployment is Aevum EVM testnet with tUSD8. The prototype is for test tokens and must not be presented as handling real funds.

## The problem

Accounts-payable work is commonly split across email, invoice files, vendor records, approval messages, and payment tools. That creates an evidence gap: a reviewer may see an invoice amount and a payment destination without a compact, reproducible record that the exact document was signed by the expected supplier and reviewed before payment.

Existing AP platforms already offer invoice capture, matching, approvals, fraud checks, payments, and accounting integrations. Signet is not positioned as a replacement for a full ERP or AP suite. Its hypothesis is narrower: make signed-document authenticity and the relationship between off-chain verification and an on-chain stablecoin payment easy to inspect and audit.

## Who uses it

### Buyer or accounts-payable approver

- Connects a personal or organization-controlled wallet.
- Reviews the invoice, parsed fields, signer identity, payee, amount, and verification evidence.
- Approves or rejects the payment explicitly.
- Pays the supplier in the configured test token and follows the confirmed transaction and anchor in the explorer.

### Supplier or invoice signer

- Produces an invoice and signs the declared invoice payload with an ML-DSA key.
- Shares the signed invoice and public-key identity with the buyer or workspace.
- Retains control of the private signing key. Signet does not collect supplier private keys.

### Workspace administrator or integrator

- Configures allowed payees, payment limits, approvers, token/network settings, and data retention.
- Connects document intake or future ERP and accounting adapters when those are implemented.
- Reviews the audit trail and manages signer-key changes.

### Signet agent

- Orchestrates a bounded sequence of extraction, deterministic validation, ML-DSA verification, policy checks, and evidence preparation.
- Produces explanations and reason codes for human review.
- Has no payment key and cannot bypass the approver.

## How the MVP works

1. A supplier or buyer submits a sample invoice and its ML-DSA signature envelope.
2. Signet stores the document off-chain in private storage and computes a digest over the exact bytes or a documented canonical envelope.
3. The agent extracts invoice fields and labels uncertain values. Deterministic rules check required fields, duplicate identifiers, payee and amount policy, expiry, and signer-key status.
4. A dedicated off-chain verifier checks the ML-DSA signature using an implementation tested against the current NIST FIPS 204 specification and test vectors. The language model does not determine signature validity.
5. The buyer sees the document, extracted fields, signer fingerprint, verification result, policy findings, and the distinction between off-chain evidence and on-chain state.
6. The buyer rejects the invoice or initiates a wallet transaction. The proposed MVP transaction binds the invoice identifier, digest or commitment, verification-record hash, payee, token, amount, nonce, and expiry. A contract checks payment bounds, transfers tUSD8, and emits an anchor event. Any database state that claims payment or anchoring is updated only after the chain transaction is confirmed.
7. The buyer can inspect the transaction in the Aevum explorer and retrieve the off-chain verification record to reproduce the check.

## What is on-chain and off-chain

**Off-chain:** original invoice, personal or business information, extracted fields, ML-DSA public key material, signature bytes, verifier output, AI explanations, policy configuration, and workspace audit metadata.

**On-chain:** a minimal document digest or privacy-preserving commitment, a hash of the verification record, a pseudonymous invoice reference, buyer and payee addresses, token and amount where required for the payment, nonce, status event, and transaction metadata. Never put the raw invoice, email address, bank account, tax identifier, or customer data on-chain.

An on-chain digest is an integrity reference. A hash of a verification report is not an EVM proof that ML-DSA was verified. A reviewer must be able to fetch the signed document and verification record, check the verifier identity and version, and rerun the off-chain verification.

## Product principles

- **Human approval before money moves.** The agent prepares a decision; an authorized buyer makes it.
- **Cryptography is deterministic.** The ML-DSA result comes from a maintained verifier, not an LLM response.
- **Explain the boundary.** The interface labels the signature check as off-chain and the digest as on-chain.
- **Fail closed.** Invalid signature, unknown signer, mismatched payee, duplicate invoice, expired approval, or policy breach blocks the payment path and gives a reason.
- **Minimal disclosure.** Only necessary commitments and payment fields are placed on-chain.
- **Plug-in, not siloed.** Keep document, verifier, AI, wallet, chain, and payment-token adapters separate. Aevum and tUSD8 are the first challenge adapter, not a claim that other networks already work.
- **Testnet honesty.** Clearly label test tokens and sample data. Do not imply real funds, audited contracts, production compliance, or mainnet availability.

## MVP scope

- Sample invoice and explicit signed-envelope format.
- Off-chain ML-DSA verification with a deterministic service and test vectors.
- AI-assisted extraction or explanation behind an adapter, with a manual fallback.
- Human approval and buyer-controlled wallet transaction.
- Aevum/tUSD8 testnet payment and hash/proof-reference anchoring.
- Explorer-verifiable transaction status and a read-only walkthrough.
- Basic audit trail, policy limits, and negative-path handling.

## Not in the MVP

Mainnet payments, custody, autonomous agent spending, native EVM ML-DSA verification, project token, payment streaming, factoring, escrow, multi-chain claims, bank rails, full ERP integrations, and reliance on QDay features marked as coming soon. No soundbox or dedicated payment hardware is proposed.

## Success criteria

A first-time reviewer can identify the signer, tell whether the ML-DSA check occurred off-chain, understand what the buyer is approving, reject a suspicious invoice, and verify the confirmed testnet payment and hash anchor in the explorer. The demo fails acceptance if it implies that an AI model or EVM contract performed native ML-DSA verification, or if the agent can move money without a user approval.
