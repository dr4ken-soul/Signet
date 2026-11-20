# Signet Frontend Specification

**Status:** Design gates complete. Specification only. No frontend code or image asset has been created.

**Date:** 15 November 2026

## 1. Product and audience

Signet is an AI-assisted signed-invoice review and payment-control product for accounts-payable teams, suppliers, and integrators. The interface must make the evidence readable, the human decision obvious, and the ML-DSA/off-chain versus digest/on-chain boundary impossible to confuse.

The public site is a short product explanation and read-only demo entry point. The signed-in workbench is an operational tool. Do not make crypto knowledge a prerequisite for understanding an invoice or approving a payment.

## 2. Confirmed identity and design decisions

| Decision | Confirmed direction |
|---|---|
| Working name | Signet. Legal, domain, and trademark screening remain open. |
| Aesthetic | Bento grid operational |
| Public navigation | B3 active-link underline with scroll highlight; visible text links and one clear CTA |
| Background | Static hero/background image with tonal overlay; no animated page-wide background |
| Section behavior | GSAP pinned scroll on the public story and one read-only app walkthrough |
| Motion boundary | Live invoice review, approval, and payment controls use ordinary scrolling and local feedback only |
| Fonts | Outfit display, IBM Plex Sans body, JetBrains Mono for technical data |
| Palette | Cool Ledger / Signal Teal, defined below |
| Hero | Full-bleed still image, upper-left copy, lower-right sample proof panel |
| Page sections | Eight-section sequence approved in the design gates |
| Brand mark | No logo, icon, monogram, or hardcoded symbol. Use the word Signet as text only. Ask before creating a mark. |

### Design read and dials

A precise invoice-verification workbench with an evidence-first public narrative, restrained bento modules, and a static, custom hero visual.

- `DESIGN_VARIANCE: 4`
- `MOTION_INTENSITY: 7` for the public pinned narrative and read-only walkthrough only
- `VISUAL_DENSITY: 5`
- Live payment screens: static surfaces, visible status changes, and small local interactions. No pinned or scroll-locked behavior.

**Working Project Identity Fingerprint:** `top-left lead, bottom-right support / Swiss rational / monochrome + single pop / full-bleed image with tonal overlay / wave / scroll-driven narrative`.

## 3. Typography

Google Fonts import:

```css
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Outfit:wght@500;600;700&display=swap');
```

- Headings and the text wordmark: Outfit.
- Body and form labels: IBM Plex Sans.
- Digests, signer fingerprints, transaction hashes, timestamps, and compact metadata: JetBrains Mono.
- Use no more than three weights on a page. Keep long invoice values readable and selectable; do not reduce key payment data to tiny mono text.

## 4. Color and surface tokens

The uploaded curated palette list does not contain a Bento-specific palette. The approved custom palette is cool-neutral with a restrained teal signal. All color pairs must meet WCAG AA contrast in the implemented state. A colored status must also have a text label or icon-independent indicator.

```css
:root {
  --font-display: 'Outfit', sans-serif;
  --font-body: 'IBM Plex Sans', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  --bg-primary:     #F1F4F3;
  --bg-secondary:   #E6ECE9;
  --bg-surface:     #F9FBFA;
  --bg-elevated:    #FCFDFC;

  --accent:         #0F6B5C;
  --accent-hover:   #0B584B;
  --accent-glow:    rgba(15, 107, 92, 0.12);

  --text-primary:   #17211D;
  --text-secondary: #45524C;
  --text-muted:     #5B6862;

  --border-subtle:  rgba(23, 33, 29, 0.06);
  --border-default: rgba(23, 33, 29, 0.14);

  --success:        #26734F;
  --warning:        #8D5400;
  --error:          #B13934;
  --info:           #2B5C85;
  --focus-ring:     #0F6B5C;
  --hero-overlay:   rgba(15, 23, 20, 0.64);

  --radius-sm: 2px;
  --radius-md: 4px;
  --radius-lg: 8px;
  --radius-xl: 12px;
  --radius-2xl: 16px;

  --shadow-sm: none;
  --shadow-md: none;
  --shadow-lg: none;

  --duration-fast: 140ms;
  --duration-normal: 220ms;
  --duration-slow: 360ms;
}
```

Bento cells use single-pixel borders, deliberate size asymmetry, and CSS-generated low-opacity noise. Do not use the hero image as the background of every cell. Avoid decorative drop shadows, purple/blue gradient glow, blurred orbs, generic crypto coin imagery, and three equal icon-feature cards.

## 5. Navigation

