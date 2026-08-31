import React, { useMemo } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Zap,
  ShieldCheck,
} from 'lucide-react';
import { useJourney } from '../context/JourneyContext';
import { parseWaitlistStatus } from '../utils/seatInventory';
import { getTrainStoppages } from '../data/trainStoppages';

export const WaitlistAlertPage: React.FC = () => {
  const {
    searchParams,
    selectedTrain,
    selectedClassCode,
    navigateTo,
  } = useJourney();

  // Fallback train if loaded directly
  const train = selectedTrain || {
    trainNumber: '12232',
    trainName: 'Chandigarh - Lucknow SF Express',
    fromStationName: searchParams.fromStation?.name || 'Chandigarh Junction',
    fromStationCode: searchParams.fromStation?.code || 'CDG',
    toStationName: searchParams.toStation?.name || 'Lucknow Charbagh NR',
    toStationCode: searchParams.toStation?.code || 'LKO',
    fromCity: searchParams.fromStation?.city || 'Chandigarh',
    toCity: searchParams.toStation?.city || 'Lucknow',
    departureTime: '21:05',
    arrivalTime: '08:25',
    durationHours: '11h 20m',
    classes: [
      { classCode: '3A', className: 'AC 3 Tier', fare: 1040, status: 'GNWL-18', availableSeats: 0, confirmationProbability: 78 },
    ],
  };

  const chosenClass = train.classes?.find((c) => c.classCode === selectedClassCode) || train.classes?.[0] || {
    classCode: '3A',
    className: 'AC 3 Tier',
    fare: 1040,
    status: 'GNWL-18',
    availableSeats: 0,
    confirmationProbability: 78,
  };

  const routeStations = useMemo(() => {
    return getTrainStoppages(train.trainNumber);
  }, [train.trainNumber]);

  // Check if current class is waitlisted or low-seats
  const isWaitlist = Boolean(
    chosenClass.status?.includes('WL') ||
    chosenClass.status?.includes('GNWL') ||
    chosenClass.status?.includes('RLWL') ||
    chosenClass.status?.includes('PQWL') ||
    chosenClass.status?.includes('RAC') ||
    chosenClass.availableSeats === 0
  );

  const isLowSeats = typeof chosenClass.availableSeats === 'number' && chosenClass.availableSeats > 0 && chosenClass.availableSeats < 10;

  const parsedWl = parseWaitlistStatus(chosenClass.status);

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-8 select-none font-sans text-slate-800 animate-in fade-in">
      {/* ═══════════════════════════════════════════════════════════════════
          1. TOP ROUTE HEADER & BACK BUTTON
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-2xl p-3 px-4 shadow-sm border border-purple-100">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigateTo('trains')}
            className="w-8 h-8 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-900 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Back to Trains"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>{train.fromCity || train.fromStationName} ({train.fromStationCode})</span>
              <span className="text-purple-600 font-normal">→</span>
              <span>{train.toCity || train.toStationName} ({train.toStationCode})</span>
            </h1>
            <p className="text-[11px] font-medium text-slate-500 flex items-center gap-2">
              <span>{train.trainNumber} • {train.trainName}</span>
              <span>•</span>
              <span className="text-purple-700 font-bold">Class {chosenClass.classCode} ({chosenClass.className})</span>
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold self-start sm:self-center flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>High Demand Alert</span>
        </span>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          2. OH NO WAITLIST ALERT HERO BANNER
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="rounded-3xl bg-gradient-to-br from-amber-500/10 via-purple-50/40 to-indigo-50/30 border-2 border-amber-300/80 p-5 sm:p-6 shadow-md space-y-4 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold text-2xl shrink-0 shadow-md">
              ⚠️
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-amber-500 text-slate-950">
                  {isWaitlist ? 'Waitlist Queue Notice' : 'Scarce Seats Alert'}
                </span>
                <span className="text-xs text-slate-500 font-semibold">
                  Train #{train.trainNumber} • Departure: {train.departureTime}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                {isWaitlist
                  ? `Oh no! ${chosenClass.classCode} is currently in Waitlist (${chosenClass.status})`
                  : `Hurry! Only ${chosenClass.availableSeats} confirmed seats remaining in ${chosenClass.classCode}`}
              </h2>
              <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
                {isWaitlist
                  ? 'All direct confirmed berths for this class are booked. If you proceed, your ticket will be issued in the waitlist queue with automated cancellation clearance monitoring.'
                  : 'High booking velocity detected on this route. Seats may exhaust within minutes. Proceed now to secure a confirmed berth.'}
              </p>
            </div>
          </div>

          {/* Status Badge Box */}
          <div className="p-3.5 rounded-2xl bg-white border border-amber-200 shadow-sm text-center sm:text-right shrink-0 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Live Status</span>
            <div className="text-base sm:text-lg font-black text-amber-900">
              {chosenClass.status || (isLowSeats ? `AVL ${chosenClass.availableSeats}` : 'WL')}
            </div>
            <div className="text-[11px] font-bold text-emerald-600 flex items-center justify-center sm:justify-end gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>{chosenClass.confirmationProbability || 78}% Confirmation Chance</span>
            </div>
          </div>
        </div>

        {/* NIRA COPILOT INSIGHT SPEECH BUBBLE */}
        <div className="p-3.5 rounded-2xl bg-white/90 border border-purple-100 flex items-start gap-3 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-xs space-y-1">
            <div className="flex items-center gap-2">
              <strong className="text-purple-950 font-black">Nira Travel Intelligence</strong>
              <span className="text-[10px] text-purple-600 font-mono font-bold">Auto-Radar Active</span>
            </div>
            <p className="text-slate-600 leading-relaxed font-medium">
              {isWaitlist
                ? `Historical data shows ${chosenClass.status} on train #${train.trainNumber} has strong clearance velocity (~4.2 cancellations/hr). Nirantar guarantees full fair-access protection and zero hidden tatkal surge charges.`
                : `Seats in ${chosenClass.classCode} are rapidly dropping. You can proceed with booking directly or review whether downstream scattered berths are available.`}
            </p>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          3. WAITLIST QUEUE INTELLIGENCE & POST-BOOKING VACANT SEAT NOTICE
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-3xl p-5 border border-purple-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-purple-100 text-purple-800">
              <Zap className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                Waitlist Clearance & Queue Analytics
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                AI telemetry analysis for {train.trainNumber} ({chosenClass.classCode})
              </p>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase border bg-amber-50 text-amber-800 border-amber-300">
            ⚡ {chosenClass.confirmationProbability || 78}% High Clearance Probability
          </span>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Queue Position</span>
            <div className="text-sm sm:text-base font-black text-purple-950 font-mono">
              {chosenClass.status}
            </div>
            <p className="text-[10px] text-slate-500">
              {parsedWl.statusType === 'RAC' ? 'Reserved Against Cancellation (Confirmed travel guarantee)' : 'General Waitlist Queue'}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">Clearance Velocity</span>
            <div className="text-sm sm:text-base font-black text-emerald-900 font-mono">
              ~4.2 Berths/Hr
            </div>
            <p className="text-[10px] text-emerald-700">
              Strong historical cancellation movement before chart preparation
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">Statutory Protection</span>
            <div className="text-sm sm:text-base font-black text-blue-950">
              100% Full Refund
            </div>
            <p className="text-[10px] text-blue-700">
              Automatic zero-clerkage refund if unconfirmed at chart preparation
            </p>
          </div>
        </div>

        {/* POST-BOOKING VACANT SEAT UNLOCK NOTICE */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-indigo-50/80 border border-emerald-200 text-xs text-emerald-950 space-y-1.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <strong className="text-emerald-950 font-bold text-xs sm:text-sm">
              Mid-Journey Vacant Berths Unlocked After Booking
            </strong>
          </div>
          <p className="text-[11px] text-emerald-900 leading-relaxed font-medium">
            Vacant seats and mid-journey seat shifts are unlocked strictly <strong>after booking confirmation</strong>. Once your ticket is issued, your Live Radar will monitor intermediate stations where passengers deboard, allowing you to submit mid-journey shift requests to vacant berths at ₹0 extra cost.
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          4. ACTION BAR: PROCEED OR CHOOSE ANOTHER TRAIN
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={() => navigateTo('trains')}
          className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white hover:bg-purple-50 text-purple-900 border border-purple-200 text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Choose Another Train</span>
        </button>

        <button
          type="button"
          onClick={() => navigateTo('workspace')}
          className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white text-xs font-black shadow-lg shadow-purple-600/25 transition-all hover:scale-102 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
        >
          <span>Continue with Booking ({chosenClass.classCode} • ₹{chosenClass.fare})</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default WaitlistAlertPage;
