import React, { useState } from 'react';
import { Sparkles, ArrowRight, ShieldCheck, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Lock } from 'lucide-react';

interface PaymentBridgePageProps {
  onNavigate: (route: string) => void;
}

type PaymentScreenState = 'pre_redirect' | 'success' | 'failed' | 'unknown';

export const PaymentBridgePage: React.FC<PaymentBridgePageProps> = ({ onNavigate }) => {
  const [paymentState, setPaymentState] = useState<PaymentScreenState>('pre_redirect');
  const [checkingUnknown, setCheckingUnknown] = useState(false);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* HEADER */}
      <div className="space-y-2 text-center md:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono font-bold">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          PAGE 05 — PAYMENT BRIDGE
        </div>
        <h1 className="text-3xl md:text-4xl font-display font-black text-white">Payment Bridge</h1>
        <p className="text-slate-300 text-sm">Resilient double-verification payment bridge adapter.</p>
      </div>

      {/* STATE TAB SELECTOR DEMO BAR */}
      <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl bg-[#091024]/80 border border-white/10 backdrop-blur-md">
        <span className="text-xs font-mono text-slate-400 px-3">Demonstrate States:</span>
        <button
          onClick={() => setPaymentState('pre_redirect')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            paymentState === 'pre_redirect' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Pre-Redirect Screen
        </button>
        <button
          onClick={() => setPaymentState('success')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            paymentState === 'success' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          State 1 — Success ✓
        </button>
        <button
          onClick={() => setPaymentState('failed')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            paymentState === 'failed' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          State 2 — Failed ✕
        </button>
        <button
          onClick={() => setPaymentState('unknown')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            paymentState === 'unknown' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          State 3 — Unknown ⭐ (Verify First)
        </button>
      </div>

      {/* SCREEN VIEW: PRE-REDIRECT */}
      {paymentState === 'pre_redirect' && (
        <div className="rounded-3xl border border-white/10 bg-[#091024]/90 p-8 space-y-8 backdrop-blur-md shadow-2xl animate-in fade-in duration-200">
          <div className="space-y-3 text-center max-w-xl mx-auto">
            <div className="h-14 w-14 rounded-2xl bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center mx-auto shadow-lg shadow-purple-500/20">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-display font-bold text-white">You're going to payment</h2>
            <p className="text-sm text-slate-300">
              You'll temporarily leave NIRANTAR to complete your payment. Your application state is locked & safe.
            </p>
          </div>

          {/* VISUAL FLOW DIAGRAM */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-around text-center max-w-lg mx-auto">
            <div className="space-y-1">
              <span className="font-display font-black text-base text-purple-300">NIRANTAR</span>
              <p className="text-[10px] font-mono text-slate-400">Application Locked</p>
            </div>
            <ArrowRight className="w-6 h-6 text-purple-400 animate-pulse" />
            <div className="space-y-1">
              <span className="font-display font-bold text-sm text-white">PAYMENT PROVIDER</span>
              <p className="text-[10px] font-mono text-slate-400">Bank Gateway</p>
            </div>
            <ArrowRight className="w-6 h-6 text-purple-400 animate-pulse" />
            <div className="space-y-1">
              <span className="font-display font-black text-base text-purple-300">NIRANTAR</span>
              <p className="text-[10px] font-mono text-slate-400">Auto Return</p>
            </div>
          </div>

          {/* SUMMARY & ACTION */}
          <div className="max-w-md mx-auto p-5 rounded-2xl border border-white/10 bg-[#050914] space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400 font-mono">Application:</span>
              <span className="font-bold text-white font-mono">NTR-20482</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-mono">Amount:</span>
              <span className="font-bold text-emerald-400">₹50</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-mono">Status:</span>
              <span className="font-bold text-amber-300">Awaiting payment</span>
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <button
              onClick={() => setPaymentState('success')}
              className="px-10 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-base shadow-xl shadow-purple-500/30 transition-all active:scale-95"
            >
              Continue to payment →
            </button>
          </div>
        </div>
      )}

      {/* STATE 1: SUCCESS */}
      {paymentState === 'success' && (
        <div className="rounded-3xl border border-emerald-500/40 bg-gradient-to-b from-emerald-950/30 via-[#091024] to-[#091024] p-8 space-y-6 text-center backdrop-blur-md shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="h-16 w-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase">STATE 1 — SUCCESS</span>
            <h2 className="text-3xl font-display font-bold text-white">Payment successful ✓</h2>
            <p className="text-sm text-slate-300 max-w-md mx-auto">
              You're being returned to your application. Transaction ID: TXN-99482710
            </p>
          </div>

          <div className="pt-4 flex justify-center">
            <button
              onClick={() => onNavigate('tracking')}
              className="px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-500/20 transition-all"
            >
              View Application Timeline (Page 06) →
            </button>
          </div>
        </div>
      )}

      {/* STATE 2: FAILED */}
      {paymentState === 'failed' && (
        <div className="rounded-3xl border border-rose-500/40 bg-gradient-to-b from-rose-950/30 via-[#091024] to-[#091024] p-8 space-y-6 text-center backdrop-blur-md shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="h-16 w-16 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto shadow-xl shadow-rose-500/30">
            <XCircle className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono font-bold text-rose-400 uppercase">STATE 2 — FAILED</span>
            <h2 className="text-3xl font-display font-bold text-white">Payment wasn't completed</h2>
            <p className="text-sm text-slate-300 max-w-md mx-auto">
              Your application is still safe. No duplicate charge was made to your bank account.
            </p>
          </div>

          <div className="pt-4 flex justify-center gap-4">
            <button
              onClick={() => setPaymentState('pre_redirect')}
              className="px-8 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-sm shadow-xl shadow-rose-600/20 transition-all"
            >
              Try payment again
            </button>
          </div>
        </div>
      )}

      {/* STATE 3: UNKNOWN ⭐ */}
      {paymentState === 'unknown' && (
        <div className="rounded-3xl border border-amber-500/40 bg-gradient-to-b from-amber-950/30 via-[#091024] to-[#091024] p-8 space-y-6 backdrop-blur-md shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="h-16 w-16 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/30">
            <AlertTriangle className="w-10 h-10" />
          </div>

          <div className="space-y-2 text-center max-w-md mx-auto">
            <span className="text-xs font-mono font-bold text-amber-300 uppercase">
              STATE 3 — UNKNOWN / VERIFICATION PENDING ⭐
            </span>
            <h2 className="text-3xl font-display font-bold text-white">We couldn't confirm your payment yet.</h2>
            <p className="text-sm text-amber-200 font-bold bg-amber-500/10 border border-amber-500/20 py-2 px-4 rounded-xl">
              ⚠️ Don't pay again.
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">
              We're checking whether the previous transaction was successful with the bank aggregator before asking for any re-attempt.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#050914] border border-white/10 max-w-md mx-auto space-y-2 text-xs font-mono text-slate-300">
            <div className="flex justify-between">
              <span>Application ID:</span>
              <span className="text-white font-bold">NTR-20482</span>
            </div>
            <div className="flex justify-between">
              <span>Status check:</span>
              <span className="text-amber-300">Double verification in progress...</span>
            </div>
          </div>

          <div className="pt-2 flex justify-center">
            <button
              onClick={() => {
                setCheckingUnknown(true);
                setTimeout(() => {
                  setCheckingUnknown(false);
                  setPaymentState('success');
                }, 1500);
              }}
              disabled={checkingUnknown}
              className="px-8 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center gap-2"
            >
              {checkingUnknown ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Verifying with Gateway…
                </>
              ) : (
                'Check payment status'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
