'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQueries } from '@tanstack/react-query';
import {
  Activity,
  BookOpen,
  ClipboardList,
  FileHeart,
  HeartPulse,
  Smile,
  type LucideIcon,
} from 'lucide-react';
import {
  assessmentApi,
  historyApi,
  journalApi,
  moodApi,
  recordsApi,
  wellbeingApi,
} from '@/lib/api/services';
import { Card, EmptyState, ErrorState, LoadingBlock, PageHeader, Select } from '@/components/ui';
import { daysAgo, fmtDate, localISODate, round1, titleCase } from '@/lib/utils';

type Kind = 'mood' | 'journal' | 'record' | 'history' | 'assessment' | 'wellbeing';
interface Item {
  kind: Kind;
  at: string;
  title: string;
  detail?: string;
  href: string;
}
const META: Record<Kind, { label: string; icon: LucideIcon }> = {
  mood: { label: 'Mood', icon: Smile },
  journal: { label: 'Journal', icon: BookOpen },
  record: { label: 'Medical record', icon: FileHeart },
  history: { label: 'Health history', icon: HeartPulse },
  assessment: { label: 'Assessment', icon: ClipboardList },
  wellbeing: { label: 'Daily log', icon: Activity },
};

export default function TimelinePage() {
  const [days, setDays] = useState('30');
  const [kind, setKind] = useState('');
  const since = daysAgo(Number(days) - 1);
  const qs = useQueries({
    queries: [
      { queryKey: ['mood', 'since', Number(days)], queryFn: () => moodApi.list({ since }) },
      { queryKey: ['journal', 'since', days], queryFn: () => journalApi.list({ since }) },
      { queryKey: ['records', ''], queryFn: () => recordsApi.list() },
      { queryKey: ['history', 'all'], queryFn: () => historyApi.list() },
      { queryKey: ['assessments', 'list'], queryFn: () => assessmentApi.list() },
      {
        queryKey: ['wellbeing', 'trend', Number(days)],
        queryFn: () => wellbeingApi.list({ since, limit: 200 }),
      },
    ],
  });
  const [mood, journal, records, history, assess, wb] = qs;
  const items = useMemo(() => {
    const out: Item[] = [];
    for (const m of mood.data?.items ?? [])
      out.push({
        kind: 'mood',
        at: m.recorded_at,
        title: m.mood_label ? titleCase(m.mood_label) : 'Check-in',
        detail: m.mood_score != null ? `Mood ${m.mood_score}/10` : undefined,
        href: '/wellbeing',
      });
    for (const j of journal.data?.items ?? [])
      out.push({
        kind: 'journal',
        at: j.created_at,
        title: j.title || 'Journal entry',
        detail: 'Private',
        href: '/journal',
      });
    for (const r of records.data?.items ?? [])
      out.push({
        kind: 'record',
        at: r.record_date ? `${r.record_date}T12:00:00` : r.created_at,
        title: r.title,
        detail: titleCase(r.record_type),
        href: '/medical-records',
      });
    for (const h of history.data?.items ?? [])
      out.push({
        kind: 'history',
        at: h.onset_date ? `${h.onset_date}T12:00:00` : h.created_at,
        title: h.name,
        detail: `${titleCase(h.entry_type)} · ${h.status}`,
        href: '/medical-records/history',
      });
    for (const a of assess.data?.items ?? [])
      out.push({
        kind: 'assessment',
        at: a.completed_at,
        title: a.assessment_type.toUpperCase(),
        detail: `${a.result.total_score}/${a.result.max_score} · ${a.result.severity}`,
        href: `/assessments/${a.assessment_type}/results/${a.id}`,
      });
    for (const l of wb.data?.items ?? [])
      out.push({
        kind: 'wellbeing',
        at: `${l.log_date}T12:00:00`,
        title: 'Daily log',
        detail:
          [
            l.sleep_hours != null && `${round1(Number(l.sleep_hours))} h sleep`,
            l.activity_minutes != null && `${l.activity_minutes} min active`,
          ]
            .filter(Boolean)
            .join(' · ') || undefined,
        href: '/wellbeing',
      });
    return out
      .filter((i) => localISODate(new Date(i.at)) >= since && (!kind || i.kind === kind))
      .sort((a, b) => b.at.localeCompare(a.at));
  }, [mood.data, journal.data, records.data, history.data, assess.data, wb.data, since, kind]);
  const groups = items.reduce<Record<string, Item[]>>((g, i) => {
    const d = localISODate(new Date(i.at));
    (g[d] ??= []).push(i);
    return g;
  }, {});
  const failed = qs.find((q) => q.error);

  return (
    <>
      <PageHeader
        eyebrow="Understand"
        title="Timeline"
        subtitle="Everything you’ve recorded, in order."
      />
      <div className="mb-5 flex flex-wrap gap-3">
        <Select
          aria-label="Period"
          className="w-auto"
          value={days}
          onChange={(e) => setDays(e.target.value)}
          options={[
            ['7', 'Last 7 days'],
            ['30', 'Last 30 days'],
            ['90', 'Last 90 days'],
            ['365', 'Last 12 months'],
          ].map(([v, l]) => ({ value: v, label: l }))}
        />
        <Select
          aria-label="Type"
          className="w-auto"
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          placeholder="All types"
          options={(Object.keys(META) as Kind[]).map((k) => ({ value: k, label: META[k].label }))}
        />
      </div>
      {failed && (
        <div className="mb-4">
          <ErrorState
            error={failed.error}
            onRetry={() => qs.forEach((q) => q.refetch())}
            title="Some items couldn’t be loaded"
          />
        </div>
      )}
      {qs.some((q) => q.isLoading) ? (
        <LoadingBlock rows={6} />
      ) : !items.length ? (
        <EmptyState title="Nothing recorded in this period" />
      ) : (
        <ol className="space-y-6">
          {Object.entries(groups).map(([day, list]) => (
            <li key={day}>
              <h2 className="label-eyebrow mb-2">
                {fmtDate(day, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </h2>
              <Card className="p-0 sm:p-0">
                <ul className="divide-y divide-divider">
                  {list.map((i, n) => {
                    const M = META[i.kind];
                    return (
                      <li key={n}>
                        <Link
                          href={i.href}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03]"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-bronze bg-graphite-deep text-gold">
                            <M.icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm text-ivory">{i.title}</span>
                            <span className="block text-xs text-stone">
                              {M.label}
                              {i.detail ? ` · ${i.detail}` : ''}
                            </span>
                          </span>
                          {['mood', 'journal', 'assessment'].includes(i.kind) && (
                            <span className="shrink-0 text-xs text-stone">
                              {new Date(i.at).toLocaleTimeString(undefined, {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
