import React, { useState } from 'react';
import {
  HelpCircle,
  Search,
  Ticket,
  CreditCard,
  RefreshCw,
  MapPin,
  User,
  ChevronDown,
  ChevronUp,
  Bot,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  PhoneCall,
  Compass,
} from 'lucide-react';
import { useJourney } from '../context/JourneyContext';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
  badge?: string;
}

export const HelpCenterPage: React.FC<{ onOpenNiraChat?: () => void }> = ({ onOpenNiraChat }) => {
  const { sendNiraQuery, setShowVisualDiagram } = useJourney();

  const [activeCategory, setActiveCategory] = useState('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const categories = [
    { id: 'popular', label: 'Popular Topics', icon: Sparkles },
    { id: 'booking', label: 'Booking & Tickets', icon: Ticket },
    { id: 'payments', label: 'Payments & Wallet', icon: CreditCard },
    { id: 'safety', label: 'Safety & Zero-PII', icon: ShieldCheck },
    { id: 'tracking', label: 'GPS Live Radar', icon: MapPin },
    { id: 'account', label: 'Profile & DigiLocker', icon: User },
    { id: 'general', label: 'Helpline & Rules', icon: HelpCircle },
  ];

  const faqs: FAQItem[] = [
    {
      question: 'How to book a train ticket on Nirantar?',
      answer:
        'Simply search your origin and destination stations, select your preferred express train and travel class (e.g. 3A, 2A, SL), autofill passenger details with zero-PII protection, and complete payment with 1 tap.',
      category: 'popular',
      badge: 'Getting Started',
    },
    {
      question: 'What is the "I\'m Stuck" button and how does it help?',
      answer:
        'The 🆘 "I\'m Stuck" button in the top bar provides instant 1-tap assistance for finding trains, form guidance with green spotlight arrows, payment questions, going back with 0 data loss, or explaining the current screen.',
      category: 'popular',
      badge: 'Citizen UX',
    },
    {
      question: 'What is the "Page Guide" visual diagram?',
      answer:
        'Tapping 🧭 "Page Guide" in the top bar opens an interactive architectural flowchart of your current screen, showing exactly where you are in the 4-step booking process with live stage indicators.',
      category: 'popular',
      badge: 'Visual Copilot',
    },
    {
      question: 'What happens if payment times out or says "Payment Unknown"?',
      answer:
        'NIRANTAR protects your money with state preservation! If a transaction fails or times out, your booking details remain locked on Step 4 so you can verify payment status without risking a double charge.',
      category: 'payments',
      badge: 'Double-Verify',
    },
    {
      question: 'Does Nira see my passwords, OTPs, or UPI PINs?',
      answer:
        'NEVER. NIRANTAR strictly enforces zero-PII isolation. All passwords, OTPs, CVVs, card numbers, and banking PINs are redacted before reaching AI models. Sensitive credentials bypass the AI entirely.',
      category: 'safety',
      badge: 'Zero-PII Shield',
    },
    {
      question: 'How does live GPS train tracking work?',
      answer:
        'Navigate to the Track tab or ask Nira: "Track 12302" or "Where is my train?". NIRANTAR provides real-time speed, live platform numbers, deboarding door direction, and approaching station timelines.',
      category: 'tracking',
      badge: 'RTIS GPS',
    },
    {
      question: 'How do I resume an interrupted booking?',
      answer:
        'If you switch to Live Tracking or explore other pages mid-booking, Nira pauses your session and saves it in the Task Stack. A "Journey Paused" card appears in Nira\'s drawer allowing you to resume with 100% of your passenger details intact.',
      category: 'booking',
    },
    {
      question: 'What is the Tatkal booking window?',
      answer:
        'AC Tatkal (1A, 2A, 3A, CC, EC) booking opens at 10:00 AM IST and Non-AC Tatkal (Sleeper, Second Sitting) opens at 11:00 AM IST, one day prior to the train departure date from origin.',
      category: 'booking',
    },
    {
      question: 'How long do refunds take to process upon cancellation?',
      answer:
        'When using the ₹10,000 Citizen Travel Wallet, refunds are instant (0 seconds). For UPI payments, refunds settle in 2 to 4 hours. Net Banking and Card refunds reflect within 2-3 working days.',
      category: 'payments',
    },
  ];

  const filteredFaqs = faqs.filter((item) => {
    const matchesCategory = activeCategory === 'popular' || item.category === activeCategory;
    const matchesSearch =
      searchQuery === '' ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 select-none font-sans text-slate-800 animate-in fade-in duration-200">
      {/* ═══════════════════════════════════════════════════════════════════
          1. CLEAN & AIRY HERO BANNER WITH SUBTLE ATMOSPHERIC GLOW
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative rounded-[32px] p-6 sm:p-8 bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-950 text-white shadow-xl overflow-hidden border border-purple-500/20">
        <div className="absolute -right-10 -bottom-10 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/4 -top-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-purple-200 text-xs font-mono font-bold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-purple-300" />
            <span>Nirantar 24x7 Citizen Knowledge Base</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
            How can we help you?
          </h1>

          <p className="text-xs sm:text-sm text-purple-200/80 font-medium">
            Search answers about railway bookings, GPS tracking, zero-PII security, or ask Nira Copilot.
          </p>

          {/* Clean Search Input */}
          <div className="relative pt-1 max-w-xl">
            <Search className="w-4 h-4 text-purple-300 absolute left-4 top-4.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search help topics (e.g. 'I\'m Stuck', 'Payment Failed', 'Tatkal', 'GPS')..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-purple-300/30 text-white placeholder-purple-300/60 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition-all backdrop-blur-md"
            />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          2. STREAMLINED FAQ ACCORDION (SLEEK 2-COLUMN LAYOUT)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Category Rail (4 cols) */}
        <div className="lg:col-span-4 space-y-1.5 bg-white/80 backdrop-blur-md rounded-3xl p-3 shadow-xs border border-purple-100/60">
          <p className="text-[11px] font-bold text-slate-400 px-3 py-1 uppercase tracking-wider">
            Categories
          </p>
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setExpandedIndex(0);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-purple-700 text-white shadow-md shadow-purple-700/20'
                    : 'text-slate-700 hover:bg-purple-50/70 hover:text-purple-950'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{cat.label}</span>
                </div>
                <ArrowRight className={`w-3.5 h-3.5 transition-transform ${isActive ? 'translate-x-0.5' : 'opacity-30'}`} />
              </button>
            );
          })}

          {/* Quick Page Diagram Trigger */}
          <div className="pt-2 border-t border-purple-50">
            <button
              onClick={() => setShowVisualDiagram(true)}
              className="w-full p-2.5 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-950 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border border-purple-200/60"
            >
              <Compass className="w-4 h-4 text-purple-700" />
              <span>Open Page Flow Diagram ➔</span>
            </button>
          </div>
        </div>

        {/* Right FAQ Accordion (8 cols) */}
        <div className="lg:col-span-8 space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-xs sm:text-sm text-slate-900">
              {categories.find((c) => c.id === activeCategory)?.label || 'Frequently Asked Questions'}
            </h3>
            <span className="text-xs font-semibold text-slate-400">
              {filteredFaqs.length} article{filteredFaqs.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-2">
            {filteredFaqs.map((faq, idx) => {
              const isExpanded = expandedIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-purple-100/70 shadow-2xs overflow-hidden transition-all hover:border-purple-200"
                >
                  <button
                    onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                    className="w-full p-4 text-left flex items-center justify-between gap-3 hover:bg-purple-50/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                        {faq.question}
                      </span>
                      {faq.badge && (
                        <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 shrink-0">
                          {faq.badge}
                        </span>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-purple-700 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed border-t border-purple-50/60 bg-purple-50/20 animate-in fade-in duration-150">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          3. CLEAN 24x7 ASSISTANCE STRIP (MINIMAL & SLEEK)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 text-white shadow-md border border-purple-500/20 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-white">Railway Helpline & Nira Copilot</h4>
            <p className="text-[11px] text-slate-400">
              Dial <strong>139</strong> for Railway emergency support or ask Nira anything.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (onOpenNiraChat) onOpenNiraChat();
            else sendNiraQuery("I need help with my journey.");
          }}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
        >
          <Bot className="w-4 h-4" />
          <span>Ask Nira Copilot</span>
        </button>
      </div>
    </div>
  );
};

export default HelpCenterPage;
