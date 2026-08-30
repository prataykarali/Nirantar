import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Station, POPULAR_STATIONS, findStation } from '../data/stationData';
import { TrainDetail, searchTrains as localSearchTrains, MOCK_TRAINS_DATABASE } from '../data/mockTrains';
import {
  JourneyState,
  JourneyStep,
  PaymentState,
  PaymentMethod,
  PaymentAttempt,
  AuthState,
  PassengerProfile,
  BookingRecord,
  TicketRecord,
  JourneyError,
  JourneyErrorCode,
  JOURNEY_ERROR_MESSAGES,
  createInitialJourneyState,
} from '../types/journey';

export type { PassengerProfile, TicketRecord, BookingRecord };
import {
  apiCreateJourney,
  apiSearchTrains,
  apiSavePassengers,
  apiCreatePayment,
  apiGetPaymentStatus,
  apiVerifyPayment,
  apiMockPaymentResult,
  apiMockLogin,
  apiMockVerify,
  apiGetTicket,
} from '../services/journeyApi';
import { allocatePassengerSeats, getDynamicInitialWaitlist, MidJourneyReallocation } from '../utils/seatInventory';
import { admitFairAccess } from '../services/niraApi';
import { setFairAccessTicket } from '../lib/fairAccessStore';
import { UiEventBus } from '../events/UiEventBus';
import { NirantarEventType, NirantarUiEvent } from '../events/eventTypes';
import { BookingState, StateTransitionEngine } from '../state/JourneyStateMachine';
import { TaskStackItem, TaskStackManager } from '../state/TaskStack';
import { NiraSanitizedContext } from '../ai/NiraPlanner';

export interface DigitalBankAlert {
  id: string;
  type: 'DEBIT' | 'CREDIT';
  amount: number;
  bankName: string;
  accountMask: string;
  beneficiaryOrSource: string;
  balanceAfter: number;
  transactionRef: string;
  timestamp: string;
  smsText?: string;
}

export interface RecentJourney {
  id: string;
  from: Station;
  to: Station;
  date: string;
  passengersCount: number;
}

export interface JourneySearchParams {
  fromStation: Station;
  toStation: Station;
  travelDate: string;
  passengersCount: number;
  classType: string;
  quota: string;
}

export interface GuidanceStep {
  id: string;
  stepNumber: number;
  title: string;
  speech: string;
  actionCue: string;
  actionButtonText?: string;
  arrowPlacement?: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
  arrowLabel?: string;
  cardPosition?: 'left' | 'right' | 'center';
  onAction?: () => void;
}

export type AppTheme = 'lavender' | 'amber' | 'emerald';

export interface ThemeOption {
  id: AppTheme;
  name: string;
  subtitle: string;
  icon: string;
  previewBg: string;
  cardBg: string;
  accentColor: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'lavender',
    name: 'Royal Iris',
    subtitle: 'Deep imperial violet & soft lavender canvas',
    icon: '🌸',
    previewBg: '#F3E8FF',
    cardBg: '#FFFFFF',
    accentColor: '#7C3AED',
  },
  {
    id: 'amber',
    name: 'Warm Sunset',
    subtitle: 'Rich golden amber & terracotta dusk',
    icon: '🌅',
    previewBg: '#FEF3C7',
    cardBg: '#FFFFFF',
    accentColor: '#D97706',
  },
  {
    id: 'emerald',
    name: 'Mint Express',
    subtitle: 'Deep forest emerald & refreshing sage',
    icon: '🍃',
    previewBg: '#DCFCE7',
    cardBg: '#FFFFFF',
    accentColor: '#059669',
  },
];

export interface JourneyContextType {
  // Navigation & Page State
  activePage: string;
  setActivePage: (page: string) => void;
  navigateTo: (page: string) => void;
  goBack: () => void;

  // Search Parameters & Results
  searchParams: JourneySearchParams;
  setSearchParams: React.Dispatch<React.SetStateAction<JourneySearchParams>>;
  availableTrains: TrainDetail[];
  selectedTrain: TrainDetail | null;
  setSelectedTrain: (train: TrainDetail | null) => void;
  selectedClassCode: string;
  setSelectedClassCode: (code: string) => void;

  // Passengers
  passengers: PassengerProfile[];
  setPassengers: React.Dispatch<React.SetStateAction<PassengerProfile[]>>;
  savedPassengers: PassengerProfile[];
  recentJourneys: RecentJourney[];

  // Central Typed Journey State
  journeyState: JourneyState;
  setJourneyState: React.Dispatch<React.SetStateAction<JourneyState>>;

  // Domain Actions
  executeSearch: (params?: Partial<JourneySearchParams>) => Promise<{ success: boolean; error?: string }>;
  selectTrain: (train: TrainDetail, classCode?: string) => void;
  savePassengerDetails: (passengersList: PassengerProfile[]) => Promise<boolean>;
  
  // Auth Actions
  authState: AuthState;
  setAuthState: React.Dispatch<React.SetStateAction<AuthState>>;
  performMockAuth: (username: string, password?: string) => Promise<boolean>;
  verifyMockOtp: (otp: string) => Promise<boolean>;

  // Payment Actions
  paymentState: PaymentState;
  paymentAttempt: PaymentAttempt | null;
  initiatePayment: (method: PaymentMethod, amount: number) => Promise<PaymentAttempt | null>;
  verifyPaymentStatus: () => Promise<PaymentAttempt | null>;
  triggerMockPaymentResult: (result: 'SUCCESS' | 'FAILED' | 'UNKNOWN') => Promise<PaymentAttempt | null>;

  // Ticket & Booking
  issuedTicket: TicketRecord | null;
  setIssuedTicket: React.Dispatch<React.SetStateAction<TicketRecord | null>>;
  bookingRecord: BookingRecord | null;

  // Error Recovery & State
  error: JourneyError | null;
  setError: (err: JourneyError | null) => void;
  clearError: () => void;
  setNamedError: (code: JourneyErrorCode, customMessage?: string) => void;

  // Quick Track Query
  trackQuery: string;
  setTrackQuery: (query: string) => void;
  handleQuickTrack: (query: string) => void;

  // Smart Guidance & Spotlight Engine
  guidanceActive: boolean;
  guidanceStep: GuidanceStep | null;
  guidanceStepIndex: number;
  totalGuidanceSteps: number;
  startGuidanceTour: (initialStep?: number) => void;
  stopGuidanceTour: () => void;
  nextGuidanceStep: () => void;
  prevGuidanceStep: () => void;

  // Auto Booker Engine
  triggerAutoBookFlow: (params: {
    fromStation: Station;
    toStation: Station;
    travelDate?: string;
    passengersCount?: number;
    preferredTrainNumber?: string;
    classCode?: string;
    quota?: string;
    passengerName?: string;
    startWithGuidance?: boolean;
  }) => Promise<boolean>;

  // Virtual Citizen Wallet (₹10,000 Predefined User Credit) & Digital Banking
  walletBalance: number;
  setWalletBalance: React.Dispatch<React.SetStateAction<number>>;
  addWalletBalance: (amount: number, source?: string) => void;
  payWithWallet: (amount: number) => Promise<PaymentAttempt | null>;
  digitalBankAlert: DigitalBankAlert | null;
  dismissDigitalBankAlert: () => void;
  triggerDigitalBankAlert: (alert: Omit<DigitalBankAlert, 'id' | 'timestamp'>) => void;
  paymentHistory: PaymentAttempt[];
  cancelTicket: (pnr: string, refundAmount?: number) => void;

  // Formal State Machine & Event Bus
  bookingState: BookingState;
  setBookingState: (state: BookingState) => void;
  emitUiEvent: (type: NirantarEventType, payload?: any) => NirantarUiEvent;

  // Task Stack (Interrupted Journey Engine)
  taskStack: TaskStackItem[];
  pushTask: (type: TaskStackItem['taskType'], title: string, subtitle: string) => void;
  resumeTask: (taskId?: string) => boolean;
  clearTaskStack: () => void;

  // Dynamic Sort & Highlight Target
  activeSort: 'recommended' | 'fastest' | 'cheapest' | 'departure';
  setActiveSort: (sort: 'recommended' | 'fastest' | 'cheapest' | 'departure') => void;
  activeHighlightTarget: string | null;
  setActiveHighlightTarget: (target: string | null) => void;
  
  // Global Chatbot Drawer State (stays open across entire journey)
  showChatDrawer: boolean;
  setShowChatDrawer: React.Dispatch<React.SetStateAction<boolean>>;

  // Theme & Curated Colour Palettes
  theme: AppTheme;
  setTheme: (t: AppTheme | 'light' | 'dark') => void;
  cycleNextTheme: () => void;
  toggleTheme: () => void;

  // Sanitized Context Builder
  getSanitizedContext: () => NiraSanitizedContext;

  // Citizen Accessibility & "I'm Stuck"
  easyMode: boolean;
  setEasyMode: (enabled: boolean) => void;
  showImStuck: boolean;
  setShowImStuck: (show: boolean) => void;

