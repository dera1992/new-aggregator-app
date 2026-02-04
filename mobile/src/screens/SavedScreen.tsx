import React from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { Screen } from '@/components/Screen';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { ArticleCard } from '@/components/ArticleCard';
import { fetchSavedArticles } from '@/lib/api/news';
import type { RootStackParamList } from '@/navigation/root-navigation';
import type { MainTabParamList } from '@/navigation/MainTabs';


type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Saved'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function SavedScreen() {
  const navigation = useNavigation<NavigationProp>();
  const savedQuery = useQuery({
    queryKey: ['saved'],
    queryFn: fetchSavedArticles,
  });

  return (
    <Screen
      refreshing={savedQuery.isLoading}
      onRefresh={() => savedQuery.refetch()}
    >
      {savedQuery.isLoading ? (
        <LoadingState label="Loading saved stories" />
      ) : savedQuery.error ? (
        <ErrorState message={(savedQuery.error as Error).message} />
      ) : !savedQuery.data || savedQuery.data.articles.length === 0 ? (
        <EmptyState message="No saved articles yet." />
      ) : (
        <View className="gap-4">
          {savedQuery.data.articles.map((article) => (
            <ArticleCard
              key={`${article.title}-${article.timestamp}`}
              article={article}
              onOpenStory={
                article.cluster_id
                  ? () => navigation.navigate('StoryDetail', { clusterId: String(article.cluster_id) })
                  : undefined
              }
            />
          ))}
        </View>
      )}
    </Screen>
  );
}
