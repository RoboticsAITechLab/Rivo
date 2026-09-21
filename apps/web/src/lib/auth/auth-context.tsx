'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  AdminSignupPayload,
  AuthResult,
  AuthState,
  AuthUser,
  ForgotPasswordPayload,
  ForgotPasswordResult,
  LoginCredentials,
  ResetPasswordPayload,
  ResetPasswordResult,
} from './types';
import { authService } from './auth-service';

interface AuthContextValue {
  user: AuthUser | null;
  authState: AuthState;
  login: (credentials: LoginCredentials) => Promise<AuthResult>;
  signup: (payload: AdminSignupPayload) => Promise<AuthResult>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  forgotPassword: (payload: ForgotPasswordPayload) => Promise<ForgotPasswordResult>;
  resetPassword: (payload: ResetPasswordPayload) => Promise<ResetPasswordResult>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authState, setAuthState] = useState<AuthState>('AUTHENTICATING');

  useEffect(() => {
    let isMounted = true;

    authService
      .getCurrentUser()
      .then((currentUser) => {
        if (!isMounted) return;
        if (currentUser) {
          setUser(currentUser);
          setAuthState('AUTHENTICATED');
        } else {
          setUser(null);
          setAuthState('UNAUTHENTICATED');
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setUser(null);
        setAuthState('UNAUTHENTICATED');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (credentials: LoginCredentials): Promise<AuthResult> => {
    setAuthState('AUTHENTICATING');
    const result = await authService.login(credentials);

    if (result.success && result.user) {
      setUser(result.user);
      setAuthState('AUTHENTICATED');
    } else {
      setUser(null);
      setAuthState('UNAUTHENTICATED');
    }

    return result;
  };

  const signup = async (payload: AdminSignupPayload): Promise<AuthResult> => {
    setAuthState('AUTHENTICATING');
    const result = await authService.signup(payload);

    if (result.success && result.user) {
      setUser(result.user);
      setAuthState('AUTHENTICATED');
    } else {
      setUser(null);
      setAuthState('UNAUTHENTICATED');
    }

    return result;
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setAuthState('UNAUTHENTICATED');
    }
  };

  const refreshSession = async (): Promise<void> => {
    try {
      const refreshedUser = await authService.refreshSession();
      if (refreshedUser) {
        setUser(refreshedUser);
        setAuthState('AUTHENTICATED');
      } else {
        setUser(null);
        setAuthState('UNAUTHENTICATED');
      }
    } catch {
      setUser(null);
      setAuthState('UNAUTHENTICATED');
    }
  };

  const forgotPassword = (payload: ForgotPasswordPayload) => {
    return authService.forgotPassword(payload);
  };

  const resetPassword = (payload: ResetPasswordPayload) => {
    return authService.resetPassword(payload);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        authState,
        login,
        signup,
        logout,
        refreshSession,
        forgotPassword,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
