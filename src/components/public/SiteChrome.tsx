'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { Logo } from '@/components/brand';
import { ButtonLink } from '@/components/ui';
import { useAuth } from '@/context/auth';

const LINKS = [
  { href: '/#about', label: 'About' },
  { href: '/#soul', label: 'SOUL' },
  { href: '/#assessments', label: 'Assessments' },
  { href: '/#sharing', label: 'Doctor sharing' },
  { href: '/#privacy', label: 'Privacy' },
  { href: '/#faq', label: 'FAQ' },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { session, profile } = useAuth();
  const appHref = profile?.doctor?.verification_status === 'verified' ? '/doctor/dashboard' : '/dashboard';
  return (
    <header className="sticky top-0 z-40 border-b border-bronze/70 bg-obsidian/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Site" className="hidden flex-1 items-center gap-6 md:flex">
          {LINKS.map((l) => <Link key={l.href} href={l.href} className="text-sm text-stone transition-colors hover:text-ivory">{l.label}</Link>)}
        </nav>
        <div className="ml-auto hidden items-center gap-2 md:flex">
          {session ? <ButtonLink href={appHref} size="sm">Open NEURIX</ButtonLink> : (
            <>
              <ButtonLink href="/login" variant="ghost" size="sm">Sign in</ButtonLink>
              <ButtonLink href="/signup" size="sm">Create account</ButtonLink>
            </>
          )}
        </div>
        <button className="ml-auto rounded-lg p-2 text-stone md:hidden" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? 'Close menu' : 'Open menu'}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-bronze px-4 pb-5 pt-3 md:hidden">
          <nav aria-label="Site mobile" className="flex flex-col">
            {LINKS.map((l) => <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="py-2.5 text-sm text-stone hover:text-ivory">{l.label}</Link>)}
          </nav>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {session ? <ButtonLink href={appHref} className="col-span-2">Open NEURIX</ButtonLink> : (
              <>
                <ButtonLink href="/login" variant="secondary">Sign in</ButtonLink>
                <ButtonLink href="/signup">Create account</ButtonLink>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-bronze bg-[#0d0d0d]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-stone">A private space to notice patterns in how you feel, keep your health records together, and share only what you choose.</p>
        </div>
        <FooterCol title="Product" links={[['/#soul', 'SOUL companion'], ['/#records', 'Health records'], ['/#assessments', 'Assessments'], ['/#insights', 'Insights']]} />
        <FooterCol title="Account" links={[['/login', 'Sign in'], ['/signup', 'Create account'], ['/doctor/login', 'For clinicians']]} />
        <FooterCol title="Legal" links={[['/privacy', 'Privacy'], ['/terms', 'Terms of use']]} />
      </div>
      <div className="border-t border-bronze/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-stone sm:flex-row sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} NEURIX. Not a medical device. Not a substitute for professional care.</p>
          <p>In an emergency, call your local emergency number.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="label-eyebrow mb-3">{title}</p>
      <ul className="space-y-2">{links.map(([h, l]) => <li key={h}><Link href={h} className="text-sm text-stone hover:text-ivory">{l}</Link></li>)}</ul>
    </div>
  );
}

export function PublicPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main" className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
