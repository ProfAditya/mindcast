'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PageHeader } from '@/components/ui';
import { cn } from '@/lib/utils';

const TABS = [
  ['/medical-records', 'Records'],
  ['/medical-records/history', 'All history'],
  ['/medical-records/conditions', 'Conditions'],
  ['/medical-records/medications', 'Medications'],
  ['/medical-records/allergies', 'Allergies'],
  ['/medical-records/surgeries', 'Surgeries'],
  ['/medical-records/documents', 'Documents'],
] as const;

export default function MedicalLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <>
      <PageHeader
        eyebrow="My Health"
        title="Medical records"
        subtitle="Your health information in one private place. Nothing here is visible to anyone else unless you grant a connected doctor access."
      />
      <nav
        aria-label="Medical records sections"
        className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-bronze bg-graphite-deep p-1"
      >
        {TABS.map(([href, label]) => (
          <Link
            key={href}
            href={href}
            aria-current={path === href ? 'page' : undefined}
            className={cn(
              'whitespace-nowrap rounded-lg px-3.5 py-2 text-sm transition-colors',
              path === href
                ? 'bg-graphite text-gold-pale shadow-card'
                : 'text-stone hover:text-ivory'
            )}
          >
            {label}
          </Link>
        ))}
      </nav>
      {children}
    </>
  );
}
