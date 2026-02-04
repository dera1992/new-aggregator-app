import { apiFetch } from '@/lib/api/client';

export type ProfileResponse = {
  email: string;
  full_name: string | null;
  timezone: string | null;
  avatar_url: string | null;
  subscription_tier: string | null;
  subscription_status: string | null;
  subscription_expires_at: string | null;
};

export type ProfileUpdatePayload = {
  full_name?: string;
  timezone?: string;
  avatar_url?: string;
};

export function fetchProfile() {
  return apiFetch<ProfileResponse>('/api/profile');
}

export function updateProfile(payload: ProfileUpdatePayload) {
  return apiFetch<ProfileResponse>('/api/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}
