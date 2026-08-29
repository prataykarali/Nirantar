import React, { useState } from 'react';
import { X, Building2, Wallet, Plus, ShieldCheck, ArrowRight, CheckCircle2, Sparkles, CreditCard, QrCode } from 'lucide-react';
import { useJourney } from '../../context/JourneyContext';

interface TopUpWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_AMOUNTS = [500, 1000, 2000, 5000, 10000];

export const TopUpWalletModal: React.FC<TopUpWalletModalProps> = ({ isOpen, onClose }) => {
  const { walletBalance, addWalletBalance, addNotification } = useJourney();
  const [selectedAmount, setSelectedAmount] = useState<number>(2000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [selectedSource, setSelectedSource] = useState<'UPI' | 'NET_BANKING' | 'CARD' | 'GRANT'>('UPI');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const finalAmount = customAmount ? parseInt(customAmount, 10) || 0 : selectedAmount;

  const handleTopUp = async () => {
    if (finalAmount <= 0) return;
    setIsProcessing(true);
    // Simulate instantaneous bank bridge
    await new Promise((resolve) => setTimeout(resolve, 600));
    addWalletBalance(finalAmount, selectedSource);
    setIsProcessing(false);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 select-none font-sans">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-purple-100 space-y-5 text-slate-800 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-purple-100 text-purple-900 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-950 flex items-center gap-1.5">
                <span>Top-Up Digital Bank Wallet</span>
                <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                  Instant
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Add real funds to Citizen Travel Wallet A/C XX-8492
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
          <div className="pt-1">
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

        {/* Payment Source Selector */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-700 block">
            Funding Source:
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setSelectedSource('UPI')}
              className={`p-2.5 rounded-xl border flex items-center gap-2 font-bold transition-all cursor-pointer ${
                selectedSource === 'UPI'
                  ? 'bg-purple-100/80 border-purple-600 text-purple-950 ring-1 ring-purple-600'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <QrCode className="w-4 h-4 text-purple-700 shrink-0" />
              <span>FastPay UPI (Instant)</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedSource('NET_BANKING')}
              className={`p-2.5 rounded-xl border flex items-center gap-2 font-bold transition-all cursor-pointer ${
                selectedSource === 'NET_BANKING'
                  ? 'bg-purple-100/80 border-purple-600 text-purple-950 ring-1 ring-purple-600'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Building2 className="w-4 h-4 text-indigo-700 shrink-0" />
              <span>NetBanking (HDFC/SBI)</span>
            </button>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="button"
            disabled={finalAmount <= 0 || isProcessing}
            onClick={handleTopUp}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#7C3AED] via-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-black text-sm shadow-md shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
          >
            {isProcessing ? (
              <span className="animate-pulse">Connecting to Digital Bank...</span>
            ) : isSuccess ? (
              <span className="flex items-center gap-1 text-emerald-200">
                <CheckCircle2 className="w-4 h-4" />
                <span>₹{finalAmount.toLocaleString('en-IN')} Credited!</span>
              </span>
            ) : (
              <>
                <span>Top-Up ₹{finalAmount.toLocaleString('en-IN')}.00 Now</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>256-Bit Encrypted Indian Banking Gateway • Instant Credit</span>
        </div>
      </div>
    </div>
  );
};
