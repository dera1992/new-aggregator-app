import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

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
import { useTheme } from '@/lib/theme/ThemeProvider';
import { getTheme } from '@/lib/theme/tokens';

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
  const { isDark } = useTheme();
  const theme = getTheme(isDark);

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
      <View style={styles.container}>
        <Card>
          <View style={styles.sectionHeader}>
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Today&apos;s Top Stories</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Browse clustered summaries and tune your feed using quick filters.
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickFilters}>
            {quickFilters.map((filter) => (
              <Button key={filter.label} label={filter.label} variant="secondary" onPress={filter.onPress} />
            ))}
          </ScrollView>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}>
              <Ionicons name="newspaper-outline" size={16} color={theme.colors.primary} />
              <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Stories</Text>
              <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>{stats.storyCount}</Text>
            </View>
            <View style={[styles.statCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}>
              <Ionicons name="globe-outline" size={16} color={theme.colors.primary} />
              <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Sources</Text>
              <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>{stats.sourceCount}</Text>
            </View>
            <View style={[styles.statCardWide, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}>
              <Ionicons name="time-outline" size={16} color={theme.colors.primary} />
              <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Last updated</Text>
              <Text style={[styles.statTime, { color: theme.colors.textPrimary }]}>{stats.lastUpdated}</Text>
            </View>
          </View>
        </Card>

        <Card>
          <View style={styles.filtersHeader}>
            <Text style={[styles.filtersTitle, { color: theme.colors.textPrimary }]}>Filters</Text>
            <Button label={filtersOpen ? 'Hide' : 'Show'} variant="ghost" onPress={() => setFiltersOpen((prev) => !prev)} />
          </View>
          {filtersOpen ? (
            <View style={styles.filtersForm}>
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
          <Card>
            <Text style={[styles.prefText, { color: theme.colors.textSecondary }]}>Your current preferences</Text>
            <View style={styles.badges}>
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
          <View style={styles.storyList}>
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

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },
  sectionHeader: {
    gap: 6,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  quickFilters: {
    gap: 8,
    paddingVertical: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: 110,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    gap: 2,
  },
  statCardWide: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    gap: 2,
  },
  statLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
  },
  statTime: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  filtersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filtersTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  filtersForm: {
    gap: 10,
  },
  prefText: {
    fontSize: 14,
    lineHeight: 20,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  storyList: {
    gap: 14,
  },
});
