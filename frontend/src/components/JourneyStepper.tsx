import React from 'react';
import { Check, Compass, Search, Train, UserCheck, ShieldCheck, CreditCard } from 'lucide-react';
import { useTranslation } from '../locales/i18n';

export type JourneyStepStage =
  | 'INTENT'
  | 'CONFIRM'
  | 'SEARCH'
  | 'SELECT'
  | 'PASSENGER'
  | 'REVIEW'
  | 'PAY';

export interface StepDefinition {
  id: JourneyStepStage;
  labelKey: string;
  icon: React.ElementType;
}

const JOURNEY_STEPS: StepDefinition[] = [
  { id: 'INTENT', labelKey: 'stepper.intent', icon: Compass },
  { id: 'CONFIRM', labelKey: 'stepper.confirm', icon: Check },
  { id: 'SEARCH', labelKey: 'stepper.search', icon: Search },
  { id: 'SELECT', labelKey: 'stepper.select', icon: Train },
  { id: 'PASSENGER', labelKey: 'stepper.passenger', icon: UserCheck },
  { id: 'REVIEW', labelKey: 'stepper.review', icon: ShieldCheck },
  { id: 'PAY', labelKey: 'stepper.pay', icon: CreditCard },
];

interface JourneyStepperProps {
  currentStage: JourneyStepStage;
  onSelectStage?: (stage: JourneyStepStage) => void;
  className?: string;
}

export const JourneyStepper: React.FC<JourneyStepperProps> = ({
  currentStage,
  onSelectStage,
  className = '',
}) => {
  const { t } = useTranslation();

  const currentIndex = JOURNEY_STEPS.findIndex((step) => step.id === currentStage);
  const safeIndex = currentIndex === -1 ? 0 : currentIndex;
  const progressPercent = Math.round(((safeIndex + 1) / JOURNEY_STEPS.length) * 100);

  return (
    <div
      role="region"
      aria-label={t('stepper.title', 'Civic Journey Progress')}
      className={`w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 backdrop-blur-md shadow-xl ${className}`}
    >
      {/* Top Header & Progress Percentage Bar */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xs uppercase tracking-wider text-purple-400 font-semibold">
            {t('stepper.title', 'Civic Journey Progress')}
          </h2>
          <p className="text-sm font-medium text-slate-200">
            Step {safeIndex + 1} of {JOURNEY_STEPS.length}:{' '}
            <span className="text-purple-300 font-semibold">
              {t(JOURNEY_STEPS[safeIndex].labelKey, JOURNEY_STEPS[safeIndex].id)}
            </span>
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
            {progressPercent}% COMPLETE
          </span>
        </div>
      </div>

      {/* ARIA Progressbar */}
      <div
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progress percentage"
        className="w-full h-1.5 bg-slate-800 rounded-full mb-6 overflow-hidden"
      >
        <div
          className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400 transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Step Indicators Grid */}
      <nav aria-label="Step navigation">
        <ol role="list" className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {JOURNEY_STEPS.map((step, index) => {
            const isCompleted = index < safeIndex;
            const isActive = index === safeIndex;
            const isUpcoming = index > safeIndex;
            const Icon = step.icon;

            return (
              <li key={step.id} role="listitem">
                <button
                  type="button"
                  onClick={() => onSelectStage && onSelectStage(step.id)}
                  disabled={!onSelectStage}
                  tabIndex={0}
                  aria-current={isActive ? 'step' : undefined}
                  aria-label={`${t(step.labelKey, step.id)} step ${index + 1}`}
                  className={`w-full flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400 ${
                    isActive
                      ? 'bg-purple-900/40 border-purple-500 text-purple-200 shadow-lg shadow-purple-950/50 scale-[1.02]'
                      : isCompleted
                      ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/40'
                      : 'bg-slate-950/40 border-slate-800/80 text-slate-500 hover:border-slate-700'
                  }`}
                >
                  {/* Step Icon Badge */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-purple-500 text-white ring-4 ring-purple-500/20 animate-pulse'
                        : isCompleted
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : <Icon className="w-4 h-4" />}
                  </div>

                  <span className="text-[11px] font-medium leading-tight truncate w-full">
                    {t(step.labelKey, step.id)}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
};
