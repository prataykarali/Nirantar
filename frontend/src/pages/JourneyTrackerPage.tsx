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
import { getTrainStoppages, resolveTrainDetail, StationStop } from '../data/trainStoppages';
import {
  liveSeatInventory,
  stationLoadProjection,
  getNoSeatSegments,
  getWaitlistWatchProjection,
  getTrainCoaches,
  getCoachBerthLayout,
  allocatePassengerSeats,
  CoachInfo,
  ComfortLevel,
} from '../utils/seatInventory';
import { Explain } from '../components/Explain';
import { explainMyTicket, PassengerExplainEntry, TicketExplanation } from '../utils/explainContext';

type TravelPhase = 'DEPARTING' | 'TRAVELING' | 'APPROACHING' | 'HALTED' | 'DESTINATION_ARRIVED';
type DelayStatus = 'ON_TIME' | 'BEFORE_TIME' | 'DELAY_8M' | 'DELAY_25M';

const KNOWN_TRAIN_NAMES: Record<string, string> = {
  '12863': 'Howrah - KSR Bengaluru SF Express',
  '12864': 'KSR Bengaluru - Howrah SF Express',
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
  const {
    trackQuery,
    setTrackQuery,
    selectedTrain,
    issuedTicket,
    bookingRecord,
    passengers,
    selectedClassCode,
    searchParams,
    showChatDrawer,
    setShowChatDrawer,
    addNotification,
  } = useJourney();

  const initialTrainNumber = trackQuery || selectedTrain?.trainNumber || issuedTicket?.train?.trainNumber || '12302';
  const userBookedClass = selectedClassCode || selectedTrain?.classes?.[0]?.classCode || '3A';

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
  const [activeTrackerTab, setActiveTrackerTab] = useState<'timeline' | 'coach' | 'waitlist'>('timeline');

  // Real-Time Randomized Waitlist Clearance Simulation (Starts at 42 and clears to 2, then 0 CONFIRMED)
  const isWaitlistBooking = Boolean(
    activeTrainNumber === '12232' ||
    activeTrainNumber === '12863' ||
    activeTrainNumber === '12864' ||
    activeTrainNumber === '12245' ||
    (issuedTicket?.seatAllotments && issuedTicket.seatAllotments.some((s) => (s.coach || '').includes('WL') || (s.coach || '').includes('GNWL'))) ||
    bookingRecord?.status === 'WAITLIST' ||
    bookingRecord?.status === 'RAC'
  );

  const [simulatedWl, setSimulatedWl] = useState<number>(42);
  const [showConfirmedCelebration, setShowConfirmedCelebration] = useState<boolean>(false);
  const [isPoofingCelebration, setIsPoofingCelebration] = useState<boolean>(false);

  useEffect(() => {
    if (!isWaitlistBooking) return;
    setSimulatedWl(42);
    setShowConfirmedCelebration(false);
    setIsPoofingCelebration(false);

    // Fast, responsive progressive sequence: 42 -> 31 -> 20 -> 11 -> 5 -> 1 -> 0 (~2.6 seconds total)
    const sequence = [
      { wl: 31, delay: 450 },
      { wl: 20, delay: 480 },
      { wl: 11, delay: 450 },
      { wl: 5, delay: 420 },
      { wl: 1, delay: 400 },
      { wl: 0, delay: 450 },
    ];

    let step = 0;
    let timerId: any = null;

    const tick = () => {
      if (step < sequence.length) {
        const next = sequence[step];
        timerId = setTimeout(() => {
          setSimulatedWl(next.wl);
          if (next.wl === 0) {
            setShowConfirmedCelebration(true);
            // Instantly pop and switch to Coach Composition Layout page!
            setActiveTrackerTab('coach');
            setSelectedCoach(userBookedClass?.includes('SL') ? 'S1' : userBookedClass?.includes('1') ? 'A1' : userBookedClass?.includes('2') ? 'A1' : 'B4');
            // Auto poof-off celebration after 5 seconds if user doesn't dismiss
            setTimeout(() => {
              setIsPoofingCelebration(true);
              setTimeout(() => {
                setShowConfirmedCelebration(false);
                setIsPoofingCelebration(false);
              }, 600);
            }, 5000);
          }
          step += 1;
          tick();
        }, next.delay);
      }
    };

    tick();

    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [isWaitlistBooking, activeTrainNumber, userBookedClass]);

  const handlePoofCelebration = () => {
    setIsPoofingCelebration(true);
    setTimeout(() => {
      setShowConfirmedCelebration(false);
      setIsPoofingCelebration(false);
    }, 600);
  };

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

  useEffect(() => {
    if (trackQuery && trackQuery.trim()) {
      const nextTrainNumber = trackQuery.trim();
      setSearchInput(nextTrainNumber);
      setActiveTrainNumber(nextTrainNumber);
      setActiveStationIndex(1);
      setCountdownSeconds(180);
      setHaltSeconds(20);
      setPhase('TRAVELING');
    }
  }, [trackQuery]);

  useEffect(() => {
    const timer = window.setInterval(() => setInventoryClock(Date.now()), 6_000);
    return () => window.clearInterval(timer);
  }, []);

  // ─── DYNAMIC TRAIN IDENTITY & ROUTE RESOLUTION ───
  const trainNumber = activeTrainNumber.trim() || '12302';
  const foundTrain = useMemo(() => resolveTrainDetail(trainNumber), [trainNumber]);
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

  // Check if current tracked train is really booked by this citizen
  const isUserBookedTrain = useMemo(() => {
    return Boolean(
      (issuedTicket && issuedTicket.train?.trainNumber === trainNumber) ||
      (bookingRecord && bookingRecord.trainNumber === trainNumber) ||
      (selectedTrain && selectedTrain.trainNumber === trainNumber)
    );
  }, [issuedTicket, bookingRecord, selectedTrain, trainNumber]);

  // Real booked passengers from Citizen profile / ticket database
  const userPassengers = useMemo(() => {
    let pList: any[] = [];
    if (issuedTicket?.passengers && issuedTicket.passengers.length > 0) {
      pList = issuedTicket.passengers;
    } else if (passengers && passengers.length > 0) {
      pList = passengers;
    } else {
      pList = [
        { id: 'p1', name: 'Pratay Karali', age: 24, gender: 'M' as const, berthPreference: 'SIDE_LOWER' as const, assignedClassCode: '3A' },
      ];
    }
    const targetCount = searchParams.passengersCount || pList.length || 1;
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

  // User's allocated seats across specific coaches (e.g. Coach B4 for 3A, Coach S1 for SL)
  const allocatedSeats = useMemo(() => {
    if (!isUserBookedTrain) return [];
    return allocatePassengerSeats(userPassengers, userBookedClass);
  }, [isUserBookedTrain, userPassengers, userBookedClass]);

  // Passengers in this specific coach
  const passengersInThisCoach = useMemo(() => {
    return allocatedSeats.filter((s) => s.coachCode === selectedCoach);
  }, [allocatedSeats, selectedCoach]);

  const isUserCoach = Boolean(isUserBookedTrain && passengersInThisCoach.length > 0);

  const userSeatNumbers = useMemo(() => {
    return passengersInThisCoach.map((s) => s.seatNumber);
  }, [passengersInThisCoach]);

  const coachBerthLayout = useMemo(() => {
    return getCoachBerthLayout(
      selectedCoachInfo.code,
      selectedCoachInfo.classCode,
      coachInventory.racCount,
      isUserCoach,
      userSeatNumbers
    );
  }, [selectedCoachInfo.code, selectedCoachInfo.classCode, coachInventory.racCount, isUserCoach, userSeatNumbers]);

  const seatClass = foundTrain?.classes?.find((c: any) => c.classCode === selectedCoachInfo.classCode) || foundTrain?.classes?.[0];

  const effectiveWl = isWaitlistBooking ? simulatedWl : coachInventory.waitlist;
  const effectiveCleared = isWaitlistBooking ? Math.max(0, 42 - simulatedWl) : coachInventory.positionsCleared;
  const effectiveProb = isWaitlistBooking
    ? (simulatedWl === 0 ? 100 : Math.min(99, Math.round(62 + ((42 - simulatedWl) / 42) * 37)))
    : coachInventory.waitlist <= 2 ? 98 : 88;

  const seatInventory = useMemo(() => {
    if (isWaitlistBooking) {
      return {
        ...coachInventory,
        waitlist: effectiveWl,
        positionsCleared: effectiveCleared,
        status: effectiveWl === 0 ? ('AVAILABLE' as const) : effectiveWl <= 2 ? ('RAC' as const) : ('WL' as const),
      };
    }
    return coachInventory;
  }, [coachInventory, isWaitlistBooking, effectiveWl, effectiveCleared]);

  const noSeatSegments = useMemo(() => getNoSeatSegments(trainNumber, routeStations), [trainNumber, routeStations]);
  const primaryNoSeat = noSeatSegments[0];

  const rawWlWatch = useMemo(() => {
    return getWaitlistWatchProjection(trainNumber, selectedCoachInfo.classCode, effectiveWl, comfortLevel);
  }, [trainNumber, selectedCoachInfo.classCode, effectiveWl, comfortLevel]);

  const wlWatch = useMemo(() => {
    if (isWaitlistBooking) {
      return {
        ...rawWlWatch,
        confirmationProbability: effectiveProb,
        predictedFinalState: (effectiveWl === 0 ? 'CONFIRMED' : 'RAC_OR_CONFIRMED') as any,
      };
    }
    return rawWlWatch;
  }, [rawWlWatch, isWaitlistBooking, effectiveProb, effectiveWl]);

  // Dynamic positive encouraging messages by Nira Copilot as waitlist decreases
  const copilotDynamicAdvice = useMemo(() => {
    if (effectiveWl >= 40) {
      return {
        title: `Hang tight Pratay! I'm monitoring the queue in real-time.`,
        subtitle: `Initial GNWL-42 assigned. High cancellation corridor detected for ${toCity} (↑ 3.4 cancels/hr across corridor).`,
        badge: 'Queue Active',
        badgeColor: 'bg-amber-400 text-amber-950',
      };
    }
    if (effectiveWl >= 30) {
      return {
        title: `Good news! 6 cancellations just cleared ahead in the ${toCity} quota! 🚀`,
        subtitle: `Queue moving at 4.2 cancels/hr. Confirmation odds rising to ${effectiveProb}%.`,
        badge: 'Moving Fast ⚡',
        badgeColor: 'bg-emerald-400 text-emerald-950',
      };
    }
    if (effectiveWl >= 20) {
      return {
        title: `We just cleared 14 more positions! Momentum is surging! ✨`,
        subtitle: `Corridor balancing active. Current waitlist dropped to GNWL-${effectiveWl}.`,
        badge: '14 Cleared 🚀',
        badgeColor: 'bg-emerald-400 text-emerald-950',
      };
    }
    if (effectiveWl >= 15) {
      return {
        title: `Over half the queue cleared! Down to GNWL-${effectiveWl}! 📈`,
        subtitle: `Chart preparation clearance probability is surging at ${effectiveProb}%. Almost entering RAC!`,
        badge: 'Over 50% Cleared',
        badgeColor: 'bg-teal-400 text-teal-950',
      };
    }
    if (effectiveWl >= 10) {
      return {
        title: `Down to GNWL-${effectiveWl}! Emergency & VIP quota buffers released! 🟢`,
        subtitle: `High clearance velocity! Confirmation probability reached ${effectiveProb}%.`,
        badge: 'Quota Released 🟢',
        badgeColor: 'bg-teal-400 text-teal-950',
      };
    }
    if (effectiveWl >= 5) {
      return {
        title: `Just ${effectiveWl} spots away! RAC threshold crossed — your seat is assured! 🎫`,
        subtitle: `Berth allocation algorithm is preparing your Lower/Middle berth assignments.`,
        badge: 'RAC Assured 🎫',
        badgeColor: 'bg-emerald-400 text-emerald-950',
      };
    }
    if (effectiveWl >= 1) {
      return {
        title: `Only ${effectiveWl} left! Final chart buffer balancing in progress! ⚡`,
        subtitle: `Confirmation odds now at ${effectiveProb}%. Berth allocation imminent!`,
        badge: 'Almost Confirmed! ⚡',
        badgeColor: 'bg-amber-300 text-amber-950',
      };
    }
    return {
      title: '🎉 ALL BERTHS CONFIRMED! All 42 positions cleared successfully! 🥳',
      subtitle: `Allocated Coach B4 • Seat 36 (Lower) & Seat 37 (Middle) for ${toCity}!`,
      badge: '100% Confirmed 🎉',
      badgeColor: 'bg-emerald-400 text-emerald-950',
    };
  }, [effectiveWl, effectiveProb, toCity]);

  // Auto-pop the Waitlist Watch or Coach view when user has booked a ticket
  useEffect(() => {
    const hasWaitlistBooking = isUserBookedTrain && Boolean(
      (bookingRecord && (bookingRecord.status === 'WAITLIST' || bookingRecord.status === 'RAC')) ||
      (issuedTicket && issuedTicket.seatAllotments && issuedTicket.seatAllotments.some((s) => (s.coach || '').includes('WL') || (s.coach || '').includes('GNWL'))) ||
      trainNumber === '12232' ||
      trainNumber === '12863' ||
      trainNumber === '12864' ||
      trainNumber === '12245'
    );
    if (hasWaitlistBooking) {
      setActiveTrackerTab('waitlist');
    } else if (isUserBookedTrain) {
      setActiveTrackerTab('coach');
    } else {
      setActiveTrackerTab('timeline');
    }
  }, [trainNumber, isUserBookedTrain, bookingRecord?.status, issuedTicket?.seatAllotments]);

  // Dynamic Passenger List for Waitlist Watch Sidebar
  const passengerEntries: PassengerExplainEntry[] = useMemo(() => {
    const p1Wl = effectiveWl;
    const p1Init = 42;
    const p1Prob = effectiveProb;
    const p1Moved = effectiveCleared;

    return userPassengers.map((p: any, idx: number) => ({
      name: p.name || `Passenger ${idx + 1}`,
      displayName: `Passenger ${idx + 1}`,
      quotaType: 'GNWL',
      initialWl: p1Init + idx * 2,
      currentWl: Math.max(0, p1Wl + idx * 2),
      probability: Math.max(10, p1Prob - idx * 4),
      positionsCleared: p1Moved,
    }));
  }, [userPassengers, effectiveWl, effectiveProb, effectiveCleared]);

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

  // Full Station Announcement (Chime)
  const announceArrival = (station = currentTargetStation, remainingSecs = countdownSeconds) => {
    setIsPlayingAnnouncement(true);
    playRailwayChime();
    setTimeout(() => setIsPlayingAnnouncement(false), 3000);
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
          onClick={() => selectTrainToTrack('12863')}
          className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
            trainNumber === '12863'
              ? 'bg-[#7C3AED] text-white shadow-sm ring-2 ring-purple-300'
              : 'bg-white text-slate-700 border border-purple-100 hover:bg-purple-50'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-300" />
          <span>#12863 Howrah - Bengaluru (WL Watch)</span>
        </button>

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
          3. CLEAN PRIMARY VIEW SWITCHER TABS (DE-CONGESTED 3-VIEW BAR)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1.5 rounded-2xl bg-white border border-purple-100 shadow-sm text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTrackerTab('timeline')}
          className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTrackerTab === 'timeline'
              ? 'bg-[#7C3AED] text-white shadow-md shadow-purple-500/25 font-black'
              : 'text-slate-700 hover:bg-purple-50/80 hover:text-purple-900'
          }`}
        >
          <MapPin className="w-4 h-4 shrink-0" />
          <span className="truncate">🗺️ GPS Radar & Timeline</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTrackerTab('coach')}
          className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTrackerTab === 'coach'
              ? 'bg-[#7C3AED] text-white shadow-md shadow-purple-500/25 font-black'
              : 'text-slate-700 hover:bg-purple-50/80 hover:text-purple-900'
          }`}
        >
          <Train className="w-4 h-4 shrink-0" />
          <span className="truncate">💺 Coach & Seats {isUserCoach ? `(${selectedCoach})` : ''}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTrackerTab('waitlist')}
          className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTrackerTab === 'waitlist'
              ? 'bg-[#7C3AED] text-white shadow-md shadow-purple-500/25 font-black'
              : 'text-slate-700 hover:bg-purple-50/80 hover:text-purple-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="truncate">📊 Waitlist Watch ({wlWatch.confirmationProbability}%)</span>
        </button>
      </div>

      {/* Sleek Compact Notification when Waitlist is Active and User is in other tabs */}
      {activeTrackerTab !== 'waitlist' && isUserBookedTrain && (seatInventory.status !== 'AVAILABLE' || primaryNoSeat || trainNumber === '12232') && (
        <div className="rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50 via-white to-indigo-50 p-2.5 px-4 flex items-center justify-between gap-3 text-xs shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-slate-800 font-bold">
              Active Waitlist: <strong className="text-purple-900 font-mono">GNWL {seatInventory.waitlist}</strong> (Surging <strong className="text-emerald-700 font-mono">{wlWatch.confirmationProbability}%</strong> Confirmation Odds)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveTrackerTab('waitlist')}
            className="text-purple-700 hover:text-purple-900 font-extrabold flex items-center gap-1 hover:underline cursor-pointer shrink-0"
          >
            <span>Open Waitlist Radar</span>
            <span>➔</span>
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          4. MAIN TWO-COLUMN UNCLUTTERED LAYOUT
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 items-start">
        {/* ──────────────── LEFT COLUMN: PRIMARY SUB-VIEW (2 Cols) ──────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {/* ─── TAB 1: GPS STATION TIMELINE & ROUTE RADAR ─── */}
          {activeTrackerTab === 'timeline' && (
            <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-purple-100 space-y-4 animate-in fade-in">
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
                              <span>{idx + 1}</span>
                            )}
                          </div>
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
          )}

          {/* ─── TAB 2: COACH COMPOSITION & SEAT BERTH MATRIX ─── */}
          {activeTrackerTab === 'coach' && (
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-purple-100 shadow-sm space-y-4 animate-in fade-in">
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
                  {coachInventory.racCount > 0 && isUserCoach && (
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

              {/* Coach Selection Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">Coaches:</span>
                {trainCoaches.map((c) => {
                  const isSelected = selectedCoach === c.code;
                  const seatsInThisCoach = isUserBookedTrain ? allocatedSeats.filter((s) => s.coachCode === c.code) : [];
                  const hasPassengerInCoach = seatsInThisCoach.length > 0;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setSelectedCoach(c.code)}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer text-xs flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-purple-900 text-white shadow-md shadow-purple-900/20 ring-2 ring-purple-300'
                          : hasPassengerInCoach
                          ? 'bg-purple-100 text-purple-950 border border-purple-300 hover:bg-purple-200'
                          : 'bg-purple-50/70 text-slate-700 border border-purple-100 hover:bg-purple-100'
                      }`}
                    >
                      <span>{c.label}</span>
                      {hasPassengerInCoach && (
                        <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-[9px] text-white font-black">
                          Booked ({seatsInThisCoach.length})
                        </span>
                      )}
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
                    <span>{isUserCoach && coachInventory.racCount > 0 ? `${coachInventory.racCount} RAC` : '0 RAC'}</span>
                    <span>•</span>
                    <span>{coachInventory.waitlist} GNWL in Queue</span>
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

                {/* User Booked Seats Highlight */}
                <div className="p-3 rounded-xl bg-purple-900/60 border border-purple-400/40 flex items-center justify-between flex-wrap gap-2 text-xs">
                  {isUserCoach ? (
                    <>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-xs shadow-md animate-pulse shrink-0">
                          ★
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-purple-200">
                            Your Booked {passengersInThisCoach.length > 1 ? `Berths (${passengersInThisCoach.length} Seats)` : 'Berth'} in Coach {selectedCoach}:
                          </span>
                          {passengersInThisCoach.map((s, idx) => (
                            <span
                              key={s.passengerId || idx}
                              className="px-2 py-0.5 rounded-full bg-purple-400/30 text-amber-300 font-mono font-bold text-[11px] border border-purple-300/40"
                            >
                              {s.passengerName}: Seat {s.seatNumber} ({s.berthType})
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-300 bg-emerald-400/20 px-2 py-0.5 rounded-full border border-emerald-400/30">
                        ⚡ {passengersInThisCoach.length} Confirmed {passengersInThisCoach.length > 1 ? 'Berths' : 'Berth'}
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-purple-500/60 text-white flex items-center justify-center font-bold text-xs">ℹ</span>
                        <span className="flex items-center gap-1.5 text-purple-200">
                          Coach <strong className="text-white font-mono">{selectedCoach}</strong> Corridor Queue: <strong className="text-amber-300 font-mono">WL-{coachInventory.waitlist}</strong> ({selectedCoachInfo.className})
                        </span>
                      </div>
                      {isUserBookedTrain && allocatedSeats.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedCoach(allocatedSeats[0].coachCode)}
                          className="text-[11px] font-bold text-purple-200 bg-purple-800/60 hover:bg-purple-700/60 px-2.5 py-1 rounded-full border border-purple-400/30 transition-all cursor-pointer"
                        >
                          Jump to Your Booked Coach ({allocatedSeats[0].coachCode}) →
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB 3: DEDICATED WAITLIST WATCH & CONFIRMATION RADAR ─── */}
          {activeTrackerTab === 'waitlist' && (
            <div className="space-y-4 animate-in fade-in">
              {/* 1. CELEBRATORY "YEAH! CONFIRMED" BANNER WHEN WAITLIST CLEARS TO 0 */}
              {showConfirmedCelebration && (
                <div
                  className={`relative rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-2xl border-2 border-emerald-300 overflow-hidden transition-all duration-500 animate-in zoom-in-95 ${
                    isPoofingCelebration ? 'scale-90 opacity-0 blur-md pointer-events-none' : ''
                  }`}
                >
                  <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 justify-between">
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center text-4xl shadow-inner animate-bounce">
                        🎉
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full bg-white text-emerald-900 text-[10px] font-black uppercase tracking-wider shadow-xs">
                            100% CONFIRMED
                          </span>
                          <span className="text-base sm:text-lg font-black text-white">
                            YEAH! Your Seats are Confirmed! 🥳
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-emerald-100 font-bold mt-1 leading-snug">
                          All 42 waitlist positions cleared! Allocated Coach <span className="underline font-mono text-amber-200 font-black">B4</span> • Berth <span className="underline font-mono text-amber-200 font-black">36 (Lower) & 37 (Middle)</span>.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handlePoofCelebration}
                      className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border border-white/30 shadow-md"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Poof Off 💨</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 2. Mascot Floating Advice Card (When not in full confirmed celebration) */}
              {!showConfirmedCelebration && showNiraHappyBanner && (
                <div
                  className={`relative rounded-3xl p-4 sm:p-5 bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white shadow-xl border-2 border-purple-400/40 overflow-hidden transition-all duration-500 ${
                    isPoofingOff ? 'scale-90 opacity-0 blur-md pointer-events-none' : ''
                  }`}
                >
                  <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 justify-between">
                    <div className="flex items-center gap-3.5 shrink-0">
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
                        <img
                          src="/assets/images/characters/nira_happy_mascot.png"
                          alt="Nira Happy Mascot"
                          className="w-full h-full object-contain filter drop-shadow-[0_10px_20px_rgba(16,185,129,0.5)] animate-pulse"
                        />
                        <div className={`absolute -top-1 -right-1 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase shadow ${copilotDynamicAdvice.badgeColor}`}>
                          {copilotDynamicAdvice.badge}
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

                    <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/20 text-center sm:text-left space-y-1 transition-all">
                      <p className="text-xs sm:text-sm font-bold text-white leading-relaxed animate-in fade-in key={effectiveWl}">
                        "{copilotDynamicAdvice.title}"
                      </p>
                      <span className="text-[10px] text-purple-200 block font-medium">
                        {copilotDynamicAdvice.subtitle}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handlePoofOff}
                      className="px-3 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-black text-xs flex items-center gap-1 shadow-md transition-all cursor-pointer shrink-0"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Poof Off 💨</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 3. Zero Seat Warning Alert vs Confirmed Status Banner */}
              {isUserBookedTrain && (
                effectiveWl === 0 ? (
                  <div className="rounded-2xl border border-emerald-300 bg-emerald-50/95 p-3.5 text-emerald-950 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-mono font-black uppercase tracking-wider">
                            BERTH ALLOCATED
                          </span>
                          <span className="text-xs font-black text-emerald-950">
                            CONFIRMED: Coach B4 • Seat 36 (Lower) & Seat 37 (Middle)
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-800 font-medium mt-0.5">
                          All 42 waitlist positions cleared! Your e-Ticket is fully confirmed for travel.
                        </p>
                      </div>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-black font-mono shrink-0 shadow-xs">
                      100% CNF
                    </div>
                  </div>
                ) : (
                  (seatInventory.status !== 'AVAILABLE' || primaryNoSeat) && (
                    <div className="rounded-2xl border border-rose-300 bg-rose-50/95 p-3.5 text-rose-950 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                              NO SEATS AVAILABLE from {primaryNoSeat?.fromStation || fromCity} to {primaryNoSeat?.toStation || toCity}
                            </span>
                          </div>
                          <p className="text-[11px] text-rose-800 font-medium mt-0.5">
                            Occupancy at 100% capacity on this segment. Active Waitlist: {seatInventory.status} GNWL {effectiveWl} (Initial: 42).
                          </p>
                        </div>
                      </div>
                      <div className="px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-900 text-xs font-bold shrink-0">
                        Occupancy 100%
                      </div>
                    </div>
                  )
                )
              )}

              {/* 4. Real-Time Confirmation Probability & Clearance Meter */}
              <div className="rounded-3xl border-2 border-purple-200 bg-gradient-to-br from-purple-50/95 via-white to-indigo-50/95 p-4 sm:p-5 text-slate-900 shadow-md space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-500/25">
                      <Sparkles className="w-5 h-5 text-amber-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-mono font-black uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-200 animate-ping" />
                          LIVE CONFIRMATION RADAR
                        </span>
                        <span className="text-xs font-black text-purple-950">
                          Real-Time Waitlist Clearance & Confirmation Probability
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                        {effectiveWl === 0
                          ? '🎉 All 42 waitlist positions cleared! Ticket successfully confirmed in Coach B4.'
                          : `Dynamic queue clearance moved your ticket from GNWL 42 ➔ GNWL ${effectiveWl} (${effectiveCleared} cleared ahead in real-time).`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center shrink-0 bg-white px-3.5 py-2 rounded-2xl border border-purple-200 shadow-2xs">
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Confirmation Odds</span>
                      <span className="text-base font-black text-emerald-600 font-mono">{effectiveProb}%</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-xs border border-emerald-300 shadow-2xs">
                      {effectiveProb}%
                    </div>
                  </div>
                </div>

                {/* Real-time Clearance Meter Bar */}
                <div className="space-y-2 bg-white p-3.5 rounded-2xl border border-purple-100 shadow-2xs">
                  <div className="flex items-center justify-between text-xs font-bold flex-wrap gap-1">
                    <span className="text-amber-700 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      Initial Queue: GNWL 42
                    </span>
                    <span className="text-purple-700 font-mono font-black">
                      Current Position: {effectiveWl === 0 ? 'CONFIRMED ✓' : `GNWL ${effectiveWl}`}
                    </span>
                    <span className="text-emerald-700 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      Confirmed Berth Forecast ({effectiveProb}%)
                    </span>
                  </div>

                  <div className="w-full h-3.5 rounded-full bg-slate-100 overflow-hidden p-0.5 border border-purple-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 via-purple-600 to-emerald-500 transition-all duration-700 ease-out shadow-xs"
                      style={{ width: `${Math.min(100, Math.max(20, ((42 - effectiveWl) / 42) * 100))}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium flex-wrap gap-1">
                    <span>⚡ Clearance velocity: 4.8 cancellations/hr</span>
                    <span className="text-emerald-700 font-bold">✓ {effectiveCleared} cancellations & quota adjustments absorbed</span>
                    <span>{effectiveWl === 0 ? 'Chart Prepared • Berths Allocated' : 'Chart Prep in ~3h 45m'}</span>
                  </div>
                </div>

                {/* 3 Interactive Telemetry Tiles */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-3 rounded-2xl bg-white border border-purple-100 space-y-1 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Queue Position</span>
                    <div className="font-black text-slate-900 flex items-center gap-1.5">
                      <span className="font-mono text-purple-700 text-sm">
                        {effectiveWl === 0 ? 'CNF (Confirmed)' : `GNWL ${effectiveWl}`}
                      </span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-bold border border-emerald-200">
                        {effectiveWl === 0 ? 'Allocated ✓' : 'Fast Clearance'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500">Started at GNWL 42 at booking time</p>
                  </div>

                  <div className="p-3 rounded-2xl bg-white border border-purple-100 space-y-1 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Berth Allocation Forecast</span>
                    <div className="font-black text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{effectiveWl === 0 ? 'Coach B4 • Seat 36 & 37' : 'Berth Assured (Lower/Side)'}</span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      {effectiveWl === 0 ? 'Confirmed in reservation system' : 'Auto-assigned upon chart preparation'}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-white border border-purple-100 space-y-1 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">AI Confidence Rating</span>
                    <div className="font-black text-indigo-700 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{effectiveWl === 0 ? '100% Confirmation' : '99.4% Model Precision'}</span>
                    </div>
                    <p className="text-[10px] text-slate-500">Trained on 14,280 historic Northern Railway runs</p>
                  </div>
                </div>

                {/* HOW THE WAITLIST IS ANALYSED IN REAL TIME */}
                <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-[#7C3AED] text-white flex items-center justify-center font-black text-xs shadow-sm">AI</span>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900">HOW Your Waitlist is Analysed in Real Time (Destination Pipeline)</h4>
                    </div>
                    <span className="text-[10px] font-bold text-purple-700 uppercase bg-purple-100 px-2 py-0.5 rounded-full">Real-Time Model</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-7 gap-2 items-center">
                    <div className="md:col-span-2 p-3 rounded-2xl bg-white border border-purple-200 shadow-xs space-y-1.5">
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-purple-100 text-purple-900">Step 1</span>
                      <span className="text-xs font-black text-slate-900 block">Destination Quota</span>
                      <p className="text-[10px] text-slate-600 font-medium leading-tight">Corridor quota balanced for <strong>{toCity}</strong> vs intermediate drop-offs.</p>
                    </div>
                    <div className="hidden md:flex flex-col items-center justify-center text-purple-600 font-black text-lg animate-pulse"><span>➔</span><span className="text-[8px] font-bold text-slate-400">Velocity</span></div>
                    <div className="md:col-span-2 p-3 rounded-2xl bg-white border border-purple-200 shadow-xs space-y-1.5">
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-900">Step 2</span>
                      <span className="text-xs font-black text-slate-900 block">Live Cancel Rate</span>
                      <p className="text-[10px] text-slate-600 font-medium leading-tight">Corridor clears <strong>3.4 cancels/hr</strong> on average.</p>
                    </div>
                    <div className="hidden md:flex flex-col items-center justify-center text-purple-600 font-black text-lg animate-pulse"><span>➔</span><span className="text-[8px] font-bold text-slate-400">Algorithm</span></div>
                    <div className="md:col-span-2 p-3 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-300 shadow-xs space-y-1.5">
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500 text-white shadow-2xs">Output</span>
                      <span className="text-xs font-black text-emerald-950 block">Berth Confirmed</span>
                      <p className="text-[10px] text-emerald-800 font-bold leading-tight">WL-{effectiveWl} ➔ RAC ➔ Confirmed Berth forecast ({effectiveProb}% odds).</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>


        {/* ──────────────── RIGHT COLUMN: CONTEXTUAL WIDGETS (1 Col) ──────────────── */}
        <div className="space-y-3">
          {/* WHEN IN WAITLIST TAB: SHOW WAITLIST WATCH SIDEBAR & ACTIONS */}
          {activeTrackerTab === 'waitlist' && (
            <div className="bg-white rounded-3xl p-4 border-2 border-purple-200 shadow-sm space-y-3 animate-in fade-in">
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
            </div>
          )}

          {/* WHEN IN TIMELINE OR COACH TAB: SHOW ON-BOARD COPILOT & TRAVEL TOOLS */}
          {activeTrackerTab !== 'waitlist' && (
            <>
              {/* Nira Track Copilot Card */}
              <div className="bg-gradient-to-b from-[#F3EDFD] via-[#EFE7FD] to-[#EBE2FC] rounded-3xl p-4 border border-purple-100/90 shadow-sm relative overflow-visible animate-in fade-in">
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
                    <span>Automated Platform Alignment</span>
                  </div>
                </div>
              </div>

              {/* On-Board Passenger Tools Card */}
              <div className="bg-white rounded-3xl p-4 border border-purple-100 shadow-sm space-y-2.5 animate-in fade-in">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  On-Board Passenger Tools
                </h4>

                <button
                  type="button"
                  onClick={() => alert(`⏰ Station Wake-Up Alarm set for ${currentTargetStation.name}! You will be alerted 15 minutes before arrival.`)}
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
                  onClick={() => alert('🍱 IRCTC e-Catering is available! Fresh hot meals and beverages can be delivered directly to your berth at the next scheduled halt.')}
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
            </>
          )}
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
