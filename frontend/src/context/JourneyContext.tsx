import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Station, POPULAR_STATIONS, findStation } from '../data/stationData';
import { TrainDetail, searchTrains as localSearchTrains } from '../data/mockTrains';
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

export type { PassengerProfile };
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
import { admitFairAccess } from '../services/niraApi';
import { setFairAccessTicket } from '../lib/fairAccessStore';
import { UiEventBus } from '../events/UiEventBus';
import { NirantarEventType, NirantarUiEvent } from '../events/eventTypes';
import { BookingState, StateTransitionEngine } from '../state/JourneyStateMachine';
import { TaskStackItem, TaskStackManager } from '../state/TaskStack';
import { NiraSanitizedContext } from '../ai/NiraPlanner';

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
  onAction?: () => void;
}

export interface JourneyContextType {
  // Navigation & Page State
  activePage: string;
  setActivePage: (page: string) => void;
  navigateTo: (page: string) => void;

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
  startGuidanceTour: (initialStep?: number) => void;
  stopGuidanceTour: () => void;
  nextGuidanceStep: () => void;

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

  // Virtual Citizen Wallet (₹10,000 New User Credit)
  walletBalance: number;
  setWalletBalance: React.Dispatch<React.SetStateAction<number>>;
  payWithWallet: (amount: number) => Promise<PaymentAttempt | null>;
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

  // Popup + bell notifications
  notifications: AppNotification[];
  addNotification: (n: Omit<AppNotification, 'id' | 'time' | 'read' | 'dismissed'>) => void;
  dismissNotification: (id: string) => void;
  markNotificationsRead: () => void;
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
  const [recentJourneys, setRecentJourneys] = useState<RecentJourney[]>(defaultRecentJourneys);
  const [trackQuery, setTrackQuery] = useState<string>('');
  const [walletBalance, setWalletBalance] = useState<number>(10000.00); // ₹10,000 New Citizen Travel Credit
  const [showChatDrawer, setShowChatDrawer] = useState<boolean>(false);

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

  useEffect(() => {
    try {
      localStorage.setItem('nirantar_auth_user', JSON.stringify(authState));
    } catch {}
  }, [authState]);

  // Payment & Ticket Records
  const [paymentAttempt, setPaymentAttempt] = useState<PaymentAttempt | null>(null);
  const [paymentState, setPaymentState] = useState<PaymentState>('READY');
  const [issuedTicket, setIssuedTicket] = useState<TicketRecord | null>(null);
  const [bookingRecord, setBookingRecord] = useState<BookingRecord | null>(null);

  const [bookingState, setBookingStateRaw] = useState<BookingState>('IDLE');
  const [taskStack, setTaskStack] = useState<TaskStackItem[]>([]);
  const [activeSort, setActiveSortRaw] = useState<'recommended' | 'fastest' | 'cheapest' | 'departure'>('recommended');
  const [activeHighlightTarget, setActiveHighlightTarget] = useState<string | null>(null);

  // ─── Citizen Accessibility & "I'm Stuck" ───
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

  const payWithWallet = async (amount: number): Promise<PaymentAttempt | null> => {
    if (walletBalance < amount) {
      setNamedError('PAYMENT_FAILED', 'Insufficient balance in Nirantar Citizen Wallet.');
      return null;
    }
    setWalletBalance((prev) => Math.max(0, prev - amount));
    const attempt = await initiatePayment('WALLET', amount);
    if (attempt) {
      const res = await triggerMockPaymentResult('SUCCESS');
      return res;
    }
    return null;
  };

