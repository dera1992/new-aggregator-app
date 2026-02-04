'use client';

import { useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { fetchProfile, updateProfile } from '@/lib/api/profile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type ProfileFormValues = {
  full_name: string;
  timezone: string;
  avatar_url: string;
};

export default function ProfilePage() {
  const form = useForm<ProfileFormValues>({
    defaultValues: {
      full_name: '',
      timezone: '',
      avatar_url: '',
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
  });

  useEffect(() => {
    if (data) {
      form.reset({
        full_name: data.full_name ?? '',
        timezone: data.timezone ?? '',
        avatar_url: data.avatar_url ?? '',
      });
    }
  }, [data, form]);

  const mutation = useMutation({
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

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading profile...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" {...form.register('full_name')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input id="timezone" {...form.register('timezone')} placeholder="UTC" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="avatar_url">Avatar URL</Label>
              <Input id="avatar_url" {...form.register('avatar_url')} />
            </div>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : 'Save profile'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {data && (
        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div>Tier: {data.subscription_tier ?? 'N/A'}</div>
            <div>Status: {data.subscription_status ?? 'N/A'}</div>
            <div>Expires: {data.subscription_expires_at ?? 'N/A'}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
