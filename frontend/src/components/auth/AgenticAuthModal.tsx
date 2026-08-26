import React, { useState } from 'react';
import {
  Key,
  ShieldCheck,
  Fingerprint,
  Lock,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  ArrowRight,
  UserCheck,
} from 'lucide-react';

interface AgenticAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  trainName?: string;
  trainNumber?: string;
  passengersCount?: number;
}

export const AgenticAuthModal: React.FC<AgenticAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  trainName = 'Mumbai Rajdhani',
  trainNumber = '12951',
  passengersCount = 1,
}) => {
  const [authState, setAuthState] = useState<'IDLE' | 'SCANNING' | 'SUCCESS'>('IDLE');

  if (!isOpen) return null;

  const handleBiometricAuth = () => {
    setAuthState('SCANNING');
    setTimeout(() => {
      setAuthState('SUCCESS');
      setTimeout(() => {
        onSuccess();
        onClose();
        setAuthState('IDLE');
      }, 1000);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="bg-[#0f1123] text-white rounded-3xl max-w-md w-full border border-purple-500/30 shadow-2xl overflow-hidden flex flex-col font-sans">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 p-5 border-b border-purple-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center p-0.5 shadow-lg">
              <div className="w-full h-full bg-[#110d2c] rounded-[14px] flex items-center justify-center text-purple-300">
                <Lock className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className="font-display font-black text-white text-base tracking-tight flex items-center gap-1.5">
                <span>1Password Agentic Auth</span>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 font-mono px-2 py-0.5 rounded-full border border-purple-400/30">
                  Zero-PII
                </span>
              </h3>
              <p className="text-xs text-purple-200/80 font-medium">
                Credential Isolation & Human Control
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-white/10 text-purple-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Agent Action Summary */}
          <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/20 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Nirantar AI Agent Prepared Journey</span>
            </div>
            <p className="text-xs text-slate-300">
              Booking <strong className="text-white">#{trainNumber} {trainName}</strong> for{' '}
              <strong className="text-white">{passengersCount} passenger{passengersCount > 1 ? 's' : ''}</strong>.
            </p>
          </div>

          {/* Security Story Callout */}
          <div className="space-y-2">
            <div className="flex items-start gap-2.5 text-xs text-slate-300 bg-slate-900/60 p-3.5 rounded-2xl border border-white/5">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-white block">Credential Isolation Principle</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  The AI navigates the railway flow, but <strong>1Password</strong> securely injects your credentials upon your biometric consent. The AI never receives, reads, or stores your secret passwords.
                </p>
              </div>
            </div>
          </div>

          {/* Biometric Verification Box */}
          <div className="p-5 rounded-2xl bg-[#161838] border border-purple-500/30 text-center space-y-3">
            {authState === 'IDLE' && (
              <>
                <div className="w-16 h-16 rounded-full bg-purple-500/10 border-2 border-purple-500/40 mx-auto flex items-center justify-center text-purple-400 animate-pulse">
                  <Fingerprint className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-white">Biometric Approval Required</h4>
                  <p className="text-xs text-slate-400">
                    Authorize 1Password to autofill your IRCTC verification session.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleBiometricAuth}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all cursor-pointer active:scale-98"
                >
                  <Fingerprint className="w-4 h-4" />
                  <span>Authorize with Touch ID / Passkey</span>
                </button>
              </>
            )}

            {authState === 'SCANNING' && (
              <div className="py-4 space-y-3">
                <div className="w-16 h-16 rounded-full bg-purple-500/20 border-2 border-purple-400 mx-auto flex items-center justify-center text-purple-300 animate-spin">
                  <Fingerprint className="w-8 h-8" />
                </div>
                <span className="text-xs font-mono font-bold text-purple-300 block">
                  Verifying Biometric Passkey…
                </span>
              </div>
            )}

            {authState === 'SUCCESS' && (
              <div className="py-4 space-y-2 animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 mx-auto flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <span className="text-xs font-bold text-emerald-300 block">
                  Credentials Injected Safely!
                </span>
                <p className="text-[10px] text-slate-400">
                  AI Agent continuing to booking workspace (Zero-PII exposed).
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
