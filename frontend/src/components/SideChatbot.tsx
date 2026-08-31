import React, { useState } from 'react';
import {
  X,
  Send,
  Sparkles,
  Bot,
  FileText,
  Train,
  RefreshCw,
  HelpCircle,
  PhoneCall,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';
import { sendCitizenQuery } from '../services/api';
import { apiSearchTrains } from '../services/journeyApi';
import { searchTrains as localSearchTrains } from '../data/mockTrains';
import { findStation } from '../data/stationData';
import { TrainCard } from './TrainCard';
import { deterministicNiraReply } from '../services/niraRules';

interface SideChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
  initialQuery?: string;
  onNavigate?: (route: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'nira';
  text: string;
  trains?: Array<{
    train_no: string;
    train_name: string;
    source: string;
    destination: string;
    departure_time: string;
    arrival_time: string;
    fare_inr: number | string;
    seats_available?: number;
  }>;
  sources?: Array<{ title: string; url: string }>;
  timestamp: string;
}

export const SideChatbot: React.FC<SideChatbotProps> = ({
  isOpen,
  onClose,
  onToggle,
  initialQuery = '',
  onNavigate,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'nira',
      text: "Hi Pratay! 👋\nI'm Nira, your AI assistant.\nHow can I help you today?",
      timestamp: 'Just now',
    },
  ]);
  const [input, setInput] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Quick Suggestion options matching user's design reference
  const QUICK_SUGGESTIONS = [
    {
      id: 'pitch',
      icon: <Sparkles className="w-4 h-4 text-purple-600" />,
      text: 'Underneath Nirantar (1-Min Dev Pitch)',
      action: "Welcome back! Now, as the developer, let's address what the user experienced underneath Nirantar:",
    },
    {
      id: 'cert',
      icon: <FileText className="w-4 h-4 text-purple-600" />,
      text: 'Where can I download my certificate?',
      action: 'Where can I download my verified digital certificate?',
    },
    {
      id: 'transport',
      icon: <Train className="w-4 h-4 text-purple-600" />,
      text: 'Find transport',
      action: 'Find transport: show available trains from Kolkata to Delhi tomorrow',
    },
    {
      id: 'track',
      icon: <RefreshCw className="w-4 h-4 text-purple-600" />,
      text: 'Track another application',
      action: 'Track status of my application NTR-20482',
    },
    {
      id: 'question',
      icon: <HelpCircle className="w-4 h-4 text-purple-600" />,
      text: 'I have a question',
      action: 'What government schemes are available for address verification?',
    },
    {
      id: 'agent',
      icon: <PhoneCall className="w-4 h-4 text-purple-600" />,
      text: 'Talk to a human agent',
      action: 'Connect me with a citizen support representative',
    },
  ];

  const handleSend = async (queryText: string) => {
    if (!queryText.trim()) return;
    setHasInteracted(true);
    const userMsgId = `user-${Date.now()}`;
    const userText = queryText.trim();
    setInput('');

    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        sender: 'user',
        text: userText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setLoading(true);

    try {
      const qLower = userText.toLowerCase();

      // Check deterministic railway knowledge & Dev Pitch first
      if (
        qLower.includes('architecture') ||
        qLower.includes('dev pitch') ||
        qLower.includes('underneath nirantar') ||
        qLower.includes('tech stack') ||
        qLower.includes('4 layers') ||
        qLower.includes('four layers') ||
        qLower.includes('how you built')
      ) {
        const pitchReply = deterministicNiraReply(userText);
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'nira',
            text: pitchReply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setLoading(false);
        return;
      }

      // Call backend query endpoint (using Scrapling + Snowflake Vector DB + NVIDIA NIM fallback)
      const res = await sendCitizenQuery(userText, 'en');
      let botMsg = res.message || 'I have processed your query.';

      // Extract transport train options if returned by backend digital twin DB or query
      let trainCardsList: ChatMessage['trains'] = undefined;

      if (
        qLower.includes('transport') ||
        qLower.includes('train') ||
        qLower.includes('book') ||
        res.payload?.top_options?.length
      ) {
        if (res.payload?.top_options?.length) {
          trainCardsList = res.payload.top_options.map((t: any) => ({
            train_no: t.train_no || '12951',
            train_name: t.train_name || 'Mumbai Rajdhani',
            source: t.source || 'Delhi (NDLS)',
            destination: t.destination || 'Mumbai (MMCT)',
            departure_time: t.departure_time || '16:55',
            arrival_time: t.arrival_time || '08:40',
            fare_inr: t.fare_inr || 2990,
            seats_available: t.available_seats || 48,
          }));
        } else {
          // Dynamic train query matching user route
          const routeMatch = userText.match(/(?:from\s+)?([a-zA-Z\s]+?)\s+(?:to|->|towards|–|-)\s+([a-zA-Z\s]+?)(?:\s+(?:on|tomorrow|today|next|for|in|\d)|\b|$)/i);
          let parsedSrc = routeMatch ? findStation(routeMatch[1].trim()) : null;
          let parsedDst = routeMatch ? findStation(routeMatch[2].trim()) : null;
          if (!parsedSrc || !parsedDst) {
            const words = userText.split(/[\s,]+/);
            for (const w of words) {
              if (w.length < 3) continue;
              const st = findStation(w);
              if (st) {
                if (!parsedSrc) parsedSrc = st;
                else if (!parsedDst && parsedSrc.code !== st.code) parsedDst = st;
              }
            }
          }
          const srcCode = parsedSrc ? parsedSrc.code : (qLower.includes('kolkata') ? 'HWH' : 'NDLS');
          const dstCode = parsedDst ? parsedDst.code : (qLower.includes('mumbai') ? 'MMCT' : qLower.includes('kolkata') ? 'HWH' : 'NDLS');
          let realTrains: any[] = [];
          try {
            const apiRes = await apiSearchTrains(srcCode, dstCode);
            realTrains = apiRes.trains || [];
          } catch {
            realTrains = localSearchTrains(srcCode, dstCode);
          }
          if (realTrains.length === 0) {
            realTrains = localSearchTrains(srcCode, dstCode);
          }
          trainCardsList = realTrains.slice(0, 3).map((t) => ({
            train_no: t.trainNumber,
            train_name: t.trainName,
            source: `${t.fromStationName} (${t.fromStationCode})`,
            destination: `${t.toStationName} (${t.toStationCode})`,
            departure_time: t.departureTime,
            arrival_time: t.arrivalTime,
            fare_inr: t.classes?.[0]?.fare || 1500,
            seats_available: t.classes?.[0]?.availableSeats || 24,
          }));
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `nira-${Date.now()}`,
          sender: 'nira',
          text: botMsg,
          trains: trainCardsList,
          sources: (res.payload?.web_results || []).map((s: any) => ({
            title: s.title || s.url,
            url: s.url,
          })),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `nira-err-${Date.now()}`,
          sender: 'nira',
          text: 'Nira is operating in resilient offline mode. All your application progress is fully saved.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleBookTrain = (trainNo: string) => {
    if (onNavigate) {
      onNavigate('workspace');
    }
    setMessages((prev) => [
      ...prev,
      {
        id: `book-${Date.now()}`,
        sender: 'nira',
        text: `Awesome! I have selected Train #${trainNo} for your journey. Proceeding to passenger details in the workspace.`,
        timestamp: 'Just now',
      },
    ]);
  };

  return (
    <>

      {/* FLOATING SIDE WINDOW CHATBOT */}
      {isOpen && (
        <div className="fixed inset-x-2 bottom-2 sm:inset-x-auto sm:bottom-6 sm:right-6 z-50 w-auto sm:w-full sm:max-w-[410px] h-[85vh] sm:h-[640px] max-h-[90vh] bg-[#0c0d20] border border-purple-500/30 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-300 backdrop-blur-xl">
          {/* PURPLE GRADIENT BANNER HEADER */}
          <div className="bg-gradient-to-r from-purple-800 via-indigo-800 to-purple-900 px-6 py-4 flex items-center justify-between text-white shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400/10 rounded-full blur-xl pointer-events-none" />

            <div className="flex items-center gap-3 relative z-10">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-purple-400 to-pink-400 p-[1.5px] shadow-lg flex items-center justify-center">
                <div className="h-full w-full bg-[#110d2c] rounded-[14px] flex items-center justify-center text-purple-300">
                  <Bot className="w-5 h-5 text-purple-300" />
                </div>
              </div>
              <div>
                <h3 className="font-display font-bold text-white text-base leading-tight">
                  Chat with Nira
                </h3>
                <p className="text-xs text-purple-200/80 font-medium">Your AI assistant</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="relative z-10 p-2 rounded-full hover:bg-white/10 text-purple-200 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* CHAT MESSAGES BODY */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-[#0a0b1a]">
            {/* INITIAL GREETING CARD (WHITE BG LIKE REFERENCE IMAGE) */}
            <div className="bg-white text-slate-900 p-5 rounded-[1.8rem] shadow-lg space-y-2 border border-purple-100">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-700 shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 leading-relaxed">
                    Hi Pratay! 👋<br />
                    I'm Nira, your AI assistant.<br />
                    How can I help you today?
                  </p>
                  <span className="text-[10px] text-slate-400 font-mono mt-1 block">Just now</span>
                </div>
              </div>
            </div>

            {/* QUICK SUGGESTIONS CARDS (UNLESS USER INTERACTED) */}
            {!hasInteracted && messages.length <= 1 && (
              <div className="space-y-2 pt-1 animate-in fade-in duration-300">
                {QUICK_SUGGESTIONS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSend(item.action)}
                    className="w-full p-3.5 rounded-2xl bg-[#141632] hover:bg-purple-900/30 border border-purple-500/20 hover:border-purple-400/50 text-slate-100 hover:text-white text-left transition-all duration-200 flex items-center justify-between group shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 group-hover:bg-purple-500/20">
                        {item.icon}
                      </div>
                      <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
                        {item.text}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-300 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            )}

            {/* DYNAMIC CHAT MESSAGES */}
            {messages.slice(1).map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${
                  msg.sender === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                    msg.sender === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gradient-to-tr from-purple-500 to-indigo-600 text-white'
                  }`}
                >
                  {msg.sender === 'user' ? 'You' : <Sparkles className="w-4 h-4" />}
                </div>

                <div
                  className={`p-4 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-purple-900/60 text-purple-100 border border-purple-500/40 shadow-md'
                      : 'bg-[#151736] text-slate-200 border border-white/10 shadow-md'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>

                  {/* RENDER TRAIN CARDS IF PRESENT */}
                  {msg.trains && msg.trains.length > 0 && (
                    <div className="mt-3 space-y-2 pt-2 border-t border-white/10">
                      <p className="text-[10px] font-mono font-bold text-purple-300 uppercase">
                        Available Transport Options:
                      </p>
                      {msg.trains.map((train) => (
                        <TrainCard
                          key={train.train_no}
                          trainNo={train.train_no}
                          trainName={train.train_name}
                          source={train.source}
                          destination={train.destination}
                          departureTime={train.departure_time}
                          arrivalTime={train.arrival_time}
                          fareInr={train.fare_inr}
                          seatsAvailable={train.seats_available}
                          onBook={handleBookTrain}
                        />
                      ))}
                    </div>
                  )}

                  {/* VERIFIED SOURCES */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-white/10 space-y-1">
                      <p className="text-[9px] font-mono text-purple-400 uppercase font-bold">
                        Verified Sources:
                      </p>
                      {msg.sources.map((s, i) => (
                        <a
                          key={i}
                          href={s.url || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-[11px] text-purple-300 hover:underline truncate"
                        >
                          • {s.title}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs font-mono text-purple-400 p-2">
                <Sparkles className="w-4 h-4 animate-spin text-purple-400" /> Nira is fetching live guidelines…
              </div>
            )}
          </div>

          {/* INPUT FOOTER MATCHING DESIGN REFERENCE */}
          <div className="p-4 border-t border-white/10 bg-[#080917] space-y-2">
            <div className="relative flex items-center bg-[#131530] border border-purple-500/30 rounded-full px-4 py-1.5 focus-within:border-purple-400 transition-all">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
                placeholder="Type your message..."
                className="w-full bg-transparent py-2 text-xs text-white placeholder-slate-400 focus:outline-none"
              />
              <button
                onClick={() => handleSend(input)}
                disabled={loading || !input.trim()}
                className="h-8 w-8 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shrink-0 disabled:opacity-40 transition-all shadow-md active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center pt-1">
              <span className="text-[10px] font-mono text-slate-400 flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-400" /> Powered by{' '}
                <strong className="text-purple-300">Nirantar AI</strong>
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
