'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { getToken } from '@/lib/auth/token';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    router.replace(token ? '/feed' : '/login');
  }, [router]);

  return null;
}
