import React, { useState } from 'react';
import { Sidebar, NavPageId } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileNav } from './MobileNav';
import { useJourney } from '../../context/JourneyContext';
import { HomePage } from '../../pages/HomePage';
import { DiscoverPage } from '../../pages/DiscoverPage';
import { CitizenCharacter } from '../characters/CitizenCharacter';
import { NiraRobot } from '../characters/NiraRobot';
import { Card } from '../../design-system/components/Card';
import { Button } from '../../design-system/components/Button';
import { TrainsPage } from '../../pages/TrainsPage';
import { BookingPage } from '../../pages/BookingPage';
import { PaymentBridgePage } from '../../pages/PaymentBridgePage';
import { CompletionResultPage } from '../../pages/CompletionResultPage';
import { MyJourneysPage } from '../../pages/MyJourneysPage';
import { PaymentsPage } from '../../pages/PaymentsPage';
import { JourneyTrackerPage } from '../../pages/JourneyTrackerPage';
import { ProfilePage } from '../../pages/ProfilePage';
import { HelpCenterPage } from '../../pages/HelpCenterPage';
import { SettingsPage } from '../../pages/SettingsPage';
import { NiraChatDrawer } from '../NiraChatDrawer';
import { FairAccessBanner } from '../journey/FairAccessBanner';
import { SpotlightGuidance } from '../journey/SpotlightGuidance';
import { ImStuckModal } from '../ImStuckModal';
import { VisualDiagramModal } from '../VisualDiagramModal';
import { NewUserWelcomeModal } from '../NewUserWelcomeModal';
import { NotificationToasts } from '../NotificationToasts';
import { AgenticAuthModal } from '../auth/AgenticAuthModal';
import { DigitalBankNotificationOverlay } from '../DigitalBankNotificationOverlay';

