import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  FileText,
  MapPin,
  CreditCard,
  AlertTriangle,
  HelpCircle,
  ChevronRight,
  Shield,
  Zap,
  Users,
  Award,
  MessageSquare,
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (route: string, query?: string) => void;
  onOpenNira: (initialQuery?: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onOpenNira }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate('discover', searchQuery);
    }
  };

  const POPULAR_SEARCHES = ['Aadhaar Update', 'Caste Certificate', 'Driving Licence', 'PAN Card'];

  return (
    <div className="space-y-10 pb-12">
      {/* HERO SECTION */}
      <section className="relative rounded-3xl p-8 md:p-12 overflow-hidden border border-indigo-500/20 bg-gradient-to-b from-[#0e1738] via-[#091026] to-[#060a19] shadow-2xl">
        {/* Background glow effects */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          {/* Hero Tag */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono font-bold tracking-wide shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            Smart guidance for every citizen
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-6xl font-display font-black text-white tracking-tight leading-tight">
            Government services, <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-300 bg-clip-text text-transparent">
              without the guesswork.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base md:text-lg text-slate-300 font-medium max-w-xl">
            Tell us what you need. We'll guide you through the right service, step by step.
          </p>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative max-w-2xl pt-2">
            <div className="relative flex items-center bg-[#070d22]/90 border border-indigo-400/30 hover:border-purple-400/50 rounded-2xl p-2 shadow-2xl backdrop-blur-xl transition-all group">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="What do you need help with today?"
                className="w-full bg-transparent px-5 py-3 text-base text-white placeholder-slate-400 focus:outline-none"
              />
              <button
                type="submit"
                className="h-12 w-12 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 text-white flex items-center justify-center shadow-lg shadow-purple-500/30 shrink-0 transition-transform active:scale-95"
              >
                <Sparkles className="w-5 h-5" />
              </button>
            </div>
          </form>

          {/* Popular Searches */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs font-mono text-slate-400 mr-1">Popular searches:</span>
            {POPULAR_SEARCHES.map((tag) => (
              <button
                key={tag}
                onClick={() => onNavigate('discover', tag)}
                className="text-xs bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-400/40 text-slate-200 px-3 py-1.5 rounded-full transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 6 GUIDED CARDS GRID */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[
          {
            icon: <Search className="w-6 h-6 text-blue-400" />,
            title: "Find a service",
            desc: "Find the right government service for your need.",
            route: "discover",
            gradient: "from-blue-500/20 to-cyan-500/10 border-blue-500/30",
            arrowColor: "bg-blue-500/20 text-blue-300",
          },
          {
            icon: <FileText className="w-6 h-6 text-emerald-400" />,
            title: "Apply for something",
            desc: "Start a new application with guided support.",
            route: "workspace",
            gradient: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30",
            arrowColor: "bg-emerald-500/20 text-emerald-300",
          },
          {
            icon: <MapPin className="w-6 h-6 text-amber-400" />,
            title: "Track my application",
            desc: "Check status and get real-time updates.",
            route: "tracking",
            gradient: "from-amber-500/20 to-orange-500/10 border-amber-500/30",
            arrowColor: "bg-amber-500/20 text-amber-300",
          },
          {
            icon: <CreditCard className="w-6 h-6 text-purple-400" />,
            title: "Check a payment",
            desc: "Verify payments and download receipts.",
            route: "payment",
            gradient: "from-purple-500/20 to-indigo-500/10 border-purple-500/30",
            arrowColor: "bg-purple-500/20 text-purple-300",
          },
          {
            icon: <AlertTriangle className="w-6 h-6 text-rose-400" />,
            title: "Something went wrong",
            desc: "Get help resolving issues faster.",
            route: "workspace",
            gradient: "from-rose-500/20 to-red-500/10 border-rose-500/30",
            arrowColor: "bg-rose-500/20 text-rose-300",
          },
          {
            icon: <HelpCircle className="w-6 h-6 text-sky-400" />,
            title: "I'm not sure",
            desc: "Answer a few questions, we'll guide you.",
            route: "discover",
            gradient: "from-sky-500/20 to-indigo-500/10 border-sky-500/30",
            arrowColor: "bg-sky-500/20 text-sky-300",
          },
        ].map((card, idx) => (
          <div
            key={idx}
            onClick={() => onNavigate(card.route)}
            className={`group cursor-pointer rounded-2xl p-6 border bg-gradient-to-br ${card.gradient} hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between shadow-lg backdrop-blur-md`}
          >
            <div className="space-y-3">
              <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 group-hover:bg-white/20 transition-colors">
                {card.icon}
              </div>
              <div>
                <h3 className="text-lg font-display font-bold text-white group-hover:text-purple-200 transition-colors">
                  {card.title}
                </h3>
                <p className="text-xs text-slate-300 mt-1 font-medium">{card.desc}</p>
              </div>
            </div>
            <div className="pt-6 flex justify-end">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${card.arrowColor} group-hover:translate-x-1 transition-transform`}>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* SECONDARY SECTION (2 COLUMNS: YOUR JOURNEYS & NEED HELP) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Your Journeys */}
        <div className="lg:col-span-8 rounded-3xl border border-white/10 bg-[#091024]/80 p-6 md:p-8 space-y-6 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-white">Your journeys</h2>
                <p className="text-xs text-slate-400">Continue where you left off</p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('tracking')}
              className="text-xs font-bold text-indigo-300 hover:text-white flex items-center gap-1 transition-colors"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {/* Active Journey 1 */}
            <div
              onClick={() => onNavigate('tracking')}
              className="group cursor-pointer p-4 md:p-5 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/[0.08] hover:border-emerald-500/40 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm group-hover:text-emerald-300 transition-colors">
                    Address Certificate
                  </h3>
                  <p className="text-xs font-mono text-slate-400">Application ID: NTR-20482</p>

                  <div className="mt-2 flex items-center gap-3">
                    <div className="w-36 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-emerald-400 h-full w-2/3 rounded-full" />
                    </div>
                    <span className="text-[11px] font-mono text-slate-300">Step 4 of 6 • Department review</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                <div className="text-right hidden sm:block">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    In progress
                  </span>
                  <p className="text-[10px] font-mono text-slate-400 mt-1">Updated 2 hours ago</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>

            {/* Active Journey 2 */}
            <div
              onClick={() => onNavigate('workspace')}
              className="group cursor-pointer p-4 md:p-5 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/[0.08] hover:border-amber-500/40 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm group-hover:text-amber-300 transition-colors">
                    Learner's License
                  </h3>
                  <p className="text-xs font-mono text-slate-400">Application ID: NTR-19873</p>

                  <div className="mt-2 flex items-center gap-3">
                    <div className="w-36 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-amber-400 h-full w-2/5 rounded-full" />
                    </div>
                    <span className="text-[11px] font-mono text-slate-300">Step 2 of 5 • Documents uploaded</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                <div className="text-right hidden sm:block">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Action required
                  </span>
                  <p className="text-[10px] font-mono text-slate-400 mt-1">Updated yesterday</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Need Help Card */}
        <div className="lg:col-span-4 rounded-3xl border border-purple-500/20 bg-gradient-to-b from-[#13193a] to-[#0b1029] p-6 md:p-8 space-y-6 flex flex-col justify-between shadow-xl backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 p-[1.5px] shadow-lg shadow-purple-500/30 flex items-center justify-center">
              <div className="h-full w-full bg-[#0b1029] rounded-[14px] flex items-center justify-center text-purple-300">
                <Sparkles className="w-6 h-6" />
              </div>
            </div>

            <h3 className="text-xl font-display font-bold text-white">Need help?</h3>
            <p className="text-sm text-slate-300 leading-relaxed font-medium">
              Nira is here to guide you at every step of your journey.
            </p>
          </div>

          <button
            onClick={() => onOpenNira('What services are available for address change?')}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-purple-500/30 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <MessageSquare className="w-4 h-4" />
            Chat with Nira
          </button>
        </div>
      </section>

      {/* BOTTOM SECURITY & TRUST BAR */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/10">
        {[
          {
            icon: <Shield className="w-5 h-5 text-indigo-400" />,
            title: "Secure & Private",
            desc: "Your data is safe with us",
          },
          {
            icon: <Zap className="w-5 h-5 text-purple-400" />,
            title: "Fast & Easy",
            desc: "Simple steps, quicker results",
          },
          {
            icon: <Users className="w-5 h-5 text-pink-400" />,
            title: "Citizen First",
            desc: "Designed for every Indian citizen",
          },
          {
            icon: <Award className="w-5 h-5 text-emerald-400" />,
            title: "Trusted Platform",
            desc: "Reliable. Transparent. Accountable.",
          },
        ].map((pillar, idx) => (
          <div key={idx} className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5">
            <div className="p-2 rounded-xl bg-white/5 shrink-0">{pillar.icon}</div>
            <div>
              <h4 className="text-xs font-bold text-white">{pillar.title}</h4>
              <p className="text-[11px] text-slate-400 font-medium">{pillar.desc}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};
