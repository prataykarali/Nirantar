/**
 * NIRANTAR Voice Service (Cute AI Companion Voice + Web Speech Synthesis)
 * =======================================================================
 * High-quality Indian English speech synthesis and voice recognition for Nira AI.
 * Equipped with friendly, cute robotic assistant timbre (pitch: 1.3, rate: 1.08).
 */

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

  // 2. High-fidelity Web Speech API with cute, friendly assistant timbre
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-IN';
    utterance.rate = 1.08;
    utterance.pitch = 1.32; // Cute, friendly, bright robotic assistant pitch

    // Pick best available friendly English/Indian voice
    const voices = window.speechSynthesis.getVoices();
    const friendlyVoice = voices.find(
      (v) =>
        v.name.includes('Google UK English Female') ||
        v.name.includes('Google US English') ||
        v.name.includes('Samantha') ||
        v.name.includes('Victoria') ||
        v.name.includes('Priya') ||
        v.lang === 'en-IN' ||
        v.name.includes('India')
    ) || voices[0];

    if (friendlyVoice) {
      utterance.voice = friendlyVoice;
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
