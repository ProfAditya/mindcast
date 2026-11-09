'use client';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { doctorApi } from '@/lib/api/services';
import { ButtonLink, EmptyState, ErrorState, LoadingBlock, PageHeader } from '@/components/ui';
import { cn, fmtDate } from '@/lib/utils';

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const path = usePathname();
  const q = useQuery({ queryKey: ['doctor', 'patients'], queryFn: doctorApi.patients });
  if (q.isLoading) return <LoadingBlock rows={5} />;
  if (q.error) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  const p = q.data?.find((x) => x.patient_id === id && x.status === 'approved');
  if (!p)
    return (
      <EmptyState
        title="Patient not available"
        body="This patient isn’t connected with you, or the connection has ended."
        action={<ButtonLink href="/doctor/patients">Back to patients</ButtonLink>}
      />
    );
  const tabs = [
    ['overview', 'Overview'],
    ['trends', 'Trends'],
    ['assessments', 'Assessments'],
    ['documents', 'Records & documents'],
  ];
  return (
    <>
      <Link
        href="/doctor/patients"
        className="mb-3 inline-flex items-center gap-1 text-xs text-stone hover:text-ivory"
      >
        <ArrowLeft className="h-3 w-3" />
        All patients
      </Link>
      <PageHeader
        eyebrow="Patient"
        title={p.patient_name ?? 'Patient'}
        subtitle={`Connected since ${fmtDate(p.approved_at)} · ${p.active_permissions.length} categories shared. Your views are logged in the patient’s audit trail.`}
      />
      <nav
        aria-label="Patient sections"
        className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-bronze bg-graphite-deep p-1"
      >
        {tabs.map(([k, l]) => {
          const href = `/doctor/patients/${id}/${k}`;
          return (
            <Link
              key={k}
              href={href}
              aria-current={path === href ? 'page' : undefined}
              className={cn(
                'whitespace-nowrap rounded-lg px-3.5 py-2 text-sm',
                path === href
                  ? 'bg-graphite text-gold-pale shadow-card'
                  : 'text-stone hover:text-ivory'
              )}
            >
              {l}
            </Link>
          );
        })}
      </nav>
      {children}
    </>
  );
}
