import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  MapPin,
  Calendar,
  Users,
  ArrowRight,
  Train,
  Sparkles,
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

export const HomePage: React.FC = () => {
  const {
    searchParams,
    executeSearch,
    navigateTo,
    startGuidanceTour,
  } = useJourney();

  const [nlQuery, setNlQuery] = useState('');
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showTourModal, setShowTourModal] = useState(false);
  const [tourStep, setTourStep] = useState(0);

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

  // 4 Feature Cards (exact match to reference mockup, clean & unboxed)
  const featureCards = [
    {
      id: 'find-trains',
      title: 'Find Trains',
      image: '/assets/images/cards/card_find_trains.png',
      alt: 'Find Trains 3D Illustration',
      onClick: () => navigateTo('discover'),
    },
    {
      id: 'pnr-status',
      title: 'PNR Status',
      image: '/assets/images/cards/card_pnr_status.png',
      alt: 'PNR Status 3D Ticket',
      onClick: () => navigateTo('my-journeys'),
    },
    {
      id: 'live-trains',
      title: 'Live Trains',
      image: '/assets/images/cards/card_live_trains.png',
      alt: 'Live Trains 3D Map Pin',
      badge: 'LIVE',
      onClick: () => navigateTo('track'),
    },
    {
      id: 'train-schedule',
      title: 'Train Schedule',
      image: '/assets/images/cards/card_train_schedule.png',
      alt: 'Train Schedule 3D Calendar',
      onClick: () => navigateTo('discover'),
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
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs sm:text-sm text-white block">
                Want a Step-by-Step Guided Walkthrough?
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-black px-2 py-0.2 rounded-full uppercase tracking-wider">
                Live Spotlight Tour
              </span>
            </div>
            <p className="text-[11px] text-purple-200 font-medium mt-0.5">
              Experience the full guided walkthrough with blurred overlays, live arrows, voice audio, and 1-tap booking!
            </p>
          </div>
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
        {/* Background Station Scene */}
        <img
          src="/assets/images/hero_station_bg.jpg"
          alt="Nirantar Railway Station"
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

          {/* RIGHT SIDE: Ananya Character Mascot holding Ticket */}
          <div className="hidden lg:block absolute right-14 bottom-0 pointer-events-none">
            <CitizenCharacter
              size="2xl"
              pose="booking"
              showBadge={false}
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          2. 4 UNBOXED FEATURE CARDS (2 Columns on mobile, 4 on desktop)
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {featureCards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={card.onClick}
            className="relative bg-white rounded-2xl sm:rounded-[28px] p-3 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-xl hover:shadow-purple-900/8 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-40 sm:h-56 text-left group cursor-pointer"
          >
            {/* LIVE Tag for Live Trains card */}
            {card.badge && (
              <span className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 bg-[#00B074] text-white text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded-md uppercase tracking-wider shadow-xs z-10">
                {card.badge}
              </span>
            )}

            {/* Transparent Circular 3D Illustration */}
            <div className="w-full flex-1 flex items-center justify-center">
              <img
                src={card.image}
                alt={card.alt}
                className="w-20 h-20 sm:w-28 sm:h-28 object-contain group-hover:scale-105 transition-transform duration-300 pointer-events-none select-none"
              />
            </div>

            {/* Bottom Row: Title + Arrow Action Button */}
            <div className="flex items-center justify-between pt-1">
              <span className="font-display font-black text-xs sm:text-base text-slate-900 group-hover:text-[#7C3AED] transition-colors truncate">
                {card.title}
              </span>
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-purple-200 text-[#7C3AED] flex items-center justify-center group-hover:bg-[#7C3AED] group-hover:text-white group-hover:border-[#7C3AED] transition-all shadow-xs shrink-0 ml-1">
                <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </div>
            </div>
          </button>
        ))}
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          3. GUIDANCE HIGHLIGHTS, TIPS FROM NIRA & HOW IT WORKS (MATCHING REF)
          ═══════════════════════════════════════════════════════════════════ */}
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
