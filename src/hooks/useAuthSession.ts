import { useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import type { Profile } from '../types';
import { fetchProfile } from '../services/profileService';

const PASSWORD_RECOVERY_KEY = 'warungify_password_recovery';

export const useAuthSession = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(() => {
    return sessionStorage.getItem(PASSWORD_RECOVERY_KEY) === 'true';
  });

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsAuthLoading(false);
      setAuthError('Supabase env belum dikonfigurasi.');
      return;
    }

    let isMounted = true;
    const searchParams = new URLSearchParams(window.location.search);
    const isEmailConfirmRedirect =
      searchParams.get('auth') === 'confirm' ||
      window.location.hash.includes('type=signup') ||
      window.location.hash.includes('type=email');

    if (isEmailConfirmRedirect) {
      sessionStorage.setItem('warungify_email_confirm_redirect', 'true');
    }

    const finishEmailConfirmRedirect = async () => {
      sessionStorage.removeItem('warungify_email_confirm_redirect');
      await supabase.auth.signOut();
      window.history.replaceState(null, '', `${window.location.pathname}#/login`);
      if (!isMounted) return;
      setSession(null);
      setUser(null);
      setIsAuthLoading(false);
    };

    const syncSession = async (nextSession: Session | null) => {
      const nextUser = nextSession?.user || null;
      setSession(nextSession);
      setUser(nextUser);

      if (!nextUser) {
        setProfile(null);
        setIsProfileLoading(false);
        return;
      }

      setIsProfileLoading(true);
      try {
        const nextProfile = await fetchProfile(nextUser.id);
        if (!isMounted) return;
        setProfile(nextProfile);
        setAuthError(null);
      } catch (error) {
        if (!isMounted) return;
        setProfile(null);
        setAuthError(error instanceof Error ? error.message : 'Failed to load workspace profile.');
      } finally {
        if (isMounted) {
          setIsProfileLoading(false);
        }
      }
    };

    supabase.auth.getSession().then(async ({ data, error }) => {
      if (!isMounted) return;
      if (error) {
        setAuthError(error.message);
      }
      if (data.session && sessionStorage.getItem('warungify_email_confirm_redirect') === 'true') {
        void finishEmailConfirmRedirect();
        return;
      }
      await syncSession(data.session);
      setIsAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'PASSWORD_RECOVERY') {
        sessionStorage.setItem(PASSWORD_RECOVERY_KEY, 'true');
        setIsPasswordRecovery(true);
        window.location.hash = '/login?mode=reset';
      }
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setProfile(null);
        setIsProfileLoading(false);
        setIsAuthLoading(false);
        return;
      }
      if (event === 'SIGNED_IN' && nextSession && sessionStorage.getItem('warungify_email_confirm_redirect') === 'true') {
        void finishEmailConfirmRedirect();
        return;
      }
      void syncSession(nextSession);
      setIsAuthLoading(false);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return {
    session,
    user,
    profile,
    isAuthenticated: Boolean(session?.user),
    isApproved: profile?.betaStatus === 'approved',
    isPasswordRecovery,
    clearPasswordRecovery: () => {
      sessionStorage.removeItem(PASSWORD_RECOVERY_KEY);
      setIsPasswordRecovery(false);
    },
    isAuthLoading,
    isProfileLoading,
    authError,
  };
};
