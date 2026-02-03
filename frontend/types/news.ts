export type StorySource = {
  name: string;
  url: string;
  title?: string;
};

export type Story = {
  story_title: string;
  summary: string;
  sources: StorySource[];
  timestamp: string;
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
