import React from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card } from './Card';
import { Button } from './Button';
import type { Story } from '@/types/news';

export function StoryCard({
  story,
  onOpen,
}: {
  story: Story;
  onOpen: () => void;
}) {
  return (
    <Card className="gap-3">
      <View className="gap-1">
        <Text className="text-base font-semibold text-foreground dark:text-dark-foreground">{story.story_title}</Text>
        <Text className="text-xs text-muted-foreground dark:text-dark-muted-foreground">
          {new Date(story.timestamp).toLocaleString()}
        </Text>
      </View>
      <Text className="text-sm text-muted-foreground dark:text-dark-muted-foreground">{story.summary}</Text>
      <View className="flex-row flex-wrap gap-2">
        {story.sources.map((source) => (
          <Pressable
            key={source.url}
            onPress={() => Linking.openURL(source.url)}
            className="flex-row items-center gap-1"
          >
            <Ionicons name="link" size={12} color="#0084ff" />
            <Text className="text-xs text-primary">{source.name}</Text>
          </Pressable>
        ))}
      </View>
      <Button label="Generate content" variant="secondary" onPress={onOpen} />
    </Card>
  );
}
