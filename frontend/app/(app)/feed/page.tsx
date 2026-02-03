'use client';

import { useState } from 'react';
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

const defaultFilters: FeedQuery = {
  category: '',
  source: '',
  since: '',
  limit: 10,
  offset: 0,
};

export default function FeedPage() {
  const [filters, setFilters] = useState<FeedQuery>(defaultFilters);

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
          <Card key={`${story.story_title}-${index}`}>
            <CardHeader>
              <CardTitle>{story.story_title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {new Date(story.timestamp).toLocaleString()}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{story.summary}</p>
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
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-5">
          <Input
            placeholder="Category"
            value={filters.category}
            onChange={(event) => updateFilter('category', event.target.value)}
          />
          <Input
            placeholder="Source"
            value={filters.source}
            onChange={(event) => updateFilter('source', event.target.value)}
          />
          <Input
            placeholder="Since (ISO)"
            value={filters.since}
            onChange={(event) => updateFilter('since', event.target.value)}
          />
          <Input
            type="number"
            min={1}
            placeholder="Limit"
            value={filters.limit}
            onChange={(event) => updateFilter('limit', Number(event.target.value))}
          />
          <Input
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
