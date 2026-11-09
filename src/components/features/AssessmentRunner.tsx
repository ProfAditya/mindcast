'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, Clock, Info, LifeBuoy, Pencil, Save } from 'lucide-react';
import { Badge, Button, Card, Notice, Textarea } from '@/components/ui';
import { cn, fmtDateTime } from '@/lib/utils';
import type { Answer, Answers, Format, Length, Option } from '@/lib/assessments/engine';
import { drafts, type Draft } from '@/lib/assessments/storage';

export interface RunnerQuestion {
  id: string;
  text: string;
  format: Format;
  options: Option[];
  required: boolean;
  section?: string;
  followUp?: { text: string; kind: 'question' | 'note' };
  showFollowUp?: (a: Answer | undefined) => boolean;
  /** Shown under the question when the answer meets a safety condition. */
  safety?: (a: Answer | undefined) => string | null;
}

export interface RunnerProps {
  uid: string;
  draftKey: string;
  version: string;
  title: string;
  kind: 'validated' | 'exploratory';
  intro: React.ReactNode;
  lengths?: readonly Length[];
  defaultLength?: Length;
  questionsFor: (length: Length) => RunnerQuestion[];
  instructions?: string;
  onSubmit: (data: {
    answers: Answers;
    followUps: Record<string, string>;
    length: Length;
    started_at: string;
  }) => Promise<void>;
}

const answered = (a: Answer | undefined) =>
  a !== undefined && a !== '' && !(Array.isArray(a) && a.length === 0);

