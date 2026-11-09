'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, Info, Trash2 } from 'lucide-react';
import { digitalApi, habitApi, moodApi, wellbeingApi } from '@/lib/api/services';
import { errorMessage } from '@/lib/api/client';
import {
  DIGITAL_TYPES,
  HABIT_NAMES,
  type DigitalType,
  type HabitName,
  type WellbeingLog,
} from '@/lib/api/types';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingBlock,
  Notice,
  PageHeader,
  Select,
  Tabs,
  Textarea,
} from '@/components/ui';
import { BarsChart, TrendChart } from '@/components/charts';
import { MoodCheckIn, MOOD_META } from '@/components/features/MoodCheckIn';
import { cn, daysAgo, fmtDate, fmtDateTime, localISODate, round1, titleCase } from '@/lib/utils';

type Tab = 'today' | 'mood' | 'habits' | 'screen' | 'trends';

export default function WellbeingPage() {
  const [tab, setTab] = useState<Tab>('today');
  return (
    <>
      <PageHeader
        eyebrow="Daily life"
        title="Wellbeing"
        subtitle="Log what you can, when you can. Missing days are fine — trends only use what you record."
      />
      <Tabs
        label="Wellbeing sections"
        value={tab}
        onChange={setTab}
        tabs={[
          { key: 'today', label: 'Daily log' },
          { key: 'mood', label: 'Mood' },
          { key: 'habits', label: 'Habits' },
          { key: 'screen', label: 'Screen time' },
          { key: 'trends', label: 'Charts' },
        ]}
      />
      {tab === 'today' && <DailyLog />}
      {tab === 'mood' && <MoodTab />}
      {tab === 'habits' && <HabitsTab />}
      {tab === 'screen' && <ScreenTab />}
      {tab === 'trends' && <TrendsTab />}
    </>
  );
}

const num = (v: string) => (v.trim() === '' ? null : Number(v));
const str = (v: unknown) => (v == null ? '' : String(v));

