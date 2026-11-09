'use client';
import { useParams } from 'next/navigation';
import { Badge, Card, CardHeader, EmptyState } from '@/components/ui';
import { TrendChart } from '@/components/charts';
import { CategoryGate, usePatientData } from '@/components/features/doctor';
import { fmtDateTime, fmtDate } from '@/lib/utils';

interface AR {
  id: string;
  assessment_type: string;
  completed_at: string;
  result: {
    total_score: number;
    max_score: number;
    severity: string;
    safety_flag?: boolean;
    instrument_version?: string;
  };
}

export default function PatientAssessments() {
  const { id } = useParams<{ id: string }>();
  const q = usePatientData(id, 'assessments');
  return (
    <Card>
      <CardHeader
        title="Validated screener results"
        subtitle="Scored by NEURIX with published rules. Screening results, not diagnoses."
      />
      <CategoryGate q={q} category="assessments">
        {(d) => {
          const rows = (d.assessment_results ?? []) as unknown as AR[];
          if (!rows.length) return <EmptyState title="No results shared" />;
          const types = Array.from(new Set(rows.map((r) => r.assessment_type)));
          return (
            <div className="space-y-6">
              {types.map((t) => {
                const list = rows
                  .filter((r) => r.assessment_type === t)
                  .sort((a, b) => a.completed_at.localeCompare(b.completed_at));
                return (
                  <section key={t}>
                    <h3 className="mb-2 font-semibold">{t.toUpperCase()}</h3>
                    {list.length >= 2 && (
                      <TrendChart
                        data={list.map((r) => ({
                          date: fmtDate(r.completed_at, {
                            day: 'numeric',
                            month: 'short',
                            year: '2-digit',
                          }),
                          score: r.result.total_score,
                        }))}
                        x="date"
                        series={[{ key: 'score', label: `${t.toUpperCase()} score` }]}
                        yDomain={[0, list[0].result.max_score]}
                        height={180}
                      />
                    )}
                    <ul className="mt-3 divide-y divide-divider rounded-xl border border-bronze">
                      {[...list].reverse().map((r) => (
                        <li
                          key={r.id}
                          className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-sm"
                        >
                          <span className="w-40 text-xs text-stone">
                            {fmtDateTime(r.completed_at)}
                          </span>
                          <span className="font-medium tabular-nums text-ivory">
                            {r.result.total_score}/{r.result.max_score}
                          </span>
                          <span className="text-stone">{r.result.severity}</span>
                          {r.result.safety_flag && (
                            <Badge tone="rose">Item 9 endorsed — follow up</Badge>
                          )}
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          );
        }}
      </CategoryGate>
    </Card>
  );
}
