'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  generateAnalysisFromText,
  generateCommentFromText,
  generateJokeFromText,
  generatePerspectiveFromText,
  generateSummaryFromText,
  generateViralPostFromText,
  extractUrlText,
} from '@/lib/api/compose';
import {
  ComposeEditor,
  type ComposeAction,
  type ComposeOptions,
} from '@/components/compose/ComposeEditor';
import {
  ComposeResults,
  type ComposeDraft,
  type ComposeResult,
} from '@/components/compose/ComposeResults';

const DRAFT_TEXT_KEY = 'compose_draft_text';
const DRAFT_OUTPUT_KEY = 'compose_saved_outputs';

const defaultOptions: ComposeOptions = {
  summary: { style: 'standard', maxLength: '' },
  analysis: {
    format: 'standard',
    tone: 'insightful',
    audience: 'general',
    includeTakeaways: true,
    includeCounterpoints: true,
    includeWhatToWatch: true,
    factMode: true,
  },
  joke: {
    platform: 'General',
    style: 'one_liner',
    audience: 'General audience',
    maxVariants: 3,
    factMode: true,
  },
  viral: {
    platform: 'twitter',
    tone: 'punchy',
    goal: 'engagement',
    audience: 'General audience',
    brandVoice: 'clear and confident',
    maxVariants: 3,
    factMode: true,
  },
  comment: {
    platform: 'General',
    style: 'curious',
    audience: 'General audience',
    maxVariants: 2,
    factMode: true,
  },
  perspective: {
    tone: 'neutral',
    slangLevel: 'none',
  },
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error && 'message' in error) {
    return String((error as { message: string }).message);
  }
  return 'Something went wrong. Please try again.';
}

