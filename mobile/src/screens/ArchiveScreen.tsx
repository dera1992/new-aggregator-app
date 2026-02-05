import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { ArticleCard } from '@/components/ArticleCard';
import { fetchArchive, readArticle, saveArticle, type ArchiveQuery } from '@/lib/api/news';
import type { RootStackParamList } from '@/navigation/root-navigation';
import type { MainTabParamList } from '@/navigation/MainTabs';

const defaultFilters: ArchiveQuery = {
  category: '',
  source: '',
  before: '',
  limit: 10,
  offset: 0,
};

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Archive'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function ArchiveScreen() {
  const [filters, setFilters] = useState<ArchiveQuery>(defaultFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();

  const archiveQuery = useQuery({
    queryKey: ['archive', filters],
    queryFn: () => fetchArchive(filters),
  });

  const saveMutation = useMutation({
    mutationFn: (articleId: number) => saveArticle(articleId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved'] }),
  });

  const readMutation = useMutation({
    mutationFn: (articleId: number) => readArticle(articleId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['read'] }),
  });

  const updateFilter = (key: keyof ArchiveQuery, value: string | number) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Screen
      refreshing={archiveQuery.isLoading}
      onRefresh={() => archiveQuery.refetch()}
    >
      <View className="gap-6">
        <Card className="gap-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-semibold text-foreground dark:text-dark-foreground">Archive Filters</Text>
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
              <Input placeholder="Before (ISO)" value={filters.before} onChangeText={(value) => updateFilter('before', value)} />
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

        {archiveQuery.isLoading ? (
          <LoadingState label="Loading archive" />
        ) : archiveQuery.error ? (
          <ErrorState message={(archiveQuery.error as Error).message} />
        ) : !archiveQuery.data || archiveQuery.data.articles.length === 0 ? (
          <EmptyState message="No archived articles found." />
        ) : (
          <View className="gap-4">
            {archiveQuery.data.articles.map((article) => (
              <ArticleCard
                key={`${article.title}-${article.timestamp}`}
                article={article}
                onOpenStory={
                  article.cluster_id
                    ? () => navigation.navigate('StoryDetail', { clusterId: String(article.cluster_id) })
                    : undefined
                }
                showActions={Boolean(article.article_id)}
                onSave={
                  article.article_id != null
                    ? () => saveMutation.mutate(article.article_id!)
                    : undefined // TODO: Add save support once archive articles include article_id.
                }
                onRead={
                  article.article_id != null
                    ? () => readMutation.mutate(article.article_id!)
                    : undefined // TODO: Add read support once archive articles include article_id.
                }
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
