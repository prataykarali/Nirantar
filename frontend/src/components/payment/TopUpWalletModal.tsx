import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Wallet,
  Plus,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  CreditCard,
  QrCode,
  Lock,
  KeyRound,
  Delete,
} from 'lucide-react';
import { useJourney } from '../../context/JourneyContext';

interface TopUpWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_AMOUNTS = [500, 1000, 2000, 5000, 10000];

type TopUpStep = 'DETAILS' | 'PIN_AUTH' | 'SUCCESS';

export const TopUpWalletModal: React.FC<TopUpWalletModalProps> = ({ isOpen, onClose }) => {
  const { walletBalance, addWalletBalance, addNotification } = useJourney();
  const [step, setStep] = useState<TopUpStep>('DETAILS');
  const [selectedAmount, setSelectedAmount] = useState<number>(2000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [selectedSource, setSelectedSource] = useState<'UPI' | 'NET_BANKING' | 'CARD'>('UPI');

  // Account details states
  const [upiVpa, setUpiVpa] = useState<string>('pratay.karali@okhdfcbank');
  const [bankAccount, setBankAccount] = useState<string>('50100482910482');
  const [selectedBank, setSelectedBank] = useState<string>('HDFC Bank');
  const [cardNumber, setCardNumber] = useState<string>('4532 8910 2481 8492');

  // PIN states
  const [pinDigits, setPinDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [pinError, setPinError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [lastTxnRef, setLastTxnRef] = useState<string>('');

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setStep('DETAILS');
      setPinDigits(['', '', '', '', '', '']);
      setPinError(null);
      setIsProcessing(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const finalAmount = customAmount ? parseInt(customAmount, 10) || 0 : selectedAmount;
  const pinLength = pinDigits.filter(Boolean).length;

  const handleKeypadPress = (digit: string) => {
    setPinError(null);
    const next = [...pinDigits];
    const emptyIdx = next.findIndex((d) => d === '');
    if (emptyIdx !== -1) {
      next[emptyIdx] = digit;
      setPinDigits(next);
    }
  };

  const handleBackspace = () => {
    setPinError(null);
    const next = [...pinDigits];
    const filledIndices = next
      .map((d, i) => (d !== '' ? i : -1))
      .filter((i) => i !== -1);
    if (filledIndices.length > 0) {
      const lastIdx = filledIndices[filledIndices.length - 1];
      next[lastIdx] = '';
      setPinDigits(next);
    }
  };

  const handleClear = () => {
    setPinError(null);
    setPinDigits(['', '', '', '', '', '']);
  };

  const handleProceedToPin = () => {
    if (finalAmount <= 0) return;
    if (selectedSource === 'UPI' && !upiVpa.trim()) return;
    if (selectedSource === 'NET_BANKING' && !bankAccount.trim()) return;
    if (selectedSource === 'CARD' && !cardNumber.trim()) return;

    setPinDigits(['', '', '', '', '', '']);
    setPinError(null);
    setStep('PIN_AUTH');
  };

  const handleAuthorizeTopUp = async () => {
    if (pinLength < 4) {
      setPinError('Please enter your 4 or 6-digit Bank PIN to authorize reload.');
      return;
    }

    setIsProcessing(true);
    // Simulate real bank authorization bridge
    await new Promise((resolve) => setTimeout(resolve, 800));

    const txnRef = `CR-BANK-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    setLastTxnRef(txnRef);

    addWalletBalance(finalAmount, selectedSource);
    setIsProcessing(false);
    setStep('SUCCESS');

    setTimeout(() => {
      onClose();
    }, 1600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 select-none font-sans overflow-y-auto">
      <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-md w-full max-h-[90dvh] overflow-y-auto shadow-2xl border border-purple-100 space-y-4 text-slate-800 relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-100 pb-3">
          <div className="flex items-center gap-2.5">
            {step === 'PIN_AUTH' ? (
              <button
                type="button"
                onClick={() => setStep('DETAILS')}
                className="w-8 h-8 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 flex items-center justify-center transition-colors cursor-pointer mr-0.5"
                title="Back to Details"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-9 h-9 rounded-2xl bg-purple-100 text-purple-900 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
            )}
            <div>
              <h3 className="font-black text-base text-slate-950 flex items-center gap-1.5">
                <span>{step === 'PIN_AUTH' ? 'Authorize Bank Transfer' : 'Top-Up Digital Bank Wallet'}</span>
                <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                  {step === 'PIN_AUTH' ? '256-Bit NPCI' : 'Instant'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {step === 'PIN_AUTH'
                  ? 'Enter issuing bank authorization PIN'
                  : 'Add funds to Citizen Travel Wallet A/C XX-8492'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* STEP 1: DETAILS & ACCOUNT SELECTION */}
        {step === 'DETAILS' && (
          <div className="space-y-4">
            {/* Current Balance Banner */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 text-white flex items-center justify-between shadow-md">
              <div className="space-y-0.5">
                <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider block">
                  Active Wallet Balance
                </span>
                <div className="text-xl sm:text-2xl font-mono font-black text-white">
                  ₹{(walletBalance || 0).toLocaleString('en-IN')}.00
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-1 rounded-full">
                Zero-Fee Reload
              </span>
            </div>

            {/* Quick Amount Chips */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">
                Select Amount to Add:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_AMOUNTS.map((amt) => {
                  const isSel = !customAmount && selectedAmount === amt;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setSelectedAmount(amt);
                        setCustomAmount('');
                      }}
                      className={`py-2 px-3 rounded-xl border text-xs font-black transition-all cursor-pointer text-center ${
                        isSel
                          ? 'bg-[#7C3AED] text-white border-purple-700 shadow-md shadow-purple-600/30'
                          : 'bg-purple-50/50 hover:bg-purple-100 text-purple-950 border-purple-200'
                      }`}
                    >
                      +₹{amt.toLocaleString('en-IN')}
                    </button>
                  );
                })}
              </div>

              {/* Custom Amount Input */}
              <div className="pt-0.5">
                <div className="flex items-center gap-2 p-2 rounded-xl border border-purple-200 bg-purple-50/30 focus-within:ring-2 focus-within:ring-purple-600 focus-within:border-transparent">
                  <span className="text-xs font-black text-purple-900 pl-1 font-mono">₹</span>
                  <input
                    type="number"
                    placeholder="Or enter custom amount (e.g. 3500)"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full text-xs font-bold text-slate-900 bg-transparent focus:outline-none placeholder:text-slate-400"
                    min="100"
                    max="50000"
                  />
                </div>
              </div>
            </div>

            {/* Funding Source Selector */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">
                Select Funding Source:
              </span>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedSource('UPI')}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 font-bold transition-all cursor-pointer text-center ${
                    selectedSource === 'UPI'
                      ? 'bg-purple-100/80 border-purple-600 text-purple-950 ring-1 ring-purple-600 shadow-sm'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <QrCode className="w-4 h-4 text-purple-700 shrink-0" />
                  <span className="text-[11px]">FastPay UPI</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedSource('NET_BANKING')}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 font-bold transition-all cursor-pointer text-center ${
                    selectedSource === 'NET_BANKING'
                      ? 'bg-purple-100/80 border-purple-600 text-purple-950 ring-1 ring-purple-600 shadow-sm'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-indigo-700 shrink-0" />
                  <span className="text-[11px]">NetBanking</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedSource('CARD')}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 font-bold transition-all cursor-pointer text-center ${
                    selectedSource === 'CARD'
                      ? 'bg-purple-100/80 border-purple-600 text-purple-950 ring-1 ring-purple-600 shadow-sm'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span className="text-[11px]">Debit/Card</span>
                </button>
              </div>
            </div>

            {/* FUNDING SOURCE ACCOUNT INPUTS */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              {selectedSource === 'UPI' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                    <span>Enter Funding UPI ID / VPA:</span>
                    <span className="text-[10px] text-emerald-600 font-bold">Verified VPA</span>
                  </label>
                  <input
                    type="text"
                    value={upiVpa}
                    onChange={(e) => setUpiVpa(e.target.value)}
                    placeholder="e.g. username@okhdfcbank"
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 font-mono"
                  />
                  <div className="flex gap-1.5 pt-0.5 overflow-x-auto">
                    {['@okhdfcbank', '@oksbi', '@okaxis', '@paytm'].map((domain) => (
                      <button
                        key={domain}
                        type="button"
                        onClick={() => setUpiVpa((prev) => (prev.split('@')[0] || 'pratay') + domain)}
                        className="text-[10px] font-bold px-2 py-0.5 bg-white border border-slate-200 hover:border-purple-300 rounded-lg text-slate-600 hover:text-purple-700 cursor-pointer"
                      >
                        {domain}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedSource === 'NET_BANKING' && (
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Select Bank & Account:
                    </label>
                    <select
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                    >
                      <option value="HDFC Bank">HDFC Bank (Primary Savings)</option>
                      <option value="State Bank of India">State Bank of India (SBI)</option>
                      <option value="ICICI Bank">ICICI Bank</option>
                      <option value="Axis Bank">Axis Bank</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Bank Account Number:
                    </label>
                    <input
                      type="text"
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      placeholder="Enter 14-digit Bank Account Number"
                      className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 tracking-wider"
                    />
                  </div>
                </div>
              )}

              {selectedSource === 'CARD' && (
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Debit Card Number:
                    </label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="16-digit Card Number"
                      className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 tracking-wider"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      defaultValue="12/28"
                      placeholder="MM/YY"
                      className="w-1/2 text-xs font-mono font-bold px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 text-center"
                    />
                    <input
                      type="password"
                      defaultValue="842"
                      maxLength={3}
                      placeholder="CVV"
                      className="w-1/2 text-xs font-mono font-bold px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 text-center"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Next Step Button */}
            <button
              type="button"
              disabled={finalAmount <= 0}
              onClick={handleProceedToPin}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#7C3AED] via-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-black text-xs shadow-md shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
            >
              <span>Continue to Bank PIN Authorization</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: BANK PIN / MPIN AUTHORIZATION */}
        {step === 'PIN_AUTH' && (
          <div className="space-y-4">
            {/* Transaction Target Confirmation */}
            <div className="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-200 flex items-center justify-between text-xs font-bold">
              <div>
                <span className="text-[10px] text-purple-700 font-bold uppercase tracking-wider block">
                  Transfer Amount
                </span>
                <span className="text-lg font-black font-mono text-purple-950">
                  ₹{finalAmount.toLocaleString('en-IN')}.00
                </span>
              </div>
              <div className="text-right text-[11px] text-slate-600 font-medium">
                <div>From: <span className="font-bold text-slate-900">{selectedSource === 'UPI' ? upiVpa : selectedBank}</span></div>
                <div className="text-[10px] text-purple-700">To: Citizen Wallet A/C XX-8492</div>
              </div>
            </div>

            {/* PIN Entry Prompt */}
            <div className="text-center space-y-2">
              <span className="text-xs font-bold text-slate-800 block">
                Enter 4 or 6-Digit Bank UPI / Security PIN:
              </span>

              {/* Masked PIN Slot Indicators */}
              <div className="flex items-center justify-center gap-2.5 py-1">
                {pinDigits.map((digit, idx) => (
                  <div
                    key={idx}
                    className={`w-9 h-11 rounded-xl border-2 flex items-center justify-center text-lg font-mono font-black transition-all ${
                      digit !== ''
                        ? 'border-purple-600 bg-purple-50 text-purple-950 shadow-inner'
                        : 'border-slate-200 bg-slate-50 text-slate-400'
                    }`}
                  >
                    {digit !== '' ? '•' : ''}
                  </div>
                ))}
              </div>

              {pinError && (
                <p className="text-[11px] font-bold text-red-600 animate-in fade-in">
                  {pinError}
                </p>
              )}
            </div>

            {/* Interactive Keypad */}
            <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeypadPress(num)}
                  className="h-11 rounded-xl bg-slate-100 hover:bg-purple-100 text-slate-800 hover:text-purple-950 font-black text-base border border-slate-200/80 transition-all active:scale-95 cursor-pointer flex items-center justify-center shadow-sm"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                className="h-11 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-700 font-bold text-xs border border-slate-200/80 transition-all active:scale-95 cursor-pointer flex items-center justify-center"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                className="h-11 rounded-xl bg-slate-100 hover:bg-purple-100 text-slate-800 hover:text-purple-950 font-black text-base border border-slate-200/80 transition-all active:scale-95 cursor-pointer flex items-center justify-center shadow-sm"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs border border-slate-200/80 transition-all active:scale-95 cursor-pointer flex items-center justify-center"
                title="Backspace"
              >
                <Delete className="w-4 h-4" />
              </button>
            </div>

            {/* Authorize Transfer Button */}
            <div className="pt-2">
              <button
                type="button"
                disabled={pinLength < 4 || isProcessing}
                onClick={handleAuthorizeTopUp}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
              >
                {isProcessing ? (
                  <span className="animate-pulse flex items-center gap-2">
                    <KeyRound className="w-4 h-4 animate-spin" />
                    <span>Verifying with NPCI & Issuing Bank...</span>
                  </span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Authorize & Credit ₹{finalAmount.toLocaleString('en-IN')}.00</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 font-medium pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Isolated Security: PIN is verified with issuing bank directly. Never stored or shared.</span>
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS ANIMATION */}
        {step === 'SUCCESS' && (
          <div className="py-8 text-center space-y-3 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>
            <div className="space-y-1">
              <h4 className="font-black text-lg text-slate-900">
                ₹{finalAmount.toLocaleString('en-IN')}.00 Added Successfully!
              </h4>
              <p className="text-xs text-slate-500 font-medium">
                Ref: <span className="font-mono text-purple-900 font-bold">{lastTxnRef}</span> • Digital Citizen Bank
              </p>
            </div>
            <div className="pt-2 text-xs font-bold text-emerald-700">
              New Wallet Balance: ₹{(walletBalance || 0).toLocaleString('en-IN')}.00
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopUpWalletModal;
