'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { KeyRound, LogOut, Shield } from 'lucide-react';
import { useAuth } from '@/context/auth';
import { supabase, errorMessage, API_BASE } from '@/lib/api/client';
import {
  Button,
  ButtonLink,
  Card,
  CardHeader,
  Field,
  Input,
  Notice,
  PageHeader,
} from '@/components/ui';

export default function SettingsPage() {
  const { signOut, profile } = useAuth();
  const router = useRouter();
  const [pw, setPw] = useState({ next: '', confirm: '' });
  const [busy, setBusy] = useState(false);

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.next.length < 8) return toast.error('Use at least 8 characters.');
    if (pw.next !== pw.confirm) return toast.error('Passwords do not match.');
    setBusy(true);
    try {
      const { error } = await supabase().auth.updateUser({ password: pw.next });
      if (error) throw error;
      toast.success('Password updated');
      setPw({ next: '', confirm: '' });
    } catch (x) {
      toast.error(errorMessage(x));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader eyebrow="Account" title="Settings" />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Change password" icon={<KeyRound className="h-4 w-4" />} />
          <form className="space-y-4" onSubmit={changePassword}>
            <Field label="New password" hint="At least 8 characters.">
              {(id) => (
                <Input
                  id={id}
                  type="password"
                  autoComplete="new-password"
                  value={pw.next}
                  onChange={(e) => setPw({ ...pw, next: e.target.value })}
                />
              )}
            </Field>
            <Field label="Confirm new password">
              {(id) => (
                <Input
                  id={id}
                  type="password"
                  autoComplete="new-password"
                  value={pw.confirm}
                  onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
                />
              )}
            </Field>
            <Button type="submit" loading={busy}>
              Update password
            </Button>
          </form>
        </Card>
        <Card>
          <CardHeader title="Privacy & data" icon={<Shield className="h-4 w-4" />} />
          <p className="text-sm text-stone">
            Manage AI consent, doctor sharing and see your audit trail in the Privacy centre.
          </p>
          <ButtonLink href="/privacy" variant="secondary" className="mt-4">
            Open Privacy centre
          </ButtonLink>
          <Notice tone="gold" title="Account deletion">
            Deleting a whole account isn’t available in the app yet. You can delete individual
            entries, records, documents and conversations at any time. Contact support to close your
            account.
          </Notice>
        </Card>
        <Card>
          <CardHeader title="Notifications" />
          <p className="text-sm text-stone">
            Reminders and goals are shown inside NEURIX. Push, email or SMS notifications are not
            sent — we’ll tell you clearly if that changes.
          </p>
          <Link
            href="/reminders"
            className="mt-3 inline-block text-sm text-gold-pale hover:text-gold"
          >
            Manage reminders
          </Link>
        </Card>
        <Card>
          <CardHeader title="Session" />
          <p className="text-sm text-stone">
            Signed in as <span className="text-ivory">{profile?.email}</span>.
          </p>
          <p className="mt-1 break-all text-xs text-stone">
            Connected service: {API_BASE.replace(/\/api\/v1$/, '')}
          </p>
          <Button
            variant="danger"
            className="mt-4"
            icon={<LogOut className="h-4 w-4" />}
            onClick={() => signOut().then(() => router.replace('/login'))}
          >
            Sign out
          </Button>
        </Card>
      </div>
    </>
  );
}
