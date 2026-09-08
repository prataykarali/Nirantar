/**
 * NIRANTAR — Multimodal AI Client Configuration
 * ===============================================
 * Manages client-side settings for LLM reasoning, Voice TTS, and Speech STT.
 * Auto-resolves active models from NVIDIA endpoint and supports local overrides.
 */

export interface AiSettings {
  llmProvider: 'nvidia' | 'deterministic';
  nvidiaApiKey: string;
  nvidiaModel: string;
  nvidiaApiBase: string;
  sttProvider: 'deepgram' | 'webspeech';
  deepgramApiKey: string;
  ttsProvider: 'murf' | 'webspeech' | 'muted';
  murfApiKey: string;
  murfVoiceId: string;
  language: string;
}

const STORAGE_KEY = 'nirantar_ai_multimodal_settings';

export const ACTIVE_NVIDIA_KEYS = [
  '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',
];

export const CANDIDATE_MODELS = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'minimaxai/minimax-m3',
  'nvidia/nemotron-3-super-120b-a12b',
];

export function getAiSettings(): AiSettings {
  const env = (import.meta as any).env || {};

  const defaults: AiSettings = {
    llmProvider: 'deterministic',
    nvidiaApiKey: env.VITE_NVIDIA_API_KEY || ACTIVE_NVIDIA_KEYS[0],
    nvidiaModel: env.VITE_NVIDIA_MODEL || 'openai/gpt-oss-120b',
    nvidiaApiBase: env.VITE_NVIDIA_API_BASE || 'https://integrate.api.nvidia.com/v1',
    sttProvider: 'deepgram',
    deepgramApiKey: env.VITE_DEEPGRAM_API_KEY || 'd4ce071a8da028082bacade9f4708be3dfa7287f',
    ttsProvider: 'murf',
    murfApiKey: env.VITE_MURF_API_KEY || 'ap2_e02822c1-60a7-4cb2-95cb-f7f60445cf92',
    murfVoiceId: 'en-IN-aarav',
    language: 'en',
  };

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Clean obsolete sunset models or invalid 403 keys from localStorage
      const isSunset =
        parsed.nvidiaModel?.includes('llama-3.1-70b') ||
        parsed.nvidiaModel?.includes('llama-3.1-8b') ||
        parsed.nvidiaModel?.includes('llama-3.2-11b') ||
        !parsed.nvidiaModel;

      const isInvalidKey =
        !parsed.nvidiaApiKey ||
        parsed.nvidiaApiKey.includes('3r7Z7HTxP') ||
        !parsed.nvidiaApiKey.startsWith('nvapi-');

      const model = isSunset ? defaults.nvidiaModel : parsed.nvidiaModel;
      const apiKey = isInvalidKey ? defaults.nvidiaApiKey : parsed.nvidiaApiKey;

      return {
        ...defaults,
        ...parsed,
        nvidiaModel: model,
        nvidiaApiKey: apiKey,
        deepgramApiKey: parsed.deepgramApiKey || defaults.deepgramApiKey,
        murfApiKey: parsed.murfApiKey || defaults.murfApiKey,
      };
    }
  } catch (err) {
    console.warn('Failed to load AI settings from localStorage', err);
  }

  return defaults;
}

export function saveAiSettings(settings: Partial<AiSettings>): AiSettings {
  const current = getAiSettings();
  const updated = { ...current, ...settings };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to save AI settings to localStorage', err);
  }
  return updated;
}
