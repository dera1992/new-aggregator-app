import React from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card } from './Card';
import { Button } from './Button';
import type { ArchiveArticle } from '@/types/news';

export function ArticleCard({
  article,
  onOpenStory,
  onSave,
  onRead,
  showActions,
}: {
  article: ArchiveArticle;
  onOpenStory?: () => void;
  onSave?: () => void;
  onRead?: () => void;
  showActions?: boolean;
}) {
  return (
    <Card className="gap-3">
      <View className="gap-1">
        <Text className="text-base font-semibold text-foreground dark:text-dark-foreground">{article.title}</Text>
        <Text className="text-xs text-muted-foreground dark:text-dark-muted-foreground">
          {new Date(article.timestamp).toLocaleString()}
        </Text>
      </View>
      <Text className="text-sm text-muted-foreground dark:text-dark-muted-foreground">{article.summary}</Text>
      <View className="flex-row flex-wrap items-center gap-2">
        <Pressable onPress={() => Linking.openURL(article.url)} className="flex-row items-center gap-1">
          <Ionicons name="link" size={12} color="#0084ff" />
          <Text className="text-xs text-primary">Open source</Text>
        </Pressable>
        <Text className="text-xs text-muted-foreground dark:text-dark-muted-foreground">{article.source}</Text>
        <Text className="text-xs text-muted-foreground dark:text-dark-muted-foreground">{article.category}</Text>
      </View>
      {onOpenStory ? (
        <Button label="Open story" variant="secondary" onPress={onOpenStory} />
      ) : null}
      {showActions ? (
        <View className="flex-row flex-wrap gap-2">
          {onSave ? <Button label="Save" variant="outline" onPress={onSave} /> : null}
          {onRead ? <Button label="Mark read" variant="outline" onPress={onRead} /> : null}
        </View>
      ) : null}
    </Card>
  );
}
