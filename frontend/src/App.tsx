import React from 'react';
import { JourneyProvider } from './context/JourneyContext';
import { AppShell } from './components/shell/AppShell';

const App: React.FC = () => {
  return (
    <JourneyProvider>
      <AppShell />
    </JourneyProvider>
  );
};

export default App;
