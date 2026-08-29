import React, { useState, useMemo, useEffect } from 'react';
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

  // Keep selectedClassCode synced when train or available classes change
  useEffect(() => {
    if (userBookedSeats.length > 0 && userBookedSeats[0].coachCode && isUserBookedTrain) {
      const match = representativeCoaches.find((c) =>
        userBookedSeats[0].coachCode?.includes(c.classCode) || userBookedSeats[0].coachCode?.startsWith(c.representativeCode[0])
      );
      if (match) {
        setSelectedClassCode(match.classCode);
        return;
      }
    }
    if (!representativeCoaches.some((c) => c.classCode === selectedClassCode)) {
      setSelectedClassCode(representativeCoaches[0]?.classCode || '3A');
    }
  }, [trainNumber, representativeCoaches, userBookedSeats, isUserBookedTrain]);

  // Simulated station index for downstream vacancy radar
  const [selectedStationIndex, setSelectedStationIndex] = useState<number>(currentStationIndex);

  // Selected berth for Special Mid-Journey Reallocation modal
  const [selectedVacantBerth, setSelectedVacantBerth] = useState<SegmentBerth | null>(null);
  const [selectedPassengerIdx, setSelectedPassengerIdx] = useState<number>(0);
  const [isSubmittingReallocation, setIsSubmittingReallocation] = useState(false);
  const [reallocationSuccess, setReallocationSuccess] = useState<MidJourneyReallocation | null>(null);

  const selectedCoachMeta: RepresentativeCoachInfo = useMemo(() => {
    return representativeCoaches.find((c) => c.classCode === selectedClassCode) || representativeCoaches[0];
  }, [representativeCoaches, selectedClassCode]);

  // Generate all segment bays for selected coach class (8 bays for 3A to show all 64 berths including user seats #36 & #37)
  const bays: CoachBay[] = useMemo(() => {
    const totalSegments =
      selectedClassCode === '1A'
        ? 8
        : selectedClassCode === '2A'
        ? 8
        : selectedClassCode === '3A'
        ? 8
        : selectedClassCode === '3E' || selectedClassCode === 'SL'
        ? 9
        : selectedClassCode === 'EC' || selectedClassCode === 'EA'
        ? 12
        : selectedClassCode === 'CC'
        ? 15
        : 18;

    return getCoachSegmentBays(
      selectedClassCode,
      selectedStationIndex,
      routeStations,
      userBookedSeats,
      activeReallocations,
      totalSegments
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

    const chosenPassenger = userBookedSeats[selectedPassengerIdx] || userBookedSeats[0] || {
      passengerName: 'Pratay Karali',
      seatNumber: 36,
      berthType: 'Lower Berth (LB)',
      coachCode: selectedCoachMeta.representativeCode,
    };

    try {
      const result = await requestMidJourneyReallocation({
        passengerName: chosenPassenger.passengerName || 'Pratay Karali',
        fromCoach: chosenPassenger.coachCode || selectedCoachMeta.representativeCode,
        fromSeat: chosenPassenger.seatNumber || 36,
        fromBerthType: chosenPassenger.berthType || 'Lower Berth (LB)',
        toCoach: selectedCoachMeta.representativeCode,
        toSeat: selectedVacantBerth.num,
        toBerthType: selectedVacantBerth.fullTypeName,
        effectiveFromStation: activeStation.name,
        effectiveFromStationCode: activeStation.code,
      });

      setReallocationSuccess(result);
      setIsSubmittingReallocation(false);
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
                  className="bg-[#130E26] rounded-3xl p-4 text-white border border-purple-900/60 shadow-xl space-y-3 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between border-b border-purple-500/20 pb-2 text-xs">
                    <span className="font-black text-white flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-lg bg-purple-700 text-white flex items-center justify-center text-[10px] font-bold">
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
                            className="p-2 rounded-xl border bg-[#20103A] border-purple-800/60 text-purple-200 flex flex-col items-center justify-center text-center shadow-xs"
                          >
                            <div className="flex items-center justify-between w-full px-1">
                              <span className="text-[11px] font-black text-white">#{seat.num}</span>
                              <span className="text-[8px] font-bold px-1 rounded bg-[#130A24] text-purple-300">
                                {seat.type}
                              </span>
                            </div>
                            <span className="text-[8px] font-extrabold uppercase mt-1 text-purple-400">
                              {seat.fullTypeName.split(' ')[0]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {bay.sideBayBerths.length > 0 && (
                      <div className="col-span-4 border-l border-purple-800/40 pl-2 space-y-2">
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                          Side Bay
                        </div>
                        <div className="grid grid-cols-1 gap-1.5">
                          {bay.sideBayBerths.map((seat) => (
                            <div
                              key={seat.num}
                              className="p-2 rounded-xl border bg-[#20103A] border-purple-800/60 text-purple-200 flex flex-col items-center justify-center text-center shadow-xs"
                            >
                              <div className="flex items-center justify-between w-full px-1">
                                <span className="text-[11px] font-black text-white">#{seat.num}</span>
                                <span className="text-[8px] font-bold px-1 rounded bg-[#130A24] text-purple-300">
                                  {seat.type}
                                </span>
                              </div>
                              <span className="text-[8px] font-extrabold uppercase mt-1 text-purple-400">
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
                <span className="flex items-center gap-1 font-bold text-amber-950 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full text-[10px] shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> ★ Booked (You)
                </span>
                <span className="flex items-center gap-1 font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full text-[10px] shadow-2xs animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> 🟢 Vacant
                </span>
                <span className="flex items-center gap-1 font-bold text-cyan-950 bg-cyan-100 border border-cyan-300 px-2.5 py-0.5 rounded-full text-[10px] shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-cyan-500" /> ⚡ Shift Requested
                </span>
                <span className="flex items-center gap-1 font-bold text-purple-900 bg-purple-100 border border-purple-200 px-2.5 py-0.5 rounded-full text-[10px]">
                  <span className="w-2 h-2 rounded-full bg-purple-500" /> 👥 Occupied
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
                <div className="font-medium text-[11px]">
                  Viewing coach state <strong>after departing {activeStation.name}</strong> ({activeStation.platform || 'Platform 1'}). Downstream vacant berths are highlighted in <strong>Green (🟢)</strong>.
                </div>
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
                      key={besideStatus.besideBerth.occupancyStatus}
                      className={`px-2 py-0.2 rounded-full text-[10px] font-black uppercase ${
                        besideStatus.besideBerth.occupancyStatus === 'VACANT'
                          ? 'bg-emerald-200 text-emerald-900 border border-emerald-300'
                          : 'bg-slate-200 text-slate-800 border border-slate-300'
                      }`}
                    >
                      {besideStatus.besideBerth.occupancyStatus === 'VACANT' ? 'VACANT (Available to Claim)' : 'OCCUPIED'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600">
                    {besideStatus.besideBerth.occupancyStatus === 'VACANT' ? (
                      <div key="vacant-msg">
                        This berth is vacant at <strong>{activeStation.name}</strong>. You can submit a mid-journey shift request!
                      </div>
                    ) : (
                      <div key="occupied-msg">
                        Berth is currently occupied. It will become vacant once the passenger deboards downstream.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Remove Claim Button if already requested! */}
              {activeReallocations && activeReallocations.length > 0 ? (
                <div
                  key={`realloc-badge-${activeReallocations[0]?.id}-${activeReallocations[0]?.status}`}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-bold shrink-0 flex items-center gap-2 border shadow-2xs ${
                    activeReallocations[0].status === 'APPROVED'
                      ? 'bg-emerald-100 border-emerald-300 text-emerald-950'
                      : 'bg-amber-100 border-amber-300 text-amber-950'
                  }`}
                >
                  {activeReallocations[0].status === 'APPROVED' ? (
                    <React.Fragment key="approved">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <div>
                        <span className="block font-black text-emerald-950">✓ TTE Approved Shift for {activeReallocations[0].passengerName}</span>
                        <span className="text-[10px] text-emerald-800 block">Coach {activeReallocations[0].toCoach} • Seat #{activeReallocations[0].toSeat} ({activeReallocations[0].toBerthType})</span>
                      </div>
                    </React.Fragment>
                  ) : (
                    <React.Fragment key="pending">
                      <Zap className="w-4 h-4 text-amber-600 animate-pulse shrink-0" />
                      <div>
                        <span className="block font-black text-amber-950">⚡ Shift Requested for {activeReallocations[0].passengerName}</span>
                        <span className="text-[10px] text-amber-800 block">Seat #{activeReallocations[0].toSeat} • Auto-verifying with TTE...</span>
                      </div>
                    </React.Fragment>
                  )}
                </div>
              ) : besideStatus.besideBerth.occupancyStatus === 'VACANT' ? (
                <button
                  key="claim-btn"
                  type="button"
                  onClick={() => setSelectedVacantBerth(besideStatus.besideBerth)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 flex items-center justify-center gap-1.5 shadow-sm transition-all hover:scale-105 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Claim Beside Berth →</span>
                </button>
              ) : null}
            </div>
          )}

          {/* Interactive Bay Segment Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2">
                  <span>Coach {selectedCoachMeta.representativeCode} Live Layout</span>
                  <span className="px-2 py-0.2 rounded-md bg-purple-100 text-purple-900 text-[10px] font-bold font-mono">
                    {selectedCoachMeta.className}
                  </span>
                </h4>
                <p className="text-[10px] text-slate-500 font-medium">
                  Showing all {bays.length} passenger bays with Main Cabin, Aisle corridor, and Side Berths.
                </p>
              </div>

              {isUserBookedTrain && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      document.getElementById('bay-5')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-950 font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>★ Jump to Your Seats (Bay 5: #36 & #37) ↓</span>
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bays.map((bay) => (
                <div
                  id={`bay-${bay.bayIndex}`}
                  key={bay.bayIndex}
                  className="bg-[#130E26] rounded-3xl p-4 text-white border border-purple-900/60 shadow-xl space-y-3.5 relative overflow-hidden transition-all"
                >
                  <div className="flex items-center justify-between border-b border-purple-500/20 pb-2 text-xs">
                    <span className="font-black text-white flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-lg bg-purple-700 text-white flex items-center justify-center text-[10px] font-bold">
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
                          const matchingRealloc = isReallocated ? activeReallocations.find((r) => r.toSeat === seat.num) : null;
                          const isReallocApproved = matchingRealloc?.status === 'APPROVED';

                          return (
                            <div
                              key={seat.num}
                              onClick={() => {
                                if (isVacant) setSelectedVacantBerth(seat);
                              }}
                              className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                                isUser
                                  ? 'bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 border-2 border-white text-slate-950 ring-4 ring-amber-400/80 shadow-xl scale-105 z-10 font-black'
                                  : isReallocated
                                  ? isReallocApproved
                                    ? 'bg-gradient-to-b from-emerald-600 via-teal-600 to-emerald-700 border-2 border-white text-white ring-4 ring-emerald-400/80 shadow-xl scale-105 z-10 font-bold'
                                    : 'bg-gradient-to-b from-cyan-600 via-cyan-700 to-blue-800 border-2 border-white text-white ring-4 ring-cyan-400/70 shadow-lg scale-105 z-10 font-bold'
                                  : isVacant
                                  ? 'bg-emerald-600 hover:bg-emerald-500 border-2 border-emerald-300 text-white ring-2 ring-emerald-400/50 shadow-md scale-102 z-10 font-bold cursor-pointer'
                                  : 'bg-[#20103A] hover:bg-[#2F1554] border border-purple-800/60 text-purple-200'
                              }`}
                            >
                              <div className="flex items-center justify-between w-full px-1">
                                <span className={`text-[11px] font-black ${isUser ? 'text-slate-950' : 'text-white'}`}>
                                  #{seat.num}
                                </span>
                                <span className={`text-[8px] font-bold px-1 rounded ${isUser ? 'bg-slate-950 text-amber-300' : isReallocated ? 'bg-white/20 text-white' : isVacant ? 'bg-emerald-950 text-emerald-200' : 'bg-[#130A24] text-purple-300'}`}>
                                  {seat.type}
                                </span>
                              </div>

                              <div className={`text-[8px] font-black uppercase mt-1 truncate max-w-full ${isUser ? 'text-slate-950' : isReallocated ? 'text-white' : isVacant ? 'text-emerald-100' : 'text-purple-300'}`}>
                                {isUser
                                  ? `★ ${seat.passengerName || 'YOU'}`
                                  : isReallocated
                                  ? isReallocApproved
                                    ? '⚡ APPROVED BY TTE'
                                    : '⚡ REQUESTED NOT APPROVED'
                                  : isVacant
                                  ? '🟢 VACANT'
                                  : 'OCCUPIED'}
                              </div>

                              <div className={`text-[7px] truncate max-w-full mt-0.5 ${isUser ? 'text-slate-900 font-bold' : isReallocated ? 'text-cyan-100 font-bold' : isVacant ? 'text-emerald-200 font-semibold' : 'text-purple-400'}`}>
                                {isVacant ? 'Click to Claim' : isReallocated ? (isReallocApproved ? 'Confirmed Shift' : 'Pending TTE') : seat.fullTypeName.split(' ')[0]}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Side Bay */}
                    {bay.sideBayBerths.length > 0 && (
                      <div className="col-span-4 border-l border-purple-800/40 pl-2 space-y-2">
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                          Side Bay
                        </div>
                        <div className="grid grid-cols-1 gap-1.5">
                          {bay.sideBayBerths.map((seat) => {
                            const isUser = seat.occupancyStatus === 'USER_BOOKED';
                            const isVacant = seat.occupancyStatus === 'VACANT';
                            const isReallocated = seat.occupancyStatus === 'REALLOCATED';
                            const matchingRealloc = isReallocated ? activeReallocations.find((r) => r.toSeat === seat.num) : null;
                            const isReallocApproved = matchingRealloc?.status === 'APPROVED';

                            return (
                              <div
                                key={seat.num}
                                onClick={() => {
                                  if (isVacant) setSelectedVacantBerth(seat);
                                }}
                                className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                                  isUser
                                    ? 'bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 border-2 border-white text-slate-950 ring-4 ring-amber-400/80 shadow-xl scale-105 z-10 font-black'
                                    : isReallocated
                                    ? isReallocApproved
                                      ? 'bg-gradient-to-b from-emerald-600 via-teal-600 to-emerald-700 border-2 border-white text-white ring-4 ring-emerald-400/80 shadow-xl scale-105 z-10 font-bold'
                                      : 'bg-gradient-to-b from-cyan-600 via-cyan-700 to-blue-800 border-2 border-white text-white ring-4 ring-cyan-400/70 shadow-lg scale-105 z-10 font-bold'
                                    : isVacant
                                    ? 'bg-emerald-600 hover:bg-emerald-500 border-2 border-emerald-300 text-white ring-2 ring-emerald-400/50 shadow-md scale-102 z-10 font-bold cursor-pointer'
                                    : 'bg-[#20103A] hover:bg-[#2F1554] border border-purple-800/60 text-purple-200'
                                }`}
                              >
                                <div className="flex items-center justify-between w-full px-1">
                                  <span className={`text-[11px] font-black ${isUser ? 'text-slate-950' : 'text-white'}`}>
                                    #{seat.num}
                                  </span>
                                  <span className={`text-[8px] font-bold px-1 rounded ${isUser ? 'bg-slate-950 text-amber-300' : isReallocated ? 'bg-white/20 text-white' : isVacant ? 'bg-emerald-950 text-emerald-200' : 'bg-[#130A24] text-purple-300'}`}>
                                    {seat.type}
                                  </span>
                                </div>

                                <div className={`text-[8px] font-black uppercase mt-1 truncate max-w-full ${isUser ? 'text-slate-950' : isReallocated ? 'text-white' : isVacant ? 'text-emerald-100' : 'text-purple-300'}`}>
                                  {isUser
                                    ? `★ ${seat.passengerName || 'YOU'}`
                                    : isReallocated
                                    ? isReallocApproved
                                      ? '⚡ APPROVED BY TTE'
                                      : '⚡ REQUESTED NOT APPROVED'
                                    : isVacant
                                    ? '🟢 VACANT'
                                    : 'OCCUPIED'}
                                </div>

                                <div className={`text-[7px] truncate max-w-full mt-0.5 ${isUser ? 'text-slate-900 font-bold' : isReallocated ? 'text-cyan-100 font-bold' : isVacant ? 'text-emerald-200 font-semibold' : 'text-purple-400'}`}>
                                  {isVacant ? 'Click to Claim' : isReallocated ? (isReallocApproved ? 'Confirmed Shift' : 'Pending TTE') : seat.fullTypeName.split(' ')[0]}
                                </div>
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
                <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-md">
                  <Zap className="w-8 h-8 text-amber-600" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-black uppercase mb-1">
                    <span>⚡ REQUESTED NOT APPROVED</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    Vacant Berth Request Submitted!
                  </h3>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    Will auto-approve after 5 seconds with on-board TTE
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-left text-xs space-y-1.5 font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Requested Berth:</span>
                    <strong className="text-amber-950 text-sm">
                      Coach {reallocationSuccess.toCoach} • Seat #{reallocationSuccess.toSeat} ({reallocationSuccess.toBerthType})
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Passenger Name:</span>
                    <strong className="text-slate-900">{reallocationSuccess.passengerName}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">From Station:</span>
                    <strong className="text-slate-900">{reallocationSuccess.effectiveFromStation} ({reallocationSuccess.effectiveFromStationCode})</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Fare Adjustment:</span>
                    <strong className="text-emerald-700 font-black">₹0 (NO Extra Cost)</strong>
                  </div>
                  <div className="flex items-center justify-between border-t border-amber-200/60 pt-1">
                    <span className="text-slate-500">Current Status:</span>
                    <strong className="text-amber-800">REQUESTED NOT APPROVED</strong>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-100 text-left text-[11px] text-purple-950 flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-purple-700 shrink-0" />
                  <span>
                    Your existing booked e-Ticket now reflects <strong>Seat {(userBookedSeats[selectedPassengerIdx] || userBookedSeats[0])?.seatNumber || 36} + {reallocationSuccess.toSeat}</strong> from {reallocationSuccess.effectiveFromStation} at <strong>₹0 (NO Extra Cost)</strong>.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedVacantBerth(null);
                    setReallocationSuccess(null);
                  }}
                  className="w-full py-2.5 rounded-xl bg-purple-900 text-white font-bold text-xs hover:bg-purple-950 transition-all cursor-pointer shadow-md"
                >
                  Done & Return to Coach Layout ✓
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
                        Request Mid-Journey Vacant Berth
                      </h3>
                      <p className="text-[10px] text-emerald-700 font-bold">
                        ₹0 NO Extra Cost • Subject to On-Board TTE Verification
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
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Requested Vacant Berth</span>
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-900 text-sm">
                        Coach {selectedCoachMeta.representativeCode} • Seat #{selectedVacantBerth.num} ({selectedVacantBerth.fullTypeName})
                      </strong>
                      <span className="px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        VACANT
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-600 block">
                      Deboarding at: <strong>{activeStation.name}</strong> ({activeStation.code})
                    </span>
                  </div>

                  {/* Booked Passenger Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                      Which booked passenger is this vacant berth for?
                    </label>
                    <div className="space-y-1.5">
                      {userBookedSeats.length > 0 ? (
                        userBookedSeats.map((p, idx) => {
                          const isChosen = selectedPassengerIdx === idx;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setSelectedPassengerIdx(idx)}
                              className={`w-full p-2.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                                isChosen
                                  ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-300 text-purple-950 font-bold'
                                  : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                                  isChosen ? 'bg-purple-700 text-white' : 'bg-slate-200 text-slate-600'
                                }`}>
                                  {idx + 1}
                                </span>
                                <div>
                                  <span className="text-xs font-black block text-slate-900">{p.passengerName}</span>
                                  <span className="text-[10px] text-slate-500 block">
                                    Current Seat: Coach {p.coachCode || selectedCoachMeta.representativeCode} • #{p.seatNumber} ({p.berthType})
                                  </span>
                                </div>
                              </div>
                              {isChosen && (
                                <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white text-[9px] font-black">
                                  SELECTED ✓
                                </span>
                              )}
                            </button>
                          );
                        })
                      ) : (
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-bold">
                          Pratay Karali (Coach B4 • Seat #36 LB)
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-1">
                    <span className="text-[10px] font-bold text-amber-900 uppercase block">Terms & Auto-Approval Workflow</span>
                    <ul className="space-y-1 text-[11px] text-amber-900 list-disc list-inside">
                      <li>Free in-journey shift: <strong>₹0 (NO Extra Cost)</strong>.</li>
                      <li>Initially marked as <strong>REQUESTED NOT APPROVED</strong>.</li>
                      <li>Will <strong>auto-approve after 5 seconds</strong> upon electronic TTE chart sync.</li>
                      <li>Updated on e-ticket as <strong>Seat {(userBookedSeats[selectedPassengerIdx] || userBookedSeats[0])?.seatNumber || 36} + {selectedVacantBerth.num}</strong>.</li>
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
                        <span>Submitting Request...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5" />
                        <span>Request Berth (₹0 Free) →</span>
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
