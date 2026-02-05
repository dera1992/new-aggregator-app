import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card } from './Card';
import { Button } from './Button';
import type { Story } from '@/types/news';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { getTheme } from '@/lib/theme/tokens';

export function StoryCard({
  story,
  onOpen,
}: {
  story: Story;
  onOpen: () => void;
}) {
  const { isDark } = useTheme();
  const theme = getTheme(isDark);

  return (
    <Card>
      <View style={styles.titleBlock}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{story.story_title}</Text>
        <Text style={[styles.timestamp, { color: theme.colors.textMuted }]}>{new Date(story.timestamp).toLocaleString()}</Text>
      </View>
      <Text style={[styles.summary, { color: theme.colors.textSecondary }]}>{story.summary}</Text>
      <View style={styles.sources}>
        {story.sources.map((source) => (
          <Pressable
            key={source.url}
            onPress={() => Linking.openURL(source.url)}
            style={({ pressed }) => [styles.sourceLink, { opacity: pressed ? 0.75 : 1 }]}
          >
            <Ionicons name="link" size={12} color={theme.colors.primary} />
            <Text style={[styles.sourceText, { color: theme.colors.primary }]}>{source.name}</Text>
          </Pressable>
        ))}
      </View>
      <Button label="Generate content" variant="secondary" onPress={onOpen} />
    </Card>
  );
}

const styles = StyleSheet.create({
  titleBlock: {
    gap: 4,
  },
  title: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '700',
  },
  timestamp: {
    fontSize: 12,
    lineHeight: 16,
  },
  summary: {
    fontSize: 14,
    lineHeight: 20,
  },
  sources: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sourceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sourceText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
});
