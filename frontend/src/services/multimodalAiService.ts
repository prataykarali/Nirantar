/**
 * NIRANTAR — Multimodal AI Client Service
 * ========================================
 * Implements client-side direct invocation with High-Throughput Rate Limiting (5 req/sec):
 *  1. LLM Reasoning (OpenAI GPT-OSS 120B / NVIDIA Nemotron-3 Super 120B / MiniMax M3)
 *  2. Speech-to-Text (Deepgram Nova-2)
 *  3. Voice Text-to-Speech (Instant streaming audio synthesis & station announcements)
 *  4. Reactive Online/Offline Status listener for UI updates
 */

import { getAiSettings, CANDIDATE_MODELS, ACTIVE_NVIDIA_KEYS } from './aiClientConfig';
import { deterministicNiraReply } from './niraRules';
import { aiRateLimiter, RateLimitStatus } from '../utils/RateLimiter';
import { NiraContextBuilder, GroundedPassengerContext } from './niraContextBuilder';

const SYSTEM_NIRA_PROMPT = `You are Nira, the official Conversational AI Railway Copilot for NIRANTAR (Indian Railways next-gen citizen digital platform).

### CORE CAPABILITIES & WEBSITE FEATURES ON NIRANTAR:
1. **Train Search & Discovery**: Help citizens find, rank, and compare trains between any Indian stations (Delhi, Mumbai, Kolkata, Bengaluru, Chennai, Hyderabad, Pune, Varanasi, Ahmedabad, etc.) by speed, departure time, and fare.
2. **Booking & Quotas Guidance**: Guide users through Step 1 (Search), Step 2 (Passenger details: Name, Age, Gender, Berth preference), and Step 3 (Payment). Explain Tatkal Quota (opens 10:00 AM for AC, 11:00 AM for Non-AC 24h prior), Premium Tatkal, General (GN), Ladies (LD), Senior Citizen quotas, and cancellation/refund rules.
3. **Live GPS Satellite Tracking & Telemetry**: Guide users to track live train numbers (e.g. #12302 Howrah Rajdhani, #12951 Mumbai Rajdhani), real-time speed (km/h), platform numbers, delay minutes, and upcoming halts.
4. **Mid-Journey Vacant Seat Shift Radar**: Guide confirmed and RAC passengers to view station-by-station vacant berths (highlighted in 🟢) and submit on-board seat shift requests to the TTE directly in the "My Journeys" screen.
5. **PNR Status & Confirmation Odds**: Explain GNWL, RLWL, PQWL, RAC rules, Chart 1 (prepared 4h before departure), and Chart 2 (30 min before departure) finalization.
6. **DigiLocker Verified e-Tickets**: Guide users to download official verified PDF e-tickets from the "My Journeys" screen.
7. **Citizen Virtual Wallet & SafeAssist**: Explain 1-click zero-bank-failure payments, instant refunds, and zero-PII profile autofill.

### STRICT DOMAIN BOUNDARIES (DENY UNRELATED QUERIES):
- If the user asks about topics OUTSIDE Indian Railways or Nirantar (such as ice cream, food recipes, international flights, hotels in Paris/London/Dubai, coding Python/JS, crypto, stock markets, academic homework, politics):
  Acknowledge warmly in 1 short sentence, politely explain that you are dedicated strictly to Indian Railways and Nirantar services, and guide them back to Indian train travel, booking, live GPS tracking, Tatkal rules, or vacant seat requests!

### TONE & FORMATTING:
- Professional, friendly, helpful, with clean bullet points and bold key terms.
- Keep responses concise (2 to 4 informative paragraphs).
- NEVER ask for banking passwords, OTPs, or UPI PINs.`;

// Track active audio player to prevent overlapping speech
let currentAudio: HTMLAudioElement | null = null;
let aiOnlineState = true;
let isGloballyMuted = false;
const onlineListeners: Set<(online: boolean) => void> = new Set();

function setOnlineState(online: boolean) {
  if (aiOnlineState !== online) {
    aiOnlineState = online;
    onlineListeners.forEach((fn) => {
      try {
        fn(online);
      } catch {}
    });
  }
}

try {
  const savedMute = localStorage.getItem('nirantar_voice_muted');
  if (savedMute !== null) {
    isGloballyMuted = savedMute === 'true';
  }
} catch {}

