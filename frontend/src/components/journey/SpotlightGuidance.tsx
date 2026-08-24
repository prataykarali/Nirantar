import React, { useEffect } from 'react';
import { Sparkles, ArrowRight, Volume2, X, Check, ShieldCheck } from 'lucide-react';
import { useJourney } from '../../context/JourneyContext';
import { speakNiraResponse } from '../../services/voiceService';

export interface SpotlightGuidanceProps {
  // Can be controlled globally via JourneyContext
}

export const SpotlightGuidance: React.FC<SpotlightGuidanceProps> = () => {
  const {
    guidanceActive,
    guidanceStep,
    stopGuidanceTour,
    nextGuidanceStep,
    searchParams,
    selectedTrain,
    passengers,
  } = useJourney();

  const currentStepData = guidanceStep;

  // Auto-speak Nira guidance message when step changes if guidance is active
  useEffect(() => {
    if (guidanceActive && currentStepData?.speech) {
      speakNiraResponse(currentStepData.speech);
    }
  }, [guidanceActive, currentStepData?.id]);

  if (!guidanceActive || !currentStepData) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none font-sans select-none animate-in fade-in duration-300">
      {/* 1. Lighter backdrop overlay so underlying page is clearly visible */}
      <div
        className="absolute inset-0 bg-slate-950/20 pointer-events-auto transition-opacity duration-300 cursor-pointer"
        onClick={stopGuidanceTour}
        title="Click outside to exit guided tour"
      />

      {/* 2. Floating Animated Arrow pointing directly at exact target on page */}
      {currentStepData.arrowPlacement && (
        <div
          className="absolute z-50 pointer-events-none flex items-center gap-2.5 animate-bounce transition-all duration-300"
          style={currentStepData.arrowPlacement}
        >
          <div className="w-10 h-10 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-lg shadow-[0_0_30px_rgba(16,185,129,0.9)] ring-4 ring-emerald-300/80 animate-pulse">
            ➔
          </div>
          {currentStepData.arrowLabel && (
            <span className="px-3 py-1.5 rounded-full bg-slate-900/95 text-emerald-300 border border-emerald-400/50 text-xs font-black shadow-xl backdrop-blur-md">
              {currentStepData.arrowLabel}
            </span>
          )}
        </div>
      )}

      {/* 3. Floating Smart Guidance Overlay Card */}
      <div className="pointer-events-auto absolute bottom-8 left-1/2 -translate-x-1/2 sm:left-auto sm:right-10 sm:translate-x-0 w-[92vw] sm:w-[420px] bg-white/98 backdrop-blur-xl rounded-[28px] p-4.5 sm:p-5 shadow-[0_20px_60px_rgba(88,28,135,0.25)] border-2 border-purple-300 ring-4 ring-purple-100/80 space-y-3.5 animate-in slide-in-from-bottom-5 duration-300">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-purple-50 pb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 p-0.5 shadow-md flex items-center justify-center">
              <img
                src="/assets/images/characters/nira_wave.png"
                alt="Nira"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-black text-sm text-slate-900 leading-none">
                  Nira Guided Journey
                </span>
                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Step {currentStepData.stepNumber} of 4
                </span>
              </div>
              <span className="text-[10px] text-purple-700 font-bold">
                {currentStepData.title}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={stopGuidanceTour}
            className="w-7 h-7 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-900 flex items-center justify-center transition-colors cursor-pointer"
            title="Exit Guided Tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nira Speech Bubble */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-50/90 via-purple-50/50 to-indigo-50/80 border border-purple-100 text-slate-800 space-y-1 relative shadow-inner">
          <div className="flex items-center justify-between text-[11px] font-bold text-purple-900 mb-0.5">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-600" />
              <span>Nira says:</span>
            </span>
            <button
              type="button"
              onClick={() => speakNiraResponse(currentStepData.speech)}
              className="flex items-center gap-1 text-[10px] text-purple-700 hover:text-purple-900 bg-white/80 px-2 py-0.5 rounded-full border border-purple-200 shadow-2xs cursor-pointer"
            >
              <Volume2 className="w-3 h-3" />
              <span>Play Voice</span>
            </button>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-purple-950 leading-relaxed">
            "{currentStepData.speech}"
          </p>
        </div>

        {/* Targeted Action Cue with Killer Green Arrow Indicator */}
        <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-emerald-950">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md animate-bounce">
            <span className="text-base font-black">➔</span>
          </div>
          <div className="space-y-0.2 flex-1 min-w-0">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 block">
              Next Action:
            </span>
            <p className="text-xs font-bold text-emerald-900 truncate">
              {currentStepData.actionCue}
            </p>
          </div>
        </div>

        {/* Action Button Strip */}
        <div className="flex items-center gap-2 pt-0.5">
          <button
            type="button"
            onClick={stopGuidanceTour}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
          >
            I'll Explore Myself
          </button>
          <button
            type="button"
            onClick={() => {
              if (currentStepData.onAction) {
                currentStepData.onAction();
              } else {
                nextGuidanceStep();
              }
            }}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-md shadow-emerald-700/25 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>{currentStepData.actionButtonText || 'Continue with Nira'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpotlightGuidance;
