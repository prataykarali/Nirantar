import React, { useState } from 'react';
import {
  Bell,
  Clock,
  MapPin,
  Volume2,
  Vibrate,
  CheckCircle2,
  X,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { StationStop } from '../../data/trainStoppages';

interface WakeUpAlarmModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainNumber: string;
  trainName: string;
  stoppages: StationStop[];
  currentStationIndex: number;
  onAlarmSet: (stationName: string, leadMinutes: number) => void;
}

export const WakeUpAlarmModal: React.FC<WakeUpAlarmModalProps> = ({
  isOpen,
  onClose,
  trainNumber,
  trainName,
  stoppages,
  currentStationIndex,
  onAlarmSet,
}) => {
  const upcomingStops = stoppages.slice(currentStationIndex + 1);
  const defaultTarget = upcomingStops[upcomingStops.length - 1] || stoppages[stoppages.length - 1] || { name: 'Destination Station', code: 'DEST' };

  const [selectedStation, setSelectedStation] = useState<string>(defaultTarget.name);
  const [leadMinutes, setLeadMinutes] = useState<number>(15);
  const [audioChime, setAudioChime] = useState<boolean>(true);
  const [vibration, setVibration] = useState<boolean>(true);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSaveAlarm = () => {
    setIsSaved(true);
    onAlarmSet(selectedStation, leadMinutes);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in select-none overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-[28px] max-w-md w-full max-h-[90dvh] overflow-y-auto border border-purple-200 shadow-2xl font-sans">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/30 border border-purple-400/30 flex items-center justify-center font-bold">
              <Bell className="w-5 h-5 text-purple-200 animate-bounce" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Station Wake-Up Alarm</h3>
              <p className="text-[11px] text-purple-200 font-medium">
                #{trainNumber} • {trainName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs font-semibold text-slate-700">
          {isSaved ? (
            <div className="py-8 text-center space-y-2 animate-in zoom-in-95">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-black text-slate-900">Alarm Set Successfully!</h4>
              <p className="text-slate-500 text-xs">
                You will be alerted <strong>{leadMinutes} minutes</strong> before arriving at <strong>{selectedStation}</strong>.
              </p>
            </div>
          ) : (
            <>
              {/* Station Selection */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Select Target Stoppage:
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-purple-600 absolute left-3 top-3" />
                  <select
                    value={selectedStation}
                    onChange={(e) => setSelectedStation(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-purple-200 bg-purple-50/40 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    {upcomingStops.length > 0 ? (
                      upcomingStops.map((s) => (
                        <option key={s.code} value={s.name}>
                          {s.name} ({s.code}) — Arr: {s.scheduledArr} • {s.platform}
                        </option>
                      ))
                    ) : (
                      stoppages.map((s) => (
                        <option key={s.code} value={s.name}>
                          {s.name} ({s.code}) — Arr: {s.scheduledArr}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Lead Time */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Wake-Up Alert Time Before Arrival:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setLeadMinutes(mins)}
                      className={`py-2 px-2 rounded-xl text-center font-bold text-xs transition-all cursor-pointer ${
                        leadMinutes === mins
                          ? 'bg-purple-900 text-white shadow-md shadow-purple-900/30 ring-2 ring-purple-400'
                          : 'bg-purple-50 hover:bg-purple-100 text-purple-950 border border-purple-200'
                      }`}
                    >
                      {mins} mins
                    </button>
                  ))}
                </div>
              </div>

              {/* Preferences */}
              <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-purple-700" />
                    <span className="text-xs font-bold text-slate-800">Audio Chime Alarm</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={audioChime}
                    onChange={(e) => setAudioChime(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-purple-100/80 pt-2">
                  <div className="flex items-center gap-2">
                    <Vibrate className="w-4 h-4 text-purple-700" />
                    <span className="text-xs font-bold text-slate-800">Vibration Feedback</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={vibration}
                    onChange={(e) => setVibration(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Geo-fence Note */}
              <div className="flex items-center gap-2 text-[11px] text-purple-900 font-medium bg-purple-100/60 p-2.5 rounded-xl">
                <Sparkles className="w-4 h-4 text-purple-700 shrink-0" />
                <span>Smart GPS Geo-fence ensures alert triggers even if the train is running delayed.</span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold transition-all cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAlarm}
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-bold shadow-md shadow-purple-600/30 transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
                >
                  <Bell className="w-4 h-4" />
                  <span>Set Active Alarm</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
