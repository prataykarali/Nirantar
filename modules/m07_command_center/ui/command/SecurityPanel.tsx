import React from 'react';
import { SecurityState } from '@app/types';

const ROWS: { key: keyof SecurityState; label: string; tone: string }[] = [
  { key: 'legitimate', label: 'LEGITIMATE', tone: 'text-[#00FF9D]' },
  { key: 'suspicious', label: 'SUSPICIOUS', tone: 'text-amber-300' },
  { key: 'blocked', label: 'BLOCKED', tone: 'text-rose-400' },
  { key: 'throttled', label: 'THROTTLED', tone: 'text-cyan-300' },
];

export const SecurityPanel: React.FC<{ security: SecurityState }> = ({ security }) => (
  <section data-testid="security-panel" className="p-5 rounded-2xl glass-card border border-white/10 h-full">
    <h3 className="text-[10px] font-mono tracking-widest text-slate-400 mb-4">SECURITY</h3>
    <ul className="space-y-3">
      {ROWS.map((row) => (
        <li key={row.key} className="flex items-baseline justify-between border-b border-white/5 pb-2">
          <span className="text-[10px] font-mono tracking-widest text-slate-500">{row.label}</span>
          <span className={`text-2xl font-display font-black tabular-nums ${row.tone}`}>
            {Math.round(security[row.key] ?? 0).toLocaleString()}
          </span>
        </li>
      ))}
    </ul>
  </section>
);
