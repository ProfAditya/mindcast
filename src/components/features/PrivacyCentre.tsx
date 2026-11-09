'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Eye, FileClock, HardDrive, Lock, Sparkles, Stethoscope } from 'lucide-react';
import { useAuth } from '@/context/auth';
import { aiApi, careApi } from '@/lib/api/services';
import { errorMessage } from '@/lib/api/client';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  LoadingBlock,
  PageHeader,
  Tabs,
} from '@/components/ui';
import { CATEGORY_INFO, NEVER_SHARED } from '@/lib/share';
import { localAttempts } from '@/lib/assessments/storage';
import { cn, fmtDateTime, titleCase } from '@/lib/utils';

type Tab = 'overview' | 'ai' | 'consents' | 'audit';

export default function PrivacyCentre() {
  const [tab, setTab] = useState<Tab>('overview');
  return (
    <>
      <PageHeader
        eyebrow="Care & privacy"
        title="Privacy centre"
        subtitle="See and control who and what can use your data."
        actions={
          <Link href="/terms" className="text-sm text-stone hover:text-ivory">
            Terms
          </Link>
        }
      />
      <Tabs
        label="Privacy sections"
        value={tab}
        onChange={setTab}
        tabs={[
          { key: 'overview', label: 'Overview' },
          { key: 'ai', label: 'AI consent' },
          { key: 'consents', label: 'Consent history' },
          { key: 'audit', label: 'Access log' },
        ]}
      />
      {tab === 'overview' && <Overview />}
      {tab === 'ai' && <AiConsent />}
      {tab === 'consents' && <Consents />}
      {tab === 'audit' && <Audit />}
    </>
  );
}

