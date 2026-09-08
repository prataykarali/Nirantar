import React, { useState, useRef, useEffect } from 'react';
import {
  Gift,
  Bell,
  ChevronDown,
  User,
  Users,
  Settings as SettingsIcon,
  Link,
  LogOut,
  CheckCircle2,
  Menu,
  Sun,
  Moon,
  Palette,
  Sparkles,
  ArrowLeft,
  Mic,
} from 'lucide-react';
import { useJourney, THEME_OPTIONS } from '../../context/JourneyContext';
import { OAuthLoginModal } from '../auth/OAuthLoginModal';
import { AskNirantarModal } from '../AskNirantarModal';
import { SectionExplainerButton } from '../SectionExplainer';

const PAGE_EXPLAINERS: Record<string, {
  title: string;
  subtitle: string;
  description: string;
  howItWorks: string[];
  userActions: string[];
  actionTip: string;
}> = {
  home: {
    title: 'Home & Intent Overview',
    subtitle: 'Where Are You Going? Find & Book',
    description: 'Nirantar AI analyzes natural language routes, calibrated waitlist odds, and provides verified direct booking.',
    howItWorks: [
      'NVIDIA Intent Parser: Extracts travel origin, destination, and dates in plain English.',
      'Calibrated Waitlist Radar: Projects Poisson cancellation odds and scattered seats.',
      'Zero-PII SafeAssist: Protects citizen identity while auto-filling IRCTC forms.'
    ],
    userActions: [
      'Type an intent query or train number into the search bar',
      'Select departure date and passenger count',
      'Click Find Trains to see real-time route inventory'
    ],
    actionTip: 'Type origin & destination or train number to search!'
  },
  discover: {
    title: 'Discover Railway Services',
    subtitle: 'Explore Routes, Platform Hubs & Railway Tools',
    description: 'Comprehensive directory of Indian Railways services, popular station hubs, and plain-English travel assistance.',
    howItWorks: [
      'Service Match Engine: Instant access to PNR status, live running status, and catering.',
      'Zone & Hub Directory: Platform counts and verified connectivity across all railway zones.',
      'Smart Suggestions: AI-curated travel ideas based on season and popularity.'
    ],
    userActions: [
      'Filter services by category (Tickets, Tracking, Station Amenities)',
      'Click popular station hubs to view platform directories',
      'Start a direct search for any train or route'
    ],
    actionTip: 'Select any service or route to begin discovery!'
  },
  trains: {
    title: 'Train Comparison & Seat Radar',
    subtitle: 'Calibrated Poisson Odds & Direct Routes',
    description: 'Compare available trains, travel durations, and historical confirmation probabilities for waitlisted quotas.',
    howItWorks: [
      'Calibrated Probability Engine: Evaluates dynamic Tatkal, HO quota releases, and RAC clearance.',
      'Scattered Seat Radar: Locates split-coach seats when full-journey contiguous berths are sold out.',
      'Punctuality & Rating Score: Historical on-time metrics streamed from NTES signaling blocks.'
    ],
    userActions: [
      'Filter trains by departure slot (Morning, Evening, Tatkal)',
      'Select preferred class (1A, 2A, 3A, SL, CC)',
      'Click Book Now to lock seats for 10 minutes'
    ],
    actionTip: 'Select your preferred train and class to lock seats!'
  },
  'waitlist-alert': {
    title: 'Waitlist Confirmation Radar',
    subtitle: 'Poisson Clearance & High-Demand Forecast',
    description: 'Advanced statistical modeling that estimates your probability of securing a confirmed berth before chart preparation.',
    howItWorks: [
      'Poisson Clearance Formula: Projects cancellation velocity against days-to-journey.',
      'Seat Lock Buffer: Prevents double-booking during Tatkal rush windows.',
      'Alternative Train Recommender: Instantly spots higher-odds alternatives.'
    ],
    userActions: [
      'Toggle Comfort Window (Safe >80%, Balanced >60%, Flexible)',
      'Test dynamic clearance scenarios with simulation controls',
      'Proceed to lock seats with Fair Access protection'
    ],
    actionTip: 'Review your confirmation odds and proceed to booking!'
  },
  booking: {
    title: 'Passenger & Booking Workspace',
    subtitle: '10-Minute Seat Lock & Zero-PII Autofill',
    description: 'Fill passenger credentials locally on your device with cryptographic zero-PII protection before IRCTC submission.',
    howItWorks: [
      'Local-First Vault: Passenger names and ID credentials are encrypted in local device storage.',
      '10-Minute IRCTC Lock: Guarantees your selected berths will not be taken while you complete payment.',
      'Instant Validation: Validates age concessions and berth preferences automatically.'
    ],
    userActions: [
      'Autofill from saved citizen profile with 1 tap',
      'Select berth preferences (Lower Berth for seniors, Side Lower)',
      'Proceed to the double-verification Payment Bridge'
    ],
    actionTip: 'Autofill passenger details and click Proceed to Pay!'
  },
  payment: {
    title: 'Payment Bridge & Double Verification',
    subtitle: 'Resilient Payment Gateway & Zero Ghost Charges',
    description: 'Fail-safe payment routing with instant double-verification to ensure your money and ticket are never left in limbo.',
    howItWorks: [
      'Dual Ledger Verification: Confirms debit with bank and reservation with IRCTC simultaneously.',
      'Instant Auto-Refund Daemon: If IRCTC fails after debit, refunds to Citizen Wallet in <3 seconds.',
      '3D-Secure UPI & Cards: Direct gateway integrations with zero ghost charges.'
    ],
    userActions: [
      'Choose payment method: UPI Apps, Cards, NetBanking, or Citizen Wallet',
      'Scan the dynamic UPI QR code or enter VPA',
      'Authorize transaction securely'
    ],
    actionTip: 'Choose your payment method and authorize securely!'
  },
  track: {
    title: 'Live Train Radar & GPS Telemetry',
    subtitle: 'Real-Time ISRO/CRIS Satellite Tracking & Delays',
    description: 'Direct locomotive GPS transponder streaming with synchronized speeds, platform alignments, and delay forecasts.',
    howItWorks: [
      'RTIS Satellite Stream: Locomotives transmit coordinates and speed every few seconds via NavIC/ISRO.',
      'Kinematic Speedometer: Real-time speed micro-fluctuations and halt countdown.',
      'Contextual AI Copilot: Tells you exactly what to do next based on train progress and platform assignments.'
    ],
    userActions: [
      'Select a train preset from the top radar switcher',
      'Switch map layers (Dark Canvas, OpenStreetMap, Vector)',
      'Set a station arrival wake-up alarm or play station audio announcements'
    ],
    actionTip: 'Click any train in the top switcher to track its live GPS stream!'
  },
  'my-journeys': {
    title: 'My Journeys & Booking Ledger',
    subtitle: 'DigiLocker Verified e-Tickets & Active Passes',
    description: 'Central citizen repository of all active reservations, downloadable PDF e-tickets, and travel history.',
    howItWorks: [
      'Cryptographic Ticket Vault: Stored locally with QR verification for TTE inspection.',
      'Live GPS Integration: Direct link from ticket to real-time train tracking.',
      'One-Tap Statutory Refunds: Claim statutory TDR refunds according to railway cancellation slabs.'
    ],
    userActions: [
      'Click View e-Ticket to inspect boarding pass and QR code',
      'Click Track Live to open satellite radar for your train',
      'Filter upcoming, completed, and cancelled journeys'
    ],
    actionTip: 'Click View e-Ticket to see your DigiLocker verified pass!'
  },
  payments: {
    title: 'Payments Ledger & Refund Audit',
    subtitle: 'Double-Verification Audit Trail & Citizen Wallet',
    description: 'Transparent cryptographic audit trail of all charges, UPI transactions, and instant wallet refunds.',
    howItWorks: [
      'Immutable Transaction Log: Every debit, credit, and TDR refund recorded with bank UTR.',
      'Instant Wallet Top-Up: Pre-fund your Citizen Wallet for zero-delay Tatkal booking.',
      'No Ghost Charge Guarantee: 100% statutory refund reconciliation.'
    ],
    userActions: [
      'Top-up Citizen Wallet balance with 1 tap',
      'Search transaction history by UTR or PNR',
      'Download GST-compliant travel tax receipts'
    ],
    actionTip: 'Top up your Citizen Wallet or audit recent transactions!'
  },
  help: {
    title: 'Nirantar Help & AI Companion',
    subtitle: 'Plain-English Railway Decoder & Helplines',
    description: 'Ask anything about Indian Railways, Tatkal rules, cancellation charges, or platform procedures in plain English.',
    howItWorks: [
      'Railway Knowledge Graph: Built on official Indian Railways passenger codes and refund rules.',
      'Jargon Decoder: Plain English explanations for GNWL, PQWL, RAC, TDR, and Tatkal.',
      'Emergency Helplines: Direct access to RailMadad, Security 139, and Medical support.'
    ],
    userActions: [
      'Search questions or browse popular topic categories',
      'Chat with Nira AI for personalized assistance',
      'Access emergency railway helpline numbers'
    ],
    actionTip: 'Type your railway question or browse the guide categories!'
  },
  profile: {
    title: 'Citizen Profile & DigiLocker',
    subtitle: 'Verified Identity & Zero-PII Passenger Vault',
    description: 'Manage your verified citizen credentials, Aadhaar/DigiLocker links, and saved family passengers.',
    howItWorks: [
      'DigiLocker Integration: Verifies age and identity for senior citizen & student concessions.',
      'Zero-PII Storage: Passenger data remains encrypted on your local device.',
      'Fair Access Pass: Citizen reputation score unlocking queue priority.'
    ],
    userActions: [
      'Add or edit family passenger profiles for 1-tap booking',
      'Link DigiLocker credentials for verified passenger status',
      'Customize your citizen avatar and travel preferences'
    ],
    actionTip: 'Save family passenger profiles for fast 1-tap checkout!'
  },
  settings: {
    title: 'Settings & Accessibility',
    subtitle: 'Language, Audio Chimes & High Contrast Preferences',
    description: 'Customize Nirantar to your comfort: high contrast modes, regional languages, station chimes, and privacy options.',
    howItWorks: [
      'Accessibility Engine: High-contrast themes, large typography, and audio announcements.',
      'Local-First Privacy: Toggle local data clearing and zero-cloud profile storage.',
      'Multi-Language Localization: Instant switching between English, Hindi, and regional languages.'
    ],
    userActions: [
      'Switch between Dark Canvas, Light, and High-Contrast modes',
      'Toggle station arrival chimes and voice notifications',
      'Manage local privacy and data retention settings'
    ],
    actionTip: 'Configure your accessibility and audio preferences!'
  },
};


