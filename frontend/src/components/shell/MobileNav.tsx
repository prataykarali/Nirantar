import React from 'react';
import { Home, Search, Train, MapPin, Menu } from 'lucide-react';

export interface MobileNavProps {
  activePage: string;
  onNavigate: (page: string) => void;
  onOpenNira: () => void;
  onOpenMenu: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activePage,
  onNavigate,
  onOpenNira,
  onOpenMenu,
}) => {
  const isHome = activePage === 'home';
  const isDiscover = activePage === 'discover' || activePage === 'trains' || activePage === 'results';
  const isJourneys = activePage === 'my-journeys' || activePage === 'ticket' || activePage === 'completion';
  const isTrack = activePage === 'track';

  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-purple-100/90 dark:border-slate-800 shadow-[0_-4px_25px_rgba(88,28,135,0.08)] md:hidden px-1 sm:px-2 py-1 safe-area-bottom flex items-center justify-around select-none transition-colors duration-300"
    >
      {/* 1. Home */}
      <button
        type="button"
        onClick={() => onNavigate('home')}
        className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer ${
          isHome ? 'text-[#7C3AED] dark:text-purple-400' : 'text-slate-500 dark:text-slate-400 hover:text-purple-800'
        }`}
      >
        <Home className={`w-5 h-5 ${isHome ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
        <span className={`text-[9px] sm:text-[10px] tracking-tight mt-0.5 truncate ${isHome ? 'font-black' : 'font-semibold'}`}>
          Home
        </span>
      </button>

      {/* 2. Discover */}
      <button
        type="button"
        onClick={() => onNavigate('discover')}
        className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer ${
          isDiscover ? 'text-[#7C3AED] dark:text-purple-400' : 'text-slate-500 dark:text-slate-400 hover:text-purple-800'
        }`}
      >
        <Search className={`w-5 h-5 ${isDiscover ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
        <span className={`text-[9px] sm:text-[10px] tracking-tight mt-0.5 truncate ${isDiscover ? 'font-black' : 'font-semibold'}`}>
          Discover
        </span>
      </button>

      {/* 3. Center Elevated Nira Mascot Button */}
      <button
        type="button"
        onClick={onOpenNira}
        className="flex flex-col items-center justify-center -mt-5 px-1 group cursor-pointer focus:outline-none shrink-0"
        aria-label="Open Nira AI Assistant"
      >
        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-[#7C3AED] via-[#8B5CF6] to-[#A78BFA] p-0.5 shadow-lg shadow-purple-600/30 group-hover:scale-105 active:scale-95 transition-transform flex items-center justify-center ring-4 ring-[#F8F6FC] dark:ring-[#0B0813]">
          <div className="w-full h-full rounded-full bg-white dark:bg-slate-850 flex items-center justify-center overflow-hidden p-0.5">
            <img
              src="/assets/images/characters/nira_happy.png"
              alt="Nira AI"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
        <span className="text-[9px] sm:text-[10px] font-black text-[#7C3AED] dark:text-purple-400 tracking-tight mt-0.5">
          Nira AI
        </span>
      </button>

      {/* 4. My Journeys */}
      <button
        type="button"
        onClick={() => onNavigate('my-journeys')}
        className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer ${
          isJourneys ? 'text-[#7C3AED] dark:text-purple-400' : 'text-slate-500 dark:text-slate-400 hover:text-purple-800'
        }`}
      >
        <Train className={`w-5 h-5 ${isJourneys ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
        <span className={`text-[9px] sm:text-[10px] tracking-tight mt-0.5 truncate ${isJourneys ? 'font-black' : 'font-semibold'}`}>
          Journeys
        </span>
      </button>

      {/* 5. Track */}
      <button
        type="button"
        onClick={() => onNavigate('track')}
        className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer ${
          isTrack ? 'text-[#7C3AED] dark:text-purple-400' : 'text-slate-500 dark:text-slate-400 hover:text-purple-800'
        }`}
      >
        <MapPin className={`w-5 h-5 ${isTrack ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
        <span className={`text-[9px] sm:text-[10px] tracking-tight mt-0.5 truncate ${isTrack ? 'font-black' : 'font-semibold'}`}>
          Track
        </span>
      </button>

      {/* 6. More / Menu */}
      <button
        type="button"
        onClick={onOpenMenu}
        className="flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-1 rounded-xl text-slate-500 dark:text-slate-400 hover:text-purple-800 dark:hover:text-purple-300 transition-all cursor-pointer"
        aria-label="Open More Menu"
      >
        <Menu className="w-5 h-5 stroke-[1.75]" />
        <span className="text-[9px] sm:text-[10px] font-semibold tracking-tight mt-0.5 truncate">
          Menu
        </span>
      </button>
    </nav>
  );
};

export default MobileNav;
