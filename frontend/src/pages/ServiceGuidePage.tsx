import React, { useState } from 'react';
import { Sparkles, ArrowRight, CheckCircle2, ChevronDown, ChevronUp, Clock, FileCheck, ShieldAlert } from 'lucide-react';

interface ServiceGuidePageProps {
  onNavigate: (route: string) => void;
}

export const ServiceGuidePage: React.FC<ServiceGuidePageProps> = ({ onNavigate }) => {
  const [expandedStage, setExpandedStage] = useState<number | null>(2);

  const STAGES = [
    {
      num: '01',
      title: 'Understand',
      status: 'completed',
      summary: 'Service requirements & eligibility rules verified.',
      details: 'You have identified the correct service category. No extra municipal authorization required.',
    },
    {
      num: '02',
      title: 'Prepare',
      status: 'current',
      summary: "You'll need 3 documents (Aadhaar, Utility Bill, Self Declaration).",
      details: 'Prepare scanned copies or clean clear photos. Files must be under 5MB in PDF or JPG format.',
    },
    {
      num: '03',
      title: 'Apply',
      status: 'upcoming',
      summary: 'Enter synthetic details in NIRANTAR Workspace.',
      details: 'Fill in your name, current address, and verification details in our guided 3-pane workspace.',
    },
    {
      num: '04',
      title: 'Payment',
      status: 'upcoming',
      summary: "You'll temporarily leave NIRANTAR to complete payment.",
      details: 'A ₹50 statutory processing fee will be processed via our resilient Payment Bridge adapter.',
    },
    {
      num: '05',
      title: 'Review',
      status: 'upcoming',
      summary: 'The department will verify your application.',
      details: 'Designated official reviews submitted details. Automatic telemetry tracking keeps your place safe.',
    },
    {
      num: '06',
      title: 'Complete',
      status: 'upcoming',
      summary: 'Receive your verified digital certificate.',
      details: 'Download QR-verified digital document with official cryptographic seal.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* HEADER */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          PAGE 03 — SERVICE GUIDE
        </div>
        <h1 className="text-3xl md:text-4xl font-display font-black text-white">Address Certificate</h1>
        <p className="text-slate-300 text-sm">Here's what will happen from start to finish.</p>
      </div>

      {/* JOURNEY VISUALIZATION BAR */}
      <div className="rounded-3xl border border-white/10 bg-[#091024]/80 p-6 md:p-8 space-y-6 backdrop-blur-md shadow-xl">
        <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
          Journey Roadmap Overview
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {STAGES.map((s, idx) => (
            <div
              key={idx}
              onClick={() => setExpandedStage(expandedStage === idx + 1 ? null : idx + 1)}
              className={`cursor-pointer p-3.5 rounded-2xl border text-center transition-all ${
                s.status === 'completed'
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                  : s.status === 'current'
                  ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <div className="text-[10px] font-mono font-bold mb-1 opacity-70">{s.num}</div>
              <div className="font-bold text-xs">{s.title}</div>
              <div className="mt-2 flex justify-center">
                {s.status === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : s.status === 'current' ? (
                  <span className="h-3.5 w-3.5 rounded-full bg-indigo-400 animate-pulse" />
                ) : (
                  <span className="h-3.5 w-3.5 rounded-full border border-slate-600" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* STAGE BREAKDOWN ACCORDION */}
      <div className="space-y-3">
        <h2 className="text-sm font-mono font-bold text-indigo-300 uppercase tracking-wider">
          Detailed Stage Breakdown
        </h2>

        {STAGES.map((s, idx) => {
          const isExpanded = expandedStage === idx + 1;
          return (
            <div
              key={idx}
              className={`rounded-2xl border transition-all ${
                isExpanded
                  ? 'bg-[#0b142d] border-indigo-500/40 shadow-lg'
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              <div
                onClick={() => setExpandedStage(isExpanded ? null : idx + 1)}
                className="p-4 md:p-5 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-xs text-indigo-400">{s.num}</span>
                  <h3 className="font-bold text-white text-sm md:text-base">{s.title}</h3>
                  <span className="text-xs text-slate-400 hidden sm:inline">— {s.summary}</span>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>

              {isExpanded && (
                <div className="px-5 pb-5 pt-1 border-t border-white/5 text-xs text-slate-300 space-y-2 animate-in fade-in duration-200">
                  <p className="leading-relaxed">{s.details}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* BEFORE YOU BEGIN BOX */}
      <div className="rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 to-[#091024] p-6 md:p-8 space-y-4 shadow-xl">
        <h3 className="text-sm font-mono font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" /> Before you begin
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-medium text-slate-200">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-400">ESTIMATED TIME</span>
            <p className="font-bold text-white flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-purple-400" /> 10–15 min</p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-400">DOCUMENTS</span>
            <p className="font-bold text-white flex items-center gap-1"><FileCheck className="w-3.5 h-3.5 text-indigo-400" /> 3 Documents</p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-400">PAYMENT</span>
            <p className="font-bold text-white flex items-center gap-1">Required (₹50)</p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-400">APPLICATION</span>
            <p className="font-bold text-emerald-400 flex items-center gap-1">Can be resumed later</p>
          </div>
        </div>
      </div>

      {/* START APPLICATION CTA */}
      <div className="flex justify-end pt-2">
        <button
          onClick={() => onNavigate('workspace')}
          className="px-10 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-500 hover:from-indigo-400 hover:to-purple-500 text-white font-extrabold text-lg shadow-xl shadow-indigo-500/30 transition-all flex items-center gap-3 active:scale-95"
        >
          Start application <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
