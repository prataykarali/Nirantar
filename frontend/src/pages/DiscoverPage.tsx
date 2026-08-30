import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Calendar,
  Search,
  ArrowRight,
  ArrowLeftRight,
  Train,
  CheckCircle2,
  Edit3,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { useJourney } from '../context/JourneyContext';
import { POPULAR_STATIONS, Station, searchStations, findStation, VERIFIED_PLATFORM_HUBS } from '../data/stationData';
import { CitizenCharacter } from '../components/characters/CitizenCharacter';
import { NiraRobot } from '../components/characters/NiraRobot';
import { Card } from '../design-system/components/Card';
import { SafeAssistParser, SafeAssistResult } from '../utils/SafeAssistParser';
import { TouristDestinationsModal } from '../components/journey/TouristDestinationsModal';
import { DISCOVER_SERVICES } from '../data/discoverServices';
import { DiscoveryMatch, resolveDiscoveryIntent } from '../utils/discoverIntent';

export const DiscoverPage: React.FC = () => {
  const {
    searchParams,
    executeSearch,
    navigateTo,
  } = useJourney();

  // Station Form States
  const [fromQuery, setFromQuery] = useState(searchParams.fromStation.city);
  const [toQuery, setToQuery] = useState(searchParams.toStation.city);
  const [selectedFrom, setSelectedFrom] = useState<Station>(searchParams.fromStation);
  const [selectedTo, setSelectedTo] = useState<Station>(searchParams.toStation);
  const [activeZoneTab, setActiveZoneTab] = useState<'all' | 'north' | 'central' | 'east' | 'west' | 'south'>('all');
  const todayIso = new Date().toISOString().split('T')[0];
  const tomorrowIso = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  })();

  const [travelDate, setTravelDate] = useState(
    searchParams.travelDate && /^\d{4}-\d{2}-\d{2}$/.test(searchParams.travelDate)
      ? searchParams.travelDate
      : tomorrowIso
  );

  const [fromSuggestions, setFromSuggestions] = useState<Station[]>([]);
  const [toSuggestions, setToSuggestions] = useState<Station[]>([]);
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);

  // Conversational / SafeAssist States
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showDestinationsModal, setShowDestinationsModal] = useState(false);
  const [voiceQuery, setVoiceQuery] = useState('');
  const [assistResult, setAssistResult] = useState<SafeAssistResult | null>(null);
  const [assistSource, setAssistSource] = useState<'nvidia' | 'safe_assist' | null>(null);
  const [assistLoading, setAssistLoading] = useState(false);
  const [serviceQuery, setServiceQuery] = useState('');
  const [serviceMatch, setServiceMatch] = useState<DiscoveryMatch | null>(null);

  // Handle Autocomplete
  const handleFromChange = (val: string) => {
    setFromQuery(val);
    if (val.trim().length > 0) {
      setFromSuggestions(searchStations(val, 5));
      setShowFromDropdown(true);
    } else {
      setFromSuggestions([]);
      setShowFromDropdown(false);
    }
  };

  const handleToChange = (val: string) => {
    setToQuery(val);
    if (val.trim().length > 0) {
      setToSuggestions(searchStations(val, 5));
      setShowToDropdown(true);
    } else {
      setToSuggestions([]);
      setShowToDropdown(false);
    }
  };

  const handleSelectFrom = (station: Station) => {
    setSelectedFrom(station);
    setFromQuery(`${station.city} (${station.code})`);
    setShowFromDropdown(false);
  };

  const handleSelectTo = (station: Station) => {
    setSelectedTo(station);
    setToQuery(`${station.city} (${station.code})`);
    setShowToDropdown(false);
  };

  const handleSwapStations = () => {
    const tempStation = selectedFrom;
    const tempQuery = fromQuery;
    setSelectedFrom(selectedTo);
    setFromQuery(toQuery);
    setSelectedTo(tempStation);
    setToQuery(tempQuery);
  };

  // Submit Journey Search
  const handleFormSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const resolvedFrom = selectedFrom || findStation(fromQuery);
    const resolvedTo = selectedTo || findStation(toQuery);

    if (!resolvedFrom) {
      setShowFromDropdown(true);
      return;
    }
    if (!resolvedTo) {
      setShowToDropdown(true);
      return;
    }

    executeSearch({
      fromStation: resolvedFrom,
      toStation: resolvedTo,
      travelDate,
      passengersCount: searchParams.passengersCount || 1,
      classType: 'All Classes',
      quota: 'General (GN)',
    });
  };

  const handleOpenAssistModal = () => {
    setVoiceQuery('');
    setAssistResult(null);
    setShowVoiceModal(true);
  };

  // Local deterministic intent parsing.
  const handleProcessIntent = (text: string) => {
    if (!text.trim()) return;
    setAssistLoading(true);
    const result = SafeAssistParser.parse(text);
    setAssistResult(result);
    setAssistSource('safe_assist');
    setAssistLoading(false);
  };

  // Confirm interpretation and proceed
  const handleConfirmIntent = () => {
    if (!assistResult) return;
    if (assistResult.intent === 'SEARCH_TRAINS' && assistResult.entities.from && assistResult.entities.to) {
      setShowVoiceModal(false);
      executeSearch({
        fromStation: assistResult.entities.from,
        toStation: assistResult.entities.to,
        travelDate: assistResult.entities.date || travelDate,
        passengersCount: assistResult.entities.passengers || 1,
        classType: 'All Classes',
        quota: 'General (GN)',
      });
    } else if (assistResult.intent === 'TRACK_TRAIN') {
      setShowVoiceModal(false);
      navigateTo('track');
    } else if (assistResult.intent === 'VIEW_TICKET') {
      setShowVoiceModal(false);
      navigateTo('my-journeys');
    } else if (assistResult.intent === 'PAYMENT_HELP') {
      setShowVoiceModal(false);
      navigateTo('payments');
    }
  };

  // 4 Popular Destinations
  const popularDestinations = [
    {
      id: 'delhi-mumbai',
      title: 'Delhi to Mumbai',
      from: POPULAR_STATIONS[0], // NDLS
      to: POPULAR_STATIONS[2],   // MMCT
      fastest: 'Fastest • 2 Trains',
      landmark: '/assets/images/landmarks/delhi_mumbai.png',
    },
    {
      id: 'delhi-bangalore',
      title: 'Delhi to Bangalore',
      from: POPULAR_STATIONS[0], // NDLS
      to: POPULAR_STATIONS[3],   // SBC
      fastest: 'Fastest • 3 Trains',
      landmark: '/assets/images/landmarks/delhi_bangalore.png',
    },
    {
      id: 'mumbai-pune',
      title: 'Mumbai to Pune',
      from: POPULAR_STATIONS[2], // MMCT
      to: POPULAR_STATIONS[5],   // PUNE
      fastest: 'Fastest • 5 Trains',
      landmark: '/assets/images/landmarks/mumbai_pune.png',
    },
    {
      id: 'kolkata-puri',
      title: 'Kolkata to Puri',
      from: POPULAR_STATIONS[1], // HWH
      to: POPULAR_STATIONS[4],   // PURI
      fastest: 'Fastest • 2 Trains',
      landmark: '/assets/images/landmarks/kolkata_puri.png',
    },
  ];

  // 3 Popular Journeys
  const popularJourneys = [
    {
      id: 'pj-1',
      fromCode: 'NDLS',
      fromCity: 'New Delhi',
      toCode: 'MMCT',
      toCity: 'Mumbai Central',
      trainName: 'Duronto Express • 12259',
      duration: '15h 45m',
      fromStation: POPULAR_STATIONS[0],
      toStation: POPULAR_STATIONS[2],
    },
    {
      id: 'pj-2',
      fromCode: 'HWH',
      fromCity: 'Howrah',
      toCode: 'PURI',
      toCity: 'Puri',
      trainName: 'Shatabdi Express • 12021',
      duration: '8h 30m',
      fromStation: POPULAR_STATIONS[1],
      toStation: POPULAR_STATIONS[4],
    },
    {
      id: 'pj-3',
      fromCode: 'CSTM',
      fromCity: 'Mumbai CST',
      toCode: 'SBC',
      toCity: 'Bengaluru',
      trainName: 'Udyan Express • 11301',
      duration: '17h 20m',
      fromStation: POPULAR_STATIONS[2],
      toStation: POPULAR_STATIONS[3],
    },
  ];

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-4 select-none">
      {/* Optional service-discovery panel is intentionally hidden to keep this page focused on route search. */}
      {serviceMatch && false && (<section aria-labelledby="service-discovery-title" className="rounded-3xl border border-purple-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-purple-700">Nirantar Discover</p>
            <h1 id="service-discovery-title" className="mt-1 font-display text-xl font-black text-slate-950">You know what you need. We find the service.</h1>
            <p className="mt-1 max-w-2xl text-xs font-medium leading-relaxed text-slate-600">Describe a railway task and get a clear explanation, what you need, and the official place to complete it.</p>
          </div>
          <span className="w-fit rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-800 ring-1 ring-emerald-100">Offline, deterministic guide</span>
        </div>

        <form onSubmit={(event) => { event.preventDefault(); setServiceMatch(resolveDiscoveryIntent(serviceQuery)); }} className="mt-4 flex gap-2">
          <input value={serviceQuery} onChange={(event) => setServiceQuery(event.target.value)} placeholder="Try: Where do I check my PNR?" className="min-w-0 flex-1 rounded-2xl border border-purple-200 bg-purple-50/50 px-3.5 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-purple-600 focus:bg-white" aria-label="Describe the railway service you need" />
          <button type="submit" className="rounded-2xl bg-[#7C3AED] px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-[#6D28D9]">Find service</button>
        </form>

        {!serviceMatch && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {DISCOVER_SERVICES.slice(0, 7).map((service) => (
              <button key={service.id} type="button" onClick={() => { setServiceQuery(service.name); setServiceMatch({ service, confidence: 1 }); }} className="rounded-full border border-purple-100 bg-purple-50 px-2.5 py-1 text-[10px] font-bold text-purple-900 transition hover:border-purple-300 hover:bg-purple-100">{service.icon} {service.name}</button>
            ))}
          </div>
        )}

        {serviceMatch && (
          <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3.5 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800">You want</p>
                <h2 className="mt-0.5 text-sm font-black text-slate-950">{serviceMatch!.service.icon} {serviceMatch!.service.name}</h2>
                <p className="mt-1 text-xs font-medium leading-relaxed text-slate-700">{serviceMatch!.service.summary}</p>
              </div>
              <button type="button" onClick={() => setServiceMatch(null)} className="self-start text-[11px] font-bold text-slate-500 hover:text-purple-800">Clear</button>
            </div>
            <div className="mt-3 grid gap-2 text-[11px] sm:grid-cols-2">
              <div className="rounded-xl bg-white/80 p-2.5"><span className="font-black text-slate-900">You’ll need: </span><span className="font-medium text-slate-600">{serviceMatch!.service.needs}</span></div>
              <div className="rounded-xl bg-white/80 p-2.5"><span className="font-black text-slate-900">Nirantar can help: </span><span className="font-medium text-slate-600">{serviceMatch!.service.nirantarHelp}</span></div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {serviceMatch!.service.officialUrl !== '#' && <a href={serviceMatch!.service.officialUrl} target="_blank" rel="noreferrer" className="rounded-xl bg-[#7C3AED] px-3 py-2 text-[11px] font-black text-white transition hover:bg-[#6D28D9]">Open {serviceMatch!.service.officialName} ↗</a>}
              {serviceMatch!.service.internalRoute && <button type="button" onClick={() => navigateTo(serviceMatch!.service.internalRoute!)} className="rounded-xl border border-purple-200 bg-white px-3 py-2 text-[11px] font-black text-purple-800 transition hover:bg-purple-50">Get Nirantar guidance →</button>}
            </div>
            <p className="mt-2 text-[10px] font-medium text-slate-500">Nirantar guides; official railway services execute bookings, changes and complaints.</p>
          </div>
        )}
      </section>)}

      {/* ═══════════════════════════════════════════════════════════════════
          1. DISCOVER HERO BANNER (Distinct Modern IRCTC Station BG + Thinking Ananya)
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative rounded-2xl sm:rounded-[28px] overflow-hidden min-h-[170px] sm:min-h-[210px] lg:min-h-[225px] bg-gradient-to-r from-[#F7F4FD] via-[#F3EDFD] to-[#ECE2FE] shadow-[0_4px_25px_rgba(88,28,135,0.03)] border border-purple-100/50">
        {/* Clean Background Modern IRCTC Station Image */}
        <img
          src="/assets/images/discover_station_bg.jpg"
          alt="IRCTC Modern Platform"
          className="absolute inset-0 w-full h-full object-cover object-right pointer-events-none select-none"
        />

        {/* Soft readable gradient mask on the left */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 via-[48%] to-transparent pointer-events-none" />

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col justify-between h-full min-h-[170px] sm:min-h-[210px] lg:min-h-[225px] p-4 sm:p-7">
          <div className="max-w-xl space-y-1.5 sm:space-y-2">
            {/* HEADLINE: Black upper, Blue lower, spaced out, no red line */}
            <h1 className="font-display font-black text-2xl sm:text-4xl lg:text-[3.2rem] leading-[1.15] tracking-tight">
              <span className="text-slate-950 block">
                Where would
              </span>
              <span className="text-[#2563EB] block mt-0.5 sm:mt-1">
                you like to go?
              </span>
            </h1>

            <p className="text-[11px] sm:text-sm font-bold text-slate-600 pt-0.5 sm:pt-1">
              Speak or search routes across 8,000+ Indian Railway stations.
            </p>
          </div>

          {/* Right Side Transparent Girl Avatar Cutout (Ananya Thinking) */}
          <div className="hidden md:flex absolute right-6 lg:right-14 bottom-0 h-[96%] max-h-[225px] items-end pointer-events-none select-none z-10 animate-in fade-in slide-in-from-right-8 duration-700">
            <img
              src="/assets/images/characters/citizen_thinking.png"
              alt="Ananya Travel Thinking"
              className="h-full object-contain drop-shadow-[0_15px_30px_rgba(88,28,135,0.22)]"
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          2. FLOATING JOURNEY SEARCH FORM (Elevated Higher Over Hero)
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="bg-white rounded-2xl sm:rounded-[24px] p-2.5 sm:p-3 shadow-[0_8px_30px_rgba(88,28,135,0.08)] border border-purple-100/90 -mt-6 sm:-mt-10 relative z-20 mx-1 sm:mx-4">
        <form onSubmit={handleFormSearch} className="flex flex-col lg:flex-row items-center gap-2 sm:gap-2.5">
          {/* FROM FIELD */}
          <div className="relative flex-1 w-full">
            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-purple-50/40 hover:bg-purple-50/80 border border-purple-100 focus-within:border-purple-600 focus-within:bg-white transition-all">
              <MapPin className="w-5 h-5 text-purple-700 shrink-0" />
              <div className="flex-1 min-w-0">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                  From
                </label>
                <input
                  type="text"
                  value={fromQuery}
                  onChange={(e) => handleFromChange(e.target.value)}
                  onFocus={() => {
                    setFromSuggestions(POPULAR_STATIONS.slice(0, 5));
                    setShowFromDropdown(true);
                  }}
                  placeholder="Enter source station"
                  className="w-full bg-transparent text-sm sm:text-base font-black text-slate-900 focus:outline-none placeholder:text-slate-400 truncate"
                />
              </div>
            </div>

            {/* From Autocomplete Dropdown */}
            {showFromDropdown && fromSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-purple-100 py-2 z-50 max-h-56 overflow-y-auto">
                {fromSuggestions.map((s) => (
                  <button
                    key={s.code}
                    type="button"
                    onClick={() => handleSelectFrom(s)}
                    className="w-full px-4 py-2 text-left hover:bg-purple-50 flex items-center justify-between group text-xs cursor-pointer"
                  >
                    <div>
                      <span className="font-black text-slate-900 group-hover:text-purple-700 text-sm">{s.city}</span>
                      <span className="text-slate-400 ml-1.5 font-semibold">{s.name}</span>
                    </div>
                    <span className="font-mono font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md text-[11px]">
                      {s.code}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* From Unavailable Notice */}
            {showFromDropdown && fromSuggestions.length === 0 && fromQuery.trim().length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-amber-200 p-3 z-50 animate-in fade-in space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-amber-700 text-sm">📍</span>
                  <div>
                    <h5 className="text-xs font-black text-amber-950">Station Unavailable for Now</h5>
                    <p className="text-[11px] text-amber-900/90 font-medium">"{fromQuery.trim()}" is not on the direct network. Try a major nearby hub:</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 pt-1 border-t border-amber-100">
                  {[
                    { code: 'NDLS', city: 'New Delhi' },
                    { code: 'HWH', city: 'Howrah' },
                    { code: 'CSMT', city: 'Mumbai' },
                    { code: 'SBC', city: 'Bengaluru' },
                    { code: 'MAS', city: 'Chennai' },
                    { code: 'JP', city: 'Jaipur' },
                    { code: 'LKO', city: 'Lucknow' },
                    { code: 'PNBE', city: 'Patna' },
                    { code: 'GHY', city: 'Guwahati' },
                    { code: 'ADI', city: 'Ahmedabad' },
                  ].map((hub) => (
                    <button
                      key={hub.code}
                      type="button"
                      onClick={() => {
                        const found = POPULAR_STATIONS.find((s) => s.code === hub.code);
                        if (found) handleSelectFrom(found);
                      }}
                      className="px-2 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-900 text-[11px] font-bold border border-purple-200 cursor-pointer"
                    >
                      {hub.city} ({hub.code})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SWAP BUTTON */}
          <button
            type="button"
            onClick={handleSwapStations}
            className="w-9 h-9 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 border border-purple-200 transition-transform active:scale-90 cursor-pointer shadow-sm"
            title="Swap Stations"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>

          {/* TO FIELD */}
          <div className="relative flex-1 w-full">
            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-purple-50/40 hover:bg-purple-50/80 border border-purple-100 focus-within:border-purple-600 focus-within:bg-white transition-all">
              <MapPin className="w-5 h-5 text-purple-700 shrink-0" />
              <div className="flex-1 min-w-0">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                  To
                </label>
                <input
                  type="text"
                  value={toQuery}
                  onChange={(e) => handleToChange(e.target.value)}
                  onFocus={() => {
                    setToSuggestions(POPULAR_STATIONS.slice(0, 5));
                    setShowToDropdown(true);
                  }}
                  placeholder="Enter destination station"
                  className="w-full bg-transparent text-sm sm:text-base font-black text-slate-900 focus:outline-none placeholder:text-slate-400 truncate"
                />
              </div>
            </div>

            {/* To Autocomplete Dropdown */}
            {showToDropdown && toSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-purple-100 py-2 z-50 max-h-56 overflow-y-auto">
                {toSuggestions.map((s) => (
                  <button
                    key={s.code}
                    type="button"
                    onClick={() => handleSelectTo(s)}
                    className="w-full px-4 py-2 text-left hover:bg-purple-50 flex items-center justify-between group text-xs cursor-pointer"
                  >
                    <div>
                      <span className="font-black text-slate-900 group-hover:text-purple-700 text-sm">{s.city}</span>
                      <span className="text-slate-400 ml-1.5 font-semibold">{s.name}</span>
                    </div>
                    <span className="font-mono font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md text-[11px]">
                      {s.code}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* To Unavailable Notice */}
            {showToDropdown && toSuggestions.length === 0 && toQuery.trim().length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-amber-200 p-3 z-50 animate-in fade-in space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-amber-700 text-sm">📍</span>
                  <div>
                    <h5 className="text-xs font-black text-amber-950">Station Unavailable for Now</h5>
                    <p className="text-[11px] text-amber-900/90 font-medium">"{toQuery.trim()}" is not on the direct network. Try a major nearby hub:</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 pt-1 border-t border-amber-100">
                  {[
                    { code: 'NDLS', city: 'New Delhi' },
                    { code: 'HWH', city: 'Howrah' },
                    { code: 'CSMT', city: 'Mumbai' },
                    { code: 'SBC', city: 'Bengaluru' },
                    { code: 'MAS', city: 'Chennai' },
                    { code: 'JP', city: 'Jaipur' },
                    { code: 'LKO', city: 'Lucknow' },
                    { code: 'PNBE', city: 'Patna' },
                    { code: 'GHY', city: 'Guwahati' },
                    { code: 'ADI', city: 'Ahmedabad' },
                  ].map((hub) => (
                    <button
                      key={hub.code}
                      type="button"
                      onClick={() => {
                        const found = POPULAR_STATIONS.find((s) => s.code === hub.code);
                        if (found) handleSelectTo(found);
                      }}
                      className="px-2 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-900 text-[11px] font-bold border border-purple-200 cursor-pointer"
                    >
                      {hub.city} ({hub.code})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* DATE FIELD */}
          <div className="flex-1 w-full sm:max-w-xs">
            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-purple-50/40 hover:bg-purple-50/80 border border-purple-100 focus-within:border-purple-600 focus-within:bg-white transition-all">
              <Calendar className="w-5 h-5 text-purple-700 shrink-0" />
              <div className="flex-1 min-w-0">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Travel Date
                </label>
                <input
                  type="date"
                  value={travelDate}
                  min={todayIso}
                  onChange={(e) => setTravelDate(e.target.value)}
                  className="w-full bg-transparent text-sm sm:text-base font-black text-slate-900 focus:outline-none cursor-pointer"
                  aria-label="Select journey travel date"
                />
              </div>
            </div>
          </div>


          {/* SEARCH SUBMIT BUTTON */}
          <button
            type="submit"
            className="w-full sm:w-11 h-11 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-600/25 active:scale-95 transition-all cursor-pointer"
            title="Find Trains"
          >
            <Search className="w-5 h-5" />
          </button>
        </form>

        {/* TOP VERIFIED POPULAR PLATFORMS & STATIONS QUICK SELECTOR */}
        <div className="mt-2.5 pt-2 border-t border-purple-100/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-purple-950 font-black shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-purple-700" />
            <span>Top Verified Platform Hubs:</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar text-xs">
            {[
              { code: 'NDLS', name: 'New Delhi', city: 'Delhi', platforms: 'Plat 1-16' },
              { code: 'MMCT', name: 'Mumbai Central', city: 'Mumbai', platforms: 'Plat 1-8' },
              { code: 'HWH', name: 'Howrah Jn', city: 'Kolkata', platforms: 'Plat 1-23' },
              { code: 'SBC', name: 'KSR Bengaluru', city: 'Bengaluru', platforms: 'Plat 1-10' },
              { code: 'MAS', name: 'Chennai Central', city: 'Chennai', platforms: 'Plat 1-12' },
              { code: 'PRYJ', name: 'Prayagraj Jn', city: 'Prayagraj', platforms: 'Plat 1-10' },
              { code: 'BSB', name: 'Varanasi Jn', city: 'Varanasi', platforms: 'Plat 1-9' },
              { code: 'PUNE', name: 'Pune Jn', city: 'Pune', platforms: 'Plat 1-6' },
              { code: 'ADI', name: 'Ahmedabad Jn', city: 'Ahmedabad', platforms: 'Plat 1-12' },
            ].map((st) => (
              <button
                key={st.code}
                type="button"
                onClick={() => {
                  const match = findStation(st.code);
                  if (match) {
                    if (selectedFrom.code === match.code) {
                      setSelectedTo(match);
                      setToQuery(`${match.city} (${match.code})`);
                    } else {
                      setSelectedTo(match);
                      setToQuery(`${match.city} (${match.code})`);
                    }
                  }
                }}
                className="px-2.5 py-1 rounded-full bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-950 font-bold text-[11px] flex items-center gap-1 shrink-0 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                title={`Quick select ${st.name} (${st.platforms})`}
              >
                <span>{st.city} ({st.code})</span>
                <span className="text-[9px] font-mono text-purple-700 bg-purple-200/60 px-1 rounded">{st.platforms}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          3. EXPLORE POPULAR DESTINATIONS (4 Landmark Cards)
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-display font-black text-sm sm:text-base text-slate-900 tracking-tight">
            Explore popular destinations
          </h2>
          <button
            type="button"
            onClick={() => setShowDestinationsModal(true)}
            className="text-xs font-black text-[#7C3AED] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View all</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {popularDestinations.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                executeSearch({
                  fromStation: item.from,
                  toStation: item.to,
                  travelDate,
                  passengersCount: 1,
                  classType: 'All Classes',
                  quota: 'General (GN)',
                })
              }
              className="bg-white rounded-[20px] p-3 shadow-[0_2px_10px_rgba(88,28,135,0.03)] border border-purple-50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left flex flex-col justify-between h-36 group cursor-pointer"
            >
              {/* Landmark Graphic */}
              <div className="w-full h-16 rounded-lg overflow-hidden flex items-center justify-center bg-[#FFF8F3]/30">
                <img
                  src={item.landmark}
                  alt={item.title}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                />
              </div>

              {/* Title and Action Row with bold fonts */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <h3 className="font-display font-black text-xs sm:text-sm text-slate-900 group-hover:text-[#7C3AED] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400">
                    {item.fastest}
                  </p>
                </div>
                <div className="w-5 h-5 rounded-full border border-purple-200 text-[#7C3AED] flex items-center justify-center group-hover:bg-[#7C3AED] group-hover:text-white group-hover:border-[#7C3AED] transition-all">
                  <ArrowRight className="w-2.5 h-2.5" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          4. POPULAR JOURNEYS (3 Timeline Cards Elevated Higher)
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-display font-black text-sm sm:text-base text-slate-900 tracking-tight">
            Popular journeys
          </h2>
          <button
            type="button"
            onClick={() => setShowDestinationsModal(true)}
            className="text-xs font-black text-[#7C3AED] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View all</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {popularJourneys.map((journey) => (
            <button
              key={journey.id}
              type="button"
              onClick={() =>
                executeSearch({
                  fromStation: journey.fromStation,
                  toStation: journey.toStation,
                  travelDate,
                  passengersCount: 1,
                  classType: 'All Classes',
                  quota: 'General (GN)',
                })
              }
              className="bg-white rounded-[20px] p-3.5 shadow-[0_2px_10px_rgba(88,28,135,0.03)] border border-purple-50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left group cursor-pointer space-y-2"
            >
              {/* Route Timeline with Train icon & Bigger Bold Station Codes */}
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <span className="font-display font-black text-base text-slate-900 block leading-tight">
                    {journey.fromCode}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400">
                    {journey.fromCity}
                  </span>
                </div>

                {/* Train Track Divider */}
                <div className="flex-1 flex items-center justify-center px-3">
                  <div className="w-full h-0.5 bg-slate-200 relative flex items-center justify-center">
                    <div className="w-5 h-5 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
                      <Train className="w-2.5 h-2.5" />
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-display font-black text-base text-slate-900 block leading-tight">
                    {journey.toCode}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400">
                    {journey.toCity}
                  </span>
                </div>
              </div>

              {/* Bottom Details Row */}
              <div className="flex items-center justify-between pt-1 border-t border-purple-50/60 text-[11px]">
                <span className="font-bold text-slate-700 truncate">
                  {journey.trainName}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-500">{journey.duration}</span>
                  <div className="w-5 h-5 rounded-full border border-purple-200 text-[#7C3AED] flex items-center justify-center group-hover:bg-[#7C3AED] group-hover:text-white group-hover:border-[#7C3AED] transition-all">
                    <ArrowRight className="w-2.5 h-2.5" />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          5. SAFEASSIST VOICE & NATURAL LANGUAGE INTENT MODAL
          ═══════════════════════════════════════════════════════════════════ */}
      {showVoiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card variant="standard" padding="lg" className="max-w-xl w-full space-y-5 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <NiraRobot size="sm" expression="speaking" isFloating />
                <div>
                  <h3 className="font-display font-black text-lg text-purple-950">
                    Natural Language Journey Finder
                  </h3>
                  <p className="text-xs text-slate-500 font-bold">
                    Type your journey naturally in simple English or Hinglish
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowVoiceModal(false);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Conversational Input Banner */}
            <div className="p-4 rounded-3xl bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 text-white space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-300 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  {assistLoading ? 'Nira is interpreting…' : 'Nira SafeAssist Ready'}
                </span>
                <span className="text-[10px] font-mono text-purple-300 font-bold bg-purple-900/80 px-2 py-0.5 rounded">
                  Local AI parser
                </span>
              </div>

              {/* Large Conversational Input */}
              <div className="relative">
                <input
                  type="text"
                  value={voiceQuery}
                  onChange={(e) => setVoiceQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleProcessIntent(voiceQuery);
                  }}
                  placeholder="e.g. I want to travel from Delhi to Mumbai tomorrow evening for 2 passengers"
                  className="w-full bg-purple-900/60 border-2 border-purple-400/40 rounded-2xl px-4 py-3 text-sm sm:text-base font-bold text-white placeholder:text-purple-300/60 focus:outline-none focus:border-cyan-400 pr-12"
                />
                <button
                  type="button"
                  onClick={() => handleProcessIntent(voiceQuery)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-purple-950 flex items-center justify-center font-bold shadow-sm transition-all cursor-pointer"
                  title="Interpret"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* STRUCTURED INTENT INTERPRETATION CARD */}
            {assistResult && (
              <div className="p-4 rounded-3xl bg-purple-50/80 border-2 border-purple-200 space-y-3.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="flex items-center gap-2 text-xs font-mono font-black text-purple-900 uppercase">
                  <Sparkles className="w-4 h-4 text-purple-700" />
                  <span>
                    {assistSource === 'safe_assist'
                      ? 'Safe Assist Structured Interpretation'
                      : 'Nira Structured Interpretation'}
                  </span>
                </div>

                {/* Interpretation Fields Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-white p-3 rounded-2xl border border-purple-100">
                  <div>
                    <span className="text-[10px] uppercase font-black text-slate-400 block">From</span>
                    <span className="font-display font-black text-sm text-purple-950">
                      {assistResult.entities.from?.city || 'Delhi'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-black text-slate-400 block">To</span>
                    <span className="font-display font-black text-sm text-purple-950">
                      {assistResult.entities.to?.city || 'Mumbai'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-black text-slate-400 block">Date</span>
                    <span className="font-display font-black text-sm text-purple-950">
                      {assistResult.entities.dateLabel || 'Tomorrow'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-black text-slate-400 block">Time</span>
                    <span className="font-display font-black text-sm text-purple-950">
                      {assistResult.entities.timeOfDay || 'Anytime'}
                    </span>
                  </div>
                </div>

                {/* Nira Explanation */}
                <div className="flex items-start gap-2.5 text-xs font-bold text-slate-700 bg-purple-100/50 p-2.5 rounded-2xl">
                  <NiraRobot size="xs" expression="idea" isFloating={false} />
                  <p className="flex-1">{assistResult.explanation}</p>
                </div>

                {/* Action Buttons: "Find Trains" & "Edit details" */}
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleConfirmIntent}
                    className="flex-1 py-2.5 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-black text-sm flex items-center justify-center gap-2 shadow-md shadow-purple-600/25 active:scale-95 transition-all cursor-pointer"
                  >
                    <span>Find Trains</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (assistResult.entities.from) setSelectedFrom(assistResult.entities.from);
                      if (assistResult.entities.to) setSelectedTo(assistResult.entities.to);
                      setShowVoiceModal(false);
                    }}
                    className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-purple-200 text-slate-700 font-black text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4 text-purple-700" />
                    <span>Edit details</span>
                  </button>
                </div>
              </div>
            )}

            {/* Quick Demo Voice Prompts */}
            {!assistResult && (
              <div className="space-y-1.5">
                <span className="text-xs font-mono font-bold text-purple-900 uppercase">
                  Tap to try example conversational requests:
                </span>
                {[
                  '“I want to travel from Delhi to Mumbai tomorrow evening for 2 people”',
                  '“Where is my train 12302 Rajdhani?”',
                  '“Show my confirmed booking ticket and PNR”',
                  '“Payment failed for my UPI transaction”',
                ].map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setVoiceQuery(sample.replace(/[“”]/g, ''));
                      handleProcessIntent(sample.replace(/[“”]/g, ''));
                    }}
                    className="w-full p-2.5 rounded-2xl bg-purple-50 hover:bg-purple-100 text-left text-xs font-bold text-purple-950 flex items-center justify-between group cursor-pointer"
                  >
                    <span>{sample}</span>
                    <span className="text-purple-700 font-mono text-[11px] group-hover:underline">Interpret →</span>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TOP TOURIST DESTINATIONS, RATINGS, REVIEWS & OFFERS MODAL */}
      <TouristDestinationsModal
        isOpen={showDestinationsModal}
        onClose={() => setShowDestinationsModal(false)}
      />
    </div>
  );
};

export default DiscoverPage;
