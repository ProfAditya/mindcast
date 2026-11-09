'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Compass,
  MessageCircle,
  Info,
  LifeBuoy,
  Printer,
  RotateCcw,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/context/auth';
import { assessmentApi } from '@/lib/api/services';
import {
  bandLabel,
  getModule,
  formFor,
  MODULES,
  type Band,
  type DomainResult,
} from '@/lib/assessments/engine';
import { VALIDATED, isValidated } from '@/lib/assessments/validated';
import { localAttempts, type LocalAttempt } from '@/lib/assessments/storage';
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  LoadingBlock,
  Notice,
  PageHeader,
  Stat,
} from '@/components/ui';
import { BarsChart, Meter, RadarProfile, TrendChart } from '@/components/charts';
import { fmtDate, fmtDateTime } from '@/lib/utils';

export default function ResultPage() {
  const { id, attemptId } = useParams<{ id: string; attemptId: string }>();
  return isValidated(id) ? (
    <ValidatedResult code={id} rid={attemptId} />
  ) : (
    <ExploratoryResultView moduleId={id} aid={attemptId} />
  );
}

const BAND_TONE: Record<Band, 'sage' | 'gold' | 'rose' | 'neutral' | 'blue'> = {
  lower: 'blue',
  balanced: 'neutral',
  higher: 'blue',
  strength: 'sage',
  mixed: 'gold',
  explore: 'rose',
  insufficient: 'neutral',
};

function Actions({ again }: { again: string }) {
  return (
    <>
      <ButtonLink href="/assessments" variant="ghost" icon={<ArrowLeft className="h-4 w-4" />}>
        All assessments
      </ButtonLink>
      <Button
        variant="secondary"
        icon={<Printer className="h-4 w-4" />}
        onClick={() => window.print()}
      >
        Print
      </Button>
      <ButtonLink href={again} variant="secondary" icon={<RotateCcw className="h-4 w-4" />}>
        Take again
      </ButtonLink>
    </>
  );
}

function ValidatedResult({ code, rid }: { code: keyof typeof VALIDATED; rid: string }) {
  const v = VALIDATED[code];
  const r = useQuery({ queryKey: ['assessment', rid], queryFn: () => assessmentApi.get(rid) });
  const all = useQuery({
    queryKey: ['assessments', 'list', code],
    queryFn: () => assessmentApi.list(code),
  });
  const inst = useQuery({
    queryKey: ['instrument', code],
    queryFn: () => assessmentApi.instrument(code),
  });
  if (r.isLoading) return <LoadingBlock rows={6} />;
  if (r.error || !r.data)
    return (
      <ErrorState error={r.error} onRetry={() => r.refetch()} title="Couldn’t load this result" />
    );
  const res = r.data.result;
  const history = [...(all.data?.items ?? [])]
    .sort((a, b) => a.completed_at.localeCompare(b.completed_at))
    .map((x) => ({
      date: fmtDate(x.completed_at, { day: 'numeric', month: 'short', year: '2-digit' }),
      score: x.result.total_score,
    }));
  const idx = (all.data?.items ?? []).findIndex((x) => x.id === rid);
  const prev = idx >= 0 ? all.data!.items[idx + 1] : undefined;
  const items = (inst.data?.items ?? []).map((it, i) => ({
    item: `Q${i + 1}`,
    text: it.text,
    answer: r.data!.answers[it.id] ?? null,
  }));
  const optLabel = (n: number | null) =>
    inst.data?.options.find((o) => o.value === n)?.label ?? '—';
  const delta = prev ? res.total_score - prev.result.total_score : null;

  return (
    <>
      <PageHeader
        eyebrow={`${v.title} result · ${fmtDateTime(r.data.completed_at)}`}
        title={v.name}
        actions={<Actions again={`/assessments/${code}`} />}
      />
      {res.safety_flag && (
        <div className="mb-5">
          <Notice
            tone="rose"
            icon={<LifeBuoy className="h-4 w-4 text-rose" />}
            title="Please reach out for support"
          >
            {res.safety_message}{' '}
            <Link href="/soul#support" className="text-ivory underline underline-offset-2">
              See support options
            </Link>
            .
          </Notice>
        </div>
      )}
      <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <div className="flex items-center gap-2">
            <Badge tone="sage">Validated screener</Badge>
            <Badge>v{res.instrument_version}</Badge>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Stat
              label="Score"
              value={`${res.total_score} / ${res.max_score}`}
              hint={v.higherIsBetter ? 'Higher = better wellbeing' : 'Higher = more symptoms'}
            />
            <Stat
              label="Band"
              value={<span className="text-xl">{res.severity}</span>}
              hint="Published scoring band"
            />
            {res.percentage_score != null && (
              <Stat
                label="Percentage"
                value={`${res.percentage_score}%`}
                hint="WHO-5 raw score × 4"
              />
            )}
            {delta !== null && (
              <Stat
                label="Since last time"
                value={`${delta > 0 ? '+' : ''}${delta}`}
                hint={`vs ${fmtDate(prev!.completed_at)}`}
              />
            )}
          </div>
          <p className="mt-5 text-sm text-stone">{res.disclaimer}</p>
          <p className="mt-3 text-xs text-stone">
            Scored by the NEURIX server using the instrument’s published rules. NEURIX does not add
            its own interpretation to validated scores.
          </p>
        </Card>
        <Card>
          {history.length >= 2 ? (
            <TrendChart
              data={history}
              x="date"
              title="Your scores over time"
              desc={`${history.length} attempts · ${v.higherIsBetter ? 'higher is better' : 'lower means fewer symptoms'}`}
              series={[{ key: 'score', label: `${v.title} score` }]}
              yDomain={[0, res.max_score]}
            />
          ) : (
            <EmptyState
              icon={<TrendingUp className="h-5 w-5" />}
              title="Your trend appears after two attempts"
              body="Taking the same screener every few weeks lets you compare."
            />
          )}
        </Card>
      </div>
      {items.length > 0 && (
        <Card className="mt-5">
          <BarsChart
            data={items}
            x="item"
            xLabel="Question"
            title="Your answers by question"
            desc={`0 = ${optLabel(0)}, ${inst.data!.options.at(-1)?.value} = ${inst.data!.options.at(-1)?.label}`}
            series={[{ key: 'answer', label: 'Answer' }]}
            yDomain={[0, Math.max(...inst.data!.options.map((o) => o.value))]}
            height={200}
          />
          <ol className="mt-5 space-y-2 text-sm">
            {items.map((it) => (
              <li key={it.item} className="flex gap-3">
                <span className="w-8 shrink-0 text-stone">{it.item}</span>
                <span className="flex-1 text-stone">{it.text}</span>
                <span className="shrink-0 text-ivory">{optLabel(it.answer)}</span>
              </li>
            ))}
          </ol>
        </Card>
      )}
      <Notice tone="gold" icon={<Info className="h-4 w-4 text-gold" />} title="What next?">
        Consider sharing this result with a GP or mental-health professional, especially if it’s
        higher than you expected or has changed. You can grant a connected doctor access to
        assessments in{' '}
        <Link href="/doctor-connection" className="text-gold-pale underline">
          Doctor connection
        </Link>
        .
      </Notice>
    </>
  );
}

