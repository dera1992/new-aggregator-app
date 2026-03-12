'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { toast } from 'sonner';
import { X } from 'lucide-react';

import { fetchPreferences, updatePreferences, fetchSources } from '@/lib/api/preferences';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const CATEGORIES = ['Tech', 'Business', 'Sports', 'Politics', 'Lifestyle'];

const timeSchema = z
  .string()
  .regex(/^$|^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM format');

export default function PreferencesPage() {
  const queryClient = useQueryClient();

  const preferencesQuery = useQuery({
    queryKey: ['preferences'],
    queryFn: fetchPreferences,
  });

  const sourcesQuery = useQuery({
    queryKey: ['available-sources'],
    queryFn: fetchSources,
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

  const addCategory = (value: string) => {
    if (value && !categories.includes(value)) {
      setCategories([...categories, value]);
    }
  };

  const removeCategory = (value: string) => {
    setCategories(categories.filter((c) => c !== value));
  };

  const addSource = (value: string) => {
    if (value && !sources.includes(value)) {
      setSources([...sources, value]);
    }
  };

  const removeSource = (value: string) => {
    setSources(sources.filter((s) => s !== value));
  };

  const availableSources = sourcesQuery.data?.sources ?? [];
  const unselectedCategories = CATEGORIES.filter((c) => !categories.includes(c));
  const unselectedSources = availableSources.filter((s) => !sources.includes(s));

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

            {/* Categories */}
            <div className="space-y-2">
              <Label>Preferred categories</Label>
              <Select onValueChange={addCategory} value="">
                <SelectTrigger>
                  <SelectValue placeholder={unselectedCategories.length ? 'Add a category' : 'All categories selected'} />
                </SelectTrigger>
                <SelectContent>
                  {unselectedCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <Badge key={cat} variant="secondary" className="flex items-center gap-1">
                      {cat}
                      <button type="button" onClick={() => removeCategory(cat)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Sources */}
            <div className="space-y-2">
              <Label>Preferred sources</Label>
              {sourcesQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading sources…</p>
              ) : (
                <Select onValueChange={addSource} value="">
                  <SelectTrigger>
                    <SelectValue placeholder={unselectedSources.length ? 'Add a source' : availableSources.length ? 'All sources selected' : 'No sources available yet'} />
                  </SelectTrigger>
                  <SelectContent>
                    {unselectedSources.map((src) => (
                      <SelectItem key={src} value={src}>{src}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {sources.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {sources.map((src) => (
                    <Badge key={src} variant="secondary" className="flex items-center gap-1">
                      {src}
                      <button type="button" onClick={() => removeSource(src)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Digest time */}
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

            {/* Digest toggle */}
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
