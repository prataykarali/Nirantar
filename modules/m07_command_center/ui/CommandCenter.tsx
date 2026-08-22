import React, { useEffect, useState } from 'react';
import { fetchCommandSnapshot, runCommandScenario } from '@app/services/api';
import { CommandCenterSnapshot } from '@app/types';
import { LiveStateStrip } from './command/LiveStateStrip';
import { ForecastPanel } from './command/ForecastPanel';
import { SecurityPanel } from './command/SecurityPanel';
import { ControlLoopGraph } from './command/ControlLoopGraph';
import { RecommendedActions } from './command/RecommendedActions';
import { InterventionTimeline } from './command/InterventionTimeline';

const EMPTY: CommandCenterSnapshot = {
  live: { concurrent_users: 0, requests_per_sec: 0, cpu_percent: 0, latency_ms: 0, error_rate_pct: 0 },
  forecast: {
    current_users: 0,
    plus_5_min_users: 0,
    plus_10_min_users: 0,
    safe_capacity_users: 0,
    overload_predicted: false,
    overload_in_seconds: null,
  },
  security: { legitimate: 0, suspicious: 0, blocked: 0, throttled: 0 },
  nodes: [],
  bottleneck: '',
  bottleneck_detail: '',
  actions: [],
  timeline: [],
  dhara_state: 'NORMAL',
  scenario: 'NORMAL',
  prayog_users: 0,
};

const SCENARIOS = [
  { id: 'A', kind: 'NORMAL', label: 'A · Normal' },
  { id: 'B', kind: 'PEAK', label: 'B · Peak' },
  { id: 'C', kind: 'EXTREME', label: 'C · Extreme' },
  { id: 'D', kind: 'SUDDEN_SPIKE', label: 'D · Spike' },
  { id: 'E', kind: 'BOT_SURGE', label: 'E · Bot surge' },
  { id: 'F', kind: 'INFRA_DEGRADATION', label: 'F · Infra' },
];

export const CommandCenter: React.FC = () => {
  const [snap, setSnap] = useState<CommandCenterSnapshot>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const pull = async () => {
      try {
        const next = await fetchCommandSnapshot();
        if (!cancelled) {
          setSnap(next);
          setReady(true);
        }
      } catch {
        /* keep last good snapshot */
      }
    };
    pull();
    const id = setInterval(pull, 3000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const run = async (id: string) => {
    setBusy(true);
    try {
      const next = await runCommandScenario(id, 120);
      setSnap(next);
      setReady(true);
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5" data-testid="command-center">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-mono tracking-widest text-[#00F0FF] mb-1">MODULE 7 · OPERATOR</p>
          <h2 className="text-2xl font-display font-black text-white">Command Center</h2>
          <p className="text-sm text-slate-400">
            Control loop: PortalPulse predicts · Kavach detects · Dhara decides
          </p>
        </div>
        <div className="flex flex-wrap gap-2" data-testid="scenario-buttons">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              type="button"
              disabled={busy}
              onClick={() => run(s.id)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold font-mono border transition-all ${
                snap.scenario === s.kind
                  ? 'bg-[#00FF9D] text-slate-950 border-[#00FF9D]'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
        <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[#00FF9D]">
          DHARA {snap.dhara_state}
        </span>
        {busy && <span className="text-amber-300">Running PRAYOG sample…</span>}
      </div>

      {!ready && (
        <p className="text-xs font-mono text-slate-500">Loading operator snapshot…</p>
      )}

      <LiveStateStrip live={snap.live} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ForecastPanel forecast={snap.forecast} />
        <SecurityPanel security={snap.security} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ControlLoopGraph nodes={snap.nodes} detail={snap.bottleneck_detail} />
        <RecommendedActions actions={snap.actions} />
      </div>

      <InterventionTimeline events={snap.timeline} />
    </div>
  );
};


