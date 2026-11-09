'use client';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Lock } from 'lucide-react';
import { doctorApi } from '@/lib/api/services';
import { ApiError } from '@/lib/api/client';
import type { ShareCategory } from '@/lib/api/types';
import { EmptyState, ErrorState, LoadingBlock } from '@/components/ui';
import { CATEGORY_INFO } from '@/lib/share';
import { fmtDate, fmtDateTime, titleCase } from '@/lib/utils';

export type Rows = Record<string, unknown>[];

/** Reads one shared category. A 403 means the patient has not granted it (or it expired): that is shown as a state, not an error. */
export function usePatientData(pid: string, category: ShareCategory) {
  // Only request categories the patient currently grants, so we don't create needless "denied" rows in their audit trail.
  const pts = useQuery({ queryKey: ['doctor', 'patients'], queryFn: doctorApi.patients });
  const enabled = !!pts.data
    ?.find((p) => p.patient_id === pid)
    ?.active_permissions.some((x) => x.category === category);
  const q = useQuery({
    queryKey: ['doctor', 'patient', pid, category],
    queryFn: async () => {
      try {
        const r = await doctorApi.patientData(pid, category);
        return {
          allowed: true as const,
          data: ((r as { data?: Record<string, Rows> }).data ?? {}) as Record<string, Rows>,
        };
      } catch (e) {
        if (e instanceof ApiError && e.status === 403)
          return { allowed: false as const, data: {} as Record<string, Rows> };
        throw e;
      }
    },
    enabled,
  });
  return {
    ...q,
    isLoading: q.isLoading || pts.isLoading,
    error: q.error ?? pts.error,
    refetch: () => (pts.error ? pts.refetch() : q.refetch()),
  };
}

export function CategoryGate({
  q,
  category,
  children,
}: {
  q: ReturnType<typeof usePatientData>;
  category: ShareCategory;
  children: (d: Record<string, Rows>) => React.ReactNode;
}) {
  if (q.isLoading) return <LoadingBlock rows={3} />;
  if (q.error) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  if (!q.data?.allowed)
    return (
      <EmptyState
        icon={<Lock className="h-5 w-5" />}
        title={`${CATEGORY_INFO[category].label} not shared`}
        body="The patient hasn’t granted this category, or access has expired. Only the patient can change this."
      />
    );
  return <>{children(q.data.data)}</>;
}

const HIDE = new Set([
  'id',
  'answers',
  'category_scores',
  'responses',
  'baseline_data',
  'result_data',
  'limitations',
]);
const fmtCell = (k: string, v: unknown): string => {
  if (v == null || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) return fmtDateTime(v);
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) return fmtDate(v);
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if (k === 'result' && 'total_score' in o)
      return `${o.total_score}/${o.max_score} · ${o.severity}`;
    if ('text' in o) return String(o.text).slice(0, 160);
    return JSON.stringify(v).slice(0, 120);
  }
  return String(v);
};

/** Generic, read-only table for any shared array. */
export function DataTable({ rows, empty = 'No entries' }: { rows: Rows; empty?: string }) {
  if (!rows?.length) return <p className="text-sm text-stone">{empty}</p>;
  const cols = Array.from(new Set(rows.flatMap((r) => Object.keys(r)))).filter((k) => !HIDE.has(k));
  return (
    <div className="overflow-x-auto rounded-xl border border-bronze">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="bg-graphite-deep text-xs text-stone">
          <tr>
            {cols.map((c) => (
              <th key={c} className="whitespace-nowrap px-3 py-2 font-medium">
                {titleCase(c)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-divider">
          {rows.map((r, i) => (
            <tr key={String(r.id ?? i)}>
              {cols.map((c) => (
                <td key={c} className="max-w-[280px] px-3 py-2 align-top text-ivory">
                  {fmtCell(c, r[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