export default function ComposePage() {
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [action, setAction] = useState<ComposeAction>('summary');
  const [options, setOptions] = useState<ComposeOptions>(defaultOptions);
  const [articleUrl, setArticleUrl] = useState('');
  const [result, setResult] = useState<ComposeResult | null>(null);
  const [drafts, setDrafts] = useState<ComposeDraft[]>([]);

  useEffect(() => {
    const savedText = localStorage.getItem(DRAFT_TEXT_KEY);
    if (savedText) {
      setText(savedText);
    }
    const savedDrafts = localStorage.getItem(DRAFT_OUTPUT_KEY);
    if (savedDrafts) {
      try {
        const parsed = JSON.parse(savedDrafts) as ComposeDraft[];
        if (Array.isArray(parsed)) {
          setDrafts(parsed);
        }
      } catch (error) {
        console.warn('Failed to parse saved drafts', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(DRAFT_TEXT_KEY, text);
  }, [text]);

  useEffect(() => {
    localStorage.setItem(DRAFT_OUTPUT_KEY, JSON.stringify(drafts));
  }, [drafts]);

  useEffect(() => {
    setResult(null);
  }, [action]);

  const charCount = text.trim().length;
  const minCharacters = 50;
  const remainingChars = Math.max(0, minCharacters - charCount);
  const canGenerate = charCount >= minCharacters;

  const urlImportMutation = useMutation({
    mutationFn: async (url: string) =>
      extractUrlText({
        url,
      }),
    onSuccess: (data) => {
      setText(data.text);
      setArticleUrl('');
      toast.success(
        data.source_type === 'youtube'
          ? 'Imported YouTube transcript into editor.'
          : 'Imported article text into editor.',
      );
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const mutation = useMutation({
    mutationFn: async (payload: {
      action: ComposeAction;
      text: string;
      options: ComposeOptions;
    }) => {
      if (payload.text.trim().length < 50) {
        throw new Error('Paste at least 50 characters to generate content.');
      }

      switch (payload.action) {
        case 'summary': {
          const parsedMaxLength = Number(payload.options.summary.maxLength);
          const maxLength = Number.isFinite(parsedMaxLength) && parsedMaxLength >= 1
            ? parsedMaxLength
            : undefined;
          return generateSummaryFromText({
            text: payload.text,
            style: payload.options.summary.style,
            max_length: maxLength,
          });
        }
        case 'analysis':
          return generateAnalysisFromText({
            text: payload.text,
            format: payload.options.analysis.format,
            tone: payload.options.analysis.tone,
            audience: payload.options.analysis.audience,
            include_takeaways: payload.options.analysis.includeTakeaways,
            include_counterpoints:
              payload.options.analysis.includeCounterpoints,
            include_what_to_watch: payload.options.analysis.includeWhatToWatch,
            fact_mode: payload.options.analysis.factMode,
          });
        case 'joke':
          return generateJokeFromText({
            text: payload.text,
            platform: payload.options.joke.platform,
            style: payload.options.joke.style,
            audience: payload.options.joke.audience || undefined,
            max_variants: payload.options.joke.maxVariants,
            fact_mode: payload.options.joke.factMode,
          });
        case 'viral':
          return generateViralPostFromText({
            text: payload.text,
            platform: payload.options.viral.platform,
            tone: payload.options.viral.tone,
            goal: payload.options.viral.goal,
            audience: payload.options.viral.audience,
            brand_voice: payload.options.viral.brandVoice,
            max_variants: payload.options.viral.maxVariants,
            fact_mode: payload.options.viral.factMode,
          });
        case 'comment':
          return generateCommentFromText({
            text: payload.text,
            platform: payload.options.comment.platform,
            style: payload.options.comment.style,
            audience: payload.options.comment.audience,
            max_variants: payload.options.comment.maxVariants,
            fact_mode: payload.options.comment.factMode,
          });
        case 'perspective':
          return generatePerspectiveFromText({
            text: payload.text,
            tone: payload.options.perspective.tone,
            slang_level: payload.options.perspective.slangLevel,
          });
        default:
          throw new Error('Unsupported action.');
      }
    },
    onSuccess: (data, variables) => {
      setResult({ type: variables.action, data } as ComposeResult);
      toast.success('Generated successfully');
      queryClient.invalidateQueries({ queryKey: ['credits'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const handleImportUrl = () => {
    const normalizedUrl = articleUrl.trim();
    if (!normalizedUrl) {
      toast.error('Paste an article or YouTube URL first.');
      return;
    }

    urlImportMutation.mutate(normalizedUrl);
  };

  const handleGenerate = () => {
    mutation.mutate({ action, text, options });
  };

  const handleClear = () => {
    setText('');
    setResult(null);
    toast.success('Draft cleared');
  };

  const handlePaste = async () => {
    if (!navigator.clipboard?.readText) {
      toast.error('Clipboard access is not available.');
      return;
    }
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (!clipboardText) {
        toast.error('Clipboard is empty.');
        return;
      }
      setText(clipboardText);
      toast.success('Pasted from clipboard');
    } catch (error) {
      toast.error('Unable to read clipboard.');
    }
  };

  const handleSaveDraft = (draftResult: ComposeResult) => {
    const draftText = buildDraftContent(draftResult);
    if (!draftText) {
      toast.error('Nothing to save yet.');
      return;
    }
    const newDraft: ComposeDraft = {
      id: `${Date.now()}`,
      type: draftResult.type,
      content: draftText,
      createdAt: new Date().toISOString(),
    };
    setDrafts((prev) => [newDraft, ...prev].slice(0, 10));
    toast.success('Saved to drafts');
  };

  const draftCount = useMemo(() => drafts.length, [drafts.length]);

  return (
    <div className="grid w-full min-w-0 gap-4 lg:gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <ComposeEditor
        text={text}
        onTextChange={setText}
        action={action}
        onActionChange={setAction}
        options={options}
        setOptions={setOptions}
        onGenerate={handleGenerate}
        onClear={handleClear}
        onPaste={handlePaste}
        articleUrl={articleUrl}
        onArticleUrlChange={setArticleUrl}
        onImportUrl={handleImportUrl}
        isImportingUrl={urlImportMutation.isPending}
        isLoading={mutation.isPending}
        isGenerateDisabled={!canGenerate || mutation.isPending}
        remainingChars={remainingChars}
      />
      <ComposeResults
        result={result}
        isLoading={mutation.isPending}
        drafts={drafts}
        onSaveDraft={handleSaveDraft}
      />
      {draftCount > 0 && (
        <p className="text-xs text-muted-foreground lg:col-span-2">
          You have {draftCount} saved drafts in this browser.
        </p>
      )}
    </div>
  );
}

function buildDraftContent(result: ComposeResult) {
  switch (result.type) {
    case 'summary':
      return result.data.summary;
    case 'analysis': {
      const index = result.data.best_variant_index ?? 0;
      const variant = result.data.variants[index];
      if (!variant) {
        return '';
      }
      const parts = [
        variant.title ? `Title: ${variant.title}` : '',
        variant.hook ? `Hook: ${variant.hook}` : '',
        variant.analysis ? `Analysis: ${variant.analysis}` : '',
        variant.key_takeaways.length
          ? `Key takeaways:\n- ${variant.key_takeaways.join('\n- ')}`
          : '',
        variant.counterpoints.length
          ? `Counterpoints:\n- ${variant.counterpoints.join('\n- ')}`
          : '',
        variant.what_to_watch.length
          ? `What to watch:\n- ${variant.what_to_watch.join('\n- ')}`
          : '',
        `Reading time: ${variant.reading_time_seconds}s`,
      ].filter(Boolean);
      return parts.join('\n\n');
    }
    case 'joke': {
      const index = result.data.best_variant_index ?? 0;
      const joke = result.data.jokes[index];
      return joke?.full_joke ?? '';
    }
    case 'viral': {
      const index = result.data.best_variant_index ?? 0;
      const variant = result.data.variants[index] as
        | { hook?: string; body?: string; hashtags?: string[]; thread?: string[]; text?: string }
        | undefined;
      if (!variant) {
        return '';
      }
      const hashtags = Array.isArray(variant.hashtags) ? variant.hashtags : [];
      const body = variant.body || variant.text || '';
      const parts = [
        body,
        hashtags.length ? hashtags.join(' ') : '',
        variant.thread?.length ? `Thread:
${variant.thread.join('\n')}` : '',
      ].filter(Boolean);
      return parts.join('\n\n');
    }
    case 'comment': {
      const index = result.data.best_variant_index ?? 0;
      const comments = Array.isArray(result.data.comments)
        ? result.data.comments
        : ((result.data as { variants?: Array<{ text?: string }> }).variants || []).map((variant) => ({
            comment: variant.text || '',
            cta_question: '',
          }));
      const comment = comments[index];
      if (!comment) {
        return '';
      }
      return [comment.comment, comment.cta_question]
        .filter(Boolean)
        .join('\n\n');
    }
    case 'perspective': {
      const parts = [
        result.data.neutral_facts.length
          ? `Neutral facts:\n- ${result.data.neutral_facts.join('\n- ')}`
          : '',
        result.data.what_we_know.length
          ? `What we know:\n- ${result.data.what_we_know.join('\n- ')}`
          : '',
        result.data.what_is_unclear.length
          ? `What is unclear:\n- ${result.data.what_is_unclear.join('\n- ')}`
          : '',
        result.data.angles.length
          ? `Angles:\n${result.data.angles.map((a) => `${a.label}: ${a.summary}`).join('\n')}`
          : '',
        `Bias: ${result.data.scores.bias.label} | Clickbait: ${(result.data.scores.clickbait * 100).toFixed(0)}% | Evidence: ${(result.data.scores.evidence * 100).toFixed(0)}%`,
      ].filter(Boolean);
      return parts.join('\n\n');
    }
    default:
      return '';
  }
}
