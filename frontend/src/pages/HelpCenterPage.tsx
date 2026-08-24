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
} from 'lucide-react';
import { useJourney } from '../context/JourneyContext';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export const HelpCenterPage: React.FC<{ onOpenNiraChat?: () => void }> = ({ onOpenNiraChat }) => {
  const { navigateTo } = useJourney();
  const [activeCategory, setActiveCategory] = useState('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const categories = [
    { id: 'popular', label: 'Popular Topics', icon: Inbox },
    { id: 'booking', label: 'Booking & Tickets', icon: Ticket },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'refunds', label: 'Refunds', icon: RefreshCw },
    { id: 'tracking', label: 'Train Tracking', icon: MapPin },
    { id: 'account', label: 'Account & Profile', icon: User },
    { id: 'general', label: 'General Queries', icon: HelpCircle },
  ];

  const faqs: FAQItem[] = [
    {
      question: 'How to book a train ticket?',
      answer:
        'Search for your origin and destination stations, select your preferred train and travel class (e.g. 3A, 2A, SL), autofill passenger information, and complete mock payment with instant confirmation.',
      category: 'popular',
    },
    {
      question: 'How to track my train?',
      answer:
        'Navigate to the Track tab or enter your 5-digit Train Number / 10-digit PNR. NIRANTAR provides real-time GPS telemetry, delay predictions, and station stop timelines.',
      category: 'popular',
    },
    {
      question: 'Payment failed but amount deducted?',
      answer:
        'Do not pay twice! NIRANTAR implements a double-verification bridge. Click "Verify Payment" in the payment window or My Journeys. Any unverified deduction is automatically auto-refunded within 15 minutes.',
      category: 'popular',
    },
    {
      question: 'How to cancel my ticket?',
      answer:
        'Open My Journeys, locate your active booking, and click "Cancel Ticket". Refunds are calculated according to IRCTC statutory cancellation rules prior to chart preparation.',
      category: 'popular',
    },
    {
      question: 'How to change passenger details?',
      answer:
        'Name corrections (up to 3 characters) or gender updates can be made at designated Railway Reservation Counters with valid government photo ID before chart preparation.',
      category: 'popular',
    },
    {
      question: 'What is the Tatkal booking window?',
      answer:
        'AC Tatkal booking opens at 10:00 AM IST and Non-AC Tatkal opens at 11:00 AM IST, one day prior to the train departure date from origin.',
      category: 'booking',
    },
    {
      question: 'Which payment methods are supported?',
      answer:
        'UPI (Google Pay, PhonePe, Paytm, BHIM), Net Banking across all major scheduled Indian banks, Credit/Debit cards (RuPay, Visa, Mastercard), and digital wallets.',
      category: 'payments',
    },
    {
      question: 'How long do refunds take to process?',
      answer:
        'UPI refunds are settled within 2 to 4 hours. Net Banking and Card refunds typically reflect in your bank account within 2-3 working days.',
      category: 'refunds',
    },
    {
      question: 'How accurate is the GPS train tracking?',
      answer:
        'NIRANTAR consumes high-frequency railway RTIS (Real-Time Train Information System) feeds providing satellite-synchronized location and platform predictions.',
      category: 'tracking',
    },
    {
      question: 'How is my personal data protected?',
      answer:
        'NIRANTAR follows a Zero-PII offline-first architecture. Your payment credentials and identity numbers are never exposed to AI context or shared with third parties.',
      category: 'account',
    },
  ];

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory = activeCategory === 'popular' ? true : faq.category === activeCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-4 pb-6 select-none font-sans text-slate-800 animate-in fade-in duration-300">
      {/* ═══════════════════════════════════════════════════════════════════
          1. HEADER WITH MASCOT INTRO
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-2xl p-4 shadow-sm border border-purple-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#7C3AED] text-white flex items-center justify-center font-black text-lg shadow-sm">
            ?
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Help Center
            </h1>
            <p className="text-xs font-medium text-slate-500">
              Frequently asked questions, railway guides, and instant assistance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-purple-50 text-purple-800 border border-purple-200 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
            <Headphones className="w-3.5 h-3.5 text-purple-700" />
            <span>24x7 Rail Assistance</span>
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          2. TWO-COLUMN LAYOUT: CATEGORIES + ACCORDION TOPICS
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        {/* ── LEFT COLUMN: SEARCH & CATEGORIES (4 Cols) ── */}
        <div className="md:col-span-4 bg-white rounded-3xl p-4 shadow-sm border border-purple-100 space-y-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9.5 pr-4 py-2.5 rounded-2xl bg-purple-50/40 border border-purple-100 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all"
            />
          </div>

          {/* Category List */}
          <div className="space-y-1">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-[#F2EBFF] text-[#6B21A8] shadow-xs'
                      : 'text-slate-600 hover:bg-purple-50/60 hover:text-purple-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#6B21A8]' : 'text-slate-500'}`} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Mascot Banner in Left Column */}
          <div className="pt-2">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 flex items-center gap-3">
              <div className="w-12 h-12 shrink-0">
                <img
                  src="/assets/images/characters/citizen_wave.png"
                  alt="Ananya Helper"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-[11px]">
                <strong className="text-purple-950 block font-bold">Have an urgent issue?</strong>
                <span className="text-slate-500">Nira AI provides instant 1-click solutions.</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: POPULAR TOPICS ACCORDION & CTA (8 Cols) ── */}
        <div className="md:col-span-8 space-y-4">
          {/* FAQ Accordion Card */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-purple-100 space-y-3">
            <h2 className="text-sm font-black text-slate-900 tracking-tight pb-1 border-b border-purple-50">
              {categories.find((c) => c.id === activeCategory)?.label || 'Popular Topics'}
            </h2>

            <div className="divide-y divide-purple-50">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq, idx) => {
                  const isExpanded = expandedIndex === idx;
                  return (
                    <div key={idx} className="py-2.5">
                      <button
                        type="button"
                        onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                        className="w-full flex items-center justify-between gap-3 text-left py-1 group cursor-pointer"
                      >
                        <span className="text-xs font-bold text-slate-800 group-hover:text-purple-900 transition-colors">
                          {faq.question}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-purple-700 shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-purple-700 shrink-0 transition-colors" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 p-3 rounded-2xl bg-purple-50/50 border border-purple-100 text-xs text-slate-600 font-medium leading-relaxed animate-in fade-in duration-200">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-slate-400 font-semibold">
                  No matching topics found. Try typing a different keyword or chat with Nira below.
                </div>
              )}
            </div>
          </div>

          {/* Still Need Help CTA Card Matching Reference Image 2 */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-purple-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-0.5 text-center sm:text-left">
              <h3 className="text-sm font-black text-slate-900">
                Still need help?
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Chat with Nira or contact our support team.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (onOpenNiraChat) {
                  onOpenNiraChat();
                } else {
                  navigateTo('discover');
                }
              }}
              className="w-full sm:w-auto py-3 px-6 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-black text-xs shadow-md shadow-purple-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Bot className="w-4 h-4" />
              <span>Chat with Nira</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenterPage;
