import React, { useState, useMemo } from 'react';
import {
  Train,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  Compass,
  Zap,
  Ticket,
  Lock,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import {
  getRepresentativeCoaches,
  getCoachSegmentBays,
  RepresentativeCoachInfo,
  CoachBay,
  SegmentBerth,
  MidJourneyReallocation,
} from '../../utils/seatInventory';
import { StationStop } from '../../data/trainStoppages';
import { useJourney } from '../../context/JourneyContext';

interface CoachSegmentShowcaseProps {
  trainNumber: string;
  trainName?: string;
  availableClasses?: Array<{ classCode: string; className?: string }>;
  routeStations?: StationStop[];
  currentStationIndex?: number;
  userBookedSeats?: Array<{ seatNumber: number; passengerName?: string; berthType?: string; coachCode?: string }>;
  isUserBookedTrain?: boolean;
}

export const CoachSegmentShowcase: React.FC<CoachSegmentShowcaseProps> = ({
  trainNumber,
  trainName = 'Express Train',
  availableClasses,
  routeStations = [],
  currentStationIndex = 0,
  userBookedSeats = [],
  isUserBookedTrain = false,
}) => {
  const { activeReallocations, requestMidJourneyReallocation, navigateTo } = useJourney();

  // Representative coaches: 1 of each of 1A, 2A, 3A (and SL if present)
  const representativeCoaches = useMemo(() => {
    return getRepresentativeCoaches(trainNumber, availableClasses);
  }, [trainNumber, availableClasses]);

  // Selected coach class type
  const [selectedClassCode, setSelectedClassCode] = useState<string>(() => {
    if (userBookedSeats.length > 0 && userBookedSeats[0].coachCode) {
      const match = representativeCoaches.find((c) =>
        userBookedSeats[0].coachCode?.includes(c.classCode) || userBookedSeats[0].coachCode?.startsWith(c.representativeCode[0])
      );
      if (match) return match.classCode;
    }
    return representativeCoaches[0]?.classCode || '3A';
  });

  // Simulated station index for downstream vacancy radar
  const [selectedStationIndex, setSelectedStationIndex] = useState<number>(currentStationIndex);

  // Selected berth for Special Mid-Journey Reallocation modal
  const [selectedVacantBerth, setSelectedVacantBerth] = useState<SegmentBerth | null>(null);
  const [isSubmittingReallocation, setIsSubmittingReallocation] = useState(false);
  const [reallocationSuccess, setReallocationSuccess] = useState<MidJourneyReallocation | null>(null);

  const selectedCoachMeta: RepresentativeCoachInfo = useMemo(() => {
    return representativeCoaches.find((c) => c.classCode === selectedClassCode) || representativeCoaches[0];
  }, [representativeCoaches, selectedClassCode]);

  // Generate 4 segment bays for selected coach class and selected station milestone
  const bays: CoachBay[] = useMemo(() => {
    return getCoachSegmentBays(
      selectedClassCode,
      selectedStationIndex,
      routeStations,
      userBookedSeats,
      activeReallocations,
      4
    );
  }, [selectedClassCode, selectedStationIndex, routeStations, userBookedSeats, activeReallocations]);

  // Current station object
  const activeStation = routeStations[selectedStationIndex] || routeStations[0] || {
    name: 'New Delhi',
    code: 'NDLS',
    platform: 'Pf 14',
  };

  // Find user's bay and the berth beside them
  const besideStatus = useMemo(() => {
    if (!isUserBookedTrain) return null;
    for (const bay of bays) {
      const allBerths = [...bay.mainCabinBerths, ...bay.sideBayBerths];
      const userSeatInBay = allBerths.find((b) => b.isUserSeat);
      if (userSeatInBay) {
        const besideBerth = allBerths.find((b) => b.isBesideUser && !b.isUserSeat);
        if (besideBerth) {
          return {
            bayLabel: bay.bayLabel,
            userBerth: userSeatInBay,
            besideBerth,
          };
        }
      }
    }
    return null;
  }, [bays, isUserBookedTrain]);

  // Handle Mid-Journey Reallocation Claim
  const handleClaimReallocation = async () => {
    if (!selectedVacantBerth) return;
    setIsSubmittingReallocation(true);

    const primaryPassenger = userBookedSeats[0] || {
      passengerName: 'Pratay Karali',
      seatNumber: 11,
      berthType: 'Upper Berth (UB)',
      coachCode: selectedCoachMeta.representativeCode,
    };

    try {
      const result = await requestMidJourneyReallocation({
        passengerName: primaryPassenger.passengerName || 'Pratay Karali',
        fromCoach: primaryPassenger.coachCode || selectedCoachMeta.representativeCode,
        fromSeat: primaryPassenger.seatNumber || 11,
        fromBerthType: primaryPassenger.berthType || 'Upper Berth',
        toCoach: selectedCoachMeta.representativeCode,
        toSeat: selectedVacantBerth.num,
        toBerthType: selectedVacantBerth.fullTypeName,
        effectiveFromStation: activeStation.name,
        effectiveFromStationCode: activeStation.code,
      });

      setReallocationSuccess(result);
      setTimeout(() => {
        setIsSubmittingReallocation(false);
      }, 600);
    } catch (err) {
      setIsSubmittingReallocation(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in select-none">
      {/* ═══════════════════════════════════════════════════════════════════
          1. REPRESENTATIVE COACH CLASS BOX SHOWCASE (1 of each: 1A, 2A, 3A)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-purple-100 text-purple-900">
              <Train className="w-4 h-4" />
            </span>
            <h3 className="text-sm sm:text-base font-black text-slate-900">
              Representative Coach Showcase
            </h3>
          </div>
          <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
            {representativeCoaches.length} Core Coach Tiers (1A, 2A, 3A)
          </span>
        </div>

        {/* Horizontal Coach Box Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {representativeCoaches.map((c) => {
            const isSelected = selectedClassCode === c.classCode;
            const hasUserInClass = isUserBookedTrain && userBookedSeats.some((s) => s.coachCode?.includes(c.classCode) || s.coachCode?.startsWith(c.representativeCode[0]));

            return (
              <button
                key={c.classCode}
                type="button"
                onClick={() => setSelectedClassCode(c.classCode)}
                className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'bg-purple-900 text-white border-purple-800 shadow-md ring-2 ring-purple-400/50 scale-[1.01]'
                    : 'bg-white hover:bg-purple-50/50 text-slate-800 border-purple-100 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        isSelected ? 'bg-white/20 text-purple-100' : 'bg-purple-100 text-purple-900'
                      }`}
                    >
                      Class {c.classCode}
                    </span>
                    {hasUserInClass ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-400 text-[10px] text-slate-950 font-black animate-pulse">
                        ★ Your Coach
                      </span>
                    ) : (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isSelected ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/30' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {c.seatsAvailable} Seats Left
                      </span>
                    )}
                  </div>
                  <h4 className={`font-black text-sm truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                    {c.representativeCode} ({c.className})
                  </h4>
                  <p className={`text-[11px] line-clamp-2 mt-1 leading-relaxed ${isSelected ? 'text-purple-200' : 'text-slate-500'}`}>
                    {c.description}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className={isSelected ? 'text-purple-200' : 'text-slate-500'}>
                    Total Capacity: {c.capacity} Berths
                  </span>
                  <span className={`font-bold ${isSelected ? 'text-emerald-300' : 'text-purple-700'}`}>
                    {isSelected ? 'Active Layout ✓' : 'View Structure →'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          2. UNBOOKED VS BOOKED PASSENGER EXPERIENCE
          ═══════════════════════════════════════════════════════════════════ */}
      {!isUserBookedTrain ? (
        /* ── UNBOOKED TRAIN: SHOW SKELETON STRUCTURE & BOOKING NOTICE ── */
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-purple-50/70 border border-purple-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-900 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Lock className="w-5 h-5 text-purple-200" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-slate-900">
                  Coach Skeleton & Capacity Preview (Train #{trainNumber})
                </h4>
                <p className="text-[11px] text-slate-600 font-medium">
                  Showing architectural bay layout. Exact live berth roster and mid-journey vacant seat shift requests are unlocked for confirmed passengers on this train.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigateTo('search')}
              className="px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shrink-0 flex items-center gap-2 shadow-sm transition-all hover:scale-105 cursor-pointer"
            >
              <span>Book Ticket on #{trainNumber}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Coach Skeleton Layout */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs sm:text-sm font-black text-slate-900">
                Coach {selectedCoachMeta.representativeCode} Structure ({selectedCoachMeta.className})
              </h4>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                {selectedCoachMeta.seatsAvailable} Berths Available in this Coach
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {bays.map((bay) => (
                <div
                  key={bay.bayIndex}
                  className="bg-slate-900 rounded-3xl p-4 text-white border border-purple-900/60 shadow-md space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-2 text-xs">
                    <span className="font-black text-purple-200 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-lg bg-purple-800 text-white flex items-center justify-center text-[10px] font-bold">
                        {bay.bayIndex}
                      </span>
                      <span>{bay.bayLabel}</span>
                    </span>
                    <span className="text-[10px] font-mono text-purple-300">
                      {bay.hasDoor ? '🚪 Sliding Door Cabin' : bay.hasCurtain ? '✨ Privacy Curtains' : '🪟 Bay Window'}
                    </span>
                  </div>

                  {/* Skeleton Berth Grid */}
                  <div className="grid grid-cols-12 gap-2 text-xs font-mono">
                    <div className={`${bay.sideBayBerths.length > 0 ? 'col-span-8' : 'col-span-12'} space-y-2`}>
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Main Cabin</span>
                        {bay.hasCabinet && <span className="text-amber-400">🧳 Luggage Cabinet</span>}
                      </div>

                      <div className={`grid ${bay.mainCabinBerths.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'} gap-1.5`}>
                        {bay.mainCabinBerths.map((seat) => (
                          <div
                            key={seat.num}
                            className="p-2 rounded-xl border bg-slate-800/80 border-slate-700/80 text-slate-300 flex flex-col items-center justify-center text-center"
                          >
                            <div className="flex items-center justify-between w-full px-1">
                              <span className="text-[11px] font-black text-white">#{seat.num}</span>
                              <span className="text-[8px] font-bold px-1 rounded bg-white/10 text-purple-200">
                                {seat.type}
                              </span>
                            </div>
                            <span className="text-[8px] font-extrabold uppercase mt-1 text-slate-400">
                              {seat.fullTypeName.split(' ')[0]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {bay.sideBayBerths.length > 0 && (
                      <div className="col-span-4 border-l border-white/10 pl-2 space-y-2">
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                          Side Bay
                        </div>
                        <div className="grid grid-cols-1 gap-1.5">
                          {bay.sideBayBerths.map((seat) => (
                            <div
                              key={seat.num}
                              className="p-2 rounded-xl border bg-slate-800/80 border-slate-700/80 text-slate-300 flex flex-col items-center justify-center text-center"
                            >
                              <div className="flex items-center justify-between w-full px-1">
                                <span className="text-[11px] font-black text-white">#{seat.num}</span>
                                <span className="text-[8px] font-bold px-1 rounded bg-white/10 text-purple-200">
                                  {seat.type}
                                </span>
                              </div>
                              <span className="text-[8px] font-extrabold uppercase mt-1 text-slate-400">
                                {seat.fullTypeName.split(' ')[0]}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ── BOOKED PASSENGER EXPERIENCE: VACANCY RADAR, BESIDE CALLOUT & LIVE INTERACTIVE BAYS ── */
        <div className="space-y-4">
          {/* Station-Wise Vacancy Radar */}
          <div className="p-4 rounded-3xl bg-purple-50/80 border border-purple-100 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-100/70 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  <Compass className="w-3.5 h-3.5" />
                </span>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                    <span>Station-Wise Vacancy Radar</span>
                    <span className="px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-900 text-[9px] font-black">
                      LIVE SIMULATOR
                    </span>
                  </h4>
                  <p className="text-[10px] text-slate-600 font-medium">
                    Select a station milestone to see which berths become vacant mid-journey!
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs flex-wrap">
                <span className="flex items-center gap-1 font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded-full text-[10px]">
                  <span className="w-2 h-2 rounded-full bg-purple-600" /> Booked by You
                </span>
                <span className="flex items-center gap-1 font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full text-[10px]">
                  <span className="w-2 h-2 rounded-full bg-slate-400" /> Occupied
                </span>
                <span className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-[10px] animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> 🟢 Vacant (Claimable)
                </span>
              </div>
            </div>

            {/* Route Stoppage Milestone Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
              {routeStations.map((st, idx) => {
                const isSelected = selectedStationIndex === idx;
                const isOrigin = idx === 0;
                const isDest = idx === routeStations.length - 1;

                return (
                  <button
                    key={st.code}
                    type="button"
                    onClick={() => setSelectedStationIndex(idx)}
                    className={`px-3 py-2 rounded-2xl shrink-0 font-bold transition-all text-xs flex items-center gap-2 border cursor-pointer ${
                      isSelected
                        ? 'bg-purple-900 text-white border-purple-950 shadow-md ring-2 ring-purple-300 scale-105'
                        : 'bg-white hover:bg-purple-50 text-slate-700 border-purple-100 shadow-2xs'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                        isSelected ? 'bg-white text-purple-950' : 'bg-purple-100 text-purple-900'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black truncate max-w-[120px]">{st.name}</span>
                        <span className={`text-[9px] font-mono ${isSelected ? 'text-purple-200' : 'text-slate-400'}`}>
                          ({st.code})
                        </span>
                      </div>
                      <span className={`text-[9px] block ${isSelected ? 'text-purple-200' : 'text-slate-500'}`}>
                        {isOrigin ? 'Origin' : isDest ? 'Final Destination' : `Dep: ${st.scheduledDep || 'On Time'}`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Station Milestone Context Notice */}
            <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-purple-100/60 border border-purple-200/80 text-purple-950 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-purple-700 shrink-0" />
                <span className="font-medium text-[11px]">
                  Viewing coach state <strong>after departing {activeStation.name}</strong> ({activeStation.platform || 'Platform 1'}). Downstream vacant berths are highlighted in <strong>Green (🟢)</strong>.
                </span>
              </div>
              <span className="text-[10px] font-bold text-purple-700 bg-white px-2 py-0.5 rounded-md border border-purple-200">
                Coach {selectedCoachMeta.representativeCode} • {selectedCoachMeta.className}
              </span>
            </div>
          </div>

          {/* Beside Seat Status Banner */}
          {besideStatus && (
            <div
              className={`p-3.5 sm:p-4 rounded-3xl border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                besideStatus.besideBerth.occupancyStatus === 'VACANT'
                  ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                  : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-xs font-bold text-sm ${
                    besideStatus.besideBerth.occupancyStatus === 'VACANT'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-purple-900 text-white'
                  }`}
                >
                  {besideStatus.besideBerth.occupancyStatus === 'VACANT' ? '🟢' : '👥'}
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-xs sm:text-sm">
                      Seat Beside Your Berth (#{besideStatus.besideBerth.num} - {besideStatus.besideBerth.type}):
                    </span>
                    <span
                      className={`px-2 py-0.2 rounded-full text-[10px] font-black uppercase ${
                        besideStatus.besideBerth.occupancyStatus === 'VACANT'
                          ? 'bg-emerald-200 text-emerald-900 border border-emerald-300'
                          : 'bg-slate-200 text-slate-800 border border-slate-300'
                      }`}
                    >
                      {besideStatus.besideBerth.occupancyStatus === 'VACANT' ? 'VACANT (Available to Claim)' : 'OCCUPIED'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {besideStatus.besideBerth.occupancyStatus === 'VACANT' ? (
                      <span>
                        This berth is vacant at <strong>{activeStation.name}</strong>. You can submit a mid-journey shift request!
                      </span>
                    ) : (
                      <span>
                        Berth is currently occupied. It will become vacant once the passenger deboards downstream.
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {besideStatus.besideBerth.occupancyStatus === 'VACANT' && (
                <button
                  type="button"
                  onClick={() => setSelectedVacantBerth(besideStatus.besideBerth)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 flex items-center justify-center gap-1.5 shadow-sm transition-all hover:scale-105 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Claim Beside Berth →</span>
                </button>
              )}
            </div>
          )}

          {/* Interactive Bay Segment Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2">
                  <span>Coach {selectedCoachMeta.representativeCode} Live Layout</span>
                  <span className="px-2 py-0.2 rounded-md bg-purple-100 text-purple-900 text-[10px] font-bold font-mono">
                    {selectedCoachMeta.className}
                  </span>
                </h4>
                <p className="text-[10px] text-slate-500 font-medium">
                  Showing 4 rectangular passenger segments with Main Cabin, Aisle corridor, and Side Berths.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bays.map((bay) => (
                <div
                  key={bay.bayIndex}
                  className="bg-slate-900 rounded-3xl p-4 text-white border border-purple-900/60 shadow-lg space-y-3 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-2 text-xs">
                    <span className="font-black text-purple-200 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-lg bg-purple-800 text-white flex items-center justify-center text-[10px] font-bold">
                        {bay.bayIndex}
                      </span>
                      <span>{bay.bayLabel}</span>
                    </span>
                    <span className="text-[10px] font-mono text-purple-300">
                      {bay.hasDoor ? '🚪 Sliding Door Cabin' : bay.hasCurtain ? '✨ Privacy Curtains' : '🪟 Bay Window'}
                    </span>
                  </div>

                  <div className="grid grid-cols-12 gap-2 text-xs font-mono">
                    {/* Main Cabin */}
                    <div className={`${bay.sideBayBerths.length > 0 ? 'col-span-8' : 'col-span-12'} space-y-2`}>
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Main Cabin</span>
                        {bay.hasCabinet && <span className="text-amber-400">🧳 Luggage Cabinet</span>}
                      </div>

                      <div className={`grid ${bay.mainCabinBerths.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'} gap-1.5`}>
                        {bay.mainCabinBerths.map((seat) => {
                          const isUser = seat.occupancyStatus === 'USER_BOOKED';
                          const isVacant = seat.occupancyStatus === 'VACANT';
                          const isReallocated = seat.occupancyStatus === 'REALLOCATED';

                          return (
                            <div
                              key={seat.num}
                              onClick={() => {
                                if (isVacant) setSelectedVacantBerth(seat);
                              }}
                              className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                                isUser
                                  ? 'bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 border-2 border-white text-slate-950 ring-4 ring-amber-400/50 shadow-lg scale-105 z-10'
                                  : isReallocated
                                  ? 'bg-gradient-to-b from-emerald-400 to-emerald-600 border-2 border-white text-white ring-2 ring-emerald-300 shadow-md scale-102'
                                  : isVacant
                                  ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-200 hover:bg-emerald-500/30 hover:scale-105 cursor-pointer ring-1 ring-emerald-400/40'
                                  : 'bg-slate-800/80 border-slate-700/80 text-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between w-full px-1">
                                <span className={`text-[11px] font-black ${isUser ? 'text-slate-950' : 'text-white'}`}>
                                  #{seat.num}
                                </span>
                                <span className={`text-[8px] font-bold px-1 rounded ${isUser ? 'bg-slate-950 text-amber-300' : 'bg-white/10 text-purple-200'}`}>
                                  {seat.type}
                                </span>
                              </div>

                              <span className={`text-[8px] font-extrabold uppercase mt-1 truncate max-w-full ${isUser ? 'text-slate-950' : isVacant ? 'text-emerald-300' : 'text-slate-400'}`}>
                                {isUser
                                  ? '★ YOU'
                                  : isReallocated
                                  ? '⚡ YOUR SHIFT'
                                  : isVacant
                                  ? '🟢 VACANT'
                                  : 'OCCUPIED'}
                              </span>

                              <span className="text-[7px] text-slate-400 truncate max-w-full mt-0.5">
                                {isVacant ? 'Click to Claim' : seat.fullTypeName.split(' ')[0]}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Side Bay */}
                    {bay.sideBayBerths.length > 0 && (
                      <div className="col-span-4 border-l border-white/10 pl-2 space-y-2">
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                          Side Bay
                        </div>
                        <div className="grid grid-cols-1 gap-1.5">
                          {bay.sideBayBerths.map((seat) => {
                            const isUser = seat.occupancyStatus === 'USER_BOOKED';
                            const isVacant = seat.occupancyStatus === 'VACANT';
                            const isReallocated = seat.occupancyStatus === 'REALLOCATED';

                            return (
                              <div
                                key={seat.num}
                                onClick={() => {
                                  if (isVacant) setSelectedVacantBerth(seat);
                                }}
                                className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                                  isUser
                                    ? 'bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 border-2 border-white text-slate-950 ring-4 ring-amber-400/50 shadow-lg scale-105 z-10'
                                    : isReallocated
                                    ? 'bg-gradient-to-b from-emerald-400 to-emerald-600 border-2 border-white text-white ring-2 ring-emerald-300 shadow-md scale-102'
                                    : isVacant
                                    ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-200 hover:bg-emerald-500/30 hover:scale-105 cursor-pointer ring-1 ring-emerald-400/40'
                                    : 'bg-slate-800/80 border-slate-700/80 text-slate-300'
                                }`}
                              >
                                <div className="flex items-center justify-between w-full px-1">
                                  <span className={`text-[11px] font-black ${isUser ? 'text-slate-950' : 'text-white'}`}>
                                    #{seat.num}
                                  </span>
                                  <span className={`text-[8px] font-bold px-1 rounded ${isUser ? 'bg-slate-950 text-amber-300' : 'bg-white/10 text-purple-200'}`}>
                                    {seat.type}
                                  </span>
                                </div>

                                <span className={`text-[8px] font-extrabold uppercase mt-1 truncate max-w-full ${isUser ? 'text-slate-950' : isVacant ? 'text-emerald-300' : 'text-slate-400'}`}>
                                  {isUser
                                    ? '★ YOU'
                                    : isReallocated
                                    ? '⚡ YOUR SHIFT'
                                    : isVacant
                                    ? '🟢 VACANT'
                                    : 'OCCUPIED'}
                                </span>

                                <span className="text-[7px] text-slate-400 truncate max-w-full mt-0.5">
                                  {isVacant ? 'Click to Claim' : seat.fullTypeName.split(' ')[0]}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          3. SPECIAL MID-JOURNEY REALLOCATION CLAIM MODAL
          ═══════════════════════════════════════════════════════════════════ */}
      {selectedVacantBerth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-5 sm:p-6 border border-purple-100 space-y-4 font-sans text-slate-900 animate-in zoom-in-95">
            {reallocationSuccess ? (
              <div className="text-center space-y-3 py-2 animate-in fade-in">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    Mid-Journey Shift Approved! 🎉
                  </h3>
                  <p className="text-xs text-slate-600 font-medium mt-1">
                    Endorsed by {reallocationSuccess.approvedBy}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-left text-xs space-y-1.5 font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Reallocated Berth:</span>
                    <strong className="text-emerald-950 text-sm">
                      Coach {reallocationSuccess.toCoach} • Seat #{reallocationSuccess.toSeat} ({reallocationSuccess.toBerthType})
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Effective From:</span>
                    <strong className="text-slate-900">{reallocationSuccess.effectiveFromStation}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Endorsement ID:</span>
                    <strong className="text-purple-700">{reallocationSuccess.id}</strong>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-100 text-left text-[11px] text-purple-950 flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-purple-700 shrink-0" />
                  <span>This reallocation is now automatically recorded on your <strong>Digital Train Ticket</strong>!</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedVacantBerth(null);
                    setReallocationSuccess(null);
                  }}
                  className="w-full py-2.5 rounded-xl bg-purple-900 text-white font-bold text-xs hover:bg-purple-950 transition-all cursor-pointer shadow-md"
                >
                  Done & Return to Radar ✓
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-purple-50 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm sm:text-base text-slate-900">
                        Request Mid-Journey Reallocation
                      </h3>
                      <p className="text-[10px] text-slate-500 font-medium">
                        Special in-journey upgrade to vacant berth
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedVacantBerth(null)}
                    className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Selected Vacant Berth</span>
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-900 text-sm">
                        Coach {selectedCoachMeta.representativeCode} • Seat #{selectedVacantBerth.num} ({selectedVacantBerth.fullTypeName})
                      </strong>
                      <span className="px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        VACANT
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-600 block">
                      Deboarded at: <strong>{activeStation.name}</strong> ({activeStation.code})
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Reallocation Conditions</span>
                    <ul className="space-y-1 text-[11px] text-slate-600 list-disc list-inside">
                      <li>Effective immediately upon departure from <strong>{activeStation.name}</strong>.</li>
                      <li>Auto-cleared with on-board conductor database.</li>
                      <li>Endorsed on digital QR ticket for TTE inspection.</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedVacantBerth(null)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSubmittingReallocation}
                    onClick={handleClaimReallocation}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all hover:scale-102"
                  >
                    {isSubmittingReallocation ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying with TTE...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Confirm & Endorse Seat ✓</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
