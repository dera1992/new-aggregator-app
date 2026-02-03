'use client';

import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { changePassword } from '@/lib/api/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  GeneratorDefaults,
  loadGeneratorDefaults,
  saveGeneratorDefaults,
} from '@/lib/utils/generator-defaults';

const schema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
});

type FormValues = z.infer<typeof schema>;

export default function SettingsPage() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '' },
  });

  const [defaults, setDefaults] = useState<GeneratorDefaults>(loadGeneratorDefaults());

  useEffect(() => {
    setDefaults(loadGeneratorDefaults());
  }, []);

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      changePassword(values.currentPassword, values.newPassword),
    onSuccess: () => {
      toast.success('Password changed');
      form.reset();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleDefaultsSave = () => {
    saveGeneratorDefaults(defaults);
    toast.success('Generator defaults saved');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input
                id="currentPassword"
                type="password"
                {...form.register('currentPassword')}
              />
              {form.formState.errors.currentPassword && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.currentPassword.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input id="newPassword" type="password" {...form.register('newPassword')} />
              {form.formState.errors.newPassword && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.newPassword.message}
                </p>
              )}
            </div>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Updating...' : 'Update password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generator defaults</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Default tone</Label>
              <Select
                value={defaults.tone}
                onValueChange={(value) =>
                  setDefaults((prev) => ({ ...prev, tone: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bold">Bold</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="funny">Funny</SelectItem>
                  <SelectItem value="controversial_light">Controversial (light)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Default goal</Label>
              <Select
                value={defaults.goal}
                onValueChange={(value) =>
                  setDefaults((prev) => ({ ...prev, goal: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="engagement">Engagement</SelectItem>
                  <SelectItem value="clicks">Clicks</SelectItem>
                  <SelectItem value="followers">Followers</SelectItem>
                  <SelectItem value="thought_leadership">Thought leadership</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Default brand voice</Label>
              <Input
                value={defaults.brandVoice}
                onChange={(event) =>
                  setDefaults((prev) => ({ ...prev, brandVoice: event.target.value }))
                }
                placeholder="Brand voice cues"
              />
            </div>
            <div className="space-y-2">
              <Label>Default audience</Label>
              <Input
                value={defaults.audience}
                onChange={(event) =>
                  setDefaults((prev) => ({ ...prev, audience: event.target.value }))
                }
                placeholder="Audience segment"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Default comment style</Label>
              <Select
                value={defaults.commentStyle}
                onValueChange={(value) =>
                  setDefaults((prev) => ({ ...prev, commentStyle: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Comment style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="curious">Curious</SelectItem>
                  <SelectItem value="supportive">Supportive</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Default comment audience</Label>
              <Input
                value={defaults.commentAudience}
                onChange={(event) =>
                  setDefaults((prev) => ({ ...prev, commentAudience: event.target.value }))
                }
                placeholder="Comment audience"
              />
            </div>
          </div>
          <Button onClick={handleDefaultsSave}>Save defaults</Button>
        </CardContent>
      </Card>
    </div>
  );
}
