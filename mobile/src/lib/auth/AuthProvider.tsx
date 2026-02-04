import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { clearToken, getToken, setToken } from './token';

export type AuthContextValue = {
  token: string | null;
  isReady: boolean;
  signIn: (nextToken: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadToken = async () => {
      const stored = await getToken();
      setTokenState(stored);
      setIsReady(true);
    };
    loadToken();
  }, []);

  const signIn = useCallback(async (nextToken: string) => {
    await setToken(nextToken);
    setTokenState(nextToken);
  }, []);

  const signOut = useCallback(async () => {
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
