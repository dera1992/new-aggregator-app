import { apiFetch } from '@/lib/api/client';
import type {
  ArchiveResponse,
  FeedResponse,
  PersonalizedFeedResponse,
  SavedArticlesResponse,
  StoryResponse,
  ReadArticlesResponse,
  ViralPostResponse,
  CommentResponse,
  GenerateJokeRequest,
  GenerateJokeResponse,
  GenerateAnalysisRequest,
  GenerateAnalysisResponse,
} from '@/types/news';

export type FeedQuery = {
  category?: string;
  source?: string;
  since?: string;
  limit?: number;
  offset?: number;
};

export type ArchiveQuery = {
  category?: string;
  source?: string;
  before?: string;
  limit?: number;
  offset?: number;
};

function toQuery(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

export function fetchFeed(query: FeedQuery) {
  return apiFetch<FeedResponse>(`/api/news/feed${toQuery(query)}`);
}

export function fetchPersonalizedFeed(query: FeedQuery) {
  return apiFetch<PersonalizedFeedResponse>(
    `/api/news/personalized${toQuery(query)}`,
  );
}

export function fetchArchive(query: ArchiveQuery) {
  return apiFetch<ArchiveResponse>(`/api/news/archive${toQuery(query)}`);
}

export function fetchStory(clusterId: string) {
  return apiFetch<StoryResponse>(`/api/news/story/${clusterId}`);
}

export function saveArticle(articleId: number) {
  return apiFetch<{ message: string }>(`/api/news/save`, {
    method: 'POST',
    body: JSON.stringify({ article_id: articleId }),
  });
}

export function readArticle(articleId: number) {
  return apiFetch<{ message: string }>(`/api/news/read`, {
    method: 'POST',
    body: JSON.stringify({ article_id: articleId }),
  });
}

export function fetchSavedArticles() {
  return apiFetch<SavedArticlesResponse>(`/api/news/saved`);
}

export function fetchReadArticles() {
  return apiFetch<ReadArticlesResponse>(`/api/news/read-articles`);
}

export function generateViralPost(payload: Record<string, unknown>) {
  return apiFetch<ViralPostResponse>(`/api/news/generate-viral-post`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function generateComment(payload: Record<string, unknown>) {
  return apiFetch<CommentResponse>(`/api/news/generate-comment`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function generateJoke(payload: GenerateJokeRequest) {
  return apiFetch<GenerateJokeResponse>(`/api/news/generate-joke`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function generateAnalysis(payload: GenerateAnalysisRequest) {
  return apiFetch<GenerateAnalysisResponse>(`/api/news/generate-analysis`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
