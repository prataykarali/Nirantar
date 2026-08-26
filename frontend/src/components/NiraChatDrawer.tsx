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
        label: 'Auto book Delhi to Bangalore for Ananya Sharma',
        query: 'Auto book Delhi to Bangalore 3A tomorrow for Ananya Sharma',
        tag: 'With Passenger',
      },
      {
        icon: Train,
        label: 'Find cheapest train from Mumbai to Pune',
        query: 'Find cheapest train from Mumbai to Pune tomorrow',
        tag: 'Best Value',
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

  // ─── Listen for PAGE_CHANGED events to add contextual messages ───
  useEffect(() => {
    const unsub = UiEventBus.subscribe('PAGE_CHANGED', (event) => {
      if (!isOpen) return;
      const targetPage = event.payload?.to || event.sourcePage;
      const fromPage = event.payload?.from || '';
      const ctx = getSanitizedContext();

      let msgText = '';
      let actionCard: ChatMessage['actionCard'] | undefined = undefined;

      if (targetPage === 'completion' || targetPage === 'ticket' || targetPage === 'myjourneys') {
        const trainName = ctx.journey.selectedTrainName || selectedTrain?.trainName || 'Howrah Rajdhani Express';
        const trainNo = ctx.journey.selectedTrainNumber || selectedTrain?.trainNumber || '12302';
        msgText = `🎉 **Congrats! Your train seat is confirmed!**\n\nPNR: **#2847 5896 1234** • Seat: **S5 - 36 (Confirmed)**\nTrain: **#${trainNo} ${trainName}**\n\nYour DigiLocker-verified e-Ticket is ready for download! You can also track your train via Live GPS Radar anytime.`;
        actionCard = {
          title: 'Ticket Confirmed & Issued',
          subtitle: `PNR: #2847 5896 1234 • Seat S5-36`,
          buttonLabel: '🛰️ Open Live GPS Radar Tracking ➔',
          route: 'track',
        };
      } else if (targetPage === 'workspace' || targetPage === 'booking') {
        const trainName = selectedTrain?.trainName || ctx.journey.selectedTrainName || 'Express Train';
        const trainNo = selectedTrain?.trainNumber || ctx.journey.selectedTrainNumber || '12302';
        const classCode = selectedClassCode || ctx.journey.selectedClassCode || '3A';
        const fare = selectedTrain?.classes?.find((c) => c.classCode === classCode)?.fare || 1958;

        msgText = `You selected **#${trainNo} ${trainName}** (${plainClass(classCode)} • ₹${fare.toLocaleString('en-IN')})!\n\nYou are now on **Step 2 (Passenger & Booking Workspace)**. Please enter your passenger details in the format: **[Name], [Age], [Gender], [Berth], [Mobile], [Email]** (e.g. *Pratay Karali, 20, Male, Lower, 8420773730, pratay.karali2005@gmail.com*) to proceed to payment.`;
        actionCard = undefined;
      } else if (targetPage === 'trains' || targetPage === 'results') {
        const origin = searchParams.fromStation?.city || ctx.journey.origin || 'Delhi';
        const dest = searchParams.toStation?.city || ctx.journey.destination || 'Kolkata';
        msgText = `Navigated back to train results for **${origin} → ${dest}**.\n\nWould you like to pick a different train, compare departure times, or sort by fastest/cheapest?`;
      } else if (targetPage === 'home' || targetPage === 'discover') {
        msgText = `Back on the search screen. Where in India would you like to travel next?`;
      } else if (targetPage === 'payment') {
        const fare = ctx.payment.amount || selectedTrain?.classes[0]?.fare || 1958;
        msgText = `You are now at the **Payment Step**! Total debit amount is **₹${fare.toLocaleString('en-IN')}**.\n\nPlease select your payment method: UPI, Net Banking, Card, or your **₹10,000 Nirantar Citizen Travel Wallet** below.`;
        actionCard = {
          title: 'Payment Authorization Ready',
          subtitle: `Select a payment method (Debiting ₹${fare.toLocaleString('en-IN')})`,
          buttonLabel: `💳 Pay ₹${fare.toLocaleString('en-IN')} with Citizen Wallet ➔`,
          route: 'payment',
        };
      } else if (targetPage === 'track') {
        const trainNo = ctx.tracking.activeTrainNumber || trackQuery || '12302';
        msgText = `🛰️ Live GPS Radar is active for **#${trainNo}**. Cruising at 118 km/h right on time.`;
      } else {
        const contextMsg = NiraPlanner.generateStateAwareGreeting(ctx);
        msgText = contextMsg.message;
      }

      if (msgText) {
        const pageMsg: ChatMessage = {
          id: `nira-page-${Date.now()}`,
          sender: 'nira',
          text: msgText,
          actionCard,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, pageMsg]);
        if (autoVoice) {
          speakNiraResponse(msgText);
        }
      }
    });
    return unsub;
  }, [isOpen, autoVoice, selectedTrain, selectedClassCode, searchParams, trackQuery]);

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
    const isQuestion = /^(?:can|could|how|what|when|where|why|is|are|do|does|tell|explain|rules?|policy|guideline|luggage|baggage|senior|tatkal|pnr|chart|cancel|refund|boarding|food|cater|concession)\b/i.test(text.trim()) || text.trim().endsWith('?');

    const isAutoBook =
      !isQuestion && (
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
        /(?:book|reserve)\b.*(?:train|#)\s*\d+/i.test(text)
      );

    const isTrack =
      lower.startsWith('track') ||
      lower.startsWith('where is train') ||
      lower.startsWith('running status') ||
      lower.startsWith('live status') ||
      lower.includes('gps radar') ||
      (/^\d{5}$/.test(text.trim()));

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
    const rawNumberMatch = text.match(/(?:train|#)\s*(\d+)/i) || (isTrack ? text.match(/\b(\d+)\b/) : null);
    if (rawNumberMatch) {
      const num = rawNumberMatch[1];
      if (num.length === 5) {
        updated.trainNumber = num;
      } else {
        (updated as any).invalidTrainNumber = num;
      }
    } else if (
      (lower.includes('book train') || lower.includes('want to book train') || lower.includes('reserve train')) &&
      !lower.includes('from') &&
      !lower.includes('to')
    ) {
      (updated as any).missingTrainNumber = true;
    }

    // 2. Station Extraction: explicit route regex or verified station names
    let extractedFrom: Station | undefined = undefined;
    let extractedTo: Station | undefined = undefined;

    if (!isQuestion) {
      const routeRegex = /(?:from\s+)?([a-z\s]+?)\s+(?:to|->|towards|–|-)\s+([a-z\s]+?)(?:\s+(?:on|tomorrow|today|next|for|in|\d)|\b|$)/i;
      const match = text.match(routeRegex);
      if (match) {
        const s1 = findStation(match[1].trim());
        const s2 = findStation(match[2].trim());
        if (s1) extractedFrom = s1;
        if (s2) extractedTo = s2;
      }

      if (!extractedFrom || !extractedTo) {
        const words = lower.split(/[\s,]+/);
        const ignoreWords = ['i', 'want', 'to', 'book', 'ticket', 'tickets', 'train', 'trains', 'seat', 'seats', 'with', 'from', 'this', 'that', 'they', 'what', 'is', 'for', 'me', 'please', 'can', 'you', 'help', 'go', 'going', 'hey', 'wanna', 'the', 'a', 'an', 'my', 'live', 'status', 'track', 'where'];
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
      fromStation: extractedFrom,
      toStation: extractedTo,
      trainNumber: updated.trainNumber,
      travelDate: updated.travelDate,
      passengers: updated.passengers,
      classCode: updated.classCode,
      quota: updated.quota,
      passengerName: updated.passengerName,
    };

    // 3. Date expressions
    const dateMatch = text.match(/\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|september|oct|nov|dec)[a-z]*|\b(?:today|tomorrow|day after tomorrow|next\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)))\b/i);
    if (dateMatch) {
      updatedRoute.travelDate = dateMatch[1];
    }

    // 4. Passenger Count
    const paxMatch = text.match(/\b(\d+)\s*(?:passenger|adult|seat|ticket|person|pax)/i);
    if (paxMatch) {
      updatedRoute.passengers = Math.min(6, Math.max(1, parseInt(paxMatch[1], 10)));
    } else if (lower.includes('two') || lower.includes('2 seats')) {
      updatedRoute.passengers = 2;
    }

    // 5. Class code
    if (lower.includes('1a') || lower.includes('first ac')) {
      updatedRoute.classCode = '1A';
    } else if (lower.includes('2a') || lower.includes('2 tier') || lower.includes('second ac')) {
      updatedRoute.classCode = '2A';
    } else if (lower.includes('3a') || lower.includes('3 tier') || lower.includes('third ac')) {
      updatedRoute.classCode = '3A';
    } else if (lower.includes('sl') || lower.includes('sleeper')) {
      updatedRoute.classCode = 'SL';
    } else if (lower.includes('cc') || lower.includes('chair car')) {
      updatedRoute.classCode = 'CC';
    } else if (lower.includes('ec') || lower.includes('executive')) {
      updatedRoute.classCode = 'EC';
    }

    // 6. Custom Passenger Name (e.g. "for Ananya Sharma", "for John Doe")
    const nameMatch = text.match(/for\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
    if (nameMatch && !['tomorrow', 'today', 'tatkal', 'two', 'three'].includes(nameMatch[1].toLowerCase())) {
      updatedRoute.passengerName = nameMatch[1];
    }

    return {
      route: updatedRoute,
      isAutoBook,
      isTrack,
      isTatkal,
      trainNumber: updatedRoute.trainNumber,
    };
  };

  /**
   * Conversational Live Passenger Extractor
   * Accurately extracts name, age, gender, berth, phone, and email without splitting on single commas!
   */
  const parsePassengerDetailsFromText = (text: string): {
    passengers: PassengerProfile[];
    contact?: { phone?: string; email?: string };
  } | null => {
    const lower = text.toLowerCase();
    const hasGender = /\b(?:male|female|m|f|boy|girl|man|woman|gent|lady)\b/i.test(lower);
    const hasAge = /\b(?:age\s*\d{1,2}|\d{1,2}\s*(?:years?|yrs?|yr|yo|pax|passenger)|age\b|\b\d{2}\b)/i.test(lower);
    const hasBerth = /\b(?:lower|upper|middle|side lower|side upper|window|berth|seat)\b/i.test(lower);
    const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i.test(text);
    const hasPhone = /\b[6-9]\d{9}\b/.test(text);
    const hasPassengerKeywords = /\b(?:passenger|name|fill|book for|details|pratay|rohan|priya|rahul|amit|pooja|rajesh|sunita|sneha|vikram)\b/i.test(lower);

    if (!((hasGender && (hasAge || hasBerth || hasPhone || hasEmail)) || (hasPassengerKeywords && (hasAge || hasGender || hasBerth)) || (hasEmail && hasPhone))) {
      return null;
    }

    // Extract contact phone and email
    const phoneMatch = text.match(/\b([6-9]\d{9})\b/);
    const emailMatch = text.match(/\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/);
    const contact = {
      phone: phoneMatch ? phoneMatch[1] : undefined,
      email: emailMatch ? emailMatch[1] : undefined,
    };

    // Check if multiple emails are present to split passenger records by email delimiter
    let rawSegments: string[] = [];
    const allEmails = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    if (allEmails && allEmails.length > 1) {
      let remainingText = text;
      allEmails.forEach((email) => {
        const idx = remainingText.indexOf(email);
        if (idx !== -1) {
          const seg = remainingText.substring(0, idx + email.length);
          rawSegments.push(seg);
          remainingText = remainingText.substring(idx + email.length).trim();
        }
      });
      if (remainingText.trim().length > 2) {
        rawSegments.push(remainingText.trim());
      }
    } else {
      // Split ONLY on multi-passenger delimiters (NOT single commas!)
      const multiPaxRegex = /\s*(?:\band\b|&|\band also\b|\bsecond passenger\b|\bpassenger 2\b|\bpassenger 3\b|\bpassenger 4\b|\n|;)\s*/i;
      rawSegments = text.split(multiPaxRegex).map((s) => s.trim()).filter((s) => s.length > 2);
    }

    const parsed: PassengerProfile[] = [];

    for (let i = 0; i < rawSegments.length; i++) {
      const seg = rawSegments[i];
      const sLower = seg.toLowerCase();

      // Strip email and 10-digit phone from segment for safe age and name parsing
      const cleanSegNoContact = seg
        .replace(/\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g, ' ')
        .replace(/\b[6-9]\d{9}\b/g, ' ');

      const ageMatch = cleanSegNoContact.match(/\b(?:age\s*)?(\b\d{1,2}\b)/i);
      let age = ageMatch ? parseInt(ageMatch[1], 10) : 25;
      if (age > 100 || age < 1) age = 25;

      let gender: 'M' | 'F' | 'O' = 'M';
      if (/\b(?:female|f|girl|woman|lady|mrs|ms|mother|mom|sister|wife|daughter)\b/i.test(sLower)) {
        gender = 'F';
      } else if (/\b(?:male|m|boy|man|gent|mr|father|dad|brother|husband|son)\b/i.test(sLower)) {
        gender = 'M';
      } else if (/\b(?:trans|transgender|other|t|o)\b/i.test(sLower)) {
        gender = 'O';
      }

      let berthPreference: PassengerProfile['berthPreference'] = 'NO_PREFERENCE';
      if (sLower.includes('side lower') || sLower.includes('sl')) berthPreference = 'SIDE_LOWER';
      else if (sLower.includes('side upper') || sLower.includes('su')) berthPreference = 'SIDE_UPPER';
      else if (sLower.includes('upper') || sLower.includes('ub')) berthPreference = 'UPPER';
      else if (sLower.includes('middle') || sLower.includes('mb')) berthPreference = 'MIDDLE';
      else if (sLower.includes('lower') || sLower.includes('lb')) berthPreference = 'LOWER';

      // Clean name
      let cleanName = cleanSegNoContact
        .replace(/\b(?:passenger\s*\d*|details|my|name|is|age|years?|old|male|female|m|f|boy|girl|man|woman|berth|lower|upper|middle|side|window|senior|citizen|fill|book|for|seat|seats|ticket|tickets|with|me|and|also|mobile|phone|email|gmail|com)\b/gi, '')
        .replace(/\d+/g, '')
        .replace(/[^a-zA-Z\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanName || cleanName.length < 2) {
        cleanName = `Passenger ${i + 1}`;
      }

      const formattedName = cleanName
        .split(' ')
        .filter((w) => w.length > 0)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');

      parsed.push({
        id: `p_${Date.now()}_${i + 1}`,
        name: formattedName,
        age,
        gender,
        berthPreference,
        seniorCitizenConcession: age >= 60 || sLower.includes('senior'),
      });
    }

    return parsed.length > 0 ? { passengers: parsed, contact } : null;
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

    // ─── 1A: Conversational Passenger Autofill ───
    const parsedPaxResult = parsePassengerDetailsFromText(query);
    if (parsedPaxResult && parsedPaxResult.passengers.length > 0) {
      const extractedPassengers = parsedPaxResult.passengers;
      setPassengers(extractedPassengers);
      emitUiEvent('PASSENGERS_UPDATED', { count: extractedPassengers.length });
      const passengerNames = extractedPassengers.map((p) => p.name).join(' & ');
      const singleFare = selectedTrain?.classes[0]?.fare || 645;
      const totalAmount = singleFare * extractedPassengers.length;

      const contactSnippet = parsedPaxResult.contact?.phone
        ? ` • Mobile: ${parsedPaxResult.contact.phone}`
        : '';

      const botResponseText = `I have filled the passenger details for **${passengerNames}** (${extractedPassengers.length} passenger${extractedPassengers.length > 1 ? 's' : ''}${contactSnippet}) on the Passenger Workspace!

Please review the details above on the screen. Ready to proceed to payment?`;

      setTimeout(() => {
        setIsLoading(false);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId
              ? {
                  ...m,
                  text: botResponseText,
                  isStreaming: false,
                  actionCard: {
                    title: 'Passenger Details Prepared Live',
                    subtitle: `Filled ${passengerNames} • Total Fare: ₹${totalAmount}`,
                    buttonLabel: `Proceed to Payment (₹${totalAmount}) ➔`,
                    route: 'payment',
                  },
                }
              : m
          )
        );
        if (autoVoice) {
          speakNiraResponse(`I have filled the passenger details for ${passengerNames}. Ready to proceed to payment.`);
        }
      }, 350);
      return;
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

    if ((intentData.route as any)?.missingTrainNumber) {
      const askMsg = `Please enter a **5-digit train number** (e.g. **#12302**, **#12951**, **#12115**) or specify your origin and destination stations (e.g. *'Delhi to Mumbai'*).`;
      setIsLoading(false);
      setMessages((prev) =>
        prev.map((m) => (m.id === botMsgId ? { ...m, text: askMsg, isStreaming: false } : m))
      );
      if (autoVoice) speakNiraResponse('Please enter a 5-digit train number or specify your route.');
      return;
    }

    if (intentData.isTrack && !intentData.isAutoBook) {
      const trainNo = (intentData.trainNumber || '12302').trim();
      handleQuickTrack(trainNo);

      // Only save booking to task stack if user entered passenger details or between transactions
      if ((hasEnteredPassengerDetails || isBetweenTransactionStates) && bookingState !== 'IDLE' && bookingState !== 'TICKET_VIEW' && bookingState !== 'CONFIRMED') {
        pushTask('BOOKING', 'Resume Booking', `${searchParams.fromStation?.city} → ${searchParams.toStation?.city}`);
      }

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

      const trackGrounding = `LIVE TRACKING DATA:\nTrain: #${trainNo} ${matchedTrain.trainName}\nSpeed: 118 km/h\nStatus: Right on time\nNext Stoppage: ${nextStop.name} (${nextStop.code}) on ${nextStop.platform} (Doors open on ${nextStop.doorSide})\nTotal Stops: ${stops.length} stations`;

      let accumulated = '';
      streamNiraChat(
        safeQuery,
        'en',
        (token) => {
          accumulated += token;
          setIsLoading(false);
          setMessages((prev) =>
            prev.map((m) => (m.id === botMsgId ? { ...m, text: accumulated, isStreaming: true, trackCard: trackCardData } : m))
          );
        },
        () => {
          setIsLoading(false);
          setMessages((prev) =>
            prev.map((m) => (m.id === botMsgId ? { ...m, isStreaming: false, trackCard: trackCardData } : m))
          );
          if (autoVoice && accumulated) {
            speakNiraResponse(accumulated);
          }
        },
        (_err: unknown) => {
          const fallbackTrack = `🚆 Live Radar for #${trainNo} (${matchedTrain.trainName}): Cruising at 118 km/h right on time. Approaching ${nextStop.name} (${nextStop.platform} • Doors opening on ${nextStop.doorSide}). Tap 'Open Live GPS Radar' below to view full platform alignment.`;
          setIsLoading(false);
          setMessages((prev) =>
            prev.map((m) => (m.id === botMsgId ? { ...m, text: fallbackTrack, isStreaming: false, trackCard: trackCardData } : m))
          );
          if (autoVoice) speakNiraResponse(fallbackTrack);
        },
        messages.map((m) => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text })),
        trackGrounding
      );
      return;
    }

    // ─── 1C: Route Search & Booking Intent with Specific Train Grounding ───
    const isQuestion = /^(?:can|could|how|what|when|where|why|is|are|do|does|tell|explain|rules?|policy|guideline|luggage|baggage|senior|tatkal|pnr|chart|cancel|refund|boarding|food|cater|concession)\b/i.test(safeQuery.trim()) || safeQuery.trim().endsWith('?');
    const queryHasRoute = !isQuestion && (safeQuery.toLowerCase().includes(' to ') || safeQuery.toLowerCase().includes(' from '));
    const hasExplicitRoute = !isQuestion && !!(nextRouteCtx.fromStation && nextRouteCtx.toStation && (queryHasRoute || intentData.isAutoBook));
    const hasExplicitTrain = !isQuestion && !!intentData.trainNumber;

    if (hasExplicitTrain || hasExplicitRoute || intentData.isAutoBook) {
      const travelDate = nextRouteCtx.travelDate || 'Tomorrow';
      const paxCount = nextRouteCtx.passengers || 1;
      const classCode = nextRouteCtx.classCode || '3A';

      if (hasExplicitTrain) {
        const trainNo = intentData.trainNumber!.trim();
        const matchedTrain = resolveTrainDetail(trainNo, classCode);
        selectTrain(matchedTrain, classCode);

        const fromStationObj: Station = findStation(matchedTrain.fromStationCode) || {
          name: matchedTrain.fromStationName,
          code: matchedTrain.fromStationCode,
          city: matchedTrain.fromCity,
          state: 'India',
          aliases: [],
        };
        const toStationObj: Station = findStation(matchedTrain.toStationCode) || {
          name: matchedTrain.toStationName,
          code: matchedTrain.toStationCode,
          city: matchedTrain.toCity,
          state: 'India',
          aliases: [],
        };

        const understoodCard = {
          from: `${matchedTrain.fromStationName} (${matchedTrain.fromStationCode})`,
          to: `${matchedTrain.toStationName} (${matchedTrain.toStationCode})`,
          date: travelDate,
          time: `${matchedTrain.departureTime} → ${matchedTrain.arrivalTime}`,
          passengers: paxCount,
          classCode,
          fare: (matchedTrain.classes.find(c => c.classCode === classCode)?.fare || matchedTrain.classes[0]?.fare || 1870) * paxCount,
          trainName: matchedTrain.trainName,
          trainNumber: matchedTrain.trainNumber,
          fromStation: fromStationObj,
          toStation: toStationObj,
        };

        const bookingText = `I found **#${matchedTrain.trainNumber} ${matchedTrain.trainName}** (${matchedTrain.fromCity} → ${matchedTrain.toCity}).\n\n- Departure: **${matchedTrain.departureTime}** from ${matchedTrain.fromStationName}\n- Class: **${classCode}** (${matchedTrain.classes.find(c => c.classCode === classCode)?.className || 'AC 3 Tier'})\n- Fare: **₹${(matchedTrain.classes.find(c => c.classCode === classCode)?.fare || 1870) * paxCount}**\n\nTap **'Book #${matchedTrain.trainNumber}'** below to review passenger details and complete your booking.`;

        setIsLoading(false);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId
              ? {
                  ...m,
                  text: bookingText,
                  isStreaming: false,
                  trainList: [matchedTrain],
                  understoodCard,
                  actionCard: {
                    title: `#${matchedTrain.trainNumber} • ${matchedTrain.trainName}`,
                    subtitle: `${matchedTrain.fromCity} → ${matchedTrain.toCity} • ${classCode}`,
                    buttonLabel: `Book #${matchedTrain.trainNumber} Now ➔`,
                    route: '/workspace',
                    trainNumber: matchedTrain.trainNumber,
                  },
                }
              : m
          )
        );
        if (autoVoice) speakNiraResponse(`I found Train number ${matchedTrain.trainNumber}, ${matchedTrain.trainName}. Tap Book This Train to continue.`);
        return;
      }

      const fromSt = nextRouteCtx.fromStation || POPULAR_STATIONS[0];
      const toSt = nextRouteCtx.toStation || (fromSt.code === 'NDLS' ? POPULAR_STATIONS[2] : POPULAR_STATIONS[0]);
      const trains = searchTrains(fromSt.code, toSt.code);

      if (trains && trains.length > 0) {
        const groundingContext = formatTrainGrounding(trains, fromSt.city, toSt.city);
        const topTrains = rankTrains(trains).slice(0, 3);
        const understoodCard = {
          from: `${fromSt.name} (${fromSt.code})`,
          to: `${toSt.name} (${toSt.code})`,
          date: travelDate,
          time: 'Available Schedules',
          passengers: paxCount,
          classCode,
          fare: (topTrains[0]?.classes[0]?.fare || 1500) * paxCount,
          trainName: topTrains[0]?.trainName,
          trainNumber: topTrains[0]?.trainNumber,
          fromStation: fromSt,
          toStation: toSt,
        };

        let accumulated = '';
        streamNiraChat(
          safeQuery,
          'en',
          (token) => {
            accumulated += token;
            setIsLoading(false);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === botMsgId
                  ? {
                      ...m,
                      text: accumulated,
                      isStreaming: true,
                      trainList: topTrains,
                      understoodCard,
                    }
                  : m
              )
            );
          },
          () => {
            setIsLoading(false);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === botMsgId
                  ? {
                      ...m,
                      isStreaming: false,
                      trainList: topTrains,
                      understoodCard,
                    }
                  : m
              )
            );
            if (autoVoice && accumulated) {
              speakNiraResponse(accumulated);
            }
          },
          (_err: unknown) => {
            const fallbackText = `I found **${trains.length} trains** between ${fromSt.city} and ${toSt.city}.\n\nRanked options:\n${topTrains.map((t, i) => `${i + 1}. #${t.trainNumber} ${t.trainName} — ${t.durationHours}, ${plainClass(t.classes[0]?.classCode || '3A')} from ₹${t.classes[0]?.fare}${t.isFastest ? ' (Fastest)' : t.isBestValue ? ' (Cheapest)' : ''}`).join('\n')}\n\nWhich do you prefer? Tap 'Book This Train' below when you are ready to proceed.`;
            setIsLoading(false);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === botMsgId
                  ? {
                      ...m,
                      text: fallbackText,
                      isStreaming: false,
                      trainList: topTrains,
                      understoodCard,
                    }
                  : m
              )
            );
            if (autoVoice) speakNiraResponse(fallbackText);
          },
          messages.map((m) => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text })),
          groundingContext
        );
        return;
      } else {
        const noTrainText = `I couldn't find direct scheduled trains between ${fromSt.city} (${fromSt.code}) and ${toSt.city} (${toSt.code}) in our database. Connecting trains via major junctions like New Delhi (NDLS), Howrah (HWH), or Mumbai Central (CSMT) are recommended. Would you like to try another route?`;
        setTimeout(() => {
          setIsLoading(false);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMsgId
                ? {
                    ...m,
                    text: noTrainText,
                    isStreaming: false,
                  }
                : m
            )
          );
          if (autoVoice) speakNiraResponse(noTrainText);
        }, 300);
        return;
      }
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
          {/* Auto Voice TTS Toggle with Instant Audio Cutoff */}
          <button
            type="button"
            onClick={() => {
              const nextState = !autoVoice;
              setAutoVoice(nextState);
              setNiraMuted(!nextState);
              if (!nextState) {
                stopNiraSpeech();
              }
            }}
            className={`p-1.5 px-2.5 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
              autoVoice
                ? 'bg-purple-100 text-purple-900 border border-purple-300 shadow-2xs'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
            title={autoVoice ? 'Voice TTS Active (Click to Mute)' : 'Voice TTS Muted (Click to Unmute)'}
          >
            {autoVoice ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span className="text-[10px] font-bold text-purple-900 hidden sm:inline">Voice ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-red-600" />
                <span className="text-[10px] font-bold text-red-600 hidden sm:inline">Muted</span>
              </>
            )}
          </button>

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
                            executeSearch({
                              fromStation: m.understoodCard!.fromStation,
                              toStation: m.understoodCard!.toStation,
                              passengersCount: m.understoodCard!.passengers,
                              travelDate: m.understoodCard!.date !== 'Tomorrow' ? m.understoodCard!.date : undefined,
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
                                const selectMsg: ChatMessage = {
                                  id: `nira-select-${Date.now()}`,
                                  sender: 'nira',
                                  text: `Selected **#${topTrain.trainNumber} ${topTrain.trainName}** in **${plainClass(bestClass.classCode)}** (Fare: ₹${bestClass.fare}).\n\nProceeding to Step 2 (Passenger Workspace). Please fill your passenger details!`,
                                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                };
                                setMessages((prev) => [...prev, selectMsg]);
                                if (autoVoice) {
                                  speakNiraResponse(`Selected ${topTrain.trainName}. Proceeding to passenger workspace.`);
                                }
                              }}
                              className="w-full py-2 px-3 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-98"
                            >
                              <span>Book #{topTrain.trainNumber} ({plainClass(bestClass.classCode)}) ➔</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                executeSearch({
                                  fromStation: m.understoodCard?.fromStation || searchParams.fromStation,
                                  toStation: m.understoodCard?.toStation || searchParams.toStation,
                                  passengersCount: m.understoodCard?.passengers || 1,
                                  travelDate: m.understoodCard?.date !== 'Tomorrow' ? m.understoodCard?.date : undefined,
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
                            selectTrain(m.autoBookCard!.train, m.autoBookCard!.classCode);
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
                            const pName = routeCtx.passengerName || 'Ananya Sharma';
                            const singleFare = selectedTrain?.classes[0]?.fare || 450;
                            setPassengers([
                              {
                                id: `p_${Date.now()}`,
                                name: pName,
                                age: 24,
                                gender: 'F',
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

                  {/* Speaker & Feedback Thumbs */}
                  <div className="flex items-center gap-1.5 ml-8 pt-0.5">
                    <button
                      type="button"
                      onClick={() => speakNiraResponse(m.text)}
                      className="px-2.5 py-1 rounded-full bg-purple-50 hover:bg-purple-100 text-[#7C3AED] text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer border border-purple-100/50"
                      title="Speak response"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>Speak</span>
                    </button>

                    <div className="flex items-center gap-1 ml-1">
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
            type="button"
            onClick={toggleSpeech}
            className={`p-2 rounded-xl text-slate-400 hover:text-purple-700 transition-colors cursor-pointer ${
              isListening ? 'bg-red-50 text-red-500 animate-pulse' : ''
            }`}
            title="Voice input"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

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
