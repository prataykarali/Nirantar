import React from 'react';
import {
  X,
  Printer,
  Download,
  Share2,
  ShieldCheck,
  QrCode,
  FileText,
  CheckCircle2,
  Train,
  Building,
} from 'lucide-react';

export interface InvoiceData {
  invoiceNumber: string;
  pnrNumber: string;
  transactionRef: string;
  trainNumber: string;
  trainName: string;
  fromStation: string;
  fromCode: string;
  toStation: string;
  toCode: string;
  travelDate: string;
  passengerName: string;
  coach: string;
  seat: string;
  classCode: string;
  amount: number;
  paymentMode: string;
  date: string;
}

interface TicketInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceData | null;
}

export const TicketInvoiceModal: React.FC<TicketInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice,
}) => {
  if (!isOpen || !invoice) return null;

  const baseFare = Math.round(invoice.amount * 0.9);
  const reservationFee = 50;
  const superfastFee = 45;
  const taxableValue = baseFare + reservationFee + superfastFee;
  const cgst = Math.round((taxableValue * 0.025) * 100) / 100;
  const sgst = Math.round((taxableValue * 0.025) * 100) / 100;
  const totalAmount = invoice.amount;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-purple-200 shadow-2xl overflow-hidden font-sans select-none flex flex-col max-h-[92vh]">
        {/* Header with Print & Close CTA */}
        <div className="p-4 px-6 bg-gradient-to-r from-purple-950 via-slate-900 to-purple-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-purple-300">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Official Railway Tax Invoice</h3>
              <p className="text-[10px] text-purple-200/80 font-mono">Invoice #{invoice.invoiceNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Print Tax Invoice"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-800 bg-[#FCFBFD]">
          {/* Official Letterhead */}
          <div className="flex items-start justify-between border-b-2 border-purple-900/20 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <img
                  src="/assets/images/brand/nirantar_logo_icon.png"
                  alt="Nirantar"
                  className="w-7 h-7 object-contain"
                />
                <span className="font-display font-black text-base text-purple-950">
                  NIRANTAR e-TICKETING SERVICE
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                Indian Railway Catering & Tourism Corporation Ltd. (IRCTC)<br />
                State Entry Road, New Delhi — 110001 • GSTIN: <strong>07AAACI1234F1Z8</strong><br />
                SAC Code: <strong>996411</strong> (Passenger Railway Transport Services)
              </p>
            </div>

            <div className="text-right space-y-0.5">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">TAX INVOICE (SEC 31 CGST)</span>
              <span className="font-mono font-bold text-xs text-purple-950 block">{invoice.invoiceNumber}</span>
              <span className="text-[11px] text-slate-500 font-medium block">Date: {invoice.date}</span>
            </div>
          </div>

          {/* Passenger & Journey Block */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-white border border-purple-100 shadow-2xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Passenger Name</span>
              <span className="font-bold text-slate-900 text-xs">{invoice.passengerName}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">PNR Number</span>
              <span className="font-mono font-black text-purple-800 text-xs">{invoice.pnrNumber}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Train Details</span>
              <span className="font-bold text-slate-900 text-xs">{invoice.trainNumber} • {invoice.trainName}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Class & Coach</span>
              <span className="font-bold text-purple-900 text-xs">{invoice.classCode} • {invoice.coach} / Seat {invoice.seat}</span>
            </div>
          </div>

          {/* Itemized Fare & GST Table */}
          <div className="rounded-2xl border border-purple-100 bg-white overflow-hidden shadow-2xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-purple-50/80 text-purple-950 text-[11px] font-bold border-b border-purple-100">
                  <th className="p-2.5 px-3">Description</th>
                  <th className="p-2.5 text-center">SAC Code</th>
                  <th className="p-2.5 text-right">Rate</th>
                  <th className="p-2.5 text-right px-3">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50 text-slate-700 text-xs font-medium">
                <tr>
                  <td className="p-2.5 px-3">Base Passenger Travel Fare ({invoice.fromCode} → {invoice.toCode})</td>
                  <td className="p-2.5 text-center font-mono text-slate-500">996411</td>
                  <td className="p-2.5 text-right">1 Unit</td>
                  <td className="p-2.5 text-right px-3 font-semibold text-slate-900">₹{baseFare.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="p-2.5 px-3">IRCTC Reservation & Development Charges</td>
                  <td className="p-2.5 text-center font-mono text-slate-500">996411</td>
                  <td className="p-2.5 text-right">1 Unit</td>
                  <td className="p-2.5 text-right px-3 font-semibold text-slate-900">₹{reservationFee.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="p-2.5 px-3">Superfast Express Surcharge</td>
                  <td className="p-2.5 text-center font-mono text-slate-500">996411</td>
                  <td className="p-2.5 text-right">1 Unit</td>
                  <td className="p-2.5 text-right px-3 font-semibold text-slate-900">₹{superfastFee.toFixed(2)}</td>
                </tr>
                <tr className="bg-purple-50/30 font-bold text-slate-900">
                  <td className="p-2 px-3" colSpan={3}>Total Taxable Value</td>
                  <td className="p-2 text-right px-3 font-mono">₹{taxableValue.toFixed(2)}</td>
                </tr>
                <tr className="text-slate-600">
                  <td className="p-2 px-3" colSpan={3}>Central GST (CGST @ 2.5%)</td>
                  <td className="p-2 text-right px-3 font-mono">₹{cgst.toFixed(2)}</td>
                </tr>
                <tr className="text-slate-600">
                  <td className="p-2 px-3" colSpan={3}>State / UT GST (SGST @ 2.5%)</td>
                  <td className="p-2 text-right px-3 font-mono">₹{sgst.toFixed(2)}</td>
                </tr>
                <tr className="bg-purple-900 text-white font-black text-sm">
                  <td className="p-3 px-4" colSpan={3}>Total Invoice Value (Including GST)</td>
                  <td className="p-3 text-right px-4 font-mono text-emerald-300">₹{totalAmount.toLocaleString('en-IN')}.00</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment Reference & Verification QR */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-purple-100 shadow-2xs">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>Payment Status: Confirmed & Paid</span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                TXN Ref: {invoice.transactionRef} • Mode: {invoice.paymentMode}
              </p>
              <p className="text-[10px] text-slate-400">
                This is a computer-generated tax invoice and does not require physical signature.
              </p>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center p-2 rounded-xl bg-purple-50/70 border border-purple-200">
              <QrCode className="w-12 h-12 text-slate-900" />
              <span className="text-[8px] font-mono text-purple-800 font-bold mt-0.5">DigiLocker QR</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 px-6 bg-slate-50 border-t border-purple-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            Saved to citizen DigiLocker repository
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => alert('📥 PDF Tax Invoice downloaded with encrypted digital signature.')}
              className="px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketInvoiceModal;
