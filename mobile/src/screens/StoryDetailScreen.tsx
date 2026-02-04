import React, { useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { Accordion } from '@/components/Accordion';
import { Input } from '@/components/Input';
import { OptionGroup } from '@/components/OptionGroup';
import { ShareActions } from '@/components/ShareActions';
import { fetchStory, generateAnalysis, generateComment, generateJoke, generateViralPost } from '@/lib/api/news';
import type { RootStackParamList } from '@/navigation/root-navigation';
import type {
  AnalysisFormat,
  AnalysisTone,
  AnalysisAudience,
  GenerateAnalysisResponse,
  ViralPostResponse,
  CommentResponse,
  GenerateJokeResponse,
  JokePlatform,
  JokeStyle,
} from '@/types/news';


type StoryRouteProp = RouteProp<RootStackParamList, 'StoryDetail'>;

export function StoryDetailScreen() {
  const route = useRoute<StoryRouteProp>();
  const { clusterId } = route.params;

  const storyQuery = useQuery({
    queryKey: ['story', clusterId],
    queryFn: () => fetchStory(clusterId),
  });
  const summaryReady = (storyQuery.data?.summary ?? '').length > 0;

  const [viralOptions, setViralOptions] = useState({
    platform: 'twitter',
    tone: 'punchy',
    goal: 'drive engagement',
    audience: 'news readers',
    brand_voice: 'confident and clear',
    max_variants: '3',
    fact_mode: true,
  });

  const [commentOptions, setCommentOptions] = useState({
    platform: 'General',
    style: 'curious',
    audience: 'general audience',
    max_variants: '3',
    fact_mode: true,
  });

  const [jokeOptions, setJokeOptions] = useState({
    platform: 'General' as JokePlatform,
    style: 'one_liner' as JokeStyle,
    audience: '',
    max_variants: '3',
    fact_mode: true,
  });

  const [analysisOptions, setAnalysisOptions] = useState({
    format: 'standard' as AnalysisFormat,
    tone: 'insightful' as AnalysisTone,
    audience: 'general' as AnalysisAudience,
    include_takeaways: true,
    include_counterpoints: true,
    include_what_to_watch: true,
    fact_mode: true,
  });

  const viralMutation = useMutation({
    mutationFn: async () =>
      generateViralPost({
        summary: storyQuery.data?.summary ?? '',
        platform: viralOptions.platform,
        tone: viralOptions.tone,
        goal: viralOptions.goal,
        audience: viralOptions.audience,
        brand_voice: viralOptions.brand_voice,
        max_variants: Number(viralOptions.max_variants) || 1,
        fact_mode: viralOptions.fact_mode ? 'strict' : 'balanced',
      }),
  });

  const commentMutation = useMutation({
    mutationFn: async () =>
      generateComment({
        summary: storyQuery.data?.summary ?? '',
        platform: commentOptions.platform,
        style: commentOptions.style,
        audience: commentOptions.audience,
        max_variants: Number(commentOptions.max_variants) || 1,
        fact_mode: commentOptions.fact_mode ? 'strict' : 'balanced',
      }),
  });

  const jokeMutation = useMutation({
    mutationFn: async () =>
      generateJoke({
        summary: storyQuery.data?.summary ?? '',
        platform: jokeOptions.platform,
        style: jokeOptions.style,
        audience: jokeOptions.audience || undefined,
        max_variants: Number(jokeOptions.max_variants) || 1,
        fact_mode: jokeOptions.fact_mode,
      }),
  });

  const analysisMutation = useMutation({
    mutationFn: async () =>
      generateAnalysis({
        summary: storyQuery.data?.summary ?? '',
        format: analysisOptions.format,
        tone: analysisOptions.tone,
        audience: analysisOptions.audience,
        include_takeaways: analysisOptions.include_takeaways,
        include_counterpoints: analysisOptions.include_counterpoints,
        include_what_to_watch: analysisOptions.include_what_to_watch,
        fact_mode: analysisOptions.fact_mode,
      }),
  });

  const viralResult = viralMutation.data as ViralPostResponse | undefined;
  const commentResult = commentMutation.data as CommentResponse | undefined;
  const jokeResult = jokeMutation.data as GenerateJokeResponse | undefined;
  const analysisResult = analysisMutation.data as GenerateAnalysisResponse | undefined;

  const viralCopy = (variant: ViralPostResponse['variants'][number]) => {
    return [
      `Hook: ${variant.hook}`,
      `Body: ${variant.body}`,
      variant.hashtags.length ? `Hashtags: ${variant.hashtags.join(' ')}` : '',
      variant.thread?.length ? `Thread: ${variant.thread.join('\n')}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');
  };

  const commentCopy = (variant: CommentResponse['comments'][number]) => {
    return `Comment (${variant.tone}): ${variant.comment}\nCTA: ${variant.cta_question}`;
  };

  const jokeCopy = (variant: GenerateJokeResponse['jokes'][number]) => {
    return `Setup: ${variant.setup}\nPunchline: ${variant.punchline}\n${variant.full_joke}`;
  };

  const analysisCopy = (variant: GenerateAnalysisResponse['variants'][number]) => {
    return [
      variant.title ? `Title: ${variant.title}` : '',
      variant.hook ? `Hook: ${variant.hook}` : '',
      variant.analysis ? `Analysis: ${variant.analysis}` : '',
      variant.key_takeaways.length ? `Key takeaways:\n- ${variant.key_takeaways.join('\n- ')}` : '',
      variant.counterpoints.length ? `Counterpoints:\n- ${variant.counterpoints.join('\n- ')}` : '',
      variant.what_to_watch.length ? `What to watch:\n- ${variant.what_to_watch.join('\n- ')}` : '',
      `Reading time: ${variant.reading_time_seconds}s`,
    ]
      .filter(Boolean)
      .join('\n\n');
  };

  if (storyQuery.isLoading) {
    return (
      <Screen>
        <LoadingState label="Loading story" />
      </Screen>
    );
  }

  if (storyQuery.error) {
    return (
      <Screen>
        <ErrorState message={(storyQuery.error as Error).message} />
      </Screen>
    );
  }

  if (!storyQuery.data) {
    return (
      <Screen>
        <EmptyState message="Story not found." />
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="gap-6">
        <Card className="gap-3">
          <Text className="text-xl font-semibold text-foreground dark:text-dark-foreground">{storyQuery.data.story_title}</Text>
          <Text className="text-sm text-muted-foreground dark:text-dark-muted-foreground">{storyQuery.data.summary}</Text>
          <View className="gap-2">
            <Text className="text-xs font-semibold text-muted-foreground dark:text-dark-muted-foreground">Sources</Text>
            {storyQuery.data.sources.map((source) => (
              <Text
                key={source.url}
                className="text-sm text-primary"
                onPress={() => Linking.openURL(source.url)}
              >
                {source.name} · {source.title}
              </Text>
            ))}
          </View>
        </Card>

        <Accordion title="Viral Post" defaultOpen>
          <View className="gap-4">
            <OptionGroup
              label="Platform"
              options={[
                { label: 'Twitter / X', value: 'twitter' },
                { label: 'LinkedIn', value: 'linkedin' },
                { label: 'Instagram', value: 'instagram' },
              ]}
              value={viralOptions.platform}
              onChange={(value) => setViralOptions((prev) => ({ ...prev, platform: value }))}
            />
            <Input placeholder="Tone" value={viralOptions.tone} onChangeText={(value) => setViralOptions((prev) => ({ ...prev, tone: value }))} />
            <Input placeholder="Goal" value={viralOptions.goal} onChangeText={(value) => setViralOptions((prev) => ({ ...prev, goal: value }))} />
            <Input placeholder="Audience" value={viralOptions.audience} onChangeText={(value) => setViralOptions((prev) => ({ ...prev, audience: value }))} />
            <Input placeholder="Brand voice" value={viralOptions.brand_voice} onChangeText={(value) => setViralOptions((prev) => ({ ...prev, brand_voice: value }))} />
            <Input
              placeholder="Max variants"
              keyboardType="numeric"
              value={viralOptions.max_variants}
              onChangeText={(value) => setViralOptions((prev) => ({ ...prev, max_variants: value }))}
            />
            <OptionGroup
              label="Fact mode"
              options={[
                { label: 'Strict', value: 'strict' },
                { label: 'Balanced', value: 'balanced' },
              ]}
              value={viralOptions.fact_mode ? 'strict' : 'balanced'}
              onChange={(value) => setViralOptions((prev) => ({ ...prev, fact_mode: value === 'strict' }))}
            />
            <Button
              label={viralMutation.isPending ? 'Generating...' : 'Generate viral post'}
              onPress={() => viralMutation.mutate()}
              disabled={!summaryReady}
            />
            {viralMutation.error ? <ErrorState message={(viralMutation.error as Error).message} /> : null}
            {viralResult?.warnings?.length ? (
              <Text className="text-xs text-yellow-600">Warnings: {viralResult.warnings.join(', ')}</Text>
            ) : null}
            {viralResult?.variants?.map((variant, index) => (
              <Card key={`${variant.hook}-${index}`} className="gap-3">
                <Text className="text-sm font-semibold text-foreground dark:text-dark-foreground">Variant {index + 1}</Text>
                <Text className="text-sm text-muted-foreground dark:text-dark-muted-foreground">{variant.hook}</Text>
                <Text className="text-sm text-foreground dark:text-dark-foreground">{variant.body}</Text>
                {variant.hashtags.length ? (
                  <Text className="text-xs text-muted-foreground dark:text-dark-muted-foreground">{variant.hashtags.join(' ')}</Text>
                ) : null}
                <ShareActions title="Viral post" text={viralCopy(variant)} />
              </Card>
            ))}
          </View>
        </Accordion>

        <Accordion title="Comment">
          <View className="gap-4">
            <OptionGroup
              label="Platform"
              options={[
                { label: 'General', value: 'General' },
                { label: 'Twitter', value: 'Twitter' },
                { label: 'LinkedIn', value: 'LinkedIn' },
                { label: 'Facebook', value: 'Facebook' },
                { label: 'Reddit', value: 'Reddit' },
              ]}
              value={commentOptions.platform}
              onChange={(value) => setCommentOptions((prev) => ({ ...prev, platform: value }))}
            />
            <OptionGroup
              label="Style"
              options={[
                { label: 'Curious', value: 'curious' },
                { label: 'Supportive', value: 'supportive' },
                { label: 'Critical', value: 'critical' },
                { label: 'Neutral', value: 'neutral' },
              ]}
              value={commentOptions.style}
              onChange={(value) => setCommentOptions((prev) => ({ ...prev, style: value }))}
            />
            <Input placeholder="Audience" value={commentOptions.audience} onChangeText={(value) => setCommentOptions((prev) => ({ ...prev, audience: value }))} />
            <Input
              placeholder="Max variants"
              keyboardType="numeric"
              value={commentOptions.max_variants}
              onChangeText={(value) => setCommentOptions((prev) => ({ ...prev, max_variants: value }))}
            />
            <OptionGroup
              label="Fact mode"
              options={[
                { label: 'Strict', value: 'strict' },
                { label: 'Balanced', value: 'balanced' },
              ]}
              value={commentOptions.fact_mode ? 'strict' : 'balanced'}
              onChange={(value) => setCommentOptions((prev) => ({ ...prev, fact_mode: value === 'strict' }))}
            />
            <Button
              label={commentMutation.isPending ? 'Generating...' : 'Generate comment'}
              onPress={() => commentMutation.mutate()}
              disabled={!summaryReady}
            />
            {commentMutation.error ? <ErrorState message={(commentMutation.error as Error).message} /> : null}
            {commentResult?.warnings?.length ? (
              <Text className="text-xs text-yellow-600">Warnings: {commentResult.warnings.join(', ')}</Text>
            ) : null}
            {commentResult?.comments?.map((comment, index) => (
              <Card key={`${comment.comment}-${index}`} className="gap-3">
                <Text className="text-sm font-semibold text-foreground dark:text-dark-foreground">Variant {index + 1}</Text>
                <Text className="text-sm text-muted-foreground dark:text-dark-muted-foreground">{comment.comment}</Text>
                <Text className="text-xs text-muted-foreground dark:text-dark-muted-foreground">CTA: {comment.cta_question}</Text>
                <ShareActions title="Comment" text={commentCopy(comment)} />
              </Card>
            ))}
          </View>
        </Accordion>

        <Accordion title="Joke">
          <View className="gap-4">
            <OptionGroup
              label="Platform"
              options={[
                { label: 'General', value: 'General' },
                { label: 'Twitter', value: 'Twitter' },
                { label: 'LinkedIn', value: 'LinkedIn' },
                { label: 'Instagram', value: 'Instagram' },
                { label: 'Reddit', value: 'Reddit' },
              ]}
              value={jokeOptions.platform}
              onChange={(value) => setJokeOptions((prev) => ({ ...prev, platform: value }))}
            />
            <OptionGroup
              label="Style"
              options={[
                { label: 'Pun', value: 'pun' },
                { label: 'One liner', value: 'one_liner' },
                { label: 'Observational', value: 'observational' },
                { label: 'Satire light', value: 'satire_light' },
                { label: 'Dad joke', value: 'dad_joke' },
              ]}
              value={jokeOptions.style}
              onChange={(value) => setJokeOptions((prev) => ({ ...prev, style: value }))}
            />
            <Input placeholder="Audience (optional)" value={jokeOptions.audience} onChangeText={(value) => setJokeOptions((prev) => ({ ...prev, audience: value }))} />
            <Input
              placeholder="Max variants"
              keyboardType="numeric"
              value={jokeOptions.max_variants}
              onChangeText={(value) => setJokeOptions((prev) => ({ ...prev, max_variants: value }))}
            />
            <OptionGroup
              label="Fact mode"
              options={[
                { label: 'On', value: 'on' },
                { label: 'Off', value: 'off' },
              ]}
              value={jokeOptions.fact_mode ? 'on' : 'off'}
              onChange={(value) => setJokeOptions((prev) => ({ ...prev, fact_mode: value === 'on' }))}
            />
            <Button
              label={jokeMutation.isPending ? 'Generating...' : 'Generate joke'}
              onPress={() => jokeMutation.mutate()}
              disabled={!summaryReady}
            />
            {jokeMutation.error ? <ErrorState message={(jokeMutation.error as Error).message} /> : null}
            {jokeResult?.warnings?.length ? (
              <Text className="text-xs text-yellow-600">Warnings: {jokeResult.warnings.join(', ')}</Text>
            ) : null}
            {jokeResult?.jokes?.map((joke, index) => (
              <Card key={`${joke.full_joke}-${index}`} className="gap-3">
                <Text className="text-sm font-semibold text-foreground dark:text-dark-foreground">Variant {index + 1}</Text>
                <Text className="text-sm text-muted-foreground dark:text-dark-muted-foreground">{joke.full_joke}</Text>
                <ShareActions title="Joke" text={jokeCopy(joke)} />
              </Card>
            ))}
          </View>
        </Accordion>

        <Accordion title="Analysis">
          <View className="gap-4">
            <OptionGroup
              label="Format"
              options={[
                { label: 'Brief', value: 'brief' },
                { label: 'Standard', value: 'standard' },
                { label: 'Deep', value: 'deep' },
              ]}
              value={analysisOptions.format}
              onChange={(value) => setAnalysisOptions((prev) => ({ ...prev, format: value }))}
            />
            <OptionGroup
              label="Tone"
              options={[
                { label: 'Neutral', value: 'neutral' },
                { label: 'Insightful', value: 'insightful' },
                { label: 'Skeptical', value: 'skeptical' },
                { label: 'Optimistic', value: 'optimistic' },
              ]}
              value={analysisOptions.tone}
              onChange={(value) => setAnalysisOptions((prev) => ({ ...prev, tone: value }))}
            />
            <OptionGroup
              label="Audience"
              options={[
                { label: 'General', value: 'general' },
                { label: 'Business', value: 'business' },
                { label: 'Tech', value: 'tech' },
                { label: 'Policy', value: 'policy' },
                { label: 'Investors', value: 'investors' },
              ]}
              value={analysisOptions.audience}
              onChange={(value) => setAnalysisOptions((prev) => ({ ...prev, audience: value }))}
            />
            <OptionGroup
              label="Include takeaways"
              options={[
                { label: 'Yes', value: 'yes' },
                { label: 'No', value: 'no' },
              ]}
              value={analysisOptions.include_takeaways ? 'yes' : 'no'}
              onChange={(value) => setAnalysisOptions((prev) => ({ ...prev, include_takeaways: value === 'yes' }))}
            />
            <OptionGroup
              label="Include counterpoints"
              options={[
                { label: 'Yes', value: 'yes' },
                { label: 'No', value: 'no' },
              ]}
              value={analysisOptions.include_counterpoints ? 'yes' : 'no'}
              onChange={(value) => setAnalysisOptions((prev) => ({ ...prev, include_counterpoints: value === 'yes' }))}
            />
            <OptionGroup
              label="Include what to watch"
              options={[
                { label: 'Yes', value: 'yes' },
                { label: 'No', value: 'no' },
              ]}
              value={analysisOptions.include_what_to_watch ? 'yes' : 'no'}
              onChange={(value) => setAnalysisOptions((prev) => ({ ...prev, include_what_to_watch: value === 'yes' }))}
            />
            <OptionGroup
              label="Fact mode"
              options={[
                { label: 'On', value: 'on' },
                { label: 'Off', value: 'off' },
              ]}
              value={analysisOptions.fact_mode ? 'on' : 'off'}
              onChange={(value) => setAnalysisOptions((prev) => ({ ...prev, fact_mode: value === 'on' }))}
            />
            <Button
              label={analysisMutation.isPending ? 'Generating...' : 'Generate analysis'}
              onPress={() => analysisMutation.mutate()}
              disabled={!summaryReady}
            />
            {analysisMutation.error ? <ErrorState message={(analysisMutation.error as Error).message} /> : null}
            {analysisResult?.warnings?.length ? (
              <Text className="text-xs text-yellow-600">Warnings: {analysisResult.warnings.join(', ')}</Text>
            ) : null}
            {analysisResult?.variants?.map((variant, index) => (
              <Card key={`${variant.title}-${index}`} className="gap-3">
                <Text className="text-sm font-semibold text-foreground dark:text-dark-foreground">Variant {index + 1}</Text>
                <Text className="text-sm text-foreground dark:text-dark-foreground">{variant.title}</Text>
                <Text className="text-xs text-muted-foreground dark:text-dark-muted-foreground">
                  {variant.reading_time_seconds}s reading time
                </Text>
                <Text className="text-sm text-muted-foreground dark:text-dark-muted-foreground">{variant.analysis}</Text>
                <ShareActions title={variant.title || 'Analysis'} text={analysisCopy(variant)} />
              </Card>
            ))}
          </View>
        </Accordion>
      </View>
    </Screen>
  );
}
