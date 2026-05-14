import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { getSupabase } from '../lib/supabase';
import { env } from '../lib/env';
import { MOCK_USER } from '../lib/mockData';

interface User {
  id: string;
  email: string;
  displayName?: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  hasOnboarded: boolean;
  setHasOnboarded: (v: boolean) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasOnboarded, setHasOnboarded] = useState(false);

  useEffect(() => {
    let active = true;

    async function init() {
      if (env.useMocks) {
        if (active) setLoading(false);
        return;
      }
      const sb = getSupabase();
      if (!sb) {
        if (active) setLoading(false);
        return;
      }
      const { data } = await sb.auth.getSession();
      if (active && data.session?.user) {
        setUser({
          id: data.session.user.id,
          email: data.session.user.email ?? '',
          displayName: (data.session.user.user_metadata as any)?.name,
        });
      }
      sb.auth.onAuthStateChange((_event, session) => {
        if (!active) return;
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email ?? '',
            displayName: (session.user.user_metadata as any)?.name,
          });
        } else {
          setUser(null);
        }
      });
      if (active) setLoading(false);
    }

    init();
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      hasOnboarded,
      setHasOnboarded,
      signIn: async (email, password) => {
        if (env.useMocks) {
          setUser({ id: MOCK_USER.id, email, displayName: MOCK_USER.displayName });
          return;
        }
        const sb = getSupabase();
        if (!sb) throw new Error('Supabase no está configurado');
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      signUp: async (email, password, displayName) => {
        if (env.useMocks) {
          setUser({ id: MOCK_USER.id, email, displayName });
          return;
        }
        const sb = getSupabase();
        if (!sb) throw new Error('Supabase no está configurado');
        const { error } = await sb.auth.signUp({
          email,
          password,
          options: { data: { name: displayName ?? '' } },
        });
        if (error) throw error;
      },
      signInWithGoogle: async () => {
        if (env.useMocks) {
          setUser({ id: MOCK_USER.id, email: MOCK_USER.email, displayName: MOCK_USER.displayName });
          return;
        }
        const sb = getSupabase();
        if (!sb) throw new Error('Supabase no está configurado');
        const redirectTo = 'plantcareai://auth-callback';
        const { data, error } = await sb.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo, skipBrowserRedirect: true },
        });
        if (error) throw error;
        if (data.url) await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      },
      signOut: async () => {
        if (env.useMocks) {
          setUser(null);
          return;
        }
        const sb = getSupabase();
        await sb?.auth.signOut();
      },
    }),
    [user, loading, hasOnboarded],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
