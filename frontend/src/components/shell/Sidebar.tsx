import React from 'react';
import {
  Home,
  Compass,
  Ticket,
  MapPin,
  BookOpen,
  User,
  Settings,
  Send,
  X,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useJourney } from '../../context/JourneyContext';

export type NavPageId =
  | 'home'
  | 'discover'
  | 'booking'
  | 'my-journeys'
  | 'track'
  | 'payments'
  | 'help'
  | 'settings'
  | 'profile';

export interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  onOpenNira?: () => void;
  className?: string;
  isMobileDrawer?: boolean;
  onCloseDrawer?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onNavigate,
  onOpenNira,
  className = '',
  isMobileDrawer = false,
  onCloseDrawer,
}) => {
  const { taskStack, resumeTask } = useJourney();

  const coreNavItems = [
    { id: 'home', label: 'Home', icon: Home, subtitle: 'Overview & Intent' },
    { id: 'discover', label: 'Discover', icon: Compass, subtitle: 'Find Railway Services' },
    { id: 'track', label: 'Track Train', icon: MapPin, subtitle: 'Live GPS Running Status' },
    { id: 'my-journeys', label: 'My Journey', icon: Ticket, subtitle: 'Tickets & History' },
  ];

  const assistNavItems = [
    { id: 'help', label: 'Nirantar Guide', icon: BookOpen, subtitle: 'Jargon & Rules' },
  ];

  const accountNavItems = [
    { id: 'profile', label: 'Profile', icon: User, subtitle: 'Citizen Identity' },
    { id: 'settings', label: 'Settings', icon: Settings, subtitle: 'Language & Config' },
  ];

  const handleNavClick = (page: string) => {
    onNavigate(page);
    if (isMobileDrawer && onCloseDrawer) {
      onCloseDrawer();
    }
  };

  return (
    <aside
      className={`w-64 lg:w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-r border-purple-100 dark:border-slate-800 flex flex-col h-screen select-none shadow-[2px_0_16px_rgba(88,28,135,0.02)] justify-between p-4 overflow-y-auto overflow-x-hidden transition-colors duration-300 ${className}`}
    >
      {/* 1. TOP BRAND LOGO & NAVIGATION */}
      <div className="space-y-3">
        {/* MOBILE CLOSE BUTTON (IF IN DRAWER MODE) */}
        {isMobileDrawer && (
          <div className="flex items-center justify-between pb-1 border-b border-purple-50 dark:border-purple-900/40">
            <span className="text-xs font-black text-purple-950 dark:text-purple-200 uppercase tracking-wider">Navigation Menu</span>
            <button
              type="button"
              onClick={onCloseDrawer}
              className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-900 dark:text-purple-200 flex items-center justify-center cursor-pointer transition-colors"
              aria-label="Close navigation menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* BRAND LOGO */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => handleNavClick('home')}
          className="cursor-pointer group focus:outline-none flex flex-col items-center text-center pt-1 pb-1"
        >
          {/* 3D "Ni" Brand Icon */}
          <div className="w-12 h-12 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
            <img
              src="/assets/images/brand/nirantar_logo_icon.png"
              alt="Nirantar Logo"
              className="w-full h-full object-contain drop-shadow-sm"
            />
          </div>
          <h1 className="font-display font-black text-xl tracking-tight text-slate-900 dark:text-white leading-none">
            Nirantar
          </h1>
          <p className="text-[10px] font-extrabold text-[#7C3AED] dark:text-purple-400 mt-0.5 tracking-wide">
            The Railway Journey That Explains Itself
          </p>
        </div>

        {/* CONTEXTUAL TASKSTACK RESUME BANNER (If interrupted) */}
        {taskStack.length > 0 && activePage !== 'booking' && activePage !== 'payment' && (
          <button
            type="button"
            onClick={() => {
              resumeTask();
              if (isMobileDrawer && onCloseDrawer) onCloseDrawer();
            }}
            className="w-full p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-center justify-between text-left hover:bg-amber-500/20 transition-all cursor-pointer shadow-xs animate-pulse"
          >
            <div className="flex items-center gap-2">
              <RotateCcw className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
              <div>
                <span className="text-[11px] font-black block">Resume Booking</span>
                <span className="text-[10px] text-amber-800 dark:text-amber-300 truncate block max-w-[130px]">
                  {taskStack[0].title}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-black text-amber-700 bg-amber-200/80 dark:bg-amber-900/60 dark:text-amber-200 px-1.5 py-0.5 rounded">➔</span>
          </button>
        )}

        {/* NAVIGATION GROUPS */}
        <div className="space-y-3 pt-1">
          {/* GROUP 1: CORE JOURNEY */}
          <div>
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 mb-1 block">
              Core Journey
            </span>
            <nav className="space-y-0.5">
              {coreNavItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  activePage === item.id ||
                  (item.id === 'track' && (activePage === 'track' || activePage === 'tracker')) ||
                  (item.id === 'discover' && (activePage === 'trains' || activePage === 'results' || activePage === 'booking' || activePage === 'workspace')) ||
                  (item.id === 'my-journeys' && (activePage === 'ticket' || activePage === 'completion'));

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200 group text-left cursor-pointer ${
                      isActive
                        ? 'bg-[#F2EBFF] dark:bg-purple-900/50 text-[#6B21A8] dark:text-purple-300 font-black shadow-xs'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-purple-50/60 dark:hover:bg-purple-950/50 hover:text-purple-900 dark:hover:text-purple-200 font-bold'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive ? 'text-[#6B21A8] dark:text-purple-300' : 'text-slate-500 dark:text-slate-400 group-hover:text-purple-800 dark:group-hover:text-purple-300'
                        }`}
                      />
                      <span className="text-xs truncate">{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* GROUP 2: ASSIST & EXPLAIN */}
          <div>
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 mb-1 block">
              Assistance & Guide
            </span>
            <nav className="space-y-0.5">
              {assistNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200 group text-left cursor-pointer ${
                      isActive
                        ? 'bg-[#F2EBFF] dark:bg-purple-900/50 text-[#6B21A8] dark:text-purple-300 font-black shadow-xs'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-purple-50/60 dark:hover:bg-purple-950/50 hover:text-purple-900 dark:hover:text-purple-200 font-bold'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive ? 'text-[#6B21A8] dark:text-purple-300' : 'text-slate-500 dark:text-slate-400 group-hover:text-purple-800 dark:group-hover:text-purple-300'
                        }`}
                      />
                      <span className="text-xs truncate">{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* GROUP 3: ACCOUNT & PREFERENCES */}
          <div>
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 mb-1 block">
              Account & Settings
            </span>
            <nav className="space-y-0.5">
              {accountNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200 group text-left cursor-pointer ${
                      isActive
                        ? 'bg-[#F2EBFF] dark:bg-purple-900/50 text-[#6B21A8] dark:text-purple-300 font-black shadow-xs'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-purple-50/60 dark:hover:bg-purple-950/50 hover:text-purple-900 dark:hover:text-purple-200 font-bold'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive ? 'text-[#6B21A8] dark:text-purple-300' : 'text-slate-500 dark:text-slate-400 group-hover:text-purple-800 dark:group-hover:text-purple-300'
                        }`}
                      />
                      <span className="text-xs truncate">{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* 2. BOTTOM NIRA ROBOT ASSISTANT CARD */}
      <div className="relative pt-10 mt-2">
        {/* Dynamic Nira 3D Mascot Peeking Out */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 w-24 h-24 pointer-events-none flex items-center justify-center z-10">
          <img
            src={
              activePage === 'completion' || activePage === 'ticket'
                ? '/assets/images/characters/nira_excited.png'
                : activePage === 'my-journeys' || activePage === 'journeys'
                ? '/assets/images/characters/nira_traveler.png'
                : activePage === 'payment' || activePage === 'payments'
                ? '/assets/images/characters/nira_settings.png'
                : activePage === 'booking' || activePage === 'workspace'
                ? '/assets/images/characters/nira_traveler.png'
                : activePage === 'trains' || activePage === 'results'
                ? '/assets/images/characters/nira_conductor.png'
                : activePage === 'discover'
                ? '/assets/images/characters/nira_explorer.png'
                : activePage === 'track'
                ? '/assets/images/characters/nira_explorer.png'
                : activePage === 'help'
                ? '/assets/images/characters/nira_guide_teacher.png'
                : activePage === 'settings'
                ? '/assets/images/characters/nira_settings.png'
                : '/assets/images/characters/nira_happy_mascot.png'
            }
            alt="Nira AI Assistant"
            className="w-20 h-20 object-contain drop-shadow-md animate-bounce-gentle transition-all duration-300"
          />
        </div>

        {/* Card Container */}
        <div className="pt-10 pb-3 px-3 rounded-[24px] bg-white dark:bg-slate-850 dark:bg-slate-800 border-2 border-purple-100 dark:border-slate-700 shadow-[0_6px_20px_rgba(88,28,135,0.06)] flex flex-col items-center text-center space-y-2">
          <div className="space-y-0.5">
            <h3 className="font-display font-black text-base text-slate-900 dark:text-white tracking-tight">
              Hi, I'm Nira!
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold px-1">
              Your AI travel assistant
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (isMobileDrawer && onCloseDrawer) onCloseDrawer();
              onOpenNira?.();
            }}
            className="w-full py-2 px-3 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-purple-600/20 active:scale-95 transition-all cursor-pointer"
          >
            <span>Chat with Nira</span>
            <Send className="w-3 h-3" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