// High-Definition Railway Chime Generator (Web Audio API)
function playRailwayChime(): Promise<void> {
  return new Promise((resolve) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        resolve();
        return;
      }
      const ctx = new AudioCtx();
      const notes = [587.33, 880, 659.25]; // D5, A5, E5 classic station chime
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.18);
        gain.gain.setValueAtTime(0.25, ctx.currentTime + index * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.18 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + index * 0.18);
        osc.stop(ctx.currentTime + index * 0.18 + 0.4);
      });
      setTimeout(() => {
        try {
          ctx.close();
        } catch {}
        resolve();
      }, 700);
    } catch {
      resolve();
    }
  });
}

export class MultimodalAiService {
  /**
   * Returns whether AI is actively connected and online.
   */
  public static isOnline(): boolean {
    return aiOnlineState;
  }

  /**
   * Subscribe to online status changes.
   */
  public static subscribeOnlineStatus(callback: (online: boolean) => void): () => void {
    onlineListeners.add(callback);
    callback(aiOnlineState);
    return () => {
      onlineListeners.delete(callback);
    };
  }

  /**
   * Returns global mute state.
   */
  public static isMuted(): boolean {
    return isGloballyMuted;
  }

  /**
   * Sets global mute state and stops any active audio.
   */
  public static setMuted(muted: boolean): void {
    isGloballyMuted = muted;
    try {
      localStorage.setItem('nirantar_voice_muted', String(muted));
    } catch {}
    if (muted) {
      this.stopSpeaking();
    }
  }

  /**
   * Check rate limits (5 requests/second burst ceiling per client).
   */
  public static getRateLimitStatus(): {
    nvidia: RateLimitStatus;
    murf: RateLimitStatus;
    deepgram: RateLimitStatus;
  } {
    return {
      nvidia: aiRateLimiter.peek('nvidia_nim', 5, 1000),
      murf: aiRateLimiter.peek('murf_tts', 5, 1000),
      deepgram: aiRateLimiter.peek('deepgram_stt', 5, 1000),
    };
  }

  /**
   * Generates conversational response using active models from NVIDIA endpoint.
   */
  public static async chatCompletion(
    query: string,
    history: { role: 'user' | 'assistant' | 'system'; content: string }[] = [],
    onToken?: (token: string) => void
  ): Promise<string> {
    const settings = getAiSettings();

    // Check 5 req/sec rate limit per client
    const limit = aiRateLimiter.checkLimit('nvidia_nim', 5, 1000);
    if (!limit.allowed) {
      console.warn('Rate limit reached, using fallback');
      const fallbackText = deterministicNiraReply(query) + `\n\n*(⚡ ${limit.errorMessage})*`;
      if (onToken) {
        for (const w of fallbackText.match(/\S+\s*/g) || [fallbackText]) onToken(w);
      }
      return fallbackText;
    }

    const testKeys = [
      settings.nvidiaApiKey,
      ...ACTIVE_NVIDIA_KEYS,
    ].filter(Boolean);

    const testModels = [
      settings.nvidiaModel,
      ...CANDIDATE_MODELS,
    ].filter(Boolean);

    if (settings.llmProvider === 'deterministic') {
      setOnlineState(true);
      const qLower = query.toLowerCase();
      let reply = '';
      if (qLower.includes('platform') && (qLower.includes('crowd') || qLower.includes('busy') || qLower.includes('high'))) {
        reply = `Platform 5 at New Delhi (NDLS) is currently experiencing **HIGH** passenger movement (1,240 entering/min vs 860 exiting/min). Inflow is higher than outflow, so platform congestion is increasing during boarding.`;
      } else if (qLower.includes('reach') || qLower.includes('how to') || qLower.includes('navigate') || qLower.includes('direction')) {
        reply = `🚶 **HERE Concourse Navigation**: You are approx **5 mins** (420m) from Platform 5. Enter via **Pahar Ganj Entrance (Gate 1)** and take the Central Foot Overbridge. Escalator is available at Pillar #8.`;
      } else if (qLower.includes('what should i do') || qLower.includes('boarding') || qLower.includes('10 minutes')) {
        reply = `Your train **#12951 (Mumbai Rajdhani Express)** is currently **boarding on Platform 5**. Your walking time via HERE Navigation is about **5 minutes**. Head directly to Platform 5 via the North Foot Overbridge to avoid central concourse congestion.`;
      } else {
        reply = deterministicNiraReply(query);
      }

      if (onToken) {
        for (const w of reply.match(/\S+\s*/g) || [reply]) onToken(w);
      }
      return reply;
    }
    const groundedCtx = NiraContextBuilder.buildGroundedContext({
      stationCode: 'NDLS',
      platformNumber: 5,
      trainNumber: '12951',
      trainName: 'Mumbai Rajdhani Express',
      userLocation: 'Main Concourse',
      waitlistChance: 94,
    });
    const promptPayload = NiraContextBuilder.buildPromptWithContext(query, groundedCtx);

    const messages = [
      { role: 'system', content: promptPayload.systemPrompt },
      ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: query },
    ];

