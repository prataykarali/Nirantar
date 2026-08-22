import React, { useState } from 'react';
import { Sparkles, CheckCircle2, Clock, AlertCircle, ArrowRight, ShieldCheck, FileText } from 'lucide-react';

interface JourneyTrackerPageProps {
  onNavigate: (route: string) => void;
}

export const JourneyTrackerPage: React.FC<JourneyTrackerPageProps> = ({ onNavigate }) => {
  const [statusMode, setStatusMode] = useState<'normal' | 'action_required'>('normal');

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* HEADER */}
      <div className="space-y-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            PAGE 06 — JOURNEY TRACKER
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-black text-white mt-1">Your application</h1>
          <p className="text-slate-300 text-sm font-mono">Application ID: <strong className="text-white">NTR-20482</strong></p>
        </div>

        {/* STATUS DEMO TOGGLE */}
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-white/5 border border-white/10 text-xs shrink-0">
          <span className="text-slate-400 px-2 font-mono">Demo mode:</span>
          <button
            onClick={() => setStatusMode('normal')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              statusMode === 'normal' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Under Review
          </button>
          <button
            onClick={() => setStatusMode('action_required')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              statusMode === 'action_required' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Action Required
          </button>
        </div>
      </div>

      {/* TIMELINE CARD */}
      <div className="rounded-3xl border border-white/10 bg-[#091024]/80 p-6 md:p-8 space-y-8 backdrop-blur-md shadow-xl">
        <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
          Real-time Telemetry Timeline
        </h2>

        <div className="relative pl-6 space-y-8 border-l-2 border-indigo-500/30">
          {/* Step 1 */}
          <div className="relative">
            <div className="absolute -left-[31px] top-0 h-6 w-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs">
              ✓
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Application started</h3>
              <p className="text-xs text-slate-400 font-mono">2026-08-22 10:14:02 IST</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative">
            <div className="absolute -left-[31px] top-0 h-6 w-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs">
              ✓
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Documents submitted</h3>
              <p className="text-xs text-slate-400 font-mono">2026-08-22 10:18:45 IST • 2 Verified</p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative">
            <div className="absolute -left-[31px] top-0 h-6 w-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs">
              ✓
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Payment confirmed</h3>
              <p className="text-xs text-slate-400 font-mono">2026-08-22 10:20:12 IST • ₹50 via Bridge</p>
            </div>
          </div>

          {/* Step 4: Active */}
          <div className="relative">
            <div
              className={`absolute -left-[31px] top-0 h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs ${
                statusMode === 'action_required'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-indigo-500 text-white animate-pulse'
              }`}
            >
              ●
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Department review</h3>
              <p className="text-xs text-slate-400 font-mono">Assigned Officer: Kolkata Revenue Sub-Division</p>
            </div>
          </div>

          {/* Step 5 */}
          <div className="relative opacity-50">
            <div className="absolute -left-[31px] top-0 h-6 w-6 rounded-full border border-slate-600 bg-[#091024] flex items-center justify-center text-slate-500 text-xs">
              ○
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-400">Decision & Completion</h3>
              <p className="text-xs text-slate-500">Digital seal issuance</p>
            </div>
          </div>
        </div>
      </div>

      {/* CURRENT STATUS BOX */}
      {statusMode === 'normal' ? (
        <div className="rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 to-[#091024] p-6 md:p-8 space-y-3 backdrop-blur-md shadow-xl">
          <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs font-bold">
            <Clock className="w-4 h-4" /> Current status
          </div>
          <h3 className="text-xl font-display font-bold text-white">Under department review</h3>
          <p className="text-sm text-slate-300">
            No action is required from you right now. You will receive real-time notification once decision is reached.
          </p>

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => onNavigate('result')}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
            >
              Simulate Completion (Page 07) →
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 to-[#091024] p-6 md:p-8 space-y-4 backdrop-blur-md shadow-xl">
          <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold">
            <AlertCircle className="w-4 h-4" /> Action required
          </div>
          <h3 className="text-xl font-display font-bold text-white">Your address document needs to be replaced.</h3>
          <p className="text-sm text-slate-300">
            The previous address proof was missing official seal page. Please upload a fresh copy to prevent rejection.
          </p>

          <div className="pt-2">
            <button
              onClick={() => onNavigate('workspace')}
              className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all"
            >
              Fix this → (Returns to Application Workspace)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
