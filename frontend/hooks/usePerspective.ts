'use client';

import { useQuery } from '@tanstack/react-query';

import { generatePerspective } from '@/lib/api/news';
import type { PerspectiveSlangLevel, PerspectiveTone } from '@/types/news';

export function usePerspective(
  clusterId: number,
  tone: PerspectiveTone,
  slangLevel: PerspectiveSlangLevel,
  forceRefreshToken = 0,
) {
  return useQuery({
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
}
