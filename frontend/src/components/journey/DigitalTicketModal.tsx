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

  const handleDownloadTicket = () => {
    const activeRealloc = activeReallocations && activeReallocations.length > 0 ? activeReallocations[0] : null;
    const ticketContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Electronic Railway Ticket - PNR ${ticket.pnr}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #0f172a; padding: 28px; }
    .ticket-card { max-width: 720px; margin: 0 auto; background: #ffffff; border: 2px solid #7c3aed; border-radius: 20px; padding: 28px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
    .header { border-bottom: 2px solid #ede9fe; padding-bottom: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
    .title { color: #581c87; font-size: 22px; font-weight: 900; margin: 0; }
    .badge { background: #dcfce7; color: #166534; font-weight: bold; font-size: 11px; padding: 4px 12px; border-radius: 9999px; border: 1px solid #86efac; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
    .box { background: #f8f6fd; border: 1px solid #ddd6fe; border-radius: 12px; padding: 12px; }
    .label { font-size: 10px; color: #6b7280; text-transform: uppercase; font-weight: bold; }
    .value { font-size: 14px; font-weight: bold; color: #1e1b4b; margin-top: 2px; }
    .passenger-table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
    .passenger-table th, .passenger-table td { padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    .passenger-table th { background: #f1f5f9; color: #475569; font-size: 11px; }
    .reallocation { background: #ecfdf5; border: 1.5px solid #10b981; border-radius: 12px; padding: 14px; margin-top: 16px; font-size: 12px; }
    .reallocation-title { color: #065f46; font-weight: bold; font-size: 13px; margin-bottom: 6px; }
    .footer { margin-top: 24px; font-size: 11px; color: #64748b; text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 12px; }
  </style>
</head>
<body>
  <div class="ticket-card">
    <div class="header">
      <div>
        <h1 class="title">INDIAN RAILWAYS e-TICKET</h1>
        <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">Ministry of Railways • DigiLocker Verified Passenger</p>
      </div>
      <span class="badge">CONFIRMED</span>
    </div>

    <div class="grid">
      <div class="box">
        <div class="label">PNR NUMBER</div>
        <div class="value" style="font-family: monospace; letter-spacing: 1px;">${ticket.pnr}</div>
      </div>
      <div class="box">
        <div class="label">TRAIN NUMBER & NAME</div>
        <div class="value">#${ticket.trainNumber} - ${ticket.trainName}</div>
      </div>
    </div>

    <div class="grid">
      <div class="box">
        <div class="label">FROM STATION</div>
        <div class="value">${ticket.fromCity} (${ticket.fromCode}) - ${ticket.fromPlatform}</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Dep: ${ticket.departureTime} (${ticket.departureDate})</div>
      </div>
      <div class="box">
        <div class="label">TO DESTINATION</div>
        <div class="value">${ticket.toCity} (${ticket.toCode}) - ${ticket.toPlatform}</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Arr: ${ticket.arrivalTime} (${ticket.arrivalDate})</div>
      </div>
    </div>

    <div class="box" style="margin-bottom: 16px;">
      <div class="label">PASSENGER DETAILS & BERTH ROSTER</div>
      <table class="passenger-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Passenger</th>
            <th>Coach</th>
            <th>Seat / Berth</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${ticket.passengers.map((p, idx) => {
            const reallocForPassenger = activeReallocations?.find(
              (r) =>
                r.passengerName &&
                p.name &&
                r.passengerName.trim().toLowerCase() === p.name.trim().toLowerCase() &&
                (!r.trainNumber || r.trainNumber === ticket.trainNumber)
            );
            const hasRealloc = Boolean(reallocForPassenger);
            const isApproved = hasRealloc && reallocForPassenger?.status === 'APPROVED';
            return `
            <tr>
              <td>${idx + 1}</td>
              <td><strong>${p.name}</strong> (${p.age}y, ${p.gender})</td>
              <td><strong style="color: #7c3aed;">Coach ${p.coach}</strong></td>
              <td>
                <strong>Seat ${hasRealloc ? `${p.seatNumber} + ${reallocForPassenger?.toSeat}` : p.seatNumber}</strong> (${p.berthType})
                ${hasRealloc ? `<br><span style="font-size:10px; color:${isApproved ? '#047857' : '#b45309'}; font-weight:bold;">From Station: ${reallocForPassenger?.effectiveFromStation} • Seat #${reallocForPassenger?.toSeat} taken by ${reallocForPassenger?.passengerName} • ₹0 (NO Extra Cost)</span>` : ''}
              </td>
              <td>
                <span class="badge" style="${hasRealloc ? (isApproved ? 'background:#d1fae5; color:#065f46; border:1px solid #10b981;' : 'background:#fef3c7; color:#92400e; border:1px solid #f59e0b;') : ''}">
                  ${hasRealloc ? (isApproved ? 'TTE APPROVED ✓' : 'REQUESTED NOT APPROVED') : p.status}
                </span>
              </td>
            </tr>
          `;
          }).join('')}
        </tbody>
      </table>
    </div>

    ${(() => {
      const ticketReallocs = (activeReallocations || []).filter(
        (r) =>
          (!r.trainNumber || r.trainNumber === ticket.trainNumber) &&
          ticket.passengers.some((tp) => tp.name?.trim().toLowerCase() === r.passengerName?.trim().toLowerCase())
      );
      if (ticketReallocs.length === 0) return '';
      return ticketReallocs.map((realloc) => `
      <div class="reallocation" style="background: ${realloc.status === 'APPROVED' ? '#ecfdf5' : '#fffbeb'}; border: 1.5px solid ${realloc.status === 'APPROVED' ? '#10b981' : '#f59e0b'}; border-radius: 12px; padding: 14px; margin-top: 16px; font-size: 12px;">
        <div class="reallocation-title" style="color: ${realloc.status === 'APPROVED' ? '#065f46' : '#92400e'}; font-weight: bold; font-size: 13px; margin-bottom: 6px;">
          ⚡ MID-JOURNEY VACANT BERTH ${realloc.status === 'APPROVED' ? 'SHIFT APPROVED BY TTE' : 'REQUEST (PENDING)'} • ₹0 (NO EXTRA COST)
        </div>
        <div><strong>Original Reservation:</strong> Coach ${realloc.fromCoach} • Seat #${realloc.fromSeat} (${realloc.fromBerthType})</div>
        <div><strong>Shifted Vacant Berth:</strong> Coach ${realloc.toCoach} • Seat #${realloc.toSeat} (${realloc.toBerthType}) requested by <strong>${realloc.passengerName}</strong></div>
        <div><strong>From Station:</strong> ${realloc.effectiveFromStation} (${realloc.effectiveFromStationCode}) onwards</div>
        <div><strong>Fare Adjustment:</strong> ₹0.00 (NO Extra Cost)</div>
        <div><strong>Approval Status:</strong> ${realloc.status === 'APPROVED' ? 'OFFICIALLY APPROVED BY TTE (#IR-77492)' : 'REQUESTED NOT APPROVED (Pending on-board TTE physical chart verification)'}</div>
        <div><strong>Request Reference:</strong> ${realloc.id} • ${realloc.approvedBy}</div>
      </div>
      `).join('');
    })()}

    <div class="footer">
      Total Fare Paid: ₹${ticket.totalFare} • Payment Ref: ${ticket.bookingRef}<br>
      Carry original Government ID (Aadhaar / DigiLocker / Voter ID) during journey.
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([ticketContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `IRCTC_eTicket_${ticket.pnr.replace(/\s+/g, '')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92dvh] overflow-y-auto border border-purple-100 flex flex-col font-sans select-none">
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
              onClick={handleDownloadTicket}
              className="p-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white transition-colors cursor-pointer text-xs flex items-center gap-1 font-bold shadow-xs"
              title="Download Ticket HTML/PDF"
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
                  <span className="text-[10px] font-mono font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200">
                    {ticket.fromPlatform ? ticket.fromPlatform.replace(/Platform/i, 'PF') : 'PF 1'}
                  </span>
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
                  <span className="text-[10px] font-mono font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200">
                    {ticket.toPlatform ? ticket.toPlatform.replace(/Platform/i, 'PF') : 'PF 9'}
                  </span>
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
              {ticket.passengers.map((p, idx) => {
                const reallocForPassenger = activeReallocations?.find(
                  (r) =>
                    r.passengerName &&
                    p.name &&
                    r.passengerName.trim().toLowerCase() === p.name.trim().toLowerCase() &&
                    (!r.trainNumber || r.trainNumber === ticket.trainNumber)
                );
                const isApproved = reallocForPassenger?.status === 'APPROVED';

                return (
                  <div
                    key={idx}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-2xl border text-xs gap-2 transition-all ${
                      reallocForPassenger
                        ? isApproved
                          ? 'bg-emerald-50/90 border-emerald-300 ring-1 ring-emerald-300/60 shadow-xs'
                          : 'bg-amber-50/90 border-amber-300 ring-1 ring-amber-300/60 shadow-xs'
                        : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-900 font-bold flex items-center justify-center text-[10px] shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-slate-900 text-sm">{p.name}</span>
                          <span className="text-[10px] text-slate-500">
                            {p.age} yrs • {p.gender}
                          </span>
                          {p.concession && (
                            <span className="text-[9px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-bold">
                              {p.concession}
                            </span>
                          )}
                          {reallocForPassenger && (
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                              isApproved
                                ? 'bg-emerald-200 text-emerald-950 border-emerald-400'
                                : 'bg-amber-200 text-amber-950 border-amber-400'
                            }`}>
                              {isApproved ? '⚡ TTE APPROVED SHIFT' : '⚡ VACANT BERTH REQUESTED'}
                            </span>
                          )}
                        </div>
                        {reallocForPassenger ? (
                          <div className={`text-[11px] mt-1 font-medium space-y-0.5 ${isApproved ? 'text-emerald-900' : 'text-amber-900'}`}>
                            <span className="block font-bold text-slate-800">
                              From Station: <strong>{reallocForPassenger.effectiveFromStation} ({reallocForPassenger.effectiveFromStationCode})</strong> • Seat #{reallocForPassenger.toSeat} ({reallocForPassenger.toBerthType}) requested by <strong>{reallocForPassenger.passengerName}</strong>
                            </span>
                            <span className="text-emerald-700 font-black flex items-center gap-1">
                              <span>✓ ₹0 (NO Extra Cost - Mid-Journey Vacant Berth Allotment)</span>
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-emerald-700 font-semibold block">
                            Aadhaar Verified Citizen • No PII Exposed to AI
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-left sm:text-right shrink-0 border-t sm:border-t-0 pt-1.5 sm:pt-0 border-slate-200">
                      {reallocForPassenger ? (
                        <div>
                          <span className={`font-mono font-black text-sm block ${isApproved ? 'text-emerald-950' : 'text-amber-950'}`}>
                            Coach {p.coach} • Seat {p.seatNumber} + {reallocForPassenger.toSeat}
                          </span>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border inline-block mt-0.5 ${
                            isApproved
                              ? 'bg-emerald-200 text-emerald-900 border-emerald-300'
                              : 'bg-amber-200 text-amber-900 border-amber-300'
                          }`}>
                            {isApproved ? 'TTE APPROVED ✓' : 'REQUESTED NOT APPROVED'}
                          </span>
                        </div>
                      ) : (
                        <div>
                          <span className="font-mono font-black text-xs text-purple-900 block">
                            Coach {p.coach} • Seat {p.seatNumber}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {p.berthType} Berth ({p.status})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mid-Journey Berth Upgrade / Reallocation Endorsement */}
          {(() => {
            const ticketReallocs = (activeReallocations || []).filter(
              (r) =>
                (!r.trainNumber || r.trainNumber === ticket.trainNumber) &&
                ticket.passengers.some((tp) => tp.name?.trim().toLowerCase() === r.passengerName?.trim().toLowerCase())
            );
            if (ticketReallocs.length === 0) return null;
            return ticketReallocs.map((realloc, rIdx) => {
              const isApproved = realloc.status === 'APPROVED';
              return (
                <div
                  key={rIdx}
                  className={`border rounded-2xl p-4 shadow-xs space-y-3 ${
                    isApproved
                      ? 'border-emerald-300 bg-gradient-to-r from-emerald-50 via-white to-emerald-50/60'
                      : 'border-amber-300 bg-gradient-to-r from-amber-50 via-white to-amber-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`p-1.5 rounded-lg font-black ${
                        isApproved ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-slate-950'
                      }`}>
                        {isApproved ? <CheckCircle2 className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                      </span>
                      <div>
                        <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2 flex-wrap">
                          <span>Mid-Journey Vacant Berth {isApproved ? 'Shift Endorsement (Approved)' : 'Request (₹0 NO Extra Cost)'}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black border ${
                            isApproved
                              ? 'bg-emerald-200 text-emerald-950 border-emerald-400'
                              : 'bg-amber-200 text-amber-950 border-amber-400'
                          }`}>
                            {isApproved ? 'TTE APPROVED & ENDORSED ✓' : 'REQUESTED NOT APPROVED'}
                          </span>
                        </h4>
                        <p className="text-[10px] text-slate-600 font-medium">
                          {isApproved
                            ? `On-board TTE (#IR-77492) has officially verified the chart and endorsed this shift from ${realloc.effectiveFromStation}.`
                            : `Subject to on-board conductor chart verification after departure from ${realloc.effectiveFromStation}.`}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {realloc.id}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-0.5">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">ORIGINAL RESERVATION</span>
                      <strong className="text-slate-700 block">
                        Coach {realloc.fromCoach} • Seat #{realloc.fromSeat} ({realloc.fromBerthType})
                      </strong>
                    </div>
                    <div className={`p-2.5 rounded-xl border space-y-0.5 ${
                      isApproved
                        ? 'bg-emerald-100/80 border-emerald-300'
                        : 'bg-amber-100/80 border-amber-300'
                    }`}>
                      <span className={`text-[9px] uppercase font-bold block ${
                        isApproved ? 'text-emerald-900' : 'text-amber-900'
                      }`}>
                        {isApproved ? 'TTE ENDORSED BERTH (₹0)' : 'REQUESTED VACANT BERTH (₹0)'}
                      </span>
                      <strong className={`block text-sm ${
                        isApproved ? 'text-emerald-950' : 'text-amber-950'
                      }`}>
                        Coach {realloc.toCoach} • Seat #{realloc.toSeat} ({realloc.toBerthType})
                      </strong>
                      <span className="text-[10px] text-slate-700 block font-sans">
                        Taken by passenger: <strong>{realloc.passengerName}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-700 font-medium pt-1.5 border-t border-slate-200 flex-wrap gap-2">
                    <span>From Station: <strong>{realloc.effectiveFromStation} ({realloc.effectiveFromStationCode})</strong> onwards</span>
                    <span className="text-emerald-700 font-black">Fare Adjustment: ₹0.00 (NO Extra Cost)</span>
                    <span>Status: <strong className={isApproved ? 'text-emerald-700' : 'text-amber-800'}>{isApproved ? 'CONFIRMED / APPROVED ✓' : 'REQUESTED - NOT APPROVED YET'}</strong></span>
                  </div>
                </div>
              );
            });
          })()}

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
