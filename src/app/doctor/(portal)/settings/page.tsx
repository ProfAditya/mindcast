'use client';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth';
import { doctorApi } from '@/lib/api/services';
import { errorMessage } from '@/lib/api/client';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  ErrorState,
  Field,
  Input,
  LoadingBlock,
  PageHeader,
} from '@/components/ui';
import { fmtDate, titleCase } from '@/lib/utils';

export default function DoctorSettings() {
  const { refreshProfile, signOut } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['doctor', 'profile'], queryFn: doctorApi.profile });
  const [spec, setSpec] = useState('');
  useEffect(() => setSpec(q.data?.specialty ?? ''), [q.data]);
  const save = useMutation({
    mutationFn: () => doctorApi.updateProfile(spec.trim()),
    onSuccess: (d) => {
      qc.setQueryData(['doctor', 'profile'], d);
      refreshProfile();
      toast.success('Saved');
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <>
      <PageHeader eyebrow="Doctor portal" title="Settings" />
      {q.isLoading ? (
        <LoadingBlock rows={4} />
      ) : q.error || !q.data ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader title="Clinician profile" />
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-stone">Doctor code</dt>
                <dd className="font-mono text-gold">{q.data.doctor_code ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-stone">Registration number</dt>
                <dd className="font-mono text-ivory">{q.data.registration_number}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-stone">Status</dt>
                <dd>
                  <Badge tone="sage">{titleCase(q.data.verification_status)}</Badge>
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-stone">Verified</dt>
                <dd className="text-ivory">{fmtDate(q.data.verified_at)}</dd>
              </div>
            </dl>
            <form
              className="mt-5 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate();
              }}
            >
              <Field label="Specialty">
                {(id) => (
                  <Input
                    id={id}
                    value={spec}
                    maxLength={200}
                    onChange={(e) => setSpec(e.target.value)}
                  />
                )}
              </Field>
              <Button
                type="submit"
                loading={save.isPending}
                disabled={!spec.trim() || spec === q.data.specialty}
              >
                Save
              </Button>
            </form>
          </Card>
          <Card>
            <CardHeader title="Your responsibilities" />
            <ul className="space-y-2 text-sm text-stone">
              <li>• View only what each patient has granted, for their care.</li>
              <li>• Every view and document opening is recorded in the patient’s audit trail.</li>
              <li>• Self-reported data and exploratory insights are not clinical measurements.</li>
              <li>• Registration number changes require a new verification by an administrator.</li>
            </ul>
            <Button variant="danger" className="mt-5" onClick={() => signOut()}>
              Sign out
            </Button>
          </Card>
        </div>
      )}
    </>
  );
}
