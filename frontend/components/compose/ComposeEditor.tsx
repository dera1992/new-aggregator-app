'use client';

import type { Dispatch, SetStateAction } from 'react';
import { Clipboard, Eraser, Rocket } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

export type ComposeAction = 'summary' | 'analysis' | 'joke' | 'viral' | 'comment';

export type SummaryOptions = {
  style: 'short' | 'standard' | 'detailed';
  maxLength: string;
};

export type AnalysisOptions = {
  format: 'brief' | 'standard' | 'deep';
  tone: 'neutral' | 'insightful' | 'skeptical' | 'optimistic';
  audience: 'general' | 'business' | 'tech' | 'policy' | 'investors';
  includeTakeaways: boolean;
  includeCounterpoints: boolean;
  includeWhatToWatch: boolean;
  factMode: boolean;
};

export type JokeOptions = {
  platform: 'General' | 'Twitter' | 'LinkedIn' | 'Instagram' | 'Reddit';
  style: 'pun' | 'one_liner' | 'observational' | 'satire_light' | 'dad_joke';
  audience: string;
  maxVariants: number;
  factMode: boolean;
};

export type ViralOptions = {
  platform: 'twitter' | 'linkedin' | 'instagram';
  tone: string;
  goal: string;
  audience: string;
  brandVoice: string;
  maxVariants: number;
  factMode: boolean;
};

export type CommentOptions = {
  platform: 'General' | 'Twitter' | 'LinkedIn' | 'Facebook' | 'Reddit';
  style: 'curious' | 'supportive' | 'critical' | 'neutral';
  audience: string;
  maxVariants: number;
  factMode: boolean;
};

export type ComposeOptions = {
  summary: SummaryOptions;
  analysis: AnalysisOptions;
  joke: JokeOptions;
  viral: ViralOptions;
  comment: CommentOptions;
};

type ComposeEditorProps = {
  text: string;
  onTextChange: (value: string) => void;
  action: ComposeAction;
  onActionChange: (value: ComposeAction) => void;
  options: ComposeOptions;
  setOptions: Dispatch<SetStateAction<ComposeOptions>>;
  onGenerate: () => void;
  onClear: () => void;
  onPaste: () => void;
  isLoading: boolean;
  isGenerateDisabled: boolean;
};