### Public site: confirmed B3

- Text-only Signet wordmark at the left.
- A small set of visible, right-aligned section links. Proposed labels: Product, How it works, Security, FAQ.
- One primary CTA: `Review a sample invoice` or `Open the demo`.
- Active section is indicated by a visible underline and an additional text or weight cue, not color alone.
- On scroll, the bar may use the approved surface token and a subtle border. It must not hide all navigation behind a hover-only interaction.
- On mobile, use a clearly labeled menu button, visible focus state, Escape handling, and a persistent high-priority action. Minimum touch targets should meet or exceed the applicable WCAG 2.2 requirement.

### Signed-in workbench: proposed, not separately gate-approved

Recommended starting point is a visible labeled left rail for Invoice Queue, Verification, Policies, Activity, and Settings, with a narrow mobile navigation treatment that remains discoverable. This proposal needs review before implementation. Do not use an invisible drag zone or icon-only navigation for critical actions.

## 6. Hero structure and copy

### Approved composition

A viewport-scale, full-bleed static background visual with a tonal overlay. Text leads from the upper-left area. A bordered bento-style sample proof panel supports from the lower-right. Treat the image as an atmospheric field behind the content, not a literal product illustration. Prioritize calm copy-safe areas over a distinct subject; if there is a focal concentration, keep it away from both overlay areas. No baked-in text, watermark, logo, or invented brand symbol.

### Approved copy direction

**Headline:** Verify the invoice before money moves.

**Supporting copy:** An AI-assisted review checks the supplier's ML-DSA signature off-chain, surfaces payee and amount details, and waits for buyer approval before the invoice digest is anchored on Aevum.

**Primary action:** Review a sample invoice.

**Secondary action:** See how verification works.

### Sample proof panel

Clearly label it `Sample invoice`. Suggested rows:

- Signature: `Verified off-chain`
- Payee: `Review details`
- Buyer approval: `Required`
- Digest anchor: `Pending approval`

These are illustrative demo states, not live customer claims. The panel must not imply EVM-native ML-DSA verification. The contract can record a digest and verification-record hash only.

### Hero image sourcing workflow

**State:** The static full-bleed hero-image direction is approved. The user selected `343610646591738040.jfif` as the style reference, and its unchanged source was converted to `/home/user/343610646591738040-reference.png` (736 x 1593). An Arena image-edit tool was mistakenly used for a candidate instead of following the user's requested Google Flow reference-adaptation workflow; that candidate and its cleanup are not the requested Flow output and are not approved for integration. No Google Flow output or final asset has been verified in the shared workspace; record the user-designated location below as the source of truth. The hero remains static. Image sourcing is an explicit design step, not an optional placeholder.

**User-designated hero/background image location:** `S:\Hackathon\Signet\hero-image`. Treat this as the canonical location supplied by the user for the designated hero/background image, and do not replace it with the unapproved Arena-generated candidate. The path was supplied without a filename or extension and is not mounted in this workspace, so its contents and usage rights have not been verified here. Use the actual asset at this location when working in the user's environment, or ask for it to be uploaded/copied into the project workspace if access is needed.

**Meaning of hero image for Signet:** this is a full-bleed background field behind the site's HTML content, like an atmospheric background color. It is not a photo or illustration of an invoice, a product screenshot, a dashboard, or an app mockup. Put product-specific invoice content in the separate sample proof panel. Search for visual material, color, texture, shape, light, and copy-safe space. Avoid product nouns such as `invoice`, `app`, and `UI` in broad background searches because they tend to return templates and screen mockups. Searching `security` alone can return literal padlocks and fingerprints.

