import { apiClient } from './client';
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

export async function fetchFeed(query: FeedQuery) {
  const { data } = await apiClient.get<FeedResponse>(`/api/news/feed${toQuery(query)}`);
  return data;
}

export async function fetchPersonalizedFeed(query: FeedQuery) {
  const { data } = await apiClient.get<PersonalizedFeedResponse>(
    `/api/news/personalized${toQuery(query)}`,
  );
  return data;
}

export async function fetchArchive(query: ArchiveQuery) {
  const { data } = await apiClient.get<ArchiveResponse>(`/api/news/archive${toQuery(query)}`);
  return data;
}

export async function fetchStory(clusterId: string) {
  const { data } = await apiClient.get<StoryResponse>(`/api/news/story/${clusterId}`);
  return data;
}

export async function saveArticle(articleId: number) {
  const { data } = await apiClient.post<{ message: string }>(`/api/news/save`, {
    article_id: articleId,
  });
  return data;
}

export async function readArticle(articleId: number) {
  const { data } = await apiClient.post<{ message: string }>(`/api/news/read`, {
    article_id: articleId,
  });
  return data;
}

export async function fetchSavedArticles() {
  const { data } = await apiClient.get<SavedArticlesResponse>(`/api/news/saved`);
  return data;
}

export async function fetchReadArticles() {
  const { data } = await apiClient.get<ReadArticlesResponse>(`/api/news/read-articles`);
  return data;
}

export async function generateViralPost(payload: Record<string, unknown>) {
  const { data } = await apiClient.post<ViralPostResponse>(`/api/news/generate-viral-post`, payload);
  return data;
}

export async function generateComment(payload: Record<string, unknown>) {
  const { data } = await apiClient.post<CommentResponse>(`/api/news/generate-comment`, payload);
  return data;
}

export async function generateJoke(payload: GenerateJokeRequest) {
  const { data } = await apiClient.post<GenerateJokeResponse>(`/api/news/generate-joke`, payload);
  return data;
}

export async function generateAnalysis(payload: GenerateAnalysisRequest) {
  const { data } = await apiClient.post<GenerateAnalysisResponse>(`/api/news/generate-analysis`, payload);
  return data;
}
