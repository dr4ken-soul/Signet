# Signet Agent Context

## Project identity

Signet is the working project name for an AI-assisted signed-invoice payment-control product. It targets Aevum EVM testnet and tUSD8 for the QDay Aevum Builder Challenge. The name has not been cleared for trademark or domain use.

## Current stage

The approved deliverable in this phase is documentation. No app code, Solidity, database migrations, API route files, package manifests, or `.env.example` may be created until the user explicitly approves code work. Existing project decisions are recorded in `README.md`, `PRODUCT.md`, `APP_BLUEPRINT.md`, and `FRONTEND_SPEC.md`.

`DOCS.md` is deferred until a mainnet phase. The workbench navigation and several implementation choices remain open as marked in the blueprint.

## Non-negotiable cryptographic boundary

- The agent coordinates ML-DSA verification off-chain using a deterministic FIPS 204 implementation.
- The language model does not decide whether a signature is valid and cannot override verifier output.
- The EVM does not natively verify ML-DSA in this design. Never claim or imply that it does.
- Aevum records a document digest or privacy-preserving commitment and a hash of a versioned off-chain verification record. That hash is a reference, not an on-chain cryptographic proof of ML-DSA validity.
- Raw invoice files, signatures, personal information, and signer private keys are never placed on-chain.
- The buyer explicitly signs the payment. The agent has no wallet key and cannot send funds.

## Product constraints

- Use synthetic data for the demo. Label every walkthrough as a sample.
- The UI must distinguish `Verified off-chain`, `Approval required`, `Transaction submitted`, and `Anchored on-chain`.
- Reconcile chain state from a confirmed receipt and expected event before the database claims payment or anchoring.
- Use fail-closed policy checks for invalid signatures, unknown or revoked keys, duplicate invoices, payee mismatch, amount limits, expiry, and chain errors.
- Keep document, verifier, model, wallet, token, and chain integrations behind adapters. The MVP is Aevum/tUSD8 only; other networks are not claimed as supported.
- Do not depend on QDay features marked coming soon, such as x402, paymasters, smart accounts, agent wallets, or unreleased SDKs.
- No autonomous payments, project token, mainnet, escrow, factoring, streaming, or soundbox in the MVP.

## Design constraints

- Use Bento grid operational, Outfit, IBM Plex Sans, JetBrains Mono, and the approved Cool Ledger / Signal Teal tokens in `FRONTEND_SPEC.md`.
- Public navigation is the confirmed B3 visible active-link pattern. The brand is plain text only.
- The approved hero is a static full-bleed atmospheric background field behind the page content, like a background color, with a tonal overlay. It is not a literal invoice, app/site screenshot, dashboard, or product illustration. The user-designated hero/background image location is `S:\Hackathon\Signet\hero-image`; see `FRONTEND_SPEC.md` for status and access notes. Do not replace that designation with the unapproved Arena-generated candidate. Follow the sourcing steps in `FRONTEND_SPEC.md`: search with 2-3 short background-oriented Pinterest terms for abstract color, material, texture, light, and copy-safe composition; inspect actual candidates and verify source rights before acquisition. Keep the upper-left copy area and lower-right proof-panel area calm. The proof panel, not the background, carries invoice-specific content. Do not use search thumbnails or competitor artwork as final assets. Use Google Flow only with a rights-cleared reference whose terms allow the intended adaptation, follow the model and controls currently available, and wait for the user's selection. If rights are unclear, use high-level visual notes for original art rather than uploading or reproducing the image. Keep the hero static unless the user explicitly approves motion. Generate original art only after the user approves that art direction.
- GSAP pinned scroll is limited to the public narrative and one read-only walkthrough. Live workbench tasks use ordinary scrolling and restrained local feedback.
- Never add a logo, symbol, monogram, new icon library, external font dependency, or sound without explicit user approval.
- Avoid generic gradient/orb backgrounds, fake metrics, fabricated testimonials, and three equal feature cards.

## Security and implementation behavior after code approval

1. Read `APP_BLUEPRINT.md` and `FRONTEND_SPEC.md` before changing the project.
2. Ask for current Aevum and tUSD8 values and confirm the ML-DSA library, parameter set, and signed-envelope format before writing cryptographic code.
3. Keep model output separate from deterministic validation. Use typed tools and reason codes.
4. Never log secrets or invoice content. Keep private files in access-controlled storage.
5. Never hardcode private keys, API keys, treasury addresses, or unverified contract addresses.
6. Use a fixed non-upgradeable contract by default. Do not deploy to mainnet without audit, legal, privacy, and explicit user approval.
7. Do not create real migrations, routes, or `.env.example` from the blueprint until the user authorizes code. When authorized, create actual configuration from confirmed values, not placeholders masquerading as working configuration.

## Writing conventions

Be precise and plain-language. Mark hypotheses and unverified integrations as such. Use the term `ML-DSA` and state where verification occurs. Avoid promises of legal validity, production security, or quantum-proof guarantees. Do not use em dashes in generated UI copy or project documentation.
