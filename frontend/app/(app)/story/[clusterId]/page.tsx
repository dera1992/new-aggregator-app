'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { fetchStory, generateComment, generateViralPost } from '@/lib/api/news';
import { usePerspective } from '@/hooks/usePerspective';
import type { PerspectiveSlangLevel, PerspectiveTone } from '@/types/news';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { EmptyState } from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CopyButton } from '@/components/copy-button';
import { JokeGenerator } from '@/components/JokeGenerator';
import { AnalysisGenerator } from '@/components/AnalysisGenerator';
import { loadGeneratorDefaults } from '@/lib/utils/generator-defaults';
import { ShareActions } from '@/components/share-actions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

const viralSchema = z.object({
  platform: z.enum(['Twitter', 'LinkedIn', 'Instagram']),
  tone: z.enum([
    'bold',
    'friendly',
    'professional',
    'funny',
    'controversial_light',
  ]),
  goal: z.enum(['engagement', 'clicks', 'followers', 'thought_leadership']),
  audience: z.string().optional(),
  brandVoice: z.string().optional(),
  maxVariants: z.number().min(1).max(5),
  factMode: z.boolean(),
});

type ViralValues = z.infer<typeof viralSchema>;

const commentSchema = z.object({
  platform: z.enum(['General', 'Twitter', 'LinkedIn', 'Facebook', 'Reddit']),
  style: z.enum(['curious', 'supportive', 'critical', 'neutral']),
  audience: z.string().optional(),
  maxVariants: z.number().min(1).max(5),
  factMode: z.boolean(),
});

type CommentValues = z.infer<typeof commentSchema>;


const viralAudienceOptions = [
  'General audience',
  'Founders',
  'Marketers',
  'Developers',
  'Executives',
  'Investors',
] as const;

const viralBrandVoiceOptions = [
  'clear and confident',
  'bold and direct',
  'professional and credible',
  'friendly and conversational',
  'witty and playful',
] as const;

const commentAudienceOptions = [
  'General audience',
  'Founders',
  'Creators',
  'Developers',
  'Investors',
  'Customers',
] as const;

const buildViralCopy = (variant: {
  hook: string;
  body: string;
  hashtags: string[];
  thread?: string[];
}) =>
  `${variant.hook}\n\n${variant.body}` +
  (variant.thread ? `\n\n${variant.thread.join('\n')}` : '') +
  `\n\n${variant.hashtags.join(' ')}`;

const buildCommentCopy = (comment: { comment: string; cta_question: string }) =>
  [comment.comment, comment.cta_question].filter(Boolean).join('\n\n');

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">
          {Math.round(value * 100)}%
        </span>
      </div>
      <div className="h-2 rounded bg-muted">
        <div
          className="h-2 rounded bg-primary"
          style={{ width: `${Math.max(0, Math.min(100, value * 100))}%` }}
        />
      </div>
    </div>
  );
}

