import React, { useEffect, useState } from 'react';
import { ShieldCheck, ArrowDownRight, ArrowUpRight, X, ExternalLink, Building2, CheckCircle2, Copy, Check } from 'lucide-react';
import { useJourney } from '../context/JourneyContext';

export const DigitalBankNotificationOverlay: React.FC = () => {
  const { digitalBankAlert, dismissDigitalBankAlert, navigateTo } = useJourney();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (digitalBankAlert) {
      const timer = setTimeout(() => {
        dismissDigitalBankAlert();
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [digitalBankAlert, dismissDigitalBankAlert]);

  if (!digitalBankAlert) return null;

  const isDebit = digitalBankAlert.type === 'DEBIT';

  const handleCopyRef = () => {
    navigator.clipboard?.writeText(digitalBankAlert.transactionRef);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed top-4 right-4 sm:right-6 z-[100] max-w-md w-[calc(100vw-2rem)] sm:w-96 animate-in slide-in-from-top-4 fade-in duration-300 select-none font-sans">
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white shadow-2xl border-2 border-indigo-500/40 p-4 relative overflow-hidden backdrop-blur-xl ring-4 ring-purple-500/20">
        {/* Glowing bank security accent bar */}
        <div
          className={`absolute top-0 left-0 right-0 h-1.5 ${
            isDebit
              ? 'bg-gradient-to-r from-rose-500 via-amber-400 to-rose-600 animate-pulse'
              : 'bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-600 animate-pulse'
          }`}
        />

        {/* Header Strip: Bank Identity & Timestamp */}
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/40 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shrink-0 shadow-inner">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-indigo-200">
                  {digitalBankAlert.bankName || 'DIGITAL CITIZEN BANK'}
                </span>
                <span
                  className={`text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase border ${
                    isDebit
                      ? 'bg-rose-500/20 text-rose-300 border-rose-400/30'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                  }`}
                >
                  {isDebit ? 'DEBIT ALERT' : 'CREDIT ALERT'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono block">
                {digitalBankAlert.timestamp || 'Just now'} IST
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={dismissDigitalBankAlert}
            className="w-6 h-6 rounded-full hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* SMS / Digital Banking Push Notification Body */}
        <div className="py-3 space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {isDebit ? (
                <span className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                </span>
              ) : (
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              )}
              <span className="text-sm font-semibold text-slate-200">
                {isDebit ? 'Amount Debited' : 'Amount Credited'}
              </span>
            </div>

            <div className="text-right font-mono">
              <span
                className={`text-lg sm:text-xl font-black ${
                  isDebit ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {isDebit ? '-' : '+'}₹{digitalBankAlert.amount.toLocaleString('en-IN')}.00
              </span>
            </div>
          </div>

          {/* Official Bank SMS Style Card */}
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-[11px] font-mono text-slate-300 leading-relaxed space-y-1">
            <p>
              {digitalBankAlert.smsText ||
                (isDebit
                  ? `Dear Customer, INR ${digitalBankAlert.amount.toLocaleString('en-IN')}.00 debited from A/C ${digitalBankAlert.accountMask || 'XX-8492'} to ${digitalBankAlert.beneficiaryOrSource || 'IRCTC Railway Services'}. Avail Bal: INR ${digitalBankAlert.balanceAfter.toLocaleString('en-IN')}.00. Ref: ${digitalBankAlert.transactionRef}.`
                  : `Dear Customer, INR ${digitalBankAlert.amount.toLocaleString('en-IN')}.00 credited to Digital Bank A/C ${digitalBankAlert.accountMask || 'XX-8492'} via ${digitalBankAlert.beneficiaryOrSource || 'FastPay NetBanking'}. Avail Bal: INR ${digitalBankAlert.balanceAfter.toLocaleString('en-IN')}.00. Ref: ${digitalBankAlert.transactionRef}.`)}
            </p>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Avail Bal: <strong className="text-white font-mono">₹{digitalBankAlert.balanceAfter.toLocaleString('en-IN')}.00</strong></span>
            </div>
            <button
              type="button"
              onClick={handleCopyRef}
              className="hover:text-purple-300 flex items-center gap-1 font-mono transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : digitalBankAlert.transactionRef.slice(0, 14)}</span>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
          <span className="text-[9px] text-slate-400 font-medium">
            🔒 RBI / FastPay 256-bit Certified
          </span>
          <button
            type="button"
            onClick={() => {
              dismissDigitalBankAlert();
              navigateTo('payments');
            }}
            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <span>View Ledger</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
