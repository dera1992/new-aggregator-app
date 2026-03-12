'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Camera, Loader2, ExternalLink, Zap } from 'lucide-react';

import { changePassword } from '@/lib/api/auth';
import { fetchProfile, updateProfile, uploadAvatar } from '@/lib/api/profile';
import { createCheckoutSession, createPortalSession } from '@/lib/api/billing';
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
};

export default function SettingsPage() {
  const { resolvedTheme, resetTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '' },
  });

  const profileForm = useForm<ProfileFormValues>({
    defaultValues: { full_name: '', timezone: '' },
  });

  const [defaults, setDefaults] = useState<GeneratorDefaults>(loadGeneratorDefaults());
  const [isBillingLoading, setIsBillingLoading] = useState(false);

  useEffect(() => {
    setDefaults(loadGeneratorDefaults());
  }, []);

  const { data: profile, isLoading: isProfileLoading, refetch: refetchProfile } = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
  });

  useEffect(() => {
    if (profile) {
      profileForm.reset({
        full_name: profile.full_name ?? '',
        timezone: profile.timezone ?? '',
      });
      if (profile.avatar_url) {
        setAvatarPreview(profile.avatar_url);
      }
    }
  }, [profile, profileForm]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);

    setIsUploadingAvatar(true);
    try {
      await uploadAvatar(file);
      toast.success('Avatar updated');
      refetchProfile();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
      setAvatarPreview(profile?.avatar_url ?? null);
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

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
      }),
    onSuccess: () => toast.success('Profile updated'),
    onError: (error: Error) => toast.error(error.message),
  });

  const handleUpgrade = async (plan: 'pro' | 'business') => {
    setIsBillingLoading(true);
    try {
      const { url } = await createCheckoutSession(plan);
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start checkout');
      setIsBillingLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setIsBillingLoading(true);
    try {
      const { url } = await createPortalSession();
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to open billing portal');
      setIsBillingLoading(false);
    }
  };

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
              {/* Avatar upload */}
              <div className="space-y-2">
                <Label>Avatar</Label>
                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-20 shrink-0">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar"
                        className="h-20 w-20 rounded-full object-cover border border-border"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted border border-border text-muted-foreground text-2xl font-semibold">
                        {profile?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                      </div>
                    )}
                    {isUploadingAvatar && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      {isUploadingAvatar ? 'Uploading...' : 'Change photo'}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG, WebP or GIF · max 2 MB
                    </p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name">Full name</Label>
                <Input id="full_name" {...profileForm.register('full_name')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input id="timezone" {...profileForm.register('timezone')} placeholder="UTC" />
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
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="space-y-1 text-sm">
                <div className="text-muted-foreground">
                  Plan:{' '}
                  <span className="font-medium capitalize text-foreground">
                    {profile.subscription_tier ?? 'free'}
                  </span>
                </div>
                <div className="text-muted-foreground">
                  Status:{' '}
                  <span
                    className={
                      profile.subscription_status === 'active'
                        ? 'font-medium text-green-600 dark:text-green-400'
                        : profile.subscription_status === 'past_due'
                          ? 'font-medium text-yellow-600 dark:text-yellow-400'
                          : 'font-medium text-muted-foreground'
                    }
                  >
                    {profile.subscription_status ?? 'inactive'}
                  </span>
                </div>
                {profile.subscription_expires_at && (
                  <div className="text-muted-foreground">
                    Renews:{' '}
                    <span className="text-foreground">
                      {new Date(profile.subscription_expires_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {profile.subscription_status === 'active' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleManageBilling}
                disabled={isBillingLoading}
              >
                {isBillingLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="mr-2 h-4 w-4" />
                )}
                Manage subscription
              </Button>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  size="sm"
                  className="bg-[#4A90E2] text-white hover:bg-[#357abd]"
                  onClick={() => handleUpgrade('pro')}
                  disabled={isBillingLoading}
                >
                  {isBillingLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="mr-2 h-4 w-4" />
                  )}
                  Upgrade to Pro — $29/mo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUpgrade('business')}
                  disabled={isBillingLoading}
                >
                  {isBillingLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="mr-2 h-4 w-4" />
                  )}
                  Upgrade to Business — $99/mo
                </Button>
              </div>
            )}
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
              <Select
                value={defaults.brandVoice}
                onValueChange={(value) =>
                  setDefaults((prev) => ({ ...prev, brandVoice: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Brand voice" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clear and confident">Clear and confident</SelectItem>
                  <SelectItem value="bold and direct">Bold and direct</SelectItem>
                  <SelectItem value="professional and credible">Professional and credible</SelectItem>
                  <SelectItem value="friendly and conversational">Friendly and conversational</SelectItem>
                  <SelectItem value="witty and playful">Witty and playful</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Default audience</Label>
              <Select
                value={defaults.audience}
                onValueChange={(value) =>
                  setDefaults((prev) => ({ ...prev, audience: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General audience">General audience</SelectItem>
                  <SelectItem value="Founders">Founders</SelectItem>
                  <SelectItem value="Marketers">Marketers</SelectItem>
                  <SelectItem value="Developers">Developers</SelectItem>
                  <SelectItem value="Executives">Executives</SelectItem>
                  <SelectItem value="Investors">Investors</SelectItem>
                </SelectContent>
              </Select>
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
              <Select
                value={defaults.commentAudience}
                onValueChange={(value) =>
                  setDefaults((prev) => ({ ...prev, commentAudience: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Comment audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General audience">General audience</SelectItem>
                  <SelectItem value="Founders">Founders</SelectItem>
                  <SelectItem value="Creators">Creators</SelectItem>
                  <SelectItem value="Developers">Developers</SelectItem>
                  <SelectItem value="Investors">Investors</SelectItem>
                  <SelectItem value="Customers">Customers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleDefaultsSave}>Save defaults</Button>
        </CardContent>
      </Card>
    </div>
  );
}
