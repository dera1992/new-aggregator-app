import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { Badge } from '@/components/Badge';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Screen } from '@/components/Screen';
import { StoryCard } from '@/components/StoryCard';
import { fetchFeed, fetchPersonalizedFeed, type FeedQuery } from '@/lib/api/news';
import type { RootStackParamList } from '@/navigation/root-navigation';
import type { MainTabParamList } from '@/navigation/MainTabs';
import { Ionicons } from '@expo/vector-icons';

const defaultFilters: FeedQuery = {
  category: '',
  source: '',
  since: '',
  limit: 10,
  offset: 0,
};

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Feed'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function FeedScreen() {
  const [filters, setFilters] = useState<FeedQuery>(defaultFilters);
  const [segment, setSegment] = useState<'clustered' | 'personalized'>('clustered');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const navigation = useNavigation<NavigationProp>();

  const feedQuery = useQuery({
    queryKey: ['feed', filters],
    queryFn: () => fetchFeed(filters),
  });

  const personalizedQuery = useQuery({
    queryKey: ['personalized-feed', filters],
    queryFn: () => fetchPersonalizedFeed(filters),
  });

  const data = segment === 'clustered' ? feedQuery.data : personalizedQuery.data;
  const isLoading = segment === 'clustered' ? feedQuery.isLoading : personalizedQuery.isLoading;
  const error = (segment === 'clustered' ? feedQuery.error : personalizedQuery.error) as Error | null;

  const updateFilter = (key: keyof FeedQuery, value: string | number) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const quickFilters = [
    {
      label: 'Last 24 hours',
      onPress: () => updateFilter('since', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    },
    { label: 'Tech', onPress: () => updateFilter('category', 'Tech') },
    { label: 'Business', onPress: () => updateFilter('category', 'Business') },
    { label: 'Sports', onPress: () => updateFilter('category', 'Sports') },
    { label: 'Politics', onPress: () => updateFilter('category', 'Politics') },
    { label: 'Lifestyle', onPress: () => updateFilter('category', 'Lifestyle') },
  ];

  const stats = useMemo(() => {
    const stories = feedQuery.data?.stories ?? [];
    const sources = new Set(stories.flatMap((story) => story.sources.map((source) => source.name)));
    const latest = stories.map((story) => story.timestamp).sort().at(-1);
    return {
      storyCount: stories.length,
      sourceCount: sources.size,
      lastUpdated: latest ? new Date(latest).toLocaleString() : '—',
    };
  }, [feedQuery.data?.stories]);

  return (
    <Screen
      refreshing={isLoading}
      onRefresh={() => {
        if (segment === 'clustered') {
          feedQuery.refetch();
        } else {
          personalizedQuery.refetch();
        }
      }}
    >
      <View className="gap-6">
        <Card className="gap-4">
          <View className="gap-2">
            <Text className="text-lg font-semibold text-foreground dark:text-dark-foreground">Today&apos;s Top Stories</Text>
            <Text className="text-sm text-muted-foreground dark:text-dark-muted-foreground">
              Browse the latest clustered news summaries. Use filters to narrow by category, source, or time.
            </Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {quickFilters.map((filter) => (
              <Button key={filter.label} label={filter.label} variant="secondary" onPress={filter.onPress} />
            ))}
          </View>
          <View className="flex-row flex-wrap gap-3">
            <View className="rounded-md border border-border bg-background px-3 py-2 dark:border-dark-border dark:bg-dark-background">
              <Text className="text-[10px] uppercase text-muted-foreground dark:text-dark-muted-foreground">Stories loaded</Text>
              <Text className="text-base font-semibold text-foreground dark:text-dark-foreground">{stats.storyCount}</Text>
            </View>
            <View className="rounded-md border border-border bg-background px-3 py-2 dark:border-dark-border dark:bg-dark-background">
              <Text className="text-[10px] uppercase text-muted-foreground dark:text-dark-muted-foreground">Sources</Text>
              <Text className="text-base font-semibold text-foreground dark:text-dark-foreground">{stats.sourceCount}</Text>
            </View>
            <View className="rounded-md border border-border bg-background px-3 py-2 dark:border-dark-border dark:bg-dark-background">
              <Text className="text-[10px] uppercase text-muted-foreground dark:text-dark-muted-foreground">Last updated</Text>
              <Text className="text-xs font-medium text-foreground dark:text-dark-foreground">{stats.lastUpdated}</Text>
            </View>
          </View>
        </Card>

        <Card className="gap-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-semibold text-foreground dark:text-dark-foreground">Filters</Text>
            <Button
              label={filtersOpen ? 'Hide' : 'Show'}
              variant="ghost"
              onPress={() => setFiltersOpen((prev) => !prev)}
            />
          </View>
          {filtersOpen ? (
            <View className="gap-3">
              <Input placeholder="Category" value={filters.category} onChangeText={(value) => updateFilter('category', value)} />
              <Input placeholder="Source" value={filters.source} onChangeText={(value) => updateFilter('source', value)} />
              <Input placeholder="Since (ISO)" value={filters.since} onChangeText={(value) => updateFilter('since', value)} />
              <Input
                placeholder="Limit"
                keyboardType="numeric"
                value={String(filters.limit ?? '')}
                onChangeText={(value) => updateFilter('limit', Number(value))}
              />
              <Input
                placeholder="Offset"
                keyboardType="numeric"
                value={String(filters.offset ?? '')}
                onChangeText={(value) => updateFilter('offset', Number(value))}
              />
            </View>
          ) : null}
        </Card>

        <SegmentedControl
          options={[
            { label: 'Clustered Feed', value: 'clustered' },
            { label: 'Personalized Feed', value: 'personalized' },
          ]}
          value={segment}
          onChange={(value) => setSegment(value as 'clustered' | 'personalized')}
        />

        {segment === 'personalized' && personalizedQuery.data?.preferences ? (
          <Card className="gap-3">
            <Text className="text-sm text-muted-foreground dark:text-dark-muted-foreground">Your current preferences</Text>
            <View className="flex-row flex-wrap gap-2">
              <Badge label={`Categories: ${personalizedQuery.data.preferences.preferred_categories.join(', ') || 'None'}`} />
              <Badge label={`Sources: ${personalizedQuery.data.preferences.preferred_sources.join(', ') || 'None'}`} />
            </View>
            <Button label="Edit Preferences" variant="outline" onPress={() => navigation.navigate('Preferences')} />
          </Card>
        ) : null}

        {isLoading ? (
          <LoadingState label="Loading stories" />
        ) : error ? (
          <ErrorState message={error.message} />
        ) : !data || data.stories.length === 0 ? (
          <EmptyState message="No stories available for these filters." />
        ) : (
          <View className="gap-4">
            {data.stories.map((story) => (
              <StoryCard
                key={story.cluster_id}
                story={story}
                onOpen={() => navigation.navigate('StoryDetail', { clusterId: String(story.cluster_id) })}
              />
            ))}
            <Button
              label="Load more"
              variant="outline"
              onPress={() => updateFilter('offset', (filters.offset ?? 0) + (filters.limit ?? 10))}
            />
          </View>
        )}
      </View>
    </Screen>
  );
}
