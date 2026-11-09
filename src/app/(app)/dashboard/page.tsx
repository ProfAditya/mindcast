'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Bell,
  BookOpen,
  ClipboardList,
  MessageCircle,
  Moon,
  Droplets,
  Footprints,
  Smartphone,
} from 'lucide-react';
import { useAuth } from '@/context/auth';
import { analyticsApi, journalApi, moodApi, reminderApi } from '@/lib/api/services';
import {
  Badge,
  ButtonLink,
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  LoadingBlock,
  PageHeader,
  Stat,
} from '@/components/ui';
import { TrendChart } from '@/components/charts';
import { MoodCheckIn } from '@/components/features/MoodCheckIn';
import { daysAgo, fmtDate, fmtDateTime, greeting, round1, titleCase } from '@/lib/utils';

export default function Dashboard() {
  const { profile } = useAuth();
  const ov = useQuery({ queryKey: ['overview', 30], queryFn: () => analyticsApi.overview(30) });
  const mood = useQuery({
    queryKey: ['mood', 'since', 30],
    queryFn: () => moodApi.list({ since: daysAgo(30) }),
  });
  const rem = useQuery({ queryKey: ['reminders'], queryFn: () => reminderApi.list() });
  const jr = useQuery({
    queryKey: ['journal', 'recent'],
    queryFn: () => journalApi.list({ limit: 3 }),
  });

  const trend = (() => {
    const byDay = new Map<string, number[]>();
    for (const e of mood.data?.items ?? []) {
      if (e.mood_score == null) continue;
      const d = e.recorded_at.slice(0, 10);
      byDay.set(d, [...(byDay.get(d) ?? []), e.mood_score]);
    }
    return [...byDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([d, xs]) => ({
        date: fmtDate(d, { day: 'numeric', month: 'short' }),
        mood: round1(xs.reduce((a, b) => a + b, 0) / xs.length),
      }));
  })();
  const upcoming = (rem.data?.items ?? [])
    .filter((r) => r.is_enabled && r.reminder_type !== 'goal')
    .slice(0, 4);
  const goals = (rem.data?.items ?? [])
    .filter((r) => r.reminder_type === 'goal' && r.is_enabled)
    .slice(0, 3);
  const w = ov.data?.wellbeing;

  return (
    <>
      <PageHeader
        eyebrow={new Date().toLocaleDateString(undefined, {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })}
        title={greeting(profile?.full_name)}
        subtitle="Here’s a calm look at the last 30 days. Every number below comes from what you’ve logged."
      />

      <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
        <Card>
          <CardHeader
            title="Quick check-in"
            subtitle="Takes 10 seconds. You can add detail if you like."
          />
          <MoodCheckIn compact />
        </Card>
        <Card>
          <CardHeader
            title="Last 30 days"
            subtitle={
              ov.data
                ? `${fmtDate(ov.data.period.start)} – today · ${ov.data.active_days} active days`
                : undefined
            }
          />
          {ov.isLoading ? (
            <LoadingBlock rows={2} />
          ) : ov.error ? (
            <ErrorState error={ov.error} onRetry={() => ov.refetch()} />
          ) : (
            ov.data && (
              <div className="grid grid-cols-2 gap-3">
                <Stat
                  label="Avg mood"
                  value={
                    ov.data.mood.avg_mood_score != null
                      ? `${round1(ov.data.mood.avg_mood_score)}/10`
                      : '—'
                  }
                  hint={`${ov.data.mood.entries} check-ins`}
                />
                <Stat
                  label="Avg sleep"
                  value={
                    w?.avg_sleep_hours != null ? `${round1(Number(w.avg_sleep_hours))} h` : '—'
                  }
                  hint={`${w?.days_logged ?? 0} days logged`}
                />
                <Stat
                  label="Avg stress"
                  value={
                    ov.data.mood.avg_stress_score != null
                      ? `${round1(ov.data.mood.avg_stress_score)}/10`
                      : '—'
                  }
                  hint="lower is calmer"
                />
                <Stat label="Journal" value={ov.data.journal.entries} hint="entries" />
              </div>
            )
          )}
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          {mood.isLoading ? (
            <LoadingBlock />
          ) : mood.error ? (
            <ErrorState error={mood.error} onRetry={() => mood.refetch()} />
          ) : trend.length < 2 ? (
            <EmptyState
              title="Your mood trend will appear here"
              body="Log a check-in on at least two different days to see a trend line."
            />
          ) : (
            <TrendChart
              data={trend}
              x="date"
              series={[{ key: 'mood', label: 'Mood (daily average, 0–10)' }]}
              yDomain={[0, 10]}
              title="Mood trend"
              desc={`${mood.data?.items.length} check-ins over ${trend.length} days`}
            />
          )}
        </Card>
        <Card>
          <CardHeader
            title="Daily wellbeing"
            subtitle="30-day averages"
            action={
              <Link href="/wellbeing" className="text-xs text-gold-pale hover:text-gold">
                Log today
              </Link>
            }
          />
          {ov.isLoading ? (
            <LoadingBlock rows={4} />
          ) : !w || w.days_logged === 0 ? (
            <EmptyState
              title="Nothing logged yet"
              body="Add sleep, activity, water and screen time on the Wellbeing page."
              action={
                <ButtonLink href="/wellbeing" size="sm">
                  Open Wellbeing
                </ButtonLink>
              }
            />
          ) : (
            <ul className="space-y-3 text-sm">
              {[
                [
                  Moon,
                  'Sleep quality',
                  w.avg_sleep_quality != null ? `${round1(Number(w.avg_sleep_quality))}/10` : '—',
                ],
                [
                  Footprints,
                  'Activity',
                  w.avg_activity_minutes != null
                    ? `${Math.round(Number(w.avg_activity_minutes))} min/day`
                    : '—',
                ],
                [
                  Droplets,
                  'Water',
                  w.avg_water_intake_ml != null
                    ? `${Math.round(Number(w.avg_water_intake_ml))} ml/day`
                    : '—',
                ],
                [
                  Smartphone,
                  'Screen time (manual)',
                  w.avg_screen_time_minutes != null
                    ? `${Math.round(Number(w.avg_screen_time_minutes))} min/day`
                    : '—',
                ],
              ].map(([I, l, v]) => {
                const Icon = I as typeof Moon;
                return (
                  <li
                    key={l as string}
                    className="flex items-center justify-between gap-3 rounded-xl border border-bronze bg-graphite-deep px-3 py-2.5"
                  >
                    <span className="flex items-center gap-2.5 text-stone">
                      <Icon className="h-4 w-4 text-gold" />
                      {l as string}
                    </span>
                    <span className="font-medium text-ivory">{v as string}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader title="Assessments" icon={<ClipboardList className="h-4 w-4" />} />
          {ov.data?.latest_assessments?.length ? (
            <ul className="space-y-2 text-sm">
              {ov.data.latest_assessments.map((a) => (
                <li key={a.instrument} className="flex items-center justify-between gap-2">
                  <span className="text-ivory">{a.instrument.toUpperCase()}</span>
                  <span className="text-stone">
                    {a.total_score} · {a.severity}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-stone">No screeners completed in this period.</p>
          )}
          <Link
            href="/assessments"
            className="mt-4 inline-flex items-center gap-1 text-xs text-gold-pale hover:text-gold"
          >
            Assessment Centre <ArrowRight className="h-3 w-3" />
          </Link>
        </Card>
        <Card>
          <CardHeader title="Upcoming reminders" icon={<Bell className="h-4 w-4" />} />
          {rem.isLoading ? (
            <LoadingBlock rows={2} />
          ) : upcoming.length ? (
            <ul className="space-y-2 text-sm">
              {upcoming.map((r) => (
                <li key={r.id} className="flex justify-between gap-2">
                  <span className="truncate text-ivory">{r.title}</span>
                  <span className="shrink-0 text-xs text-stone">
                    {r.scheduled_at ? fmtDateTime(r.scheduled_at) : titleCase(r.recurrence)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-stone">No active reminders.</p>
          )}
          <Link
            href="/reminders"
            className="mt-4 inline-flex items-center gap-1 text-xs text-gold-pale hover:text-gold"
          >
            Manage reminders <ArrowRight className="h-3 w-3" />
          </Link>
        </Card>
        <Card>
          <CardHeader title="Goals" icon={<ArrowRight className="h-4 w-4" />} />
          {goals.length ? (
            <ul className="space-y-2 text-sm">
              {goals.map((g) => (
                <li key={g.id} className="truncate text-ivory">
                  {g.title}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-stone">No active goals yet.</p>
          )}
          <Link
            href="/goals"
            className="mt-4 inline-flex items-center gap-1 text-xs text-gold-pale hover:text-gold"
          >
            Set a goal <ArrowRight className="h-3 w-3" />
          </Link>
        </Card>
        <Card>
          <CardHeader
            title="Recent journal"
            icon={<BookOpen className="h-4 w-4" />}
            action={<Badge>Private</Badge>}
          />
          {jr.data?.items.length ? (
            <ul className="space-y-2 text-sm">
              {jr.data.items.map((j) => (
                <li key={j.id}>
                  <p className="truncate text-ivory">{j.title || j.entry_text.slice(0, 60)}</p>
                  <p className="text-xs text-stone">{fmtDate(j.created_at)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-stone">Nothing written yet.</p>
          )}
          <Link
            href="/journal"
            className="mt-4 inline-flex items-center gap-1 text-xs text-gold-pale hover:text-gold"
          >
            Open journal <ArrowRight className="h-3 w-3" />
          </Link>
        </Card>
      </div>

      <Card className="mt-5 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold-line bg-graphite-deep text-gold">
          <MessageCircle className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="font-medium">Talk it through with SOUL</p>
          <p className="text-sm text-stone">
            A reflective companion that uses only the data you allow. Not a therapist, not for
            emergencies.
          </p>
        </div>
        <ButtonLink href="/soul" variant="secondary">
          Open SOUL
        </ButtonLink>
      </Card>
    </>
  );
}
