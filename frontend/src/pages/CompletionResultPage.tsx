import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Share2,
  Utensils,
  MapPin,
  Calendar,
  Clock,
  User,
  Ticket,
  Train,
  Navigation,
  ArrowRight,
  ShieldCheck,
  Zap,
  Lock,
  Headphones,
  Sparkles,
} from 'lucide-react';
import { useJourney } from '../context/JourneyContext';

import { speakNiraResponse } from '../services/voiceService';

export const CompletionResultPage: React.FC = () => {
  const {
    searchParams,
    selectedTrain,
    selectedClassCode,
    passengers,
    navigateTo,
    handleQuickTrack,
    issuedTicket,
    bookingRecord,
    journeyState,
  } = useJourney();

  const [copiedPnr, setCopiedPnr] = useState(false);

  // Train data fallback
  const train = issuedTicket?.train || selectedTrain || {
    trainNumber: '12951',
    trainName: 'Mumbai Rajdhani',
    fromStationName: searchParams.fromStation.name || 'New Delhi',
    fromStationCode: searchParams.fromStation.code || 'NDLS',
    toStationName: searchParams.toStation.name || 'Mumbai CSMT',
    toStationCode: searchParams.toStation.code || 'MMCT',
    departureTime: '16:55',
    arrivalTime: '08:40',
    durationHours: '15h 45m',
    classes: [{ classCode: '3A', className: 'AC 3 Tier', fare: 2990, status: 'AVAILABLE', availableSeats: 48 }],
  };

  const isWaitlisted = Boolean(
    (issuedTicket && ((issuedTicket.status as string) === 'WAITLIST' || (issuedTicket.status as string) === 'RAC' || (issuedTicket.seatAllotments?.[0]?.coach || '').includes('WL'))) ||
    (bookingRecord && (bookingRecord.status === 'WAITLIST' || bookingRecord.status === 'RAC' || (bookingRecord.seatAllotment?.coach || '').includes('WL')))
  );

  const [showWaitlistPopup, setShowWaitlistPopup] = useState<boolean>(isWaitlisted);
  const [mascotReaction, setMascotReaction] = useState<'SAD' | 'HAPPY'>('SAD');

  React.useEffect(() => {
    setShowWaitlistPopup(isWaitlisted);
  }, [isWaitlisted]);

  // Initial Waitlist allocation (Decreasing happens on next page: Track Radar)
  const initialWaitlistNum = isWaitlisted
    ? Number(issuedTicket?.seatAllotments?.[0]?.seatNumber || bookingRecord?.seatAllotment?.seatNumber || 8)
    : 0;
  const liveWl = initialWaitlistNum;
  const clearedAhead = 0;
  const liveProb = 78;
  const racProb = 88;

  const handleMascotTap = () => {
    setMascotReaction('HAPPY');
    setTimeout(() => {
      setShowWaitlistPopup(false);
      handleQuickTrack(train.trainNumber || '12863');
    }, 400);
  };

  const displayPassengers = React.useMemo(() => {
    let pList = (issuedTicket?.passengers && issuedTicket.passengers.length > 0)
      ? issuedTicket.passengers
      : (passengers && passengers.length > 0)
      ? passengers
      : [
          {
            id: 'p1',
            name: 'Pratay Karali',
            age: 24,
            gender: 'M' as const,
            berthPreference: 'SIDE_LOWER' as const,
            assignedClassCode: selectedClassCode || '3A',
          },
        ];

    const targetCount = Math.max(searchParams.passengersCount || 1, pList.length || 1);
    if (pList.length < targetCount) {
      const defaultNames = ['Pratay Karali', 'Varun Sharma', 'Anusuya Karali', 'Sourav Das', 'Rohan Gupta'];
      const expanded = [...pList];
      for (let i = pList.length; i < targetCount; i++) {
        expanded.push({
          id: `p_${i + 1}`,
          name: defaultNames[i] || `Passenger ${i + 1}`,
          age: 24 + i * 2,
          gender: i % 2 === 0 ? ('M' as const) : ('F' as const),
          berthPreference: i % 2 === 0 ? ('SIDE_LOWER' as const) : ('MIDDLE' as const),
          assignedClassCode: selectedClassCode || '3A',
        });
      }
      return expanded;
    }
    return pList;
  }, [issuedTicket, passengers, searchParams.passengersCount, selectedClassCode]);

  const getPassengerSeat = (p: any, idx: number) => {
    if (issuedTicket?.seatAllotments && issuedTicket.seatAllotments[idx]) {
      const s = issuedTicket.seatAllotments[idx];
      return `${s.coach} - ${s.seatNumber} (${s.berthType})`;
    }
    const pClass = p.assignedClassCode || selectedClassCode || '3A';
    const coachPrefix = isWaitlisted ? 'GNWL' : (pClass === '1A' ? 'H1' : pClass === '2A' ? 'A1' : pClass === 'SL' ? 'S1' : 'B4');
    const seatNum = isWaitlisted ? 42 + idx : 14 + idx * 8;
    const berthLabel = isWaitlisted
      ? `Queue #${42 + idx} (Real-Time Clearance)`
      : (p.berthPreference && p.berthPreference !== 'NO_PREFERENCE' ? p.berthPreference.replace('_', ' ') : (idx % 2 === 0 ? 'Lower' : 'Middle'));
    return `${coachPrefix} - ${seatNum} (${berthLabel})`;
  };

  const passengerName = displayPassengers[0]?.name || 'Pratay Karali';
  const pnrNumber = issuedTicket?.pnrNumber || bookingRecord?.pnrNumber || '2847 5896 1234';

  const handleCopyPnr = () => {
    navigator.clipboard.writeText(pnrNumber.replace(/\s/g, ''));
    setCopiedPnr(true);
    setTimeout(() => setCopiedPnr(false), 2000);
  };

  const handleDownloadPdf = () => {
    console.log('📥 Digital e-Ticket PDF downloaded with DigiLocker QR verification code.');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-2 pb-2 select-none font-sans text-slate-800">
      {/* ═══════════════════════════════════════════════════════════════════
          1. TOP HEADER & 6-STEP JOURNEY STEPPER
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigateTo('home')}
              className="w-7 h-7 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-900 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Back to Home"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-1.5 leading-tight">
                <span>All Set!</span>
                <span className="text-xl">🎉</span>
              </h1>
              <p className="text-[11px] font-semibold text-slate-500">
                Your booking is confirmed.
              </p>
            </div>
          </div>
        </div>

        {/* 6-Step Stepper */}
        <div className="flex items-center justify-between max-w-xl mx-auto px-2 py-0.5 text-xs">
          {[
            { label: 'Search', done: true },
            { label: 'Select Train', done: true },
            { label: 'Booking Details', done: true },
            { label: 'Autofill & Review', done: true },
            { label: 'Payment', done: true },
          ].map((s, idx) => (
            <React.Fragment key={idx}>
              <div className="flex flex-col items-center gap-0.5">
                <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold shadow-xs">
                  <Check className="w-2.5 h-2.5" />
                </div>
                <span className="text-[9px] font-semibold text-slate-600 truncate max-w-[70px] text-center">
                  {s.label}
                </span>
              </div>
              <div className="flex-1 h-0.5 bg-emerald-400 mx-1" />
            </React.Fragment>
          ))}

          {/* Step 6: Confirmation (Active) */}
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-4 h-4 rounded-full bg-purple-700 text-white flex items-center justify-center text-[9px] font-bold shadow-sm shadow-purple-600/30 ring-2 ring-purple-100">
              6
            </div>
            <span className="text-[9px] font-bold text-purple-900">Confirmation</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          WAITLIST NIRA BOT JUMP POPUP (FOR TRAIN 12232 / WAITLIST BOOKINGS)
          ═══════════════════════════════════════════════════════════════════ */}
      {showWaitlistPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
          <div
            onClick={handleMascotTap}
            className="relative w-full max-w-lg bg-white rounded-[32px] p-6 sm:p-7 shadow-[0_24px_80px_rgba(124,58,237,0.35)] border-2 border-purple-300 text-center space-y-4 cursor-pointer transform hover:scale-[1.01] transition-all group ring-8 ring-purple-100/80"
          >
            {/* Top Close / Dismiss */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowWaitlistPopup(false);
              }}
              className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
            >
              ✕
            </button>

            {/* 3D Robot Mascot (Sad jumping -> Happy on tap) */}
            <div className="relative w-36 h-36 mx-auto -mt-16 flex items-center justify-center">
              {mascotReaction === 'SAD' ? (
                <div className="relative w-full h-full flex items-center justify-center animate-bounce duration-700">
                  <img
                    src="/assets/images/characters/nira_sad.png"
                    alt="Nira Sad Robot"
                    className="w-full h-full object-contain filter drop-shadow-[0_15px_25px_rgba(244,63,94,0.35)]"
                  />
                  <div className="absolute -top-1 -right-2 bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse shadow-md">
                    Oh no! 💧
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-full flex items-center justify-center animate-pulse duration-500 scale-110">
                  <img
                    src="/assets/images/characters/nira_happy_mascot.png"
                    alt="Nira Happy Mascot"
                    className="w-full h-full object-contain filter drop-shadow-[0_15px_25px_rgba(16,185,129,0.45)]"
                  />
                  <div className="absolute -top-1 -right-2 bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md">
                    Let's Track! ✨
                  </div>
                </div>
              )}
            </div>

            {/* Title & Speech Bubble */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-300 text-xs font-black shadow-2xs">
                  <span>⚠️ Waiting List Allocated</span>
                  <span>•</span>
                  <span className="font-mono text-amber-700 font-extrabold">GNWL-{initialWaitlistNum}</span>
                </div>
              </div>

              <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                {mascotReaction === 'SAD'
                  ? 'Waiting list status allocated for this route'
                  : 'Opening Real-Time Waitlist Radar...'}
              </h3>

              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-50 via-white to-purple-50 border border-purple-200 text-slate-700 text-xs font-medium space-y-2.5 text-left shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-700 shrink-0" />
                    <strong className="text-purple-950 font-bold">Nira Waitlist Copilot:</strong>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    Queue Assigned
                  </span>
                </div>
                <p className="text-slate-700 text-xs sm:text-sm font-semibold leading-relaxed">
                  "Your booking for <strong>#{train.trainNumber} {train.trainName}</strong> is assigned to <strong className="text-amber-800 font-mono">GNWL-{initialWaitlistNum}</strong>. Tap below to track real-time queue clearance and confirmation updates!"
                </p>

                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-purple-100 text-center text-[10px]">
                  <div className="p-2 rounded-xl bg-white border border-purple-100 shadow-2xs">
                    <span className="text-slate-400 block font-bold">Initial Position</span>
                    <strong className="text-amber-700 font-mono text-xs">GNWL {initialWaitlistNum}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-purple-100 shadow-2xs">
                    <span className="text-slate-400 block font-bold">Initial Odds</span>
                    <strong className="text-purple-700 font-mono text-xs">{liveProb}% Probable</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-purple-100 shadow-2xs">
                    <span className="text-slate-400 block font-bold">Live Radar</span>
                    <strong className="text-emerald-600 font-mono text-xs">Ready to Track</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              type="button"
              onClick={handleMascotTap}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs sm:text-sm shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
            >
              <span>🔍 Tap to Analyse Waitlist & Track Live ➔</span>
            </button>
            <p className="text-[10px] text-slate-400 font-medium">
              (Tap anywhere on this card to switch to real-time seat analysis & tracking)
            </p>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          2. BOOKING CONFIRMED HERO BANNER WITH CELEBRATION SCENIC BG
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative rounded-2xl overflow-hidden shadow-sm border border-purple-200/60 p-3 sm:p-4 flex items-center justify-between gap-3 text-slate-900">
        {/* Celebratory Sunset Terminal Backdrop */}
        <img
          src="/assets/images/ticket_platform_celebration_bg.jpg"
          alt="Celebration Station"
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
        />

        {/* Soft Translucent Gradient Mask */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/88 to-purple-50/75 pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full text-white flex items-center justify-center shadow-md shrink-0 ${isWaitlisted ? 'bg-amber-500 shadow-amber-500/25' : 'bg-emerald-500 shadow-emerald-500/25'}`}>
            {isWaitlisted ? <Zap className="w-6 h-6 stroke-[2.5]" /> : <Check className="w-6 h-6 stroke-[3]" />}
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              {isWaitlisted ? `Booking Allocated (Waitlist GNWL-42)` : 'Booking Confirmed!'}
            </h2>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              {isWaitlisted ? `Waitlist ticket assigned at GNWL-42. Tap Track Live to monitor real-time queue clearance.` : 'We hope you have a safe and comfortable journey.'}
            </p>
          </div>
        </div>

        {/* Train badge on right */}
        <div className="relative z-10 hidden sm:flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-purple-100 shadow-xs">
          <Train className="w-4 h-4 text-purple-700" />
          <span className="text-xs font-bold text-purple-950">
            {train.trainName} • {isWaitlisted ? `WL-42 (62%)` : 'Confirmed'}
          </span>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          3. MAIN TWO-COLUMN UNBOXED DIGITAL TICKET LAYOUT
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 items-start">
        {/* ──────────────── LEFT COLUMN: DIGITAL TICKET DETAILS & ACTION TILES (2 Cols) ──────────────── */}
        <div className="lg:col-span-2 space-y-2">
          {/* DIGITAL TICKET TWO-PANEL GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* PANEL 1: ROUTE & TIMINGS */}
            <div className="bg-white rounded-2xl p-3 shadow-xs border border-purple-100 space-y-2">
              <div className="flex items-center justify-between border-b border-purple-50 pb-1.5">
                <span className="text-xs sm:text-sm font-bold text-slate-900">
                  {train.trainNumber} • {train.trainName}
                </span>
                <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.2 rounded">
                  {selectedClassCode || 'AC 3 Tier'}
                </span>
              </div>

              {/* Timeline NDLS -> MMCT */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-base font-bold text-slate-900 block leading-tight">{train.fromStationCode}</span>
                  <span className="text-[10px] text-slate-400 font-medium">{train.fromStationName}</span>
                </div>

                <div className="flex-1 flex flex-col items-center px-2">
                  <div className="w-full h-0.5 bg-purple-500 relative flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-purple-700 ring-2 ring-purple-100" />
                  </div>
                  <span className="text-[9px] text-slate-500 font-bold mt-0.5">{train.durationHours}</span>
                </div>

                <div className="text-right">
                  <span className="text-base font-bold text-slate-900 block leading-tight">{train.toStationCode}</span>
                  <span className="text-[10px] text-slate-400 font-medium">{train.toStationName}</span>
                </div>
              </div>

              {/* Grid Metadata */}
              <div className="grid grid-cols-4 gap-1 text-center bg-purple-50/40 p-1.5 rounded-xl text-[10px]">
                <div>
                  <Calendar className="w-3 h-3 text-purple-700 mx-auto mb-0.5" />
                  <span className="font-bold text-slate-800 block text-[11px] leading-tight">24 May</span>
                  <span className="text-[9px] text-slate-400">Sat</span>
                </div>
                <div>
                  <Clock className="w-3 h-3 text-purple-700 mx-auto mb-0.5" />
                  <span className="font-bold text-slate-800 block text-[11px] leading-tight">{train.departureTime}</span>
                  <span className="text-[9px] text-slate-400">Departure</span>
                </div>
                <div>
                  <Clock className="w-3 h-3 text-purple-700 mx-auto mb-0.5" />
                  <span className="font-bold text-slate-800 block text-[11px] leading-tight">{train.arrivalTime}</span>
                  <span className="text-[9px] text-slate-400">Arrival</span>
                </div>
                <div>
                  <User className="w-3 h-3 text-purple-700 mx-auto mb-0.5" />
                  <span className="font-bold text-slate-800 block text-[11px] leading-tight">
                    {displayPassengers.length} {displayPassengers.length > 1 ? 'Adults' : 'Adult'}
                  </span>
                  <span className="text-[9px] text-slate-400 truncate block">
                    {displayPassengers.map((p: any) => p.name ? p.name.split(' ')[0] : 'Pax').join(', ')}
                  </span>
                </div>
              </div>

              {/* PNR & Download Row */}
              <div className="flex items-center justify-between gap-2 pt-0.5 border-t border-purple-50">
                <div className="flex items-center gap-1.5 bg-purple-50/90 px-2.5 py-1 rounded-xl border border-purple-100">
                  <span className="text-[9px] uppercase font-bold text-slate-400">PNR</span>
                  <span className="text-xs font-mono font-bold text-purple-950 tracking-wider">
                    {pnrNumber}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyPnr}
                    className="text-purple-700 hover:text-purple-900 cursor-pointer p-0.5"
                    title="Copy PNR"
                  >
                    {copiedPnr ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="flex items-center gap-1 px-3 py-1 rounded-xl border border-purple-300 text-purple-900 hover:bg-purple-50 text-[11px] font-bold shadow-xs transition-all cursor-pointer"
                >
                  <Download className="w-3 h-3 text-purple-700" />
                  <span>Download Ticket</span>
                </button>
              </div>

              {/* Green Confirmation SMS/Email Notice */}
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-semibold bg-emerald-50/80 p-1.5 px-2 rounded-lg">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>Confirmation sent to your mobile & email</span>
              </div>
            </div>

            {/* PANEL 2: PASSENGER DETAILS & ADVENTURE CARD */}
            <div className="space-y-2">
              {/* Passenger Cards */}
              <div className="bg-white rounded-2xl p-3 shadow-xs border border-purple-100 space-y-2.5">
                <div className="flex items-center justify-between border-b border-purple-50 pb-1">
                  <h4 className="text-xs font-bold text-slate-900">
                    Passenger Details ({displayPassengers.length})
                  </h4>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                    DigiLocker Verified
                  </span>
                </div>

                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-0.5">
                  {displayPassengers.map((p, idx) => {
                    const initials = p.name
                      ? p.name
                          .split(' ')
                          .map((n: string) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)
                      : `P${idx + 1}`;
                    const genderLabel = p.gender === 'F' ? 'Female' : p.gender === 'M' ? 'Male' : 'Other';
                    const berthLabel = p.berthPreference && p.berthPreference !== 'NO_PREFERENCE' ? p.berthPreference.replace('_', ' ') : 'Lower Berth';
                    const seatInfo = getPassengerSeat(p, idx);
                    const pClass = p.assignedClassCode || selectedClassCode || '3A';

                    return (
                      <div key={p.id || idx} className="p-2.5 rounded-xl bg-purple-50/40 border border-purple-100 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-900 font-black text-[11px] flex items-center justify-center shrink-0 border border-purple-200">
                              {initials}
                            </div>
                            <div>
                              <span className="text-xs font-black text-slate-900 block">{p.name || `Passenger ${idx + 1}`}</span>
                              <span className="text-[10px] text-slate-500 font-semibold">
                                {p.age} yrs • {genderLabel} • {berthLabel}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-200">
                            Class {pClass}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 text-xs pt-1 border-t border-purple-100/60">
                          <div>
                            <span className="text-[9px] text-slate-400 block font-semibold">Booking Status</span>
                            {isWaitlisted ? (
                              <span className="font-bold text-amber-600 text-xs flex items-center gap-1 font-mono">
                                ⚠️ GNWL-{42 + idx}
                              </span>
                            ) : (
                              <span className="font-bold text-emerald-600 text-xs">Confirmed ✓</span>
                            )}
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block font-semibold">Coach & Berth / Seat</span>
                            <span className="font-bold text-purple-950 text-xs font-mono">{seatInfo}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Plan Your Next Adventure Card */}
              <div className="bg-gradient-to-r from-purple-50 via-purple-50/60 to-indigo-50/40 rounded-2xl p-2.5 px-3 border border-purple-100 flex items-center justify-between gap-2 shadow-xs">
                <div>
                  <span className="text-xs font-bold text-slate-900 block leading-tight">
                    Plan your next adventure ✨
                  </span>
                  <p className="text-[10px] text-slate-500 font-medium mb-1">
                    Explore more destinations
                  </p>
                  <button
                    type="button"
                    onClick={() => navigateTo('discover')}
                    className="px-2.5 py-1 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-[10px] font-bold shadow-xs transition-all cursor-pointer"
                  >
                    Explore Trains
                  </button>
                </div>
                <div className="w-14 h-10 flex items-center justify-center shrink-0">
                  <img
                    src="/assets/images/plan_adventure_card.png"
                    alt="Adventure"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* WHAT WOULD YOU LIKE TO DO NEXT? (3 ACTION CARDS) */}
          <div className="space-y-1.5 pt-0.5">
            <h4 className="text-xs font-bold text-slate-900 px-1">
              What would you like to do next?
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Action 1: Track Train Live GPS Radar */}
              <button
                type="button"
                onClick={() => handleQuickTrack(train.trainNumber)}
                className="p-2.5 px-3 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-300 flex items-center justify-between text-left transition-all group cursor-pointer shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <Train className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-emerald-950 group-hover:text-emerald-900 block">
                      Track Train #{train.trainNumber}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold">Live GPS Platform Radar</span>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Action 2: Go to My Journeys */}
              <button
                type="button"
                onClick={() => navigateTo('my-journeys')}
                className="p-2.5 px-3 rounded-2xl bg-purple-50/60 hover:bg-purple-100/70 border border-purple-100 flex items-center justify-between text-left transition-all group cursor-pointer shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <Navigation className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 group-hover:text-purple-900 block">
                      Go to My Journeys
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">View upcoming trips</span>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-purple-600 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Action 3: Book Another Ticket */}
              <button
                type="button"
                onClick={() => navigateTo('discover')}
                className="p-2.5 px-3 rounded-2xl bg-purple-50/60 hover:bg-purple-100/70 border border-purple-100 flex items-center justify-between text-left transition-all group cursor-pointer shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                    <Ticket className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 group-hover:text-purple-900 block">
                      Book Another Ticket
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">Plan a new journey</span>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-purple-600 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* ──────────────── RIGHT COLUMN: UNBOXED TRANSPARENT MASCOTS + QUICK ACTIONS (1 Col) ──────────────── */}
        <div className="space-y-2">
          {/* 1. CELEBRATING ANANYA CARD (NO INNER BOX / NO FRAME) */}
          <div className="bg-gradient-to-b from-[#F3EDFD] via-[#EFE7FD] to-[#EBE2FC] rounded-2xl p-3 border border-purple-100 shadow-xs relative overflow-hidden text-center space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-purple-900">
              <div className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-700" />
                <span>Nira</span>
              </div>
              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </span>
            </div>

            {/* Transparent 3D Character Cutout (Zero Box Frame) */}
            <div className="w-28 h-28 mx-auto flex items-center justify-center pointer-events-none">
              <img
                src="/assets/images/characters/citizen_excited.png"
                alt="Ananya Celebrating"
                className="w-full h-full object-contain drop-shadow-md"
              />
            </div>

            {/* Clean Speech Bubble with Direct Radar Button */}
            <div className="bg-white rounded-xl p-2.5 shadow-xs border border-purple-100 space-y-2">
              <span className="text-xs font-bold text-purple-950 block">Yay! We're all set! 🎉</span>
              <p className="text-[10px] text-slate-600 font-semibold leading-relaxed">
                Your booking is confirmed. You can now track train #{train.trainNumber} live on the GPS Radar!
              </p>
              <button
                type="button"
                onClick={() => handleQuickTrack(train.trainNumber)}
                className="w-full py-2 px-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-[11px] shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>🛰️ Open Live GPS Radar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 2. QUICK ACTIONS (3 TILES) */}
          <div className="bg-white rounded-2xl p-2.5 border border-purple-100 shadow-xs space-y-1.5">
            <span className="text-[11px] font-bold text-slate-800 block">Quick Actions</span>
            <div className="grid grid-cols-3 gap-1.5 text-center">
              <button
                type="button"
                onClick={() => handleQuickTrack(train.trainNumber)}
                className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 flex flex-col items-center justify-center transition-all cursor-pointer border border-emerald-200/60"
              >
                <MapPin className="w-4 h-4 text-emerald-700 mb-0.5" />
                <span className="text-[10px] font-bold leading-tight">Track Live</span>
              </button>
              <button
                type="button"
                onClick={() => console.log('🍱 IRCTC e-Catering: Fresh hot meals will be delivered to seat 36 at Nagpur station.')}
                className="p-2 rounded-xl bg-orange-50/50 hover:bg-orange-100 text-orange-900 flex flex-col items-center justify-center transition-all cursor-pointer"
              >
                <Utensils className="w-4 h-4 text-orange-600 mb-0.5" />
                <span className="text-[10px] font-bold leading-tight">Order Food</span>
              </button>
              <button
                type="button"
                onClick={() => console.log('🔗 Share link copied to clipboard: https://nirantar.gov.in/t/284758961234')}
                className="p-2 rounded-xl bg-blue-50/50 hover:bg-blue-100 text-blue-900 flex flex-col items-center justify-center transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-blue-600 mb-0.5" />
                <span className="text-[10px] font-bold leading-tight">Share Ticket</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          4. BOTTOM TRUST FOOTER BAR
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-purple-100 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-3 h-3" />
          </div>
          <div>
            <span className="font-bold text-slate-800 block text-[10px]">Secure Payments</span>
            <span className="text-[9px] text-slate-400 font-medium">100% safe & encrypted</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Clock className="w-3 h-3" />
          </div>
          <div>
            <span className="font-bold text-slate-800 block text-[10px]">Instant Confirmation</span>
            <span className="text-[9px] text-slate-400 font-medium">Get ticket in seconds</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Lock className="w-3 h-3" />
          </div>
          <div>
            <span className="font-bold text-slate-800 block text-[10px]">No Hidden Charges</span>
            <span className="text-[9px] text-slate-400 font-medium">Transparent pricing</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Headphones className="w-3 h-3" />
          </div>
          <div>
            <span className="font-bold text-slate-800 block text-[10px]">24x7 Support</span>
            <span className="text-[9px] text-slate-400 font-medium">We're here to help</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompletionResultPage;
