import { apiFetch } from '@/lib/api/client';
import type {
  GenerateAnalysisFromTextRequest,
  GenerateCommentFromTextRequest,
  GenerateJokeFromTextRequest,
  GenerateSummaryRequest,
  GenerateSummaryResponse,
  GenerateViralPostFromTextRequest,
} from '@/types/compose';
import type {
  CommentResponse,
  GenerateAnalysisResponse,
  GenerateJokeResponse,
  ViralPostResponse,
} from '@/types/news';

export function generateSummaryFromText(payload: GenerateSummaryRequest) {
  return apiFetch<GenerateSummaryResponse>('/api/news/generate-summary', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function generateAnalysisFromText(payload: GenerateAnalysisFromTextRequest) {
  return apiFetch<GenerateAnalysisResponse>('/api/news/generate-analysis', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function generateJokeFromText(payload: GenerateJokeFromTextRequest) {
  return apiFetch<GenerateJokeResponse>('/api/news/generate-joke', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function generateViralPostFromText(payload: GenerateViralPostFromTextRequest) {
  return apiFetch<ViralPostResponse>('/api/news/generate-viral-post', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function generateCommentFromText(payload: GenerateCommentFromTextRequest) {
  return apiFetch<CommentResponse>('/api/news/generate-comment', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
