import React, { useState, useEffect } from 'react';
import {
  Info,
  HelpCircle,
  Sparkles,
  X,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';
import { getRailwayTerm, RailwayTerm } from '../data/railwayTerms';
import { generateExplanation, ExplainContext, ExplainOutput } from '../utils/explainContext';

interface ExplainProps {
  term: string;
  context?: Omit<ExplainContext, 'term'>;
  variant?: 'icon' | 'badge' | 'text' | 'nira';
  label?: string;
  className?: string;
  iconSize?: number;
}

export const Explain: React.FC<ExplainProps> = ({
  term,
  context,
  variant = 'icon',
  label,
  className = '',
  iconSize = 14,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeLevel, setActiveLevel] = useState<1 | 2 | 3>(1);

  const fullContext: ExplainContext = {
    term,
    ...context,
  };

  const explanation: ExplainOutput = generateExplanation(fullContext);
  const { instant, contextual, advanced, recommendation, isPrediction, termData } = explanation;

  // Prevent background scroll when bottom sheet / modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsOpen(true);
    setActiveLevel(contextual ? 2 : 1);
  };

  return (
    <>
      {/* ─── TRIGGER BUTTON ─── */}
      <span
        onClick={handleTriggerClick}
        className={`inline-flex items-center gap-1 cursor-pointer transition-all active:scale-95 ${className}`}
        title={`Click to understand ${term}`}
        role="button"
        tabIndex={0}
      >
        {variant === 'icon' && (
          <span className="w-4 h-4 rounded-full bg-purple-100/80 hover:bg-purple-200 text-purple-800 flex items-center justify-center text-[10px] font-bold border border-purple-200/60 shadow-2xs transition-colors">
            ⓘ
          </span>
        )}

        {variant === 'nira' && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-900 border border-purple-200 text-[10px] font-bold hover:from-purple-200 hover:to-indigo-200 shadow-2xs">
            <Sparkles className="w-3 h-3 text-purple-600" />
            <span>{label || 'Explain'}</span>
          </span>
        )}

        {variant === 'badge' && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-[11px] font-semibold">
            <span>{label || term}</span>
            <Info className="w-3 h-3 text-purple-600" />
          </span>
        )}

        {variant === 'text' && (
          <span className="underline decoration-dotted decoration-purple-400 hover:text-purple-700 text-inherit font-inherit">
            {label || term}
          </span>
        )}
      </span>

      {/* ─── EXPLAIN MODAL / BOTTOM SHEET ─── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200 p-0 sm:p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full sm:max-w-md max-h-[85vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-purple-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white relative shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-white backdrop-blur-xs">
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-200 block">
                      Nirantar Explain • Railway Knowledge
                    </span>
                    <h3 className="text-base font-black text-white leading-tight">
                      {instant.title}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Progressive Tabs (3 Levels) */}
              <div className="grid grid-cols-3 gap-1.5 mt-3.5 bg-white/10 p-1 rounded-xl text-[11px] font-bold text-center">
                <button
                  type="button"
                  onClick={() => setActiveLevel(1)}
                  className={`py-1 rounded-lg transition-all cursor-pointer ${
                    activeLevel === 1
                      ? 'bg-white text-purple-950 shadow-sm font-black'
                      : 'text-purple-100 hover:text-white'
                  }`}
                >
                  1. Quick Definition
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLevel(2)}
                  className={`py-1 rounded-lg transition-all cursor-pointer ${
                    activeLevel === 2
                      ? 'bg-white text-purple-950 shadow-sm font-black'
                      : 'text-purple-100 hover:text-white'
                  }`}
                >
                  2. For You
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLevel(3)}
                  className={`py-1 rounded-lg transition-all cursor-pointer ${
                    activeLevel === 3
                      ? 'bg-white text-purple-950 shadow-sm font-black'
                      : 'text-purple-100 hover:text-white'
                  }`}
                >
                  3. Deep Dive
                </button>
              </div>
            </div>

            {/* Scrollable Content Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
              {/* LEVEL 1: Quick Definition */}
              {activeLevel === 1 && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  <div className="p-3 rounded-2xl bg-purple-50/80 border border-purple-200/70">
                    <span className="text-[10px] font-black uppercase text-purple-900 tracking-wider block mb-1">
                      Plain English Meaning
                    </span>
                    <p className="text-slate-900 font-semibold text-xs sm:text-sm">
                      {instant.body}
                    </p>
                  </div>

                  {termData?.example && (
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block mb-1">
                        Real-world Example
                      </span>
                      <p className="text-slate-700 font-mono text-xs">
                        {termData.example}
                      </p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setActiveLevel(2)}
                    className="w-full py-2.5 px-3 rounded-xl bg-purple-100/70 hover:bg-purple-200/70 text-purple-900 font-bold text-xs flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>What does this mean for my journey?</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* LEVEL 2: Contextual Personalized Meaning */}
              {activeLevel === 2 && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  {contextual ? (
                    <div className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-200/70 space-y-2">
                      <div className="flex items-center gap-1.5 text-indigo-900 font-black text-xs">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{contextual.heading}</span>
                      </div>
                      <div className="text-slate-800 text-xs sm:text-sm space-y-1.5 whitespace-pre-line font-medium">
                        {contextual.body}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200">
                      <span className="text-[10px] font-black uppercase text-purple-900 tracking-wider block mb-1">
                        Why It Matters
                      </span>
                      <p className="text-slate-800 text-xs">
                        {termData?.why_it_matters}
                      </p>
                    </div>
                  )}

                  {recommendation && (
                    <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1">
                      <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider block">
                        🎯 Nira Recommendation
                      </span>
                      <p className="text-xs font-bold leading-normal">
                        {recommendation}
                      </p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setActiveLevel(3)}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>How does the railway system work behind this?</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* LEVEL 3: Deep Dive Mechanism */}
              {activeLevel === 3 && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                      {advanced.heading}
                    </span>
                    <div className="text-slate-800 text-xs leading-relaxed whitespace-pre-line font-normal">
                      {advanced.body}
                    </div>
                  </div>

                  {termData?.relatedTerms && termData.relatedTerms.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Related Terms
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {termData.relatedTerms.map((rt) => (
                          <span
                            key={rt}
                            className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-900 border border-purple-200 text-[11px] font-mono font-bold"
                          >
                            {rt}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Prediction Disclaimer */}
              {isPrediction && (
                <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <p>
                    <strong>Nirantar Estimate</strong>: Based on statistical movement patterns. Not an official Indian Railways guarantee.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
              <span className="flex items-center gap-1 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Deterministic Verified Knowledge</span>
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
export default Explain;
