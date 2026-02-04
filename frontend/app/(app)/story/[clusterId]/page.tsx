'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { fetchStory, generateComment, generateViralPost } from '@/lib/api/news';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { EmptyState } from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CopyButton } from '@/components/copy-button';
import { JokeGenerator } from '@/components/JokeGenerator';
import { AnalysisGenerator } from '@/components/AnalysisGenerator';
import { loadGeneratorDefaults } from '@/lib/utils/generator-defaults';
import { ShareActions } from '@/components/share-actions';

const viralSchema = z.object({
  platform: z.enum(['Twitter', 'LinkedIn', 'Instagram']),
  tone: z.enum(['bold', 'friendly', 'professional', 'funny', 'controversial_light']),
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

export default function StoryPage() {
  const params = useParams();
  const clusterId = params.clusterId as string;
  const [defaults, setDefaults] = useState(loadGeneratorDefaults());

  const storyQuery = useQuery({
    queryKey: ['story', clusterId],
    queryFn: () => fetchStory(clusterId),
  });

  useEffect(() => {
    setDefaults(loadGeneratorDefaults());
  }, []);

  const viralForm = useForm<ViralValues>({
    resolver: zodResolver(viralSchema),
    defaultValues: {
      platform: 'Twitter',
      tone: defaults.tone as ViralValues['tone'],
      goal: defaults.goal as ViralValues['goal'],
      audience: defaults.audience,
      brandVoice: defaults.brandVoice,
      maxVariants: 3,
      factMode: true,
    },
  });

  const commentForm = useForm<CommentValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      platform: 'General',
      style: defaults.commentStyle as CommentValues['style'],
      audience: defaults.commentAudience,
      maxVariants: 3,
      factMode: true,
    },
  });

  useEffect(() => {
    viralForm.setValue('tone', defaults.tone as ViralValues['tone']);
    viralForm.setValue('goal', defaults.goal as ViralValues['goal']);
    viralForm.setValue('audience', defaults.audience);
    viralForm.setValue('brandVoice', defaults.brandVoice);
    commentForm.setValue('style', defaults.commentStyle as CommentValues['style']);
    commentForm.setValue('audience', defaults.commentAudience);
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

  return (
    <div className="space-y-6">
      <Card className="w-full min-w-0">
        <CardHeader>
          <CardTitle className="break-words">{storyQuery.data.story_title}</CardTitle>
          <p className="text-sm text-muted-foreground">Cluster {storyQuery.data.cluster_id}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="break-words text-sm text-muted-foreground">{storyQuery.data.summary}</p>
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
                <span className="text-muted-foreground"> · {source.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="w-full min-w-0">
          <CardHeader>
            <CardTitle>Viral Post Generator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              onSubmit={viralForm.handleSubmit((values) => viralMutation.mutate(values))}
              className="space-y-4"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Platform</Label>
                  <Select
                    value={viralForm.watch('platform')}
                    onValueChange={(value) => viralForm.setValue('platform', value as ViralValues['platform'])}
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
                    onValueChange={(value) => viralForm.setValue('tone', value as ViralValues['tone'])}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bold">Bold</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="funny">Funny</SelectItem>
                      <SelectItem value="controversial_light">Controversial (light)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Goal</Label>
                  <Select
                    value={viralForm.watch('goal')}
                    onValueChange={(value) => viralForm.setValue('goal', value as ViralValues['goal'])}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Goal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="engagement">Engagement</SelectItem>
                      <SelectItem value="clicks">Clicks</SelectItem>
                      <SelectItem value="followers">Followers</SelectItem>
                      <SelectItem value="thought_leadership">Thought leadership</SelectItem>
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
                      viralForm.setValue('maxVariants', Number(event.target.value))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Audience</Label>
                <Input {...viralForm.register('audience')} placeholder="Target audience" />
              </div>
              <div className="space-y-2">
                <Label>Brand voice</Label>
                <Input {...viralForm.register('brandVoice')} placeholder="Brand tone cues" />
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
                  onCheckedChange={(value) => viralForm.setValue('factMode', value)}
                />
              </div>
              <Button type="submit" disabled={viralMutation.isPending}>
                {viralMutation.isPending ? 'Generating...' : 'Generate viral posts'}
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
                        <strong>Hashtags:</strong> {variant.hashtags.join(' ')}
                      </div>
                      <CopyButton
                        value={buildViralCopy(variant)}
                      />
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
              onSubmit={commentForm.handleSubmit((values) => commentMutation.mutate(values))}
              className="space-y-4"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Platform</Label>
                  <Select
                    value={commentForm.watch('platform')}
                    onValueChange={(value) =>
                      commentForm.setValue('platform', value as CommentValues['platform'])
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
                      commentForm.setValue('style', value as CommentValues['style'])
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
                      commentForm.setValue('maxVariants', Number(event.target.value))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Audience</Label>
                <Input {...commentForm.register('audience')} placeholder="Audience focus" />
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
                  onCheckedChange={(value) => commentForm.setValue('factMode', value)}
                />
              </div>
              <Button type="submit" disabled={commentMutation.isPending}>
                {commentMutation.isPending ? 'Generating...' : 'Generate comments'}
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
                      <p className="text-muted-foreground">CTA: {comment.cta_question}</p>
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
    </div>
  );
}
