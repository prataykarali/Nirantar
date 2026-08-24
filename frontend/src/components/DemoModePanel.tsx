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
              <span>Judge / Demo Fast-Forward</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white text-xs cursor-pointer p-1"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5 text-xs">
            {/* Reset */}
            <button
              onClick={handleReset}
              className="w-full py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-between font-semibold transition-all cursor-pointer text-left"
            >
              <span className="flex items-center gap-1.5">
                <RotateCcw className="w-3 h-3 text-slate-400" />
                <span>Reset Journey State</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Clean</span>
            </button>

            {/* Aha sequence */}
            <button
              onClick={handleAhaSequence}
              className="w-full py-1.5 px-2.5 rounded-lg bg-purple-950/80 hover:bg-purple-900/80 border border-purple-500/30 text-purple-200 flex items-center justify-between font-semibold transition-all cursor-pointer text-left"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-purple-400" />
                <span>90s "Aha" Demo Jump</span>
              </span>
              <span className="text-[10px] text-purple-400 font-mono">NDLS→CSMT</span>
            </button>

            {/* Fail payment */}
            <button
              onClick={handleSimulatePaymentFail}
              className="w-full py-1.5 px-2.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/30 text-rose-200 flex items-center justify-between font-semibold transition-all cursor-pointer text-left"
            >
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3 text-rose-400" />
                <span>Simulate Payment Fail</span>
              </span>
              <span className="text-[10px] text-rose-400 font-mono">Preserves</span>
            </button>

            {/* Unknown payment */}
            <button
              onClick={handleSimulatePaymentUnknown}
              className="w-full py-1.5 px-2.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500/30 text-amber-200 flex items-center justify-between font-semibold transition-all cursor-pointer text-left"
            >
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-3 h-3 text-amber-400" />
                <span>Simulate Payment Unknown</span>
              </span>
              <span className="text-[10px] text-amber-400 font-mono">Unclear</span>
            </button>

            {/* Interrupt */}
            <button
              onClick={handleInterruptBooking}
              className="w-full py-1.5 px-2.5 rounded-lg bg-blue-950/60 hover:bg-blue-900/60 border border-blue-500/30 text-blue-200 flex items-center justify-between font-semibold transition-all cursor-pointer text-left"
            >
              <span className="flex items-center gap-1.5">
                <PauseCircle className="w-3 h-3 text-blue-400" />
                <span>Interrupt Booking → Track</span>
              </span>
              <span className="text-[10px] text-blue-400 font-mono">Pause</span>
            </button>

            {/* Resume */}
            <button
              onClick={handleResumeTask}
              className="w-full py-1.5 px-2.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-200 flex items-center justify-between font-semibold transition-all cursor-pointer text-left"
            >
              <span className="flex items-center gap-1.5">
                <PlayCircle className="w-3 h-3 text-emerald-400" />
                <span>Resume Interrupted Task</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">Restore</span>
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
