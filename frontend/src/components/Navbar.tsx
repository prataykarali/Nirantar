import React from 'react';
import { Activity, Cpu, Train, Sparkles } from 'lucide-react';

interface NavbarProps {
  activeTab: 'command' | 'citizen' | 'benchmarks';
  setActiveTab: (tab: 'command' | 'citizen' | 'benchmarks') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <header className="border-b border-white/[0.08] bg-[#030712]/80 backdrop-blur-xl sticky top-0 z-50 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => setActiveTab('citizen')}>
          <div className="relative">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 p-[1.5px] shadow-lg shadow-emerald-500/20">
              <div className="h-full w-full bg-[#060b14] rounded-[10px] flex items-center justify-center text-[#00FF9D]">
                <Train className="w-5 h-5" />
              </div>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-[#00FF9D] border-2 border-[#030712] animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-black tracking-wider text-xl bg-gradient-to-r from-[#00FF9D] via-[#00F0FF] to-white bg-clip-text text-transparent">
                NIRANTAR
              </span>
              <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-md bg-[#00FF9D]/10 border border-[#00FF9D]/30 text-[#00FF9D] tracking-wide">
                V0.1
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium tracking-tight">
              India's Resilient AI Public Infrastructure Gateway
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 bg-[#090f1e]/90 p-1.5 rounded-2xl border border-white/[0.08] shadow-inner">
          <button
            onClick={() => setActiveTab('citizen')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
              activeTab === 'citizen'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/25 scale-[1.02]'
                : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.05]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Citizen SAATHI
          </button>

          <button
            onClick={() => setActiveTab('command')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
              activeTab === 'command'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/25 scale-[1.02]'
                : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.05]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Command Center
          </button>

          <button
            onClick={() => setActiveTab('benchmarks')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
              activeTab === 'benchmarks'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/25 scale-[1.02]'
                : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.05]'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            5-Model Benchmark
          </button>

        </nav>

        {/* Status Pill */}
        <div className="hidden lg:flex items-center gap-3">
          <span className="text-slate-400 font-mono text-[11px]">Provider status: configured at runtime</span>
        </div>
      </div>
    </header>
  );
};
