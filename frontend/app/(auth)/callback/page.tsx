'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { setToken } from '@/lib/auth/token';
import { LoadingState } from '@/components/loading-state';

export default function CallbackPage() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const token = params.get('token');
    const error = params.get('error');

    if (error) {
      toast.error('Social login failed. Please try again.');
      router.replace('/login');
      return;
    }

    if (token) {
      setToken(token);
      toast.success('Welcome!');
      router.replace('/feed');
      return;
    }

    router.replace('/login');
  }, [params, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoadingState label="Completing sign in" />
    </div>
  );
}
