'use client';

import { useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { generateJoke } from '@/lib/api/news';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { CopyButton } from '@/components/copy-button';
import type { GenerateJokeResponse } from '@/types/news';

const jokeSchema = z.object({
  platform: z.enum(['General', 'Twitter', 'LinkedIn', 'Instagram', 'Reddit']),
  style: z.enum(['pun', 'one_liner', 'observational', 'satire_light', 'dad_joke']),
  audience: z.string().optional(),
  maxVariants: z.number().min(1).max(5),
  factMode: z.boolean(),
});

type JokeValues = z.infer<typeof jokeSchema>;

type JokeGeneratorProps = {
  summary: string;
};

const styleLabels: Record<JokeValues['style'], string> = {
  pun: 'Pun',
  one_liner: 'One-liner',
  observational: 'Observational',
  satire_light: 'Satire (light)',
  dad_joke: 'Dad joke',
};

export function JokeGenerator({ summary }: JokeGeneratorProps) {
  const form = useForm<JokeValues>({
    resolver: zodResolver(jokeSchema),
    defaultValues: {
      platform: 'General',
      style: 'one_liner',
      audience: '',
      maxVariants: 3,
      factMode: true,
    },
  });

  const mutation = useMutation({
    mutationFn: (values: JokeValues) =>
      generateJoke({
        summary,
        platform: values.platform,
        style: values.style,
        audience: values.audience,
        max_variants: values.maxVariants,
        fact_mode: values.factMode,
      }),
    onSuccess: () => toast.success('Jokes generated'),
    onError: (error: Error) => toast.error(error.message),
  });

  const warnings = useMemo(
    () => mutation.data?.warnings ?? [],
    [mutation.data?.warnings],
  );

  const response = mutation.data as GenerateJokeResponse | undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Joke Generator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          className="space-y-4"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select
                value={form.watch('platform')}
                onValueChange={(value) =>
                  form.setValue('platform', value as JokeValues['platform'])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Twitter">Twitter</SelectItem>
                  <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                  <SelectItem value="Reddit">Reddit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Style</Label>
              <Select
                value={form.watch('style')}
                onValueChange={(value) =>
                  form.setValue('style', value as JokeValues['style'])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pun">Pun</SelectItem>
                  <SelectItem value="one_liner">One-liner</SelectItem>
                  <SelectItem value="observational">Observational</SelectItem>
                  <SelectItem value="satire_light">Satire (light)</SelectItem>
                  <SelectItem value="dad_joke">Dad joke</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <Label>Max variants</Label>
                <span className="text-xs text-muted-foreground">{form.watch('maxVariants')}</span>
              </div>
              <Input
                type="range"
                min={1}
                max={5}
                step={1}
                value={form.watch('maxVariants')}
                onChange={(event) =>
                  form.setValue('maxVariants', Number(event.target.value))
                }
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1</span>
                <span>5</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Audience</Label>
            <Input {...form.register('audience')} placeholder="Optional audience" />
          </div>
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <Label>Fact mode</Label>
              <p className="text-xs text-muted-foreground">
                Keep jokes grounded in the summary.
              </p>
            </div>
            <Switch
              checked={form.watch('factMode')}
              onCheckedChange={(value) => form.setValue('factMode', value)}
            />
          </div>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Generating...' : 'Generate jokes'}
          </Button>
        </form>

        {warnings.length > 0 && (
          <div className="rounded-md border border-yellow-400/40 bg-yellow-50 p-3 text-sm text-yellow-700">
            Warnings: {warnings.join(', ')}
          </div>
        )}

        {response && (
          <div className="space-y-4">
            {response.jokes.map((joke, index) => (
              <Card key={`${joke.style}-${index}`}>
                <CardHeader className="flex flex-row items-center justify-between gap-2">
                  <CardTitle className="text-base">
                    Joke {index + 1} · {styleLabels[joke.style as JokeValues['style']] ?? joke.style}
                  </CardTitle>
                  {response.best_variant_index === index && (
                    <Badge>Best</Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <strong>Setup:</strong> {joke.setup}
                  </div>
                  <div>
                    <strong>Punchline:</strong> {joke.punchline}
                  </div>
                  <div>
                    <strong>Full joke:</strong> {joke.full_joke}
                  </div>
                  {joke.cta && (
                    <div className="text-muted-foreground">
                      <strong>CTA:</strong> {joke.cta}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <CopyButton value={joke.setup} />
                    <CopyButton value={joke.punchline} />
                    <CopyButton value={joke.full_joke} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
