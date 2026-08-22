import React from 'react';
import { Users, Zap, Cpu, Activity, AlertTriangle } from 'lucide-react';
import { LiveSystemState } from '@app/types';

const CARDS: { key: keyof LiveSystemState; label: string; icon: React.ReactNode; format: (v: number) => string }[] = [
  { key: 'concurrent_users', label: 'CONCURRENT USERS', icon: <Users className="w-4 h-4" />, format: (v) => Math.round(v).toLocaleString() },
  { key: 'requests_per_sec', label: 'REQUESTS/SEC', icon: <Zap className="w-4 h-4" />, format: (v) => Math.round(v).toLocaleString() },
  { key: 'cpu_percent', label: 'CPU', icon: <Cpu className="w-4 h-4" />, format: (v) => `${v.toFixed(0)}%` },
  { key: 'latency_ms', label: 'LATENCY', icon: <Activity className="w-4 h-4" />, format: (v) => `${Math.round(v)} ms` },
  { key: 'error_rate_pct', label: 'ERROR RATE', icon: <AlertTriangle className="w-4 h-4" />, format: (v) => `${v.toFixed(1)}%` },
];

export const LiveStateStrip: React.FC<{ live: LiveSystemState }> = ({ live }) => (
  <section data-testid="live-state" className="grid grid-cols-2 md:grid-cols-5 gap-3">
    {CARDS.map((card) => (
      <div key={card.key} className="p-4 rounded-2xl glass-card border border-white/10">
        <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest text-slate-400 mb-2">
          <span className="text-[#00FF9D]">{card.icon}</span>
          {card.label}
        </div>
        <div className="text-2xl md:text-3xl font-display font-black text-white tabular-nums">
          {card.format(Number(live[card.key] ?? 0))}
        </div>
      </div>
    ))}
  </section>
);
