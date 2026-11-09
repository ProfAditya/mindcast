import Link from 'next/link';
import { cn } from '@/lib/utils';

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('h-8 w-8', className)} aria-hidden>
      <rect x="1" y="1" width="30" height="30" rx="9" fill="#181818" stroke="#514A3C" />
      <path
        d="M9 22V10l7 8 7-8v12"
        fill="none"
        stroke="#D6B46A"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="18" r="1.6" fill="#E8D9B5" />
    </svg>
  );
}

export function Logo({
  href = '/',
  className,
  sub,
}: {
  href?: string;
  className?: string;
  sub?: string;
}) {
  return (
    <Link
      href={href}
      className={cn('flex items-center gap-2.5', className)}
      aria-label="NEURIX home"
    >
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className="text-[15px] font-bold tracking-[0.18em] text-ivory">NEURIX</span>
        {sub && (
          <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.16em] text-gold">
            {sub}
          </span>
        )}
      </span>
    </Link>
  );
}
