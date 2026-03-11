import { apiFetch, ApiError } from '@/lib/api/client';
import { getToken } from '@/lib/auth/token';

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

export async function uploadAvatar(file: File): Promise<{ avatar_url: string }> {
  const token = getToken();
  const formData = new FormData();
  formData.append('avatar', file);
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL ?? ''}/api/profile/avatar`,
    {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    },
  );
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new ApiError(
      (data as { message?: string }).message ?? response.statusText,
      response.status,
    );
  }
  return response.json();
}
