export type StorySource = {
  name: string;
  url: string;
  title?: string;
};

export type Story = {
  cluster_id: number;
  story_title: string;
  summary: string;
  sources: StorySource[];
  timestamp: string;
  lead_article_id?: number;
};

export type FeedResponse = {
  stories: Story[];
  count: number;
  offset: number;
  limit: number;
};

export type PersonalizedFeedResponse = FeedResponse & {
  preferences?: {
    preferred_categories: string[];
    preferred_sources: string[];
  };
};

export type ArchiveArticle = {
  title: string;
  summary: string;
  category: string;
  source: string;
  url: string;
  timestamp: string;
  cluster_id: number | null;
  article_id?: number;
};

export type ArchiveResponse = {
  articles: ArchiveArticle[];
  count: number;
  offset: number;
  limit: number;
};

export type StoryResponse = {
  cluster_id: number;
  story_title: string;
  summary: string;
  sources: { name: string; url: string; title: string }[];
};

export type SavedArticlesResponse = {
  articles: ArchiveArticle[];
  count: number;
};

export type ReadArticlesResponse = {
  articles: ArchiveArticle[];
  count: number;
};

export type ViralPostVariant = {
  hook: string;
  body: string;
  hashtags: string[];
  thread?: string[];
};

export type ViralPostResponse = {
  best_variant_index: number;
  warnings: string[];
  variants: ViralPostVariant[];
};

export type CommentVariant = {
  tone: string;
  comment: string;
  cta_question: string;
};

export type CommentResponse = {
  best_variant_index: number;
  warnings: string[];
  comments: CommentVariant[];
};

export type JokePlatform = 'General' | 'Twitter' | 'LinkedIn' | 'Instagram' | 'Reddit';

export type JokeStyle = 'pun' | 'one_liner' | 'observational' | 'satire_light' | 'dad_joke';

export type GenerateJokeRequest = {
  summary: string;
  platform: JokePlatform;
  style: JokeStyle;
  audience?: string;
  max_variants: number;
  fact_mode: boolean;
};

export type JokeItem = {
  style: string;
  setup: string;
  punchline: string;
  full_joke: string;
  cta: string;
};

export type GenerateJokeResponse = {
  best_variant_index: number;
  warnings: string[];
  jokes: JokeItem[];
};

export type AnalysisFormat = 'brief' | 'standard' | 'deep';
export type AnalysisTone = 'neutral' | 'insightful' | 'skeptical' | 'optimistic';
export type AnalysisAudience = 'general' | 'business' | 'tech' | 'policy' | 'investors';

export type GenerateAnalysisRequest = {
  summary: string;
  format: AnalysisFormat;
  tone: AnalysisTone;
  audience: AnalysisAudience;
  include_takeaways: boolean;
  include_counterpoints: boolean;
  include_what_to_watch: boolean;
  fact_mode: boolean;
};

export type AnalysisVariant = {
  title: string;
  hook: string;
  analysis: string;
  key_takeaways: string[];
  counterpoints: string[];
  what_to_watch: string[];
  reading_time_seconds: number;
};

export type GenerateAnalysisResponse = {
  best_variant_index: number;
  warnings: string[];
  variants: AnalysisVariant[];
};
