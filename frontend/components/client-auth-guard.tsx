'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { getToken, setToken } from '@/lib/auth/token';
import { refreshAccessToken } from '@/lib/api/auth';
import { LoadingState } from '@/components/loading-state';

export function ClientAuthGuard({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      let token = getToken();
      if (!token) {
        // Attempt silent refresh via httpOnly cookie before redirecting
        try {
          const data = await refreshAccessToken();
          if (data.token) {
            setToken(data.token);
            setChecking(false);
            return;
          }
        } catch {
          // refresh failed — send to login
        }
        router.replace('/login');
        return;
      }
      setChecking(false);
    }
    checkAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState label="Checking session" />
      </div>
    );
  }

  return <>{children}</>;
}
