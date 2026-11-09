'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Search } from 'lucide-react';
import { doctorApi } from '@/lib/api/services';
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Input,
  LoadingBlock,
  PageHeader,
} from '@/components/ui';
import { CATEGORY_INFO } from '@/lib/share';
import { fmtDate } from '@/lib/utils';

export default function DoctorPatients() {
  const q = useQuery({ queryKey: ['doctor', 'patients'], queryFn: doctorApi.patients });
  const [s, setS] = useState('');
  const list = (q.data ?? []).filter(
    (p) =>
      p.status === 'approved' &&
      (!s || (p.patient_name ?? '').toLowerCase().includes(s.toLowerCase()))
  );
  return (
    <>
      <PageHeader
        eyebrow="Doctor portal"
        title="Patients"
        subtitle="Only patients who connected with you and accepted are listed. Shared categories are set by each patient."
      />
      <div className="relative mb-5 max-w-sm">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" />
        <Input
          className="pl-10"
          placeholder="Search by name"
          value={s}
          onChange={(e) => setS(e.target.value)}
          aria-label="Search patients"
        />
      </div>
      {q.isLoading ? (
        <LoadingBlock rows={4} />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !list.length ? (
        <EmptyState title={s ? 'No patients match' : 'No connected patients'} />
      ) : (
        <Card className="p-0 sm:p-0">
          <ul className="divide-y divide-divider">
            {list.map((p) => (
              <li key={p.link_id}>
                <Link
                  href={`/doctor/patients/${p.patient_id}/overview`}
                  className="flex flex-col gap-2 px-5 py-4 hover:bg-white/[0.03] sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ivory">{p.patient_name ?? 'Patient'}</p>
                    <p className="text-xs text-stone">Connected {fmtDate(p.approved_at)}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {p.active_permissions.length ? (
                      p.active_permissions.map((x) => (
                        <Badge key={x.category} tone="gold">
                          {CATEGORY_INFO[x.category]?.label ?? x.category}
                        </Badge>
                      ))
                    ) : (
                      <Badge>Nothing shared</Badge>
                    )}
                  </div>
                  <ChevronRight className="hidden h-4 w-4 text-stone sm:block" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
