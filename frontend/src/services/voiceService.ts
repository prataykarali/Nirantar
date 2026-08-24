/**
 * NIRANTAR Voice Service (Murf TTS & Deepgram STT with Browser Fallback)
 * ====================================================================
 * High-quality Indian English speech synthesis and voice recognition for Nira AI.
 */

// API keys are handled server-side only — no secrets in the browser bundle.

let currentAudio: HTMLAudioElement | null = null;

export const speakNiraResponse = async (text: string): Promise<void> => {
  if (!text || text.trim() === '') return;

  // Stop any currently playing speech
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }

  // Clean text for speech (remove markdown symbols, emojis, bullets)
  const cleanText = text
    .replace(/[*_#~`]/g, '')
    .replace(/[\u{1F600}-\u{1F6FF}|[\u{2600}-\u{26FF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

  // 1. Try Backend Voice API (Murf TTS)
  try {
    const res = await fetch('/api/v1/voice/speak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: cleanText, voice_id: 'en-IN-aarav', language: 'en' }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.audio_url) {
        currentAudio = new Audio(data.audio_url);
        await currentAudio.play();
        return;
      }
    }
  } catch {
    // Continue to browser fallback
  }

  // 2. High-fidelity Web Speech API Fallback
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-IN';
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    // Pick best available English/Indian voice
    const voices = window.speechSynthesis.getVoices();
    const indianVoice = voices.find(
      (v) => v.lang === 'en-IN' || v.name.includes('India') || v.name.includes('Indian') || v.name.includes('Natural')
    );
    if (indianVoice) {
      utterance.voice = indianVoice;
    }

    window.speechSynthesis.speak(utterance);
  }
};

export const stopNiraSpeech = (): void => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};
