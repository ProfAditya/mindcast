'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ClipboardCheck, Compass, History } from 'lucide-react';
import { useAuth } from '@/context/auth';
import { assessmentApi } from '@/lib/api/services';
import { MODULES } from '@/lib/assessments/engine';
import { VALIDATED, type ValidatedCode } from '@/lib/assessments/validated';
import { drafts, localAttempts, type LocalAttempt } from '@/lib/assessments/storage';
import {
  Badge,
  ButtonLink,
  Card,
  ErrorState,
  LoadingBlock,
  Notice,
  PageHeader,
} from '@/components/ui';
import { fmtDate } from '@/lib/utils';

export default function AssessmentCentre() {
  const { profile } = useAuth();
  const uid = profile!.id;
  const results = useQuery({
    queryKey: ['assessments', 'list'],
    queryFn: () => assessmentApi.list(),
  });
  const [local, setLocal] = useState<LocalAttempt[]>([]);
  const [draftIds, setDraftIds] = useState<string[]>([]);
  useEffect(() => {
    setLocal(localAttempts.list(uid));
    setDraftIds(
      [...MODULES.map((m) => m.id), ...Object.keys(VALIDATED)].filter((id) => drafts.get(uid, id))
    );
  }, [uid]);

  return (
    <>
      <PageHeader
        eyebrow="My Health"
        title="Assessment Centre"
        subtitle="Structured questionnaires to help you reflect. None of them diagnose anything."
        actions={
          <ButtonLink
            href="/assessment-history"
            variant="secondary"
            icon={<History className="h-4 w-4" />}
          >
            History &amp; comparisons
          </ButtonLink>
        }
      />

      <section aria-labelledby="validated-h">
        <div className="mb-3 flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-sage" />
          <h2 id="validated-h" className="font-semibold">
            Validated screeners
          </h2>
          <Badge tone="sage">Scored on the NEURIX server</Badge>
        </div>
        <p className="mb-4 max-w-3xl text-sm text-stone">
          Published questionnaires with standard scoring. A result is a screening indication to
          discuss with a professional, not a diagnosis.
        </p>
        {results.error && (
          <div className="mb-4">
            <ErrorState
              error={results.error}
              onRetry={() => results.refetch()}
              title="Couldn’t load your past results"
            />
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-3">
          {(Object.keys(VALIDATED) as ValidatedCode[]).map((code) => {
            const v = VALIDATED[code];
            const last = results.data?.items.find((r) => r.assessment_type === code);
            return (
              <Card key={code} className="flex flex-col">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-lg font-semibold">{v.title}</p>
                  {draftIds.includes(code) && <Badge tone="gold">Draft saved</Badge>}
                </div>
                <p className="text-xs text-stone">{v.name}</p>
                <p className="mt-3 flex-1 text-sm text-stone">{v.about}</p>
                <p className="mt-4 text-xs text-stone">
                  {results.isLoading
                    ? 'Loading…'
                    : last
                      ? `Last: ${last.result.total_score}/${last.result.max_score} · ${last.result.severity} · ${fmtDate(last.completed_at)}`
                      : 'Not taken yet'}
                </p>
                <div className="mt-4 flex gap-2">
                  <ButtonLink href={`/assessments/${code}`} size="sm">
                    {draftIds.includes(code) ? 'Resume' : 'Start'}
                  </ButtonLink>
                  {last && (
                    <ButtonLink
                      href={`/assessments/${code}/results/${last.id}`}
                      size="sm"
                      variant="ghost"
                    >
                      Last result
                    </ButtonLink>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="explore-h" className="mt-10">
        <div className="mb-3 flex items-center gap-2">
          <Compass className="h-4 w-4 text-softblue" />
          <h2 id="explore-h" className="font-semibold">
            Exploratory reflection modules
          </h2>
          <Badge tone="blue">Not clinically validated</Badge>
        </div>
        <p className="mb-4 max-w-3xl text-sm text-stone">
          Seven NEURIX modules for self-reflection, from 30 to 50 questions. Scoring is fixed and
          versioned — the same answers always give the same result. Personality and thinking styles
          are shown as tendencies between two poles, never as types or labels.
        </p>
        <Notice tone="blue" title="Saved on this device for now">
          Exploratory results are stored in this browser only, because the NEURIX server doesn’t
          accept these modules yet. They won’t appear on other devices and can’t be shared with a
          doctor until server storage is added.
        </Notice>
        {results.isLoading && (
          <div className="mt-4">
            <LoadingBlock rows={2} />
          </div>
        )}
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {MODULES.map((m) => {
            const mine = local.filter((a) => a.module === m.id);
            return (
              <Card key={m.id} className="flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{m.title}</p>
                    <p className="text-xs text-stone">{m.tagline}</p>
                  </div>
                  {draftIds.includes(m.id) && <Badge tone="gold">Draft</Badge>}
                </div>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {m.domains.map((d) => (
                    <li key={d.id}>
                      <Badge>{d.label}</Badge>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 flex-1 text-xs text-stone">
                  {mine.length
                    ? `${mine.length} attempt${mine.length > 1 ? 's' : ''} · last ${fmtDate(mine[0].completed_at)} · overall ${mine[0].result.overall ?? '—'}/100`
                    : 'No attempts yet'}{' '}
                  · {m.lengths.join(' / ')} questions · v{m.version}
                </p>
                {m.sensitive && (
                  <p className="mt-2 text-[11px] text-rose">
                    Includes optional sensitive questions
                  </p>
                )}
                <div className="mt-4 flex gap-2">
                  <ButtonLink
                    href={`/assessments/${m.id}`}
                    size="sm"
                    icon={<ArrowRight className="h-3.5 w-3.5" />}
                  >
                    {draftIds.includes(m.id) ? 'Resume' : 'Start'}
                  </ButtonLink>
                  {mine[0] && (
                    <ButtonLink
                      href={`/assessments/${m.id}/results/${mine[0].id}`}
                      size="sm"
                      variant="ghost"
                    >
                      Last result
                    </ButtonLink>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
        <p className="mt-6 text-xs text-stone">
          Want to see how your answers are scored? Every result page explains the method.{' '}
          <Link href="/assessment-history" className="text-gold-pale hover:text-gold">
            Compare attempts
          </Link>
          .
        </p>
      </section>
    </>
  );
}
