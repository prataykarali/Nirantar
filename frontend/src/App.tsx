import React from 'react';
import { JourneyProvider } from './context/JourneyContext';
import { AppShell } from './components/shell/AppShell';
import { GlossaryHoverHints } from './components/GlossaryHoverHints';
import { LanguageProvider } from './locales/i18n';

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <JourneyProvider>
        <AppShell />
        <GlossaryHoverHints />
      </JourneyProvider>
    </LanguageProvider>
  );
};

export default App;
