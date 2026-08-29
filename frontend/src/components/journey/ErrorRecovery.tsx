/**
 * NIRANTAR — Error Recovery Component
 * ====================================
 * Reusable component that shows user-friendly error messages
 * with actionable guidance and calming restorative graphics.
 */

import React from 'react';
import { AlertTriangle, Info, XCircle, RefreshCw, ArrowLeft, HelpCircle, ShieldCheck } from 'lucide-react';
import type { JourneyError } from '../../types/journey';

interface ErrorRecoveryProps {
  error: JourneyError;
  onRetry?: () => void;
  onGoBack?: () => void;
  onDismiss?: () => void;
  compact?: boolean;
}

const severityConfig = {
  info: {
    icon: Info,
    bgColor: 'bg-blue-50/90',
    borderColor: 'border-blue-200',
    iconColor: 'text-blue-600',
    titleColor: 'text-blue-900',
    textColor: 'text-blue-700',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-amber-50/90',
    borderColor: 'border-amber-200',
    iconColor: 'text-amber-600',
    titleColor: 'text-amber-900',
    textColor: 'text-amber-700',
  },
  error: {
    icon: XCircle,
    bgColor: 'bg-rose-50/90',
    borderColor: 'border-rose-200',
    iconColor: 'text-rose-600',
    titleColor: 'text-rose-900',
    textColor: 'text-rose-700',
  },
};

export const ErrorRecovery: React.FC<ErrorRecoveryProps> = ({
  error,
  onRetry,
  onGoBack,
  onDismiss,
  compact = false,
}) => {
  const config = severityConfig[error.severity || 'error'];
  const Icon = config.icon;

  if (compact) {
    return (
      <div className={`flex items-start gap-2 p-2.5 rounded-xl ${config.bgColor} border ${config.borderColor} shadow-xs backdrop-blur-sm`}>
        <Icon className={`w-4 h-4 ${config.iconColor} shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-semibold ${config.titleColor}`}>{error.whatHappened}</p>
          <p className={`text-[10px] ${config.textColor} mt-0.5`}>{error.whatToDoNext}</p>
        </div>
        {error.canRetry && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="shrink-0 px-2 py-0.5 rounded-lg bg-white/90 border border-current/20 text-[10px] font-bold hover:bg-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3 inline mr-0.5" /> Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-3xl ${config.bgColor} border ${config.borderColor} p-6 sm:p-7 space-y-4 shadow-lg backdrop-blur-md`}>
      {/* Background Graphic Illustration */}
      <div className="absolute inset-0 pointer-events-none opacity-25 overflow-hidden">
        <img
          src="/assets/images/error_recovery_bg.png"
          alt="Restorative Graphic"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-start gap-3.5">
        <div className={`w-10 h-10 rounded-2xl bg-white/90 ${config.iconColor} flex items-center justify-center shrink-0 shadow-sm border border-current/20`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/80 text-rose-800 border border-rose-200 shadow-2xs">
              Oh No — Step Needs Attention
            </span>
          </div>
          <h4 className={`text-base font-black ${config.titleColor} mt-1`}>
            {error.whatHappened}
          </h4>
          <p className={`text-xs ${config.textColor} mt-1.5 leading-relaxed font-medium`}>
            {error.whatToDoNext}
          </p>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="w-7 h-7 rounded-full bg-white/80 hover:bg-white text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer text-xs font-bold shadow-2xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* Actions */}
      {(error.canRetry || onGoBack) && (
        <div className="relative z-10 flex items-center gap-2.5 pt-2">
          {error.canRetry && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-xs font-black text-white transition-all cursor-pointer shadow-md shadow-purple-700/20 active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Try Step Again</span>
            </button>
          )}
          {onGoBack && (
            <button
              type="button"
              onClick={onGoBack}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/90 hover:bg-white border border-slate-200 text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Go Back 1 Step</span>
            </button>
          )}
        </div>
      )}

      {/* Reassurance Footer */}
      <div className="relative z-10 flex items-center justify-between gap-2 pt-2 border-t border-current/10 text-[11px] text-slate-600 font-medium">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Zero-Data Loss Guarantee: Your entered passenger information is 100% safe.</span>
        </span>
      </div>
    </div>
  );
};

export default ErrorRecovery;
