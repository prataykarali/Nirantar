import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Activity,
  TrendingUp,
} from 'lucide-react';
import { useJourney, TicketRecord } from '../context/JourneyContext';
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
  getDynamicInitialWaitlist,
  calculateCalibratedProbability,
  generateDynamicTelemetryStages,
  parseWaitlistStatus,
} from '../utils/seatInventory';
import { Explain } from '../components/Explain';
import { explainMyTicket, PassengerExplainEntry, TicketExplanation } from '../utils/explainContext';
import { generateTrainCoaches } from '../utils/trainCoachGenerator';
import { WakeUpAlarmModal } from '../components/journey/WakeUpAlarmModal';
import { ShareTripModal } from '../components/journey/ShareTripModal';
import { OrderFoodModal } from '../components/journey/OrderFoodModal';
import { CoachSegmentShowcase } from '../components/journey/CoachSegmentShowcase';

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
};

// ─── CUSTOM TRAIN SVGS ───
const VandeBharatSvg: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M2.5 14.5C2.5 10 5.5 7 11.5 7H18.5C20.5 7 21.5 8.5 21.5 11V15C21.5 17 20 18 18 18H4.5C3.4 18 2.5 17.1 2.5 16V14.5Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15 10H19C19.8 10 20.5 10.7 20.5 11.5V13H15V10Z" fill="currentColor"/>
    <path d="M6.5 10H11.5V13H6.5V10Z" fill="currentColor"/>
    <circle cx="6.5" cy="18" r="1.5" fill="currentColor"/>
    <circle cx="17.5" cy="18" r="1.5" fill="currentColor"/>
    <path d="M11 4L13.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const RajdhaniSvg: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="2.5" y="6.5" width="19" height="10.5" rx="2.5" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M2.5 12H21.5" stroke="currentColor" strokeWidth="1.2"/>
    <rect x="5" y="8" width="3" height="2.5" rx="0.5" fill="currentColor"/>
    <rect x="16" y="8" width="3" height="2.5" rx="0.5" fill="currentColor"/>
    <circle cx="6.5" cy="17" r="1.5" fill="currentColor"/>
    <circle cx="17.5" cy="17" r="1.5" fill="currentColor"/>
    <path d="M8.5 3.5L10.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M15.5 3.5L13.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const ExpressLocoSvg: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M3.5 15.5V8.5C3.5 7.4 4.4 6.5 5.5 6.5H16.5C17.6 6.5 18.5 7.4 18.5 8.5V15.5H3.5Z" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.8"/>
    <rect x="6" y="8.5" width="3.5" height="3" rx="0.5" fill="currentColor"/>
    <rect x="12.5" y="8.5" width="3.5" height="3" rx="0.5" fill="currentColor"/>
    <path d="M1.5 18.5H22.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="7" cy="15.5" r="1.5" fill="currentColor"/>
    <circle cx="15" cy="15.5" r="1.5" fill="currentColor"/>
  </svg>
);

interface RadarTrainPreset {
  number: string;
  name: string;
  category: 'Vande Bharat' | 'Rajdhani' | 'Shatabdi' | 'Superfast';
  fromCity: string;
  fromCode: string;
  toCity: string;
  toCode: string;
  tag?: string;
}

const RADAR_TRAIN_PRESETS: RadarTrainPreset[] = [
  {
    number: '12863',
    name: 'Howrah - SMVB SF',
    category: 'Superfast',
    fromCity: 'Howrah',
    fromCode: 'HWH',
    toCity: 'Bengaluru',
    toCode: 'SMVB',
    tag: 'Daily SF',
  },
  {
    number: '12232',
    name: 'Chandigarh - Lucknow SF',
    category: 'Superfast',
    fromCity: 'Chandigarh',
    fromCode: 'CDG',
    toCity: 'Lucknow',
    toCode: 'LKO',
    tag: 'Express',
  },
  {
    number: '12302',
    name: 'Howrah Rajdhani',
    category: 'Rajdhani',
    fromCity: 'New Delhi',
    fromCode: 'NDLS',
    toCity: 'Howrah',
    toCode: 'HWH',
    tag: 'Fastest',
  },
  {
    number: '12951',
    name: 'Mumbai Rajdhani',
    category: 'Rajdhani',
    fromCity: 'Mumbai',
    fromCode: 'MMCT',
    toCity: 'New Delhi',
    toCode: 'NDLS',
    tag: 'High Speed',
  },
  {
    number: '22436',
    name: 'Varanasi Vande Bharat',
    category: 'Vande Bharat',
    fromCity: 'New Delhi',
    fromCode: 'NDLS',
    toCity: 'Varanasi',
    toCode: 'BSB',
    tag: 'Top Rated',
  },
  {
    number: '12002',
    name: 'Bhopal Shatabdi',
    category: 'Shatabdi',
    fromCity: 'New Delhi',
    fromCode: 'NDLS',
    toCity: 'Bhopal',
    toCode: 'RKMP',
    tag: 'Express',
  },
  {
    number: '20835',
    name: 'Puri Vande Bharat',
    category: 'Vande Bharat',
    fromCity: 'Puri',
    fromCode: 'PURI',
    toCity: 'Rourkela',
    toCode: 'ROU',
    tag: 'Vande Bharat',
  },
  {
    number: '12115',
    name: 'Siddheshwar SF',
    category: 'Superfast',
    fromCity: 'Mumbai',
    fromCode: 'CSMT',
    toCity: 'Solapur',
    toCode: 'SUR',
    tag: 'Overnight',
  },
  {
    number: '22692',
    name: 'Bengaluru Rajdhani',
    category: 'Rajdhani',
    fromCity: 'Delhi',
    fromCode: 'NZM',
    toCity: 'Bengaluru',
    toCode: 'SBC',
    tag: 'Superfast',
  },
];

