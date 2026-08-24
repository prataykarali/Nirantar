import React from 'react';

export type NiraExpression =
  | 'idle'
  | 'happy'
  | 'thinking'
  | 'speaking'
  | 'idea'
  | 'waving'
  | 'wave'
  | 'alert'
  | 'questioning'
  | 'success'
  | 'thumbsup'
  | 'tablet'
  | 'booking'
  | 'tracking';

export type NiraSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface NiraRobotProps {
  expression?: NiraExpression;
  size?: NiraSize;
  message?: string;
  messagePosition?: 'top' | 'right' | 'left' | 'bottom';
  badge?: string;
  isFloating?: boolean;
  className?: string;
  onClick?: () => void;
}

// Map each expression to its specific transparent robot cutout
const exprImageMap: Record<NiraExpression, { src: string; alt: string; badge?: string; badgeColor?: string }> = {
  idle: {
    src: '/assets/images/characters/nira_tablet.png',
    alt: 'Nira Ready to Assist with Tablet',
  },
  tablet: {
    src: '/assets/images/characters/nira_tablet.png',
    alt: 'Nira with Journey Tablet',
    badge: '📱 Journey Connected',
    badgeColor: 'bg-purple-900 text-white',
  },
  booking: {
    src: '/assets/images/characters/nira_tablet.png',
    alt: 'Nira Booking Assist',
    badge: '⚡ Safe Autofill',
    badgeColor: 'bg-purple-900 text-white',
  },
  tracking: {
    src: '/assets/images/characters/nira_tablet.png',
    alt: 'Nira Live Telemetry',
    badge: '🛰️ Live Telemetry',
    badgeColor: 'bg-indigo-900 text-white',
  },
  speaking: {
    src: '/assets/images/characters/nira_idea.png',
    alt: 'Nira Speaking / Sharing Idea',
    badge: '🎙️ Voice Active',
    badgeColor: 'bg-cyan-700 text-white',
  },
  idea: {
    src: '/assets/images/characters/nira_idea.png',
    alt: 'Nira with Smart Suggestion',
    badge: '💡 Smart Tip',
    badgeColor: 'bg-amber-600 text-white',
  },
  waving: {
    src: '/assets/images/characters/nira_wave.png',
    alt: 'Nira Waving Hello',
    badge: '👋 Hi Citizen!',
    badgeColor: 'bg-purple-800 text-white',
  },
  wave: {
    src: '/assets/images/characters/nira_wave.png',
    alt: 'Nira Waving Hello',
  },
  happy: {
    src: '/assets/images/characters/nira_happy.png',
    alt: 'Nira Excited & Happy',
    badge: '✨ Best Fare Found!',
    badgeColor: 'bg-emerald-600 text-white',
  },
  thinking: {
    src: '/assets/images/characters/nira_thinking.png',
    alt: 'Nira Thinking / Questioning',
    badge: '🤔 Analyzing Trains',
    badgeColor: 'bg-purple-900 text-white',
  },
  questioning: {
    src: '/assets/images/characters/nira_thinking.png',
    alt: 'Nira Questioning',
    badge: '❓ How Can I Help?',
    badgeColor: 'bg-purple-900 text-white',
  },
  alert: {
    src: '/assets/images/characters/nira_thinking.png',
    alt: 'Nira Safety Alert',
    badge: '⚠️ Double-check Guard',
    badgeColor: 'bg-amber-600 text-white',
  },
  success: {
    src: '/assets/images/characters/nira_thumbsup.png',
    alt: 'Nira Thumbs Up / Confirmed',
    badge: '✓ 100% Verified',
    badgeColor: 'bg-emerald-600 text-white',
  },
  thumbsup: {
    src: '/assets/images/characters/nira_thumbsup.png',
    alt: 'Nira Thumbs Up',
    badge: '👍 Journey Simplified',
    badgeColor: 'bg-emerald-600 text-white',
  },
};

export const NiraRobot: React.FC<NiraRobotProps> = ({
  expression = 'idle',
  size = 'md',
  message,
  messagePosition = 'top',
  badge,
  isFloating = true,
  className = '',
  onClick,
}) => {
  // Size mapping
  const sizeMap: Record<NiraSize, { container: string; imgClass: string }> = {
    xs: { container: 'w-8 h-8', imgClass: 'w-8 h-8 object-contain' },
    sm: { container: 'w-12 h-12', imgClass: 'w-12 h-12 object-contain' },
    md: { container: 'w-20 h-22', imgClass: 'w-20 h-22 object-contain object-bottom' },
    lg: { container: 'w-32 h-36', imgClass: 'w-32 h-36 object-contain object-bottom' },
    xl: { container: 'w-48 h-52', imgClass: 'w-48 h-52 object-contain object-bottom' },
    '2xl': { container: 'w-64 h-72', imgClass: 'w-64 h-72 object-contain object-bottom' },
  };

  const { container, imgClass } = sizeMap[size];
  const exprData = exprImageMap[expression] || exprImageMap.idle;

  return (
    <div
      className={`relative inline-flex flex-col items-center justify-center select-none ${className} ${
        onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''
      }`}
      onClick={onClick}
    >
      {/* MESSAGE SPEECH BUBBLE (Non-clipping, clean layout) */}
      {message && (
        <div
          className={`z-30 pointer-events-none mb-1.5 transition-all animate-in fade-in zoom-in-95 duration-200 ${
            messagePosition === 'top'
              ? 'relative'
              : messagePosition === 'right'
              ? 'absolute left-full ml-2 top-1/4 whitespace-nowrap'
              : messagePosition === 'left'
              ? 'absolute right-full mr-2 top-1/4 whitespace-nowrap'
              : 'relative mt-1.5'
          }`}
        >
          <div className="bg-purple-950 text-white px-3.5 py-1.5 rounded-2xl border border-purple-400/40 shadow-lg shadow-purple-950/20 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
            <span>{message}</span>
          </div>
        </div>
      )}

      {/* 3D PIXAR ROBOT TRANSPARENT CUTOUT */}
      <div
        className={`relative ${container} flex items-center justify-center ${
          isFloating ? 'animate-bounce' : ''
        }`}
        style={{ animationDuration: '3.5s', animationTimingFunction: 'ease-in-out' }}
      >
        <img
          src={exprData.src}
          alt={exprData.alt}
          className={`${imgClass} drop-shadow-[0_8px_16px_rgba(126,34,206,0.25)] transition-all duration-300 pointer-events-none select-none`}
        />

        {/* Dynamic Expression indicator badge */}
        {exprData.badge && !badge && size !== 'xs' && size !== 'sm' && (
          <div
            className={`absolute top-0 right-0 ${exprData.badgeColor} text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-md border border-white/40 animate-in fade-in zoom-in-75 duration-300 whitespace-nowrap z-20`}
          >
            {exprData.badge}
          </div>
        )}
      </div>

      {/* CUSTOM BOTTOM BADGE (e.g. AI Travel Assistant) */}
      {badge && (
        <div className="mt-1.5 bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-900 text-white text-[10px] font-extrabold px-3 py-1 rounded-full border border-purple-300/40 shadow-sm whitespace-nowrap z-20 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{badge}</span>
        </div>
      )}
    </div>
  );
};

export default NiraRobot;
