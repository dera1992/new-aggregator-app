'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CopyButton } from '@/components/copy-button';
import { Skeleton } from '@/components/ui/skeleton';
import { ShareActions } from '@/components/share-actions';
import type { CommentResponse, GenerateAnalysisResponse, GenerateJokeResponse, ViralPostResponse } from '@/types/news';
import type { GenerateSummaryResponse } from '@/types/compose';

export type ComposeResult =
  | { type: 'summary'; data: GenerateSummaryResponse }
  | { type: 'analysis'; data: GenerateAnalysisResponse }
  | { type: 'joke'; data: GenerateJokeResponse }
  | { type: 'viral'; data: ViralPostResponse }
  | { type: 'comment'; data: CommentResponse };

export type ComposeDraft = {
  id: string;
  type: ComposeResult['type'];
  content: string;
  createdAt: string;
};

type ComposeResultsProps = {
  result: ComposeResult | null;
  isLoading: boolean;
  drafts: ComposeDraft[];
  onSaveDraft: (result: ComposeResult) => void;
};

function buildAnalysisCopy(variant: GenerateAnalysisResponse['variants'][number]) {
  const parts = [
    variant.title ? `Title: ${variant.title}` : '',
    variant.hook ? `Hook: ${variant.hook}` : '',
    variant.analysis ? `Analysis: ${variant.analysis}` : '',
    variant.key_takeaways.length ? `Key takeaways:\n- ${variant.key_takeaways.join('\n- ')}` : '',
    variant.counterpoints.length ? `Counterpoints:\n- ${variant.counterpoints.join('\n- ')}` : '',
    variant.what_to_watch.length ? `What to watch:\n- ${variant.what_to_watch.join('\n- ')}` : '',
    `Reading time: ${variant.reading_time_seconds}s`,
  ].filter(Boolean);

  return parts.join('\n\n');
}

function buildViralCopy(variant: ViralPostResponse['variants'][number]) {
  const parts = [
    variant.hook,
    variant.body,
    variant.hashtags.length ? variant.hashtags.join(' ') : '',
    variant.thread?.length ? `Thread:\n${variant.thread.join('\n')}` : '',
  ].filter(Boolean);
  return parts.join('\n\n');
}

function buildCommentCopy(variant: CommentResponse['comments'][number]) {
  return [variant.comment, variant.cta_question].filter(Boolean).join('\n\n');
}

function extractWarnings(result: ComposeResult | null) {
  if (!result) {
    return [];
  }
  const data = result.data as { warnings?: string[] };
  return Array.isArray(data.warnings) ? data.warnings : [];
}