export const AppShell: React.FC = () => {
  const {
    activePage,
    setActivePage,
    searchParams,
    showChatDrawer,
    setShowChatDrawer,
    easyMode,
    showImStuck,
    setShowImStuck,
    showVisualDiagram,
    setShowVisualDiagram,
    showAgenticAuth,
    setShowAgenticAuth,
    selectedTrain,
    passengers,
    navigateTo,
  } = useJourney();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Page title mapping
  const pageMeta: Record<string, { title: string; subtitle: string }> = {
    home: { title: 'Home', subtitle: 'Where are you going? Find and book your journey.' },
    discover: {
      title: 'Discover',
      subtitle: 'Find trains, explore routes and plan better',
    },
    trains: {
      title: `${searchParams.fromStation.city} (${searchParams.fromStation.code}) → ${searchParams.toStation.city} (${searchParams.toStation.code})`,
      subtitle: `${searchParams.travelDate} • ${searchParams.passengersCount || 1} Adult • ${searchParams.classType || 'AC Classes'}`,
    },
    booking: {
      title: 'Passenger & Booking Workspace',
      subtitle: 'Safe autofill passenger details & IRCTC verification',
    },
    workspace: {
      title: 'Passenger & Booking Workspace',
      subtitle: 'Safe autofill passenger details & IRCTC verification',
    },
    payment: { title: 'Payment Bridge', subtitle: 'Double-verification resilient payment gateway' },
    'my-journeys': { title: 'My Journeys', subtitle: 'Manage active bookings and travel history' },
    track: { title: 'Live Train Tracker', subtitle: 'Real-time GPS running status & delay estimator' },
    payments: { title: 'Payments & Receipts', subtitle: 'Double-verification payment ledger & refund audit' },
    help: { title: 'Help Center', subtitle: 'Contextual AI assistance & railway guide' },
    settings: { title: 'Settings', subtitle: 'Citizen profile, accessibility preferences & language' },
    profile: { title: 'My Profile', subtitle: 'Verified citizen credentials & identity details' },
  };

  const currentMeta = pageMeta[activePage] || {
    title: 'Nirantar',
    subtitle: 'Your journey, simplified.',
  };

  const renderActivePage = () => {
    switch (activePage) {
      case 'home':
        return <HomePage />;
      case 'discover':
        return <DiscoverPage />;
      case 'trains':
      case 'results':
        return <TrainsPage />;
      case 'workspace':
      case 'booking':
        return <BookingPage />;
      case 'payment':
        return <PaymentBridgePage />;
      case 'completion':
      case 'ticket':
        return <CompletionResultPage />;
      case 'my-journeys':
      case 'journeys':
        return <MyJourneysPage />;
      case 'track':
        return <JourneyTrackerPage />;
      case 'payments':
        return <PaymentsPage />;
      case 'help':
        return <HelpCenterPage onOpenNiraChat={() => setShowChatDrawer(true)} />;
      case 'settings':
        return <SettingsPage />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8F6FC] font-sans antialiased text-slate-900 relative">
      {/* 1. DESKTOP: PERSISTENT REUSABLE SIDEBAR */}
      <Sidebar
        className="hidden md:flex"
        activePage={activePage as NavPageId}
        onNavigate={(page) => setActivePage(page)}
        onOpenNira={() => setShowChatDrawer(true)}
      />

      {/* 1B. MOBILE SLIDE-OUT DRAWER WITH BACKDROP */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm cursor-pointer"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu backdrop"
          />
          <div className="relative z-10 w-72 max-w-[85vw] h-full shadow-2xl animate-in slide-in-from-left duration-200">
            <Sidebar
              isMobileDrawer
              onCloseDrawer={() => setMobileMenuOpen(false)}
              activePage={activePage as NavPageId}
              onNavigate={(page) => {
                setActivePage(page);
                setMobileMenuOpen(false);
              }}
              onOpenNira={() => {
                setMobileMenuOpen(false);
                setShowChatDrawer(true);
              }}
            />
          </div>
        </div>
      )}

      {/* 2. RIGHT CONTAINER: TOPBAR + SCROLLABLE MAIN CONTENT CANVAS */}
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
        {/* GLOBAL REUSABLE TOP NAVIGATION */}
        <TopBar
          pageTitle={currentMeta.title}
          pageSubtitle={currentMeta.subtitle}
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
          onOpenHelp={() => setShowChatDrawer(true)}
          onOpenNotifications={() =>
            console.log('Notifications: 1. Train 12302 arrives on platform 8. 2. PNR 8429104821 is Confirmed.')
          }
          onOpenProfile={() => setActivePage('profile')}
        />

        <FairAccessBanner />

        {/* 3. CENTER: MAIN APPLICATION CONTENT */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-6 lg:px-8 py-2 pb-24 md:pb-6">
          {renderActivePage()}
        </main>
      </div>

      {/* 4. MOBILE BOTTOM NAVIGATION BAR */}
      <MobileNav
        activePage={activePage}
        onNavigate={(page) => setActivePage(page)}
        onOpenNira={() => setShowChatDrawer(true)}
        onOpenMenu={() => setMobileMenuOpen(true)}
      />

      {/* 5. CHAT SIDE BAR SMALL WINDOW (MATCHING REFERENCE IMAGE 3) */}
      <NiraChatDrawer
        isOpen={showChatDrawer}
        onClose={() => setShowChatDrawer(false)}
      />

      {/* 6. SMART SPOTLIGHT & GREEN ARROW GUIDANCE OVERLAY */}
      <SpotlightGuidance />

      {/* 7. CITIZEN "I'M STUCK" ASSISTANCE MODAL */}
      <ImStuckModal
        isOpen={showImStuck}
        onClose={() => setShowImStuck(false)}
      />

      {/* 8. INTERACTIVE VISUAL PAGE GUIDE / ARCHITECTURE DIAGRAM */}
      <VisualDiagramModal
        isOpen={showVisualDiagram}
        onClose={() => setShowVisualDiagram(false)}
      />

      {/* 9. NEW CITIZEN WELCOME ROADMAP MODAL */}
      <NewUserWelcomeModal />

      {/* 10. 1PASSWORD AGENTIC CREDENTIAL ISOLATION AUTH MODAL */}
      <AgenticAuthModal
        isOpen={showAgenticAuth}
        onClose={() => setShowAgenticAuth(false)}
        onSuccess={() => {
          navigateTo('workspace');
        }}
        trainName={selectedTrain?.trainName}
        trainNumber={selectedTrain?.trainNumber}
        passengersCount={passengers.length}
      />

      <NotificationToasts />
      <DigitalBankNotificationOverlay />
    </div>
  );
};

export default AppShell;
