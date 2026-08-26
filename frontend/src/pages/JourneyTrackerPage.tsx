import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Sliders,
  Check,
  X,
} from 'lucide-react';
import { useJourney } from '../context/JourneyContext';
import { speakNiraResponse } from '../services/voiceService';
import { MOCK_TRAINS_DATABASE } from '../data/mockTrains';
import { getTrainStoppages, StationStop } from '../data/trainStoppages';
import {
  liveSeatInventory,
  stationLoadProjection,
  getNoSeatSegments,
  getWaitlistWatchProjection,
  getTrainCoaches,
  getCoachBerthLayout,
  CoachInfo,
  ComfortLevel,
} from '../utils/seatInventory';
import { Explain } from '../components/Explain';
import { explainMyTicket, PassengerExplainEntry, TicketExplanation } from '../utils/explainContext';

type TravelPhase = 'DEPARTING' | 'TRAVELING' | 'APPROACHING' | 'HALTED' | 'DESTINATION_ARRIVED';
type DelayStatus = 'ON_TIME' | 'BEFORE_TIME' | 'DELAY_8M' | 'DELAY_25M';

const KNOWN_TRAIN_NAMES: Record<string, string> = {
  '12232': 'Chandigarh - Lucknow SF Express',
  '12302': 'Howrah Rajdhani Express',
  '12301': 'Howrah Rajdhani Express',
  '12951': 'Mumbai Rajdhani Express',
  '12952': 'New Delhi Rajdhani Express',
  '22436': 'Varanasi Vande Bharat Express',
  '22435': 'Varanasi Vande Bharat Express',
  '12002': 'Bhopal Shatabdi Express',
  '12004': 'Lucknow Shatabdi Express',
  '22692': 'Bengaluru Rajdhani Express',
  '20835': 'Puri Vande Bharat Express',
  '12115': 'Siddheshwar SF Express',
  '12116': 'Siddheshwar SF Express',
  '12423': 'Dibrugarh Rajdhani Express',
  '12626': 'Kerala SF Express',
  '12801': 'Purushottam Express',
  '12245': 'Howrah Duronto Express',
  '12839': 'Chennai Mail Express',
  '12618': 'Mangala Lakshadweep Express',
  '12723': 'Telangana Superfast Express',
  '12953': 'August Kranti Tejas Rajdhani',
  '12123': 'Deccan Queen Superfast',
  '12259': 'Sealdah AC Duronto',
};

