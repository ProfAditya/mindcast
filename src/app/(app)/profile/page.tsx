'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth';
import { profileApi } from '@/lib/api/services';
import { errorMessage } from '@/lib/api/client';
import { Badge, Button, Card, CardHeader, Field, Input, PageHeader } from '@/components/ui';
import { fmtDate, localISODate, titleCase } from '@/lib/utils';

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  useEffect(() => {
    setName(profile?.full_name ?? '');
    setDob(profile?.date_of_birth ?? '');
  }, [profile]);
  const save = useMutation({
    mutationFn: () =>
      profileApi.update({ full_name: name.trim() || null, date_of_birth: dob || null }),
    onSuccess: async () => {
      await refreshProfile();
      toast.success('Profile updated');
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  if (!profile) return null;
  const dirty = name !== (profile.full_name ?? '') || dob !== (profile.date_of_birth ?? '');
  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Profile"
        subtitle="Basic details used across NEURIX and shown to clinicians you connect with."
      />
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader title="Personal details" />
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
          >
            <Field label="Full name">
              {(id) => (
                <Input
                  id={id}
                  value={name}
                  maxLength={200}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              )}
            </Field>
            <Field label="Date of birth" hint="Optional.">
              {(id) => (
                <Input
                  id={id}
                  type="date"
                  value={dob}
                  max={localISODate()}
                  onChange={(e) => setDob(e.target.value)}
                  className="sm:max-w-[220px]"
                />
              )}
            </Field>
            <Field label="Email" hint="Your sign-in email cannot be changed here.">
              {(id) => <Input id={id} value={profile.email ?? ''} disabled readOnly />}
            </Field>
            <Button type="submit" loading={save.isPending} disabled={!dirty}>
              Save changes
            </Button>
          </form>
        </Card>
        <Card>
          <CardHeader title="Account" />
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-stone">Account type</dt>
              <dd>
                <Badge tone="gold">{titleCase(profile.role)}</Badge>
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-stone">Member since</dt>
              <dd className="text-ivory">{fmtDate(profile.created_at)}</dd>
            </div>
            {profile.doctor && (
              <>
                <div className="flex justify-between gap-3">
                  <dt className="text-stone">Clinician status</dt>
                  <dd>
                    <Badge
                      tone={profile.doctor.verification_status === 'verified' ? 'sage' : 'blue'}
                    >
                      {titleCase(profile.doctor.verification_status)}
                    </Badge>
                  </dd>
                </div>
                {profile.doctor.doctor_code && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-stone">Doctor code</dt>
                    <dd className="font-mono text-gold-pale">{profile.doctor.doctor_code}</dd>
                  </div>
                )}
              </>
            )}
          </dl>
          {!profile.doctor && (
            <p className="mt-5 text-xs text-stone">
              Are you a clinician?{' '}
              <Link href="/doctor/login?apply=1" className="text-gold-pale hover:text-gold">
                Apply for clinician access
              </Link>
              .
            </p>
          )}
        </Card>
      </div>
      <Card className="mt-5">
        <CardHeader title="Health profile details" subtitle="Not available yet" />
        <p className="text-sm text-stone">
          Blood group, emergency contacts and other demographic details can’t be saved yet, because
          the NEURIX server doesn’t store them. Conditions, medications, allergies, surgeries and
          family history are available in{' '}
          <Link href="/medical-records/history" className="text-gold-pale hover:text-gold">
            My Health
          </Link>
          .
        </p>
      </Card>
    </>
  );
}
