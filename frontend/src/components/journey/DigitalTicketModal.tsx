import React from 'react';
import {
  X,
  Printer,
  Download,
  Train,
  CheckCircle2,
  QrCode,
  ShieldCheck,
  MapPin,
  Calendar,
  Clock,
  User,
  Sparkles,
  Zap,
  Award,
  Compass,
} from 'lucide-react';
import { useJourney } from '../../context/JourneyContext';

export interface TicketPassenger {
  name: string;
  age: number;
  gender: string;
  coach: string;
  seatNumber: number | string;
  berthType: string;
  concession?: string;
  status: string;
}

export interface TicketDetails {
  pnr: string;
  ticketId: string;
  trainNumber: string;
  trainName: string;
  classCode: string;
  className: string;
  quota: string;
  fromCity: string;
  fromCode: string;
  fromPlatform: string;
  toCity: string;
  toCode: string;
  toPlatform: string;
  departureDate: string;
  departureTime: string;
  arrivalDate: string;
  arrivalTime: string;
  duration: string;
  distanceKm: number;
  passengers: TicketPassenger[];
  baseFare: number;
  reservationCharge: number;
  superfastCharge: number;
  cgst: number;
  sgst: number;
  totalFare: number;
  paymentMethod: string;
  bookingRef: string;
}

interface DigitalTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket?: TicketDetails | null;
}

