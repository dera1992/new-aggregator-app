import React from 'react';
import { Pressable, Share, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';

export function ShareActions({ title, text }: { title: string; text: string }) {
  const handleCopy = async () => {
    await Clipboard.setStringAsync(text);
  };

  const handleShare = async () => {
    await Share.share({ message: text, title });
  };

  return (
    <View className="flex-row gap-3">
      <Pressable onPress={handleCopy} className="flex-row items-center gap-2">
        <Ionicons name="copy" size={16} color="#64748b" />
        <Text className="text-xs text-muted-foreground dark:text-dark-muted-foreground">Copy</Text>
      </Pressable>
      <Pressable onPress={handleShare} className="flex-row items-center gap-2">
        <Ionicons name="share-social" size={16} color="#64748b" />
        <Text className="text-xs text-muted-foreground dark:text-dark-muted-foreground">Share</Text>
      </Pressable>
    </View>
  );
}
