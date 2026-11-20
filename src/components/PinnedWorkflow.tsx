'use client';

import { useEffect, useRef } from 'react';

type Step = {
  number: string;
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    number: '01',
    title: 'Invoice received',
    body: 'The signed invoice enters private storage. Its exact bytes are hashed with SHA3-256; nothing personal or commercial is published at this point.',
  },
  {
    number: '02',
    title: 'Signature verified off-chain',
    body: 'A deterministic FIPS 204 verifier checks the supplier ML-DSA-65 signature. The agent reports the result; it never decides it.',
  },
  {
    number: '03',
    title: 'Fields and policy checked',
    body: 'Extraction surfaces payee, amount, and due date with confidence scores. Policy rules block duplicates, over-limit amounts, unknown payees, and revoked keys.',
  },
  {
    number: '04',
    title: 'Buyer approves',
    body: 'A human reviews the evidence and explicitly approves. The approval intent binds payee, token, amount, nonce, and expiry. The agent has no wallet key.',
  },
  {
    number: '05',
    title: 'Payment and anchor',
    body: 'The buyer signs one transaction that transfers tUSD8 and emits the document digest with the verification-record hash on Aevum.',
  },
  {
    number: '06',
    title: 'Anchored on-chain',
    body: 'After the receipt and expected event are confirmed, the invoice shows anchored on-chain with an explorer link to the digest reference.',
  },
];

export function PinnedWorkflow() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const small = window.matchMedia('(max-width: 767px)').matches;
    if (reduce || small) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);
      if (cancelled || !containerRef.current) return;
      gsap.registerPlugin(ScrollTrigger);

      const ctx = gsap.context(() => {
        stepsRef.current.forEach((el) => {
          if (!el) return;
          gsap.fromTo(
            el,
            { opacity: 0.25, y: 40 },
            {
              opacity: 1,
              y: 0,
              duration: 0.55,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: el,
                start: 'top 75%',
                toggleActions: 'play none none reverse',
              },
            },
          );
        });
      }, containerRef.current);
      ScrollTrigger.refresh();
      cleanup = () => ctx.revert();
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return (
    <div ref={containerRef} className="mx-auto max-w-page px-6">
      <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
        {STEPS.map((step, i) => (
          <div
            key={step.number}
            ref={(el) => {
              stepsRef.current[i] = el;
            }}
            className="bento-cell bento-noise p-6"
          >
            <span className="mono-data text-accent">{step.number}</span>
            <h3 className="mt-3 font-display text-lg font-semibold text-ink-primary">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-secondary">{step.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
