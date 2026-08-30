import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  X,
  CreditCard,
  Building2,
  Wallet,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  Smartphone,
  Check,
  Sparkles,
} from 'lucide-react';
import { useJourney } from '../../context/JourneyContext';

interface PaymentGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  selectedMethod: 'UPI' | 'CARD' | 'NET_BANKING' | 'WALLET';
  selectedBankName?: string;
  onPaymentSuccess: () => void;
}

type GatewayStep = 'METHOD_SELECT' | 'BANK_3D_SECURE' | 'PROCESSING' | 'SUCCESS' | 'UNKNOWN' | 'FAILED';

export const PaymentGatewayModal: React.FC<PaymentGatewayModalProps> = ({
  isOpen,
  onClose,
  amount,
  selectedMethod,
  selectedBankName = 'HDFC Bank',
  onPaymentSuccess,
}) => {
  const { triggerMockPaymentResult, verifyPaymentStatus, walletBalance, setWalletBalance, payWithWallet } = useJourney();

  const handleQuickPayWithCitizenWallet = async () => {
    setCurrentStep('PROCESSING');
    setProcessingStatus('Debiting from Nirantar Citizen Virtual Wallet...');
    setProcessingStage(2);
    setTimeout(async () => {
      const res = await payWithWallet(amount);
      if (res && (res.state === 'BOOKING_CONFIRMED' || res.state === 'SUCCESS')) {
        setCurrentStep('SUCCESS');
        setTimeout(() => {
          onClose();
          onPaymentSuccess();
        }, 1200);
      } else {
        setCurrentStep('FAILED');
      }
    }, 600);
  };

  const getShuffledKeypad = () => {
    const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    for (let i = digits.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [digits[i], digits[j]] = [digits[j], digits[i]];
    }
    return digits;
  };

  const [currentStep, setCurrentStep] = useState<GatewayStep>('BANK_3D_SECURE');
  const [activeTab, setActiveTab] = useState<'upi' | 'cards' | 'netbanking' | 'wallets'>(
    selectedMethod === 'CARD'
      ? 'cards'
      : selectedMethod === 'NET_BANKING'
      ? 'netbanking'
      : selectedMethod === 'WALLET'
      ? 'wallets'
      : 'upi'
  );

  // Form states
  const [selectedUpiApp, setSelectedUpiApp] = useState<'gpay' | 'phonepe' | 'paytm' | 'bhim'>('gpay');
  const [upiVpa, setUpiVpa] = useState('pratay.karali@okhdfcbank');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [pinDigits, setPinDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [activePinIndex, setActivePinIndex] = useState<number>(0);
  const [pinError, setPinError] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(280);
  const [processingStatus, setProcessingStatus] = useState('Connecting to NPCI & Bank Gateway...');
  const [processingStage, setProcessingStage] = useState<number>(1);
  const [keypadDigits, setKeypadDigits] = useState<string[]>(['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']);

  // Reset step and PIN on open - pop up Bank 3D Secure / PIN step directly
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('BANK_3D_SECURE');
      setActiveTab(
        selectedMethod === 'CARD'
          ? 'cards'
          : selectedMethod === 'NET_BANKING'
          ? 'netbanking'
          : selectedMethod === 'WALLET'
          ? 'wallets'
          : 'upi'
      );
      setPinDigits(['', '', '', '', '', '']);
      setActivePinIndex(0);
      setPinError(null);
      setTimerSeconds(280);
      setProcessingStage(1);
      setKeypadDigits(getShuffledKeypad());
    }
  }, [isOpen, selectedMethod]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || currentStep === 'SUCCESS') return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, currentStep]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleProceedToAuth = () => {
    setPinDigits(['', '', '', '', '', '']);
    setActivePinIndex(0);
    setPinError(null);
    setKeypadDigits(getShuffledKeypad());
    setCurrentStep('BANK_3D_SECURE');
  };

  // Interactive PIN entry handling
  const handleKeypadPress = (num: string) => {
    setPinError(null);
    const nextDigits = [...pinDigits];
    const emptyIdx = nextDigits.findIndex((d) => d === '');
    if (emptyIdx !== -1) {
      nextDigits[emptyIdx] = num;
      setPinDigits(nextDigits);
      setActivePinIndex(Math.min(5, emptyIdx + 1));
    }
  };

  const handleKeypadBackspace = () => {
    setPinError(null);
    const nextDigits = [...pinDigits];
    for (let i = nextDigits.length - 1; i >= 0; i--) {
      if (nextDigits[i] !== '') {
        nextDigits[i] = '';
        setPinDigits(nextDigits);
        setActivePinIndex(i);
        break;
      }
    }
  };

  const handleClearPin = () => {
    setPinDigits(['', '', '', '', '', '']);
    setActivePinIndex(0);
    setPinError(null);
  };

  const handleShuffleKeypad = () => {
    setKeypadDigits(getShuffledKeypad());
  };

  // Physical keyboard support for PIN input
  useEffect(() => {
    if (!isOpen || currentStep !== 'BANK_3D_SECURE') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleKeypadPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleKeypadBackspace();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleApprovePayment();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep, pinDigits]);

  const handleApprovePayment = async () => {
    const enteredPin = pinDigits.join('');
    if (enteredPin.length < 4) {
      setPinError('Please enter at least 4 digits of your UPI PIN / OTP.');
      return;
    }

    setCurrentStep('PROCESSING');
    setProcessingStage(1);
    setProcessingStatus('Connecting securely to NPCI & Issuing Bank Gateway...');

    setTimeout(() => {
      setProcessingStage(2);
      setProcessingStatus('Verifying 3D-Secure 2-Factor Authentication & Token...');
    }, 900);

    setTimeout(() => {
      setProcessingStage(3);
      setProcessingStatus('Communicating with IRCTC Passenger Reservation System (PRS)...');
    }, 1800);

    setTimeout(async () => {
      setProcessingStage(4);
      setProcessingStatus('Confirmed! Cryptographic e-ticket generated.');
      await triggerMockPaymentResult('SUCCESS');
      setCurrentStep('SUCCESS');
      setTimeout(() => {
        onClose();
        onPaymentSuccess();
      }, 1600);
    }, 2800);
  };

  const handleSimulateUnknown = async () => {
    setCurrentStep('PROCESSING');
    setProcessingStatus('Bank gateway response timed out. Checking status...');
    setTimeout(async () => {
      await triggerMockPaymentResult('UNKNOWN');
      setCurrentStep('UNKNOWN');
    }, 1500);
  };

  const handleSimulateFail = async () => {
    setCurrentStep('PROCESSING');
    setProcessingStatus('Contacting issuing bank...');
    setTimeout(async () => {
      await triggerMockPaymentResult('FAILED');
      setCurrentStep('FAILED');
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-[28px] max-w-2xl w-full border border-purple-200 shadow-2xl overflow-hidden font-sans select-none flex flex-col max-h-[92dvh]">
        {/* ═══════════════════════════════════════════════════════════════════
            1. GATEWAY TOP BAR BRANDING (Razorpay / NPCI Inspired)
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="p-3.5 px-5 bg-gradient-to-r from-[#0F172A] via-[#1E1B4B] to-[#0F172A] text-white flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-purple-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-sm tracking-tight text-white">
                  NIRANTAR PAY
                </span>
                <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  256-Bit TLS
                </span>
              </div>
              <p className="text-[10px] text-purple-200/70">
                Official IRCTC Railway Payment Surface
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Amount</span>
              <span className="font-black text-base text-emerald-400">
                ₹{amount.toLocaleString('en-IN')}.00
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            2. BODY CONTENT ACCORDING TO CURRENT STEP
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* ──────────────── STEP A: METHOD SELECTION ──────────────── */}
          {currentStep === 'METHOD_SELECT' && (
            <div className="space-y-4">
              {/* Order Context Banner */}
              <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-purple-950 font-bold">
                  <Lock className="w-4 h-4 text-purple-700" />
                  <span>Order ID: <span className="font-mono text-purple-800 font-normal">NTR-2026-84920</span></span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-purple-800 font-semibold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Expires in <strong className="font-mono text-purple-950">{formatTimer(timerSeconds)}</strong></span>
                </div>
              </div>

              {/* Gateway Tabs */}
              <div className="grid grid-cols-4 gap-2 p-1 rounded-2xl bg-slate-100 border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('upi')}
                  className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'upi'
                      ? 'bg-white text-purple-950 shadow-sm border border-purple-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <div className="w-3.5 h-2.5 bg-gradient-to-r from-orange-500 via-white to-emerald-500 rounded-xs border border-slate-300" />
                  <span>UPI Apps</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('cards')}
                  className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'cards'
                      ? 'bg-white text-purple-950 shadow-sm border border-purple-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5 text-purple-700" />
                  <span>Cards</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('netbanking')}
                  className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'netbanking'
                      ? 'bg-white text-purple-950 shadow-sm border border-purple-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 text-purple-700" />
                  <span>NetBanking</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('wallets')}
                  className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'wallets'
                      ? 'bg-white text-purple-950 shadow-sm border border-purple-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Wallet className="w-3.5 h-3.5 text-purple-700" />
                  <span>Wallets</span>
                </button>
              </div>

              {/* Tab 1: UPI APPS */}
              {activeTab === 'upi' && (
                <div className="space-y-3.5 animate-in fade-in duration-200">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { id: 'gpay', name: 'Google Pay', color: 'text-blue-600', border: 'border-blue-200', bg: 'bg-blue-50/50' },
                      { id: 'phonepe', name: 'PhonePe', color: 'text-purple-700', border: 'border-purple-200', bg: 'bg-purple-50/50' },
                      { id: 'paytm', name: 'Paytm UPI', color: 'text-sky-600', border: 'border-sky-200', bg: 'bg-sky-50/50' },
                      { id: 'bhim', name: 'BHIM UPI', color: 'text-orange-600', border: 'border-orange-200', bg: 'bg-orange-50/50' },
                    ].map((app) => (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => setSelectedUpiApp(app.id as any)}
                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                          selectedUpiApp === app.id
                            ? `${app.border} ${app.bg} ring-2 ring-purple-600 shadow-sm`
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <Smartphone className={`w-5 h-5 ${app.color}`} />
                        <span className="text-xs font-bold text-slate-900">{app.name}</span>
                        {selectedUpiApp === app.id && (
                          <span className="w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px]">
                            ✓
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* VPA Input */}
                  <div className="p-3.5 rounded-2xl bg-purple-50/40 border border-purple-100 space-y-2">
                    <label className="block text-xs font-bold text-slate-700">
                      Enter UPI ID / VPA
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={upiVpa}
                        onChange={(e) => setUpiVpa(e.target.value)}
                        placeholder="yourname@bank"
                        className="flex-1 px-3 py-2 rounded-xl bg-white border border-purple-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-600"
                      />
                      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200">
                        Verified ✓
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: CARDS */}
              {activeTab === 'cards' && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>DEBIT / CREDIT CARD</span>
                      <span className="font-black text-amber-400">RuPay / VISA</span>
                    </div>
                    <div className="font-mono text-base tracking-widest font-bold">
                      4532 •••• •••• 8492
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span>PRATAY KARALI</span>
                      <span>EXP: 08/29</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Card Number</label>
                      <input
                        type="text"
                        defaultValue="4532 8492 1029 8492"
                        className="w-full px-3 py-2 rounded-xl bg-purple-50/40 border border-purple-200 text-xs font-mono font-bold text-slate-900"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Expiry</label>
                        <input
                          type="text"
                          defaultValue="08/29"
                          className="w-full px-2 py-2 rounded-xl bg-purple-50/40 border border-purple-200 text-xs font-mono font-bold text-slate-900 text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">CVV</label>
                        <input
                          type="password"
                          defaultValue="982"
                          maxLength={3}
                          className="w-full px-2 py-2 rounded-xl bg-purple-50/40 border border-purple-200 text-xs font-mono font-bold text-slate-900 text-center"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: NETBANKING */}
              {activeTab === 'netbanking' && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <label className="block text-xs font-bold text-slate-700">Select Popular Indian Bank</label>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank', 'Punjab National Bank', 'Kotak Mahindra'].map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setSelectedBank(b)}
                        className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer text-xs ${
                          selectedBank === b
                            ? 'bg-purple-50 border-purple-600 text-purple-950 ring-2 ring-purple-600'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 4: WALLETS */}
              {activeTab === 'wallets' && (
                <div className="space-y-2.5 animate-in fade-in duration-200">
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-950 text-white border border-purple-400/30 space-y-2 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">Nirantar Citizen Virtual Wallet</span>
                      <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                        ₹10,000 Credit
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-purple-200">Active Balance:</span>
                      <strong className="text-emerald-300 font-mono text-sm">₹{walletBalance.toLocaleString('en-IN')}.00</strong>
                    </div>
                    <button
                      type="button"
                      onClick={handleQuickPayWithCitizenWallet}
                      disabled={walletBalance < amount}
                      className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>1-Click Pay ₹{amount.toLocaleString('en-IN')} from Wallet</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {['Amazon Pay (Balance: ₹4,200)', 'Paytm Wallet', 'Mobikwik Wallet', 'Airtel Money'].map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={handleProceedToAuth}
                        className="p-2.5 rounded-xl border border-slate-200 text-slate-700 text-left font-semibold transition-all hover:bg-slate-50 cursor-pointer"
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={handleProceedToAuth}
                  className="w-full py-3 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-black text-sm shadow-lg shadow-purple-600/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Proceed to Bank 3D-Secure Authorization</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Reviewer Simulation Shortcuts */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 px-1">
                  <span>Demo Flow Testing:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSimulateUnknown}
                      className="text-amber-700 hover:underline font-bold"
                    >
                      Test Unknown ⚠️
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={handleSimulateFail}
                      className="text-rose-700 hover:underline font-bold"
                    >
                      Test Failed ✕
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────── STEP B: INTERACTIVE USER PIN / OTP AUTHORIZATION SCREEN ──────────────── */}
          {currentStep === 'BANK_3D_SECURE' && (
            <div className="p-4 sm:p-5 rounded-3xl bg-slate-50 border-2 border-purple-200 space-y-4 animate-in zoom-in-95 duration-200">
              {/* Bank Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-900 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    {activeTab === 'upi' ? '⚡' : activeTab === 'cards' ? '💳' : '🏛️'}
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900">
                      {activeTab === 'upi'
                        ? `${selectedUpiApp.toUpperCase()} UPI Gateway`
                        : activeTab === 'cards'
                        ? 'Card 3D-Secure 2-Factor Authorization'
                        : `${selectedBankName || selectedBank} NetBanking Authorization`}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-semibold">
                      Official NPCI / IRCTC Railway Transaction Settlement
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Amount to Pay</span>
                  <span className="font-mono text-sm sm:text-base font-black text-purple-900">₹{amount}.00</span>
                </div>
              </div>

              {/* Input Instruction Banner */}
              <div className="bg-purple-100/60 p-3 rounded-2xl border border-purple-200/80 space-y-1 text-center">
                <p className="text-xs font-black text-purple-950">
                  {activeTab === 'upi'
                    ? 'Enter 4 or 6-Digit UPI PIN'
                    : activeTab === 'cards'
                    ? 'Enter 6-Digit Card 3D-Secure OTP'
                    : `Enter 6-Digit ${selectedBankName || selectedBank} NetBanking PIN / OTP`}
                </p>
                <p className="text-[11px] text-purple-800 font-medium">
                  {activeTab === 'upi'
                    ? 'Please enter your secret UPI PIN to authorize payment to Indian Railways (IRCTC).'
                    : activeTab === 'cards'
                    ? 'Please enter the 3D-Secure OTP sent to your card-registered mobile number +91 ••••••3210.'
                    : `Please enter your ${selectedBankName || selectedBank} NetBanking authorization PIN or OTP sent to +91 ••••••3210.`}
                </p>
              </div>

              {/* 6-Digit Interactive PIN Input Boxes */}
              <div className="flex items-center justify-center gap-2 sm:gap-2.5 py-1">
                {pinDigits.map((digit, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActivePinIndex(idx)}
                    className={`w-10 sm:w-12 h-12 sm:h-14 rounded-2xl bg-white border-2 flex items-center justify-center text-xl font-mono font-black shadow-sm transition-all cursor-pointer ${
                      digit !== ''
                        ? 'border-purple-600 text-purple-950 ring-2 ring-purple-100 bg-purple-50/30'
                        : activePinIndex === idx
                        ? 'border-purple-500 ring-2 ring-purple-200 animate-pulse'
                        : 'border-slate-300 text-slate-400'
                    }`}
                  >
                    {digit !== '' ? '●' : ''}
                  </div>
                ))}
              </div>

              {/* Error Notice if digits missing */}
              {pinError && (
                <div className="text-center text-xs font-bold text-rose-600 animate-shake">
                  {pinError}
                </div>
              )}

              {/* Tactile On-Screen Interactive Keypad (Randomized Security Layout) */}
              <div className="max-w-xs mx-auto space-y-1.5 pt-1">
                <div className="flex items-center justify-between px-1 text-[10px] text-slate-500 font-semibold">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Anti-Shoulder Surfing Randomized Keypad</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleShuffleKeypad}
                    className="text-purple-700 hover:text-purple-900 font-bold flex items-center gap-0.5 cursor-pointer hover:underline"
                    title="Reshuffle keypad layout"
                  >
                    <span>🔀 Reshuffle</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {keypadDigits.slice(0, 9).map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleKeypadPress(num)}
                      className="py-2.5 rounded-xl bg-white hover:bg-purple-50 text-slate-900 border border-slate-200 font-mono font-black text-sm sm:text-base shadow-2xs active:scale-95 transition-all cursor-pointer"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleClearPin}
                    className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs shadow-2xs active:scale-95 transition-all cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => handleKeypadPress(keypadDigits[9] || '0')}
                    className="py-2.5 rounded-xl bg-white hover:bg-purple-50 text-slate-900 border border-slate-200 font-mono font-black text-sm sm:text-base shadow-2xs active:scale-95 transition-all cursor-pointer"
                  >
                    {keypadDigits[9] || '0'}
                  </button>
                  <button
                    type="button"
                    onClick={handleKeypadBackspace}
                    className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs shadow-2xs active:scale-95 transition-all cursor-pointer"
                  >
                    ⌫
                  </button>
                </div>
              </div>

              {/* Privacy Shield Notice */}
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-emerald-800 font-semibold bg-emerald-50/80 p-2 rounded-xl border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Isolated Security: PIN is entered directly by citizen. AI models never see banking credentials.</span>
              </div>

              {/* Approval & Cancel Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setCurrentStep('METHOD_SELECT')}
                  className="py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApprovePayment}
                  className="py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-md shadow-emerald-700/25 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Authorize & Pay ₹{amount}</span>
                </button>
              </div>
            </div>
          )}

          {/* ──────────────── STEP C: MULTI-STAGE PROCESSING SCREEN ──────────────── */}
          {currentStep === 'PROCESSING' && (
            <div className="py-10 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in">
              <div className="w-16 h-16 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin flex items-center justify-center shadow-lg" />
              
              <div className="space-y-1.5 max-w-md">
                <h3 className="text-base font-black text-slate-900">
                  Processing Railway Transaction...
                </h3>
                <p className="text-xs font-bold text-purple-700 bg-purple-50 p-2 rounded-xl border border-purple-200/80">
                  {processingStatus}
                </p>

                {/* Progressive Stage Indicators */}
                <div className="flex items-center justify-center gap-2 pt-2 text-[10px] font-bold text-slate-500">
                  <span className={processingStage >= 1 ? 'text-emerald-700 font-black' : ''}>1. Gateway</span>
                  <span>➔</span>
                  <span className={processingStage >= 2 ? 'text-emerald-700 font-black' : ''}>2. 3D-Secure</span>
                  <span>➔</span>
                  <span className={processingStage >= 3 ? 'text-emerald-700 font-black' : ''}>3. IRCTC PRS</span>
                  <span>➔</span>
                  <span className={processingStage >= 4 ? 'text-emerald-700 font-black' : ''}>4. Confirmed</span>
                </div>

                <p className="text-[11px] text-slate-400 pt-2 font-medium">
                  Please do not refresh the page or close this secure transaction window.
                </p>
              </div>
            </div>
          )}

          {/* ──────────────── STEP D: SUCCESS CONFIRMATION ──────────────── */}
          {currentStep === 'SUCCESS' && (
            <div className="py-10 flex flex-col items-center justify-center text-center space-y-3 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl font-bold shadow-lg shadow-emerald-600/20">
                ✓
              </div>
              <h3 className="text-lg font-black text-slate-900">
                Payment Authorized!
              </h3>
              <p className="text-xs text-slate-600">
                Seat confirmed on <strong className="text-purple-900">Mumbai Rajdhani (12951)</strong>. Redirecting to your digital e-ticket...
              </p>
            </div>
          )}

          {/* ──────────────── STEP E: UNKNOWN STATE RECOVERY ──────────────── */}
          {currentStep === 'UNKNOWN' && (
            <div className="p-4 rounded-3xl bg-amber-50 border-2 border-amber-300 space-y-3 text-left animate-in fade-in">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center font-bold text-lg shrink-0">
                  ⚠️
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-950">
                    Payment Verification Pending — Don't Pay Again!
                  </h4>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                    We could not receive immediate confirmation from your bank. To protect you from duplicate billing, your seat is held while our backend verifies transaction status.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-white border border-amber-300 text-amber-900 text-xs font-bold hover:bg-amber-100"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setCurrentStep('PROCESSING');
                    setProcessingStatus('Verifying status with banking network...');
                    const res = await verifyPaymentStatus();
                    if (res?.state === 'SUCCESS' || res?.state === 'BOOKING_CONFIRMED') {
                      setCurrentStep('SUCCESS');
                      setTimeout(() => {
                        onClose();
                        onPaymentSuccess();
                      }, 1200);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
                >
                  Verify Payment Status Now →
                </button>
              </div>
            </div>
          )}

          {/* ──────────────── STEP F: FAILED STATE (EXACT USER REQUIREMENT) ──────────────── */}
          {currentStep === 'FAILED' && (
            <div className="p-4 rounded-3xl bg-red-50 border-2 border-red-200 space-y-3 text-left animate-in fade-in">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center font-bold text-lg shrink-0">
                  ✕
                </div>
                <div>
                  <h4 className="text-sm font-bold text-red-950">
                    OH no ! It seems transaction failed but ive saved your exact progress to continue ! wanna retry?
                  </h4>
                  <p className="text-xs text-red-800 mt-1">
                    Your selected train, coach quota, and passenger details are 100% preserved. No amount was debited.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('wallets');
                    setCurrentStep('METHOD_SELECT');
                  }}
                  className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-xs cursor-pointer"
                >
                  ⚡ Pay with Citizen Wallet (₹10,000)
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep('METHOD_SELECT')}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-xs cursor-pointer"
                >
                  🔄 Retry Payment (Progress Saved)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            3. FOOTER TRUST STRIP
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 px-5">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-purple-700" />
            <span>AI Context Isolated: Banking credentials never reach Nira</span>
          </div>
          <div className="flex items-center gap-2 font-bold text-slate-600">
            <span>NPCI</span>
            <span>•</span>
            <span>IRCTC</span>
            <span>•</span>
            <span>DigiLocker</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentGatewayModal;
