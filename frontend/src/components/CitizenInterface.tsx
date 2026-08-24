import React, { useState } from 'react';
import {
  Mic,
  Send,
  Train,
  CheckCircle2,
  MapPin,
  Clock,
  User,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { advanceCitizenJourney, sendCitizenQuery } from '../services/api';
import { TrainOption } from '../types';

type Phase = 'landing' | 'confirm' | 'journey';

const POPULAR = [
  { id: 'book', label: 'Book a train', query: 'I want to book an overnight train from Kolkata to Delhi tomorrow' },
  { id: 'check', label: 'Check booking', query: 'Check my booking status' },
  { id: 'passenger', label: 'Change passenger details', query: 'Change passenger details on my ticket' },
  { id: 'civic', label: 'Find a government service', query: 'I need a government certificate' },
];

export const CitizenInterface: React.FC = () => {
  const [language, setLanguage] = useState<'hi' | 'bn' | 'en'>('en');
  const [phase, setPhase] = useState<Phase>('landing');
  const [inputQuery, setInputQuery] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState('INTENT');
  const [intent, setIntent] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [confirmation, setConfirmation] = useState<any>(null);
  const [topOptions, setTopOptions] = useState<TrainOption[]>([]);
  const [selectedTrain, setSelectedTrain] = useState<TrainOption | null>(null);
  const [passengerName, setPassengerName] = useState('');
  const [passengerAge, setPassengerAge] = useState('30');
  const [passengers, setPassengers] = useState<Array<{ name: string; age: number }>>([]);
  const [booking, setBooking] = useState<any>(null);
  const [kavach, setKavach] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; sources?: Array<{ title: string; url: string }> }>>([]);

  const greet = (lang: 'hi' | 'bn' | 'en') =>
    lang === 'hi'
      ? 'नमस्ते। आपको क्या करना है?'
      : lang === 'bn'
        ? 'নমস্কার। আপনার কী প্রয়োজন?'
        : 'What do you need to do?';

  const handleLanguageChange = (newLang: 'hi' | 'bn' | 'en') => {
    setLanguage(newLang);
    setPhase('landing');
    setChatMessages([]);
    setInputQuery('');
    setConfirmation(null);
    setTopOptions([]);
    setSelectedTrain(null);
    setBooking(null);
  };

  const applyResponse = (res: any, userText?: string) => {
    if (userText) {
      setChatMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    }
    setIntent(res.intent);
    setSession(res.session);
    setStage(res.payload?.stage || stage);
    setKavach(res.payload?.kavach || null);
    setChatMessages((prev) => [
      ...prev,
      {
        sender: 'bot',
        text: res.message,
        sources: (res.payload?.web_results || []).map((source: any) => ({ title: source.title, url: source.url })),
      },
    ]);
    if (res.payload?.top_options?.length) {
      setTopOptions(res.payload.top_options);
    }
    if (res.action_required === 'CONFIRM_INTENT') {
      setConfirmation(res.payload?.confirmation);
      setPhase('confirm');
      return;
    }
    setPhase('journey');
    if (res.action_required === 'BOOKING_CONFIRMED' || res.action_required === 'RETRY_PAYMENT') {
      setBooking(res.payload);
    }
  };

  const startFromQuery = async (text: string) => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await sendCitizenQuery(text, language, session, 'INTENT');
      applyResponse(res, text);
      setInputQuery('');
    } catch (err) {
      console.error(err);
      setChatMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'I could not reach the service. No booking was created.' },
      ]);
      setPhase('journey');
    } finally {
      setLoading(false);
    }
  };

  const step = async (nextStage: string, selection: Record<string, unknown> = {}) => {
    setLoading(true);
    try {
      const res = await advanceCitizenJourney(intent, session, nextStage, selection);
      applyResponse(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl glass-card">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1600&auto=format&fit=crop&q=80"
            alt="Indian Railways"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#030712] via-[#030712]/90 to-transparent" />
        </div>
        <div className="relative z-10 p-6 md:p-8 flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00FF9D]/10 border border-[#00FF9D]/30 text-[#00FF9D] text-xs font-mono font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              Citizen experience — not a government menu
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-black text-white tracking-tight">
              NIRANTAR
            </h1>
            <p className="text-sm text-slate-300">{greet(language)}</p>
          </div>
          <div className="flex items-center gap-1.5 bg-[#060b14]/90 p-2 rounded-2xl border border-white/10">
            {(['hi', 'bn', 'en'] as const).map((code) => (
              <button
                key={code}
                onClick={() => handleLanguageChange(code)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold ${
                  language === code ? 'bg-[#00FF9D] text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                {code === 'hi' ? 'हिन्दी' : code === 'bn' ? 'বাংলা' : 'English'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {phase === 'landing' && (
        <div className="max-w-2xl mx-auto rounded-3xl border border-white/10 bg-[#060b14]/80 p-8 space-y-6">
          <h2 className="text-xl font-display font-bold text-center text-white">{greet(language)}</h2>
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && startFromQuery(inputQuery)}
            placeholder='"Book a train from Kolkata to Delhi tomorrow night"'
            className="w-full bg-[#030712] border border-white/10 rounded-2xl px-5 py-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#00FF9D]"
          />
          <button
            onClick={() => startFromQuery(inputQuery)}
            disabled={loading || !inputQuery.trim()}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#00FF9D] to-teal-400 text-slate-950 font-black disabled:opacity-30 cursor-pointer"
          >
            Continue
          </button>
          <div>
            <p className="text-xs font-mono text-slate-500 mb-2">Popular tasks</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {POPULAR.map((task) => (
                <button
                  key={task.id}
                  onClick={() => startFromQuery(task.query)}
                  className="text-left px-4 py-3 rounded-xl border border-white/10 text-sm text-slate-200 hover:border-[#00FF9D]/40 cursor-pointer"
                >
                  • {task.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {phase === 'confirm' && confirmation && (
        <div className="max-w-xl mx-auto rounded-3xl border border-white/10 bg-[#060b14]/80 p-8 space-y-4">
          <p className="text-xs font-mono text-[#00FF9D]">I understood this as</p>
          <h3 className="text-2xl font-display font-black text-white">{confirmation.intent_label}</h3>
          <ul className="text-sm text-slate-200 space-y-1">
            <li>{confirmation.origin} → {confirmation.destination}</li>
            <li>{confirmation.date}</li>
            <li>{confirmation.time_preference}</li>
            <li>{confirmation.passengers} passenger</li>
          </ul>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => step('CONFIRM', { confirmed: true })}
              className="flex-1 py-3 rounded-2xl bg-[#00FF9D] text-slate-950 font-black cursor-pointer"
            >
              Correct
            </button>
            <button
              onClick={() => {
                setPhase('landing');
                setConfirmation(null);
              }}
              className="flex-1 py-3 rounded-2xl border border-white/20 text-white font-bold cursor-pointer"
            >
              Edit
            </button>
          </div>
        </div>
      )}

      {phase === 'journey' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 rounded-3xl border border-white/10 bg-[#060b14]/80 flex flex-col min-h-[540px] overflow-hidden">
            <div className="px-6 py-3.5 border-b border-white/[0.08] flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-200">Guided journey · {stage}</span>
              {kavach && (
                <span className="text-[11px] font-mono text-[#00FF9D]">
                  Kavach {kavach.reason} · {kavach.risk_score}
                </span>
              )}
            </div>
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`h-9 w-9 rounded-2xl flex items-center justify-center ${msg.sender === 'user' ? 'bg-cyan-600' : 'bg-[#00FF9D] text-slate-950'}`}>
                    {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                  </div>
                  <div className={`p-4 rounded-3xl text-sm max-w-xl whitespace-pre-line ${msg.sender === 'user' ? 'bg-teal-700 text-white' : 'bg-[#0d1527] border border-white/10'}`}>
                    {msg.text}
                    {msg.sources?.map((source, i) => (
                      source.url ? (
                        <a key={i} href={source.url} target="_blank" rel="noreferrer" className="block text-cyan-300 text-[11px] mt-2">{source.title}</a>
                      ) : null
                    ))}
                  </div>
                </div>
              ))}

              {stage === 'SELECT' && topOptions.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {topOptions.map((opt) => (
                    <button
                      key={opt.train_no}
                      onClick={() => {
                        setSelectedTrain(opt);
                        step('SELECT', { train_no: opt.train_no, fare_inr: opt.fare_inr });
                      }}
                      className="text-left p-4 rounded-2xl border border-white/10 hover:border-[#00FF9D]/40 space-y-2 cursor-pointer"
                    >
                      <div className="flex justify-between">
                        <span className="font-bold text-white">{opt.train_name}</span>
                        <span className="text-[10px] font-mono text-cyan-300">#{opt.train_no}</span>
                      </div>
                      <div className="text-xs text-slate-300 flex justify-between">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{opt.source}</span>
                        <span>{opt.destination}</span>
                      </div>
                      <div className="text-xs flex justify-between text-slate-400">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{opt.departure_time} → {opt.arrival_time}</span>
                        <span className="text-[#00FF9D] font-bold">{opt.fare_inr !== 'Unavailable' ? `₹${opt.fare_inr}` : 'Fare n/a'}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {stage === 'PASSENGER' && (
                <div className="space-y-3 p-4 rounded-2xl border border-white/10">
                  <p className="text-sm font-bold">Passenger details</p>
                  <input
                    value={passengerName}
                    onChange={(e) => setPassengerName(e.target.value)}
                    placeholder="Name"
                    className="w-full bg-[#030712] border border-white/10 rounded-xl px-3 py-2 text-sm"
                  />
                  <input
                    value={passengerAge}
                    onChange={(e) => setPassengerAge(e.target.value)}
                    placeholder="Age"
                    className="w-full bg-[#030712] border border-white/10 rounded-xl px-3 py-2 text-sm"
                  />
                  <button
                    onClick={() => {
                      const next = [{ name: passengerName || 'Passenger', age: Number(passengerAge) || 30 }];
                      setPassengers(next);
                      step('PASSENGER', {
                        train_no: selectedTrain?.train_no,
                        fare_inr: selectedTrain?.fare_inr,
                        passengers: next,
                      });
                    }}
                    className="px-4 py-2 rounded-xl bg-[#00FF9D] text-slate-950 font-bold cursor-pointer"
                  >
                    Continue
                  </button>
                </div>
              )}

              {stage === 'REVIEW' && (
                <div className="space-y-3 p-4 rounded-2xl border border-[#00FF9D]/30">
                  <p className="font-bold">Review</p>
                  <p className="text-sm text-slate-300">{selectedTrain?.train_name} · {selectedTrain?.train_no}</p>
                  <p className="text-sm text-slate-300">{passengers.map((p) => `${p.name}, ${p.age}`).join('; ')}</p>
                  <button
                    onClick={() =>
                      step('PAY', {
                        pay: true,
                        train_no: selectedTrain?.train_no,
                        fare_inr: selectedTrain?.fare_inr,
                        passengers,
                      })
                    }
                    className="px-4 py-2 rounded-xl bg-[#00FF9D] text-slate-950 font-black cursor-pointer"
                  >
                    Mock payment
                  </button>
                </div>
              )}

              {booking && (
                <div className="p-4 rounded-2xl border border-emerald-500/40 bg-emerald-950/30 space-y-1">
                  <p className="flex items-center gap-2 font-bold text-[#00FF9D]"><CheckCircle2 className="w-4 h-4" />{booking.status}</p>
                  {booking.pnr && <p className="font-mono text-sm">PNR {booking.pnr}</p>}
                  <p className="text-[11px] text-slate-400">Synthetic ticket. No real payment.</p>
                </div>
              )}

              {loading && <p className="text-xs font-mono text-[#00FF9D]">Working…</p>}
            </div>

            <div className="p-4 border-t border-white/10 flex gap-2">
              <button onClick={() => setIsRecording(!isRecording)} className={`p-3 rounded-2xl border cursor-pointer ${isRecording ? 'bg-rose-500' : 'border-white/10'}`}>
                <Mic className="w-4 h-4" />
              </button>
              <input
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && startFromQuery(inputQuery)}
                placeholder="Ask something else…"
                className="flex-1 bg-[#030712] border border-white/10 rounded-2xl px-4 py-2 text-sm"
              />
              <button onClick={() => startFromQuery(inputQuery)} className="p-3 rounded-2xl bg-[#00FF9D] text-slate-950 cursor-pointer">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <div className="p-5 rounded-3xl border border-white/10 space-y-2">
              <h3 className="text-xs font-mono font-bold text-slate-300 flex items-center gap-2">
                <Train className="w-4 h-4 text-[#00FF9D]" /> Journey
              </h3>
              <p className="text-[11px] text-slate-400">Intent → Search → Select → Passenger → Review → Pay</p>
            </div>
            <div className="p-5 rounded-3xl border border-white/10 space-y-2">
              <h3 className="text-xs font-mono font-bold text-slate-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#00FF9D]" /> Trust
              </h3>
              <p className="text-[11px] text-slate-400">
                Kavach scores the session. Dhara decides queues. Mock payment only — no live government systems.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
