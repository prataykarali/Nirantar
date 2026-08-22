import React from 'react';
import { GraphNodeState } from '@app/types';

function dot(status: string): string {
  if (status === 'down') return 'bg-rose-500';
  if (status === 'degraded') return 'bg-amber-400';
  return 'bg-[#00FF9D]';
}

function NodeCard({ node }: { node?: GraphNodeState }) {
  if (!node) return null;
  return (
    <div
      data-testid={`graph-node-${node.label}`}
      className="px-4 py-3 rounded-2xl border border-white/10 bg-[#060b14] min-w-[7.5rem] text-center"
    >
      <div className="text-[11px] font-mono font-bold tracking-widest text-white">{node.label}</div>
      <div className="mt-2 flex items-center justify-center gap-2">
        <span className={`h-3 w-3 rounded-full ${dot(node.status)}`} />
        <span className="text-[10px] font-mono text-slate-400 uppercase">{node.status}</span>
      </div>
    </div>
  );
}

export const ControlLoopGraph: React.FC<{ nodes: GraphNodeState[]; detail: string }> = ({ nodes, detail }) => {
  const byLabel = Object.fromEntries(nodes.map((n) => [n.label, n]));
  return (
    <section data-testid="control-graph" className="p-5 rounded-2xl glass-card border border-white/10 h-full">
      <h3 className="text-[10px] font-mono tracking-widest text-slate-400 mb-4">DEPENDENCY GRAPH</h3>
      <div className="flex flex-col items-center gap-1 font-mono text-slate-500 text-xs">
        <NodeCard node={byLabel.AUTH} />
        <div className="h-6 w-px bg-slate-600" />
        <div>▼</div>
        <NodeCard node={byLabel.BOOKING} />
        <div className="flex items-start justify-center gap-10 mt-1">
          <div className="flex flex-col items-center">
            <div className="h-6 w-px bg-slate-600" />
            <div>▼</div>
            <NodeCard node={byLabel.DB} />
          </div>
          <div className="flex flex-col items-center">
            <div className="h-6 w-px bg-slate-600" />
            <div>▼</div>
            <NodeCard node={byLabel.PAYMENT} />
          </div>
        </div>
      </div>
      {detail ? (
        <p data-testid="bottleneck-callout" className="mt-4 text-sm font-bold text-rose-300">
          {detail}
        </p>
      ) : (
        <p className="mt-4 text-xs text-slate-500">Critical path healthy.</p>
      )}
    </section>
  );
};
