'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { changePassword } from '@/lib/api/auth';
import { fetchProfile, updateProfile } from '@/lib/api/profile';
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
import { useTheme } from '@/components/theme-provider';

const passwordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

type ProfileFormValues = {
  full_name: string;
  timezone: string;
  avatar_url: string;
};

export default function SettingsPage() {
  const { resolvedTheme, resetTheme } = useTheme();
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '' },
  });

  const profileForm = useForm<ProfileFormValues>({
    defaultValues: {
      full_name: '',
      timezone: '',
      avatar_url: '',
    },
  });

  const [defaults, setDefaults] = useState<GeneratorDefaults>(loadGeneratorDefaults());

  useEffect(() => {
    setDefaults(loadGeneratorDefaults());
  }, []);

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
  });

  useEffect(() => {
    if (profile) {
      profileForm.reset({
        full_name: profile.full_name ?? '',
        timezone: profile.timezone ?? '',
        avatar_url: profile.avatar_url ?? '',
      });
    }
  }, [profile, profileForm]);

  const passwordMutation = useMutation({
    mutationFn: (values: PasswordFormValues) =>
      changePassword(values.currentPassword, values.newPassword),
    onSuccess: () => {
      toast.success('Password changed');
      passwordForm.reset();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const profileMutation = useMutation({
    mutationFn: (values: ProfileFormValues) =>
      updateProfile({
        full_name: values.full_name || undefined,
        timezone: values.timezone || undefined,
        avatar_url: values.avatar_url || undefined,
      }),
    onSuccess: () => {
      toast.success('Profile updated');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleDefaultsSave = () => {
    saveGeneratorDefaults(defaults);
    toast.success('Generator defaults saved');
  };

  return (
    <div className="space-y-6">
      <Card className="w-full min-w-0">
        <CardHeader>
          <CardTitle className="break-words">Profile</CardTitle>
        </CardHeader>
        <CardContent>
          {isProfileLoading ? (
            <div className="text-sm text-muted-foreground">Loading profile...</div>
          ) : (
            <form
              onSubmit={profileForm.handleSubmit((values) => profileMutation.mutate(values))}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="full_name">Full name</Label>
                <Input id="full_name" {...profileForm.register('full_name')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input id="timezone" {...profileForm.register('timezone')} placeholder="UTC" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="avatar_url">Avatar URL</Label>
                <Input id="avatar_url" {...profileForm.register('avatar_url')} />
              </div>
              <Button type="submit" disabled={profileMutation.isPending}>
                {profileMutation.isPending ? 'Saving...' : 'Save profile'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {profile && (
        <Card className="w-full min-w-0">
          <CardHeader>
            <CardTitle className="break-words">Subscription</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div>Tier: {profile.subscription_tier ?? 'N/A'}</div>
            <div>Status: {profile.subscription_status ?? 'N/A'}</div>
            <div>Expires: {profile.subscription_expires_at ?? 'N/A'}</div>
          </CardContent>
        </Card>
      )}

      <Card className="w-full min-w-0">
        <CardHeader>
          <CardTitle className="break-words">Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div>Current theme: <span className="font-medium text-foreground">{resolvedTheme}</span></div>
          <Button variant="outline" onClick={resetTheme}>
            Reset to default
          </Button>
        </CardContent>
      </Card>

      <Card className="w-full min-w-0">
        <CardHeader>
          <CardTitle className="break-words">Change password</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={passwordForm.handleSubmit((values) => passwordMutation.mutate(values))}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input
                id="currentPassword"
                type="password"
                {...passwordForm.register('currentPassword')}
              />
              {passwordForm.formState.errors.currentPassword && (
                <p className="text-xs text-destructive">
                  {passwordForm.formState.errors.currentPassword.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                {...passwordForm.register('newPassword')}
              />
              {passwordForm.formState.errors.newPassword && (
                <p className="text-xs text-destructive">
                  {passwordForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>
            <Button type="submit" disabled={passwordMutation.isPending}>
              {passwordMutation.isPending ? 'Updating...' : 'Update password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="w-full min-w-0">
        <CardHeader>
          <CardTitle className="break-words">Generator defaults</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
