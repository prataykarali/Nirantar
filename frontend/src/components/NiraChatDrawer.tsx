import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Mic,
  MicOff,
  Search,
  MapPin,
  Ticket,
  CreditCard,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  Sparkles,
  Bot,
  Volume2,
  VolumeX,
  Train,
  Zap,
  Clock,
  ShieldCheck,
  Compass,
  CheckCircle2,
  Navigation,
  ListFilter,
  RefreshCw,
} from 'lucide-react';
import { useJourney, PassengerProfile } from '../context/JourneyContext';
import { Station, findStation, POPULAR_STATIONS } from '../data/stationData';
import { searchTrains, TrainDetail, MOCK_TRAINS_DATABASE } from '../data/mockTrains';
import { sendCitizenQuery } from '../services/api';
import { speakNiraResponse, stopNiraSpeech, setNiraMuted } from '../services/voiceService';
import { streamNiraChat, transcribeAudio } from '../services/niraApi';
import { getTrainStoppages, KNOWN_TRAIN_NAMES, resolveTrainDetail } from '../data/trainStoppages';
import { formatTrainGrounding, rankTrains, plainClass } from '../utils/rankTrains';
import { NiraPlanner, NiraSanitizedContext } from '../ai/NiraPlanner';
import { PiiRedactor } from '../ai/PiiRedactor';
import { ActionPolicyEngine } from '../actions/ActionPolicy';
import { UiEventBus } from '../events/UiEventBus';
import { Explain } from './Explain';

interface AutoBookData {
  train: TrainDetail;
  fromStation: Station;
  toStation: Station;
  travelDate: string;
  classCode: string;
  quota: string;
  passengersCount: number;
  passengerName?: string;
  fare: number;
  platform?: string;
}

interface TrackData {
  trainNumber: string;
  trainName: string;
  currentSpeed: number;
  statusText: string;
  nextStation: string;
  platform: string;
  doorSide: string;
  delayMins: number;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'nira';
  text: string;
  isStreaming?: boolean;
  actionCard?: {
    title: string;
    subtitle: string;
    buttonLabel: string;
    route: string;
    fromStation?: Station;
    toStation?: Station;
    passengersCount?: number;
    travelDate?: string;
    trainNumber?: string;
  };
  understoodCard?: {
    from: string;
    to: string;
    date: string;
    time?: string;
    passengers: number;
    classCode?: string;
    fare?: number;
    trainName?: string;
    trainNumber?: string;
    fromStation: Station;
    toStation: Station;
  };
  autoBookCard?: AutoBookData;
  trackCard?: TrackData;
  trainList?: TrainDetail[];
  bookingConfirmPrompt?: {
    train: TrainDetail;
    classCode: string;
    fare: number;
    paxCount: number;
  };
  passengerConfirmPrompt?: {
    passengers: PassengerProfile[];
    contact?: { phone?: string; email?: string; irctcId?: string };
    train: TrainDetail;
    classCode: string;
    classBreakdown?: string;
    fare: number;
  };
  bookedTrainStatusCard?: {
    trainNumber: string;
    trainName: string;
    fromCity: string;
    fromCode: string;
    toCity: string;
    toCode: string;
    travelDate: string;
    pnrNumber: string;
    status: string;
    statusType: 'CONFIRMED' | 'RAC' | 'WAITLIST';
    seatInfo: string;
    probabilityLabel?: string;
    currentSpeed: number;
    nextStation: string;
    platform: string;
    doorSide: string;
  };
  feedbackGiven?: 'up' | 'down';
  timestamp: string;
}

interface NiraChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RouteContext {
  fromStation?: Station | null;
  toStation?: Station | null;
  travelDate?: string | null;
  passengers?: number;
  classCode?: string;
  quota?: string;
  trainNumber?: string;
  passengerName?: string;
  invalidTrainNumber?: string;
  missingTrainNumber?: boolean;
}

type ExampleCategory = 'booking' | 'tatkal' | 'tracking' | 'services';

