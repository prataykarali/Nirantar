import React, { useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Download,
  Receipt,
  ShieldCheck,
  Lock,
  ArrowRight,
  Filter,
  Search,
  FileText,
  Clock,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useJourney } from '../context/JourneyContext';
import { TicketInvoiceModal, InvoiceData } from '../components/journey/TicketInvoiceModal';

type StatusFilter = 'ALL' | 'PAID' | 'REFUNDED' | 'PROCESSING';

interface PaymentItem {
  id: string;
  txnId: string;
  service: string;
  date: string;
  amount: number;
  mode: string;
  status: 'Paid' | 'Refunded' | 'Processing';
  pnr?: string;
}

export const PaymentsPage: React.FC = () => {
  const { navigateTo, paymentAttempt, paymentHistory, issuedTicket, searchParams } = useJourney();
  const [filter, setFilter] = useState<StatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);

  const dynamicHistoryPayments: PaymentItem[] = (paymentHistory || []).map((p) => ({
    id: p.id,
    txnId: p.transactionRef || `TXN-${p.id.slice(0, 8).toUpperCase()}`,
    service: `Ticket: ${issuedTicket?.train?.trainName || 'Rajdhani Express'} (${issuedTicket?.train?.trainNumber || '12302'})`,
    date: p.createdAt ? new Date(p.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Today, Just now',
    amount: p.amount || 2990,
    mode: p.method === 'WALLET' ? 'Nirantar Citizen Virtual Wallet' : `${p.method} (Nirantar Bridge)`,
    status: p.state === 'BOOKING_CONFIRMED' || p.state === 'SUCCESS' ? 'Paid' : 'Processing',
    pnr: issuedTicket?.pnrNumber || '2847 5896 1234',
  }));

  const defaultPayments: PaymentItem[] = [
    ...dynamicHistoryPayments,
    {
      id: 'tx-2',
      txnId: 'TXN-91028491022',
      service: 'Refund: Tatkal AC 2-Tier Cancellation',
      date: '18 May 2026, 11:05 IST',
      amount: 1950,
      mode: 'HDFC Bank NetBanking',
      status: 'Refunded',
      pnr: '4920 1849 8831',
    },
    {
      id: 'tx-3',
      txnId: 'TXN-10294820194',
      service: 'IRCTC e-Catering: Hot Dinner Thali',
      date: '12 Apr 2026, 19:40 IST',
      amount: 280,
      mode: 'UPI • PhonePe',
      status: 'Paid',
    },
  ];

  const totalBookingsAmount = React.useMemo(() => {
    return defaultPayments
      .filter((p) => p.status === 'Paid')
      .reduce((sum, p) => sum + p.amount, 0);
  }, [defaultPayments]);

  const totalRefundsAmount = React.useMemo(() => {
    return defaultPayments
      .filter((p) => p.status === 'Refunded')
      .reduce((sum, p) => sum + p.amount, 0);
  }, [defaultPayments]);

  const totalPendingAmount = React.useMemo(() => {
    return defaultPayments
      .filter((p) => p.status === 'Processing')
      .reduce((sum, p) => sum + p.amount, 0);
  }, [defaultPayments]);

  const confirmedJourneysCount = React.useMemo(() => {
    return defaultPayments.filter((p) => p.status === 'Paid').length;
  }, [defaultPayments]);

  const filtered = defaultPayments.filter((p) => {
    if (filter !== 'ALL' && p.status.toUpperCase() !== filter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.service.toLowerCase().includes(q) || p.txnId.toLowerCase().includes(q) || (p.pnr && p.pnr.includes(q));
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-3.5 pb-6 select-none font-sans text-slate-800">
      {/* ═══════════════════════════════════════════════════════════════════
          1. TOP SUMMARY STATS CARDS
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-[24px] p-4 shadow-sm border border-purple-100 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-purple-700" />
              <span>Payments & Financial Ledger</span>
            </h1>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Double-verification payment ledger, instant refund audits & GST tax invoices
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => alert('📄 Consolidated financial statement for 2026-2027 downloaded.')}
              className="px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold flex items-center gap-1.5 transition-colors border border-purple-200 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-purple-700" />
              <span>Export Statement</span>
            </button>
          </div>
        </div>

        {/* 4 Stat Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Bookings</span>
            <div className="text-base sm:text-lg font-black text-slate-900">₹{totalBookingsAmount.toLocaleString('en-IN')}</div>
            <span className="text-[10px] font-semibold text-emerald-600">{confirmedJourneysCount} Confirmed Journeys</span>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Refunds Processed</span>
            <div className="text-base sm:text-lg font-black text-emerald-800">₹{totalRefundsAmount.toLocaleString('en-IN')}</div>
            <span className="text-[10px] font-semibold text-emerald-700">100% Direct to Source</span>
          </div>

          <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending / Uncertain</span>
            <div className="text-base sm:text-lg font-black text-slate-900">₹{totalPendingAmount.toLocaleString('en-IN')}</div>
            <span className="text-[10px] font-semibold text-slate-500">{totalPendingAmount === 0 ? 'Zero Unresolved TXNs' : 'Active Settlement'}</span>
          </div>

          <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Security Score</span>
            <div className="text-base sm:text-lg font-black text-purple-900">100% Safe</div>
            <span className="text-[10px] font-semibold text-purple-700">Zero-Secret AI Isolation</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          2. TRANSACTIONS LIST & FILTER BAR
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-[24px] p-4 shadow-sm border border-purple-100 space-y-3.5">
        {/* Search and Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-50 pb-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-purple-50/60 border border-purple-100 text-xs">
            {(['ALL', 'PAID', 'REFUNDED', 'PROCESSING'] as StatusFilter[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  filter === tab
                    ? 'bg-white text-purple-950 shadow-xs border border-purple-200'
                    : 'text-slate-600 hover:text-purple-900'
                }`}
              >
                {tab === 'ALL' ? 'All Transactions' : tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-purple-600 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search TXN ID, Train, PNR..."
              className="pl-8 pr-3 py-1.5 rounded-xl bg-purple-50/50 border border-purple-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-purple-600 w-full sm:w-60"
            />
          </div>
        </div>

        {/* Transaction Cards */}
        <div className="space-y-2.5">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-2xl bg-purple-50/30 hover:bg-purple-50/70 border border-purple-100 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              {/* Left Details */}
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                    item.status === 'Paid'
                      ? 'bg-emerald-100 text-emerald-700'
                      : item.status === 'Refunded'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">{item.service}</h4>
                    {item.pnr && (
                      <span className="font-mono text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                        PNR: {item.pnr}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-2">
                    <span>{item.date}</span>
                    <span>•</span>
                    <span className="font-mono">{item.txnId}</span>
                    <span>•</span>
                    <span>{item.mode}</span>
                  </p>
                </div>
              </div>

              {/* Right Amount & Receipt Download */}
              <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-purple-100/50">
                <div className="text-left sm:text-right">
                  <span
                    className={`text-sm sm:text-base font-black block ${
                      item.status === 'Refunded' ? 'text-blue-700' : 'text-slate-900'
                    }`}
                  >
                    {item.status === 'Refunded' ? `+₹${item.amount}` : `₹${item.amount}`}
                  </span>
                  <span
                    className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.status === 'Paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.status === 'Refunded'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedInvoice({
                      invoiceNumber: `INV-2026-${item.txnId.slice(4, 12)}`,
                      pnrNumber: item.pnr || '2847 5896 1234',
                      transactionRef: item.txnId,
                      trainNumber: item.service.includes('12951') ? '12951' : item.service.includes('22436') ? '22436' : '12302',
                      trainName: item.service.includes('Vande Bharat')
                        ? 'Vande Bharat Express'
                        : item.service.includes('Mumbai')
                        ? 'Mumbai Rajdhani Express'
                        : 'Howrah Rajdhani Express',
                      fromStation: 'New Delhi',
                      fromCode: 'NDLS',
                      toStation: item.service.includes('Mumbai') ? 'Mumbai Central' : item.service.includes('Vande') ? 'Varanasi' : 'Howrah',
                      toCode: item.service.includes('Mumbai') ? 'MMCT' : item.service.includes('Vande') ? 'BSB' : 'HWH',
                      travelDate: item.date,
                      passengerName: 'Ananya Sharma',
                      coach: '3A (B4)',
                      seat: '28 (Lower)',
                      classCode: '3A',
                      amount: item.amount,
                      paymentMode: item.mode,
                      date: item.date,
                    })
                  }
                  className="px-3 py-1.5 rounded-xl bg-white border border-purple-200 text-purple-900 hover:bg-purple-50 text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <FileText className="w-3.5 h-3.5 text-purple-700" />
                  <span>Invoice</span>
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-8 space-y-2">
              <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-500">No transactions found matching criteria.</p>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          3. DOUBLE-VERIFICATION RECOVERY GUARANTEE BANNER
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white rounded-[24px] p-4 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 text-emerald-400 flex items-center justify-center font-bold shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">
              Nirantar Zero-Deduction Failure Guarantee
            </h3>
            <p className="text-xs text-purple-200/80 mt-0.5">
              If any payment is interrupted, our deterministic recovery engine auto-resolves with your bank within 120s or triggers instant refund.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => alert('🔒 All financial transactions are verified via SHA-256 idempotency tokens.')}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all cursor-pointer whitespace-nowrap self-start sm:self-center shrink-0"
        >
          Security Architecture →
        </button>
      </div>

      {/* OFFICIAL GST TAX INVOICE MODAL */}
      <TicketInvoiceModal
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        invoice={selectedInvoice}
      />
    </div>
  );
};

export default PaymentsPage;
