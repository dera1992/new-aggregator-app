import { apiFetch } from '@/lib/api/client';
import type { PreferencesResponse, PreferencesUpdatePayload } from '@/types/preferences';

export function fetchPreferences() {
  return apiFetch<PreferencesResponse>('/api/user/preferences');
}

export function updatePreferences(payload: PreferencesUpdatePayload) {
  return apiFetch<PreferencesResponse>('/api/user/preferences', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}
