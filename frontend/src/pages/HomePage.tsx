import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  MapPin,
  Calendar,
  Users,
  ArrowRight,
  Train,
  Sparkles,
  Search,
  SlidersHorizontal,
  ShieldCheck,
  Activity,
  Compass,
  BookOpen,
  MessageSquare,
  HelpCircle,
  CheckCircle2,
  BadgeCheck,
  Ticket,
  ChevronRight,
  Scale,
  CreditCard,
  LayoutGrid,
  GitFork,
  FileText,
} from 'lucide-react';
import { useJourney } from '../context/JourneyContext';
import { POPULAR_STATIONS, Station, searchStations, findStation } from '../data/stationData';
import { MOCK_TRAINS_DATABASE } from '../data/mockTrains';
import { CitizenCharacter } from '../components/characters/CitizenCharacter';
import { NiraRobot } from '../components/characters/NiraRobot';
import { Card } from '../design-system/components/Card';
import TypewriterText from '../components/smoothui/typewriter-text';
import { parseNiraIntent } from '../services/niraApi';
import { SafeAssistParser } from '../utils/SafeAssistParser';
import { JargonHint } from '../components/JargonHint';

export const HomePage: React.FC = () => {
  const {
    searchParams,
    executeSearch,
    navigateTo,
    startGuidanceTour,
    setShowChatDrawer,
  } = useJourney();

  const [nlQuery, setNlQuery] = useState('');
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showTourModal, setShowTourModal] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [guideViewMode, setGuideViewMode] = useState<'flowchart' | 'grid'>('flowchart');
  const [activeFlowStep, setActiveFlowStep] = useState<number>(1);

  const tomorrowStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  })();

  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Dynamic Autocomplete Engine for Home & Discover
  const autocompleteSuggestions = useMemo(() => {
    const raw = nlQuery.trim();
    if (!raw || raw.length < 2) return [];

    const lower = raw.toLowerCase();

    // 1. Check if user typed "X to Y" or "X to"
    if (lower.includes(' to ') || lower.endsWith(' to') || lower.includes(' - ') || lower.includes(' -> ')) {
      const parts = lower.split(/\s+(?:to|-|->)\s*/i);
      const fromQueryPart = parts[0]?.trim();
      const toQueryPart = parts[1]?.trim() || '';

      const matchedFrom = findStation(fromQueryPart);
      if (matchedFrom) {
        // Find direct routes from this station in our 550+ trains database
        const routesFromStation = MOCK_TRAINS_DATABASE.filter(
          (t) => t.fromStationCode === matchedFrom.code || t.fromCity.toLowerCase() === matchedFrom.city.toLowerCase()
        );

        const uniqueDestinations = new Map<string, { station: Station; trainCount: number; sampleTrain: string; duration: string }>();

        for (const tr of routesFromStation) {
          const destStation = findStation(tr.toStationCode) || {
            code: tr.toStationCode,
            name: tr.toStationName,
            city: tr.toCity,
            state: '',
            aliases: [tr.toStationCode, tr.toCity],
          };

          if (toQueryPart) {
            const matchesTo =
              destStation.city.toLowerCase().includes(toQueryPart) ||
              destStation.name.toLowerCase().includes(toQueryPart) ||
              destStation.code.toLowerCase().includes(toQueryPart);
            if (!matchesTo) continue;
          }

          if (!uniqueDestinations.has(destStation.code)) {
            uniqueDestinations.set(destStation.code, {
              station: destStation,
              trainCount: 1,
              sampleTrain: tr.trainName,
              duration: tr.durationHours,
            });
          } else {
            uniqueDestinations.get(destStation.code)!.trainCount += 1;
          }
        }

        return Array.from(uniqueDestinations.values()).slice(0, 6).map((dest) => ({
          type: 'ROUTE' as const,
          fromStation: matchedFrom,
          toStation: dest.station,
          label: `${matchedFrom.city} (${matchedFrom.code}) → ${dest.station.city} (${dest.station.code})`,
          subtitle: `${dest.station.name} • ${dest.trainCount} direct train${dest.trainCount > 1 ? 's' : ''} (${dest.sampleTrain}) • ${dest.duration}`,
        }));
      }
    }

    // 2. User typed a single station name or code (e.g. "howrah", "delhi", "hwh", "ndls", "sbc", "mumbai")
    const matchedStations = searchStations(raw, 6);
    return matchedStations.map((st) => ({
      type: 'STATION' as const,
      fromStation: st,
      toStation: null,
      label: `[${st.code}] ${st.name}`,
      subtitle: `${st.city}, ${st.state} • Official IRCTC Station Code`,
    }));
  }, [nlQuery]);

  const tourSteps = [
    {
      step: 1,
      title: 'Search & Discover Trains',
      boxLabel: 'Box 1: Route Search',
      speech: 'Enter where you are going or speak in natural Hindi/English. I will pull live availability from Indian Railways.',
      mascot: '/assets/images/characters/nira_idea.png',
      route: 'discover',
      actionLabel: 'Try Search Now →',
      preview: 'Delhi (NDLS) → Mumbai (MMCT) • Tomorrow',
    },
    {
      step: 2,
      title: 'Compare & Select Best Option',
      boxLabel: 'Box 2: Live Selection',
      speech: 'I recommend the fastest and safest trains with real-time seat availability across 3A, 2A, and Sleeper coaches.',
      mascot: '/assets/images/characters/nira_thumbsup.png',
      route: 'trains',
      actionLabel: 'View Trains →',
      preview: '12951 Mumbai Rajdhani • 48 Seats Available',
    },
    {
      step: 3,
      title: 'Autofill & Safe Booking',
      boxLabel: 'Box 3: Passenger Verification',
      speech: 'Your passenger details are securely autofilled with zero PII exposure to AI models. Check concessions and berth preferences.',
      mascot: '/assets/images/characters/citizen_ticket.png',
      route: 'booking',
      actionLabel: 'Open Booking Workspace →',
      preview: 'Verified Citizen: Rahul Sharma (IN-84920)',
    },
    {
      step: 4,
      title: 'Double-Verification Payment Bridge',
      boxLabel: 'Box 4: Safe Payment',
      speech: 'Pay safely via UPI, Net Banking, or Cards. If any bank timeout occurs, our status verification ensures you never pay twice.',
      mascot: '/assets/images/characters/nira_happy.png',
      route: 'payment',
      actionLabel: 'Open Payment Bridge →',
      preview: '256-bit SSL • Instant QR & Auto-Refund Safeguard',
    },
    {
      step: 5,
      title: 'View Your Confirmed e-Ticket',
      boxLabel: 'Box 5: Digital Ticket',
      speech: 'Your confirmed ticket includes your PNR, coach, berth, boarding station, and platform details.',
      mascot: '/assets/images/characters/nira_tablet.png',
      route: 'ticket',
      actionLabel: 'View e-Ticket →',
      preview: 'PNR • Coach & berth • Boarding platform',
    },
    {
      step: 6,
      title: 'Track Your Train & Monitor Seats',
      boxLabel: 'Box 6: Live Seat Tracker',
      speech: 'Enter a train number to see its current route, changing station timeline, platform guidance, and live seat availability. When a class is full, I will tell you the exact boarding and destination platforms affected.',
      mascot: '/assets/images/characters/nira_tablet.png',
      route: 'track',
      actionLabel: 'Open Live Tracker →',
      preview: 'Route platforms • Live stoppages • Seat availability',
    },
  ];

  // Natural Language Search — NVIDIA first, Safe Assist if the LLM is down.
  const handleNLSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!nlQuery.trim()) {
      executeSearch({
        fromStation: POPULAR_STATIONS[0],
        toStation: POPULAR_STATIONS[2],
        travelDate: tomorrowStr,
        passengersCount: 1,
        classType: 'All Classes',
        quota: 'General (GN)',
      });
      return;
    }
    let parsed;
    try {
      parsed = await parseNiraIntent(nlQuery, 'en');
    } catch {
      parsed = SafeAssistParser.parse(nlQuery);
    }
    if (parsed.intent === 'TRACK_TRAIN') {
      navigateTo('track');
      return;
    }
    if (parsed.intent === 'VIEW_TICKET') {
      navigateTo('my-journeys');
      return;
    }
    if (parsed.intent === 'PAYMENT_HELP') {
      navigateTo('payments');
      return;
    }
    const from = parsed.entities.from || searchParams.fromStation;
    const to = parsed.entities.to || searchParams.toStation;
    executeSearch({
      fromStation: from,
      toStation: to,
      travelDate: parsed.entities.date || tomorrowStr,
      passengersCount: parsed.entities.passengers || 1,
      classType: 'All Classes',
      quota: 'General (GN)',
    });
  };

  // Quick pill click handlers
  const handleQuickPill = (from: Station, to: Station, date: string, passengers: number) => {
    executeSearch({
      fromStation: from,
      toStation: to,
      travelDate: date,
      passengersCount: passengers,
      classType: 'All Classes',
      quota: 'General (GN)',
    });
  };

  // Voice Query Handler
  const handleApplyVoiceQuery = (from: Station, to: Station, date: string, passengers: number) => {
    setShowVoiceModal(false);
    executeSearch({
      fromStation: from,
      toStation: to,
      travelDate: date,
      passengersCount: passengers,
      classType: 'All Classes',
      quota: 'General (GN)',
    });
  };

  // 4 Intent-First Action Hubs (Discover, Understand, Act, Recover)
  const featureCards = [
    {
      id: 'discover-services',
      title: 'Find a Service',
      subtitle: 'Where do I check PNR, Tatkal rules & refunds?',
      pillar: '🧭 DISCOVER',
      image: '/assets/images/cards/card_find_trains.png',
      alt: 'Find Railway Services',
      onClick: () => navigateTo('discover'),
    },
    {
      id: 'understand-jargon',
      title: 'Understand Jargon',
      subtitle: 'What does RAC 27, GNWL or 3E mean for me?',
      pillar: '🧠 UNDERSTAND',
      image: '/assets/images/cards/card_train_schedule.png',
      alt: 'Nirantar Explain Jargon',
      onClick: () => navigateTo('help'),
    },
    {
      id: 'assisted-booking',
      title: 'Book with Nira',
      subtitle: 'Voice & text booking with safe PII-free autofill',
      pillar: '🤖 ACT',
      image: '/assets/images/cards/card_pnr_status.png',
      alt: 'Assisted Booking',
      onClick: () => {
        executeSearch({
          fromStation: POPULAR_STATIONS[0],
          toStation: POPULAR_STATIONS[1],
          travelDate: tomorrowStr,
          passengersCount: 1,
          classType: 'All Classes',
          quota: 'General (GN)',
        });
      },
    },
    {
      id: 'live-track-recover',
      title: 'Track & Recover',
      subtitle: 'Live GPS radar, delays & resume interrupted trips',
      pillar: '🛡️ RECOVER',
      image: '/assets/images/cards/card_live_trains.png',
      alt: 'Live Radar and Recovery',
      badge: 'LIVE',
      onClick: () => navigateTo('track'),
    },
  ];

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-4">
      {/* ═══════════════════════════════════════════════════════════════════
          0. PERMANENT TOP GUIDED WALKTHROUGH BANNER (Always accessible)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-r from-[#2E1065] via-[#3B0764] to-[#1E1B4B] text-white p-3.5 sm:p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md border border-purple-600/50 animate-in fade-in">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-700/80 border border-purple-500/60 flex items-center justify-center shrink-0 shadow-inner">
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
          </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs sm:text-sm text-white block">
                Want a Step-by-Step Guided Walkthrough?
              </span>
            </div>
            <p className="text-[11px] text-purple-200 font-medium mt-0.5">
              Experience the full guided walkthrough with blurred overlays, live arrows, voice audio, and 1-tap booking!
            </p>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => startGuidanceTour(0)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black shadow-md shadow-emerald-500/20 transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
          >
            <span>Start Interactive Tour ➔</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          1. IMMERSIVE HERO SECTION (Higher elevation & seamless)
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative rounded-2xl sm:rounded-[32px] overflow-hidden min-h-[280px] sm:min-h-[350px] lg:min-h-[380px] bg-gradient-to-r from-[#F9F7FD] via-purple-50/50 to-[#EFEAFF] shadow-[0_4px_25px_rgba(88,28,135,0.04)]">
        {/* Background Station Scene with Ananya */}
        <img
          src="/assets/images/hero_banner_full.png"
          alt="Nirantar Railway Station with Ananya"
          className="absolute inset-0 w-full h-full object-cover object-right pointer-events-none select-none"
        />

        {/* Soft gradient mask on the left */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/85 via-[50%] to-transparent pointer-events-none" />

        {/* Hero Content Container */}
        <div className="relative z-10 flex flex-col justify-between h-full min-h-[280px] sm:min-h-[350px] lg:min-h-[380px] p-4 sm:p-10 lg:p-11">
          <div className="max-w-xl space-y-3 sm:space-y-4">
            {/* HEADLINE */}
            <h1 className="font-display font-black text-2xl sm:text-4xl lg:text-[3.2rem] text-slate-950 leading-[1.15] sm:leading-[1.1] tracking-tight">
              Let's plan<br />
              your next<br />
              <span className="text-[#7C3AED]">
                journey
              </span>
              <span className="text-[#C4B5FD] ml-2 text-xl sm:text-2xl lg:text-3xl">✦</span>
            </h1>

            {/* SEARCH BAR (Pill shaped with mic on left & arrow on right) */}
            <div ref={searchContainerRef} className="relative w-full max-w-md">
              <form onSubmit={handleNLSubmit} className="relative">
                <div className="flex items-center bg-white rounded-full p-1 sm:p-1.5 shadow-[0_6px_20px_rgba(88,28,135,0.08)] border border-purple-100 hover:border-purple-300 focus-within:border-purple-600 transition-all">
                  {/* Search Icon */}
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#7C3AED] text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>

                  {/* Input Text */}
                  <input
                    type="text"
                    value={nlQuery}
                    onChange={(e) => {
                      setNlQuery(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="Where are you going? (e.g. Delhi to Mumbai)"
                    className="flex-1 min-w-0 bg-transparent text-xs sm:text-base font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none px-2 sm:px-3 py-1"
                  />

                  {/* Submit Arrow Button */}
                  <button
                    type="submit"
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-600/20 active:scale-95 transition-all cursor-pointer"
                    title="Search Trains"
                  >
                    <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </form>

              {/* ── VERIFIED STATION & ROUTE AUTOCOMPLETE DROPDOWN ── */}
              {showSuggestions && autocompleteSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white/98 backdrop-blur-md rounded-2xl shadow-2xl border border-purple-200 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 max-h-[300px] sm:max-h-[340px] overflow-y-auto">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-purple-900 px-3 py-1.5 flex items-center justify-between border-b border-purple-50 mb-1">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#7C3AED]" />
                      <span>Verified IRCTC Routes & Codes</span>
                    </span>
                    <span className="text-[9px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-mono font-bold">
                      550+ Real Trains
                    </span>
                  </div>
                  {autocompleteSuggestions.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        if (item.type === 'ROUTE' && item.toStation) {
                          setNlQuery(`${item.fromStation.city} (${item.fromStation.code}) to ${item.toStation.city} (${item.toStation.code})`);
                          setShowSuggestions(false);
                          executeSearch({
                            fromStation: item.fromStation,
                            toStation: item.toStation,
                            travelDate: tomorrowStr,
                            passengersCount: 1,
                            classType: 'All Classes',
                            quota: 'General (GN)',
                          });
                        } else {
                          setNlQuery(`${item.fromStation.city} (${item.fromStation.code}) to `);
                          setShowSuggestions(true);
                        }
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-purple-50/90 transition-all flex items-center justify-between group cursor-pointer border border-transparent hover:border-purple-100 mb-1"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 group-hover:bg-[#7C3AED] group-hover:text-white transition-colors">
                          {item.type === 'ROUTE' ? <Train className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 group-hover:text-purple-950 flex items-center gap-1.5 truncate">
                            <span className="truncate">{item.label}</span>
                            {item.type === 'ROUTE' ? (
                              <span className="text-[9px] bg-purple-100 text-purple-900 px-1.5 py-0.2 rounded font-mono font-bold shrink-0">
                                DIRECT
                              </span>
                            ) : (
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-mono font-bold shrink-0">
                                CODE
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium mt-0.2 truncate">{item.subtitle}</div>
                        </div>
                      </div>
                      <div className="text-purple-700 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-center gap-0.5 shrink-0">
                        <span>Select</span>
                        <span>→</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* QUICK PILLS */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => {
                  setTourStep(0);
                  setShowTourModal(true);
                }}
                className="flex items-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-[11px] sm:text-xs font-black transition-all shadow-md shadow-purple-600/20 cursor-pointer hover:scale-102"
              >
                <span>✨</span>
                <span>Guide</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickPill(POPULAR_STATIONS[0], POPULAR_STATIONS[2], tomorrowStr, 1)}
                className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full bg-white/90 backdrop-blur-sm border border-purple-100/80 text-[11px] sm:text-xs font-bold text-slate-700 hover:border-purple-400 hover:text-purple-700 hover:bg-purple-50 transition-all shadow-xs cursor-pointer"
              >
                <MapPin className="w-3 h-3 text-[#7C3AED]" />
                Delhi to Mumbai
              </button>
              <button
                type="button"
                onClick={() => handleQuickPill(POPULAR_STATIONS[0], POPULAR_STATIONS[1], tomorrowStr, 1)}
                className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full bg-white/90 backdrop-blur-sm border border-purple-100/80 text-[11px] sm:text-xs font-bold text-slate-700 hover:border-purple-400 hover:text-purple-700 hover:bg-purple-50 transition-all shadow-xs cursor-pointer"
              >
                <Calendar className="w-3 h-3 text-[#7C3AED]" />
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => handleQuickPill(POPULAR_STATIONS[0], POPULAR_STATIONS[2], tomorrowStr, 2)}
                className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full bg-white/90 backdrop-blur-sm border border-purple-100/80 text-[11px] sm:text-xs font-bold text-slate-700 hover:border-purple-400 hover:text-purple-700 hover:bg-purple-50 transition-all shadow-xs cursor-pointer"
              >
                <Users className="w-3 h-3 text-[#7C3AED]" />
                2 Adults
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          2. 4 INTENT-FIRST PILLAR CARDS (What are you trying to do?)
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
            What are you trying to do?
          </span>
          <span className="text-[11px] font-bold text-purple-700">
            Nirantar routes you to the exact service
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {featureCards.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={card.onClick}
              className="relative bg-white rounded-2xl sm:rounded-[28px] p-3.5 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-xl hover:shadow-purple-900/8 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-48 sm:h-60 text-left group cursor-pointer border border-purple-50"
            >
              {/* Top: Pillar Badge + Live Tag */}
              <div className="flex items-center justify-between w-full">
                <span className="text-[9px] sm:text-[10px] font-black text-purple-800 bg-purple-50 px-2 py-0.5 rounded-full uppercase tracking-wider border border-purple-100/80">
                  {card.pillar}
                </span>
                {card.badge && (
                  <span className="bg-[#00B074] text-white text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.2 rounded-md uppercase tracking-wider shadow-xs">
                    {card.badge}
                  </span>
                )}
              </div>

              {/* Transparent Circular 3D Illustration */}
              <div className="w-full flex-1 flex items-center justify-center py-1">
                <img
                  src={card.image}
                  alt={card.alt}
                  className="w-16 h-16 sm:w-24 sm:h-24 object-contain group-hover:scale-105 transition-transform duration-300 pointer-events-none select-none"
                />
              </div>

              {/* Bottom: Title + Subtitle + Action Button */}
              <div className="space-y-1 pt-1 border-t border-slate-50">
                <div className="flex items-center justify-between">
                  <span className="font-display font-black text-xs sm:text-base text-slate-900 group-hover:text-[#7C3AED] transition-colors truncate">
                    {card.title}
                  </span>
                  <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full border border-purple-200 text-[#7C3AED] flex items-center justify-center group-hover:bg-[#7C3AED] group-hover:text-white group-hover:border-[#7C3AED] transition-all shadow-xs shrink-0 ml-1">
                    <ArrowRight className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                  </div>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium line-clamp-2 leading-tight">
                  {card.subtitle}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* The previous three decorative panels are retained below only as a reference
          while this compact, actionable guide takes their place. */}
      {false && (
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
        {/* ── LEFT: GUIDANCE HIGHLIGHTS WITH NIRA SPEECH ROWS (5 Cols) ── */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 shadow-sm border border-purple-100 space-y-3.5">
          <div className="flex items-center justify-between border-b border-purple-50 pb-2.5">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Guidance Highlights</span>
            </h3>
            <button
              type="button"
              onClick={() => {
                setTourStep(0);
                setShowTourModal(true);
              }}
              className="text-[10px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-0.5 rounded-full transition-colors cursor-pointer"
            >
              Interactive Tour ➔
            </button>
          </div>

          <div className="space-y-2.5">
            {/* Row 1: Recommended */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-purple-100 border border-purple-200 shrink-0 p-0.5">
                  <img src="/assets/images/characters/nira_idea.png" alt="Nira" className="w-full h-full object-contain" />
                </div>
                <div className="p-2 px-3 rounded-2xl rounded-tl-xs bg-purple-50/70 border border-purple-100 text-[11px] text-slate-700 font-semibold truncate">
                  I recommend the best option for you!
                </div>
              </div>
              <span className="text-emerald-500 font-bold text-xs shrink-0">--➔</span>
              <button
                type="button"
                onClick={() => navigateTo('discover')}
                className="px-3 py-1.5 rounded-full border border-purple-200 bg-white hover:bg-purple-50 text-purple-800 text-xs font-bold shrink-0 transition-all flex items-center gap-1 shadow-2xs hover:scale-102 cursor-pointer"
              >
                <span>✨</span>
                <span>Recommended</span>
              </button>
            </div>

            {/* Row 2: Continue */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-purple-100 border border-purple-200 shrink-0 p-0.5">
                  <img src="/assets/images/characters/nira_thumbsup.png" alt="Nira" className="w-full h-full object-contain" />
                </div>
                <div className="p-2 px-3 rounded-2xl rounded-tl-xs bg-purple-50/70 border border-purple-100 text-[11px] text-slate-700 font-semibold truncate">
                  Good choice! Let's continue.
                </div>
              </div>
              <span className="text-emerald-500 font-bold text-xs shrink-0">--➔</span>
              <button
                type="button"
                onClick={() => navigateTo('booking')}
                className="px-3.5 py-1.5 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold shrink-0 transition-all flex items-center gap-1 shadow-2xs hover:scale-102 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Row 3: Track Train */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-purple-100 border border-purple-200 shrink-0 p-0.5">
                  <img src="/assets/images/characters/nira_tablet.png" alt="Nira" className="w-full h-full object-contain" />
                </div>
                <div className="p-2 px-3 rounded-2xl rounded-tl-xs bg-purple-50/70 border border-purple-100 text-[11px] text-slate-700 font-semibold truncate">
                  Track your train in real-time here.
                </div>
              </div>
              <span className="text-emerald-500 font-bold text-xs shrink-0">--➔</span>
              <button
                type="button"
                onClick={() => navigateTo('track')}
                className="px-3 py-1.5 rounded-full border border-purple-200 bg-white hover:bg-purple-50 text-purple-800 text-xs font-bold shrink-0 transition-all flex items-center gap-1 shadow-2xs hover:scale-102 cursor-pointer"
              >
                <span>📍</span>
                <span>Track Your Train</span>
              </button>
            </div>

            {/* Row 4: Help Center */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-purple-100 border border-purple-200 shrink-0 p-0.5">
                  <img src="/assets/images/characters/nira_wave.png" alt="Nira" className="w-full h-full object-contain" />
                </div>
                <div className="p-2 px-3 rounded-2xl rounded-tl-xs bg-purple-50/70 border border-purple-100 text-[11px] text-slate-700 font-semibold truncate">
                  Need help? I'm here!
                </div>
              </div>
              <span className="text-emerald-500 font-bold text-xs shrink-0">--➔</span>
              <button
                type="button"
                onClick={() => navigateTo('help')}
                className="px-3 py-1.5 rounded-full border border-purple-200 bg-white hover:bg-purple-50 text-purple-800 text-xs font-bold shrink-0 transition-all flex items-center gap-1 shadow-2xs hover:scale-102 cursor-pointer"
              >
                <span>❓</span>
                <span>Help Center</span>
              </button>
            </div>

            {/* Row 5: Secure Payment */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-purple-100 border border-purple-200 shrink-0 p-0.5">
                  <img src="/assets/images/characters/nira_happy.png" alt="Nira" className="w-full h-full object-contain" />
                </div>
                <div className="p-2 px-3 rounded-2xl rounded-tl-xs bg-purple-50/70 border border-purple-100 text-[11px] text-slate-700 font-semibold truncate">
                  Your payment is secure with us.
                </div>
              </div>
              <span className="text-emerald-500 font-bold text-xs shrink-0">--➔</span>
              <button
                type="button"
                onClick={() => navigateTo('payments')}
                className="px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold shrink-0 transition-all flex items-center gap-1 shadow-2xs hover:scale-102 cursor-pointer"
              >
                <span>🛡️</span>
                <span>Secure Payment</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── MIDDLE: TIPS FROM NIRA (3 Cols) ── */}
        <div className="lg:col-span-3 bg-gradient-to-b from-[#F3EDFD] via-[#EFE7FD] to-[#EBE2FC] rounded-3xl p-5 border border-purple-100 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-purple-950">Tips from Nira</span>
            <div className="w-8 h-8 rounded-full bg-white/80 p-1 flex items-center justify-center border border-purple-200">
              <img src="/assets/images/characters/nira_idea.png" alt="Nira" className="w-full h-full object-contain" />
            </div>
          </div>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => navigateTo('profile')}
              className="w-full p-3 rounded-2xl bg-white/90 hover:bg-white border border-purple-100/80 text-left transition-all hover:scale-101 shadow-2xs group cursor-pointer"
            >
              <div className="flex items-start gap-2.5">
                <span className="text-base">👥</span>
                <p className="text-[11px] text-slate-700 font-bold leading-snug group-hover:text-purple-950">
                  You can save your passengers for faster booking.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => console.log('🔔 Push & SMS Notifications enabled for live PNR, gate, and train delay updates.')}
              className="w-full p-3 rounded-2xl bg-white/90 hover:bg-white border border-purple-100/80 text-left transition-all hover:scale-101 shadow-2xs group cursor-pointer"
            >
              <div className="flex items-start gap-2.5">
                <span className="text-base">🔔</span>
                <p className="text-[11px] text-slate-700 font-bold leading-snug group-hover:text-purple-950">
                  Enable notifications to stay updated.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setShowVoiceModal(true)}
              className="w-full p-3 rounded-2xl bg-white/90 hover:bg-white border border-purple-100/80 text-left transition-all hover:scale-101 shadow-2xs group cursor-pointer"
            >
              <div className="flex items-start gap-2.5">
                <span className="text-base">🎙️</span>
                <p className="text-[11px] text-slate-700 font-bold leading-snug group-hover:text-purple-950">
                  Use voice search for quick booking.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* ── RIGHT: HOW IT WORKS STEPPER WITH ANANYA MASCOT (4 Cols) ── */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-5 shadow-sm border border-purple-100 space-y-3">
          <div className="flex items-center justify-between border-b border-purple-50 pb-2">
            <h3 className="font-black text-sm text-slate-900">How It Works</h3>
            <button
              type="button"
              onClick={() => {
                setTourStep(0);
                setShowTourModal(true);
              }}
              className="text-[10px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-0.5 rounded-full transition-colors cursor-pointer"
            >
              5 Simple Steps ➔
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* Mascot on Left */}
            <div className="w-20 sm:w-24 shrink-0 hidden sm:block">
              <img
                src="/assets/images/characters/citizen_ticket.png"
                alt="How It Works"
                className="w-full h-full object-contain drop-shadow-sm"
              />
            </div>

            {/* Vertical Flow Steps */}
            <div className="flex-1 space-y-2 relative pl-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-400">
              {/* Step 1 */}
              <button
                type="button"
                onClick={() => navigateTo('discover')}
                className="relative text-left block group w-full cursor-pointer"
              >
                <div className="absolute -left-[21px] top-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-2xs" />
                <div className="text-xs font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                  Search
                </div>
                <div className="text-[10px] text-slate-500 font-medium">Find trains easily</div>
              </button>

              {/* Step 2 */}
              <button
                type="button"
                onClick={() => navigateTo('trains')}
                className="relative text-left block group w-full cursor-pointer"
              >
                <div className="absolute -left-[21px] top-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-2xs" />
                <div className="text-xs font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                  Select
                </div>
                <div className="text-[10px] text-slate-500 font-medium">Choose the best option</div>
              </button>

              {/* Step 3 */}
              <button
                type="button"
                onClick={() => navigateTo('booking')}
                className="relative text-left block group w-full cursor-pointer"
              >
                <div className="absolute -left-[21px] top-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-2xs" />
                <div className="text-xs font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                  Book
                </div>
                <div className="text-[10px] text-slate-500 font-medium">Secure your seat</div>
              </button>

              {/* Step 4 */}
              <button
                type="button"
                onClick={() => navigateTo('payment')}
                className="relative text-left block group w-full cursor-pointer"
              >
                <div className="absolute -left-[21px] top-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-2xs" />
                <div className="text-xs font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                  Pay
                </div>
                <div className="text-[10px] text-slate-500 font-medium">Safe & quick payment</div>
              </button>

              {/* Step 5 */}
              <button
                type="button"
                onClick={() => navigateTo('ticket')}
                className="relative text-left block group w-full cursor-pointer"
              >
                <div className="absolute -left-[21px] top-0.5 w-3.5 h-3.5 rounded-full bg-purple-700 border-2 border-white shadow-2xs" />
                <div className="text-xs font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                  Ticket
                </div>
                <div className="text-[10px] text-slate-500 font-medium">View your confirmed e-ticket</div>
              </button>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          3. VIBRANT COMPREHENSIVE FEATURE GUIDE — 6 CORE SUPERPOWERS & FLOWCHART
          ═══════════════════════════════════════════════════════════════════ */}
      <section aria-labelledby="feature-guide-title" className="relative overflow-hidden rounded-3xl border-2 border-purple-100/90 bg-gradient-to-b from-white via-purple-50/25 to-white p-5 sm:p-7 shadow-xl shadow-purple-500/5">
        {/* Background Subtle Ambient Glow */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-purple-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-indigo-200/35 blur-3xl" />

        {/* Section Header */}
        <div className="relative flex flex-col gap-4 border-b border-purple-100/80 pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            {/* Clean Mascot Avatar Badge with Live Pulse */}
            <div className="relative flex items-center shrink-0">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700 p-1.5 shadow-md shadow-purple-500/20 ring-4 ring-purple-100/90">
                <img
                  src="/assets/images/characters/nira_guide_clean.svg"
                  alt="Nira AI Mascot"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="-ml-3 flex h-10 w-10 items-center justify-center rounded-full bg-white p-0.5 shadow-md ring-2 ring-purple-200">
                <img
                  src="/assets/images/characters/citizen_guide_clean.svg"
                  alt="Passenger Guide"
                  className="h-full w-full object-contain"
                />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-white" />
              </span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-100/90 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-purple-800 ring-1 ring-purple-200">
                  <Sparkles className="h-3 w-3 text-purple-600" />
                  Nirantar Guide
                </span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  6 Journey Stages
                </span>
              </div>
              <h2 id="feature-guide-title" className="mt-1 font-display text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
                Everything you need for a smoother train journey
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Toggle: Flowchart vs Grid */}
            <div className="flex items-center bg-purple-100/70 p-1 rounded-xl ring-1 ring-purple-200/70">
              <button
                type="button"
                onClick={() => setGuideViewMode('flowchart')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  guideViewMode === 'flowchart'
                    ? 'bg-white text-purple-900 shadow-xs'
                    : 'text-purple-700 hover:text-purple-950'
                }`}
              >
                <GitFork className="w-3.5 h-3.5" />
                <span>Flowchart</span>
              </button>
              <button
                type="button"
                onClick={() => setGuideViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  guideViewMode === 'grid'
                    ? 'bg-white text-purple-900 shadow-xs'
                    : 'text-purple-700 hover:text-purple-950'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowTourModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-50 px-3.5 py-2 text-xs font-black text-purple-800 ring-1 ring-purple-200/80 transition-all hover:bg-purple-100 hover:shadow-sm cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-purple-600" />
              <span>60s Step Tour</span>
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            MODE A: INTERACTIVE FLOWCHART PIPELINE VIEW
            ═══════════════════════════════════════════════════════════════════ */}
        {guideViewMode === 'flowchart' && (
          <div className="mt-6 space-y-6 animate-in fade-in duration-200">
            {/* Connected Journey Pipeline Rail */}
            <div className="relative overflow-x-auto pb-3 pt-2">
              <div className="min-w-[680px] relative">
                {/* Connecting Track Line */}
                <div className="absolute top-1/2 left-8 right-8 -translate-y-1/2 h-1.5 bg-gradient-to-r from-indigo-300 via-purple-300 to-rose-300 rounded-full z-0" />

                {/* 6 Step Interactive Pills */}
                <div className="relative z-10 grid grid-cols-6 gap-3">
                  {[
                    { step: 1, name: 'Search', code: '01', icon: Search, color: 'indigo' },
                    { step: 2, name: 'Compare', code: '02', icon: Scale, color: 'sky' },
                    { step: 3, name: 'Book', code: '03', icon: FileText, color: 'amber' },
                    { step: 4, name: 'Pay', code: '04', icon: ShieldCheck, color: 'emerald' },
                    { step: 5, name: 'Track', code: '05', icon: MapPin, color: 'purple' },
                    { step: 6, name: 'Vault', code: '06', icon: Ticket, color: 'rose' },
                  ].map((s) => {
                    const isActive = activeFlowStep === s.step;
                    const IconComponent = s.icon;
                    return (
                      <button
                        key={s.step}
                        type="button"
                        onClick={() => setActiveFlowStep(s.step)}
                        className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all cursor-pointer ${
                          isActive
                            ? 'bg-purple-900 text-white shadow-lg shadow-purple-900/20 scale-105 ring-4 ring-purple-200'
                            : 'bg-white/90 hover:bg-white text-slate-700 shadow-sm border border-purple-100 hover:scale-102'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-purple-50 text-purple-800'
                          }`}
                        >
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="text-center">
                          <span
                            className={`text-[9px] font-black uppercase tracking-wider block ${
                              isActive ? 'text-purple-200' : 'text-slate-400'
                            }`}
                          >
                            Step {s.code}
                          </span>
                          <span className="text-xs font-bold whitespace-nowrap">
                            {s.name}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Active Stage Detailed Flowchart Card */}
            {activeFlowStep === 1 && (
              <div className="rounded-3xl border-2 border-indigo-100 bg-gradient-to-br from-indigo-50/80 via-white to-blue-50/50 p-6 shadow-md space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                      <Search className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                        Stage 01 • Instant Route & Train Discovery
                      </span>
                      <h3 className="text-lg font-black text-slate-900 mt-0.5">
                        Search Your Way with Everyday Language
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => navigateTo('discover')}
                      className="inline-flex items-center gap-1 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md shadow-indigo-600/20 cursor-pointer transition-all active:scale-95"
                    >
                      <span>Try Step 01: Discover Trains</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                  Type a route, station code, or conversational query in English or Hinglish to find trains and seats instantly. Connected directly to official <JargonHint term="IRCTC" /> station indices.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-2xl bg-white border border-indigo-100 space-y-1">
                    <span className="text-xs font-bold text-indigo-900 block">💬 <JargonHint term="natural language">Natural Language</JargonHint> Queries</span>
                    <p className="text-[11px] text-slate-600">Type <em>“Delhi to Mumbai tomorrow”</em> or search with smart assist to find ranked trains.</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white border border-indigo-100 space-y-1">
                    <span className="text-xs font-bold text-indigo-900 block">⚡ Instant <JargonHint term="Tatkal">Tatkal</JargonHint> Countdowns</span>
                    <p className="text-[11px] text-slate-600">Live countdowns to 10:00 AM (AC) and 11:00 AM (Non-AC) booking windows.</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white border border-indigo-100 space-y-1">
                    <span className="text-xs font-bold text-indigo-900 block">🗺️ Smart Junctions</span>
                    <p className="text-[11px] text-slate-600">Recommends nearby stations if direct berths are full.</p>
                  </div>
                </div>
              </div>
            )}

            {activeFlowStep === 2 && (
              <div className="rounded-3xl border-2 border-sky-100 bg-gradient-to-br from-sky-50/80 via-white to-cyan-50/50 p-6 shadow-md space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sky-100/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-md">
                      <Scale className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full">
                        Stage 02 • Transparent Train Comparison
                      </span>
                      <h3 className="text-lg font-black text-slate-900 mt-0.5">
                        Compare Before You Choose
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => navigateTo('trains')}
                      className="inline-flex items-center gap-1 px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-black shadow-md shadow-sky-600/20 cursor-pointer transition-all active:scale-95"
                    >
                      <span>Try Step 02: Compare Trains</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                  Review transparent fares, class options, duration, and AI-driven <JargonHint term="confirmation probability">confirmation probabilities</JargonHint> for <JargonHint term="WL" /> and <JargonHint term="RAC" /> before selecting a train.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-2xl bg-white border border-sky-100 space-y-1">
                    <span className="text-xs font-bold text-sky-900 block">💺 Complete Class Matrix</span>
                    <p className="text-[11px] text-slate-600">Side-by-side fares for <JargonHint term="1A" />, <JargonHint term="2A" />, <JargonHint term="3A" />, <JargonHint term="3E" />, <JargonHint term="SL" /> and <JargonHint term="CC" />.</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white border border-sky-100 space-y-1">
                    <span className="text-xs font-bold text-sky-900 block">🎯 AI Confirmation Odds</span>
                    <p className="text-[11px] text-slate-600">Real-time confirmation probability for <JargonHint term="GNWL" /> and <JargonHint term="RLWL" />.</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white border border-sky-100 space-y-1">
                    <span className="text-xs font-bold text-sky-900 block">⏱️ Punctuality Scores</span>
                    <p className="text-[11px] text-slate-600">Historical delay averages so you can plan tight layovers safely.</p>
                  </div>
                </div>
              </div>
            )}

            {activeFlowStep === 3 && (
              <div className="rounded-3xl border-2 border-amber-100 bg-gradient-to-br from-amber-50/80 via-white to-orange-50/50 p-6 shadow-md space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-100/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-md">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                        Stage 03 • Zero-PII Passenger Workspace
                      </span>
                      <h3 className="text-lg font-black text-slate-900 mt-0.5">
                        Book With Saved Details in 1 Click
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => navigateTo('booking')}
                      className="inline-flex items-center gap-1 px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow-md shadow-amber-600/20 cursor-pointer transition-all active:scale-95"
                    >
                      <span>Try Step 03: Passenger Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                  Save passenger profiles, <JargonHint term="berth preference">berth preferences</JargonHint>, and senior citizen concessions once, then use <JargonHint term="safe autofill">safe autofill</JargonHint> with <JargonHint term="zero PII">zero PII</JargonHint> leakage.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-2xl bg-white border border-amber-100 space-y-1">
                    <span className="text-xs font-bold text-amber-900 block">🔒 Zero-PII Autofill</span>
                    <p className="text-[11px] text-slate-600">Populate names, age, and ID safely in 0.5s without public model sharing.</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white border border-amber-100 space-y-1">
                    <span className="text-xs font-bold text-amber-900 block">🛌 Berth Allocation</span>
                    <p className="text-[11px] text-slate-600">Optimizes for <JargonHint term="LB">Lower</JargonHint>, <JargonHint term="MB">Middle</JargonHint>, <JargonHint term="UB">Upper</JargonHint> or <JargonHint term="SL_BERTH">Side Lower</JargonHint>.</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white border border-amber-100 space-y-1">
                    <span className="text-xs font-bold text-amber-900 block">🛡️ Anti-Bot Protection</span>
                    <p className="text-[11px] text-slate-600"><JargonHint term="fair-access token">Fair-Access Token</JargonHint> ensures genuine citizen priority during surges.</p>
                  </div>
                </div>
              </div>
            )}

            {activeFlowStep === 4 && (
              <div className="rounded-3xl border-2 border-emerald-100 bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/50 p-6 shadow-md space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-100/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        Stage 04 • Double-Verification Payment Shield
                      </span>
                      <h3 className="text-lg font-black text-slate-900 mt-0.5">
                        Pay With Safeguards & 0 Ghost Charges
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => navigateTo('payment')}
                      className="inline-flex items-center gap-1 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-600/20 cursor-pointer transition-all active:scale-95"
                    >
                      <span>Try Step 04: Payment Shield</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                  Multi-channel checkout using <JargonHint term="UPI" />, Net Banking, Cards, or preloaded ₹10,000 <JargonHint term="citizen wallet">Citizen Wallet</JargonHint> with <JargonHint term="double verification">double verification</JargonHint> to eliminate duplicate deductions.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-2xl bg-white border border-emerald-100 space-y-1">
                    <span className="text-xs font-bold text-emerald-900 block">🛡️ Ghost Charge Gate</span>
                    <p className="text-[11px] text-slate-600"><JargonHint term="double verification">Double Verification</JargonHint> checks bank status before finalizing state.</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white border border-emerald-100 space-y-1">
                    <span className="text-xs font-bold text-emerald-900 block">⚡ ₹10,000 Citizen Wallet</span>
                    <p className="text-[11px] text-slate-600">Zero OTP delays and 100% instant checkout rate.</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white border border-emerald-100 space-y-1">
                    <span className="text-xs font-bold text-emerald-900 block">🧾 Automated Refund Audit</span>
                    <p className="text-[11px] text-slate-600"><JargonHint term="refund audit">Refund Audit</JargonHint> tracks bank ARN status transparently.</p>
                  </div>
                </div>
              </div>
            )}

            {activeFlowStep === 5 && (
              <div className="rounded-3xl border-2 border-purple-100 bg-gradient-to-br from-purple-50/80 via-white to-fuchsia-50/50 p-6 shadow-md space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-100/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                        Stage 05 • Live GPS Radar & PNR Decoder
                      </span>
                      <h3 className="text-lg font-black text-slate-900 mt-0.5">
                        Track & Understand Tickets
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => navigateTo('track')}
                      className="inline-flex items-center gap-1 px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black shadow-md shadow-purple-600/20 cursor-pointer transition-all active:scale-95"
                    >
                      <span>Try Step 05: Live Radar</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                  Follow live train movement, station <JargonHint term="platform">platform</JargonHint> assignments, and plain-English <JargonHint term="PNR">PNR</JargonHint> explanations without confusing codes.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-2xl bg-white border border-purple-100 space-y-1">
                    <span className="text-xs font-bold text-purple-900 block">🛰️ GPS Satellite Tracker</span>
                    <p className="text-[11px] text-slate-600">Real-time running speed, distance covered, and upcoming halt alerts.</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white border border-purple-100 space-y-1">
                    <span className="text-xs font-bold text-purple-900 block">🚉 Platform & Coach Alignment</span>
                    <p className="text-[11px] text-slate-600"><JargonHint term="platform alignment">Platform Alignment</JargonHint> maps your coach door directly to platform pillars.</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white border border-purple-100 space-y-1">
                    <span className="text-xs font-bold text-purple-900 block">🔍 Plain-English PNR</span>
                    <p className="text-[11px] text-slate-600">Decodes <JargonHint term="CNF">CNF</JargonHint>, <JargonHint term="RAC">RAC</JargonHint>, and <JargonHint term="chart preparation">Chart Preparation</JargonHint> simply.</p>
                  </div>
                </div>
              </div>
            )}

            {activeFlowStep === 6 && (
              <div className="rounded-3xl border-2 border-rose-100 bg-gradient-to-br from-rose-50/80 via-white to-pink-50/50 p-6 shadow-md space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-100/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md">
                      <Ticket className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">
                        Stage 06 • Unified Journey Vault
                      </span>
                      <h3 className="text-lg font-black text-slate-900 mt-0.5">
                        Keep Every Journey Together
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => navigateTo('my-journeys')}
                      className="inline-flex items-center gap-1 px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-600/20 cursor-pointer transition-all active:scale-95"
                    >
                      <span>Try Step 06: Ticket Vault</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                  Access confirmed <JargonHint term="e-ticket">e-tickets</JargonHint>, digital receipts, cancellation fee calculators with <JargonHint term="clerkage">clerkage</JargonHint> preview, and <JargonHint term="TDR">TDR</JargonHint> filing in one place.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-2xl bg-white border border-rose-100 space-y-1">
                    <span className="text-xs font-bold text-rose-900 block">📱 Offline Digital Passes</span>
                    <p className="text-[11px] text-slate-600">Downloadable passes with QR code verified for TTE boarding checks.</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white border border-rose-100 space-y-1">
                    <span className="text-xs font-bold text-rose-900 block">📊 Central Expense Ledger</span>
                    <p className="text-[11px] text-slate-600">GST tax invoices and expense logs for instant corporate reimbursements.</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white border border-rose-100 space-y-1">
                    <span className="text-xs font-bold text-rose-900 block">🔄 1-Click Refund Calculator</span>
                    <p className="text-[11px] text-slate-600">Transparent deduction preview before canceling or filing <JargonHint term="TDR">TDR</JargonHint>.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            MODE B: 6 VIBRANT FEATURE CARDS GRID VIEW
            ═══════════════════════════════════════════════════════════════════ */}
        {guideViewMode === 'grid' && (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-in fade-in duration-200">
            {/* Card 01: Search your way */}
            <div
              onClick={() => navigateTo('discover')}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border-2 border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/40 p-4 transition-all duration-200 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10 cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
                    01 • DISCOVERY
                  </span>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-indigo-100 group-hover:scale-110 transition-transform">
                    <img src="/assets/images/find_train.png" alt="Find Train" className="h-full w-full object-contain" />
                  </div>
                </div>

                <h3 className="mt-3 font-display text-base font-black text-slate-900 group-hover:text-indigo-700 transition-colors flex items-center justify-between">
                  Search Your Way
                  <ChevronRight className="h-4 w-4 text-indigo-400 group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  Type a route, station code, or conversational query in English or Hinglish to find trains and seats instantly.
                </p>

                <ul className="mt-3 space-y-1.5 border-t border-indigo-100/80 pt-3 text-[11px] font-medium text-slate-700">
                  <li className="flex items-start gap-1.5">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">✓</span>
                    <span><strong>Natural Queries:</strong> <em>“Delhi to Mumbai tomorrow”</em> or <JargonHint term="Tatkal">tatkal</JargonHint> timing</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">✓</span>
                    <span><strong>Smart Alternatives:</strong> Suggests nearby junction stations if berths are full</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">✓</span>
                    <span><strong>Instant Quota Filters:</strong> <JargonHint term="general quota">General</JargonHint>, <JargonHint term="Tatkal">Tatkal</JargonHint>, Senior & Ladies</span>
                  </li>
                </ul>
              </div>

              <div className="mt-4 pt-2 flex items-center justify-between text-xs font-bold text-indigo-700 border-t border-indigo-50">
                <span>Open Discover Hub</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>

            {/* Card 02: Compare before you choose */}
            <div
              onClick={() => navigateTo('trains')}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border-2 border-sky-100 bg-gradient-to-br from-sky-50/70 via-white to-cyan-50/40 p-4 transition-all duration-200 hover:-translate-y-1 hover:border-sky-300 hover:shadow-xl hover:shadow-sky-500/10 cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
                    02 • COMPARISON
                  </span>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-sky-100 group-hover:scale-110 transition-transform">
                    <img src="/assets/images/train_schedule.png" alt="Train Schedule" className="h-full w-full object-contain" />
                  </div>
                </div>

                <h3 className="mt-3 font-display text-base font-black text-slate-900 group-hover:text-sky-700 transition-colors flex items-center justify-between">
                  Compare Before You Choose
                  <ChevronRight className="h-4 w-4 text-sky-400 group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  Review transparent fares, class options, duration, and AI-driven confirmation probabilities before booking.
                </p>

                <ul className="mt-3 space-y-1.5 border-t border-sky-100/80 pt-3 text-[11px] font-medium text-slate-700">
                  <li className="flex items-start gap-1.5">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[10px] font-bold text-sky-700">✓</span>
                    <span><strong>Class Matrix:</strong> Fares for <JargonHint term="1A" />, <JargonHint term="2A" />, <JargonHint term="3A" />, <JargonHint term="3E" />, <JargonHint term="SL" /> & <JargonHint term="CC" /></span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[10px] font-bold text-sky-700">✓</span>
                    <span><strong>AI Waitlist Estimator:</strong> Odds for <JargonHint term="WL" /> & <JargonHint term="RAC" /></span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[10px] font-bold text-sky-700">✓</span>
                    <span><strong>Punctuality Score:</strong> Historical on-time metrics & delay statistics</span>
                  </li>
                </ul>
              </div>

              <div className="mt-4 pt-2 flex items-center justify-between text-xs font-bold text-sky-700 border-t border-sky-50">
                <span>Compare Train List</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>

            {/* Card 03: Book with saved details */}
            <div
              onClick={() => navigateTo('booking')}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border-2 border-amber-100 bg-gradient-to-br from-amber-50/70 via-white to-orange-50/40 p-4 transition-all duration-200 hover:-translate-y-1 hover:border-amber-300 hover:shadow-xl hover:shadow-amber-500/10 cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
                    03 • PASSENGER WORKSPACE
                  </span>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white p-1 shadow-sm ring-1 ring-amber-100 group-hover:scale-110 transition-transform">
                    <img src="/assets/images/characters/citizen_ticket.png" alt="Passenger Workspace" className="h-full w-full object-contain" />
                  </div>
                </div>

                <h3 className="mt-3 font-display text-base font-black text-slate-900 group-hover:text-amber-700 transition-colors flex items-center justify-between">
                  Book With Saved Details
                  <ChevronRight className="h-4 w-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  Save passenger profiles, berth choices, and senior concessions once for lightning-fast 1-click checkouts.
                </p>

                <ul className="mt-3 space-y-1.5 border-t border-amber-100/80 pt-3 text-[11px] font-medium text-slate-700">
                  <li className="flex items-start gap-1.5">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-700">✓</span>
                    <span><strong><JargonHint term="zero PII">Zero-PII</JargonHint> Autofill:</strong> 1-click safe population with strict privacy</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-700">✓</span>
                    <span><strong><JargonHint term="berth preference">Berth Optimization</JargonHint>:</strong> Smart <JargonHint term="LB">Lower</JargonHint>, <JargonHint term="MB">Middle</JargonHint>, <JargonHint term="UB">Upper</JargonHint> & <JargonHint term="SL_BERTH">Side</JargonHint></span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-700">✓</span>
                    <span><strong><JargonHint term="fair-access token">Fair-Access Token</JargonHint>:</strong> Bot-storm and captcha protection during surges</span>
                  </li>
                </ul>
              </div>

              <div className="mt-4 pt-2 flex items-center justify-between text-xs font-bold text-amber-700 border-t border-amber-50">
                <span>Open Passenger Workspace</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>

            {/* Card 04: Pay with safeguards */}
            <div
              onClick={() => navigateTo('payment')}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border-2 border-emerald-100 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/40 p-4 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/10 cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
                    04 • PAYMENT SHIELD
                  </span>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-emerald-100 group-hover:scale-110 transition-transform">
                    <img src="/assets/images/payments.png" alt="Payment Shield" className="h-full w-full object-contain" />
                  </div>
                </div>

                <h3 className="mt-3 font-display text-base font-black text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center justify-between">
                  Pay With Safeguards
                  <ChevronRight className="h-4 w-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  Multi-channel payment gateway with double verification designed to prevent duplicate bank deductions.
                </p>

                <ul className="mt-3 space-y-1.5 border-t border-emerald-100/80 pt-3 text-[11px] font-medium text-slate-700">
                  <li className="flex items-start gap-1.5">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">✓</span>
                    <span><strong><JargonHint term="double verification">Double Verification</JargonHint>:</strong> Validates gateway state to eliminate ghost charges</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">✓</span>
                    <span><strong>Multi-Rail Fallback:</strong> <JargonHint term="UPI" />, Net Banking, Cards & Virtual Wallet</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">✓</span>
                    <span><strong>Automated <JargonHint term="refund audit">Refund Audit</JargonHint>:</strong> Live ledger tracks reversed bank transactions</span>
                  </li>
                </ul>
              </div>

              <div className="mt-4 pt-2 flex items-center justify-between text-xs font-bold text-emerald-700 border-t border-emerald-50">
                <span>View Payment Bridge</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>

            {/* Card 05: Track and understand tickets */}
            <div
              onClick={() => navigateTo('track')}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border-2 border-purple-100 bg-gradient-to-br from-purple-50/70 via-white to-fuchsia-50/40 p-4 transition-all duration-200 hover:-translate-y-1 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-500/10 cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
                    05 • LIVE RADAR & PNR
                  </span>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-purple-100 group-hover:scale-110 transition-transform">
                    <img src="/assets/images/live_train.png" alt="Live Radar" className="h-full w-full object-contain" />
                  </div>
                </div>

                <h3 className="mt-3 font-display text-base font-black text-slate-900 group-hover:text-purple-700 transition-colors flex items-center justify-between">
                  Track & Understand Tickets
                  <ChevronRight className="h-4 w-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  Follow live train running status, station platform assignments, and plain-English PNR explanations.
                </p>

                <ul className="mt-3 space-y-1.5 border-t border-purple-100/80 pt-3 text-[11px] font-medium text-slate-700">
                  <li className="flex items-start gap-1.5">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-purple-100 text-[10px] font-bold text-purple-700">✓</span>
                    <span><strong><JargonHint term="GPS">GPS</JargonHint> Live Tracker:</strong> Real-time delay calculations & upcoming halt alerts</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-purple-100 text-[10px] font-bold text-purple-700">✓</span>
                    <span><strong>Platform & Coach Alignment:</strong> Exact rake layout maps for stress-free boarding</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-purple-100 text-[10px] font-bold text-purple-700">✓</span>
                    <span><strong>Jargon Tooltips:</strong> Hover decoder for <JargonHint term="CNF" />, <JargonHint term="RAC" /> and <JargonHint term="PNR" /></span>
                  </li>
                </ul>
              </div>

              <div className="mt-4 pt-2 flex items-center justify-between text-xs font-bold text-purple-700 border-t border-purple-50">
                <span>Open Live Radar & PNR</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>

            {/* Card 06: Keep every journey together */}
            <div
              onClick={() => navigateTo('my-journeys')}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border-2 border-rose-100 bg-gradient-to-br from-rose-50/70 via-white to-pink-50/40 p-4 transition-all duration-200 hover:-translate-y-1 hover:border-rose-300 hover:shadow-xl hover:shadow-rose-500/10 cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
                    06 • UNIFIED VAULT
                  </span>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-rose-100 group-hover:scale-110 transition-transform">
                    <img src="/assets/images/cards/card_pnr_status.png" alt="Unified Vault" className="h-full w-full object-contain" />
                  </div>
                </div>

                <h3 className="mt-3 font-display text-base font-black text-slate-900 group-hover:text-rose-700 transition-colors flex items-center justify-between">
                  Keep Every Journey Together
                  <ChevronRight className="h-4 w-4 text-rose-400 group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  Access confirmed e-tickets, digital receipts, cancellation fee calculators, and travel history in one vault.
                </p>

                <ul className="mt-3 space-y-1.5 border-t border-rose-100/80 pt-3 text-[11px] font-medium text-slate-700">
                  <li className="flex items-start gap-1.5">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-100 text-[10px] font-bold text-rose-700">✓</span>
                    <span><strong>Offline <JargonHint term="e-ticket">E-Tickets</JargonHint>:</strong> Downloadable standard railway passes with QR codes</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-100 text-[10px] font-bold text-rose-700">✓</span>
                    <span><strong>Central Expense Ledger:</strong> GST tax invoices & expense logs for quick claims</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-100 text-[10px] font-bold text-rose-700">✓</span>
                    <span><strong>1-Click Refund Calculator:</strong> Transparent deduction preview with <JargonHint term="clerkage">clerkage</JargonHint> and <JargonHint term="TDR">TDR</JargonHint></span>
                  </li>
                </ul>
              </div>

              <div className="mt-4 pt-2 flex items-center justify-between text-xs font-bold text-rose-700 border-t border-rose-50">
                <span>Manage My Journeys</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Interactive Guidance Banner */}
        <div className="mt-6 flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-slate-950 via-purple-950 to-indigo-950 p-4 sm:p-5 text-white shadow-xl ring-1 ring-purple-500/20 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-800/80 p-1 ring-2 ring-purple-400/40">
              <img
                src="/assets/images/characters/citizen_guide_clean.svg"
                alt="Nira Passenger Assistant"
                className="h-full w-full object-contain"
              />
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
              </span>
            </div>
            <div>
              <p className="text-xs font-black text-purple-200 uppercase tracking-wider">
                Need Guidance or Feeling Confused?
              </p>
              <p className="mt-0.5 text-xs text-slate-300">
                Nira AI is always ready to decode railway jargon, compare train options, or walk you through any step.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:shrink-0">
            <button
              type="button"
              onClick={() => setShowChatDrawer(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 px-3.5 py-2 text-xs font-black text-white shadow-md shadow-purple-900/40 transition-all hover:scale-105 hover:brightness-110 active:scale-95 cursor-pointer"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Ask Nira AI</span>
            </button>
            <button
              type="button"
              onClick={() => navigateTo('help')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-black text-white backdrop-blur-sm transition-all hover:bg-white/20 cursor-pointer"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Help Center & FAQs →</span>
            </button>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════════════
          INTERACTIVE STEP-BY-STEP GUIDANCE TOUR OVERLAY (BOX 1 -> 2 -> 3...)
          ═══════════════════════════════════════════════════════════════════ */}
      {showTourModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <Card
            variant="standard"
            padding="lg"
            className="max-w-xl w-full space-y-5 animate-in zoom-in-95 duration-200 border-2 border-purple-200 shadow-2xl"
          >
            {/* Header with Title and Close */}
            <div className="flex items-center justify-between border-b border-purple-50 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs">
                  ✨
                </div>
                <div>
                  <h3 className="font-display font-black text-base text-slate-900 leading-tight">
                    Interactive Journey Guide
                  </h3>
                  <p className="text-[11px] font-semibold text-purple-700">
                    Step {tourStep + 1} of {tourSteps.length}: {tourSteps[tourStep].boxLabel}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTourModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Stepper Progress Bubbles: Box 1 -> Box 2 -> Box 3 -> Box 4 -> Box 5 */}
            <div className="flex items-center justify-between gap-1 px-1">
              {tourSteps.map((s, idx) => (
                <React.Fragment key={idx}>
                  <button
                    type="button"
                    onClick={() => setTourStep(idx)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      tourStep === idx
                        ? 'bg-[#7C3AED] text-white shadow-sm scale-105'
                        : tourStep > idx
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500 hover:bg-purple-50'
                    }`}
                  >
                    <span>Box {idx + 1}</span>
                  </button>
                  {idx < tourSteps.length - 1 && (
                    <span className={`text-[10px] font-bold ${tourStep > idx ? 'text-emerald-500' : 'text-slate-300'}`}>
                      ➔
                    </span>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Active Box Card Content */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-purple-50/70 via-white to-purple-50/40 border border-purple-100 space-y-4">
              <div className="flex items-start gap-4">
                {/* Mascot */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center">
                  <img
                    src={tourSteps[tourStep].mascot}
                    alt="Step Mascot"
                    className="w-full h-full object-contain drop-shadow-sm animate-bounce-gentle"
                  />
                </div>

                {/* Content */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
                    {tourSteps[tourStep].boxLabel}
                  </span>
                  <h4 className="font-bold text-sm sm:text-base text-slate-900">
                    {tourSteps[tourStep].title}
                  </h4>
                  <div className="p-2.5 rounded-xl bg-white border border-purple-100 text-xs text-slate-700 font-medium shadow-2xs leading-relaxed">
                    💬 "{tourSteps[tourStep].speech}"
                  </div>
                </div>
              </div>

              {/* Preview Chip */}
              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-purple-100/50 border border-purple-200 text-purple-950 font-bold">
                <span className="text-[11px] text-slate-500 font-medium">Live Action:</span>
                <span className="truncate">{tourSteps[tourStep].preview}</span>
              </div>
            </div>

            {/* Bottom Actions Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={tourStep === 0}
                  onClick={() => setTourStep((prev) => Math.max(0, prev - 1))}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs disabled:opacity-30 cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (tourStep < tourSteps.length - 1) {
                      setTourStep((prev) => prev + 1);
                    } else {
                      setShowTourModal(false);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 font-black text-xs cursor-pointer"
                >
                  {tourStep < tourSteps.length - 1 ? `Box ${tourStep + 2} (Tap) ➔` : 'Complete Guide ✓'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowTourModal(false);
                  navigateTo(tourSteps[tourStep].route as any);
                }}
                className="py-2.5 px-5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-black text-xs shadow-md shadow-purple-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{tourSteps[tourStep].actionLabel}</span>
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default HomePage;
