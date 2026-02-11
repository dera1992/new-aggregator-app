import React, { useMemo, useState } from "react";
import { FlatList, Pressable, Share, Text, View } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";

import {
  generatePerspective,
  type PerspectiveSlang,
  type PerspectiveTone,
} from "@/lib/api/news";
import { usePerspective } from "@/hooks/usePerspective";
import { Skeleton } from "@/components/Skeleton";

function ProgressBar({ label, value }: { label: string; value: number }) {
  const percent = Math.max(0, Math.min(100, Math.round(value * 100)));

  return (
    <View className="gap-1">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-medium text-foreground dark:text-dark-foreground">
          {label}
        </Text>
        <Text className="text-xs text-muted-foreground dark:text-dark-muted-foreground">
          {percent}%
        </Text>
      </View>
      <View className="h-2 overflow-hidden rounded-full bg-secondary dark:bg-dark-secondary">
        <View
          className="h-full rounded-full bg-primary"
          style={{ width: `${percent}%` }}
        />
      </View>
    </View>
  );
}

export function PerspectiveTab({ clusterId }: { clusterId: number }) {
  const queryClient = useQueryClient();
  const [tone, setTone] = useState<PerspectiveTone>("genz");
  const [slang, setSlang] = useState<PerspectiveSlang>("light");
  const perspectiveQuery = usePerspective(clusterId, tone, slang);

  const refreshMutation = useMutation({
    mutationFn: () =>
      generatePerspective({
        clusterId,
        tone,
        slangLevel: slang,
        forceRefresh: true,
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(["perspective", clusterId, tone, slang], data);
    },
  });

  const genZTake = useMemo(
    () =>
      perspectiveQuery.data?.angles.find((angle) =>
        angle.label.toLowerCase().includes("gen-z"),
      )?.summary ?? "",
    [perspectiveQuery.data?.angles],
  );

  const copyGenZTake = async () => {
    if (!genZTake) {
      return;
    }
    await Clipboard.setStringAsync(genZTake);
  };

  const shareGenZTake = async () => {
    if (!genZTake) {
      return;
    }
    await Share.share({
      title: "Gen-Z take",
      message: genZTake,
    });
  };

  if (perspectiveQuery.isLoading && !perspectiveQuery.data) {
    return (
      <View className="gap-4">
        <View className="rounded-2xl border border-border bg-card p-4 dark:border-dark-border dark:bg-dark-card">
          <Skeleton className="mb-3 h-4 w-1/2" />
          <Skeleton className="mb-2 h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </View>
        <View className="rounded-2xl border border-border bg-card p-4 dark:border-dark-border dark:bg-dark-card">
          <Skeleton className="mb-3 h-4 w-1/3" />
          <Skeleton className="mb-2 h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </View>
      </View>
    );
  }

  if (perspectiveQuery.error && !perspectiveQuery.data) {
    return (
      <View className="gap-3 rounded-2xl border border-border bg-card p-4 dark:border-dark-border dark:bg-dark-card">
        <Text className="text-base font-semibold text-foreground dark:text-dark-foreground">
          Couldn&apos;t load Perspective Mode
        </Text>
        <Text className="text-sm text-muted-foreground dark:text-dark-muted-foreground">
          {(perspectiveQuery.error as Error).message}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retry perspective generation"
          className="min-h-[44px] items-center justify-center rounded-xl bg-primary px-4"
          onPress={() => perspectiveQuery.refetch()}
        >
          <Text className="text-sm font-semibold text-primary-foreground">
            Retry
          </Text>
        </Pressable>
      </View>
    );
  }

  if (!perspectiveQuery.data) {
    return null;
  }

  return (
    <View className="gap-4">
      <View className="gap-3 rounded-2xl border border-border bg-card p-4 dark:border-dark-border dark:bg-dark-card">
        <Text className="text-sm font-semibold text-foreground dark:text-dark-foreground">
          Controls
        </Text>
        <View className="gap-2">
          <Text className="text-xs font-medium text-muted-foreground dark:text-dark-muted-foreground">
            Tone
          </Text>
          <View className="flex-row gap-2">
            {(
              [
                { label: "Gen-Z", value: "genz" },
                { label: "Neutral", value: "neutral" },
                { label: "Professional", value: "professional" },
              ] as const
            ).map((item) => (
              <Pressable
                key={item.value}
                accessibilityRole="button"
                accessibilityLabel={`Select ${item.label} tone`}
                className={`min-h-[44px] flex-1 items-center justify-center rounded-xl border px-2 ${
                  tone === item.value
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background dark:border-dark-border dark:bg-dark-background"
                }`}
                onPress={() => setTone(item.value)}
              >
                <Text className="text-xs font-medium text-foreground dark:text-dark-foreground">
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-xs font-medium text-muted-foreground dark:text-dark-muted-foreground">
            Slang
          </Text>
          <View className="flex-row gap-2">
            {(
              [
                { label: "None", value: "none" },
                { label: "Light", value: "light" },
                { label: "Heavy", value: "heavy" },
              ] as const
            ).map((item) => (
              <Pressable
                key={item.value}
                accessibilityRole="button"
                accessibilityLabel={`Select ${item.label} slang level`}
                className={`min-h-[44px] flex-1 items-center justify-center rounded-xl border px-2 ${
                  slang === item.value
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background dark:border-dark-border dark:bg-dark-background"
                }`}
                onPress={() => setSlang(item.value)}
              >
                <Text className="text-xs font-medium text-foreground dark:text-dark-foreground">
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="flex-row gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Refresh perspective"
            className="min-h-[44px] flex-1 items-center justify-center rounded-xl bg-primary px-3"
            onPress={() => refreshMutation.mutate()}
          >
            <Text className="text-sm font-semibold text-primary-foreground">
              {refreshMutation.isPending ? "Refreshing…" : "Refresh"}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Copy Gen-Z take"
            disabled={!genZTake}
            className="min-h-[44px] flex-1 items-center justify-center rounded-xl border border-border bg-background px-3 dark:border-dark-border dark:bg-dark-background"
            onPress={copyGenZTake}
          >
            <Text className="text-sm font-semibold text-foreground dark:text-dark-foreground">
              Copy Gen-Z take
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Share Gen-Z take"
            disabled={!genZTake}
            className="min-h-[44px] flex-1 items-center justify-center rounded-xl border border-border bg-background px-3 dark:border-dark-border dark:bg-dark-background"
            onPress={shareGenZTake}
          >
            <Text className="text-sm font-semibold text-foreground dark:text-dark-foreground">
              Share
            </Text>
          </Pressable>
        </View>
      </View>

      <View className="rounded-2xl border border-border bg-card p-4 dark:border-dark-border dark:bg-dark-card">
        <Text className="mb-2 text-base font-semibold text-foreground dark:text-dark-foreground">
          Neutral Facts
        </Text>
        {perspectiveQuery.data.neutral_facts.map((fact, index) => (
          <Text
            key={`${fact}-${index}`}
            className="mb-2 text-sm text-muted-foreground dark:text-dark-muted-foreground"
          >
            • {fact}
          </Text>
        ))}
      </View>

      <View className="gap-3">
        <View className="rounded-2xl border border-border bg-card p-4 dark:border-dark-border dark:bg-dark-card">
          <Text className="mb-2 text-base font-semibold text-foreground dark:text-dark-foreground">
            What we know
          </Text>
          {perspectiveQuery.data.what_we_know.map((item, index) => (
            <Text
              key={`${item}-${index}`}
              className="mb-2 text-sm text-muted-foreground dark:text-dark-muted-foreground"
            >
              • {item}
            </Text>
          ))}
        </View>
        <View className="rounded-2xl border border-border bg-card p-4 dark:border-dark-border dark:bg-dark-card">
          <Text className="mb-2 text-base font-semibold text-foreground dark:text-dark-foreground">
            What&apos;s unclear
          </Text>
          {perspectiveQuery.data.what_is_unclear.map((item, index) => (
            <Text
              key={`${item}-${index}`}
              className="mb-2 text-sm text-muted-foreground dark:text-dark-muted-foreground"
            >
              • {item}
            </Text>
          ))}
        </View>
      </View>

      <View className="rounded-2xl border border-border bg-card p-4 dark:border-dark-border dark:bg-dark-card">
        <Text className="mb-3 text-base font-semibold text-foreground dark:text-dark-foreground">
          Angles
        </Text>
        <FlatList
          horizontal
          data={perspectiveQuery.data.angles}
          keyExtractor={(item) => item.label}
          showsHorizontalScrollIndicator={false}
          ItemSeparatorComponent={() => <View className="w-3" />}
          renderItem={({ item }) => (
            <View className="w-[280px] gap-2 rounded-xl border border-border bg-background p-3 dark:border-dark-border dark:bg-dark-background">
              <Text
                className="text-sm font-semibold text-foreground dark:text-dark-foreground"
                numberOfLines={1}
              >
                {item.label}
              </Text>
              <Text
                className="text-sm text-muted-foreground dark:text-dark-muted-foreground"
                numberOfLines={5}
              >
                {item.summary}
              </Text>
              {item.key_points.map((point, index) => (
                <Text
                  key={`${point}-${index}`}
                  className="text-xs text-muted-foreground dark:text-dark-muted-foreground"
                  numberOfLines={2}
                >
                  • {point}
                </Text>
              ))}
            </View>
          )}
        />
      </View>

      <View className="rounded-2xl border border-border bg-card p-4 dark:border-dark-border dark:bg-dark-card">
        <Text className="mb-3 text-base font-semibold text-foreground dark:text-dark-foreground">
          Sentiment
        </Text>
        <View className="mb-4 flex-row flex-wrap gap-2">
          {perspectiveQuery.data.sentiment.top_emotions.map((emotion) => (
            <View
              key={emotion.emotion}
              className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1"
            >
              <Text className="text-xs font-medium text-primary">
                {emotion.emotion} {Math.round(emotion.score * 100)}%
              </Text>
            </View>
          ))}
        </View>

        <Text className="mb-2 text-sm font-semibold text-foreground dark:text-dark-foreground">
          Top questions
        </Text>
        {perspectiveQuery.data.sentiment.top_questions.map(
          (question, index) => (
            <Text
              key={`${question}-${index}`}
              className="mb-2 text-sm text-muted-foreground dark:text-dark-muted-foreground"
            >
              • {question}
            </Text>
          ),
        )}
      </View>

      <View className="rounded-2xl border border-border bg-card p-4 dark:border-dark-border dark:bg-dark-card">
        <Text className="mb-3 text-base font-semibold text-foreground dark:text-dark-foreground">
          Scores
        </Text>
        <View className="mb-3 rounded-xl border border-border bg-background p-3 dark:border-dark-border dark:bg-dark-background">
          <Text className="text-sm font-semibold text-foreground dark:text-dark-foreground">
            Bias: {perspectiveQuery.data.scores.bias.label}
          </Text>
          <Text className="text-xs text-muted-foreground dark:text-dark-muted-foreground">
            Value: {perspectiveQuery.data.scores.bias.value.toFixed(2)}
          </Text>
        </View>
        <View className="gap-3">
          <ProgressBar
            label="Clickbait"
            value={perspectiveQuery.data.scores.clickbait}
          />
          <ProgressBar
            label="Evidence"
            value={perspectiveQuery.data.scores.evidence}
          />
        </View>
      </View>
    </View>
  );
}
