import React from 'react';

export type CitizenPose =
  | 'greeting'
  | 'wave'
  | 'planning'
  | 'thinking'
  | 'celebrating'
  | 'excited'
  | 'traveling'
  | 'confident'
  | 'payment'
  | 'thumbsup'
  | 'booking'
  | 'ticket';

export type CitizenSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface CitizenCharacterProps {
  pose?: CitizenPose;
  size?: CitizenSize;
  quote?: string;
  quotePosition?: 'top' | 'right' | 'left' | 'bottom';
  showBadge?: boolean;
  badgeText?: string;
  className?: string;
  onClick?: () => void;
}

// Map each pose to its specific transparent character cutout
const poseImageMap: Record<CitizenPose, { src: string; alt: string; badge?: string; badgeColor?: string }> = {
  greeting: {
    src: '/assets/images/characters/citizen_wave.png',
    alt: 'Ananya Waving Hello',
  },
  wave: {
    src: '/assets/images/characters/citizen_wave.png',
    alt: 'Ananya Waving Hello',
  },
  planning: {
    src: '/assets/images/characters/citizen_thinking.png',
    alt: 'Ananya Planning Journey',
    badge: '🔍 Planning Trip',
    badgeColor: 'bg-purple-800 text-white',
  },
  thinking: {
    src: '/assets/images/characters/citizen_thinking.png',
    alt: 'Ananya Thinking',
    badge: '🤔 Discovering',
    badgeColor: 'bg-purple-800 text-white',
  },
  celebrating: {
    src: '/assets/images/characters/citizen_excited.png',
    alt: 'Ananya Celebrating',
    badge: '🎉 Trip Confirmed!',
    badgeColor: 'bg-emerald-600 text-white',
  },
  excited: {
    src: '/assets/images/characters/citizen_excited.png',
    alt: 'Ananya Excited',
    badge: '✨ Ready to Go',
    badgeColor: 'bg-emerald-600 text-white',
  },
  traveling: {
    src: '/assets/images/characters/citizen_confident.png',
    alt: 'Ananya Traveling with Backpack',
    badge: '🚆 Live On Board',
    badgeColor: 'bg-purple-950 text-white',
  },
  confident: {
    src: '/assets/images/characters/citizen_confident.png',
    alt: 'Ananya Confident Traveler',
    badge: '🎒 Ready Traveler',
    badgeColor: 'bg-purple-900 text-white',
  },
  payment: {
    src: '/assets/images/characters/citizen_thumbsup.png',
    alt: 'Ananya Payment Reassurance',
    badge: '🔒 Safe Payment',
    badgeColor: 'bg-indigo-800 text-white',
  },
  thumbsup: {
    src: '/assets/images/characters/citizen_thumbsup.png',
    alt: 'Ananya Thumbs Up',
    badge: '👍 All Set!',
    badgeColor: 'bg-amber-600 text-white',
  },
  booking: {
    src: '/assets/images/characters/citizen_ticket.png',
    alt: 'Ananya with Railway Ticket',
    badge: '🎫 e-Ticket Ready',
    badgeColor: 'bg-purple-900 text-white',
  },
  ticket: {
    src: '/assets/images/characters/citizen_ticket.png',
    alt: 'Ananya with Railway Ticket',
    badge: '🎫 Verified Ticket',
    badgeColor: 'bg-purple-900 text-white',
  },
};

export const CitizenCharacter: React.FC<CitizenCharacterProps> = ({
  pose = 'greeting',
  size = 'md',
  quote,
  quotePosition = 'right',
  showBadge = false,
  badgeText = 'Citizen Verified',
  className = '',
  onClick,
}) => {
  // Size mapping
  const sizeMap: Record<CitizenSize, { container: string; imgClass: string }> = {
    xs: { container: 'w-10 h-10', imgClass: 'w-10 h-10 object-cover object-top' },
    sm: { container: 'w-14 h-14', imgClass: 'w-14 h-14 object-cover object-top' },
    md: { container: 'w-24 h-28', imgClass: 'w-24 h-28 object-contain object-bottom' },
    lg: { container: 'w-40 h-48', imgClass: 'w-40 h-48 object-contain object-bottom' },
    xl: { container: 'w-60 h-72', imgClass: 'w-60 h-72 object-contain object-bottom' },
    '2xl': { container: 'w-80 h-96', imgClass: 'w-80 h-96 object-contain object-bottom' },
  };

  const { container, imgClass } = sizeMap[size];
  const poseData = poseImageMap[pose] || poseImageMap.greeting;

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className} ${
        onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''
      }`}
      onClick={onClick}
    >
      {/* SPEECH BUBBLE / QUOTE */}
      {quote && (
        <div
          className={`absolute z-20 whitespace-normal pointer-events-none transition-all ${
            quotePosition === 'top'
              ? '-top-14 left-1/2 -translate-x-1/2'
              : quotePosition === 'right'
              ? 'left-full ml-3 top-1/4'
              : quotePosition === 'left'
              ? 'right-full mr-3 top-1/4'
              : '-bottom-12 left-1/2 -translate-x-1/2'
          }`}
        >
          <div className="bg-white text-purple-950 px-4 py-2 rounded-2xl border-2 border-purple-200 shadow-xl shadow-purple-900/10 text-xs sm:text-sm font-bold flex items-center gap-2 max-w-xs">
            <span>{quote}</span>
          </div>
        </div>
      )}

      {/* 3D PIXAR CHARACTER TRANSPARENT CUTOUT */}
      <div className={`relative ${container} flex items-center justify-center`}>
        <img
          src={poseData.src}
          alt={poseData.alt}
          className={`${imgClass} drop-shadow-[0_8px_16px_rgba(88,28,135,0.18)] transition-all duration-300 pointer-events-none select-none`}
        />

        {/* Dynamic Pose indicator tag - only when showBadge is enabled */}
        {showBadge && poseData.badge && size !== 'xs' && size !== 'sm' && (
          <div
            className={`absolute -top-2 -right-2 ${poseData.badgeColor} text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-md border border-white/40 animate-in fade-in zoom-in-75 duration-300 whitespace-nowrap`}
          >
            {poseData.badge}
          </div>
        )}
      </div>

      {/* CITIZEN VERIFIED BADGE */}
      {showBadge && (
        <div className="absolute -bottom-2 bg-gradient-to-r from-purple-900 to-purple-800 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-purple-300 shadow-md flex items-center gap-1 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{badgeText}</span>
        </div>
      )}
    </div>
  );
};

export default CitizenCharacter;