function DailyLog() {
  const qc = useQueryClient();
  const [date, setDate] = useState(localISODate());
  const logs = useQuery({
    queryKey: ['wellbeing', 'list'],
    queryFn: () => wellbeingApi.list({ since: daysAgo(60) }),
  });
  const existing = logs.data?.items.find((l) => l.log_date === date);
  const [f, setF] = useState({
    sleep_hours: '',
    sleep_quality_score: '',
    activity_minutes: '',
    outdoor_minutes: '',
    water_intake_ml: '',
    screen_time_minutes: '',
  });
  useEffect(() => {
    setF({
      sleep_hours: str(existing?.sleep_hours),
      sleep_quality_score: str(existing?.sleep_quality_score),
      activity_minutes: str(existing?.activity_minutes),
      outdoor_minutes: str(existing?.outdoor_minutes),
      water_intake_ml: str(existing?.water_intake_ml),
      screen_time_minutes: str(existing?.screen_time_minutes),
    });
  }, [existing, date]);
  const [del, setDel] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () => {
      const body: Partial<WellbeingLog> = {};
      for (const [k, v] of Object.entries(f)) (body as Record<string, unknown>)[k] = num(v);
      return wellbeingApi.upsert(date, body);
    },
    onSuccess: () => {
      toast.success(`Saved ${fmtDate(date)}`);
      qc.invalidateQueries({ queryKey: ['wellbeing'] });
      qc.invalidateQueries({ queryKey: ['overview'] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const remove = useMutation({
    mutationFn: (d: string) => wellbeingApi.remove(d),
    onSuccess: () => {
      toast.success('Log deleted');
      setDel(null);
      qc.invalidateQueries({ queryKey: ['wellbeing'] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF({ ...f, [k]: e.target.value });

  return (
    <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
      <Card>
        <CardHeader
          title="Daily log"
          subtitle={
            existing ? `Editing your log for ${fmtDate(date)}` : `New log for ${fmtDate(date)}`
          }
        />
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <Field label="Date">
            {(id) => (
              <Input
                id={id}
                type="date"
                value={date}
                max={localISODate()}
                onChange={(e) => setDate(e.target.value)}
                className="sm:max-w-[220px]"
              />
            )}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Sleep (hours)" hint="0–24, e.g. 7.5">
              {(id) => (
                <Input
                  id={id}
                  type="number"
                  inputMode="decimal"
                  step="0.25"
                  min={0}
                  max={24}
                  value={f.sleep_hours}
                  onChange={set('sleep_hours')}
                />
              )}
            </Field>
            <Field label="Sleep quality (0–10)">
              {(id) => (
                <Input
                  id={id}
                  type="number"
                  min={0}
                  max={10}
                  step="1"
                  value={f.sleep_quality_score}
                  onChange={set('sleep_quality_score')}
                />
              )}
            </Field>
            <Field label="Physical activity (minutes)">
              {(id) => (
                <Input
                  id={id}
                  type="number"
                  min={0}
                  max={1440}
                  value={f.activity_minutes}
                  onChange={set('activity_minutes')}
                />
              )}
            </Field>
            <Field label="Time outdoors (minutes)">
              {(id) => (
                <Input
                  id={id}
                  type="number"
                  min={0}
                  max={1440}
                  value={f.outdoor_minutes}
                  onChange={set('outdoor_minutes')}
                />
              )}
            </Field>
            <Field label="Water (ml)" hint="A glass is about 250 ml">
              {(id) => (
                <Input
                  id={id}
                  type="number"
                  min={0}
                  max={20000}
                  step="50"
                  value={f.water_intake_ml}
                  onChange={set('water_intake_ml')}
                />
              )}
            </Field>
            <Field
              label="Total screen time (minutes)"
              hint="Copy from your phone’s Screen Time / Digital Wellbeing"
            >
              {(id) => (
                <Input
                  id={id}
                  type="number"
                  min={0}
                  max={1440}
                  value={f.screen_time_minutes}
                  onChange={set('screen_time_minutes')}
                />
              )}
            </Field>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" loading={save.isPending}>
              {existing ? 'Update log' : 'Save log'}
            </Button>
            {existing && (
              <Button
                type="button"
                variant="danger"
                onClick={() => setDel(date)}
                icon={<Trash2 className="h-4 w-4" />}
              >
                Delete
              </Button>
            )}
          </div>
        </form>
      </Card>
      <Card>
        <CardHeader title="Recent logs" subtitle="Tap a day to edit it" />
        {logs.isLoading ? (
          <LoadingBlock />
        ) : logs.error ? (
          <ErrorState error={logs.error} onRetry={() => logs.refetch()} />
        ) : !logs.data?.items.length ? (
          <EmptyState title="No daily logs yet" body="Your first log will appear here." />
        ) : (
          <ul className="max-h-[480px] space-y-1.5 overflow-y-auto pr-1">
            {logs.data.items.map((l) => (
              <li key={l.log_date}>
                <button
                  onClick={() => setDate(l.log_date)}
                  className={cn(
                    'w-full rounded-xl border px-3 py-2.5 text-left text-sm transition-colors',
                    l.log_date === date
                      ? 'border-gold/60 bg-gold/5'
                      : 'border-bronze bg-graphite-deep hover:border-gold-line'
                  )}
                >
                  <span className="font-medium text-ivory">
                    {fmtDate(l.log_date, { weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>
                  <span className="mt-0.5 block text-xs text-stone">
                    {[
                      l.sleep_hours != null && `${round1(Number(l.sleep_hours))} h sleep`,
                      l.activity_minutes != null && `${l.activity_minutes} min active`,
                      l.water_intake_ml != null && `${l.water_intake_ml} ml`,
                      l.screen_time_minutes != null && `${l.screen_time_minutes} min screens`,
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'Empty log'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <ConfirmDialog
        open={!!del}
        onClose={() => setDel(null)}
        onConfirm={() => del && remove.mutate(del)}
        loading={remove.isPending}
        title="Delete this daily log?"
        body={`This permanently removes your log for ${del ? fmtDate(del) : ''}.`}
      />
    </div>
  );
}

function MoodTab() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['mood', 'list'], queryFn: () => moodApi.list() });
  const [del, setDel] = useState<string | null>(null);
  const remove = useMutation({
    mutationFn: (id: string) => moodApi.remove(id),
    onSuccess: () => {
      toast.success('Check-in deleted');
      setDel(null);
      qc.invalidateQueries({ queryKey: ['mood'] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
      <Card>
        <CardHeader title="Mood check-in" subtitle="Scores run from 0 to 10." />
        <MoodCheckIn />
      </Card>
      <Card>
        <CardHeader
          title="Check-in history"
          subtitle={q.data ? `${q.data.items.length} most recent` : undefined}
        />
        {q.isLoading ? (
          <LoadingBlock />
        ) : q.error ? (
          <ErrorState error={q.error} onRetry={() => q.refetch()} />
        ) : !q.data?.items.length ? (
          <EmptyState title="No check-ins yet" />
        ) : (
          <ul className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
            {q.data.items.map((m) => {
              const meta = m.mood_label ? MOOD_META[m.mood_label] : null;
              return (
                <li
                  key={m.id}
                  className="flex items-start gap-3 rounded-xl border border-bronze bg-graphite-deep p-3"
                >
                  {meta ? (
                    <meta.icon className="mt-0.5 h-5 w-5 text-gold" />
                  ) : (
                    <span className="mt-0.5 h-5 w-5" />
                  )}
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="text-ivory">
                      {meta?.label ?? 'Check-in'}
                      {m.mood_score != null && (
                        <span className="text-stone"> · mood {m.mood_score}/10</span>
                      )}
                    </p>
                    <p className="text-xs text-stone">
                      {fmtDateTime(m.recorded_at)}
                      {[
                        m.energy_score != null && ` · energy ${m.energy_score}`,
                        m.stress_score != null && ` · stress ${m.stress_score}`,
                        m.anxiety_score != null && ` · anxiety ${m.anxiety_score}`,
                      ]
                        .filter(Boolean)
                        .join('')}
                    </p>
                    {m.note && <p className="mt-1.5 whitespace-pre-wrap text-stone">{m.note}</p>}
                  </div>
                  <button
                    onClick={() => setDel(m.id)}
                    className="rounded-lg p-1.5 text-stone hover:bg-rose/10 hover:text-rose"
                    aria-label="Delete check-in"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
      <ConfirmDialog
        open={!!del}
        onClose={() => setDel(null)}
        onConfirm={() => del && remove.mutate(del)}
        loading={remove.isPending}
        title="Delete this check-in?"
        body="This cannot be undone."
      />
    </div>
  );
}

const HABITS: Record<HabitName, { label: string; unit?: string; hint?: string }> = {
  sleep: { label: 'Slept well', unit: 'hours' },
  water: { label: 'Drank enough water', unit: 'glasses' },
  exercise: { label: 'Exercised', unit: 'minutes' },
  meditation: { label: 'Meditated', unit: 'minutes' },
  reading: { label: 'Read', unit: 'minutes' },
  screen_time: { label: 'Kept screens in check', unit: 'minutes' },
  outdoor: { label: 'Went outside', unit: 'minutes' },
  caffeine: { label: 'Limited caffeine', unit: 'cups' },
};

function HabitsTab() {
  const qc = useQueryClient();
  const today = localISODate();
  const q = useQuery({
    queryKey: ['habits', 'list'],
    queryFn: () => habitApi.list({ since: daysAgo(14) }),
  });
  const todays = (q.data?.items ?? []).filter((h) => localISODate(new Date(h.logged_at)) === today);
  const [vals, setVals] = useState<Record<string, string>>({});
  const log = useMutation({
    mutationFn: ({ name, completed }: { name: HabitName; completed: boolean }) => {
      const v = vals[name];
      return habitApi.create({
        habit_name: name,
        completed,
        value: v ? Number(v) : null,
        unit: v ? (HABITS[name].unit ?? null) : null,
      });
    },
    onSuccess: () => {
      toast.success('Habit logged');
      qc.invalidateQueries({ queryKey: ['habits'] });
      qc.invalidateQueries({ queryKey: ['overview'] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const remove = useMutation({
    mutationFn: (id: string) => habitApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits'] }),
    onError: (e) => toast.error(errorMessage(e)),
  });
  const streak = useMemo(() => {
    const done = new Map<string, Set<string>>();
    for (const h of q.data?.items ?? [])
      if (h.completed) {
        const s = done.get(h.habit_name) ?? new Set();
        s.add(localISODate(new Date(h.logged_at)));
        done.set(h.habit_name, s);
      }
    return (name: string) => {
      const s = done.get(name);
      if (!s) return 0;
      let n = 0;
      for (let i = 0; i < 14; i++) {
        if (s.has(daysAgo(i))) n++;
        else if (i > 0) break;
      }
      return n;
    };
  }, [q.data]);

  if (q.isLoading) return <LoadingBlock rows={6} />;
  if (q.error) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  return (
    <Card>
      <CardHeader title="Today’s habits" subtitle="Mark what you did. The amount is optional." />
      <ul className="grid gap-3 md:grid-cols-2">
        {HABIT_NAMES.map((name) => {
          const entry = todays.find((h) => h.habit_name === name);
          const s = streak(name);
          return (
            <li
              key={name}
              className={cn(
                'rounded-xl border p-4',
                entry?.completed ? 'border-sage/40 bg-sage/5' : 'border-bronze bg-graphite-deep'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ivory">{HABITS[name].label}</p>
                  <p className="text-xs text-stone">
                    {s > 0 ? `${s}-day run` : 'No recent run'}
                    {entry ? ` · logged ${fmtDateTime(entry.logged_at)}` : ''}
                  </p>
                </div>
                {entry ? (
                  <div className="flex items-center gap-1">
                    <Badge tone={entry.completed ? 'sage' : 'neutral'}>
                      {entry.completed ? (
                        <>
                          <Check className="h-3 w-3" />
                          Done
                        </>
                      ) : (
                        'Skipped'
                      )}
                    </Badge>
                    <button
                      onClick={() => remove.mutate(entry.id)}
                      className="rounded-lg p-1.5 text-stone hover:text-rose"
                      aria-label={`Undo ${HABITS[name].label}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : null}
              </div>
              {!entry && (
                <div className="mt-3 flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    placeholder={HABITS[name].unit}
                    value={vals[name] ?? ''}
                    onChange={(e) => setVals({ ...vals, [name]: e.target.value })}
                    className="h-9 max-w-[120px] py-1.5"
                    aria-label={`${HABITS[name].label} amount in ${HABITS[name].unit}`}
                  />
                  <Button
                    size="sm"
                    onClick={() => log.mutate({ name, completed: true })}
                    disabled={log.isPending}
                  >
                    Done
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => log.mutate({ name, completed: false })}
                    disabled={log.isPending}
                  >
                    Skip
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function ScreenTab() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['digital', 'list'],
    queryFn: () => digitalApi.list({ since: daysAgo(30) }),
  });
  const [f, setF] = useState({
    activity_date: localISODate(),
    activity_type: 'social_media' as DigitalType,
    minutes: '',
    app_name: '',
    pickups: '',
    time_of_day: '',
    note: '',
  });
  const add = useMutation({
    mutationFn: () =>
      digitalApi.create({
        activity_date: f.activity_date,
        activity_type: f.activity_type,
        minutes: Number(f.minutes),
        source: 'manual',
        app_name: f.app_name.trim() || null,
        pickups: f.pickups ? Number(f.pickups) : null,
        time_of_day: (f.time_of_day || null) as never,
        note: f.note.trim() || null,
      }),
    onSuccess: () => {
      toast.success('Screen time saved');
      setF({ ...f, minutes: '', app_name: '', pickups: '', note: '' });
      qc.invalidateQueries({ queryKey: ['digital'] });
      qc.invalidateQueries({ queryKey: ['overview'] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const remove = useMutation({
    mutationFn: (id: string) => digitalApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['digital'] }),
    onError: (e) => toast.error(errorMessage(e)),
  });
  const opts = DIGITAL_TYPES.map((t) => ({ value: t, label: titleCase(t) }));

  return (
    <div className="space-y-5">
      <Notice
        tone="blue"
        icon={<Info className="h-4 w-4 text-softblue" />}
        title="Screen time is entered manually"
      >
        NEURIX does not and cannot read your phone. Open Screen Time (iPhone) or Digital Wellbeing
        (Android) and copy the minutes for each category.
      </Notice>
      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <Card>
          <CardHeader title="Add screen time" />
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!f.minutes) return toast.error('Enter the number of minutes.');
              add.mutate();
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date">
                {(id) => (
                  <Input
                    id={id}
                    type="date"
                    max={localISODate()}
                    value={f.activity_date}
                    onChange={(e) => setF({ ...f, activity_date: e.target.value })}
                  />
                )}
              </Field>
              <Field label="Category">
                {(id) => (
                  <Select
                    id={id}
                    options={opts}
                    value={f.activity_type}
                    onChange={(e) => setF({ ...f, activity_type: e.target.value as DigitalType })}
                  />
                )}
              </Field>
              <Field label="Minutes" required>
                {(id) => (
                  <Input
                    id={id}
                    type="number"
                    min={0}
                    max={1440}
                    value={f.minutes}
                    onChange={(e) => setF({ ...f, minutes: e.target.value })}
                  />
                )}
              </Field>
              <Field label="App (optional)">
                {(id) => (
                  <Input
                    id={id}
                    value={f.app_name}
                    maxLength={100}
                    onChange={(e) => setF({ ...f, app_name: e.target.value })}
                  />
                )}
              </Field>
              <Field label="Pickups (optional)">
                {(id) => (
                  <Input
                    id={id}
                    type="number"
                    min={0}
                    value={f.pickups}
                    onChange={(e) => setF({ ...f, pickups: e.target.value })}
                  />
                )}
              </Field>
              <Field label="Time of day (optional)">
                {(id) => (
                  <Select
                    id={id}
                    placeholder="—"
                    options={['morning', 'afternoon', 'evening', 'night'].map((t) => ({
                      value: t,
                      label: titleCase(t),
                    }))}
                    value={f.time_of_day}
                    onChange={(e) => setF({ ...f, time_of_day: e.target.value })}
                  />
                )}
              </Field>
            </div>
            <Field label="Note (optional)">
              {(id) => (
                <Textarea
                  id={id}
                  className="min-h-[64px]"
                  value={f.note}
                  maxLength={2000}
                  onChange={(e) => setF({ ...f, note: e.target.value })}
                />
              )}
            </Field>
            <Button type="submit" loading={add.isPending}>
              Save
            </Button>
          </form>
        </Card>
        <Card>
          <CardHeader title="Last 30 days" />
          {q.isLoading ? (
            <LoadingBlock />
          ) : q.error ? (
            <ErrorState error={q.error} onRetry={() => q.refetch()} />
          ) : !q.data?.items.length ? (
            <EmptyState title="No screen time entered" />
          ) : (
            <ul className="max-h-[460px] space-y-1.5 overflow-y-auto pr-1">
              {q.data.items.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center gap-3 rounded-xl border border-bronze bg-graphite-deep px-3 py-2.5 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-ivory">
                      {titleCase(d.activity_type)}
                      {d.app_name && <span className="text-stone"> · {d.app_name}</span>}
                    </p>
                    <p className="text-xs text-stone">
                      {fmtDate(d.activity_date)}
                      {d.time_of_day ? ` · ${d.time_of_day}` : ''}
                      {d.pickups != null ? ` · ${d.pickups} pickups` : ''}
                    </p>
                  </div>
                  <span className="font-medium tabular-nums">{d.minutes} min</span>
                  <button
                    onClick={() => remove.mutate(d.id)}
                    className="rounded-lg p-1.5 text-stone hover:text-rose"
                    aria-label="Delete entry"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function TrendsTab() {
  const [days, setDays] = useState(30);
  const logs = useQuery({
    queryKey: ['wellbeing', 'trend', days],
    queryFn: () => wellbeingApi.list({ since: daysAgo(days - 1), limit: 200 }),
  });
  const dig = useQuery({
    queryKey: ['digital', 'trend', days],
    queryFn: () => digitalApi.list({ since: daysAgo(days - 1) }),
  });
  const rows = [...(logs.data?.items ?? [])]
    .sort((a, b) => a.log_date.localeCompare(b.log_date))
    .map((l) => ({
      date: fmtDate(l.log_date, { day: 'numeric', month: 'short' }),
      sleep: l.sleep_hours == null ? null : round1(Number(l.sleep_hours)),
      quality: l.sleep_quality_score == null ? null : round1(Number(l.sleep_quality_score)),
      activity: l.activity_minutes,
      outdoor: l.outdoor_minutes,
      water: l.water_intake_ml,
      screen: l.screen_time_minutes,
    }));
  const byType = Object.entries(
    (dig.data?.items ?? []).reduce<Record<string, number>>(
      (a, d) => ({ ...a, [d.activity_type]: (a[d.activity_type] ?? 0) + d.minutes }),
      {}
    )
  )
    .map(([k, v]) => ({ type: titleCase(k), minutes: v }))
    .sort((a, b) => b.minutes - a.minutes);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2" role="group" aria-label="Date range">
        {[7, 30, 90].map((d) => (
          <Button
            key={d}
            size="sm"
            variant={days === d ? 'primary' : 'secondary'}
            onClick={() => setDays(d)}
            aria-pressed={days === d}
          >
            {d} days
          </Button>
        ))}
        <span className="ml-2 text-xs text-stone">
          {fmtDate(daysAgo(days - 1))} – today · {rows.length} daily logs
        </span>
      </div>
      {logs.isLoading ? (
        <LoadingBlock rows={4} />
      ) : logs.error ? (
        <ErrorState error={logs.error} onRetry={() => logs.refetch()} />
      ) : rows.length < 2 ? (
        <EmptyState
          title="Not enough data for charts yet"
          body="Log at least two days on the Daily log tab."
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <TrendChart
              data={rows}
              x="date"
              title="Sleep"
              desc="Hours per night"
              series={[{ key: 'sleep', label: 'Sleep (h)', unit: ' h' }]}
              yDomain={[0, 12]}
            />
          </Card>
          <Card>
            <TrendChart
              data={rows}
              x="date"
              title="Sleep quality"
              desc="Self-rated, 0–10"
              series={[{ key: 'quality', label: 'Quality' }]}
              yDomain={[0, 10]}
            />
          </Card>
          <Card>
            <BarsChart
              data={rows}
              x="date"
              xLabel="Date"
              title="Movement"
              desc="Minutes per day"
              series={[
                { key: 'activity', label: 'Activity', unit: ' min' },
                { key: 'outdoor', label: 'Outdoors', unit: ' min' },
              ]}
            />
          </Card>
          <Card>
            <BarsChart
              data={rows}
              x="date"
              xLabel="Date"
              title="Hydration"
              desc="Millilitres per day"
              series={[{ key: 'water', label: 'Water', unit: ' ml' }]}
            />
          </Card>
          <Card>
            <BarsChart
              data={rows}
              x="date"
              xLabel="Date"
              title="Total screen time"
              desc="Entered manually · minutes per day"
              series={[{ key: 'screen', label: 'Screen time', unit: ' min' }]}
            />
          </Card>
          <Card>
            {byType.length ? (
              <BarsChart
                data={byType}
                x="type"
                xLabel="Category"
                layout="vertical"
                title="Screen time by category"
                desc={`${dig.data?.items.length} entries`}
                series={[{ key: 'minutes', label: 'Minutes', unit: ' min' }]}
              />
            ) : (
              <EmptyState
                title="No category breakdown yet"
                body="Add entries on the Screen time tab."
              />
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
