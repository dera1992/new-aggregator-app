import { useQuery } from "@tanstack/react-query";

import {
  generatePerspective,
  type PerspectiveSlang,
  type PerspectiveTone,
} from "@/lib/api/news";

export function usePerspective(
  clusterId: number,
  tone: PerspectiveTone,
  slang: PerspectiveSlang,
) {
  return useQuery({
    queryKey: ["perspective", clusterId, tone, slang],
    queryFn: () => generatePerspective({ clusterId, tone, slangLevel: slang }),
    enabled: Number.isFinite(clusterId),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
