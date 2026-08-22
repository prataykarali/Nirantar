import React from 'react';
import { TimelineEvent } from '@app/types';

const KIND_DOT: Record<string, string> = {
  detect: 'bg-amber-400',
  predict: 'bg-rose-400',
  decide: 'bg-[#00F0FF]',
  stabilize: 'bg-[#00FF9D]',
  ok: 'bg-[#00FF9D]',
  info: 'bg-slate-400',
};

export const InterventionTimeline: React.FC<{ events: TimelineEvent[] }> = ({ events }) => (
  <section data-testid="intervention-timeline" className="p-5 rounded-2xl glass-card border border-white/10">
    <h3 className="text-[10px] font-mono tracking-widest text-slate-400 mb-4">INTERVENTION TIMELINE</h3>
    <ol className="space-y-3">
      {events.map((event, idx) => (
        <li key={`${event.at}-${idx}`} className="flex items-start gap-4">
          <span className="font-mono text-xs text-slate-400 w-20 shrink-0 pt-0.5">{event.at}</span>
          <span className={`mt-1 h-2.5 w-2.5 rounded-full shrink-0 ${KIND_DOT[event.kind] || KIND_DOT.info}`} />
          <span className="text-sm text-slate-100">{event.label}</span>
        </li>
      ))}
    </ol>
  </section>
);