  const cancelTicket = useCallback((pnr: string, refundAmount: number = 0) => {
    setIssuedTicket((prev) => (prev && prev.pnrNumber === pnr ? { ...prev, status: 'CANCELLED' as any } : prev));
    if (refundAmount > 0) {
      setWalletBalance((prev) => prev + refundAmount);
    }
    addNotification({
      type: 'ticket',
      title: `Ticket #${pnr} Cancelled & Refunded`,
      body: `Statutory refund of ₹${refundAmount.toLocaleString('en-IN')} has been instantly credited back to your Citizen Travel Wallet.`,
    });
  }, [addNotification]);

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
    const params = { ...searchParams, ...paramsOverride };

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
      setNamedError('INVALID_JOURNEY', 'Please select a valid travel date.');
      return { success: false, error: 'Please select a valid travel date.' };
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
        userId: 'usr-ananya-84920',
        displayName: 'Ananya Sharma',
        isAuthenticated: true,
        failureReason: null,
      };
      setAuthState(fallbackAuth);
      return true;
    }
  };

  const verifyMockOtp = async (otp: string): Promise<boolean> => {
    try {
      const res = await apiMockVerify(authState.userId || 'usr-ananya-84920', otp);
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
        const ticket = await apiGetTicket(res.journeyId).catch(() => null);
        if (ticket) setIssuedTicket(ticket);
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
        const ticket = await apiGetTicket(res.journeyId).catch(() => null);
        if (ticket) setIssuedTicket(ticket);
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

  const nextGuidanceStep = useCallback(() => {
    setGuidanceStepIndex((prev) => {
      if (prev >= 4) {
        setGuidanceActive(false);
        return 0;
      }
      return prev + 1;
    });
  }, []);

  const guidanceStepsList: GuidanceStep[] = [
    {
      id: 'step-train-select',
      stepNumber: 1,
      title: 'Find & Compare Trains',
      speech: 'I have found the top direct trains for your route! This train is the fastest with confirmed seat availability.',
      actionCue: 'Tap Book Now on the recommended train to continue.',
      actionButtonText: 'Select Fastest Train ➔',
      arrowPlacement: { top: '38%', left: '32%' },
      arrowLabel: '⚡ Fastest Train with Confirmed Seats',
      onAction: () => {
        const topTrain = availableTrains[0] || localSearchTrains(searchParams.fromStation.code, searchParams.toStation.code)[0];
        if (topTrain) {
          selectTrain(topTrain, selectedClassCode || '3A');
          setGuidanceStepIndex(1);
        } else {
          setActivePage('trains');
          setGuidanceStepIndex(1);
        }
      },
    },
    {
      id: 'step-passenger-autofill',
      stepNumber: 2,
      title: 'Safe Autofill & Verification',
      speech: "I've prepared the passenger details I can safely autofill. Please review everything before we proceed.",
      actionCue: 'Review passenger names & berth preferences, then tap Continue.',
      actionButtonText: 'Review & Continue to Payment ➔',
      arrowPlacement: { bottom: '28%', right: '22%' },
      arrowLabel: 'SafeAssist Zero-PII Protected',
      onAction: () => {
        setActivePage('payment');
        setGuidanceStepIndex(2);
      },
    },
    {
      id: 'step-payment-auth',
      stepNumber: 3,
      title: 'Payment & 3D-Secure Verification',
      speech: 'Your banking credentials are protected. Please enter your UPI PIN or OTP to authorize payment safely.',
      actionCue: 'Enter UPI PIN/OTP interactively to complete payment.',
      actionButtonText: 'Proceed to Payment Authorization ➔',
      arrowPlacement: { top: '45%', left: '26%' },
      arrowLabel: 'NPCI & Bank 256-Bit Encrypted',
      onAction: async () => {
        setGuidanceStepIndex(3);
      },
    },
    {
      id: 'step-station-seat-forecast',
      stepNumber: 4,
      title: 'Find Vacant Seats at Upcoming Stations',
      speech: 'Worried about a waitlist? Open the Live Train Radar to see each station’s passenger boarding and exit projection, plus seats expected to be vacant after departure.',
      actionCue: 'Check the station timeline for board, leave, and vacant-seat estimates.',
      actionButtonText: 'Open Station Seat Forecast ➔',
      arrowPlacement: { top: '32%', right: '18%' },
      arrowLabel: 'Station-wise vacant seats',
      onAction: () => {
        setActivePage('track');
        setGuidanceStepIndex(4);
      },
    },
    {
      id: 'step-ticket-companion',
      stepNumber: 5,
      title: 'Journey Companion & Live Radar',
      speech: 'Booking confirmed! Here is your confirmed digital ticket with live coach, platform, and GPS tracking.',
      actionCue: 'View your digital ticket and track your train in real-time.',
      actionButtonText: 'Open Live Train Radar ➔',
      arrowPlacement: { top: '30%', right: '20%' },
      arrowLabel: 'DigiLocker Verified e-Ticket',
      onAction: () => {
        setGuidanceActive(false);
        setActivePage('ticket');
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
    if (params.passengerName && params.passengerName !== 'Ananya Sharma') {
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

  const handleQuickTrack = (query: string) => {
    if (!query || query.trim() === '') return;
    setTrackQuery(query.trim());
    navigateTo('track');
  };

  const navigateTo = (page: string) => {
    const previousPage = activePage;
    setActivePage(page);
    // ─── CORE FEEDBACK LOOP: Frontend event → State update → Nira gets new state ───
    UiEventBus.emit('PAGE_CHANGED', page, { from: previousPage, to: page });
    // Auto-transition booking state machine based on page
    const mappedState = StateTransitionEngine.mapPageToBookingState(page, bookingState);
    if (mappedState !== bookingState) {
      const result = StateTransitionEngine.transition(bookingState, mappedState, `navigateTo(${page})`);
      if (result.success) {
        setBookingStateRaw(result.state);
      }
    }
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
        payWithWallet,
        cancelTicket,
        showChatDrawer,
        setShowChatDrawer,
        guidanceActive,
        guidanceStep: currentGuidanceStep,
        guidanceStepIndex,
        startGuidanceTour,
        stopGuidanceTour,
        nextGuidanceStep,
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
        notifications,
        addNotification,
        dismissNotification,
        markNotificationsRead,
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
