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
  Zap,
  Clock,
  ShieldAlert,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import { useJourney } from '../context/JourneyContext';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
  badge?: string;
}

export const HelpCenterPage: React.FC<{ onOpenNiraChat?: () => void }> = ({ onOpenNiraChat }) => {
  const { sendNiraQuery, setShowVisualDiagram, startGuidanceTour, navigateTo } = useJourney();

  const [activeCategory, setActiveCategory] = useState('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const categories = [
    { id: 'popular', label: 'Popular Topics', icon: Sparkles, count: 3 },
    { id: 'booking', label: 'Booking & Tickets', icon: Ticket, count: 4 },
    { id: 'payments', label: 'Payments & Wallet', icon: CreditCard, count: 3 },
    { id: 'safety', label: 'Safety & Zero-PII', icon: ShieldCheck, count: 1 },
    { id: 'tracking', label: 'GPS Live Radar', icon: MapPin, count: 1 },
    { id: 'account', label: 'Profile & DigiLocker', icon: User, count: 1 },
    { id: 'general', label: 'Helpline & Rules', icon: HelpCircle, count: 2 },
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
      badge: 'Zero Data Loss',
    },
    {
      question: 'What is the Tatkal booking window?',
      answer:
        'AC Tatkal (1A, 2A, 3A, CC, EC) booking opens at 10:00 AM IST and Non-AC Tatkal (Sleeper, Second Sitting) opens at 11:00 AM IST, one day prior to the train departure date from origin.',
      category: 'booking',
      badge: 'Commercial Rules',
    },
    {
      question: 'Can RAC passengers board the train legally?',
      answer:
        'YES! RAC (Reservation Against Cancellation) passengers have a guaranteed legal right to board. Two RAC passengers share one side-lower berth as seating until a full berth clears upon cancellation.',
      category: 'booking',
      badge: 'Passenger Rights',
    },
    {
      question: 'How does the ₹10,000 Citizen Virtual Wallet work?',
      answer:
        'NIRANTAR provides a pre-funded ₹10,000 virtual balance for every citizen account. It enables instant 1-click checkout with zero payment gateway failure rates, eliminating bank OTP latency.',
      category: 'payments',
      badge: 'Virtual Wallet',
    },
    {
      question: 'How do refunds work on cancelled tickets?',
      answer:
        'When you cancel a ticket, NIRANTAR immediately recalculates the refund based on official Indian Railways cancellation slabs and logs the transaction in your Payment Ledger with bank ARN tracking.',
      category: 'payments',
      badge: 'Instant Refund',
    },
    {
      question: 'How does DigiLocker document verification work?',
      answer:
        'Your verified citizen ID is linked through DigiLocker OAuth. It automatically populates passenger age and identity details for quick verification without manual document uploads.',
      category: 'account',
      badge: 'DigiLocker Verified',
    },
  ];

  const filteredFaqs = faqs.filter((f) => {
    const matchesCategory = activeCategory === 'popular' || f.category === activeCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.badge && f.badge.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 font-sans select-none text-slate-800 animate-in fade-in duration-300">
      {/* ═══════════════════════════════════════════════════════════════════
          1. SPACIOUS HERO & SEARCH BANNER WITH SCENIC OVERLAY
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#1A0B2E] via-[#2A114E] to-[#160B30] text-white shadow-xl border border-purple-500/20 overflow-hidden">
        {/* Scenic Railway Knowledge Background Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden mix-blend-luminosity">
          <img
            src="/assets/images/help_center_banner.png"
            alt="Help Center Background"
            className="w-full h-full object-cover object-center"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#1A0B2E]/95 via-[#2A114E]/85 to-[#160B30]/75 pointer-events-none" />

        {/* Ambient background glow & SVG grid */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-600/20 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center md:text-left max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-bold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              <span>Nirantar Knowledge & AI Support</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              How can we assist your journey today?
            </h1>
            <p className="text-xs sm:text-sm text-purple-200/90 font-medium leading-relaxed">
              Explore step-by-step guidance, IRCTC commercial rules, live radar tracking, and instant AI assistance from Nira.
            </p>

            {/* Prominent Search Bar */}
            <div className="relative pt-2 max-w-xl">
              <Search className="w-4 h-4 text-purple-300 absolute left-4 top-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics: 'Tatkal', 'Payment Failed', 'RAC', 'GPS', 'Refund'..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-purple-300/30 text-white placeholder-purple-200/60 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all backdrop-blur-md shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-5 text-xs text-purple-300 hover:text-white font-bold bg-white/10 px-2 py-0.5 rounded-lg"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Large Mascot Teacher Illustration with Breathing Room */}
          <div className="shrink-0 flex items-center gap-3 justify-center">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl overflow-hidden shadow-2xl transition-transform hover:scale-105 duration-300">
              <img
                src="/assets/images/characters/nira_guide_teacher.jpg"
                alt="Nira Guide"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="hidden sm:block w-24 h-24 rounded-2xl overflow-hidden shadow-lg transition-transform hover:scale-105 duration-300 mt-4">
              <img
                src="/assets/images/characters/ananya_nira_duo.png"
                alt="Mascot Duo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          2. SPACIOUS 3-PILLAR GUIDANCE SECTION (Uncongested, Room to Breathe)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* CARD 1: GUIDANCE HIGHLIGHTS & TOUR */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-purple-100/80 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-black text-slate-900">Guidance Highlights</h2>
              </div>
              <button
                type="button"
                onClick={() => startGuidanceTour(0)}
                className="text-xs font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-3 py-1 rounded-full transition-colors cursor-pointer"
              >
                Interactive Tour ➔
              </button>
            </div>
            <p className="text-xs text-slate-500 font-medium">Common AI prompts Nira handles automatically:</p>
          </div>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => {
                if (onOpenNiraChat) onOpenNiraChat();
                sendNiraQuery("Show me the best train recommendations.");
              }}
              className="w-full text-left p-3 rounded-2xl bg-purple-50/60 hover:bg-purple-100/70 border border-purple-100 transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-800 group-hover:text-purple-950">"I recommend the best train"</p>
                <p className="text-[11px] text-slate-500">Auto-ranks speed, punctuality & fare</p>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 shrink-0">
                ✨ Rank
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigateTo('track')}
              className="w-full text-left p-3 rounded-2xl bg-indigo-50/60 hover:bg-indigo-100/70 border border-indigo-100 transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-950">"Where is my train right now?"</p>
                <p className="text-[11px] text-slate-500">Live GPS telemetry & platform arrivals</p>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-indigo-100 text-indigo-900 shrink-0">
                📍 Track
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onOpenNiraChat) onOpenNiraChat();
                sendNiraQuery("How does payment protection work?");
              }}
              className="w-full text-left p-3 rounded-2xl bg-emerald-50/60 hover:bg-emerald-100/70 border border-emerald-100 transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-950">"Is my payment protected?"</p>
                <p className="text-[11px] text-slate-500">Zero-PII isolation & instant refunds</p>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-emerald-600 text-white shrink-0">
                🛡️ Safe Pay
              </span>
            </button>
          </div>
        </div>

        {/* CARD 2: TIPS FROM NIRA WITH PROMINENT MASCOT */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-purple-100/80 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900">Tips from Nira</h2>
                <span className="text-[11px] text-slate-400 font-medium">Smart passenger advice</span>
              </div>
            </div>
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Active
            </span>
          </div>

          <div className="space-y-2.5">
            <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 flex items-start gap-2.5">
              <span className="text-base shrink-0">👥</span>
              <div>
                <p className="text-xs font-bold text-slate-800">Save Passenger Profiles</p>
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                  Store frequent travelers in your Profile for instant 1-click autofill during booking.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 flex items-start gap-2.5">
              <span className="text-base shrink-0">🔔</span>
              <div>
                <p className="text-xs font-bold text-slate-800">Waitlist Movement Radar</p>
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                  Track RAC clearance probabilities and chart preparation times automatically.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-50 to-teal-50 border border-purple-100 flex items-start gap-2.5">
              <span className="text-base shrink-0">🎙️</span>
              <div>
                <p className="text-xs font-bold text-slate-800">Voice & Multilingual</p>
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                  Ask Nira in Hindi, Bengali, or English for instant route answers and booking help.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: 5-STEP RAIL JOURNEY FLOW */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-purple-100/80 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <Compass className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-black text-slate-900">How Nirantar Works</h2>
            </div>
            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full">
              5 Simple Steps
            </span>
          </div>

          <div className="space-y-2">
            {[
              { num: '1', title: 'Search Trains', desc: 'Enter cities & date with natural language' },
              { num: '2', title: 'Select Express & Class', desc: 'View transparent berths, quota & rankings' },
              { num: '3', title: 'Autofill Passenger', desc: 'DigiLocker verified with zero-PII protection' },
              { num: '4', title: '1-Click Checkout', desc: 'Pre-funded citizen wallet with instant receipt' },
              { num: '5', title: 'Digital e-Ticket & Radar', desc: 'Download QR pass & track GPS telemetry' },
            ].map((step, idx) => (
              <div key={idx} className="flex items-center gap-3 p-2 rounded-xl hover:bg-purple-50/40 transition-colors">
                <span className="w-6 h-6 rounded-full bg-purple-700 text-white text-xs flex items-center justify-center font-black shrink-0 shadow-2xs">
                  {step.num}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 leading-none">{step.title}</p>
                  <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowVisualDiagram(true)}
            className="w-full py-2.5 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold text-xs flex items-center justify-center gap-2 border border-purple-200/60 transition-all cursor-pointer"
          >
            <Compass className="w-4 h-4 text-purple-700" />
            <span>View Full Architecture Flow ➔</span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          2B. INTERACTIVE VISUAL JARGON DECODER & ODDS METER
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-purple-100/80 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-purple-50 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5 text-purple-700" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900">Railway Jargon & Confirmation Probability Matrix</h3>
              <p className="text-xs text-slate-500 font-medium">Understand quota types, priority rankings, and boarding rights</p>
            </div>
          </div>
          <span className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full">
            Commercial Standards
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
          {[
            {
              term: 'Tatkal (CK)',
              title: 'Emergency Quota',
              odds: '95% Speed Required',
              oddsColor: 'text-amber-600 bg-amber-50 border-amber-200',
              barWidth: 'w-11/12 bg-amber-500',
              rule: 'Opens 10 AM (AC) & 11 AM (Non-AC) 1 day prior.',
              tip: 'Use Safe Autofill & Citizen Virtual Wallet for sub-30s checkout.',
              avatar: '/assets/images/characters/nira_robot_tablet.png',
            },
            {
              term: 'RAC',
              title: 'Guaranteed Boarding',
              odds: '100% Boarding Right',
              oddsColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
              barWidth: 'w-full bg-emerald-500',
              rule: 'Legal right to travel. 2 passengers share 1 Side-Lower berth.',
              tip: 'Berths automatically upgrade to CNF as confirmed seats cancel.',
              avatar: '/assets/images/characters/nira_conductor.jpg',
            },
            {
              term: 'GNWL',
              title: 'General Waitlist',
              odds: '85% Highest Clear Rate',
              oddsColor: 'text-purple-700 bg-purple-50 border-purple-200',
              barWidth: 'w-4/5 bg-purple-600',
              rule: 'Origin station quota. Always prioritized over remote quotas.',
              tip: 'First in line when RAC passengers convert to confirmed.',
              avatar: '/assets/images/characters/nira_guide_teacher.jpg',
            },
            {
              term: 'RLWL / PQWL',
              title: 'Remote / Pooled Waitlist',
              odds: '30% Moderate to Low',
              oddsColor: 'text-rose-700 bg-rose-50 border-rose-200',
              barWidth: 'w-1/3 bg-rose-500',
              rule: 'Intermediate station quota with limited cancellations.',
              tip: 'Consider booking from originating station for better clearance.',
              avatar: '/assets/images/characters/nira_explorer.jpg',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-gradient-to-b from-purple-50/40 via-white to-purple-50/20 border border-purple-100 hover:border-purple-300 transition-all space-y-2.5 shadow-2xs hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xs font-black text-slate-900 block">{item.term}</span>
                  <span className="text-[11px] font-bold text-purple-700">{item.title}</span>
                </div>
                <div className="w-8 h-8 rounded-xl overflow-hidden shadow-2xs shrink-0 bg-white border border-purple-100">
                  <img src={item.avatar} alt={item.term} className="w-full h-full object-contain" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="text-slate-500">Clearance Likelihood:</span>
                  <span className={`px-2 py-0.2 rounded-full border text-[10px] ${item.oddsColor}`}>{item.odds}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full rounded-full ${item.barWidth}`} />
                </div>
              </div>

              <div className="text-[11px] text-slate-600 font-medium leading-relaxed space-y-1 pt-1 border-t border-purple-50">
                <p><strong>Rule:</strong> {item.rule}</p>
                <p className="text-purple-900 font-semibold">💡 {item.tip}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          3. KNOWLEDGE BASE FAQ ACCORDION (Spacious 2-Column Layout)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Categories Sidebar (4 Cols) */}
        <div className="lg:col-span-4 space-y-2 bg-white rounded-3xl p-4 shadow-sm border border-purple-100">
          <div className="px-3 py-1 flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
              FAQ Categories
            </span>
            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
              {faqs.length} Topics
            </span>
          </div>

          <div className="space-y-1">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
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
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-purple-600'}`} />
                    <span>{cat.label}</span>
                  </div>
                  <ArrowRight
                    className={`w-3.5 h-3.5 transition-transform ${
                      isActive ? 'translate-x-0.5 text-white' : 'opacity-30'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Quick Mascot Info */}
          <div className="pt-3 border-t border-purple-50 flex items-center gap-3 p-2">
            <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-sm shrink-0">
              <img
                src="/assets/images/characters/nira_explorer.jpg"
                alt="Nira Explorer"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-[11px] leading-tight">
              <p className="font-bold text-slate-800">Need specific rules?</p>
              <p className="text-slate-500">Ask Nira for official Railway commercial provisions anytime.</p>
            </div>
          </div>
        </div>

        {/* Right FAQ Questions List (8 Cols) */}
        <div className="lg:col-span-8 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-black text-sm sm:text-base text-slate-900">
              {categories.find((c) => c.id === activeCategory)?.label || 'Frequently Asked Questions'}
            </h3>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
              {filteredFaqs.length} article{filteredFaqs.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-2.5">
            {filteredFaqs.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-purple-100 space-y-2">
                <p className="text-sm font-bold text-slate-700">No articles matched "{searchQuery}"</p>
                <p className="text-xs text-slate-400">Try searching another term or ask Nira directly.</p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 rounded-xl bg-purple-700 text-white font-bold text-xs mt-2"
                >
                  Clear Search
                </button>
              </div>
            ) : (
              filteredFaqs.map((faq, idx) => {
                const isExpanded = expandedIndex === idx;
                return (
                  <div
                    key={idx}
                    className={`bg-white rounded-3xl border transition-all overflow-hidden ${
                      isExpanded
                        ? 'border-purple-300 shadow-md ring-1 ring-purple-200'
                        : 'border-purple-100 hover:border-purple-200 shadow-xs'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                      className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 hover:bg-purple-50/30 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-black text-xs sm:text-sm text-slate-900 leading-snug">
                          {faq.question}
                        </span>
                        {faq.badge && (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 shrink-0 hidden sm:inline-block">
                            {faq.badge}
                          </span>
                        )}
                      </div>
                      <div className="w-7 h-7 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-purple-700" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed border-t border-purple-50 bg-gradient-to-b from-purple-50/30 to-white animate-in fade-in duration-150">
                        <p>{faq.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          4. 24x7 ASSISTANCE STRIP (Airy, Modern, Welcoming)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white shadow-xl border border-purple-500/20 flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md shrink-0">
            <img
              src="/assets/images/characters/nira_conductor.jpg"
              alt="Nira Conductor"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h4 className="font-black text-sm sm:text-base text-white">
                Official Helpline & Nira AI Copilot
              </h4>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30">
                24x7 Active
              </span>
            </div>
            <p className="text-xs text-purple-200/80 font-medium">
              Dial <strong>139</strong> for Railway emergency support or chat with Nira for instant answers anytime.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (onOpenNiraChat) onOpenNiraChat();
            else sendNiraQuery("I need help with my journey.");
          }}
          className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm transition-all cursor-pointer shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 active:scale-95 shrink-0"
        >
          <Bot className="w-4 h-4" />
          <span>Chat with Nira Copilot</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default HelpCenterPage;
