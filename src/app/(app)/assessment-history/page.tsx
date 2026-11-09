'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/auth';
import { assessmentApi } from '@/lib/api/services';
import { MODULES } from '@/lib/assessments/engine';
import { VALIDATED, type ValidatedCode } from '@/lib/assessments/validated';
import { localAttempts, type LocalAttempt } from '@/lib/assessments/storage';
import {
  Badge,
  ButtonLink,
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  LoadingBlock,
  PageHeader,
  Select,
} from '@/components/ui';
import { RadarProfile, TrendChart } from '@/components/charts';
import { fmtDate, fmtDateTime } from '@/lib/utils';

interface Row {
  key: string;
  id: string;
  module: string;
  title: string;
  when: string;
  score: string;
  band: string;
  kind: 'validated' | 'exploratory';
  href: string;
  value: number | null;
  max: number;
}

export default function AssessmentHistory() {
  const { profile } = useAuth();
  const server = useQuery({
    queryKey: ['assessments', 'list'],
    queryFn: () => assessmentApi.list(),
  });
  const [local, setLocal] = useState<LocalAttempt[]>([]);
  useEffect(() => setLocal(localAttempts.list(profile!.id)), [profile]);
  const [filter, setFilter] = useState('');

  const rows: Row[] = useMemo(
    () =>
      [
        ...(server.data?.items ?? []).map((r) => ({
          key: `s${r.id}`,
          id: r.id,
          module: r.assessment_type,
          title:
            VALIDATED[r.assessment_type as ValidatedCode]?.title ?? r.assessment_type.toUpperCase(),
          when: r.completed_at,
          score: `${r.result.total_score}/${r.result.max_score}`,
          band: r.result.severity,
          kind: 'validated' as const,
          href: `/assessments/${r.assessment_type}/results/${r.id}`,
          value: r.result.total_score,
          max: r.result.max_score,
        })),
        ...local.map((a) => ({
          key: `l${a.id}`,
          id: a.id,
          module: a.module,
          title: MODULES.find((m) => m.id === a.module)?.title ?? a.module,
          when: a.completed_at,
          score: a.result.overall != null ? `${a.result.overall}/100` : '—',
          band: `${a.length} questions`,
          kind: 'exploratory' as const,
          href: `/assessments/${a.module}/results/${a.id}`,
          value: a.result.overall,
          max: 100,
        })),
      ].sort((a, b) => b.when.localeCompare(a.when)),
    [server.data, local]
  );

  const shown = rows.filter((r) => !filter || r.module === filter);
  const options = [
    ...(Object.keys(VALIDATED) as ValidatedCode[]).map((c) => ({
      value: c,
      label: VALIDATED[c].title,
    })),
    ...MODULES.map((m) => ({ value: m.id, label: m.title })),
  ];
  const trend = [...shown].reverse().map((r) => ({
    date: fmtDate(r.when, { day: 'numeric', month: 'short', year: '2-digit' }),
    score: r.value,
  }));
  const exploratoryAttempts = local.filter((a) => a.module === filter);
  const [pair, setPair] = useState<[string, string]>(['', '']);
  useEffect(
    () => setPair([exploratoryAttempts[0]?.id ?? '', exploratoryAttempts[1]?.id ?? '']),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when the module filter or attempt count changes
    [filter, local.length]
  );
  const A = exploratoryAttempts.find((x) => x.id === pair[0]);
  const B = exploratoryAttempts.find((x) => x.id === pair[1]);

  return (
    <>
      <PageHeader
        eyebrow="My Health"
        title="Assessment history"
        subtitle="Every attempt is kept as it was submitted. Compare how things change over time."
        actions={<ButtonLink href="/assessments">Take an assessment</ButtonLink>}
      />
      <div className="mb-5 max-w-xs">
        <Select
          aria-label="Filter by assessment"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="All assessments"
          options={options}
        />
      </div>
      {server.error && (
        <div className="mb-4">
          <ErrorState
            error={server.error}
            onRetry={() => server.refetch()}
            title="Couldn’t load server results"
          />
        </div>
      )}

      {filter && trend.length >= 2 && (
        <Card className="mb-5">
          <TrendChart
            data={trend}
            x="date"
            title={`${options.find((o) => o.value === filter)?.label} over time`}
            desc={`${trend.length} attempts${VALIDATED[filter as ValidatedCode] ? (VALIDATED[filter as ValidatedCode].higherIsBetter ? ' · higher is better' : ' · lower means fewer symptoms') : ' · overall 0–100'}`}
            series={[{ key: 'score', label: 'Score' }]}
            yDomain={[0, shown[0]?.max ?? 100]}
          />
        </Card>
      )}

      {filter && exploratoryAttempts.length >= 2 && (
        <Card className="mb-5">
          <CardHeader title="Compare two attempts" subtitle="Domain scores side by side" />
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            {[0, 1].map((i) => (
              <Select
                key={i}
                aria-label={`Attempt ${i + 1}`}
                value={pair[i]}
                onChange={(e) =>
                  setPair(i === 0 ? [e.target.value, pair[1]] : [pair[0], e.target.value])
                }
                options={exploratoryAttempts.map((a) => ({
                  value: a.id,
                  label: `${fmtDateTime(a.completed_at)} · ${a.result.overall ?? '—'}/100`,
                }))}
              />
            ))}
          </div>
          {A && B && (
            <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
              <RadarProfile
                data={A.result.domains.map((d) => ({
                  domain: d.label,
                  a: d.score ?? 0,
                  b: B.result.domains.find((x) => x.id === d.id)?.score ?? 0,
                }))}
                axis="domain"
                series={[
                  { key: 'a', label: fmtDate(A.completed_at) },
                  { key: 'b', label: fmtDate(B.completed_at) },
                ]}
              />
              <ul className="space-y-2 self-center text-sm">
                {A.result.domains.map((d) => {
                  const other = B.result.domains.find((x) => x.id === d.id)?.score;
                  const diff = d.score != null && other != null ? d.score - other : null;
                  return (
                    <li
                      key={d.id}
                      className="flex justify-between gap-3 rounded-lg border border-bronze bg-graphite-deep px-3 py-2"
                    >
                      <span className="text-stone">{d.label}</span>
                      <span className="tabular-nums text-ivory">
                        {d.score ?? '—'} vs {other ?? '—'}
                        {diff !== null && (
                          <span className="ml-2 text-stone">
                            ({diff > 0 ? '+' : ''}
                            {diff})
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
                {A.version !== B.version && (
                  <li className="text-xs text-rose">
                    These attempts used different module versions, so scores may not be directly
                    comparable.
                  </li>
                )}
              </ul>
            </div>
          )}
        </Card>
      )}

      {server.isLoading ? (
        <LoadingBlock rows={4} />
      ) : !shown.length ? (
        <EmptyState
          title="No attempts yet"
          body="Completed assessments will be listed here."
          action={<ButtonLink href="/assessments">Assessment Centre</ButtonLink>}
        />
      ) : (
        <Card className="p-0 sm:p-0">
          <ul className="divide-y divide-divider">
            {shown.map((r) => (
              <li key={r.key}>
                <Link
                  href={r.href}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.03]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-ivory">{r.title}</p>
                      <Badge tone={r.kind === 'validated' ? 'sage' : 'blue'}>
                        {r.kind === 'validated' ? 'Validated' : 'Exploratory · this device'}
                      </Badge>
                    </div>
                    <p className="text-xs text-stone">
                      {fmtDateTime(r.when)} · {r.band}
                    </p>
                  </div>
                  <span className="font-semibold tabular-nums text-ivory">{r.score}</span>
                  <ChevronRight className="h-4 w-4 text-stone" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