export const JourneyTrackerPage: React.FC = () => {
  const { searchParams, selectedTrain, selectedClassCode, trackQuery, setTrackQuery, navigateTo, addNotification } = useJourney();
  const initialTrainNumber = trackQuery || selectedTrain?.trainNumber || '12302';

  // ─── STATE HOOKS (Declared at Top) ───
  const [searchInput, setSearchInput] = useState(initialTrainNumber);
  const [activeTrainNumber, setActiveTrainNumber] = useState(initialTrainNumber);
  const [inventoryClock, setInventoryClock] = useState(Date.now());
  const [activeStationIndex, setActiveStationIndex] = useState(1);
  const [countdownSeconds, setCountdownSeconds] = useState(180);
  const [haltSeconds, setHaltSeconds] = useState(20);
  const [phase, setPhase] = useState<TravelPhase>('TRAVELING');
  const [delayStatus, setDelayStatus] = useState<DelayStatus>('ON_TIME');
  const [isPlayingAnnouncement, setIsPlayingAnnouncement] = useState(false);
  const [speedJitter, setSpeedJitter] = useState(0);
  const [showDetailedFlow, setShowDetailedFlow] = useState(false);
  const [comfortLevel, setComfortLevel] = useState<ComfortLevel>('BALANCED');
  const [selectedCoach, setSelectedCoach] = useState<string>('B4');
  const [privacyMode, setPrivacyMode] = useState<boolean>(false);
  const [showExplainTicketModal, setShowExplainTicketModal] = useState<boolean>(false);
  const [showNiraHappyBanner, setShowNiraHappyBanner] = useState<boolean>(true);
  const [isPoofingOff, setIsPoofingOff] = useState<boolean>(false);
  const [watchAlerts, setWatchAlerts] = useState({
    underTwenty: true,
    probSeventy: true,
    statusChange: true,
    chartPrep: true,
  });
  const lastNotifKey = useRef('');

  // Handle Poof Off Animation
  const handlePoofOff = () => {
    setIsPoofingOff(true);
    setTimeout(() => {
      setShowNiraHappyBanner(false);
      setIsPoofingOff(false);
    }, 600);
  };

  // Speak Nira waitlist advice on mount / train change
  useEffect(() => {
    if (activeTrainNumber === '12232' || trackQuery === '12232') {
      speakNiraResponse(
        "Keep an eye on the list, it'll confirm once wait list is balanced! Based on your destination."
      );
    }
  }, [activeTrainNumber, trackQuery]);

  useEffect(() => {
    if (trackQuery && trackQuery.trim()) {
      const nextTrainNumber = trackQuery.trim();
      setSearchInput(nextTrainNumber);
      setActiveTrainNumber(nextTrainNumber);
    }
  }, [trackQuery]);

  useEffect(() => {
    const timer = window.setInterval(() => setInventoryClock(Date.now()), 6_000);
    return () => window.clearInterval(timer);
  }, []);

  // ─── DYNAMIC TRAIN IDENTITY & ROUTE RESOLUTION ───
  const trainNumber = activeTrainNumber.trim() || '12302';
  const foundTrain = MOCK_TRAINS_DATABASE.find((t) => t.trainNumber === trainNumber);
  const routeStations: StationStop[] = useMemo(() => {
    return getTrainStoppages(trainNumber, foundTrain);
  }, [trainNumber, foundTrain]);

  const firstStop = routeStations[0] || { code: 'NDLS', name: 'New Delhi', platform: 'Platform 1' };
  const lastStop = routeStations[routeStations.length - 1] || { code: 'HWH', name: 'Howrah', platform: 'Platform 9' };

  const trainName = useMemo(() => {
    if (KNOWN_TRAIN_NAMES[trainNumber]) return KNOWN_TRAIN_NAMES[trainNumber];
    if (foundTrain?.trainName) return foundTrain.trainName;
    const num = Number.parseInt(trainNumber, 10) || trainNumber.length;
    const type = num % 5 === 0 ? 'Vande Bharat' : num % 4 === 0 ? 'Rajdhani' : num % 3 === 0 ? 'Shatabdi' : num % 2 === 0 ? 'Duronto' : 'Superfast Express';
    return `${firstStop.name} - ${lastStop.name} ${type} #${trainNumber}`;
  }, [trainNumber, foundTrain, firstStop.name, lastStop.name]);

  const fromCode = foundTrain?.fromStationCode || firstStop.code;
  const fromCity = foundTrain?.fromCity || firstStop.name;
  const toCode = foundTrain?.toStationCode || lastStop.code;
  const toCity = foundTrain?.toCity || lastStop.name;

  // Dynamic Coach List based strictly on train's authentic classes
  const trainCoaches: CoachInfo[] = useMemo(() => {
    return getTrainCoaches(trainNumber, foundTrain?.classes || [{ classCode: '3A', className: 'AC 3 Tier' }]);
  }, [trainNumber, foundTrain]);

  // Ensure selectedCoach is always valid
  useEffect(() => {
    if (trainCoaches.length > 0 && !trainCoaches.some((c) => c.code === selectedCoach)) {
      setSelectedCoach(trainCoaches[0].code);
    }
  }, [trainCoaches, selectedCoach]);

  const selectedCoachInfo = useMemo(() => {
    return trainCoaches.find((c) => c.code === selectedCoach) || trainCoaches[0] || {
      code: 'B4',
      classCode: '3A',
      className: 'AC 3 Tier',
      label: 'B4 (3A)',
      capacity: 64,
    };
  }, [trainCoaches, selectedCoach]);

  const coachInventory = useMemo(() => {
    return liveSeatInventory(trainNumber, selectedCoachInfo.classCode, 0, inventoryClock);
  }, [trainNumber, selectedCoachInfo.classCode, inventoryClock]);

  // Determine if this selected coach is the user's booked coach/class
  const userBookedClass = selectedClassCode || selectedTrain?.classes?.[0]?.classCode || '3A';
  const isUserClass = selectedCoachInfo.classCode === userBookedClass;
  const isUserCoach = selectedCoach === 'B4' || (isUserClass && selectedCoach === (trainCoaches.find((c) => c.classCode === userBookedClass)?.code || 'B4'));

  const coachBerthLayout = useMemo(() => {
    return getCoachBerthLayout(
      selectedCoachInfo.code,
      selectedCoachInfo.classCode,
      coachInventory.racCount,
      isUserCoach,
      isUserCoach ? 14 : undefined
    );
  }, [selectedCoachInfo.code, selectedCoachInfo.classCode, coachInventory.racCount, isUserCoach]);

  const seatClass = foundTrain?.classes?.find((c) => c.classCode === selectedCoachInfo.classCode) || foundTrain?.classes?.[0];
  const seatInventory = coachInventory;
  const noSeatSegments = useMemo(() => getNoSeatSegments(trainNumber, routeStations), [trainNumber, routeStations]);
  const primaryNoSeat = noSeatSegments[0];

  const wlWatch = useMemo(() => {
    return getWaitlistWatchProjection(trainNumber, selectedCoachInfo.classCode, coachInventory.waitlist, comfortLevel);
  }, [trainNumber, selectedCoachInfo.classCode, coachInventory.waitlist, comfortLevel]);

  // Dynamic Passenger List for Waitlist Watch Sidebar
  const passengerEntries: PassengerExplainEntry[] = useMemo(() => {
    const p1Wl = coachInventory.waitlist;
    const p1Init = coachInventory.initialWaitlist;
    const p1Prob = wlWatch.confirmationProbability;
    const p1Moved = coachInventory.positionsCleared;

    return [
      {
        name: 'Anusuya Nita',
        displayName: 'Passenger 1',
        quotaType: 'GNWL',
        initialWl: p1Init,
        currentWl: p1Wl,
        probability: p1Prob,
        positionsCleared: p1Moved,
      },
      {
        name: 'Rohan Sharma',
        displayName: 'Passenger 2',
        quotaType: 'GNWL',
        initialWl: p1Init + 2,
        currentWl: Math.max(1, p1Wl + 2),
        probability: Math.max(10, p1Prob - 4),
        positionsCleared: p1Moved,
      },
    ];
  }, [coachInventory, wlWatch.confirmationProbability]);

  const ticketExplanation = useMemo(() => {
    return explainMyTicket(passengerEntries, 4, privacyMode);
  }, [passengerEntries, privacyMode]);

  const availabilityRoute = `${firstStop.name} (${firstStop.platform}) to ${lastStop.name} (${lastStop.platform})`;

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
    const stops = routeStations;
    const mid = Math.max(1, Math.min(stops.length - 2, Math.floor(stops.length / 3)));
    setActiveStationIndex(mid);
    setPhase('TRAVELING');
    const seed = Number.parseInt(trainNumber, 10) || trainNumber.length;
    setCountdownSeconds(150 + (seed % 120));
    const delayPick: DelayStatus[] = ['ON_TIME', 'BEFORE_TIME', 'ON_TIME', 'DELAY_8M'];
    setDelayStatus(delayPick[seed % delayPick.length]);
    lastNotifKey.current = '';
  }, [trainNumber, routeStations]);

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
    const nextTrainNumber = searchInput.trim();
    setActiveTrainNumber(nextTrainNumber);
    setTrackQuery(nextTrainNumber);
  };

  const selectTrainToTrack = (nextTrainNumber: string) => {
    setSearchInput(nextTrainNumber);
    setActiveTrainNumber(nextTrainNumber);
    setTrackQuery(nextTrainNumber);
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
          onClick={() => selectTrainToTrack('12232')}
          className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
            trainNumber === '12232'
              ? 'bg-[#7C3AED] text-white shadow-sm ring-2 ring-purple-300'
              : 'bg-white text-slate-700 border border-purple-100 hover:bg-purple-50'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-300" />
          <span>#12232 Chandigarh - Lucknow (WL Watch)</span>
        </button>

        <button
          type="button"
          onClick={() => selectTrainToTrack('12302')}
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
          onClick={() => selectTrainToTrack('12951')}
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
          onClick={() => selectTrainToTrack('22436')}
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
          onClick={() => selectTrainToTrack('12002')}
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
          onClick={() => selectTrainToTrack('20835')}
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
          onClick={() => selectTrainToTrack('12115')}
          className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
            trainNumber === '12115'
              ? 'bg-[#7C3AED] text-white shadow-sm'
              : 'bg-white text-slate-700 border border-purple-100 hover:bg-purple-50'
          }`}
        >
          <Train className="w-3.5 h-3.5 text-amber-500" />
          <span>#12115 Siddheshwar SF</span>
        </button>

        <button
          type="button"
          onClick={() => selectTrainToTrack('22692')}
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
          NIRA FLOATING MASCOT SPEECH BANNER (HAPPY FACE + POOF OFF)
          ═══════════════════════════════════════════════════════════════════ */}
      {showNiraHappyBanner && (
        <div
          className={`relative rounded-3xl p-4 sm:p-5 bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white shadow-xl border-2 border-purple-400/40 overflow-hidden transition-all duration-500 ${
            isPoofingOff ? 'scale-90 opacity-0 blur-md pointer-events-none' : 'animate-in slide-in-from-top-4'
          }`}
        >
          {/* Subtle radial sheen */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-500/20 via-transparent to-transparent pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 justify-between">
            {/* Mascot Image (Happy expression) */}
            <div className="flex items-center gap-3.5 shrink-0">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
                <img
                  src="/assets/images/characters/nira_happy_mascot.png"
                  alt="Nira Happy Mascot"
                  className="w-full h-full object-contain filter drop-shadow-[0_10px_20px_rgba(16,185,129,0.5)] animate-pulse"
                />
                <div className="absolute -top-1 -right-1 bg-emerald-400 text-emerald-950 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase shadow">
                  Active AI
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span className="font-extrabold text-sm text-amber-300">Nira Waitlist Copilot</span>
                </div>
                <span className="text-[10px] text-purple-200 block font-medium">Real-Time Destination Intelligence</span>
              </div>
            </div>

            {/* Speech Bubble with the exact text requested */}
            <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 border border-white/20 text-center sm:text-left space-y-1">
              <p className="text-xs sm:text-sm font-bold text-white leading-relaxed">
                "Keep an eye on the list it'll confirm once wait list is balanced! Based on your destination."
              </p>
              <span className="text-[10px] text-purple-200 block font-medium">
                Destination quota for <strong>{toCity}</strong> has high clearance velocity (↑ 3.4 cancels/hr across corridor).
              </span>
            </div>

            {/* Voice and Poof Off Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() =>
                  speakNiraResponse(
                    "Keep an eye on the list, it'll confirm once wait list is balanced! Based on your destination."
                  )
                }
                className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                title="Play voice audio"
              >
                <Volume2 className="w-3.5 h-3.5 text-amber-300" />
                <span>Play Voice</span>
              </button>

              <button
                type="button"
                onClick={handlePoofOff}
                className="px-3 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-black text-xs flex items-center gap-1 shadow-md transition-all cursor-pointer active:scale-95"
                title="Dismiss with poof animation"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Poof Off 💨</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
          3. ZERO-SEAT PLATFORM WARNING BANNER (When No Seat Available)
          ═══════════════════════════════════════════════════════════════════ */}
      {(seatInventory.status !== 'AVAILABLE' || primaryNoSeat) && (
        <div className="rounded-2xl border border-rose-300 bg-rose-50/95 p-3.5 text-rose-950 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-mono font-black uppercase tracking-wider">
                  Zero Seat Alert
                </span>
                <span className="text-xs font-black text-rose-950">
                  NO SEATS AVAILABLE from {primaryNoSeat?.fromStation || fromCity} ({primaryNoSeat?.fromPlatform || firstStop.platform}) to {primaryNoSeat?.toStation || toCity} ({primaryNoSeat?.toPlatform || lastStop.platform})
                </span>
              </div>
              <p className="text-[11px] text-rose-800 font-medium mt-0.5">
                Estimated occupancy is at 100% capacity on this corridor segment. Waitlist allocation active ({seatInventory.status} {seatInventory.waitlist}/100).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => speakNiraResponse(`Zero seat notice: Train ${trainNumber} has 0 vacant seats from ${primaryNoSeat?.fromStation} ${primaryNoSeat?.fromPlatform} to ${primaryNoSeat?.toStation} ${primaryNoSeat?.toPlatform}. Waitlist Watch is actively monitoring movement.`)}
            className="px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-900 text-xs font-bold hover:bg-rose-100/80 transition-all cursor-pointer shrink-0 self-start sm:self-center"
          >
            Audio Briefing
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          4. REAL-TIME ARRIVAL / CELEBRATION / HALT BANNER
          ═══════════════════════════════════════════════════════════════════ */}
      {phase === 'DESTINATION_ARRIVED' ? (
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
          5. MAIN TWO-COLUMN LAYOUT: TIMELINE & ON-BOARD TOOLS
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 items-start">
        {/* ──────────────── LEFT COLUMN: STATION TIMELINE & SHIFT ENGINE (2 Cols) ──────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {/* ─── INTERACTIVE SEAT MAP & REAL-TIME WAITLIST INTELLIGENCE PIPELINE ─── */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-purple-100 shadow-sm space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-50 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-purple-100 text-purple-900">
                    <Train className="w-4 h-4" />
                  </span>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    Live Coach Composition & Seat Berth Feature
                  </h3>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Interactive Coach Layout • Real-time quota balance based on destination ({toCity})
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs flex-wrap">
                <span className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Vacant
                  <Explain term="CNF" />
                </span>
                {coachInventory.racCount > 0 && (
                  <span className="flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> RAC (Shared)
                    <Explain term="RAC" />
                  </span>
                )}
                <span className="flex items-center gap-1 font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-purple-600" /> WL-{coachInventory.waitlist} {isUserCoach ? '(You)' : '(Queue)'}
                  <Explain
                    term="GNWL"
                    context={{
                      currentValue: coachInventory.waitlist,
                      initialValue: coachInventory.initialWaitlist,
                      probability: wlWatch.confirmationProbability,
                    }}
                  />
                </span>
              </div>
            </div>

            {/* Coach Selection Tabs — Strictly derived from train's authentic classes */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">Coaches:</span>
              {trainCoaches.map((c) => {
                const isSelected = selectedCoach === c.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setSelectedCoach(c.code)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer text-xs ${
                      isSelected
                        ? 'bg-purple-900 text-white shadow-md shadow-purple-900/20 ring-2 ring-purple-300'
                        : 'bg-purple-50/70 text-slate-700 border border-purple-100 hover:bg-purple-100'
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>

            {/* Coach Berth Grid Layout */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white space-y-3">
              <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2 flex-wrap gap-2">
                <span className="font-bold text-purple-200">
                  Coach <strong className="text-white font-mono text-sm">{selectedCoach}</strong> ({selectedCoachInfo.className}) Layout:
                </span>
                <span className="text-[11px] font-mono text-emerald-300 font-bold flex items-center gap-1.5">
                  <span>Occupancy: {coachInventory.occupancyPercent}%</span>
                  <span>•</span>
                  <span>{coachInventory.racCount > 0 ? `${coachInventory.racCount} RAC` : '0 RAC'}</span>
                  <span>•</span>
                  <span>{coachInventory.waitlist} GNWL in Queue</span>
                  <Explain
                    term="GNWL"
                    context={{
                      currentValue: coachInventory.waitlist,
                      initialValue: coachInventory.initialWaitlist,
                      probability: wlWatch.confirmationProbability,
                    }}
                  />
                </span>
              </div>

              {/* Dynamic Seat Rows Grid */}
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 text-center text-xs font-mono">
                {coachBerthLayout.map((seat) => {
                  const isRac = seat.status === 'RAC';
                  const isUser = !!seat.isUserSeat;
                  return (
                    <div
                      key={seat.num}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all ${
                        isUser
                          ? 'bg-purple-600/40 border-purple-400 text-white ring-2 ring-purple-400 shadow-sm shadow-purple-500/50'
                          : isRac
                          ? 'bg-amber-400/20 border-amber-400 text-amber-300 ring-1 ring-amber-400/50'
                          : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      }`}
                    >
                      <span className="font-bold text-sm leading-none">{seat.num}</span>
                      <span className="text-[9px] text-purple-200 mt-0.5">{seat.type}</span>
                      <span
                        className={`text-[8px] font-black uppercase px-1 rounded mt-0.5 ${
                          isUser
                            ? 'bg-purple-400 text-slate-950 font-black'
                            : isRac
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-emerald-400/20 text-emerald-300'
                        }`}
                      >
                        {seat.label || 'CNF'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* User's Waitlist Highlight Tile */}
              <div className="p-3 rounded-xl bg-purple-900/60 border border-purple-400/40 flex items-center justify-between flex-wrap gap-2 text-xs">
                {isUserCoach ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-xs shadow-md animate-pulse">
                        ★
                      </span>
                      <span className="flex items-center gap-1.5">
                        Your Position in Queue: <strong className="text-amber-300 font-mono text-sm">WL-{coachInventory.waitlist}</strong> (Coach {selectedCoach} Promotion Path)
                        <Explain
                          term="GNWL"
                          context={{
                            currentValue: coachInventory.waitlist,
                            initialValue: coachInventory.initialWaitlist,
                            probability: wlWatch.confirmationProbability,
                          }}
                        />
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-300 bg-emerald-400/20 px-2 py-0.5 rounded-full border border-emerald-400/30">
                      ⚡ Projected RAC {Math.max(1, Math.ceil(coachInventory.waitlist / 2))} at Chart 1
                    </span>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-purple-500/60 text-white flex items-center justify-center font-bold text-xs">
                        ℹ
                      </span>
                      <span className="flex items-center gap-1.5 text-purple-200">
                        Coach <strong className="text-white font-mono">{selectedCoach}</strong> Queue: <strong className="text-amber-300 font-mono">WL-{coachInventory.waitlist}</strong> • {coachInventory.racCount} RAC ({selectedCoachInfo.className})
                        <Explain
                          term="GNWL"
                          context={{
                            currentValue: coachInventory.waitlist,
                            initialValue: coachInventory.initialWaitlist,
                            probability: wlWatch.confirmationProbability,
                          }}
                        />
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedCoach(trainCoaches.find((c) => c.classCode === userBookedClass)?.code || 'B4')}
                      className="text-[11px] font-bold text-purple-200 bg-purple-800/60 hover:bg-purple-700/60 px-2.5 py-1 rounded-full border border-purple-400/30 transition-all cursor-pointer"
                    >
                      Jump to Your Booked Coach →
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                HOW THE WAITLIST IS ANALYSED IN REAL TIME (DIRECTIONAL ARROWS)
                ═══════════════════════════════════════════════════════════════════ */}
            <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-[#7C3AED] text-white flex items-center justify-center font-black text-xs shadow-sm">
                    AI
                  </span>
                  <h4 className="text-xs sm:text-sm font-black text-slate-900">
                    HOW Your Waitlist is Analysed in Real Time (Destination Pipeline)
                  </h4>
                </div>
                <span className="text-[10px] font-bold text-purple-700 uppercase bg-purple-100 px-2 py-0.5 rounded-full">
                  Real-Time Model
                </span>
              </div>

              {/* 4 Connected Pipeline Cards with Animated Directional Arrows */}
              <div className="grid grid-cols-1 md:grid-cols-7 gap-2 items-center">
                {/* Step 1: Destination Quota Matrix */}
                <div className="md:col-span-2 p-3 rounded-2xl bg-white border border-purple-200 shadow-xs space-y-1.5 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-purple-100 text-purple-900">
                      Step 1
                    </span>
                    <Explain term="GENERAL_QUOTA" />
                  </div>
                  <span className="text-xs font-black text-slate-900 block">
                    Destination Quota
                  </span>
                  <p className="text-[10px] text-slate-600 font-medium leading-tight">
                    Corridor quota balanced for <strong>{toCity}</strong> vs intermediate drop-offs.
                  </p>
                </div>

                {/* Animated Directional Arrow 1 */}
                <div className="hidden md:flex flex-col items-center justify-center text-purple-600 font-black text-lg animate-pulse">
                  <span>➔</span>
                  <span className="text-[8px] font-bold text-slate-400">Velocity</span>
                </div>

                {/* Step 2: Cancellation Velocity */}
                <div className="md:col-span-2 p-3 rounded-2xl bg-white border border-purple-200 shadow-xs space-y-1.5 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-900">
                      Step 2
                    </span>
                    <Explain term="POSITIONS_CLEARED" />
                  </div>
                  <span className="text-xs font-black text-slate-900 block">
                    Live Cancel Rate
                  </span>
                  <p className="text-[10px] text-slate-600 font-medium leading-tight">
                    <strong className="text-emerald-600">↑ {coachInventory.cancellationVelocity} cancels/hr</strong> telemetry detected on this route today.
                  </p>
                </div>

                {/* Animated Directional Arrow 2 */}
                <div className="hidden md:flex flex-col items-center justify-center text-purple-600 font-black text-lg animate-pulse">
                  <span>➔</span>
                  <span className="text-[8px] font-bold text-slate-400">Release</span>
                </div>

                {/* Step 3: Final Berth Settlement */}
                <div className="md:col-span-2 p-3 rounded-2xl bg-white border border-emerald-300 bg-emerald-50/40 shadow-xs space-y-1.5 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900">
                      Step 3
                    </span>
                    <Explain
                      term="CONFIRMATION_PROBABILITY"
                      context={{
                        currentValue: coachInventory.waitlist,
                        probability: wlWatch.confirmationProbability,
                      }}
                    />
                  </div>
                  <span className="text-xs font-black text-emerald-950 block">
                    Berth Confirmed
                  </span>
                  <p className="text-[10px] text-emerald-800 font-bold leading-tight">
                    WL-{coachInventory.waitlist} ➔ RAC {Math.max(1, Math.ceil(coachInventory.waitlist / 2))} ➔ Confirmed Berth ({selectedCoach} Lower) forecast ({wlWatch.confirmationProbability}% odds).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ─── STATION TIMELINE CARD ─── */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-purple-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-50 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-purple-700" />
                <h3 className="font-bold text-sm sm:text-base text-slate-900">
                  Station Timeline & Live Platform Alignment
                </h3>
              </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Live timetable • {routeStations.length} stoppages
              </span>
              <button
                type="button"
                onClick={() => setShowDetailedFlow((prev) => !prev)}
                className="px-2.5 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
              >
                <Sliders className="w-3 h-3 text-purple-700" />
                <span>{showDetailedFlow ? 'Simple Summary' : 'Detailed Flow'}</span>
              </button>
            </div>
          </div>

          {/* Route Vacancy & Projected Flow Header Pill */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className={`font-bold ${seatInventory.status === 'AVAILABLE' ? 'text-emerald-900' : 'text-rose-900'}`}>
              {seatInventory.status === 'AVAILABLE'
                ? `Route availability (${seatClass?.classCode || '3A'}): ${seatInventory.seats} vacant seats`
                : `No ${seatClass?.classCode || '3A'} seats available from ${availabilityRoute} — ${seatInventory.status} ${seatInventory.waitlist}/100`}
            </span>
            <span className="text-[11px] font-medium text-slate-600">
              Projected passenger flow (modelled occupancy)
            </span>
          </div>

          {/* ─── SIMPLE MODE SUMMARY VIEW ─── */}
          {!showDetailedFlow && (
            <div className="p-4 rounded-2xl bg-purple-50/40 border border-purple-100 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-white border border-purple-100 space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Current Location</span>
                  <strong className="text-slate-900 text-sm block truncate">{currentTargetStation.name}</strong>
                  <span className="text-[10px] text-purple-700 font-bold">{currentTargetStation.platform}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-purple-100 space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Estimated Occupancy</span>
                  <strong className="text-slate-900 text-sm block">👥 Moderate (~76%)</strong>
                  <span className="text-[10px] text-emerald-700 font-bold">Stable flow</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-purple-100 space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Waitlist Movement</span>
                  <strong className="text-amber-700 text-sm block">WL {seatInventory.waitlist || 38}</strong>
                  <span className="text-[10px] text-emerald-700 font-bold">📈 Positive velocity</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowDetailedFlow(true)}
                className="w-full py-2 rounded-xl bg-white hover:bg-purple-50 border border-purple-200 text-purple-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-purple-700" />
                <span>See detailed station-flow projections ({routeStations.length} stoppages) →</span>
              </button>
            </div>
          )}

          {/* ─── DETAILED STATION-WISE PASSENGER FLOW TIMELINE ─── */}
          {showDetailedFlow && (
            <div className="space-y-4 relative pl-3 before:absolute before:left-[21px] before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 animate-in fade-in">
              {routeStations.map((st, idx) => {
                const isPassed = idx < activeStationIndex;
                const isCurrent = idx === activeStationIndex;
                const nextSt = routeStations[idx + 1];
                const load = stationLoadProjection(trainNumber, routeStations, idx);
                const isNoSeat = load.vacantSeats === 0;

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
                        
                        {/* Projected Passenger Flow Badges */}
                        <div className="mt-1 flex flex-wrap gap-1.5 text-[9px] font-bold">
                          <span className="rounded-full bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 text-indigo-800">
                            ↑ {load.boarding} board
                          </span>
                          <span className="rounded-full bg-orange-50 border border-orange-100 px-1.5 py-0.5 text-orange-800">
                            ↓ {load.alighting} leave
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 border font-bold ${
                              isNoSeat
                                ? 'bg-rose-100 border-rose-300 text-rose-900'
                                : 'bg-emerald-50 border-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isNoSeat
                              ? `🚫 0 vacant seats (NO SEATS AVAILABLE to ${nextSt?.platform || 'next platform'})`
                              : `${load.vacantSeats} vacant seats after departure`}
                          </span>
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
                            ? `Arrived ${st.scheduledArr}`
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
                              ? `At ${st.platform}`
                            : 'Approaching'
                          : 'Upcoming'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

        {/* ──────────────── RIGHT COLUMN: WAITLIST WATCH & NIRA COPILOT (1 Col) ──────────────── */}
        <div className="space-y-3">
          {/* 1. WAITLIST WATCH & COMFORT WINDOW CARD */}
          <div className="bg-white rounded-3xl p-4 border-2 border-purple-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-purple-50 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                  🟢
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 leading-none">
                    Waitlist Watch
                  </h4>
                  <span className="text-[10px] font-bold text-purple-700">
                    WL {wlWatch.initialWl} → WL {wlWatch.currentWl}
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-extrabold uppercase">
                Active Watch
              </span>
            </div>

            {/* ✨ Explain My Ticket Primary Action */}
            <button
              type="button"
              onClick={() => setShowExplainTicketModal(true)}
              className="w-full py-2 px-3 rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-[#7C3AED] hover:from-purple-800 hover:to-indigo-800 text-white text-xs font-black shadow-md shadow-purple-900/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>✨ Explain My Ticket in Plain English</span>
            </button>

            {/* Probability & Movement with Explain */}
            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-50 via-white to-purple-50 border border-purple-100 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                  <span>Confirmation Probability</span>
                  <Explain
                    term="CONFIRMATION_PROBABILITY"
                    context={{
                      currentValue: wlWatch.currentWl,
                      initialValue: wlWatch.initialWl,
                      probability: wlWatch.confirmationProbability,
                    }}
                  />
                </span>
                <span className="text-sm font-black font-mono text-purple-900">
                  {wlWatch.confirmationProbability}%
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                  style={{ width: `${wlWatch.confirmationProbability}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-600 font-medium">
                {wlWatch.trendText}
              </p>
            </div>

            {/* Per-Passenger Waitlist Status Breakdown */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Passenger Status ({passengerEntries.length}):
                </label>
                <button
                  type="button"
                  onClick={() => setPrivacyMode((p) => !p)}
                  className="text-[10px] font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer"
                  title={privacyMode ? 'Show passenger names' : 'Hide names for privacy'}
                >
                  {privacyMode ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  <span>{privacyMode ? 'Show Names' : 'Privacy ON'}</span>
                </button>
              </div>

              <div className="space-y-1.5">
                {passengerEntries.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-[11px]">
                        {privacyMode ? p.displayName : p.name}
                      </span>
                      <span className="font-mono text-purple-900 font-bold text-[11px] flex items-center gap-1">
                        {p.quotaType} {p.initialWl} → {p.quotaType} {p.currentWl}
                        <Explain
                          term="GNWL"
                          context={{
                            currentValue: p.currentWl,
                            initialValue: p.initialWl,
                            probability: p.probability,
                            passengerName: privacyMode ? p.displayName : p.name,
                          }}
                        />
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                        style={{ width: `${p.probability}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                      <span>{p.positionsCleared} cleared</span>
                      <span className="text-emerald-700 font-bold">{p.probability}% est.</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comfort Window Tabs */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Select Your Comfort Window:
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-[11px] font-bold">
                {[
                  { id: 'SAFE' as ComfortLevel, label: '🟢 Safe', hint: '>80% chance' },
                  { id: 'BALANCED' as ComfortLevel, label: '🟡 Balanced', hint: '>60% chance' },
                  { id: 'FLEXIBLE' as ComfortLevel, label: '🟠 Flexible', hint: 'Lower chances' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setComfortLevel(tab.id)}
                    className={`p-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                      comfortLevel === tab.id
                        ? 'bg-purple-900 text-white border-purple-900 shadow-xs'
                        : 'bg-purple-50/50 text-slate-700 border-purple-100 hover:bg-purple-100'
                    }`}
                  >
                    <span className="block">{tab.label}</span>
                    <span className={`text-[9px] block ${comfortLevel === tab.id ? 'text-purple-200' : 'text-slate-400'}`}>
                      {tab.hint}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Nira Reassuring Insight Bubble */}
            <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 flex items-start gap-2 text-xs">
              <Sparkles className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-purple-950 font-bold block">Nira says:</strong>
                <p className="text-slate-700 text-[11px] font-medium leading-relaxed">
                  "{wlWatch.niraSpeech}"
                </p>
              </div>
            </div>

            {/* Watch Notification Triggers */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Notify me when:
              </span>
              <div className="space-y-1 text-[11px] font-semibold text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={watchAlerts.underTwenty}
                    onChange={(e) => setWatchAlerts((p) => ({ ...p, underTwenty: e.target.checked }))}
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span>WL drops below 20</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={watchAlerts.probSeventy}
                    onChange={(e) => setWatchAlerts((p) => ({ ...p, probSeventy: e.target.checked }))}
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span>Confirmation probability &gt; 70%</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={watchAlerts.statusChange}
                    onChange={(e) => setWatchAlerts((p) => ({ ...p, statusChange: e.target.checked }))}
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span>Berth / RAC status changes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={watchAlerts.chartPrep}
                    onChange={(e) => setWatchAlerts((p) => ({ ...p, chartPrep: e.target.checked }))}
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span>Final chart preparation approaches (4h before)</span>
                </label>
              </div>
            </div>
          </div>

          {/* 2. Nira Track Copilot Card */}
          <div className="bg-gradient-to-b from-[#F3EDFD] via-[#EFE7FD] to-[#EBE2FC] rounded-3xl p-4 border border-purple-100/90 shadow-sm relative overflow-visible">
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-700" />
              <span>Nira Track Copilot</span>
            </div>

            {/* Speech Bubble */}
            <div className="bg-white rounded-xl p-3 shadow-xs border border-purple-100 mb-2 relative z-20">
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

          {/* 3. On-Board Passenger Tools Card */}
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

      {/* ═══════════════════════════════════════════════════════════════════
          6. EXPLAIN MY TICKET COMPREHENSIVE NIRA MODAL POPUP
          ═══════════════════════════════════════════════════════════════════ */}
      {showExplainTicketModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200 p-0 sm:p-4 select-none"
          onClick={() => setShowExplainTicketModal(false)}
        >
          <div
            className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-purple-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white relative shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white backdrop-blur-xs shadow-xs">
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-200 block">
                      Nirantar Explain • Ticket Intelligence
                    </span>
                    <h3 className="text-base font-black text-white leading-tight">
                      Your Journey at a Glance
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowExplainTicketModal(false)}
                  className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Headline Badge */}
              <div className="mt-3 p-2.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-white">
                  {ticketExplanation.headline}
                </span>
                <span className="text-[10px] font-bold bg-emerald-400/30 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-400/40">
                  {wlWatch.confirmationProbability}% Odds
                </span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-700 font-sans">
              {/* Passenger Queue Breakdown */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
                    Waitlist Queue Movement
                  </span>
                  <button
                    type="button"
                    onClick={() => setPrivacyMode((p) => !p)}
                    className="text-[10px] font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer"
                  >
                    {privacyMode ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    <span>{privacyMode ? 'Show Real Names' : 'Privacy ON'}</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  {passengerEntries.map((p, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-purple-50/70 border border-purple-200/80 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs">
                          {privacyMode ? p.displayName : p.name}
                        </span>
                        <span className="font-mono text-purple-950 font-black text-xs">
                          {p.quotaType} {p.initialWl} ➔ {p.quotaType} {p.currentWl}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-purple-200/60 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                          style={{ width: `${p.probability}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-600 font-semibold">
                        <span>{p.positionsCleared} positions cleared</span>
                        <span className="text-emerald-700 font-bold">{p.probability}% confirmation odds</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendation Card */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-black uppercase text-emerald-800 tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Nira Recommendation</span>
                </div>
                <p className="text-xs sm:text-sm font-bold leading-normal">
                  {ticketExplanation.recommendation}
                </p>
              </div>

              {/* Prediction Disclaimer */}
              <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Prediction Disclaimer</strong>: {ticketExplanation.disclaimer}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 shrink-0">
              <span className="flex items-center gap-1 font-semibold text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Deterministic Live Telemetry</span>
              </span>
              <button
                type="button"
                onClick={() => setShowExplainTicketModal(false)}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-purple-800 to-indigo-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer hover:opacity-95"
              >
                Got It, Thanks!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
