import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { clearToken, getToken, setToken } from './token';

export type AuthContextValue = {
  token: string | null;
  isReady: boolean;
  signIn: (nextToken: string) => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const hydratedRef = useRef(false);

  useEffect(() => {
    const loadToken = async () => {
      const stored = await getToken();
      if (!hydratedRef.current) {
        setTokenState(stored);
      }
      setIsReady(true);
    };
    loadToken();
  }, []);

  const signIn = useCallback((nextToken: string) => {
    hydratedRef.current = true;
    setTokenState(nextToken);

    // Do not block UI transition on secure-store persistence latency.
    void setToken(nextToken).catch((error) => {
      console.warn('Failed to persist auth token.', error);
    });
  }, []);

  const signOut = useCallback(async () => {
    hydratedRef.current = true;
    await clearToken();
    setTokenState(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      isReady,
      signIn,
      signOut,
    }),
    [token, isReady, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
