/**
 * NIRANTAR — Demo / Simulation Console
 * =====================================
 * Implements PRD Section 7 & 8:
 *  - Interactive test harness for judges & rehearsals
 *  - Buttons: [ TRAIN ] [ Normal ] [ +5 min ] [ +15 min ] [ Platform Change ] [ High Density ] [ Cancellation ] [ Reset Scenario ]
 *  - Labeled: "Demo / Simulation Console"
 */

import React, { useState } from 'react';
import {
  Sliders,
  Play,
  RotateCcw,
  AlertTriangle,
  Clock,
  Layers,
  Users,
  Ban,
  CheckCircle2,
  Sparkles,
  Zap,
} from 'lucide-react';
import { SimulationScenario } from '../../lib/railway/types';
import { railwayApiService } from '../../lib/railway/railwayApiService';

export interface SimulationControlPanelProps {
  currentTrainNumber: string;
  onTrainChange: (trainNumber: string) => void;
  onScenarioTriggered?: (scenario: SimulationScenario) => void;
}

const SUPPORTED_TRAINS = [
  { number: '12919', name: 'Malwa SF Express', from: 'BPL', to: 'SVDK' },
  { number: '12841', name: 'Coromandel Express', from: 'HWH', to: 'MAS' },
  { number: '12302', name: 'Howrah Rajdhani', from: 'NDLS', to: 'HWH' },
  { number: '12951', name: 'Mumbai Rajdhani', from: 'MMCT', to: 'NDLS' },
  { number: '22436', name: 'Vande Bharat Express', from: 'NDLS', to: 'BSB' },
];

export const SimulationControlPanel: React.FC<SimulationControlPanelProps> = ({
  currentTrainNumber,
  onTrainChange,
  onScenarioTriggered,
}) => {
  const [activeScenario, setActiveScenario] = useState<SimulationScenario>('NORMAL');
  const [lastActionToast, setLastActionToast] = useState<string | null>(null);

  const handleTrigger = (scenario: SimulationScenario, label: string) => {
    setActiveScenario(scenario);
    railwayApiService.triggerScenario(scenario);

    // Show temporary feedback toast
    setLastActionToast(`Simulated event triggered: ${label}`);
    setTimeout(() => setLastActionToast(null), 3000);

    if (onScenarioTriggered) {
      onScenarioTriggered(scenario);
    }
  };

  return (
    <div className="w-full bg-slate-900/95 border border-purple-500/30 rounded-2xl p-4 shadow-xl backdrop-blur-md">
      {/* 1. HEADER WITH BADGE */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-purple-300">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Demo / Simulation Console</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-700/50 uppercase tracking-wide">
                Operational Test Harness
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Trigger live operational perturbations to demonstrate system-wide reactive intelligence.
            </p>
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {lastActionToast && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs animate-in fade-in">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <span>{lastActionToast}</span>
          </div>
        )}
      </div>

      {/* 2. CONTROL BUTTONS ROW */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Train Selector Dropdown Button */}
        <div className="relative">
          <select
            value={currentTrainNumber}
            onChange={(e) => onTrainChange(e.target.value)}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs rounded-xl border border-slate-700 focus:outline-none focus:border-purple-500 transition-colors cursor-pointer"
          >
            {SUPPORTED_TRAINS.map((t) => (
              <option key={t.number} value={t.number}>
                🚆 TRAIN #{t.number} ({t.from} → {t.to})
              </option>
            ))}
          </select>
        </div>

        {/* Button: Normal */}
        <button
          type="button"
          onClick={() => handleTrigger('NORMAL', 'Reset to Scheduled On-Time')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeScenario === 'NORMAL'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Normal</span>
        </button>

        {/* Button: +5 min Delay */}
        <button
          type="button"
          onClick={() => handleTrigger('DELAY_5', '+5 min Delay Injected')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeScenario === 'DELAY_5'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>+5 min</span>
        </button>

        {/* Button: +15 min Delay */}
        <button
          type="button"
          onClick={() => handleTrigger('DELAY_15', '+15 min Delay (Cascading Congestion)')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeScenario === 'DELAY_15'
              ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>+15 min</span>
        </button>

        {/* Button: Platform Change */}
        <button
          type="button"
          onClick={() => handleTrigger('PLATFORM_CHANGE', 'Platform Changed to Platform 2')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeScenario === 'PLATFORM_CHANGE'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Platform Change</span>
        </button>

        {/* Button: High Density */}
        <button
          type="button"
          onClick={() => handleTrigger('HIGH_DENSITY', 'Platform Density Spiked to 88%')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeScenario === 'HIGH_DENSITY'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>High Density</span>
        </button>

        {/* Button: Cancellation */}
        <button
          type="button"
          onClick={() => handleTrigger('CANCELLATION', 'Train Service Marked Cancelled')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeScenario === 'CANCELLATION'
              ? 'bg-red-700 text-white shadow-lg shadow-red-700/30'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
        >
          <Ban className="w-3.5 h-3.5" />
          <span>Cancellation</span>
        </button>

        {/* Button: Reset Scenario */}
        <button
          type="button"
          onClick={() => handleTrigger('RESET', 'All Scenarios Reset')}
          className="ml-auto px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
          title="Reset to clean baseline schedule"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Scenario</span>
        </button>
      </div>
    </div>
  );
};
