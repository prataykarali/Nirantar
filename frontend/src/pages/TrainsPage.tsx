import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Clock,
  Tag,
  Heart,
  ShieldCheck,
  Lock,
  Headphones,
  Scale,
  X,
  ChevronDown,
  Train,
  Edit2,
} from 'lucide-react';
import { useJourney } from '../context/JourneyContext';
import { TrainDetail } from '../data/mockTrains';
import { findLocalTrains, LocalTrainRoute } from '../data/localTrainsData';

type FilterType = 'recommended' | 'fastest' | 'cheapest' | 'earliest' | 'availability';

export const TrainsPage: React.FC = () => {
  const {
    searchParams,
    availableTrains,
    selectTrain,
    executeSearch,
    navigateTo,
    activeSort,
    setActiveSort,
    activeHighlightTarget,
  } = useJourney();

  const localTrains = useMemo(() => {
    return findLocalTrains(searchParams.fromStation.code, searchParams.toStation.code);
  }, [searchParams.fromStation.code, searchParams.toStation.code]);

  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [selectedClassMap, setSelectedClassMap] = useState<Record<string, string>>({});
  const [expandedTrainId, setExpandedTrainId] = useState<string | null>(null);

  const activeFilter = activeSort as FilterType;
  const setActiveFilter = (val: FilterType) => {
    setActiveSort(val as any);
  };

  // Compare trains list
  const [compareList, setCompareList] = useState<TrainDetail[]>(() => {
    return availableTrains.slice(0, 2);
  });
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Toggle favorite
  const toggleFavorite = (trainNumber: string) => {
    setFavorites((prev) => ({ ...prev, [trainNumber]: !prev[trainNumber] }));
  };

  // Remove from compare list
  const removeCompare = (trainNumber: string) => {
    setCompareList((prev) => prev.filter((t) => t.trainNumber !== trainNumber));
  };

  // Helper to get minimum fare
  const getMinFare = (train: TrainDetail): number => {
    if (!train.classes || train.classes.length === 0) return 1500;
    return Math.min(...train.classes.map((c) => c.fare));
  };

  // Helper to parse duration to minutes
  const parseDurationMinutes = (dur: string): number => {
    const hMatch = dur.match(/(\d+)h/);
    const mMatch = dur.match(/(\d+)m/);
    const hours = hMatch ? parseInt(hMatch[1], 10) : 0;
    const mins = mMatch ? parseInt(mMatch[1], 10) : 0;
    return hours * 60 + mins;
  };

  // Filter & Sort Logic
  const filteredTrains = useMemo(() => {
    const trains = [...availableTrains];

    switch (activeFilter) {
      case 'fastest':
        return trains.sort((a, b) => parseDurationMinutes(a.durationHours) - parseDurationMinutes(b.durationHours));
      case 'cheapest':
        return trains.sort((a, b) => getMinFare(a) - getMinFare(b));
      case 'earliest':
        return trains.sort((a, b) => a.departureTime.localeCompare(b.departureTime));
      case 'availability':
        return trains.sort((a, b) => {
          const aSeats = a.classes.reduce((sum, c) => sum + (c.availableSeats || 0), 0);
          const bSeats = b.classes.reduce((sum, c) => sum + (c.availableSeats || 0), 0);
          return bSeats - aSeats;
        });
      case 'recommended':
      default:
        return trains.sort((a, b) => {
          const aRec = a.isFastest || a.isBestValue || !!a.aiRecommendationReason;
          const bRec = b.isFastest || b.isBestValue || !!b.aiRecommendationReason;
          return (bRec ? 1 : 0) - (aRec ? 1 : 0);
        });
    }
  }, [availableTrains, activeFilter]);

  // Format date display
  const formattedDate = (() => {
    if (!searchParams.travelDate) return 'Tomorrow, 24 May';
    const parts = searchParams.travelDate.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${d.getDate()} ${months[d.getMonth()]}`;
    }
    return searchParams.travelDate;
  })();

  // Days of week active indicators
  const daysOfWeek = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="max-w-7xl mx-auto space-y-2.5 pb-2 select-none font-sans text-slate-800">
      {/* ═══════════════════════════════════════════════════════════════════
          1. TOP ROUTE CONTEXT HEADER
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white rounded-2xl p-2.5 px-4 shadow-sm border border-purple-50">
        <div className="flex items-center gap-3">
          {/* Back Button */}
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="w-8 h-8 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-900 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Back to Search"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Route Title & Meta */}
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>{searchParams.fromStation.city} ({searchParams.fromStation.code})</span>
              <span className="text-purple-600 font-normal">→</span>
              <span>{searchParams.toStation.city} ({searchParams.toStation.code})</span>
            </h1>
            <p className="text-[11px] font-medium text-slate-500 mt-0.2 flex items-center gap-2">
              <span>{formattedDate}</span>
              <span>•</span>
              <span>{searchParams.passengersCount || 1} Adult</span>
              <span>•</span>
              <span>{searchParams.classType || 'AC Classes'}</span>
            </p>
          </div>
        </div>

        {/* Change Search Pill Button */}
        <button
          type="button"
          onClick={() => navigateTo('discover')}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-semibold transition-all self-start sm:self-center cursor-pointer"
        >
          <span>Change Search</span>
          <Edit2 className="w-3 h-3 text-purple-600" />
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          2. FILTERS & SORT CONTROLS
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'recommended' as FilterType, label: 'Recommended', icon: Sparkles },
            { id: 'fastest' as FilterType, label: 'Fastest', icon: Clock },
            { id: 'cheapest' as FilterType, label: 'Cheapest', icon: Tag },
            { id: 'earliest' as FilterType, label: 'Earliest', icon: Clock },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeFilter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveFilter(item.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-purple-900 text-white shadow-sm'
                    : 'bg-white hover:bg-purple-50/70 text-slate-700 border border-purple-100 shadow-sm'
                }`}
              >
                <Icon className={`w-3 h-3 ${isActive ? 'text-white' : 'text-purple-600'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <span>Sort by</span>
          <div className="relative">
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as FilterType)}
              className="appearance-none bg-white border border-purple-100 rounded-full px-3 py-1 pr-6 text-xs font-semibold text-slate-800 shadow-sm focus:outline-none focus:border-purple-600 cursor-pointer"
            >
              <option value="recommended">Recommended</option>
              <option value="fastest">Fastest Duration</option>
              <option value="cheapest">Lowest Fare</option>
              <option value="earliest">Earliest Departure</option>
              <option value="availability">Best Availability</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          3. MAIN TWO-COLUMN LAYOUT
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 items-start">
        {/* ──────────────── LEFT COLUMN: TRAIN CARDS (2 Cols) ──────────────── */}
        <div className="lg:col-span-2 space-y-2.5">
          {/* ─── Suburban & Local EMU Train Discovery Section ─── */}
          {localTrains && localTrains.length > 0 && (
            <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white rounded-2xl p-4 shadow-md border border-purple-400/40 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-600/60 border border-purple-400/50 flex items-center justify-center font-black text-sm">
                    🚆
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs sm:text-sm font-black text-white">
                        Suburban & Local EMU Trains
                      </h4>
                      <span className="text-[9px] font-black bg-emerald-400 text-slate-950 px-2 py-0.2 rounded-full uppercase">
                        Unreserved • High Frequency
                      </span>
                    </div>
                    <p className="text-[11px] text-purple-200 font-medium">
                      No advance reservation needed. Instant unreserved travel available.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {localTrains.map((lt) => (
                  <div
                    key={lt.id}
                    className="p-2.5 rounded-xl bg-white/10 border border-white/10 backdrop-blur-xs text-xs space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="font-bold text-white text-xs">{lt.name}</span>
                      <span className="font-mono font-black text-emerald-300">₹{lt.unreservedFare}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-purple-200">
                      <span>⏱️ {lt.frequencyText}</span>
                      <span>📍 {lt.platform}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-purple-300">
                      <span>Next departures:</span>
                      <strong className="text-white">{lt.nextDepartures.slice(0, 3).join(', ')}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredTrains.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-purple-100 shadow-sm text-center space-y-4 animate-in fade-in">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-3xl mx-auto border border-amber-200">
                🚆
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
                  <span>Direct Route Unavailable</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  No Direct Trains Found Between {searchParams.fromStation.city} and {searchParams.toStation.city}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  We checked <strong>550+ authentic Indian Railway routes</strong> in our verified database. No direct scheduled train operates between <strong>{searchParams.fromStation.name} ({searchParams.fromStation.code})</strong> and <strong>{searchParams.toStation.name} ({searchParams.toStation.code})</strong> on {formattedDate}.
                </p>
                <p className="text-[11px] text-purple-700 font-semibold bg-purple-50 p-2.5 rounded-xl border border-purple-100">
                  💡 Tip: Try booking connecting trains via major junctions like New Delhi (NDLS), Howrah (HWH), or Mumbai (CSMT).
                </p>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => navigateTo('discover')}
                  className="px-4 py-2 rounded-xl bg-purple-50 text-purple-900 border border-purple-200 text-xs font-bold hover:bg-purple-100 transition-colors cursor-pointer"
                >
                  ← Change Search Criteria
                </button>
                <button
                  type="button"
                  onClick={() =>
                    executeSearch({
                      fromStation: searchParams.fromStation,
                      toStation: searchParams.toStation,
                      travelDate: searchParams.travelDate,
                      passengersCount: 1,
                      classType: 'All Classes',
                      quota: 'General (GN)',
                    })
                  }
                  className="px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                >
                  Retry Search
                </button>
              </div>
            </div>
          ) : (
            filteredTrains.map((train, idx) => {
              const isFav = favorites[train.trainNumber];
              const isExpanded = expandedTrainId === train.trainNumber;
              const currentSelectedClass = selectedClassMap[train.trainNumber] || (train.classes[0]?.classCode || '3A');
              const minFare = getMinFare(train);

              // Theme colors per train type
              const isRajdhani = train.trainName.toLowerCase().includes('rajdhani');
              const isShatabdi = train.trainName.toLowerCase().includes('shatabdi');
              const trainColorClass = isRajdhani
                ? 'bg-purple-100 text-purple-800'
                : isShatabdi
                ? 'bg-blue-100 text-blue-800'
                : 'bg-emerald-100 text-emerald-800';

              const timelineDotColor = isRajdhani
                ? 'bg-purple-700 border-purple-200'
                : isShatabdi
                ? 'bg-blue-700 border-blue-200'
                : 'bg-emerald-700 border-emerald-200';

              const isRecommended = train.isFastest || train.isBestValue || !!train.aiRecommendationReason;

            const isCardHighlighted =
              activeHighlightTarget === `train_${train.trainNumber}` ||
              (activeHighlightTarget === 'train_cheapest' && idx === 0);

            return (
              <div
                key={train.trainNumber}
                id={`train_${train.trainNumber}`}
                className={`bg-white rounded-2xl p-3.5 transition-all duration-200 space-y-2.5 relative ${
                  isCardHighlighted
                    ? 'ring-2 ring-emerald-500 shadow-md border-emerald-400 bg-emerald-50/10'
                    : 'shadow-[0_2px_10px_rgba(88,28,135,0.03)] border border-purple-50 hover:shadow-md'
                }`}
              >
                {/* TOP ROW: ICON, NAME, RECOMMENDED TAG, FAVORITE */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {/* Train Icon Box */}
                    <div className={`w-8 h-8 rounded-xl ${trainColorClass} flex items-center justify-center shrink-0`}>
                      <Train className="w-4 h-4" />
                    </div>

                    {/* Name and Number */}
                    <div>
                      <div className="flex items-center gap-2">
                        {isCardHighlighted && (
                          <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                            <span>🟢 Recommended Option</span>
                          </span>
                        )}
                        {isRecommended && !isCardHighlighted && (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-1.5 py-0.2 rounded">
                            Recommended
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                        {train.trainNumber} • {train.trainName}
                      </h3>
                    </div>
                  </div>

                  {/* Bookmark Heart Button */}
                  <button
                    type="button"
                    onClick={() => toggleFavorite(train.trainNumber)}
                    className="w-6 h-6 rounded-full hover:bg-purple-50 text-slate-400 hover:text-purple-700 flex items-center justify-center transition-colors cursor-pointer"
                    title="Save to favorites"
                  >
                    <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                  </button>
                </div>

                {/* MIDDLE ROW: TIMELINE SCHEDULE */}
                <div className="grid grid-cols-3 items-center text-center sm:text-left gap-2 pt-0.5">
                  {/* Departure */}
                  <div className="text-left">
                    <span className="text-[10px] font-semibold text-slate-500 block truncate">
                      {train.fromStationName} ({train.fromStationCode})
                    </span>
                    <span className="text-base sm:text-lg font-bold text-slate-900 block leading-tight">
                      {train.departureTime}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 block">
                      24 May, Sat
                    </span>
                  </div>

                  {/* Center Timeline Track */}
                  <div className="flex flex-col items-center justify-center px-1">
                    <span className="text-[10px] font-bold text-slate-600 mb-0.5">
                      {train.durationHours}
                    </span>
                    <div className="w-full h-0.5 bg-slate-200 relative flex items-center justify-center my-0.5">
                      <div className={`w-2 h-2 rounded-full ${timelineDotColor} border-2 border-white shadow-sm`} />
                    </div>
                    {/* Runs on days */}
                    <div className="flex items-center gap-0.5 text-[8px] font-bold text-slate-400 mt-0.5">
                      <span className="text-[8px] font-medium text-slate-400 mr-0.5">Runs on:</span>
                      {daysOfWeek.map((day, dIdx) => (
                        <span
                          key={dIdx}
                          className={dIdx < 5 ? 'text-emerald-600 font-bold' : 'text-slate-300 font-normal'}
                        >
                          {day}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Arrival */}
                  <div className="text-right">
                    <span className="text-[10px] font-semibold text-slate-500 block truncate">
                      {train.toStationName} ({train.toStationCode})
                    </span>
                    <span className="text-base sm:text-lg font-bold text-slate-900 block leading-tight">
                      {train.arrivalTime}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 block">
                      25 May, Sun
                    </span>
                  </div>
                </div>

                {/* HIGH DEMAND CONCURRENCY & SEAT COUNTDOWN INDICATOR */}
                <div className="flex items-center justify-between text-[10px] font-bold text-amber-900 bg-amber-50/90 border border-amber-200/80 px-2.5 py-1 rounded-xl">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span>🔥 High Demand: Only {train.classes[0]?.availableSeats || 4} seats left in {currentSelectedClass}!</span>
                  </div>
                  <span className="text-amber-800 font-semibold hidden sm:inline">
                    👥 3 other citizens viewing right now
                  </span>
                </div>

                {/* BOTTOM ROW: CLASS AVAILABILITY PILLS & VIEW SEATS */}
                <div className="flex flex-wrap items-center justify-between pt-1.5 border-t border-purple-50 gap-2">
                  {/* Pricing info */}
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[10px] font-medium text-slate-400">From</span>
                    <span className="text-base font-bold text-slate-900">
                      ₹{minFare.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                      {currentSelectedClass}
                    </span>
                  </div>

                  {/* Class Chips / View Seats CTA */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const inList = compareList.some((t) => t.trainNumber === train.trainNumber);
                        if (inList) {
                          removeCompare(train.trainNumber);
                        } else {
                          setCompareList((prev) => [...prev.slice(0, 2), train]);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                        compareList.some((t) => t.trainNumber === train.trainNumber)
                          ? 'bg-purple-100 text-purple-900 border-purple-400 font-bold'
                          : 'border-purple-200 text-purple-800 hover:bg-purple-50'
                      }`}
                    >
                      <Scale className="w-3 h-3" />
                      <span>{compareList.some((t) => t.trainNumber === train.trainNumber) ? 'Added to Compare ✓' : '+ Compare'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExpandedTrainId(isExpanded ? null : train.trainNumber)}
                      className="px-2.5 py-1 rounded-lg border border-purple-200 text-purple-800 hover:bg-purple-50 text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      {isExpanded ? 'Hide Classes' : 'View Seats'}
                    </button>

                    <button
                      type="button"
                      onClick={() => selectTrain(train, currentSelectedClass)}
                      className="px-4 py-1 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold shadow-sm shadow-purple-600/20 active:scale-95 transition-all cursor-pointer"
                    >
                      Book Now
                    </button>
                  </div>
                </div>

                {/* EXPANDED CLASS SELECTOR */}
                {isExpanded && (
                  <div className="pt-2 border-t border-purple-100/60 grid grid-cols-2 sm:grid-cols-3 gap-1.5 animate-in fade-in duration-200">
                    {train.classes.map((cls) => {
                      const isClassSelected = currentSelectedClass === cls.classCode;
                      return (
                        <button
                          key={cls.classCode}
                          type="button"
                          onClick={() => {
                            setSelectedClassMap((prev) => ({
                              ...prev,
                              [train.trainNumber]: cls.classCode,
                            }));
                            selectTrain(train, cls.classCode);
                          }}
                          className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                            isClassSelected
                              ? 'bg-purple-50 border-purple-500 shadow-sm ring-1 ring-purple-500'
                              : 'bg-white hover:bg-slate-50 border-purple-100'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900">{cls.classCode}</span>
                            <span className="text-xs font-bold text-purple-900">₹{cls.fare}</span>
                          </div>
                          <span
                            className={`text-[9px] font-bold block mt-0.5 ${
                              cls.status === 'AVAILABLE'
                                ? 'text-emerald-600'
                                : cls.status === 'RAC'
                                ? 'text-amber-600'
                                : 'text-rose-600'
                            }`}
                          >
                            {cls.status === 'AVAILABLE' ? `AVL ${cls.availableSeats}` : cls.status}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}

          {/* ──────────────── SAFETY & FAIR BOOKING BANNER ──────────────── */}
          <div className="bg-gradient-to-r from-purple-50/70 via-white to-purple-50/50 rounded-2xl p-2.5 px-3.5 border border-purple-100 flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 shrink-0 flex items-center justify-center">
                <img
                  src="/assets/images/safety_shield.png"
                  alt="Nirantar Safe Booking"
                  className="w-full h-full object-contain drop-shadow-sm pointer-events-none"
                />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  Booking with Nirantar is safe & fair
                </h4>
                <p className="text-[10px] text-slate-500 font-medium">
                  We monitor live availability and ensure fair access for everyone. No bots. No unfair advantage.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => console.log('Nirantar Safe Guarantee: Real-time anti-bot verification and DigiLocker ticket integration.')}
              className="px-3 py-1 rounded-xl bg-white hover:bg-purple-50 border border-purple-200 text-purple-900 text-[11px] font-semibold whitespace-nowrap shadow-sm transition-all cursor-pointer shrink-0"
            >
              <span>Know more →</span>
            </button>
          </div>
        </div>

        {/* ──────────────── RIGHT COLUMN: NIRA SUGGESTS & COMPARE (1 Col) ──────────────── */}
        <div className="space-y-3">
          {/* 1. NIRA SUGGESTS CARD */}
          <div className="bg-gradient-to-b from-[#F3EDFD] via-[#EFE7FD] to-[#EBE2FC] rounded-2xl p-4 border border-purple-100/90 shadow-sm relative overflow-visible">
            {/* Header with Sparkle */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
                <Sparkles className="w-3.5 h-3.5 text-purple-700" />
                <span>Nira Suggests</span>
              </div>
            </div>

            {/* Character Graphic without square cutout frame */}
            <div className="absolute right-1 -top-8 w-24 h-32 pointer-events-none z-10 flex items-end justify-end">
              <img
                src="/assets/images/characters/citizen_thinking.png"
                alt="Ananya AI Recommendation"
                className="w-full h-full object-contain drop-shadow-sm"
              />
            </div>

            {/* Speech Bubble */}
            <div className="bg-white rounded-xl p-2.5 shadow-sm border border-purple-100 mt-14 mb-2.5 relative z-20">
              <p className="text-xs font-semibold text-purple-950">
                {filteredTrains.length > 0 ? (
                  <>
                    <span className="font-bold text-[#7C3AED]">{filteredTrains[0].trainName}</span> is the best option for your route!
                  </>
                ) : (
                  <>
                    Direct trains are unavailable for this route. Consider booking via connecting hubs!
                  </>
                )}
              </p>
            </div>

            {/* Benefit Bullets */}
            <div className="space-y-1 text-xs font-medium text-slate-700 pt-0.5">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[9px] shrink-0">
                  ✦
                </div>
                <span>{filteredTrains.length > 0 ? 'Fastest among top trains' : '550+ verified railway routes'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[9px] shrink-0">
                  ⏱
                </div>
                <span>{filteredTrains.length > 0 ? 'High on-time performance' : 'Zero hallucinated train results'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[9px] shrink-0">
                  ⭐
                </div>
                <span>Great reviews from travellers</span>
              </div>
            </div>

            {/* Ask Nira CTA Bar */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigateTo('discover')}
                className="w-full flex items-center justify-between bg-white hover:bg-purple-50/80 px-3 py-2 rounded-xl border border-purple-200 text-xs font-semibold text-purple-900 transition-all shadow-sm cursor-pointer"
              >
                <span>Ask Nira anything</span>
                <div className="w-5 h-5 rounded-full bg-[#7C3AED] text-white flex items-center justify-center shadow-sm">
                  <span className="text-xs">→</span>
                </div>
              </button>
            </div>
          </div>

          {/* 2. COMPARE TRAINS CARD */}
          <div className="bg-white rounded-2xl p-3.5 border border-purple-100/90 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                Compare trains ({compareList.length})
              </h4>
              {compareList.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCompareList([])}
                  className="text-[11px] font-semibold text-purple-700 hover:underline cursor-pointer"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* List of trains to compare */}
            <div className="space-y-1.5">
              {compareList.map((t, idx) => (
                <div
                  key={t.trainNumber}
                  className="flex items-center justify-between p-1.5 px-2 rounded-lg bg-purple-50/40 border border-purple-100 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Train className={`w-3.5 h-3.5 ${idx === 0 ? 'text-emerald-600' : 'text-blue-600'}`} />
                    <span className="font-bold text-slate-800 truncate text-[11px]">
                      {t.trainNumber} • {t.trainName}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCompare(t.trainNumber)}
                    className="w-4 h-4 rounded-full hover:bg-purple-100 text-slate-400 hover:text-purple-700 flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}

              {compareList.length === 0 && (
                <p className="text-xs text-slate-400 font-medium py-1 text-center">
                  No trains selected for comparison.
                </p>
              )}
            </div>

            {/* Compare CTA Button */}
            <button
              type="button"
              onClick={() => {
                if (compareList.length === 0 && availableTrains.length >= 2) {
                  setCompareList(availableTrains.slice(0, 2));
                }
                setShowCompareModal(true);
              }}
              className="w-full py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-purple-600/20 active:scale-95 cursor-pointer"
            >
              <Scale className="w-3.5 h-3.5 text-white" />
              <span>Compare Now ({compareList.length > 0 ? compareList.length : 2})</span>
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          PAGE 4: INTERACTIVE TRAIN COMPARISON MODAL (MATCHING REF)
          ═══════════════════════════════════════════════════════════════════ */}
      {showCompareModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 border border-purple-200 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-purple-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-black text-lg text-slate-900">
                    Train Comparison Matrix
                  </h3>
                  <p className="text-xs text-purple-700 font-semibold">
                    Comparing {compareList.length > 0 ? compareList.length : 2} train options on {searchParams.fromStation.city} → {searchParams.toStation.city}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCompareModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Comparison Grid Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(compareList.length > 0 ? compareList : availableTrains.slice(0, 2)).map((t, idx) => (
                <div
                  key={t.trainNumber}
                  className={`p-5 rounded-3xl border-2 space-y-4 ${
                    idx === 0
                      ? 'border-purple-300 bg-gradient-to-b from-purple-50/50 via-white to-white'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  {/* Top Badge & Train Title */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-purple-800 bg-purple-100 px-2.5 py-0.5 rounded-full">
                        #{t.trainNumber}
                      </span>
                      {t.isFastest && (
                        <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          ⚡ Fastest Option
                        </span>
                      )}
                    </div>
                    <h4 className="font-black text-base text-slate-900">{t.trainName}</h4>
                    <p className="text-xs text-slate-500 font-medium">{t.trainType || 'Superfast Express'}</p>
                  </div>

                  {/* Schedule Timeline */}
                  <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-center justify-between">
                    <div>
                      <div className="text-base font-black text-slate-900">{t.departureTime}</div>
                      <div className="text-[11px] font-bold text-slate-500">{t.fromStationCode}</div>
                    </div>
                    <div className="text-center px-2">
                      <span className="text-[11px] font-bold text-purple-800">{t.durationHours}</span>
                      <div className="w-16 h-0.5 bg-purple-300 mx-auto my-1" />
                      <span className="text-[10px] text-emerald-600 font-bold">{t.punctualityScore}% on-time</span>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-black text-slate-900">{t.arrivalTime}</div>
                      <div className="text-[11px] font-bold text-slate-500">{t.toStationCode}</div>
                    </div>
                  </div>

                  {/* Matrix Features */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-purple-50">
                      <span className="text-slate-500">Starting Fare:</span>
                      <span className="font-black text-slate-900">₹{getMinFare(t)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-purple-50">
                      <span className="text-slate-500">Available Classes:</span>
                      <span className="font-bold text-purple-900">
                        {t.classes.map((c) => c.classCode).join(', ') || '3A, 2A, 1A'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-purple-50">
                      <span className="text-slate-500">Pantry / Food:</span>
                      <span className="font-bold text-emerald-700">{t.pantryAvailable ? 'Included (Catering Available)' : 'Not Available'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">User Rating:</span>
                      <span className="font-bold text-amber-600">⭐ {t.rating} / 5.0</span>
                    </div>
                  </div>

                  {/* Select & Book Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowCompareModal(false);
                      selectTrain(t, t.classes[0]?.classCode || '3A');
                    }}
                    className="w-full py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-black text-xs shadow-md shadow-purple-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Book {t.trainName.split(' ')[0]}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainsPage;
