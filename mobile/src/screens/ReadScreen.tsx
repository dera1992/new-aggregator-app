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
import { fetchReadArticles } from '@/lib/api/news';
import type { RootStackParamList } from '@/navigation/root-navigation';
import type { MainTabParamList } from '@/navigation/MainTabs';


type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Read'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function ReadScreen() {
  const navigation = useNavigation<NavigationProp>();
  const readQuery = useQuery({
    queryKey: ['read'],
    queryFn: fetchReadArticles,
  });

  return (
    <Screen
      refreshing={readQuery.isLoading}
      onRefresh={() => readQuery.refetch()}
    >
      {readQuery.isLoading ? (
        <LoadingState label="Loading read stories" />
      ) : readQuery.error ? (
        <ErrorState message={(readQuery.error as Error).message} />
      ) : !readQuery.data || readQuery.data.articles.length === 0 ? (
        <EmptyState message="No read articles yet." />
      ) : (
        <View className="gap-4">
          {readQuery.data.articles.map((article) => (
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
