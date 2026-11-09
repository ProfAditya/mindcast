'use client';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Info, Sparkles, Trash2 } from 'lucide-react';
import { aiApi, analyticsApi, moodApi, wellbeingApi } from '@/lib/api/services';
import { ApiError, errorMessage } from '@/lib/api/client';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  LoadingBlock,
  Notice,
  PageHeader,
  Stat,
} from '@/components/ui';
import { BarsChart, TrendChart } from '@/components/charts';
import { daysAgo, fmtDate, localISODate, round1, titleCase } from '@/lib/utils';

function pearson(xs: number[], ys: number[]) {
  const n = xs.length;
  if (n < 3) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / n,
    my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0,
    sxx = 0,
    syy = 0;
  for (let i = 0; i < n; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) ** 2;
    syy += (ys[i] - my) ** 2;
  }
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : null;
}
const strength = (r: number) => {
  const a = Math.abs(r);
  return a < 0.2 ? 'little or no' : a < 0.4 ? 'a weak' : a < 0.6 ? 'a moderate' : 'a strong';
};
const MIN_PAIRS = 7;

export default function InsightsPage() {
  const [days, setDays] = useState(30);
  const since = daysAgo(days - 1);
  const ov = useQuery({ queryKey: ['overview', days], queryFn: () => analyticsApi.overview(days) });
  const mood = useQuery({
    queryKey: ['mood', 'since', days],
    queryFn: () => moodApi.list({ since }),
  });
  const logs = useQuery({
    queryKey: ['wellbeing', 'trend', days],
    queryFn: () => wellbeingApi.list({ since, limit: 200 }),
  });
  const month = localISODate().slice(0, 7);
  const monthly = useQuery({
    queryKey: ['monthly', month],
    queryFn: () => analyticsApi.monthly(month),
  });

  const pairs = useMemo(() => {
    const moodByDay = new Map<string, number[]>();
    for (const m of mood.data?.items ?? [])
      if (m.mood_score != null) {
        const d = localISODate(new Date(m.recorded_at));
        moodByDay.set(d, [...(moodByDay.get(d) ?? []), m.mood_score]);
      }
    const avgMood = (d: string) => {
      const xs = moodByDay.get(d);
      return xs ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
    };
    const factors = [
      ['sleep_hours', 'Hours of sleep'],
      ['sleep_quality_score', 'Sleep quality'],
      ['activity_minutes', 'Activity minutes'],
      ['outdoor_minutes', 'Time outdoors'],
      ['screen_time_minutes', 'Screen time (manual)'],
      ['water_intake_ml', 'Water intake'],
    ] as const;
    return factors.map(([k, label]) => {
      const xs: number[] = [],
        ys: number[] = [],
        dates: string[] = [];
      for (const l of logs.data?.items ?? []) {
        const v = l[k];
        const m = avgMood(l.log_date);
        if (v != null && m != null) {
          xs.push(Number(v));
          ys.push(m);
          dates.push(l.log_date);
        }
      }
      dates.sort();
      return {
        key: k,
        label,
        n: xs.length,
        r: xs.length >= MIN_PAIRS ? pearson(xs, ys) : null,
        from: dates[0],
        to: dates.at(-1),
      };
    });
  }, [mood.data, logs.data]);

  const loading = ov.isLoading || mood.isLoading || logs.isLoading;
  const err = ov.error || mood.error || logs.error;
  const o = ov.data;
  const labels = o
    ? Object.entries(o.mood.labels).map(([k, v]) => ({ label: titleCase(k), count: v }))
    : [];
  const habits = (o?.habits ?? []).map((h) => ({
    habit: titleCase(h.habit_name),
    rate: Math.round(h.completion_rate * 100),
  }));
  const weekly = (monthly.data?.weekly_mood ?? []).map((w) => ({
    week: fmtDate(w.week_start, { day: 'numeric', month: 'short' }),
    mood: round1(w.avg_mood_score),
  }));
  const ch = monthly.data?.change_from_previous_month;
  const sign = (x: number | null | undefined, unit = '') =>
    x == null ? '—' : `${x > 0 ? '+' : ''}${round1(x)}${unit}`;

  return (
    <>
      <PageHeader
        eyebrow="Understand"
        title="Insights"
        subtitle="Descriptive patterns in your own records. Each one says which dates and how many records it uses."
      />
      <div className="mb-5 flex flex-wrap items-center gap-2" role="group" aria-label="Date range">
        {[7, 30, 90].map((d) => (
          <Button
            key={d}
            size="sm"
            variant={days === d ? 'primary' : 'secondary'}
            aria-pressed={days === d}
            onClick={() => setDays(d)}
          >
            {d} days
          </Button>
        ))}
        {o && (
          <span className="ml-1 text-xs text-stone">
            {fmtDate(o.period.start)} – today · {o.active_days} active days
          </span>
        )}
      </div>
      <Notice
        tone="blue"
        icon={<Info className="h-4 w-4 text-softblue" />}
        title="Patterns, not causes"
      >
        When two things move together in your data, it doesn’t mean one causes the other. Small
        numbers of records can show patterns by chance.
      </Notice>

      {loading ? (
        <div className="mt-5">
          <LoadingBlock rows={5} />
        </div>
      ) : err ? (
        <div className="mt-5">
          <ErrorState
            error={err}
            onRetry={() => {
              ov.refetch();
              mood.refetch();
              logs.refetch();
            }}
          />
        </div>
      ) : (
        o && (
          <>
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat
                label="Mood check-ins"
                value={o.mood.entries}
                hint={
                  o.mood.avg_mood_score != null
                    ? `avg ${round1(o.mood.avg_mood_score)}/10`
                    : 'no scores'
                }
              />
              <Stat
                label="Days with a daily log"
                value={o.wellbeing.days_logged}
                hint={
                  o.wellbeing.avg_sleep_hours != null
                    ? `avg sleep ${round1(Number(o.wellbeing.avg_sleep_hours))} h`
                    : undefined
                }
              />
              <Stat
                label="Screen time entered"
                value={`${Math.round(o.digital.avg_minutes_per_day)} min`}
                hint="per day, manual entries"
              />
              <Stat label="Journal entries" value={o.journal.entries} />
            </div>

            <Card className="mt-5">
              <CardHeader
                title="What moves with your mood?"
                subtitle={`Days in the last ${days} that have both a mood score and a daily log. Needs at least ${MIN_PAIRS} such days.`}
              />
              <ul className="grid gap-3 md:grid-cols-2">
                {pairs.map((p) => (
                  <li key={p.key} className="rounded-xl border border-bronze bg-graphite-deep p-4">
                    <p className="font-medium text-ivory">{p.label} &amp; mood</p>
                    {p.r == null ? (
                      <p className="mt-1 text-sm text-stone">
                        Not enough data yet — {p.n} of {MIN_PAIRS} paired days.
                      </p>
                    ) : (
                      <>
                        <p className="mt-1 text-sm text-stone">
                          There is {strength(p.r)} {p.r > 0 ? 'positive' : 'negative'} association
                          (r = {p.r.toFixed(2)}):{' '}
                          {Math.abs(p.r) < 0.2
                            ? 'these don’t seem to move together.'
                            : p.r > 0
                              ? `on days with more ${p.label.toLowerCase()}, mood tended to be higher.`
                              : `on days with more ${p.label.toLowerCase()}, mood tended to be lower.`}
                        </p>
                        <p className="mt-2 text-[11px] text-stone">
                          Based on {p.n} days · {fmtDate(p.from)} – {fmtDate(p.to)}
                        </p>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </Card>

            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <Card>
                {labels.length ? (
                  <BarsChart
                    data={labels}
                    x="label"
                    xLabel="Mood"
                    title="How you described your mood"
                    desc={`${o.mood.entries} check-ins`}
                    series={[{ key: 'count', label: 'Check-ins' }]}
                  />
                ) : (
                  <EmptyState title="No mood labels in this period" />
                )}
              </Card>
              <Card>
                {habits.length ? (
                  <BarsChart
                    data={habits}
                    x="habit"
                    xLabel="Habit"
                    layout="vertical"
                    title="Habit completion"
                    desc="Share of logged entries marked done"
                    series={[{ key: 'rate', label: 'Completed', unit: '%' }]}
                    yDomain={[0, 100]}
                  />
                ) : (
                  <EmptyState title="No habits logged in this period" />
                )}
              </Card>
            </div>

            <Card className="mt-5">
              <CardHeader title={`This month (${month})`} subtitle={monthly.data?.note} />
              {monthly.isLoading ? (
                <LoadingBlock rows={2} />
              ) : monthly.error ? (
                <ErrorState error={monthly.error} onRetry={() => monthly.refetch()} />
              ) : (
                monthly.data && (
                  <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
                    <div className="grid grid-cols-2 gap-3 self-start">
                      <Stat label="Active days vs last month" value={sign(ch?.active_days)} />
                      <Stat label="Mood vs last month" value={sign(ch?.avg_mood_score)} />
                      <Stat
                        label="Stress vs last month"
                        value={sign(ch?.avg_stress_score)}
                        hint="lower is calmer"
                      />
                      <Stat label="Sleep vs last month" value={sign(ch?.avg_sleep_hours, ' h')} />
                    </div>
                    {weekly.filter((w) => w.mood != null).length >= 2 ? (
                      <TrendChart
                        data={weekly}
                        x="week"
                        xLabel="Week starting"
                        title="Weekly mood"
                        desc="Average mood per week"
                        series={[{ key: 'mood', label: 'Mood' }]}
                        yDomain={[0, 10]}
                      />
                    ) : (
                      <EmptyState title="Weekly mood appears after two weeks with check-ins" />
                    )}
                  </div>
                )
              )}
            </Card>
            <AiSummaries />
          </>
        )
      )}
    </>
  );
}

function AiSummaries() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['ai', 'summaries'], queryFn: aiApi.summaries });
  const gen = useMutation({
    mutationFn: () => aiApi.createSummary(30),
    onSuccess: () => {
      toast.success('Summary generated');
      qc.invalidateQueries({ queryKey: ['ai', 'summaries'] });
    },
    onError: (e) =>
      toast.error(
        e instanceof ApiError && e.status === 503
          ? 'AI features are not configured on this server yet, so no summary was generated.'
          : errorMessage(e)
      ),
  });
  const del = useMutation({
    mutationFn: (id: string | number) => aiApi.deleteSummary(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai', 'summaries'] }),
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <Card className="mt-5">
      <CardHeader
        title="AI summaries"
        subtitle="Optional written summaries from SOUL. Requires AI consent."
        icon={<Sparkles className="h-4 w-4" />}
        action={
          <Button
            size="sm"
            variant="secondary"
            loading={gen.isPending}
            onClick={() => gen.mutate()}
          >
            Summarise last 30 days
          </Button>
        }
      />
      {q.isLoading ? (
        <LoadingBlock rows={2} />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !q.data?.length ? (
        <p className="text-sm text-stone">
          No summaries yet. Numbers above are calculated directly from your records; summaries are
          AI-written and clearly labelled.
        </p>
      ) : (
        <ul className="space-y-3">
          {q.data.map((s) => (
            <li key={s.id} className="rounded-xl border border-bronze bg-graphite-deep p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="blue">AI-generated</Badge>
                  <span className="text-xs text-stone">
                    {titleCase(s.summary_type)} · {fmtDate(s.period_start)} –{' '}
                    {fmtDate(s.period_end)}
                  </span>
                </div>
                <button
                  onClick={() => del.mutate(s.id)}
                  className="rounded-lg p-1.5 text-stone hover:text-rose"
                  aria-label="Delete summary"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-ivory">
                {String(s.summary_content?.text ?? '')}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
