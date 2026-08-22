import React, { useState, useEffect } from 'react';
import { Server, Database, ShieldAlert, Cpu, ArrowRight, CheckCircle2, Zap, Radio } from 'lucide-react';

interface TopologyData {
  nodes: string[];
  dependencies: Record<string, string[]>;
  mermaid: string;
}

export const ServiceTopology: React.FC = () => {
  const [topology, setTopology] = useState<TopologyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFailure, setActiveFailure] = useState<string | null>(null);

  const fetchTopology = async () => {
    try {
      const res = await fetch('/api/v1/graph/topology');
      if (res.ok) {
        const json = await res.json();
        setTopology(json.data);
      }
    } catch (e) {
      console.error('Failed to fetch topology:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopology();
    const interval = setInterval(fetchTopology, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulateFailure = async (serviceName: string) => {
    setActiveFailure(serviceName);
    try {
      await fetch('/api/v1/graph/simulate-failure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_service: serviceName }),
      });
      fetchTopology();
    } catch (e) {
      console.error('Failed to simulate failure:', e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-3xl glass-card border border-white/10 shadow-2xl">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 rounded-2xl bg-amber-500/20 text-[#FFB800] border border-amber-500/40 shadow-lg shadow-amber-500/10">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-display font-extrabold text-white">
                Service Dependency Graph & Critical Path Engine
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                NetworkX DAG
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-400 font-medium">
              Dynamic topological graph emitted by backend NetworkX engine with blast-radius modeling and load shedding tiers.
            </p>
          </div>
        </div>
      </div>

      {/* Dynamic Grid of Microservices from NetworkX DAG */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {topology?.nodes.map((nodeName, idx) => {
          const isCritical = nodeName.toLowerCase().includes('booking') || nodeName.toLowerCase().includes('passenger') || nodeName.toLowerCase().includes('inventory');
          const isNotification = nodeName.toLowerCase().includes('notification');
          const isFailed = activeFailure === nodeName;
          const deps = topology.dependencies[nodeName] || [];

          return (
            <div
              key={idx}
              className={`p-5 rounded-3xl border transition-all duration-300 glass-card-hover ${
                isFailed
                  ? 'bg-rose-950/40 border-rose-500 shadow-xl shadow-rose-500/20 animate-pulse'
                  : isCritical
                  ? 'bg-gradient-to-br from-amber-950/20 via-[#0a1224] to-[#060b14] border-amber-500/40'
                  : 'bg-gradient-to-br from-[#0a1224] to-[#060b14] border-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                    isFailed
                      ? 'bg-rose-500 text-white'
                      : isCritical
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : isNotification
                      ? 'bg-slate-800 text-slate-400'
                      : 'bg-[#00FF9D]/20 text-[#00FF9D] border border-[#00FF9D]/30'
                  }`}
                >
                  {isFailed ? 'FAILED_OUTAGE' : isCritical ? 'CRITICAL_PATH' : isNotification ? 'DEGRADABLE' : 'OPERATIONAL'}
                </span>
                <span className="text-[11px] font-mono text-slate-400">Node #{idx + 1}</span>
              </div>

              <h4 className="font-bold text-white text-base font-display mb-1">{nodeName}</h4>
              <p className="text-[11px] text-slate-400 font-mono mb-3">
                Downstream Deps: <strong className="text-slate-200">{deps.length}</strong>
              </p>

              {deps.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {deps.map((d, di) => (
                    <span key={di} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 border border-white/5 text-slate-300">
                      ➔ {d}
                    </span>
                  ))}
                </div>
              )}

              <button
                onClick={() => handleSimulateFailure(nodeName)}
                className={`w-full py-1.5 rounded-xl text-[11px] font-bold font-mono transition-all ${
                  isFailed
                    ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                    : 'bg-white/5 text-slate-300 hover:bg-rose-500 hover:text-white border border-white/5'
                }`}
              >
                {isFailed ? 'Restore Node' : 'Simulate Blast Radius'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Dynamic Graph Flow Representation */}
      <div className="p-6 rounded-3xl glass-card border border-white/10 space-y-4">
        <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#00FF9D]" />
          Topological Critical Path (NetworkX Directed Acyclic Graph)
        </h3>

        <div className="p-4 rounded-2xl bg-black/50 border border-white/[0.05] overflow-x-auto">
          <pre className="text-xs text-cyan-300 font-mono leading-relaxed">
            {topology?.mermaid || 'Loading dynamic graph from backend NetworkX DAG...'}
          </pre>
        </div>
      </div>
    </div>
  );
};