  // Visual Page Diagram & Programmatic Query
  showVisualDiagram: boolean;
  setShowVisualDiagram: (show: boolean) => void;
  niraPendingQuery: string | null;
  setNiraPendingQuery: (query: string | null) => void;
  sendNiraQuery: (query: string) => void;

  // Reset & Recovery
  resetJourney: () => void;

  // Agentic 1Password Authentication & Waitlist Intelligence
  showAgenticAuth: boolean;
  setShowAgenticAuth: (show: boolean) => void;
  triggerAgenticAuth: () => Promise<boolean>;
  getWaitlistProbability: (status: string, classCode?: string) => { probability: number; label: string; confidence: string };

  // Citizen Profile & Personal Security PIN
  citizenProfile: CitizenProfile;
  setCitizenProfile: React.Dispatch<React.SetStateAction<CitizenProfile>>;
  securityPin: string;
  setSecurityPin: (newPin: string) => void;

  // Popup + bell notifications
  notifications: AppNotification[];
  addNotification: (n: Omit<AppNotification, 'id' | 'time' | 'read' | 'dismissed'>) => void;
  dismissNotification: (id: string) => void;
  markNotificationsRead: () => void;

  // Tracker Tab Preference (Timeline / Coach / Waitlist)
  preferredTrackerTab: 'timeline' | 'coach' | 'waitlist';
  setPreferredTrackerTab: (tab: 'timeline' | 'coach' | 'waitlist') => void;

  // Mid-Journey Vacant Berth Reallocations & Special Requests
  activeReallocations: MidJourneyReallocation[];
  requestMidJourneyReallocation: (reallocation: Omit<MidJourneyReallocation, 'id' | 'timestamp' | 'approvedBy' | 'status'>) => Promise<MidJourneyReallocation>;
  clearReallocations: () => void;
}

export interface CitizenProfile {
  name: string;
  email: string;
  phone: string;
  accountNumber: string;
  walletAccountNumber: string;
  irctcId: string;
  aadhaarMask: string;
  securityPin: string;
  digiLockerStatus: 'VERIFIED' | 'PENDING';
  role: string;
  avatar: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: 'track' | 'ticket' | 'info';
  time: string;
  read: boolean;
  dismissed: boolean;
}

const defaultFrom = POPULAR_STATIONS[0]; // NDLS (New Delhi)
const defaultTo = POPULAR_STATIONS[1];   // HWH (Howrah)

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const defaultDate = tomorrow.toISOString().split('T')[0];

const defaultSavedPassengers: PassengerProfile[] = [
  { id: '1', name: '', age: 25, gender: 'M', berthPreference: 'NO_PREFERENCE' },
];

const defaultRecentJourneys: RecentJourney[] = [
  { id: '1', from: POPULAR_STATIONS[0], to: POPULAR_STATIONS[1], date: defaultDate, passengersCount: 2 },
  { id: '2', from: POPULAR_STATIONS[0], to: POPULAR_STATIONS[2], date: defaultDate, passengersCount: 1 },
];

const JourneyContext = createContext<JourneyContextType | undefined>(undefined);

