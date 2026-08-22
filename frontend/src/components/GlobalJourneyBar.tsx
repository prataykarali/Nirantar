import React from 'react';
import { Check, ChevronRight } from 'lucide-react';

export type JourneyStepId = 'discover' | 'prepare' | 'apply' | 'pay' | 'track' | 'complete';

interface StepDef {
  id: JourneyStepId;
  label: string;
  pageRoute: string;
}

const STEPS: StepDef[] = [
  { id: 'discover', label: 'DISCOVER', pageRoute: 'discover' },
  { id: 'prepare', label: 'PREPARE', pageRoute: 'guide' },
  { id: 'apply', label: 'APPLY', pageRoute: 'workspace' },
  { id: 'pay', label: 'PAY', pageRoute: 'payment' },
  { id: 'track', label: 'TRACK', pageRoute: 'tracking' },
  { id: 'complete', label: 'COMPLETE', pageRoute: 'result' },
];

interface GlobalJourneyBarProps {
  currentStep: JourneyStepId;
  onNavigateStep?: (route: string) => void;
}

export const GlobalJourneyBar: React.FC<GlobalJourneyBarProps> = ({
  currentStep,
  onNavigateStep,
}) => {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className="w-full bg-[#0a1124]/90 border-b border-indigo-500/20 backdrop-blur-md px-4 py-2.5 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto no-scrollbar gap-2">
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider">
          <span className="text-indigo-400 mr-2 flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
            NIRANTAR JOURNEY:
          </span>
          {STEPS.map((step, idx) => {
            const isPassed = idx < currentIndex;
            const isCurrent = idx === currentIndex;

            return (
              <React.Fragment key={step.id}>
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
                <button
                  onClick={() => onNavigateStep && onNavigateStep(step.pageRoute)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono transition-all shrink-0 ${
                    isCurrent
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold shadow-lg shadow-indigo-500/30 scale-105'
                      : isPassed
                      ? 'bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-900/50'
                      : 'bg-white/5 text-slate-400 border border-white/5 hover:text-slate-200'
                  }`}
                >
                  {isPassed ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <span
                      className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] ${
                        isCurrent ? 'bg-white text-indigo-900 font-bold' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                  )}
                  <span>{step.label}</span>
                </button>
              </React.Fragment>
            );
          })}
        </div>

        <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-400 font-medium">
          <span>Current: <strong className="text-white">{STEPS[currentIndex]?.label || 'HOME'}</strong></span>
          <span className="text-slate-600">•</span>
          <span>Next: <strong className="text-indigo-300">{STEPS[currentIndex + 1]?.label || 'FINISH'}</strong></span>
        </div>
      </div>
    </div>
  );
};