export interface TopBarProps {
  pageTitle?: string;
  pageSubtitle?: string;
  onOpenHelp?: () => void;
  onOpenNotifications?: () => void;
  onOpenProfile?: () => void;
  onToggleMobileMenu?: () => void;
  notificationCount?: number;
  className?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  pageTitle = 'Home',
  pageSubtitle = 'Plan, discover & book your journey',
  notificationCount = 0,
  onToggleMobileMenu,
  className = '',
}) => {
  const {
    activePage,
    navigateTo,
    goBack,
    issuedTicket,
    authState,
    setShowImStuck,
    setShowVisualDiagram,
    notifications,
    markNotificationsRead,
    theme,
    setTheme,
    toggleTheme,
  } = useJourney();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRewards, setShowRewards] = useState(false);
  const [showThemePalette, setShowThemePalette] = useState(false);
  const [showOAuthModal, setShowOAuthModal] = useState(false);
  const [showAskModal, setShowAskModal] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const rewardRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setShowDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setShowNotifications(false);
      }
      if (rewardRef.current && !rewardRef.current.contains(target)) {
        setShowRewards(false);
      }
      if (themeRef.current && !themeRef.current.contains(target)) {
        setShowThemePalette(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuClick = (action: string) => {
    setShowDropdown(false);
    if (action === 'profile') {
      navigateTo('profile');
    } else if (action === 'settings') {
      navigateTo('settings');
    } else if (action === 'passengers') {
      navigateTo('profile');
    } else if (action === 'accounts') {
      navigateTo('profile');
    } else if (action === 'logout') {
      navigateTo('home');
    }
  };

  const unreadFromFeed = notifications.filter((n) => !n.read).length;
  const dynamicNotifCount = notificationCount + unreadFromFeed + (issuedTicket && unreadFromFeed === 0 ? 1 : 0);

  return (
    <header
      className={`h-16 px-3 sm:px-6 lg:px-8 bg-transparent flex items-center justify-between sticky top-0 z-30 select-none ${className}`}
    >
      {/* LEFT: BACK BUTTON, MOBILE MENU TRIGGER & PAGE TITLE */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Back Button (Shown on any non-home screen) */}
        {activePage !== 'home' && (
          <button
            type="button"
            onClick={goBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 dark:bg-slate-850 shadow-xs border border-purple-200 dark:border-slate-700 text-xs font-black text-purple-950 dark:text-purple-200 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
            title="Go back to previous screen"
            aria-label="Go back to previous page"
          >
            <ArrowLeft className="w-4 h-4 text-purple-700 dark:text-purple-300" />
            <span className="font-bold">Back</span>
          </button>
        )}

        {/* Mobile Hamburger Menu Toggle */}
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="md:hidden w-9 h-9 rounded-full bg-white/90 shadow-sm flex items-center justify-center text-purple-900 border border-purple-100 hover:bg-purple-50 transition-all cursor-pointer shrink-0"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile Brand Logo & Name (visible when on mobile) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigateTo('home')}
          className="flex items-center gap-1.5 md:hidden cursor-pointer"
        >
          <img
            src="/assets/images/brand/nirantar_logo_icon.png"
            alt="Nirantar"
            className="w-7 h-7 object-contain drop-shadow-xs"
          />
          <span className="font-display font-black text-base text-slate-900 tracking-tight">
            Nirantar
          </span>
        </div>

        {/* Desktop Page Title (Shown only on relevant sub-pages) */}
        {activePage !== 'home' &&
        activePage !== 'trains' &&
        activePage !== 'results' &&
        activePage !== 'booking' &&
        activePage !== 'workspace' &&
        activePage !== 'payment' &&
        activePage !== 'completion' &&
        activePage !== 'ticket' &&
        activePage !== 'waitlist-alert' &&
        activePage !== 'oh-no-waitlist' ? (
          <div className="hidden md:block">
            <h2 className="font-display font-black text-2xl text-purple-950 tracking-tight leading-tight">
              {pageTitle}
            </h2>
            {pageSubtitle && (
              <p className="text-xs font-semibold text-slate-500 hidden sm:block">
                {pageSubtitle}
              </p>
            )}
          </div>
        ) : (
          <div className="hidden md:block" />
        )}
      </div>

      {/* RIGHT: TOP ACTION BUTTONS */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 relative">

        {/* 🤖 GLOBAL PAGE EXPLAINER (NIRA ROBOT) */}
        <SectionExplainerButton
          sectionId={`topbar-guide-${activePage}`}
          title={PAGE_EXPLAINERS[activePage]?.title || 'Page Feature Guide'}
          badge="Nira AI Guide"
          subtitle={PAGE_EXPLAINERS[activePage]?.subtitle || 'Guided Overview'}
          description={PAGE_EXPLAINERS[activePage]?.description || 'Interactive AI assistance for this page.'}
          howItWorks={PAGE_EXPLAINERS[activePage]?.howItWorks}
          userActions={PAGE_EXPLAINERS[activePage]?.userActions}
          actionTip={PAGE_EXPLAINERS[activePage]?.actionTip || 'Click any feature to explore or ask Nira for help!'}
        />

        {/* 🧭 VISUAL PAGE GUIDE / ARCHITECTURE DIAGRAM */}
        <button
          type="button"
          onClick={() => setShowVisualDiagram(true)}
          className="px-2.5 sm:px-3 py-1.5 rounded-full bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-900 dark:text-purple-200 border border-purple-200 dark:border-purple-800 text-xs font-bold flex items-center gap-1 sm:gap-1.5 shadow-2xs transition-all hover:scale-105 cursor-pointer shrink-0"
          title="Open interactive visual diagram of this specific screen"
        >
          <span className="text-sm">🧭</span>
          <span className="hidden md:inline">Page Guide</span>
        </button>

        {/* ⚡ GENOVATE 2.0 LIVE INTELLIGENCE DEMO */}
        <button
          type="button"
          onClick={() => navigateTo('track')}
          className="px-2.5 sm:px-3.5 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition-all hover:scale-105 cursor-pointer shrink-0"
          title="GENOVATE 2.0 — Live Railway Intelligence & Operations Center"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>⚡ Live Intel Map</span>
        </button>




        {/* 1. GIFT ICON BUTTON & REWARDS POPOVER */}
        <div className="relative" ref={rewardRef}>
          <button
            type="button"
            onClick={() => {
              setShowRewards(!showRewards);
              setShowNotifications(false);
              setShowDropdown(false);
            }}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white shadow-sm flex items-center justify-center text-purple-800 hover:text-purple-950 transition-all hover:scale-105 cursor-pointer"
            aria-label="Rewards"
          >
            <Gift className="w-4 h-4" />
          </button>

          {showRewards && (
            <div className="fixed left-3 right-3 sm:left-auto sm:right-0 sm:absolute top-16 sm:top-12 sm:w-72 max-w-sm bg-white rounded-3xl shadow-[0_12px_40px_rgba(88,28,135,0.14)] border border-purple-100 p-4 space-y-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-purple-50 pb-2">
                <span className="font-bold text-xs text-purple-950 flex items-center gap-1.5">
                  <Gift className="w-3.5 h-3.5 text-purple-700" />
                  <span>Citizen Rewards</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Active
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-1">
                <span className="text-xs font-bold text-slate-900 block">Fair Access Pass #IN-84920</span>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  5% instant discount and zero queue penalty applied to all verified citizen bookings.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowRewards(false);
                  navigateTo('discover');
                }}
                className="w-full py-2 px-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Explore Destinations →
              </button>
            </div>
          )}
        </div>

        {/* 2. NOTIFICATIONS BELL & NOTIFICATIONS POPOVER */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowRewards(false);
              setShowDropdown(false);
              if (!showNotifications) markNotificationsRead();
            }}
            className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white shadow-sm flex items-center justify-center text-purple-800 hover:text-purple-950 transition-all hover:scale-105 cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {dynamicNotifCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF5C5C] text-white text-[10px] font-extrabold flex items-center justify-center border border-white shadow-sm">
                {dynamicNotifCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="fixed left-3 right-3 sm:left-auto sm:right-0 sm:absolute top-16 sm:top-12 sm:w-80 max-w-sm bg-white rounded-3xl shadow-[0_12px_40px_rgba(88,28,135,0.14)] border border-purple-100 p-4 space-y-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-purple-50 pb-2">
                <span className="font-bold text-xs text-purple-950 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-purple-700" />
                  <span>Notifications</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-400">
                  {dynamicNotifCount === 0 ? 'No unread' : `${dynamicNotifCount} new`}
                </span>
              </div>

              {notifications.length > 0 ? (
                <div className="max-h-72 overflow-y-auto space-y-2 pr-0.5">
                  {notifications.slice(0, 8).map((n) => {
                    const isDelay = n.type === 'delay' || n.type === 'warning';
                    const isCancel = n.type === 'cancel';
                    const isTicket = n.type === 'ticket';

                    return (
                      <div
                        key={n.id}
                        className={`p-3 rounded-2xl border space-y-1 transition-all ${
                          isDelay
                            ? 'bg-amber-50/80 border-amber-200/90 text-amber-950'
                            : isCancel
                            ? 'bg-rose-50/80 border-rose-200/90 text-rose-950'
                            : isTicket
                            ? 'bg-emerald-50/80 border-emerald-200/90 text-emerald-950'
                            : 'bg-purple-50/60 border-purple-100 text-purple-950'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-black">
                          <span className="flex items-center gap-1.5 truncate">
                            {isDelay && <span className="text-amber-600 font-bold">⚠️</span>}
                            {isCancel && <span className="text-rose-600 font-bold">❌</span>}
                            {isTicket && <span className="text-emerald-600 font-bold">🎫</span>}
                            {!isDelay && !isCancel && !isTicket && <span className="text-purple-600 font-bold">🚆</span>}
                            <span className="truncate">{n.title}</span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold shrink-0 ml-1.5">{n.time}</span>
                        </div>
                        <p className={`text-[11px] leading-relaxed ${isDelay ? 'text-amber-900' : isCancel ? 'text-rose-900' : isTicket ? 'text-emerald-900' : 'text-slate-600'}`}>
                          {n.body}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : issuedTicket ? (
                <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-purple-950">
                    <span>Ticket Confirmed 🎉</span>
                    <span className="text-[10px] text-emerald-600">Just now</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    PNR <strong className="font-mono">{issuedTicket.pnrNumber}</strong> for {issuedTicket.train?.trainName || 'Rajdhani Express'} is active.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNotifications(false);
                      navigateTo('my-journeys');
                    }}
                    className="text-[11px] font-bold text-purple-700 hover:underline pt-1 block cursor-pointer"
                  >
                    View Ticket Details →
                  </button>
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-slate-400 font-medium">
                  No new notifications right now. Platform alerts and ticket updates will appear here.
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. USER PROFILE AVATAR WITH DROPDOWN TRIGGER */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => {
              setShowDropdown(!showDropdown);
              setShowNotifications(false);
              setShowRewards(false);
            }}
            className="flex items-center gap-1.5 p-0.5 rounded-full bg-white/90 hover:bg-white shadow-sm transition-all hover:scale-105 group cursor-pointer"
            aria-expanded={showDropdown}
          >
            <div className="w-9 h-9 rounded-full overflow-hidden border border-purple-200 shrink-0 bg-purple-50">
              <img
                src={authState.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=pratay'}
                alt={authState.displayName || 'Citizen'}
                className="w-full h-full object-cover"
              />
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-500 group-hover:text-purple-900 transition-transform mr-1 ${
                showDropdown ? 'rotate-180 text-purple-900' : ''
              }`}
            />
          </button>

        {/* ═══════════════════════════════════════════════════════════════════
            4. DROPDOWN MENU (MATCHING REFERENCE IMAGE 1)
            ═══════════════════════════════════════════════════════════════════ */}
        {showDropdown && (
          <div className="fixed left-3 right-3 sm:left-auto sm:right-0 sm:absolute top-16 sm:top-12 sm:w-64 max-w-sm bg-white rounded-3xl shadow-[0_12px_40px_rgba(88,28,135,0.14)] border border-purple-100 p-3 space-y-2 z-50 animate-in fade-in zoom-in-95 duration-150">
            {/* Header User Card */}
            <div className="p-2.5 rounded-2xl bg-purple-50/50 border border-purple-50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-purple-200 shrink-0 bg-purple-100">
                <img
                  src={authState.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=pratay'}
                  alt={authState.displayName || 'Citizen'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-0.5 min-w-0">
                <h4 className="text-xs font-black text-slate-900 truncate">{authState.displayName || 'Citizen User'}</h4>
                <p className="text-[10px] text-slate-500 truncate">{authState.email || 'pratay.karali2005@gmail.com'}</p>
                <span className="inline-flex items-center gap-1 bg-[#7C3AED] text-white text-[9px] font-black px-2 py-0.2 rounded-full">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  <span>DigiLocker Verified</span>
                </span>
              </div>
            </div>

            {/* Menu Items */}
            <div className="space-y-0.5 text-xs font-bold text-slate-700">
              <button
                type="button"
                onClick={() => handleMenuClick('profile')}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-purple-50 hover:text-purple-900 transition-colors text-left cursor-pointer"
              >
                <User className="w-4 h-4 text-purple-700" />
                <span>My Profile</span>
              </button>

              <button
                type="button"
                onClick={() => handleMenuClick('passengers')}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-purple-50 hover:text-purple-900 transition-colors text-left cursor-pointer"
              >
                <Users className="w-4 h-4 text-purple-700" />
                <span>Saved Passengers</span>
              </button>

              <button
                type="button"
                onClick={() => handleMenuClick('settings')}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-purple-50 hover:text-purple-900 transition-colors text-left cursor-pointer"
              >
                <SettingsIcon className="w-4 h-4 text-purple-700" />
                <span>My Preferences</span>
              </button>

              <button
                type="button"
                onClick={() => handleMenuClick('accounts')}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-purple-50 hover:text-purple-900 transition-colors text-left cursor-pointer"
              >
                <Link className="w-4 h-4 text-purple-700" />
                <span>Linked Accounts</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowDropdown(false);
                  setShowOAuthModal(true);
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-950 font-black transition-colors text-left cursor-pointer border border-purple-200 shadow-2xs"
              >
                <span className="text-sm">🔑</span>
                <span>Login with Google / OAuth</span>
              </button>

              <hr className="border-purple-50 my-1" />

              <button
                type="button"
                onClick={() => handleMenuClick('logout')}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* OAuth Login Modal */}
      <OAuthLoginModal
        isOpen={showOAuthModal}
        onClose={() => setShowOAuthModal(false)}
      />

      {/* 🎙️ Ask Nirantar Multimodal Copilot */}
      <AskNirantarModal
        isOpen={showAskModal}
        onClose={() => setShowAskModal(false)}
        onNavigate={navigateTo}
      />
    </header>
  );
};

export default TopBar;
