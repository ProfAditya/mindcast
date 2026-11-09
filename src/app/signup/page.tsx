'use client';
import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { MailCheck } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button, ButtonLink, Field, Input, Notice } from '@/components/ui';
import { useAuth } from '@/context/auth';
import { errorMessage } from '@/lib/api/client';
import { FullScreenLoader } from '@/components/shell/guards';
import { safeNext } from '@/lib/utils';

function SignupForm() {
  const { signUp } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get('next');
  const [f, setF] = useState({ name: '', email: '', password: '', confirm: '', agree: false });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v: Record<string, string> = {};
    if (!f.name.trim()) v.name = 'Please enter your name.';
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) v.email = 'Enter a valid email address.';
    if (f.password.length < 8) v.password = 'Use at least 8 characters.';
    if (f.confirm !== f.password) v.confirm = 'Passwords do not match.';
    if (!f.agree) v.agree = 'Please accept the terms and privacy policy to continue.';
    setErrs(v);
    setErr(null);
    if (Object.keys(v).length) return;
    setBusy(true);
    try {
      const r = await signUp(f.name.trim(), f.email.trim(), f.password);
      if (r.needsConfirmation) setSent(true);
      else router.replace(safeNext(next, '/dashboard'));
    } catch (x) {
      setErr(errorMessage(x));
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout title="Check your email" subtitle={`We sent a confirmation link to ${f.email}.`}>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-sage/40 bg-sage/10">
            <MailCheck className="h-6 w-6 text-sage" />
          </div>
          <p className="text-sm text-stone">
            Open the link to activate your account, then sign in. If it doesn’t arrive within a few
            minutes, check your spam folder.
          </p>
          <ButtonLink
            href={next ? `/login?next=${encodeURIComponent(next)}` : '/login'}
            className="w-full"
          >
            Go to sign in
          </ButtonLink>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="A private space for your wellbeing and health records."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="text-gold-pale hover:text-gold">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        {err && (
          <Notice tone="rose" title="Couldn’t create your account">
            {err}
          </Notice>
        )}
        <Field label="Full name" error={errs.name}>
          {(id) => (
            <Input
              id={id}
              autoComplete="name"
              value={f.name}
              onChange={set('name')}
              aria-invalid={!!errs.name}
            />
          )}
        </Field>
        <Field label="Email" error={errs.email}>
          {(id) => (
            <Input
              id={id}
              type="email"
              autoComplete="email"
              value={f.email}
              onChange={set('email')}
              aria-invalid={!!errs.email}
            />
          )}
        </Field>
        <Field label="Password" hint="At least 8 characters." error={errs.password}>
          {(id) => (
            <Input
              id={id}
              type="password"
              autoComplete="new-password"
              value={f.password}
              onChange={set('password')}
              aria-invalid={!!errs.password}
            />
          )}
        </Field>
        <Field label="Confirm password" error={errs.confirm}>
          {(id) => (
            <Input
              id={id}
              type="password"
              autoComplete="new-password"
              value={f.confirm}
              onChange={set('confirm')}
              aria-invalid={!!errs.confirm}
            />
          )}
        </Field>
        <div>
          <label className="flex items-start gap-3 text-sm text-stone">
            <input
              type="checkbox"
              checked={f.agree}
              onChange={set('agree')}
              className="mt-0.5 h-4 w-4 rounded border-divider bg-graphite-deep text-gold focus:ring-gold"
            />
            <span>
              I agree to the{' '}
              <Link href="/terms" className="text-gold-pale underline underline-offset-2">
                terms of use
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-gold-pale underline underline-offset-2">
                privacy policy
              </Link>
              , and I understand NEURIX is not a medical service.
            </span>
          </label>
          {errs.agree && (
            <p className="mt-1 text-xs text-rose" role="alert">
              {errs.agree}
            </p>
          )}
        </div>
        <Button type="submit" className="w-full" size="lg" loading={busy}>
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <SignupForm />
    </Suspense>
  );
}
