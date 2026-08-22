import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { ForecastState } from '@app/types';

function fmt(n: number): string {
  return Math.round(n).toLocaleString();
}

export const ForecastPanel: React.FC<{ forecast: ForecastState }> = ({ forecast }) => {
  const seconds = forecast.overload_in_seconds;
  const warn = forecast.overload_predicted && seconds !== null;
  return (
    <section data-testid="forecast-panel" className="p-5 rounded-2xl glass-card border border-white/10 h-full">
      <h3 className="text-[10px] font-mono tracking-widest text-slate-400 mb-4">FORECAST</h3>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Stat label="CURRENT" value={fmt(forecast.current_users)} />
        <Stat label="+5 MIN" value={fmt(forecast.plus_5_min_users)} />
        <Stat label="+10 MIN" value={fmt(forecast.plus_10_min_users)} />
        <Stat label="SAFE CAPACITY" value={fmt(forecast.safe_capacity_users)} accent />
      </div>
      {warn ? (
        <div
          data-testid="overload-warning"
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-300 text-sm font-bold"
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          OVERLOAD PREDICTED IN {seconds} SECONDS
        </div>
      ) : (
        <p className="text-xs text-slate-400 font-mono">Demand stays inside the safe ceiling.</p>
      )}
    </section>
  );
};

const Stat: React.FC<{ label: string; value: string; accent?: boolean }> = ({ label, value, accent }) => (
  <div>
    <div className="text-[10px] font-mono tracking-widest text-slate-500">{label}</div>
    <div className={`text-xl font-display font-black tabular-nums ${accent ? 'text-[#00FF9D]' : 'text-white'}`}>
      {value}
    </div>
  </div>
);
