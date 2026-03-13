import { apiClient } from './client';

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
};

export async function fetchProfile() {
  const { data } = await apiClient.get<ProfileResponse>('/api/profile');
  return data;
}

export async function updateProfile(payload: ProfileUpdatePayload) {
  const { data } = await apiClient.put<ProfileResponse>('/api/profile', payload);
  return data;
}
