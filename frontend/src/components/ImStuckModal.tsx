import React from 'react';
import {
  HelpCircle,
  X,
  Search,
  FileText,
  CreditCard,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import { useJourney } from '../context/JourneyContext';

interface ImStuckModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImStuckModal: React.FC<ImStuckModalProps> = ({ isOpen, onClose }) => {
  const {
    activePage,
    navigateTo,
    sendNiraQuery,
    startGuidanceTour,
    resetJourney,
    bookingState,
  } = useJourney();

  if (!isOpen) return null;

  const handleAction = (type: string) => {
    onClose();
    switch (type) {
      case 'find_train':
        navigateTo('discover');
        sendNiraQuery("Help me find and compare the best trains for my route based on price and speed.");
        break;
      case 'fill_form':
        navigateTo('booking');
        sendNiraQuery("Help me fill passenger details and explain what information is required.");
        break;
      case 'payment_help':
        navigateTo('payments');
        sendNiraQuery("I have a question about payment. How does the ₹10,000 Citizen Wallet and payment recovery work?");
        break;
      case 'go_back':
        sendNiraQuery("I want to go back or change something in my booking without losing my entered details.");
        break;
      case 'explain_page':
        sendNiraQuery("What am I doing here? Please explain this screen and what action I should take next.");
        break;
      default:
        sendNiraQuery("I need assistance with my current journey step.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-purple-100 overflow-hidden space-y-4 p-5 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-50 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold shadow-xs">
              <span className="text-xl">🆘</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                I'm Having Trouble
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Don't worry — Nira will guide you step by step.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Options */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-700">What are you stuck with?</p>

          <button
            onClick={() => handleAction('find_train')}
            className="w-full p-3 rounded-2xl bg-purple-50/70 hover:bg-purple-100/70 border border-purple-100 text-left flex items-center justify-between group transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-200/80 text-purple-900 flex items-center justify-center">
                <Search className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-xs text-slate-900 block">
                  Finding the right train / route
                </span>
                <span className="text-[11px] text-slate-500">
                  Nira can pick by price, speed or time
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-purple-600 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            onClick={() => handleAction('fill_form')}
            className="w-full p-3 rounded-2xl bg-indigo-50/70 hover:bg-indigo-100/70 border border-indigo-100 text-left flex items-center justify-between group transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-200/80 text-indigo-900 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-xs text-slate-900 block">
                  Filling passenger details form
                </span>
                <span className="text-[11px] text-slate-500">
                  Highlight fields with green spotlight arrows
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-indigo-600 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            onClick={() => handleAction('payment_help')}
            className="w-full p-3 rounded-2xl bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-100 text-left flex items-center justify-between group transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-200/80 text-emerald-900 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-xs text-slate-900 block">
                  Payment questions or error
                </span>
                <span className="text-[11px] text-slate-500">
                  Use ₹10,000 Citizen Wallet or retry payment
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            onClick={() => handleAction('go_back')}
            className="w-full p-3 rounded-2xl bg-amber-50/70 hover:bg-amber-100/70 border border-amber-100 text-left flex items-center justify-between group transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-200/80 text-amber-900 flex items-center justify-center">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-xs text-slate-900 block">
                  I want to change something / Go back
                </span>
                <span className="text-[11px] text-slate-500">
                  Return to previous step with 0 data loss
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            onClick={() => handleAction('explain_page')}
            className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left flex items-center justify-between group transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-800 flex items-center justify-center">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-xs text-slate-900 block">
                  What does this page mean?
                </span>
                <span className="text-[11px] text-slate-500">
                  Nira explains current screen in simple words
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Reassurance Footer */}
        <div className="pt-2 border-t border-purple-50 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Nothing is charged until you confirm</span>
          </span>
          <span className="text-purple-700 font-bold">24x7 Assistant</span>
        </div>
      </div>
    </div>
  );
};

export default ImStuckModal;
