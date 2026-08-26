import React, { useState, useEffect, useRef } from 'react';
import {
  Train,
  MapPin,
  Clock,
  Navigation,
  Compass,
  CheckCircle2,
  AlertCircle,
  Search,
  Share2,
  Bell,
  Utensils,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info,
  Volume2,
  Sparkles,
  Trophy,
  Award,
} from 'lucide-react';
import { useJourney } from '../context/JourneyContext';
import { speakNiraResponse } from '../services/voiceService';
import { MOCK_TRAINS_DATABASE } from '../data/mockTrains';
import { getTrainStoppages, StationStop } from '../data/trainStoppages';
import { liveSeatInventory, stationLoadProjection } from '../utils/seatInventory';

type TravelPhase = 'DEPARTING' | 'TRAVELING' | 'APPROACHING' | 'HALTED' | 'DESTINATION_ARRIVED';
type DelayStatus = 'ON_TIME' | 'BEFORE_TIME' | 'DELAY_8M' | 'DELAY_25M';

export const JourneyTrackerPage: React.FC = () => {
  const { searchParams, selectedTrain, issuedTicket, trackQuery, setTrackQuery, navigateTo, addNotification } = useJourney();
  const [searchInput, setSearchInput] = useState(trackQuery || selectedTrain?.trainNumber || '12302');

  useEffect(() => {
    if (trackQuery && trackQuery.trim()) {
      setSearchInput(trackQuery.trim());
    }
  }, [trackQuery]);
  
  // Dynamic matched train from database or stoppages
  const trainNumber = (searchInput || '12302').trim();
  const foundTrain = MOCK_TRAINS_DATABASE.find((t) => t.trainNumber === trainNumber);
  const routeStations: StationStop[] = getTrainStoppages(trainNumber, foundTrain);
  const firstStop = routeStations[0];
  const lastStop = routeStations[routeStations.length - 1];

  const trainName =
    foundTrain?.trainName ||
    (trainNumber === '12302'
      ? 'Howrah Rajdhani Express'
      : trainNumber === '12951'
      ? 'Mumbai Rajdhani Express'
      : trainNumber === '22436'
      ? 'Varanasi Vande Bharat Express'
      : trainNumber === '12002'
      ? 'Bhopal Shatabdi Express'
      : trainNumber === '12004'
      ? 'Lucknow Shatabdi Express'
      : trainNumber === '22692'
      ? 'Bengaluru Rajdhani Express'
      : trainNumber === '20835'
      ? 'Puri Vande Bharat Express'
      : `Superfast Express #${trainNumber}`);

  const fromCode = foundTrain?.fromStationCode || firstStop?.code || 'NDLS';
  const fromCity = foundTrain?.fromCity || firstStop?.name || 'New Delhi';
  const toCode = foundTrain?.toStationCode || lastStop?.code || 'HWH';
  const toCity = foundTrain?.toCity || lastStop?.name || 'Howrah';

  // Active station tracker state machine
  const [activeStationIndex, setActiveStationIndex] = useState(1);
  const [countdownSeconds, setCountdownSeconds] = useState(180);
  const [haltSeconds, setHaltSeconds] = useState(20);
  const [phase, setPhase] = useState<TravelPhase>('TRAVELING');
  const [delayStatus, setDelayStatus] = useState<DelayStatus>('ON_TIME');
  const [isPlayingAnnouncement, setIsPlayingAnnouncement] = useState(false);
  const [speedJitter, setSpeedJitter] = useState(0);
  const [inventoryClock, setInventoryClock] = useState(Date.now());
  const lastNotifKey = useRef('');

  // Reset tracker cycle whenever train number changes
  useEffect(() => {
    setActiveStationIndex(1);
    setCountdownSeconds(180);
    setHaltSeconds(20);
    setPhase('TRAVELING');
    lastNotifKey.current = '';
  }, [trainNumber]);

  useEffect(() => {
    const timer = window.setInterval(() => setInventoryClock(Date.now()), 6_000);
    return () => window.clearInterval(timer);
  }, []);

  const isFinalDestination = activeStationIndex >= routeStations.length - 1;
  const currentTargetStation = routeStations[activeStationIndex] || routeStations[routeStations.length - 1] || firstStop;

  // Synthesize realistic 4-tone Indian Railway chime
  const playRailwayChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const notes = [523.25, 392.00, 329.63, 261.63]; // C5, G4, E4, C4
      let time = audioCtx.currentTime + 0.05;

      notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time + i * 0.22);
        gain.gain.setValueAtTime(0.3, time + i * 0.22);
        gain.gain.exponentialRampToValueAtTime(0.001, time + i * 0.22 + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(time + i * 0.22);
        osc.stop(time + i * 0.22 + 0.38);
      });
    } catch (e) {
      console.log('Chime playback error:', e);
    }
  };

  // Full Station Announcement (Chime + Voice TTS)
  const announceArrival = (station = currentTargetStation, remainingSecs = countdownSeconds) => {
    setIsPlayingAnnouncement(true);
    playRailwayChime();

    setTimeout(() => {
      let speechText = '';
      if (phase === 'DESTINATION_ARRIVED' || (isFinalDestination && countdownSeconds === 0)) {
        speechText = `Attention please! Train number ${trainNumber}, ${trainName}, has reached its final destination ${station.name} on ${station.platform}. All passengers are requested to deboard from the ${station.doorSide.toLowerCase()}. Thank you for choosing Indian Railways and Nirantar.`;
      } else {
        const minsText = remainingSecs <= 30 ? 'shortly' : `in ${Math.ceil(remainingSecs / 60)} minutes`;
        const delayNotice =
          delayStatus === 'BEFORE_TIME'
            ? 'running 5 minutes before time'
            : delayStatus === 'DELAY_8M'
            ? 'delayed by approximately 8 minutes due to signal clearance'
            : delayStatus === 'DELAY_25M'
            ? 'delayed by 25 minutes'
            : 'running right on time';

        speechText = `May I have your attention please! Train number ${trainNumber}, ${trainName}, ${delayNotice}, is arriving ${minsText} on ${station.platform}. Doors will open on the ${station.doorSide.toLowerCase()}. Coach B4 aligns near ${station.pillarInfo}. Please stay behind the yellow safety line.`;
      }
      speakNiraResponse(speechText);
      setTimeout(() => setIsPlayingAnnouncement(false), 9000);
    }, 1100);
  };

  // Live Timer & Lifecycle State Machine
  useEffect(() => {
    const timer = setInterval(() => {
      // Speed slight natural jitter
      setSpeedJitter(Math.floor(Math.random() * 5) - 2);

      if (phase === 'TRAVELING' || phase === 'APPROACHING') {
        setCountdownSeconds((prev) => {
          if (prev <= 1) {
            // Train arrives at platform
            if (activeStationIndex >= routeStations.length - 1) {
              setPhase('DESTINATION_ARRIVED');
              return 0;
            }
            setPhase('HALTED');
            setHaltSeconds(20);
            return 0;
          }
          const next = prev - 1;
          if (next <= 120 && phase !== 'APPROACHING') {
            setPhase('APPROACHING');
          }
          return next;
        });
      } else if (phase === 'HALTED') {
        setHaltSeconds((prev) => {
          if (prev <= 1) {
            // Halt finished -> Depart to NEXT station!
            if (activeStationIndex < routeStations.length - 1) {
              const nextIdx = activeStationIndex + 1;
              setActiveStationIndex(nextIdx);
              const randomDurations = [240, 300, 360, 420]; // 4m, 5m, 6m, 7m
              const nextLegSecs = randomDurations[Math.floor(Math.random() * randomDurations.length)];
              setCountdownSeconds(nextLegSecs);
              setPhase('TRAVELING');
            } else {
              setPhase('DESTINATION_ARRIVED');
            }
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, activeStationIndex, routeStations.length]);

  // Format timer MM:SS
  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Dynamic speed based on phase, arrival proximity and delay condition
  const baseSpeed =
    phase === 'HALTED' || phase === 'DESTINATION_ARRIVED'
      ? 0
      : countdownSeconds <= 30
      ? 18
      : countdownSeconds <= 60
      ? 44
      : countdownSeconds <= 120
      ? 78
      : delayStatus === 'BEFORE_TIME'
      ? 126
      : delayStatus === 'DELAY_8M'
      ? 94
      : delayStatus === 'DELAY_25M'
      ? 62
      : 116;

  const currentSpeed = Math.max(0, baseSpeed === 0 ? 0 : baseSpeed + speedJitter);

  useEffect(() => {
    const stops = getTrainStoppages(trainNumber, foundTrain);
    const mid = Math.max(1, Math.min(stops.length - 2, Math.floor(stops.length / 3)));
    setActiveStationIndex(mid);
    setPhase('TRAVELING');
    const seed = Number.parseInt(trainNumber, 10) || trainNumber.length;
    setCountdownSeconds(150 + (seed % 120));
    const delayPick: DelayStatus[] = ['ON_TIME', 'BEFORE_TIME', 'ON_TIME', 'DELAY_8M'];
    setDelayStatus(delayPick[seed % delayPick.length]);
    lastNotifKey.current = '';
  }, [trainNumber]);

  useEffect(() => {
    const key = `${phase}-${activeStationIndex}`;
    if (lastNotifKey.current === key) return;
    const station = routeStations[activeStationIndex];
    if (!station) return;
    if (phase === 'APPROACHING') {
      lastNotifKey.current = key;
      addNotification({
        type: 'track',
        title: `Approaching ${station.name}`,
        body: `${trainName} (#${trainNumber}) arrives on ${station.platform}. Doors open on the ${station.doorSide.toLowerCase()}.`,
      });
    } else if (phase === 'HALTED') {
      lastNotifKey.current = key;
      addNotification({
        type: 'track',
        title: `Halted at ${station.name}`,
        body: `Scheduled departure ${station.scheduledDep}. ${station.platform}.`,
      });
    } else if (phase === 'DESTINATION_ARRIVED') {
      lastNotifKey.current = key;
      addNotification({
        type: 'track',
        title: `Arrived at ${station.name}`,
        body: `${trainName} has reached its destination on ${station.platform}.`,
      });
    }
  }, [phase, activeStationIndex, routeStations, trainName, trainNumber, addNotification]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setTrackQuery(searchInput.trim());
  };

  return (
    <div className="max-w-7xl mx-auto space-y-3 pb-8 select-none font-sans text-slate-800 animate-in fade-in duration-200">
      {/* ═══════════════════════════════════════════════════════════════════
          1. TOP GPS SEARCH & RUNNING CONDITION CONTROLS
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight flex items-center gap-2">
            <span>Live Train Radar</span>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time GPS satellite running status, delays, before-time estimator & platform indicators
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
              delayStatus === 'ON_TIME'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : delayStatus === 'BEFORE_TIME'
                ? 'bg-purple-50 text-purple-800 border-purple-200'
                : delayStatus === 'DELAY_8M'
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {delayStatus === 'ON_TIME'
              ? 'On time'
              : delayStatus === 'BEFORE_TIME'
              ? 'Running early'
              : delayStatus === 'DELAY_8M'
              ? 'About 8 min late'
              : 'About 25 min late'}
          </span>

          <form onSubmit={handleSearch} className="flex items-center gap-1.5">
            <div className="relative">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Train # (12302)"
                className="w-28 sm:w-36 bg-white border border-purple-100 rounded-full px-3 py-1 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-600 shadow-xs"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
            >
              Track
            </button>
          </form>
        </div>
      </div>

      {/* Active Express Trains Radar Switcher */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] font-bold text-slate-400 shrink-0">Live Radar Trains:</span>
        <button
          type="button"
          onClick={() => setSearchInput('12302')}
          className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
            trainNumber === '12302'
              ? 'bg-[#7C3AED] text-white shadow-sm'
              : 'bg-white text-slate-700 border border-purple-100 hover:bg-purple-50'
          }`}
        >
          <Train className="w-3.5 h-3.5" />
          <span>#12302 Howrah Rajdhani</span>
        </button>

        <button
          type="button"
          onClick={() => setSearchInput('12951')}
          className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
            trainNumber === '12951'
              ? 'bg-[#7C3AED] text-white shadow-sm'
              : 'bg-white text-slate-700 border border-purple-100 hover:bg-purple-50'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>#12951 Mumbai Rajdhani</span>
        </button>

        <button
          type="button"
          onClick={() => setSearchInput('22436')}
          className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
            trainNumber === '22436'
              ? 'bg-[#7C3AED] text-white shadow-sm'
              : 'bg-white text-slate-700 border border-purple-100 hover:bg-purple-50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-300" />
          <span>#22436 Varanasi Vande Bharat</span>
        </button>

        <button
          type="button"
          onClick={() => setSearchInput('12002')}
          className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
            trainNumber === '12002'
              ? 'bg-[#7C3AED] text-white shadow-sm'
              : 'bg-white text-slate-700 border border-purple-100 hover:bg-purple-50'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-emerald-500" />
          <span>#12002 Bhopal Shatabdi</span>
        </button>

        <button
          type="button"
          onClick={() => setSearchInput('20835')}
          className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
            trainNumber === '20835'
              ? 'bg-[#7C3AED] text-white shadow-sm'
              : 'bg-white text-slate-700 border border-purple-100 hover:bg-purple-50'
          }`}
        >
          <Navigation className="w-3.5 h-3.5 text-blue-500" />
          <span>#20835 Puri Vande Bharat</span>
        </button>

        <button
          type="button"
          onClick={() => setSearchInput('22692')}
          className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
            trainNumber === '22692'
              ? 'bg-[#7C3AED] text-white shadow-sm'
              : 'bg-white text-slate-700 border border-purple-100 hover:bg-purple-50'
          }`}
        >
          <Train className="w-3.5 h-3.5 text-purple-500" />
          <span>#22692 Bengaluru Rajdhani</span>
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          2. LIVE SPEED & RUNNING STATUS HERO CARD
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 rounded-3xl p-4 sm:p-5 text-white shadow-md relative overflow-hidden border border-purple-800">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-purple-500/10 to-transparent pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          {/* Train Identity */}
          <div className="space-y-1 sm:col-span-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-800/80 border border-purple-600/50 text-[10px] font-mono font-bold text-purple-200">
              <span>#{trainNumber}</span>
              <span>•</span>
              <span>GPS SATELLITE RADAR</span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight truncate">
              {trainName}
            </h2>
            <p className="text-xs text-purple-200 font-medium flex items-center gap-1">
              <span>{fromCity} ({fromCode})</span>
              <span className="text-purple-400">→</span>
              <span>{toCity} ({toCode})</span>
            </p>
          </div>

          {/* Real-Time Speedometer */}
          <div className="flex items-center justify-center gap-3 sm:border-x border-purple-800/80 py-1">
            <div className="w-10 h-10 rounded-2xl bg-purple-800/60 border border-purple-700/60 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 block">
                Current Speed
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-mono font-black text-emerald-400 leading-none">
                  {currentSpeed}
                </span>
                <span className="text-xs font-bold text-purple-300 font-mono">km/h</span>
              </div>
            </div>
          </div>

          {/* Running Status & Delay State */}
          <div className="flex items-center sm:justify-end gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm ${
                phase === 'DESTINATION_ARRIVED'
                  ? 'bg-emerald-500 animate-pulse'
                  : delayStatus === 'BEFORE_TIME'
                  ? 'bg-purple-600'
                  : delayStatus === 'DELAY_8M'
                  ? 'bg-amber-500 animate-bounce'
                  : delayStatus === 'DELAY_25M'
                  ? 'bg-red-600 animate-pulse'
                  : 'bg-emerald-600'
              }`}
            >
              {phase === 'DESTINATION_ARRIVED' ? (
                <Trophy className="w-5 h-5" />
              ) : (
                <Navigation className="w-5 h-5" />
              )}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 block">
                Running Status
              </span>
              <span
                className={`text-sm font-black block leading-tight ${
                  phase === 'DESTINATION_ARRIVED'
                    ? 'text-emerald-300'
                    : delayStatus === 'BEFORE_TIME'
                    ? 'text-purple-300'
                    : delayStatus === 'DELAY_8M'
                    ? 'text-amber-300'
                    : delayStatus === 'DELAY_25M'
                    ? 'text-red-300'
                    : 'text-emerald-300'
                }`}
              >
                {phase === 'DESTINATION_ARRIVED'
                  ? 'Journey Completed 🎉'
                  : delayStatus === 'BEFORE_TIME'
                  ? '5m Before Time (Early)'
                  : delayStatus === 'DELAY_8M'
                  ? 'Minor Delay (+8 mins)'
                  : delayStatus === 'DELAY_25M'
                  ? 'Delayed (+25 mins)'
                  : 'Right on Time (En-Route)'}
              </span>
              <span className="text-[10px] text-purple-300 font-mono font-medium">
                {phase === 'DESTINATION_ARRIVED'
                  ? `Arrived at ${toCity} (${toCode})`
                  : phase === 'HALTED'
                  ? `Departing in ${haltSeconds}s`
                  : `Next: ${currentTargetStation.name} in ${formatTimer(countdownSeconds)}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          3. REAL-TIME ARRIVAL / CELEBRATION / HALT BANNER WITH CHIME & TTS
          ═══════════════════════════════════════════════════════════════════ */}
      {phase === 'DESTINATION_ARRIVED' ? (
        /* DESTINATION ARRIVED CELEBRATION BANNER */
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 rounded-2xl p-4 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in zoom-in-95 border border-emerald-300">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center text-white shrink-0 text-2xl font-bold">
              🏆
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-white text-emerald-950 text-[10px] font-mono font-black shadow-xs">
                  JOURNEY COMPLETED
                </span>
                <span className="text-xs font-bold text-emerald-100">
                  Arrived at Final Stoppage {toCity} ({toCode}) on {currentTargetStation.platform}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-black text-white mt-0.5">
                Welcome to {toCity}! {routeStations[routeStations.length - 1]?.distanceKm || foundTrain?.distanceKm || 0} km traveled safely
              </h3>
              <p className="text-[11px] text-emerald-100 font-medium">
                Deboarding on <strong>{currentTargetStation.doorSide}</strong>. Exit towards <strong>{currentTargetStation.pillarInfo}</strong>.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => announceArrival()}
            disabled={isPlayingAnnouncement}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-emerald-950 text-xs font-black hover:bg-emerald-50 shadow-sm transition-all cursor-pointer shrink-0"
          >
            <Volume2 className="w-4 h-4 text-emerald-800" />
            <span>{isPlayingAnnouncement ? 'Announcing...' : 'Play arrival announcement'}</span>
          </button>
        </div>
      ) : phase === 'HALTED' ? (
        /* GREEN STATION HALT BANNER */
        <div className="bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 rounded-2xl p-3.5 sm:p-4 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in border border-emerald-400">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white shrink-0 text-xl font-bold">
              🚉
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-white text-emerald-900 text-[10px] font-mono font-black shadow-xs">
                  HALTED AT {currentTargetStation.platform.toUpperCase()}
                </span>
                <span className="text-xs font-bold text-emerald-100">
                  Scheduled 2-Min Passenger Halt • Departing in {haltSeconds}s
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-black text-white mt-0.5">
                Train Halted at {currentTargetStation.name} ({currentTargetStation.code})
              </h3>
              <p className="text-[11px] text-emerald-100 font-medium mt-0.2">
                Exit doors opened on <strong>{currentTargetStation.doorSide}</strong>. Coach B4 is aligned near <strong>{currentTargetStation.pillarInfo}</strong>.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => announceArrival()}
            disabled={isPlayingAnnouncement}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white text-emerald-950 text-xs font-black hover:bg-emerald-50 shadow-sm transition-all cursor-pointer shrink-0 active:scale-95"
          >
            <Volume2 className="w-4 h-4 text-emerald-800" />
            <span>{isPlayingAnnouncement ? 'Announcing...' : 'Play Station Chime & TTS'}</span>
          </button>
        </div>
      ) : countdownSeconds <= 120 ? (
        /* AMBER 2-MINUTE ARRIVAL ALERT BANNER */
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-2xl p-3.5 sm:p-4 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in border border-amber-400">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white shrink-0 animate-bounce">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-white text-amber-900 text-[10px] font-mono font-black shadow-xs">
                  ARRIVING IN {formatTimer(countdownSeconds)}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-900/40 text-amber-100 text-[10px] font-bold border border-amber-300/40">
                  {currentTargetStation.platform} Confirmed
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-black text-white mt-0.5">
                Approaching {currentTargetStation.name} ({currentTargetStation.code}) — Doors Opening on {currentTargetStation.doorSide}
              </h3>
              <p className="text-[11px] text-amber-100 font-medium mt-0.2">
                Coach B4 aligns near <strong>{currentTargetStation.pillarInfo}</strong>. Please keep luggage and verified PNR ready.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => announceArrival()}
            disabled={isPlayingAnnouncement}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white text-amber-950 text-xs font-black hover:bg-amber-50 shadow-sm transition-all cursor-pointer shrink-0 active:scale-95"
          >
            <Volume2 className="w-4 h-4 text-amber-800" />
            <span>{isPlayingAnnouncement ? 'Announcing...' : 'Play Platform Announcement'}</span>
          </button>
        </div>
      ) : (
        /* STANDARD EN-ROUTE TRAVELING BANNER */
        <div className="bg-white rounded-2xl p-3 px-4 border border-purple-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
              <Navigation className="w-4 h-4 text-purple-700" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">
                Cruising at {currentSpeed} km/h • High-Speed Electric Corridor
              </span>
              <p className="text-xs font-bold text-slate-900">
                Approaching {currentTargetStation.name} ({currentTargetStation.code}) • Expected in {formatTimer(countdownSeconds)} mins
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => announceArrival()}
            disabled={isPlayingAnnouncement}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-bold transition-all cursor-pointer self-start sm:self-center shrink-0"
          >
            <Volume2 className="w-3.5 h-3.5 text-purple-700" />
            <span>Play announcement</span>
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          4. MAIN TWO-COLUMN LAYOUT: TIMELINE & ON-BOARD TOOLS
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 items-start">
        {/* ──────────────── LEFT COLUMN: STATION TIMELINE & SHIFT ENGINE (2 Cols) ──────────────── */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-purple-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-50 pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-purple-700" />
              <h3 className="font-bold text-sm sm:text-base text-slate-900">
                Station Timeline & Live Platform Alignment
              </h3>
            </div>

            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Live timetable • {routeStations.length} stoppages
            </span>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
            {(() => {
              const cls = foundTrain?.classes?.[0];
              const inventory = liveSeatInventory(trainNumber, cls?.classCode || '3A', cls?.availableSeats || 42, inventoryClock);
              return <><span className="font-bold text-emerald-900">Destination availability ({cls?.classCode || '3A'}): {inventory.status === 'AVAILABLE' ? `${inventory.seats} vacant seats` : `${inventory.status} ${inventory.waitlist}/100`}</span><span className="text-emerald-800">Station rows show passengers boarding, leaving, and projected vacancies.</span></>;
            })()}
          </div>

          {/* Interactive Route Timeline */}
          <div className="space-y-4 relative pl-3 before:absolute before:left-[21px] before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {routeStations.map((st, idx) => {
              const isPassed = idx < activeStationIndex;
              const isCurrent = idx === activeStationIndex;
              const isUpcoming = idx > activeStationIndex;
              const load = stationLoadProjection(trainNumber, routeStations, idx);

              return (
                <div
                  key={st.code}
                  className={`flex items-start justify-between gap-3 relative transition-all ${
                    isCurrent
                      ? 'p-3 rounded-2xl bg-purple-50/70 border border-purple-200 shadow-xs'
                      : isPassed
                      ? 'opacity-85'
                      : 'opacity-70'
                  }`}
                >
                  {/* Timeline Indicator Dot */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 border-2 font-bold text-xs ${
                        isPassed
                          ? 'bg-emerald-500 border-white text-white shadow-xs'
                          : isCurrent
                          ? 'bg-[#7C3AED] border-white text-white shadow-md animate-pulse'
                          : 'bg-white border-slate-300 text-slate-400'
                      }`}
                    >
                      {isPassed ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <span className="text-[10px]">{idx + 1}</span>
                      )}
                    </div>

                    {/* Station Name & Meta */}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-slate-900">
                          {st.name}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-900 font-mono text-[9px] font-bold">
                          {st.code}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.2 rounded-full border ${
                            isCurrent
                              ? 'bg-amber-100 border-amber-300 text-amber-900'
                              : 'bg-slate-100 border-slate-200 text-slate-600'
                          }`}
                        >
                          {st.platform}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium block mt-0.2">
                        {st.distanceKm} km • Arr {st.scheduledArr} • Dep {st.scheduledDep}
                        {st.haltMins > 0 ? ` • Halt ${st.haltMins} min` : ''}
                      </span>
                      <div className="mt-1 flex flex-wrap gap-1.5 text-[9px] font-bold">
                        <span className="rounded-full bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 text-indigo-800">↑ {load.boarding} board</span>
                        <span className="rounded-full bg-orange-50 border border-orange-100 px-1.5 py-0.5 text-orange-800">↓ {load.alighting} leave</span>
                        <span className="rounded-full bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 text-emerald-800">{load.vacantSeats} vacant after departure</span>
                      </div>
                      {isCurrent && (
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 px-2.5 py-0.8 rounded-lg bg-[#7C3AED] text-white text-[10px] font-bold shadow-xs animate-pulse">
                            <Train className="w-3.5 h-3.5" />
                            <span>
                              {phase === 'HALTED'
                                ? `Halted on Platform • Departs in ${haltSeconds}s`
                                : phase === 'DESTINATION_ARRIVED'
                                ? 'Final Destination Reached 🏁'
                                : `Train Moving (${currentSpeed} km/h) • Arriving in ${formatTimer(countdownSeconds)}`}
                            </span>
                          </div>
                          <div className="h-1.5 w-24 bg-purple-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                              style={{
                                width: `${Math.min(100, Math.max(5, (1 - countdownSeconds / 240) * 100))}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timing & Status State */}
                  <div className="text-right shrink-0">
                    <span
                      className={`font-mono text-xs sm:text-sm font-bold block ${
                        isPassed
                          ? 'text-emerald-700'
                          : isCurrent
                          ? phase === 'DESTINATION_ARRIVED'
                            ? 'text-emerald-700 font-black'
                            : 'text-purple-900 font-black'
                          : 'text-slate-600'
                      }`}
                    >
                      {isPassed
                        ? st.scheduledDep
                        : isCurrent
                        ? phase === 'DESTINATION_ARRIVED'
                          ? 'Arrived 09:55'
                          : phase === 'HALTED'
                          ? 'Halted at Platform'
                          : `Arriving in ${formatTimer(countdownSeconds)}`
                        : `Expected ${st.scheduledArr}`}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                        isPassed
                          ? 'bg-emerald-50 text-emerald-700'
                          : isCurrent
                          ? phase === 'DESTINATION_ARRIVED'
                            ? 'bg-emerald-100 text-emerald-950 font-black'
                            : phase === 'HALTED'
                            ? 'bg-emerald-100 text-emerald-900 font-black animate-pulse'
                            : 'bg-amber-100 text-amber-900 font-bold'
                          : 'bg-slate-50 text-slate-500'
                      }`}
                    >
                      {isPassed
                        ? 'Departed'
                        : isCurrent
                        ? phase === 'DESTINATION_ARRIVED'
                          ? 'Destination Arrived'
                          : phase === 'HALTED'
                          ? 'At Platform 4'
                          : 'Approaching'
                        : 'Upcoming'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ──────────────── RIGHT COLUMN: NIRA TRACK COPILOT & TOOLS (1 Col) ──────────────── */}
        <div className="space-y-3">
          {/* Nira Track Copilot Card */}
          <div className="bg-gradient-to-b from-[#F3EDFD] via-[#EFE7FD] to-[#EBE2FC] rounded-3xl p-4 border border-purple-100/90 shadow-sm relative overflow-visible">
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-700" />
              <span>Nira Track Copilot</span>
            </div>

            {/* Character Mascot */}
            <div className="absolute right-2 -top-6 w-24 h-28 pointer-events-none z-10 flex items-end justify-end">
              <img
                src="/assets/images/characters/citizen_thinking.png"
                alt="Nira Radar Copilot"
                className="w-full h-full object-contain drop-shadow-sm"
              />
            </div>

            {/* Speech Bubble */}
            <div className="bg-white rounded-xl p-3 shadow-xs border border-purple-100 mt-10 mb-2 relative z-20">
              <p className="text-xs font-semibold text-purple-950 leading-relaxed">
                {phase === 'DESTINATION_ARRIVED' ? (
                  <>
                    🎉 You have safely reached your final destination <span className="font-bold text-[#7C3AED]">{toCity}</span> on {currentTargetStation.platform}!
                  </>
                ) : phase === 'HALTED' ? (
                  <>
                    Train is halted at <span className="font-bold text-[#7C3AED]">{currentTargetStation.name}</span> on {currentTargetStation.platform}. Exit doors opened on right side!
                  </>
                ) : countdownSeconds <= 120 ? (
                  <>
                    Arriving at <span className="font-bold text-[#7C3AED]">{currentTargetStation.name}</span> in {formatTimer(countdownSeconds)} mins on {currentTargetStation.platform}!
                  </>
                ) : (
                  <>
                    Cruising at <span className="font-bold text-[#7C3AED]">{currentSpeed} km/h</span> towards {currentTargetStation.name} ({delayStatus === 'BEFORE_TIME' ? 'Running 5m early' : delayStatus === 'DELAY_8M' ? '8 min signal delay' : delayStatus === 'DELAY_25M' ? '25m delay' : 'Right on time'}).
                  </>
                )}
              </p>
            </div>

            <div className="space-y-1.5 text-xs font-medium text-slate-700 pt-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Direct IRCTC Satellite Stream</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span>Automated 2-Min Platform Audio</span>
              </div>
            </div>
          </div>

          {/* On-Board Passenger Tools Card */}
          <div className="bg-white rounded-3xl p-4 border border-purple-100 shadow-sm space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              On-Board Passenger Tools
            </h4>

            <button
              type="button"
              onClick={() => speakNiraResponse(`Alarm set! You will receive audio announcements 15 minutes before reaching ${currentTargetStation.name}.`)}
              className="w-full p-2.5 rounded-xl bg-purple-50/50 hover:bg-purple-50 border border-purple-100 flex items-center justify-between text-xs font-bold text-slate-800 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 text-purple-700" />
                <span>Set Station Wake-Up Alarm</span>
              </div>
              <span className="text-[10px] text-purple-700 bg-purple-100 px-2 py-0.5 rounded font-mono">
                15m Before
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: `Tracking ${trainName}`,
                    text: `I am currently traveling on Train ${trainNumber} approaching ${currentTargetStation.name}. Speed: ${currentSpeed} km/h.`,
                  }).catch(() => {});
                } else {
                  alert(`Copied live trip tracking link for Train ${trainNumber}!`);
                }
              }}
              className="w-full p-2.5 rounded-xl bg-purple-50/50 hover:bg-purple-50 border border-purple-100 flex items-center justify-between text-xs font-bold text-slate-800 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Share2 className="w-3.5 h-3.5 text-purple-700" />
                <span>Share Live Trip Status</span>
              </div>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => speakNiraResponse("IRCTC e-Catering is available on your route! You can order hot meals, thalis, and beverages delivered directly to Coach B4 at the next scheduled halt.")}
              className="w-full p-2.5 rounded-xl bg-purple-50/50 hover:bg-purple-50 border border-purple-100 flex items-center justify-between text-xs font-bold text-slate-800 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Utensils className="w-3.5 h-3.5 text-purple-700" />
                <span>Order Food to Berth</span>
              </div>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                Available
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
