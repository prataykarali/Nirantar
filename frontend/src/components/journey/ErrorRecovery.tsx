/**
 * NIRANTAR — Error Recovery Component
 * ====================================
 * Reusable component that shows user-friendly error messages
 * with actionable guidance. Never shows raw technical errors.
 *
 * Architecture Rule (Development Doc §19):
 *   Every failure provides: What happened? What can the user do next?
 */

import React from 'react';
import { AlertTriangle, Info, XCircle, RefreshCw, ArrowLeft, HelpCircle } from 'lucide-react';
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
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconColor: 'text-blue-600',
    titleColor: 'text-blue-900',
    textColor: 'text-blue-700',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    iconColor: 'text-amber-600',
    titleColor: 'text-amber-900',
    textColor: 'text-amber-700',
  },
  error: {
    icon: XCircle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    iconColor: 'text-red-600',
    titleColor: 'text-red-900',
    textColor: 'text-red-700',
  },
};

export const ErrorRecovery: React.FC<ErrorRecoveryProps> = ({
  error,
  onRetry,
  onGoBack,
  onDismiss,
  compact = false,
}) => {
  const config = severityConfig[error.severity];
  const Icon = config.icon;

  if (compact) {
    return (
      <div className={`flex items-start gap-2 p-2.5 rounded-xl ${config.bgColor} border ${config.borderColor}`}>
        <Icon className={`w-4 h-4 ${config.iconColor} shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-semibold ${config.titleColor}`}>{error.whatHappened}</p>
          <p className={`text-[10px] ${config.textColor} mt-0.5`}>{error.whatToDoNext}</p>
        </div>
        {error.canRetry && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="shrink-0 px-2 py-0.5 rounded-lg bg-white/80 border border-current/20 text-[10px] font-bold hover:bg-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3 inline mr-0.5" /> Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-2xl ${config.bgColor} border ${config.borderColor} p-4 space-y-3`}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-xl ${config.bgColor} ${config.iconColor} flex items-center justify-center shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className={`text-sm font-bold ${config.titleColor}`}>
            {error.whatHappened}
          </h4>
          <p className={`text-xs ${config.textColor} mt-1 leading-relaxed`}>
            {error.whatToDoNext}
          </p>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="w-6 h-6 rounded-full bg-white/60 hover:bg-white text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer text-xs font-bold"
          >
            ✕
          </button>
        )}
      </div>

      {/* Actions */}
      {(error.canRetry || onGoBack) && (
        <div className="flex items-center gap-2 pt-1">
          {error.canRetry && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try Again
            </button>
          )}
          {onGoBack && (
            <button
              type="button"
              onClick={onGoBack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/60 border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Go Back
            </button>
          )}
        </div>
      )}

      {/* Trust Footer */}
      <div className="flex items-center gap-1.5 pt-1 border-t border-current/10 text-[10px] text-slate-500">
        <HelpCircle className="w-3 h-3" />
        <span>Your journey progress has been saved. You can resume anytime.</span>
      </div>
    </div>
  );
};

export default ErrorRecovery;