export function ComposeResults({ result, isLoading, drafts, onSaveDraft }: ComposeResultsProps) {
  const warnings = extractWarnings(result);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Results</CardTitle>
        {result ? (
          <Button variant="outline" size="sm" onClick={() => onSaveDraft(result)}>
            Save to drafts
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {!isLoading && !result && (
          <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Generated output will appear here.
          </div>
        )}

        {!isLoading && result && (
          <div className="space-y-4">
            {warnings.length > 0 && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <p className="font-medium">Warnings</p>
                <ul className="mt-1 list-disc pl-4">
                  {warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.type === 'summary' && (
              <div className="space-y-2 rounded-md border border-border p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Summary</p>
                  <CopyButton value={result.data.summary} />
                </div>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {result.data.summary}
                </p>
              </div>
            )}

            {result.type === 'analysis' &&
              result.data.variants.map((variant, index) => (
                <div key={`${variant.title}-${index}`} className="space-y-3 rounded-md border border-border p-4">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">Variant {index + 1}</p>
                    {result.data.best_variant_index === index && <Badge>Best</Badge>}
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {variant.title && <p><span className="font-medium text-foreground">Title:</span> {variant.title}</p>}
                    {variant.hook && <p><span className="font-medium text-foreground">Hook:</span> {variant.hook}</p>}
                    {variant.analysis && <p><span className="font-medium text-foreground">Analysis:</span> {variant.analysis}</p>}
                    {variant.key_takeaways.length > 0 && (
                      <div>
                        <p className="font-medium text-foreground">Key takeaways</p>
                        <ul className="list-disc pl-5">
                          {variant.key_takeaways.map((takeaway) => (
                            <li key={takeaway}>{takeaway}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {variant.counterpoints.length > 0 && (
                      <div>
                        <p className="font-medium text-foreground">Counterpoints</p>
                        <ul className="list-disc pl-5">
                          {variant.counterpoints.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {variant.what_to_watch.length > 0 && (
                      <div>
                        <p className="font-medium text-foreground">What to watch</p>
                        <ul className="list-disc pl-5">
                          {variant.what_to_watch.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <p>Reading time: {variant.reading_time_seconds}s</p>
                  </div>
                  <CopyButton value={buildAnalysisCopy(variant)} />
                  <ShareActions
                    title={variant.title || `Analysis variant ${index + 1}`}
                    text={buildAnalysisCopy(variant)}
                  />
                </div>
              ))}

            {result.type === 'joke' &&
              result.data.jokes.map((joke, index) => (
                <div key={`${joke.style}-${index}`} className="space-y-2 rounded-md border border-border p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Joke {index + 1}</p>
                    {result.data.best_variant_index === index && <Badge>Best</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{joke.full_joke}</p>
                  <CopyButton value={joke.full_joke} />
                  <ShareActions
                    title={`Joke ${index + 1}`}
                    text={joke.full_joke}
                  />
                </div>
              ))}

            {result.type === 'viral' &&
              result.data.variants.map((variant, index) => (
                <div key={`${variant.hook}-${index}`} className="space-y-3 rounded-md border border-border p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Variant {index + 1}</p>
                    {result.data.best_variant_index === index && <Badge>Best</Badge>}
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p><span className="font-medium text-foreground">Hook:</span> {variant.hook}</p>
                    <p><span className="font-medium text-foreground">Body:</span> {variant.body}</p>
                    {variant.hashtags.length > 0 && (
                      <p><span className="font-medium text-foreground">Hashtags:</span> {variant.hashtags.join(' ')}</p>
                    )}
                    {variant.thread?.length ? (
                      <div>
                        <p className="font-medium text-foreground">Thread</p>
                        <ol className="list-decimal pl-5">
                          {variant.thread.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ol>
                      </div>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <CopyButton value={buildViralCopy(variant)} />
                    {variant.hashtags.length > 0 && (
                      <CopyButton value={variant.hashtags.join(' ')} />
                    )}
                    {variant.thread?.length ? (
                      <CopyButton value={variant.thread.join('\n')} />
                    ) : null}
                  </div>
                  <ShareActions
                    title={`Viral post variant ${index + 1}`}
                    text={buildViralCopy(variant)}
                  />
                </div>
              ))}

            {result.type === 'comment' &&
              result.data.comments.map((comment, index) => (
                <div key={`${comment.tone}-${index}`} className="space-y-2 rounded-md border border-border p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Comment {index + 1}</p>
                    {result.data.best_variant_index === index && <Badge>Best</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{comment.comment}</p>
                  {comment.cta_question && (
                    <p className="text-sm text-muted-foreground">CTA: {comment.cta_question}</p>
                  )}
                  <CopyButton value={buildCommentCopy(comment)} />
                  <ShareActions
                    title={`Comment ${index + 1}`}
                    text={buildCommentCopy(comment)}
                  />
                </div>
              ))}
          </div>
        )}

        {drafts.length > 0 && (
          <div className="space-y-2 border-t border-border pt-4">
            <p className="text-sm font-medium">Saved drafts</p>
            <div className="space-y-2">
              {drafts.map((draft) => (
                <div key={draft.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3">
                  <div>
                    <p className="text-sm font-medium capitalize">{draft.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(draft.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <CopyButton value={draft.content} />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
