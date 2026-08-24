import React from 'react';
import {
  X,
  MapPin,
  Train,
  User,
  CreditCard,
  Ticket,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Compass,
  Radio,
  Clock,
  HelpCircle,
} from 'lucide-react';
import { useJourney } from '../context/JourneyContext';

interface VisualDiagramModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DiagramStep {
  id: string;
  stepNumber: number;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'completed' | 'active' | 'upcoming';
  details: string[];
}

export const VisualDiagramModal: React.FC<VisualDiagramModalProps> = ({ isOpen, onClose }) => {
  const { activePage, navigateTo, bookingState, paymentState, selectedTrain } = useJourney();

  if (!isOpen) return null;

  // Generate screen-specific visual diagrams
  const getPageDiagram = (): {
    title: string;
    subtitle: string;
    badge: string;
    steps: DiagramStep[];
    takeaway: string;
  } => {
    switch (activePage) {
      case 'home':
      case 'discover':
        return {
          title: 'Journey Planning & Intent Flow',
          subtitle: 'How Nirantar converts your voice or text into guaranteed train seats.',
          badge: 'Search & Match Engine',
          steps: [
            {
              id: 'intent',
              stepNumber: 1,
              title: 'Natural Intent Extraction',
              subtitle: 'Voice or text query (e.g. "Delhi to Mumbai tomorrow evening")',
              icon: Sparkles,
              status: 'active',
              details: ['Station code mapping (NDLS ➔ CSMT)', 'Date & time preference resolver', 'Class quota detection (3A / Tatkal)'],
            },
            {
              id: 'search',
              stepNumber: 2,
              title: 'Live Train Schedule Query',
              subtitle: 'Multi-threaded query against 550+ scheduled express trains',
              icon: Train,
              status: 'upcoming',
              details: ['Direct & connecting route ranking', 'Live seat availability confirmation', 'Fair access queue admission'],
            },
            {
              id: 'pax',
              stepNumber: 3,
              title: 'Zero-PII Passenger Workspace',
              subtitle: 'Safe autofill without storing passwords or financial PINs',
              icon: User,
              status: 'upcoming',
              details: ['Name, age, gender slot allocation', 'Berth & meal preference', 'DigiLocker identity cross-check'],
            },
            {
              id: 'pay',
              stepNumber: 4,
              title: 'Idempotent Payment & Ticket',
              subtitle: 'Instant Citizen Wallet debit or bank bridge with zero double-deduction',
              icon: Ticket,
              status: 'upcoming',
              details: ['₹10,000 Citizen Wallet or UPI', 'Statutory PNR #2847 5896 1234', 'DigiLocker verified PDF issuance'],
            },
          ],
          takeaway: 'Nirantar eliminates 7 manual IRCTC dropdowns with a single conversational intent.',
        };

      case 'trains':
      case 'results':
        return {
          title: 'Train Comparison & Selection Architecture',
          subtitle: 'Evaluating speed, on-time percentage, and seat availability.',
          badge: 'Train Selection Step',
          steps: [
            {
              id: 'intent',
              stepNumber: 1,
              title: 'Origin ➔ Destination Match',
              subtitle: 'Verified route corridor',
              icon: MapPin,
              status: 'completed',
              details: ['Confirmed route availability', 'Real-time schedule check'],
            },
            {
              id: 'filter',
              stepNumber: 2,
              title: 'Multi-Criteria Train Evaluation',
              subtitle: 'Comparing 10+ express, Rajdhani & Vande Bharat options',
              icon: Train,
              status: 'active',
              details: ['⚡ Fastest duration filter', '💰 Lowest fare comparison', '🛏️ Coach class selection (1A, 2A, 3A, SL)'],
            },
            {
              id: 'lock',
              stepNumber: 3,
              title: 'Coach & Berth Lock',
              subtitle: 'Select your preferred train and class to reserve seating',
              icon: ShieldCheck,
              status: 'upcoming',
              details: ['Direct reservation lock', 'Pantry & catering opt-in'],
            },
            {
              id: 'checkout',
              stepNumber: 4,
              title: 'Passenger & Payment Handshake',
              subtitle: 'Proceed with selected train parameters',
              icon: ArrowRight,
              status: 'upcoming',
              details: ['Seamless workspace navigation', 'Preserved booking state'],
            },
          ],
          takeaway: 'Every train card displays real-time on-time ratings, speed, and confirmed fare totals.',
        };

      case 'workspace':
      case 'booking':
        return {
          title: 'Passenger Verification & Safety Architecture',
          subtitle: 'Zero-PII data redaction and safe passenger profile assignment.',
          badge: 'Passenger Workspace Step',
          steps: [
            {
              id: 'train-lock',
              stepNumber: 1,
              title: 'Selected Train Locked',
              subtitle: selectedTrain ? `${selectedTrain.trainName} (#${selectedTrain.trainNumber})` : 'Express Train Locked',
              icon: Train,
              status: 'completed',
              details: ['Travel date locked', 'Seat class locked'],
            },
            {
              id: 'pax-fill',
              stepNumber: 2,
              title: 'Zero-PII Passenger Assignment',
              subtitle: 'Only permissible travel fields are extracted by AI',
              icon: User,
              status: 'active',
              details: ['Name, age, gender assigned', 'Lower/Window berth preference', 'Strict exclusion of passwords & PINs'],
            },
            {
              id: 'catering',
              stepNumber: 3,
              title: 'Catering & Concession Check',
              subtitle: 'Opt-in/Opt-out catering meals and senior citizen allocation',
              icon: Sparkles,
              status: 'upcoming',
              details: ['FSSAI approved meals', 'Senior citizen lower berth priority'],
            },
            {
              id: 'review',
              stepNumber: 4,
              title: 'Pre-Payment Verification',
              subtitle: 'Final inspection before funds authorization',
              icon: ShieldCheck,
              status: 'upcoming',
              details: ['0 hidden convenience charges', '1-click return without data loss'],
            },
          ],
          takeaway: 'Nirantar redacts all sensitive financial credentials before communicating with AI models.',
        };

      case 'payment':
        return {
          title: 'Payment Bridge & Double-Verification Architecture',
          subtitle: 'Bank-level isolation, zero double-charge guarantee, and auto-recovery.',
          badge: 'Payment Bridge Step',
          steps: [
            {
              id: 'booking-data',
              stepNumber: 1,
              title: 'Verified Booking Payload',
              subtitle: 'Train, passengers, and fare locked in tamper-proof session',
              icon: CheckCircle2,
              status: 'completed',
              details: ['Server-authoritative state', 'Unique idempotency transaction key'],
            },
            {
              id: 'pay-method',
              stepNumber: 2,
              title: 'Method Selection & 0-PIN Wallet',
              subtitle: 'Choose ₹10,000 Citizen Wallet, UPI QR, Net Banking, or Cards',
              icon: CreditCard,
              status: 'active',
              details: ['Instant 0-PIN wallet checkout', 'Encrypted 256-bit NPCI/Bank bridge', 'Isolated from AI context'],
            },
            {
              id: 'ledger',
              stepNumber: 3,
              title: 'Idempotent Ledger Verification',
              subtitle: 'Guarantees no double debit even on network timeout',
              icon: ShieldCheck,
              status: 'upcoming',
              details: ['Success: instant e-Ticket', 'Failed: preserve data & 1-tap retry', 'Unknown: pause payment & verify ledger'],
            },
            {
              id: 'ticket-gen',
              stepNumber: 4,
              title: 'DigiLocker e-Ticket Issuance',
              subtitle: 'Cryptographically signed ticket with QR code and PNR',
              icon: Ticket,
              status: 'upcoming',
              details: ['Official Railway PNR generated', 'Automatic DigiLocker sync'],
            },
          ],
          takeaway: 'If connection drops during payment, your booking details remain preserved on Step 4.',
        };

      case 'track':
        return {
          title: 'Live GPS Satellite Radar Architecture',
          subtitle: 'Direct telemetry link to Indian Railways RTIS satellite transponders.',
          badge: 'Live Radar Step',
          steps: [
            {
              id: 'sat',
              stepNumber: 1,
              title: 'ISRO/RTIS Satellite Feed',
              subtitle: 'High-frequency GPS locational updates',
              icon: Radio,
              status: 'completed',
              details: ['Train loco telemetry', 'Speedometer tracking (110-130 km/h)'],
            },
            {
              id: 'speed',
              stepNumber: 2,
              title: 'Real-Time Speed & Delay Engine',
              subtitle: 'Calculates arrival ETA and delay predictions',
              icon: Clock,
              status: 'active',
              details: ['Speed curve calculation', 'Real-time delay estimator'],
            },
            {
              id: 'station',
              stepNumber: 3,
              title: 'Station Approaching Timelines',
              subtitle: 'Shows distance, platform numbers, and deboarding door direction',
              icon: MapPin,
              status: 'upcoming',
              details: ['Upcoming station timeline', 'Platform # guidance & Left/Right door alert'],
            },
            {
              id: 'chimes',
              stepNumber: 4,
              title: 'Acoustic Indian Railway Chimes',
              subtitle: 'Real platform chime sound on station entry',
              icon: Sparkles,
              status: 'upcoming',
              details: ['Authentic IR announcement tone', 'Next halt audio alert'],
            },
          ],
          takeaway: 'GPS updates run at 1-second precision with live platform and door direction alerts.',
        };

      default:
        return {
          title: 'Nirantar End-to-End Civic Architecture',
          subtitle: 'How Nirantar orchestrates natural intent, train booking, and citizen security.',
          badge: 'System Architecture',
          steps: [
            {
              id: 'step1',
              stepNumber: 1,
              title: '1. Intent & Discovery',
              subtitle: 'Conversational railway planning',
              icon: Sparkles,
              status: 'completed',
              details: ['Origin & Destination parser', 'Language & Dialect support'],
            },
            {
              id: 'step2',
              stepNumber: 2,
              title: '2. Train Match & Selection',
              subtitle: '550+ real train routes with live availability',
              icon: Train,
              status: 'completed',
              details: ['Fair access queue management', 'Real-time price & duration ranking'],
            },
            {
              id: 'step3',
              stepNumber: 3,
              title: '3. Zero-PII Passenger Workspace',
              subtitle: 'Tamper-proof identity and preference matching',
              icon: User,
              status: 'active',
              details: ['Strict credential exclusion', '1-click autofill'],
            },
            {
              id: 'step4',
              stepNumber: 4,
              title: '4. Safe Payment & DigiLocker e-Ticket',
              subtitle: '0-PIN Citizen Wallet and live GPS tracking',
              icon: Ticket,
              status: 'upcoming',
              details: ['Instant PNR generation', 'Live GPS radar companion'],
            },
          ],
          takeaway: 'All citizen actions are verified through strict allowlists and zero-PII security policies.',
        };
    }
  };

  const diagram = getPageDiagram();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200 font-sans select-none">
      <div className="bg-slate-900 text-white rounded-3xl max-w-2xl w-full shadow-2xl border border-purple-500/30 overflow-hidden space-y-4 p-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-400/40 flex items-center justify-center font-bold shadow-xs">
              <Compass className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white leading-tight">
                  {diagram.title}
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-500/40">
                  {diagram.badge}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium pt-0.5">
                {diagram.subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Visual Workflow Steps */}
        <div className="space-y-3 pt-1">
          {diagram.steps.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = step.status === 'completed';
            const isActive = step.status === 'active';

            return (
              <div
                key={step.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isActive
                    ? 'bg-purple-950/60 border-purple-400/50 shadow-md shadow-purple-900/30 ring-1 ring-purple-400/40'
                    : isCompleted
                    ? 'bg-slate-800/60 border-emerald-500/30 text-slate-300'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-md animate-pulse'
                        : isCompleted
                        ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-400/40'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Icon className="w-4 h-4" />}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs sm:text-sm text-white">
                        {step.title}
                      </span>
                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-400/40'
                            : isCompleted
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {isActive ? 'CURRENT STEP' : isCompleted ? 'VERIFIED' : 'UPCOMING'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 font-medium">
                      {step.subtitle}
                    </p>

                    {/* Step Details Bullet Points */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {step.details.map((detail, dIdx) => (
                        <span
                          key={dIdx}
                          className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300 font-mono"
                        >
                          • {detail}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Takeaway Footer */}
        <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-200">
          <span className="flex items-center gap-1.5 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{diagram.takeaway}</span>
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs transition-all cursor-pointer shrink-0 ml-2"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};

export default VisualDiagramModal;
