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
  Inbox,
  ArrowRight,
  ShieldCheck,
  Headphones,
  Compass,
  AlertTriangle,
  Zap,
  PhoneCall,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useJourney } from '../context/JourneyContext';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
  highlightBadge?: string;
}

export const HelpCenterPage: React.FC<{ onOpenNiraChat?: () => void }> = ({ onOpenNiraChat }) => {
  const {
    navigateTo,
    setShowImStuck,
    setEasyMode,
    easyMode,
    startGuidanceTour,
  } = useJourney();

  const [activeCategory, setActiveCategory] = useState('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const categories = [
    { id: 'popular', label: 'Popular Topics', icon: Inbox },
    { id: 'features', label: 'Citizen Features', icon: Sparkles },
    { id: 'booking', label: 'Booking & Tickets', icon: Ticket },
    { id: 'payments', label: 'Payments & Wallet', icon: CreditCard },
    { id: 'safety', label: 'Safety & Privacy', icon: ShieldCheck },
    { id: 'tracking', label: 'Train Tracking', icon: MapPin },
    { id: 'general', label: 'Helpline & Rules', icon: HelpCircle },
  ];

  const faqs: FAQItem[] = [
    {
      question: 'What is the "I\'m Stuck" button and how does it help?',
      answer:
        'The 🆘 "I\'m Stuck" button in the top bar is designed for confused, elderly, or first-time users. Tapping it opens 5 direct assistance paths: finding trains, form assistance with green spotlight arrows, payment questions, returning to a previous step with 0 data loss, or a plain-language explanation of the current screen.',
      category: 'features',
      highlightBadge: 'Citizen UX',
    },
    {
      question: 'How does Easy Mode work for elderly or low-tech citizens?',
      answer:
        'Tapping 🧓 "Easy Mode" in the top bar immediately boosts typography size, enlarges clickable touch targets, simplifies railway terminology into everyday language (e.g. "Which seat do you want?" instead of complex quota codes), and increases visual contrast.',
      category: 'features',
      highlightBadge: 'Accessibility',
    },
    {
      question: 'How does Nira\'s Spotlight Guidance ("Show Me How") work?',
      answer:
        'Instead of dumping long paragraphs of text, Nira dims the background and shines a spotlight arrow directly at the exact button or form field on your screen (e.g. pointing to "Book Now" or "Passenger Details"). You stay in full control and perform the action yourself on the live interface.',
      category: 'features',
      highlightBadge: 'Visual Copilot',
    },
    {
      question: 'How does "Help Me Choose" recommend the best train?',
      answer:
        'You can tell Nira what matters most to you: 💰 Lowest Price, ⚡ Shortest Journey, 🕐 Convenient Evening Departure, or 🛏️ Best Comfort. Nira transparently filters the real 550+ train database and explains its reasoning based on factual speed, on-time history, and fares.',
      category: 'features',
      highlightBadge: 'Transparent AI',
    },
    {
      question: 'How to book a train ticket on NIRANTAR?',
      answer:
        'Search for your origin and destination stations, select your preferred train and travel class (e.g. 3A, 2A, SL), autofill passenger information with zero-PII protection, and complete payment via UPI, Card, Net Banking, or your ₹10,000 pre-loaded Citizen Travel Wallet.',
      category: 'popular',
    },
    {
      question: 'What happens if a payment fails or times out (Unknown Status)?',
      answer:
        'NIRANTAR protects your money with state preservation! If a transaction fails, your train choice and passenger details are saved on Step 4 so you can retry with 1 click. If payment status is "UNKNOWN", Nira advises: "Don\'t pay again yet" and verifies idempotency against the bank ledger.',
      category: 'popular',
      highlightBadge: 'Double-Verification',
    },
    {
      question: 'Does Nira see my passwords, OTPs, or UPI PINs?',
      answer:
        'NEVER. NIRANTAR enforces an architectural zero-PII security boundary. All passwords, OTPs, CVVs, card numbers, and payment PINs are stripped before reaching the AI context. Financial credentials bypass AI entirely.',
      category: 'safety',
      highlightBadge: 'Zero-PII Shield',
    },
    {
      question: 'How to track my train on Live GPS Radar?',
      answer:
        'Navigate to the Track page or ask Nira: "Track 12302" or "Where is my train?". NIRANTAR shows real-time speed, live platform numbers, deboarding door direction, and approaching station timelines with Indian Railway chimes.',
      category: 'tracking',
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
        'When booking with the Citizen Virtual Wallet, refunds are instant (0 seconds). For UPI payments, refunds settle in 2 to 4 hours. Net Banking and Card refunds reflect within 2-3 working days according to IRCTC statutory rules.',
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
    <div className="max-w-7xl mx-auto space-y-8 pb-12 select-none font-sans text-slate-800">
      {/* ═══════════════════════════════════════════════════════════════════
          1. HERO HEADER WITH GRADIENT & NIRA ASSISTANT PROMPT
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative rounded-[32px] p-6 sm:p-10 bg-gradient-to-br from-purple-950 via-indigo-950 to-slate-950 text-white shadow-xl overflow-hidden border border-purple-500/20">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-15 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-400 via-emerald-400 to-transparent" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-mono font-bold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-purple-300" />
            <span>24x7 Citizen Help & Accessibility Center</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            How can we help you today?
          </h1>

          <p className="text-xs sm:text-sm text-purple-200 font-medium leading-relaxed">
            Guidance for complex railway journeys, zero-PII security, instant payment recovery, and citizen accessibility features.
          </p>

          {/* Search Bar */}
          <div className="relative max-w-xl pt-2">
            <Search className="w-4 h-4 text-purple-400 absolute left-4 top-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search help topics (e.g. 'I\'m Stuck', 'Easy Mode', 'Payment Failed', 'Tatkal')..."
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-purple-300/30 text-white placeholder-purple-300/60 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition-all backdrop-blur-md"
            />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          2. THE 4 SIGNATURE CITIZEN ACCESSIBILITY FEATURES (INTERACTIVE CARDS)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-700" />
            <span>Citizen-First Accessibility & Guidance</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Designed specifically for confused, elderly, low-tech, or anxious travellers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: 🆘 I'm Stuck */}
          <div className="p-4.5 rounded-3xl bg-gradient-to-br from-rose-50 to-white border-2 border-rose-100 shadow-sm space-y-3 flex flex-col justify-between hover:shadow-md transition-all">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xl shadow-xs">
                🆘
              </div>
              <h3 className="font-bold text-sm text-slate-900">"I'm Stuck" Assistance</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Persistent top-bar safety button that opens 5 direct solutions: train search, form help, payment, going back, or page explanation.
              </p>
            </div>
            <button
              onClick={() => setShowImStuck(true)}
              className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <span>Try "I'm Stuck" Modal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2: 🧓 Easy Mode */}
          <div className="p-4.5 rounded-3xl bg-gradient-to-br from-emerald-50 to-white border-2 border-emerald-100 shadow-sm space-y-3 flex flex-col justify-between hover:shadow-md transition-all">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xl shadow-xs">
                🧓
              </div>
              <h3 className="font-bold text-sm text-slate-900">Easy Mode Toggle</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Boosts typography scale, simplifies confusing technical jargon into everyday words, and highlights high-contrast touch targets.
              </p>
            </div>
            <button
              onClick={() => setEasyMode(!easyMode)}
              className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                easyMode
                  ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900'
              }`}
            >
              <span>{easyMode ? 'Easy Mode is ON ✓' : 'Turn On Easy Mode'}</span>
            </button>
          </div>

          {/* Card 3: 🧭 Spotlight "Show Me How" */}
          <div className="p-4.5 rounded-3xl bg-gradient-to-br from-purple-50 to-white border-2 border-purple-100 shadow-sm space-y-3 flex flex-col justify-between hover:shadow-md transition-all">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shadow-xs">
                <Compass className="w-5 h-5 text-purple-700" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Spotlight Guidance</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Nira points directly at buttons with glowing green arrows and voice instructions on the live screen instead of taking over.
              </p>
            </div>
            <button
              onClick={() => {
                navigateTo('trains');
                setTimeout(() => startGuidanceTour(0), 300);
              }}
              className="w-full py-2 px-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <span>Launch Spotlight Demo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 4: 🛡️ Zero-PII Shield */}
          <div className="p-4.5 rounded-3xl bg-gradient-to-br from-indigo-50 to-white border-2 border-indigo-100 shadow-sm space-y-3 flex flex-col justify-between hover:shadow-md transition-all">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shadow-xs">
                <ShieldCheck className="w-5 h-5 text-indigo-700" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Zero-PII Safe Boundary</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your passwords, OTPs, CVVs, and UPI PINs never reach the AI. Only permitted travel slots (name, age, berth) are processed.
              </p>
            </div>
            <div className="py-2 px-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-center font-bold text-xs flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>100% Isolated Credentials</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          3. CATEGORIZED FAQ ACCORDION
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Category Tabs (4 cols) */}
        <div className="lg:col-span-4 space-y-2 bg-white rounded-3xl p-3 shadow-xs border border-purple-50">
          <p className="text-xs font-bold text-slate-400 px-3 py-1 uppercase tracking-wider">
            Help Categories
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
                <ArrowRight className={`w-3.5 h-3.5 transition-transform ${isActive ? 'translate-x-0.5' : 'opacity-40'}`} />
              </button>
            );
          })}
        </div>

        {/* Right FAQ Accordion (8 cols) */}
        <div className="lg:col-span-8 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-sm text-slate-900">
              {categories.find((c) => c.id === activeCategory)?.label || 'Frequently Asked Questions'}
            </h3>
            <span className="text-xs font-bold text-slate-400">
              {filteredFaqs.length} article{filteredFaqs.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-2.5">
            {filteredFaqs.map((faq, idx) => {
              const isExpanded = expandedIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-purple-100 shadow-2xs overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                    className="w-full p-4 text-left flex items-center justify-between gap-3 hover:bg-purple-50/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                        {faq.question}
                      </span>
                      {faq.highlightBadge && (
                        <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 shrink-0">
                          {faq.highlightBadge}
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
          4. 24x7 RAILWAY EMERGENCY & HELPLINE NUMBERS STRIP
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white shadow-lg border border-purple-400/30 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-amber-300 shadow-inner">
            <PhoneCall className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">Indian Railways 24x7 Citizen Helpline</h4>
            <p className="text-xs text-purple-200 font-medium">
              Dial <strong>139</strong> for single-window security, medical, and PNR status support.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenNiraChat && onOpenNiraChat()}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
          >
            <Bot className="w-4 h-4" />
            <span>Chat with Nira Copilot</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpCenterPage;
