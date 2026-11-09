'use client';
import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Clock, Lock, Search, ShieldCheck, Stethoscope, UserX } from 'lucide-react';
import { careApi } from '@/lib/api/services';
import { errorMessage } from '@/lib/api/client';
import { SHARE_CATEGORIES, type Connection, type ShareCategory } from '@/lib/api/types';
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
} from '@/components/ui';
import { CATEGORY_INFO, NEVER_SHARED } from '@/lib/share';
import { cn, fmtDate, localISODate } from '@/lib/utils';

export default function DoctorConnectionPage() {
  const q = useQuery({ queryKey: ['connections'], queryFn: careApi.connections });
  const list = (q.data ?? []).filter((c) => c.my_role === 'patient');
  const current = list.filter((c) => c.status === 'approved' || c.status === 'pending');
  const past = list.filter((c) => c.status === 'rejected' || c.status === 'revoked');
  return (
    <>
      <PageHeader
        eyebrow="Care & privacy"
        title="Doctor connection"
        subtitle="Connect with a verified clinician and choose exactly what they can see. You can change or revoke access at any time."
      />
      <div className="grid gap-5 lg:grid-cols-[1fr_1.5fr]">
        <div className="space-y-5">
          <Connect existing={list} />
          <Card>
            <CardHeader title="Never shared" icon={<Lock className="h-4 w-4" />} />
            <ul className="space-y-1.5 text-sm text-stone">
              {NEVER_SHARED.map((n) => (
                <li key={n}>• {n}</li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-stone">
              Every time a doctor opens shared data, it’s recorded in your audit trail in the
              Privacy centre.
            </p>
          </Card>
        </div>
        <div className="space-y-4">
          {q.isLoading ? (
            <LoadingBlock rows={4} />
          ) : q.error ? (
            <ErrorState error={q.error} onRetry={() => q.refetch()} />
          ) : !current.length ? (
            <EmptyState
              icon={<Stethoscope className="h-5 w-5" />}
              title="No doctor connected"
              body="Ask your clinician for their NEURIX doctor code and enter it here."
            />
          ) : (
            current.map((c) => <ConnectionCard key={c.id} c={c} />)
          )}
          {past.length > 0 && (
            <details className="surface p-5">
              <summary className="cursor-pointer text-sm text-stone">
                Past connections ({past.length})
              </summary>
              <ul className="mt-3 space-y-2 text-sm">
                {past.map((c) => (
                  <li key={c.id} className="flex justify-between gap-3">
                    <span className="text-ivory">{c.other_party_name ?? 'Clinician'}</span>
                    <span className="text-stone">
                      {c.status} · {fmtDate(c.revoked_at ?? c.responded_at ?? c.requested_at)}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>
    </>
  );
}

function Connect({ existing }: { existing: Connection[] }) {
  const qc = useQueryClient();
  const [code, setCode] = useState('');
  const look = useMutation({ mutationFn: (c: string) => careApi.lookup(c) });
  const req = useMutation({
    mutationFn: (c: string) => careApi.request(c),
    onSuccess: () => {
      toast.success('Request sent. Your doctor needs to accept it.');
      setCode('');
      look.reset();
      qc.invalidateQueries({ queryKey: ['connections'] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const found = look.data;
  const already =
    found &&
    existing.some(
      (c) =>
        c.other_party_id === found.doctor_id && (c.status === 'pending' || c.status === 'approved')
    );
  return (
    <Card>
      <CardHeader title="Connect a doctor" icon={<Search className="h-4 w-4" />} />
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (code.trim()) look.mutate(code.trim().toUpperCase());
        }}
      >
        <Field
          label="Doctor code"
          hint="Your clinician can find this in their NEURIX doctor settings."
        >
          {(id) => (
            <Input
              id={id}
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                look.reset();
              }}
              className="font-mono uppercase"
              autoComplete="off"
            />
          )}
        </Field>
        <Button type="submit" variant="secondary" loading={look.isPending} disabled={!code.trim()}>
          Find doctor
        </Button>
      </form>
      {look.error && (
        <div className="mt-3">
          <Notice tone="rose">{errorMessage(look.error)}</Notice>
        </div>
      )}
      {found && (
        <div className="mt-4 rounded-xl border border-gold/30 bg-gold/5 p-4">
          <p className="flex items-center gap-2 font-medium text-ivory">
            <ShieldCheck className="h-4 w-4 text-sage" />
            {found.full_name ?? 'Verified clinician'}
          </p>
          <p className="text-sm text-stone">
            {found.specialty ?? 'Specialty not listed'} · verified on NEURIX
          </p>
          <p className="mt-2 text-xs text-stone">
            Sending a request shares nothing. After they accept, you choose which categories to
            share.
          </p>
          <Button
            className="mt-3"
            size="sm"
            loading={req.isPending}
            disabled={!!already}
            onClick={() => req.mutate(code.trim().toUpperCase())}
          >
            {already ? 'Already connected or pending' : 'Send connection request'}
          </Button>
        </div>
      )}
    </Card>
  );
}

function ConnectionCard({ c }: { c: Connection }) {
  const qc = useQueryClient();
  const [revoke, setRevoke] = useState(false);
  const [expiry, setExpiry] = useState<Record<string, string>>({});
  const perms = useQuery({
    queryKey: ['permissions', c.id],
    queryFn: () => careApi.permissions(c.id),
    enabled: c.status === 'approved',
  });
  const inval = () => {
    qc.invalidateQueries({ queryKey: ['permissions', c.id] });
    qc.invalidateQueries({ queryKey: ['connections'] });
  };
  const grant = useMutation({
    mutationFn: ({ cat, exp }: { cat: ShareCategory; exp: string | null }) =>
      careApi.grant(c.id, cat, exp),
    onSuccess: () => {
      toast.success('Access granted');
      inval();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const deny = useMutation({
    mutationFn: (cat: ShareCategory) => careApi.revokeCategory(c.id, cat),
    onSuccess: () => {
      toast.success('Access removed');
      inval();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const rev = useMutation({
    mutationFn: () => careApi.revoke(c.id),
    onSuccess: () => {
      toast.success('Connection ended');
      setRevoke(false);
      inval();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const activeSet = new Map((perms.data ?? []).filter((p) => p.active).map((p) => [p.category, p]));

  return (
    <Card>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{c.other_party_name ?? 'Clinician'}</p>
            <Badge tone={c.status === 'approved' ? 'sage' : 'blue'}>
              {c.status === 'approved' ? (
                'Connected'
              ) : (
                <>
                  <Clock className="h-3 w-3" />
                  Waiting for doctor
                </>
              )}
            </Badge>
          </div>
          <p className="text-xs text-stone">
            {c.doctor_specialty ?? 'Clinician'} · requested {fmtDate(c.requested_at)}
            {c.approved_at ? ` · connected ${fmtDate(c.approved_at)}` : ''}
          </p>
        </div>
        <Button
          size="sm"
          variant="danger"
          icon={<UserX className="h-3.5 w-3.5" />}
          onClick={() => setRevoke(true)}
        >
          {c.status === 'pending' ? 'Cancel request' : 'End connection'}
        </Button>
      </div>
      {c.status === 'pending' ? (
        <p className="mt-4 text-sm text-stone">
          Nothing is shared. Once your doctor accepts, you’ll be able to choose categories here.
        </p>
      ) : perms.isLoading ? (
        <div className="mt-4">
          <LoadingBlock rows={3} />
        </div>
      ) : perms.error ? (
        <div className="mt-4">
          <ErrorState error={perms.error} onRetry={() => perms.refetch()} />
        </div>
      ) : (
        <>
          <p className="mt-4 text-sm text-stone">
            {activeSet.size
              ? `Sharing ${activeSet.size} of ${SHARE_CATEGORIES.length} categories.`
              : 'Nothing shared yet. Switch on only what’s useful for your care.'}
          </p>
          <ul className="mt-3 divide-y divide-divider rounded-xl border border-bronze">
            {SHARE_CATEGORIES.map((cat) => {
              const p = activeSet.get(cat);
              const on = !!p;
              return (
                <li key={cat} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-ivory">{CATEGORY_INFO[cat].label}</p>
                    <p className="text-xs text-stone">
                      {CATEGORY_INFO[cat].about}
                      {p?.expires_at
                        ? ` · until ${fmtDate(p.expires_at)}`
                        : on
                          ? ' · no expiry'
                          : ''}
                    </p>
                  </div>
                  {!on && (
                    <Input
                      type="date"
                      min={localISODate()}
                      aria-label={`Expiry for ${CATEGORY_INFO[cat].label} (optional)`}
                      value={expiry[cat] ?? ''}
                      onChange={(e) => setExpiry({ ...expiry, [cat]: e.target.value })}
                      className="h-9 py-1 text-xs sm:w-40"
                    />
                  )}
                  <button
                    role="switch"
                    aria-checked={on}
                    aria-label={`Share ${CATEGORY_INFO[cat].label}`}
                    disabled={grant.isPending || deny.isPending}
                    onClick={() =>
                      on
                        ? deny.mutate(cat)
                        : grant.mutate({
                            cat,
                            exp: expiry[cat]
                              ? new Date(`${expiry[cat]}T23:59:59`).toISOString()
                              : null,
                          })
                    }
                    className={cn(
                      'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors disabled:opacity-50',
                      on ? 'border-gold bg-gold' : 'border-divider bg-graphite-deep'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 rounded-full transition-transform',
                        on ? 'translate-x-6 bg-obsidian' : 'translate-x-1 bg-stone'
                      )}
                    />
                    <span className="sr-only">{on ? 'On' : 'Off'}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-xs text-stone">
            Optional: choose an end date before switching a category on. Access stops automatically
            after it.
          </p>
        </>
      )}
      <ConfirmDialog
        open={revoke}
        onClose={() => setRevoke(false)}
        onConfirm={() => rev.mutate()}
        loading={rev.isPending}
        confirmLabel={c.status === 'pending' ? 'Cancel request' : 'End connection'}
        title={c.status === 'pending' ? 'Cancel this request?' : 'End this connection?'}
        body="Your doctor will immediately lose access to everything you shared. You can connect again later with their code."
      />
    </Card>
  );
}
