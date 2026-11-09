'use client';
import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Clock, ShieldCheck } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button, ButtonLink, Field, Input, Notice } from '@/components/ui';
import { useAuth } from '@/context/auth';
import { doctorApi } from '@/lib/api/services';
import { errorMessage } from '@/lib/api/client';
import { FullScreenLoader } from '@/components/shell/guards';
import { safeNext } from '@/lib/utils';

function DoctorLogin() {
  const { ready, session, profile, signIn, signOut, refreshProfile } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [app, setApp] = useState({ specialty: '', registration_number: '' });

  const verified = profile?.doctor?.verification_status === 'verified';
  useEffect(() => {
    if (ready && session && verified) router.replace(safeNext(sp.get('next'), '/doctor/dashboard'));
  }, [ready, session, verified, router, sp]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!email.trim() || !password) return setErr('Enter your email and password.');
    setBusy(true);
    try {
      await signIn(email.trim(), password);
    } catch (x) {
      setErr(errorMessage(x));
    } finally {
      setBusy(false);
    }
  };

  const apply = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!app.specialty.trim() || app.registration_number.trim().length < 3)
      return setErr('Enter your specialty and a registration number (at least 3 characters).');
    setBusy(true);
    try {
      await doctorApi.apply(app.specialty.trim(), app.registration_number.trim());
      await refreshProfile();
    } catch (x) {
      setErr(errorMessage(x));
    } finally {
      setBusy(false);
    }
  };

  if (!ready || (session && !profile) || (session && verified)) return <FullScreenLoader />;

  if (session && profile) {
    const st = profile.doctor?.verification_status;
    if (st === 'pending') {
      return (
        <AuthLayout
          badge="Clinician"
          title="Application under review"
          subtitle={`Signed in as ${profile.email}`}
        >
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-softblue/40 bg-softblue/10">
              <Clock className="h-6 w-6 text-softblue" />
            </div>
            <p className="text-sm text-stone">
              An administrator is verifying your registration
              {profile.doctor?.specialty ? ` (${profile.doctor.specialty})` : ''}. You’ll get access
              to the doctor portal once it’s approved. Patients cannot connect with you until then.
            </p>
            <div className="flex justify-center gap-2">
              <Button variant="secondary" onClick={() => refreshProfile()}>
                Check again
              </Button>
              <ButtonLink href="/dashboard">My patient space</ButtonLink>
            </div>
          </div>
        </AuthLayout>
      );
    }
    if (st && st !== 'verified') {
      return (
        <AuthLayout
          badge="Clinician"
          title={`Clinician account ${st}`}
          subtitle="The doctor portal is not available for this account."
        >
          <div className="flex justify-center gap-2">
            <Button variant="secondary" onClick={() => signOut()}>
              Sign out
            </Button>
            <ButtonLink href="/dashboard">My patient space</ButtonLink>
          </div>
        </AuthLayout>
      );
    }
    return (
      <AuthLayout
        badge="Clinician"
        title="Apply for clinician access"
        subtitle={`Signed in as ${profile.email}. Your registration is checked by an administrator before you can see any patient data.`}
        footer={
          <button onClick={() => signOut()} className="text-gold-pale hover:text-gold">
            Use a different account
          </button>
        }
      >
        <form onSubmit={apply} className="space-y-4" noValidate>
          {err && <Notice tone="rose">{err}</Notice>}
          <Field label="Specialty" required>
            {(id) => (
              <Input
                id={id}
                value={app.specialty}
                placeholder="e.g. Psychiatry"
                onChange={(e) => setApp({ ...app, specialty: e.target.value })}
              />
            )}
          </Field>
          <Field
            label="Professional registration number"
            required
            hint="As issued by your medical council or licensing body."
          >
            {(id) => (
              <Input
                id={id}
                value={app.registration_number}
                onChange={(e) => setApp({ ...app, registration_number: e.target.value })}
              />
            )}
          </Field>
          <Button
            type="submit"
            className="w-full"
            size="lg"
            loading={busy}
            icon={<ShieldCheck className="h-4 w-4" />}
          >
            Submit application
          </Button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      badge="Clinician"
      title="Clinician sign-in"
      subtitle="Access patients who have connected with you and granted permission."
      footer={
        <>
          No account yet?{' '}
          <Link
            href="/signup?next=%2Fdoctor%2Flogin%3Fapply%3D1"
            className="text-gold-pale hover:text-gold"
          >
            Create one
          </Link>
          , then apply for clinician access.
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        {err && (
          <Notice tone="rose" title="Couldn’t sign in">
            {err}
          </Notice>
        )}
        <Field label="Work email">
          {(id) => (
            <Input
              id={id}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}
        </Field>
        <Field label="Password">
          {(id) => (
            <Input
              id={id}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}
        </Field>
        <Button type="submit" className="w-full" size="lg" loading={busy}>
          Sign in
        </Button>
        <p className="text-xs text-stone">
          Access to patient data is granted by each patient, per category, and every view is
          recorded in their audit trail.
        </p>
      </form>
    </AuthLayout>
  );
}

export default function DoctorLoginPage() {
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <DoctorLogin />
    </Suspense>
  );
}
