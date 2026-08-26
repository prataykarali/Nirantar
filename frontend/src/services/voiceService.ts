/**
 * NIRANTAR Voice Service — DISABLED (No-op Stubs)
 * All TTS and voice functionality has been removed for clean deployment.
 */

export interface SpeechOptions {
  rate?: number;
  pitch?: number;
  lang?: string;
  isAnnouncement?: boolean;
}

export const setNiraMuted = (_muted: boolean): void => {};
export const getIsNiraMuted = (): boolean => true;
export const speakNiraResponse = (_text: string, _options?: SpeechOptions): void => {};
export const stopNiraSpeech = (): void => {};
export const speakStationAnnouncement = (_text: string): void => {};