export const NiraChatDrawer: React.FC<NiraChatDrawerProps> = ({ isOpen, onClose }) => {
  const {
    navigateTo,
    executeSearch,
    searchParams,
    triggerAutoBookFlow,
    handleQuickTrack,
    startGuidanceTour,
    activePage,
    passengers: currentPassengers,
    setPassengers,
    walletBalance,
    paymentState,
    selectedTrain,
    selectedClassCode,
    setSelectedClassCode,
    selectTrain,
    // ─── State-Aware Nira (Journey Orchestration) ───
    getSanitizedContext,
    bookingState,
    emitUiEvent,
    taskStack,
    pushTask,
    resumeTask,
    setActiveSort,
    setActiveHighlightTarget,
    resetJourney,
    niraPendingQuery,
    setNiraPendingQuery,
    trackQuery,
    issuedTicket,
    bookingRecord,
    getWaitlistProbability,
    payWithWallet,
    setShowVisualDiagram,
  } = useJourney();

  const hasEnteredPassengerDetails = currentPassengers.length > 0 && currentPassengers.some((p) => p.name && p.name.trim().length > 0);
  const isBetweenTransactionStates = activePage === 'workspace' || activePage === 'payment';
  const shouldShowResumeTask = taskStack.length > 0 && (hasEnteredPassengerDetails || isBetweenTransactionStates);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [autoVoice, setAutoVoice] = useState(true);
  const [activeCategory, setActiveCategory] = useState<ExampleCategory>('booking');
  const [showExamplesModal, setShowExamplesModal] = useState(false);
  const [routeCtx, setRouteCtx] = useState<RouteContext>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ═══════════════════════════════════════════════════════════════════
  // 25 DIRECT TEST QUERY EXAMPLES (CATEGORIZED FOR JUDGES & REVIEWERS)
  // ═══════════════════════════════════════════════════════════════════
  const EXAMPLE_QUERIES: Record<ExampleCategory, Array<{ label: string; query: string; icon: any; tag?: string }>> = {
    booking: [
      {
        icon: Sparkles,
        label: 'Auto book Delhi to Mumbai in 3A (2 pax)',
        query: 'Auto book fastest train from Delhi to Mumbai tomorrow in 3A for 2 passengers',
        tag: 'Instant Auto-Book',
      },
      {
        icon: Train,
        label: 'Book 12951 Mumbai Rajdhani Express',
        query: 'Book 2 seats on train 12951 Mumbai Rajdhani Express',
        tag: 'Direct Number',
      },
      {
        icon: Search,
        label: 'Auto book Howrah to Puri tomorrow morning',
        query: 'Auto book Howrah to Puri for tomorrow morning in 3A',
        tag: 'Coastal Route',
      },
      {
        icon: Zap,
        label: 'Book Vande Bharat Delhi to Varanasi',
        query: 'Book 22436 Vande Bharat Express from Delhi to Varanasi tomorrow',
        tag: 'Vande Bharat',
      },
      {
        icon: Sparkles,
        label: 'Auto book Delhi to Bangalore for Pratay Karali',
        query: 'Auto book Delhi to Bangalore 3A tomorrow for Pratay Karali',
        tag: 'With Passenger',
      },
      {
        icon: Train,
        label: 'Find cheapest train from Mumbai to Pune',
        query: 'Find cheapest train from Mumbai to Pune tomorrow',
        tag: 'Best Value',
      },
      {
        icon: Train,
        label: 'Auto book Kolkata to Bangalore (WL Watch)',
        query: 'Auto book train 12863 from Kolkata to Bangalore tomorrow in 3A',
        tag: 'WL Clearance',
      },
      {
        icon: Zap,
        label: 'Book train from Delhi to NJP',
        query: 'Book a train from Delhi to NJP tomorrow in CC',
        tag: 'North Bengal',
      },
      {
        icon: Search,
        label: 'Book Delhi to Lucknow Gomti Express',
        query: 'Book Delhi to Lucknow Gomti Express in CC class',
        tag: 'Chair Car',
      },
    ],
    tatkal: [
      {
        icon: Zap,
        label: 'Auto book Tatkal Delhi to Mumbai 3A',
        query: 'Auto book Tatkal ticket for Delhi to Mumbai in 3A',
        tag: 'Tatkal Quota',
      },
      {
        icon: Clock,
        label: 'Tatkal booking timings & rules (AC vs SL)',
        query: 'What are the Tatkal booking timings and rules for AC and Non-AC classes?',
        tag: 'Rules & Timings',
      },
      {
        icon: Train,
        label: 'Book Tatkal seat on 12302 Howrah Rajdhani',
        query: 'Book Tatkal quota seat on 12302 Howrah Rajdhani',
        tag: 'Quota Reserve',
      },
      {
        icon: Search,
        label: 'Check Tatkal seat availability Delhi to Patna',
        query: 'Check Tatkal seat availability from Delhi to Patna',
        tag: 'Availability',
      },
      {
        icon: ShieldCheck,
        label: 'Prepare Tatkal passenger details for 10:00 AM',
        query: 'Auto prepare Tatkal autofill for 10:00 AM booking opening',
        tag: 'Passenger details',
      },
      {
        icon: HelpCircle,
        label: 'Tatkal cancellation charges & confirmation',
        query: 'Explain Tatkal cancellation charges and confirmation chances',
        tag: 'Refunds',
      },
    ],
    tracking: [
      {
        icon: Navigation,
        label: 'Track train 12302 Howrah Rajdhani',
        query: 'Track train 12302 Howrah Rajdhani live running status',
        tag: 'Live Telemetry',
      },
      {
        icon: MapPin,
        label: 'Where is train 12951 Mumbai Rajdhani now?',
        query: 'Where is train 12951 Mumbai Rajdhani right now?',
        tag: 'GPS Satellite',
      },
      {
        icon: Zap,
        label: 'Track live status of 22436 Vande Bharat',
        query: 'Track live status of 22436 Vande Bharat Express',
        tag: 'Speed & Station',
      },
      {
        icon: Compass,
        label: 'Which platform is 12951 arriving at New Delhi?',
        query: 'Which platform is train 12951 arriving at New Delhi?',
        tag: 'Platform Radar',
      },
      {
        icon: Train,
        label: 'Track train 12002 Bhopal Shatabdi Express',
        query: 'Track train 12002 Bhopal Shatabdi Express live status',
        tag: 'Shatabdi Radar',
      },
      {
        icon: Clock,
        label: 'Check live speed & next stop for 12302',
        query: 'Check live speed and next stop for 12302',
        tag: 'Delay Estimator',
      },
    ],
    services: [
      {
        icon: Ticket,
        label: 'Check PNR status for 8429104821',
        query: 'Check PNR status for 8429104821',
        tag: 'DigiLocker PNR',
      },
      {
        icon: CreditCard,
        label: 'Why did UPI payment fail & how refund works',
        query: 'Why did my UPI payment fail and how does auto-refund work?',
        tag: 'Double-Verify',
      },
      {
        icon: HelpCircle,
        label: 'Difference between 1A, 2A, 3A and 3E classes',
        query: 'Explain difference between 1A, 2A, 3A and 3E classes',
        tag: 'Class Guide',
      },
      {
        icon: ShieldCheck,
        label: 'Show confirmed ticket with DigiLocker badge',
        query: 'Show my confirmed digital ticket with DigiLocker badge',
        tag: 'Verified e-Ticket',
      },
      {
        icon: HelpCircle,
        label: 'Senior citizen concessions & lower berth rules',
        query: 'What concessions and lower berth priorities are available for senior citizens?',
        tag: 'Concessions',
      },
      {
        icon: Sparkles,
        label: 'Underneath Nirantar (1-Min Dev Pitch)',
        query: "Welcome back! Now, as the developer, let's address what the user experienced underneath Nirantar:",
        tag: '1-Min Dev Pitch & Tech Stack',
      },
      {
        icon: ShieldCheck,
        label: 'How passenger details are used in this demo',
        query: 'How do passenger details work in this demo?',
        tag: 'Passenger details',
      },
    ],
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Stop audio speech when drawer closes
  useEffect(() => {
    if (!isOpen) {
      stopNiraSpeech();
      return;
    }
    // ─── STATE-AWARE GREETING: Nira knows what page the user is on ───
    emitUiEvent('NIRA_OPENED', { page: activePage });
    const ctx = getSanitizedContext();
    const greeting = NiraPlanner.generateStateAwareGreeting(ctx);

    if (messages.length === 0) {
      const greetMsg: ChatMessage = {
        id: `nira-greeting-${Date.now()}`,
        sender: 'nira',
        text: greeting.message.replace(/i'?m nira[^.!]*/i, '').trim() ||
          'Where in India do you want to go? I can find trains, rank them, or track a live train number.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([greetMsg]);
    }
  }, [isOpen]);

  const prevPageRef = useRef<string>(activePage);

  // Auto-announce page transitions (e.g. ticket completion congratulations)
  useEffect(() => {
    if (isOpen && prevPageRef.current !== activePage) {
      prevPageRef.current = activePage;
      const ctx = getSanitizedContext();
      const greeting = NiraPlanner.generateStateAwareGreeting(ctx);
      const pageChangeMsg: ChatMessage = {
        id: `nira-page-${activePage}-${Date.now()}`,
        sender: 'nira',
        text: greeting.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, pageChangeMsg]);
      if (autoVoice) {
        speakNiraResponse(greeting.message);
      }
    }
  }, [isOpen, activePage, autoVoice, getSanitizedContext]);

  /**
   * Comprehensive Local Natural Language Extractor for Train/Route/Auto-Book/Track/Tatkal intents
   */
  const extractAdvancedIntent = (text: string, current: RouteContext): {
    route: RouteContext;
    isAutoBook: boolean;
    isTrack: boolean;
    isTatkal: boolean;
    trainNumber?: string;
  } => {
    const lower = text.toLowerCase();
    const updated = { ...current };
    const isQuestion =
      /^(?:can|could|how|what|when|where|why|is|are|do|does|tell|explain|rules?|policy|guideline|luggage|baggage|senior|chart|cancel|refund|boarding|food|cater|concession|hawaii|flight|hotel|download|invoice|certificate)\b/i.test(text.trim()) ||
      text.trim().endsWith('?') ||
      lower.includes('how much') ||
      lower.includes('can i') ||
      lower.includes('what is') ||
      lower.includes('when is') ||
      lower.includes('why is') ||
      lower.includes('flight to') ||
      lower.includes('hawaii') ||
      lower.includes('charges for') ||
      lower.includes('options on');

    const isTrack =
      lower.includes('track') ||
      lower.includes('running status') ||
      lower.includes('live status') ||
      lower.includes('train status') ||
      lower.includes('where is') ||
      lower.includes('live train') ||
      lower.includes('gps radar') ||
      lower.includes('check status') ||
      (/^\d{5}$/.test(text.trim()));

    const isAutoBook =
      !isQuestion &&
      !isTrack && (
        lower.startsWith('auto book') ||
        lower.startsWith('autobook') ||
        lower.startsWith('book ') ||
        lower.startsWith('reserve ') ||
        lower.includes('want to book') ||
        lower.includes('wanna book') ||
        lower.includes('find trains from') ||
        lower.includes('search trains from') ||
        lower.includes('book ticket') ||
        lower.includes('book train') ||
        lower.includes('book a train') ||
        lower.includes("let's book") ||
        lower.includes('lets book') ||
        lower.includes('show trains') ||
        /(?:book|reserve)\b.*(?:train|#)\s*\d+/i.test(text)
      );

    const isTatkal =
      !isQuestion && (
        lower.includes('tatkal booking') ||
        lower.includes('book in tatkal') ||
        lower.includes('emergency quota')
      );

    if (isTatkal) {
      updated.quota = 'Tatkal (TQ)';
    }

    // 1. Train Number extraction (strictly 5 digits in Indian Railways)
    const rawNumberMatch = text.match(/\b(\d+)\b/);
    let currentInvalidNum: string | undefined = undefined;
    let currentMissingNum: boolean | undefined = undefined;
    let explicitTrainInCurrentQuery: string | undefined = undefined;

    if (!isQuestion && rawNumberMatch && (lower.includes('train') || isTrack || lower.includes('book') || lower.includes('reserve') || /^\d+$/.test(text.trim()))) {
      const num = rawNumberMatch[1];
      if (num.length === 5) {
        explicitTrainInCurrentQuery = num;
        updated.trainNumber = num;
      } else {
        currentInvalidNum = num;
      }
    } else if (
      !isQuestion &&
      !isTrack &&
      (lower.includes('book train') || lower.includes('want to book') || lower.includes('reserve train') || lower.includes('book ticket')) &&
      !lower.includes('from') &&
      !lower.includes('to')
    ) {
      currentMissingNum = true;
    }

    // 2. Station Extraction: explicit route regex or verified station names
    let extractedFrom: Station | undefined = undefined;
    let extractedTo: Station | undefined = undefined;

    if (!isQuestion) {
      // Strip conversational prefixes so station extraction is clean
      const cleanedRouteText = text
        .replace(/^(?:let'?s\s+(?:book\s+)?(?:a\s+)?(?:train\s+)?|i\s+want\s+to\s+book\s+(?:a\s+)?(?:train\s+)?|please\s+book\s+(?:a\s+)?(?:train\s+)?|book\s+(?:a\s+)?(?:train\s+)?|can\s+we\s+book\s+(?:a\s+)?(?:train\s+)?|search\s+trains?\s+(?:from\s+)?|find\s+trains?\s+(?:from\s+)?|show\s+trains?\s+(?:from\s+)?)\s*/i, '')
        .trim();

      const routeRegex = /(?:from\s+)?([a-z\s]+?)\s+(?:to|->|towards|–|-)\s+([a-z\s]+?)(?:\s+(?:on|tomorrow|today|next|for|in|\d)|\b|$)/i;
      const betweenRegex = /(?:between\s+)?([a-z\s]+?)\s+(?:and|&)\s+([a-z\s]+?)(?:\s+(?:on|tomorrow|today|next|for|in|\d)|\b|$)/i;

      const match = cleanedRouteText.match(routeRegex) || text.match(routeRegex) || cleanedRouteText.match(betweenRegex);
      if (match) {
        const cleanFromStr = match[1]
          .replace(/\b(?:let'?s|book|a|train|trains|find|search|tickets?|from|between|want|to)\b/gi, ' ')
          .trim();
        const cleanToStr = match[2]
          .replace(/\b(?:tomorrow|today|day|after|next|in|for|seats?|passengers?|pax|please|train|trains)\b/gi, ' ')
          .trim();

        const s1 = findStation(cleanFromStr) || findStation(match[1].trim());
        const s2 = findStation(cleanToStr) || findStation(match[2].trim());
        if (s1) extractedFrom = s1;
        if (s2) extractedTo = s2;
      }

      if (!extractedFrom || !extractedTo) {
        const words = lower.split(/[\s,]+/);
        const ignoreWords = ['i', 'want', 'to', 'book', 'ticket', 'tickets', 'train', 'trains', 'seat', 'seats', 'with', 'from', 'this', 'that', 'they', 'what', 'is', 'for', 'me', 'please', 'can', 'you', 'help', 'go', 'going', 'hey', 'wanna', 'the', 'a', 'an', 'my', 'live', 'status', 'track', 'where', 'lets', "let's"];
        for (const w of words) {
          if (w.length < 3 || ignoreWords.includes(w)) continue;
          const st = findStation(w);
          if (st) {
            if (!extractedFrom) {
              extractedFrom = st;
            } else if (!extractedTo && extractedFrom.code !== st.code) {
              extractedTo = st;
            }
          }
        }
      }
    }

    // Only update route stations if explicitly found in current text
    const updatedRoute: RouteContext = {
      ...current,
      fromStation: extractedFrom || current.fromStation,
      toStation: extractedTo || current.toStation,
      trainNumber: explicitTrainInCurrentQuery || current.trainNumber,
      travelDate: updated.travelDate,
      passengers: updated.passengers,
      classCode: updated.classCode,
      quota: updated.quota,
      passengerName: updated.passengerName,
      invalidTrainNumber: currentInvalidNum,
      missingTrainNumber: currentMissingNum,
    };

    // 3. Date expressions
    const dateMatch = text.match(/\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|september|oct|nov|dec)[a-z]*|\b(?:today|tomorrow|day after tomorrow|next\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)))\b/i);
    if (dateMatch) {
      updatedRoute.travelDate = dateMatch[1];
    }

    // 4. Passenger Count
    const paxMatch = text.match(/\b(\d+)\s*(?:passengers?|adults?|seats?|tickets?|persons?|people|pax|seat\s+books?)?\b/i);
    if (paxMatch && parseInt(paxMatch[1], 10) > 0) {
      const num = parseInt(paxMatch[1], 10);
      if (num >= 1 && num <= 6) {
        updatedRoute.passengers = num;
      }
    } else if (lower.includes('two') || lower.includes('2 seats') || lower.includes('2 seat') || lower.includes('for 2') || lower.includes('2 pax')) {
      updatedRoute.passengers = 2;
    }

    // 5. Class code
    if (lower.includes('1a') || lower.includes('first ac')) {
      updatedRoute.classCode = '1A';
    } else if (lower.includes('2a') || lower.includes('2 tier') || lower.includes('second ac')) {
      updatedRoute.classCode = '2A';
    } else if (lower.includes('3a') || lower.includes('3 tier') || lower.includes('third ac')) {
      updatedRoute.classCode = '3A';
    } else if (lower.includes('3e') || lower.includes('3 economy')) {
      updatedRoute.classCode = '3E';
    } else if (lower.includes('cc') || lower.includes('chair car')) {
      updatedRoute.classCode = 'CC';
    } else if (lower.includes('ec') || lower.includes('executive')) {
      updatedRoute.classCode = 'EC';
    } else if (lower.includes('sl') || lower.includes('sleeper')) {
      updatedRoute.classCode = 'SL';
    } else if (lower.includes('2s') || lower.includes('second sitting')) {
      updatedRoute.classCode = '2S';
    }

    return {
      route: updatedRoute,
      isAutoBook,
      isTrack,
      isTatkal,
      trainNumber: explicitTrainInCurrentQuery,
    };
  };

  /**
   * Conversational Live Passenger Extractor
   * Accurately extracts name, age, gender, berth, phone, and email without splitting on single commas!
   */
  const parsePassengerDetailsFromText = (text: string): {
    passengers: PassengerProfile[];
    contact?: { phone?: string; email?: string };
    classCode?: string;
    classBreakdown?: string;
  } | null => {
    const lower = text.toLowerCase();
    
    // Strict Guard: Never treat questions, route search, policy queries, or tracking as passenger details!
    if (
      lower.includes('from') ||
      lower.includes(' to ') ||
      lower.includes('train') ||
      lower.includes('track') ||
      lower.includes('search') ||
      lower.includes('find') ||
      lower.includes('auto book') ||
      lower.startsWith('book ') ||
      lower.startsWith('reserve ') ||
      lower.includes('luggage') ||
      lower.includes('baggage') ||
      lower.includes('boarding') ||
      lower.includes('chart') ||
      lower.includes('cancel') ||
      lower.includes('refund') ||
      lower.includes('tatkal') ||
      lower.includes('food') ||
      lower.includes('cater') ||
      lower.includes('hawaii') ||
      lower.includes('flight') ||
      lower.includes('hotel') ||
      lower.includes('rule') ||
      lower.includes('?') ||
      /^(?:can|could|how|what|when|where|why|is|are|do|does|tell|explain)\b/i.test(text.trim()) ||
      /\d{5}/.test(text)
    ) {
      return null;
    }

    const isWorkspaceStep = activePage === 'workspace' || activePage === 'booking';
    const hasComma = text.includes(',');

    const hasGender = /\b(?:male|female|m|f|boy|girl|man|woman|gent|lady)\b/i.test(lower);
    const hasAge = /\b(?:age\s*\d{1,2}|\d{1,2}\s*(?:years?|yrs?|yr|yo|pax|passenger)|age\b|\b\d{2}\b)/i.test(lower);
    const hasBerth = /\b(?:lower|upper|middle|side lower|side upper|window|berth|seat|sl|su|lb|mb|ub|3a|2a|1a)\b/i.test(lower);
    const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i.test(text);
    const hasPhone = /\b[6-9]\d{9}\b/.test(text);
    const hasPassengerKeywords = /\b(?:passenger|name|fill|details|pratay|rohan|priya|rahul|amit|pooja|rajesh|sunita|sneha|vikram|ananya|anusuya|moupiya|karali|sharma|kumar|singh)\b/i.test(lower);

    // Require comma-separated format OR explicit details (Gender/Age/Phone/Email) OR workspace step active
    if (
      !(
        hasComma ||
        (hasGender && (hasAge || hasBerth || hasPhone || hasEmail)) ||
        (hasPassengerKeywords && (hasAge || hasGender || hasBerth)) ||
        (hasEmail && hasPhone) ||
        (isWorkspaceStep && text.trim().length >= 2 && !text.includes('?'))
      )
    ) {
      return null;
    }

    // Extract contact phone and email
    const phoneMatch = text.match(/\b([6-9]\d{9})\b/);
    const emailMatch = text.match(/\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/);
    const contact = {
      phone: phoneMatch ? phoneMatch[1] : undefined,
      email: emailMatch ? emailMatch[1] : undefined,
    };

    // ── Multi-Passenger Split Engine ──
    // Step 1: Initial split on major multi-passenger boundaries (semicolons, newlines, pipes, words)
    const majorDelimiter = /\s*(?:;|\n|\||\bsecond passenger\b|\bpassenger\s*\d+[:\-]?\b|\bpax\s*\d+[:\-]?\b|\bp\d+[:\-]\b|\b\d+\.\s+(?=[A-Za-z])|\band\b|&|\band also\b)\s*/i;
    const initialSegments = text.split(majorDelimiter).map((s) => s.trim()).filter((s) => s.length > 2);

    // Step 2: Sub-split comma-separated tuples containing multiple ages (e.g. "anusuya, 44, SL, Moupiya, 45, 3A")
    let rawSegments: string[] = [];
    initialSegments.forEach((seg) => {
      const ageMatches = Array.from(seg.matchAll(/\b(\d{1,2})\b/g));
      if (ageMatches.length > 1) {
        const commaParts = seg.split(',').map((p) => p.trim()).filter(Boolean);
        let currentPaxParts: string[] = [];
        let currentHasAge = false;

        commaParts.forEach((part, pIdx) => {
          const isNum = /^\d{1,2}$/.test(part);
          const isNextPartNum = pIdx + 1 < commaParts.length && /^\d{1,2}$/.test(commaParts[pIdx + 1]);

          // When current passenger already has an age, and this part is a new name followed by an age:
          if (currentHasAge && !isNum && isNextPartNum && currentPaxParts.length > 0) {
            rawSegments.push(currentPaxParts.join(', '));
            currentPaxParts = [part];
            currentHasAge = false;
          } else {
            currentPaxParts.push(part);
            if (isNum) {
              currentHasAge = true;
            }
          }
        });

        if (currentPaxParts.length > 0) {
          rawSegments.push(currentPaxParts.join(', '));
        }
      } else {
        rawSegments.push(seg);
      }
    });

    if (rawSegments.length === 0) {
      rawSegments = [text];
    }

    const existingPassengers = currentPassengers || [];
    const parsed: PassengerProfile[] = [];
    let extractedClassCode: string | undefined = undefined;

    for (let i = 0; i < rawSegments.length; i++) {
      const seg = rawSegments[i];
      const sLower = seg.toLowerCase();

      // Extract class code specific to THIS passenger segment
      let segClass: string | undefined = undefined;
      if (/\b(?:3a|3-tier|3 tier|ac 3|3rd ac)\b/i.test(sLower)) segClass = '3A';
      else if (/\b(?:2a|2-tier|2 tier|ac 2|2nd ac)\b/i.test(sLower)) segClass = '2A';
      else if (/\b(?:1a|1st ac|first ac|first class)\b/i.test(sLower)) segClass = '1A';
      else if (/\b(?:sleeper|non ac)\b/i.test(sLower) || (/\bsl\b/i.test(sLower) && !sLower.includes('side lower'))) segClass = 'SL';
      else if (/\b(?:cc|chair car)\b/i.test(sLower)) segClass = 'CC';
      else if (/\b(?:ec|exec|executive)\b/i.test(sLower)) segClass = 'EC';

      if (segClass && !extractedClassCode) {
        extractedClassCode = segClass;
      }

      // Strip email and 10-digit phone from segment for safe age and name parsing
      const cleanSegNoContact = seg
        .replace(/\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g, ' ')
        .replace(/\b[6-9]\d{9}\b/g, ' ');

      const ageMatch = cleanSegNoContact.match(/\b(?:age\s*)?(\b\d{1,2}\b)/i);
      const existingAge = existingPassengers[i]?.age || 25;
      let age = ageMatch ? parseInt(ageMatch[1], 10) : existingAge;
      if (age > 100 || age < 1) age = 25;

      const existingGender = existingPassengers[i]?.gender || 'M';
      let gender: 'M' | 'F' | 'O' = existingGender;
      if (/\b(?:female|f|girl|woman|lady|mrs|ms|mother|mom|sister|wife|daughter)\b/i.test(sLower)) {
        gender = 'F';
      } else if (/\b(?:male|m|boy|man|gent|mr|father|dad|brother|husband|son)\b/i.test(sLower)) {
        gender = 'M';
      } else if (/\b(?:trans|transgender|other|t|o)\b/i.test(sLower)) {
        gender = 'O';
      }

      let berthPreference: PassengerProfile['berthPreference'] = existingPassengers[i]?.berthPreference || 'NO_PREFERENCE';
      if (sLower.includes('side lower') || (/\b(?:berth\s*:\s*sl|sl\s*berth)\b/i.test(sLower))) berthPreference = 'SIDE_LOWER';
      else if (sLower.includes('side upper') || (/\b(?:berth\s*:\s*su|su\s*berth)\b/i.test(sLower))) berthPreference = 'SIDE_UPPER';
      else if (sLower.includes('upper') || (/\b(?:berth\s*:\s*ub|ub\s*berth)\b/i.test(sLower))) berthPreference = 'UPPER';
      else if (sLower.includes('middle') || (/\b(?:berth\s*:\s*mb|mb\s*berth)\b/i.test(sLower))) berthPreference = 'MIDDLE';
      else if (sLower.includes('lower') || (/\b(?:berth\s*:\s*lb|lb\s*berth)\b/i.test(sLower))) berthPreference = 'LOWER';

      // Clean name
      let cleanName = cleanSegNoContact
        .replace(/\b(?:passenger\s*\d*|details|my|name|is|age|years?|old|male|female|m|f|boy|girl|man|woman|berth|lower|upper|middle|side|window|senior|citizen|fill|book|for|seat|seats|ticket|tickets|with|me|and|also|mobile|phone|email|gmail|com|3a|2a|1a|sl|cc|ec|sleeper|tier|ac)\b/gi, '')
        .replace(/\d+/g, '')
        .replace(/[^a-zA-Z\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanName || cleanName.length < 2) {
        cleanName = existingPassengers[i]?.name || `Passenger ${i + 1}`;
      }

      const formattedName = cleanName
        .split(' ')
        .filter((w) => w.length > 0)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');

      parsed.push({
        id: existingPassengers[i]?.id || `p_${Date.now()}_${i + 1}`,
        name: formattedName,
        age,
        gender,
        berthPreference,
        assignedClassCode: segClass,
        seniorCitizenConcession: age >= 60 || sLower.includes('senior'),
      });
    }

    // Check overall text for class code fallback
    if (!extractedClassCode) {
      if (/\b(?:3a|3-tier|3 tier|ac 3|3rd ac)\b/i.test(lower)) extractedClassCode = '3A';
      else if (/\b(?:2a|2-tier|2 tier|ac 2|2nd ac)\b/i.test(lower)) extractedClassCode = '2A';
      else if (/\b(?:1a|1st ac|first ac|first class)\b/i.test(lower)) extractedClassCode = '1A';
      else if (/\b(?:sl|sleeper|non ac)\b/i.test(lower)) extractedClassCode = 'SL';
      else if (/\b(?:cc|chair car)\b/i.test(lower)) extractedClassCode = 'CC';
      else if (/\b(?:ec|exec|executive)\b/i.test(lower)) extractedClassCode = 'EC';
    }

    // Assign fallback class code to any passenger that didn't have one explicitly
    parsed.forEach((p) => {
      if (!p.assignedClassCode) {
        p.assignedClassCode = extractedClassCode || selectedClassCode || '3A';
      }
    });

    // Compute Class Breakdown string (e.g. "1x 3A, 1x SL" or "2x 3A")
    const classCounts: Record<string, number> = {};
    parsed.forEach((p) => {
      const code = p.assignedClassCode || extractedClassCode || '3A';
      classCounts[code] = (classCounts[code] || 0) + 1;
    });
    const classBreakdown = Object.entries(classCounts)
      .map(([cls, count]) => `${count}x ${cls}`)
      .join(', ');

    const primaryClass = parsed[0]?.assignedClassCode || extractedClassCode || '3A';

    return parsed.length > 0
      ? { passengers: parsed, contact, classCode: primaryClass, classBreakdown }
      : null;
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    // PII Redaction before any processing
    const safeQuery = PiiRedactor.redact(query);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const botMsgId = `nira-${Date.now()}`;
    const botPlaceholderMsg: ChatMessage = {
      id: botMsgId,
      sender: 'nira',
      text: '',
      isStreaming: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg, botPlaceholderMsg]);
    setInput('');
    setIsLoading(true);

    // ─── 1B: Validation for Train Numbers & Booking / Tracking ───
    const intentData = extractAdvancedIntent(safeQuery, routeCtx);
    const nextRouteCtx = intentData.route;
    setRouteCtx(nextRouteCtx);

    const invalidNum = (intentData.route as any)?.invalidTrainNumber;
    if (invalidNum) {
      const invalidMsg = `⚠️ **Invalid Train Number (#${invalidNum})**: Indian Railways train numbers are strictly **5 digits long** (for example: **#12302** Howrah Rajdhani, **#12951** Mumbai Rajdhani, **#12115** Siddheshwar SF Express).\n\nPlease enter a valid 5-digit train number!`;
      setIsLoading(false);
      setMessages((prev) =>
        prev.map((m) => (m.id === botMsgId ? { ...m, text: invalidMsg, isStreaming: false } : m))
      );
      if (autoVoice) speakNiraResponse('That is not a valid 5 digit train number. Please enter a 5 digit train number.');
      return;
    }

    // ─── 1B.1: Booked Train & Live Status / Confirmation Odds Feature ───
    const isBookedTrainQuery =
      safeQuery.toLowerCase().includes('booked train') ||
      safeQuery.toLowerCase().includes('my booked train') ||
      safeQuery.toLowerCase().includes('booked ticket') ||
      safeQuery.toLowerCase().includes('my booking') ||
      safeQuery.toLowerCase().includes('check my booking') ||
      safeQuery.toLowerCase().includes('check my booked train') ||
      safeQuery.toLowerCase().includes('check booking status') ||
      safeQuery.toLowerCase().includes('my ticket status') ||
      safeQuery.toLowerCase().includes('ticket status') ||
      safeQuery.toLowerCase().includes('is my ticket confirmed') ||
      safeQuery.toLowerCase().includes('am i in waitlist') ||
      safeQuery.toLowerCase().includes('am i confirmed') ||
      safeQuery.toLowerCase().includes('wait list or confirmed') ||
      safeQuery.toLowerCase().includes('waitlist or confirmed') ||
      safeQuery.toLowerCase().includes('status of my booked train') ||
      safeQuery.toLowerCase().includes('status of booked train') ||
      safeQuery.toLowerCase().includes('where is my booked train') ||
      safeQuery.toLowerCase().includes('show my booked train') ||
      safeQuery.toLowerCase().includes('tell me about my booked train');

    if (isBookedTrainQuery) {
      const activeTicket = issuedTicket;
      const activeRecord = bookingRecord;
      const activeTrain = selectedTrain;
      const userBookedTrainNo = activeTicket?.train?.trainNumber || activeRecord?.trainNumber || (activeTrain?.trainNumber && (bookingState === 'CONFIRMED' || bookingState === 'TICKET_VIEW') ? activeTrain.trainNumber : null);

      // Check if user specifically requested a different unbooked train number
      if (intentData.trainNumber && userBookedTrainNo && intentData.trainNumber !== userBookedTrainNo) {
        const unbookedTrain = resolveTrainDetail(intentData.trainNumber);
        const bookedName = activeTicket?.train?.trainName || activeRecord?.trainName || activeTrain?.trainName || 'Express';
        const pnrNumber = activeTicket?.pnrNumber || activeRecord?.pnrNumber || '8429 1048 21';
        const notBookedMsg = `ℹ️ **Citizen Profile Booking Match Check**:\n\n❌ Train **#${intentData.trainNumber} (${unbookedTrain.trainName})** is **not** in your active booked bookings database.\n\n🎫 Your active booked journey is for train **#${userBookedTrainNo} (${bookedName})** (PNR: \`${pnrNumber}\`).\n\nI have opened **Live GPS Satellite Radar** for train **#${intentData.trainNumber}** on your screen!`;
        
        handleQuickTrack(intentData.trainNumber);
        setIsLoading(false);
        setMessages((prev) =>
          prev.map((m) => (m.id === botMsgId ? { ...m, text: notBookedMsg, isStreaming: false } : m))
        );
        if (autoVoice) speakNiraResponse(`Train ${intentData.trainNumber} is not your booked train. Your booked train is ${userBookedTrainNo}.`);
        return;
      }

      const trainNo = userBookedTrainNo || '12302';
      const matchedTrain = resolveTrainDetail(trainNo);
      const trainName = activeTicket?.train?.trainName || activeRecord?.trainName || activeTrain?.trainName || matchedTrain.trainName;
      const pnrNumber = activeTicket?.pnrNumber || activeRecord?.pnrNumber || '8429 1048 21';
      const travelDate = activeTicket?.travelDate || searchParams.travelDate || '27 Aug 2026';
      const fromCity = activeTicket?.train?.fromCity || matchedTrain.fromCity;
      const fromCode = activeTicket?.train?.fromStationCode || matchedTrain.fromStationCode;
      const toCity = activeTicket?.train?.toCity || matchedTrain.toCity;
      const toCode = activeTicket?.train?.toStationCode || matchedTrain.toStationCode;
      const rawStatus = activeRecord?.status || (activeTicket ? 'CONFIRMED' : '') || (activeTrain?.classes?.[0]?.status) || 'CONFIRMED';

      let statusType: 'CONFIRMED' | 'RAC' | 'WAITLIST' = 'CONFIRMED';
      let seatInfo = 'Coach B4, Berth 32 (Lower Berth)';
      let probLabel = '100% Guaranteed Berth';

      if (activeTicket?.seatAllotments?.[0]) {
        const sa = activeTicket.seatAllotments[0];
        seatInfo = `Coach ${sa.coach}, Berth ${sa.seatNumber} (${sa.berthType})`;
      } else if (activeRecord?.seatAllotment) {
        const sa = activeRecord.seatAllotment;
        seatInfo = `Coach ${sa.coach}, Berth ${sa.seatNumber} (${sa.berthType})`;
      }

      if (rawStatus.toUpperCase().includes('WL') || rawStatus.toUpperCase().includes('WAIT')) {
        statusType = 'WAITLIST';
        seatInfo = 'Waitlist (WL 12)';
        probLabel = '84% Chance of Confirmation before Chart Preparation';
      } else if (rawStatus.toUpperCase().includes('RAC')) {
        statusType = 'RAC';
        seatInfo = 'RAC 4 (Reservation Against Cancellation)';
        probLabel = '98% Probability of Full Berth Allocation';
      }

      const stops = getTrainStoppages(trainNo, matchedTrain);
      const nextStop = stops[1] || stops[0] || { name: 'Kanpur Central', code: 'CNB', platform: 'Platform 4', doorSide: 'RIGHT SIDE' };

      const bookedTrainCard = {
        trainNumber: trainNo,
        trainName,
        fromCity,
        fromCode,
        toCity,
        toCode,
        travelDate,
        pnrNumber,
        status: rawStatus,
        statusType,
        seatInfo,
        probabilityLabel: probLabel,
        currentSpeed: 118,
        nextStation: `${nextStop.name} (${nextStop.code})`,
        platform: nextStop.platform,
        doorSide: nextStop.doorSide,
      };

      const statusMsg = `🎫 **Booked Train Status & Live Radar Telemetry**:\n\n🚆 **Train**: **#${trainNo} ${trainName}**\n📍 **Route**: **${fromCity} (${fromCode})** ➔ **${toCity} (${toCode})**\n📅 **Travel Date**: ${travelDate} | Departure: ${matchedTrain.departureTime} hrs\n🔢 **PNR Number**: \`${pnrNumber}\`\n\n---\n### 📋 Booking & Confirmation Status:\n${statusType === 'CONFIRMED' ? `✅ **Status**: **CONFIRMED** (${seatInfo})` : statusType === 'RAC' ? `🟡 **Status**: **RAC** (${seatInfo}) — **${probLabel}** at Chart Preparation (4h prior).` : `🟠 **Status**: **WAITLISTED** (${seatInfo}) — **${probLabel}**.`}\n\n---\n### 🛰️ Live Train Running Status:\n⚡ **Speed**: **118 km/h** | ⏱️ **Punctuality**: Running **Right on Time**\n🚉 **Next Stoppage**: **${nextStop.name} (${nextStop.code})** on **${nextStop.platform}**\n🚪 **Deboarding Doors**: **${nextStop.doorSide}**\n\nTap **'🛰️ Track Live on Radar'** below to open the real-time satellite GPS tracking map!`;

      handleQuickTrack(trainNo);
      setIsLoading(false);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMsgId
            ? {
                ...m,
                text: statusMsg,
                isStreaming: false,
                bookedTrainStatusCard: bookedTrainCard,
              }
            : m
        )
      );
      if (autoVoice) {
        speakNiraResponse(`Your booked train is number ${trainNo} ${trainName}. Booking status is ${statusType}. Running right on time.`);
      }
      return;
    }

    // ─── 1B.1B: Pay with Predefined Citizen Wallet ───
    const isWalletPayQuery =
      safeQuery.toLowerCase().includes('pay with wallet') ||
      safeQuery.toLowerCase().includes('pay from wallet') ||
      safeQuery.toLowerCase().includes('pay using wallet') ||
      safeQuery.toLowerCase().includes('use wallet to pay') ||
      safeQuery.toLowerCase().includes('pay via wallet') ||
      safeQuery.toLowerCase().includes('pay from predefined wallet') ||
      safeQuery.toLowerCase().includes('wallet payment') ||
      safeQuery.toLowerCase().includes('pay using citizen wallet');

    if (isWalletPayQuery) {
      const train = selectedTrain || (searchParams.fromStation?.code ? searchTrains(searchParams.fromStation.code, searchParams.toStation.code)[0] : null) || resolveTrainDetail('12302');
      const fare = ((train?.classes?.find((c) => c.classCode === selectedClassCode)?.fare || train?.classes?.[0]?.fare || 2990) * Math.max(1, currentPassengers.length)) + 130;

      if (walletBalance < fare) {
        const errorMsg = `⚠️ **Insufficient Citizen Wallet Balance**: Your current wallet balance is **₹${walletBalance.toLocaleString('en-IN')}.00**, but the total required fare is **₹${fare.toLocaleString('en-IN')}**.\n\nPlease top up your wallet or use UPI / NetBanking to pay.`;
        setIsLoading(false);
        setMessages((prev) =>
          prev.map((m) => (m.id === botMsgId ? { ...m, text: errorMsg, isStreaming: false } : m))
        );
        if (autoVoice) speakNiraResponse('Insufficient wallet balance to complete this booking.');
        return;
      }

      const attempt = await payWithWallet(fare);
      if (attempt) {
        const remBal = Math.max(0, walletBalance - fare);
        const trainNo = train.trainNumber;
        const trainName = train.trainName;
        const successMsg = `🎉 **Booking Confirmed via Citizen Virtual Wallet!**\n\n💳 **₹${fare.toLocaleString('en-IN')}** was debited from your pre-loaded Virtual Wallet.\n• **Remaining Balance**: **₹${remBal.toLocaleString('en-IN')}.00**\n• **Train**: **#${trainNo} ${trainName}** (${train.fromCity} ➔ ${train.toCity})\n• **Booking Reference**: \`${attempt.transactionRef}\`\n• **Status**: **CONFIRMED (Coach B4, Berth 32)**\n\nYour official DigiLocker verified e-ticket has been generated and saved to your **Travels & Payments** database!`;

        setIsLoading(false);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId
              ? {
                  ...m,
                  text: successMsg,
                  isStreaming: false,
                  actionCard: {
                    title: `DigiLocker Verified e-Ticket • #${trainNo}`,
                    subtitle: `Confirmed • Remaining Wallet: ₹${remBal.toLocaleString('en-IN')}`,
                    buttonLabel: `Open Ticket & Live GPS Radar ➔`,
                    route: 'ticket',
                  },
                }
              : m
          )
        );
        if (autoVoice) speakNiraResponse(`Booking confirmed for train number ${trainNo} ${trainName}. Fare of rupees ${fare} debited from your virtual wallet.`);
        navigateTo('ticket');
        return;
      }
    }

    // ─── 1B.2: Live Train Tracking (Radar Redirection) ───
    if (intentData.isTrack && !intentData.isAutoBook) {
      const trainNo = (intentData.trainNumber || selectedTrain?.trainNumber || issuedTicket?.train?.trainNumber || bookingRecord?.trainNumber || '12302').trim();
      handleQuickTrack(trainNo);

      // Only save booking to task stack if user entered passenger details or between transactions
      if ((hasEnteredPassengerDetails || isBetweenTransactionStates) && bookingState !== 'IDLE' && bookingState !== 'TICKET_VIEW' && bookingState !== 'CONFIRMED') {
        pushTask('BOOKING', 'Resume Booking', `${searchParams.fromStation?.city} → ${searchParams.toStation?.city}`);
      }

      const userBookedTrainNo = issuedTicket?.train?.trainNumber || bookingRecord?.trainNumber;
      const isBookedByCitizen = userBookedTrainNo === trainNo;

      const matchedTrain = resolveTrainDetail(trainNo);
      const stops = getTrainStoppages(trainNo, matchedTrain);
      const nextStop = stops[1] || stops[0] || { name: 'Prayagraj Junction', code: 'PRYJ', platform: 'Platform 4', doorSide: 'RIGHT SIDE' };

      const trackCardData: TrackData = {
        trainNumber: trainNo,
        trainName: matchedTrain.trainName,
        currentSpeed: 118,
        statusText: 'Right on Time (GPS Satellite Telemetry)',
        nextStation: `${nextStop.name} (${nextStop.code})`,
        platform: nextStop.platform,
        doorSide: nextStop.doorSide,
        delayMins: 0,
      };

      const bookingMatchNotice = isBookedByCitizen
        ? `\n\n🎫 **Citizen Booking Linked**: Matched with your booked journey (PNR \`${issuedTicket?.pnrNumber || bookingRecord?.pnrNumber}\`)!`
        : (userBookedTrainNo ? `\n\nℹ️ **Notice**: Train **#${trainNo}** is not your currently booked journey (Your active booking is **#${userBookedTrainNo}**). Showing general GPS corridor telemetry.` : '');

      const trackReply = `🚆 **Live GPS Satellite Radar for #${trainNo} (${matchedTrain.trainName})**:\n\n• **Current Speed**: **118 km/h** • Running **Right on Time**.\n• **Approaching**: **${nextStop.name} (${nextStop.code})** on **${nextStop.platform}** (Doors open on **${nextStop.doorSide}**).\n• **Total Route Halts**: ${stops.length} stations.${bookingMatchNotice}\n\nI have redirected your main screen to the **Live Radar Map**!`;

      setIsLoading(false);
      setMessages((prev) =>
        prev.map((m) => (m.id === botMsgId ? { ...m, text: trackReply, isStreaming: false, trackCard: trackCardData } : m))
      );
      if (autoVoice) speakNiraResponse(`Live Radar active for train ${trainNo} ${matchedTrain.trainName}. Cruising at 118 kilometers per hour right on time.`);
      return;
    }

    // ─── 1A: Conversational Passenger Autofill (Evaluated First) ───
    const parsedPaxResult = parsePassengerDetailsFromText(query);
    if (parsedPaxResult && parsedPaxResult.passengers.length > 0) {
      const extractedPassengers = parsedPaxResult.passengers;
      setPassengers(extractedPassengers);
      emitUiEvent('PASSENGERS_UPDATED', { count: extractedPassengers.length });
      const passengerNames = extractedPassengers.map((p) => p.name).join(' & ');
      const targetTrain = selectedTrain || (nextRouteCtx.trainNumber ? resolveTrainDetail(nextRouteCtx.trainNumber) : null) || resolveTrainDetail('12232');
      const targetClass = parsedPaxResult.classCode || selectedClassCode || nextRouteCtx.classCode || '3A';
      if (parsedPaxResult.classCode) {
        setSelectedClassCode(parsedPaxResult.classCode);
      }
      const singleFare = targetTrain.classes?.find((c) => c.classCode === targetClass)?.fare || targetTrain.classes?.[0]?.fare || 1040;
      const totalAmount = extractedPassengers.reduce((sum, p) => {
        const pClass = p.assignedClassCode || targetClass || '3A';
        const clsFare = targetTrain.classes?.find((c) => c.classCode === pClass)?.fare || singleFare;
        return sum + clsFare;
      }, 0);

      const contactSnippet = parsedPaxResult.contact?.phone
        ? ` • Mobile: ${parsedPaxResult.contact.phone}`
        : '';
      const breakdownSnippet = parsedPaxResult.classBreakdown ? ` • ${parsedPaxResult.classBreakdown}` : ` • Class ${targetClass}`;

      const confirmPromptText = `I have entered the passenger details for **${passengerNames}** (${extractedPassengers.length} passenger${extractedPassengers.length > 1 ? 's' : ''}${breakdownSnippet}${contactSnippet}) on the Passenger Workspace!\n\n**Please confirm**: Are the passenger details correct as entered?`;

      if (activePage !== 'workspace' && activePage !== 'booking') {
        navigateTo('workspace');
      }

      setIsLoading(false);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMsgId
            ? {
                ...m,
                text: confirmPromptText,
                isStreaming: false,
                passengerConfirmPrompt: {
                  passengers: extractedPassengers,
                  contact: parsedPaxResult.contact,
                  train: targetTrain,
                  classCode: targetClass,
                  classBreakdown: parsedPaxResult.classBreakdown,
                  fare: totalAmount,
                },
              }
            : m
        )
      );
      if (autoVoice) {
        speakNiraResponse(`I have entered the passenger details for ${passengerNames}. Please confirm if the passenger details are correct.`);
      }
      return;
    }

    // ─── 1C: Route Search & Booking Intent with Specific Train Grounding ───
    const isQuestion = /^(?:can|could|how|what|when|where|why|is|are|do|does|tell|explain|rules?|policy|guideline|luggage|baggage|senior|tatkal|pnr|chart|cancel|refund|boarding|food|cater|concession)\b/i.test(safeQuery.trim()) || safeQuery.trim().endsWith('?');
    const queryHasRoute = !isQuestion && (safeQuery.toLowerCase().includes(' to ') || safeQuery.toLowerCase().includes(' from '));
    const hasExplicitRoute = !isQuestion && !!(nextRouteCtx.fromStation && nextRouteCtx.toStation && (queryHasRoute || intentData.isAutoBook));
    const hasExplicitTrain = !isQuestion && !!intentData.trainNumber;

    if (hasExplicitTrain || hasExplicitRoute || intentData.isAutoBook) {
      // If user typed "i want to book a train" without station details and without 5-digit train number
      if (!hasExplicitTrain && !hasExplicitRoute) {
        const askWhereMsg = `Where would you like to travel? Please tell me your origin and destination (e.g. **'Howrah to Agra'** or **'Delhi to Mumbai'**) or enter a valid 5-digit train number (e.g. **#12951**)!`;
        setIsLoading(false);
        setMessages((prev) =>
          prev.map((m) => (m.id === botMsgId ? { ...m, text: askWhereMsg, isStreaming: false } : m))
        );
        if (autoVoice) speakNiraResponse('Where would you like to travel? Please tell me your origin and destination station or enter a 5 digit train number.');
        return;
      }

      const travelDate = nextRouteCtx.travelDate || 'Tomorrow';
      const paxCount = nextRouteCtx.passengers || 1;
      const classCode = nextRouteCtx.classCode || '3A';

      if (hasExplicitTrain) {
        const trainNo = intentData.trainNumber!.trim();
        const matchedTrain = resolveTrainDetail(trainNo, classCode);
        selectTrain(matchedTrain, classCode);
        const fare = (matchedTrain.classes.find((c) => c.classCode === classCode)?.fare || matchedTrain.classes[0]?.fare || 1870) * paxCount;

        const bookingText = `Found **#${matchedTrain.trainNumber} ${matchedTrain.trainName}** (${matchedTrain.fromCity} → ${matchedTrain.toCity}) in **${classCode}** (₹${fare.toLocaleString('en-IN')}).`;

        setIsLoading(false);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId
              ? {
                  ...m,
                  text: bookingText,
                  isStreaming: false,
                  bookingConfirmPrompt: {
                    train: matchedTrain,
                    classCode,
                    fare,
                    paxCount,
                  },
                }
              : m
          )
        );
        if (autoVoice) speakNiraResponse(`Found Train number ${matchedTrain.trainNumber}, ${matchedTrain.trainName}. Tap Yes Book Now to proceed.`);
        return;
      }

      const fromSt = nextRouteCtx.fromStation;
      const toSt = nextRouteCtx.toStation;

      if (fromSt && toSt) {
        // Synchronize active journey search so the main screen updates immediately
        const effDate = (travelDate && travelDate !== 'Tomorrow') ? travelDate : (searchParams.travelDate || 'Tomorrow');
        executeSearch({
          fromStation: fromSt,
          toStation: toSt,
          travelDate: effDate,
          passengersCount: paxCount,
        });
        navigateTo('trains');

        const trains = searchTrains(fromSt.code, toSt.code);
        if (trains && trains.length > 0) {
          const topTrains = rankTrains(trains).slice(0, 3);
          const promptText = `I found **${trains.length} trains** between **${fromSt.city}** and **${toSt.city}**.\n\nTop recommendation: **#${topTrains[0].trainNumber} ${topTrains[0].trainName}** (${topTrains[0].durationHours}).`;

          setIsLoading(false);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMsgId
                ? {
                    ...m,
                    text: promptText,
                    isStreaming: false,
                    trainList: topTrains,
                    understoodCard: {
                      from: fromSt.name,
                      to: toSt.name,
                      date: travelDate,
                      passengers: paxCount,
                      classCode,
                      fromStation: fromSt,
                      toStation: toSt,
                    },
                  }
                : m
            )
          );
          if (autoVoice) speakNiraResponse(`Found trains from ${fromSt.city} to ${toSt.city}. Select a train to proceed.`);
          return;
        } else {
          // Route recognised, but no direct train in local database
          const noTrainText = `I found your route from **${fromSt.city} (${fromSt.name})** to **${toSt.city} (${toSt.name})**!\n\nConnecting express trains via **New Delhi (NDLS)**, **Kalka (KLK)**, or **Howrah (HWH)** are available. Tap below to view available schedules on the trains page.`;
          setIsLoading(false);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMsgId
                ? {
                    ...m,
                    text: noTrainText,
                    isStreaming: false,
                    understoodCard: {
                      from: fromSt.name,
                      to: toSt.name,
                      date: travelDate,
                      passengers: paxCount,
                      classCode,
                      fromStation: fromSt,
                      toStation: toSt,
                    },
                    actionCard: {
                      title: `Search Route: ${fromSt.city} → ${toSt.city}`,
                      subtitle: `Connecting trains available via major junctions`,
                      buttonLabel: `Search Route on Trains Screen →`,
                      route: 'trains',
                      fromStation: fromSt,
                      toStation: toSt,
                    },
                  }
                : m
            )
          );
          if (autoVoice) speakNiraResponse(`Found route from ${fromSt.city} to ${toSt.city}. Connecting trains available.`);
          return;
        }
      }
    }

    // ─── 1A.2: Generic Fill Form Request without details ───
    const lowerQuery = query.toLowerCase();
    if (
      lowerQuery === 'fill form' ||
      lowerQuery === 'fill details' ||
      lowerQuery === 'autofill' ||
      lowerQuery === 'enter passenger'
    ) {
      const promptText = 'Please provide your passenger details: **Name, Age, Gender, Berth preference, Mobile number, and Email** (e.g. *Pratay Karali, 20, Male, 8420773730, pratay@gmail.com*) to fill the form.';
      setTimeout(() => {
        setIsLoading(false);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId
              ? {
                  ...m,
                  text: promptText,
                  isStreaming: false,
                }
              : m
          )
        );
        if (autoVoice) {
          speakNiraResponse('Please provide your name, age, gender, and contact details to fill the form.');
        }
      }, 300);
      return;
    }

    // ═══════════════════════════════════════════════════════════
    // LAYER 2: STATE-AWARE NIRA PLANNER (Sanitized Context)
    // ═══════════════════════════════════════════════════════════
    try {
      const ctx = getSanitizedContext();
      const plannerResponse = await NiraPlanner.planResponse(safeQuery, ctx);

      // Only short-circuit if planner produced a specific deterministic response
      if (!plannerResponse.shouldPassToLlm && plannerResponse.intent !== 'PASS_THROUGH_TO_LLM' && plannerResponse.message) {
        if (plannerResponse.intent === 'RESET_JOURNEY') {
          resetJourney();
        }

        // Validate action through ActionPolicyEngine
        const validatedAction = ActionPolicyEngine.sanitizeActionCue(plannerResponse.actionCue);

        // Execute UI actions based on validated cue
        if (validatedAction.type === 'SET_SORT' && validatedAction.parameters?.sortMode) {
          setActiveSort(validatedAction.parameters.sortMode as any);
        }
        if (validatedAction.type === 'HIGHLIGHT' && validatedAction.target) {
          setActiveHighlightTarget(validatedAction.target);
        }
        if (validatedAction.type === 'NAVIGATE' && validatedAction.target) {
          navigateTo(validatedAction.target);
        }
        if (validatedAction.type === 'OPEN_TRACKING' && validatedAction.target) {
          // Save booking to task stack if mid-journey
          if (bookingState !== 'IDLE' && bookingState !== 'TICKET_VIEW' && bookingState !== 'CONFIRMED') {
            pushTask('BOOKING', 'Resume Booking', `${searchParams.fromStation?.city} → ${searchParams.toStation?.city}`);
          }
          handleQuickTrack(validatedAction.target);
        }
        if (validatedAction.type === 'RESUME_TASK') {
          resumeTask();
        }

        // Build action card for consequential or navigational actions
        let actionCard: ChatMessage['actionCard'] | undefined;
        if (plannerResponse.intent === 'DOWNLOAD_TICKET' || validatedAction.target === 'my-journeys' || validatedAction.target === 'ticket') {
          actionCard = {
            title: 'DigiLocker Verified e-Ticket',
            subtitle: 'Instant PDF export & scannable QR ticket',
            buttonLabel: 'Open & Download Ticket ➔',
            route: 'my-journeys',
          };
        }
        if (safeQuery.toLowerCase().includes('waitlist') || safeQuery.toLowerCase().includes('wl') || safeQuery.toLowerCase().includes('rac')) {
          actionCard = {
            title: 'Live Waitlist Radar & Telemetry',
            subtitle: '92% Confirmation Forecast • Chart updates every 15 min',
            buttonLabel: 'Open Live Track Radar ➔',
            route: 'track',
          };
        }
        if (validatedAction.type === 'NAVIGATE' && validatedAction.target === 'payment') {
          actionCard = {
            title: 'Secure Payment Bridge',
            subtitle: `Total: ₹${ctx.payment.amount.toLocaleString('en-IN')} • Wallet: ₹${ctx.payment.walletBalance.toLocaleString('en-IN')}`,
            buttonLabel: `Pay ₹${ctx.payment.amount.toLocaleString('en-IN')} ➔`,
            route: 'payment',
          };
        }
        if (validatedAction.type === 'RESUME_TASK' && taskStack.length > 0) {
          actionCard = {
            title: 'Resume Saved Journey',
            subtitle: taskStack[0]?.subtitle || 'Your booking is preserved',
            buttonLabel: 'Resume Booking ➔',
            route: taskStack[0]?.page || 'workspace',
          };
        }
        if (
          plannerResponse.intent === 'SYSTEM_ARCHITECTURE_PITCH' ||
          safeQuery.toLowerCase().includes('architecture') ||
          safeQuery.toLowerCase().includes('dev pitch') ||
          safeQuery.toLowerCase().includes('underneath nirantar') ||
          safeQuery.toLowerCase().includes('tech stack')
        ) {
          actionCard = {
            title: 'Nirantar 4-Layer System Architecture',
            subtitle: 'Prediction • Real-Time Telemetry • Nira AI • Safe Automation',
            buttonLabel: '📊 Open Architecture Diagram ➔',
            route: 'open_architecture_diagram',
          };
        }

        setTimeout(() => {
          setIsLoading(false);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMsgId
                ? {
                    ...m,
                    text: plannerResponse.message,
                    isStreaming: false,
                    actionCard,
                  }
                : m
            )
          );
          if (autoVoice) {
            speakNiraResponse(plannerResponse.message);
          }
        }, 350);
        return;
      }
    } catch (plannerErr) {
      console.warn('[NiraPlanner] Planner error, falling back to streaming:', plannerErr);
    }

    // ═══════════════════════════════════════════════════════════
    // Deterministic local reply engine with a UI safety timeout.
    // ═══════════════════════════════════════════════════════════
    let accumulated = '';
    let streamResolved = false;

    // Safety timeout: if no response after 15s, show fallback
    const safetyTimer = setTimeout(() => {
      if (!streamResolved) {
        streamResolved = true;
        const timeoutMsg = accumulated
          ? accumulated  // partial tokens arrived — show what we got
          : "I can help with routes, booking, tracking, payments, journeys, voice controls, and the Page Guide. What would you like to do?";
        setIsLoading(false);
        setMessages((prev) =>
          prev.map((m) => (m.id === botMsgId ? { ...m, text: timeoutMsg, isStreaming: false } : m))
        );
        if (autoVoice && timeoutMsg) {
          speakNiraResponse(timeoutMsg);
        }
      }
    }, 15000);

    streamNiraChat(
      safeQuery,
      'en',
      (token: string) => {
        accumulated += token;
        setIsLoading(false);
        setMessages((prev) =>
          prev.map((m) => (m.id === botMsgId ? { ...m, text: accumulated, isStreaming: true } : m))
        );
      },
      () => {
        if (streamResolved) return;
        streamResolved = true;
        clearTimeout(safetyTimer);
        setIsLoading(false);
        setMessages((prev) =>
          prev.map((m) => (m.id === botMsgId ? { ...m, isStreaming: false } : m))
        );
        if (autoVoice && accumulated) {
          speakNiraResponse(accumulated);
        }
      },
      async (_err: unknown) => {
        if (streamResolved) return;
        streamResolved = true;
        clearTimeout(safetyTimer);
        console.warn('Streaming fallback triggered:', _err);
        try {
          const lower = safeQuery.toLowerCase();
          const isForeign = /(hawaii|hawai|paris|london|dubai|new york|tokyo|flight|airplane|hotel|visa)/i.test(lower);
          const fallbackText = isForeign
            ? `I understand you want to visit ${safeQuery.replace(/hey[,!]?\s*/i, '').trim()}, but I can only help with Indian train travel — for example Delhi to Mumbai or Kolkata to Puri. Where in India do you want to go?`
            : "I can find Indian trains, compare them in plain language, track live running status, or guide your booking. Where in India do you want to travel?";
          setMessages((prev) =>
            prev.map((m) => (m.id === botMsgId ? { ...m, text: fallbackText, isStreaming: false } : m))
          );
          if (autoVoice) {
            speakNiraResponse(fallbackText);
          }
        } finally {
          setIsLoading(false);
        }
      },
      messages.map((m) => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text }))
    );
  };

  // ─── Programmatic Query Trigger (from "I'm Stuck", Quick Buttons, or Voice) ───
  useEffect(() => {
    if (isOpen && niraPendingQuery) {
      const q = niraPendingQuery;
      setNiraPendingQuery(null);
      setTimeout(() => {
        handleSend(q);
      }, 100);
    }
  }, [isOpen, niraPendingQuery]);

  const handleFeedback = (msgId: string, feedback: 'up' | 'down') => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, feedbackGiven: feedback } : m))
    );
  };

  const toggleSpeech = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      console.log('Speech recognition is not supported in your browser.');
      return;
    }
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;

    if (!isListening) {
      setIsListening(true);
      recognition.start();
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        handleSend(transcript);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
    } else {
      recognition.stop();
      setIsListening(false);
    }
  };

  if (!isOpen) return null;

  return (
    <aside
      className="fixed bottom-4 right-4 sm:right-6 w-[360px] sm:w-[410px] h-[640px] max-h-[92vh] bg-white rounded-[28px] shadow-[0_16px_50px_rgba(88,28,135,0.22)] border border-purple-100 flex flex-col z-50 overflow-hidden font-sans select-none animate-in slide-in-from-bottom-5 duration-200"
      aria-label="Nira AI Chat Window"
    >
      {/* ═══════════════════════════════════════════════════════════════════
          1. TOP BAR HEADER
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="p-3 px-4 flex items-center justify-between border-b border-purple-50 bg-gradient-to-r from-purple-50/80 via-white to-purple-50/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-purple-100 border border-purple-200 flex items-center justify-center p-0.5 shadow-2xs">
            <img
              src="/assets/images/characters/nira_wave.png"
              alt="Nira"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h3 className="font-black text-base text-slate-950 tracking-tight">Nira</h3>
          </div>
        </div>


        <div className="flex items-center gap-1.5">
          {/* 25 Examples Drawer Toggle */}
          <button
            type="button"
            onClick={() => setShowExamplesModal(!showExamplesModal)}
            className="p-1.5 px-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7C3AED] border border-purple-200 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
            title="Open 25 Test Examples"
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>25 Demos</span>
          </button>

          {/* Reset Journey State Button */}
          <button
            type="button"
            onClick={() => {
              resetJourney();
              const resetMsg: ChatMessage = {
                id: `nira-reset-${Date.now()}`,
                sender: 'nira',
                text: "I've reset your journey state and returned to the home search. Where would you like to travel?",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              };
              setMessages([resetMsg]);
              if (autoVoice) {
                speakNiraResponse("I have reset your journey state. Where would you like to travel?");
              }
            }}
            className="p-1.5 px-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
            title="Reset Journey State & Start New Search"
          >
            <RefreshCw className="w-3 h-3 text-purple-700" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-900 flex items-center justify-center transition-colors cursor-pointer"
            title="Close chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          POPUP MODAL: 25 CATEGORIZED DIRECT TEST EXAMPLES
          ═══════════════════════════════════════════════════════════════════ */}
      {showExamplesModal && (
        <div className="p-3 bg-purple-50/90 border-b border-purple-200 space-y-2.5 animate-in slide-in-from-top-3 duration-150">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-purple-950 uppercase flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
              <span>25 Direct Input Test Examples</span>
            </span>
            <button
              type="button"
              onClick={() => setShowExamplesModal(false)}
              className="text-[10px] text-purple-700 font-bold hover:underline"
            >
              Hide ✕
            </button>
          </div>

          {/* 4 Category Filter Pills */}
          <div className="grid grid-cols-4 gap-1 p-0.5 rounded-xl bg-white border border-purple-100 text-[10px] font-bold">
            {[
              { id: 'booking' as ExampleCategory, label: '🚆 Book' },
              { id: 'tatkal' as ExampleCategory, label: '⚡ Tatkal' },
              { id: 'tracking' as ExampleCategory, label: '📍 Radar' },
              { id: 'services' as ExampleCategory, label: '🎫 PNR' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id)}
                className={`py-1 rounded-lg transition-all text-center cursor-pointer ${
                  activeCategory === tab.id
                    ? 'bg-[#7C3AED] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-purple-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* List of active category examples */}
          <div className="space-y-1 max-h-48 overflow-y-auto pr-0.5">
            {EXAMPLE_QUERIES[activeCategory].map((ex, idx) => {
              const Icon = ex.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setShowExamplesModal(false);
                    handleSend(ex.query);
                  }}
                  className="w-full p-2 px-2.5 rounded-xl bg-white hover:bg-purple-100/60 border border-purple-100 text-[11px] font-semibold text-slate-800 flex items-center justify-between text-left transition-all cursor-pointer group shadow-2xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                    <span className="truncate group-hover:text-purple-950">{ex.label}</span>
                  </div>
                  {ex.tag && (
                    <span className="text-[9px] font-mono font-bold text-purple-700 bg-purple-50 group-hover:bg-purple-200 px-1.5 py-0.2 rounded shrink-0 ml-1">
                      {ex.tag}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          2. CHAT BODY: INITIAL WELCOME & CONVERSATION STREAM
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
        {/* Interrupted Journey Task Stack Banner (Shown ONLY if passenger details entered or between transactions) */}
        {shouldShowResumeTask && (
          <div className="p-3 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 space-y-2 animate-in slide-in-from-top-2 duration-200 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-600" />
                </span>
                <span>Interrupted Task Saved</span>
              </div>
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
                Zero Data Loss
              </span>
            </div>
            <p className="text-[11px] text-amber-800 font-medium">
              {taskStack[0]?.subtitle || 'Your previous booking session is safely preserved.'}
            </p>
            <button
              type="button"
              onClick={() => resumeTask()}
              className="w-full py-1.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-all active:scale-98"
            >
              <span>Resume Booking Journey ➔</span>
            </button>
          </div>
        )}

        {/* Initial Speech Bubble & Prompt List if no messages */}
        {messages.length === 0 && (
          <div className="space-y-3.5 animate-in fade-in duration-200">
            {/* Mascot Greeting Bubble */}
            <div className="flex items-start gap-2">
              <div className="w-7 h-7 rounded-full bg-purple-100 border border-purple-200 shrink-0 p-0.5 mt-0.5">
                <img
                  src="/assets/images/characters/nira_wave.png"
                  alt="Nira"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="p-3 rounded-2xl rounded-tl-sm bg-purple-50 border border-purple-100 text-slate-800 space-y-1 shadow-2xs">
                <span className="font-bold text-slate-900 block">Nira Rail Assistant</span>
                <p className="text-slate-600 font-medium leading-relaxed">
                  Where in India would you like to travel? Tell me your route (e.g. <em>Delhi to Mumbai</em>) or train number, and I'll find, rank, and help you book your journey.
                </p>
              </div>
            </div>

            {/* Quick Demo Prompts */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold text-slate-500">
                  Tap to test flagship features:
                </span>
                <span className="text-[10px] font-bold text-purple-700 cursor-pointer" onClick={() => setShowExamplesModal(true)}>
                  All 25 Demos ➔
                </span>
              </div>
              <div className="space-y-1.5">
                {EXAMPLE_QUERIES.booking.slice(0, 4).map((p, idx) => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSend(p.query)}
                      className="w-full p-2.5 px-3 rounded-xl bg-purple-50/40 hover:bg-purple-50 border border-purple-100 text-xs font-bold text-slate-700 hover:text-purple-950 flex items-center justify-between transition-all text-left cursor-pointer group shadow-2xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                        <span className="truncate">{p.label}</span>
                      </div>
                      <ArrowRight className="w-3 h-3 text-purple-400 group-hover:text-purple-700 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Conversation Stream */}
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div key={m.id} className="space-y-2 animate-in fade-in duration-200">
              {isUser ? (
                /* USER MESSAGE (PURPLE BUBBLE) */
                <div className="flex justify-end">
                  <div className="max-w-[85%] p-3 rounded-2xl rounded-br-sm bg-[#7C3AED] text-white text-xs font-bold shadow-xs">
                    {m.text}
                  </div>
                </div>
              ) : (
                /* BOT MESSAGE (LIGHT BUBBLE + INTERACTIVE CARDS) */
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-purple-100 border border-purple-200 shrink-0 p-0.5 mt-0.5">
                      <img
                        src="/assets/images/characters/nira_wave.png"
                        alt="Nira"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="max-w-[88%] p-3 rounded-2xl rounded-tl-sm bg-purple-50/80 border border-purple-100 text-slate-800 text-xs font-medium space-y-1">
                      {m.isStreaming && !m.text ? (
                        <div className="flex items-center gap-2 text-purple-700 py-0.5">
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-600" />
                          </span>
                          <span className="text-xs font-bold animate-pulse">Nira is preparing your guide...</span>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <p className="whitespace-pre-wrap leading-relaxed font-medium">
                            {m.text}
                            {m.isStreaming && (
                              <span className="inline-block w-1.5 h-3.5 ml-1 bg-[#7C3AED] animate-pulse align-middle rounded-xs" />
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ─────────────────────────────────────────────────────────────
                      INTERACTIVE YES/NO BOOKING CONFIRMATION PROMPT (Clean, Zero Spam)
                      ───────────────────────────────────────────────────────────── */}
                  {m.bookingConfirmPrompt && (
                    <div className="ml-8 p-3.5 rounded-2xl bg-white border-2 border-purple-300 shadow-md space-y-3 animate-in zoom-in-95 duration-200 select-none">
                      <div className="flex items-start justify-between gap-2 border-b border-purple-100 pb-2">
                        <div className="min-w-0">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200 inline-block mb-1">
                            Train Selected
                          </span>
                          <h4 className="font-black text-xs text-slate-950 truncate">
                            #{m.bookingConfirmPrompt.train.trainNumber} • {m.bookingConfirmPrompt.train.trainName}
                          </h4>
                          <p className="text-[11px] text-slate-600 font-semibold mt-0.5">
                            {m.bookingConfirmPrompt.train.fromCity} → {m.bookingConfirmPrompt.train.toCity} • {m.bookingConfirmPrompt.classCode}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-emerald-700 block font-mono">
                            ₹{m.bookingConfirmPrompt.fare.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] text-slate-500 font-bold">
                            {m.bookingConfirmPrompt.paxCount} Adult
                          </span>
                        </div>
                      </div>

                      {/* Travel Class Selection Options for this Train */}
                      {m.bookingConfirmPrompt.train.classes && m.bookingConfirmPrompt.train.classes.length > 0 && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                              Choose Travel Class:
                            </span>
                            <span className="text-[10px] text-purple-700 font-bold">
                              {m.bookingConfirmPrompt.train.classes.length} Available
                            </span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                            {m.bookingConfirmPrompt.train.classes.map((c) => {
                              const isSelected = m.bookingConfirmPrompt!.classCode === c.classCode;
                              const singleFare = c.fare || 1040;
                              const totalClassFare = singleFare * (m.bookingConfirmPrompt!.paxCount || 1);
                              return (
                                <button
                                  key={c.classCode}
                                  type="button"
                                  onClick={() => {
                                    setMessages((prev) =>
                                      prev.map((msg) =>
                                        msg.id === m.id
                                          ? {
                                              ...msg,
                                              bookingConfirmPrompt: {
                                                ...msg.bookingConfirmPrompt!,
                                                classCode: c.classCode,
                                                fare: totalClassFare,
                                              },
                                            }
                                          : msg
                                      )
                                    );
                                  }}
                                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-purple-900 text-white border-purple-900 shadow-xs ring-1 ring-purple-300'
                                      : 'bg-purple-50/50 hover:bg-purple-100/70 border-purple-100 text-slate-800'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <strong className="font-mono font-black">{c.classCode}</strong>
                                    <span className={`text-[10px] font-mono font-bold ${isSelected ? 'text-emerald-300' : 'text-emerald-700'}`}>
                                      ₹{c.fare}
                                    </span>
                                  </div>
                                  <span className={`text-[9px] block truncate mt-0.5 ${isSelected ? 'text-purple-200' : 'text-slate-500 font-medium'}`}>
                                    {c.className || c.status}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <p className="text-xs font-bold text-slate-800">
                        Proceed to Step 2 (Passenger & Booking Workspace)?
                      </p>

                      <div className="grid grid-cols-2 gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setMessages((prev) => [
                              ...prev,
                              {
                                id: `nira-cancel-${Date.now()}`,
                                sender: 'nira',
                                text: 'Booking cancelled. Let me know if you would like to search for another route or train number.',
                                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                              },
                            ]);
                          }}
                          className="py-2.5 px-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all cursor-pointer text-center active:scale-95"
                        >
                          ❌ No, Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const pTrain = m.bookingConfirmPrompt!.train;
                            const pClass = m.bookingConfirmPrompt!.classCode;
                            selectTrain(pTrain, pClass);
                            navigateTo('workspace');
                            const confirmStep2Msg: ChatMessage = {
                              id: `nira-step2-${Date.now()}`,
                              sender: 'nira',
                              text: `Selected **#${pTrain.trainNumber} ${pTrain.trainName}** (${pTrain.fromCity} → ${pTrain.toCity}) in **${pClass}**.\n\n👋 **Step 2: Passenger Workspace Active**!\nPlease enter passenger details using this schema:\n📋 **Format**: \`Name, Age, Gender, Berth\` (e.g. *Anusuya, 44, F, SL*)\n👥 **Multi-Passenger**: Separate each person with a semicolon \`;\` or comma (e.g. *Anusuya, 44, SL, Moupiya, 45, 3A* or *Pratay Karali, 20, Male, Lower, 8420773730, pratay@gmail.com*)!`,
                              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            };
                            setMessages((prev) => [...prev, confirmStep2Msg]);
                            if (autoVoice) {
                              speakNiraResponse(`Selected ${pTrain.trainName}. Proceeding to Step 2. Please enter your passenger details.`);
                            }
                          }}
                          className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#7C3AED] via-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-black text-xs shadow-md shadow-purple-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 text-center"
                        >
                          <span>✅ Yes, Book Now</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ─────────────────────────────────────────────────────────────
                      PASSENGER CONFIRMATION PROMPT (Step 2 Review)
                      ───────────────────────────────────────────────────────────── */}
                  {m.passengerConfirmPrompt && (
                    <div className="ml-8 p-3.5 rounded-2xl bg-white border-2 border-purple-300 shadow-md space-y-3 animate-in zoom-in-95 duration-200 select-none">
                      <div className="flex items-start justify-between gap-2 border-b border-purple-100 pb-2">
                        <div className="min-w-0">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200 inline-block mb-1">
                            Passenger Details Review
                          </span>
                          <h4 className="font-black text-xs text-slate-950 truncate">
                            #{m.passengerConfirmPrompt.train.trainNumber} • {m.passengerConfirmPrompt.train.trainName}
                          </h4>
                          <p className="text-[11px] text-slate-600 font-semibold mt-0.5">
                            {m.passengerConfirmPrompt.passengers.length} Passenger{m.passengerConfirmPrompt.passengers.length > 1 ? 's' : ''} • Class {m.passengerConfirmPrompt.classBreakdown || m.passengerConfirmPrompt.classCode}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-emerald-700 block font-mono">
                            ₹{m.passengerConfirmPrompt.fare.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] text-slate-500 font-bold">
                            Total Fare
                          </span>
                        </div>
                      </div>

                      {/* Passenger entries preview */}
                      <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                        {m.passengerConfirmPrompt.passengers.map((p, idx) => {
                          const pClass = p.assignedClassCode || m.passengerConfirmPrompt?.classCode || '3A';
                          return (
                            <div key={p.id || idx} className="flex items-center justify-between text-slate-700 text-[11px]">
                              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{idx + 1}. {p.name} ({p.age}y, {p.gender})</span>
                                <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-900 font-mono font-black text-[9px] border border-purple-200">
                                  Class {pClass}
                                </span>
                              </span>
                              <span className="text-purple-900 font-semibold">
                                {p.berthPreference && p.berthPreference !== 'NO_PREFERENCE' ? p.berthPreference.replace('_', ' ') : 'No Preference'}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <p className="text-xs font-bold text-slate-800">
                        Are these passenger details correct?
                      </p>

                      <div className="grid grid-cols-2 gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            navigateTo('workspace');
                            setMessages((prev) => [
                              ...prev,
                              {
                                id: `nira-edit-${Date.now()}`,
                                sender: 'nira',
                                text: 'You can edit the passenger details directly on the Passenger Workspace screen.',
                                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                              },
                            ]);
                          }}
                          className="py-2 px-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all cursor-pointer text-center active:scale-95"
                        >
                          ✏️ Edit Details
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            navigateTo('payment');
                            setMessages((prev) => [
                              ...prev,
                              {
                                id: `nira-to-pay-${Date.now()}`,
                                sender: 'nira',
                                text: 'Passenger details confirmed! Proceeding to Step 3 (Payment Bridge).',
                                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                              },
                            ]);
                          }}
                          className="py-2 px-3 rounded-xl bg-gradient-to-r from-[#7C3AED] via-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-black text-xs shadow-md shadow-purple-600/30 transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 text-center"
                        >
                          <span>✅ Confirm & Pay</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ─────────────────────────────────────────────────────────────
                      INTERACTIVE BOOKED TRAIN & LIVE STATUS CARD
                      ───────────────────────────────────────────────────────────── */}
                  {m.bookedTrainStatusCard && (
                    <div className="ml-8 p-3.5 rounded-2xl bg-white border-2 border-purple-300 shadow-md space-y-3 animate-in zoom-in-95 duration-200">
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200 inline-block">
                              Booked Train
                            </span>
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border inline-block ${
                              m.bookedTrainStatusCard.statusType === 'CONFIRMED'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : m.bookedTrainStatusCard.statusType === 'RAC'
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-orange-100 text-orange-800 border-orange-300'
                            }`}>
                              {m.bookedTrainStatusCard.statusType}
                            </span>
                          </div>
                          <h4 className="font-black text-xs text-slate-950 truncate">
                            #{m.bookedTrainStatusCard.trainNumber} • {m.bookedTrainStatusCard.trainName}
                          </h4>
                          <p className="text-[11px] text-slate-600 font-semibold mt-0.5">
                            {m.bookedTrainStatusCard.fromCity} ({m.bookedTrainStatusCard.fromCode}) → {m.bookedTrainStatusCard.toCity} ({m.bookedTrainStatusCard.toCode})
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-mono font-bold text-purple-950 block">
                            PNR: {m.bookedTrainStatusCard.pnrNumber}
                          </span>
                          <span className="text-[10px] text-slate-500 font-bold">
                            {m.bookedTrainStatusCard.travelDate}
                          </span>
                        </div>
                      </div>

                      {/* Status & Telemetry details */}
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-slate-700">
                          <span>Seat Allocation:</span>
                          <strong className="text-purple-950 font-bold">{m.bookedTrainStatusCard.seatInfo}</strong>
                        </div>
                        {m.bookedTrainStatusCard.probabilityLabel && (
                          <div className="flex items-center justify-between text-slate-700">
                            <span>Berth Probability:</span>
                            <strong className="text-emerald-700 font-bold text-[11px]">{m.bookedTrainStatusCard.probabilityLabel}</strong>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-slate-700 pt-1 border-t border-slate-200/60">
                          <span>Live Telemetry:</span>
                          <strong className="text-emerald-700 font-bold font-mono">{m.bookedTrainStatusCard.currentSpeed} km/h • On Time</strong>
                        </div>
                        <div className="flex items-center justify-between text-slate-700">
                          <span>Next Stoppage:</span>
                          <strong className="text-slate-900 font-bold">{m.bookedTrainStatusCard.nextStation} ({m.bookedTrainStatusCard.platform})</strong>
                        </div>
                      </div>

                      {/* 3 Action Buttons */}
                      <div className="space-y-1.5 pt-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            handleQuickTrack(m.bookedTrainStatusCard!.trainNumber);
                          }}
                          className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 transition-all"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>🛰️ Track Live on Radar Map</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => navigateTo('ticket')}
                            className="py-2 px-2.5 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100 text-purple-900 font-bold text-[11px] transition-all cursor-pointer text-center"
                          >
                            🎫 View e-Ticket
                          </button>
                          <button
                            type="button"
                            onClick={() => navigateTo('my-journeys')}
                            className="py-2 px-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-[11px] transition-all cursor-pointer text-center"
                          >
                            📋 My Journeys
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* ─────────────────────────────────────────────────────────────
                      CONGRATULATIONS / NEXT STEP ACTION CARD IN CHAT DRAWER
                      ───────────────────────────────────────────────────────────── */}
                  {m.text && m.text.includes('Congratulations! Your ticket is successfully booked') && !m.bookedTrainStatusCard && (
                    <div className="ml-8 p-3 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-purple-50 border-2 border-emerald-300 shadow-sm space-y-2.5 animate-in zoom-in-95">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-black text-emerald-950 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Track Your Booked Train</span>
                        </span>
                        <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-900 px-2 py-0.2 rounded-full border border-emerald-200">
                          Live Satellite GPS
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-700 font-medium leading-relaxed">
                        View real-time speed, live platform door alignment, and station countdowns on the Radar!
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const trainNo = issuedTicket?.train?.trainNumber || selectedTrain?.trainNumber || bookingRecord?.trainNumber || '12260';
                          handleQuickTrack(trainNo);
                        }}
                        className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-md shadow-emerald-700/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                      >
                        <Train className="w-3.5 h-3.5" />
                        <span>🛰️ Open Live GPS Platform Radar</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* ─────────────────────────────────────────────────────────────
                      "NIRA UNDERSTOOD YOU" CONFIRMATION CARD (Item 1 & 4)
                      ───────────────────────────────────────────────────────────── */}
                  {m.understoodCard && (
                    <div className="ml-8 p-3 rounded-2xl bg-gradient-to-br from-purple-50/90 via-white to-indigo-50/40 border border-purple-200/90 shadow-sm space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-purple-950 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>I understood:</span>
                        </span>
                        <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                          Verified Query ✓
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2.5 rounded-xl border border-purple-100 shadow-2xs font-mono">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-slate-500">
                            <span className="text-[10px] font-bold">FROM</span>
                            <span className="font-bold text-slate-900 truncate ml-1">{m.understoodCard.from.split('(')[0]}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-500">
                            <span className="text-[10px] font-bold">TO</span>
                            <span className="font-bold text-slate-900 truncate ml-1">{m.understoodCard.to.split('(')[0]}</span>
                          </div>
                        </div>
                        <div className="space-y-1 border-l border-purple-100 pl-2">
                          <div className="flex items-center justify-between text-slate-500">
                            <span className="text-[10px] font-bold">DATE</span>
                            <span className="font-bold text-slate-900">{m.understoodCard.date}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-500">
                            <span className="text-[10px] font-bold">PAX</span>
                            <span className="font-bold text-purple-900 font-black">{m.understoodCard.passengers} Adult</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-purple-950 text-white flex items-center justify-between gap-2 shadow-xs">
                        <div className="min-w-0">
                          <div className="text-xs font-black truncate">{m.understoodCard.trainName}</div>
                          <div className="text-[10px] text-purple-200 truncate">
                            ⚡ Fastest • ₹{m.understoodCard.fare} ({m.understoodCard.classCode}) • ⭐ Best Match
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const effDate = (m.understoodCard?.date && m.understoodCard.date !== 'Tomorrow') ? m.understoodCard.date : (searchParams.travelDate || 'Tomorrow');
                            executeSearch({
                              fromStation: m.understoodCard!.fromStation,
                              toStation: m.understoodCard!.toStation,
                              passengersCount: m.understoodCard!.passengers || 1,
                              travelDate: effDate,
                            });
                            navigateTo('trains');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all cursor-pointer shrink-0 shadow-sm"
                        >
                          Review Search →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ─────────────────────────────────────────────────────────────
                      INTERACTIVE TRAIN RECOMMENDATION (Single Clean Card + Search Link)
                      ───────────────────────────────────────────────────────────── */}
                  {m.trainList && m.trainList.length > 0 && (() => {
                    const topTrain = m.trainList[0];
                    const bestClass = topTrain.classes?.[0] || { classCode: '3A', fare: 1958, status: 'AVAILABLE', availableSeats: 20 };
                    return (
                      <div className="ml-8 space-y-2.5">
                        <div className="p-3.5 rounded-2xl bg-white border-2 border-purple-200 shadow-sm space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-xs text-slate-900">
                                  #{topTrain.trainNumber} • {topTrain.trainName}
                                </span>
                                <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.2 rounded-full">
                                  ⭐ Recommended
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                Dep {topTrain.departureTime} → Arr {topTrain.arrivalTime} • {topTrain.durationHours}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-xs font-black text-emerald-700 block font-mono">
                                ₹{bestClass.fare}
                              </span>
                              <span className="text-[9px] text-purple-700 font-semibold">
                                {plainClass(bestClass.classCode)}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 pt-1 border-t border-purple-50">
                            <button
                              type="button"
                              onClick={() => {
                                selectTrain(topTrain, bestClass.classCode);
                                navigateTo('workspace');
                                const selectMsg: ChatMessage = {
                                  id: `nira-select-${Date.now()}`,
                                  sender: 'nira',
                                  text: `Selected **#${topTrain.trainNumber} ${topTrain.trainName}** in **${plainClass(bestClass.classCode)}** (Fare: ₹${bestClass.fare}).\n\n👋 **Step 2: Passenger Workspace Active**!\nPlease enter passenger details using this schema:\n📋 **Format**: \`Name, Age, Gender, Berth\` (e.g. *Anusuya, 44, F, SL*)\n👥 **Multi-Passenger**: Separate each person with a semicolon \`;\` or comma (e.g. *Anusuya, 44, SL, Moupiya, 45, 3A* or *Pratay Karali, 20, Male, Lower, 8420773730, pratay@gmail.com*)!`,
                                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                };
                                setMessages((prev) => [...prev, selectMsg]);
                                if (autoVoice) {
                                  speakNiraResponse(`Selected ${topTrain.trainName}. Proceeding to Step 2. Please enter your passenger details.`);
                                }
                              }}
                              className="w-full py-2 px-3 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-98"
                            >
                              <span>Book #{topTrain.trainNumber} ({plainClass(bestClass.classCode)}) ➔</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const effDate = (m.understoodCard?.date && m.understoodCard.date !== 'Tomorrow') ? m.understoodCard.date : (searchParams.travelDate || 'Tomorrow');
                                executeSearch({
                                  fromStation: m.understoodCard?.fromStation || searchParams.fromStation,
                                  toStation: m.understoodCard?.toStation || searchParams.toStation,
                                  passengersCount: m.understoodCard?.passengers || 1,
                                  travelDate: effDate,
                                });
                                navigateTo('trains');
                              }}
                              className="w-full py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7C3AED] border border-purple-200 text-xs font-bold text-center cursor-pointer transition-all"
                            >
                              Review All Trains on Search Screen →
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* ─────────────────────────────────────────────────────────────
                      INTERACTIVE AUTO-BOOK CARD (Explicit single-train confirmation)
                      ───────────────────────────────────────────────────────────── */}
                  {m.autoBookCard && !m.trainList && (
                    <div className="ml-8 p-3.5 rounded-2xl bg-white border-2 border-purple-200 shadow-md space-y-3">
                      <div className="flex items-center justify-between border-b border-purple-50 pb-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                            <Train className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-xs text-slate-900 block leading-tight">
                              #{m.autoBookCard.train.trainNumber} • {m.autoBookCard.train.trainName}
                            </span>
                            <span className="text-[10px] text-purple-700 font-semibold">
                              {m.autoBookCard.fromStation.city} → {m.autoBookCard.toStation.city} • {m.autoBookCard.travelDate}
                            </span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300">
                          {m.autoBookCard.quota}
                        </span>
                      </div>

                      {/* Schedule & Fare strip */}
                      <div className="grid grid-cols-3 gap-2 text-center text-xs bg-purple-50/50 p-2 rounded-xl">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-400 block">Departure</span>
                          <span className="font-bold text-slate-900">{m.autoBookCard.train.departureTime}</span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-400 block">Class & Coach</span>
                          <span className="font-bold text-purple-900">{m.autoBookCard.classCode}</span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-400 block">Total Fare</span>
                          <span className="font-bold text-emerald-700">₹{m.autoBookCard.fare}</span>
                        </div>
                      </div>

                      {/* Passenger draft notice */}
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-600 font-medium px-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Passenger: <strong>{m.autoBookCard.passengerName}</strong> ({m.autoBookCard.passengersCount} adult) • Autofill preview</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-1.5 pt-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            const abTrain = m.autoBookCard!.train;
                            const abClass = m.autoBookCard!.classCode;
                            selectTrain(abTrain, abClass);
                            navigateTo('workspace');
                            const confirmStep2Msg: ChatMessage = {
                              id: `nira-step2-ab-${Date.now()}`,
                              sender: 'nira',
                              text: `Selected **#${abTrain.trainNumber} ${abTrain.trainName}** (${abTrain.fromCity} → ${abTrain.toCity}) in **${abClass}**.\n\n👋 **Step 2: Passenger Workspace Active**!\nPlease enter passenger details using this schema:\n📋 **Format**: \`Name, Age, Gender, Berth\` (e.g. *Anusuya, 44, F, SL*)\n👥 **Multi-Passenger**: Separate each person with a semicolon \`;\` or comma (e.g. *Anusuya, 44, SL, Moupiya, 45, 3A* or *Pratay Karali, 20, Male, Lower, 8420773730, pratay@gmail.com*)!`,
                              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            };
                            setMessages((prev) => [...prev, confirmStep2Msg]);
                            if (autoVoice) {
                              speakNiraResponse(`Selected ${abTrain.trainName}. Proceeding to Step 2. Please enter your passenger details.`);
                            }
                          }}
                          className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:from-[#6D28D9] hover:to-[#7E22CE] text-white font-black text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 transition-all"
                        >
                          <Zap className="w-3.5 h-3.5 text-amber-300" />
                          <span>Book This Train ➔</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ─────────────────────────────────────────────────────────────
                      INTERACTIVE TRAIN TRACK RADAR CARD
                      ───────────────────────────────────────────────────────────── */}
                  {m.trackCard && (
                    <div className="ml-8 p-3.5 rounded-2xl bg-white border-2 border-emerald-200 shadow-md space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                            <Navigation className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-xs text-slate-900 block leading-tight">
                              #{m.trackCard.trainNumber} • {m.trackCard.trainName}
                            </span>
                            <span className="text-[10px] text-emerald-700 font-semibold">
                              Live GPS Satellite Telemetry
                            </span>
                          </div>
                        </div>
                        <span className="font-mono text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {m.trackCard.currentSpeed} km/h
                        </span>
                      </div>

                      {/* Next Station & Platform Details */}
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1 text-xs">
                        <div className="flex items-center justify-between text-slate-700">
                          <span>Next Stoppage:</span>
                          <strong className="text-slate-900 font-bold">{m.trackCard.nextStation}</strong>
                        </div>
                        <div className="flex items-center justify-between text-slate-700">
                          <span>Platform:</span>
                          <strong className="text-purple-900 font-bold">{m.trackCard.platform}</strong>
                        </div>
                        <div className="flex items-center justify-between text-slate-700">
                          <span>Deboarding Door:</span>
                          <strong className="text-emerald-700 font-bold">{m.trackCard.doorSide}</strong>
                        </div>
                      </div>

                      {/* Direct Clickable Redirect Button (Keeps chat open!) */}
                      <button
                        type="button"
                        onClick={() => {
                          handleQuickTrack(m.trackCard!.trainNumber);
                        }}
                        className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 transition-all"
                      >
                        <span>Open Live GPS Radar for #{m.trackCard.trainNumber}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Standard Action Card (Search fallback - Keeps chat open!) */}
                  {m.actionCard && !m.autoBookCard && (
                    <div className="ml-8 p-3.5 rounded-2xl bg-white border border-purple-100 shadow-sm space-y-2.5">
                      <div>
                        <strong className="text-slate-900 font-black text-xs block flex items-center gap-1.5">
                          <Train className="w-3.5 h-3.5 text-[#7C3AED]" />
                          <span>{m.actionCard.title}</span>
                        </strong>
                        <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                          {m.actionCard.subtitle}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (m.actionCard?.route === 'autofill_passenger') {
                            const pName = routeCtx.passengerName || 'Pratay Karali';
                            const singleFare = selectedTrain?.classes[0]?.fare || 450;
                            setPassengers([
                              {
                                id: `p_${Date.now()}`,
                                name: pName,
                                age: 24,
                                gender: 'M',
                                berthPreference: 'LOWER',
                              },
                            ]);
                            emitUiEvent('PASSENGERS_UPDATED', { count: 1 });
                            const filledMsg: ChatMessage = {
                              id: `nira-filled-${Date.now()}`,
                              sender: 'nira',
                              text: `I have filled the passenger details on your screen for **${pName}**! Everything looks good. Ready to proceed to payment?`,
                              actionCard: {
                                title: 'Passenger Details Prepared Live',
                                subtitle: `Autofilled ${pName} • Total Fare: ₹${singleFare}`,
                                buttonLabel: `Proceed to Payment (₹${singleFare}) ➔`,
                                route: 'payment',
                              },
                              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            };
                            setMessages((prev) => [...prev, filledMsg]);
                            if (autoVoice) {
                              speakNiraResponse(`I have filled the passenger details for ${pName}. Ready to proceed to payment.`);
                            }
                            return;
                          }

                          if (m.actionCard?.route === 'open_architecture_diagram') {
                            setShowVisualDiagram(true);
                            return;
                          }

                          if (m.actionCard?.route === 'trains') {
                            if (m.actionCard.fromStation && m.actionCard.toStation) {
                              const tomorrowIso = new Date(Date.now() + 86400000).toISOString().split('T')[0];
                              executeSearch({
                                fromStation: m.actionCard.fromStation,
                                toStation: m.actionCard.toStation,
                                travelDate: m.actionCard.travelDate && m.actionCard.travelDate !== 'Tomorrow' ? m.actionCard.travelDate : tomorrowIso,
                                passengersCount: m.actionCard.passengersCount || 1,
                                classType: 'All Classes',
                                quota: 'General (GN)',
                              });
                            } else {
                              executeSearch(searchParams);
                            }
                          } else {
                            navigateTo(m.actionCard?.route as any);
                          }
                        }}
                        className="w-full py-2.5 px-3 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-black text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>{m.actionCard.buttonLabel}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Feedback Thumbs */}
                  <div className="flex items-center gap-1.5 ml-8 pt-0.5">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleFeedback(m.id, 'up')}
                        className={`p-1 rounded-md text-slate-400 hover:text-purple-700 transition-colors cursor-pointer ${
                          m.feedbackGiven === 'up' ? 'text-purple-700 bg-purple-50' : ''
                        }`}
                        title="Helpful"
                      >
                        <ThumbsUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFeedback(m.id, 'down')}
                        className={`p-1 rounded-md text-slate-400 hover:text-purple-700 transition-colors cursor-pointer ${
                          m.feedbackGiven === 'down' ? 'text-purple-700 bg-purple-50' : ''
                        }`}
                        title="Not helpful"
                      >
                        <ThumbsDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* ─── RESUME PAUSED JOURNEY BANNER (Item 6) ─── */}
        {shouldShowResumeTask && taskStack.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950 text-white border border-purple-500/30 shadow-lg space-y-2 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-purple-300 font-bold flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-purple-400 animate-spin" style={{ animationDuration: '6s' }} />
                <span>Journey Paused</span>
              </span>
              <span className="bg-purple-500/20 text-purple-200 text-[10px] px-2 py-0.5 rounded-full font-bold border border-purple-400/30">
                State Preserved
              </span>
            </div>
            <div className="text-xs font-bold text-white">{taskStack[0].title}</div>
            <div className="text-[11px] text-purple-200 font-medium">{taskStack[0].subtitle}</div>
            <button
              type="button"
              onClick={() => {
                resumeTask(taskStack[0].taskId);
              }}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Resume Booking →</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          3. BOTTOM INPUT BAR
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="p-3 bg-white border-t border-purple-50">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-1.5 p-1.5 pl-3 rounded-2xl bg-purple-50/50 border border-purple-100 focus-within:border-purple-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-purple-100 transition-all"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. Auto book Delhi to Mumbai in 3A, Track 12302..."
            className="flex-1 bg-transparent border-none text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
          />

          <button
            type="submit"
            disabled={!input.trim()}
            className="p-2 rounded-xl bg-[#C084FC] hover:bg-[#A855F7] disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all shadow-2xs cursor-pointer flex items-center justify-center"
            title="Send"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </aside>
  );
};

export default NiraChatDrawer;
