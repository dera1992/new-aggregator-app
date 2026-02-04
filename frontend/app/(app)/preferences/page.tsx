'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { toast } from 'sonner';

import { fetchPreferences, updatePreferences } from '@/lib/api/preferences';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { Button } from '@/components/ui/button';
import { TagInput } from '@/components/tag-input';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const timeSchema = z
  .string()
  .regex(/^$|^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM format');

export default function PreferencesPage() {
  const queryClient = useQueryClient();
  const preferencesQuery = useQuery({
    queryKey: ['preferences'],
    queryFn: fetchPreferences,
  });

  const [categories, setCategories] = useState<string[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [digestTime, setDigestTime] = useState<string>('');
  const [digestEnabled, setDigestEnabled] = useState<boolean>(false);
  const [timeError, setTimeError] = useState<string>('');

  useEffect(() => {
    if (preferencesQuery.data) {
      setCategories(preferencesQuery.data.preferred_categories ?? []);
      setSources(preferencesQuery.data.preferred_sources ?? []);
      setDigestTime(preferencesQuery.data.digest_time ?? '');
      setDigestEnabled(Boolean(preferencesQuery.data.digest_enabled));
    }
  }, [preferencesQuery.data]);

  const mutation = useMutation({
    mutationFn: () =>
      updatePreferences({
        preferred_categories: categories,
        preferred_sources: sources,
        digest_time: digestTime || null,
        digest_enabled: digestEnabled,
      }),
    onSuccess: () => {
      toast.success('Preferences updated');
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
      queryClient.invalidateQueries({ queryKey: ['personalized-feed'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleSave = () => {
    const result = timeSchema.safeParse(digestTime ?? '');
    if (!result.success) {
      setTimeError(result.error.errors[0].message);
      return;
    }
    setTimeError('');
    mutation.mutate();
  };

  return (
    <Card className="w-full min-w-0">
      <CardHeader>
        <CardTitle className="break-words">Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {preferencesQuery.isLoading && <LoadingState label="Loading preferences" />}
        {preferencesQuery.error && (
          <ErrorState message={(preferencesQuery.error as Error).message} />
        )}
        {preferencesQuery.data && (
          <div className="space-y-6">
            <TagInput
              label="Preferred categories"
              values={categories}
              onChange={setCategories}
              placeholder="Add category"
            />
            <TagInput
              label="Preferred sources"
              values={sources}
              onChange={setSources}
              placeholder="Add source"
            />
            <div className="space-y-2">
              <Label htmlFor="digestTime">Digest time (HH:MM)</Label>
              <Input
                id="digestTime"
                value={digestTime}
                onChange={(event) => setDigestTime(event.target.value)}
                placeholder="08:30"
              />
              {timeError && <p className="text-xs text-destructive">{timeError}</p>}
            </div>
            <div className="flex items-center justify-between rounded-md border border-border p-4">
              <div>
                <Label>Digest enabled</Label>
                <p className="text-xs text-muted-foreground">
                  Toggle daily digest notifications.
                </p>
              </div>
              <Switch checked={digestEnabled} onCheckedChange={setDigestEnabled} />
            </div>
            <Button onClick={handleSave} disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : 'Save preferences'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
