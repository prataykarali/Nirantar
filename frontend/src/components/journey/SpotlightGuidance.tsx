import React, { useEffect, useState } from 'react';
import { Sparkles, ArrowRight, ArrowLeft, Volume2, X, Search, ChevronRight, MapPin } from 'lucide-react';
import { useJourney } from '../../context/JourneyContext';
import { speakNiraResponse } from '../../services/voiceService';
import { VERIFIED_PLATFORM_HUBS, VerifiedHub, findStation } from '../../data/stationData';

export interface SpotlightGuidanceProps {
  // Can be controlled globally via JourneyContext
}

export const SpotlightGuidance: React.FC<SpotlightGuidanceProps> = () => {
  const {
    guidanceActive,
    guidanceStep,
    guidanceStepIndex,
    totalGuidanceSteps,
    stopGuidanceTour,
    nextGuidanceStep,
    prevGuidanceStep,
    setShowChatDrawer,
    executeSearch,
    navigateTo,
  } = useJourney();

  const [activeZone, setActiveZone] = useState<'all' | 'north' | 'central' | 'east' | 'west' | 'south'>('all');
  const [showFullDirectory, setShowFullDirectory] = useState(false);
  const [stationSearchQuery, setStationSearchQuery] = useState('');

  const currentStepData = guidanceStep;

  // Auto-open Nira Chat drawer on Step 1 of tutorial
  useEffect(() => {
    if (guidanceActive && guidanceStepIndex === 0) {
      setShowChatDrawer(true);
    }
  }, [guidanceActive, guidanceStepIndex, setShowChatDrawer]);

  // Auto-speak Nira guidance message when step changes if guidance is active
  useEffect(() => {
    if (guidanceActive && currentStepData?.speech) {
      speakNiraResponse(currentStepData.speech);
    }
  }, [guidanceActive, currentStepData?.id]);

  if (!guidanceActive || !currentStepData) return null;

  const isLeft = currentStepData.cardPosition === 'left' || currentStepData.stepNumber === 1;
  const positionClass = isLeft
    ? 'bottom-6 left-4 sm:bottom-8 sm:left-64 md:left-72'
    : 'bottom-6 right-4 sm:bottom-8 sm:right-8';

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

      {/* 3. Floating Smart Guidance Overlay Card with 3D Mascot */}
      <div className={`pointer-events-auto fixed ${positionClass} z-50 w-[94vw] sm:w-[420px] bg-white/98 backdrop-blur-xl rounded-[32px] p-5 shadow-[0_24px_70px_rgba(88,28,135,0.28)] border-2 border-purple-200 ring-4 ring-purple-100/70 space-y-3.5 animate-in slide-in-from-bottom-6 duration-300 transition-all`}>
        {/* 3D Robot Mascot popping out separately on the top right */}
        <div className="absolute -top-16 right-6 w-24 h-24 pointer-events-none z-20 flex items-end justify-center filter drop-shadow-[0_10px_20px_rgba(124,58,237,0.35)] animate-bounce duration-1000">
          <img
            src="/assets/images/characters/nira_wave.png"
            alt="Nira AI Guide"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-purple-50 pb-2.5 pr-20">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm text-slate-900 tracking-tight">
                Nira Guided Journey
              </span>
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                Step {currentStepData.stepNumber} of {totalGuidanceSteps || 9}
              </span>
            </div>
            <span className="text-xs text-purple-700 font-bold block mt-0.5">
              {currentStepData.title}
            </span>
          </div>

          <button
            type="button"
            onClick={stopGuidanceTour}
            className="w-8 h-8 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-900 flex items-center justify-center transition-colors cursor-pointer absolute right-4 top-4"
            title="Exit Guided Tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nira Speech Bubble */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-50 via-white to-purple-50 border border-purple-100 text-slate-800 space-y-1.5 relative shadow-inner">
          <div className="flex items-center justify-between text-[11px] font-bold text-purple-900">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
              <span className="font-extrabold text-[#7C3AED]">Nira says:</span>
            </span>
            <button
              type="button"
              onClick={() => speakNiraResponse(currentStepData.speech)}
              className="flex items-center gap-1 text-[10px] font-bold text-purple-700 hover:text-purple-900 bg-purple-100/70 hover:bg-purple-100 px-2.5 py-0.8 rounded-full border border-purple-200 shadow-2xs cursor-pointer transition-all"
            >
              <Volume2 className="w-3 h-3 text-[#7C3AED]" />
              <span>Play Voice</span>
            </button>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-purple-950 leading-relaxed">
            "{currentStepData.speech}"
          </p>
        </div>

        {/* Targeted Action Cue with Green Arrow Indicator */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-emerald-950 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md animate-pulse">
            <span className="text-base font-black">➔</span>
          </div>
          <div className="space-y-0.5 flex-1 min-w-0">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 block">
              Next Action:
            </span>
            <p className="text-xs font-bold text-emerald-900 leading-snug">
              {currentStepData.actionCue}
            </p>
          </div>
        </div>

        {/* Top Verified Popular Stations & Platforms Multi-Zone Guide Strip */}
        <div className="p-2.5 rounded-2xl bg-purple-50/80 border border-purple-200/80 space-y-2 text-left">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-900 flex items-center gap-1">
              <span>🚉 Verified Railway Hubs & Platforms ({VERIFIED_PLATFORM_HUBS.length}+):</span>
            </span>
            <button
              type="button"
              onClick={() => setShowFullDirectory(!showFullDirectory)}
              className="text-[9px] font-bold text-purple-700 hover:text-purple-900 bg-purple-100/90 hover:bg-purple-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
            >
              {showFullDirectory ? 'Close Directory ✕' : 'View All 73+ ↗'}
            </button>
          </div>

          {/* Regional Zone Selector Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar text-[9.5px]">
            {[
              { id: 'all', label: `⭐ Top (${VERIFIED_PLATFORM_HUBS.length})` },
              { id: 'north', label: '🏛️ North (17)' },
              { id: 'central', label: '🛕 Central (13)' },
              { id: 'east', label: '🌉 East (17)' },
              { id: 'west', label: '🌊 West (15)' },
              { id: 'south', label: '🌴 South (18)' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveZone(tab.id as any)}
                className={`px-2 py-0.8 rounded-lg font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeZone === tab.id
                    ? 'bg-purple-700 text-white shadow-2xs'
                    : 'bg-white/80 hover:bg-purple-100 text-purple-900 border border-purple-200/70'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Filtered Station Platform Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[10px]">
            {(activeZone === 'all'
              ? VERIFIED_PLATFORM_HUBS.slice(0, 16)
              : VERIFIED_PLATFORM_HUBS.filter((h) => h.zone === activeZone)
            ).map((h) => (
              <button
                key={h.code}
                type="button"
                onClick={() => {
                  const s = findStation(h.code);
                  if (s) {
                    executeSearch({ fromStation: s, travelDate: 'Tomorrow' });
                    navigateTo('trains');
                  }
                }}
                className="px-2 py-1 rounded-lg bg-white border border-purple-200 hover:border-purple-400 font-bold text-purple-950 whitespace-nowrap shadow-2xs hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                title={`${h.name} (${h.state}) - ${h.platforms}`}
              >
                <span>{h.city} ({h.code})</span>
                <span className="text-[8.5px] font-mono text-purple-700 bg-purple-100 px-1 py-0.2 rounded font-semibold">{h.platforms}</span>
              </button>
            ))}
          </div>

          <p className="text-[9px] text-purple-800 font-medium leading-tight">
            💡 Tap any station to explore verified direct routes with exact platform and track availability.
          </p>
        </div>

        {/* Expandable Full 73+ Verified Stations Modal / Sheet */}
        {showFullDirectory && (
          <div className="p-3 rounded-2xl bg-white border-2 border-purple-300 shadow-xl space-y-2 max-h-60 overflow-y-auto animate-in zoom-in-95 duration-150 text-left">
            <div className="flex items-center justify-between border-b border-purple-100 pb-1.5">
              <span className="text-xs font-black text-purple-950 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-purple-700" />
                <span>All {VERIFIED_PLATFORM_HUBS.length} Verified National Junctions</span>
              </span>
              <button
                type="button"
                onClick={() => setShowFullDirectory(false)}
                className="text-purple-700 hover:text-purple-900 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search station by name, city, or code..."
                value={stationSearchQuery}
                onChange={(e) => setStationSearchQuery(e.target.value)}
                className="w-full pl-7 pr-2.5 py-1 text-xs bg-purple-50 rounded-lg border border-purple-200 focus:outline-none focus:border-purple-600 font-medium"
              />
              <Search className="w-3.5 h-3.5 text-purple-500 absolute left-2 top-2" />
            </div>

            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {VERIFIED_PLATFORM_HUBS.filter(
                (h) =>
                  !stationSearchQuery ||
                  h.name.toLowerCase().includes(stationSearchQuery.toLowerCase()) ||
                  h.city.toLowerCase().includes(stationSearchQuery.toLowerCase()) ||
                  h.code.toLowerCase().includes(stationSearchQuery.toLowerCase()) ||
                  h.state.toLowerCase().includes(stationSearchQuery.toLowerCase())
              ).map((h) => (
                <button
                  key={h.code}
                  type="button"
                  onClick={() => {
                    const s = findStation(h.code);
                    if (s) {
                      executeSearch({ fromStation: s, travelDate: 'Tomorrow' });
                      navigateTo('trains');
                      setShowFullDirectory(false);
                    }
                  }}
                  className="p-1.5 rounded-lg bg-purple-50/70 hover:bg-purple-100 border border-purple-200 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-purple-950 group-hover:text-purple-700">{h.city}</span>
                    <span className="font-mono text-[9px] font-bold text-purple-700 bg-white px-1 rounded">{h.code}</span>
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-slate-500 mt-0.5">
                    <span className="truncate">{h.platforms}</span>
                    <span className="text-[8px] text-purple-600 font-semibold">{h.zone.toUpperCase()}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Button Strip with ← Back Button */}
        <div className="flex items-center gap-2 pt-1">
          {guidanceStepIndex > 0 && (
            <button
              type="button"
              onClick={prevGuidanceStep}
              className="px-3 py-2.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 active:scale-95 shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}
          <button
            type="button"
            onClick={stopGuidanceTour}
            className="px-3 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-colors cursor-pointer shrink-0"
          >
            Explore
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
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-md shadow-emerald-700/25 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
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
