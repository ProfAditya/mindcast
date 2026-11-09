'use client';
import React from 'react';
import Link from 'next/link';
import { LifeBuoy, Stethoscope } from 'lucide-react';
import { RequireAuth } from './guards';
import { Shell, PATIENT_NAV } from './AppShell';
import { useAuth } from '@/context/auth';

function TopRight() {
  const { profile } = useAuth();
  return (
    <>
      {profile?.doctor?.verification_status === 'verified' && (
        <Link
          href="/doctor/dashboard"
          className="hidden items-center gap-1.5 rounded-lg border border-gold-line px-3 py-1.5 text-xs text-gold-pale hover:border-gold sm:inline-flex"
        >
          <Stethoscope className="h-3.5 w-3.5" /> Doctor portal
        </Link>
      )}
      <Link
        href="/soul#support"
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-stone hover:bg-white/5 hover:text-ivory"
      >
        <LifeBuoy className="h-3.5 w-3.5 text-rose" /> <span>Need help now?</span>
      </Link>
    </>
  );
}

export default function PatientShell({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <Shell groups={PATIENT_NAV} home="/dashboard" topRight={<TopRight />}>
        {children}
      </Shell>
    </RequireAuth>
  );
}
