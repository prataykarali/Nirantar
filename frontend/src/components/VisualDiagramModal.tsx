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
              id: 'explain',
              stepNumber: 4,
              title: 'Nirantar Explain & Plain English Breakdown',
              subtitle: 'Progressive 3-level clarification for GNWL, RAC & PQWL codes',
              icon: Sparkles,
              status: 'active',
              details: [
                '1. Quick Definition: Plain English meaning without jargon',
                '2. For You: Personalized position clearance (42 ➔ 2) & odds (98%)',
                '3. Deep Dive: Destination Quota balance & corridor algorithm',
              ],
            },
          ],
          takeaway: 'GPS updates run at 1-second precision with live platform, coach berth matrix, and plain English ticket intelligence.',
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
              status: 'completed',
              details: ['Strict credential exclusion', '1-click autofill'],
            },
            {
              id: 'step4',
              stepNumber: 4,
              title: '4. Safe Payment & DigiLocker e-Ticket',
              subtitle: '0-PIN Citizen Wallet and tamper-proof PNR issuance',
              icon: Ticket,
              status: 'completed',
              details: ['Instant PNR generation', 'DigiLocker verified credentials'],
            },
            {
              id: 'step5',
              stepNumber: 5,
              title: '5. Live Radar, Zero-Seat Alert & Nirantar Explain',
              subtitle: 'Satellite telemetry and plain English railway knowledge (GNWL/RAC)',
              icon: Radio,
              status: 'active',
              details: ['Zero-seat platform alerts & capacity forecast', 'GNWL/RAC 3-level progressive plain English explain'],
            },
          ],
          takeaway: 'All citizen actions are verified through strict allowlists and zero-PII security policies.',
        };
    }
  };

  const diagram = getPageDiagram();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200 font-sans select-none">
      <div className="relative bg-gradient-to-br from-[#FAF5FF] via-white to-[#F5F3FF] text-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border-2 border-purple-300/80 overflow-hidden space-y-4 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Background Decorative Pattern & Station Image */}
        <div className="absolute top-0 right-0 left-0 h-36 overflow-hidden pointer-events-none opacity-25">
          <img
            src="/assets/images/hero_station_bg.jpg"
            alt="Station Background"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/40 via-purple-600/30 to-transparent" />
        </div>

        {/* Modal Header with 3D Characters */}
        <div className="relative p-5 pb-3 border-b border-purple-100 flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative flex -space-x-3 shrink-0">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 border-2 border-purple-400 p-0.5 shadow-md flex items-center justify-center overflow-hidden">
                <img
                  src="/assets/images/characters/nira_wave.png"
                  alt="Nira AI Copilot"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border-2 border-amber-400 p-0.5 shadow-md flex items-center justify-center overflow-hidden">
                <img
                  src="/assets/images/characters/citizen_wave.png"
                  alt="Ananya Traveler"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  {diagram.title}
                </h2>
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-purple-100 text-[#7C3AED] border border-purple-300">
                  {diagram.badge}
                </span>
              </div>
              <p className="text-xs text-purple-900/80 font-semibold pt-0.5">
                {diagram.subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-purple-100 hover:bg-purple-200 text-purple-700 flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-xs active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Friendly AI Bubble Banner */}
        <div className="px-5 shrink-0">
          <div className="p-2.5 rounded-2xl bg-purple-100/70 border border-purple-200/80 flex items-center gap-2.5 shadow-xs">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0 animate-bounce" />
            <p className="text-xs text-purple-950 font-medium">
              <strong className="text-purple-800 font-bold">Nira says:</strong> "Here is how this page guides your journey to a confirmed seat with zero confusion!"
            </p>
          </div>
        </div>

        {/* Visual Workflow Steps (Scrollable Container) */}
        <div className="space-y-3 px-5 overflow-y-auto flex-1 py-1">
          {diagram.steps.map((step) => {
            const Icon = step.icon;
            const isCompleted = step.status === 'completed';
            const isActive = step.status === 'active';

            return (
              <div
                key={step.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isActive
                    ? 'bg-white border-[#7C3AED] shadow-md shadow-purple-500/10 ring-2 ring-purple-400/40'
                    : isCompleted
                    ? 'bg-emerald-50/70 border-emerald-300 text-slate-800'
                    : 'bg-white/60 border-purple-100 text-slate-500'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs shadow-xs ${
                      isActive
                        ? 'bg-gradient-to-br from-[#7C3AED] to-[#9333EA] text-white shadow-purple-500/30'
                        : isCompleted
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs sm:text-sm text-slate-900">
                        {step.title}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isActive
                            ? 'bg-purple-100 text-[#7C3AED] border border-purple-300'
                            : isCompleted
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {isActive ? 'Current Step' : isCompleted ? 'Completed' : 'Upcoming'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 font-medium">
                      {step.subtitle}
                    </p>

                    {/* Step Details Bullet Points */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {step.details.map((detail, dIdx) => (
                        <span
                          key={dIdx}
                          className="text-[10px] px-2 py-0.5 rounded-lg bg-purple-50/80 border border-purple-200/70 text-purple-900 font-semibold"
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
        <div className="p-4 bg-gradient-to-r from-purple-50 via-indigo-50 to-emerald-50 border-t border-purple-200/70 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold text-slate-700">{diagram.takeaway}</span>
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:from-[#6D28D9] hover:to-[#7E22CE] text-white font-black text-xs shadow-md shadow-purple-500/20 transition-all cursor-pointer shrink-0 active:scale-95 flex items-center justify-center gap-1.5"
          >
            <span>Understood, Continue ➔</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VisualDiagramModal;
