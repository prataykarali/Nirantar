/**
 * NIRANTAR — Competition Demo Script Walkthrough Guide
 * ======================================================
 * Implements PRD Section 18:
 *  - Interactive 3-Minute Competition Demo companion
 *  - Guides the presenter through the exact sequence with 1-click execution triggers
 */

import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  X,
  Play,
  MapPin,
  Compass,
  Radio,
  Sliders,
  TrendingUp,
  CreditCard,
  Layers,
} from 'lucide-react';
import { SimulationScenario } from '../../lib/railway/types';

export interface CompetitionDemoGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStep: (stepIndex: number) => void;
  onTriggerScenario: (scenario: SimulationScenario) => void;
  onOpenRazorpay: () => void;
  onLocateMe: () => void;
}

interface DemoStep {
  timeRange: string;
  title: string;
  action: string;
  judgeTakeaway: string;
  triggerType: 'none' | 'locate' | 'scenario' | 'razorpay';
  scenarioPayload?: SimulationScenario;
}

const DEMO_STEPS: DemoStep[] = [
  {
    timeRange: '0:00 – 0:20',
    title: 'Open Operational Rail Map',
    action: 'Display real-time Mapbox layers, route geometry, and active trains.',
    judgeTakeaway: 'Live railway intelligence interface with high-density visual clarity.',
    triggerType: 'none',
  },
  {
    timeRange: '0:20 – 0:45',
    title: 'Inspect Normalized Telemetry',
    action: 'Examine speed, bearing, current station, next halt, and provider timestamps.',
    judgeTakeaway: 'Provider-agnostic data normalization keeps client components clean.',
    triggerType: 'none',
  },
  {
    timeRange: '0:45 – 1:05',
    title: 'Enable Passenger GPS',
    action: 'Tap "Locate Me" to capture browser geolocation and compute nearest station distance.',
    judgeTakeaway: 'Separates train telemetry from device GPS context without spoofing.',
    triggerType: 'locate',
  },
  {
    timeRange: '1:05 – 1:30',
    title: 'Trigger +15 min Delay Perturbation',
    action: 'Click +15m on Simulation Console to simulate downstream signaling hold.',
    judgeTakeaway: 'System is event-driven: delays ripple across boards, ETA, and crowd alerts.',
    triggerType: 'scenario',
    scenarioPayload: 'DELAY_15',
  },
  {
    timeRange: '1:30 – 1:55',
    title: 'AI/ML Predictive Congestion Analysis',
    action: 'Show 5/10/15m passenger-flow curves and alternate platform advice.',
    judgeTakeaway: 'AI connects directly to operational decisions, not decorative fluff.',
    triggerType: 'none',
  },
  {
    timeRange: '1:55 – 2:15',
    title: 'Grounded Voice Query & Audio Playback',
    action: 'Ask: "Where is my train?" and "Is platform 3 crowded?"',
    judgeTakeaway: 'Zero hallucination: LLM answers strictly from structured state.',
    triggerType: 'none',
  },
  {
    timeRange: '2:15 – 2:40',
    title: 'Razorpay Test Mode Transaction',
    action: 'Book a ₹50 Station Porter assistance pass and verify signed webhook.',
    judgeTakeaway: 'Sandboxed event-driven transaction without real money risk.',
    triggerType: 'razorpay',
  },
  {
    timeRange: '2:40 – 3:00',
    title: 'Architecture & Provenance Defense',
    action: 'Highlight LIVE vs CACHED vs SIMULATED badges and request deduplication.',
    judgeTakeaway: 'Credible, verifiable engineering that respects quotas and ethics.',
    triggerType: 'none',
  },
];

export const CompetitionDemoGuideModal: React.FC<CompetitionDemoGuideModalProps> = ({
  isOpen,
  onClose,
  onSelectStep,
  onTriggerScenario,
  onOpenRazorpay,
  onLocateMe,
}) => {
  const [activeStep, setActiveStep] = useState(0);

  if (!isOpen) return null;

  const currentStep = DEMO_STEPS[activeStep];

  const handleExecuteCurrentStep = () => {
    onSelectStep(activeStep);
    if (currentStep.triggerType === 'locate') {
      onLocateMe();
    } else if (currentStep.triggerType === 'scenario' && currentStep.scenarioPayload) {
      onTriggerScenario(currentStep.scenarioPayload);
    } else if (currentStep.triggerType === 'razorpay') {
      onOpenRazorpay();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-purple-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* HEADER */}
        <div className="p-4 bg-gradient-to-r from-purple-900/70 to-indigo-900/70 border-b border-purple-800/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600/40 border border-purple-400/50 flex items-center justify-center text-white">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>3-Minute Competition Walkthrough</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold uppercase tracking-wide">
                  GENOVATE 2.0
                </span>
              </h3>
              <p className="text-[11px] text-purple-200">
                Official 8-Step Presentation Script Sequence (PRD Section 18)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* STEP PROGRESS BAR */}
          <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1">
            {DEMO_STEPS.map((step, idx) => {
              const isCurrent = idx === activeStep;
              const isPast = idx < activeStep;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveStep(idx)}
                  className={`flex-1 min-w-[50px] py-1.5 px-2 rounded-lg text-center font-bold text-[10px] border transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                      : isPast
                      ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                  }`}
                >
                  Step {idx + 1}
                </button>
              );
            })}
          </div>

          {/* ACTIVE STEP SPOTLIGHT CARD */}
          <div className="bg-slate-950/80 border border-purple-500/30 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full bg-purple-900/60 border border-purple-700/50 text-purple-300 font-bold text-xs">
                ⏱️ Milestone {activeStep + 1} of 8 ({currentStep.timeRange})
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Target: Convince judges in under 45-60 seconds
              </span>
            </div>

            <div>
              <h4 className="text-base font-extrabold text-white">{currentStep.title}</h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{currentStep.action}</p>
            </div>

            {/* Judge Takeaway Banner */}
            <div className="bg-purple-950/50 border border-purple-800/40 rounded-xl p-3 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wide block">
                  Key Takeaway for Judges:
                </span>
                <p className="text-xs text-slate-200 mt-0.5">{currentStep.judgeTakeaway}</p>
              </div>
            </div>

            {/* 1-Click Action Trigger */}
            <div className="pt-2 flex items-center justify-between gap-3">
              {currentStep.triggerType !== 'none' ? (
                <button
                  type="button"
                  onClick={handleExecuteCurrentStep}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Execute Step Action (1-Click)</span>
                </button>
              ) : (
                <span className="text-xs text-slate-500">Manual review & visual verification step.</span>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={activeStep === 0}
                  onClick={() => setActiveStep((s) => s - 1)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Prev
                </button>
                <button
                  type="button"
                  disabled={activeStep === DEMO_STEPS.length - 1}
                  onClick={() => setActiveStep((s) => s + 1)}
                  className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <span>Next</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* ALL 8 STEPS SUMMARY LIST */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">
              Full 3-Minute Script Checklist:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEMO_STEPS.map((step, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2 ${
                    idx === activeStep
                      ? 'bg-purple-950/70 border-purple-500 text-white'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <span className="font-bold text-purple-400 shrink-0">{idx + 1}.</span>
                  <div>
                    <div className="font-semibold text-slate-200">{step.title}</div>
                    <span className="text-[10px] text-slate-500">{step.timeRange}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
