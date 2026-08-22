import React from 'react';
import { BenchmarkModel } from '@app/types';
import { Trophy, CheckCircle2, AlertTriangle, Clock, Zap } from 'lucide-react';

interface BenchmarkProps {
  benchmarks: BenchmarkModel[];
}

export const ModelBenchmarkTable: React.FC<BenchmarkProps> = ({ benchmarks }) => {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">2.2 Model Competition & Empirical Benchmarking</h2>
            <p className="text-xs text-slate-400">
              Comparative multi-architecture evaluation across regression fidelity, latency, and 7k–10k boundary safety.
            </p>
          </div>
        </div>
      </div>

      {/* Benchmark Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden backdrop-blur shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Architecture</th>
                <th className="py-3.5 px-4">Model Family</th>
                <th className="py-3.5 px-4 text-right">MAE</th>
                <th className="py-3.5 px-4 text-right">RMSE</th>
                <th className="py-3.5 px-4 text-right">R² Score</th>
                <th className="py-3.5 px-4 text-right">Inference</th>
                <th className="py-3.5 px-4 text-right">Critical MAE (7k-10k)</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {benchmarks.map((m, idx) => {
                const isWinner = m.status === 'SELECTED_TOP_PERFORMER';
                return (
                  <tr
                    key={idx}
                    className={`transition-colors ${
                      isWinner ? 'bg-emerald-950/20 hover:bg-emerald-950/30' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {isWinner && <Trophy className="w-4 h-4 text-amber-400 flex-shrink-0" />}
                        <span className={`font-bold font-mono ${isWinner ? 'text-emerald-400 text-sm' : 'text-slate-200'}`}>
                          {m.model_name}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-400 text-[11px]">{m.family}</td>
                    <td className="py-4 px-4 text-right font-mono font-bold text-slate-200">{m.test_mae.toFixed(1)}</td>
                    <td className="py-4 px-4 text-right font-mono text-slate-300">{m.test_rmse.toFixed(1)}</td>
                    <td className="py-4 px-4 text-right font-mono font-bold text-emerald-400">{m.test_r2.toFixed(3)}</td>
                    <td className="py-4 px-4 text-right font-mono text-cyan-300">
                      <span className="flex items-center justify-end gap-1">
                        <Zap className="w-3 h-3 text-cyan-400" />
                        {m.inference_latency_ms} ms
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-bold text-amber-400">
                      {m.critical_region_mae.toFixed(1)} users
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isWinner
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : m.critical_verdict === 'STABLE_SAFE'
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {m.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Model Selection Justification Card */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Empirical Architecture Selection Rationale
        </h4>
        <p className="text-xs text-slate-400 leading-relaxed">
          While <strong>PyTorch Deep Learning</strong> provides multi-task capabilities across 5 outputs, <strong>XGBoost / LightGBM</strong> yields
          the lowest critical-region boundary error (148.0 users vs 420.0 for Linear) and sub-0.015ms execution latency. NIRANTAR employs a
          hybrid ensemble: XGBoost for real-time traffic gatekeeping and PyTorch MLP for multi-dimensional telemetry regression.
        </p>
      </div>
    </div>
  );
};
