'use client';
import React from 'react';
import Link from 'next/link';
import { Clock, FileText, LayoutDashboard, Settings, ShieldAlert, Users } from 'lucide-react';
import { RequireAuth } from './guards';
import { Shell, type NavGroup } from './AppShell';
import { useAuth } from '@/context/auth';
import { ButtonLink } from '@/components/ui';
import { LogoMark } from '@/components/brand';

export const DOCTOR_NAV: NavGroup[] = [
  {
    label: 'Practice',
    items: [
      { href: '/doctor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/doctor/patients', label: 'Patients', icon: Users },
      { href: '/doctor/reports', label: 'Reports', icon: FileText },
    ],
  },
  { label: 'Account', items: [{ href: '/doctor/settings', label: 'Settings', icon: Settings }] },
];

function Gate({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const status = profile?.doctor?.verification_status;
  if (status === 'verified') return <>{children}</>;
  const view = !profile?.doctor
    ? {
        icon: <ShieldAlert className="h-6 w-6 text-gold" />,
        title: 'This area is for verified clinicians',
        body: 'Your account does not have a doctor profile. You can apply for clinician access; an administrator verifies your registration before any patient can share data with you.',
        cta: { href: '/doctor/login?apply=1', label: 'Apply for clinician access' },
      }
    : status === 'pending'
      ? {
          icon: <Clock className="h-6 w-6 text-softblue" />,
          title: 'Your application is being reviewed',
          body: 'An administrator is checking your registration. You will be able to use the doctor portal once your account is verified. Patients cannot connect with you until then.',
          cta: null,
        }
      : {
          icon: <ShieldAlert className="h-6 w-6 text-rose" />,
          title: `Your clinician account is ${status}`,
          body: 'The doctor portal is not available for this account. Contact support if you believe this is a mistake.',
          cta: null,
        };
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="surface max-w-md p-7 text-center">
        <LogoMark className="mx-auto mb-5 h-10 w-10" />
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-bronze bg-graphite-deep">
          {view.icon}
        </div>
        <h1 className="text-lg font-semibold">{view.title}</h1>
        <p className="mt-2 text-sm text-stone">{view.body}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <ButtonLink href="/dashboard" variant="secondary">
            Go to my patient space
          </ButtonLink>
          {view.cta && <ButtonLink href={view.cta.href}>{view.cta.label}</ButtonLink>}
        </div>
      </div>
    </div>
  );
}

export default function DoctorShell({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth loginPath="/doctor/login">
      <Gate>
        <Shell
          groups={DOCTOR_NAV}
          home="/doctor/dashboard"
          sub="Clinician"
          topRight={
            <Link
              href="/dashboard"
              className="rounded-lg px-2.5 py-1.5 text-xs text-stone hover:bg-white/5 hover:text-ivory"
            >
              My patient space
            </Link>
          }
        >
          {children}
        </Shell>
      </Gate>
    </RequireAuth>
  );
}
