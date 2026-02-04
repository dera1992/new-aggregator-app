import React, { useEffect, useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { fetchPreferences, updatePreferences } from '@/lib/api/preferences';

export function PreferencesScreen() {
  const queryClient = useQueryClient();
  const preferencesQuery = useQuery({
    queryKey: ['preferences'],
    queryFn: fetchPreferences,
  });
  const mutation = useMutation({
    mutationFn: updatePreferences,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['preferences'] }),
  });

  const [categories, setCategories] = useState<string[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [categoryInput, setCategoryInput] = useState('');
  const [sourceInput, setSourceInput] = useState('');
  const [digestTime, setDigestTime] = useState('08:00');
  const [digestEnabled, setDigestEnabled] = useState(true);

  useEffect(() => {
    if (preferencesQuery.data) {
      const { preferred_categories, preferred_sources, digest_time, digest_enabled } = preferencesQuery.data;
      setCategories(preferred_categories);
      setSources(preferred_sources);
      setDigestTime(digest_time);
      setDigestEnabled(digest_enabled);
    }
  }, [preferencesQuery.data]);

  const addItem = (value: string, list: string[], setList: (next: string[]) => void) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }
    if (!list.includes(trimmed)) {
      setList([...list, trimmed]);
    }
  };

  const removeItem = (value: string, list: string[], setList: (next: string[]) => void) => {
    setList(list.filter((item) => item !== value));
  };

  const handleSave = () => {
    mutation.mutate({
      preferred_categories: categories,
      preferred_sources: sources,
      digest_time: digestTime,
      digest_enabled: digestEnabled,
    });
  };

  if (preferencesQuery.isLoading) {
    return (
      <Screen>
        <LoadingState label="Loading preferences" />
      </Screen>
    );
  }

  if (preferencesQuery.error) {
    return (
      <Screen>
        <ErrorState message={(preferencesQuery.error as Error).message} />
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="gap-6">
        <Card className="gap-4">
          <View className="gap-2">
            <Text className="text-base font-semibold text-foreground dark:text-dark-foreground">Preferred categories</Text>
            <Text className="text-xs text-muted-foreground dark:text-dark-muted-foreground">
              Add or remove categories to personalize your feed.
            </Text>
          </View>
          <View className="flex-row gap-2">
            <Input
              placeholder="Add category"
              value={categoryInput}
              onChangeText={setCategoryInput}
            />
            <Button
              label="Add"
              variant="secondary"
              onPress={() => {
                addItem(categoryInput, categories, setCategories);
                setCategoryInput('');
              }}
            />
          </View>
          <View className="flex-row flex-wrap gap-2">
            {categories.map((category) => (
              <Chip key={category} label={category} onRemove={() => removeItem(category, categories, setCategories)} />
            ))}
          </View>
        </Card>

        <Card className="gap-4">
          <View className="gap-2">
            <Text className="text-base font-semibold text-foreground dark:text-dark-foreground">Preferred sources</Text>
            <Text className="text-xs text-muted-foreground dark:text-dark-muted-foreground">Focus on outlets you trust.</Text>
          </View>
          <View className="flex-row gap-2">
            <Input
              placeholder="Add source"
              value={sourceInput}
              onChangeText={setSourceInput}
            />
            <Button
              label="Add"
              variant="secondary"
              onPress={() => {
                addItem(sourceInput, sources, setSources);
                setSourceInput('');
              }}
            />
          </View>
          <View className="flex-row flex-wrap gap-2">
            {sources.map((source) => (
              <Chip key={source} label={source} onRemove={() => removeItem(source, sources, setSources)} />
            ))}
          </View>
        </Card>

        <Card className="gap-4">
          <Text className="text-base font-semibold text-foreground dark:text-dark-foreground">Digest schedule</Text>
          <View className="gap-2">
            <Text className="text-xs text-muted-foreground dark:text-dark-muted-foreground">Digest time (HH:MM)</Text>
            <Input value={digestTime} onChangeText={setDigestTime} placeholder="08:00" />
          </View>
          <View className="flex-row items-center justify-between rounded-md border border-border px-3 py-2 dark:border-dark-border">
            <View>
              <Text className="text-sm font-medium text-foreground dark:text-dark-foreground">Enable daily digest</Text>
              <Text className="text-xs text-muted-foreground dark:text-dark-muted-foreground">
                Receive a summary at your chosen time.
              </Text>
            </View>
            <Switch value={digestEnabled} onValueChange={setDigestEnabled} />
          </View>
        </Card>

        <Button label={mutation.isPending ? 'Saving...' : 'Save preferences'} onPress={handleSave} />
        {mutation.error ? <ErrorState message={(mutation.error as Error).message} /> : null}
      </View>
    </Screen>
  );
}