export default function StoryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const clusterId = params.clusterId as string;
  const numericClusterId = Number(clusterId);
  const [defaults, setDefaults] = useState(loadGeneratorDefaults());
  const [tone, setTone] = useState<PerspectiveTone>('genz');
  const [slangLevel, setSlangLevel] = useState<PerspectiveSlangLevel>('light');
  const [refreshToken, setRefreshToken] = useState(0);

  const storyQuery = useQuery({
    queryKey: ['story', clusterId],
    queryFn: () => fetchStory(clusterId),
  });

  const perspectiveQuery = usePerspective(
    numericClusterId,
    tone,
    slangLevel,
    refreshToken,
  );

  useEffect(() => {
    setDefaults(loadGeneratorDefaults());
  }, []);

  const viralForm = useForm<ViralValues>({
    resolver: zodResolver(viralSchema),
    defaultValues: {
      platform: 'Twitter',
      tone: defaults.tone as ViralValues['tone'],
      goal: defaults.goal as ViralValues['goal'],
      audience: defaults.audience || viralAudienceOptions[0],
      brandVoice: defaults.brandVoice || viralBrandVoiceOptions[0],
      maxVariants: 3,
      factMode: true,
    },
  });

  const commentForm = useForm<CommentValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      platform: 'General',
      style: defaults.commentStyle as CommentValues['style'],
      audience: defaults.commentAudience || commentAudienceOptions[0],
      maxVariants: 3,
      factMode: true,
    },
  });

  useEffect(() => {
    viralForm.setValue('tone', defaults.tone as ViralValues['tone']);
    viralForm.setValue('goal', defaults.goal as ViralValues['goal']);
    viralForm.setValue('audience', defaults.audience || viralAudienceOptions[0]);
    viralForm.setValue('brandVoice', defaults.brandVoice || viralBrandVoiceOptions[0]);
    commentForm.setValue(
      'style',
      defaults.commentStyle as CommentValues['style'],
    );
    commentForm.setValue('audience', defaults.commentAudience || commentAudienceOptions[0]);
  }, [commentForm, defaults, viralForm]);

  const viralMutation = useMutation({
    mutationFn: (values: ViralValues) =>
      generateViralPost({
        summary: storyQuery.data?.summary ?? '',
        platform: values.platform,
        tone: values.tone,
        goal: values.goal,
        audience: values.audience,
        brand_voice: values.brandVoice,
        max_variants: values.maxVariants,
        fact_mode: values.factMode,
      }),
    onError: (error: Error) => toast.error(error.message),
  });

  const commentMutation = useMutation({
    mutationFn: (values: CommentValues) =>
      generateComment({
        summary: storyQuery.data?.summary ?? '',
        platform: values.platform,
        style: values.style,
        audience: values.audience,
        max_variants: values.maxVariants,
        fact_mode: values.factMode,
      }),
    onError: (error: Error) => toast.error(error.message),
  });

  const viralWarnings = useMemo(
    () => viralMutation.data?.warnings ?? [],
    [viralMutation.data?.warnings],
  );
  const commentWarnings = useMemo(
    () => commentMutation.data?.warnings ?? [],
    [commentMutation.data?.warnings],
  );

  if (storyQuery.isLoading) {
    return <LoadingState label="Loading story" />;
  }

  if (storyQuery.error) {
    return <ErrorState message={(storyQuery.error as Error).message} />;
  }

  if (!storyQuery.data) {
    return <EmptyState message="Story not found." />;
  }

  const defaultTab =
    searchParams.get('tab') === 'perspective' ? 'perspective' : 'overview';
  const genzTake = perspectiveQuery.data?.angles.find((angle) =>
    angle.label.toLowerCase().includes('gen-z'),
  );

  return (
    <div className="space-y-6">
      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="perspective">Perspective</TabsTrigger>
          <TabsTrigger value="generators">Generators</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card className="w-full min-w-0">
            <CardHeader>
              <CardTitle className="break-words">
                {storyQuery.data.story_title}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Cluster {storyQuery.data.cluster_id}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="break-words text-sm text-muted-foreground">
                {storyQuery.data.summary}
              </p>
              <div className="space-y-2">
                {storyQuery.data.sources.map((source) => (
                  <div key={source.url} className="text-sm">
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      {source.title}
                    </a>
                    <span className="text-muted-foreground">
                      {' '}
                      · {source.name}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="perspective" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Perspective Mode</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="space-y-2">
                <Label>Tone</Label>
                <Select
                  value={tone}
                  onValueChange={(value) => setTone(value as PerspectiveTone)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="genz">Gen-Z</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Slang</Label>
                <Select
                  value={slangLevel}
                  onValueChange={(value) =>
                    setSlangLevel(value as PerspectiveSlangLevel)
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="heavy">Heavy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="secondary"
                onClick={() => setRefreshToken((v) => v + 1)}
              >
                Refresh
              </Button>
              <Button
                variant="outline"
                disabled={!genzTake}
                onClick={async () => {
                  if (!genzTake) return;
                  await navigator.clipboard.writeText(genzTake.summary);
                  toast.success('Gen-Z take copied.');
                }}
              >
                Copy Gen-Z take
              </Button>
            </CardContent>
          </Card>

          {perspectiveQuery.isLoading ? (
            <Card>
              <CardContent className="space-y-3 p-6">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ) : null}

          {perspectiveQuery.error ? (
            <ErrorState
              message={
                (perspectiveQuery.error as Error).message ||
                'Unable to generate perspective right now.'
              }
            />
          ) : null}

          {perspectiveQuery.data ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Neutral facts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc space-y-1 pl-5 text-sm">
                      {perspectiveQuery.data.neutral_facts.map((item, i) => (
                        <li key={`${item}-${i}`}>{item}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>What we know vs what&apos;s unclear</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="mb-2 text-sm font-medium">What we know</p>
                      <ul className="list-disc space-y-1 pl-5 text-sm">
                        {perspectiveQuery.data.what_we_know.map((item, i) => (
                          <li key={`${item}-${i}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="mb-2 text-sm font-medium">
                        What&apos;s unclear
                      </p>
                      <ul className="list-disc space-y-1 pl-5 text-sm">
                        {perspectiveQuery.data.what_is_unclear.map(
                          (item, i) => (
                            <li key={`${item}-${i}`}>{item}</li>
                          ),
                        )}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Angles</CardTitle>
                  </CardHeader>
                  <CardContent className="flex gap-3 overflow-x-auto pb-2">
                    {perspectiveQuery.data.angles.map((angle) => (
                      <Card
                        key={angle.label}
                        className="min-w-[260px] max-w-[320px]"
                      >
                        <CardHeader>
                          <CardTitle className="text-base">
                            {angle.label}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <p>{angle.summary}</p>
                          <ul className="list-disc pl-5">
                            {angle.key_points.map((point, i) => (
                              <li key={`${point}-${i}`}>{point}</li>
                            ))}
                          </ul>
                          {angle.risks?.length ? (
                            <div>
                              <p className="font-medium">Risks</p>
                              <ul className="list-disc pl-5">
                                {angle.risks.map((risk, i) => (
                                  <li key={`${risk}-${i}`}>{risk}</li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                        </CardContent>
                      </Card>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Sentiment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="flex flex-wrap gap-2">
                      {perspectiveQuery.data.sentiment.top_emotions.map(
                        (emotion) => (
                          <span
                            key={emotion.emotion}
                            className="rounded-full border px-2 py-1 text-xs"
                          >
                            {emotion.emotion} ({Math.round(emotion.score * 100)}
                            %)
                          </span>
                        ),
                      )}
                    </div>
                    <div>
                      <p className="mb-2 font-medium">Top questions</p>
                      <ul className="list-disc pl-5">
                        {perspectiveQuery.data.sentiment.top_questions.map(
                          (q, i) => (
                            <li key={`${q}-${i}`}>{q}</li>
                          ),
                        )}
                      </ul>
                    </div>
                    <div>
                      <p className="mb-2 font-medium">Shareable claims</p>
                      <ul className="list-disc pl-5">
                        {perspectiveQuery.data.sentiment.shareable_claims.map(
                          (c, i) => (
                            <li key={`${c}-${i}`}>{c}</li>
                          ),
                        )}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Scores</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="rounded border p-2 text-sm">
                      Bias: {perspectiveQuery.data.scores.bias.label} (
                      {perspectiveQuery.data.scores.bias.value.toFixed(2)})
                    </div>
                    <ScoreBar
                      label="Clickbait"
                      value={perspectiveQuery.data.scores.clickbait}
                    />
                    <ScoreBar
                      label="Evidence"
                      value={perspectiveQuery.data.scores.evidence}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="generators">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="w-full min-w-0">
              <CardHeader>
                <CardTitle>Viral Post Generator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form
                  onSubmit={viralForm.handleSubmit((values) =>
                    viralMutation.mutate(values),
                  )}
                  className="space-y-4"
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Platform</Label>
                      <Select
                        value={viralForm.watch('platform')}
                        onValueChange={(value) =>
                          viralForm.setValue(
                            'platform',
                            value as ViralValues['platform'],
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Platform" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Twitter">Twitter</SelectItem>
                          <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                          <SelectItem value="Instagram">Instagram</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Tone</Label>
                      <Select
                        value={viralForm.watch('tone')}
                        onValueChange={(value) =>
                          viralForm.setValue(
                            'tone',
                            value as ViralValues['tone'],
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Tone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bold">Bold</SelectItem>
                          <SelectItem value="friendly">Friendly</SelectItem>
                          <SelectItem value="professional">
                            Professional
                          </SelectItem>
                          <SelectItem value="funny">Funny</SelectItem>
                          <SelectItem value="controversial_light">
                            Controversial (light)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Goal</Label>
                      <Select
                        value={viralForm.watch('goal')}
                        onValueChange={(value) =>
                          viralForm.setValue(
                            'goal',
                            value as ViralValues['goal'],
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Goal" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="engagement">Engagement</SelectItem>
                          <SelectItem value="clicks">Clicks</SelectItem>
                          <SelectItem value="followers">Followers</SelectItem>
                          <SelectItem value="thought_leadership">
                            Thought leadership
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Max variants</Label>
                      <Input
                        type="number"
                        min={1}
                        max={5}
                        value={viralForm.watch('maxVariants')}
                        onChange={(event) =>
                          viralForm.setValue(
                            'maxVariants',
                            Number(event.target.value),
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Audience</Label>
                    <Select
                      value={viralForm.watch('audience')}
                      onValueChange={(value) =>
                        viralForm.setValue('audience', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select audience" />
                      </SelectTrigger>
                      <SelectContent>
                        {viralAudienceOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Brand voice</Label>
                    <Select
                      value={viralForm.watch('brandVoice')}
                      onValueChange={(value) =>
                        viralForm.setValue('brandVoice', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select brand voice" />
                      </SelectTrigger>
                      <SelectContent>
                        {viralBrandVoiceOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-border p-3">
                    <div>
                      <Label>Fact mode</Label>
                      <p className="text-xs text-muted-foreground">
                        Only use verifiable facts from the summary.
                      </p>
                    </div>
                    <Switch
                      checked={viralForm.watch('factMode')}
                      onCheckedChange={(value) =>
                        viralForm.setValue('factMode', value)
                      }
                    />
                  </div>
                  <Button type="submit" disabled={viralMutation.isPending}>
                    {viralMutation.isPending
                      ? 'Generating...'
                      : 'Generate viral posts'}
                  </Button>
                </form>
                {viralWarnings.length > 0 && (
                  <div className="rounded-md border border-yellow-400/40 bg-yellow-50 p-3 text-sm text-yellow-700">
                    Warnings: {viralWarnings.join(', ')}
                  </div>
                )}
                {viralMutation.data && (
                  <div className="space-y-4">
                    {viralMutation.data.variants.map((variant, index) => (
                      <Card key={index} className="w-full min-w-0">
                        <CardHeader>
                          <CardTitle className="text-base">
                            Variant {index + 1}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div>
                            <strong>Hook:</strong> {variant.hook}
                          </div>
                          <div>
                            <strong>Body:</strong> {variant.body}
                          </div>
                          {variant.thread && (
                            <div>
                              <strong>Thread:</strong>
                              <ul className="list-disc pl-5">
                                {variant.thread.map((line, threadIndex) => (
                                  <li key={threadIndex}>{line}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <div>
                            <strong>Hashtags:</strong>{' '}
                            {variant.hashtags.join(' ')}
                          </div>
                          <CopyButton value={buildViralCopy(variant)} />
                          <ShareActions
                            title={`Viral post variant ${index + 1}`}
                            text={buildViralCopy(variant)}
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="w-full min-w-0">
              <CardHeader>
                <CardTitle>Comment Generator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form
                  onSubmit={commentForm.handleSubmit((values) =>
                    commentMutation.mutate(values),
                  )}
                  className="space-y-4"
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Platform</Label>
                      <Select
                        value={commentForm.watch('platform')}
                        onValueChange={(value) =>
                          commentForm.setValue(
                            'platform',
                            value as CommentValues['platform'],
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Platform" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="General">General</SelectItem>
                          <SelectItem value="Twitter">Twitter</SelectItem>
                          <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                          <SelectItem value="Facebook">Facebook</SelectItem>
                          <SelectItem value="Reddit">Reddit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Style</Label>
                      <Select
                        value={commentForm.watch('style')}
                        onValueChange={(value) =>
                          commentForm.setValue(
                            'style',
                            value as CommentValues['style'],
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="curious">Curious</SelectItem>
                          <SelectItem value="supportive">Supportive</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                          <SelectItem value="neutral">Neutral</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Max variants</Label>
                      <Input
                        type="number"
                        min={1}
                        max={5}
                        value={commentForm.watch('maxVariants')}
                        onChange={(event) =>
                          commentForm.setValue(
                            'maxVariants',
                            Number(event.target.value),
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Audience</Label>
                    <Select
                      value={commentForm.watch('audience')}
                      onValueChange={(value) =>
                        commentForm.setValue('audience', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select audience" />
                      </SelectTrigger>
                      <SelectContent>
                        {commentAudienceOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-border p-3">
                    <div>
                      <Label>Fact mode</Label>
                      <p className="text-xs text-muted-foreground">
                        Use only details from the summary.
                      </p>
                    </div>
                    <Switch
                      checked={commentForm.watch('factMode')}
                      onCheckedChange={(value) =>
                        commentForm.setValue('factMode', value)
                      }
                    />
                  </div>
                  <Button type="submit" disabled={commentMutation.isPending}>
                    {commentMutation.isPending
                      ? 'Generating...'
                      : 'Generate comments'}
                  </Button>
                </form>
                {commentWarnings.length > 0 && (
                  <div className="rounded-md border border-yellow-400/40 bg-yellow-50 p-3 text-sm text-yellow-700">
                    Warnings: {commentWarnings.join(', ')}
                  </div>
                )}
                {commentMutation.data && (
                  <div className="space-y-4">
                    {commentMutation.data.comments.map((comment, index) => (
                      <Card key={index} className="w-full min-w-0">
                        <CardHeader>
                          <CardTitle className="text-base">
                            Variant {index + 1} · {comment.tone}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <p>{comment.comment}</p>
                          <p className="text-muted-foreground">
                            CTA: {comment.cta_question}
                          </p>
                          <CopyButton value={buildCommentCopy(comment)} />
                          <ShareActions
                            title={`Comment variant ${index + 1}`}
                            text={buildCommentCopy(comment)}
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="lg:col-span-2">
              <AnalysisGenerator summary={storyQuery.data.summary} />
            </div>
            <JokeGenerator summary={storyQuery.data.summary} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
