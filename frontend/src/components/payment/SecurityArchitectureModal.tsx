import React from 'react';
import {
  X,
  ShieldCheck,
  Lock,
  Zap,
  CheckCircle2,
  RefreshCw,
  Server,
} from 'lucide-react';

interface SecurityArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityArchitectureModal: React.FC<SecurityArchitectureModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 select-none font-sans text-slate-800">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-2xl w-full shadow-2xl border border-purple-100 space-y-5 relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-900 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-950 flex items-center gap-2">
                <span>Payment Security Architecture</span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                  Zero-PII & Idempotent
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Deterministic failure recovery, 0-PIN citizen wallet & bank-grade cryptographic isolation
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hero Visual State Machine */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 text-white space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">
              Deterministic Payment State Machine
            </span>
            <span className="text-[10px] font-bold bg-purple-800/80 px-2 py-0.5 rounded-full text-purple-200 border border-purple-600/50">
              Architecture Doc §11
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-center text-xs font-bold pt-1">
            <div className="p-2.5 rounded-xl bg-white/10 border border-white/15 space-y-1">
              <span className="text-[10px] text-purple-300 block">Stage 1</span>
              <div className="text-white font-mono">INITIATED</div>
              <p className="text-[9px] text-purple-200/70 font-normal">Idempotency Token Locked</p>
            </div>

            <div className="p-2.5 rounded-xl bg-white/10 border border-white/15 space-y-1">
              <span className="text-[10px] text-purple-300 block">Stage 2</span>
              <div className="text-amber-300 font-mono">PROCESSING</div>
              <p className="text-[9px] text-purple-200/70 font-normal">256-Bit NPCI Bridge</p>
            </div>

            <div className="p-2.5 rounded-xl bg-white/10 border border-white/15 space-y-1">
              <span className="text-[10px] text-purple-300 block">Stage 3</span>
              <div className="text-cyan-300 font-mono">UNKNOWN / TIMEOUT</div>
              <p className="text-[9px] text-purple-200/70 font-normal">Never Auto-Retries</p>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 space-y-1">
              <span className="text-[10px] text-emerald-300 block">Stage 4</span>
              <div className="text-emerald-300 font-mono">CONFIRMED</div>
              <p className="text-[9px] text-emerald-200 font-normal">DigiLocker PNR Issued</p>
            </div>
          </div>
        </div>

        {/* 4 Security Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Pillar 1 */}
          <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-200/80 space-y-1.5">
            <div className="flex items-center gap-2 text-purple-900 font-bold text-xs">
              <Zap className="w-4 h-4 text-purple-700 shrink-0" />
              <span>SHA-256 Idempotency Guarantee</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
              Every checkout attempt generates a cryptographic UUIDv4 idempotency key. Duplicate requests are detected instantly, preventing duplicate debits.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 space-y-1.5">
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
              <RefreshCw className="w-4 h-4 text-indigo-700 shrink-0" />
              <span>Ghost-Charge Double Verification</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
              If an Indian Railways or bank gateway timeout occurs, NIRANTAR pauses in UNKNOWN state and audits the bank ledger before allowing any retry.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
              <Lock className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Zero-PII Credential Isolation</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
              Banking PINs, UPI MPINs, card CVVs, and raw passwords never cross the Kavach boundary into AI model prompts or telemetry loggers.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
              <Server className="w-4 h-4 text-slate-700 shrink-0" />
              <span>Multi-Tenant DB & Wallet Isolation</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
              All wallet balances, passenger profiles, and transaction records are cryptographically partitioned by user ID with salted PBKDF2 authentication.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#7C3AED] via-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-black text-xs shadow-md shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Got it, Security Architecture Verified</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SecurityArchitectureModal;