/** Position between two poles; the number is always printed so position is never conveyed by colour alone. */
function Spectrum({ d }: { d: DomainResult }) {
  const v = d.score ?? 50;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
        <span className="text-ivory">{d.label}</span>
        <span className="tabular-nums text-stone">{d.score ?? '—'}/100</span>
      </div>
      <div
        className="relative h-2 rounded-full bg-graphite-deep"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={d.score ?? undefined}
        aria-label={`${d.label}: ${d.score ?? 'no result'} on a scale from ${d.poles?.[0]} (0) to ${d.poles?.[1]} (100)`}
      >
        <span className="absolute left-1/2 top-[-3px] h-[14px] w-px bg-divider" aria-hidden />
        {d.score !== null && (
          <span
            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-graphite bg-softblue"
            style={{ left: `${v}%` }}
            aria-hidden
          />
        )}
      </div>
      <div className="mt-1 flex justify-between gap-4 text-[11px] text-stone">
        <span>{d.poles?.[0]}</span>
        <span className="text-right">{d.poles?.[1]}</span>
      </div>
    </div>
  );
}

function soulPrompt(title: string, domains: DomainResult[], date: string) {
  const lines = domains
    .filter((d) => d.score !== null)
    .map((d) => `- ${d.label}: ${d.score}/100 (${bandLabel(d.band, d.poles)})`);
  return `I completed the NEURIX exploratory module “${title}” on ${date}. These are self-reflection scores, not a diagnosis:\n${lines.join('\n')}\nCan you help me understand what these results might mean for me, and what I could reflect on first?`;
}

