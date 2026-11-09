'use client';
import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2, LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/auth';
import { Button } from '@/components/ui';
import { LogoMark } from '@/components/brand';

export function FullScreenLoader({ label = 'Loading NEURIX' }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4" role="status">
      <LogoMark className="h-10 w-10" />
      <Loader2 className="h-5 w-5 animate-spin text-gold" aria-hidden />
      <span className="sr-only">{label}…</span>
    </div>
  );
}

/** Blocks rendering until there is a session and a loaded profile. Redirects to the right sign-in page. */
export function RequireAuth({
  children,
  loginPath = '/login',
}: {
  children: React.ReactNode;
  loginPath?: string;
}) {
  const { ready, session, profile, profileError, refreshProfile, signOut } = useAuth();
  const router = useRouter();
  const path = usePathname();
  useEffect(() => {
    if (ready && !session) router.replace(`${loginPath}?next=${encodeURIComponent(path)}`);
  }, [ready, session, router, path, loginPath]);

  if (!ready || !session) return <FullScreenLoader />;
  if (!profile) {
    if (!profileError) return <FullScreenLoader label="Loading your profile" />;
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="surface max-w-md p-6 text-center">
          <LogoMark className="mx-auto mb-4 h-10 w-10" />
          <h1 className="text-lg font-semibold">We couldn’t load your account</h1>
          <p className="mt-2 text-sm text-stone">{profileError}</p>
          <div className="mt-5 flex justify-center gap-2">
            <Button
              variant="secondary"
              icon={<LogOut className="h-4 w-4" />}
              onClick={() => signOut().then(() => router.replace(loginPath))}
            >
              Sign out
            </Button>
            <Button icon={<RefreshCw className="h-4 w-4" />} onClick={() => refreshProfile()}>
              Try again
            </Button>
          </div>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
