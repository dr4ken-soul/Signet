'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const SECTIONS = [
  { id: 'product', label: 'Product' },
  { id: 'how-it-works', label: 'How it works' },
  { id: 'security', label: 'Security' },
  { id: 'faq', label: 'FAQ' },
];

export function PublicNav() {
  const [active, setActive] = useState<string>('');
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: '-40% 0px -55% 0px' },
    );
    for (const s of SECTIONS) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-normal ${
        scrolled ? 'border-border-default bg-bg-primary/95' : 'border-transparent bg-transparent'
      }`}
    >
      <nav aria-label="Public site" className="mx-auto flex h-16 max-w-page items-center justify-between px-6">
        <Link href="/" className="font-display text-lg font-bold tracking-tight text-ink-primary">
          Signet
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="nav-link text-sm" data-active={active === s.id}>
              {s.label}
            </a>
          ))}
          <Link href="/workbench" className="btn-primary !py-2 !px-4 text-sm">
            Review a sample invoice
          </Link>
        </div>

        <div className="md:hidden">
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded border border-border-default px-3 py-2 text-xs font-semibold text-ink-primary"
          >
            {menuOpen ? 'Close' : 'Menu'}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div id="mobile-menu" className="border-t border-border-default bg-bg-primary px-6 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                onClick={() => setMenuOpen(false)}
                className="nav-link text-sm"
                data-active={active === s.id}
              >
                {s.label}
              </a>
            ))}
            <Link href="/workbench" onClick={() => setMenuOpen(false)} className="btn-primary text-sm">
              Review a sample invoice
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