function ExploratoryResultView({ moduleId, aid }: { moduleId: string; aid: string }) {
  const { profile } = useAuth();
  const m = getModule(moduleId);
  const [state, setState] = useState<{ a: LocalAttempt | null; all: LocalAttempt[] } | null>(null);
  useEffect(() => {
    const all = localAttempts.list(profile!.id).filter((x) => x.module === moduleId);
    setState({ a: all.find((x) => x.id === aid) ?? null, all });
  }, [profile, moduleId, aid]);
  if (!state) return <LoadingBlock rows={6} />;
  if (!m || !state.a)
    return (
      <EmptyState
        title="Result not found on this device"
        body="Exploratory results are stored in the browser where you took them. They may have been cleared, taken on another device, or belong to an earlier version of the Assessment Centre."
        action={<ButtonLink href="/assessments">Assessment Centre</ButtonLink>}
      />
    );
  const { a, all } = state;
  const r = a.result;
  const wellbeing = r.domains.filter((d) => d.kind !== 'tendency');
  const tendencies = r.domains.filter((d) => d.kind === 'tendency');
  // Only compare with earlier attempts of the same version: changed questions make scores incomparable.
  const sameVersion = all.filter((x) => x.version === a.version);
  const prev = sameVersion.filter((x) => x.completed_at < a.completed_at)[0];
  const radarDomains = wellbeing.length >= 3 ? wellbeing : tendencies.length >= 3 ? tendencies : [];
  const radar = radarDomains.map((d) => ({
    domain: d.label,
    current: d.score ?? 0,
    ...(prev ? { previous: prev.result.domains.find((p) => p.id === d.id)?.score ?? 0 } : {}),
  }));
  const bars = wellbeing.map((d) => ({ domain: d.label, score: d.score }));
  const trend = [...sameVersion].reverse().map((x) => ({
    date: fmtDate(x.completed_at, { day: 'numeric', month: 'short' }),
    overall: x.result.overall,
  }));
  const form = formFor(m, a.length);
  const texts = form.filter((q) => (q.format === 'text' && a.answers[q.id]) || a.followUps[q.id]);
  const completion = Math.round((r.answered / r.total) * 100);
  const suggested = (r.suggestedModules ?? [])
    .map((id) => MODULES.find((x) => x.id === id))
    .filter(Boolean) as typeof MODULES;
  const soulHref = `/soul?draft=${encodeURIComponent(soulPrompt(m.title, r.domains, fmtDate(a.completed_at)))}`;

  return (
    <>
      <PageHeader
        eyebrow={`Exploratory result · ${fmtDateTime(a.completed_at)}`}
        title={m.title}
        actions={<Actions again={`/assessments/${m.id}`} />}
      />
      <Notice
        tone="blue"
        icon={<Info className="h-4 w-4 text-softblue" />}
        title="Exploratory · not clinically validated · saved on this device"
      >
        These results reflect your answers on this occasion and are meant to prompt reflection. They
        are not a diagnosis, a measure of any condition, or a personality type.
      </Notice>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat
          label="Overall (wellbeing areas)"
          value={r.overall != null ? `${r.overall}/100` : '—'}
          hint={
            r.overall == null
              ? tendencies.length
                ? 'Tendencies are not averaged'
                : 'Not enough answers'
              : `Average of ${wellbeing.filter((d) => d.score !== null).length} areas`
          }
        />
        <Stat
          label="Completion"
          value={`${completion}%`}
          hint={`${r.answered} of ${r.total} answered`}
        />
        <Stat label="Form" value={`${a.length} questions`} hint={`Version ${r.version}`} />
        <Stat
          label="Attempts"
          value={sameVersion.length}
          hint={prev ? `Previous: ${fmtDate(prev.completed_at)}` : 'First attempt of this version'}
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.3fr]">
        <Card>
          <CardHeader title="Area by area" />
          <ul className="space-y-5">
            {r.domains.map((d) => (
              <li key={d.id}>
                {d.kind === 'tendency' ? (
                  <Spectrum d={d} />
                ) : d.score !== null ? (
                  <Meter value={d.score} label={d.label} />
                ) : (
                  <p className="text-sm text-ivory">{d.label}</p>
                )}
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <Badge tone={BAND_TONE[d.band]}>{bandLabel(d.band, d.poles)}</Badge>
                  <span className="text-xs text-stone">
                    {d.summary} · {d.answered}/{d.total} answered
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          {radar.length ? (
            <RadarProfile
              data={radar}
              axis="domain"
              title={radarDomains === wellbeing ? 'Your profile' : 'Your tendency profile'}
              desc={
                prev
                  ? `This attempt vs ${fmtDate(prev.completed_at)}`
                  : radarDomains === wellbeing
                    ? 'Scores 0–100 per area'
                    : '0 and 100 are the two poles of each dimension'
              }
              series={[
                { key: 'current', label: 'This attempt' },
                ...(prev ? [{ key: 'previous', label: 'Previous attempt' }] : []),
              ]}
            />
          ) : (
            <EmptyState title="Not enough areas for a profile chart" />
          )}
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {bars.length > 0 && (
          <Card>
            <BarsChart
              data={bars}
              x="domain"
              xLabel="Area"
              layout="vertical"
              title="Wellbeing areas"
              desc="0–100, higher is more favourable"
              series={[{ key: 'score', label: 'Score' }]}
              yDomain={[0, 100]}
              height={Math.max(160, bars.length * 44)}
            />
          </Card>
        )}
        <Card>
          {trend.length >= 2 && trend.some((t) => t.overall != null) ? (
            <TrendChart
              data={trend}
              x="date"
              title="Overall score over time"
              desc={`${trend.length} attempts of version ${a.version} on this device`}
              series={[{ key: 'overall', label: 'Overall' }]}
              yDomain={[0, 100]}
            />
          ) : (
            <EmptyState
              icon={<TrendingUp className="h-5 w-5" />}
              title="Retake later to compare"
              body="Each attempt is saved separately, so you can see what changes over time."
            />
          )}
        </Card>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-3">
        <Card>
          <CardHeader title="Potential strengths" icon={<Sparkles className="h-4 w-4" />} />
          {r.strengths.length ? (
            <ul className="space-y-1.5 text-sm text-ivory">
              {r.strengths.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-stone">
              {wellbeing.length
                ? 'No area reached the “relative strength” band this time.'
                : 'This module describes tendencies, which are not strengths or weaknesses.'}
            </p>
          )}
        </Card>
        <Card>
          <CardHeader title="Areas you may wish to explore" icon={<Target className="h-4 w-4" />} />
          {r.explore.length ? (
            <ul className="space-y-1.5 text-sm text-ivory">
              {r.explore.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-stone">Nothing stood out as an area to explore.</p>
          )}
        </Card>
        <Card>
          <CardHeader title="Answer patterns" icon={<TrendingUp className="h-4 w-4" />} />
          <ul className="space-y-2 text-sm text-stone">
            {r.patterns.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </Card>
      </div>

      {r.situational?.length > 0 && (
        <Card className="mt-5">
          <CardHeader title="Situational responses" subtitle={r.situationalSummary ?? undefined} />
          <ul className="space-y-3 text-sm">
            {r.situational.map((x) => (
              <li key={x.question} className="rounded-xl border border-bronze bg-graphite-deep p-3">
                <p className="text-stone">{x.question}</p>
                <p className="mt-1 text-ivory">→ {x.answer}</p>
                <p className="mt-1 text-[11px] text-stone">Area: {x.domain}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader
            title="Personal suggestions"
            subtitle="Based on the areas above. General wellbeing ideas, not treatment advice."
          />
          <ul className="space-y-2 text-sm text-ivory">
            {r.recommendations.map((s) => (
              <li key={s} className="flex gap-2">
                <span className="text-gold" aria-hidden>
                  •
                </span>
                {s}
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader
            title="Talk it through with SOUL"
            icon={<MessageCircle className="h-4 w-4" />}
          />
          <p className="text-sm text-stone">
            SOUL can’t see device-stored results. This opens SOUL with a message listing your area
            scores, which you can edit before sending.
          </p>
          <ButtonLink href={soulHref} variant="secondary" className="mt-4">
            Discuss with SOUL
          </ButtonLink>
        </Card>
      </div>

      {suggested.length > 0 && (
        <Card className="mt-5">
          <CardHeader
            title="Assessments you might find useful next"
            icon={<Compass className="h-4 w-4" />}
          />
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {suggested.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/assessments/${s.id}`}
                  className="block rounded-xl border border-bronze bg-graphite-deep p-3 hover:border-gold-line"
                >
                  <p className="text-sm font-medium text-ivory">{s.title}</p>
                  <p className="text-xs text-stone">{s.tagline}</p>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {texts.length > 0 && (
        <Card className="mt-5">
          <CardHeader
            title="Your written reflections"
            subtitle="Not scored. Only stored on this device."
          />
          <ul className="space-y-3 text-sm">
            {texts.map((q) => (
              <li key={q.id}>
                <p className="text-stone">{q.format === 'text' ? q.text : q.followUp?.text}</p>
                <p className="mt-0.5 whitespace-pre-wrap text-ivory">
                  {q.format === 'text' ? String(a.answers[q.id]) : a.followUps[q.id]}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="mt-5">
        <CardHeader title="How this was scored, and its limits" />
        <p className="text-sm text-stone">{r.scoring}</p>
        <ul className="mt-3 space-y-1.5 text-sm text-stone">
          {r.limitations.map((l) => (
            <li key={l} className="flex gap-2">
              <span aria-hidden>–</span>
              {l}
            </li>
          ))}
        </ul>
        {r.answered < r.total && (
          <p className="mt-3 text-sm text-stone">
            Missing information: {r.total - r.answered} question
            {r.total - r.answered > 1 ? 's were' : ' was'} skipped.
          </p>
        )}
      </Card>
    </>
  );
}
