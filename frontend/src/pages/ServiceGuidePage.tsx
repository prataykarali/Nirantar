import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  FileCheck,
  ShieldAlert,
  Map,
  Compass,
  CreditCard,
  FileText,
  UserCheck,
  Award,
} from 'lucide-react';

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
      avatar: '/assets/images/characters/nira_idea.png',
      icon: Compass,
    },
    {
      num: '02',
      title: 'Prepare',
      status: 'current',
      summary: "You'll need 3 documents (Aadhaar, Utility Bill, Self Declaration).",
      details: 'Prepare scanned copies or clean clear photos. Files must be under 5MB in PDF or JPG format.',
      avatar: '/assets/images/characters/nira_robot_map.png',
      icon: FileText,
    },
    {
      num: '03',
      title: 'Apply',
      status: 'upcoming',
      summary: 'Enter synthetic details in NIRANTAR Workspace.',
      details: 'Fill in your name, current address, and verification details in our guided 3-pane workspace.',
      avatar: '/assets/images/characters/nira_tablet.png',
      icon: UserCheck,
    },
    {
      num: '04',
      title: 'Payment',
      status: 'upcoming',
      summary: "You'll temporarily leave NIRANTAR to complete payment.",
      details: 'A ₹50 statutory processing fee will be processed via our resilient Payment Bridge adapter.',
      avatar: '/assets/images/characters/nira_settings.jpg',
      icon: CreditCard,
    },
    {
      num: '05',
      title: 'Review',
      status: 'upcoming',
      summary: 'The department will verify your application.',
      details: 'Designated official reviews submitted details. Automatic telemetry tracking keeps your place safe.',
      avatar: '/assets/images/characters/nira_explorer.jpg',
      icon: FileCheck,
    },
    {
      num: '06',
      title: 'Complete',
      status: 'upcoming',
      summary: 'Receive your verified digital certificate.',
      details: 'Download QR-verified digital document with official cryptographic seal.',
      avatar: '/assets/images/characters/nira_excited.jpg',
      icon: Award,
    },
  ];

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-800 pb-20 font-sans selection:bg-purple-200">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#4f46e5 2px, transparent 2px)',
          backgroundSize: '30px 30px',
        }}
      />
      
      {/* Top Gradient Blob */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-br from-purple-100 via-violet-50 to-pink-50 opacity-80 z-0" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 space-y-10 pt-6">
        
        {/* ═══════════════════════════════════════════════════════════════════
            1. HERO SECTION WITH SCENIC BACKGROUND & MASCOTS
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="relative rounded-[2.5rem] bg-gradient-to-r from-[#1A0B2E] via-[#2E1256] to-[#1E0B38] p-8 md:p-12 shadow-2xl border border-purple-500/20 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Scenic Station Background Image Overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden mix-blend-luminosity">
            <img
              src="/assets/images/discover_station_bg.jpg"
              alt="Scenic Station"
              className="w-full h-full object-cover object-center"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A0B2E]/95 via-[#2E1256]/80 to-transparent pointer-events-none" />

          {/* Decorative glows */}
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-3xl" />
          
          <div className="relative z-10 space-y-4 max-w-xl text-white">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-purple-200 text-xs font-bold tracking-wider uppercase shadow-sm">
              <Sparkles className="w-4 h-4 text-purple-300" />
              <span>Page 03 — Official Nirantar Guide</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight text-white">
              Address Certificate & Service Guide
            </h1>
            
            <p className="text-purple-100 text-sm sm:text-base font-medium leading-relaxed">
              Your comprehensive roadmap to obtaining an official address verification document with Zero-PII protection and 1-click submission.
            </p>
          </div>

          {/* Mascot Avatars Showcase */}
          <div className="relative z-10 flex items-center gap-4 shrink-0">
            <div className="w-36 h-36 md:w-44 md:h-44 rounded-3xl shadow-2xl overflow-hidden transition-transform hover:scale-105 duration-300">
              <img 
                src="/assets/images/characters/nira_guide_teacher.jpg" 
                alt="Guide Teacher" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="hidden sm:block w-24 h-24 rounded-2xl shadow-lg overflow-hidden transition-transform hover:scale-105 duration-300 -mt-8">
              <img 
                src="/assets/images/characters/ananya_holding_map.png" 
                alt="Citizen Guide" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            2. JOURNEY ROADMAP OVERVIEW
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="relative space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <Map className="w-6 h-6 text-purple-600" />
                <span>Journey Roadmap Overview</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">A step-by-step path from verification to digital certificate</p>
            </div>
            <div className="hidden md:block w-20 h-20 rounded-2xl overflow-hidden shadow-md">
              <img src="/assets/images/characters/nira_explorer.jpg" alt="Explorer" className="w-full h-full object-contain" />
            </div>
          </div>

          <div className="relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-1/2 left-4 right-4 h-1 bg-purple-100 -translate-y-1/2 rounded-full z-0" />
            <div className="hidden md:block absolute top-1/2 left-4 h-1 bg-gradient-to-r from-purple-500 to-indigo-500 -translate-y-1/2 rounded-full z-0" style={{ width: '35%' }} />

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4 relative z-10">
              {STAGES.map((s, idx) => (
                <div
                  key={idx}
                  onClick={() => setExpandedStage(expandedStage === idx + 1 ? null : idx + 1)}
                  className="cursor-pointer group flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1"
                >
                  <div className={`
                    w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl flex flex-col items-center justify-center mb-2.5 shadow-lg transition-all duration-300 p-1
                    ${s.status === 'completed' 
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/30' 
                      : s.status === 'current'
                      ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-purple-500/40 ring-4 ring-purple-500/20'
                      : 'bg-white border-2 border-purple-100 text-slate-400 group-hover:border-purple-300'
                    }
                  `}>
                    <span className="text-sm md:text-base font-black font-mono">{s.num}</span>
                    <span className="text-[10px] font-bold opacity-80 truncate max-w-[60px]">{s.title}</span>
                  </div>
                  <div className={`font-bold text-xs ${s.status === 'current' ? 'text-purple-700' : 'text-slate-700'}`}>
                    {s.status === 'completed' ? '✓ Completed' : s.status === 'current' ? '● In Progress' : '○ Upcoming'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            3. DETAILED STAGE BREAKDOWN ACCORDION
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Detailed Stage Breakdown</span>
            </h2>
            <span className="text-xs text-slate-400 font-medium">Click any stage to expand details</span>
          </div>

          {STAGES.map((s, idx) => {
            const isExpanded = expandedStage === idx + 1;
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className={`rounded-3xl border transition-all overflow-hidden ${
                  isExpanded
                    ? 'bg-white border-purple-300 shadow-lg ring-1 ring-purple-200'
                    : 'bg-white/80 border-purple-100 hover:border-purple-200 shadow-xs'
                }`}
              >
                <div
                  onClick={() => setExpandedStage(isExpanded ? null : idx + 1)}
                  className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-purple-50/30 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-sm shrink-0">
                      <img src={s.avatar} alt={s.title} className="w-full h-full object-contain" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs text-purple-700">STAGE {s.num}</span>
                        <h3 className="font-black text-slate-900 text-sm sm:text-base truncate">{s.title}</h3>
                      </div>
                      <p className="text-xs text-slate-500 font-medium truncate mt-0.5">{s.summary}</p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center shrink-0 ml-3">
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-purple-700" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 border-t border-purple-50 text-xs sm:text-sm text-slate-600 space-y-2 bg-gradient-to-b from-purple-50/20 to-white animate-in fade-in duration-200">
                    <p className="leading-relaxed font-medium">{s.details}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            4. BEFORE YOU BEGIN & ACTION BOX
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2 rounded-3xl border border-purple-200/80 bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 space-y-4 shadow-xl relative overflow-hidden">
            {/* Background Graphic Accent */}
            <div className="absolute top-0 right-0 w-44 h-44 opacity-15 pointer-events-none">
              <img src="/assets/images/banners/scenic_railway_banner.png" alt="Railway Banner" className="w-full h-full object-cover" />
            </div>

            <div className="flex items-start gap-4 relative z-10">
              <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md shrink-0">
                <img src="/assets/images/characters/nira_robot_map.png" alt="Robot Map" className="w-full h-full object-contain" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-purple-300" />
                  <span>Before You Begin Application</span>
                </h3>
                <p className="text-xs text-purple-200/80 font-medium">
                  Review time requirements, required documents, and zero-loss resume support.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-semibold text-purple-100 relative z-10 pt-2 border-t border-purple-500/20">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-purple-300 block">TIME REQUIRED</span>
                <p className="font-bold text-white flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-purple-300" /> 10–15 min</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-mono text-purple-300 block">DOCUMENTS</span>
                <p className="font-bold text-white flex items-center gap-1.5"><FileCheck className="w-3.5 h-3.5 text-purple-300" /> 3 Documents</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-mono text-purple-300 block">STATUTORY FEE</span>
                <p className="font-bold text-white flex items-center gap-1.5">₹50 (Wallet Ready)</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-mono text-purple-300 block">TASK RESUME</span>
                <p className="font-bold text-emerald-400 flex items-center gap-1.5">Zero Data Loss</p>
              </div>
            </div>
          </div>

          {/* START APPLICATION CTA */}
          <div className="md:col-span-1 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-28 h-28 rounded-3xl overflow-hidden shadow-lg transform rotate-3 hover:rotate-0 transition-transform">
              <img src="/assets/images/characters/nira_excited.jpg" alt="Excited Mascot" className="w-full h-full object-contain" />
            </div>
            
            <button
              type="button"
              onClick={() => onNavigate('workspace')}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <span>Start Application</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ServiceGuidePage;
