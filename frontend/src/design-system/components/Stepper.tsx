import React from 'react';
import { Check } from 'lucide-react';

export interface StepItem {
  id: string;
  label: string;
  sublabel?: string;
}

export interface StepperProps {
  steps: StepItem[];
  currentStepIndex: number;
  onSelectStep?: (index: number) => void;
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStepIndex,
  onSelectStep,
  className = '',
}) => {
  return (
    <div className={`w-full bg-white border border-purple-100/90 rounded-3xl p-4 sm:p-5 shadow-[0_4px_20px_rgba(88,28,135,0.05)] ${className}`}>
      <div className="flex items-center justify-between relative">
        {/* Background Connecting Line */}
        <div className="absolute top-4 sm:top-5 left-6 right-6 h-1 bg-purple-100 -z-0" />
        
        {/* Active Progress Connecting Line */}
        <div
          className="absolute top-4 sm:top-5 left-6 h-1 bg-gradient-to-r from-purple-800 to-purple-600 transition-all duration-500 -z-0"
          style={{
            width: steps.length > 1 ? `${(currentStepIndex / (steps.length - 1)) * 100}%` : '0%',
          }}
        />

        {steps.map((step, idx) => {
          const isDone = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;
          const isFuture = idx > currentStepIndex;

          return (
            <button
              key={step.id}
              type="button"
              disabled={!onSelectStep || isFuture}
              onClick={() => onSelectStep && onSelectStep(idx)}
              className={`group relative z-10 flex flex-col items-center focus:outline-none transition-all ${
                onSelectStep && !isFuture ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              {/* Step Circle */}
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-display font-extrabold text-xs sm:text-sm transition-all duration-300 ${
                  isDone
                    ? 'bg-purple-900 text-white shadow-md shadow-purple-900/20'
                    : isCurrent
                    ? 'bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 ring-4 ring-purple-100 shadow-md shadow-amber-500/30 scale-110'
                    : 'bg-white text-slate-400 border-2 border-purple-100 group-hover:border-purple-200'
                }`}
              >
                {isDone ? <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" /> : idx + 1}
              </div>

              {/* Step Label */}
              <div className="mt-2 text-center hidden sm:block">
                <span
                  className={`text-xs font-bold transition-colors ${
                    isCurrent
                      ? 'text-purple-900'
                      : isDone
                      ? 'text-slate-800'
                      : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
                {step.sublabel && (
                  <p className="text-[10px] text-slate-400 font-medium">{step.sublabel}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