export function ComposeEditor({
  text,
  onTextChange,
  action,
  onActionChange,
  options,
  setOptions,
  onGenerate,
  onClear,
  onPaste,
  isLoading,
  isGenerateDisabled,
}: ComposeEditorProps) {
  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Paste Article</CardTitle>
      </CardHeader>
      <CardContent className="flex h-full flex-col gap-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="article-text">Article text</Label>
            <span className="text-xs text-muted-foreground">
              {wordCount} words · {charCount} chars
            </span>
          </div>
          <Textarea
            id="article-text"
            value={text}
            onChange={(event) => onTextChange(event.target.value)}
            placeholder="Paste the full article or news content here..."
            className="min-h-[260px] resize-none"
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={onPaste}>
              <Clipboard className="h-4 w-4" />
              Paste from clipboard
            </Button>
            <Button type="button" variant="ghost" onClick={onClear}>
              <Eraser className="h-4 w-4" />
              Clear
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Minimum 50 characters for best results.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="article-url">Article URL (optional)</Label>
          <Input
            id="article-url"
            disabled
            placeholder="URL fetching coming soon"
          />
        </div>

        <div className="space-y-4">
          <div>
            <Label>Choose action</Label>
            <Tabs
              value={action}
              onValueChange={(value) => onActionChange(value as ComposeAction)}
              className="mt-2"
            >
              <TabsList className="flex flex-wrap">
                <TabsTrigger value="summary">Summarize</TabsTrigger>
                <TabsTrigger value="analysis">Analyze</TabsTrigger>
                <TabsTrigger value="joke">Joke</TabsTrigger>
                <TabsTrigger value="viral">Viral Post</TabsTrigger>
                <TabsTrigger value="comment">Comment</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {action === 'summary' && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Style</Label>
                <Select
                  value={options.summary.style}
                  onValueChange={(value) =>
                    setOptions((prev) => ({
                      ...prev,
                      summary: { ...prev.summary, style: value as SummaryOptions['style'] },
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="detailed">Detailed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Max length (words)</Label>
                <Input
                  type="number"
                  min={30}
                  value={options.summary.maxLength}
                  onChange={(event) =>
                    setOptions((prev) => ({
                      ...prev,
                      summary: { ...prev.summary, maxLength: event.target.value },
                    }))
                  }
                  placeholder="Optional"
                />
              </div>
            </div>
          )}

          {action === 'analysis' && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Format</Label>
                  <Select
                    value={options.analysis.format}
                    onValueChange={(value) =>
                      setOptions((prev) => ({
                        ...prev,
                        analysis: { ...prev.analysis, format: value as AnalysisOptions['format'] },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
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
                    value={options.analysis.tone}
                    onValueChange={(value) =>
                      setOptions((prev) => ({
                        ...prev,
                        analysis: { ...prev.analysis, tone: value as AnalysisOptions['tone'] },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
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
                    value={options.analysis.audience}
                    onValueChange={(value) =>
                      setOptions((prev) => ({
                        ...prev,
                        analysis: {
                          ...prev.analysis,
                          audience: value as AnalysisOptions['audience'],
                        },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
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
                    <p className="text-xs text-muted-foreground">Actionable bullet points.</p>
                  </div>
                  <Switch
                    checked={options.analysis.includeTakeaways}
                    onCheckedChange={(value) =>
                      setOptions((prev) => ({
                        ...prev,
                        analysis: { ...prev.analysis, includeTakeaways: value },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between rounded-md border border-border p-3">
                  <div>
                    <Label>Include counterpoints</Label>
                    <p className="text-xs text-muted-foreground">Alternative viewpoints.</p>
                  </div>
                  <Switch
                    checked={options.analysis.includeCounterpoints}
                    onCheckedChange={(value) =>
                      setOptions((prev) => ({
                        ...prev,
                        analysis: { ...prev.analysis, includeCounterpoints: value },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between rounded-md border border-border p-3">
                  <div>
                    <Label>Include what to watch</Label>
                    <p className="text-xs text-muted-foreground">Upcoming signals.</p>
                  </div>
                  <Switch
                    checked={options.analysis.includeWhatToWatch}
                    onCheckedChange={(value) =>
                      setOptions((prev) => ({
                        ...prev,
                        analysis: { ...prev.analysis, includeWhatToWatch: value },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between rounded-md border border-border p-3">
                  <div>
                    <Label>Fact mode</Label>
                    <p className="text-xs text-muted-foreground">Stick to pasted facts.</p>
                  </div>
                  <Switch
                    checked={options.analysis.factMode}
                    onCheckedChange={(value) =>
                      setOptions((prev) => ({
                        ...prev,
                        analysis: { ...prev.analysis, factMode: value },
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {action === 'joke' && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Platform</Label>
                <Select
                  value={options.joke.platform}
                  onValueChange={(value) =>
                    setOptions((prev) => ({
                      ...prev,
                      joke: { ...prev.joke, platform: value as JokeOptions['platform'] },
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
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
                  value={options.joke.style}
                  onValueChange={(value) =>
                    setOptions((prev) => ({
                      ...prev,
                      joke: { ...prev.joke, style: value as JokeOptions['style'] },
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pun">Pun</SelectItem>
                    <SelectItem value="one_liner">One liner</SelectItem>
                    <SelectItem value="observational">Observational</SelectItem>
                    <SelectItem value="satire_light">Satire light</SelectItem>
                    <SelectItem value="dad_joke">Dad joke</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Audience (optional)</Label>
                <Input
                  value={options.joke.audience}
                  onChange={(event) =>
                    setOptions((prev) => ({
                      ...prev,
                      joke: { ...prev.joke, audience: event.target.value },
                    }))
                  }
                  placeholder="e.g. startup founders"
                />
              </div>
              <div className="space-y-2">
                <Label>Max variants</Label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={options.joke.maxVariants}
                  onChange={(event) =>
                    setOptions((prev) => ({
                      ...prev,
                      joke: {
                        ...prev.joke,
                        maxVariants: Number(event.target.value) || 1,
                      },
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-md border border-border p-3 md:col-span-2">
                <div>
                  <Label>Fact mode</Label>
                  <p className="text-xs text-muted-foreground">Humor grounded in facts.</p>
                </div>
                <Switch
                  checked={options.joke.factMode}
                  onCheckedChange={(value) =>
                    setOptions((prev) => ({
                      ...prev,
                      joke: { ...prev.joke, factMode: value },
                    }))
                  }
                />
              </div>
            </div>
          )}

          {action === 'viral' && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Platform</Label>
                <Select
                  value={options.viral.platform}
                  onValueChange={(value) =>
                    setOptions((prev) => ({
                      ...prev,
                      viral: { ...prev.viral, platform: value as ViralOptions['platform'] },
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="twitter">Twitter / X</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tone</Label>
                <Input
                  value={options.viral.tone}
                  onChange={(event) =>
                    setOptions((prev) => ({
                      ...prev,
                      viral: { ...prev.viral, tone: event.target.value },
                    }))
                  }
                  placeholder="e.g. punchy, authoritative"
                />
              </div>
              <div className="space-y-2">
                <Label>Goal</Label>
                <Input
                  value={options.viral.goal}
                  onChange={(event) =>
                    setOptions((prev) => ({
                      ...prev,
                      viral: { ...prev.viral, goal: event.target.value },
                    }))
                  }
                  placeholder="e.g. drive newsletter signups"
                />
              </div>
              <div className="space-y-2">
                <Label>Audience</Label>
                <Input
                  value={options.viral.audience}
                  onChange={(event) =>
                    setOptions((prev) => ({
                      ...prev,
                      viral: { ...prev.viral, audience: event.target.value },
                    }))
                  }
                  placeholder="e.g. tech leaders"
                />
              </div>
              <div className="space-y-2">
                <Label>Brand voice</Label>
                <Input
                  value={options.viral.brandVoice}
                  onChange={(event) =>
                    setOptions((prev) => ({
                      ...prev,
                      viral: { ...prev.viral, brandVoice: event.target.value },
                    }))
                  }
                  placeholder="e.g. bold, optimistic"
                />
              </div>
              <div className="space-y-2">
                <Label>Max variants</Label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={options.viral.maxVariants}
                  onChange={(event) =>
                    setOptions((prev) => ({
                      ...prev,
                      viral: {
                        ...prev.viral,
                        maxVariants: Number(event.target.value) || 1,
                      },
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-md border border-border p-3 md:col-span-2">
                <div>
                  <Label>Fact mode</Label>
                  <p className="text-xs text-muted-foreground">Keep claims grounded.</p>
                </div>
                <Switch
                  checked={options.viral.factMode}
                  onCheckedChange={(value) =>
                    setOptions((prev) => ({
                      ...prev,
                      viral: { ...prev.viral, factMode: value },
                    }))
                  }
                />
              </div>
            </div>
          )}

          {action === 'comment' && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Platform</Label>
                <Select
                  value={options.comment.platform}
                  onValueChange={(value) =>
                    setOptions((prev) => ({
                      ...prev,
                      comment: {
                        ...prev.comment,
                        platform: value as CommentOptions['platform'],
                      },
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
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
                  value={options.comment.style}
                  onValueChange={(value) =>
                    setOptions((prev) => ({
                      ...prev,
                      comment: {
                        ...prev.comment,
                        style: value as CommentOptions['style'],
                      },
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
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
                <Label>Audience</Label>
                <Input
                  value={options.comment.audience}
                  onChange={(event) =>
                    setOptions((prev) => ({
                      ...prev,
                      comment: { ...prev.comment, audience: event.target.value },
                    }))
                  }
                  placeholder="e.g. fintech community"
                />
              </div>
              <div className="space-y-2">
                <Label>Max variants</Label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={options.comment.maxVariants}
                  onChange={(event) =>
                    setOptions((prev) => ({
                      ...prev,
                      comment: {
                        ...prev.comment,
                        maxVariants: Number(event.target.value) || 1,
                      },
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-md border border-border p-3 md:col-span-2">
                <div>
                  <Label>Fact mode</Label>
                  <p className="text-xs text-muted-foreground">Keep it accurate.</p>
                </div>
                <Switch
                  checked={options.comment.factMode}
                  onCheckedChange={(value) =>
                    setOptions((prev) => ({
                      ...prev,
                      comment: { ...prev.comment, factMode: value },
                    }))
                  }
                />
              </div>
            </div>
          )}
        </div>

        <Button
          type="button"
          size="lg"
          onClick={onGenerate}
          disabled={isGenerateDisabled}
          className="mt-auto"
        >
          <Rocket className="h-4 w-4" />
          {isLoading ? 'Generating...' : 'Generate'}
        </Button>
      </CardContent>
    </Card>
  );
}
