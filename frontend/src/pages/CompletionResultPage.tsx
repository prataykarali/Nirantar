import React from 'react';
import { Sparkles, CheckCircle2, Download, FileText, ArrowRight, RefreshCw, ShieldCheck } from 'lucide-react';

interface CompletionResultPageProps {
  onNavigate: (route: string) => void;
}

export const CompletionResultPage: React.FC<CompletionResultPageProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* HEADER */}
      <div className="space-y-2 text-center md:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          PAGE 07 — COMPLETION / RESULT
        </div>
        <h1 className="text-3xl md:text-5xl font-display font-black text-white">You're done. ✓</h1>
        <p className="text-slate-300 text-sm">Your application has been approved and cryptographically issued.</p>
      </div>

      {/* RESULT CARD SUMMARY */}
      <div className="rounded-3xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 via-[#091024] to-[#091024] p-6 md:p-8 space-y-6 backdrop-blur-md shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <span className="text-[10px] font-mono text-emerald-400 uppercase">OFFICIAL ISSUANCE</span>
            <h2 className="text-xl font-display font-bold text-white">Application NTR-20482</h2>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Approved & Verified
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-slate-400">APPLICATION</span>
            <p className="font-bold text-white text-sm">Completed</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-slate-400">PAYMENT</span>
            <p className="font-bold text-emerald-400 text-sm">Confirmed (₹50)</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-slate-400">DOCUMENTS</span>
            <p className="font-bold text-white text-sm">Verified</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-slate-400">DECISION</span>
            <p className="font-bold text-emerald-300 text-sm">Approved ✓</p>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="pt-2 flex flex-wrap gap-3">
          <button
            onClick={() => alert('Downloading official digital certificate PDF with cryptographic QR signature...')}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold text-xs shadow-xl shadow-emerald-500/20 transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Download Certificate
          </button>

          <button
            onClick={() => alert('Downloading payment receipt TXN-99482710...')}
            className="px-5 py-3 rounded-2xl border border-white/20 hover:border-white/40 text-white font-bold text-xs flex items-center gap-2"
          >
            <FileText className="w-4 h-4" /> Download Receipt
          </button>

          <button
            onClick={() => onNavigate('tracking')}
            className="px-5 py-3 rounded-2xl border border-white/20 hover:border-white/40 text-slate-300 font-bold text-xs"
          >
            View Journey Audit
          </button>

          <button
            onClick={() => onNavigate('home')}
            className="px-5 py-3 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/40 font-bold text-xs flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Start another service
          </button>
        </div>
      </div>

      {/* WHAT HAPPENS NEXT */}
      <div className="rounded-3xl border border-white/10 bg-[#091024]/80 p-6 md:p-8 space-y-4 backdrop-blur-md shadow-xl">
        <h3 className="text-sm font-mono font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" /> What happens next?
        </h3>

        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <p>
            • <strong>No further action is required:</strong> Your digital certificate is immediately valid for all official government transactions.
          </p>
          <p>
            • <strong>Digital Locker Sync:</strong> A copy has been automatically saved to your verified DigiLocker vault tied to your NIRANTAR profile.
          </p>
          <p>
            • <strong>Verification QR:</strong> Anyone can verify the authenticity of this document by scanning the embedded QR code on page 1.
          </p>
        </div>
      </div>
    </div>
  );
};
