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

  const getRouteLandmarkBanner = (fromCode: string, toCode: string) => {
    if ((fromCode === 'NDLS' && toCode === 'MMCT') || (fromCode === 'MMCT' && toCode === 'NDLS')) return '/assets/images/landmarks/delhi_mumbai.png';
    if ((fromCode === 'NDLS' && toCode === 'BSB') || (fromCode === 'BSB' && toCode === 'NDLS')) return '/assets/images/landmarks/delhi_bangalore.png';
    if ((fromCode === 'MAS' && toCode === 'SBC') || (fromCode === 'SBC' && toCode === 'MAS')) return '/assets/images/landmarks/mumbai_pune.png';
    if (fromCode === 'HWH' || toCode === 'HWH') return '/assets/images/landmarks/kolkata_puri.png';
    return '/assets/images/trip_summary_train_banner.png';
  };

  const getPassengerAvatar = (name: string, age: number, gender: string, concession?: string) => {
    if (concession?.toLowerCase().includes('senior') || age >= 60) return '/assets/images/avatars/avatar_2_senior.svg';
    if (concession?.toLowerCase().includes('student') || age < 24) return '/assets/images/avatars/avatar_1_student.svg';
    if (gender.toLowerCase().startsWith('f')) return '/assets/images/avatars/avatar_11_ananya.svg';
    if (name.toLowerCase().includes('pratay')) return '/assets/images/avatars/avatar_1_student.svg';
    return '/assets/images/avatars/avatar_3_techie.svg';
  };

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
    <div className="max-w-7xl mx-auto space-y-6 pb-12 select-none font-sans text-slate-800 animate-in fade-in duration-500 relative min-h-screen">
      {/* PAGE-LEVEL SUBTLE BACKGROUND DECORATIONS */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-gradient-to-br from-slate-50 via-purple-50/40 to-indigo-50/30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 right-10 w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-pink-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          1. HEADER HERO BANNER WITH SCENIC OVERLAY & MASCOTS
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative rounded-3xl p-6 sm:p-8 text-white shadow-[0_8px_30px_rgb(99,102,241,0.2)] border border-white/20 overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6 bg-gradient-to-br from-[#180B2E] via-[#2A104E] to-[#140A28] isolation-auto">
        {/* Scenic Railway Platform Background */}
        <div className="absolute inset-0 pointer-events-none opacity-25 overflow-hidden mix-blend-luminosity">
          <img
            src="/assets/images/banners/scenic_railway_banner.png"
            alt="Scenic Railway Platform"
            className="w-full h-full object-cover object-center"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#180B2E]/95 via-[#2A104E]/80 to-transparent pointer-events-none" />

        {/* CSS Animated Decorative Elements & Tracks */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-10 w-48 h-48 bg-pink-500/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <svg className="absolute top-0 right-1/4 w-full h-full opacity-10" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <path d="M-100,50 Q200,150 500,50 T1000,50" fill="none" stroke="white" strokeWidth="2" strokeDasharray="10 10"/>
            <path d="M-100,80 Q200,180 500,80 T1000,80" fill="none" stroke="white" strokeWidth="2" strokeDasharray="10 10"/>
            <path d="M-100,150 Q300,250 600,150 T1200,150" fill="none" stroke="white" strokeWidth="1" strokeDasharray="5 5"/>
          </svg>
        </div>

        <div className="space-y-4 text-center sm:text-left z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-purple-100 text-xs font-bold backdrop-blur-md shadow-lg">
            <Sparkles className="w-4 h-4 text-pink-300" />
            <span>Active Citizen Journey Vault • DigiLocker Verified</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-md">
            My Booked Journeys
          </h1>
          <p className="text-sm sm:text-base text-purple-100/90 font-medium leading-relaxed max-w-lg">
            All your confirmed seats, coach allotments, live GPS telemetry, and passenger itineraries in one secure ledger.
          </p>
        </div>

        {/* Mascot Illustrations */}
        <div className="hidden md:flex items-center gap-4 z-10 shrink-0">
          <div className="w-40 h-40 overflow-hidden rounded-2xl shadow-lg transform rotate-3 hover:rotate-0 transition-transform">
            <img
              src="/assets/images/characters/nira_conductor.jpg"
              alt="Nira Conductor"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="w-32 h-32 overflow-hidden rounded-2xl shadow-lg transform -rotate-6 hover:rotate-0 transition-transform mt-8">
            <img
              src="/assets/images/characters/ananya_nira_duo.png"
              alt="Ananya & Nira Mascot Duo"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          1B. QUICK BOOKED TICKETS & PASSENGER MANIFEST SUMMARY CARD
          ═══════════════════════════════════════════════════════════════════ */}
      {journeys.find((j) => j.status === 'CONFIRMED') && (() => {
        const topJourney = journeys.find((j) => j.status === 'CONFIRMED')!;
        return (
          <div className="relative bg-white/70 backdrop-blur-xl rounded-3xl p-5 sm:p-6 border-2 border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col md:flex-row items-center justify-between gap-5 overflow-hidden">
            {/* Background Graphic */}
            <div className="absolute inset-0 pointer-events-none opacity-5 overflow-hidden">
              <img src="/assets/images/booking_train_bg.jpg" alt="Train Background" className="w-full h-full object-cover object-center" />
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-200 to-purple-200 rounded-full blur-3xl -z-10 opacity-50"></div>
            
            <div className="flex items-center gap-4 min-w-0 z-10">
              <div className="w-24 h-24 shrink-0 overflow-hidden rounded-2xl shadow-lg">
                <img
                  src="/assets/images/characters/ananya_holding_map.png"
                  alt="Ananya with Route Map"
                  className="w-full h-full object-contain drop-shadow-md"
                />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold shadow-sm">
                    ✓ Next Up Confirmed
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">#{topJourney.trainNumber}</span>
                </div>
                <h3 className="font-black text-lg sm:text-xl text-slate-900 truncate">
                  {topJourney.trainName} ({topJourney.fromCode} ➔ {topJourney.toCode})
                </h3>
                <p className="text-sm text-slate-600 font-medium">
                  {topJourney.passengers.length} Passenger(s): {topJourney.passengers.map((p) => `${p.name} (${p.coach} / Seat ${p.seatNumber})`).join(', ')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-stretch sm:self-auto z-10">
              <button
                type="button"
                onClick={() => openTicketModal(topJourney)}
                className="flex-1 sm:flex-initial px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Eye className="w-4 h-4" />
                <span>View Full e-Ticket</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTrackQuery(topJourney.trainNumber);
                  navigateTo('track');
                }}
                className="px-4 py-3 rounded-xl bg-white hover:bg-purple-50 text-purple-900 border border-purple-200 font-bold text-sm shadow-sm transition-colors flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <MapPin className="w-4 h-4 text-purple-600" />
                <span>Track Live</span>
              </button>
            </div>
          </div>
        );
      })()}

      {/* ═══════════════════════════════════════════════════════════════════
          2. BOOKINGS LEDGER TAB BAR
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-2 sm:p-3 border border-white shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-4 z-30">
        <div className="flex items-center gap-2 px-2">
          <Train className="w-5 h-5 text-purple-700" />
          <span className="font-bold text-sm sm:text-base text-slate-900">
            Bookings Ledger
          </span>
        </div>

        <div className="flex items-center gap-2 bg-slate-100/50 p-1.5 rounded-xl self-start sm:self-center border border-slate-200/50">
          <button
            type="button"
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer ${
              activeTab === 'upcoming'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30 scale-105'
                : 'text-slate-600 hover:text-purple-900 hover:bg-white'
            }`}
          >
            Upcoming ({journeys.filter((j) => j.status === 'CONFIRMED').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer ${
              activeTab === 'completed'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30 scale-105'
                : 'text-slate-600 hover:text-purple-900 hover:bg-white'
            }`}
          >
            Completed ({journeys.filter((j) => j.status === 'COMPLETED').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cancelled')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer ${
              activeTab === 'cancelled'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30 scale-105'
                : 'text-slate-600 hover:text-purple-900 hover:bg-white'
            }`}
          >
            Cancelled ({journeys.filter((j) => j.status === 'CANCELLED').length})
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          3. JOURNEY CARDS WITH PASSENGERS, REVIEWS & DIGITAL TICKET MODAL
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        {filteredJourneys.map((j, index) => {
          const isExpanded = expandedJourneyId === j.id;

          return (
            <React.Fragment key={j.id}>
              <div
                className="relative bg-white/80 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-white shadow-[0_4px_20px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(124,58,237,0.1)] transition-all duration-300 space-y-4 group overflow-hidden"
              >
                {/* Subtle background gradient on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none -z-10"></div>
                
                {/* Scenic Route Landmark Banner Strip */}
                <div className="h-24 sm:h-28 -mx-5 sm:-mx-6 -mt-5 sm:-mt-6 rounded-t-3xl relative overflow-hidden bg-slate-900 mb-2">
                  <img
                    src={getRouteLandmarkBanner(j.fromCode, j.toCode)}
                    alt={`${j.fromCity} to ${j.toCity}`}
                    className="w-full h-full object-cover object-center opacity-75 group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
                  <div className="absolute top-3 left-4 flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-md text-[10px] font-mono font-bold tracking-wider uppercase border border-white/20 shadow-xs">
                      🚆 #{j.trainNumber} {j.trainName}
                    </span>
                  </div>
                  <div className="absolute bottom-2.5 left-4 right-4 flex items-center justify-between text-white">
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-black drop-shadow-sm">
                      <span>{j.fromCity} ({j.fromCode})</span>
                      <span className="text-purple-300">➔</span>
                      <span>{j.toCity} ({j.toCode})</span>
                    </div>
                    <span className="text-[11px] font-bold text-purple-200 bg-white/10 px-2 py-0.5 rounded-full backdrop-blur-xs">
                      {j.distanceKm} km • {j.duration}
                    </span>
                  </div>
                </div>

                {/* Top Meta Line: PNR, Coach, Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-50/80">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 text-purple-700 flex items-center justify-center shrink-0 border border-purple-200/50 shadow-2xs">
                      <Train className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-base sm:text-lg text-slate-900 flex items-center gap-2">
                        <span>{j.trainName}</span>
                      </h3>
                      <span className="font-mono text-xs text-slate-500 font-bold block bg-slate-100/70 px-2 py-0.5 rounded-md inline-block mt-0.5">
                        PNR: {j.pnr}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-mono font-black border shadow-sm ${
                        j.status === 'CONFIRMED'
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          : j.status === 'COMPLETED'
                          ? 'bg-purple-50 border-purple-300 text-purple-900'
                          : 'bg-red-50 border-red-300 text-red-800'
                      }`}
                    >
                      {j.status}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100/80 border border-slate-200 text-slate-700 text-xs font-bold">
                      {j.classCode}
                    </span>
                  </div>
                </div>

                {/* Middle Row: Origin/Dest, Dates, Allotment & Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  {/* From / To */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">FROM / TO</span>
                    <div className="font-black text-sm sm:text-base text-slate-900 flex items-center gap-2">
                      <span>{j.fromCode}</span>
                      <span className="text-purple-600 bg-purple-50 w-6 h-6 flex items-center justify-center rounded-full text-xs">→</span>
                      <span>{j.toCode}</span>
                    </div>
                    <span className="text-xs text-slate-500 font-medium block truncate">
                      {j.fromCity} to {j.toCity}
                    </span>
                  </div>

                  {/* Date & Departure */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">DATE & DEPARTURE</span>
                    <span className="font-bold text-sm text-slate-900 block">{j.date}</span>
                    <span className="text-xs text-slate-500 font-medium block bg-slate-50 inline-block px-1.5 py-0.5 rounded mt-0.5">
                      {j.depTime} hrs ({j.duration})
                    </span>
                  </div>

                  {/* Allotment & Passengers */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">ALLOTMENT</span>
                    <span className="font-bold text-sm text-purple-900 block">{j.coach}</span>
                    <span className="text-xs text-slate-500 font-medium block">
                      Seat {j.seat} • {j.passengers.length} Pax
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row md:flex-col gap-2 justify-end">
                    {j.status === 'CONFIRMED' && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setTrackQuery(j.trainNumber);
                            navigateTo('track');
                          }}
                          className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                        >
                          <Train className="w-4 h-4" />
                          <span>Track Train</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCancellingJourney(j)}
                          className="w-full py-2 px-4 rounded-xl bg-red-50/80 hover:bg-red-100 border border-red-200 text-red-700 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                        >
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span>Cancel & Refund</span>
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => openTicketModal(j)}
                      className="w-full py-2 px-4 rounded-xl bg-purple-50/80 hover:bg-purple-100 border border-purple-200 text-purple-900 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <Download className="w-4 h-4 text-purple-700" />
                      <span>Download E-Ticket</span>
                    </button>
                  </div>
                </div>

                {/* Expand / Collapse Trip Info Accordion Toggle */}
                <div className="pt-3 border-t border-purple-50/80 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setExpandedJourneyId(isExpanded ? null : j.id)}
                    className="text-sm font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1.5 cursor-pointer transition-colors bg-purple-50 px-3 py-1.5 rounded-lg"
                  >
                    <span>{isExpanded ? 'Hide Trip Details' : 'View Passengers, Stoppages & Reviews'}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-1 text-amber-500 text-sm font-bold">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span>{j.rating}</span>
                      <span className="text-[10px] text-slate-400 font-normal">({j.reviewCount})</span>
                    </div>
                    <div className="h-4 w-px bg-slate-300"></div>
                    <span className="text-xs font-mono font-black text-slate-700">Total: ₹{j.fare}</span>
                  </div>
                </div>

                {/* ── EXPANDABLE TRIP DETAILS & PASSENGER MANIFEST & REVIEWS ── */}
                {isExpanded && (
                  <div className="pt-4 space-y-4 bg-gradient-to-b from-purple-50/40 to-white/40 rounded-2xl p-4 sm:p-5 border border-purple-100/60 animate-in fade-in duration-300 mt-2">
                    {/* 1. Stoppage Arrival & Departure Timeline */}
                    <div className="space-y-2">
                      <span className="text-xs uppercase font-bold text-purple-900 tracking-wider flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-purple-700" />
                        <span>First & Last Stoppage Schedule</span>
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="p-3 rounded-xl bg-white/80 backdrop-blur-sm border border-purple-100/80 shadow-sm space-y-1 hover:shadow-md transition-shadow">
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md font-mono inline-block mb-1">
                            FIRST STOPPAGE (DEPARTURE)
                          </span>
                          <div className="font-bold text-slate-900 text-base">
                            {j.fromCity} ({j.fromCode}) • {j.fromPlatform}
                          </div>
                          <div className="text-xs text-slate-500 bg-slate-50 inline-block px-2 py-1 rounded">
                            Scheduled: {j.depTime} hrs ({j.date})
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-white/80 backdrop-blur-sm border border-purple-100/80 shadow-sm space-y-1 hover:shadow-md transition-shadow">
                          <span className="text-[10px] font-bold text-purple-800 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md font-mono inline-block mb-1">
                            LAST STOPPAGE (ARRIVAL)
                          </span>
                          <div className="font-bold text-slate-900 text-base">
                            {j.toCity} ({j.toCode}) • {j.toPlatform}
                          </div>
                          <div className="text-xs text-slate-500 bg-slate-50 inline-block px-2 py-1 rounded">
                            Expected: {j.arrTime} hrs ({j.arrivalDate})
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 2. Passenger Manifest */}
                    <div className="space-y-2">
                      <span className="text-xs uppercase font-bold text-purple-900 tracking-wider flex items-center gap-1.5">
                        <User className="w-4 h-4 text-purple-700" />
                        <span>Verified Passenger Details ({j.passengers.length})</span>
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {j.passengers.map((p, pIdx) => {
                          const avatarSrc = getPassengerAvatar(p.name, p.age, p.gender, p.concession);
                          return (
                            <div
                              key={pIdx}
                              className="p-3 rounded-2xl bg-white/90 backdrop-blur-sm border border-purple-100/90 shadow-sm text-sm flex items-center justify-between hover:border-purple-300 transition-colors gap-3"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-11 h-11 rounded-xl overflow-hidden bg-purple-50 p-0.5 border border-purple-200 shrink-0 shadow-2xs">
                                  <img src={avatarSrc} alt={p.name} className="w-full h-full object-contain" />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 flex items-center gap-1.5 truncate">
                                    <span className="truncate">{p.name}</span>
                                    <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded shrink-0">
                                      {p.age}y, {p.gender[0]}
                                    </span>
                                  </div>
                                  <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1 mt-0.5 truncate">
                                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                                    <span className="truncate">DigiLocker Verified • {p.concession || 'Standard'}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="font-mono font-black text-xs text-purple-900 block bg-purple-100/80 px-2 py-0.5 rounded-md">
                                  Coach {p.coach}
                                </span>
                                <span className="text-[11px] text-slate-600 font-medium block mt-0.5">
                                  Seat {p.seatNumber} ({p.berthType})
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 3. On-Board Amenities */}
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      <span className="text-xs font-bold text-slate-500 mr-1">Amenities:</span>
                      {j.amenities.map((am, amIdx) => (
                        <span
                          key={amIdx}
                          className="px-2.5 py-1 rounded-lg bg-white border border-purple-100/80 text-purple-900 text-xs font-bold flex items-center gap-1.5 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <Sparkles className="w-3 h-3 text-[#7C3AED]" />
                          <span>{am}</span>
                        </span>
                      ))}
                    </div>

                    {/* 4. Traveler Reviews */}
                    {j.reviews.length > 0 && (
                      <div className="space-y-2 pt-3 border-t border-purple-100/80">
                        <span className="text-xs uppercase font-bold text-purple-900 tracking-wider flex items-center gap-1.5">
                          <Star className="w-4 h-4 text-purple-700" />
                          <span>Verified Traveler Reviews & Rating</span>
                        </span>
                        <div className="space-y-2">
                          {j.reviews.map((rev, rIdx) => (
                            <div
                              key={rIdx}
                              className="p-3.5 rounded-xl bg-white/80 backdrop-blur-sm border border-purple-100/80 shadow-sm text-sm space-y-1.5"
                            >
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded">{rev.author}</span>
                                <div className="flex items-center gap-1 text-amber-500 font-bold bg-amber-50 px-2 py-0.5 rounded">
                                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                  <span>{rev.rating}.0</span>
                                </div>
                              </div>
                              <p className="text-sm text-slate-600 italic leading-relaxed">"{rev.comment}"</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Decorative train track line pattern between journey cards */}
              {index < filteredJourneys.length - 1 && (
                <div className="flex justify-center py-1 opacity-60">
                  <svg width="24" height="32" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <line x1="12" y1="0" x2="12" y2="32" stroke="#d8b4fe" strokeWidth="2" strokeDasharray="4 4" />
                    <circle cx="12" cy="16" r="4" fill="#a855f7" />
                  </svg>
                </div>
              )}
            </React.Fragment>
          );
        })}

        {filteredJourneys.length === 0 && (
          <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-10 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center flex flex-col items-center justify-center space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-200/40 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex items-center justify-center gap-6 z-10">
              <div className="w-40 h-40 overflow-hidden rounded-2xl shadow-lg transform -rotate-6">
                <img
                  src="/assets/images/characters/nira_traveler.jpg"
                  alt="Nira Traveler"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="w-32 h-32 overflow-hidden rounded-2xl shadow-lg transform rotate-12 mt-8">
                <img
                  src="/assets/images/characters/ananya_travel_luggage.png"
                  alt="No Journeys"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            <div className="space-y-2 max-w-md z-10">
              <h3 className="font-black text-xl text-slate-900 capitalize">
                No {activeTab} journeys found
              </h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                {activeTab === 'cancelled'
                  ? 'Great news! You have no cancelled journeys on your citizen record.'
                  : 'Ready to explore India by rail? Search and book your next trip with 1-click zero-PIN checkout.'}
              </p>
            </div>
            
            {activeTab !== 'cancelled' && (
              <button
                type="button"
                onClick={() => navigateTo('home')}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-purple-500/30 transition-all cursor-pointer active:scale-95 z-10 flex items-center gap-2"
              >
                <span>Find & Book Trains</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          4. PAYMENTS & TAX RECEIPTS LEDGER BANNER
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-5 sm:p-6 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute top-1/2 -translate-y-1/2 right-20 w-48 h-48 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none -z-10"></div>
        <div className="flex items-center gap-4 z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200 shadow-inner">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-base text-slate-900">
              Payments & Tax Receipts Ledger
            </h4>
            <p className="text-sm text-slate-500 font-medium">
              View bank UTRs, GST invoices, and double-verified transaction audits.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigateTo('payments')}
          className="px-5 py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-900 font-bold text-sm border border-emerald-200 shadow-sm flex items-center gap-2 transition-all cursor-pointer self-start sm:self-center shrink-0 active:scale-95 z-10"
        >
          <span>Open Payments Ledger</span>
          <ArrowRight className="w-4 h-4" />
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border-2 border-red-200 animate-in zoom-in-95">
              <div className="flex items-start justify-between border-b border-red-100 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 overflow-hidden rounded-2xl shadow-lg shrink-0">
                    <img
                      src="/assets/images/characters/nira_robot_tablet.png"
                      alt="Nira Security Audit"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">
                      Security Verification
                    </h3>
                    <p className="text-sm text-slate-500 font-medium">
                      PNR #{cancellingJourney.pnr} • Cancel Ticket
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
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-sm">
                <div className="flex justify-between text-slate-700">
                  <span>Train:</span>
                  <strong className="text-slate-900">#{cancellingJourney.trainNumber} • {cancellingJourney.trainName}</strong>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Journey:</span>
                  <span>{cancellingJourney.fromCity} ➔ {cancellingJourney.toCity}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between text-emerald-700 font-black text-base mt-1">
                  <span>Instant Wallet Refund:</span>
                  <span className="font-mono">₹{refundAmount.toLocaleString('en-IN')}.00</span>
                </div>
              </div>

              {/* SECURITY FORM */}
              <form onSubmit={handleVerifyAndCancel} className="space-y-4 pt-1">
                {/* 1. Train Number Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
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
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-purple-200 text-sm font-mono font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-colors"
                  />
                </div>

                {/* 2. Personal Security PIN Input with Eye Toggle */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 block">
                      2. Enter Personal Security PIN:
                    </label>
                    <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-md">Default: {securityPin || '2026'}</span>
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
                      className="w-full pl-4 pr-12 py-2.5 rounded-xl bg-slate-50 border border-purple-200 text-sm font-mono font-bold text-slate-900 tracking-widest focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCancelPin(!showCancelPin)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-purple-700 cursor-pointer p-0.5 transition-colors"
                    >
                      {showCancelPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Error Banner */}
                {cancelError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{cancelError}</span>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
                  <span>
                    Secured by <strong>Zero-PII PIN Boundary</strong>. Your ticket is cancelled and ₹{refundAmount.toLocaleString('en-IN')} is refunded instantly.
                  </span>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer active:scale-95"
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
                    className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors cursor-pointer"
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
