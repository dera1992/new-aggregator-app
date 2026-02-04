import { apiClient } from './client';
import type { PreferencesResponse, Preferences } from '@/types/user';

export async function fetchPreferences() {
  const { data } = await apiClient.get<PreferencesResponse>('/api/user/preferences');
  return data;
}

export async function updatePreferences(payload: Preferences) {
  const { data } = await apiClient.put<PreferencesResponse>('/api/user/preferences', payload);
  return data;
}
