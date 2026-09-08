import React from 'react';
import { JourneyProvider } from './context/JourneyContext';
import { AppShell } from './components/shell/AppShell';
import { GlossaryHoverHints } from './components/GlossaryHoverHints';
import { LanguageProvider } from './locales/i18n';
import { SectionExplainerProvider } from './components/SectionExplainer';

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <JourneyProvider>
        <SectionExplainerProvider>
          <AppShell />
          <GlossaryHoverHints />
        </SectionExplainerProvider>
      </JourneyProvider>
    </LanguageProvider>
  );
};

export default App;

