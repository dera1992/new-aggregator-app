'use client';

import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { generatePerspective } from '@/lib/api/news';
import type { PerspectiveSlangLevel, PerspectiveTone } from '@/types/news';

export function usePerspective(
  clusterId: number,
  tone: PerspectiveTone,
  slangLevel: PerspectiveSlangLevel,
  forceRefreshToken = 0,
) {
  const queryClient = useQueryClient();
  const prevQueryKey = useRef('');

  const result = useQuery({
    queryKey: ['perspective', clusterId, tone, slangLevel, forceRefreshToken],
    queryFn: () =>
      generatePerspective(clusterId, {
        tone,
        slangLevel,
        forceRefresh: forceRefreshToken > 0,
      }),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    enabled: Number.isFinite(clusterId) && clusterId > 0,
  });

  // Invalidate credits whenever a fresh perspective generation completes
  useEffect(() => {
    const currentKey = JSON.stringify([clusterId, tone, slangLevel, forceRefreshToken]);
    if (result.data && currentKey !== prevQueryKey.current) {
      prevQueryKey.current = currentKey;
      queryClient.invalidateQueries({ queryKey: ['credits'] });
    }
  }, [result.data, clusterId, tone, slangLevel, forceRefreshToken, queryClient]);

  return result;
}
