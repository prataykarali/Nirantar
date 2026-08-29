import React, { useState } from 'react';
import {
  Sparkles,
  RotateCcw,
  AlertTriangle,
  HelpCircle,
  PauseCircle,
  PlayCircle,
  ChevronUp,
  ChevronDown,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useJourney } from '../context/JourneyContext';
import { POPULAR_STATIONS } from '../data/stationData';
import { searchTrains } from '../data/mockTrains';

export const DemoModePanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    activePage,
    bookingState,
    paymentState,
    taskStack,
    resetJourney,
    navigateTo,
    triggerMockPaymentResult,
    pushTask,
    resumeTask,
    searchParams,
    executeSearch,
    selectTrain,
    savePassengerDetails,
    setShowChatDrawer,
    setNamedError,
  } = useJourney();

  // 1. Reset Everything
  const handleReset = () => {
    resetJourney();
    navigateTo('home');
  };

  // 2. 90-second Aha Moment fast-forward
  const handleAhaSequence = async () => {
    const fromSt = POPULAR_STATIONS[0]; // NDLS
    const toSt = POPULAR_STATIONS[2];   // CSMT
    await executeSearch({
      fromStation: fromSt,
      toStation: toSt,
      passengersCount: 2,
    });
    const trains = searchTrains('NDLS', 'CSMT');
    if (trains[0]) {
      selectTrain(trains[0], '3A');
    }
    navigateTo('workspace');
    setShowChatDrawer(true);
  };

  // 3. Simulate Payment Failure
  const handleSimulatePaymentFail = async () => {
    navigateTo('payment');
    await triggerMockPaymentResult('FAILED');
    setShowChatDrawer(true);
  };

  // 4. Simulate Payment Unknown / Timeout
  const handleSimulatePaymentUnknown = async () => {
    navigateTo('payment');
    await triggerMockPaymentResult('UNKNOWN');
    setShowChatDrawer(true);
  };

  // 5. Simulate Task Interruption (Booking -> Tracking)
  const handleInterruptBooking = () => {
    pushTask('BOOKING', 'Resume Booking (Delhi → Mumbai)', 'Passenger details saved on Step 2');
    navigateTo('track');
    setShowChatDrawer(true);
  };

  // 6. Resume Interrupted Task
  const handleResumeTask = () => {
    resumeTask();
    setShowChatDrawer(true);
  };

  return (
    <div className="fixed bottom-4 left-4 z-40 select-none font-sans">
      {isOpen ? (
        <div className="bg-slate-900/95 text-white border border-purple-500/30 backdrop-blur-md rounded-2xl p-3 shadow-2xl w-72 space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-purple-300">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span>Evaluator & Demo Fast-Forward</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white text-xs cursor-pointer p-1"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          <div className="text-[9px] font-bold uppercase tracking-wider text-purple-400/80 px-1">
            [Developer Tooling — Safe Boundary]
          </div>

          {/* LIVE NIRA CONTEXT TELEMETRY */}
          <div className="p-2 rounded-xl bg-slate-950/90 border border-purple-500/20 text-[10px] font-mono space-y-1">
            <div className="flex items-center justify-between text-purple-300 font-bold border-b border-slate-800 pb-1">
              <span>CONTEXT ENGINE</span>
              <span className="text-[8px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Zero-PII Active
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-slate-300 pt-0.5">
              <div><span className="text-slate-500">Page:</span> <strong className="text-white capitalize">{activePage}</strong></div>
              <div><span className="text-slate-500">State:</span> <strong className="text-purple-300">{bookingState}</strong></div>
              <div><span className="text-slate-500">Payment:</span> <strong className="text-amber-300">{paymentState}</strong></div>
              <div><span className="text-slate-500">TaskStack:</span> <strong className="text-emerald-300">{taskStack.length > 0 ? `${taskStack.length} Paused` : 'Clean'}</strong></div>
            </div>
          </div>

          {/* 4 PILLAR PRESENTATION SEQUENCE */}
          <div className="space-y-1.5 text-xs">
            {/* 1. Hook: Discover */}
            <button
              onClick={() => {
                navigateTo('discover');
                setShowChatDrawer(true);
              }}
              className="w-full py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-between font-semibold transition-all cursor-pointer text-left border border-slate-700"
            >
              <span className="flex items-center gap-1.5 truncate">
                <span className="text-indigo-400">1.</span>
                <span>Discover ("Tatkal rules?")</span>
              </span>
              <span className="text-[9px] text-indigo-300 font-mono">Hook</span>
            </button>

            {/* 2. UX Diff: Understand */}
            <button
              onClick={() => {
                navigateTo('help');
                setShowChatDrawer(true);
              }}
              className="w-full py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-between font-semibold transition-all cursor-pointer text-left border border-slate-700"
            >
              <span className="flex items-center gap-1.5 truncate">
                <span className="text-purple-400">2.</span>
                <span>Understand (RAC 27 Explain)</span>
              </span>
              <span className="text-[9px] text-purple-300 font-mono">UX Diff</span>
            </button>

            {/* 3. AI Intent: Act */}
            <button
              onClick={handleAhaSequence}
              className="w-full py-1.5 px-2.5 rounded-lg bg-purple-950/80 hover:bg-purple-900/80 border border-purple-500/30 text-purple-200 flex items-center justify-between font-semibold transition-all cursor-pointer text-left"
            >
              <span className="flex items-center gap-1.5 truncate">
                <span className="text-amber-400">3.</span>
                <span>Act (Nira Assisted Booking)</span>
              </span>
              <span className="text-[9px] text-amber-300 font-mono">AI Safe</span>
            </button>

            {/* 4. Engineering Depth: Recover */}
            <button
              onClick={handleSimulatePaymentUnknown}
              className="w-full py-1.5 px-2.5 rounded-lg bg-amber-950/70 hover:bg-amber-900/70 border border-amber-500/30 text-amber-200 flex items-center justify-between font-semibold transition-all cursor-pointer text-left"
            >
              <span className="flex items-center gap-1.5 truncate">
                <span className="text-emerald-400">4.</span>
                <span>Recover (Timeout & Don't Pay Twice)</span>
              </span>
              <span className="text-[9px] text-amber-300 font-mono">Depth</span>
            </button>

            {/* Reset */}
            <button
              onClick={handleReset}
              className="w-full py-1 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-between text-[11px] font-medium transition-all cursor-pointer text-left pt-2 border-t border-slate-800"
            >
              <span className="flex items-center gap-1.5">
                <RotateCcw className="w-3 h-3 text-slate-500" />
                <span>Reset Journey State</span>
              </span>
              <span className="text-[9px] text-slate-500 font-mono">Clean</span>
            </button>
          </div>

          <div className="pt-1 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between font-medium">
            <span>🛡️ Nira Zero-PII Boundary</span>
            <span className="text-emerald-400 font-bold">SafeMode</span>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-900 text-purple-300 border border-purple-500/30 shadow-lg text-xs font-bold transition-all hover:scale-105 cursor-pointer backdrop-blur-md"
          title="Open Judge / Demo Fast-Forward Panel"
        >
          <Zap className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
          <span>Demo Controls</span>
          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
        </button>
      )}
    </div>
  );
};

export default DemoModePanel;
