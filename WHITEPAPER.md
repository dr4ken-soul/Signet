# Signet: Signed Invoices, Controlled Payments

**Technical concept paper, version 0.1, 15 November 2026**

**Status:** Testnet proposal. No mainnet deployment or production security claim.

## Abstract

Signet links a supplier-signed invoice to a buyer-controlled stablecoin payment and a compact on-chain evidence record. A bounded AI agent assists with intake, field extraction, policy review, and explanation. A deterministic off-chain verifier checks the supplier's ML-DSA signature. The buyer remains responsible for approving the payment through a wallet. Aevum stores a minimal digest or commitment and a hash of a versioned verification record alongside the payment event.

Signet does not claim that the EVM natively verifies ML-DSA. The on-chain hash is an integrity reference to off-chain evidence, not an EVM proof of signature validity. This separation is central to the security model.

## 1. Problem statement

A payable invoice passes through document storage, supplier identity, amount and payee checks, internal approval, and payment. In a fragmented process, the final payment may be difficult to trace back to the exact bytes that were signed and reviewed. An AI system can accelerate data extraction, but a model response is not a cryptographic verification result and should not be permitted to authorize money.

Signet addresses this narrow evidence and control problem. It is not intended to replace accounting, tax, procurement, or ERP systems.

## 2. Design goals

1. Verify a signed document using a deterministic ML-DSA implementation off-chain.
2. Keep the original invoice and sensitive fields off-chain.
3. Make the exact verified document and verification-record hashes auditable.
4. Bind a buyer's approval to a specific payee, amount, token, chain, nonce, and expiry.
5. Require a human wallet action for payment.
6. Make the product adaptable through document, verifier, model, wallet, token, and chain interfaces.
7. Deploy first on Aevum testnet using tUSD8, with no claim of real-value settlement.

## 3. Participants and trust assumptions

- **Supplier signer:** controls the ML-DSA private key and signs the agreed invoice payload.
- **Buyer approver:** checks the invoice and authorizes payment with a wallet.
- **Signet agent:** calls extraction and policy tools and presents an evidence summary, but has no payment key.
- **Off-chain verifier:** validates the signature against the public key and reports algorithm, key fingerprint, payload digest, result, reason code, and software version.
- **Aevum contract:** checks payment constraints, transfers the configured ERC-20 token, and emits an anchor event. It does not verify ML-DSA.
- **Storage/database:** holds private documents and application state under access control. It is not the authoritative source for confirmed on-chain payment state.

