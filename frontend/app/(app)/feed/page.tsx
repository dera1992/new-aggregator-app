'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { fetchFeed, fetchPersonalizedFeed, type FeedQuery } from '@/lib/api/news';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingState } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { EmptyState } from '@/components/empty-state';
import { PaginationControls } from '@/components/pagination-controls';
import { Badge } from '@/components/ui/badge';
import { getToken } from '@/lib/auth/token';

const defaultFilters: FeedQuery = {
  category: '',
  source: '',
  since: '',
  limit: 10,
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
      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      const userId = typeof decoded.user_id === 'number' ? decoded.user_id : null;
      return userId !== null && String(userId) === String(adminUserId);
    } catch {
      return false;
    }
  }, [adminUserId]);

  const feedStats = useMemo(() => {
    const stories = feedQuery.data?.stories ?? [];
    const sources = new Set(stories.flatMap((story) => story.sources.map((source) => source.name)));
    const latestTimestamp = stories
      .map((story) => story.timestamp)
      .sort()
      .at(-1);
    return {
      storyCount: stories.length,
      sourceCount: sources.size,
      lastUpdated: latestTimestamp ? new Date(latestTimestamp).toLocaleString() : '—',
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
      label: 'Top Sources',
      onClick: () => applyQuickFilter({ source: '' }),
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
          <Card key={`${story.story_title}-${index}`} className="w-full min-w-0">
            <CardHeader>
              <CardTitle className="break-words">{story.story_title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {new Date(story.timestamp).toLocaleString()}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="break-words text-sm text-muted-foreground">{story.summary}</p>
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
              </div>
            </CardContent>
          </Card>
        ))}
        <PaginationControls
          limit={data.limit}
          offset={data.offset}
          total={data.count}
          onPageChange={(nextOffset) => updateFilter('offset', nextOffset)}
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="w-full min-w-0">
        <CardHeader>
          <CardTitle className="break-words">Today&apos;s Top Stories</CardTitle>
          <p className="text-sm text-muted-foreground">
            Browse the latest clustered news summaries. Use filters to narrow by category, source, or time.
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
                <p className="text-xs uppercase text-muted-foreground">Stories loaded</p>
                <p className="text-lg font-semibold">{feedStats.storyCount}</p>
              </div>
              <div className="rounded-md border border-border bg-background p-3">
                <p className="text-xs uppercase text-muted-foreground">Sources</p>
                <p className="text-lg font-semibold">{feedStats.sourceCount}</p>
              </div>
              <div className="rounded-md border border-border bg-background p-3">
                <p className="text-xs uppercase text-muted-foreground">Last updated</p>
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
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Input
            className="w-full"
            placeholder="Category"
            value={filters.category}
            onChange={(event) => updateFilter('category', event.target.value)}
          />
          <Input
            className="w-full"
            placeholder="Source"
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
            onChange={(event) => updateFilter('limit', Number(event.target.value))}
          />
          <Input
            className="w-full"
            type="number"
            min={0}
            placeholder="Offset"
            value={filters.offset}
            onChange={(event) => updateFilter('offset', Number(event.target.value))}
          />
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
                    Categories: {personalizedQuery.data.preferences.preferred_categories.join(', ') || 'None'}
                  </Badge>
                  <Badge variant="secondary">
                    Sources: {personalizedQuery.data.preferences.preferred_sources.join(', ') || 'None'}
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
