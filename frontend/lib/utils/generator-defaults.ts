export type GeneratorDefaults = {
  tone: string;
  goal: string;
  brandVoice: string;
  audience: string;
  commentStyle: string;
  commentAudience: string;
};

const STORAGE_KEY = 'generator_defaults';

const fallbackDefaults: GeneratorDefaults = {
  tone: 'friendly',
  goal: 'engagement',
  brandVoice: '',
  audience: '',
  commentStyle: 'curious',
  commentAudience: '',
};

export function loadGeneratorDefaults(): GeneratorDefaults {
  if (typeof window === 'undefined') {
    return fallbackDefaults;
  }
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return fallbackDefaults;
  }
  try {
    return { ...fallbackDefaults, ...(JSON.parse(stored) as GeneratorDefaults) };
  } catch {
    return fallbackDefaults;
  }
}

export function saveGeneratorDefaults(defaults: GeneratorDefaults) {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
}

export { STORAGE_KEY as GENERATOR_DEFAULTS_KEY };
