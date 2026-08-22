import React from 'react';
import { ShapFactor } from '@app/types';
import { HelpCircle, TrendingUp } from 'lucide-react';

interface ShapProps {
  factors: ShapFactor[];
  barChartAscii?: string;
  overloadProb?: number;
}

export const ShapExplainabilityBar: React.FC<ShapProps> = ({ factors, barChartAscii, overloadProb = 0.91 }) => {
  return (
    <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            2.6 Explainability (SHAP Factor Attribution)
          </h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          Risk: <strong className="text-amber-400 font-bold">{(overloadProb * 100).toFixed(1)}%</strong>
        </span>
      </div>

      <p className="text-xs text-slate-400 mb-4">
        Transparent root-cause decomposition answering <em>"Why is the system predicting overload?"</em>
      </p>

      {/* Visual Bars */}
      <div className="space-y-3">
        {factors.length > 0 ? (
          factors.map((factor, idx) => {
            const pct = factor.percentage_contribution;
            const barColor =
              pct > 25 ? 'bg-gradient-to-r from-rose-500 to-amber-500' :
              pct > 15 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
              'bg-gradient-to-r from-teal-500 to-emerald-400';

            return (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-300 font-mono">{factor.feature_name}</span>
                  <span className="text-slate-200 font-bold font-mono">{pct.toFixed(1)}%</span>
                </div>
                <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                    style={{ width: `${Math.max(4, pct)}%` }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-6 text-slate-500 text-xs font-mono">
            System running within normal thresholds. Zero overload attribution required.
          </div>
        )}
      </div>

      {barChartAscii && (
        <div className="mt-4 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 mb-1.5">
            <HelpCircle className="w-3 h-3 text-slate-500" />
            ASCII SHAP Console Output:
          </div>
          <pre className="text-[11px] text-emerald-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 overflow-x-auto leading-relaxed">
            {barChartAscii}
          </pre>
        </div>
      )}
    </div>
  );
};
