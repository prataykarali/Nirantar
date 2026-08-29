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
  CheckCircle2,
  Compass,
  AlertCircle,
  PhoneCall,
  Clock,
  Train,
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
        break;
      }

      case 'railway_sos': {
        sendNiraQuery(
          "🚨 RAILWAY EMERGENCY SOS: I need official Indian Railways emergency assistance (Medical helpline 139 / Security helpline 182 / RPF on duty / Coach attendant)."
        );
        addNotification({
          title: '🚨 Emergency Railway Helpline 139 / 182',
          body: 'Dial 139 for 24x7 all-India medical/security emergency or RPF assistance.',
          type: 'info',
        });
        break;
      }

      case 'wrong_booking': {
        sendNiraQuery(
          "I booked the wrong date / misspelled a passenger name. How do I change passenger name, date of journey, or boarding point under IRCTC rules?"
        );
        addNotification({
          title: '🎫 Ticket Correction Guide',
          body: 'Boarding point and passenger name transfers can be done up to 24h before chart preparation.',
          type: 'info',
        });
        break;
      }

      case 'late_train': {
        navigateTo('track');
        sendNiraQuery(
          "My train is running late. How do I track live delay, and how do I file a TDR for full refund if the train is delayed over 3 hours?"
        );
        addNotification({
          title: '⏱️ Live Delay & TDR Refund Guide',
          body: 'Full refund without cancellation charges is permitted if train runs > 3 hours late.',
          type: 'info',
        });
        break;
      }

      case 'waitlist_status': {
        navigateTo('track');
        sendNiraQuery(
          "How does waitlist confirmation and RAC chart preparation work on my ticket, and what is my confirmation probability?"
        );
        addNotification({
          title: '📊 Waitlist & Charting Forecast',
          body: 'Live berth clearance forecast and chart preparation rules active.',
          type: 'info',
        });
        break;
      }

      case 'explain_page': {
        const pageExplanations: Record<string, string> = {
          home: 'Please explain what features are on this Home Page and what action I should take next to book a train.',
          discover: 'What can I do on this Discover screen? Please explain the routes and quota options.',
          trains: 'Please explain how to compare trains on this screen and what 1A, 2A, 3A, SL, and RAC confirmation odds mean.',
          booking: 'How do I complete passenger details, select berth preferences, and verify IRCTC ID on this screen?',
          workspace: 'How do I complete passenger details, select berth preferences, and verify IRCTC ID on this screen?',
          payment: 'How does double-verification payment work here, and how can I pay with UPI or Citizen Wallet?',
          completion: 'Please explain my confirmed ticket details, how to download the pass, and how to track this train.',
          track: 'Please explain how the live GPS tracker, platform number, and coach alignment map work on this screen.',
          'my-journeys': 'How do I manage my tickets, cancel a booking, or download invoices in this vault?',
          payments: 'Please explain the payment ledger, ghost charge prevention, and refund audit trail.',
          help: 'What railway guides and assistance tools are available in this Help Center?',
          profile: 'Please explain my citizen profile, avatar options, and saved passenger database.',
        };

        const chatQuery = pageExplanations[activePage] || 'What am I doing on this screen? Please explain what action I should take next.';
        sendNiraQuery(chatQuery);
        break;
      }

      default:
        sendNiraQuery('I need assistance with my current journey step.');
    }
  };

  const options = [
    {
      id: 'railway_sos',
      title: '🚨 Emergency Railway Helpline (139 / 182 / RPF)',
      subtitle: 'Medical assistance, security on train & immediate support',
      icon: PhoneCall,
      bg: 'bg-rose-50/80 hover:bg-rose-100/80',
      border: 'border-rose-200',
      iconBg: 'bg-rose-200/90 text-rose-950 font-black',
      arrowColor: 'text-rose-600',
    },
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
      id: 'wrong_booking',
      title: 'Booked wrong date / Passenger typo',
      subtitle: 'Change boarding station or transfer passenger name',
      icon: AlertCircle,
      bg: 'bg-amber-50/70 hover:bg-amber-100/70',
      border: 'border-amber-100',
      iconBg: 'bg-amber-200/80 text-amber-900',
      arrowColor: 'text-amber-600',
    },
    {
      id: 'late_train',
      title: 'Train running late / File TDR refund',
      subtitle: 'Track live delay & claim full refund if > 3h late',
      icon: Clock,
      bg: 'bg-sky-50/70 hover:bg-sky-100/70',
      border: 'border-sky-100',
      iconBg: 'bg-sky-200/80 text-sky-900',
      arrowColor: 'text-sky-600',
    },
    {
      id: 'waitlist_status',
      title: 'Waitlist clearance & Charting odds',
      subtitle: 'Real-time RAC / GNWL confirmation forecast',
      icon: Train,
      bg: 'bg-teal-50/70 hover:bg-teal-100/70',
      border: 'border-teal-100',
      iconBg: 'bg-teal-200/80 text-teal-900',
      arrowColor: 'text-teal-600',
    },
    {
      id: 'go_back',
      title: 'I want to change something / Go back',
      subtitle: 'Return to previous step with 0 data loss',
      icon: RotateCcw,
      bg: 'bg-slate-50 hover:bg-slate-100',
      border: 'border-slate-200',
      iconBg: 'bg-slate-200 text-slate-800',
      arrowColor: 'text-slate-600',
    },
    {
      id: 'explain_page',
      title: 'What does this page mean?',
      subtitle: 'Nira explains current screen in simple words',
      icon: HelpCircle,
      bg: 'bg-purple-50/40 hover:bg-purple-100/50',
      border: 'border-purple-100',
      iconBg: 'bg-purple-200 text-purple-900',
      arrowColor: 'text-purple-700',
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

        {/* Quick Instant AI SOS Help */}
        <div className="p-2.5 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border border-purple-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-purple-600 text-white flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs font-bold text-purple-950 block leading-tight">
                Instant Step-by-Step AI Guidance
              </span>
              <span className="text-[10px] text-purple-700">
                Let Nira explain what to do on this screen
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleAction('explain_page')}
            className="px-2.5 py-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0"
          >
            Explain Screen
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
