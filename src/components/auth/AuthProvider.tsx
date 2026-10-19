"use client";

import { createContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User, Session, AuthError } from "@supabase/supabase-js";
import type { OrganizationMembership, OrganizationRole, Profile } from "@/types";

interface AuthState {
  user: User | null;
  profile: Profile | null;
  /** 所属している事務所。どこにも所属していなければ null */
  organization: OrganizationMembership | null;
  session: Session | null;
  loading: boolean;
}

export type SignUpOutcome =
  | { result: "confirm_email" }
  | { result: "signed_in" }
  | { result: "already_registered" }
  | { result: "error"; message: string };

export interface AuthContextValue extends AuthState {
  isAdmin: boolean;
  /** プロジェクトを掲載できる権限。運営が個別に付与するか、事務所に招待される */
  isCreator: boolean;
  signInWithEmail: (
    email: string,
    password: string
  ) => Promise<{ data: unknown; error: AuthError | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<SignUpOutcome>;
  resendSignUpEmail: (email: string) => Promise<{ error: AuthError | null }>;
  sendPasswordReset: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  /** プロフィール更新後にヘッダー等の表示を追随させる */
  refreshProfile: () => Promise<void>;
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
    organization: null,
    session: null,
    loading: true,
  });

  const supabase = createClient();

  const fetchProfile = useCallback(
    async (
      userId: string
    ): Promise<Pick<AuthState, "profile" | "organization">> => {
      try {
        const [{ data: profile }, { data: member }] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", userId).single(),
          supabase
            .from("organization_members")
            .select("role, organizations(id, name)")
            .eq("user_id", userId)
            .maybeSingle(),
        ]);
        const org = Array.isArray(member?.organizations)
          ? member.organizations[0]
          : member?.organizations;
        return {
          profile: profile as Profile | null,
          organization: org
            ? { id: org.id, name: org.name, role: member!.role as OrganizationRole }
            : null,
        };
      } catch {
        return { profile: null, organization: null };
      }
    },
    [supabase]
  );

  useEffect(() => {
    const applySession = async (session: Session | null) => {
      if (session?.user) {
        const loaded = await fetchProfile(session.user.id);
        setState({ user: session.user, ...loaded, session, loading: false });
      } else {
        setState({
          user: null,
          profile: null,
          organization: null,
          session: null,
          loading: false,
        });
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

  const signUpWithEmail = async (
    email: string,
    password: string
  ): Promise<SignUpOutcome> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) return { result: "error", message: error.message };
    if (data.session) return { result: "signed_in" };
    // 登録済みのメールでも Supabase は成功を返す（アカウントの存在を隠すため）。
    // その場合だけ identities が空になるので、ここで見分ける
    if (data.user && data.user.identities?.length === 0) {
      return { result: "already_registered" };
    }
    return { result: "confirm_email" };
  };

  const resendSignUpEmail = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error };
  };

  const sendPasswordReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // callback でセッションを張ってから再設定フォームへ送る
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
    });
    return { error };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error };
  };

  const refreshProfile = useCallback(async () => {
    const userId = state.user?.id;
    if (!userId) return;
    const loaded = await fetchProfile(userId);
    setState((s) => (s.user?.id === userId ? { ...s, ...loaded } : s));
  }, [state.user?.id, fetchProfile]);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setState({
        user: null,
        profile: null,
        organization: null,
        session: null,
        loading: false,
      });
    }
    return { error };
  };

  const value: AuthContextValue = {
    ...state,
    isAdmin: state.profile?.role === "admin",
    isCreator:
      state.profile?.role === "creator" ||
      state.profile?.role === "admin" ||
      state.organization !== null,
    signInWithEmail,
    signUpWithEmail,
    resendSignUpEmail,
    sendPasswordReset,
    updatePassword,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
