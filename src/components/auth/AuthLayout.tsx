import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/brand';

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  badge,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  badge?: string;
}) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_40%_at_50%_0%,rgba(214,180,106,0.09),transparent_70%)]"
        aria-hidden
      />
      <header className="relative mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo sub={badge} />
        <Link href="/" className="text-sm text-stone hover:text-ivory">
          Back to site
        </Link>
      </header>
      <main
        id="main"
        className="relative flex flex-1 items-start justify-center px-4 pb-16 pt-6 sm:items-center sm:pt-0"
      >
        <div className="w-full max-w-md animate-fade-up">
          <div className="surface p-6 sm:p-8">
            <h1 className="text-2xl font-semibold">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm text-stone">{subtitle}</p>}
            <div className="mt-6">{children}</div>
          </div>
          {footer && <div className="mt-5 text-center text-sm text-stone">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
