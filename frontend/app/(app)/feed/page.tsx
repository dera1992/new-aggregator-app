'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import {
  fetchFeed,
  fetchPersonalizedFeed,
  saveArticle,
  type FeedQuery,
} from '@/lib/api/news';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingState } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { EmptyState } from '@/components/empty-state';
import { PaginationControls } from '@/components/pagination-controls';
import { Badge } from '@/components/ui/badge';
import { Bookmark } from 'lucide-react';
import { toast } from 'sonner';
import { getToken } from '@/lib/auth/token';

const feedCategoryOptions = [
  'All categories',
  'Tech',
  'Business',
  'Sports',
  'Politics',
  'Lifestyle',
] as const;

const countryOptions = [
  'All countries',
  'United States',
  'United Kingdom',
  'Global',
] as const;

const defaultFilters: FeedQuery = {
  category: '',
  source: '',
  since: '',
  search: '',
  country: '',
  limit: 20,
  offset: 0,
};

export default function FeedPage() {
  const [filters, setFilters] = useState<FeedQuery>(defaultFilters);
  const adminUserId = process.env.NEXT_PUBLIC_ADMIN_USER_ID;

  const feedQuery = useQuery({
    queryKey: ['feed', filters],
    queryFn: () => fetchFeed(filters),
  });

  const personalizedQuery = useQuery({
    queryKey: ['personalized-feed', filters],
    queryFn: () => fetchPersonalizedFeed(filters),
  });

  const trendingStoriesQuery = useQuery({
    queryKey: ['trending-stories'],
    queryFn: () => fetchFeed({
      limit: 3,
      since: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    }),
    staleTime: 10 * 60 * 1000,
  });

  const updateFilter = (key: keyof FeedQuery, value: string | number) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const isAdmin = useMemo(() => {
    if (!adminUserId) {
      return false;
    }
    const token = getToken();
    if (!token) {
      return false;
    }
    try {
      const payload = token.split('.')[1];
      if (!payload) {
        return false;
      }
      const decoded = JSON.parse(
        atob(payload.replace(/-/g, '+').replace(/_/g, '/')),
      );
      const userId =
        typeof decoded.user_id === 'number' ? decoded.user_id : null;
      return userId !== null && String(userId) === String(adminUserId);
    } catch {
      return false;
    }
  }, [adminUserId]);

  const feedStats = useMemo(() => {
    const stories = feedQuery.data?.stories ?? [];
    const sources = new Set(
      stories.flatMap((story) => story.sources.map((source) => source.name)),
    );
    const latestTimestamp = stories
      .map((story) => story.timestamp)
      .sort()
      .at(-1);
    return {
      storyCount: stories.length,
      sourceCount: sources.size,
      lastUpdated: latestTimestamp
        ? new Date(latestTimestamp).toLocaleString()
        : '—',
    };
  }, [feedQuery.data?.stories]);

  const applyQuickFilter = (next: Partial<FeedQuery>) => {
    setFilters((prev) => ({
      ...prev,
      ...next,
      offset: 0,
    }));
  };

  const quickFilters = [
    {
      label: 'Last 24 hours',
      onClick: () => {
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        applyQuickFilter({ since });
      },
    },
    {
      label: 'Tech',
      onClick: () => applyQuickFilter({ category: 'Tech' }),
    },
    {
      label: 'Business',
      onClick: () => applyQuickFilter({ category: 'Business' }),
    },
    {
      label: 'Sports',
      onClick: () => applyQuickFilter({ category: 'Sports' }),
    },
    {
      label: 'Politics',
      onClick: () => applyQuickFilter({ category: 'Politics' }),
    },
    {
      label: 'Lifestyle',
      onClick: () => applyQuickFilter({ category: 'Lifestyle' }),
    },
    {
      label: 'Reset filters',
      onClick: () => applyQuickFilter({ category: '', source: '', since: '', search: '', country: '' }),
    },
  ];

  const renderStories = (
    data: typeof feedQuery.data | typeof personalizedQuery.data,
    isLoading: boolean,
    error: Error | null,
  ) => {
    if (isLoading) {
      return <LoadingState label="Loading stories" />;
    }
    if (error) {
      return <ErrorState message={error.message} />;
    }
    if (!data || data.stories.length === 0) {
      return <EmptyState message="No stories available for these filters." />;
    }

    return (
      <div className="space-y-4">
        {data.stories.map((story, index) => (
          <Card
            key={`${story.story_title}-${index}`}
            className="w-full min-w-0"
          >
            <CardHeader>
              <CardTitle className="break-words">{story.story_title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {new Date(story.timestamp).toLocaleString()}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="break-words text-sm text-muted-foreground">
                {story.summary}
              </p>
              <div className="flex flex-wrap gap-2">
                {story.sources.map((source) => (
                  <a
                    key={source.url}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    {source.name}
                  </a>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="secondary" size="sm">
                  <Link href={`/story/${story.cluster_id}`}>
                    Generate content
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/story/${story.cluster_id}?tab=perspective`}>
                    Perspective
                  </Link>
                </Button>
                {story.lead_article_id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      saveArticle(story.lead_article_id!).then(() =>
                        toast.success('Story saved.'),
                      ).catch(() => toast.error('Already saved or failed.'))
                    }
                  >
                    <Bookmark className="mr-1 h-4 w-4" />
                    Save
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        <PaginationControls
          limit={data.limit}
          offset={data.offset}
          total={data.total ?? data.offset + data.count}
          onPageChange={(nextOffset) => updateFilter('offset', nextOffset)}
        />
      </div>
    );
  };

  const trendingStories = (trendingStoriesQuery.data?.stories ?? []).slice(0, 3);

  return (
    <div className="space-y-6">
      {trendingStories.length > 0 && (
        <Card className="w-full min-w-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Trending Stories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {trendingStories.map((story, index) => (
              <div
                key={`${story.cluster_id}-${index}`}
                className="flex items-start justify-between gap-3 rounded-md border p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="break-words font-medium text-sm leading-snug">
                    {story.story_title}
                  </p>
                  {story.summary && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {story.summary}
                    </p>
                  )}
                </div>
                <Link
                  href={`/story/${story.cluster_id}`}
                  className="shrink-0 text-xs text-primary hover:underline"
                >
                  View story
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="w-full min-w-0">
        <CardHeader>
          <CardTitle className="break-words">
            Today&apos;s Top Stories
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Browse the latest clustered news summaries. Use filters to narrow by
            category, source, or time.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {quickFilters.map((filter) => (
              <Button
                key={filter.label}
                type="button"
                variant="secondary"
                size="sm"
                onClick={filter.onClick}
              >
                {filter.label}
              </Button>
            ))}
          </div>
          {isAdmin ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-border bg-background p-3">
                <p className="text-xs uppercase text-muted-foreground">
                  Stories loaded
                </p>
                <p className="text-lg font-semibold">{feedStats.storyCount}</p>
              </div>
              <div className="rounded-md border border-border bg-background p-3">
                <p className="text-xs uppercase text-muted-foreground">
                  Sources
                </p>
                <p className="text-lg font-semibold">{feedStats.sourceCount}</p>
              </div>
              <div className="rounded-md border border-border bg-background p-3">
                <p className="text-xs uppercase text-muted-foreground">
                  Last updated
                </p>
                <p className="text-sm font-medium">{feedStats.lastUpdated}</p>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
      <Card className="w-full min-w-0">
        <CardHeader>
          <CardTitle className="break-words">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            className="w-full"
            placeholder="Search stories…"
            value={filters.search}
            onChange={(event) => updateFilter('search', event.target.value)}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Select
              value={filters.category || 'All categories'}
              onValueChange={(value) =>
                updateFilter('category', value === 'All categories' ? '' : value)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {feedCategoryOptions.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.country || 'All countries'}
              onValueChange={(value) =>
                updateFilter('country', value === 'All countries' ? '' : value)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                {countryOptions.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              className="w-full"
              placeholder="Source domain"
              value={filters.source}
              onChange={(event) => updateFilter('source', event.target.value)}
            />
            <Input
              className="w-full"
              placeholder="Since (ISO)"
              value={filters.since}
              onChange={(event) => updateFilter('since', event.target.value)}
            />
            <Input
              className="w-full"
              type="number"
              min={1}
              placeholder="Limit"
              value={filters.limit}
              onChange={(event) =>
                updateFilter('limit', Number(event.target.value))
              }
            />
            <Input
              className="w-full"
              type="number"
              min={0}
              placeholder="Offset"
              value={filters.offset}
              onChange={(event) =>
                updateFilter('offset', Number(event.target.value))
              }
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="clustered">
        <TabsList>
          <TabsTrigger value="clustered">Clustered Feed</TabsTrigger>
          <TabsTrigger value="personalized">Personalized Feed</TabsTrigger>
        </TabsList>
        <TabsContent value="clustered">
          {renderStories(
            feedQuery.data,
            feedQuery.isLoading,
            feedQuery.error as Error | null,
          )}
        </TabsContent>
        <TabsContent value="personalized">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {personalizedQuery.data?.preferences ? (
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    Categories:{' '}
                    {personalizedQuery.data.preferences.preferred_categories.join(
                      ', ',
                    ) || 'None'}
                  </Badge>
                  <Badge variant="secondary">
                    Sources:{' '}
                    {personalizedQuery.data.preferences.preferred_sources.join(
                      ', ',
                    ) || 'None'}
                  </Badge>
                </div>
              ) : (
                'No preferences summary provided.'
              )}
            </div>
            <Button asChild variant="outline">
              <Link href="/preferences">Edit Preferences</Link>
            </Button>
          </div>
          {renderStories(
            personalizedQuery.data,
            personalizedQuery.isLoading,
            personalizedQuery.error as Error | null,
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
