# Signet FAQ

**Status:** Public-facing draft for the testnet prototype. Update when features are built and independently verified.

## What is Signet?

Signet is an AI-assisted way to review signed supplier invoices before approving a stablecoin payment. It checks the supplier's ML-DSA signature off-chain, shows invoice and payee information to a human reviewer, and links a confirmed payment to an on-chain digest or commitment and verification-record hash.

## Does the AI agent approve or send money?

No. The agent can extract fields, run policy checks, call the deterministic signature verifier, and explain the result. A buyer must review the transaction and approve it with their own wallet. The agent has no payment key.

## Does the EVM verify ML-DSA?

No. Signet verifies ML-DSA off-chain with a deterministic implementation. The contract records a document digest or commitment and a hash of the off-chain verification record. That record is not an EVM proof that ML-DSA was verified.

## What exactly is checked?

The verifier checks that the signature matches the exact signed payload and public key. Separate policy checks review the payee, token, amount, expiry, duplicate status, signer-key status, and configured limits. A valid signature alone does not mean the invoice should be paid.

## What is stored on-chain?

Only the minimum reference and payment information needed for the testnet demo, such as a document digest or commitment, verification-record hash, pseudonymous invoice reference, token, amount, buyer/payee addresses, and contract event. The raw invoice, signature bytes, email, bank information, and personal data should remain off-chain.

## Is Signet live on mainnet?

No. The current plan is a testnet prototype for Aevum and tUSD8. Testnet tokens have no real monetary value. No mainnet contract or production service is represented by this document.

## Does Signet custody funds?

No. The proposed MVP is non-custodial. The buyer authorizes the payment through their wallet. The AI agent and application server do not hold the buyer's private key.

## What happens when a signature or policy check fails?

The invoice is blocked from payment and shown with a reason, such as invalid signature, unknown or revoked signer key, duplicate invoice, payee mismatch, amount over limit, or expired request. A human can review or reject it, but the agent cannot override a failed cryptographic result.

## What does the chain prove?

The chain proves that a transaction and anchor event were included and confirmed, assuming the chain and contract behave as expected. It does not prove that the invoice was genuine, that the ML-DSA signature was valid, or that the AI's extracted fields were correct. Those require off-chain evidence and review.

## Can Signet connect to other accounting systems or chains?

The architecture is intended to support adapters, but Aevum/tUSD8 is the only challenge target. No other ERP, chain, token, x402 facilitator, paymaster, smart account, or agent-wallet integration is claimed as currently available.

## What are the fees?

| Stage | Fee status |
|---|---|
| Challenge testnet prototype | No Signet protocol fee is planned. Testnet gas and tokens are not real-value payments. |
| Mainnet or hosted service | Not set. Any subscription, per-invoice charge, or protocol fee requires validation and public disclosure first. |
| Signet token | No native project token is planned. |

## Is an ML-DSA signature automatically a legally valid e-signature?

No legal conclusion is made here. Signature law depends on jurisdiction, process, identity assurance, consent, and document type. Obtain qualified legal advice before using Signet for legally binding production workflows.

## Has the contract been audited?

No. The contract is a proposed design only. Independent contract and cryptography reviews are required before any mainnet launch.

## Can a supplier rotate or revoke a key?

Key onboarding, ownership proof, revocation, and rotation are part of the design plan but are not implemented. The workbench must display the key fingerprint and status, and block unknown or revoked keys.
