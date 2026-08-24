import React, { useState } from 'react';
import {
  X,
  Star,
  MapPin,
  Tag,
  ArrowRight,
  Sparkles,
  Search,
  CheckCircle2,
  Train,
  Heart,
  Percent,
  Calendar,
  Filter,
} from 'lucide-react';
import { useJourney } from '../../context/JourneyContext';
import { POPULAR_STATIONS, findStation } from '../../data/stationData';

export interface TouristDestination {
  id: string;
  name: string;
  state: string;
  city: string;
  stationCode: string;
  fromStationCode: string;
  fromCity: string;
  rating: number;
  reviewsCount: string;
  topAttractions: string[];
  reviewQuote: string;
  reviewerName: string;
  trainName: string;
  trainNumber: string;
  duration: string;
  startingFare: number;
  offerCode: string;
  discountBadge: string;
  tag: string;
  image: string;
}

interface TouristDestinationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TouristDestinationsModal: React.FC<TouristDestinationsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { executeSearch, searchParams } = useJourney();
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const destinations: TouristDestination[] = [
    {
      id: 'varanasi',
      name: 'Varanasi (Kashi Vishwanath)',
      city: 'Varanasi',
      state: 'Uttar Pradesh',
      stationCode: 'BSB',
      fromStationCode: 'NDLS',
      fromCity: 'New Delhi',
      rating: 4.9,
      reviewsCount: '24.8k reviews',
      topAttractions: ['Kashi Vishwanath Corridor', 'Dashashwamedh Ganga Aarti', 'Sarnath Buddhist Stupa', 'Assi Ghat Sunrise'],
      reviewQuote: 'The evening Ganga Aarti after reaching via Vande Bharat was truly divine. Best train journey of my life!',
      reviewerName: 'Priya Mukherjee (Kolkata)',
      trainName: 'Vande Bharat Express',
      trainNumber: '22436',
      duration: '8h 00m',
      startingFare: 1450,
      offerCode: 'KASHI20',
      discountBadge: '20% OFF with Code KASHI20',
      tag: 'SPIRITUAL',
      image: '/assets/images/landmarks/delhi_bangalore.png',
    },
    {
      id: 'puri',
      name: 'Puri (Jagannath Dham & Golden Beach)',
      city: 'Puri',
      state: 'Odisha',
      stationCode: 'PURI',
      fromStationCode: 'HWH',
      fromCity: 'Howrah',
      rating: 4.8,
      reviewsCount: '18.2k reviews',
      topAttractions: ['Lord Jagannath Temple', 'Golden Sand Beach', 'Konark Sun Temple', 'Chilika Dolphin Lake'],
      reviewQuote: 'Clean Shatabdi coaches and fast travel to Puri. Watching the beach sunrise right after breakfast!',
      reviewerName: 'Debashis Roy (Kolkata)',
      trainName: 'Puri Shatabdi Express',
      trainNumber: '12021',
      duration: '8h 30m',
      startingFare: 980,
      offerCode: 'PURI150',
      discountBadge: 'Flat ₹150 OFF on UPI',
      tag: 'BEACH & HERITAGE',
      image: '/assets/images/landmarks/kolkata_puri.png',
    },
    {
      id: 'mumbai',
      name: 'Mumbai (City of Dreams & Marine Drive)',
      city: 'Mumbai',
      state: 'Maharashtra',
      stationCode: 'MMCT',
      fromStationCode: 'NDLS',
      fromCity: 'New Delhi',
      rating: 4.8,
      reviewsCount: '31.5k reviews',
      topAttractions: ['Gateway of India', 'Marine Drive Queen Necklace', 'Elephanta Caves', 'Bandra Sea Link'],
      reviewQuote: 'Mumbai Rajdhani catering and punctuality were 10/10. Reached Mumbai Central fresh for meetings!',
      reviewerName: 'Rohit Kulkarni (Pune)',
      trainName: 'Mumbai Rajdhani Express',
      trainNumber: '12951',
      duration: '15h 45m',
      startingFare: 2150,
      offerCode: 'MUMBAI15',
      discountBadge: '15% Cashback Promo',
      tag: 'METROPOLIS',
      image: '/assets/images/landmarks/delhi_mumbai.png',
    },
    {
      id: 'kolkata',
      name: 'Kolkata (Cultural Capital & Victoria Memorial)',
      city: 'Kolkata',
      state: 'West Bengal',
      stationCode: 'HWH',
      fromStationCode: 'NDLS',
      fromCity: 'New Delhi',
      rating: 4.8,
      reviewsCount: '21.4k reviews',
      topAttractions: ['Victoria Memorial Hall', 'Howrah Bridge Iconic Arch', 'Dakshineswar Temple', 'Park Street Food Trail'],
      reviewQuote: 'Howrah Rajdhani is the benchmark of Indian Railways comfort. Great sleep in 3A coach.',
      reviewerName: 'Ananya Sharma (Delhi)',
      trainName: 'Howrah Rajdhani Express',
      trainNumber: '12302',
      duration: '17h 00m',
      startingFare: 2050,
      offerCode: 'KOLKATA10',
      discountBadge: 'Free Catering Upgrade',
      tag: 'HERITAGE',
      image: '/assets/images/landmarks/kolkata_puri.png',
    },
    {
      id: 'pune',
      name: 'Pune & Lonavala (Sahyadri Hills & Forts)',
      city: 'Pune',
      state: 'Maharashtra',
      stationCode: 'PUNE',
      fromStationCode: 'MMCT',
      fromCity: 'Mumbai',
      rating: 4.9,
      reviewsCount: '19.6k reviews',
      topAttractions: ['Sinhagad Fort', 'Lonavala Bhushi Dam', 'Shaniwar Wada', 'Aga Khan Palace'],
      reviewQuote: 'Deccan Queen glass vista-dome coach through the Western Ghats was mesmerizing!',
      reviewerName: 'Siddharth Deshmukh (Mumbai)',
      trainName: 'Deccan Queen Vistadome',
      trainNumber: '12123',
      duration: '3h 15m',
      startingFare: 380,
      offerCode: 'PUNE50',
      discountBadge: '₹50 Instant Vistadome OFF',
      tag: 'HILL STATION',
      image: '/assets/images/landmarks/mumbai_pune.png',
    },
  ];

  const filtered = destinations.filter((d) => {
    if (selectedTag !== 'ALL' && d.tag !== selectedTag) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        d.name.toLowerCase().includes(q) ||
        d.city.toLowerCase().includes(q) ||
        d.topAttractions.some((a) => a.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleBookDestination = (d: TouristDestination) => {
    onClose();
    const fromStation = findStation(d.fromStationCode) || POPULAR_STATIONS[0];
    const toStation = findStation(d.stationCode) || POPULAR_STATIONS[1];
    executeSearch({
      fromStation,
      toStation,
      travelDate: searchParams.travelDate,
      passengersCount: 1,
      classType: 'All Classes',
      quota: 'General (GN)',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-[28px] max-w-4xl w-full border border-purple-200 shadow-2xl overflow-hidden font-sans select-none flex flex-col max-h-[92vh]">
        {/* Header with Search & Close */}
        <div className="p-4 px-6 bg-gradient-to-r from-[#0F172A] via-[#1E1B4B] to-[#0F172A] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-widest">
                EXPLORE BHARAT
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                Special Offers Active
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-display font-black text-white tracking-tight">
              Top Tourist Destinations & Discount Offers
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-purple-300 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search places, temples..."
                className="pl-8 pr-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs font-semibold text-white placeholder:text-purple-200/50 focus:outline-none focus:bg-white/20 w-44 sm:w-56"
              />
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

        {/* Promo Code Top Strip */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-2 px-6 text-slate-950 flex items-center justify-between text-xs font-bold shadow-xs">
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-slate-950" />
            <span>Monsoon Travel Carnival: Get flat ₹150 OFF on all AC Bookings with code <strong>NIRANTAR150</strong></span>
          </div>
          <button
            type="button"
            onClick={() => handleCopyCode('NIRANTAR150')}
            className="px-2.5 py-0.5 rounded-lg bg-slate-950 text-amber-300 text-[10px] font-black hover:bg-slate-900 cursor-pointer"
          >
            {copiedCode === 'NIRANTAR150' ? 'COPIED ✓' : 'COPY CODE'}
          </button>
        </div>

        {/* Categories Pills */}
        <div className="p-3 px-6 border-b border-purple-50 bg-purple-50/30 flex items-center gap-1.5 overflow-x-auto text-xs">
          {['ALL', 'SPIRITUAL', 'BEACH & HERITAGE', 'METROPOLIS', 'HILL STATION'].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedTag === tag
                  ? 'bg-[#7C3AED] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-purple-100/60 border border-purple-100'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Destination Cards List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#F9F8FC]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((d) => (
              <div
                key={d.id}
                className="bg-white rounded-3xl p-4 border border-purple-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
              >
                {/* Top Title & Discount Badge */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-black text-purple-800 bg-purple-100 px-2 py-0.5 rounded-full">
                      {d.tag}
                    </span>
                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Tag className="w-2.5 h-2.5" />
                      <span>{d.discountBadge}</span>
                    </span>
                  </div>

                  <h3 className="font-display font-black text-base text-slate-900 group-hover:text-purple-700 transition-colors">
                    {d.name}
                  </h3>

                  {/* Rating & Reviews */}
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <div className="flex items-center gap-1 text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{d.rating}</span>
                    </div>
                    <span>{d.reviewsCount}</span>
                    <span>•</span>
                    <span className="text-purple-700 font-bold">{d.trainName}</span>
                  </div>
                </div>

                {/* Top Attractions Tags */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Must-Visit Attractions</span>
                  <div className="flex flex-wrap gap-1">
                    {d.topAttractions.map((att, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-semibold text-slate-700 bg-purple-50/70 border border-purple-100 px-2 py-0.5 rounded-md"
                      >
                        {att}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Real Traveler Review Snippet */}
                <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 space-y-0.5">
                  <p className="italic font-medium">"{d.reviewQuote}"</p>
                  <span className="text-[10px] font-bold text-purple-900 block text-right">— {d.reviewerName}</span>
                </div>

                {/* Bottom Booking & Promo Code Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-purple-50">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Starting Fare</span>
                    <span className="text-base font-black text-slate-900">₹{d.startingFare.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyCode(d.offerCode)}
                      className="px-2.5 py-1.5 rounded-xl border border-purple-200 text-purple-900 hover:bg-purple-50 text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      {copiedCode === d.offerCode ? 'COPIED ✓' : `CODE: ${d.offerCode}`}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleBookDestination(d)}
                      className="px-4 py-1.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-black shadow-sm shadow-purple-600/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Book Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TouristDestinationsModal;
