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
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-purple-100/90 shadow-[0_-4px_25px_rgba(88,28,135,0.08)] md:hidden px-2 py-1.5 flex items-center justify-around select-none"
    >
      {/* 1. Home */}
      <button
        type="button"
        onClick={() => onNavigate('home')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
          isHome ? 'text-[#7C3AED]' : 'text-slate-500 hover:text-purple-800'
        }`}
      >
        <Home className={`w-5 h-5 ${isHome ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
        <span className={`text-[10px] tracking-tight mt-0.5 ${isHome ? 'font-black' : 'font-semibold'}`}>
          Home
        </span>
      </button>

      {/* 2. Discover */}
      <button
        type="button"
        onClick={() => onNavigate('discover')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
          isDiscover ? 'text-[#7C3AED]' : 'text-slate-500 hover:text-purple-800'
        }`}
      >
        <Search className={`w-5 h-5 ${isDiscover ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
        <span className={`text-[10px] tracking-tight mt-0.5 ${isDiscover ? 'font-black' : 'font-semibold'}`}>
          Discover
        </span>
      </button>

      {/* 3. Center Elevated Nira Mascot Button */}
      <button
        type="button"
        onClick={onOpenNira}
        className="flex flex-col items-center justify-center -mt-5 group cursor-pointer focus:outline-none"
        aria-label="Open Nira AI Assistant"
      >
        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#7C3AED] via-[#8B5CF6] to-[#A78BFA] p-0.5 shadow-lg shadow-purple-600/30 group-hover:scale-105 active:scale-95 transition-transform flex items-center justify-center ring-4 ring-[#F8F6FC]">
          <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden p-1">
            <img
              src="/assets/images/characters/nira_happy.png"
              alt="Nira AI"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
        <span className="text-[10px] font-black text-[#7C3AED] tracking-tight mt-0.5">
          Nira AI
        </span>
      </button>

      {/* 4. My Journeys */}
      <button
        type="button"
        onClick={() => onNavigate('my-journeys')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
          isJourneys ? 'text-[#7C3AED]' : 'text-slate-500 hover:text-purple-800'
        }`}
      >
        <Train className={`w-5 h-5 ${isJourneys ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
        <span className={`text-[10px] tracking-tight mt-0.5 ${isJourneys ? 'font-black' : 'font-semibold'}`}>
          Journeys
        </span>
      </button>

      {/* 5. Track */}
      <button
        type="button"
        onClick={() => onNavigate('track')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
          isTrack ? 'text-[#7C3AED]' : 'text-slate-500 hover:text-purple-800'
        }`}
      >
        <MapPin className={`w-5 h-5 ${isTrack ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
        <span className={`text-[10px] tracking-tight mt-0.5 ${isTrack ? 'font-black' : 'font-semibold'}`}>
          Track
        </span>
      </button>

      {/* 6. More / Menu */}
      <button
        type="button"
        onClick={onOpenMenu}
        className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-slate-500 hover:text-purple-800 transition-all cursor-pointer"
        aria-label="Open More Menu"
      >
        <Menu className="w-5 h-5 stroke-[1.75]" />
        <span className="text-[10px] font-semibold tracking-tight mt-0.5">
          Menu
        </span>
      </button>
    </nav>
  );
};

export default MobileNav;
