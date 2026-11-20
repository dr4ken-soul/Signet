# Signet App Blueprint

**Version:** 0.1, pre-build

**Date:** 15 November 2026

**Status:** Product and design decisions documented. Code, deployment, migrations, API route files, and secrets configuration have not been authorized or created.

## 1. Executive summary

Signet is an AI-assisted signed-invoice payment-control workflow for the QDay Aevum Builder Challenge #1. A bounded agent extracts and summarizes invoice details, runs policy checks, and invokes a deterministic off-chain ML-DSA verifier. A buyer reviews the evidence and explicitly approves or rejects the payment. The testnet contract transfers tUSD8 and anchors a minimal document digest or commitment plus a hash of the off-chain verification record. The EVM does not natively verify ML-DSA in this design.

The product is not a general-purpose accounts-payable suite. It focuses on document authenticity, payee and amount review, controlled stablecoin payment, and a verifiable evidence trail. The design is intentionally modular so document, model, verifier, wallet, token, and chain integrations can be replaced without turning the product into a single-chain silo.

## 2. Context and evidence

### Challenge facts

The reviewed DoraHacks challenge material calls for a stablecoin payment application using tUSD8 on Aevum. The build period is 16 November to 11 December 2026, submissions close at 08:00 UTC on 11 December, and demo day is 15 December. The stated prize pool is $1,500 USDT. Judging emphasizes a reliable demo, explorer-verifiable activity, originality and agentic mechanics, safety, practical utility, integration depth, UX, and reusable open source. Recheck the live challenge page before committing a submission plan: [DoraHacks details](https://dorahacks.io/hackathon/qday/detail), [DoraHacks listing](https://dorahacks.io/hackathon/qday), [announcements](https://dorahacks.io/hackathon/qday/announcements), and [build tracks](https://dorahacks.io/hackathon/qday/build).

The official QDay build page lists Aevum as EVM-compatible, chain ID `44005` (`0xABE5`), RPC `https://rpc-test.qday.info`, and explorer `https://explorer-test.qday.info/`. Verify these details and the tUSD8 contract address at implementation time. No tUSD8 address is asserted in this document. QDay marks x402, stablecoin paymasters, smart accounts, agent wallets, and some official SDKs as coming soon. The MVP must not depend on them: [QDay build information](https://qday.io/build).

### Market and competitor snapshot

This is a directional product scan, not a complete market study. No customer interviews or willingness-to-pay tests have been completed, and no TAM figure is asserted.

| Product or category | Publicly described capabilities | Implication for Signet |
|---|---|---|
| BILL AP and agentic finance capabilities | Invoice capture, approval and payment workflows, risk intelligence, and additional AI controls are described in public product reporting [4](https://www.cpapracticeadvisor.com/2026/10/20/bill-unveils-new-agentic-capabilities-for-finance-teams/192079/). | Generic AI invoice extraction, approval routing, and fraud flags are not a defensible differentiator by themselves. |
| Tipalti invoice management | AI-assisted capture, coding, matching, review, approval, payout, and duplicate detection are described on its product pages [1](https://tipalti.com/ap-automation/invoice-management/). | The core workflow must complement existing finance systems, not claim to replace their entire AP stack. |
| Ramp Bill Pay | Ramp describes invoice intake, coding and fraud agents, approval recommendations, and payment controls [1](https://ramp.com/accounts-payable). | Human-controlled payment and agent oversight are important, but not unique. Signet must make its signature and evidence boundary concrete. |
| Public Aevum/tUSD8 repositories found in search | Search surfaced [LBCron/aevum-tusd8-paystream](https://github.com/LBCron/aevum-tusd8-paystream) and a [moneyswitch QDay demo](https://github.com/dongsheng123132/moneyswitch/releases/tag/qday-demo-2026-11). These are adjacent technical signals, not confirmed DoraHacks submissions or active competitors. The public DoraHacks build page showed no public builds when checked, a time-bound snapshot only. | Recheck the live build list and avoid claiming novelty without a current challenge-specific scan. |

**Positioning hypothesis:** Signet focuses on signed-invoice provenance: ML-DSA verification is executed off-chain, the evidence is reproducible, a human approves a bounded payment, and Aevum anchors a minimal digest and verification-record hash. A public-page scan did not establish that incumbents lack similar capabilities. This is a hypothesis to validate, not a market fact.

### Validation before expanding scope

1. Interview at least five accounts-payable or finance operators about invoice authenticity, supplier-key management, approval handoffs, stablecoin use, and audit requirements.
2. Interview at least three suppliers or invoice issuers about signing documents, key custody, and how a buyer should verify a signer.
3. Test whether users can explain what was checked off-chain versus recorded on-chain after a five-minute prototype walkthrough.
4. Ask developers and finance-system integrators whether a document/verifier/chain adapter is useful or whether a single ERP integration is the real blocker.
5. Validate willingness to pay for hosted verification and audit evidence. Do not infer pricing from the hackathon or set a protocol fee before interviews.

## 3. Product goals and non-goals

### Goals

- Verify the supplier's ML-DSA signature off-chain with a deterministic implementation.
- Extract and display invoice data with confidence indicators and human correction.
- Confirm the expected payee, token, amount, expiry, and configured spending policy before approval.
- Require an explicit buyer wallet action before any payment.
- Link the confirmed payment to a document digest or commitment and a verification-record hash on Aevum.
- Make the cryptographic and on-chain/off-chain boundary understandable to non-cryptographers.
- Keep integration seams open for future document, accounting, model, verifier, chain, and token adapters.

### Non-goals for the challenge MVP

Mainnet, real funds, custody, autonomous spending, native EVM ML-DSA verification, project token, x402, paymaster or smart-account dependency, agent-wallet dependency, invoice factoring, escrow, streaming payments, bank settlement, legal claims about e-signature validity, and unapproved ERP integrations.

## 4. Users and permissions

| Role | Allowed actions | Restrictions |
|---|---|---|
| Supplier or signer | Provide invoice bytes, ML-DSA signature, and public-key identity; review payment status if invited | Private key stays with supplier; cannot approve buyer payment |
| AP reviewer | Inspect invoice, signer, extraction, payee, amount, policy findings, and evidence | Cannot pay unless granted approver role |
| Buyer approver | Approve or reject; sign the payment transaction with own wallet | Approval is explicit and bound to invoice, token, amount, payee, nonce, and expiry |
| Workspace administrator | Configure approvers, limits, allowlists, supported adapters, retention, and signer-key status | Cannot override invalid signature result or silently change already-approved payment details |
| Agent | Extract, compare, summarize, call deterministic verifier, prepare transaction intent | No wallet private key, no direct payment capability, no permission to mark a transaction confirmed |
| Read-only auditor | Inspect verification record, chain receipt, and event linkage | No write or payment rights |

## 5. MVP workflow and state machine

1. `received`: invoice and signature envelope enter private storage.
2. `extracting`: AI/OCR proposes structured fields. The user can correct them; uncertain fields are visibly marked.
3. `verifying`: the deterministic verifier checks the exact signed payload and public key. The agent reports the verifier version and result.
4. `needs_review`: missing key, invalid signature, field mismatch, duplicate, unknown payee, amount over limit, or ambiguous extraction. Payment controls are blocked until the issue is resolved by an authorized person or the invoice is rejected.
5. `ready_for_approval`: signature is valid, signer identity is recognized, required fields are present, and configured payee/amount rules pass.
6. `awaiting_wallet`: the buyer reviews a transaction summary and opens a wallet confirmation request. The agent cannot sign for the buyer.
7. `submitted`: transaction hash is known but not yet confirmed. Do not show paid or anchored.
8. `confirmed`: a receipt and expected contract event have been verified on the selected chain. Only now may the database mark payment and anchor as confirmed.
9. `rejected`, `expired`, or `failed`: terminal or retryable states with specific explanations and no silent retry of payment.

Proposed challenge transaction: one buyer-signed transaction that enforces the payment constraints, transfers tUSD8, and emits the document commitment and verification-record hash after approval. Whether the record should be separately anchored before payment remains an open implementation decision. An atomic `approvePayAndAnchor` path is the recommended MVP default, subject to contract review.

## 6. Cryptographic and payment architecture

### ML-DSA verification

NIST FIPS 204 specifies ML-DSA for generating and verifying digital signatures [1](https://csrc.nist.gov/pubs/fips/204/final). The verifier service must follow the current specification and errata and pass authoritative test vectors. The parameter set and library are not selected yet; this is a pre-code spike.

The AI agent may call a typed `verifySignature` tool, but the result comes only from the deterministic cryptographic implementation. The LLM must never infer, paraphrase, or override `valid=true/false`. A verifier response should include: algorithm and parameter set, signer-key fingerprint, digest of the exact signed payload, result, reason code, verifier build/version, and timestamp. A human-readable explanation can be generated from these fields.

MVP signing-envelope format is an open decision. It must bind the exact invoice bytes or their digest, signer-key identity, invoice reference, and any payment context that must not be changed after signing. Do not reconstruct a PDF or change field ordering and then treat it as the signed original. Define canonicalization and domain separation before code.

### On-chain verification boundary

The EVM contract does not verify ML-DSA. It stores a minimal digest or commitment and the hash of a versioned off-chain verification record. The record hash is a reference, not a mathematical proof that the EVM checked ML-DSA. Independent reproduction requires the original signed bytes, signer public key, report artifact, and verifier version.

Use a privacy review before deciding whether to publish a direct document hash or a salted commitment. The demo can use synthetic invoices and a direct digest. Production invoices may require a commitment scheme to reduce equality and dictionary-linking risk. Never publish the invoice file, signature bytes, personal data, or supplier banking details.

### Proposed contract behavior

- EVM-compatible Solidity contract with no proxy or upgradeability by default.
- Minimal `payAndAnchor` transaction: validate unique invoice reference, payer, payee, allowed token, positive amount, nonce, expiry, configured limit, and unused status; then transfer from the buyer and emit a record event. The exact call order must be tested for atomic revert behavior.
- `SafeERC20`-style handling for token transfers. Use `permit` only if tUSD8 supports it and the integration is audited; otherwise use the standard allowance flow.
- No raw invoice or personal data in storage or events.
- No protocol fee in the MVP. Any future fee and treasury route require a separate approved business and security decision.
- Contract deployment should be fixed and independently auditable. A security audit is mandatory before mainnet.

### Aevum configuration

- Chain ID: `44005` / `0xABE5`, pending re-verification at build start.
- RPC: `https://rpc-test.qday.info`.
- Explorer: `https://explorer-test.qday.info/`.
- Token: tUSD8, address pending confirmation from current official instructions.
- Do not rely on QDay features marked coming soon, including x402, paymasters, smart accounts, agent wallets, or unreleased SDKs.

## 7. Proposed stack

| Layer | Proposal | Guardrail |
|---|---|---|
| Web | Next.js App Router, TypeScript, CSS tokens/Tailwind | Use a currently supported stable version at code approval; no code has been generated |
| Motion | GSAP ScrollTrigger for the public pinned story and one read-only walkthrough; CSS/local motion for controls | Respect `prefers-reduced-motion`; no pinned motion in live approval or payment controls |
| Wallet | wagmi and viem with EIP-1193 wallets | Buyer signs; server and agent never hold buyer keys |
| Contract | Solidity with Hardhat or Foundry, selected after a short toolchain test | Fixed contract by default, testnet first, no hidden admin payment path |
| Verifier | Isolated off-chain ML-DSA service using a maintained FIPS 204 implementation | Library and parameter set pending test vectors, license, interoperability, and security review |
| Agent | Small typed workflow/state machine with a model adapter for extraction and explanation | Deterministic checks are tools; model cannot set cryptographic or payment truth values |
| Data | Postgres for metadata and private object storage for encrypted invoice files | Row-level authorization; no raw documents or private keys on-chain |
| Identity | Wallet signature for approver actions; optional workspace identity only if pilot needs it | Avoid requiring email if wallet-only access is sufficient for the MVP |
| Observability | Structured audit events, contract events, and explorer links | Do not store secrets or full invoice content in logs |

## 8. Data model proposal

This is a schema decision record, not a SQL migration. Exact column types, indexes, and retention need code-phase approval.

| Table | Principal fields | Notes |
|---|---|---|
| `workspaces` | `id`, `name`, `default_chain_id`, `default_token`, `created_at` | No public personal data required |
| `memberships` | `workspace_id`, `wallet_address`, `role`, `status`, `created_at` | Role-based access; wallet address normalized per EVM rules |
| `signer_keys` | `id`, `workspace_id`, `public_key`, `algorithm`, `parameter_set`, `fingerprint`, `status`, `valid_from`, `revoked_at` | Public keys only; never private signing keys |
| `invoices` | `id`, `workspace_id`, `external_ref_hash`, `object_key`, `document_digest`, `signer_key_id`, `payee_address`, `token_address`, `amount`, `due_at`, `state`, `created_at` | Original file in private storage; avoid putting personal data in public identifiers |
| `verification_runs` | `id`, `invoice_id`, `result`, `reason_codes`, `verifier_version`, `algorithm`, `key_fingerprint`, `report_object_key`, `report_hash`, `created_at` | Result is written by verifier service, never by LLM response |
| `policy_rules` | `id`, `workspace_id`, `allowed_payees`, `allowed_tokens`, `max_amount`, `requires_approval`, `version`, `updated_at` | Immutable policy version recorded with each approval intent |
| `approvals` | `id`, `invoice_id`, `approver_wallet`, `decision`, `policy_version`, `nonce`, `expires_at`, `tx_hash`, `created_at` | Store decision and transaction linkage; require signer authorization |
| `chain_transactions` | `id`, `invoice_id`, `chain_id`, `contract_address`, `tx_hash`, `block_number`, `event_name`, `status`, `confirmed_at` | Payment/anchor state is updated only after a confirmed receipt and expected event |
| `audit_events` | `id`, `workspace_id`, `actor_type`, `actor_id`, `action`, `object_id`, `outcome`, `metadata_hash`, `created_at` | Redacted, append-only application log; do not log invoice contents or secrets |

## 9. API plan

Route contracts below are planned and are not route files. Every write route needs authentication, authorization, schema validation, rate limits, idempotency where appropriate, and an audit event.

| Method and route | Purpose | Authority boundary |
|---|---|---|
| `GET /api/v1/demo/invoices/sample` | Return synthetic walkthrough data | Read-only, no wallet required |
| `POST /api/v1/invoices` | Create invoice record and issue a short-lived private upload target | Workspace member; validate file type and size |
| `GET /api/v1/invoices/{id}` | Read invoice fields, state, and evidence | Workspace-scoped read permission |
| `POST /api/v1/invoices/{id}/verification` | Run extraction and deterministic signature verification | Idempotent; server ignores client-asserted verification results |
| `GET /api/v1/invoices/{id}/verification` | Retrieve signed or hashed verification record | Workspace-scoped read permission |
| `POST /api/v1/invoices/{id}/approval-intent` | Create bounded transaction data for buyer review | Approver role; bind payee, amount, token, nonce, expiry, and policy version |
| `POST /api/v1/invoices/{id}/chain-confirmation` | Reconcile a transaction receipt/event after the wallet submits it | Verify transaction and event from RPC; do not trust browser status alone |
| `GET /api/v1/invoices/{id}/proof` | Return chain reference and verification-record metadata | Read-only; redact private details |

No API route is permitted to sign a buyer transaction or move funds server-side in the MVP.

## 10. Screen and flow outline

### Public site

Landing page with text-only wordmark, visible section navigation, static hero image, approved product proof panel, pinned explainer, read-only walkthrough, integration boundary, audit/security explanation, use cases, FAQ, and demo CTA.

### Signed-in workbench

1. Connect wallet and select workspace.
2. Invoice queue with clear states and filters.
3. Invoice detail with original document viewer, extracted fields, signer and key identity, ML-DSA result, payee/amount checks, and policy reasons.
4. Review and correct extraction; never edit signed bytes silently.
5. Approve or reject. Approval opens wallet confirmation with a human-readable transaction summary.
6. Submitted/confirmed states with transaction and explorer links.
7. Audit record and document/verification proof download for authorized reviewers.

Workbench navigation has not been separately approved. The frontend spec proposes a visible, labeled left rail for Invoice Queue, Verification, Policies, Activity, and Settings. Treat that as a proposal, not a locked design decision, until code approval.

## 11. Planned repository structure

This tree is a future structure only. No folders or code files are created by this document.

```text
signet/
  README.md
  PRODUCT.md
  APP_BLUEPRINT.md
  FRONTEND_SPEC.md
  WHITEPAPER.md
  TEAM_OPS.md
  FAQ.md
  CLAUDE.md
  BUILD_GUIDE.md
  DOCS.md                         # add only at mainnet phase
  src/
    app/                          # public site, demo, authenticated workbench
    components/                   # accessible product UI
    features/invoices/            # state, schema, display helpers
    features/verification/        # verification evidence UI and API client
    features/payments/            # wallet transaction preparation and status
    lib/chains/                   # Aevum adapter and future chain adapters
    lib/tokens/                   # tUSD8 configuration and future tokens
    server/agent/                 # bounded workflow and model adapter
    server/verifier/              # deterministic ML-DSA verification boundary
    server/storage/               # private object storage adapter
  contracts/                      # reviewed Solidity sources after approval
  test/                           # crypto vectors, contract, API, and E2E tests
  supabase/migrations/            # create only after code approval
  public/images/                  # approved static hero asset only
  .env.example                    # create only after code approval
```

### Migration plan, documented but not generated

| Planned migration | Tables / concerns | Key invariants |
|---|---|---|
| `0001_workspace_identity` | Workspaces, memberships, wallet roles | Workspace-scoped access; normalized wallet addresses; least privilege |
| `0002_signer_registry` | Signer keys and key status history | Public keys only; retain revocation history; never overwrite historical fingerprints |
| `0003_invoice_verification` | Invoice metadata, private object references, verification runs | Unique invoice reference; immutable original digest; verifier result written only by verifier service |
| `0004_policy_approval` | Policy versions and approval intents | Bind approver, payee, token, amount, nonce, expiry, and policy version |
| `0005_chain_audit` | Confirmed chain transactions and application audit events | Payment state requires verified receipt and event; audit records are append-only and redacted |

These are migration names and constraints only. No SQL, migration file, or database project has been created.

### Environment variable inventory, documentation only

The following names describe future configuration requirements. Values and `.env.example` are intentionally omitted until code approval and official address confirmation.

| Variable | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_CHAIN_ID` | Public | Confirmed Aevum chain ID for wallet configuration |
| `NEXT_PUBLIC_AEVUM_RPC_URL` | Public | Testnet read/write RPC endpoint, if exposed to browser |
| `NEXT_PUBLIC_AEVUM_EXPLORER_URL` | Public | Explorer base URL |
| `NEXT_PUBLIC_TUSD8_ADDRESS` | Public | Verified test-token contract address; not yet confirmed |
| `NEXT_PUBLIC_ANCHOR_CONTRACT_ADDRESS` | Public | Deployed testnet contract address, only after deployment |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Public, if used | Wallet connection configuration |
| `DATABASE_URL` | Server only | Postgres connection |
| `OBJECT_STORAGE_BUCKET` | Server only | Private invoice/verification-artifact bucket |
| `OBJECT_STORAGE_ACCESS_KEY` | Secret | Storage authentication |
| `OBJECT_STORAGE_SECRET_KEY` | Secret | Storage authentication |
| `VERIFIER_BASE_URL` | Server only | Deterministic off-chain verifier service |
| `VERIFIER_AUTH_TOKEN` | Secret | Service-to-service verifier authentication |
| `MODEL_PROVIDER` | Server only | Selected extraction/explanation provider adapter |
| `MODEL_API_KEY` | Secret | Model provider key, if a hosted provider is approved |
| `SESSION_SECRET` | Secret | Application session signing/encryption |
| `TREASURY_ADDRESS` | Not needed for MVP | Only if a future, separately approved fee model exists; never hardcode in contract source |

Never place secrets in `NEXT_PUBLIC_*`. The agent must not receive a buyer private key. No `.env.example` file has been created.

## 12. Authentication, privacy, and safety

- Buyer payment approval is wallet-signed. The AI agent has no wallet secret and no transfer function.
- Verification result and policy outcome are distinct. A valid signature does not prove the invoice amount or payee is acceptable.
- The UI displays signer, exact document digest, verifier version, payee, token, amount, expiry, policy result, and the chain/network before approval.
- Raw invoices and signatures are private off-chain data. Encrypt storage, restrict access, redact logs, set retention, and obtain consent before sending any content to a third-party model.
- Test fixtures should be synthetic. The read-only demo must not expose a live upload path that appears to be production.
- Use strict duplicate detection, domain separation, unique nonces, expiry, and replay protection.
- Model extraction confidence as a review aid, never as cryptographic validity or payment authorization.
- Confirm on-chain receipts and expected events before marking payment or anchor as complete.

## 13. Monetization and operating-cost hypothesis

### Monetization

No fee or token model is approved. Testnet MVP is free and uses tokens with no real monetary value. After user validation, test a hosted workspace subscription or per-verified-invoice fee. A transparent optional protocol fee may be considered later, but it requires legal review, an explicit fee schedule, and an approved treasury policy. No project token is planned.

### Cost planning

| Cost area | Prototype approach | Cost control |
|---|---|---|
| Aevum testnet | Official RPC and explorer where available | Check rate limits and faucet availability; testnet gas is not real-value spend |
| Contract tests | Local development tools and testnet deployment | No mainnet deployment; no paid audit in the hackathon MVP |
| Hosting and database | Free or low-cost development tier if adequate | Verify current provider prices and data limits before launch |
| AI extraction | Provider adapter, capped calls, synthetic sample data | Keep model calls optional; use a hard monthly budget and redact sensitive fields |
| ML-DSA verifier | Open-source candidate after license and security review | Do not use an unreviewed package in production; run vectors and benchmarks first |
| Image asset | One approved optimized static hero image | No recurring video or 3D asset cost; asset generation remains unapproved |

For early planning, target a no-paid-service testnet build where possible and set a small capped model/API budget only after selecting a provider. Do not treat a dollar estimate as a quote; confirm current hosting, model, and audit costs before a pilot.

## 14. Launch and distribution

1. Verify the current challenge requirements and Aevum/tUSD8 configuration.
2. Publish a reproducible open-source testnet demo with synthetic signed invoices and an explorer link.
3. Share the demo and integration notes through the QDay Discord and DoraHacks challenge channels, following their current rules.
4. Record a short walkthrough that visibly shows the off-chain ML-DSA result, human approval, confirmed payment, and on-chain hash reference.
5. After the hackathon, interview finance operators and suppliers before implementing ERP integrations, mainnet, or paid hosting.
6. Create `DOCS.md` only when a mainnet phase is approved and the deployed contract/address are stable.

## 15. Risk register

| Risk | Mitigation / gate |
|---|---|
| False claim of native EVM ML-DSA | Label verification off-chain everywhere; the contract stores hashes and payment state only |
| Compromised or mismatched supplier key | Key fingerprint, validity/revocation status, rotation procedure, buyer review, and fail-closed behavior |
| AI extraction error | Show source region and confidence, require human correction, block critical mismatches |
| Duplicate, replay, or changed payee | Unique invoice reference, nonce, expiry, exact wallet summary, contract bounds |
| Invoice privacy leakage | No raw data on-chain; private storage, encryption, access control, retention policy, optional salted commitments |
| Unknown or changing testnet setup | Recheck official chain and token details before code; never hardcode unverified addresses |
| Unavailable QDay SDK or paymaster | Use standard EVM tooling and wallet signing; treat coming-soon features as optional future adapters |
| Crypto library/format mismatch | Run NIST vectors, format interoperability tests, license review, and a security review before accepting real invoices |
| Legal and compliance uncertainty | No legal guarantee or mainnet claim; seek jurisdiction-specific counsel before production |
| Scope expansion | Keep streaming, escrow, factoring, bank rails, autonomous payment, and tokenomics out of MVP |

## 16. Open decisions before code approval

1. Choose and test the ML-DSA parameter set, library, runtime, and supported envelope format.
2. Verify current tUSD8 address, faucet, token decimals, and Aevum RPC/explorer status.
3. Decide whether the chain stores a direct digest for synthetic demo data or a privacy-preserving commitment for real invoices.
4. Confirm whether payment and anchoring happen atomically or in separate transactions.
5. Define signer-key onboarding, ownership proof, revocation, and rotation.
6. Select the model/OCR provider or a local-only path and define invoice data-consent rules.
7. Choose the initial buyer identity model and confirm whether workspaces require email login.
8. Validate target AP workflow, integration priority, pricing, and legal status with users.
9. Check Signet trademark and domain availability.
10. Approve code scope. Until then, do not create migrations, route files, `.env.example`, Solidity, or app code.
