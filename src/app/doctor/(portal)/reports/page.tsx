'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Printer } from 'lucide-react';
import { doctorApi } from '@/lib/api/services';
import type { DoctorPatient, ShareCategory } from '@/lib/api/types';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingBlock,
  Notice,
  PageHeader,
  Select,
} from '@/components/ui';
import { DataTable, usePatientData, type Rows } from '@/components/features/doctor';
import { CATEGORY_INFO } from '@/lib/share';
import { avg, fmtDate, fmtDateTime, round1 } from '@/lib/utils';

export default function DoctorReports() {
  const q = useQuery({ queryKey: ['doctor', 'patients'], queryFn: doctorApi.patients });
  const [pid, setPid] = useState('');
  const list = (q.data ?? []).filter((p) => p.status === 'approved');
  const p = list.find((x) => x.patient_id === pid);
  return (
    <>
      <PageHeader
        eyebrow="Doctor portal"
        title="Reports"
        subtitle="A printable summary of what a patient currently shares with you."
        actions={
          p && (
            <Button
              variant="secondary"
              icon={<Printer className="h-4 w-4" />}
              onClick={() => window.print()}
            >
              Print
            </Button>
          )
        }
      />
      {q.isLoading ? (
        <LoadingBlock />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !list.length ? (
        <EmptyState title="No connected patients" />
      ) : (
        <>
          <div className="mb-5 max-w-sm print:hidden">
            <Select
              aria-label="Patient"
              value={pid}
              onChange={(e) => setPid(e.target.value)}
              placeholder="Choose a patient"
              options={list.map((x) => ({
                value: x.patient_id,
                label: x.patient_name ?? 'Patient',
              }))}
            />
          </div>
          {p ? <Report p={p} /> : <EmptyState title="Choose a patient to build a report" />}
        </>
      )}
    </>
  );
}

function Report({ p }: { p: DoctorPatient }) {
  return (
    <Card className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{p.patient_name ?? 'Patient'} — summary</h2>
        <p className="text-xs text-stone">
          Generated {fmtDateTime(new Date().toISOString())} · connected since{' '}
          {fmtDate(p.approved_at)}
        </p>
      </div>
      <Notice tone="gold">
        All values are self-reported by the patient in NEURIX, except validated screener scores,
        which NEURIX calculates with published scoring rules. Not a clinical record.
      </Notice>
      {!p.active_permissions.length ? (
        <p className="text-sm text-stone">This patient isn’t sharing any categories.</p>
      ) : (
        p.active_permissions.map((perm) => (
          <Section
            key={perm.category}
            pid={p.patient_id}
            cat={perm.category}
            expires={perm.expires_at}
          />
        ))
      )}
    </Card>
  );
}

function Section({
  pid,
  cat,
  expires,
}: {
  pid: string;
  cat: ShareCategory;
  expires: string | null;
}) {
  const q = usePatientData(pid, cat);
  const data = q.data?.allowed ? q.data.data : null;
  const mean = (rows: Rows, k: string) => {
    const xs = rows
      .map((r) => r[k])
      .filter((v) => v != null)
      .map(Number);
    return xs.length ? round1(avg(xs)) : '—';
  };
  return (
    <section className="break-inside-avoid">
      <h3 className="mb-1 font-semibold">{CATEGORY_INFO[cat].label}</h3>
      <p className="mb-3 text-xs text-stone">
        {expires ? `Shared until ${fmtDate(expires)}` : 'Shared, no expiry'}
      </p>
      {q.isLoading ? (
        <LoadingBlock rows={2} />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !data ? (
        <p className="text-sm text-stone">Not available.</p>
      ) : (
        <div className="space-y-3">
          {Object.entries(data).map(([k, rows]) => (
            <div key={k}>
              <p className="mb-1.5 text-sm text-stone">
                {k.replace(/_/g, ' ')} · {rows.length} item{rows.length === 1 ? '' : 's'}
                {k === 'mood_entries' && rows.length
                  ? ` · avg mood ${mean(rows, 'mood_score')}, stress ${mean(rows, 'stress_score')}, anxiety ${mean(rows, 'anxiety_score')}`
                  : ''}
                {k === 'sleep_logs' && rows.length
                  ? ` · avg sleep ${mean(rows, 'sleep_hours')} h`
                  : ''}
              </p>
              <DataTable rows={rows.slice(0, 15)} />
              {rows.length > 15 && (
                <p className="mt-1 text-xs text-stone">Showing the 15 most recent.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
