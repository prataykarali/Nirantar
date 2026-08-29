import React, { useState } from 'react';
import {
  Train,
  Calendar,
  Clock,
  MapPin,
  Download,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  XCircle,
  CreditCard,
  ArrowRight,
  Sparkles,
  Search,
  Filter,
  User,
  Star,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Zap,
  Coffee,
  Wifi,
  Lock,
  KeyRound,
  Ticket as TicketIcon,
  QrCode,
} from 'lucide-react';
import { useJourney } from '../context/JourneyContext';
import { DigitalTicketModal, TicketDetails } from '../components/journey/DigitalTicketModal';

type JourneyTab = 'upcoming' | 'completed' | 'cancelled';

interface JourneyPassenger {
  name: string;
  age: number;
  gender: string;
  coach: string;
  seatNumber: number | string;
  berthType: string;
  concession?: string;
  status: string;
}

interface JourneyReview {
  author: string;
  rating: number;
  date: string;
  comment: string;
}

interface JourneyRecord {
  id: string;
  pnr: string;
  trainNumber: string;
  trainName: string;
  fromCity: string;
  fromCode: string;
  fromPlatform: string;
  toCity: string;
  toCode: string;
  toPlatform: string;
  date: string;
  depTime: string;
  arrTime: string;
  arrivalDate: string;
  duration: string;
  distanceKm: number;
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  coach: string;
  seat: string;
  classCode: string;
  className: string;
  quota: string;
  passengers: JourneyPassenger[];
  fare: number;
  rating: number;
  reviewCount: number;
  amenities: string[];
  reviews: JourneyReview[];
}

