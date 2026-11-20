# Signet Build Guide

**Status:** Planning guide only. Implementation requires explicit user approval.

**Challenge window:** 16 November to 11 December 2026. Submissions close at 08:00 UTC on 11 December. Demo day is 15 December. Recheck the live DoraHacks page and organizer announcements before each milestone.

## Delivery principle

Build a small, safe, explorer-verifiable testnet demo before expanding the product. The hackathon is not a mainnet launch. Do not use real funds, do not rely on coming-soon QDay SDKs, and do not let the agent pay autonomously.

## Pre-build checks

Before code is authorized:

- Confirm current Aevum testnet chain ID, RPC, explorer, faucet, and tUSD8 token address from official sources.
- Decide the FIPS 204 parameter set, verifier implementation, test vectors, public-key format, and signed-envelope canonicalization.
- Confirm whether the buyer transaction atomically pays and anchors, or whether anchoring is a separate step.
- Decide the privacy mode for the document digest and verification record.
- Confirm model/data handling and obtain approval before sending any real invoice to a third-party service.
- Complete the hero-image sourcing sequence in `FRONTEND_SPEC.md`. The user-designated hero/background image location is `S:\Hackathon\Signet\hero-image`; verify access to that exact source before replacing or adapting it. Do not use the unapproved Arena-generated candidate. Source a full-bleed atmospheric background field, not a literal invoice, screenshot, dashboard, or product illustration. Search using background-oriented terms for abstract material, texture, color, light, and copy-safe composition; inspect actual candidates and verify rights. Keep the upper-left copy and lower-right proof-panel areas calm. Use Google Flow's currently available image controls, and only submit a reference whose terms permit that use; otherwise generate from approved high-level art direction. Obtain user approval of the final static image before integration. Do not add hero motion without explicit approval.
- Get explicit user approval for code scope. The present workspace contains documentation only.

## Four-week sequence

### Week 1: 16-22 November, foundation and demo contract

**Goals:** establish an end-to-end path with synthetic data and the supported testnet.

- Set up the repository only after code approval.
- Configure Next.js, TypeScript, wallet connection, chain adapter, and testnet-only environment variables.
- Build a synthetic invoice fixture and an explicit signed-envelope schema.
- Run a crypto spike against current FIPS 204 test vectors. Keep the verifier isolated behind an interface.
- Draft the contract interface and threat model; test invoice uniqueness, nonce, expiry, payee, token, amount, and replay bounds locally.
- Confirm the test token address and explorer event format.

**Exit checks:** sample invoice can be displayed; verifier passes official vectors; contract tests prove duplicate/replay protection; no real invoice or key is used.

### Week 2: 23-29 November, verification agent and evidence

**Goals:** make the off-chain verification path auditable and deterministic.

- Implement the bounded agent state machine for extraction, verification, policy checks, and explanation.
- Keep the cryptographic result sourced only from the verifier service.
- Add public-key fingerprint and signer-key status display.
- Store the original sample document privately; store only a digest or commitment and verification-record hash on-chain.
- Add an audit event for each verification, review, rejection, and approval intent.
- Add a second synthetic case that fails verification and one that fails payee or amount policy.

**Exit checks:** invalid signature and policy failures cannot reach the payment control; a reviewer can reproduce the verification using the sample files and versioned record.

### Week 3: 30 November-6 December, buyer control and frontend walkthrough

**Goals:** finish human approval and an explorer-verifiable payment.

- Implement the invoice queue, detail view, evidence panel, human approval summary, and explicit reject path.
- Add the Aevum/tUSD8 testnet wallet transaction; the buyer signs it.
- Reconcile state from confirmed chain receipts and expected events. Pending transactions must not display as paid.
- Build the public landing page and the approved read-only walkthrough.
- Add the single GSAP pinned workflow narrative on the public page and one read-only walkthrough. Provide a normal-scroll fallback and respect reduced motion.
- Add privacy-safe error, loading, empty, expired, failed, and rejected states.

**Exit checks:** the complete demo can be shown from upload/sample through confirmed testnet transaction and explorer reference; no page implies native EVM ML-DSA verification.

### Week 4: 7-11 December, hardening and submission

**Goals:** remove demo blockers and deliver a transparent open-source submission.

- Run end-to-end, wallet, contract, API, mobile, keyboard, reduced-motion, and failure-path tests.
- Verify explorer links and emitted event fields with the deployed testnet contract.
- Review exact token address, decimals, chain settings, deployment artifacts, environment handling, and documentation.
- Record a short demo that shows the signature result, human approval, transaction confirmation, and digest/proof-hash anchor.
- Publish the source repository and concise setup notes only after code and publication approval.
- Submit by 08:00 UTC on 11 December, with time reserved for organizer forms and link checks.

**Exit checks:** reproducible demo, no unverified addresses, no secrets in repository, no unsupported feature claims, and submission links tested.

### 12-15 December, demo-day readiness

- Rehearse a 3-5 minute walkthrough and a backup recording.
- Keep a fresh synthetic invoice and testnet account ready.
- Prepare a fallback if the faucet, RPC, wallet, or explorer is unavailable.
- On 15 December, state clearly that the demo is testnet-only and the ML-DSA verification is off-chain.

## Cost plan

| Area | Planning approach |
|---|---|
| Testnet and explorer | Use official public infrastructure where available; verify rate limits and faucet availability. Test tokens have no real monetary value. |
| Development hosting | Start on a free or low-cost development tier only if it meets the demo and privacy needs. Check current provider terms and limits. |
| AI/OCR | Keep calls optional and capped. Use synthetic data; choose the provider after checking privacy, retention, and cost. |
| Crypto verification | Prefer a maintained implementation that passes FIPS 204 vectors; licensing and security review are required. |
| Mainnet audit | Not part of the hackathon budget. A professional contract and cryptography review is required before any mainnet launch. |

No precise monthly or audit price is asserted. Set explicit spending caps once providers and volumes are known. A model/API budget must never be allowed to trigger a payment.

## Test checklist

- Valid, invalid, modified-document, unknown-key, revoked-key, wrong-parameter-set, and malformed-signature cases.
- Duplicate invoice, replayed nonce, expired intent, payee mismatch, amount over limit, wrong chain, wrong token, and wallet rejection.
- RPC timeout, dropped transaction, replacement transaction, reverted transfer, and unconfirmed event.
- Database outage before and after chain confirmation. Reconciliation must recover without claiming a transaction that did not confirm.
- Mobile layout, 200% zoom, keyboard-only use, screen-reader labels, high contrast, reduced motion, and non-pinned fallback.
- Search source and logs for private keys, raw invoice contents, email, bank details, and test secrets.

## Mainnet gates

No mainnet deployment until all are complete: independent contract audit, cryptography implementation review, test-vector and interoperability report, privacy/legal review, treasury and incident policy if fees exist, reproducible deployment artifacts, key-management plan, monitoring and support runbook, explicit business approval, and explicit user approval. Create `DOCS.md` at the beginning of this mainnet phase, not during the current testnet planning stage.
