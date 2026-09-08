import React, { useState } from 'react';
import { Volume2, VolumeX, Sparkles } from 'lucide-react';
import { MultimodalAiService } from '../services/multimodalAiService';

interface AudioAnnouncementButtonProps {
  trainNumber?: string;
  trainName?: string;
  from?: string;
  to?: string;
  platform?: string;
  customText?: string;
  label?: string;
  className?: string;
  compact?: boolean;
}

export const AudioAnnouncementButton: React.FC<AudioAnnouncementButtonProps> = ({
  trainNumber = '12951',
  trainName = 'Mumbai Rajdhani',
  from = 'Delhi (NDLS)',
  to = 'Mumbai (MMCT)',
  platform = '1',
  customText,
  label = 'Announcement',
  className = '',
  compact = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayAnnouncement = async () => {
    if (isPlaying) {
      MultimodalAiService.stopSpeaking();
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);

    if (customText) {
      await MultimodalAiService.speakText(
        customText,
        () => setIsPlaying(true),
        () => setIsPlaying(false),
        true
      );
    } else {
      await MultimodalAiService.playStationAnnouncement({
        trainNumber,
        trainName,
        from,
        to,
        platform,
        onStart: () => setIsPlaying(true),
        onEnd: () => setIsPlaying(false),
      });
    }
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={handlePlayAnnouncement}
        className={`p-1.5 rounded-lg border transition-all flex items-center justify-center ${
          isPlaying
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
            : 'bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border-purple-500/30 hover:text-white'
        } ${className}`}
        title={isPlaying ? 'Stop Announcement' : 'Play Murf AI Station Announcement'}
      >
        {isPlaying ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handlePlayAnnouncement}
      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
        isPlaying
          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
          : 'bg-[#181a3e] hover:bg-purple-900/40 text-purple-200 hover:text-white border-purple-500/30 hover:border-purple-400/60'
      } ${className}`}
      title="Play realistic Indian Railway chime & station announcement via Murf AI"
    >
      {isPlaying ? (
        <>
          <VolumeX className="w-3.5 h-3.5 text-amber-400" />
          <span>Playing Chime…</span>
        </>
      ) : (
        <>
          <Volume2 className="w-3.5 h-3.5 text-purple-300" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
};
