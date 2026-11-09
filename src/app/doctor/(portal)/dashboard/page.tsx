'use client';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ChevronRight, Copy, UserPlus, Users } from 'lucide-react';
import { useAuth } from '@/context/auth';
import { careApi, doctorApi } from '@/lib/api/services';
import { errorMessage } from '@/lib/api/client';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  LoadingBlock,
  PageHeader,
  Stat,
} from '@/components/ui';
import { fmtDate, greeting } from '@/lib/utils';

export default function DoctorDashboard() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const patients = useQuery({ queryKey: ['doctor', 'patients'], queryFn: doctorApi.patients });
  const conns = useQuery({ queryKey: ['connections'], queryFn: careApi.connections });
  const pending = (conns.data ?? []).filter(
    (c) => c.my_role === 'doctor' && c.status === 'pending'
  );
  const respond = useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean }) => careApi.respond(id, accept),
    onSuccess: (_d, v) => {
      toast.success(v.accept ? 'Connection accepted' : 'Request declined');
      qc.invalidateQueries({ queryKey: ['connections'] });
      qc.invalidateQueries({ queryKey: ['doctor', 'patients'] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const approved = (patients.data ?? []).filter((p) => p.status === 'approved');
  const code = profile?.doctor?.doctor_code;
  return (
    <>
      <PageHeader
        eyebrow="Doctor portal"
        title={greeting(profile?.full_name ? `Dr ${profile.full_name.split(' ').at(-1)}` : null)}
        subtitle="Patients choose what to share with you. Every view is recorded in their audit trail."
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Connected patients" value={patients.isLoading ? '…' : approved.length} />
        <Stat
          label="Pending requests"
          value={conns.isLoading ? '…' : pending.length}
          tone={pending.length ? 'gold' : undefined}
        />
        <Stat
          label="Specialty"
          value={<span className="text-base">{profile?.doctor?.specialty ?? '—'}</span>}
        />
        <div className="rounded-xl border border-bronze bg-graphite-deep p-4">
          <p className="label-eyebrow">Your doctor code</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="font-mono text-xl font-semibold text-gold">{code ?? '—'}</span>
            {code && (
              <button
                onClick={() =>
                  navigator.clipboard?.writeText(code).then(() => toast.success('Code copied'))
                }
                className="rounded-lg p-1.5 text-stone hover:text-ivory"
                aria-label="Copy doctor code"
              >
                <Copy className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-stone">Patients enter this to request a connection.</p>
        </div>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Connection requests" icon={<UserPlus className="h-4 w-4" />} />
          {conns.isLoading ? (
            <LoadingBlock rows={2} />
          ) : conns.error ? (
            <ErrorState error={conns.error} onRetry={() => conns.refetch()} />
          ) : !pending.length ? (
            <p className="text-sm text-stone">No pending requests.</p>
          ) : (
            <ul className="space-y-2">
              {pending.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-col gap-2 rounded-xl border border-bronze bg-graphite-deep p-3 sm:flex-row sm:items-center"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ivory">
                      {c.other_party_name ?? 'Patient'}
                    </p>
                    <p className="text-xs text-stone">Requested {fmtDate(c.requested_at)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={respond.isPending}
                      onClick={() => respond.mutate({ id: c.id, accept: false })}
                    >
                      Decline
                    </Button>
                    <Button
                      size="sm"
                      disabled={respond.isPending}
                      onClick={() => respond.mutate({ id: c.id, accept: true })}
                    >
                      Accept
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-stone">
            Accepting gives you no data by itself — the patient then grants categories.
          </p>
        </Card>
        <Card>
          <CardHeader
            title="Recent patients"
            icon={<Users className="h-4 w-4" />}
            action={
              <Link href="/doctor/patients" className="text-xs text-gold-pale hover:text-gold">
                All patients
              </Link>
            }
          />
          {patients.isLoading ? (
            <LoadingBlock rows={3} />
          ) : patients.error ? (
            <ErrorState error={patients.error} onRetry={() => patients.refetch()} />
          ) : !approved.length ? (
            <EmptyState
              title="No connected patients yet"
              body="Share your doctor code with patients who use NEURIX."
            />
          ) : (
            <ul className="divide-y divide-divider">
              {approved.slice(0, 6).map((p) => (
                <li key={p.link_id}>
                  <Link
                    href={`/doctor/patients/${p.patient_id}/overview`}
                    className="flex items-center gap-3 py-2.5 hover:text-gold-pale"
                  >
                    <span className="flex-1 text-sm text-ivory">{p.patient_name ?? 'Patient'}</span>
                    <Badge>{p.active_permissions.length} shared</Badge>
                    <ChevronRight className="h-4 w-4 text-stone" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
