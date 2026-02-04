import type { GenerateAnalysisRequest, GenerateJokeRequest, JokePlatform, JokeStyle } from '@/types/news';

export type SummaryStyle = 'short' | 'standard' | 'detailed';

export type GenerateSummaryRequest = {
  text: string;
  max_length?: number;
  style?: SummaryStyle;
  fact_mode?: boolean;
  model?: string | null;
};

export type GenerateSummaryResponse = {
  summary: string;
  warnings: string[];
};

export type GenerateAnalysisFromTextRequest = Omit<GenerateAnalysisRequest, 'summary'> & {
  text: string;
};

export type GenerateJokeFromTextRequest = Omit<GenerateJokeRequest, 'summary'> & {
  text: string;
};

export type GenerateViralPostFromTextRequest = {
  text: string;
  platform: 'twitter' | 'linkedin' | 'instagram';
  tone: string;
  goal: string;
  audience: string;
  brand_voice: string;
  max_variants: number;
  fact_mode: boolean;
};

export type GenerateCommentFromTextRequest = {
  text: string;
  platform: 'General' | 'Twitter' | 'LinkedIn' | 'Facebook' | 'Reddit';
  style: 'curious' | 'supportive' | 'critical' | 'neutral';
  audience: string;
  max_variants: number;
  fact_mode: boolean;
};

export type ComposeJokePlatform = JokePlatform;
export type ComposeJokeStyle = JokeStyle;
