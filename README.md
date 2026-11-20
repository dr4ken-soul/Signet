# Signet

**Working name:** Signet. Name/domain/trademark clearance has not been completed.

**Project status:** Documentation and design approved; code has not been authorized or created.

**Prepared:** 15 November 2026

Signet is an AI-assisted control flow for signed supplier invoices. A bounded agent coordinates document intake, field extraction, payee and amount checks, and off-chain ML-DSA signature verification. A buyer reviews and explicitly approves payment. Aevum records a document digest and verification-record hash alongside the tUSD8 payment. The EVM is not claimed to verify ML-DSA.

## Current decisions

- Challenge target: Aevum EVM testnet and tUSD8.
- Human-in-the-loop: the agent cannot approve or execute a payment without the buyer's wallet action.
- Post-quantum workflow: verify ML-DSA off-chain using a deterministic verifier; anchor document and verification-record hashes on-chain.
- Frontend: Bento grid operational, Outfit headings, IBM Plex Sans body, JetBrains Mono for technical values, Cool Ledger / Signal Teal palette.
- Public navigation: visible active-link underline with scroll highlight, using a text-only Signet wordmark.
- Hero: approved static full-bleed background visual, with tonal overlay, upper-left copy, and lower-right sample proof panel. The user-designated image location is `S:\Hackathon\Signet\hero-image` (see `FRONTEND_SPEC.md`); its contents are not accessible or verified in this workspace, and no Google Flow adaptation is approved as final.
- Motion: GSAP pinned scroll on the public landing page and one read-only app walkthrough only. Live invoice and payment controls use normal scrolling.
- No hardcoded logo or brand symbol. None is needed for the MVP.
- No soundbox, autonomous agent wallet, project token, or mainnet launch in the MVP.

## Documentation map

| File | Purpose |
|---|---|
| [PRODUCT.md](PRODUCT.md) | Plain-language product, user roles, workflow, and boundaries |
| [APP_BLUEPRINT.md](APP_BLUEPRINT.md) | Architecture, market hypotheses, MVP, schema, API plan, costs, roadmap, and open decisions |
| [FRONTEND_SPEC.md](FRONTEND_SPEC.md) | Approved design decisions, public page, app surfaces, states, accessibility, and asset brief |
| [WHITEPAPER.md](WHITEPAPER.md) | Technical architecture and security model |
| [TEAM_OPS.md](TEAM_OPS.md) | Build, deployment, key, incident, and support procedures |
| [FAQ.md](FAQ.md) | Public-facing product and fee questions |
| [CLAUDE.md](CLAUDE.md) | Persistent project instructions for an implementation agent |
| [BUILD_GUIDE.md](BUILD_GUIDE.md) | Four-week testnet build and hackathon delivery plan |

`DOCS.md` is intentionally deferred until a mainnet phase. Code files, database migrations, route files, package manifests, and `.env.example` are also deferred until the user explicitly approves code work.

## Challenge context

The project is scoped to the QDay Aevum Builder Challenge #1. The challenge page describes a tUSD8 payment app on Aevum, a build window from 16 November to 11 December 2026, submissions closing 11 December at 08:00 UTC, and demo day on 15 December. Confirm current rules and token details before implementation: [DoraHacks challenge detail](https://dorahacks.io/hackathon/qday/detail), [QDay Aevum build information](https://qday.io/build), and [challenge announcements](https://dorahacks.io/hackathon/qday/announcements).

The documented Aevum testnet configuration is chain ID `44005` (`0xABE5`), RPC `https://rpc-test.qday.info`, and explorer `https://explorer-test.qday.info/`. The tUSD8 contract address is not recorded here because it was not confirmed in the reviewed official material. Do not invent an address. QDay marks x402, paymasters, smart accounts, agent wallets, and some SDKs as coming soon, so Signet must not depend on them for the MVP.

## Build status

This repository currently contains documentation only. The next code step requires explicit user approval. Before code, confirm the current Aevum RPC, tUSD8 address and faucet, ML-DSA verifier library and parameter set, invoice signing envelope, and the privacy mode for on-chain commitments.