function Overview() {
  const { profile } = useAuth();
  const conns = useQuery({ queryKey: ['connections'], queryFn: careApi.connections });
  const ai = useQuery({ queryKey: ['ai', 'consent'], queryFn: aiApi.consent });
  const [deviceCount, setDeviceCount] = useState(0);
  const [clear, setClear] = useState(false);
  useEffect(() => setDeviceCount(localAttempts.list(profile!.id).length), [profile]);
  const sharing = (conns.data ?? []).filter(
    (c) => c.my_role === 'patient' && c.status === 'approved'
  );
  const clearDevice = () => {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(`neurix:v1:${profile!.id}:`))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
    setDeviceCount(0);
    setClear(false);
    toast.success('Removed from this device');
  };
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader
          title="Doctor sharing"
          icon={<Stethoscope className="h-4 w-4" />}
          action={
            <Link href="/doctor-connection" className="text-xs text-gold-pale hover:text-gold">
              Manage
            </Link>
          }
        />
        {conns.isLoading ? (
          <LoadingBlock rows={2} />
        ) : conns.error ? (
          <ErrorState error={conns.error} onRetry={() => conns.refetch()} />
        ) : !sharing.length ? (
          <p className="text-sm text-stone">You’re not sharing anything with a doctor.</p>
        ) : (
          <ul className="space-y-3">
            {sharing.map((c) => (
              <li key={c.id}>
                <p className="text-sm font-medium text-ivory">
                  {c.other_party_name ?? 'Clinician'}
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {c.active_permissions.length ? (
                    c.active_permissions.map((p) => (
                      <Badge key={p.category} tone="gold">
                        {CATEGORY_INFO[p.category]?.label ?? p.category}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-stone">Connected, nothing shared</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card>
        <CardHeader title="AI processing" icon={<Sparkles className="h-4 w-4" />} />
        {ai.isLoading ? (
          <LoadingBlock rows={2} />
        ) : ai.error ? (
          <ErrorState error={ai.error} onRetry={() => ai.refetch()} />
        ) : (
          ai.data && (
            <ul className="space-y-2 text-sm">
              {(['general', 'journal_entries', 'medical'] as const).map((s) => (
                <li key={s} className="flex justify-between gap-3">
                  <span className="text-stone">
                    {s === 'general'
                      ? 'SOUL (general)'
                      : s === 'journal_entries'
                        ? 'Journal entries'
                        : 'Medical information'}
                  </span>
                  <Badge tone={ai.data.scopes[s] ? 'sage' : 'neutral'}>
                    {ai.data.scopes[s] ? 'Allowed' : 'Off'}
                  </Badge>
                </li>
              ))}
            </ul>
          )
        )}
      </Card>
      <Card>
        <CardHeader title="Never shared with doctors" icon={<Lock className="h-4 w-4" />} />
        <ul className="space-y-1.5 text-sm text-stone">
          {NEVER_SHARED.map((n) => (
            <li key={n}>• {n}</li>
          ))}
        </ul>
      </Card>
      <Card>
        <CardHeader title="Stored on this device" icon={<HardDrive className="h-4 w-4" />} />
        <p className="text-sm text-stone">
          {deviceCount} exploratory assessment result{deviceCount === 1 ? '' : 's'} and any
          in-progress drafts are stored in this browser only.
        </p>
        <Button
          variant="danger"
          size="sm"
          className="mt-4"
          onClick={() => setClear(true)}
          disabled={!deviceCount}
        >
          Remove from this device
        </Button>
        <ConfirmDialog
          open={clear}
          onClose={() => setClear(false)}
          onConfirm={clearDevice}
          title="Remove device-stored results?"
          body="This deletes exploratory results and drafts saved in this browser. Your account data on the server is not affected."
          confirmLabel="Remove"
        />
      </Card>
    </div>
  );
}

function AiConsent() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['ai', 'consent'], queryFn: aiApi.consent });
  const set = useMutation({
    mutationFn: ({
      scope,
      granted,
    }: {
      scope: 'general' | 'journal_entries' | 'medical';
      granted: boolean;
    }) => aiApi.setConsent(scope, granted),
    onSuccess: (d) => {
      qc.setQueryData(['ai', 'consent'], d);
      qc.invalidateQueries({ queryKey: ['consents'] });
      toast.success('Consent updated');
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  if (q.isLoading) return <LoadingBlock rows={3} />;
  if (q.error || !q.data) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  const d = q.data;
  const rows = [
    ['general', 'Use SOUL', 'Required for any AI feature.'],
    [
      'journal_entries',
      'Let SOUL read my journal',
      'Only used when you tick “Include my journal” on a message.',
    ],
    [
      'medical',
      'Let SOUL read my medical information',
      'Only used when you tick “Include medical info” on a message.',
    ],
  ] as const;
  return (
    <Card>
      <CardHeader
        title="AI consent"
        subtitle={`Consent version ${d.version}${d.provider ? ` · provider: ${d.provider}` : ''}`}
      />
      <ul className="space-y-4">
        {rows.map(([scope, title, hint]) => {
          const on = d.scopes[scope];
          const blocked = scope !== 'general' && !d.scopes.general;
          return (
            <li key={scope} className="rounded-xl border border-bronze bg-graphite-deep p-4">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <p className="font-medium text-ivory">{title}</p>
                  <p className="text-xs text-stone">{hint}</p>
                </div>
                <button
                  role="switch"
                  aria-checked={on}
                  aria-label={title}
                  disabled={set.isPending || (blocked && !on)}
                  onClick={() => set.mutate({ scope, granted: !on })}
                  className={cn(
                    'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors disabled:opacity-50',
                    on ? 'border-gold bg-gold' : 'border-divider bg-graphite'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 rounded-full transition-transform',
                      on ? 'translate-x-6 bg-obsidian' : 'translate-x-1 bg-stone'
                    )}
                  />
                </button>
              </div>
              {d.texts[scope] && (
                <p className="mt-3 border-l-2 border-gold-line pl-3 text-xs text-stone">
                  {d.texts[scope]}
                </p>
              )}
              {blocked && <p className="mt-2 text-xs text-stone">Turn on “Use SOUL” first.</p>}
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-xs text-stone">
        Withdrawing consent stops future AI processing. It doesn’t delete past conversations — you
        can delete those in SOUL.
      </p>
    </Card>
  );
}

function Consents() {
  const q = useQuery({ queryKey: ['consents'], queryFn: careApi.consents });
  if (q.isLoading) return <LoadingBlock rows={4} />;
  if (q.error) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  if (!q.data?.length)
    return (
      <EmptyState
        icon={<FileClock className="h-5 w-5" />}
        title="No consent changes recorded yet"
      />
    );
  return (
    <Card className="p-0 sm:p-0">
      <ul className="divide-y divide-divider">
        {q.data.map((c) => (
          <li
            key={c.id}
            className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:gap-4"
          >
            <span className="w-40 shrink-0 text-xs text-stone">{fmtDateTime(c.recorded_at)}</span>
            <span className="flex-1 text-sm text-ivory">
              {titleCase(c.consent_type)}
              {c.category
                ? ` · ${CATEGORY_INFO[c.category as keyof typeof CATEGORY_INFO]?.label ?? c.category}`
                : ''}
              {typeof c.details?.scope === 'string' ? ` · ${titleCase(c.details.scope)}` : ''}
            </span>
            <Badge tone={c.consent_status === 'granted' ? 'sage' : 'neutral'}>
              {titleCase(c.consent_status)}
            </Badge>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Audit() {
  const q = useQuery({ queryKey: ['audit'], queryFn: careApi.auditTrail });
  if (q.isLoading) return <LoadingBlock rows={4} />;
  if (q.error) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  if (!q.data?.length)
    return (
      <EmptyState
        icon={<Eye className="h-5 w-5" />}
        title="No access recorded"
        body="When a connected doctor views data you’ve shared, it appears here."
      />
    );
  return (
    <Card className="p-0 sm:p-0">
      <ul className="divide-y divide-divider">
        {q.data.map((a) => (
          <li
            key={a.id}
            className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:gap-4"
          >
            <span className="w-40 shrink-0 text-xs text-stone">{fmtDateTime(a.created_at)}</span>
            <span className="flex-1 text-sm text-ivory">
              {titleCase(a.action)}
              {a.resource_type ? ` · ${titleCase(a.resource_type)}` : ''}
              {typeof a.details?.category === 'string'
                ? ` · ${CATEGORY_INFO[a.details.category as keyof typeof CATEGORY_INFO]?.label ?? a.details.category}`
                : ''}
            </span>
            <span className="text-xs text-stone">
              {a.actor_id === a.patient_id ? 'You' : 'Connected doctor'}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
