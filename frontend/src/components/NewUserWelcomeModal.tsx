import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, X, CheckCircle2, ShieldCheck, Zap, Train, Navigation, QrCode } from 'lucide-react';
import { useJourney } from '../context/JourneyContext';

export const NewUserWelcomeModal: React.FC = () => {
  const { startGuidanceTour } = useJourney();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Show welcome modal once per user session/browser
    const hasSeen = localStorage.getItem('nirantar_new_user_welcome_seen');
    if (!hasSeen) {
      // Small natural delay so initial page loads smoothly
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 900);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleStartTour = () => {
    localStorage.setItem('nirantar_new_user_welcome_seen', 'true');
    setIsOpen(false);
    startGuidanceTour(0);
  };

  const handleDismiss = () => {
    localStorage.setItem('nirantar_new_user_welcome_seen', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300 select-none">
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border-2 border-purple-200 ring-8 ring-purple-100/60 space-y-4 animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Decorative Top Accent Gradient */}
        <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-500" />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-900 flex items-center justify-center transition-all cursor-pointer z-20"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Mascot & Header */}
        <div className="flex items-start gap-4 pt-2">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-purple-100 via-purple-50 to-indigo-100 border border-purple-200 flex items-center justify-center p-1 shrink-0 shadow-sm">
            <img
              src="/assets/images/characters/nira_wave.png"
              alt="Nira Mascot"
              className="w-full h-full object-contain animate-bounce duration-1000"
            />
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 text-[10px] font-mono font-extrabold uppercase">
              <Sparkles className="w-3 h-3 text-[#7C3AED]" />
              <span>New to Nirantar?</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight leading-tight">
              Welcome to Nirantar! 👋
            </h2>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              India's Next-Gen AI Railway Companion. Here is your step-by-step roadmap to effortlessly find routes, book with Zero-PII protection, and track live seat vacancies:
            </p>
          </div>
        </div>

        {/* 5-Step Visual Roadmap */}
        <div className="space-y-2 p-3.5 rounded-2xl bg-gradient-to-br from-purple-50/70 via-white to-purple-50/70 border border-purple-100 text-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-purple-800 block">
            5-Step Guided Journey Roadmap:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-800 font-semibold text-[11px]">
            <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-purple-100 shadow-2xs">
              <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-900 flex items-center justify-center font-bold text-[10px]">1</span>
              <span>AI Route & Express Search</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-purple-100 shadow-2xs">
              <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-900 flex items-center justify-center font-bold text-[10px]">2</span>
              <span>Zero-PII Safe Autofill</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-purple-100 shadow-2xs">
              <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-900 flex items-center justify-center font-bold text-[10px]">3</span>
              <span>3D-Secure UPI Authorization</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-purple-100 shadow-2xs">
              <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-900 flex items-center justify-center font-bold text-[10px]">4</span>
              <span>DigiLocker Verified e-Ticket</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-purple-100 shadow-2xs sm:col-span-2">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold text-[10px]">5</span>
              <span>Live Radar, Waitlist Watch & Plain English Explain (GNWL/RAC)</span>
            </div>
          </div>
        </div>

        {/* Top Verified Popular Platforms & Stations Available in Nirantar */}
        <div className="p-3 rounded-2xl bg-purple-50/90 border border-purple-200 text-xs space-y-1.5 text-left">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-black uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
              <span>🚉 Top Verified Platforms Available:</span>
            </span>
            <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-200">
              100% Direct Routes
            </span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[10.5px]">
            <span className="px-2.5 py-1 rounded-xl bg-white border border-purple-200 font-bold text-purple-950 whitespace-nowrap shadow-2xs">
              🏛️ NDLS (New Delhi • Plat 1–16)
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-white border border-purple-200 font-bold text-purple-950 whitespace-nowrap shadow-2xs">
              🌊 MMCT (Mumbai Central • Plat 1–8)
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-white border border-purple-200 font-bold text-purple-950 whitespace-nowrap shadow-2xs">
              🌉 HWH (Howrah Jn • Plat 1–23)
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-white border border-purple-200 font-bold text-purple-950 whitespace-nowrap shadow-2xs">
              🌳 SBC (KSR Bengaluru • Plat 1–10)
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-white border border-purple-200 font-bold text-purple-950 whitespace-nowrap shadow-2xs">
              🚂 MAS (Chennai Central • Plat 1–12)
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-white border border-purple-200 font-bold text-purple-950 whitespace-nowrap shadow-2xs">
              🛕 BSB (Varanasi Jn • Plat 1–9)
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-white border border-purple-200 font-bold text-purple-950 whitespace-nowrap shadow-2xs">
              🌊 PRYJ (Prayagraj Jn • Plat 1–10)
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-white border border-purple-200 font-bold text-purple-950 whitespace-nowrap shadow-2xs">
              🏰 PUNE (Pune Jn • Plat 1–6)
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-white border border-purple-200 font-bold text-purple-950 whitespace-nowrap shadow-2xs">
              ⚡ ADI (Ahmedabad Jn • Plat 1–12)
            </span>
          </div>
          <p className="text-[9.5px] text-purple-800 font-semibold leading-tight">
            💡 Supported verified platform hubs ensure you never mistakenly input unknown platforms or unserviced stops!
          </p>
        </div>

        {/* Prompt Question & Yes/No Toggle Buttons */}
        <div className="space-y-2 pt-1">
          <p className="text-xs text-center font-bold text-slate-800">
            Would you like Nira to guide you through the interactive roadmap?
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleDismiss}
              className="py-3 rounded-2xl border-2 border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all cursor-pointer text-center"
            >
              No, I'll explore myself
            </button>
            <button
              type="button"
              onClick={handleStartTour}
              className="py-3 rounded-2xl bg-gradient-to-r from-[#7C3AED] via-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-black text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <span>Yes, Start Tour ✨</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewUserWelcomeModal;
