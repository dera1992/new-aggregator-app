export type Preferences = {
  preferred_categories: string[];
  preferred_sources: string[];
  digest_time: string;
  digest_enabled: boolean;
};

export type PreferencesResponse = Preferences;

export type AuthResponse = {
  token: string;
  message?: string;
};

export type MessageResponse = {
  message: string;
};

export type ErrorResponse = {
  message?: string;
  errors?: Record<string, string[]>;
};
