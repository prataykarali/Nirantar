import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
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
  Send,
  MoreVertical,
  HelpCircle,
  Calendar,
  Sparkles,
  ExternalLink,
  User,
  Eye,
  EyeOff,
  KeyRound,
  Smartphone,
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
    walletBalance,
    payWithWallet,
  } = useJourney();

  const [activeTab, setActiveTab] = useState<PaymentTab>('upi');
  const [selectedUpiApp, setSelectedUpiApp] = useState<'gpay' | 'phonepe' | 'paytm' | 'bhim' | 'cred'>('gpay');
  const [upiId, setUpiId] = useState('pratay@okhdfcbank');
  const [upiPin, setUpiPin] = useState('4829');
  const [showUpiPin, setShowUpiPin] = useState(false);

  // NetBanking state
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [netBankingUserId, setNetBankingUserId] = useState('849201948');
  const [netBankingPassword, setNetBankingPassword] = useState('Nirantar@2026');
  const [showNetBankingPassword, setShowNetBankingPassword] = useState(false);
  const [netBankingOtp, setNetBankingOtp] = useState('849201');
  const [showNetBankingOtp, setShowNetBankingOtp] = useState(false);

  // Card state
  const [cardNumber, setCardNumber] = useState('4532 9402 1849 8492');
  const [cardExpiry, setCardExpiry] = useState('08/29');
  const [cardCvv, setCardCvv] = useState('892');
  const [cardHolder, setCardHolder] = useState('Pratay Karali');
  const [cardPassword, setCardPassword] = useState('982');
  const [showCardPassword, setShowCardPassword] = useState(false);

  // Wallet state
  const [selectedWallet, setSelectedWallet] = useState('Amazon Pay');
  const [walletId, setWalletId] = useState('9876543210');
  const [walletPin, setWalletPin] = useState('4829');
  const [showWalletPin, setShowWalletPin] = useState(false);

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

  const unitFare = selectedClass?.fare || 2150;
  const adultFare = unitFare * Math.max(1, passengers.length);
  const reservationCharges = 50;
  const superfastCharges = 40;
  const gstCharges = Math.round(adultFare * 0.05); // 5% GST for IRCTC AC classes
  const totalAmount = adultFare + reservationCharges + superfastCharges + gstCharges;

  const handlePay = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const method = activeTab === 'upi' ? 'UPI' : activeTab === 'cards' ? 'CARD' : activeTab === 'netbanking' ? 'NET_BANKING' : 'WALLET';
    await initiatePayment(method, totalAmount);
    setShowGatewayModal(true);
  };

  const handlePayWithBank = async (bankName?: string) => {
    if (bankName) setSelectedBank(bankName);
    await initiatePayment('NET_BANKING', totalAmount);
    setShowGatewayModal(true);
  };

  const handlePayWithWallet = async () => {
    setIsProcessing(true);
    const res = await payWithWallet(totalAmount);
    setIsProcessing(false);
    if (res && (res.state === 'BOOKING_CONFIRMED' || res.state === 'SUCCESS')) {
      navigateTo('ticket');
    }
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

        {/* 6-Step Stepper matching reference (Desktop/Tablet) */}
        <div className="hidden sm:flex items-center justify-between max-w-2xl mx-auto px-4 py-1 text-xs">
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

        {/* Mobile Step Indicator */}
        <div className="sm:hidden flex items-center justify-between px-3 py-1.5 bg-purple-50/80 rounded-xl text-xs border border-purple-100">
          <span className="font-bold text-purple-950 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-purple-700 text-white flex items-center justify-center text-[10px] font-black shadow-xs">5</span>
            <span>Step 5 of 6: Payment Gateway</span>
          </span>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            SSL Protected
          </span>
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
        <div className="rounded-2xl bg-red-50 border-2 border-red-200 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0 font-bold text-sm">
              ✕
            </div>
            <div>
              <h4 className="text-xs font-black text-red-950">
                OH no ! It seems transaction failed but ive saved your exact progress to continue ! wanna retry?
              </h4>
              <p className="text-[11px] text-red-800 font-medium mt-0.5">
                Your selected train, quota, and passenger details remain intact. No amount was deducted.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePayWithWallet}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black transition-all cursor-pointer shadow-2xs"
            >
              ⚡ Use Wallet (₹10,000)
            </button>
            <button
              type="button"
              onClick={() => handlePay()}
              className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black transition-colors cursor-pointer shadow-2xs"
            >
              🔄 Retry Payment
            </button>
          </div>
        </div>
      )}

      {/* 🛡️ NIRA SAFE ZERO-PII SHIELD (Item 5 & 7) */}
      <div className="flex items-center justify-between px-3.5 py-2 rounded-2xl bg-gradient-to-r from-emerald-50 via-purple-50 to-indigo-50 border border-emerald-200/80 text-[11px] text-slate-800 font-semibold shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-[10px]">
            🛡️
          </div>
          <div>
            <span className="font-bold text-slate-900">Nira Safe: </span>
            <span className="text-slate-600">Nira never sees your PIN, OTP, CVV, or password. Financial credentials bypass AI context entirely.</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] text-slate-400 font-bold uppercase hidden sm:inline">Demo State:</span>
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
          2. MAIN 2-COLUMN PAYMENT & SUMMARY LAYOUT
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* ──────────────── COLUMN 1: PAYMENT METHOD SELECTOR & QR (7 Cols) ──────────────── */}
        <div className="lg:col-span-7 bg-white rounded-[24px] p-4 shadow-sm border border-purple-100 space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              Choose a payment method
            </h2>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Total: ₹{totalAmount.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Virtual Citizen Wallet Highlight Card (₹10,000 New User Credit) */}
          <div id="citizen-wallet-card" className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-950 text-white shadow-md border border-purple-400/30 space-y-2.5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-amber-300 shadow-xs">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs block leading-tight">
                    Nirantar Citizen Virtual Wallet
                  </span>
                  <span className="text-[10px] text-purple-200">
                    Active Balance: <strong className="text-emerald-300 font-mono text-xs">₹{walletBalance.toLocaleString('en-IN')}.00</strong>
                  </span>
                </div>
              </div>
              <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                ₹10,000 Credit
              </span>
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <span className="text-[10px] text-purple-200">
                Debit: <strong className="text-white font-mono">₹{totalAmount.toLocaleString('en-IN')}</strong> • Remaining: <strong className="text-emerald-300 font-mono">₹{Math.max(0, walletBalance - totalAmount).toLocaleString('en-IN')}</strong>
              </span>
              <button
                type="button"
                onClick={handlePayWithWallet}
                className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-black shadow-sm transition-all flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <span>Pay with Wallet ➔</span>
              </button>
            </div>
          </div>

          <div className="text-center">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">OR PAY VIA UPI / CARDS / NET BANKING</span>
          </div>

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

          {/* 1. UPI TAB */}
          {activeTab === 'upi' && (
            <div className="space-y-3.5 pt-1 animate-in fade-in duration-200">
              {/* UPI Apps Row */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Choose UPI App / Interface</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'gpay', name: 'Google Pay', color: 'text-blue-600', border: 'border-blue-200', bg: 'bg-blue-50/50' },
                    { id: 'phonepe', name: 'PhonePe', color: 'text-purple-700', border: 'border-purple-200', bg: 'bg-purple-50/50' },
                    { id: 'paytm', name: 'Paytm UPI', color: 'text-sky-600', border: 'border-sky-200', bg: 'bg-sky-50/50' },
                    { id: 'bhim', name: 'BHIM UPI', color: 'text-orange-600', border: 'border-orange-200', bg: 'bg-orange-50/50' },
                    { id: 'cred', name: 'CRED UPI', color: 'text-slate-800', border: 'border-slate-300', bg: 'bg-slate-50' },
                  ].map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => setSelectedUpiApp(app.id as any)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        selectedUpiApp === app.id
                          ? `${app.border} ${app.bg} ring-2 ring-purple-600 shadow-xs font-black text-purple-950`
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold'
                      }`}
                    >
                      <Smartphone className={`w-4 h-4 ${app.color}`} />
                      <span className="text-[11px] truncate">{app.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start pt-1">
                {/* Left QR Box */}
                <div className="flex flex-col items-center text-center space-y-1.5 p-3 rounded-2xl bg-purple-50/40 border border-purple-100">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900">Scan & Pay via any UPI App</h3>
                    <p className="text-[10px] text-slate-500 font-medium">Auto-detects payment on mobile</p>
                  </div>

                  {/* QR Code Container with interactive click */}
                  <div
                    onClick={handlePay}
                    className="w-32 h-32 bg-white rounded-2xl p-2 border border-purple-200 shadow-sm relative flex items-center justify-center cursor-pointer group hover:border-purple-600 transition-all"
                    title="Click QR to simulate instant mobile scan"
                  >
                    <div className="w-full h-full relative flex items-center justify-center">
                      <QrCode className="w-full h-full text-slate-900 group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 m-auto w-6 h-6 bg-white rounded-lg p-0.5 shadow-md flex items-center justify-center border border-purple-100">
                        <div className="w-4 h-3 bg-gradient-to-r from-orange-500 via-white to-emerald-500 rounded-sm" />
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-500 font-medium">Click QR to simulate instant scan</span>
                </div>

                {/* Right UPI ID & Secret MPIN Password Entry */}
                <form onSubmit={handlePay} className="space-y-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Enter UPI ID / VPA
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="username@okhdfcbank"
                        className="w-full bg-purple-50/40 border border-purple-100 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white"
                        required
                      />
                      <span className="absolute right-2.5 top-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Verified ✓
                      </span>
                    </div>
                  </div>

                  {/* Secret UPI PIN / Password Entry Field */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Secret 4/6-Digit UPI PIN
                      </label>
                      <span className="text-[10px] text-purple-700 font-bold">256-Bit Encrypted</span>
                    </div>
                    <div className="relative">
                      <input
                        type={showUpiPin ? 'text' : 'password'}
                        value={upiPin}
                        onChange={(e) => setUpiPin(e.target.value)}
                        placeholder="••••"
                        maxLength={6}
                        className="w-full bg-purple-50/40 border border-purple-100 rounded-xl px-3 py-2 text-xs font-mono font-bold tracking-widest text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowUpiPin(!showUpiPin)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                        title={showUpiPin ? 'Hide PIN' : 'Show PIN'}
                      >
                        {showUpiPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Never share your UPI PIN or bank OTP with anyone.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{isProcessing ? 'Authorizing UPI...' : `Pay ₹${totalAmount.toLocaleString('en-IN')} via UPI`}</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* 2. CARDS TAB */}
          {activeTab === 'cards' && (
            <div className="space-y-3 pt-1 animate-in fade-in duration-200">
              <div className="p-3 rounded-2xl bg-purple-50/40 border border-purple-100 space-y-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4532 •••• •••• 8492"
                    className="w-full bg-white border border-purple-100 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Expiry Date</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/YY"
                      className="w-full bg-white border border-purple-100 rounded-xl px-3 py-2 text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:border-purple-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">CVV</label>
                    <input
                      type="password"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      placeholder="•••"
                      maxLength={4}
                      className="w-full bg-white border border-purple-100 rounded-xl px-3 py-2 text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:border-purple-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cardholder Name</label>
                  <input
                    type="text"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    placeholder="Full Name on Card"
                    className="w-full bg-white border border-purple-100 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-purple-600"
                  />
                </div>

                {/* 3D-Secure Card Password / Bank OTP */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">3D-Secure 2FA Card Password / OTP</label>
                    <span className="text-[10px] text-purple-700 font-bold">RuPay / Visa Secure</span>
                  </div>
                  <div className="relative">
                    <input
                      type={showCardPassword ? 'text' : 'password'}
                      value={cardPassword}
                      onChange={(e) => setCardPassword(e.target.value)}
                      placeholder="Enter 3D-Secure Password or OTP"
                      className="w-full bg-white border border-purple-100 rounded-xl px-3 py-2 text-xs font-mono font-bold tracking-widest text-slate-900 focus:outline-none focus:border-purple-600 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCardPassword(!showCardPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showCardPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePay}
                disabled={isProcessing}
                className="w-full py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isProcessing ? 'Authorizing Card...' : `Pay ₹${totalAmount.toLocaleString('en-IN')} with Card`}</span>
              </button>
            </div>
          )}

          {/* 3. NETBANKING TAB */}
          {activeTab === 'netbanking' && (
            <div className="space-y-3 pt-1 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">Select Bank</label>
                <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                  {selectedBank} Selected
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank', 'Punjab National Bank', 'Kotak Mahindra', 'Bank of Baroda', 'Canara Bank'].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setSelectedBank(b)}
                    className={`p-2 rounded-xl border text-left font-bold transition-all cursor-pointer text-xs flex items-center justify-between ${
                      selectedBank === b
                        ? 'bg-purple-50 border-purple-600 text-purple-950 ring-1 ring-purple-600 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="truncate">{b}</span>
                    <span className="text-[10px] text-purple-600 font-bold ml-1">✓</span>
                  </button>
                ))}
              </div>

              {/* NetBanking Credentials Form */}
              <div className="p-3.5 rounded-2xl bg-purple-50/40 border border-purple-100 space-y-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {selectedBank} Customer ID / User ID
                  </label>
                  <input
                    type="text"
                    value={netBankingUserId}
                    onChange={(e) => setNetBankingUserId(e.target.value)}
                    placeholder="Customer / User ID"
                    className="w-full bg-white border border-purple-100 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">NetBanking Password</label>
                      <span className="text-[10px] text-purple-700 font-semibold">Login Secret</span>
                    </div>
                    <div className="relative">
                      <input
                        type={showNetBankingPassword ? 'text' : 'password'}
                        value={netBankingPassword}
                        onChange={(e) => setNetBankingPassword(e.target.value)}
                        placeholder="Enter NetBanking Password"
                        className="w-full bg-white border border-purple-100 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-purple-600 pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNetBankingPassword(!showNetBankingPassword)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {showNetBankingPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">Transaction Password / OTP</label>
                      <span className="text-[10px] text-purple-700 font-semibold">2FA Security</span>
                    </div>
                    <div className="relative">
                      <input
                        type={showNetBankingOtp ? 'text' : 'password'}
                        value={netBankingOtp}
                        onChange={(e) => setNetBankingOtp(e.target.value)}
                        placeholder="6-Digit OTP / PIN"
                        maxLength={6}
                        className="w-full bg-white border border-purple-100 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-purple-600 pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNetBankingOtp(!showNetBankingOtp)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {showNetBankingOtp ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handlePayWithBank(selectedBank)}
                disabled={isProcessing}
                className="w-full py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>{isProcessing ? 'Authorizing NetBanking...' : `Pay ₹${totalAmount.toLocaleString('en-IN')} with ${selectedBank}`}</span>
              </button>
            </div>
          )}

          {/* 4. WALLETS TAB (WITH PREDEFINED ₹10,000 CITIZEN WALLET) */}
          {activeTab === 'wallets' && (
            <div className="space-y-3 pt-1 animate-in fade-in duration-200">
              {/* Highlighted Predefined Citizen Wallet */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-950 text-white shadow-md border border-purple-400/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-amber-300">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs block">Nirantar Citizen Virtual Wallet</span>
                      <span className="text-[10px] text-purple-200">Pre-loaded Travel Credit</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-400/20 px-2 py-0.5 rounded-full border border-emerald-400/30">
                    ₹{walletBalance.toLocaleString('en-IN')}.00
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/10">
                  <span className="text-purple-200">
                    Debit: <strong className="text-white font-mono">₹{totalAmount.toLocaleString('en-IN')}</strong> • Remaining: <strong className="text-emerald-300 font-mono">₹{Math.max(0, walletBalance - totalAmount).toLocaleString('en-IN')}</strong>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handlePayWithWallet}
                  disabled={isProcessing || walletBalance < totalAmount}
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isProcessing ? 'Processing Wallet Payment...' : `1-Click Pay ₹${totalAmount.toLocaleString('en-IN')} from Citizen Wallet ➔`}</span>
                </button>
              </div>

              {/* External Wallets with PIN input */}
              <div className="p-3.5 rounded-2xl bg-purple-50/40 border border-purple-100 space-y-2.5">
                <label className="block text-xs font-bold text-slate-700">Or Pay via External Wallet</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {['Amazon Pay', 'Paytm Wallet', 'PhonePe Wallet', 'MobiKwik'].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setSelectedWallet(w)}
                      className={`p-2 rounded-xl border text-left font-bold transition-all cursor-pointer text-xs ${
                        selectedWallet === w
                          ? 'bg-purple-50 border-purple-600 text-purple-950 ring-1 ring-purple-600 shadow-2xs'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Registered Mobile / ID</label>
                    <input
                      type="text"
                      value={walletId}
                      onChange={(e) => setWalletId(e.target.value)}
                      placeholder="9876543210"
                      className="w-full bg-white border border-purple-100 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-purple-600"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-slate-600">Wallet Security PIN</label>
                      <span className="text-[10px] text-purple-700 font-semibold">Auth PIN</span>
                    </div>
                    <div className="relative">
                      <input
                        type={showWalletPin ? 'text' : 'password'}
                        value={walletPin}
                        onChange={(e) => setWalletPin(e.target.value)}
                        placeholder="••••"
                        maxLength={6}
                        className="w-full bg-white border border-purple-100 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-purple-600 pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => setShowWalletPin(!showWalletPin)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {showWalletPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handlePay}
                  disabled={isProcessing}
                  className="w-full py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isProcessing ? 'Authorizing Wallet...' : `Pay ₹${totalAmount.toLocaleString('en-IN')} with ${selectedWallet}`}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ──────────────── COLUMN 2: TRIP SUMMARY (5 Cols) ──────────────── */}
        <div className="lg:col-span-5 bg-white rounded-[24px] p-4 shadow-sm border border-purple-100 space-y-3">
          <div className="flex items-center justify-between border-b border-purple-50 pb-2">
            <h3 className="text-sm font-bold text-slate-900">Trip summary</h3>
            <MoreVertical className="w-4 h-4 text-slate-400 cursor-pointer" />
          </div>

          {/* 3D Train Banner Image */}
          <div className="w-full h-28 rounded-2xl overflow-hidden shadow-inner border border-purple-100 bg-purple-50">
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
        selectedBankName={selectedBank}
        onPaymentSuccess={() => navigateTo('ticket')}
      />
    </div>
  );
};

export default PaymentBridgePage;
