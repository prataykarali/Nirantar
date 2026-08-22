import React, { useState } from 'react';
import { Search, Sparkles, ArrowRight, CheckCircle2, FileText, Clock, CreditCard } from 'lucide-react';

interface DiscoverPageProps {
  onNavigate: (route: string) => void;
  initialQuery?: string;
}

export const DiscoverPage: React.FC<DiscoverPageProps> = ({ onNavigate, initialQuery = '' }) => {
  const [query, setQuery] = useState(initialQuery);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [selectedAudience, setSelectedAudience] = useState<string | null>(null);

  const GOALS = [
    { id: 'document', title: 'Get a document', desc: 'Certificates, licenses & proofs' },
    { id: 'update', title: 'Update my details', desc: 'Address, name, phone changes' },
    { id: 'payment', title: 'Make a payment', desc: 'Challan, dues & service fees' },
    { id: 'problem', title: 'Resolve a problem', desc: 'Grievance & discrepancy support' },
  ];

  const AUDIENCES = ['For myself', 'For family member', 'For business / startup'];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* HEADER */}
      <div className="space-y-2 text-center md:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          PAGE 02 — DISCOVER
        </div>
        <h1 className="text-3xl md:text-4xl font-display font-black text-white">Let's find the right service.</h1>
        <p className="text-slate-300 text-sm">Answer 2 simple questions to get your personalized guided journey.</p>
      </div>

      {/* QUESTION 1 */}
      <div className="rounded-3xl border border-white/10 bg-[#091024]/80 p-6 md:p-8 space-y-4 backdrop-blur-md shadow-xl">
        <h2 className="text-sm font-mono font-bold text-indigo-300 uppercase tracking-wider">
          Step 1: What are you trying to do?
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {GOALS.map((goal) => (
            <button
              key={goal.id}
              onClick={() => setSelectedGoal(goal.id)}
              className={`p-5 rounded-2xl text-left border transition-all ${
                selectedGoal === goal.id
                  ? 'bg-indigo-600/20 border-indigo-400 text-white shadow-lg shadow-indigo-500/20 scale-[1.01]'
                  : 'bg-white/5 border-white/10 text-slate-200 hover:border-indigo-500/30 hover:bg-white/[0.08]'
              }`}
            >
              <h3 className="font-bold text-base">{goal.title}</h3>
              <p className="text-xs text-slate-400 mt-1">{goal.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* QUESTION 2 */}
      {selectedGoal && (
        <div className="rounded-3xl border border-white/10 bg-[#091024]/80 p-6 md:p-8 space-y-4 backdrop-blur-md shadow-xl animate-in fade-in duration-300">
          <h2 className="text-sm font-mono font-bold text-indigo-300 uppercase tracking-wider">
            Step 2: Who is this for?
          </h2>

          <div className="flex flex-wrap gap-3">
            {AUDIENCES.map((aud) => (
              <button
                key={aud}
                onClick={() => setSelectedAudience(aud)}
                className={`px-5 py-3 rounded-2xl text-sm font-bold border transition-all ${
                  selectedAudience === aud
                    ? 'bg-purple-600/30 border-purple-400 text-white shadow-lg shadow-purple-500/20'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:border-purple-500/30'
                }`}
              >
                {aud}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* MATCH RESULT CARD */}
      {selectedGoal && selectedAudience && (
        <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-[#091024] to-[#091024] p-6 md:p-8 space-y-6 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-3 text-emerald-400 font-mono text-xs font-bold">
            <CheckCircle2 className="w-5 h-5" />
            We think this is the service you need
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-display font-bold text-white">Address / Identity Certificate Service</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Official government verification service for residential and identity certification. Guided directly through NIRANTAR.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
              <FileText className="w-5 h-5 text-indigo-400 shrink-0" />
              <div>
                <span className="text-[10px] font-mono text-slate-400">DOCUMENTS</span>
                <p className="text-xs font-bold text-white">3 Documents needed</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
              <Clock className="w-5 h-5 text-purple-400 shrink-0" />
              <div>
                <span className="text-[10px] font-mono text-slate-400">ESTIMATED TIME</span>
                <p className="text-xs font-bold text-white">~10–15 Minutes</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] font-mono text-slate-400">PAYMENT</span>
                <p className="text-xs font-bold text-white">₹50 Statutory fee</p>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={() => onNavigate('guide')}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold text-base shadow-xl shadow-emerald-500/20 transition-all flex items-center gap-2"
            >
              See your journey <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
