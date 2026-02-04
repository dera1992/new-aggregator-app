'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Star } from 'lucide-react';
import { toast } from 'sonner';

import { generateAnalysis } from '@/lib/api/news';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CopyButton } from '@/components/copy-button';
import { ShareActions } from '@/components/share-actions';
import type { GenerateAnalysisResponse } from '@/types/news';

const analysisSchema = z.object({
  format: z.enum(['brief', 'standard', 'deep']),
  tone: z.enum(['neutral', 'insightful', 'skeptical', 'optimistic']),
  audience: z.enum(['general', 'business', 'tech', 'policy', 'investors']),
  includeTakeaways: z.boolean(),
  includeCounterpoints: z.boolean(),
  includeWhatToWatch: z.boolean(),
  factMode: z.boolean(),
});

type AnalysisValues = z.infer<typeof analysisSchema>;

type AnalysisGeneratorProps = {
  summary: string;
};

function buildVariantCopy(variant: GenerateAnalysisResponse['variants'][number]) {
  const sections = [
    variant.title ? `Title: ${variant.title}` : '',
    variant.hook ? `Hook: ${variant.hook}` : '',
    variant.analysis ? `Analysis: ${variant.analysis}` : '',
    variant.key_takeaways.length ? `Key takeaways:\n- ${variant.key_takeaways.join('\n- ')}` : '',
    variant.counterpoints.length ? `Counterpoints:\n- ${variant.counterpoints.join('\n- ')}` : '',
    variant.what_to_watch.length ? `What to watch:\n- ${variant.what_to_watch.join('\n- ')}` : '',
    `Reading time: ${variant.reading_time_seconds}s`,
  ].filter(Boolean);

  return sections.join('\n\n');
}

export function AnalysisGenerator({ summary }: AnalysisGeneratorProps) {
  const form = useForm<AnalysisValues>({
    resolver: zodResolver(analysisSchema),
    defaultValues: {
      format: 'standard',
      tone: 'insightful',
      audience: 'general',
      includeTakeaways: true,
      includeCounterpoints: true,
      includeWhatToWatch: true,
      factMode: true,
    },
  });

  const mutation = useMutation({
    mutationFn: (values: AnalysisValues) =>
      generateAnalysis({
        summary,
        format: values.format,
        tone: values.tone,
        audience: values.audience,
        include_takeaways: values.includeTakeaways,
        include_counterpoints: values.includeCounterpoints,
        include_what_to_watch: values.includeWhatToWatch,
        fact_mode: values.factMode,
      }),
    onSuccess: () => toast.success('Analysis generated'),
    onError: (error: Error) => toast.error(error.message),
  });

  const warnings = useMemo(
    () => mutation.data?.warnings ?? [],
    [mutation.data?.warnings],
  );

  const response = mutation.data as GenerateAnalysisResponse | undefined;
  const [activeTab, setActiveTab] = useState('variant-0');

  useEffect(() => {
    if (response?.best_variant_index !== undefined) {
      setActiveTab(`variant-${response.best_variant_index}`);
    }
  }, [response?.best_variant_index]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analysis Generator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          className="space-y-4"
        >
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Format</Label>
              <Select
                value={form.watch('format')}
                onValueChange={(value) =>
                  form.setValue('format', value as AnalysisValues['format'])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brief">Brief</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="deep">Deep</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tone</Label>
              <Select
                value={form.watch('tone')}
                onValueChange={(value) =>
                  form.setValue('tone', value as AnalysisValues['tone'])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="neutral">Neutral</SelectItem>
                  <SelectItem value="insightful">Insightful</SelectItem>
                  <SelectItem value="skeptical">Skeptical</SelectItem>
                  <SelectItem value="optimistic">Optimistic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Audience</Label>
              <Select
                value={form.watch('audience')}
                onValueChange={(value) =>
                  form.setValue('audience', value as AnalysisValues['audience'])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="tech">Tech</SelectItem>
                  <SelectItem value="policy">Policy</SelectItem>
                  <SelectItem value="investors">Investors</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <Label>Include takeaways</Label>
                <p className="text-xs text-muted-foreground">Summarize actionable bullets.</p>
              </div>
              <Switch
                checked={form.watch('includeTakeaways')}
                onCheckedChange={(value) => form.setValue('includeTakeaways', value)}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <Label>Include counterpoints</Label>
                <p className="text-xs text-muted-foreground">Highlight alternative viewpoints.</p>
              </div>
              <Switch
                checked={form.watch('includeCounterpoints')}
                onCheckedChange={(value) => form.setValue('includeCounterpoints', value)}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <Label>Include what to watch</Label>
                <p className="text-xs text-muted-foreground">Call out upcoming signals.</p>
              </div>
              <Switch
                checked={form.watch('includeWhatToWatch')}
                onCheckedChange={(value) => form.setValue('includeWhatToWatch', value)}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <Label>Fact mode</Label>
                <p className="text-xs text-muted-foreground">Stick to summary details.</p>
              </div>
              <Switch
                checked={form.watch('factMode')}
                onCheckedChange={(value) => form.setValue('factMode', value)}
              />
            </div>
          </div>

          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Generating...' : 'Generate analysis'}
          </Button>
        </form>

        {warnings.length > 0 && (
          <div className="rounded-md border border-yellow-400/40 bg-yellow-50 p-3 text-sm text-yellow-700">
            Warnings: {warnings.join(', ')}
          </div>
        )}

        {response && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="flex flex-wrap">
              {response.variants.map((variant, index) => (
                <TabsTrigger key={variant.title + index} value={`variant-${index}`}>
                  <span className="flex items-center gap-1">
                    Variant {index + 1}
                    {response.best_variant_index === index && (
                      <Star className="h-4 w-4 text-amber-500" fill="currentColor" />
                    )}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
            {response.variants.map((variant, index) => (
              <TabsContent key={variant.title + index} value={`variant-${index}`}>
                <Card>
                  <CardHeader className="flex flex-row items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">{variant.title}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {variant.reading_time_seconds}s reading time
                      </p>
                    </div>
                    <CopyButton value={buildVariantCopy(variant)} />
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div>
                      <strong>Hook:</strong> {variant.hook}
                    </div>
                    <div>
                      <strong>Analysis:</strong>
                      <p className="mt-2 text-muted-foreground">{variant.analysis}</p>
                    </div>
                    {variant.key_takeaways.length > 0 && (
                      <div>
                        <strong>Key takeaways</strong>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                          {variant.key_takeaways.map((item, itemIndex) => (
                            <li key={`${item}-${itemIndex}`}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {variant.counterpoints.length > 0 && (
                      <div>
                        <strong>Counterpoints</strong>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                          {variant.counterpoints.map((item, itemIndex) => (
                            <li key={`${item}-${itemIndex}`}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {variant.what_to_watch.length > 0 && (
                      <div>
                        <strong>What to watch</strong>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                          {variant.what_to_watch.map((item, itemIndex) => (
                            <li key={`${item}-${itemIndex}`}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <ShareActions
                      title={variant.title || 'Analysis'}
                      text={buildVariantCopy(variant)}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
