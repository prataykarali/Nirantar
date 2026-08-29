import React, { useState } from 'react';
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
  Volume2,
  CheckCircle2,
  Compass,
  AlertCircle,
} from 'lucide-react';
import { useJourney } from '../context/JourneyContext';
import { speakNiraResponse } from '../services/voiceService';

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
    addNotification,
    walletBalance,
    selectedTrain,
    passengers,
  } = useJourney();

  const [searchFilter, setSearchFilter] = useState('');

  if (!isOpen) return null;

  const handleAction = (type: string) => {
    onClose();
    switch (type) {
      case 'find_train': {
        navigateTo('discover');
        sendNiraQuery(
          "Help me find and compare the best trains for my route based on price, speed, and highest seat confirmation probability."
        );
        addNotification({
          title: '🔍 Train Discovery Assistant Activated',
          body: 'Nira AI is analyzing direct express trains and quota options for you.',
          type: 'info',
        });
        speakNiraResponse(
          "I'm helping you find the best train. Let me know if you prefer the fastest, cheapest, or highest confirmation seats."
        );
        break;
      }

      case 'fill_form': {
        navigateTo('booking');
        setTimeout(() => {
          startGuidanceTour(3);
        }, 150);
        addNotification({
          title: '📄 Spotlight Guidance Enabled',
          body: 'Green spotlight arrows are pointing directly to passenger form fields.',
          type: 'info',
        });
        speakNiraResponse(
          "Here is your passenger details workspace. Follow the green arrows to enter names, berth preference, or click safe autofill."
        );
        break;
      }

      case 'payment_help': {
        if (selectedTrain && passengers.length > 0) {
          navigateTo('payment');
        } else {
          navigateTo('payments');
        }
        sendNiraQuery(
          `I have a question about payment. How does the ₹${walletBalance.toLocaleString('en-IN')} Citizen Wallet and double-verification ghost charge recovery work?`
        );
        addNotification({
          title: '💳 Payment Shield Ready',
          body: `₹${walletBalance.toLocaleString('en-IN')} Citizen Wallet available with Double-Verification Ghost Charge Protection.`,
          type: 'info',
        });
        speakNiraResponse(
          "Your payment is protected by Nirantar's Double-Verification Gate. You can also use your preloaded Citizen Wallet for instant checkout."
        );
        break;
      }

      case 'go_back': {
        let prevPage = 'home';
        if (activePage === 'completion' || activePage === 'ticket') {
          prevPage = 'payment';
        } else if (activePage === 'payment') {
          prevPage = 'workspace';
        } else if (activePage === 'workspace' || activePage === 'booking') {
          prevPage = 'trains';
        } else if (activePage === 'trains' || activePage === 'results') {
          prevPage = 'discover';
        } else if (activePage === 'discover') {
          prevPage = 'home';
        } else {
          prevPage = 'home';
        }

        navigateTo(prevPage);
        addNotification({
          title: '↩️ Returned to Previous Step',
          body: 'All entered details, passenger profiles, and search parameters preserved with 0 data loss.',
          type: 'info',
        });
        speakNiraResponse(
          "Returned to the previous step. All your entered details and passenger selections are completely safe."
        );
        break;
      }

      case 'explain_page': {
        const pageExplanations: Record<string, { speech: string; chatQuery: string }> = {
          home: {
            speech:
              'You are on the Home Page. Here you can search trains by typing or speaking, explore popular routes, or review your recent journeys.',
            chatQuery:
              'Please explain what features are on this Home Page and what action I should take next to book a train.',
          },
          discover: {
            speech:
              'You are on the Discover Hub. Here you can explore train schedules, check Tatkal opening times, and find alternative stations.',
            chatQuery:
              'What can I do on this Discover screen? Please explain the routes and quota options.',
          },
          trains: {
            speech:
              'You are on the Train Comparison page. You can sort trains by fastest or cheapest, check confirmation probability for waitlists, and pick your class.',
            chatQuery:
              'Please explain how to compare trains on this screen and what 1A, 2A, 3A, SL, and RAC confirmation odds mean.',
          },
          booking: {
            speech:
              'You are on the Passenger Booking Workspace. Here you enter passenger names, select berth preferences, and click safe autofill with zero PII leaks.',
            chatQuery:
              'How do I complete passenger details, select berth preferences, and verify IRCTC ID on this screen?',
          },
          workspace: {
            speech:
              'You are on the Passenger Booking Workspace. Here you enter passenger names, select berth preferences, and click safe autofill with zero PII leaks.',
            chatQuery:
              'How do I complete passenger details, select berth preferences, and verify IRCTC ID on this screen?',
          },
          payment: {
            speech:
              'You are on the Payment Bridge. This is a protected gateway with double verification. You can pay securely with UPI, cards, or your ₹10,000 Citizen Wallet.',
            chatQuery:
              'How does double-verification payment work here, and how can I pay with UPI or Citizen Wallet?',
          },
          completion: {
            speech:
              'Congratulations! Here is your confirmed digital e-ticket pass with PNR number, allocated coach and berth, and offline download.',
            chatQuery:
              'Please explain my confirmed ticket details, how to download the pass, and how to track this train.',
          },
          track: {
            speech:
              'You are on the Live GPS Train Tracker. You can monitor live train speed, platform number, delay estimates, and coach rake layout.',
            chatQuery:
              'Please explain how the live GPS tracker, platform number, and coach alignment map work on this screen.',
          },
          'my-journeys': {
            speech:
              'You are in your My Journeys Ticket Vault. Here you can view past and upcoming tickets, download GST invoices, and track refund claims.',
            chatQuery:
              'How do I manage my tickets, cancel a booking, or download invoices in this vault?',
          },
          payments: {
            speech:
              'You are in the Payments & Receipts ledger. You can inspect double-entry payment audits, bank transaction IDs, and refund status.',
            chatQuery:
              'Please explain the payment ledger, ghost charge prevention, and refund audit trail.',
          },
          help: {
            speech:
              'You are in the Help Center. Here you can search official railway rules, Tatkal guides, cancellation fees, and chat with Nira AI.',
            chatQuery:
              'What railway guides and assistance tools are available in this Help Center?',
          },
          profile: {
            speech:
              'You are on your Citizen Profile. Here you can manage your verified identity, switch profile avatars, and review linked passenger lists.',
            chatQuery:
              'Please explain my citizen profile, avatar options, and saved passenger database.',
          },
        };

        const currentExpl = pageExplanations[activePage] || {
          speech:
            'Nira is ready to guide you through your train journey step by step.',
          chatQuery:
            'What am I doing on this screen? Please explain what action I should take next.',
        };

        speakNiraResponse(currentExpl.speech);
        sendNiraQuery(currentExpl.chatQuery);
        break;
      }

      default:
        sendNiraQuery('I need assistance with my current journey step.');
    }
  };

  const options = [
    {
      id: 'find_train',
      title: 'Finding the right train / route',
      subtitle: 'Nira can pick by price, speed or time',
      icon: Search,
      bg: 'bg-purple-50/70 hover:bg-purple-100/70',
      border: 'border-purple-100',
      iconBg: 'bg-purple-200/80 text-purple-900',
      arrowColor: 'text-purple-600',
    },
    {
      id: 'fill_form',
      title: 'Filling passenger details form',
      subtitle: 'Highlight fields with green spotlight arrows',
      icon: FileText,
      bg: 'bg-indigo-50/70 hover:bg-indigo-100/70',
      border: 'border-indigo-100',
      iconBg: 'bg-indigo-200/80 text-indigo-900',
      arrowColor: 'text-indigo-600',
    },
    {
      id: 'payment_help',
      title: 'Payment questions or error',
      subtitle: `Use ₹${walletBalance.toLocaleString('en-IN')} Citizen Wallet or retry payment`,
      icon: CreditCard,
      bg: 'bg-emerald-50/70 hover:bg-emerald-100/70',
      border: 'border-emerald-100',
      iconBg: 'bg-emerald-200/80 text-emerald-900',
      arrowColor: 'text-emerald-600',
    },
    {
      id: 'go_back',
      title: 'I want to change something / Go back',
      subtitle: 'Return to previous step with 0 data loss',
      icon: RotateCcw,
      bg: 'bg-amber-50/70 hover:bg-amber-100/70',
      border: 'border-amber-100',
      iconBg: 'bg-amber-200/80 text-amber-900',
      arrowColor: 'text-amber-600',
    },
    {
      id: 'explain_page',
      title: 'What does this page mean?',
      subtitle: 'Nira explains current screen in simple words',
      icon: HelpCircle,
      bg: 'bg-slate-50 hover:bg-slate-100',
      border: 'border-slate-200',
      iconBg: 'bg-slate-200 text-slate-800',
      arrowColor: 'text-slate-600',
    },
  ];

  const filteredOptions = searchFilter.trim()
    ? options.filter(
        (o) =>
          o.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
          o.subtitle.toLowerCase().includes(searchFilter.toLowerCase())
      )
    : options;

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
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Voice SOS Help */}
        <div className="p-2.5 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border border-purple-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-purple-600 text-white flex items-center justify-center">
              <Volume2 className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs font-bold text-purple-950 block leading-tight">
                Hands-Free Audio Help
              </span>
              <span className="text-[10px] text-purple-700">
                Listen to Nira explain what to do right now
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleAction('explain_page')}
            className="px-2.5 py-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0"
          >
            Listen
          </button>
        </div>

        {/* Search quick filter */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Type what you need help with..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
          />
        </div>

        {/* Quick Options */}
        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-0.5">
          <p className="text-xs font-bold text-slate-700">What are you stuck with?</p>

          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => {
              const IconComponent = opt.icon;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleAction(opt.id)}
                  className={`w-full p-3 rounded-2xl ${opt.bg} border ${opt.border} text-left flex items-center justify-between group transition-all cursor-pointer`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div
                      className={`w-8 h-8 rounded-xl ${opt.iconBg} flex items-center justify-center shrink-0`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-slate-900 block truncate">
                        {opt.title}
                      </span>
                      <span className="text-[11px] text-slate-500 block truncate">
                        {opt.subtitle}
                      </span>
                    </div>
                  </div>
                  <ArrowRight
                    className={`w-4 h-4 ${opt.arrowColor} group-hover:translate-x-0.5 transition-transform shrink-0`}
                  />
                </button>
              );
            })
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 text-center space-y-1">
              <p className="text-xs font-semibold text-slate-600">
                No matching option found for "{searchFilter}"
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  sendNiraQuery(`I need help with: ${searchFilter}`);
                }}
                className="text-xs font-bold text-purple-700 hover:underline"
              >
                Ask Nira AI directly →
              </button>
            </div>
          )}
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