export const MyJourneysPage: React.FC = () => {
  const { navigateTo, issuedTicket, searchParams, setTrackQuery, cancelTicket, securityPin } = useJourney();
  const [activeTab, setActiveTab] = useState<JourneyTab>('upcoming');
  const [expandedJourneyId, setExpandedJourneyId] = useState<string | null>('j1');
  const [selectedTicketForModal, setSelectedTicketForModal] = useState<TicketDetails | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [cancellingJourney, setCancellingJourney] = useState<JourneyRecord | null>(null);
  const [cancelledPnrList, setCancelledPnrList] = useState<string[]>([]);

  // Cancel Ticket Security Verification States
  const [cancelTrainNumberInput, setCancelTrainNumberInput] = useState('');
  const [cancelPinInput, setCancelPinInput] = useState('');
  const [showCancelPin, setShowCancelPin] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Dynamic ticket generated from active session
  const dynamicUpcoming: JourneyRecord[] = issuedTicket ? [
    {
      id: issuedTicket.ticketId || 'j0',
      pnr: issuedTicket.pnrNumber,
      trainNumber: issuedTicket.train?.trainNumber || '12302',
      trainName: issuedTicket.train?.trainName || 'Rajdhani Express',
      fromCity: issuedTicket.origin?.city || searchParams.fromStation.city,
      fromCode: issuedTicket.origin?.code || searchParams.fromStation.code,
      fromPlatform: 'Platform 4',
      toCity: issuedTicket.destination?.city || searchParams.toStation.city,
      toCode: issuedTicket.destination?.code || searchParams.toStation.code,
      toPlatform: 'Platform 8',
      date: `Confirmed: ${issuedTicket.travelDate}`,
      depTime: issuedTicket.train?.departureTime || '16:55',
      arrTime: issuedTicket.train?.arrivalTime || '09:55',
      arrivalDate: 'Next Day',
      duration: issuedTicket.train?.durationHours || '17h 00m',
      distanceKm: 1451,
      status: 'CONFIRMED',
      coach: `${issuedTicket.classCode} (${issuedTicket.seatAllotments[0]?.coach || 'B4'})`,
      seat: `${issuedTicket.seatAllotments[0]?.seatNumber || 36} (${issuedTicket.seatAllotments[0]?.berthType || 'Lower'})`,
      classCode: issuedTicket.classCode || '3A',
      className: 'AC 3 Tier',
      quota: 'General (GN)',
      passengers: issuedTicket.passengers.map((p, idx) => ({
        name: p.name,
        age: p.age,
        gender: p.gender,
        coach: issuedTicket.seatAllotments[idx]?.coach || 'B4',
        seatNumber: issuedTicket.seatAllotments[idx]?.seatNumber || 36 + idx,
        berthType: issuedTicket.seatAllotments[idx]?.berthType || (idx % 2 === 0 ? 'Lower' : 'Middle'),
        concession: (p as any).concessionType && (p as any).concessionType !== 'NONE' ? (p as any).concessionType : undefined,
        status: 'CNF',
      })),
      fare: 2990,
      rating: 4.9,
      reviewCount: 8420,
      amenities: ['Meals Included', 'RailTel High-Speed Wi-Fi', '220V Power Outlets', 'Clean Bedding'],
      reviews: [
        {
          author: 'Pooja R., Verified Passenger',
          rating: 5,
          date: 'Last Week',
          comment: 'Extremely punctual departure and arrival. Coach attendants were courteous and the food was hot and delicious.',
        },
      ],
    }
  ] : [];

  const journeys: JourneyRecord[] = [
    ...dynamicUpcoming,
    {
      id: 'j1',
      pnr: '2847 5896 1234',
      trainNumber: '12951',
      trainName: 'Mumbai Rajdhani Express',
      fromCity: 'New Delhi',
      fromCode: 'NDLS',
      fromPlatform: 'Platform 4',
      toCity: 'Mumbai Central',
      toCode: 'MMCT',
      toPlatform: 'Platform 1',
      date: 'Tomorrow, 24 May 2026',
      depTime: '16:55',
      arrTime: '08:40',
      arrivalDate: '25 May 2026',
      duration: '15h 45m',
      distanceKm: 1386,
      status: 'CONFIRMED',
      coach: '3A (B4)',
      seat: '36 (Lower Berth)',
      classCode: '3A',
      className: 'AC 3-Tier',
      quota: 'General (GN)',
      passengers: [
        {
          name: 'Pratay Karali',
          age: 24,
          gender: 'Male',
          coach: 'B4',
          seatNumber: 36,
          berthType: 'Lower',
          status: 'CNF',
        },
        {
          name: 'Rahul Sharma',
          age: 22,
          gender: 'Male',
          coach: 'B4',
          seatNumber: 37,
          berthType: 'Middle',
          concession: 'Student Pass',
          status: 'CNF',
        },
      ],
      fare: 3040,
      rating: 4.8,
      reviewCount: 14280,
      amenities: ['Complimentary Meals', 'High-Speed Wi-Fi', 'USB-C Charging', 'CCTV & RPF Escort'],
      reviews: [
        {
          author: 'Siddharth M., Verified Traveler',
          rating: 5,
          date: 'Yesterday',
          comment: 'Best overnight journey between Delhi and Mumbai. Spotless washrooms, comfortable linen, and arrived 5 mins ahead of schedule at Mumbai Central.',
        },
        {
          author: 'Kavita Iyer, Verified Citizen',
          rating: 4.8,
          date: '3 days ago',
          comment: 'Very safe for solo female travelers. Coach attendants checked berths every few hours and food catering was fresh.',
        },
      ],
    },
    {
      id: 'j2',
      pnr: '4920 1849 8831',
      trainNumber: '22436',
      trainName: 'Vande Bharat Express',
      fromCity: 'New Delhi',
      fromCode: 'NDLS',
      fromPlatform: 'Platform 16',
      toCity: 'Varanasi',
      toCode: 'BSB',
      toPlatform: 'Platform 1',
      date: '12 Apr 2026',
      depTime: '06:00',
      arrTime: '14:00',
      arrivalDate: '12 Apr 2026',
      duration: '8h 00m',
      distanceKm: 759,
      status: 'COMPLETED',
      coach: 'CC (C3)',
      seat: '18 (Window Seat)',
      classCode: 'CC',
      className: 'AC Chair Car',
      quota: 'General (GN)',
      passengers: [
        {
          name: 'Pratay Karali',
          age: 24,
          gender: 'Male',
          coach: 'C3',
          seatNumber: 18,
          berthType: 'Window',
          status: 'COMPLETED',
        },
      ],
      fare: 1750,
      rating: 4.9,
      reviewCount: 9320,
      amenities: ['180° Rotating Seats', 'Automatic Sliding Doors', 'Bio-Vacuum Toilets', 'Infotainment Display'],
      reviews: [
        {
          author: 'Arun K., Verified Citizen',
          rating: 5,
          date: '14 Apr 2026',
          comment: 'Silent, smooth, and world-class acceleration. Reached Kashi on exact time for Ganga Aarti.',
        },
      ],
    },
    {
      id: 'j3',
      pnr: '6610 9942 1042',
      trainNumber: '12007',
      trainName: 'Mysuru Shatabdi Express',
      fromCity: 'Chennai',
      fromCode: 'MAS',
      fromPlatform: 'Platform 2',
      toCity: 'Bengaluru',
      toCode: 'SBC',
      toPlatform: 'Platform 5',
      date: '28 Feb 2026',
      depTime: '06:00',
      arrTime: '10:45',
      arrivalDate: '28 Feb 2026',
      duration: '4h 45m',
      distanceKm: 358,
      status: 'COMPLETED',
      coach: 'EC (E1)',
      seat: '12 (Aisle)',
      classCode: 'EC',
      className: 'Executive Class',
      quota: 'General (GN)',
      passengers: [
        {
          name: 'Pratay Karali',
          age: 24,
          gender: 'Male',
          coach: 'E1',
          seatNumber: 12,
          berthType: 'Aisle',
          status: 'COMPLETED',
        },
        {
          name: 'Priya Sharma',
          age: 46,
          gender: 'Female',
          coach: 'E1',
          seatNumber: 13,
          berthType: 'Window',
          concession: 'Senior Citizen',
          status: 'COMPLETED',
        },
      ],
      fare: 3300,
      rating: 4.8,
      reviewCount: 6810,
      amenities: ['Premium Hot Breakfast', 'Newspaper & Bottled Water', 'Executive Lounge Access'],
      reviews: [
        {
          author: 'Meenakshi Sundaram, Regular Traveler',
          rating: 4.9,
          date: '1 Mar 2026',
          comment: 'Perfect business commute between Chennai and Bangalore. Executive class seating is very spacious with prompt breakfast service.',
        },
      ],
    },
    {
      id: 'j4',
      pnr: '8820 4910 2201',
      trainNumber: '12260',
      trainName: 'Sealdah Duronto Express',
      fromCity: 'New Delhi',
      fromCode: 'NDLS',
      fromPlatform: 'Platform 12',
      toCity: 'Howrah',
      toCode: 'HWH',
      toPlatform: 'Platform 9',
      date: '15 Jan 2026',
      depTime: '20:05',
      arrTime: '12:40',
      arrivalDate: '16 Jan 2026',
      duration: '16h 35m',
      distanceKm: 1450,
      status: 'CANCELLED',
      coach: '3A (B2)',
      seat: '42 (Upper)',
      classCode: '3A',
      className: 'AC 3 Tier',
      quota: 'General (GN)',
      passengers: [
        {
          name: 'Pratay Karali',
          age: 24,
          gender: 'Male',
          coach: 'B2',
          seatNumber: 42,
          berthType: 'Upper',
          status: 'CANCELLED',
        },
      ],
      fare: 1980,
      rating: 4.6,
      reviewCount: 4210,
      amenities: ['Non-Stop Express', 'Full Bedding', 'Meals Included'],
      reviews: [],
    },
  ];

  // Filter journeys by active tab
  const filteredJourneys = journeys.filter((j) => {
    if (activeTab === 'upcoming') return j.status === 'CONFIRMED';
    if (activeTab === 'completed') return j.status === 'COMPLETED';
    if (activeTab === 'cancelled') return j.status === 'CANCELLED';
    return true;
  });

  const openTicketModal = (j: JourneyRecord) => {
    const details: TicketDetails = {
      pnr: j.pnr,
      ticketId: j.id,
      trainNumber: j.trainNumber,
      trainName: j.trainName,
      classCode: j.classCode,
      className: j.className,
      quota: j.quota,
      fromCity: j.fromCity,
      fromCode: j.fromCode,
      fromPlatform: j.fromPlatform,
      toCity: j.toCity,
      toCode: j.toCode,
      toPlatform: j.toPlatform,
      departureDate: j.date,
      departureTime: j.depTime,
      arrivalDate: j.arrivalDate,
      arrivalTime: j.arrTime,
      duration: j.duration,
      distanceKm: j.distanceKm,
      passengers: j.passengers,
      baseFare: Math.round(j.fare * 0.85),
      reservationCharge: 40,
      superfastCharge: 45,
      cgst: Math.round(j.fare * 0.025),
      sgst: Math.round(j.fare * 0.025),
      totalFare: j.fare,
      paymentMethod: 'UPI / NetBanking',
      bookingRef: `BK-IRCTC-${j.pnr.replace(/\s+/g, '')}`,
    };
    setSelectedTicketForModal(details);
    setIsTicketModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 pb-8 select-none font-sans text-slate-800 animate-in fade-in duration-300">
      {/* ═══════════════════════════════════════════════════════════════════
          1. HEADER & PASS HERO BANNER WITH CHARACTER MASCOT
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-r from-[#200A40] via-[#1A0C38] to-[#12162E] rounded-3xl p-4 sm:p-5 text-white shadow-sm border border-purple-400/20 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-[10px] font-bold">
            <Sparkles className="w-3 h-3 text-purple-300" />
            <span>Active Citizen Pass</span>
          </div>
          <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight">
            My Journeys & Activity
          </h1>
          <p className="text-xs text-purple-200 font-medium max-w-md">
            View verified bookings, track running trains live, and view digital e-tickets.
          </p>
        </div>

        {/* Character Illustration */}
        <div className="hidden sm:flex items-center gap-2 z-10 shrink-0">
          <img
            src="/assets/images/characters/citizen_ticket.png"
            alt="Citizen Travel Pass"
            className="w-14 h-16 object-contain drop-shadow-md"
          />
          <img
            src="/assets/images/characters/nira_happy.png"
            alt="Nira AI"
            className="w-12 h-14 object-contain drop-shadow-md"
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          2. BOOKINGS LEDGER TAB BAR
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl p-3 border border-purple-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Train className="w-4 h-4 text-purple-700" />
          <span className="font-bold text-xs sm:text-sm text-slate-900">
            Bookings Ledger
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl self-start sm:self-center">
          <button
            type="button"
            onClick={() => setActiveTab('upcoming')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'upcoming'
                ? 'bg-[#7C3AED] text-white shadow-xs'
                : 'text-slate-600 hover:text-purple-900'
            }`}
          >
            Upcoming ({journeys.filter((j) => j.status === 'CONFIRMED').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('completed')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'completed'
                ? 'bg-[#7C3AED] text-white shadow-xs'
                : 'text-slate-600 hover:text-purple-900'
            }`}
          >
            Completed ({journeys.filter((j) => j.status === 'COMPLETED').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cancelled')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'cancelled'
                ? 'bg-[#7C3AED] text-white shadow-xs'
                : 'text-slate-600 hover:text-purple-900'
            }`}
          >
            Cancelled ({journeys.filter((j) => j.status === 'CANCELLED').length})
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          3. JOURNEY CARDS WITH PASSENGERS, REVIEWS & DIGITAL TICKET MODAL
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-3.5">
        {filteredJourneys.map((j) => {
          const isExpanded = expandedJourneyId === j.id;

          return (
            <div
              key={j.id}
              className="bg-white rounded-3xl p-4 sm:p-5 border border-purple-100 shadow-sm hover:shadow-md transition-all space-y-3"
            >
              {/* Top Meta Line: Train Name, PNR, Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-purple-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                    <Train className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm sm:text-base text-slate-900 flex items-center gap-2">
                      <span>{j.trainNumber} • {j.trainName}</span>
                    </h3>
                    <span className="font-mono text-[10px] text-slate-500 font-bold block">
                      PNR: {j.pnr}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black border ${
                      j.status === 'CONFIRMED'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : j.status === 'COMPLETED'
                        ? 'bg-purple-50 border-purple-300 text-purple-900'
                        : 'bg-red-50 border-red-300 text-red-800'
                    }`}
                  >
                    {j.status}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                    {j.classCode}
                  </span>
                </div>
              </div>

              {/* Middle Row: Origin/Dest, Dates, Allotment & Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                {/* From / To */}
                <div className="space-y-0.5">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">FROM / TO</span>
                  <div className="font-black text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                    <span>{j.fromCode}</span>
                    <span className="text-purple-600">→</span>
                    <span>{j.toCode}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium block truncate">
                    {j.fromCity} to {j.toCity}
                  </span>
                </div>

                {/* Date & Departure */}
                <div className="space-y-0.5">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">DATE & DEPARTURE</span>
                  <span className="font-bold text-xs text-slate-900 block">{j.date}</span>
                  <span className="text-[10px] text-slate-500 font-medium block">
                    {j.depTime} hrs ({j.duration})
                  </span>
                </div>

                {/* Allotment & Passengers */}
                <div className="space-y-0.5">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">ALLOTMENT</span>
                  <span className="font-bold text-xs text-purple-900 block">{j.coach}</span>
                  <span className="text-[10px] text-slate-500 font-medium block">
                    Seat {j.seat} • {j.passengers.length} Pax
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row md:flex-col gap-1.5 justify-end">
                  {j.status === 'CONFIRMED' && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setTrackQuery(j.trainNumber);
                          navigateTo('track');
                        }}
                        className="w-full py-1.5 px-3 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Train className="w-3.5 h-3.5" />
                        <span>Track Train</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCancellingJourney(j)}
                        className="w-full py-1.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                      >
                        <XCircle className="w-3.5 h-3.5 text-red-600" />
                        <span>Cancel Ticket & Refund</span>
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => openTicketModal(j)}
                    className="w-full py-1.5 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-purple-700" />
                    <span>Download E-Ticket</span>
                  </button>
                </div>
              </div>

              {/* Expand / Collapse Trip Info Accordion Toggle */}
              <div className="pt-2 border-t border-purple-50 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setExpandedJourneyId(isExpanded ? null : j.id)}
                  className="text-xs font-bold text-purple-700 hover:text-purple-950 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>{isExpanded ? 'Hide Trip Details & Reviews' : 'View Passengers, Stoppages & Reviews'}</span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{j.rating}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({j.reviewCount})</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-400">Total: ₹{j.fare}</span>
                </div>
              </div>

              {/* ── EXPANDABLE TRIP DETAILS & PASSENGER MANIFEST & REVIEWS ── */}
              {isExpanded && (
                <div className="pt-3 space-y-3 bg-purple-50/40 rounded-2xl p-3 sm:p-4 border border-purple-100 animate-in fade-in duration-200">
                  {/* 1. Stoppage Arrival & Departure Timeline */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-purple-900 tracking-wider flex items-center gap-1">
                      <Clock className="w-3 h-3 text-purple-700" />
                      <span>First & Last Stoppage Schedule</span>
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-white border border-purple-100 space-y-0.5">
                        <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded font-mono">
                          FIRST STOPPAGE (DEPARTURE)
                        </span>
                        <div className="font-bold text-slate-900">
                          {j.fromCity} ({j.fromCode}) • {j.fromPlatform}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Scheduled: {j.depTime} hrs ({j.date})
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white border border-purple-100 space-y-0.5">
                        <span className="text-[9px] font-bold text-purple-800 bg-purple-50 px-1.5 py-0.2 rounded font-mono">
                          LAST STOPPAGE (ARRIVAL)
                        </span>
                        <div className="font-bold text-slate-900">
                          {j.toCity} ({j.toCode}) • {j.toPlatform}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Expected: {j.arrTime} hrs ({j.arrivalDate})
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. Passenger Manifest */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-purple-900 tracking-wider flex items-center gap-1">
                      <User className="w-3 h-3 text-purple-700" />
                      <span>Verified Passenger Details ({j.passengers.length})</span>
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {j.passengers.map((p, pIdx) => (
                        <div
                          key={pIdx}
                          className="p-2.5 rounded-xl bg-white border border-purple-100 text-xs flex items-center justify-between"
                        >
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{p.name}</span>
                              <span className="text-[10px] text-slate-500">
                                ({p.age}y, {p.gender[0]})
                              </span>
                            </div>
                            <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" />
                              <span>Verified Citizen • {p.concession || 'Standard Quota'}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-black text-xs text-purple-900 block">
                              Coach {p.coach}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              Seat {p.seatNumber} ({p.berthType})
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3. On-Board Amenities */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-bold text-slate-500 mr-1">Amenities:</span>
                    {j.amenities.map((am, amIdx) => (
                      <span
                        key={amIdx}
                        className="px-2 py-0.5 rounded-full bg-white border border-purple-100 text-purple-900 text-[10px] font-bold flex items-center gap-1 shadow-2xs"
                      >
                        <Sparkles className="w-2.5 h-2.5 text-[#7C3AED]" />
                        <span>{am}</span>
                      </span>
                    ))}
                  </div>

                  {/* 4. Traveler Reviews */}
                  {j.reviews.length > 0 && (
                    <div className="space-y-1.5 pt-1 border-t border-purple-100">
                      <span className="text-[10px] uppercase font-bold text-purple-900 tracking-wider">
                        Verified Traveler Reviews & Rating
                      </span>
                      <div className="space-y-1.5">
                        {j.reviews.map((rev, rIdx) => (
                          <div
                            key={rIdx}
                            className="p-2.5 rounded-xl bg-white border border-purple-100 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-slate-900">{rev.author}</span>
                              <div className="flex items-center gap-1 text-amber-500 font-bold">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span>{rev.rating}.0</span>
                              </div>
                            </div>
                            <p className="text-[11px] text-slate-600 italic">"{rev.comment}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          4. PAYMENTS & TAX RECEIPTS LEDGER BANNER
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-purple-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-slate-900">
              Payments & Tax Receipts Ledger
            </h4>
            <p className="text-xs text-slate-500 font-medium">
              View bank UTRs, GST invoices, and double-verified transaction audits.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigateTo('payments')}
          className="px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold text-xs border border-purple-200 flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-center shrink-0"
        >
          <span>Open Payments Ledger</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          5. DIGITAL TICKET MODAL
          ═══════════════════════════════════════════════════════════════════ */}
      <DigitalTicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        ticket={selectedTicketForModal}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          6. TICKET CANCELLATION & SECURITY PIN VERIFICATION MODAL
          ═══════════════════════════════════════════════════════════════════ */}
      {cancellingJourney && (() => {
        const clerkage = 60 * cancellingJourney.passengers.length;
        const refundAmount = Math.max(0, cancellingJourney.fare - clerkage);

        const handleVerifyAndCancel = (e: React.FormEvent) => {
          e.preventDefault();
          if (cancelTrainNumberInput.trim() !== cancellingJourney.trainNumber) {
            setCancelError(`Train number mismatch! Enter #${cancellingJourney.trainNumber} to verify.`);
            return;
          }
          const validPin = securityPin || '2026';
          if (cancelPinInput.trim() !== validPin) {
            setCancelError('Incorrect 4-digit Security PIN! Check your citizen profile.');
            return;
          }
          setCancelError(null);
          cancelTicket(cancellingJourney.pnr, refundAmount);
          setCancelledPnrList((prev) => [...prev, cancellingJourney.pnr]);
          setCancellingJourney(null);
          setActiveTab('cancelled');
          setCancelTrainNumberInput('');
          setCancelPinInput('');
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-3.5 shadow-2xl border-2 border-red-200 animate-in zoom-in-95">
              <div className="flex items-start justify-between border-b border-red-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center font-bold">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      Security Verification: Cancel Ticket
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      PNR #{cancellingJourney.pnr} • Anti-Scam Protection
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCancellingJourney(null);
                    setCancelError(null);
                    setCancelTrainNumberInput('');
                    setCancelPinInput('');
                  }}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-700">
                  <span>Train:</span>
                  <strong className="text-slate-900">#{cancellingJourney.trainNumber} • {cancellingJourney.trainName}</strong>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Journey:</span>
                  <span>{cancellingJourney.fromCity} ➔ {cancellingJourney.toCity} ({cancellingJourney.date})</span>
                </div>
                <div className="border-t border-slate-200 pt-1.5 flex justify-between text-emerald-700 font-black">
                  <span>Instant Wallet Refund:</span>
                  <span className="font-mono text-sm">₹{refundAmount.toLocaleString('en-IN')}.00</span>
                </div>
              </div>

              {/* SECURITY FORM */}
              <form onSubmit={handleVerifyAndCancel} className="space-y-3">
                {/* 1. Train Number Input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    1. Confirm Train Number to Cancel:
                  </label>
                  <input
                    type="text"
                    required
                    value={cancelTrainNumberInput}
                    onChange={(e) => {
                      setCancelTrainNumberInput(e.target.value);
                      setCancelError(null);
                    }}
                    placeholder={`Enter train #${cancellingJourney.trainNumber}`}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-purple-200 text-xs font-mono font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white"
                  />
                </div>

                {/* 2. Personal Security PIN Input with Eye Toggle */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      2. Enter Personal Security PIN:
                    </label>
                    <span className="text-[10px] text-purple-700 font-bold">Default: {securityPin || '2026'}</span>
                  </div>
                  <div className="relative">
                    <input
                      type={showCancelPin ? 'text' : 'password'}
                      maxLength={6}
                      required
                      value={cancelPinInput}
                      onChange={(e) => {
                        setCancelPinInput(e.target.value);
                        setCancelError(null);
                      }}
                      placeholder="••••"
                      className="w-full pl-3 pr-10 py-2 rounded-xl bg-slate-50 border border-purple-200 text-xs font-mono font-bold text-slate-900 tracking-widest focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCancelPin(!showCancelPin)}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-purple-700 cursor-pointer p-0.5"
                    >
                      {showCancelPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Error Banner */}
                {cancelError && (
                  <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-[11px] font-bold text-rose-700 flex items-center gap-1.5 animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                    <span>{cancelError}</span>
                  </div>
                )}

                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    Secured by <strong>Zero-PII PIN Boundary</strong>. Your ticket is cancelled and ₹{refundAmount.toLocaleString('en-IN')} is refunded instantly.
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer active:scale-98"
                  >
                    Authorize & Cancel Ticket
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCancellingJourney(null);
                      setCancelError(null);
                      setCancelTrainNumberInput('');
                      setCancelPinInput('');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Keep Ticket
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
