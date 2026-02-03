export type PreferencesResponse = {
  preferred_categories: string[];
  preferred_sources: string[];
  digest_time: string | null;
  digest_enabled: boolean | null;
};

export type PreferencesUpdatePayload = PreferencesResponse;
