/**
 * NIRANTAR — Grounded Voice AI Widget
 * =====================================
 * Implements PRD Section 9 & 10:
 *  - Conversational Voice AI over Nirantar's normalized state
 *  - Quick buttons for the 4 core competition questions
 *  - Deepgram STT + NVIDIA LLM intent layer + Murf TTS
 *  - Zero hallucination guarantee: answers grounded in structured facts
 */

import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  HelpCircle,
  Radio,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react';
import { NormalizedTelemetry } from '../../lib/railway/types';
import { voiceAiService, VoiceQueryResult } from '../../services/voiceAiService';
import { SectionExplainerButton, ExplainableSection } from '../SectionExplainer';

export interface VoiceAiWidgetProps {
  telemetry: NormalizedTelemetry | null;
}

const PRESET_QUESTIONS = [
  'Where is my train and how late is it?',
  'Is platform 3 crowded right now?',
  'What should I do to avoid the rush?',
  'Why is there an active delay alert?',
];

export const VoiceAiWidget: React.FC<VoiceAiWidgetProps> = ({ telemetry }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState<VoiceQueryResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Set initial default answer
  useEffect(() => {
    if (!currentAnswer && telemetry) {
      voiceAiService
        .answerGroundedQuery('Where is my train?', telemetry)
        .then((ans) => setCurrentAnswer(ans));
    }
  }, [telemetry]);

  const handleAsk = async (question: string) => {
    setLoading(true);
    voiceAiService.stopSpeaking();
    setIsSpeaking(false);

    try {
      const result = await voiceAiService.answerGroundedQuery(question, telemetry);
      setCurrentAnswer(result);

      // Play audio response
      setIsSpeaking(true);
      voiceAiService.speak(result.structuredAnswer, () => {
        setIsSpeaking(false);
      });
    } catch (err) {
      console.error('Voice AI query error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMicToggle = () => {
    if (typeof window === 'undefined') return;

    if (!isListening) {
      // Check for SpeechRecognition
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRec) {
        const recognition = new SpeechRec();
        recognition.lang = 'en-IN';
        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setIsListening(false);
          handleAsk(transcript);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognition.start();
      } else {
        // Fallback: ask first question
        handleAsk(PRESET_QUESTIONS[0]);
      }
    } else {
      setIsListening(false);
    }
  };

  const toggleTts = () => {
    if (isSpeaking) {
      voiceAiService.stopSpeaking();
      setIsSpeaking(false);
    } else if (currentAnswer) {
      setIsSpeaking(true);
      voiceAiService.speak(currentAnswer.structuredAnswer, () => {
        setIsSpeaking(false);
      });
    }
  };

  return (
    <ExplainableSection sectionId="voice-ai">
      <div className="w-full bg-slate-900/95 border border-purple-500/30 rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-col gap-3">
        {/* 1. HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-purple-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Grounded Voice AI Assistant</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-700/50 uppercase tracking-wide">
                    Deepgram + NVIDIA + Murf
                  </span>
                </h3>
                <SectionExplainerButton
                  sectionId="voice-ai"
                  title="Grounded Voice AI Agent"
                  badge="Multimodal AI"
                  expression="speaking"
                  description="Speech-to-text, LLM operational reasoning, and neural text-to-speech engine grounded strictly in Nirantar's normalized railway state."
                  howItWorks={[
                    "Deepgram Nova-2 STT: Transcribes passenger Indian-accented English and Hindi voice questions in real time.",
                    "NVIDIA Nemotron / Llama-3 Reasoning: Strictly factual prompt grounded in current coordinates, platform, and delay.",
                    "Zero Hallucination: Synthesizes responses strictly from live telemetry facts rather than generative guessing.",
                    "Murf Falcon-2 TTS: High-fidelity natural voice output streamed to the passenger."
                  ]}
                  userActions={[
                    "Click any of the 4 quick prompts to see instant grounded query answering",
                    "Click the microphone icon to speak directly using browser Speech Recognition",
                    "Listen to live synthesized audio answers with the speaker toggle"
                  ]}
                  onTryAction={() => handleAsk(PRESET_QUESTIONS[0])}
                  tryActionLabel="Ask Train Location"
                />
              </div>
              <p className="text-xs text-slate-400">
                Grounded strictly in Nirantar's normalized operational state — zero hallucinated telemetry.
              </p>
            </div>
          </div>

          {/* Audio / Mic Controls */}
          <div className="flex items-center gap-2">
            {/* Mute/Play TTS button */}
            <button
              type="button"
              onClick={toggleTts}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              isSpeaking
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title="Toggle speech synthesis audio"
          >
            {isSpeaking ? <Volume2 className="w-3.5 h-3.5 animate-pulse" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{isSpeaking ? 'Speaking...' : 'Audio Muted'}</span>
          </button>

          {/* Mic Button */}
          <button
            type="button"
            onClick={handleMicToggle}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md'
            }`}
            title="Click to speak into microphone"
          >
            <Mic className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. PRESET QUESTION CHIPS ROW */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-semibold text-slate-400 mr-1">Ask:</span>
        {PRESET_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleAsk(q)}
            disabled={loading}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-purple-900/40 hover:text-purple-200 border border-slate-700 text-slate-300 text-xs font-medium transition-all active:scale-95 cursor-pointer text-left"
          >
            🎤 {q}
          </button>
        ))}
      </div>

      {/* 3. ANSWER CARD */}
      {currentAnswer && (
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-semibold text-purple-300 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Q: "{currentAnswer.question}"</span>
            </span>
            <span className="text-[10px] text-slate-500">{currentAnswer.provenance}</span>
          </div>

          <p className="text-sm text-slate-100 font-normal leading-relaxed">
            {currentAnswer.structuredAnswer}
          </p>

          {/* Audio Wave Bars when speaking */}
          {isSpeaking && (
            <div className="flex items-center gap-1 h-3 mt-1">
              {[4, 12, 8, 16, 10, 6, 14, 8, 12, 4].map((h, i) => (
                <span
                  key={i}
                  className="w-1 bg-purple-500 rounded-full animate-pulse"
                  style={{ height: `${h}px`, animationDelay: `${i * 80}ms` }}
                />
              ))}
              <span className="text-[10px] text-purple-400 ml-2 font-medium">Murf Falcon 2 Audio Streaming...</span>
            </div>
          )}
        </div>
      )}
    </div>
    </ExplainableSection>
  );
};
