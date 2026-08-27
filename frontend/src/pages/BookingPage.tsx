import React, { useState } from 'react';
import {
  ArrowLeft,
  Sparkles,
  User,
  ShieldCheck,
  CheckCircle2,
  Plus,
  Trash2,
  Train,
  ArrowRight,
} from 'lucide-react';
import { useJourney, PassengerProfile } from '../context/JourneyContext';

// Explicit allowed-field filter whitelist (Zero PII / Zero Auth credentials)
const ALLOWED_AI_FIELDS = [
  'name',
  'age',
  'gender',
  'berthPreference',
  'seniorCitizenConcession',
] as const;

export const BookingPage: React.FC = () => {
  const {
    searchParams,
    selectedTrain,
    selectedClassCode,
    setSelectedClassCode,
    passengers,
    setPassengers,
    navigateTo,
  } = useJourney();

  const [isAiAutofilled, setIsAiAutofilled] = useState(false);
  const [autofillNotice, setAutofillNotice] = useState<string | null>(null);
  const [lockSeconds, setLockSeconds] = useState(585); // 09:45 min
  const [showPassengerConfirmModal, setShowPassengerConfirmModal] = useState(false);

  React.useEffect(() => {
    const t = setInterval(() => {
      setLockSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  React.useEffect(() => {
    if (searchParams.passengersCount && searchParams.passengersCount > passengers.length) {
      const defaultNames = ['Pratay Karali', 'Varun Sharma', 'Anusuya Karali', 'Sourav Das', 'Rohan Gupta'];
      const expanded = [...passengers];
      for (let i = passengers.length; i < searchParams.passengersCount; i++) {
        expanded.push({
          id: `p_${Date.now()}_${i + 1}`,
          name: defaultNames[i] || `Passenger ${i + 1}`,
          age: 24 + i * 2,
          gender: i % 2 === 0 ? 'M' : 'F',
          berthPreference: i % 2 === 0 ? 'LOWER' : 'MIDDLE',
          assignedClassCode: selectedClassCode || '3A',
        });
      }
      setPassengers(expanded);
    }
  }, [searchParams.passengersCount, passengers.length, selectedClassCode, setPassengers]);

  const formatLockTimer = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Train fallback if directly loaded
  const train = selectedTrain || {
    trainNumber: '12951',
    trainName: 'Mumbai Rajdhani Express',
    fromStationName: searchParams.fromStation.name,
    fromStationCode: searchParams.fromStation.code,
    toStationName: searchParams.toStation.name,
    toStationCode: searchParams.toStation.code,
    departureTime: '16:55',
    arrivalTime: '08:35',
    durationHours: '15h 40m',
    classes: [{ classCode: '3A', className: 'AC 3-Tier', fare: 2150, status: 'AVAILABLE', availableSeats: 48 }],
  };

  const selectedClass = train.classes.find((c) => c.classCode === selectedClassCode) || train.classes[0] || {
    classCode: '3A',
    className: 'AC 3-Tier',
    fare: 2150,
  };

  // Compute Class Breakdown string (e.g. 1x 3A, 1x SL) & dynamic per-passenger fare sum
  const classCounts: Record<string, number> = {};
  passengers.forEach((p) => {
    const code = p.assignedClassCode || selectedClassCode || train.classes[0]?.classCode || '3A';
    classCounts[code] = (classCounts[code] || 0) + 1;
  });
  const classBreakdown = Object.entries(classCounts)
    .map(([cls, count]) => `${count}x ${cls}`)
    .join(', ');

  const totalFare = passengers.reduce((sum, p) => {
    const pCode = p.assignedClassCode || selectedClassCode || train.classes[0]?.classCode || '3A';
    const cls = train.classes?.find((c) => c.classCode === pCode);
    return sum + (cls ? cls.fare : (selectedClass?.fare || 1870));
  }, 0);

  // AI-Assisted Safe Autofill Engine with Strict Allowed-Field Filter
  const handleAiAutofill = () => {
    const rawData = {
      name: 'Pratay Karali',
      age: 24,
      gender: 'M' as const,
      berthPreference: 'LOWER' as const,
      __disallowed_pin: '1234',
      __disallowed_otp: '998811',
      __disallowed_token: 'secret_jwt_xyz',
    };

    const sanitizedPassenger: PassengerProfile = {
      id: `p_${Date.now()}_1`,
      name: ALLOWED_AI_FIELDS.includes('name') ? rawData.name : '',
      age: ALLOWED_AI_FIELDS.includes('age') ? rawData.age : 24,
      gender: ALLOWED_AI_FIELDS.includes('gender') ? rawData.gender : 'M',
      berthPreference: ALLOWED_AI_FIELDS.includes('berthPreference') ? rawData.berthPreference : 'NO_PREFERENCE',
    };

    setPassengers([sanitizedPassenger]);
    setIsAiAutofilled(true);
    setAutofillNotice('Passenger details safely autofilled via SafeAssist Allowed-Field Filter. Sensitive fields excluded.');
  };

  const handleAddPassenger = () => {
    if (passengers.length >= 6) {
      console.log('Maximum 6 passengers allowed per IRCTC reservation.');
      return;
    }
    const newPassenger: PassengerProfile = {
      id: `p_${Date.now()}_${passengers.length + 1}`,
      name: '',
      age: 25,
      gender: 'M',
      berthPreference: 'NO_PREFERENCE',
    };
    setPassengers([...passengers, newPassenger]);
  };

  const handleRemovePassenger = (id: string) => {
    if (passengers.length <= 1) {
      console.log('At least one passenger is required.');
      return;
    }
    setPassengers(passengers.filter((p) => p.id !== id));
  };

  const handleUpdatePassenger = (id: string, field: keyof PassengerProfile, value: any) => {
    setPassengers(
      passengers.map((p) => {
        if (p.id === id) {
          return { ...p, [field]: value };
        }
        return p;
      })
    );
  };

  const handleContinueToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const emptyNames = passengers.filter((p) => !p.name || p.name.trim() === '');
    if (emptyNames.length > 0) {
      console.log('Please provide the full name for all passengers.');
      return;
    }
    setShowPassengerConfirmModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-2 pb-1 select-none font-sans text-slate-800">
      {/* ═══════════════════════════════════════════════════════════════════
          1. UNIFIED SCENIC HERO & TRAIN BANNER (With Scenic Vande Bharat BG)
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative rounded-[24px] overflow-hidden shadow-md border border-purple-200/50 text-white p-3.5 sm:p-4">
        {/* Scenic Vande Bharat Railway Viaduct Background */}
        <img
          src="/assets/images/booking_scenic_bg.jpg"
          alt="Scenic Vande Bharat"
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
        />

        {/* Gradient Readable Mask */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1E0638]/95 via-[#180833]/88 to-[#0F172A]/75 pointer-events-none" />

        {/* Unified Content */}
        <div className="relative z-10 space-y-2">
          {/* Top Bar inside Hero */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/15 pb-2">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => navigateTo('trains')}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="Back to train selection"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Passenger & Booking Workspace</span>
                  <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/30">
                    Step 2 of 4
                  </span>
                </h1>
              </div>
            </div>

            {/* AI AUTOFILL CTA BUTTON */}
            <button
              type="button"
              onClick={handleAiAutofill}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:from-[#6D28D9] hover:to-[#7E22CE] text-white text-xs font-bold shadow-md shadow-purple-900/40 active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>Prepare details</span>
            </button>
          </div>

          {/* Train Details Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center text-purple-200">
                <Train className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-bold text-white block leading-tight">
                  {train.trainNumber} • {train.trainName}
                </span>
                <span className="text-[10px] text-purple-200 font-semibold">
                  {searchParams.travelDate || 'Tomorrow, 24 May'} • Quota: {searchParams.quota || 'General (GN)'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-md bg-purple-800/80 backdrop-blur-sm border border-purple-400/40 text-[11px] font-bold text-purple-100">
                Class: {selectedClass.classCode} ({selectedClass.className})
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/25 backdrop-blur-sm border border-emerald-400/40 text-[11px] font-bold text-emerald-300">
                ₹{selectedClass.fare} / adult
              </span>
            </div>
          </div>

          {/* Route Timings Strip */}
          <div className="grid grid-cols-3 items-center text-center sm:text-left text-xs pt-1">
            <div>
              <span className="text-[10px] text-purple-200 font-semibold block">{train.fromStationName} ({train.fromStationCode})</span>
              <span className="text-sm sm:text-base font-bold text-white block">{train.departureTime}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-purple-100">{train.durationHours}</span>
              <div className="w-full h-0.5 bg-purple-300/40 relative flex items-center justify-center my-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-sm" />
              </div>
              <span className="text-[9px] text-purple-200 font-semibold">Direct Express</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-purple-200 font-semibold block">{train.toStationName} ({train.toStationCode})</span>
              <span className="text-sm sm:text-base font-bold text-white block">{train.arrivalTime}</span>
            </div>
          </div>

          {/* Temporary Seat Lock Banner */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-amber-500/20 border border-amber-400/40 text-xs text-amber-200 mt-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <strong className="text-white">10-Min Seat Lock Active:</strong>
              <span className="hidden sm:inline">Your berths are temporarily reserved.</span>
            </div>
            <span className="font-mono font-black text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-lg border border-amber-400/30">
              ⏱️ {formatLockTimer(lockSeconds)} remaining
            </span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          2. MAIN PASSENGER FORM & SIDEBAR (Ultra Compact to Fit Viewport)
          ═══════════════════════════════════════════════════════════════════ */}
      <form onSubmit={handleContinueToPayment} className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 items-start">
        {/* ──────────────── LEFT COLUMN: PASSENGER FORMS (2 Cols) ──────────────── */}
        <div className="lg:col-span-2 space-y-2">
          {/* TRAVEL CLASS SELECTION SECTION */}
          {train.classes && train.classes.length > 0 && (
            <div className="bg-white rounded-2xl p-3 shadow-xs border border-purple-100 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-1.5">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Train className="w-3.5 h-3.5 text-purple-700" />
                  <span>
                    Travel Class:{' '}
                    <strong className="text-purple-900 font-mono">
                      {classBreakdown ? `${classBreakdown}` : `${selectedClass.classCode} (${selectedClass.className})`}
                    </strong>
                  </span>
                </span>
                <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                  {train.classes.length} Classes Available
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {train.classes.map((c) => {
                  const isSelected = (selectedClassCode || train.classes[0]?.classCode) === c.classCode;
                  return (
                    <button
                      key={c.classCode}
                      type="button"
                      onClick={() => {
                        setSelectedClassCode(c.classCode);
                        setPassengers(passengers.map((p) => ({ ...p, assignedClassCode: c.classCode })));
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-purple-900 text-white border-purple-900 shadow-md ring-2 ring-purple-300'
                          : 'bg-purple-50/50 hover:bg-purple-100/70 border-purple-100 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <strong className="font-mono text-sm font-black">{c.classCode}</strong>
                        <span className={`font-mono text-xs font-bold ${isSelected ? 'text-emerald-300' : 'text-emerald-700'}`}>
                          ₹{c.fare}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] mt-0.5">
                        <span className={isSelected ? 'text-purple-200' : 'text-slate-500'}>
                          {c.className}
                        </span>
                        <span className={`font-semibold ${isSelected ? 'text-emerald-200' : 'text-emerald-600'}`}>
                          {c.status}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* PASSENGERS CARD LIST */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-purple-700" />
                <span>Passenger Details ({passengers.length})</span>
              </h3>
              <button
                type="button"
                onClick={handleAddPassenger}
                className="text-xs font-bold text-[#7C3AED] hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Passenger</span>
              </button>
            </div>

            {passengers.map((passenger, index) => (
              <div
                key={passenger.id}
                className="bg-white rounded-2xl p-3 shadow-sm border border-purple-100 space-y-2 relative"
              >
                <div className="flex items-center justify-between border-b border-purple-50 pb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900">
                      Passenger #{index + 1}
                    </span>
                    {passenger.assignedClassCode && (
                      <span className="text-[10px] font-mono font-black bg-purple-100 text-purple-900 px-2 py-0.2 rounded-full border border-purple-200">
                        Class {passenger.assignedClassCode}
                      </span>
                    )}
                    {isAiAutofilled && (
                      <span className="text-[10px] font-bold bg-purple-50 text-purple-700 px-1.5 py-0.2 rounded border border-purple-200">
                        Prepared by Nira
                      </span>
                    )}
                  </div>

                  {passengers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePassenger(passenger.id)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-0.5"
                      title="Remove passenger"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Form Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  {/* Name */}
                  <div className="sm:col-span-2 space-y-0.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Full Name (as per Govt ID)
                    </label>
                    <input
                      type="text"
                      value={passenger.name}
                      onChange={(e) => handleUpdatePassenger(passenger.id, 'name', e.target.value)}
                      placeholder="e.g. Pratay Karali"
                      className="w-full bg-purple-50/30 border border-purple-100 rounded-xl px-2.5 py-1 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white transition-all"
                      required
                    />
                  </div>

                  {/* Age */}
                  <div className="space-y-0.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Age
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={passenger.age}
                      onChange={(e) => handleUpdatePassenger(passenger.id, 'age', parseInt(e.target.value, 10) || 18)}
                      className="w-full bg-purple-50/30 border border-purple-100 rounded-xl px-2.5 py-1 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white transition-all"
                      required
                    />
                  </div>

                  {/* Gender */}
                  <div className="space-y-0.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Gender
                    </label>
                    <select
                      value={passenger.gender}
                      onChange={(e) => handleUpdatePassenger(passenger.id, 'gender', e.target.value as any)}
                      className="w-full bg-purple-50/30 border border-purple-100 rounded-xl px-2 py-1 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white transition-all cursor-pointer"
                    >
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                      <option value="O">Other</option>
                    </select>
                  </div>
                </div>

                {/* Berth Preference & Coach/Class Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-0.5">
                  <div className="space-y-0.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Berth / Seat Preference
                    </label>
                    <select
                      value={passenger.berthPreference}
                      onChange={(e) => handleUpdatePassenger(passenger.id, 'berthPreference', e.target.value as any)}
                      className="w-full bg-purple-50/30 border border-purple-100 rounded-xl px-2 py-1 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white transition-all cursor-pointer"
                    >
                      <option value="NO_PREFERENCE">No Preference</option>
                      <option value="LOWER">Lower Berth</option>
                      <option value="MIDDLE">Middle Berth</option>
                      <option value="UPPER">Upper Berth</option>
                      <option value="SIDE_LOWER">Side Lower</option>
                      <option value="SIDE_UPPER">Side Upper</option>
                    </select>
                  </div>

                  {train.classes && train.classes.length > 0 && (
                    <div className="space-y-0.5">
                      <label className="block text-xs font-bold text-slate-700">
                        Assigned Coach / Class
                      </label>
                      <select
                        value={passenger.assignedClassCode || selectedClassCode || train.classes[0]?.classCode || '3A'}
                        onChange={(e) => handleUpdatePassenger(passenger.id, 'assignedClassCode', e.target.value)}
                        className="w-full bg-purple-50/30 border border-purple-100 rounded-xl px-2 py-1 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white transition-all cursor-pointer font-mono font-bold"
                      >
                        {train.classes.map((cls) => (
                          <option key={cls.classCode} value={cls.classCode}>
                            {cls.classCode} ({cls.className}) — ₹{cls.fare}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 pt-3.5">
                    <input
                      type="checkbox"
                      id={`concession_${passenger.id}`}
                      checked={passenger.seniorCitizenConcession || false}
                      onChange={(e) => handleUpdatePassenger(passenger.id, 'seniorCitizenConcession', e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-purple-500 border-purple-300 cursor-pointer"
                    />
                    <label htmlFor={`concession_${passenger.id}`} className="text-xs font-semibold text-slate-700 cursor-pointer">
                      Senior citizen concession
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* PRIVACY & SECURITY BOUNDARY NOTICE */}
          <div className="bg-gradient-to-r from-emerald-50/90 to-teal-50/70 rounded-xl p-2 px-3 border border-emerald-200 flex items-center gap-2.5 text-xs">
            <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <div className="space-y-0.2">
              <span className="font-bold text-emerald-950 block text-xs">
                SafeAssist Zero-PII Privacy Protection Active
              </span>
              <p className="text-[10px] text-emerald-800 font-medium leading-tight">
                Nirantar isolates AI logic from banking credentials. Passwords, OTPs, UPI PINs, and CVVs are strictly blocked and never stored.
              </p>
            </div>
          </div>
        </div>

        {/* ──────────────── RIGHT COLUMN: FARE SUMMARY & BIGGER ANANYA GIRL MASCOT (1 Col) ──────────────── */}
        <div className="space-y-2">
          {/* FARE BREAKDOWN CARD */}
          <div className="bg-white rounded-2xl p-3.5 border border-purple-100 shadow-sm space-y-2">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 border-b border-purple-50 pb-1.5">
              Fare Summary
            </h4>

            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span className="text-xs font-medium">Base Fare ({passengers.length} × ₹{selectedClass.fare})</span>
                <span className="font-bold text-slate-900 text-xs">₹{selectedClass.fare * passengers.length}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="text-xs font-medium">Convenience Fee (IRCTC)</span>
                <span className="font-bold text-emerald-700 text-xs">₹0 (Free)</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="text-xs font-medium">Safe Travel Insurance</span>
                <span className="font-bold text-emerald-700 text-xs">Included ✓</span>
              </div>
              <div className="border-t border-purple-100 pt-1 flex items-center justify-between text-xs font-bold text-purple-950">
                <span className="text-xs">Total Amount</span>
                <span className="text-base font-bold text-[#7C3AED]">₹{totalFare.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="pt-1">
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#6D28D9] hover:to-[#581C87] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/25 active:scale-95 transition-all cursor-pointer"
              >
                <span>Review & Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* MASCOT SAFE BOOKING CARD WITH PROMINENT BIGGER GIRL (ANANYA) */}
          <div className="bg-gradient-to-b from-[#F3EDFD] via-[#EFE7FD] to-[#EBE2FC] rounded-2xl p-3 border border-purple-100 relative overflow-visible shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
                <Sparkles className="w-3 h-3 text-purple-700" />
                <span>Nira Safe Verification</span>
              </div>
            </div>

            {/* Prominent BIGGER Girl Cutout */}
            <div className="absolute right-0.5 -top-12 w-32 h-36 pointer-events-none z-10 flex items-end justify-end">
              <img
                src="/assets/images/characters/citizen_thumbsup.png"
                alt="Ananya Thumbs Up"
                className="w-full h-full object-contain drop-shadow-lg"
              />
            </div>

            {/* Speech info */}
            <div className="bg-white/95 rounded-xl p-2 shadow-sm border border-purple-100/80 mt-16 mb-2 relative z-20">
              <p className="text-[11px] text-purple-950 font-semibold leading-relaxed">
                Details verified against IRCTC booking rules. Lower berth priority assigned!
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-purple-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>DigiLocker Verified Citizen</span>
            </div>
          </div>
        </div>
      </form>

      {/* PASSENGER DETAILS VERIFICATION & CONFIRMATION MODAL */}
      {showPassengerConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-purple-200 space-y-3.5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    Confirm Passenger Details
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Please verify details match Government photo ID
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPassengerConfirmModal(false)}
                className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Journey Summary */}
            <div className="bg-purple-50/80 p-2.5 rounded-xl border border-purple-100 space-y-1 text-xs">
              <div className="flex items-center justify-between font-bold text-purple-950">
                <span>#{train.trainNumber} • {train.trainName}</span>
                <span className="bg-purple-200/80 text-purple-900 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                  {selectedClass.classCode} (₹{totalFare.toLocaleString('en-IN')})
                </span>
              </div>
              <p className="text-slate-600 font-medium text-[11px]">
                {train.fromStationName} ({train.fromStationCode}) → {train.toStationName} ({train.toStationCode}) • {searchParams.travelDate}
              </p>
            </div>

            {/* Passengers List */}
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              <span className="text-[11px] font-bold text-slate-700 block">
                Passengers ({passengers.length}):
              </span>
              {passengers.map((p, idx) => (
                <div
                  key={p.id}
                  className="bg-slate-50 p-2 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 block text-xs">
                      {idx + 1}. {p.name || 'Passenger'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Age: {p.age} • Gender: {p.gender === 'M' ? 'Male' : p.gender === 'F' ? 'Female' : 'Transgender'} • Preference: {p.berthPreference || 'No Preference'}
                    </span>
                  </div>
                  {p.seniorCitizenConcession && (
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                      Senior
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowPassengerConfirmModal(false)}
                className="py-2 px-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all cursor-pointer text-center"
              >
                ✏️ Edit Details
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPassengerConfirmModal(false);
                  navigateTo('payment');
                }}
                className="py-2 px-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#6D28D9] hover:to-[#581C87] text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md shadow-purple-600/25 transition-all cursor-pointer text-center"
              >
                <span>✅ Confirm & Pay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingPage;
