import React, { useState, useEffect } from 'react';
import { LanguageProvider } from './locales/i18n';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { GlobalJourneyBar, JourneyStepId } from './components/GlobalJourneyBar';
import { SideChatbot } from './components/SideChatbot';

// Pages
import { HomePage } from './pages/HomePage';
import { DiscoverPage } from './pages/DiscoverPage';
import { ServiceGuidePage } from './pages/ServiceGuidePage';
import { ApplicationWorkspacePage } from './pages/ApplicationWorkspacePage';
import { PaymentBridgePage } from './pages/PaymentBridgePage';
import { JourneyTrackerPage } from './pages/JourneyTrackerPage';
import { CompletionResultPage } from './pages/CompletionResultPage';

// Modules
import { CommandCenter } from '@modules/m07_command_center/ui/CommandCenter';
import { ModelBenchmarkTable } from '@modules/m03_portalpulse/ui/ModelBenchmarkTable';
import { fetchModelBenchmarks } from './services/api';
import { BenchmarkModel } from './types';

export const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [benchmarks, setBenchmarks] = useState<BenchmarkModel[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Side Chatbot Nira State
  const [isNiraOpen, setIsNiraOpen] = useState<boolean>(false);
  const [niraInitialQuery, setNiraInitialQuery] = useState<string>('');

  useEffect(() => {
    fetchModelBenchmarks()
      .then((data) => setBenchmarks(data))
      .catch(() => {});
  }, []);

  const handleNavigate = (route: string, query?: string) => {
    if (query) setSearchQuery(query);
    setActiveTab(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenNira = (query?: string) => {
    setNiraInitialQuery(query || '');
    setIsNiraOpen(true);
  };

  // Map route to journey step for GlobalJourneyBar
  const routeToJourneyStep: Record<string, JourneyStepId> = {
    discover: 'discover',
    guide: 'prepare',
    workspace: 'apply',
    payment: 'pay',
    tracking: 'track',
    result: 'complete',
  };

  const currentJourneyStep = routeToJourneyStep[activeTab];
  const showJourneyBar = Boolean(currentJourneyStep);

  return (
    <div className="min-h-screen bg-[#060a19] text-slate-100 font-sans selection:bg-purple-500 selection:text-white overflow-x-hidden">
      {/* NAVBAR WITH DYNAMIC MULTI-LINGUAL SUPPORT */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} onOpenNira={() => handleOpenNira()} />

      {/* GLOBAL NIRANTAR JOURNEY BAR (PAGES 2 to 7) */}
      {showJourneyBar && (
        <GlobalJourneyBar
          currentStep={currentJourneyStep}
          onNavigateStep={(route) => handleNavigate(route)}
        />
      )}

      {/* MAIN PAGE CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <ErrorBoundary>
          {activeTab === 'home' && (
            <HomePage onNavigate={handleNavigate} onOpenNira={handleOpenNira} />
          )}

          {activeTab === 'discover' && (
            <DiscoverPage onNavigate={handleNavigate} initialQuery={searchQuery} />
          )}

          {activeTab === 'guide' && <ServiceGuidePage onNavigate={handleNavigate} />}

          {activeTab === 'workspace' && (
            <ApplicationWorkspacePage onNavigate={handleNavigate} onOpenNira={handleOpenNira} />
          )}

          {activeTab === 'payment' && <PaymentBridgePage onNavigate={handleNavigate} />}

          {activeTab === 'tracking' && <JourneyTrackerPage onNavigate={handleNavigate} />}

          {activeTab === 'result' && <CompletionResultPage onNavigate={handleNavigate} />}

          {activeTab === 'command' && <CommandCenter />}

          {activeTab === 'benchmarks' && <ModelBenchmarkTable benchmarks={benchmarks} />}
        </ErrorBoundary>
      </main>

      {/* GLOBAL FLOATING SIDE WINDOW CHATBOT (NIRA) */}
      <SideChatbot
        isOpen={isNiraOpen}
        onClose={() => setIsNiraOpen(false)}
        onToggle={() => setIsNiraOpen(!isNiraOpen)}
        initialQuery={niraInitialQuery}
        onNavigate={handleNavigate}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};

export default App;
