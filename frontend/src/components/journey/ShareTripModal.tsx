import React, { useState } from 'react';
import {
  Share2,
  Copy,
  CheckCircle2,
  X,
  QrCode,
  Train,
  MapPin,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

interface ShareTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainNumber: string;
  trainName: string;
  currentStationName: string;
  currentSpeed: number;
  eta: string;
  pnrNumber?: string;
}

export const ShareTripModal: React.FC<ShareTripModalProps> = ({
  isOpen,
  onClose,
  trainNumber,
  trainName,
  currentStationName,
  currentSpeed,
  eta,
  pnrNumber,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const trackingUrl = `https://nirantar.gov.in/track?train=${trainNumber}${pnrNumber ? `&pnr=${pnrNumber}` : ''}`;
  const shareText = `🚆 Tracking ${trainName} (#${trainNumber})\n📍 Approaching: ${currentStationName}\n⚡ Live Speed: ${currentSpeed} km/h\n⏱️ ETA: ${eta}\n🔗 Live Radar: ${trackingUrl}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(trackingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleTelegramShare = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(trackingUrl)}&text=${encodeURIComponent(`Tracking Train #${trainNumber} ${trainName} approaching ${currentStationName}`)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in select-none overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-[28px] max-w-md w-full max-h-[90dvh] overflow-y-auto border border-purple-200 shadow-2xl font-sans">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/30 border border-purple-400/30 flex items-center justify-center font-bold">
              <Share2 className="w-5 h-5 text-purple-200" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Share Live Trip Status</h3>
              <p className="text-[11px] text-purple-200 font-medium">
                Live GPS Satellite Radar Feed
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
          {/* Live Summary Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-50 border border-purple-200 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm">
                #{trainNumber} • {trainName}
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-full border border-emerald-200">
                🟢 Live GPS
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400 block font-bold">Next Stoppage:</span>
                <span className="font-bold text-purple-950">{currentStationName}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-bold">Current Speed:</span>
                <span className="font-bold text-slate-900 font-mono">{currentSpeed} km/h</span>
              </div>
            </div>
          </div>

          {/* Quick Share Buttons */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              1-Tap Instant Share:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <span>💬 WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={handleTelegramShare}
                className="py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <span>✈️ Telegram</span>
              </button>
            </div>
          </div>

          {/* Share Link Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Copy Live Tracking URL:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={trackingUrl}
                className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-purple-50/50 text-[11px] font-mono text-slate-700 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="py-2 px-3 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Close */}
          <div className="pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
