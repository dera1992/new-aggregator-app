'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { getToken } from '@/lib/auth/token';
import { LoadingState } from '@/components/loading-state';

export function ClientAuthGuard({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    setChecking(false);
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState label="Checking session" />
      </div>
    );
  }

  return <>{children}</>;
}
