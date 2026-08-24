import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  Lock,
  CreditCard,
  Building2,
  Wallet,
  QrCode,
  ShieldCheck,
  Clock,
  Zap,
  Headphones,
  Mic,
  Send,
  MoreVertical,
  HelpCircle,
  Calendar,
  Sparkles,
  ExternalLink,
  User,
} from 'lucide-react';
import { useJourney } from '../context/JourneyContext';

import { PaymentGatewayModal } from '../components/payment/PaymentGatewayModal';

type PaymentTab = 'upi' | 'cards' | 'netbanking' | 'wallets';

export const PaymentBridgePage: React.FC = () => {
  const {
    searchParams,
    selectedTrain,
    selectedClassCode,
    passengers,
    navigateTo,
    paymentState,
    paymentAttempt,
    initiatePayment,
    verifyPaymentStatus,
    triggerMockPaymentResult,
  } = useJourney();

  const [activeTab, setActiveTab] = useState<PaymentTab>('upi');
  const [upiId, setUpiId] = useState('ananya@okhdfcbank');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showGatewayModal, setShowGatewayModal] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [faqAnswer, setFaqAnswer] = useState<string | null>(null);

  // Train data
  const train = selectedTrain || {
    trainNumber: '12951',
    trainName: 'Mumbai Rajdhani',
    fromStationName: searchParams.fromStation.name || 'New Delhi',
    fromStationCode: searchParams.fromStation.code || 'NDLS',
    toStationName: searchParams.toStation.name || 'Mumbai Central',
    toStationCode: searchParams.toStation.code || 'MMCT',
    departureTime: '16:55',
    arrivalTime: '08:40',
    durationHours: '15h 45m',
    classes: [{ classCode: '3A', className: 'AC 3 Tier', fare: 2990, status: 'AVAILABLE', availableSeats: 48 }],
  };

  const selectedClass = train.classes.find((c) => c.classCode === selectedClassCode) || train.classes[0] || {
    classCode: '3A',
    className: 'AC 3 Tier',
    fare: 2990,
  };

  const adultFare = 2990 * Math.max(1, passengers.length);
  const reservationCharges = 50;
  const superfastCharges = 40;
  const gstCharges = 40;
  const totalAmount = adultFare + reservationCharges + superfastCharges + gstCharges;

  const handlePay = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const method = activeTab === 'upi' ? 'UPI' : activeTab === 'cards' ? 'CARD' : activeTab === 'netbanking' ? 'NET_BANKING' : 'WALLET';
    await initiatePayment(method, totalAmount);
    setShowGatewayModal(true);
  };

  const handleSimulateState = async (state: 'SUCCESS' | 'FAILED' | 'UNKNOWN') => {
    if (!paymentAttempt) {
      await initiatePayment('UPI', totalAmount);
    }
    const res = await triggerMockPaymentResult(state);
    if (state === 'SUCCESS' && (res?.state === 'BOOKING_CONFIRMED' || res?.state === 'SUCCESS')) {
      navigateTo('ticket');
    }
  };

  const handleVerifyUnknown = async () => {
    setIsProcessing(true);
    const res = await verifyPaymentStatus();
    setIsProcessing(false);
    if (res?.state === 'SUCCESS' || res?.state === 'BOOKING_CONFIRMED') {
      navigateTo('ticket');
    }
  };

  const handleFaqClick = (question: string, answer: string) => {
    setFaqAnswer(answer);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-3 pb-3 select-none font-sans text-slate-800">
      {/* ═══════════════════════════════════════════════════════════════════
          1. TOP HEADER & 6-STEP PAYMENT PROGRESS BAR
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigateTo('booking')}
              className="w-8 h-8 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-900 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Back to Booking"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                Payment
              </h1>
              <p className="text-xs font-semibold text-slate-500">
                Secure payments. Hassle-free booking.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => console.log('📞 Nirantar 24x7 Priority Railway Helpline: 139')}
              className="px-3 py-1 rounded-full border border-purple-200 text-purple-900 hover:bg-purple-50 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-purple-700" />
              <span>Need help?</span>
            </button>
          </div>
        </div>

        {/* 6-Step Stepper matching reference */}
        <div className="flex items-center justify-between max-w-2xl mx-auto px-4 py-1 text-xs">
          {[
            { label: 'Search', done: true },
            { label: 'Select Train', done: true },
            { label: 'Booking Details', done: true },
            { label: 'Autofill & Review', done: true },
          ].map((s, idx) => (
            <React.Fragment key={idx}>
              <div className="flex flex-col items-center gap-1">
                <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                  <Check className="w-3 h-3" />
                </div>
                <span className="text-[11px] font-semibold text-slate-600 truncate max-w-[85px] text-center">
                  {s.label}
                </span>
              </div>
              <div className="flex-1 h-0.5 bg-emerald-400 mx-2" />
            </React.Fragment>
          ))}

          {/* Step 5: Payment (Active) */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-5 h-5 rounded-full bg-purple-700 text-white flex items-center justify-center text-[10px] font-bold shadow-md shadow-purple-600/30 ring-4 ring-purple-100">
              5
            </div>
            <span className="text-[11px] font-bold text-purple-900">Payment</span>
          </div>
          <div className="flex-1 h-0.5 bg-slate-200 mx-2" />

          {/* Step 6: Confirmation */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-300 text-slate-400 flex items-center justify-center text-[10px] font-bold">
              6
            </div>
            <span className="text-[11px] font-medium text-slate-400">Confirmation</span>
          </div>
        </div>
      </div>

      {/* PAYMENT STATE MACHINE BANNER & UNKNOWN RECOVERY */}
      {paymentState === 'UNKNOWN' && (
        <div className="rounded-2xl bg-amber-50 border-2 border-amber-300 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 font-bold text-sm">
              ⚠️
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-950">Payment Status Uncertain — Don't pay again!</h4>
              <p className="text-[11px] text-amber-800 font-medium mt-0.5">
                We couldn't confirm your transaction from your bank yet. To prevent double deduction, please verify status instead of retrying.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleVerifyUnknown}
            disabled={isProcessing}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 transition-all cursor-pointer shadow-sm"
          >
            {isProcessing ? 'Verifying with Bank...' : 'Check Payment Status →'}
          </button>
        </div>
      )}

      {paymentState === 'FAILED' && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-3 flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-red-800">
            <span className="text-sm">❌</span>
            <span>Payment could not be completed. No amount was deducted. You may retry or choose a different payment option.</span>
          </div>
          <button
            type="button"
            onClick={() => handlePay()}
            className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors shrink-0"
          >
            Retry Payment
          </button>
        </div>
      )}

      {/* DEMO / REVIEWER STATE MACHINE CONTROLLER */}
      <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-purple-50/60 border border-purple-100 text-[11px] text-purple-950 font-semibold">
        <div className="flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-purple-700" />
          <span>Payment Security: Credentials isolated from AI context</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Demo State Controls:</span>
          <button
            type="button"
            onClick={() => handleSimulateState('SUCCESS')}
            className="px-2 py-0.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-bold transition-colors cursor-pointer"
          >
            ✓ Success
          </button>
          <button
            type="button"
            onClick={() => handleSimulateState('UNKNOWN')}
            className="px-2 py-0.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-bold transition-colors cursor-pointer"
          >
            ⚠️ Unknown
          </button>
          <button
            type="button"
            onClick={() => handleSimulateState('FAILED')}
            className="px-2 py-0.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 text-[10px] font-bold transition-colors cursor-pointer"
          >
            ✕ Fail
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          2. MAIN 3-COLUMN LAYOUT MATCHING REFERENCE
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* ──────────────── COLUMN 1: PAYMENT METHOD SELECTOR & QR (5 Cols) ──────────────── */}
        <div className="lg:col-span-5 bg-white rounded-[24px] p-4 shadow-sm border border-purple-100 space-y-3.5">
          <h2 className="text-sm font-bold text-slate-900">
            Choose a payment method
          </h2>

          {/* 4 Payment Method Tabs */}
          <div className="grid grid-cols-4 gap-1.5 p-1 rounded-2xl bg-purple-50/50 border border-purple-100">
            <button
              type="button"
              onClick={() => setActiveTab('upi')}
              className={`py-2 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                activeTab === 'upi'
                  ? 'bg-white text-purple-950 shadow-sm border border-purple-600 ring-1 ring-purple-600'
                  : 'text-slate-600 hover:text-purple-900'
              }`}
            >
              <div className="w-4 h-3 bg-gradient-to-r from-orange-500 via-white to-emerald-500 rounded-sm border border-slate-300 shrink-0" />
              <span>UPI</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('cards')}
              className={`py-2 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                activeTab === 'cards'
                  ? 'bg-white text-purple-950 shadow-sm border border-purple-600 ring-1 ring-purple-600'
                  : 'text-slate-600 hover:text-purple-900'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('netbanking')}
              className={`py-2 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                activeTab === 'netbanking'
                  ? 'bg-white text-purple-950 shadow-sm border border-purple-600 ring-1 ring-purple-600'
                  : 'text-slate-600 hover:text-purple-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span className="truncate">Net Banking</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('wallets')}
              className={`py-2 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                activeTab === 'wallets'
                  ? 'bg-white text-purple-950 shadow-sm border border-purple-600 ring-1 ring-purple-600'
                  : 'text-slate-600 hover:text-purple-900'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Wallets</span>
            </button>
          </div>

          {/* UPI Scan & Pay Area */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center pt-1">
            {/* Left QR Box */}
            <div className="flex flex-col items-center text-center space-y-1.5 p-2 rounded-2xl bg-purple-50/30 border border-purple-100">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">Scan & pay</h3>
                <p className="text-[10px] text-slate-500 font-medium">Scan any UPI QR to pay securely</p>
              </div>

              {/* QR Code Container with interactive hover */}
              <div
                onClick={handlePay}
                className="w-36 h-36 bg-white rounded-2xl p-2.5 border border-purple-200 shadow-sm relative flex items-center justify-center cursor-pointer group hover:border-purple-600 transition-all"
                title="Click QR to simulate instant mobile scan"
              >
                <div className="w-full h-full relative flex items-center justify-center">
                  <QrCode className="w-full h-full text-slate-900 group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 m-auto w-7 h-7 bg-white rounded-lg p-0.5 shadow-md flex items-center justify-center border border-purple-100">
                    <div className="w-5 h-4 bg-gradient-to-r from-orange-500 via-white to-emerald-500 rounded-sm" />
                  </div>
                </div>
              </div>

              {/* Supported apps */}
              <div className="space-y-0.5 pt-1">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Accepted on</span>
                <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-slate-600">
                  <span className="text-blue-600">G Pay</span>
                  <span>•</span>
                  <span className="text-purple-700">PhonePe</span>
                  <span>•</span>
                  <span className="text-sky-600">Paytm</span>
                  <span>•</span>
                  <span className="text-orange-600">BHIM</span>
                </div>
                <span className="text-[9px] text-slate-400">& more</span>
              </div>
            </div>

            {/* Right OR & Enter UPI ID */}
            <div className="space-y-3">
              <div className="text-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">OR</span>
              </div>

              <form onSubmit={handlePay} className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Enter UPI ID
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="name@upi"
                  className="w-full bg-purple-50/40 border border-purple-100 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white"
                  required
                />

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isProcessing ? 'Processing...' : `Pay ₹${totalAmount.toLocaleString('en-IN')}`}</span>
                </button>
              </form>

              {/* 100% Secure badge */}
              <div className="bg-emerald-50/80 rounded-xl p-2 px-2.5 border border-emerald-200 flex items-center gap-2 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="space-y-0.2">
                  <span className="font-bold text-emerald-950 block text-[11px]">
                    100% secure payments
                  </span>
                  <span className="text-[10px] text-emerald-800 font-medium">
                    Your data is safe with us
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ──────────────── COLUMN 2: TRIP SUMMARY (4 Cols) ──────────────── */}
        <div className="lg:col-span-4 bg-white rounded-[24px] p-4 shadow-sm border border-purple-100 space-y-3">
          <div className="flex items-center justify-between border-b border-purple-50 pb-2">
            <h3 className="text-sm font-bold text-slate-900">Trip summary</h3>
            <MoreVertical className="w-4 h-4 text-slate-400 cursor-pointer" />
          </div>

          {/* 3D Train Banner Image */}
          <div className="w-full h-24 rounded-2xl overflow-hidden shadow-inner border border-purple-100 bg-purple-50">
            <img
              src="/assets/images/trip_summary_train_banner.png"
              alt="Trip Train"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Train & Route Details */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold text-slate-900">
                {train.trainNumber} • {train.trainName}
              </span>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                {selectedClass.className || 'AC 3 Tier'}
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-500 block">
              {train.fromStationCode} → {train.toStationCode}
            </span>
          </div>

          {/* Schedule details */}
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 bg-purple-50/40 p-2 rounded-xl">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-purple-700" />
              <span>24 May, Sat</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-purple-700" />
              <span>{train.departureTime} → {train.arrivalTime}</span>
            </div>
            <div className="flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-purple-700" />
              <span>{passengers.length} Adult</span>
            </div>
          </div>

          {/* Itemized Fare Breakdown */}
          <div className="space-y-1.5 text-xs pt-1 border-t border-purple-50">
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-[11px]">Adult Fare</span>
              <span className="font-semibold text-slate-900">₹{adultFare.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-[11px]">Reservation Charges</span>
              <span className="font-semibold text-slate-900">₹{reservationCharges}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-[11px]">Superfast Charges</span>
              <span className="font-semibold text-slate-900">₹{superfastCharges}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-[11px]">GST</span>
              <span className="font-semibold text-slate-900">₹{gstCharges}</span>
            </div>

            <div className="border-t border-purple-100 pt-1.5 flex items-center justify-between text-sm font-bold text-purple-950">
              <span>Total Amount</span>
              <span className="text-base sm:text-lg font-bold text-[#7C3AED]">₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Free Cancellation Note */}
          <div className="bg-emerald-50/80 rounded-xl p-2 px-2.5 border border-emerald-200 flex items-center gap-2 text-xs">
            <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold text-emerald-950 block text-[11px]">
                Free cancellation
              </span>
              <span className="text-[10px] text-emerald-800 font-medium">
                Full refund on cancellation before chart preparation.
              </span>
            </div>
          </div>
        </div>

        {/* ──────────────── COLUMN 3: INTERACTIVE NIRA ASSISTANT (3 Cols) ──────────────── */}
        <div className="lg:col-span-3 bg-gradient-to-b from-[#F3EDFD] via-[#EFE7FD] to-[#EBE2FC] rounded-[24px] p-3.5 border border-purple-100 shadow-sm space-y-2.5 text-center">
          {/* Header */}
          <div className="flex items-center justify-between text-xs font-bold text-purple-900">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-700" />
              <span>Nira</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-purple-600 cursor-pointer" />
            </div>
          </div>

          {/* Ananya Character Support Cutout (Clean 3D Transparent) */}
          <div className="w-28 h-28 mx-auto flex items-center justify-center pointer-events-none">
            <img
              src="/assets/images/characters/citizen_thinking.png"
              alt="Ananya Support"
              className="w-full h-full object-contain drop-shadow-md"
            />
          </div>

          {/* Speech Bubble */}
          <div className="bg-white rounded-2xl p-2.5 shadow-sm border border-purple-100 text-left">
            <span className="text-xs font-bold text-purple-950 block">You're all set!</span>
            <p className="text-[11px] text-slate-600 font-medium leading-tight mt-0.5">
              I'll help you complete the payment safely.
            </p>
          </div>

          {/* Contextual FAQs */}
          <div className="space-y-1.5 text-left">
            {[
              { q: 'Is this payment safe?', a: 'Yes, 100% bank-grade encryption with zero credential storage.' },
              { q: 'What if payment fails?', a: 'Zero-deduction auto refund initiates immediately within 15 minutes.' },
              { q: 'Can I get instant confirmation?', a: 'Yes, instant PNR allotment & SMS e-ticket dispatched in seconds.' },
              { q: 'What happens after payment?', a: 'Your confirmed digital ticket with coach/seat will appear on screen.' },
            ].map((faq, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleFaqClick(faq.q, faq.a)}
                className="w-full p-2 rounded-xl bg-white/90 hover:bg-white border border-purple-100 text-left text-[11px] font-semibold text-purple-950 flex items-center gap-1.5 shadow-2xs hover:border-purple-300 transition-all cursor-pointer"
              >
                <HelpCircle className="w-3 h-3 text-purple-700 shrink-0" />
                <span className="truncate">{faq.q}</span>
              </button>
            ))}
          </div>

          {faqAnswer && (
            <div className="p-2 rounded-xl bg-purple-100/90 text-[10px] text-purple-950 font-semibold text-left animate-in fade-in">
              {faqAnswer}
            </div>
          )}

          {/* Conversational Input */}
          <div className="relative pt-1">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Ask Nira anything..."
              className="w-full bg-white border border-purple-200 rounded-xl pl-3 pr-8 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-purple-600 shadow-sm"
            />
            <button
              type="button"
              onClick={() => {
                if (chatMessage.trim()) {
                  setFaqAnswer(`Nira: I'm here to assist with "${chatMessage}". Your booking is protected.`);
                  setChatMessage('');
                }
              }}
              className="absolute right-2 top-2.5 w-5 h-5 rounded-full bg-purple-700 text-white flex items-center justify-center cursor-pointer hover:bg-purple-800"
            >
              <Mic className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          3. BOTTOM TRUST FOOTER BAR
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-purple-100 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-slate-800 block text-xs">Secure & Encrypted</span>
            <span className="text-[10px] text-slate-400 font-medium">Bank-grade security</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Lock className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-slate-800 block text-xs">No Hidden Charges</span>
            <span className="text-[10px] text-slate-400 font-medium">Transparent pricing</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-slate-800 block text-xs">Instant Confirmation</span>
            <span className="text-[10px] text-slate-400 font-medium">Get ticket within seconds</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Headphones className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-slate-800 block text-xs">24x7 Support</span>
            <span className="text-[10px] text-slate-400 font-medium">We're here to help</span>
          </div>
        </div>
      </div>

      {/* REALISTIC 3D-SECURE PAYMENT GATEWAY OVERLAY MODAL */}
      <PaymentGatewayModal
        isOpen={showGatewayModal}
        onClose={() => setShowGatewayModal(false)}
        amount={totalAmount}
        selectedMethod={activeTab === 'upi' ? 'UPI' : activeTab === 'cards' ? 'CARD' : activeTab === 'netbanking' ? 'NET_BANKING' : 'WALLET'}
        onPaymentSuccess={() => navigateTo('ticket')}
      />
    </div>
  );
};

export default PaymentBridgePage;
