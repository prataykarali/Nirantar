/**
 * NIRANTAR Voice Service (Cute AI Companion Voice + Authentic Station Announcements)
 * ===================================================================================
 * High-quality English / Indian English speech synthesis and voice recognition for Nira AI.
 * Equipped with friendly, cute robotic assistant timbre (pitch: 1.3, rate: 1.08)
 * and authentic clear Railway Platform Announcer voice.
 */

let currentAudio: HTMLAudioElement | null = null;
let isGlobalMuted = false;

export interface SpeechOptions {
  rate?: number;
  pitch?: number;
  lang?: string;
  isAnnouncement?: boolean;
}

// Preload and cache available voices
let cachedVoices: SpeechSynthesisVoice[] = [];
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const updateVoices = () => {
    try {
      cachedVoices = window.speechSynthesis.getVoices();
    } catch {
      // Ignore
    }
  };
  updateVoices();
  window.speechSynthesis.onvoiceschanged = updateVoices;
}

export const setNiraMuted = (muted: boolean): void => {
  isGlobalMuted = muted;
  if (muted) {
    stopNiraSpeech();
  }
};

export const getIsNiraMuted = (): boolean => isGlobalMuted;

export const speakNiraResponse = async (
  text: string,
  options?: SpeechOptions
): Promise<void> => {
  if (isGlobalMuted) return;
  if (!text || text.trim() === '') return;

  // Stop any currently playing audio/speech
  stopNiraSpeech();

  // Clean text for speech (remove markdown symbols, brackets, URLs, emojis, bullets)
  const cleanText = text
    .replace(/[*_#~`]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[\u{1F600}-\u{1F6FF}|\u{2600}-\u{26FF}|\u{2700}-\u{27BF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanText) return;

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      // Small timeout ensures Chromium's speech engine finishes cancelling prior utterance
      setTimeout(() => {
        try {
          window.speechSynthesis.resume();

          const utterance = new SpeechSynthesisUtterance(cleanText);
          utterance.lang = options?.lang || 'en-IN';

          if (options?.isAnnouncement) {
            // Station Announcement: clear, professional, authoritative platform timbre
            utterance.rate = options?.rate || 0.92;
            utterance.pitch = options?.pitch || 1.0;
          } else {
            // Cute Nira Companion: friendly, bright, cheerful robotic assistant timbre
            utterance.rate = options?.rate || 1.05;
            utterance.pitch = options?.pitch || 1.25;
          }

          // Resolve best available voice
          if (cachedVoices.length === 0) {
            cachedVoices = window.speechSynthesis.getVoices();
          }

          let selectedVoice: SpeechSynthesisVoice | undefined;
          if (options?.isAnnouncement) {
            // Find best clear English / Indian announcer voice
            selectedVoice = cachedVoices.find(
              (v) =>
                v.lang === 'en-IN' ||
                v.name.toLowerCase().includes('india') ||
                v.name.toLowerCase().includes('priya') ||
                v.name.toLowerCase().includes('rishi') ||
                v.name.toLowerCase().includes('veena') ||
                v.name.toLowerCase().includes('google uk english female') ||
                v.name.toLowerCase().includes('george') ||
                v.name.toLowerCase().includes('karen')
            ) || cachedVoices[0];
          } else {
            // Cute, friendly female/assistant companion voice
            selectedVoice = cachedVoices.find(
              (v) =>
                v.name.toLowerCase().includes('google uk english female') ||
                v.name.toLowerCase().includes('google us english') ||
                v.name.toLowerCase().includes('samantha') ||
                v.name.toLowerCase().includes('victoria') ||
                v.name.toLowerCase().includes('priya') ||
                v.name.toLowerCase().includes('zira') ||
                v.lang === 'en-IN' ||
                v.name.toLowerCase().includes('india')
            ) || cachedVoices[0];
          }

          if (selectedVoice) {
            utterance.voice = selectedVoice;
          }

          // Keep active references in array to prevent Chromium GC from garbage-collecting during playback
          if (!(window as any).__niraUtterances) {
            (window as any).__niraUtterances = [];
          }
          (window as any).__niraUtterances.push(utterance);

          utterance.onend = () => {
            if ((window as any).__niraUtterances) {
              (window as any).__niraUtterances = (window as any).__niraUtterances.filter(
                (u: any) => u !== utterance
              );
            }
          };
          utterance.onerror = (err) => {
            console.warn('Utterance playback error:', err);
            if ((window as any).__niraUtterances) {
              (window as any).__niraUtterances = (window as any).__niraUtterances.filter(
                (u: any) => u !== utterance
              );
            }
          };

          window.speechSynthesis.speak(utterance);
        } catch (innerErr) {
          console.warn('SpeechSynthesis speak execution error:', innerErr);
        }
      }, 50);

      return;
    } catch (e) {
      console.warn('Web Speech Synthesis error:', e);
    }
  }

  // Fallback to backend murf voice if Web Speech fails
  try {
    const res = await fetch('/api/v1/voice/speak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: cleanText,
        voice_id: options?.isAnnouncement ? 'en-IN-neerja' : 'en-IN-aarav',
        language: 'en',
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.audio_url) {
        currentAudio = new Audio(data.audio_url);
        await currentAudio.play();
      }
    }
  } catch {
    // Graceful silent fallback
  }
};

export const stopNiraSpeech = (): void => {
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch {
      // Ignore
    }
    currentAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore
    }
  }
  if (typeof window !== 'undefined') {
    (window as any).__niraUtterance = null;
  }
};
