import React, { useState } from 'react';
import { Sparkles, ArrowRight, CheckCircle2, ChevronDown, ChevronUp, Clock, FileCheck, ShieldAlert, Map } from 'lucide-react';

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
    <div className="relative min-h-screen bg-slate-50 text-slate-800 pb-20 font-sans selection:bg-purple-200">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4f46e5 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>
      
      {/* Top Gradient Blob */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-br from-purple-100 via-violet-50 to-pink-50 opacity-80 z-0"></div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 space-y-12 pt-8">
        
        {/* HERO SECTION */}
        <div className="relative rounded-[2.5rem] bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 p-8 md:p-12 shadow-2xl shadow-purple-500/20 overflow-hidden flex flex-col md:flex-row items-center justify-between">
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-64 h-64 bg-fuchsia-400 opacity-20 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 space-y-6 max-w-xl text-white">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold tracking-wider uppercase shadow-sm">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              Page 03 — Service Guide
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
              Address<br/>Certificate
            </h1>
            
            <p className="text-purple-100 text-lg md:text-xl font-medium leading-relaxed">
              Your comprehensive guide to obtaining an official address verification document. Follow these steps to complete your application.
            </p>
          </div>

          <div className="relative z-10 mt-8 md:mt-0 md:ml-8 animate-float">
            <div className="w-52 h-52 md:w-72 md:h-72 rounded-full shadow-2xl overflow-hidden relative">
              <img 
                src="/assets/images/characters/nira_guide_teacher.jpg" 
                alt="Guide Teacher" 
                className="w-full h-full object-contain object-center"
              />
            </div>
            {/* Sparkles around mascot */}
            <div className="absolute top-4 -left-4 w-8 h-8 bg-yellow-400 rounded-full blur-md opacity-60 animate-pulse"></div>
            <div className="absolute bottom-10 -right-4 w-6 h-6 bg-pink-400 rounded-full blur-md opacity-60 animate-pulse delay-75"></div>
          </div>
        </div>

        {/* JOURNEY ROADMAP SECTION */}
        <div className="relative space-y-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                <Map className="w-6 h-6 text-purple-600" />
                Journey Roadmap Overview
              </h2>
              <p className="text-slate-500 font-medium mt-1">A step-by-step path to your certificate</p>
            </div>
            <div className="hidden md:block w-28 h-28 rounded-2xl overflow-hidden shadow-lg rotate-3">
              <img src="/assets/images/characters/nira_explorer.jpg" alt="Explorer" className="w-full h-full object-contain" />
            </div>
          </div>

          <div className="relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-1/2 left-4 right-4 h-1 bg-purple-100 -translate-y-1/2 rounded-full z-0"></div>
            <div className="hidden md:block absolute top-1/2 left-4 h-1 bg-gradient-to-r from-purple-500 to-fuchsia-500 -translate-y-1/2 rounded-full z-0 transition-all duration-1000" style={{ width: '40%' }}></div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 md:gap-6 relative z-10">
              {STAGES.map((s, idx) => (
                <div
                  key={idx}
                  onClick={() => setExpandedStage(expandedStage === idx + 1 ? null : idx + 1)}
                  className={`cursor-pointer group flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1`}
                >
                  <div className={`
                    w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl flex items-center justify-center mb-3 shadow-lg transition-all duration-300
                    ${s.status === 'completed' 
                      ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white border-none shadow-emerald-500/30' 
                      : s.status === 'current'
                      ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white border-none shadow-purple-500/40 ring-4 ring-purple-500/20'
                      : 'bg-white border-2 border-purple-100 text-slate-400 group-hover:border-purple-300 group-hover:shadow-purple-200/50'
                    }
                  `}>
                    <span className="text-lg md:text-xl font-black font-mono">{s.num}</span>
                  </div>
                  <div className={`font-bold text-sm ${s.status === 'current' ? 'text-purple-700' : 'text-slate-700'}`}>{s.title}</div>
                  
                  <div className="mt-2 flex justify-center h-4">
                    {s.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : s.status === 'current' ? (
                      <span className="h-3 w-3 rounded-full bg-purple-500 animate-ping" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-slate-300 mt-1" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gradient Divider */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-purple-300 to-transparent my-10 opacity-50"></div>

        {/* STAGE BREAKDOWN ACCORDION */}
        <div className="space-y-4 relative">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <span className="text-purple-600 font-bold">i</span>
            </div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Detailed Breakdown</h2>
          </div>

          <div className="space-y-3 relative z-10">
            {STAGES.map((s, idx) => {
              const isExpanded = expandedStage === idx + 1;
              return (
                <div
                  key={idx}
                  className={`rounded-2xl transition-all duration-300 overflow-hidden ${
                    isExpanded
                      ? 'bg-white border-2 border-purple-300 shadow-xl shadow-purple-200/50'
                      : 'bg-white/60 backdrop-blur-sm border border-slate-200 hover:border-purple-300 hover:bg-white hover:shadow-md'
                  }`}
                >
                  <div
                    onClick={() => setExpandedStage(isExpanded ? null : idx + 1)}
                    className="p-4 md:p-5 flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-mono font-bold text-sm transition-colors ${isExpanded ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30' : 'bg-slate-100 text-slate-500 group-hover:bg-purple-100'}`}>
                        {s.num}
                      </div>
                      <div>
                        <h3 className={`font-bold text-base md:text-lg ${isExpanded ? 'text-purple-700' : 'text-slate-700'}`}>{s.title}</h3>
                        <span className="text-sm font-medium text-slate-500 hidden sm:inline-block mt-0.5">{s.summary}</span>
                      </div>
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isExpanded ? 'bg-purple-100 text-purple-600' : 'bg-slate-50 text-slate-400'}`}>
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-5 pb-5 pt-2 ml-14 text-sm md:text-base text-slate-600 space-y-2 animate-in slide-in-from-top-2 duration-300">
                      <p className="leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">{s.details}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* BEFORE YOU BEGIN & CTA SECTION */}
        <div className="grid md:grid-cols-3 gap-8 mt-12 items-end">
          
          {/* BEFORE YOU BEGIN BOX */}
          <div className="md:col-span-2 rounded-[2rem] border-2 border-purple-200 bg-white p-6 md:p-8 shadow-xl relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-bl-full -mr-4 -mt-4 opacity-50 pointer-events-none"></div>
            
            <div className="flex items-start gap-4 mb-6 relative z-10">
              <div className="w-24 h-24 rounded-full overflow-hidden shadow-md shrink-0">
                <img src="/assets/images/characters/nira_robot_map.png" alt="Robot Map" className="w-full h-full object-contain" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-purple-500" /> 
                  Before you begin
                </h3>
                <p className="text-slate-500 text-sm font-medium mt-1">Make sure you have everything ready</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm font-medium relative z-10">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-start gap-3 transition-colors hover:bg-purple-50 hover:border-purple-100">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider block mb-0.5">ESTIMATED TIME</span>
                  <p className="font-bold text-slate-700">10–15 min</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-start gap-3 transition-colors hover:bg-purple-50 hover:border-purple-100">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <FileCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider block mb-0.5">DOCUMENTS</span>
                  <p className="font-bold text-slate-700">3 Documents</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-start gap-3 transition-colors hover:bg-purple-50 hover:border-purple-100">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                  <span className="text-orange-600 font-bold text-lg">₹</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider block mb-0.5">PAYMENT</span>
                  <p className="font-bold text-slate-700">Required (₹50)</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-start gap-3 transition-colors hover:bg-purple-50 hover:border-purple-100">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider block mb-0.5">APPLICATION</span>
                  <p className="font-bold text-emerald-600">Resumable</p>
                </div>
              </div>
            </div>
          </div>

          {/* START APPLICATION CTA */}
          <div className="md:col-span-1 flex flex-col items-center justify-center gap-6">
            <div className="w-36 h-36 rounded-full overflow-hidden shadow-xl shadow-purple-500/20 rotate-6 hover:rotate-12 transition-transform duration-300">
              <img src="/assets/images/characters/nira_excited.jpg" alt="Excited Mascot" className="w-full h-full object-contain" />
            </div>
            
            <button
              onClick={() => onNavigate('workspace')}
              className="w-full relative group"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-70 group-hover:opacity-100 transition duration-200 group-hover:duration-200 animate-pulse"></div>
              <div className="relative px-8 py-5 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-black text-lg shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 border border-white/20">
                Start application <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
};