export const JourneyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePage, setActivePage] = useState<string>('home');
  const [searchParams, setSearchParams] = useState<JourneySearchParams>({
    fromStation: defaultFrom,
    toStation: defaultTo,
    travelDate: defaultDate,
    passengersCount: 1,
    classType: 'All Classes',
    quota: 'General (GN)',
  });

  const [availableTrains, setAvailableTrains] = useState<TrainDetail[]>([]);
  const [selectedTrain, setSelectedTrain] = useState<TrainDetail | null>(null);
  const [selectedClassCode, setSelectedClassCode] = useState<string>('3A');
  const [passengers, setPassengers] = useState<PassengerProfile[]>([defaultSavedPassengers[0]]);
  const [savedPassengers] = useState<PassengerProfile[]>(defaultSavedPassengers);
  const [recentJourneys, setRecentJourneys] = useState<RecentJourney[]>(() => {
    try {
      const saved = localStorage.getItem('nirantar_recent_journeys');
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultRecentJourneys;
  });
  const [trackQuery, setTrackQuery] = useState<string>('');
  const [walletBalance, setWalletBalance] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('nirantar_wallet_balance');
      if (saved && !isNaN(Number(saved))) return Number(saved);
    } catch {}
    return 10000.00; // Predefined ₹10,000 New Citizen Virtual Wallet
  });
  const [showChatDrawer, setShowChatDrawer] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem('nirantar_wallet_balance', String(walletBalance));
    } catch {}
  }, [walletBalance]);

  // Central Journey State
  const [journeyState, setJourneyState] = useState<JourneyState>(createInitialJourneyState());
  const [error, setError] = useState<JourneyError | null>(null);

  const [authState, setAuthState] = useState<AuthState>(() => {
    try {
      const saved = localStorage.getItem('nirantar_auth_user');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return {
      status: 'READY',
      userId: 'usr-pratay-84920',
      displayName: 'Pratay Karali',
      email: 'pratay.karali2005@gmail.com',
      phone: '8420773730',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=pratay',
      isAuthenticated: true,
      failureReason: null,
    };
  });

  const defaultCitizenProfile: CitizenProfile = {
    name: 'Pratay Karali',
    email: 'pratay.karali@gov.in',
    phone: '+91 98765 43210',
    accountNumber: 'CIT-9842-8812-IN',
    walletAccountNumber: 'VA-8829-4102-991',
    irctcId: 'PRATAY_K2026',
    aadhaarMask: 'XXXX-XXXX-8921',
    securityPin: '2026',
    digiLockerStatus: 'VERIFIED',
    role: 'Citizen & Explorer',
    avatar: '/assets/images/avatars/avatar_1_student.svg',
  };

  const [citizenProfile, setCitizenProfile] = useState<CitizenProfile>(() => {
    try {
      const saved = localStorage.getItem('nirantar_citizen_profile');
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultCitizenProfile;
  });

  const [securityPin, setSecurityPinState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('nirantar_security_pin');
      if (saved) return saved;
    } catch {}
    return citizenProfile.securityPin || '2026';
  });

  const setSecurityPin = useCallback((newPin: string) => {
    setSecurityPinState(newPin);
    setCitizenProfile((prev) => {
      const updated = { ...prev, securityPin: newPin };
      try {
        localStorage.setItem('nirantar_citizen_profile', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    try {
      localStorage.setItem('nirantar_security_pin', newPin);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('nirantar_citizen_profile', JSON.stringify(citizenProfile));
    } catch {}
  }, [citizenProfile]);

  useEffect(() => {
    try {
      localStorage.setItem('nirantar_auth_user', JSON.stringify(authState));
    } catch {}
  }, [authState]);

  // ── Global Deep Curated Colour Palettes (Royal Iris, Warm Sunset, Mint Express) ──
  const [theme, setThemeState] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem('nirantar_theme');
      if (saved === 'lavender' || saved === 'amber' || saved === 'emerald') {
        return saved as AppTheme;
      }
    } catch {}
    return 'lavender';
  });

  const applyThemeToDOM = useCallback((th: AppTheme) => {
    document.documentElement.setAttribute('data-theme', th);
    document.documentElement.classList.remove('dark');
  }, []);

  const setTheme = useCallback((newTheme: AppTheme | string) => {
    let resolved: AppTheme = 'lavender';
    if (newTheme === 'amber') resolved = 'amber';
    else if (newTheme === 'emerald') resolved = 'emerald';
    else resolved = 'lavender';

    setThemeState(resolved);
    try {
      localStorage.setItem('nirantar_theme', resolved);
    } catch {}
    applyThemeToDOM(resolved);
  }, [applyThemeToDOM]);

  const cycleNextTheme = useCallback(() => {
    const list: AppTheme[] = ['lavender', 'amber', 'emerald'];
    const currIdx = list.indexOf(theme);
    const nextTheme = list[(currIdx + 1) % list.length];
    setTheme(nextTheme);
  }, [theme, setTheme]);

  const toggleTheme = useCallback(() => {
    cycleNextTheme();
  }, [cycleNextTheme]);

  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme, applyThemeToDOM]);

  // Payment & Ticket Records with LocalStorage Sync
  const [paymentAttempt, setPaymentAttempt] = useState<PaymentAttempt | null>(null);
  const [paymentState, setPaymentState] = useState<PaymentState>('READY');
  const [paymentHistory, setPaymentHistory] = useState<PaymentAttempt[]>(() => {
    try {
      const saved = localStorage.getItem('nirantar_payment_history');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'tx-1',
        journeyId: 'j1',
        amount: 3040,
        method: 'UPI',
        state: 'BOOKING_CONFIRMED',
        idempotencyKey: 'idemp_seed_1',
        transactionRef: 'TXN-84920194821',
        createdAt: '2026-05-23T14:20:00.000Z',
        updatedAt: '2026-05-23T14:20:05.000Z',
      },
      {
        id: 'tx-4',
        journeyId: 'j4',
        amount: 1750,
        method: 'CARD',
        state: 'BOOKING_CONFIRMED',
        idempotencyKey: 'idemp_seed_4',
        transactionRef: 'TXN-58291048291',
        createdAt: '2026-04-02T09:15:00.000Z',
        updatedAt: '2026-04-02T09:15:03.000Z',
      },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('nirantar_payment_history', JSON.stringify(paymentHistory));
    } catch {}
  }, [paymentHistory]);

  const [issuedTicket, setIssuedTicket] = useState<TicketRecord | null>(() => {
    try {
      const saved = localStorage.getItem('nirantar_issued_ticket');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  const [bookingRecord, setBookingRecord] = useState<BookingRecord | null>(() => {
    try {
      const saved = localStorage.getItem('nirantar_booking_record');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  useEffect(() => {
    if (issuedTicket) {
      try {
        localStorage.setItem('nirantar_issued_ticket', JSON.stringify(issuedTicket));
      } catch {}
    }
  }, [issuedTicket]);

  useEffect(() => {
    if (bookingRecord) {
      try {
        localStorage.setItem('nirantar_booking_record', JSON.stringify(bookingRecord));
      } catch {}
    }
  }, [bookingRecord]);

  const [bookingState, setBookingStateRaw] = useState<BookingState>('IDLE');
  const [taskStack, setTaskStack] = useState<TaskStackItem[]>([]);
  const [activeSort, setActiveSortRaw] = useState<'recommended' | 'fastest' | 'cheapest' | 'departure'>('recommended');
  const [activeHighlightTarget, setActiveHighlightTarget] = useState<string | null>(null);

  // ─── Citizen Accessibility & "I'm Stuck" ───
  const [preferredTrackerTab, setPreferredTrackerTab] = useState<'timeline' | 'coach' | 'waitlist'>('timeline');
  const [easyMode, setEasyMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('nirantar_easy_mode') === 'true';
    } catch {
      return false;
    }
  });
  const [showImStuck, setShowImStuck] = useState(false);
  const [showVisualDiagram, setShowVisualDiagram] = useState(false);
  const [niraPendingQuery, setNiraPendingQuery] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const addNotification = useCallback((n: Omit<AppNotification, 'id' | 'time' | 'read' | 'dismissed'>) => {
    const item: AppNotification = {
      ...n,
      id: `ntf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
      dismissed: false,
    };
    setNotifications((prev) => [item, ...prev].slice(0, 20));
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, dismissed: true, read: true } : n)));
  }, []);

  const markNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const [digitalBankAlert, setDigitalBankAlert] = useState<DigitalBankAlert | null>(null);

  const dismissDigitalBankAlert = useCallback(() => {
    setDigitalBankAlert(null);
  }, []);

  const triggerDigitalBankAlert = useCallback((alert: Omit<DigitalBankAlert, 'id' | 'timestamp'>) => {
    const newAlert: DigitalBankAlert = {
      ...alert,
      id: `alert-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    setDigitalBankAlert(newAlert);
  }, []);

  const addWalletBalance = useCallback((amount: number, source: string = 'NET_BANKING') => {
    if (amount <= 0) return;
    setWalletBalance((prev) => {
      const updated = prev + amount;
      try {
        localStorage.setItem('nirantar_wallet_balance', String(updated));
      } catch {}

      const txnRef = `CR-BANK-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
      const creditAttempt: PaymentAttempt = {
        id: `pay_cr_${Date.now()}`,
        journeyId: `fund_${Date.now()}`,
        amount,
        method: source as any,
        state: 'SUCCESS',
        idempotencyKey: `idemp_cr_${Date.now()}`,
        transactionRef: txnRef,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setPaymentHistory((pHistory) => {
        const upHistory = [creditAttempt, ...pHistory];
        try {
          localStorage.setItem('nirantar_payment_history', JSON.stringify(upHistory));
        } catch {}
        return upHistory;
      });

      triggerDigitalBankAlert({
        type: 'CREDIT',
        amount,
        bankName: 'DIGITAL CITIZEN BANK',
        accountMask: 'A/C XX-8492',
        beneficiaryOrSource: source === 'UPI' ? 'FastPay UPI Transfer' : source === 'NET_BANKING' ? 'HDFC/SBI NetBanking' : 'Govt Travel Grant',
        balanceAfter: updated,
        transactionRef: txnRef,
        smsText: `Dear Customer, INR ${amount.toLocaleString('en-IN')}.00 credited to Digital Citizen Travel Bank A/C XX8492 via ${source}. Avail Bal: INR ${updated.toLocaleString('en-IN')}.00. Ref: ${txnRef}.`,
      });

      addNotification({
        type: 'ticket',
        title: '💰 Funds Credited to Digital Bank',
        body: `₹${amount.toLocaleString('en-IN')} added via ${source}. Updated balance: ₹${updated.toLocaleString('en-IN')}.00`,
      });

      return updated;
    });
  }, [triggerDigitalBankAlert, addNotification]);

  const sendNiraQuery = useCallback((query: string) => {
    setShowChatDrawer(true);
    setNiraPendingQuery(query);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('nirantar_easy_mode', String(easyMode));
    } catch {}
  }, [easyMode]);

  // Validated State Transition — LLM cannot force illegal transitions
  const setBookingState = useCallback((next: BookingState) => {
    setBookingStateRaw((current) => {
      const result = StateTransitionEngine.transition(current, next, 'setBookingState');
      if (!result.success) {
        console.warn(`[JourneyContext] Blocked transition: ${current} → ${next}`);
      }
      return result.state;
    });
  }, []);

  const setActiveSort = useCallback((sort: 'recommended' | 'fastest' | 'cheapest' | 'departure') => {
    setActiveSortRaw(sort);
    UiEventBus.emit('SORT_CHANGED', activePage, { sortMode: sort });
  }, [activePage]);

  // ─── UI Event Bus Emitter ───
  const emitUiEvent = useCallback((type: NirantarEventType, payload: any = {}) => {
    return UiEventBus.emit(type, activePage, payload);
  }, [activePage]);

  // ─── Task Stack Engine (Interruption + Resume) ───
  const pushTask = useCallback((
    type: TaskStackItem['taskType'],
    title: string,
    subtitle: string
  ) => {
    const fare = selectedTrain?.classes[0]?.fare || 0;
    const snapshot: TaskStackItem['stateSnapshot'] = {
      origin: searchParams.fromStation?.city,
      destination: searchParams.toStation?.city,
      travelDate: searchParams.travelDate,
      selectedTrain: selectedTrain ? {
        trainNumber: selectedTrain.trainNumber,
        trainName: selectedTrain.trainName,
      } : undefined,
      selectedClassCode,
      passengers: passengers.map(p => ({ ...p })),
      bookingStep: bookingState,
      fare,
    };
    const item = TaskStackManager.createTaskItem(type, activePage, title, subtitle, snapshot);
    setTaskStack((prev) => [item, ...prev]);
    emitUiEvent('TASK_INTERRUPTED', { taskId: item.taskId, title });
  }, [activePage, searchParams, selectedTrain, selectedClassCode, passengers, bookingState, emitUiEvent]);

  const resumeTask = useCallback((taskId?: string): boolean => {
    const validTasks = TaskStackManager.filterValidTasks(taskStack);
    if (validTasks.length === 0) return false;

    const task = taskId
      ? validTasks.find(t => t.taskId === taskId)
      : validTasks[0];
    if (!task) return false;

    // Restore snapshot
    const snap = task.stateSnapshot;
    if (snap.bookingStep) {
      setBookingStateRaw(snap.bookingStep as BookingState);
    }
    // Navigate back to the interrupted page
    setActivePage(task.page);
    emitUiEvent('TASK_RESUMED', { taskId: task.taskId, page: task.page });

    // Remove from stack
    setTaskStack((prev) => prev.filter(t => t.taskId !== task.taskId));
    return true;
  }, [taskStack, emitUiEvent]);

  const clearTaskStack = useCallback(() => setTaskStack([]), []);

  // ─── Sanitized Context Builder (Compact JSON for Nira / LLM) ───
  const getSanitizedContext = useCallback((): NiraSanitizedContext => {
    const completedSteps: string[] = [];
    const pendingSteps: string[] = [];
    const BOOKING_FLOW: BookingState[] = ['SEARCHING', 'RESULTS', 'TRAIN_SELECTED', 'PASSENGER_DETAILS', 'REVIEW', 'PAYMENT_READY'];
    const currentIdx = BOOKING_FLOW.indexOf(bookingState);
    BOOKING_FLOW.forEach((step, i) => {
      if (i < currentIdx) completedSteps.push(step);
      else if (i > currentIdx) pendingSteps.push(step);
    });

    const fare = selectedTrain?.classes?.find(c => c.classCode === selectedClassCode)?.fare
      || selectedTrain?.classes[0]?.fare || 0;

    return {
      page: activePage,
      bookingState,
      journey: {
        origin: searchParams.fromStation?.city,
        destination: searchParams.toStation?.city,
        travelDate: searchParams.travelDate,
        passengersCount: passengers.length,
        selectedTrainNumber: selectedTrain?.trainNumber,
        selectedTrainName: selectedTrain?.trainName,
        selectedClassCode,
        fare: fare * passengers.length,
      },
      booking: {
        step: bookingState,
        completedSteps,
        pendingSteps,
      },
      payment: {
        status: paymentState,
        amount: fare * passengers.length,
        walletBalance,
      },
      tracking: {
        activeTrainNumber: trackQuery || selectedTrain?.trainNumber,
      },
      interruptedTask: taskStack.length > 0
        ? { hasTask: true, title: taskStack[0]?.title }
        : { hasTask: false },
      allowedActions: ['NAVIGATE', 'HIGHLIGHT', 'SET_SORT', 'SET_FILTER', 'AUTOFILL', 'OPEN_HELP', 'RESUME_TASK', 'OPEN_TICKET', 'OPEN_TRACKING'],
    };
  }, [activePage, bookingState, searchParams, passengers, selectedTrain, selectedClassCode, paymentState, walletBalance, trackQuery, taskStack]);

  const syncConfirmedBookingAndPayment = useCallback((attempt: PaymentAttempt) => {
    const trainCandidate = selectedTrain || availableTrains[0] || (searchParams.fromStation?.code ? localSearchTrains(searchParams.fromStation.code, searchParams.toStation.code)[0] : null) || MOCK_TRAINS_DATABASE[0];
    const resolvedTrain: TrainDetail = trainCandidate || {
      trainNumber: '12863',
      trainName: 'Howrah - KSR Bengaluru SF Express',
      trainType: 'Superfast',
      fromStationName: searchParams.fromStation.name || 'Howrah Junction',
      fromStationCode: searchParams.fromStation.code || 'HWH',
      toStationName: searchParams.toStation.name || 'KSR Bengaluru City',
      toStationCode: searchParams.toStation.code || 'SBC',
      fromCity: searchParams.fromStation.city || 'Kolkata',
      toCity: searchParams.toStation.city || 'Bengaluru',
      departureTime: '22:55',
      arrivalTime: '06:45',
      durationHours: '31h 50m',
      distanceKm: 1958,
      runningDays: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
      departureDayOffset: 2,
      classes: [{ classCode: selectedClassCode || '3A', className: 'AC 3 Tier', fare: 1958, status: 'AVAILABLE', availableSeats: 48 }],
      score: 96,
      tags: ['Superfast', 'High Demand'],
    };

    const pnr = `${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(10 + Math.random() * 90)}`;
    const bookingRef = `NR-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    const isKolkataBangalore =
      (searchParams.fromStation?.city?.toLowerCase()?.includes('kolkata') || searchParams.fromStation?.name?.toLowerCase()?.includes('howrah') || ['HWH', 'SDAH', 'SHM', 'KOAA'].includes(searchParams.fromStation?.code || '')) &&
      (searchParams.toStation?.city?.toLowerCase()?.includes('bengaluru') || searchParams.toStation?.city?.toLowerCase()?.includes('bangalore') || ['SBC', 'YPR', 'SMVB', 'BNC', 'BAND'].includes(searchParams.toStation?.code || ''));

    const isChandigarhLucknow =
      (searchParams.fromStation?.city?.toLowerCase()?.includes('chandigarh') || searchParams.fromStation?.code === 'CDG') &&
      (searchParams.toStation?.city?.toLowerCase()?.includes('lucknow') || searchParams.toStation?.code === 'LKO');

    const chosenClass =
      resolvedTrain.classes?.find((c) => c.classCode === (selectedClassCode || '3A')) ||
      selectedTrain?.classes?.find((c) => c.classCode === (selectedClassCode || '3A')) ||
      resolvedTrain.classes?.[0];

    const isWaitlistTrain = Boolean(
      chosenClass && (chosenClass.status?.includes('WL') || chosenClass.status?.includes('GNWL') || chosenClass.availableSeats === 0)
    );

    // Multi-passenger resolution (do not inject dummy names if user specified passengers)
    const targetCount = Math.max(searchParams.passengersCount || 1, passengers.length || 1);
    const resolvedPassengers: PassengerProfile[] = [];
    for (let i = 0; i < targetCount; i++) {
      if (passengers[i] && passengers[i].name) {
        resolvedPassengers.push(passengers[i]);
      } else {
        const saved = savedPassengers?.[i];
        resolvedPassengers.push({
          id: `p_${Date.now()}_${i + 1}`,
          name: saved?.name || `Passenger ${i + 1}`,
          age: saved?.age || (24 + i * 2),
          gender: saved?.gender || (i % 2 === 0 ? 'M' : 'F'),
          berthPreference: saved?.berthPreference || (i % 2 === 0 ? 'LOWER' : 'MIDDLE'),
          assignedClassCode: selectedClassCode || '3A',
        });
      }
    }

    const dynamicAllotments = allocatePassengerSeats(resolvedPassengers, selectedClassCode || '3A', pnr);
    const dynamicWlInfo = getDynamicInitialWaitlist(resolvedTrain.trainNumber, selectedClassCode || '3A', chosenClass?.status);
    const baseWlSeat = dynamicWlInfo.initialWl;
    const baseWlQuota = dynamicWlInfo.quotaType;

    const seatAllotments = resolvedPassengers.map((p, idx) => {
      if (isWaitlistTrain) {
        return {
          coach: baseWlQuota,
          seatNumber: baseWlSeat + idx * 2,
          berthType: `${baseWlQuota} Queue #${baseWlSeat + idx * 2}`,
        };
      }
      const allot = dynamicAllotments[idx];
      return {
        coach: allot?.coachCode || 'B4',
        seatNumber: allot?.seatNumber || (16 + idx),
        berthType: allot?.berthType || 'Lower Berth',
      };
    });

    const primarySeatAllotment = seatAllotments[0] || {
      coach: isWaitlistTrain ? baseWlQuota : 'B4',
      seatNumber: isWaitlistTrain ? baseWlSeat : 16,
      berthType: isWaitlistTrain ? `${baseWlQuota} Queue #${baseWlSeat}` : 'Lower Berth',
    };

    const newTicket: TicketRecord = {
      ticketId: `tkt_${Date.now()}`,
      journeyId: attempt.journeyId || `j_${Date.now()}`,
      bookingReference: bookingRef,
      pnrNumber: pnr,
      train: resolvedTrain,
      classCode: selectedClassCode || '3A',
      passengers: resolvedPassengers,
      seatAllotments,
      travelDate: searchParams.travelDate || 'Tomorrow, 27 Aug 2026',
      origin: searchParams.fromStation,
      destination: searchParams.toStation,
      status: isWaitlistTrain ? ('WAITLIST' as any) : 'ACTIVE',
      issuedAt: new Date().toISOString(),
    };

    const newBooking: BookingRecord = {
      bookingId: `bk_${Date.now()}`,
      journeyId: attempt.journeyId || `j_${Date.now()}`,
      bookingReference: bookingRef,
      pnrNumber: pnr,
      trainNumber: resolvedTrain.trainNumber,
      trainName: resolvedTrain.trainName,
      classCode: selectedClassCode || '3A',
      status: isWaitlistTrain ? ('WAITLIST' as any) : 'CONFIRMED',
      seatAllotment: primarySeatAllotment,
      createdAt: new Date().toISOString(),
    };

    const newRecentJourney: RecentJourney = {
      id: `rj_${Date.now()}`,
      from: searchParams.fromStation,
      to: searchParams.toStation,
      date: searchParams.travelDate || 'Tomorrow, 27 Aug 2026',
      passengersCount: Math.max(1, passengers.length),
    };

    setIssuedTicket(newTicket);
    setBookingRecord(newBooking);
    setBookingStateRaw('CONFIRMED');
    setRecentJourneys((prev) => [newRecentJourney, ...prev]);

    // Real digital bank balance deduction
    setWalletBalance((prevBal) => {
      const updatedBal = Math.max(0, prevBal - (attempt.amount || 0));
      try {
        localStorage.setItem('nirantar_wallet_balance', String(updatedBal));
      } catch {}

      triggerDigitalBankAlert({
        type: 'DEBIT',
        amount: attempt.amount,
        bankName: 'DIGITAL CITIZEN BANK',
        accountMask: 'A/C XX-8492',
        beneficiaryOrSource: `IRCTC RAILWAY RESERVATION (${attempt.method || 'FASTPAY'})`,
        balanceAfter: updatedBal,
        transactionRef: attempt.transactionRef || `TXN-BK-${Date.now()}`,
        smsText: `Dear Customer, INR ${(attempt.amount || 0).toLocaleString('en-IN')}.00 debited from A/C XX8492 to IRCTC RAILWAY CORP via ${attempt.method || 'FASTPAY'} on ${new Date().toLocaleDateString('en-IN')}. Avail Bal: INR ${updatedBal.toLocaleString('en-IN')}.00. Ref: ${attempt.transactionRef || 'TXN-DIRECT'}.`,
      });

      return updatedBal;
    });

    setPaymentHistory((prev) => {
      const updated = [attempt, ...prev.filter((p) => p.id !== attempt.id)];
      try {
        localStorage.setItem('nirantar_payment_history', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    try {
      localStorage.setItem('nirantar_issued_ticket', JSON.stringify(newTicket));
      localStorage.setItem('nirantar_booking_record', JSON.stringify(newBooking));
      localStorage.setItem('nirantar_recent_journeys', JSON.stringify([newRecentJourney, ...recentJourneys]));
    } catch {}

    return { ticket: newTicket, booking: newBooking };
  }, [selectedTrain, availableTrains, searchParams, selectedClassCode, passengers, recentJourneys, triggerDigitalBankAlert]);

  const payWithWallet = async (amount: number): Promise<PaymentAttempt | null> => {
    if (walletBalance < amount) {
      setNamedError('PAYMENT_FAILED', `Insufficient balance in Nirantar Citizen Virtual Wallet. (Active: ₹${walletBalance.toLocaleString('en-IN')}, Required: ₹${amount.toLocaleString('en-IN')}).`);
      return null;
    }
    const newBal = Math.max(0, walletBalance - amount);
    setWalletBalance(newBal);
    try {
      localStorage.setItem('nirantar_wallet_balance', String(newBal));
    } catch {}

    const jId = journeyState.journeyId || `mock_journey_${Date.now()}`;
    const txnRef = `TXN-WLT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    const walletAttempt: PaymentAttempt = {
      id: `pay_wlt_${Date.now()}`,
      journeyId: jId,
      amount,
      method: 'WALLET',
      state: 'BOOKING_CONFIRMED',
      idempotencyKey: `idemp_wlt_${Date.now()}`,
      transactionRef: txnRef,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setPaymentAttempt(walletAttempt);
    setPaymentState('BOOKING_CONFIRMED');

    syncConfirmedBookingAndPayment(walletAttempt);

    addNotification({
      type: 'ticket',
      title: '💳 Citizen Wallet Payment Confirmed',
      body: `₹${amount.toLocaleString('en-IN')} debited from Virtual Wallet (Txn: ${txnRef}). Remaining balance: ₹${newBal.toLocaleString('en-IN')}.00`,
    });

    apiCreatePayment(jId, amount, 'WALLET').catch(() => {});

    return walletAttempt;
  };

  const cancelTicket = useCallback((pnr: string, refundAmount: number = 0) => {
    setIssuedTicket((prev) => (prev && prev.pnrNumber === pnr ? { ...prev, status: 'CANCELLED' as any } : prev));
    if (refundAmount > 0) {
      setWalletBalance((prev) => {
        const updated = prev + refundAmount;
        try {
          localStorage.setItem('nirantar_wallet_balance', String(updated));
        } catch {}

        triggerDigitalBankAlert({
          type: 'CREDIT',
          amount: refundAmount,
          bankName: 'DIGITAL CITIZEN BANK',
          accountMask: 'A/C XX-8492',
          beneficiaryOrSource: `IRCTC TICKET REFUND (#${pnr})`,
          balanceAfter: updated,
          transactionRef: `REF-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
          smsText: `Dear Customer, INR ${refundAmount.toLocaleString('en-IN')}.00 refunded from IRCTC for PNR ${pnr} to A/C XX8492. Avail Bal: INR ${updated.toLocaleString('en-IN')}.00.`,
        });

        return updated;
      });
    }
    addNotification({
      type: 'ticket',
      title: `Ticket #${pnr} Cancelled & Refunded`,
      body: `Statutory refund of ₹${refundAmount.toLocaleString('en-IN')} has been instantly credited back to your Citizen Travel Wallet.`,
    });
  }, [addNotification, triggerDigitalBankAlert]);

  const clearError = useCallback(() => setError(null), []);

  const setNamedError = useCallback((code: JourneyErrorCode, customMessage?: string) => {
    const template = JOURNEY_ERROR_MESSAGES[code];
    setError({
      code,
      whatHappened: customMessage || template.whatHappened,
      whatToDoNext: template.whatToDoNext,
      canRetry: template.canRetry,
      severity: template.severity,
    });
  }, []);

  // Initial load: fetch trains from backend API
  useEffect(() => {
    const loadInitialTrains = async () => {
      try {
        const res = await apiSearchTrains(searchParams.fromStation.code, searchParams.toStation.code);
        if (res.trains && res.trains.length > 0) {
          setAvailableTrains(res.trains);
        } else {
          setAvailableTrains(localSearchTrains(searchParams.fromStation.code, searchParams.toStation.code));
        }
      } catch {
        setAvailableTrains(localSearchTrains(searchParams.fromStation.code, searchParams.toStation.code));
      }
    };
    loadInitialTrains();
  }, []);

  const executeSearch = async (paramsOverride?: Partial<JourneySearchParams>): Promise<{ success: boolean; error?: string }> => {
    clearError();

    // Clean paramsOverride to ignore undefined/null values so they never overwrite defaults
    const cleanedOverride: Partial<JourneySearchParams> = {};
    if (paramsOverride) {
      for (const [k, v] of Object.entries(paramsOverride)) {
        if (v !== undefined && v !== null && v !== '') {
          (cleanedOverride as any)[k] = v;
        }
      }
    }

    const params: JourneySearchParams = {
      ...searchParams,
      ...cleanedOverride,
      travelDate: cleanedOverride.travelDate || searchParams.travelDate || 'Tomorrow',
    };

    // Validation
    if (!params.fromStation) {
      setNamedError('INVALID_JOURNEY', 'Please select a boarding station (From).');
      return { success: false, error: 'Please select a boarding station (From).' };
    }
    if (!params.toStation) {
      setNamedError('INVALID_JOURNEY', 'Please select a destination station (To).');
      return { success: false, error: 'Please select a destination station (To).' };
    }
    if (params.fromStation.code === params.toStation.code) {
      setNamedError('INVALID_JOURNEY', 'Boarding and destination stations cannot be the same.');
      return { success: false, error: 'Boarding and destination stations cannot be the same.' };
    }
    if (!params.travelDate) {
      params.travelDate = 'Tomorrow';
    }

    setSearchParams(params);

    try {
      const access = await admitFairAccess({
        action: 'SEARCH_TRAINS',
        sessionId: `search:${params.fromStation.code}:${params.toStation.code}:${params.travelDate}`,
        origin: params.fromStation.code,
        destination: params.toStation.code,
        travelDate: params.travelDate,
        journeyId: journeyState.journeyId || undefined,
      });
      if (access) setFairAccessTicket(access);

      // 1. Create journey record in backend DB (preserves state even while queued)
      const journeyRes = journeyState.journeyId
        ? { journeyId: journeyState.journeyId }
        : await apiCreateJourney({
            originCode: params.fromStation.code,
            destinationCode: params.toStation.code,
            travelDate: params.travelDate,
            passengersCount: params.passengersCount,
            classType: params.classType,
            quota: params.quota,
          }).catch(() => null);

      if (journeyRes?.journeyId) {
        setJourneyState((prev) => ({
          ...prev,
          journeyId: journeyRes.journeyId,
          origin: params.fromStation,
          destination: params.toStation,
          travelDate: params.travelDate,
          passengersCount: params.passengersCount,
          step: 'SEARCHED',
        }));
      }

      if (access && !access.admitted) {
        return { success: true };
      }

      // 2. Fetch train search results from backend API
      const searchRes = await apiSearchTrains(params.fromStation.code, params.toStation.code, params.travelDate);
      if (searchRes.trains && searchRes.trains.length > 0) {
        setAvailableTrains(searchRes.trains);
      } else {
        const fallback = localSearchTrains(params.fromStation.code, params.toStation.code);
        setAvailableTrains(fallback);
      }
    } catch {
      // Graceful fallback to synthetic data fixture
      const fallback = localSearchTrains(params.fromStation.code, params.toStation.code);
      setAvailableTrains(fallback);
    }

    // Save to recent journeys
    const isDuplicate = recentJourneys.some(
      (r) => r.from.code === params.fromStation.code && r.to.code === params.toStation.code
    );
    if (!isDuplicate) {
      const newRecent: RecentJourney = {
        id: `r_${Date.now()}`,
        from: params.fromStation,
        to: params.toStation,
        date: params.travelDate,
        passengersCount: params.passengersCount,
      };
      setRecentJourneys((prev) => [newRecent, ...prev.slice(0, 4)]);
    }

    setActivePage('trains');
    return { success: true };
  };

  const selectTrain = (train: TrainDetail, classCode?: string) => {
    setSelectedTrain(train);
    const chosenClass = classCode || (train.classes.length > 0 ? train.classes[0].classCode : '3A');
    setSelectedClassCode(chosenClass);

    const matchedFrom = findStation(train.fromStationCode) || {
      code: train.fromStationCode,
      name: train.fromStationName,
      city: train.fromCity,
      state: '',
      aliases: [],
    };
    const matchedTo = findStation(train.toStationCode) || {
      code: train.toStationCode,
      name: train.toStationName,
      city: train.toCity,
      state: '',
      aliases: [],
    };
    setSearchParams((prev) => ({
      ...prev,
      fromStation: matchedFrom,
      toStation: matchedTo,
    }));

    setJourneyState((prev) => ({
      ...prev,
      selectedTrain: train,
      selectedClassCode: chosenClass,
      step: 'TRAIN_SELECTED',
    }));

    UiEventBus.emit('TRAIN_SELECTED', 'trains', { train, classCode: chosenClass });
    navigateTo('workspace');
  };

  const savePassengerDetails = async (passengersList: PassengerProfile[]): Promise<boolean> => {
    setPassengers(passengersList);
    setJourneyState((prev) => ({
      ...prev,
      passengers: passengersList,
      step: 'PASSENGER_REVIEW',
    }));

    if (journeyState.journeyId) {
      try {
        await apiSavePassengers(journeyState.journeyId, passengersList);
      } catch (e) {
        console.warn('Failed to sync passenger drafts to backend:', e);
      }
    }
    return true;
  };

  // Mock Authentication Flow (Isolated from AI)
  const performMockAuth = async (username: string, password: string = 'nirantar2026'): Promise<boolean> => {
    setAuthState((prev) => ({ ...prev, status: 'VERIFYING' }));
    try {
      const res = await apiMockLogin(username, password);
      setAuthState(res);
      return res.isAuthenticated;
    } catch {
      // Fallback verified synthetic user
      const fallbackAuth: AuthState = {
        status: 'VERIFIED',
        userId: 'usr-pratay-84920',
        displayName: 'Pratay Karali',
        isAuthenticated: true,
        failureReason: null,
      };
      setAuthState(fallbackAuth);
      return true;
    }
  };

  const verifyMockOtp = async (otp: string): Promise<boolean> => {
    try {
      const res = await apiMockVerify(authState.userId || 'usr-pratay-84920', otp);
      setAuthState(res);
      return res.isAuthenticated;
    } catch {
      setAuthState((prev) => ({ ...prev, status: 'VERIFIED', isAuthenticated: true }));
      return true;
    }
  };

  // Payment State Machine
  const initiatePayment = async (method: PaymentMethod, amount: number): Promise<PaymentAttempt | null> => {
    clearError();
    setPaymentState('INITIATED');

    const jId = journeyState.journeyId || `mock_journey_${Date.now()}`;

    try {
      const attempt = await apiCreatePayment(jId, amount, method);
      setPaymentAttempt(attempt);
      setPaymentState('PROCESSING');
      return attempt;
    } catch (e) {
      // Fallback synthetic payment attempt
      const fallbackAttempt: PaymentAttempt = {
        id: `pay_${Date.now()}`,
        journeyId: jId,
        amount,
        method,
        state: 'PROCESSING',
        idempotencyKey: `idemp_${Date.now()}`,
        transactionRef: `TXN-NIRANTAR-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setPaymentAttempt(fallbackAttempt);
      setPaymentState('PROCESSING');
      return fallbackAttempt;
    }
  };

  const verifyPaymentStatus = async (): Promise<PaymentAttempt | null> => {
    if (!paymentAttempt) return null;
    setPaymentState('VERIFYING');

    try {
      const res = await apiVerifyPayment(paymentAttempt.id);
      setPaymentAttempt(res);
      setPaymentState(res.state);

      if (res.state === 'SUCCESS' || res.state === 'BOOKING_CONFIRMED') {
        syncConfirmedBookingAndPayment(res);
        const ticket = await apiGetTicket(res.journeyId).catch(() => null);
        if (ticket) {
          const isWl =
            (ticket.status as string) === 'WAITLIST' ||
            (ticket.seatAllotments?.[0]?.coach || '').includes('WL') ||
            (ticket.seatAllotments?.[0]?.coach || '').includes('GNWL');
          if (isWl) {
            ticket.status = 'WAITLIST' as any;
          }
          setIssuedTicket(ticket);
        }
      }
      return res;
    } catch {
      // Fallback resolution
      const resolved: PaymentAttempt = {
        ...paymentAttempt,
        state: 'SUCCESS',
        updatedAt: new Date().toISOString(),
      };
      setPaymentAttempt(resolved);
      setPaymentState('SUCCESS');
      syncConfirmedBookingAndPayment(resolved);
      return resolved;
    }
  };

  const triggerMockPaymentResult = async (result: 'SUCCESS' | 'FAILED' | 'UNKNOWN'): Promise<PaymentAttempt | null> => {
    if (!paymentAttempt) return null;

    try {
      const res = await apiMockPaymentResult(paymentAttempt.id, result);
      setPaymentAttempt(res);
      setPaymentState(res.state);

      if (result === 'SUCCESS') {
        syncConfirmedBookingAndPayment(res);
        const ticket = await apiGetTicket(res.journeyId).catch(() => null);
        if (ticket) {
          const isWl =
            (ticket.status as string) === 'WAITLIST' ||
            (ticket.seatAllotments?.[0]?.coach || '').includes('WL') ||
            (ticket.seatAllotments?.[0]?.coach || '').includes('GNWL');
          if (isWl) {
            ticket.status = 'WAITLIST' as any;
          }
          setIssuedTicket(ticket);
        }
      }
      return res;
    } catch {
      const updated: PaymentAttempt = {
        ...paymentAttempt,
        state: result === 'SUCCESS' ? 'BOOKING_CONFIRMED' : result,
        updatedAt: new Date().toISOString(),
      };
      setPaymentAttempt(updated);
      setPaymentState(result === 'SUCCESS' ? 'BOOKING_CONFIRMED' : result);
      if (result === 'SUCCESS') {
        syncConfirmedBookingAndPayment(updated);
      }
      return updated;
    }
  };

  // Smart Spotlight & Guidance Tour State
  const [guidanceActive, setGuidanceActive] = useState<boolean>(false);
  const [guidanceStepIndex, setGuidanceStepIndex] = useState<number>(0);

  const stopGuidanceTour = useCallback(() => {
    setGuidanceActive(false);
  }, []);

  const startGuidanceTour = useCallback((initialStep: number = 0) => {
    setGuidanceStepIndex(initialStep);
    setGuidanceActive(true);
  }, []);

  const prevGuidanceStep = useCallback(() => {
    setGuidanceStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const nextGuidanceStep = useCallback(() => {
    setGuidanceStepIndex((prev) => {
      if (prev >= 7) {
        setGuidanceActive(false);
        return 0;
      }
      return prev + 1;
    });
  }, []);

  const guidanceStepsList: GuidanceStep[] = [
    {
      id: 'step-1-nira-assistant',
      stepNumber: 1,
      title: '1. Hands-Free Nira AI Assistant',
      speech: 'Welcome to Nirantar! Meet Nira, your conversational AI travel assistant. You can chat or speak to search trains, autofill passenger forms, or check live policies hands-free anytime!',
      actionCue: 'Tap Nira on the left sidebar or chat directly in the open drawer to start.',
      actionButtonText: 'Proceed to Passenger Workspace ➔',
      arrowPlacement: { bottom: '260px', right: '440px' },
      arrowLabel: '🤖 Nira AI Chatbot & Voice Assistant',
      cardPosition: 'left',
      onAction: () => {
        const topTrain = availableTrains[0] || localSearchTrains(searchParams.fromStation.code, searchParams.toStation.code)[0] || MOCK_TRAINS_DATABASE[0];
        if (topTrain) {
          selectTrain(topTrain, selectedClassCode || '3A');
        }
        setActivePage('workspace');
        setGuidanceStepIndex(1);
      },
    },
    {
      id: 'step-2-passenger-workspace',
      stepNumber: 2,
      title: '2. Passenger Workspace & Seat Lock',
      speech: 'Here are your passenger names, berth preferences, and one-tap Travel Class selector. Review your details with Zero-PII privacy protection and proceed.',
      actionCue: 'Review passenger names and seat preferences with zero PII exposure.',
      actionButtonText: 'Explore Profile & Wallet Top-Up ➔',
      arrowPlacement: { top: '38%', left: '22%' },
      arrowLabel: '👤 Safe Passenger Details & Seat Preferences',
      cardPosition: 'right',
      onAction: () => {
        setActivePage('profile');
        setGuidanceStepIndex(2);
      },
    },
    {
      id: 'step-3-profile-wallet-topup',
      stepNumber: 3,
      title: '3. Citizen Profile & Virtual Wallet Top-Up',
      speech: 'Every citizen receives a pre-loaded ₹10,000 Government Travel Credit Grant! You can manage personal details, switch avatar personas, update your 4-digit Security PIN, and easily add funds to your Virtual Wallet anytime.',
      actionCue: 'View your ₹10,000 Active Balance and tap "Add Balance / Top-Up Wallet" to top up.',
      actionButtonText: 'Proceed to 1-Click Payment ➔',
      arrowPlacement: { top: '340px', right: '120px' },
      arrowLabel: '💳 Pre-Loaded ₹10,000 Citizen Wallet & Instant Top-Up',
      cardPosition: 'left',
      onAction: () => {
        setActivePage('payment');
        setGuidanceStepIndex(3);
      },
    },
    {
      id: 'step-4-citizen-wallet-pay',
      stepNumber: 4,
      title: '4. Citizen Virtual Wallet & 1-Click Pay',
      speech: 'Enjoy instant 1-click checkout with your ₹10,000 pre-loaded Nirantar Citizen Virtual Wallet or choose UPI/NetBanking with zero payment risk.',
      actionCue: 'Use Citizen Wallet or UPI ID to authorize payment securely.',
      actionButtonText: 'Authorize & View Ticket ➔',
      arrowPlacement: { top: '68%', left: '24%' },
      arrowLabel: '💳 Enter UPI ID or 1-Click Wallet Pay',
      cardPosition: 'right',
      onAction: async () => {
        const trainToBook = selectedTrain || availableTrains[0] || MOCK_TRAINS_DATABASE[0];
        if (trainToBook) {
          selectTrain(trainToBook, selectedClassCode || '3A');
        }
        await payWithWallet(3120);
        setActivePage('ticket');
        setGuidanceStepIndex(4);
      },
    },
    {
      id: 'step-5-digilocker-ticket',
      stepNumber: 5,
      title: '5. DigiLocker Verified e-Ticket',
      speech: 'Booking confirmed! Your official DigiLocker verified e-ticket has been issued with confirmed coach and seat allocation.',
      actionCue: 'Review your confirmed ticket PNR, download PDF, or check history.',
      actionButtonText: 'Open Live Train Radar ➔',
      arrowPlacement: { top: '27%', left: '24%' },
      arrowLabel: '🎟️ DigiLocker Verified e-Ticket & PNR',
      cardPosition: 'right',
      onAction: () => {
        setPreferredTrackerTab('timeline');
        setActivePage('track');
        setGuidanceStepIndex(5);
      },
    },
    {
      id: 'step-6-live-radar-tracking',
      stepNumber: 6,
      title: '6. Live Radar & Satellite Telemetry',
      speech: 'Track live train location, real-time speed, delay estimator, platform indicators, and deboarding door direction with satellite telemetry.',
      actionCue: 'Monitor live GPS speed, next stoppage, and platform door alignment.',
      actionButtonText: 'Switch to Coach Layout & Berth Matrix ➔',
      arrowPlacement: { top: '32%', left: '22%' },
      arrowLabel: '📡 Live GPS Satellite Telemetry & Platform Radar',
      cardPosition: 'right',
      onAction: () => {
        setPreferredTrackerTab('coach');
        setActivePage('track');
        setGuidanceStepIndex(6);
      },
    },
    {
      id: 'step-7-coach-seat-matrix',
      stepNumber: 7,
      title: '7. Live Coach Layout & Berth Matrix',
      speech: 'Explore interactive coach layouts across S1, B4, A1, and H1 with live 24-berth matrix, booked seat indicators, and corridor occupancy balance.',
      actionCue: 'Switch coaches and view your confirmed booked berths in the live matrix.',
      actionButtonText: 'Explore Dotted Keywords & Jargon Decoder ➔',
      arrowPlacement: { top: '55%', left: '20%' },
      arrowLabel: '💺 Interactive Coach Layout & 24-Berth Grid',
      cardPosition: 'right',
      onAction: () => {
        setGuidanceStepIndex(7);
      },
    },
    {
      id: 'step-8-interactive-jargon',
      stepNumber: 8,
      title: '8. Interactive Keywords & Plain-English Jargon Decoder',
      speech: 'Notice the dotted underline on terms like PNR, GNWL, RAC, and Platform Alignment across the entire platform! Hover or tap on any underlined keyword anywhere on the website for instant, crystal-clear plain-English definitions and railway policy explanations.',
      actionCue: 'Hover or tap any dotted underlined keyword across Nirantar to view instant definitions.',
      actionButtonText: 'Finish Guided Tour 🎉',
      arrowPlacement: { top: '42%', left: '30%' },
      arrowLabel: '✨ Plain-English Dotted Keyword Definitions & Hover Hints',
      cardPosition: 'left',
      onAction: () => {
        setGuidanceActive(false);
      },
    },
  ];

  const currentGuidanceStep = guidanceActive ? guidanceStepsList[guidanceStepIndex] || null : null;

  // Seamless Auto Booker Flow
  const triggerAutoBookFlow = async (params: {
    fromStation: Station;
    toStation: Station;
    travelDate?: string;
    passengersCount?: number;
    preferredTrainNumber?: string;
    classCode?: string;
    quota?: string;
    passengerName?: string;
    startWithGuidance?: boolean;
  }): Promise<boolean> => {
    clearError();
    const date = params.travelDate || defaultDate;
    const paxCount = params.passengersCount || 1;
    const classType = params.classCode || '3A';
    const quota = params.quota || 'General (GN)';

    const searchObj = {
      fromStation: params.fromStation,
      toStation: params.toStation,
      travelDate: date,
      passengersCount: paxCount,
      classType: classType,
      quota: quota,
    };
    setSearchParams(searchObj);

    // Search trains
    let matchedTrains: TrainDetail[] = [];
    try {
      const res = await apiSearchTrains(params.fromStation.code, params.toStation.code, date);
      if (res.trains && res.trains.length > 0) {
        matchedTrains = res.trains;
      } else {
        matchedTrains = localSearchTrains(params.fromStation.code, params.toStation.code);
      }
    } catch {
      matchedTrains = localSearchTrains(params.fromStation.code, params.toStation.code);
    }
    setAvailableTrains(matchedTrains);

    // Pick targeted or fastest train
    let targetTrain: TrainDetail | null = null;
    if (params.preferredTrainNumber) {
      targetTrain = matchedTrains.find((t) => t.trainNumber === params.preferredTrainNumber) || null;
    }
    if (!targetTrain && matchedTrains.length > 0) {
      targetTrain = matchedTrains[0];
    }

    // Set passenger name if explicitly provided
    if (params.passengerName && params.passengerName !== 'Pratay Karali') {
      setPassengers([
        {
          id: `p_${Date.now()}`,
          name: params.passengerName,
          age: 25,
          gender: 'M',
          berthPreference: 'NO_PREFERENCE',
        },
      ]);
    } else {
      setPassengers([
        {
          id: `p_${Date.now()}`,
          name: '',
          age: 25,
          gender: 'M',
          berthPreference: 'NO_PREFERENCE',
        },
      ]);
    }

    if (targetTrain) {
      setSelectedTrain(targetTrain);
      setSelectedClassCode(classType);
      setJourneyState((prev) => ({
        ...prev,
        origin: params.fromStation,
        destination: params.toStation,
        travelDate: date,
        passengersCount: paxCount,
        selectedTrain: targetTrain,
        selectedClassCode: classType,
        step: 'TRAIN_SELECTED',
      }));

      if (params.startWithGuidance) {
        navigateTo('trains');
        startGuidanceTour(0);
      } else {
        // Direct transition into booking workspace
        navigateTo('workspace');
      }
      return true;
    } else {
      navigateTo('trains');
      return false;
    }
  };

  // ─── Agentic 1Password Authentication & Waitlist Intelligence ───
  const [showAgenticAuth, setShowAgenticAuth] = useState(false);

  const triggerAgenticAuth = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      setShowAgenticAuth(true);
      // Successful biometric resolution resolves true
      const checkAuth = setInterval(() => {
        if (!showAgenticAuth) {
          clearInterval(checkAuth);
          resolve(true);
        }
      }, 500);
    });
  }, [showAgenticAuth]);

  const getWaitlistProbability = useCallback((status: string, classCode: string = '3A'): {
    probability: number;
    label: string;
    confidence: string;
  } => {
    const upper = (status || '').toUpperCase();
    if (upper.includes('AVAILABLE') || upper.includes('AVL') || upper.includes('CNF') || upper.includes('CONFIRM')) {
      return { probability: 100, label: 'Confirmed (CNF)', confidence: 'Guaranteed' };
    }
    if (upper.includes('RAC')) {
      return { probability: 98, label: '98% Confirmed (RAC Berth Allocated)', confidence: 'Very High' };
    }
    const match = upper.match(/WL\s*(\d+)/) || upper.match(/(\d+)/);
    const wlNum = match ? parseInt(match[1], 10) : 15;
    if (wlNum <= 10) {
      return { probability: 92, label: `92% Chance of Confirmation (WL ${wlNum})`, confidence: 'High' };
    }
    if (wlNum <= 30) {
      return { probability: 84, label: `84% Chance of Confirmation (WL ${wlNum})`, confidence: 'High' };
    }
    if (wlNum <= 60) {
      return { probability: 68, label: `68% Chance of Confirmation (WL ${wlNum})`, confidence: 'Medium' };
    }
    return { probability: 45, label: `45% Chance of Confirmation (WL ${wlNum})`, confidence: 'Low' };
  }, []);

  const handleQuickTrack = (query: string) => {
    if (!query || query.trim() === '') return;
    setTrackQuery(query.trim());
    navigateTo('track');
  };

  // ─── Mid-Journey Berth Reallocations & Special Requests ───
  const [activeReallocations, setActiveReallocations] = useState<MidJourneyReallocation[]>(() => {
    try {
      const saved = localStorage.getItem('nirantar_active_reallocations');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('nirantar_active_reallocations', JSON.stringify(activeReallocations));
    } catch {}
  }, [activeReallocations]);

  const requestMidJourneyReallocation = useCallback(
    async (
      reallocationData: Omit<MidJourneyReallocation, 'id' | 'timestamp' | 'approvedBy' | 'status'>
    ): Promise<MidJourneyReallocation> => {
      const newRecord: MidJourneyReallocation = {
        ...reallocationData,
        id: `REALOC-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        approvedBy: 'On-Board Train Conductor (TTE Manifest Verification)',
        status: 'PENDING',
      };

      // Ensure each passenger only has 1 active reallocation request at a time for this train/journey
      setActiveReallocations((prev) => [
        newRecord,
        ...prev.filter(
          (r) =>
            !(
              r.passengerName?.toLowerCase().trim() === newRecord.passengerName?.toLowerCase().trim() &&
              (!newRecord.trainNumber || !r.trainNumber || r.trainNumber === newRecord.trainNumber)
            )
        ),
      ]);

      // Push initial pending notification
      addNotification({
        title: '⚡ Vacant Berth Shift Requested (Pending TTE Confirmation)',
        body: `Your request to occupy vacant Berth ${newRecord.toSeat} (${newRecord.toBerthType}) from ${newRecord.effectiveFromStation} for passenger ${newRecord.passengerName} has been logged at ₹0 (NO Extra Cost). Status: REQUESTED NOT APPROVED (Auto-verifying with on-board TTE...).`,
        type: 'ticket',
      });

      // Auto-approve after 5 seconds
      setTimeout(() => {
        setActiveReallocations((prev) =>
          prev.map((r) =>
            r.id === newRecord.id
              ? {
                  ...r,
                  status: 'APPROVED' as const,
                  approvedBy: 'Chief On-Board Conductor (TTE #IR-77492)',
                }
              : r
          )
        );

        addNotification({
          title: '🎉 Vacant Berth Shift Approved by TTE!',
          body: `On-Board Conductor (TTE #IR-77492) has signed off on the manifest chart. Berth #${newRecord.toSeat} (${newRecord.toBerthType}) from ${newRecord.effectiveFromStation} is now officially APPROVED for passenger ${newRecord.passengerName} at ₹0 (NO Extra Cost).`,
          type: 'ticket',
        });
      }, 5000);

      return newRecord;
    },
    [addNotification]
  );

  const clearReallocations = useCallback(() => {
    setActiveReallocations([]);
    try {
      localStorage.removeItem('nirantar_active_reallocations');
    } catch {}
  }, []);

  const [pageHistory, setPageHistory] = useState<string[]>(['home']);

  const navigateTo = (page: string) => {
    let normalized = (page || 'home').toLowerCase().trim();
    if (normalized === 'myjourneys' || normalized === 'journeys') normalized = 'my-journeys';
    if (normalized === 'completion') normalized = 'ticket';
    if (normalized === 'booking') normalized = 'workspace';
    if (normalized === 'results') normalized = 'trains';

    const previousPage = activePage;
    if (previousPage !== normalized) {
      setPageHistory((prev) => [...prev, previousPage]);
    }
    setActivePage(normalized);
    // ─── CORE FEEDBACK LOOP: Frontend event → State update → Nira gets new state ───
    UiEventBus.emit('PAGE_CHANGED', normalized, { from: previousPage, to: normalized });
    // Auto-transition booking state machine based on page
    const mappedState = StateTransitionEngine.mapPageToBookingState(normalized, bookingState);
    if (mappedState !== bookingState) {
      const result = StateTransitionEngine.transition(bookingState, mappedState, `navigateTo(${normalized})`);
      if (result.success) {
        setBookingStateRaw(result.state);
      }
    }
  };

  const goBack = () => {
    if (activePage === 'payment') {
      navigateTo('workspace');
      return;
    }
    if (activePage === 'workspace' || activePage === 'booking' || activePage === 'review') {
      navigateTo('trains');
      return;
    }
    if (activePage === 'trains') {
      navigateTo('home');
      return;
    }
    if (pageHistory.length > 1) {
      const prev = pageHistory[pageHistory.length - 1];
      setPageHistory((p) => p.slice(0, -1));
      setActivePage(prev);
      UiEventBus.emit('PAGE_CHANGED', prev, { from: activePage, to: prev, reason: 'goBack' });
      return;
    }
    navigateTo('home');
  };

  const resetJourney = () => {
    setJourneyState(createInitialJourneyState());
    setSelectedTrain(null);
    setPaymentAttempt(null);
    setPaymentState('READY');
    setIssuedTicket(null);
    setBookingRecord(null);
    setBookingStateRaw('IDLE');
    setTaskStack([]);
    setActiveSortRaw('recommended');
    setActiveHighlightTarget(null);
    clearError();
    setActivePage('home');
    UiEventBus.emit('PAGE_CHANGED', 'home', { from: activePage, to: 'home', reason: 'resetJourney' });
  };

  return (
    <JourneyContext.Provider
      value={{
        activePage,
        setActivePage,
        navigateTo,
        goBack,
        searchParams,
        setSearchParams,
        availableTrains,
        selectedTrain,
        setSelectedTrain,
        selectedClassCode,
        setSelectedClassCode,
        passengers,
        setPassengers,
        savedPassengers,
        recentJourneys,
        journeyState,
        setJourneyState,
        executeSearch,
        selectTrain,
        savePassengerDetails,
        authState,
        setAuthState,
        performMockAuth,
        verifyMockOtp,
        paymentState,
        paymentAttempt,
        initiatePayment,
        verifyPaymentStatus,
        triggerMockPaymentResult,
        issuedTicket,
        setIssuedTicket,
        bookingRecord,
        error,
        setError,
        clearError,
        setNamedError,
        trackQuery,
        setTrackQuery,
        handleQuickTrack,
        walletBalance,
        setWalletBalance,
        addWalletBalance,
        payWithWallet,
        digitalBankAlert,
        dismissDigitalBankAlert,
        triggerDigitalBankAlert,
        paymentHistory,
        cancelTicket,
        showChatDrawer,
        setShowChatDrawer,
        guidanceActive,
        guidanceStep: currentGuidanceStep,
        guidanceStepIndex,
        totalGuidanceSteps: guidanceStepsList.length,
        startGuidanceTour,
        stopGuidanceTour,
        nextGuidanceStep,
        prevGuidanceStep,
        triggerAutoBookFlow,
        // ─── State Machine & Event Bus ───
        bookingState,
        setBookingState,
        emitUiEvent,
        // ─── Task Stack ───
        taskStack,
        pushTask,
        resumeTask,
        clearTaskStack,
        // ─── Dynamic Sort & Highlight ───
        activeSort,
        setActiveSort,
        activeHighlightTarget,
        setActiveHighlightTarget,
        // ─── Agentic 1Password Authentication & Waitlist Intelligence ───
        showAgenticAuth,
        setShowAgenticAuth,
        triggerAgenticAuth,
        getWaitlistProbability,
        // ─── Theme & Curated Colour Palettes ───
        theme,
        setTheme,
        cycleNextTheme,
        toggleTheme,
        // ─── Sanitized Context ───
        getSanitizedContext,
        resetJourney,
        // ─── Citizen Accessibility ───
        easyMode,
        setEasyMode,
        showImStuck,
        setShowImStuck,
        showVisualDiagram,
        setShowVisualDiagram,
        niraPendingQuery,
        setNiraPendingQuery,
        sendNiraQuery,
        citizenProfile,
        setCitizenProfile,
        securityPin,
        setSecurityPin,
        notifications,
        addNotification,
        dismissNotification,
        markNotificationsRead,
        // ─── Mid-Journey Berth Reallocations ───
        activeReallocations,
        requestMidJourneyReallocation,
        clearReallocations,
        // ─── Tracker Tab Preference ───
        preferredTrackerTab,
        setPreferredTrackerTab,
      }}
    >
      {children}
    </JourneyContext.Provider>
  );
};

export const useJourney = (): JourneyContextType => {
  const context = useContext(JourneyContext);
  if (!context) {
    throw new Error('useJourney must be used within a JourneyProvider');
  }
  return context;
};