export const JourneyTrackerPage: React.FC = () => {
  const {
    trackQuery,
    setTrackQuery,
    selectedTrain,
    issuedTicket,
    setIssuedTicket,
    bookingRecord,
    passengers,
    selectedClassCode,
    searchParams,
    showChatDrawer,
    setShowChatDrawer,
    addNotification,
    navigateTo,
    preferredTrackerTab,
    setPreferredTrackerTab,
    bookedTicketsList,
    setBookedTicketsList,
  } = useJourney();

  const initialTrainNumber = trackQuery || selectedTrain?.trainNumber || issuedTicket?.train?.trainNumber || '12951';
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
  const [showWakeUpModal, setShowWakeUpModal] = useState<boolean>(false);
  const [showShareTripModal, setShowShareTripModal] = useState<boolean>(false);
  const [showOrderFoodModal, setShowOrderFoodModal] = useState<boolean>(false);
  const [activeAlarm, setActiveAlarm] = useState<{ station: string; leadMinutes: number } | null>(null);
  const [showNiraHappyBanner, setShowNiraHappyBanner] = useState<boolean>(true);
  const [isPoofingOff, setIsPoofingOff] = useState<boolean>(false);
  const [activeTrackerTab, setActiveTrackerTab] = useState<'timeline' | 'coach' | 'waitlist'>(() => {
    if (preferredTrackerTab) return preferredTrackerTab;
    return 'timeline';
  });

  useEffect(() => {
    if (preferredTrackerTab) {
      setActiveTrackerTab(preferredTrackerTab);
    }
  }, [preferredTrackerTab]);

  // ─── DYNAMIC TRAIN IDENTITY & ROUTE RESOLUTION ───
  const trainNumber = activeTrainNumber.trim() || '12951';
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

  // Dynamic Coach List based on authentic train composition & classes
  const trainCoaches: CoachInfo[] = useMemo(() => {
    return generateTrainCoaches(trainNumber, foundTrain?.trainType, foundTrain?.classes);
  }, [trainNumber, foundTrain]);

  // Check if current tracked train is booked by this passenger
  const isUserBookedTrain = useMemo(() => {
    if (issuedTicket && issuedTicket.status !== 'CANCELLED') {
      return issuedTicket.train?.trainNumber === trainNumber;
    }
    if (bookingRecord && bookingRecord.status !== 'CANCELLED') {
      return bookingRecord.trainNumber === trainNumber;
    }
    // Only default to 12951 if user has never booked any custom ticket
    return trainNumber === '12951';
  }, [issuedTicket, bookingRecord, trainNumber]);

  // Real booked passengers from Citizen profile / ticket database
  const userPassengers = useMemo(() => {
    if (!isUserBookedTrain) return [];
    if (issuedTicket && issuedTicket.train?.trainNumber === trainNumber && issuedTicket.passengers && issuedTicket.passengers.length > 0) {
      return issuedTicket.passengers;
    }
    if (bookingRecord && bookingRecord.trainNumber === trainNumber) {
      return [{
        id: 'pax-1',
        name: bookingRecord.passengerName || 'Pratay Karali',
        age: 26,
        gender: 'Male',
        berthPreference: 'Lower Berth (LB)',
        classCode: '3A',
        status: 'CONFIRMED',
      }];
    }
    if (trainNumber === '12951' && !issuedTicket && !bookingRecord) {
      return [
        { id: 'pax-1', name: 'Pratay Karali (You)', age: 26, gender: 'Male', berthPreference: 'Lower Berth (LB)', classCode: '3A', status: 'CONFIRMED' },
        { id: 'pax-2', name: 'Rahul Sharma', age: 28, gender: 'Male', berthPreference: 'Middle Berth (MB)', classCode: '3A', status: 'CONFIRMED' }
      ];
    }
    return [];
  }, [isUserBookedTrain, issuedTicket, bookingRecord, trainNumber]);

  // User's allocated seats across specific coaches (e.g. Coach B4 for 3A)
  const allocatedSeats = useMemo(() => {
    if (!isUserBookedTrain) return [];

    // Helper to check if a coach code is a real coach (not WL/GNWL)
    const isRealCoach = (coach: string) => !coach.includes('WL') && !coach.includes('GNWL') && !coach.includes('RAC');

    // 1. Check issuedTicket first
    if (issuedTicket && issuedTicket.train?.trainNumber === trainNumber && issuedTicket.seatAllotments && issuedTicket.seatAllotments.length > 0) {
      const realSeats = issuedTicket.seatAllotments
        .map((s, idx) => ({
          coachCode: s.coach,
          seatNumber: s.seatNumber,
          berthType: s.berthType,
          passengerName: issuedTicket.passengers?.[idx]?.name || (passengers[idx]?.name) || `Passenger ${idx + 1}`,
        }))
        .filter((s) => isRealCoach(s.coachCode));
      if (realSeats.length > 0) return realSeats;
    }

    // 2. Check bookedTicketsList for this train
    const bookedMatch = (bookedTicketsList || []).find((t) => t.train?.trainNumber === trainNumber);
    if (bookedMatch && bookedMatch.seatAllotments && bookedMatch.seatAllotments.length > 0) {
      const realSeats = bookedMatch.seatAllotments
        .map((s, idx) => ({
          coachCode: s.coach,
          seatNumber: s.seatNumber,
          berthType: s.berthType,
          passengerName: bookedMatch.passengers?.[idx]?.name || `Passenger ${idx + 1}`,
        }))
        .filter((s) => isRealCoach(s.coachCode));
      if (realSeats.length > 0) return realSeats;
    }

    // 3. Check bookingRecord
    if (bookingRecord && bookingRecord.trainNumber === trainNumber && bookingRecord.seatAllotment && isRealCoach(bookingRecord.seatAllotment.coach)) {
      return [{
        coachCode: bookingRecord.seatAllotment.coach,
        seatNumber: bookingRecord.seatAllotment.seatNumber,
        berthType: bookingRecord.seatAllotment.berthType,
        passengerName: bookingRecord.passengerName || 'Passenger 1',
      }];
    }

    // 4. Dynamic allocation (never hardcode seat numbers)
    return allocatePassengerSeats(userPassengers, userBookedClass);
  }, [isUserBookedTrain, issuedTicket, bookingRecord, trainNumber, userPassengers, userBookedClass, passengers, bookedTicketsList]);

  // Auto-focus user's booked coach by default
  useEffect(() => {
    if (isUserBookedTrain && allocatedSeats.length > 0) {
      const bookedCoach = allocatedSeats[0].coachCode;
      if (bookedCoach && !bookedCoach.includes('WL') && trainCoaches.some((c) => c.code === bookedCoach)) {
        setSelectedCoach(bookedCoach);
        return;
      }
    }
    if (trainCoaches.length > 0 && !trainCoaches.some((c) => c.code === selectedCoach)) {
      setSelectedCoach(trainCoaches[0].code);
    }
  }, [isUserBookedTrain, allocatedSeats, trainCoaches, selectedCoach]);

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

  // Real-Time Waitlist Clearance ONLY for actual waitlisted bookings (disappears if confirmed)
  const isWaitlistBooking = useMemo(() => {
    if (!isUserBookedTrain) return false;

    // If already marked confirmed in storage for this train, it is no longer on waitlist!
    try {
      if (localStorage.getItem(`nirantar_wl_confirmed_${trainNumber}`) === 'true') {
        return false;
      }
    } catch {}
    
    // Check issuedTicket status
    if (issuedTicket && (issuedTicket.train?.trainNumber === trainNumber || trainNumber === '12951')) {
      if (issuedTicket.status === 'CANCELLED') return false;
      if ((issuedTicket.status as string) === 'CONFIRMED' || issuedTicket.status === 'ACTIVE') return false;
      const hasWLSeat = issuedTicket.seatAllotments?.some((s) => (s.coach || '').includes('WL') || (s.berthType || '').includes('WL'));
      if (hasWLSeat || (issuedTicket.status as any) === 'WAITLIST' || (issuedTicket.status as any) === 'RAC') return true;
      return false;
    }

    // Check bookingRecord status
    if (bookingRecord && bookingRecord.trainNumber === trainNumber) {
      if (bookingRecord.status === 'CANCELLED') return false;
      if (bookingRecord.status === 'CONFIRMED') return false;
      const hasWLSeat = (bookingRecord.seatAllotment?.coach || '').includes('WL') || (bookingRecord.seatAllotment?.berthType || '').includes('WL');
      if (bookingRecord.status === 'WAITLIST' || bookingRecord.status === 'RAC' || hasWLSeat) return true;
      return false;
    }

    // Default pre-confirmed journeys (e.g. 12951) are CONFIRMED
    return false;
  }, [isUserBookedTrain, issuedTicket, bookingRecord, trainNumber]);

  const parsedWaitlistInfo = useMemo(() => {
    if (!isWaitlistBooking) {
      return { initialWl: 0, quotaType: 'GNWL' };
    }
    const rawStatus =
      issuedTicket?.seatAllotments?.[0]?.berthType ||
      bookingRecord?.seatAllotment?.berthType ||
      'WL-12';
    const parsed = parseWaitlistStatus(rawStatus);
    return {
      initialWl: parsed.number > 0 ? parsed.number : 12,
      quotaType: parsed.quotaType || 'GNWL',
    };
  }, [isWaitlistBooking, issuedTicket, bookingRecord]);

  const initialWaitlistNumber = isWaitlistBooking ? parsedWaitlistInfo.initialWl : 0;
  const initialQuotaType = parsedWaitlistInfo.quotaType || 'GNWL';

  const [simulatedWl, setSimulatedWl] = useState<number>(() => (isWaitlistBooking ? initialWaitlistNumber : 0));
  const [showConfirmedCelebration, setShowConfirmedCelebration] = useState<boolean>(false);
  const [isPoofingCelebration, setIsPoofingCelebration] = useState<boolean>(false);
  const [isSimPaused, setIsSimPaused] = useState<boolean>(false);
  const [simIndex, setSimIndex] = useState<number>(0);
  const [simStatusMsg, setSimStatusMsg] = useState<string>('Corridor radar active: scanning cancellation queue...');

  // Helper to permanently confirm waitlist in storage and context
  const confirmWaitlistPermanently = useCallback(() => {
    try {
      localStorage.setItem(`nirantar_wl_confirmed_${trainNumber}`, 'true');
    } catch {}

    if (issuedTicket && (issuedTicket.train?.trainNumber === trainNumber || trainNumber === '12951')) {
      // Use dynamic seat allocation based on ticket PNR + class (NOT hardcoded seats)
      const classCode = issuedTicket.classCode || '3A';
      const dynamicAllotments = allocatePassengerSeats(
        issuedTicket.passengers || [{ id: 'p1', name: 'Passenger 1' }],
        classCode,
        issuedTicket.pnrNumber || `cnf_${trainNumber}_${Date.now()}`
      );

      const updatedSeatAllotments = (issuedTicket.seatAllotments || []).map((s, idx) => {
        const allot = dynamicAllotments[idx];
        if (allot) {
          return {
            coach: allot.coachCode,
            seatNumber: allot.seatNumber,
            berthType: allot.berthType,
          };
        }
        // Fallback: use dynamic allocation seed rather than hardcoded 36
        return {
          coach: dynamicAllotments[0]?.coachCode || 'B4',
          seatNumber: (dynamicAllotments[0]?.seatNumber || 12) + idx,
          berthType: idx % 3 === 0 ? 'Lower Berth' : idx % 3 === 1 ? 'Middle Berth' : 'Upper Berth',
        };
      });

      const updatedTicket: TicketRecord = {
        ...issuedTicket,
        status: 'ACTIVE' as any,
        seatAllotments: updatedSeatAllotments.length > 0 ? updatedSeatAllotments : dynamicAllotments.map((a) => ({
          coach: a.coachCode,
          seatNumber: a.seatNumber,
          berthType: a.berthType,
        })),
      };
      setIssuedTicket(updatedTicket);

      // Also update in bookedTicketsList
      setBookedTicketsList((prev) => {
        return prev.map((t) =>
          t.train?.trainNumber === trainNumber || t.pnrNumber === issuedTicket.pnrNumber
            ? { ...t, status: 'ACTIVE' as any, seatAllotments: updatedTicket.seatAllotments }
            : t
        );
      });

      try {
        localStorage.setItem('nirantar_issued_ticket', JSON.stringify(updatedTicket));
      } catch {}
    }
  }, [trainNumber, issuedTicket, setIssuedTicket, setBookedTicketsList]);

  // Reset simulation when train or initial waitlist changes
  useEffect(() => {
    try {
      if (localStorage.getItem(`nirantar_wl_confirmed_${trainNumber}`) === 'true') {
        setSimulatedWl(0);
        return;
      }
    } catch {}

    if (isWaitlistBooking && initialWaitlistNumber > 0) {
      setSimulatedWl(initialWaitlistNumber);
      setSimIndex(0);
      setShowConfirmedCelebration(false);
      setIsPoofingCelebration(false);
    }
  }, [trainNumber, isWaitlistBooking, initialWaitlistNumber]);

  // Slower, highly realistic progressive telemetry sequence tailored to dynamic W0
  const SIM_SEQUENCE = useMemo(() => {
    if (!isWaitlistBooking || initialWaitlistNumber <= 0) return [];
    return generateDynamicTelemetryStages(initialWaitlistNumber, selectedCoachInfo.classCode, initialQuotaType);
  }, [isWaitlistBooking, initialWaitlistNumber, selectedCoachInfo.classCode, initialQuotaType]);

  useEffect(() => {
    if (!isWaitlistBooking || initialWaitlistNumber <= 0 || SIM_SEQUENCE.length === 0) {
      setSimulatedWl(0);
      return;
    }

    if (isSimPaused) return;
    if (simIndex >= SIM_SEQUENCE.length) return;

    const currentStage = SIM_SEQUENCE[simIndex];
    setSimStatusMsg(currentStage.msg);

    const timer = setTimeout(() => {
      setSimulatedWl(currentStage.wl);
      if (currentStage.wl === 0) {
        confirmWaitlistPermanently();
        setShowConfirmedCelebration(true);
        setTimeout(() => {
          setIsPoofingCelebration(true);
          setTimeout(() => {
            setShowConfirmedCelebration(false);
            setIsPoofingCelebration(false);
            setActiveTrackerTab('coach');
          }, 600);
        }, 4000);
      }
      setSimIndex((prev) => prev + 1);
    }, currentStage.delay);

    return () => clearTimeout(timer);
  }, [isWaitlistBooking, initialWaitlistNumber, isSimPaused, simIndex, SIM_SEQUENCE, confirmWaitlistPermanently]);

  const handleStepSim = () => {
    if (SIM_SEQUENCE.length === 0) return;
    const nextIdx = Math.min(SIM_SEQUENCE.length - 1, simIndex + 1);
    setSimIndex(nextIdx);
    setSimulatedWl(SIM_SEQUENCE[nextIdx].wl);
    setSimStatusMsg(SIM_SEQUENCE[nextIdx].msg);
    if (SIM_SEQUENCE[nextIdx].wl === 0) {
      confirmWaitlistPermanently();
      setShowConfirmedCelebration(true);
    }
  };

  const handleResetSim = () => {
    if (SIM_SEQUENCE.length === 0) return;
    try {
      localStorage.removeItem(`nirantar_wl_confirmed_${trainNumber}`);
    } catch {}
    setSimIndex(0);
    setSimulatedWl(initialWaitlistNumber);
    setSimStatusMsg(SIM_SEQUENCE[0]?.msg || 'Corridor radar active');
    setShowConfirmedCelebration(false);
    setIsPoofingCelebration(false);
  };

  const handleFastForwardSim = () => {
    if (SIM_SEQUENCE.length === 0) return;
    const lastIdx = SIM_SEQUENCE.length - 1;
    setSimIndex(lastIdx);
    setSimulatedWl(0);
    setSimStatusMsg(SIM_SEQUENCE[lastIdx]?.msg || 'Confirmed');
    confirmWaitlistPermanently();
    setShowConfirmedCelebration(true);
  };

  const handlePoofCelebration = () => {
    setIsPoofingCelebration(true);
    confirmWaitlistPermanently();
    setTimeout(() => {
      setShowConfirmedCelebration(false);
      setIsPoofingCelebration(false);
      setActiveTrackerTab('coach');
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

  // Passengers in this specific coach
  const passengersInThisCoach = useMemo(() => {
    return allocatedSeats.filter((s) => s.coachCode === selectedCoach);
  }, [allocatedSeats, selectedCoach]);

  const isUserCoach = Boolean(isUserBookedTrain && passengersInThisCoach.length > 0);

  const userSeatObjects = useMemo(() => {
    return passengersInThisCoach.map((s) => ({
      seatNumber: s.seatNumber,
      passengerName: s.passengerName,
    }));
  }, [passengersInThisCoach]);

  const coachBerthLayout = useMemo(() => {
    return getCoachBerthLayout(
      selectedCoachInfo.code,
      selectedCoachInfo.classCode,
      coachInventory.racCount,
      isUserCoach,
      userSeatObjects
    );
  }, [selectedCoachInfo.code, selectedCoachInfo.classCode, coachInventory.racCount, isUserCoach, userSeatObjects]);

  const seatClass = foundTrain?.classes?.find((c: any) => c.classCode === selectedCoachInfo.classCode) || foundTrain?.classes?.[0];

  const effectiveWl = isWaitlistBooking ? simulatedWl : coachInventory.waitlist;
  const effectiveCleared = isWaitlistBooking ? Math.max(0, initialWaitlistNumber - simulatedWl) : coachInventory.positionsCleared;
  const effectiveProb = isWaitlistBooking
    ? calculateCalibratedProbability(initialWaitlistNumber, simulatedWl, selectedCoachInfo.classCode, initialQuotaType)
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

  const isCurrentTrainWaitlisted = useMemo(() => {
    return isWaitlistBooking || seatInventory.status === 'WL' || seatInventory.waitlist > 0 || !!seatClass?.status?.includes('WL') || trainNumber === '12232' || trainNumber === '12863';
  }, [isWaitlistBooking, seatInventory.status, seatInventory.waitlist, seatClass?.status, trainNumber]);

  const noSeatSegments = useMemo(() => getNoSeatSegments(trainNumber, routeStations, 72, isCurrentTrainWaitlisted), [trainNumber, routeStations, isCurrentTrainWaitlisted]);
  const primaryNoSeat = noSeatSegments[0];

  const rawWlWatch = useMemo(() => {
    return getWaitlistWatchProjection(
      trainNumber,
      selectedCoachInfo.classCode,
      effectiveWl,
      comfortLevel,
      initialWaitlistNumber,
      initialQuotaType
    );
  }, [trainNumber, selectedCoachInfo.classCode, effectiveWl, comfortLevel, initialWaitlistNumber, initialQuotaType]);

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
    const w0 = Math.max(1, initialWaitlistNumber);
    const cleared = Math.max(0, w0 - effectiveWl);
    if (effectiveWl === 0) {
      return {
        title: `🎉 ALL BERTHS CONFIRMED! All ${w0} positions cleared successfully! 🥳`,
        subtitle: `Allocated Coach B4 • Seat 36 (Lower) & Seat 37 (Middle) for ${toCity}!`,
        badge: '100% Confirmed 🎉',
        badgeColor: 'bg-emerald-400 text-emerald-950',
      };
    }
    if (effectiveWl <= 2) {
      return {
        title: `Only ${effectiveWl} spot${effectiveWl === 1 ? '' : 's'} away! RAC threshold crossed — berth assured! 🎫`,
        subtitle: `Berth allocation algorithm is preparing your Lower/Middle berth assignments.`,
        badge: 'RAC Assured 🎫',
        badgeColor: 'bg-emerald-400 text-emerald-950',
      };
    }
    if (cleared > 0) {
      return {
        title: `Good news! ${cleared} cancellations just cleared ahead in the ${toCity} quota! 🚀`,
        subtitle: `Corridor queue moving. Confirmation odds rising to ${effectiveProb}%.`,
        badge: `${cleared} Cleared ⚡`,
        badgeColor: 'bg-emerald-400 text-emerald-950',
      };
    }
    return {
      title: `Hang tight! I'm monitoring the queue in real-time.`,
      subtitle: `Initial ${initialQuotaType}-${w0} assigned. Corridor velocity active at 3.4 cancels/hr.`,
      badge: 'Queue Active',
      badgeColor: 'bg-amber-400 text-amber-950',
    };
  }, [effectiveWl, initialWaitlistNumber, effectiveProb, toCity, initialQuotaType]);

  // Auto-pop the Waitlist Watch or Coach view only when user has booked a ticket
  useEffect(() => {
    if (isWaitlistBooking) {
      setActiveTrackerTab('waitlist');
    } else if (isUserBookedTrain) {
      setActiveTrackerTab('coach');
    } else {
      setActiveTrackerTab('timeline');
    }
  }, [trainNumber, isUserBookedTrain, isWaitlistBooking]);

  // Dynamic Passenger List for Waitlist Watch Sidebar
  const passengerEntries: PassengerExplainEntry[] = useMemo(() => {
    const p1Wl = effectiveWl;
    const p1Init = initialWaitlistNumber || 18;
    const p1Moved = effectiveCleared;

    return userPassengers.map((p: any, idx: number) => {
      const pInit = p1Init + idx * 2;
      const pCur = Math.max(0, p1Wl + idx * 2);
      const pProb = calculateCalibratedProbability(pInit, pCur, selectedCoachInfo.classCode, initialQuotaType);
      return {
        name: p.name || `Passenger ${idx + 1}`,
        displayName: `Passenger ${idx + 1}`,
        quotaType: initialQuotaType,
        initialWl: pInit,
        currentWl: pCur,
        probability: pProb,
        positionsCleared: p1Moved,
      };
    });
  }, [userPassengers, effectiveWl, initialWaitlistNumber, effectiveCleared, selectedCoachInfo.classCode, initialQuotaType]);

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

      {/* Active Express Trains Radar Switcher with SVGs & From-To Routes */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Train className="w-3.5 h-3.5 text-purple-700" />
            <span>Select Live Radar Train:</span>
          </span>
          <span className="text-[10px] font-bold text-purple-700">
            {RADAR_TRAIN_PRESETS.length} Trains on Satellite Radar
          </span>
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 text-xs scrollbar-thin scrollbar-thumb-purple-200">
          {RADAR_TRAIN_PRESETS.map((tr) => {
            const isSelected = trainNumber === tr.number;
            return (
              <button
                key={tr.number}
                type="button"
                onClick={() => selectTrainToTrack(tr.number)}
                className={`p-2.5 rounded-2xl flex flex-col gap-1.5 transition-all shrink-0 cursor-pointer text-left border ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white shadow-md ring-2 ring-purple-300 border-purple-500 scale-[1.02]'
                    : 'bg-white text-slate-700 border-purple-100 hover:bg-purple-50/90 hover:border-purple-200 shadow-2xs'
                }`}
              >
                {/* Top Row: SVG + Train # + Name + Badge */}
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : tr.category === 'Vande Bharat'
                        ? 'bg-purple-100 text-purple-800'
                        : tr.category === 'Rajdhani'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-indigo-100 text-indigo-800'
                    }`}
                  >
                    {tr.category === 'Vande Bharat' ? (
                      <VandeBharatSvg className="w-4 h-4" />
                    ) : tr.category === 'Rajdhani' ? (
                      <RajdhaniSvg className="w-4 h-4" />
                    ) : (
                      <ExpressLocoSvg className="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`font-mono font-black text-xs ${isSelected ? 'text-amber-200' : 'text-purple-900'}`}>
                      #{tr.number}
                    </span>
                    <span className="font-extrabold text-xs truncate max-w-[140px]">
                      {tr.name}
                    </span>
                  </div>

                  {(() => {
                    const isTrainBookedOnWL =
                      (issuedTicket?.train?.trainNumber === tr.number || bookingRecord?.trainNumber === tr.number) &&
                      isWaitlistBooking;
                    const badgeText = isTrainBookedOnWL ? 'WL Watch' : tr.tag;
                    if (!badgeText) return null;
                    return (
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${
                          isSelected
                            ? 'bg-white/20 text-amber-200 border border-white/30'
                            : isTrainBookedOnWL
                            ? 'bg-purple-100 text-purple-900 border border-purple-300'
                            : 'bg-purple-50 text-purple-800 border border-purple-200'
                        }`}
                      >
                        {badgeText}
                      </span>
                    );
                  })()}
                </div>

                {/* Bottom Row: From Where to Where Route */}
                <div
                  className={`flex items-center gap-1.5 text-[11px] font-semibold pl-9 ${
                    isSelected ? 'text-purple-100' : 'text-slate-500'
                  }`}
                >
                  <span className="truncate">{tr.fromCity} ({tr.fromCode})</span>
                  <span className={`font-bold ${isSelected ? 'text-amber-300' : 'text-[#7C3AED]'}`}>➔</span>
                  <span className="truncate">{tr.toCity} ({tr.toCode})</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          2. LIVE SPEED & RUNNING STATUS HERO CARD
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 rounded-3xl p-4 sm:p-5 text-white shadow-md relative overflow-hidden border border-purple-800">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-purple-500/10 to-transparent pointer-events-none" />

        {/* Right Side Ananya Duo Avatar Cutout */}
        <div className="hidden lg:flex absolute right-4 bottom-0 h-[85%] max-h-[120px] items-end pointer-events-none select-none z-0 opacity-80">
          <img
            src="/assets/images/characters/ananya_nira_duo.png"
            alt="Ananya & Nira Radar"
            className="h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
          />
        </div>

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

        {/* Scheduled Timings & Route Duration Strip */}
        <div className="relative z-10 mt-3 pt-3 border-t border-purple-800/60 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-purple-900/60 border border-purple-800/80 p-2 rounded-2xl">
            <span className="text-[10px] uppercase font-bold text-purple-300 block">Scheduled Departure</span>
            <div className="flex items-center justify-center gap-1 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono font-black text-sm text-white">{firstStop.scheduledDep || foundTrain?.departureTime || '16:55'}</span>
            </div>
            <span className="text-[9px] text-purple-300 font-semibold truncate block mt-0.5">{fromCity} ({fromCode})</span>
          </div>

          <div className="bg-purple-900/60 border border-purple-800/80 p-2 rounded-2xl">
            <span className="text-[10px] uppercase font-bold text-purple-300 block">Total Duration</span>
            <div className="flex items-center justify-center gap-1 mt-0.5">
              <Compass className="w-3.5 h-3.5 text-amber-300" />
              <span className="font-mono font-black text-sm text-amber-300">{foundTrain?.durationHours || '15h 45m'}</span>
            </div>
            <span className="text-[9px] text-purple-300 font-semibold block mt-0.5">{routeStations.length} Halts • Express</span>
          </div>

          <div className="bg-purple-900/60 border border-purple-800/80 p-2 rounded-2xl">
            <span className="text-[10px] uppercase font-bold text-purple-300 block">Scheduled Arrival</span>
            <div className="flex items-center justify-center gap-1 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-purple-300" />
              <span className="font-mono font-black text-sm text-white">{lastStop.scheduledArr || foundTrain?.arrivalTime || '08:40'}</span>
            </div>
            <span className="text-[9px] text-purple-300 font-semibold truncate block mt-0.5">{toCity} ({toCode})</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          3. CLEAN PRIMARY VIEW SWITCHER TABS (DE-CONGESTED VIEW BAR)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className={`grid grid-cols-1 ${isUserBookedTrain && isWaitlistBooking ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-2 p-1.5 rounded-2xl bg-white border border-purple-100 shadow-sm text-xs font-bold`}>
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
          <span className="truncate">
            {isUserBookedTrain ? `💺 My Reserved Berths ${isUserCoach ? `(${selectedCoach})` : ''}` : '💺 Coach Composition Preview'}
          </span>
        </button>

        {isUserBookedTrain && isWaitlistBooking && (
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
            <span className="truncate">📊 Waitlist Radar ({wlWatch.confirmationProbability}%)</span>
          </button>
        )}
      </div>

      {/* Sleek Compact Notification when Waitlist is Active and User is in other tabs */}
      {activeTrackerTab !== 'waitlist' && isUserBookedTrain && isWaitlistBooking && (
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
                    const load = stationLoadProjection(trainNumber, routeStations, idx, 72, isCurrentTrainWaitlisted);
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
              <CoachSegmentShowcase
                trainNumber={trainNumber}
                trainName={trainName}
                availableClasses={foundTrain?.classes}
                routeStations={routeStations}
                currentStationIndex={activeStationIndex}
                userBookedSeats={allocatedSeats}
                isUserBookedTrain={isUserBookedTrain}
                isWaitlisted={isWaitlistBooking}
              />
            </div>
          )}

          {/* ─── TAB 3: DEDICATED WAITLIST WATCH & CONFIRMATION RADAR ─── */}
          {activeTrackerTab === 'waitlist' && (
            <div className="space-y-4 animate-in fade-in">
              {/* 1. CELEBRATORY "YEAH! CONFIRMED" BANNER WHEN WAITLIST CLEARS TO 0 */}
              {showConfirmedCelebration && (
                <div
                  className={`relative rounded-3xl p-6 sm:p-7 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-2xl border-2 border-emerald-300 overflow-hidden transition-all duration-500 animate-in zoom-in-95 ${
                    isPoofingCelebration ? 'scale-90 opacity-0 blur-md pointer-events-none' : ''
                  }`}
                >
                  <div className="relative z-10 flex flex-col sm:flex-row items-center gap-5 sm:gap-6 justify-between">
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center text-4xl shadow-inner animate-bounce">
                        🎉
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full bg-white text-emerald-900 text-[10px] font-black uppercase tracking-wider shadow-xs">
                            100% CONFIRMED
                          </span>
                          <span className="text-base sm:text-lg font-black text-white">
                            YEAH! Your Seats are Confirmed! 🥳
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-emerald-100 font-bold leading-snug">
                          All {initialWaitlistNumber} waitlist positions cleared! Allocated Coach <span className="underline font-mono text-amber-200 font-black">B4</span> • Berth <span className="underline font-mono text-amber-200 font-black">36 (Lower) & 37 (Middle)</span>.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handlePoofCelebration}
                      className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border border-white/30 shadow-md active:scale-95"
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
                  className={`relative rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white shadow-xl border border-purple-400/30 overflow-hidden transition-all duration-500 ${
                    isPoofingOff ? 'scale-90 opacity-0 blur-md pointer-events-none' : ''
                  }`}
                >
                  <div className="relative z-10 flex flex-col sm:flex-row items-center gap-5 justify-between">
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center">
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
                        <span className="text-[11px] text-purple-200 block font-medium">Real-Time Destination Intelligence</span>
                      </div>
                    </div>

                    <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 text-center sm:text-left space-y-1">
                      <p className="text-xs sm:text-sm font-bold text-white leading-relaxed">
                        "{copilotDynamicAdvice.title}"
                      </p>
                      <span className="text-[11px] text-purple-200 block font-medium">
                        {copilotDynamicAdvice.subtitle}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handlePoofOff}
                      className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1 border border-white/20 transition-all cursor-pointer shrink-0"
                    >
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>Dismiss</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 3. HERO PREDICTION & WAITLIST RADAR CARD (DE-CONGESTED & SPACIOUS) */}
              <div className="rounded-3xl border border-purple-100 bg-white p-6 sm:p-7 text-slate-900 shadow-sm space-y-6">
                {/* Header with Title & Telemetry Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-50 pb-5">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-500/20">
                      <TrendingUp className="w-6 h-6 text-amber-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-black uppercase tracking-wider flex items-center gap-1.5 border border-emerald-300/60">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                          LIVE RADAR TELEMETRY
                        </span>
                        <span className="text-sm sm:text-base font-black text-slate-900">
                          Waitlist Prediction & Probability
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        {effectiveWl === 0
                          ? `🎉 All ${initialWaitlistNumber} positions cleared • Berth allocated in Coach B4`
                          : `Monitoring corridor queue • Cleared ${effectiveCleared} positions ahead in real-time.`}
                      </p>
                    </div>
                  </div>

                  {/* Simulation Controls Pill */}
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-2xl self-start sm:self-center shrink-0">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1 hidden sm:inline">
                      Sim:
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsSimPaused((p) => !p)}
                      className="p-1.5 rounded-xl hover:bg-purple-100 text-purple-900 transition-colors cursor-pointer"
                      title={isSimPaused ? 'Resume Real-Time Telemetry' : 'Pause Simulation'}
                    >
                      {isSimPaused ? <Play className="w-3.5 h-3.5 fill-purple-900" /> : <Pause className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={handleStepSim}
                      className="p-1.5 rounded-xl hover:bg-purple-100 text-purple-900 transition-colors cursor-pointer"
                      title="Advance 1 Step Forward"
                    >
                      <FastForward className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleResetSim}
                      className="p-1.5 rounded-xl hover:bg-purple-100 text-purple-900 transition-colors cursor-pointer"
                      title={`Reset to Initial Queue (${initialQuotaType} ${initialWaitlistNumber})`}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Main Prediction Bar & Confirmation Dial */}
                <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-purple-50/70 via-white to-indigo-50/70 border border-purple-100 space-y-4">
                  {/* Waypoints Row */}
                  <div className="flex items-center justify-between text-xs font-bold flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-amber-400 ring-4 ring-amber-100" />
                      <span className="text-amber-800">Booking: <strong className="font-mono font-black">{initialQuotaType} {initialWaitlistNumber}</strong></span>
                    </div>

                    <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-xl border border-purple-200 shadow-2xs">
                      <Activity className="w-3.5 h-3.5 text-purple-700 animate-pulse" />
                      <span className="text-purple-950 font-mono font-black">
                        Current: {effectiveWl === 0 ? 'CONFIRMED ✓' : `${initialQuotaType} ${effectiveWl}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                      <span className="text-emerald-800">Target: <strong className="font-mono font-black">CNF Coach B4</strong></span>
                    </div>
                  </div>

                  {/* Spacious, Smooth Animated Progress Bar */}
                  <div className="w-full h-4 rounded-full bg-slate-100 overflow-hidden p-0.5 border border-purple-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 via-indigo-600 to-emerald-500 transition-all duration-1000 ease-out shadow-xs"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(12, Math.round(((Math.max(1, initialWaitlistNumber) - effectiveWl) / Math.max(1, initialWaitlistNumber)) * 100))
                        )}%`,
                      }}
                    />
                  </div>

                  {/* Status & Odds Summary */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-xs">
                    <div className="flex items-center gap-2 text-slate-600 font-medium">
                      <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping shrink-0" />
                      <span>{simStatusMsg}</span>
                    </div>

                    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-purple-200 shadow-2xs self-start sm:self-center">
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                          Confirmation Odds
                        </span>
                        <span className="text-lg font-black text-emerald-600 font-mono leading-none">
                          {effectiveProb}%
                        </span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-xs border border-emerald-300">
                        {effectiveProb}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3 Spacious Telemetry Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                  <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Clearance Velocity
                    </span>
                    <div className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                      <span className="font-mono text-purple-700 text-base">3.4 / hr</span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-bold border border-emerald-200">
                        High Speed
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                      Corridor cancellation rate active across Howrah & intermediate hubs.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Chart Preparation Window
                    </span>
                    <div className="font-black text-emerald-700 text-sm flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{effectiveWl === 0 ? 'Chart Prepared • Berths Allocated' : 'In ~3h 45m'}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                      {effectiveWl === 0 ? 'Confirmed in official Indian Railways system.' : 'Unallocated VIP & emergency quotas released to general queue.'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      NOVA ML Precision
                    </span>
                    <div className="font-black text-indigo-700 text-sm flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <span>99.4% Model Accuracy</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                      Calibrated Poisson queue trained on 14,280 historic Northern Railway runs.
                    </p>
                  </div>
                </div>

                {/* 3-Step Clear Explainability Pipeline */}
                <div className="p-5 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-[#7C3AED] text-white flex items-center justify-center font-black text-xs shadow-xs">
                        AI
                      </span>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900">
                        How Your Waitlist is Analyzed in Real-Time
                      </h4>
                    </div>
                    <span className="text-[10px] font-bold text-purple-700 uppercase bg-purple-100 px-2.5 py-0.5 rounded-full">
                      Corridor Pipeline
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-white border border-purple-100 space-y-1">
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-900">
                        1. Quota Partition
                      </span>
                      <span className="font-bold text-slate-900 block text-xs mt-1">Corridor Balance</span>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                        Analyzes destination quota for {toCity} vs intermediate drop-offs.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white border border-purple-100 space-y-1">
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                        2. Velocity Modeling
                      </span>
                      <span className="font-bold text-slate-900 block text-xs mt-1">Poisson Clearance</span>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                        Tracks average cancellation velocity (3.4 / hr) in real-time.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 space-y-1">
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500 text-white">
                        3. Berth Output
                      </span>
                      <span className="font-bold text-emerald-950 block text-xs mt-1">Confirmed Allocation</span>
                      <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
                        WL-{effectiveWl} ➔ RAC ➔ Confirmed Lower/Middle berth forecast.
                      </p>
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
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-purple-100 shadow-sm space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-purple-50 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    🟢
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 leading-none">
                      Waitlist Watch
                    </h4>
                    <span className="text-[11px] font-bold text-purple-700 mt-0.5 block">
                      WL {wlWatch.initialWl} → WL {wlWatch.currentWl}
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-extrabold uppercase tracking-wider">
                  Active Watch
                </span>
              </div>

              {/* ✨ Explain My Ticket Primary Action */}
              <button
                type="button"
                onClick={() => setShowExplainTicketModal(true)}
                className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-[#7C3AED] hover:from-purple-800 hover:to-indigo-800 text-white text-xs font-black shadow-md shadow-purple-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span>✨ Explain My Ticket in Plain English</span>
              </button>

              {/* Probability & Movement with Explain */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50/70 via-white to-purple-50/70 border border-purple-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
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
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-700"
                    style={{ width: `${wlWatch.confirmationProbability}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-600 font-medium">
                  {wlWatch.trendText}
                </p>
              </div>

              {/* Per-Passenger Waitlist Status Breakdown */}
              <div className="space-y-2">
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

                <div className="space-y-2">
                  {passengerEntries.map((p, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs">
                          {privacyMode ? p.displayName : p.name}
                        </span>
                        <span className="font-mono text-purple-900 font-bold text-xs flex items-center gap-1">
                          {p.quotaType} {p.initialWl} → {p.quotaType} {p.currentWl}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-200/70 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-700"
                          style={{ width: `${p.probability}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                        <span>{p.positionsCleared} positions cleared</span>
                        <span className="text-emerald-700 font-bold">{p.probability}% est.</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comfort Window Tabs */}
              <div className="space-y-2">
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
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        comfortLevel === tab.id
                          ? 'bg-purple-900 text-white border-purple-900 shadow-xs'
                          : 'bg-purple-50/50 text-slate-700 border-purple-100 hover:bg-purple-100'
                      }`}
                    >
                      <span className="block text-xs">{tab.label}</span>
                      <span className={`text-[9px] block mt-0.5 ${comfortLevel === tab.id ? 'text-purple-200' : 'text-slate-400'}`}>
                        {tab.hint}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Nira Reassuring Insight Bubble */}
              <div className="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-200 flex items-start gap-2.5 text-xs">
                <Sparkles className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-purple-950 font-bold block">Nira Copilot:</strong>
                  <p className="text-slate-700 text-[11px] font-medium leading-relaxed mt-0.5">
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
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    On-Board Passenger Tools
                  </h4>
                  {activeAlarm && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span>⏰ Alarm: {activeAlarm.leadMinutes}m before {activeAlarm.station}</span>
                      <button
                        type="button"
                        onClick={() => setActiveAlarm(null)}
                        className="text-emerald-900 font-black hover:text-rose-600 ml-1 cursor-pointer"
                        title="Cancel Alarm"
                      >
                        ✕
                      </button>
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowWakeUpModal(true)}
                  className="w-full p-2.5 rounded-xl bg-purple-50/50 hover:bg-purple-100/70 border border-purple-100 flex items-center justify-between text-xs font-bold text-slate-800 transition-all cursor-pointer shadow-2xs active:scale-98"
                >
                  <div className="flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5 text-purple-700" />
                    <span>Set Station Wake-Up Alarm</span>
                  </div>
                  <span className="text-[10px] text-purple-700 bg-purple-100 px-2 py-0.5 rounded font-mono">
                    {activeAlarm ? `${activeAlarm.leadMinutes}m Active` : '15m Before'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowShareTripModal(true)}
                  className="w-full p-2.5 rounded-xl bg-purple-50/50 hover:bg-purple-100/70 border border-purple-100 flex items-center justify-between text-xs font-bold text-slate-800 transition-all cursor-pointer shadow-2xs active:scale-98"
                >
                  <div className="flex items-center gap-2">
                    <Share2 className="w-3.5 h-3.5 text-purple-700" />
                    <span>Share Live Trip Status</span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowOrderFoodModal(true)}
                  className="w-full p-2.5 rounded-xl bg-purple-50/50 hover:bg-purple-100/70 border border-purple-100 flex items-center justify-between text-xs font-bold text-slate-800 transition-all cursor-pointer shadow-2xs active:scale-98"
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

      {/* 7. INTERACTIVE ON-BOARD PASSENGER MODALS */}
      <WakeUpAlarmModal
        isOpen={showWakeUpModal}
        onClose={() => setShowWakeUpModal(false)}
        trainNumber={trainNumber}
        trainName={trainName}
        stoppages={routeStations}
        currentStationIndex={activeStationIndex}
        onAlarmSet={(station, leadMinutes) => setActiveAlarm({ station, leadMinutes })}
      />

      <ShareTripModal
        isOpen={showShareTripModal}
        onClose={() => setShowShareTripModal(false)}
        trainNumber={trainNumber}
        trainName={trainName}
        currentStationName={currentTargetStation.name}
        currentSpeed={currentSpeed}
        eta={formatTimer(countdownSeconds)}
        pnrNumber={issuedTicket?.pnrNumber || bookingRecord?.pnrNumber}
      />

      <OrderFoodModal
        isOpen={showOrderFoodModal}
        onClose={() => setShowOrderFoodModal(false)}
        trainNumber={trainNumber}
        trainName={trainName}
        stoppages={routeStations}
        currentStationIndex={activeStationIndex}
        coach={selectedCoach}
        seatNumber={userSeatObjects[0]?.seatNumber || allocatedSeats[0]?.seatNumber || 1}
      />
    </div>
  );
};
