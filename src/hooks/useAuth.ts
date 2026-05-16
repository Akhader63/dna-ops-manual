// ============================================
// useAuth Hook
// Enhanced Authentication with 2FA Support
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import type { UserAccount } from '@/types/database';

export type AuthenticationState =
  | 'unauthenticated'
  | 'password_verified_pending_2fa_setup'
  | 'password_verified_pending_2fa_verification'
  | 'fully_authenticated';

export interface AuthState {
  user: User | null;
  userAccount: UserAccount | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  authState: AuthenticationState;
  pendingUserId: string | null;
  error: AuthError | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    userAccount: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
    authState: 'unauthenticated',
    pendingUserId: null,
    error: null,
  });

  // Fetch user account data using REST API directly
  const fetchUserAccount = useCallback(async (userId: string): Promise<UserAccount | null> => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(
        `${supabaseUrl}/rest/v1/user_accounts?auth_user_id=eq.${userId}&select=*`,
        {
          method: 'GET',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('[Auth] Error fetching user account:', response.status);
        return null;
      }

      const data = await response.json();

      if (!data || data.length === 0) {
        return null;
      }

      return data[0] as UserAccount;
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('[Auth] Error:', error);
      }
      return null;
    }
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          setState(prev => ({ ...prev, error, isLoading: false }));
          return;
        }

        if (session?.user) {
          const userAccount = await fetchUserAccount(session.user.id);

          if (!userAccount) {
            await supabase.auth.signOut();
            setState(prev => ({ ...prev, isLoading: false, isAuthenticated: false, authState: 'unauthenticated' }));
            return;
          }

          const requiresTwoFactor = userAccount.two_factor_required || userAccount.user_type === 'consultant_user';
          const hasTwoFactorEnabled = userAccount.two_factor_enabled;

          if (requiresTwoFactor && !hasTwoFactorEnabled) {
            setState({
              user: session.user,
              userAccount,
              session,
              isLoading: false,
              isAuthenticated: false,
              authState: 'password_verified_pending_2fa_setup',
              pendingUserId: session.user.id,
              error: null,
            });
            return;
          }

          setState({
            user: session.user,
            userAccount,
            session,
            isLoading: false,
            isAuthenticated: true,
            authState: 'fully_authenticated',
            pendingUserId: null,
            error: null,
          });
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (err) {
        console.error('[Auth] Init error:', err);
        setState(prev => ({ ...prev, isLoading: false, error: err as AuthError }));
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;

        if (session?.user) {
          const userAccount = await fetchUserAccount(session.user.id);

          if (!userAccount) {
            await supabase.auth.signOut();
            setState({
              user: null,
              userAccount: null,
              session: null,
              isLoading: false,
              isAuthenticated: false,
              authState: 'unauthenticated',
              pendingUserId: null,
              error: null,
            });
            return;
          }

          const requiresTwoFactor = userAccount.two_factor_required || userAccount.user_type === 'consultant_user';
          const hasTwoFactorEnabled = userAccount.two_factor_enabled;

          if (requiresTwoFactor && !hasTwoFactorEnabled) {
            setState({
              user: session.user,
              userAccount,
              session,
              isLoading: false,
              isAuthenticated: false,
              authState: 'password_verified_pending_2fa_setup',
              pendingUserId: session.user.id,
              error: null,
            });
            return;
          }

          // Check if 2FA is enabled - DON'T auto-authenticate without verification
          if (hasTwoFactorEnabled) {
            // Only mark as fully authenticated if localStorage has 2fa_verified flag
            const verified2FA = localStorage.getItem('2fa_verified') === 'true';

            if (!verified2FA) {
              console.log('⚠️ onAuthStateChange: 2FA enabled but not verified yet, skipping auto-auth');
              // Don't set auth state here - let signIn() handle it
              return;
            }
          }

          setState({
            user: session.user,
            userAccount,
            session,
            isLoading: false,
            isAuthenticated: true,
            authState: 'fully_authenticated',
            pendingUserId: null,
            error: null,
          });
        } else {
          setState({
            user: null,
            userAccount: null,
            session: null,
            isLoading: false,
            isAuthenticated: false,
            authState: 'unauthenticated',
            pendingUserId: null,
            error: null,
          });
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserAccount]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { success: false, error };
      if (!data.user) return { success: false, error: { message: 'Login failed' } as AuthError };

      const userAccount = await fetchUserAccount(data.user.id);

      if (!userAccount) {
        return { success: false, error: { message: 'User account not found' } as AuthError };
      }

      console.log('👤 User Account:', {
        email: userAccount.email,
        user_type: userAccount.user_type,
        two_factor_enabled: userAccount.two_factor_enabled,
        two_factor_required: userAccount.two_factor_required,
      });

      const requiresTwoFactor = userAccount.two_factor_required || userAccount.user_type === 'consultant_user';
      const hasTwoFactorEnabled = userAccount.two_factor_enabled;

      console.log('🔒 2FA Check:', {
        requiresTwoFactor,
        hasTwoFactorEnabled,
        willRequireSetup: requiresTwoFactor && !hasTwoFactorEnabled,
        willRequireVerification: hasTwoFactorEnabled,
      });

      if (requiresTwoFactor && !hasTwoFactorEnabled) {
        console.log('⚙️ 2FA Setup Required');
        setState({
          user: data.user,
          userAccount,
          session: data.session,
          isLoading: false,
          isAuthenticated: false,
          authState: 'password_verified_pending_2fa_setup',
          pendingUserId: data.user.id,
          error: null,
        });
        return { success: false, requiresSetup: true, userId: data.user.id };
      }

      if (hasTwoFactorEnabled) {
        console.log('🔐 2FA Verification Required');
        // DON'T sign out - keep the session alive but mark as pending 2FA
        setState({
          user: data.user,
          userAccount,
          session: data.session,
          isLoading: false,
          isAuthenticated: false,
          authState: 'password_verified_pending_2fa_verification',
          pendingUserId: data.user.id,
          error: null,
        });
        return { success: false, requiresVerification: true, userId: data.user.id };
      }

      console.log('✅ Login Complete - No 2FA Required');

      setState({
        user: data.user,
        userAccount,
        session: data.session,
        isLoading: false,
        isAuthenticated: true,
        authState: 'fully_authenticated',
        pendingUserId: null,
        error: null,
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error as AuthError };
    }
  }, [fetchUserAccount]);

  const completeTwoFactorLogin = useCallback(async () => {
    if (!state.pendingUserId) return { success: false };

    try {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        return { success: false };
      }

      const userAccount = await fetchUserAccount(state.pendingUserId);

      // Set 2FA verified flag so onAuthStateChange allows fully_authenticated
      localStorage.setItem('2fa_verified', 'true');

      setState({
        user: data.session.user,
        userAccount,
        session: data.session,
        isLoading: false,
        isAuthenticated: true,
        authState: 'fully_authenticated',
        pendingUserId: null,
        error: null,
      });

      return { success: true };
    } catch (error) {
      return { success: false };
    }
  }, [state.pendingUserId, fetchUserAccount]);

  const refreshUser = useCallback(async () => {
    if (!state.user?.id) return;

    const userAccount = await fetchUserAccount(state.user.id);
    setState(prev => ({ ...prev, userAccount }));
  }, [state.user?.id, fetchUserAccount]);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();

      // Clear 2FA verified flag
      localStorage.removeItem('2fa_verified');

      setState({
        user: null,
        userAccount: null,
        session: null,
        isLoading: false,
        isAuthenticated: false,
        authState: 'unauthenticated',
        pendingUserId: null,
        error: error || null,
      });

      return { success: !error, error };
    } catch (error) {
      return { success: false, error: error as AuthError };
    }
  }, []);

  return {
    user: state.user,
    userAccount: state.userAccount,
    session: state.session,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    authState: state.authState,
    pendingUserId: state.pendingUserId,
    error: state.error,
    signIn,
    signOut,
    completeTwoFactorLogin,
    refreshUser,
  };
}
