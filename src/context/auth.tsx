'use client';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, errorMessage } from '@/lib/api/client';
import { profileApi } from '@/lib/api/services';
import type { Profile } from '@/lib/api/types';

interface AuthState {
  ready: boolean;
  session: Session | null;
  profile: Profile | null;
  profileError: string | null;
  signIn: (email: string, password: string) => Promise<Profile>;
  signUp: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<Profile | null>;
}

const Ctx = createContext<AuthState | null>(null);

const NETWORK_MSG = 'Cannot reach NEURIX. Check your internet connection and try again.';
const authMessage = (m?: string) =>
  !m ? 'Something went wrong.' : /failed to fetch|network|load failed/i.test(m) ? NETWORK_MSG : m === 'Invalid login credentials' ? 'Email or password is incorrect.' : m;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const refreshProfile = useCallback(async () => {
    try {
      const p = await profileApi.me();
      setProfile(p);
      setProfileError(null);
      return p;
    } catch (e) {
      setProfileError(errorMessage(e));
      return null;
    }
  }, []);

  useEffect(() => {
    let sb;
    try {
      sb = supabase();
    } catch (e) {
      setProfileError(errorMessage(e));
      setReady(true);
      return;
    }
    sb.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session) await refreshProfile();
      setReady(true);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (!s) setProfile(null);
    });
    return () => sub.subscription.unsubscribe();
  }, [refreshProfile]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase()
        .auth.signInWithPassword({ email, password })
        .catch((e: Error) => ({ data: { session: null }, error: e }));
      if (error || !data.session) throw new Error(authMessage(error?.message || 'Sign-in failed.'));
      setSession(data.session);
      const p = await refreshProfile();
      if (!p) throw new Error('Signed in, but your profile could not be loaded. Please try again.');
      return p;
    },
    [refreshProfile]
  );

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      const { data, error } = await supabase().auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      }).catch((e: Error) => ({ data: { session: null }, error: e }));
      if (error) throw new Error(authMessage(error.message));
      if (!data.session) return { needsConfirmation: true };
      setSession(data.session);
      await refreshProfile();
      return { needsConfirmation: false };
    },
    [refreshProfile]
  );

  const signOut = useCallback(async () => {
    await supabase()
      .auth.signOut()
      .catch(() => {});
    setSession(null);
    setProfile(null);
    try {
      localStorage.removeItem('neurix-soul-active');
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({ ready, session, profile, profileError, signIn, signUp, signOut, refreshProfile }),
    [ready, session, profile, profileError, signIn, signUp, signOut, refreshProfile]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth must be used inside AuthProvider');
  return c;
}

export const isVerifiedDoctor = (p: Profile | null) =>
  p?.doctor?.verification_status === 'verified';
