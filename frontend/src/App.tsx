import React, { useState, useEffect } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { CommandCenter } from '@modules/m07_command_center/ui/CommandCenter';
import { CitizenInterface } from '@modules/m01_citizen_ux/ui/CitizenInterface';
import { ModelBenchmarkTable } from '@modules/m03_portalpulse/ui/ModelBenchmarkTable';
import { fetchModelBenchmarks } from './services/api';
import { BenchmarkModel } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'command' | 'citizen' | 'benchmarks'>('citizen');
  const [benchmarks, setBenchmarks] = useState<BenchmarkModel[]>([]);

  useEffect(() => {
    fetchModelBenchmarks()
      .then((data) => setBenchmarks(data))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        <ErrorBoundary>
          {activeTab === 'command' && <CommandCenter />}
          {activeTab === 'citizen' && <CitizenInterface />}
          {activeTab === 'benchmarks' && <ModelBenchmarkTable benchmarks={benchmarks} />}
        </ErrorBoundary>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] bg-[#030712]/80 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <span>NIRANTAR — data is shown with its source and verification state.</span>
          <span className="font-mono text-[11px] text-slate-400">Live providers require configuration.</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
