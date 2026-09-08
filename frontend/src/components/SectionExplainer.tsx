/**
 * NIRANTAR — Section Feature Explainer (Floating 3D Robot Guide)
 * ================================================================
 * Matches Image 2 layout with:
 *  1. Floating 3D Nira mascot peering over top right corner.
 *  2. High-elevation rounded-[32px] card with ring-4 border.
 *  3. "Nira says:" interactive guidance speech bubble.
 *  4. Green "➔ NEXT ACTION:" targeted action box.
 *  5. "How This Works" bulleted breakdown.
 *  6. Glowing purple ring & animated pointing finger (👉) on active DOM section.
 *  7. Deployed across all Nirantar pages.
 */

import React, { useState, createContext, useContext } from 'react';
import {
  X,
  Sparkles,
  Zap,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import { NiraExpression } from './characters/NiraRobot';

export interface SectionExplainerData {
  sectionId: string;
  title: string;
  subtitle?: string;
  badge?: string;
  stepNumber?: string;
  expression?: NiraExpression;
  description: string;
  howItWorks?: string[];
  userActions?: string[];
  actionTip?: string;
  onTryAction?: () => void;
  tryActionLabel?: string;
}

export interface SectionExplainerProps extends SectionExplainerData {
  className?: string;
}

// Global active explainer state so clicking any (ℹ️) button displays the Image 2 modal
interface ExplainerContextType {
  activeSectionId: string | null;
  activeData: SectionExplainerData | null;
  setActiveSectionId: (id: string | null) => void;
  openExplainer: (data: SectionExplainerData) => void;
  closeExplainer: () => void;
}

const ExplainerContext = createContext<ExplainerContextType>({
  activeSectionId: null,
  activeData: null,
  setActiveSectionId: () => {},
  openExplainer: () => {},
  closeExplainer: () => {},
});

export const SectionExplainerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeData, setActiveData] = useState<SectionExplainerData | null>(null);

  const activeSectionId = activeData?.sectionId || null;

  const setActiveSectionId = (id: string | null) => {
    if (!id) {
      setActiveData(null);
    }
  };

  const openExplainer = (data: SectionExplainerData) => {
    setActiveData(data);
    setTimeout(() => {
      const target = document.querySelector(`[data-section-id="${data.sectionId}"]`);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 60);
  };

  const closeExplainer = () => {
    setActiveData(null);
  };

  return (
    <ExplainerContext.Provider
      value={{
        activeSectionId,
        activeData,
        setActiveSectionId,
        openExplainer,
        closeExplainer,
      }}
    >
      {children}

      {/* ─── FLOATING 3D ROBOT EXPLAINER MODAL ─── */}
      {activeData && (() => {
        // Rotate through multiple Nira poses based on sectionId hash
        const NIRA_POSES = [
          '/assets/images/characters/nira_wave.png',
          '/assets/images/characters/nira_idea.png',
          '/assets/images/characters/nira_excited.png',
          '/assets/images/characters/nira_happy.png',
          '/assets/images/characters/nira_thumbsup.png',
          '/assets/images/characters/nira_thinking.png',
          '/assets/images/characters/nira_explorer.png',
          '/assets/images/characters/nira_conductor.png',
          '/assets/images/characters/nira_robot_tablet.png',
          '/assets/images/characters/nira_robot_thumbsup.png',
        ];
        const poseIdx = activeData.sectionId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % NIRA_POSES.length;
        const niraPose = NIRA_POSES[poseIdx];

        return (
        <div className="fixed inset-0 z-[100] pointer-events-none font-sans select-none animate-in fade-in duration-300">
          {/* 1. Solid Dark Overlay — NO BLUR */}
          <div
            className="absolute inset-0 bg-slate-950/40 pointer-events-auto transition-opacity duration-300 cursor-pointer"
            onClick={closeExplainer}
            title="Click outside to close"
          />

          {/* 2. Floating Guidance Card — Constrained max height so mascot never gets cut off */}
          <div className="pointer-events-auto fixed bottom-3 right-3 sm:bottom-5 sm:right-6 z-[100] w-[94vw] sm:w-[440px] max-w-full max-h-[calc(100vh-4.5rem)] bg-white dark:bg-slate-900 rounded-[28px] p-4 sm:p-5 pt-7 shadow-[0_24px_70px_rgba(88,28,135,0.38)] border-2 border-purple-200 dark:border-purple-800 ring-4 ring-purple-300/40 dark:ring-purple-900/40 flex flex-col animate-in slide-in-from-bottom-6 duration-300 text-slate-900 dark:text-slate-100 overflow-visible">
            {/* 3D Robot Mascot — Placed safely above header with clear visibility */}
            <div className="absolute -top-12 right-14 w-20 h-20 pointer-events-none z-30 flex items-end justify-center filter drop-shadow-[0_10px_20px_rgba(124,58,237,0.35)]">
              <img
                src={niraPose}
                alt="Nira AI Guide"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Top Header — dark purple background for contrast */}
            <div className="flex items-start justify-between pb-2 pr-12 shrink-0">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-700 text-white text-xs font-black tracking-tight shadow-sm">
                    <Sparkles className="w-3 h-3 text-purple-200" />
                    Nira Guided Journey
                  </span>
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-2xs tracking-wider">
                    {activeData.stepNumber || activeData.badge || 'FEATURE GUIDE'}
                  </span>
                </div>
                <span className="text-xs sm:text-sm text-[#7C3AED] dark:text-purple-300 font-bold block mt-1">
                  {activeData.subtitle || activeData.title}
                </span>
              </div>

              <button
                type="button"
                onClick={closeExplainer}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer absolute right-4 top-4 border border-slate-200 dark:border-slate-700 shadow-xs"
                title="Close Guide"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body Container so long content never forces card off-screen */}
            <div className="overflow-y-auto max-h-[calc(100vh-13.5rem)] space-y-3 pr-1 py-1">
              {/* Nira Guidance Speech Bubble */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-50 via-white to-purple-50 dark:from-slate-800/80 dark:via-slate-900/90 dark:to-slate-800/80 border border-purple-100 dark:border-slate-700 text-slate-800 dark:text-slate-200 space-y-1.5 relative shadow-inner">
                <div className="flex items-center justify-between text-[11px] font-bold text-purple-900 dark:text-purple-300">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
                    <span className="font-extrabold text-[#7C3AED] dark:text-purple-400">Nira says:</span>
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-purple-950 dark:text-purple-100 leading-relaxed">
                  "{activeData.description}"
                </p>
              </div>

              {/* Targeted Action Cue Box (Green Next Action Banner) */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md animate-pulse">
                  <span className="text-base font-black">➔</span>
                </div>
                <div className="space-y-0.5 flex-1 min-w-0">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                    Next Action:
                  </span>
                  <p className="text-xs font-bold text-emerald-900 dark:text-emerald-300 leading-snug">
                    {activeData.actionTip || (activeData.howItWorks && activeData.howItWorks[0]) || 'Explore and interact with this live section.'}
                  </p>
                </div>
              </div>

              {/* "How It Works" Section */}
              {activeData.howItWorks && activeData.howItWorks.length > 0 && (
                <div className="space-y-2 bg-purple-50/60 dark:bg-slate-800/60 rounded-2xl p-3 border border-purple-100 dark:border-slate-700/60 text-xs">
                  <div className="font-bold text-purple-900 dark:text-purple-300 text-[11px] flex items-center gap-1.5 uppercase tracking-wide">
                    <Zap className="w-3 h-3 text-amber-500" />
                    <span>How This Works</span>
                  </div>
                  <ul className="space-y-1.5 text-slate-700 dark:text-slate-300">
                    {activeData.howItWorks.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-[11.5px] leading-snug">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-400 shrink-0 mt-1.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* "What You Can Do Here" Checklist */}
              {activeData.userActions && activeData.userActions.length > 0 && (
                <div className="space-y-1.5 pt-1 text-[11px] text-slate-600 dark:text-slate-300">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px]">
                    💡 Quick Actions:
                  </span>
                  <ul className="space-y-1">
                    {activeData.userActions.map((act, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-[11px]">
                        <span className="text-emerald-500 font-bold">✓</span>
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Action Buttons Strip — Explore button REMOVED */}
            <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-purple-100/80 dark:border-slate-800 flex-wrap shrink-0 mt-2">
              <button
                type="button"
                onClick={closeExplainer}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>✕</span>
                <span>Got It</span>
              </button>

              <div className="flex items-center gap-2 ml-auto">
                {activeData.onTryAction ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (activeData.onTryAction) activeData.onTryAction();
                      closeExplainer();
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    <span>{activeData.tryActionLabel || 'Try Action'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={closeExplainer}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    <span>Proceed ➔</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        );
      })()}
    </ExplainerContext.Provider>
  );
};

export const useSectionExplainer = () => useContext(ExplainerContext);

/**
 * Interactive (ℹ️) Trigger Button
 */
export const SectionExplainerButton: React.FC<SectionExplainerProps> = (props) => {
  const {
    sectionId,
    title,
    subtitle,
    badge = 'Feature Guide',
    stepNumber,
    expression = 'idea',
    description,
    howItWorks,
    userActions = [],
    actionTip,
    onTryAction,
    tryActionLabel = 'Try Interaction',
    className = '',
  } = props;

  const { activeSectionId, openExplainer, closeExplainer } = useSectionExplainer();
  const isOpen = activeSectionId === sectionId;

  const toggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOpen) {
      closeExplainer();
    } else {
      openExplainer({
        sectionId,
        title,
        subtitle,
        badge,
        stepNumber,
        expression,
        description,
        howItWorks,
        userActions,
        actionTip,
        onTryAction,
        tryActionLabel,
      });
    }
  };

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={toggleOpen}
        className={`group relative flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer shadow-xs ${
          isOpen
            ? 'bg-purple-600 text-white shadow-purple-500/30 scale-105 ring-2 ring-purple-400'
            : 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/90 border border-purple-300/60 dark:border-purple-800'
        }`}
        title={`Click for Nira AI guide on ${title}`}
      >
        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-purple-700 dark:bg-purple-500 text-white text-[10px] font-black">
          ℹ
        </span>
        <span className="hidden sm:inline text-[11px] font-bold tracking-tight">
          {isOpen ? 'Close Guide' : 'Explain'}
        </span>
        {!isOpen && (
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping ml-0.5" />
        )}
      </button>
    </div>
  );
};

/**
 * Section Wrapper with visual glowing highlight and animated floating indicator banner
 */
export const ExplainableSection: React.FC<{
  sectionId: string;
  children: React.ReactNode;
  className?: string;
}> = ({ sectionId, children, className = '' }) => {
  const { activeSectionId, activeData } = useSectionExplainer();
  const isHighlighted = activeSectionId === sectionId;

  return (
    <div
      data-section-id={sectionId}
      className={`relative transition-all duration-500 rounded-3xl ${className} ${
        isHighlighted
          ? 'ring-4 ring-purple-500/90 shadow-[0_0_40px_rgba(168,85,247,0.55)] border-purple-400'
          : ''
      }`}
    >
      {/* Floating Active Section Target Banner matching Image 2 left side */}
      {isHighlighted && (
        <div className="absolute -top-7 left-4 z-40 flex items-center gap-2.5 bg-slate-950/95 text-white px-3.5 py-1.5 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-emerald-400 animate-bounce duration-1000">
          <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
            ➔
          </div>
          <span className="text-xs font-bold text-slate-100 max-w-xs sm:max-w-md truncate">
            {activeData?.actionTip || activeData?.subtitle || activeData?.title || 'Active Section'}
          </span>
        </div>
      )}
      {children}
    </div>
  );
};

