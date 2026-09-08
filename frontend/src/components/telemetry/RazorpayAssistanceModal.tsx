/**
 * NIRANTAR — Razorpay Test Mode: Passenger Assistance Checkout Modal
 * ===================================================================
 * Implements PRD Section 11:
 *  - Sandboxed railway-specific service booking (₹50)
 *  - Order creation -> Razorpay Checkout simulation -> Signature verification -> Ledger update
 *  - Label: "Razorpay Test Mode (Sandbox — ₹0 Real Money)"
 */

import React, { useState } from 'react';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Zap,
  Lock,
  ArrowRight,
  Receipt,
  FileCheck,
  Building2,
  Clock,
} from 'lucide-react';
import {
  PASSENGER_SERVICES_CATALOG,
  PassengerAssistanceService,
  razorpayTestService,
  CommittedLedgerEntry,
} from '../../services/razorpayTestService';

export interface RazorpayAssistanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  stationCode?: string;
  passengerName?: string;
  onSuccess?: (entry: CommittedLedgerEntry) => void;
}

export const RazorpayAssistanceModal: React.FC<RazorpayAssistanceModalProps> = ({
  isOpen,
  onClose,
  stationCode = 'NDLS',
  passengerName = 'Pratay Karali',
  onSuccess,
}) => {
  const [selectedService, setSelectedService] = useState<PassengerAssistanceService>(
    PASSENGER_SERVICES_CATALOG[0]
  );
  const [step, setStep] = useState<'SELECT' | 'CHECKOUT' | 'VERIFYING' | 'SUCCESS'>('SELECT');
  const [selectedMethod, setSelectedMethod] = useState<'UPI' | 'CARD' | 'NETBANKING'>('UPI');
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
  const [confirmedReceipt, setConfirmedReceipt] = useState<CommittedLedgerEntry | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleProceedToCheckout = async () => {
    setLoading(true);
    try {
      const order = await razorpayTestService.createTestOrder(selectedService, passengerName, stationCode);
      setActiveOrder(order);
      setStep('CHECKOUT');
    } catch (err) {
      console.error('Order creation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!activeOrder) return;
    setStep('VERIFYING');

    setTimeout(async () => {
      try {
        const mockPaymentId = `pay_test_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
        const mockSignature = `sig_test_${Date.now()}`;

        const entry = await razorpayTestService.verifyAndCommitPayment(
          {
            orderId: activeOrder.orderId,
            paymentId: mockPaymentId,
            signature: mockSignature,
            serviceId: selectedService.id,
            amount: selectedService.pricePaise,
          },
          passengerName,
          stationCode
        );

        setConfirmedReceipt(entry);
        setStep('SUCCESS');
        if (onSuccess) onSuccess(entry);
      } catch (err) {
        console.error('Payment verification failed:', err);
      }
    }, 1200);
  };

  const resetModal = () => {
    setStep('SELECT');
    setActiveOrder(null);
    setConfirmedReceipt(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-purple-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* 1. TOP HEADER */}
        <div className="p-4 bg-gradient-to-r from-purple-900/60 to-indigo-900/60 border-b border-purple-800/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600/40 border border-purple-400/50 flex items-center justify-center text-white">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Passenger Services Checkout</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold uppercase tracking-wide">
                  Razorpay Test Mode
                </span>
              </h3>
              <p className="text-[11px] text-purple-200">
                Sandbox Environment • ₹0 Real Money Deducted
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={resetModal}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. BODY CONTENT */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* STEP 1: SERVICE SELECTION */}
          {step === 'SELECT' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-300">
                Select an essential station assistance service for <strong>{passengerName}</strong> at{' '}
                <strong>{stationCode}</strong>:
              </p>

              <div className="grid grid-cols-1 gap-2.5">
                {PASSENGER_SERVICES_CATALOG.map((srv) => {
                  const isSelected = selectedService.id === srv.id;
                  return (
                    <div
                      key={srv.id}
                      onClick={() => setSelectedService(srv)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-purple-950/60 border-purple-500 shadow-md shadow-purple-500/20'
                          : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{srv.icon}</span>
                        <div>
                          <h4 className="text-xs font-bold text-white">{srv.name}</h4>
                          <p className="text-[11px] text-slate-400 line-clamp-1">{srv.description}</p>
                          <span className="text-[10px] text-purple-300 font-medium">
                            ⏱️ Available in ~{srv.turnaroundMinutes} mins at coach door
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-sm font-black text-emerald-400">₹{srv.priceRupees}</div>
                        <span className="text-[10px] text-slate-400">fixed tariff</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleProceedToCheckout}
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-98 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>Generate Test Order (₹{selectedService.priceRupees})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: TEST CHECKOUT SIMULATOR */}
          {step === 'CHECKOUT' && activeOrder && (
            <div className="space-y-4">
              <div className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Order ID:</span>
                  <strong className="text-purple-300 font-mono text-[11px]">{activeOrder.orderId}</strong>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Service:</span>
                  <strong className="text-white">{selectedService.name}</strong>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Total Due:</span>
                  <strong className="text-emerald-400 text-sm">₹{selectedService.priceRupees}.00</strong>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">Choose Test Payment Method:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['UPI', 'CARD', 'NETBANKING'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setSelectedMethod(method)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        selectedMethod === method
                          ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-blue-950/40 border border-blue-800/40 rounded-xl p-3 text-[11px] text-blue-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Test sandbox mode: HMAC-SHA256 signature verified server-side.</span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setStep('SELECT')}
                  className="w-1/3 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSimulatePayment}
                  className="w-2/3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Simulate Test Success (₹{selectedService.priceRupees})</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: VERIFYING */}
          {step === 'VERIFYING' && (
            <div className="py-8 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-12 h-12 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
              <h4 className="text-sm font-bold text-white">Verifying Razorpay Webhook & Signature...</h4>
              <p className="text-xs text-slate-400 max-w-xs">
                Executing HMAC SHA-256 validation and appending transaction to immutable passenger ledger.
              </p>
            </div>
          )}

          {/* STEP 4: SUCCESS RECEIPT */}
          {step === 'SUCCESS' && confirmedReceipt && (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div>
                <h4 className="text-base font-bold text-white">Passenger Service Confirmed!</h4>
                <p className="text-xs text-slate-400">
                  Transaction recorded in Nirantar Passenger Services Ledger
                </p>
              </div>

              {/* Receipt Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-left space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Payment ID:</span>
                  <span className="font-mono text-purple-300 font-bold">{confirmedReceipt.paymentId}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Service:</span>
                  <strong className="text-white">{confirmedReceipt.serviceName}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Station / Passenger:</span>
                  <span className="text-slate-200">{confirmedReceipt.stationCode} • {confirmedReceipt.passengerName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Amount Paid:</span>
                  <strong className="text-emerald-400 font-black">₹{confirmedReceipt.amountRupees}.00 (Sandbox)</strong>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                  <span>Status:</span>
                  <span className="text-emerald-400 font-bold uppercase">COMMITTED TO LEDGER</span>
                </div>
              </div>

              <button
                type="button"
                onClick={resetModal}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
              >
                Done / Return to Tracker
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