export function AssessmentRunner(p: RunnerProps) {
  const [phase, setPhase] = useState<'intro' | 'questions' | 'review'>('intro');
  const [length, setLength] = useState<Length>(p.defaultLength ?? 30);
  const [answers, setAnswers] = useState<Answers>({});
  const [followUps, setFollowUps] = useState<Record<string, string>>({});
  const [index, setIndex] = useState(0);
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString());
  const [draft, setDraft] = useState<Draft | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const d = drafts.get(p.uid, p.draftKey);
    setDraft(d && d.version === p.version ? d : null);
  }, [p.uid, p.draftKey, p.version]);

  const qs = useMemo(() => p.questionsFor(length), [p, length]);
  const q = qs[index];
  const done = qs.filter((x) => answered(answers[x.id])).length;
  const missingRequired = qs.filter((x) => x.required && !answered(answers[x.id]));

  const persist = useCallback(
    (a: Answers, f: Record<string, string>, i: number) => {
      const ok = drafts.save(p.uid, {
        module: p.draftKey,
        version: p.version,
        length,
        answers: a,
        followUps: f,
        index: i,
        started_at: startedAt,
        saved_at: new Date().toISOString(),
      });
      if (ok) setSavedAt(new Date().toISOString());
    },
    [p.uid, p.draftKey, p.version, length, startedAt]
  );

  const setAnswer = (id: string, v: Answer) => {
    const next = { ...answers, [id]: v };
    setAnswers(next);
    persist(next, followUps, index);
  };
  const go = (i: number) => {
    setIndex(i);
    persist(answers, followUps, i);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const start = (resume: boolean) => {
    if (resume && draft) {
      setLength(draft.length);
      setAnswers(draft.answers);
      setFollowUps(draft.followUps ?? {});
      setIndex(Math.min(draft.index, p.questionsFor(draft.length).length - 1));
      setStartedAt(draft.started_at);
    } else {
      drafts.clear(p.uid, p.draftKey);
      setAnswers({});
      setFollowUps({});
      setIndex(0);
      setStartedAt(new Date().toISOString());
    }
    setPhase('questions');
  };

  // Number keys choose options; Enter moves on.
  useEffect(() => {
    if (phase !== 'questions' || !q) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === 'TEXTAREA' || t.tagName === 'INPUT') return;
      const n = Number(e.key);
      if (q.format !== 'text' && q.format !== 'multi' && n >= 1 && n <= q.options.length)
        setAnswer(q.id, q.options[n - 1].value);
      if (
        e.key === 'Enter' &&
        t.tagName !== 'BUTTON' &&
        t.tagName !== 'A' &&
        (!q.required || answered(answers[q.id]))
      ) {
        if (index < qs.length - 1) go(index + 1);
        else setPhase('review');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const submit = async () => {
    if (missingRequired.length) {
      setError(`Please answer all required questions (${missingRequired.length} left).`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await p.onSubmit({ answers, followUps, length, started_at: startedAt });
      drafts.clear(p.uid, p.draftKey);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Submission failed. Your answers are still saved on this device.'
      );
      setSubmitting(false);
    }
  };

  if (phase === 'intro') {
    const est = (n: number) => Math.max(2, Math.round(n * (p.kind === 'validated' ? 0.15 : 0.25)));
    return (
      <Card className="mx-auto max-w-2xl">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={p.kind === 'validated' ? 'sage' : 'blue'}>
            {p.kind === 'validated'
              ? 'Validated screener'
              : 'Exploratory · not clinically validated'}
          </Badge>
          <Badge>v{p.version}</Badge>
        </div>
        <h1 className="mt-3 text-2xl font-semibold">{p.title}</h1>
        <div className="mt-3 space-y-3 text-sm text-stone">{p.intro}</div>
        {p.lengths && p.lengths.length > 1 && (
          <fieldset className="mt-6">
            <legend className="mb-2 text-sm font-medium">Choose a length</legend>
            <div className="grid grid-cols-3 gap-2" role="radiogroup">
              {p.lengths.map((l) => (
                <button
                  key={l}
                  type="button"
                  role="radio"
                  aria-checked={length === l}
                  onClick={() => setLength(l)}
                  className={cn(
                    'rounded-xl border p-3 text-left transition-colors',
                    length === l
                      ? 'border-gold bg-gold/10'
                      : 'border-divider bg-graphite-deep hover:border-gold-line'
                  )}
                >
                  <span className="block font-semibold text-ivory">{l} questions</span>
                  <span className="mt-0.5 flex items-center gap-1 text-xs text-stone">
                    <Clock className="h-3 w-3" />~{est(l)} min
                  </span>
                </button>
              ))}
            </div>
          </fieldset>
        )}
        {(!p.lengths || p.lengths.length <= 1) && (
          <p className="mt-4 flex items-center gap-1.5 text-sm text-stone">
            <Clock className="h-4 w-4" />
            About {est(p.questionsFor(length).length)} minutes · {p.questionsFor(length).length}{' '}
            questions
          </p>
        )}
        <Notice tone="gold" icon={<Info className="h-4 w-4 text-gold" />}>
          Your progress is saved on this device as you go, so you can stop and come back. This is
          not a diagnosis. If you’re struggling right now,{' '}
          <Link href="/soul#support" className="text-gold-pale underline underline-offset-2">
            see support options
          </Link>
          .
        </Notice>
        <div className="mt-6 flex flex-wrap gap-2">
          {draft ? (
            <>
              <Button onClick={() => start(true)} icon={<ArrowRight className="h-4 w-4" />}>
                Resume ({Object.keys(draft.answers).length} answered)
              </Button>
              <Button variant="secondary" onClick={() => start(false)}>
                Start over
              </Button>
              <p className="w-full text-xs text-stone">
                Draft saved {fmtDateTime(draft.saved_at)} · {draft.length}-question form
              </p>
            </>
          ) : (
            <Button onClick={() => start(false)} icon={<ArrowRight className="h-4 w-4" />}>
              Begin
            </Button>
          )}
        </div>
      </Card>
    );
  }

  if (phase === 'review') {
    return (
      <div className="mx-auto max-w-3xl">
        <Card>
          <h1 className="text-xl font-semibold">Review your answers</h1>
          <p className="mt-1 text-sm text-stone">
            {done} of {qs.length} answered. Tap any question to change it. Once submitted, an
            attempt is saved as it is and never edited.
          </p>
          {missingRequired.length > 0 && (
            <div className="mt-4">
              <Notice tone="rose">
                {missingRequired.length} required question
                {missingRequired.length > 1 ? 's are' : ' is'} unanswered.
              </Notice>
            </div>
          )}
          <ol className="mt-5 divide-y divide-divider rounded-xl border border-bronze">
            {qs.map((x, i) => {
              const a = answers[x.id];
              const shown = !answered(a)
                ? null
                : Array.isArray(a)
                  ? x.options
                      .filter((o) => a.includes(o.value))
                      .map((o) => o.label)
                      .join(', ')
                  : x.format === 'text'
                    ? String(a)
                    : x.options.find((o) => o.value === a)?.label;
              return (
                <li key={x.id}>
                  <button
                    className="flex w-full items-start gap-3 p-3 text-left hover:bg-white/[0.03]"
                    onClick={() => {
                      setPhase('questions');
                      go(i);
                    }}
                  >
                    <span className="w-6 shrink-0 text-xs text-stone">{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-ivory">{x.text}</span>
                      <span
                        className={cn(
                          'mt-0.5 block text-xs',
                          shown ? 'text-gold-pale' : x.required ? 'text-rose' : 'text-stone'
                        )}
                      >
                        {shown ?? (x.required ? 'Not answered — required' : 'Skipped')}
                      </span>
                    </span>
                    <Pencil className="mt-0.5 h-3.5 w-3.5 shrink-0 text-stone" aria-hidden />
                  </button>
                </li>
              );
            })}
          </ol>
          {error && (
            <div className="mt-4">
              <Notice tone="rose">{error}</Notice>
            </div>
          )}
          <div className="mt-6 flex flex-wrap justify-between gap-2">
            <Button
              variant="secondary"
              icon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => {
                setPhase('questions');
                go(qs.length - 1);
              }}
            >
              Back
            </Button>
            <Button onClick={submit} loading={submitting} icon={<Check className="h-4 w-4" />}>
              Submit
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!q) return null;
  const a = answers[q.id];
  const safety = q.safety?.(a);
  const showFollow = q.followUp && (q.showFollowUp?.(a) ?? false);
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4">
        <div className="mb-1.5 flex items-center justify-between text-xs text-stone">
          <span>
            Question {index + 1} of {qs.length}
            {q.section ? ` · ${q.section}` : ''}
          </span>
          <span className="flex items-center gap-1">
            {savedAt && (
              <>
                <Save className="h-3 w-3" />
                Saved on this device
              </>
            )}
          </span>
        </div>
        <div
          className="h-1.5 rounded-full bg-graphite-deep"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={qs.length}
          aria-valuenow={done}
          aria-label="Progress"
        >
          <div
            className="h-1.5 rounded-full bg-gold transition-all"
            style={{ width: `${(done / qs.length) * 100}%` }}
          />
        </div>
      </div>
      <Card key={q.id} className="animate-fade-up">
        {p.instructions && index === 0 && (
          <p className="mb-4 text-sm text-stone">{p.instructions}</p>
        )}
        <fieldset>
          <legend className="text-lg font-medium leading-snug text-ivory">{q.text}</legend>
          <p className="mt-1 text-xs text-stone">
            {q.format === 'multi'
              ? 'Choose all that apply.'
              : q.format === 'text'
                ? 'Optional — write as much or as little as you like.'
                : q.format === 'scenario'
                  ? 'Pick the response closest to what you would usually do.'
                  : 'Choose one.'}
            {!q.required && q.format !== 'text' ? ' You can skip this.' : ''}
          </p>
          <div className="mt-5">
            {q.format === 'text' ? (
              <Textarea
                value={(a as string) ?? ''}
                onChange={(e) => setAnswer(q.id, e.target.value)}
                maxLength={2000}
                aria-label={q.text}
              />
            ) : q.format === 'multi' ? (
              <div className="space-y-2">
                {q.options.map((o) => {
                  const on = Array.isArray(a) && a.includes(o.value);
                  return (
                    <label
                      key={o.value}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors',
                        on
                          ? 'border-gold bg-gold/10 text-ivory'
                          : 'border-divider bg-graphite-deep text-stone hover:border-gold-line hover:text-ivory'
                      )}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-divider bg-graphite text-gold focus:ring-gold"
                        checked={on}
                        onChange={() => {
                          const cur = Array.isArray(a) ? a : [];
                          setAnswer(
                            q.id,
                            on ? cur.filter((v) => v !== o.value) : [...cur, o.value]
                          );
                        }}
                      />
                      {o.label}
                    </label>
                  );
                })}
              </div>
            ) : (
              <div
                className={cn(
                  'grid gap-2',
                  q.format === 'likert7'
                    ? 'sm:grid-cols-7'
                    : q.format === 'likert5' || q.format === 'frequency'
                      ? 'sm:grid-cols-5'
                      : ''
                )}
                role="radiogroup"
                aria-label={q.text}
              >
                {q.options.map((o, i) => {
                  const on = a === o.value;
                  const grid =
                    q.format === 'likert5' || q.format === 'likert7' || q.format === 'frequency';
                  return (
                    <button
                      key={o.value}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setAnswer(q.id, o.value)}
                      className={cn(
                        'flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors',
                        grid &&
                          'sm:flex-col sm:justify-center sm:gap-1.5 sm:px-2 sm:text-center sm:text-xs',
                        on
                          ? 'border-gold bg-gold/10 text-ivory'
                          : 'border-divider bg-graphite-deep text-stone hover:border-gold-line hover:text-ivory'
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px]',
                          on ? 'border-gold bg-gold text-obsidian' : 'border-divider'
                        )}
                      >
                        {on ? <Check className="h-3.5 w-3.5" /> : i + 1}
                      </span>
                      <span>{o.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </fieldset>
        {safety && (
          <div className="mt-5">
            <Notice
              tone="rose"
              icon={<LifeBuoy className="h-4 w-4 text-rose" />}
              title="You don’t have to handle this alone"
            >
              {safety}{' '}
              <Link href="/soul#support" className="text-ivory underline underline-offset-2">
                See support options
              </Link>
              .
            </Notice>
          </div>
        )}
        {showFollow &&
          q.followUp &&
          (q.followUp.kind === 'note' ? (
            <div className="mt-5">
              <Notice tone="blue">{q.followUp.text}</Notice>
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-bronze bg-graphite-deep p-4">
              <label htmlFor={`fu-${q.id}`} className="text-sm font-medium text-ivory">
                {q.followUp.text}
              </label>
              <p className="text-xs text-stone">Optional follow-up · not scored</p>
              <Textarea
                id={`fu-${q.id}`}
                className="mt-2 min-h-[72px]"
                maxLength={1000}
                value={followUps[q.id] ?? ''}
                onChange={(e) => {
                  const f = { ...followUps, [q.id]: e.target.value };
                  setFollowUps(f);
                  persist(answers, f, index);
                }}
              />
            </div>
          ))}
        <div className="mt-7 flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            icon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => (index === 0 ? setPhase('intro') : go(index - 1))}
          >
            Back
          </Button>
          <div className="flex gap-2">
            {!q.required && !answered(a) && index < qs.length - 1 && (
              <Button variant="ghost" onClick={() => go(index + 1)}>
                Skip
              </Button>
            )}
            {index < qs.length - 1 ? (
              <Button
                onClick={() => go(index + 1)}
                disabled={q.required && !answered(a)}
                icon={<ArrowRight className="h-4 w-4" />}
              >
                Next
              </Button>
            ) : (
              <Button onClick={() => setPhase('review')} disabled={q.required && !answered(a)}>
                Review answers
              </Button>
            )}
          </div>
        </div>
      </Card>
      <div className="mt-4 flex justify-center gap-4 text-xs text-stone">
        <button className="hover:text-ivory" onClick={() => setPhase('review')}>
          Jump to review
        </button>
        <Link href="/assessments" className="hover:text-ivory">
          Save &amp; exit
        </Link>
      </div>
    </div>
  );
}