    for (const key of testKeys) {
      for (const modelName of testModels) {
        try {
          const response = await fetch(`${settings.nvidiaApiBase}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${key}`,
            },
            body: JSON.stringify({
              model: modelName,
              messages,
              temperature: 0.25,
              max_tokens: 450,
              stream: !!onToken,
            }),
          });

          if (response.ok) {
            setOnlineState(true);
            if (onToken && response.body) {
              const reader = response.body.getReader();
              const decoder = new TextDecoder('utf-8');
              let fullText = '';

              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');
                for (const line of lines) {
                  const trimmed = line.trim();
                  if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
                    try {
                      const json = JSON.parse(trimmed.slice(6));
                      const content =
                        json.choices?.[0]?.delta?.content ||
                        json.choices?.[0]?.delta?.reasoning_content ||
                        '';
                      if (content) {
                        fullText += content;
                        onToken(content);
                      }
                    } catch {
                      // Ignore partial SSE chunk errors
                    }
                  }
                }
              }
              if (fullText.trim()) return fullText.trim();
            } else {
              const data = await response.json();
              const content = data.choices?.[0]?.message?.content || '';
              if (content.trim()) return content.trim();
            }
          }
        } catch (err) {
          console.warn(`Call failed for model ${modelName} with key:`, err);
        }
      }
    }

    setOnlineState(false);

    // Intelligent Fallback for Unrelated Queries
    const qLower = query.toLowerCase();
    if (
      qLower.includes('ice cream') ||
      qLower.includes('food') ||
      qLower.includes('recipe') ||
      qLower.includes('movie') ||
      qLower.includes('music') ||
      qLower.includes('song') ||
      qLower.includes('code') ||
      qLower.includes('python') ||
      qLower.includes('crypto') ||
      qLower.includes('hotel') ||
      qLower.includes('flight')
    ) {
      const resp = `That sounds interesting! However, I am **Nira**, dedicated strictly to Indian Railways travel and Nirantar services.\n\nI can help you:\n• Search and book express trains (e.g. *'Delhi to Mumbai tomorrow'*)\n• Check **Tatkal Quota** rules and opening times\n• Track live satellite GPS running status and platform halts (e.g. *'Track 12951'*)\n• View and request **Mid-Journey Vacant Seat shifts**\n• Download your DigiLocker-verified e-Ticket\n\nWhere in India would you like to travel today?`;
      if (onToken) {
        for (const w of resp.match(/\S+\s*/g) || [resp]) onToken(w);
      }
      return resp;
    }

    // Fallback to deterministic Nira knowledge base
    const fallbackText = deterministicNiraReply(query);
    if (onToken) {
      const words = fallbackText.match(/\S+\s*/g) || [fallbackText];
      for (const w of words) onToken(w);
    }
    return fallbackText;
  }

  /**
   * Flagship Grounded Decision Assistance:
   * Fuses ML waitlist odds, Live Platform Telemetry, and HERE Concourse Routing
   * into structured JSON and passes it to NVIDIA LLM for grounded passenger reasoning.
   */
  public static async generateGroundedAssistance(
    query: string,
    params: {
      stationCode?: string;
      platformNumber?: number;
      trainNumber?: string;
      trainName?: string;
      userLocation?: string;
      userJourney?: GroundedPassengerContext['userJourney'];
      waitlistChance?: number;
    } = {},
    onToken?: (token: string) => void
  ): Promise<{ responseText: string; context: GroundedPassengerContext }> {
    const context = NiraContextBuilder.buildGroundedContext(params);
    const { systemPrompt } = NiraContextBuilder.buildPromptWithContext(query, context);

    const settings = getAiSettings();
    const testKeys = [settings.nvidiaApiKey, ...ACTIVE_NVIDIA_KEYS].filter(Boolean);
    const testModels = [settings.nvidiaModel, ...CANDIDATE_MODELS].filter(Boolean);

    for (const key of testKeys) {
      for (const modelName of testModels) {
        try {
          const response = await fetch(`${settings.nvidiaApiBase}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${key}`,
            },
            body: JSON.stringify({
              model: modelName,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: query },
              ],
              temperature: 0.2,
              max_tokens: 380,
              stream: !!onToken,
            }),
          });

          if (response.ok) {
            setOnlineState(true);
            if (onToken && response.body) {
              const reader = response.body.getReader();
              const decoder = new TextDecoder('utf-8');
              let fullText = '';

              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');
                for (const line of lines) {
                  const trimmed = line.trim();
                  if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
                    try {
                      const json = JSON.parse(trimmed.slice(6));
                      const content =
                        json.choices?.[0]?.delta?.content ||
                        json.choices?.[0]?.delta?.reasoning_content ||
                        '';
                      if (content) {
                        fullText += content;
                        onToken(content);
                      }
                    } catch {}
                  }
                }
              }
              if (fullText.trim()) return { responseText: fullText.trim(), context };
            } else {
              const data = await response.json();
              const content = data.choices?.[0]?.message?.content || '';
              if (content.trim()) return { responseText: content.trim(), context };
            }
          }
        } catch (err) {
          console.warn('Grounded LLM attempt failed:', err);
        }
      }
    }

    // Factual deterministic fallback if offline
    let fallbackText = '';
    const qLower = query.toLowerCase();
    if (qLower.includes('platform') && (qLower.includes('crowd') || qLower.includes('busy') || qLower.includes('high'))) {
      fallbackText = `Platform ${context.platform} at ${context.station} is currently experiencing **${context.crowdLevel.toUpperCase()}** passenger movement (${context.passengerInflow} entering/min vs ${context.passengerOutflow} exiting/min). Inflow is higher than outflow, so platform congestion is increasing during boarding.`;
    } else if (qLower.includes('reach') || qLower.includes('how to') || qLower.includes('navigate') || qLower.includes('direction')) {
      fallbackText = `🚶 **HERE Concourse Navigation**: You are approx **${context.hereNavigation.walkingEtaMinutes} mins** (${context.hereNavigation.distanceMeters}m) from Platform ${context.platform}. Enter via **${context.hereNavigation.recommendedGate}** and take the Central Foot Overbridge. Escalator is available at Pillar #8.`;
    } else if (qLower.includes('what should i do') || qLower.includes('boarding') || qLower.includes('10 minutes')) {
      fallbackText = `Your train **#${context.activeTrainNumber} (${context.activeTrainName})** is currently **boarding on Platform ${context.platform}**. Your walking time via HERE Navigation is about **${context.hereNavigation.walkingEtaMinutes} minutes**. Head directly to Platform ${context.platform} via the North Foot Overbridge to avoid central concourse congestion.`;
    } else {
      fallbackText = `Train **#${context.activeTrainNumber}** is on **Platform ${context.platform}** (${context.trainStatus.toUpperCase()}). Crowd density is **${context.crowdLevel}**, and walking time from concourse is approx **${context.hereNavigation.walkingEtaMinutes} mins** (${context.hereNavigation.distanceMeters}m).`;
    }

    if (onToken) {
      for (const w of fallbackText.match(/\S+\s*/g) || [fallbackText]) onToken(w);
    }
    return { responseText: fallbackText, context };
  }

  /**
   * Dynamic 3-Tier Guide Explanation (Learn -> Understand -> Act):
   * Generates AI-assisted plain-language interpretations for underlined terms.
   */
  public static async explainTermWithAi(
    term: string,
    tier: 'learn' | 'understand' | 'act',
    context?: any
  ): Promise<string> {
    const prompt = `You are Nira, the official explanation layer of NIRANTAR.
Explain the railway concept "${term}" for Tier: ${tier.toUpperCase()}.

Tier Definitions:
- LEARN: Explain what "${term}" means in simple plain English (1-2 sentences).
- UNDERSTAND: Explain why this metric or status occurs in real railway operations (2 sentences).
- ACT: Provide concrete, direct guidance on what the passenger should do right now (2 bullet points).

Keep the answer strictly under 3 sentences, friendly, and accurate.`;

    try {
      const resp = await this.chatCompletion(prompt);
      return resp;
    } catch {
      return deterministicNiraReply(term);
    }
  }

  /**
   * Transcribes recorded audio using Deepgram Nova-2 STT API with 5 req/sec burst limit.
   */
  public static async transcribeAudio(
    audioBlob: Blob,
    language = 'en'
  ): Promise<{ transcript: string; source: 'deepgram' | 'webspeech'; error?: string }> {
    const settings = getAiSettings();
    const apiKey = settings.deepgramApiKey || 'd4ce071a8da028082bacade9f4708be3dfa7287f';

    if (apiKey) {
      const limit = aiRateLimiter.checkLimit('deepgram_stt', 5, 1000);
      if (!limit.allowed) {
        console.warn('Deepgram rate limit reached');
        return { transcript: '', source: 'webspeech', error: limit.errorMessage };
      }

      try {
        const langCode = language === 'hi' ? 'hi' : language === 'ta' ? 'ta' : language === 'bn' ? 'bn' : 'en-IN';
        const url = `https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&language=${langCode}`;

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Token ${apiKey}`,
            'Content-Type': audioBlob.type || 'audio/webm',
          },
          body: audioBlob,
        });

        if (res.ok) {
          const data = await res.json();
          const transcript = data?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
          if (transcript.trim()) {
            return { transcript: transcript.trim(), source: 'deepgram' };
          }
        }
      } catch (err) {
        console.warn('Deepgram STT failed:', err);
      }
    }

    return { transcript: '', source: 'webspeech' };
  }

  /**
   * Ultra-Fast Streaming Speech Synthesis (<200ms start time).
   */
  public static async speakText(
    text: string,
    onStart?: () => void,
    onEnd?: () => void,
    withChime = false
  ): Promise<void> {
    if (isGloballyMuted) {
      if (onEnd) onEnd();
      return;
    }

    this.stopSpeaking();

    const cleanText = text
      .replace(/[*_#~`]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[\u{1F600}-\u{1F6FF}|\u{2600}-\u{26FF}|\u{2700}-\u{27BF}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 320);

    if (!cleanText) {
      if (onEnd) onEnd();
      return;
    }

    if (withChime) {
      await playRailwayChime();
      if (isGloballyMuted) return;
    }

    const settings = getAiSettings();
    const apiKey = settings.murfApiKey || 'ap2_e02822c1-60a7-4cb2-95cb-f7f60445cf92';

    let murfPlayed = false;

    if (apiKey && !isGloballyMuted) {
      const limit = aiRateLimiter.checkLimit('murf_tts', 5, 1000);
      if (limit.allowed) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1200);

          const res = await fetch('https://api.murf.ai/v1/speech/generate', {
            method: 'POST',
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
              'api-key': apiKey,
              token: apiKey,
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              text: cleanText,
              voiceId: settings.murfVoiceId || 'en-IN-aarav',
              style: 'Conversational',
              format: 'MP3',
              sampleRate: 44100,
            }),
          });
          clearTimeout(timeoutId);

          if (res.ok) {
            const data = await res.json();
            const audioUrl =
              data.audioFile ||
              data.audio_url ||
              (data.encodedAudio ? `data:audio/mp3;base64,${data.encodedAudio}` : null);

            if (audioUrl && !isGloballyMuted) {
              const audio = new Audio(audioUrl);
              audio.volume = 1.0;
              currentAudio = audio;
              if (onStart) onStart();
              audio.onended = () => {
                currentAudio = null;
                if (onEnd) onEnd();
              };
              audio.onerror = () => {
                currentAudio = null;
                if (onEnd) onEnd();
              };
              await audio.play();
              murfPlayed = true;
              return;
            }
          }
        } catch {}
      }
    }

    if (!murfPlayed && !isGloballyMuted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'en-IN';
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const inVoice = voices.find(
        (v) => v.lang === 'en-IN' || v.name.includes('India') || v.name.includes('Indian')
      );
      if (inVoice) utterance.voice = inVoice;

      if (onStart) utterance.onstart = onStart;
      utterance.onend = () => {
        if (onEnd) onEnd();
      };
      utterance.onerror = () => {
        if (onEnd) onEnd();
      };
      window.speechSynthesis.speak(utterance);
    }
  }

  /**
   * Plays a live Indian Railway Station Announcement with chime intro.
   */
  public static async playStationAnnouncement(params: {
    trainNumber: string;
    trainName: string;
    from: string;
    to: string;
    platform?: string;
    statusText?: string;
    onStart?: () => void;
    onEnd?: () => void;
  }): Promise<void> {
    if (isGloballyMuted) {
      if (params.onEnd) params.onEnd();
      return;
    }
    const plat = params.platform || '1';
    const spacedTrainNo = params.trainNumber.split('').join(' ');

    const announcementText = `May I have your attention please. Train number ${spacedTrainNo}, ${params.trainName}, from ${params.from} to ${params.to}, is scheduled on platform number ${plat}. ${params.statusText || 'Passengers are requested to board the train safely.'}`;

    await this.speakText(announcementText, params.onStart, params.onEnd, true);
  }

  /**
   * Stop any active audio playback instantly.
   */
  public static stopSpeaking(): void {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}
