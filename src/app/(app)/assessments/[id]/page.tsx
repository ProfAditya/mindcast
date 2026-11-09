'use client';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth';
import { assessmentApi } from '@/lib/api/services';
import { errorMessage } from '@/lib/api/client';
import {
  getModule,
  formFor,
  needsFollowUp,
  scoreExploratory,
  type Length,
} from '@/lib/assessments/engine';
import { VALIDATED, isValidated } from '@/lib/assessments/validated';
import { localAttempts, newId } from '@/lib/assessments/storage';
import { AssessmentRunner } from '@/components/features/AssessmentRunner';
import { ButtonLink, EmptyState, ErrorState, LoadingBlock } from '@/components/ui';

export default function TakeAssessment() {
  const { id } = useParams<{ id: string }>();
  return isValidated(id) ? <Validated code={id} /> : <Exploratory id={id} />;
}

function Validated({ code }: { code: keyof typeof VALIDATED }) {
  const { profile } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const inst = useQuery({
    queryKey: ['instrument', code],
    queryFn: () => assessmentApi.instrument(code),
  });
  if (inst.isLoading) return <LoadingBlock rows={5} />;
  if (inst.error || !inst.data)
    return (
      <ErrorState
        error={inst.error}
        onRetry={() => inst.refetch()}
        title="Couldn’t load this questionnaire"
      />
    );
  const I = inst.data;
  const v = VALIDATED[code];
  const options = I.options.map((o) => ({ value: String(o.value), label: o.label }));
  return (
    <AssessmentRunner
      uid={profile!.id}
      draftKey={code}
      version={I.version}
      title={`${v.title} · ${I.name}`}
      kind="validated"
      instructions={I.instructions}
      intro={
        <>
          <p>{v.about}</p>
          <p>{I.instructions}</p>
          <p>
            Your answers are sent to the NEURIX server, which scores them with the published rules
            and stores the result in your account. Results are never edited after submission.
          </p>
        </>
      }
      questionsFor={() =>
        I.items.map((it) => ({
          id: it.id,
          text: it.text,
          format: 'single' as const,
          options,
          required: true,
          safety:
            code === 'phq9' && it.id === 'phq9_9'
              ? (a) =>
                  a !== undefined && a !== '0'
                    ? 'Thank you for answering honestly. If you are in danger or might act on these thoughts, contact your local emergency number now, or a crisis line.'
                    : null
              : undefined,
        }))
      }
      onSubmit={async ({ answers }) => {
        const body = Object.fromEntries(
          Object.entries(answers).map(([k, val]) => [k, Number(val)])
        );
        try {
          const r = await assessmentApi.submit(code, body);
          qc.invalidateQueries({ queryKey: ['assessments'] });
          qc.invalidateQueries({ queryKey: ['overview'] });
          router.push(`/assessments/${code}/results/${r.id}`);
        } catch (e) {
          throw new Error(`${errorMessage(e)} Your answers are still saved on this device.`);
        }
      }}
    />
  );
}

function Exploratory({ id }: { id: string }) {
  const { profile } = useAuth();
  const router = useRouter();
  const m = getModule(id);
  if (!m)
    return (
      <EmptyState
        title="This assessment doesn’t exist"
        body="It may have been renamed. Choose one from the Assessment Centre."
        action={<ButtonLink href="/assessments">Assessment Centre</ButtonLink>}
      />
    );
  const section = (d: string) => m.domains.find((x) => x.id === d)?.label;
  return (
    <AssessmentRunner
      uid={profile!.id}
      draftKey={m.id}
      version={m.version}
      title={m.title}
      kind="exploratory"
      lengths={m.lengths}
      defaultLength={m.lengths[0]}
      intro={
        <>
          <p>{m.description}</p>
          <p>Covers: {m.domains.map((d) => d.label).join(', ')}.</p>
          <p>
            This is a NEURIX reflection module, not a validated clinical test. Answer for the past
            two weeks or so. There are no right or wrong answers, and you can skip any question.
          </p>
          <p>
            Situational questions ask how you would probably respond. Your choice describes what you
            expect, not proof of how you behave.
          </p>
          {m.sensitive && (
            <p className="rounded-xl border border-rose/30 bg-rose/5 p-3 text-ivory">
              {m.sensitive}
            </p>
          )}
        </>
      }
      questionsFor={(len: Length) =>
        formFor(m, len).map((q) => ({
          id: q.id,
          text: q.text,
          format: q.format,
          options: q.options,
          required: false,
          section: section(q.domain),
          followUp: q.followUp,
          showFollowUp: (a) => needsFollowUp(q, a),
        }))
      }
      onSubmit={async ({ answers, followUps, length, started_at }) => {
        const result = scoreExploratory(m, length, answers);
        const attempt = {
          id: newId(),
          module: m.id,
          version: m.version,
          length,
          answers,
          followUps,
          started_at,
          completed_at: new Date().toISOString(),
          result,
          storage: 'device' as const,
        };
        if (!localAttempts.add(profile!.id, attempt))
          throw new Error('Couldn’t save on this device (storage may be full or disabled).');
        router.push(`/assessments/${m.id}/results/${attempt.id}`);
      }}
    />
  );
}