NIST FIPS 204 specifies ML-DSA for generating and verifying digital signatures [1](https://csrc.nist.gov/pubs/fips/204/final). The implementation, parameter set, key encoding, and signed-envelope format remain open until the pre-build crypto spike passes current NIST vectors and an interoperability review.

## 4. System architecture

```text
Supplier invoice + ML-DSA signature
                 |
                 v
Private document store --> Extraction agent --> Policy checks
                 |                                  |
                 +--> Deterministic ML-DSA verifier-+
                                  |
                                  v
                 Versioned off-chain verification record
                                  |
                                  v
Buyer review and explicit wallet approval
                                  |
                                  v
Aevum payment + document/record hash event
                                  |
                                  v
Confirmed receipt and explorer-verifiable reference
```

### Off-chain responsibilities

- Store the original file privately and compute a digest over the exact bytes or an explicitly defined envelope.
- Extract invoice number, supplier, amount, token, payee, due date, and other required fields. The model may suggest values; users can inspect and correct them.
- Run deterministic duplicate, expiry, payee, amount, key status, and policy checks.
- Verify ML-DSA with the selected FIPS 204 implementation. The result is not supplied by the language model.
- Generate a versioned verification record and hash it for later anchoring.
- Obtain buyer approval through a wallet. No server or agent signs payment on the buyer's behalf.

### On-chain responsibilities

- Validate the payer, payee, token, amount, unique invoice reference, nonce, expiry, and configured payment limits.
- Transfer tUSD8 from the buyer to the supplier after the buyer authorizes the transaction.
- Emit the document digest or commitment and verification-record hash, with minimal payment metadata.
- Provide a transaction/event reference that an external reviewer can inspect.

### What the chain does not do

The EVM does not parse the invoice, run the ML-DSA algorithm, validate a supplier's ML-DSA signature, understand an AI confidence score, or prove that a private verification artifact is truthful. The chain stores a commitment and transaction event. Anyone making a stronger claim must provide a separate, deployed proof system and security analysis. Signet does not include one in this design.

## 5. Invoice lifecycle

1. **Intake:** receive document bytes, declared signer identity, signature, and invoice metadata.
2. **Digest and extraction:** preserve the original bytes; compute the declared digest; extract fields with confidence and provenance.
3. **Signature check:** verify the precise signed payload against the registered public key and expected algorithm.
4. **Policy evaluation:** check duplicate status, key revocation, payee, token, amount, expiry, and workspace limits.
5. **Human review:** show original document, extracted fields, verifier version/result, policy results, and transaction destination.
6. **Approval:** buyer explicitly approves or rejects. Any field change that alters signed meaning requires a new signed payload or a new review, not silent editing.
7. **Payment and anchor:** proposed MVP uses a buyer-signed transaction to make the bounded transfer and emit a document/verification hash event atomically. This sequencing remains subject to contract review.
8. **Confirmation:** reconcile receipt and expected event. Only confirmed chain state is reflected as paid or anchored in the database.
9. **Audit:** authorized users retrieve the off-chain record and can reproduce the signature check.

## 6. Data and privacy model

The contract should store only what is needed to link payment and evidence. A direct digest may reveal that two known documents are identical. For production, consider a salted commitment or another privacy-preserving construction, and define when an authorized auditor can reproduce the link. The synthetic hackathon demo may use a direct digest.

Never store the raw invoice, supplier address book, bank account, tax number, email address, signature bytes, private key, or unredacted AI prompt on-chain. Use private object storage, encryption at rest, scoped access, retention controls, redacted logs, and explicit consent before sending invoice content to a third-party model.

A hash of the verification record is not enough by itself to reproduce verification. Retain or make available, under access policy, the exact signed bytes, public key, envelope version, verifier software/version, and result record.

## 7. Threat model and controls

| Threat | Control |
|---|---|
| Document changed after signing | Verify the exact signed bytes or canonical envelope; show digest; reject mismatches |
| Forged or unknown supplier key | Bind key fingerprint and algorithm; onboard/rotate/revoke keys; fail closed on unknown keys |
| AI extraction hallucination | Show source document and confidence; deterministic field checks; human correction; no AI approval |
| Payee substitution | Bind approval intent to exact payee; check workspace allowlist; invalidate approval on change |
| Duplicate or replayed invoice | Unique invoice reference, nonce, expiry, and contract-level already-paid check |
| Agent or server compromise | No payment key; scoped roles; rate limits; audit; human wallet transaction |
| On-chain privacy leak | Keep raw data off-chain; minimize event fields; evaluate salted commitments |
| RPC lies or outage | Check transaction receipt and event; use independent read/reconciliation path; show unknown status on outage |
| Misleading proof claim | Label the ML-DSA check as off-chain and the chain record as a digest/record hash |
| Mainnet contract flaw | Testnet first, immutable-by-default design, independent audit before mainnet |

## 8. Fees, token, and governance

The testnet MVP has no protocol fee and no native Signet token. tUSD8 is used only as the challenge test asset until official configuration is confirmed. Testnet tokens have no real monetary value. A future hosted product may charge per workspace or verified invoice, subject to user validation. Any on-chain fee, treasury address, withdrawal policy, or governance mechanism requires a separate decision and legal/security review.

Contracts are non-upgradeable by default. Do not introduce an owner role or fee recipient unless a concrete requirement and threat model justify it. If mainnet fees are later approved, the treasury must be separately controlled and publicly documented; the private key must never be stored in source or a committed environment file.

## 9. Roadmap

- **Phase 0, challenge preparation:** confirm Aevum/tUSD8 details, crypto library, signed envelope, privacy mode, and test plan.
- **Phase 1, testnet MVP:** synthetic invoices, off-chain verifier, human-approved tUSD8 transaction, hash anchor, read-only walkthrough, and reproducible demo.
- **Phase 2, testnet pilot:** user interviews, key onboarding and revocation, adapter design, privacy review, and improved audit export.
- **Phase 3, mainnet readiness:** legal review, external contract and crypto audit, operational controls, final token/chain configuration, monitoring, support, and user approval. Create `DOCS.md` at this phase.
- **Phase 4, expansion:** add integrations only after validation. Multi-chain, escrow, streaming, or autonomous payment are not implied by this roadmap.

## 10. Limitations and disclaimer

This document is a technical proposal, not a security audit, legal opinion, financial product authorization, or guarantee of quantum resistance. ML-DSA is a standardized post-quantum signature algorithm, but real security depends on correct implementation, key management, signed-message design, software maintenance, and operational controls. A valid signature does not prove the invoice is economically correct, that the signer is legally authorized, or that the payee is trustworthy. Human review and policy checks remain necessary.