**Design and accessibility guardrails:** keep all copy and proof-panel content as HTML, not embedded in the image. Preserve contrast and negative space, and check desktop and mobile crops because a background may be cropped differently by viewport. These practical points are reflected in the [NICE Design System's full-bleed guidance](https://design-system.nice.org.uk/components/full-bleed/) and [Webflow's hero-image guide](https://webflow.com/blog/website-hero-image); treat them as design guidance, not a conversion guarantee.

1. **Search for background references first.** Start with this exact Pinterest query: `dark graphite teal abstract background wide negative space`. Then try `deep teal flowing bands abstract background landscape`, `subtle dark teal blueprint grid texture background wide`, `charcoal teal abstract texture copy space wide`, and `low-poly deep teal background landscape`. These search for a visual field, not a product object. On Google Images or stock libraries, add `16:9` and, where supported, exclude `-invoice -dashboard -UI -mockup -padlock -crypto`. Pinterest is a visual-discovery tool, not proof of ownership or a license. Use `blueprint document security` only to revisit the specific style of reference the user mentioned, and keep only results that are actually atmospheric backgrounds. Avoid leading with `invoice`, `app`, `UI`, or `security` alone: those searches tend to return templates, screenshots, padlocks, and fingerprints. If Pinterest results are weak, search reputable stock libraries and creator portfolios directly.
2. **Inspect and compare actual candidates.** Open candidate previews rather than judging search snippets. Record each candidate's preview, creator and canonical source page, dimensions, color fit, visual density, copy-safe composition, desktop crop, mobile crop, and rights status. Compare the full-bleed background suitability at the intended hero size, with an overlay and both the headline and proof panel placed over it. Reject baked-in text, logos, watermarks, fake company names, literal invoices, product or site screenshots, dashboards, generic business stock, crypto coins, and any image whose details make the copy or proof panel hard to read. Do not use a competitor's illustration or UI as the asset.
3. **Trace source and rights before acquisition.** Follow each promising pin or search result to the original creator or licensor. Confirm that the license allows use on a commercial website, the needed edits or crops, and any intended AI-assisted adaptation; note attribution, account, territory, term, or other restrictions. Save the canonical source URL, creator, license terms, date checked, and receipt or permission record alongside the original download. A pin, thumbnail, watermark, or search-engine cache is not a source of rights. If provenance or permission cannot be verified, keep it in the inspiration board only and do not download it for product use or feed it to an image model. For generated art, record the prompt, model, date, input references, and the platform terms that apply.
4. **Present a real comparison and get approval.** Show the user a small set of actual, sufficiently large candidates with source links, rights status, desktop and mobile crops, and a short comparison of palette, negative space, focal balance, quality, and likely crop. Distinguish a *visual-direction recommendation* from a licensed, final asset. Do not mark a candidate selected or integrate it until the user approves that image and its use rights are clear.
5. **Acquire or create the approved image.** For stock or commissioned art, download the original from the creator or licensor, not from the Pinterest pin. For a new original, get approval for the art direction before generating. If a reference image's terms do not allow adaptation or AI input, use only high-level visual notes to make an original prompt; do not upload or replicate the reference.

   Google Flow's current [image-creation help](https://support.google.com/flow/answer/16729550?hl=en) documents Image mode, reference images, aspect-ratio and output-count controls, and model selection. Use the model and controls actually available at the time; do not hard-code an old model name. For this hero, set a 16:9 output and request two distinct still variants when the interface allows. If using the Flow Agent, it can route to a model based on the request. Keep references rights-cleared and use them for broad material and color cues, not pixel-for-pixel copying.

**Original-art prompt template (only after the art direction is approved):**

```text
Create an original, static, full-bleed background field for a premium, evidence-focused financial product website. Treat the image like atmosphere behind the content, not a subject or illustration. Use a deep graphite base with restrained Signal Teal and a single subtle abstract treatment, such as gently flowing bands, faceted depth, or very fine blueprint-like linework. Keep the upper-left headline area and lower-right proof-panel area calm, dark, and low-detail; use any brighter accent away from both areas. Compose for a wide 16:9 hero and preserve safe areas under responsive cropping. Do not depict an invoice, paper, signature, pen, lock, coin, chart, person, app, UI, dashboard, browser, or product mockup. Do not include text, letters, numbers, logos, symbols, company names, or watermarks. If a reference is attached and its terms allow this use, treat it only as a broad palette or material cue; do not reproduce its specific composition or artwork. Keep the final result still, with no motion streaks or animation cues.
```

6. **Review and approve the final still.** Show actual, full-resolution candidates and the intended desktop and mobile crops, with source, rights status, and a short rationale. Wait for the user's explicit selection before calling an image final or integrating it. Keep the approved hero static unless the user separately approves motion.
7. **Export and prepare.** Preserve the acquired/generated original and its provenance record. Prepare a wide desktop crop and check a mobile crop; use separate crops only if one responsive crop cannot keep the overlay areas clear. Keep text and the tonal overlay in the layout, not baked into the image, and provide a matching background-color fallback. Export an appropriate web format such as WebP or AVIF, preserving the original separately. Aim for under 500 KB where quality allows, then verify the image at intended display sizes and avoid visible compression damage. Load the above-the-fold hero eagerly and prevent layout shift.

**Review of actual background-first previews, 15 November 2026:** these are search-result previews, not licensed or full-resolution source files. The saved previews below were opened and compared visually; none has a traced canonical source or verified use rights.

| Preview in `image-search/` | Visual comparison | Status |
| --- | --- | --- |
| `pinterest-dark-teal-abstract-technical-g-3.jpg` | Deep teal flowing bands on a dark field; the strongest visual-direction match for the approved palette and an atmospheric background. The 1000 x 1784 portrait preview creates substantial 16:9 crop/upscale risk, and safe areas need a proper landscape test. | Directional reference only. Do not use as the hero asset; source and rights unknown. |
| `pinterest-dark-teal-abstract-technical-g-1.jpg` | Dark teal faceted field and no literal product subject; palette fits, but the dense facets and 1200 x 1920 portrait framing may compete with copy and the proof panel after cropping. | Directional reference only. Do not use as the hero asset; source and rights unknown. |
| `pinterest-dark-graphite-holographic-secu-1.jpg` | Abstract flowing surface, but strong violet/cyan highlights and dense reflections are less aligned with the restrained palette and could compete with overlays; portrait framing. | Not shortlisted; source and rights unknown. |
| `pinterest-dark-blueprint-lines-backgroun-3.jpg` | Wide grid texture, but it visibly carries a Dreamstime watermark and copyright metadata. | Reject for use. Do not remove the watermark; only revisit through a verified, licensed source if appropriate. |
| `pinterest-dark-teal-abstract-technical-g-2.jpg` | Geometric background preview contains baked-in words. | Reject as an asset. |

The other previews in this batch were either high-contrast monochrome linework, visually noisy, off-palette, too small, or too prismatic for the approved hero. The flowing deep-teal treatment is the strongest *visual direction* in this search batch. The user's promising result from their own `blueprint document security` search has not been identified and may be a different item; do not assume it is among these files. This initial search batch did not produce a selected or rights-cleared asset. The later user-supplied preview review and selected image-to-image edit are documented below.

**Review of the user's attached previews, 15 November 2026:** the 20 supplied files were opened and compared. They are mood-board candidates, not acquired/licensed assets; source URLs and usage rights were not supplied. Most are portrait phone-wallpaper crops and several are only about 700 px wide, so even the strongest visual directions need a high-resolution landscape original or an original recreation before they could be considered for the desktop hero.

| Attachment | Visual assessment | Status |
| --- | --- | --- |
| `343610646591738040.jfif` (736 x 1593) | Best background direction in this batch: softly textured deep-teal folds and directional light, no literal subject, restrained enough to sit behind content. Test the bright diagonal against the upper-left copy and lower-right panel. | First visual direction to pursue, not a selected asset. Portrait preview; source and rights unknown. |
| `990017930596451026.jfif` and `990017930596451026 (1).jfif` (675 x 1200) | Stronger, more graphic flowing teal bands. The pair is an exact duplicate. Good palette and depth, but brighter curves may compete with the headline; portrait preview. | Second visual direction, not a selected asset. Source and rights unknown. |
| `14566398794009501.jfif` (736 x 507) | Minimal dark light-sweep with useful open space and a nearer-to-landscape crop. A bright point toward the right may sit too close to the proof panel; preview resolution is low. | Secondary reference only; source and rights unknown. |
| `605312006213663934.jfif` and `518406607108876344.jfif` | Wireframe terrain/grid imagery. It reads as a literal futuristic data landscape, and the mesh competes with the sample panel. | Not shortlisted. |
| Other attached previews | Iridescent oil-like surfaces are busier and more violet/blue; rough grain textures may distract; folders are a literal document-object treatment; the `777` image contains baked-in text; the black-hole/tunnel and monochrome images are off-direction. | Not shortlisted or rejected where they contain text or literal objects. |

**Recommendation from this batch:** pursue the softly lit deep-teal material/texture direction in `343610646591738040.jfif` first; keep the flowing-band image as the more expressive alternative. This is a recommendation about visual direction only. Neither file is cleared for use, and the recommended preview's portrait crop is not suitable as-is for a wide desktop hero. Do not animate or integrate an asset without separate approval. The static-hero direction remains in force.

**Approved background-image brief:** a full-bleed atmospheric field in deep graphite with restrained Signal Teal. Abstract flow, faceted depth, or fine blueprint-like linework may inform the texture, but do not make a literal invoice, signer, lock, coin, chart, product UI, or dashboard the subject. Keep the upper-left headline area and lower-right proof-panel area calm enough for readable overlays. No text, logos, watermarks, or invented brand marks inside the image. The sample proof panel, not the background, carries invoice-specific content.

For the quality bar, use Golden Reference 2, Light Glassmorphism Product Hero, for its product-first hierarchy and evidence layering only. Do not copy its glass surfaces or video background. The approved bento grid and static-image direction take precedence.

## 7. Approved public-page section order

1. **Hero:** static full-bleed image, concrete headline, sample proof panel, two actions.
2. **Pinned workflow:** GSAP sequence from invoice receipt through off-chain ML-DSA verification, payee/amount review, buyer approval, and on-chain digest/proof-hash anchor.
3. **Read-only walkthrough:** sample invoice, verification evidence, approval preview, and explorer reference. No real payment action.
4. **Plug-in architecture:** document, verifier, agent/model, wallet, token, and chain adapters. State that Aevum/tUSD8 is the current challenge target; future connectors are extension points, not shipped integrations.
5. **Security and evidence:** visual separation of off-chain checks and on-chain references, with an audit-trail treatment.
6. **Real-world scenarios:** an asymmetric bento layout for accounts-payable staff, suppliers, and agent operators. No fabricated testimonials or metrics.
7. **FAQ:** AI authority, ML-DSA boundary, data exposure, approval, testnet, and future integrations.
8. **Final demo CTA and footer:** direct, low-friction next step and source/document links.

Vary layout families across these sections. Do not repeat identical bento grids section after section. Do not add pricing until the business model is validated.

## 8. Motion and interaction

- GSAP pinned scroll is confined to the public workflow narrative and one read-only app walkthrough.
- The live invoice viewer, review controls, approval screen, wallet dialog, and transaction status never pin or hijack scrolling.
- Provide a non-pinned sequential fallback for small viewports, touch devices, low-performance devices, and `prefers-reduced-motion: reduce`.
- Pinned progress must also be available through visible labels and keyboard-operable controls. Do not make scroll position the only way to reveal information.
- Stop, reverse, or skip motion cleanly if the user navigates or interacts. Never block a wallet prompt or close action behind an animation.
- Use subtle local feedback for state changes. No autoplay sound, animated video background, or background particle system.

## 9. Workbench screens and states

### Primary screens

- Connect wallet and workspace context.
- Invoice queue with filters for state, due date, payee, amount, and verification result.
- Invoice detail with document preview and exact extracted fields.
- Verification panel showing algorithm, signer-key fingerprint, verifier version, result, and reason codes.
- Payee/amount/policy review.
- Approval summary and buyer wallet confirmation.
- Submitted, confirmed, failed, expired, and rejected states.
- Evidence view with document/verification references, chain ID, contract, transaction hash, block, and explorer link.
- Policy and signer-key settings for authorized users.

### Critical state rules

- `Verified off-chain` and `Anchored on-chain` are different states and must have different labels.
- A valid signature alone does not mean the payee or amount is approved.
- Never show `Paid` before a confirmed receipt and expected contract event.
- Any invalid signature, unknown/revoked key, duplicate, amount over limit, payee mismatch, expired request, or chain error blocks the transaction and explains what to do.
- Maintain the user's filters, route, scroll position, and in-progress review state when they navigate back.

## 10. Accessibility, privacy, and trust

- Keyboard-operable navigation, forms, accordions, tabs, dialogs, and pinned-story alternatives.
- Visible focus states; adequate contrast; semantic headings and landmarks; accessible error messages; no color-only status.
- Respect reduced motion and zoom. Do not crop critical invoice details on mobile.
- Redact invoice content and personal data from client and server logs.
- No raw invoice, signature bytes, bank details, email, or tax identifier on-chain.
- Explicitly label Aevum testnet and tUSD8 test-token status. A transaction preview must name chain, token, payee, amount, expiry, and the fact that the buyer is authorizing the transaction.
- No AI action can silently change the invoice, signer, payee, amount, token, or approval state.

## 11. Responsive behavior and acceptance checks

- Mobile-first layouts. Collapse bento grids to one column while preserving distinct priority and labels.
- Hero must keep headline, supporting copy, and primary CTA visible without an excessive scroll. Put the sample proof panel after the copy on narrow screens.
- Pinned sections become ordinary sequential content when height, pointer type, performance, or reduced-motion preference makes pinning unsuitable.
- Test at 320px, 375px, tablet, desktop, and a wide 1280x800 viewport.
- Test keyboard-only navigation, screen-reader labels, high zoom, reduced motion, slow network image fallback, and wallet disconnect/hydration states.
- Confirm that the sample panel and all documentation consistently say off-chain verification and on-chain hash reference, never native EVM ML-DSA verification.