export const DigitalTicketModal: React.FC<DigitalTicketModalProps> = ({
  isOpen,
  onClose,
  ticket,
}) => {
  const { activeReallocations } = useJourney();

  if (!isOpen || !ticket) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto border border-purple-100 flex flex-col font-sans select-none">
        {/* ═══════════════════════════════════════════════════════════════════
            1. TOP HEADER & ACTION BUTTONS
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 p-4 sm:p-5 text-white flex items-center justify-between gap-3 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-800/80 border border-purple-600/60 flex items-center justify-center text-white shrink-0">
              <Train className="w-5 h-5 text-purple-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-black tracking-tight text-white">
                  Electronic Railway Ticket (e-Ticket)
                </span>
                <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30">
                  CONFIRMED
                </span>
              </div>
              <p className="text-[10px] text-purple-200 font-mono">
                Ministry of Railways • DigiLocker Verified
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer text-xs flex items-center gap-1 font-bold"
              title="Print E-Ticket"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              type="button"
              onClick={() => alert(`Downloaded E-Ticket PDF for PNR #${ticket.pnr}`)}
              className="p-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white transition-colors cursor-pointer text-xs flex items-center gap-1 font-bold shadow-xs"
              title="Download Ticket PDF"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-white/10 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            2. TICKET BODY (LETTERHEAD, JOURNEY ROUTE, PASSENGERS, QR CODE)
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="p-5 sm:p-6 space-y-4 text-slate-800">
          {/* PNR & Train Metadata Strip */}
          <div className="bg-purple-50/70 rounded-2xl p-3.5 border border-purple-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-400 block">PNR NUMBER</span>
              <span className="font-mono font-black text-sm text-[#7C3AED]">{ticket.pnr}</span>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-400 block">TRAIN NUMBER & NAME</span>
              <span className="font-bold text-xs text-slate-900 block truncate">
                {ticket.trainNumber} • {ticket.trainName}
              </span>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-400 block">CLASS & QUOTA</span>
              <span className="font-bold text-xs text-slate-900 block">
                {ticket.classCode} ({ticket.className}) • {ticket.quota}
              </span>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-400 block">TOTAL FARE</span>
              <span className="font-mono font-black text-sm text-emerald-700">₹{ticket.totalFare}</span>
            </div>
          </div>

          {/* First & Last Stoppage Journey Card */}
          <div className="border border-purple-100 rounded-2xl p-4 bg-white shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-purple-50">
              <span className="font-bold text-purple-950 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-purple-700" />
                <span>Trip Stoppage & Platform Schedule</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono font-bold">
                Distance: {ticket.distanceKm} km • Duration: {ticket.duration}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Origin Stoppage */}
              <div className="p-3 rounded-xl bg-purple-50/40 border border-purple-100/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-100 px-2 py-0.2 rounded">
                    FIRST STOPPAGE (ORIGIN)
                  </span>
                  <span className="text-[10px] font-bold text-purple-900">{ticket.fromPlatform}</span>
                </div>
                <h4 className="font-black text-sm text-slate-900">
                  {ticket.fromCity} ({ticket.fromCode})
                </h4>
                <p className="text-[11px] text-slate-600 font-medium flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>Departure: <strong>{ticket.departureTime}</strong> ({ticket.departureDate})</span>
                </p>
              </div>

              {/* Destination Stoppage */}
              <div className="p-3 rounded-xl bg-purple-50/40 border border-purple-100/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-purple-800 bg-purple-100 px-2 py-0.2 rounded">
                    LAST STOPPAGE (DESTINATION)
                  </span>
                  <span className="text-[10px] font-bold text-purple-900">{ticket.toPlatform}</span>
                </div>
                <h4 className="font-black text-sm text-slate-900">
                  {ticket.toCity} ({ticket.toCode})
                </h4>
                <p className="text-[11px] text-slate-600 font-medium flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>Arrival: <strong>{ticket.arrivalTime}</strong> ({ticket.arrivalDate})</span>
                </p>
              </div>
            </div>
          </div>

          {/* Passenger Roster */}
          <div className="border border-purple-100 rounded-2xl p-4 bg-white shadow-xs space-y-2.5">
            <h4 className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-purple-700" />
              <span>Passenger Details & Berth Allocation ({ticket.passengers.length})</span>
            </h4>

            <div className="space-y-2">
              {ticket.passengers.map((p, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 px-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-900 font-bold flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{p.name}</span>
                        <span className="text-[10px] text-slate-500">
                          {p.age} yrs • {p.gender}
                        </span>
                        {p.concession && (
                          <span className="text-[9px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-bold">
                            {p.concession}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-emerald-700 font-semibold block">
                        Aadhaar Verified Citizen • No PII Exposed to AI
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-black text-xs text-purple-900 block">
                      Coach {p.coach} • Seat {p.seatNumber}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {p.berthType} Berth ({p.status})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mid-Journey Berth Upgrade / Reallocation Endorsement */}
          {activeReallocations && activeReallocations.length > 0 && (
            <div className="border border-emerald-300 rounded-2xl p-4 bg-gradient-to-r from-emerald-50 via-white to-emerald-50/60 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-emerald-600 text-white">
                    <Zap className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-emerald-950 flex items-center gap-1.5">
                      <span>Official Mid-Journey Seat Reallocation Endorsement</span>
                      <span className="px-2 py-0.2 rounded-full bg-emerald-200 text-emerald-900 text-[9px] font-black">
                        TTE VERIFIED
                      </span>
                    </h4>
                    <p className="text-[10px] text-emerald-800 font-medium">
                      Authorized by on-board train conductor upon co-passenger deboarding.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                  {activeReallocations[0].id}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-white border border-emerald-200 space-y-0.5">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">ORIGINAL RESERVATION</span>
                  <strong className="text-slate-700 block">
                    Coach {activeReallocations[0].fromCoach} • Seat #{activeReallocations[0].fromSeat} ({activeReallocations[0].fromBerthType})
                  </strong>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-100/70 border border-emerald-300 space-y-0.5">
                  <span className="text-[9px] uppercase font-bold text-emerald-800 block">APPROVED MID-JOURNEY BERTH</span>
                  <strong className="text-emerald-950 block text-sm">
                    Coach {activeReallocations[0].toCoach} • Seat #{activeReallocations[0].toSeat} ({activeReallocations[0].toBerthType})
                  </strong>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-emerald-900 font-medium pt-1 border-t border-emerald-200/60 flex-wrap gap-2">
                <span>Effective from: <strong>{activeReallocations[0].effectiveFromStation} ({activeReallocations[0].effectiveFromStationCode})</strong> onwards</span>
                <span>Endorsed by: <strong>{activeReallocations[0].approvedBy}</strong></span>
              </div>
            </div>
          )}

          {/* Verification QR Code & DigiLocker Guarantee */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-50/80 via-white to-purple-50/60 border border-purple-100 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl p-1 shadow-xs border border-purple-100 shrink-0 flex items-center justify-center">
                <QrCode className="w-10 h-10 text-slate-900" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>DigiLocker & TTE Scannable QR Code</span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium">
                  Scan this QR code during on-board ticket inspection. No printed copy strictly required when DigiLocker is linked.
                </p>
              </div>
            </div>

            <div className="text-right shrink-0 hidden sm:block">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">PAYMENT ID</span>
              <span className="font-mono text-xs text-slate-700 font-bold">{ticket.bookingRef}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
