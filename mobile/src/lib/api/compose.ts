import { apiClient } from './client';
import type {
  ViralPostResponse,
  CommentResponse,
  GenerateAnalysisResponse,
  GenerateJokeResponse,
} from '@/types/news';
import type { PerspectiveResponse } from '@/lib/api/news';

export type SummaryStyle = 'short' | 'standard' | 'detailed';

export type GenerateSummaryResponse = {
  summary: string;
  warnings: string[];
};

export type ExtractUrlTextResponse = {
  url: string;
  text: string;
  source_type: 'article' | 'youtube';
};

export async function generateSummaryFromText(payload: {
  text: string;
  style?: SummaryStyle;
  max_length?: number;
}) {
  const { data } = await apiClient.post<GenerateSummaryResponse>(
    '/api/news/generate-summary',
    payload,
  );
  return data;
}

export async function generateAnalysisFromText(payload: {
  text: string;
  format?: string;
  tone?: string;
  audience?: string;
  include_takeaways?: boolean;
  include_counterpoints?: boolean;
  include_what_to_watch?: boolean;
  fact_mode?: boolean;
}) {
  const { data } = await apiClient.post<GenerateAnalysisResponse>(
    '/api/news/generate-analysis',
    payload,
  );
  return data;
}

export async function generateJokeFromText(payload: {
  text: string;
  platform?: string;
  style?: string;
  audience?: string;
  max_variants?: number;
  fact_mode?: boolean;
}) {
  const { data } = await apiClient.post<GenerateJokeResponse>(
    '/api/news/generate-joke',
    payload,
  );
  return data;
}

export async function generateViralPostFromText(payload: {
  text: string;
  platform?: string;
  tone?: string;
  goal?: string;
  audience?: string;
  brand_voice?: string;
  max_variants?: number;
  fact_mode?: boolean;
}) {
  const { data } = await apiClient.post<ViralPostResponse>(
    '/api/news/generate-viral-post',
    payload,
  );
  return data;
}

export async function generateCommentFromText(payload: {
  text: string;
  platform?: string;
  style?: string;
  audience?: string;
  max_variants?: number;
  fact_mode?: boolean;
}) {
  const { data } = await apiClient.post<CommentResponse>(
    '/api/news/generate-comment',
    payload,
  );
  return data;
}

export async function generatePerspectiveFromText(payload: {
  text: string;
  tone?: string;
  slang_level?: string;
}) {
  const { data } = await apiClient.post<PerspectiveResponse>(
    '/api/news/generate-perspective-from-text',
    payload,
  );
  return data;
}

export async function extractUrlText(url: string): Promise<ExtractUrlTextResponse> {
  const { data } = await apiClient.post<ExtractUrlTextResponse>(
    '/api/news/extract-url-text',
    { url },
  );
  return data;
}
