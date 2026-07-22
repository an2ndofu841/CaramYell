"use client";

import { createContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User, Session, AuthError } from "@supabase/supabase-js";
import type { Profile } from "@/types";

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
}

export interface AuthContextValue extends AuthState {
  isAdmin: boolean;
  signInWithEmail: (
    email: string,
    password: string
  ) => Promise<{ data: unknown; error: AuthError | null }>;
  signUpWithEmail: (
    email: string,
    password: string
  ) => Promise<{ data: unknown; error: AuthError | null }>;
  signInWithOAuth: (
    provider: "google" | "github"
  ) => Promise<{ data: unknown; error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

/**
 * アプリ全体で1つだけ認証状態を持つプロバイダ。
 * getSession / onAuthStateChange はここで一度だけ実行し、各コンポーネントは
 * useAuth() で共有参照する。これにより複数コンポーネントが同時に getSession を
 * 呼んで gotrue のロックを奪い合う（"Lock broken ... steal"）問題を防ぐ。
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
  });

  const supabase = createClient();

  const fetchProfile = useCallback(
    async (userId: string) => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();
        return data as Profile | null;
      } catch {
        return null;
      }
    },
    [supabase]
  );

  useEffect(() => {
    const applySession = async (session: Session | null) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setState({ user: session.user, profile, session, loading: false });
      } else {
        setState({ user: null, profile: null, session: null, loading: false });
      }
    };

    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        await applySession(session);
      } catch {
        // ロック競合などで失敗しても loading を解除して詰まらせない
        setState((s) => ({ ...s, loading: false }));
      }
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile]);

  const signInWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signUpWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  };

  const signInWithOAuth = async (provider: "google" | "github") => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setState({ user: null, profile: null, session: null, loading: false });
    }
    return { error };
  };

  const value: AuthContextValue = {
    ...state,
    isAdmin: state.profile?.role === "admin",
    signInWithEmail,
    signUpWithEmail,
    signInWithOAuth,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
