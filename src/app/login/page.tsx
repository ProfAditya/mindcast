'use client';
import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button, Field, Input, Notice } from '@/components/ui';
import { useAuth } from '@/context/auth';
import { errorMessage } from '@/lib/api/client';
import { FullScreenLoader } from '@/components/shell/guards';
import type { Profile } from '@/lib/api/types';
import { safeNext } from '@/lib/utils';

const homeFor = (p: Profile | null) =>
  p?.doctor?.verification_status === 'verified' ? '/doctor/dashboard' : '/dashboard';

function LoginForm() {
  const { signIn, ready, session, profile } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && session && profile) router.replace(safeNext(sp.get('next'), homeFor(profile)));
  }, [ready, session, profile, router, sp]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!email.trim() || !password) return setErr('Enter your email and password.');
    setBusy(true);
    try {
      const p = await signIn(email.trim(), password);
      router.replace(safeNext(sp.get('next'), homeFor(p)));
    } catch (x) {
      setErr(errorMessage(x));
    } finally {
      setBusy(false);
    }
  };

  if (!ready) return <FullScreenLoader />;
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your private NEURIX space."
      footer={
        <>
          New to NEURIX?{' '}
          <Link href="/signup" className="text-gold-pale hover:text-gold">
            Create an account
          </Link>{' '}
          ·{' '}
          <Link href="/doctor/login" className="text-gold-pale hover:text-gold">
            Clinician sign-in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        {sp.get('next') && !err && <Notice tone="blue">Please sign in to continue.</Notice>}
        {err && (
          <Notice tone="rose" title="Couldn’t sign in">
            {err}
          </Notice>
        )}
        <Field label="Email">
          {(id) => (
            <Input
              id={id}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          )}
        </Field>
        <Field label="Password">
          {(id) => (
            <div className="relative">
              <Input
                id={id}
                type={show ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-11"
                required
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-stone hover:text-ivory"
                aria-label={show ? 'Hide password' : 'Show password'}
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          )}
        </Field>
        <Button type="submit" className="w-full" size="lg" loading={busy}>
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <LoginForm />
    </Suspense>
  );
}
