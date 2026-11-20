# Signet Team Operations

**Status:** Operating policy for a testnet prototype. Update this document at the end of each build week and before each phase transition.

## Operating posture

Signet is a documentation-stage project targeting Aevum EVM testnet. No real funds, mainnet contract, customer invoices, production SLA, or protocol fee are approved. Test tokens have no real monetary value. The team must describe the product as a prototype and distinguish intended behavior from shipped functionality.

## Roles and separation of duties

For a small hackathon team, one person may cover multiple roles, but no single AI agent should control every stage of a payment.

| Role | Responsibility |
|---|---|
| Product owner | Scope, user approval requirements, challenge submission, and change log |
| Contract lead | Contract design, tests, deployment artifact, and explorer event validation |
| Crypto/verifier lead | FIPS 204 implementation, test vectors, key formats, signer-key lifecycle, and security review |
| Application lead | Wallet flow, invoice state machine, API authorization, storage, and frontend |
| Reviewer/QA | Adversarial and failure-path tests, accessibility, privacy, and evidence review |

A buyer must personally approve a payment through a wallet. The AI agent has no buyer key and cannot grant itself an approver role.

## Key and secret management

- Never place private keys, seed phrases, RPC keys, model keys, or production secrets in the repository, build logs, or chat.
- Supplier ML-DSA private keys remain with the supplier. Signet stores only public-key material and a key fingerprint, plus a signature artifact if retention is explicitly required and protected.
- The verifier does not need payment authority. Keep verifier-service credentials separate from any future treasury key.
- Use a secrets manager for deployment credentials after code approval. A local `.env` may be used only for non-production development and must not be committed; create `.env.example` only after code approval.
- A testnet deployer key must be clearly identified as test-only and should hold no real assets.
- No treasury is required while the MVP has no protocol fees. If a mainnet fee model is later approved, use a disclosed withdrawal policy and a multisignature treasury. Never hardcode a treasury address in Solidity.

## Release and deployment procedure

1. Review the release scope and confirm it is within approved MVP boundaries.
2. Run unit, contract, verifier-vector, API, end-to-end, accessibility, and dependency checks.
3. Verify the chain ID, RPC, explorer, tUSD8 address, decimals, and faucet from official material.
4. Deploy only to Aevum testnet. Record source commit, compiler settings, deployment transaction, contract address, and verified source link.
5. Run a synthetic invoice through invalid and valid cases. Confirm no raw document or personal data appears in chain storage/events.
6. Verify the expected event in the explorer and confirm the database only changes to confirmed after receipt and event validation.
7. Publish a release note and a limitation list. Do not describe testnet behavior as audited or production-ready.

## Incident and exception handling

| Incident | Immediate response |
|---|---|
| Invalid or mismatched signature | Block payment, preserve a redacted verification record, notify the authorized reviewer, and request a new signed invoice or key confirmation. |
| Supplier key reported lost or compromised | Mark the key revoked or suspended in the workspace, block future invoices from it, preserve past evidence, and request a new key through an authenticated process. |
| Duplicate invoice or replay attempt | Block the request, retain the reason code and invoice reference, and review whether the unique ID, nonce, or policy configuration failed. |
| Unexpected payee or amount change | Invalidate prior approval intent and require a new signature/review. Never reuse an approval after payment details change. |
| Wrong token, chain, or contract address | Stop releases, disable the affected integration, verify official information, and notify the user. Never silently switch networks. |
| RPC or explorer outage | Show `Status unavailable`, not `Paid`. Keep the transaction hash and reconcile from another trusted RPC when available. |
| Suspected key or service compromise | Disable the affected service credential, stop new approvals, preserve minimal logs, notify project owner, and document a post-incident review. |
| Invoice privacy exposure | Contain access, preserve incident facts without copying the document into logs, notify affected parties as required, and complete legal review. |

If a deployed contract has no pause function, a frontend shutdown does not prevent direct contract calls. Treat that limitation as part of the deployment review. Do not promise an emergency stop that does not exist.

## Support and evidence

- Support must not ask users to send private keys or seed phrases.
- A support report should include a transaction hash, chain ID, redacted invoice reference, and an error code, not the raw invoice.
- Explain that the ML-DSA check is off-chain and that the chain contains a digest or commitment and transaction event, not the invoice file.
- Any lost, revoked, or rotated signer key requires a recorded reason, date, approving party, and new fingerprint. Historical verification records remain immutable and are not rewritten.
- Escalate legal-signature, privacy, token, payment, or alleged-fraud questions to qualified human reviewers. The AI agent must not make legal conclusions.

## Weekly operations review

At the end of each build week, update: release status, testnet health, unresolved incidents, verifier and contract test results, data-retention settings, open risks, cost usage, user feedback, and the next week's acceptance criteria. Before mainnet, complete external security review and legal/privacy approval. `DOCS.md` is deferred until the mainnet phase.
