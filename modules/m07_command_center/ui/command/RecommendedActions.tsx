import React from 'react';
import { Check, Minus } from 'lucide-react';
import { RecommendedAction } from '@app/types';

export const RecommendedActions: React.FC<{ actions: RecommendedAction[] }> = ({ actions }) => (
  <section data-testid="recommended-actions" className="p-5 rounded-2xl glass-card border border-white/10 h-full">
    <h3 className="text-[10px] font-mono tracking-widest text-slate-400 mb-1">NIRANTAR RECOMMENDS</h3>
    <p className="text-[11px] text-slate-500 mb-4">Dhara decides. The operator sees the same actions.</p>
    <ul className="space-y-2">
      {actions.map((action) => (
        <li
          key={action.id}
          data-testid={`action-${action.id}`}
          className={`flex items-center gap-3 px-3 py-2 rounded-xl border ${
            action.active
              ? 'border-[#00FF9D]/40 bg-[#00FF9D]/10 text-white'
              : 'border-white/5 text-slate-500'
          }`}
        >
          {action.active ? (
            <Check className="w-4 h-4 text-[#00FF9D]" />
          ) : (
            <Minus className="w-4 h-4 text-slate-600" />
          )}
          <span className="text-sm font-medium">{action.label}</span>
        </li>
      ))}
    </ul>
  </section>
);
