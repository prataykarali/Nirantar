import React from 'react';
import { Train, Clock, MapPin, CheckCircle2, Ticket } from 'lucide-react';

export interface TrainCardProps {
  trainNo: string;
  trainName: string;
  source: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  fareInr: number | string;
  seatsAvailable?: number;
  onBook?: (trainNo: string) => void;
}

export const TrainCard: React.FC<TrainCardProps> = ({
  trainNo,
  trainName,
  source,
  destination,
  departureTime,
  arrivalTime,
  fareInr,
  seatsAvailable = 42,
  onBook,
}) => {
  return (
    <div className="my-2 p-4 rounded-2xl bg-gradient-to-br from-[#131738] to-[#0c0e24] border border-purple-500/30 text-white shadow-xl hover:border-purple-400/50 transition-all space-y-3">
      {/* HEADER: TRAIN NAME & NUMBER */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <Train className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white tracking-wide">{trainName}</h4>
            <span className="text-[10px] font-mono text-purple-300">Train #{trainNo}</span>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> AVAILABLE ({seatsAvailable})
        </span>
      </div>

      {/* ROUTE & TIMINGS */}
      <div className="grid grid-cols-2 gap-2 text-xs py-1">
        <div className="space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1">
            <MapPin className="w-3 h-3 text-indigo-400" /> Origin
          </span>
          <p className="font-bold text-white text-sm">{source}</p>
          <p className="text-[11px] font-mono text-slate-300 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" /> {departureTime}
          </p>
        </div>

        <div className="space-y-1 text-right">
          <span className="text-[10px] font-mono text-slate-400 uppercase justify-end flex items-center gap-1">
            Destination <MapPin className="w-3 h-3 text-purple-400" />
          </span>
          <p className="font-bold text-white text-sm">{destination}</p>
          <p className="text-[11px] font-mono text-slate-300 justify-end flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" /> {arrivalTime}
          </p>
        </div>
      </div>

      {/* FOOTER: FARE & BOOK BUTTON */}
      <div className="pt-2 border-t border-white/10 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono text-slate-400 uppercase">Total Fare</span>
          <p className="text-base font-extrabold text-emerald-400">
            {typeof fareInr === 'number' ? `₹${fareInr}` : fareInr}
          </p>
        </div>

        <button
          onClick={() => onBook && onBook(trainNo)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-500/25 flex items-center gap-1.5 transition-all active:scale-95"
        >
          <Ticket className="w-3.5 h-3.5" /> Book Ticket
        </button>
      </div>
    </div>
  );
};
