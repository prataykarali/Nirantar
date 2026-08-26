import React, { useState, useRef, useEffect } from 'react';
import {
  Gift,
  Bell,
  ChevronDown,
  User,
  Users,
  Settings as SettingsIcon,
  Link,
  LogOut,
  CheckCircle2,
} from 'lucide-react';
import { useJourney } from '../../context/JourneyContext';
import { OAuthLoginModal } from '../auth/OAuthLoginModal';

export interface TopBarProps {
  pageTitle?: string;
  pageSubtitle?: string;
  onOpenHelp?: () => void;
  onOpenNotifications?: () => void;
  onOpenProfile?: () => void;
  notificationCount?: number;
  className?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  pageTitle = 'Home',
  pageSubtitle = 'Plan, discover & book your journey',
  notificationCount = 0,
  className = '',
}) => {
  const {
    activePage,
    navigateTo,
    issuedTicket,
    authState,
    setShowImStuck,
    setShowVisualDiagram,
    notifications,
    markNotificationsRead,
  } = useJourney();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRewards, setShowRewards] = useState(false);
  const [showOAuthModal, setShowOAuthModal] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const rewardRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setShowDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setShowNotifications(false);
      }
      if (rewardRef.current && !rewardRef.current.contains(target)) {
        setShowRewards(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuClick = (action: string) => {
    setShowDropdown(false);
    if (action === 'profile') {
      navigateTo('profile');
    } else if (action === 'settings') {
      navigateTo('settings');
    } else if (action === 'passengers') {
      navigateTo('profile');
    } else if (action === 'accounts') {
      navigateTo('profile');
    } else if (action === 'logout') {
      navigateTo('home');
    }
  };

  const unreadFromFeed = notifications.filter((n) => !n.read).length;
  const dynamicNotifCount = notificationCount + unreadFromFeed + (issuedTicket && unreadFromFeed === 0 ? 1 : 0);

  return (
    <header
      className={`h-16 px-6 lg:px-8 bg-transparent flex items-center justify-between sticky top-0 z-30 select-none ${className}`}
    >
      {/* LEFT: PAGE TITLE (Shown only on relevant sub-pages) */}
      <div className="flex items-center gap-4">
        {activePage !== 'home' &&
        activePage !== 'trains' &&
        activePage !== 'results' &&
        activePage !== 'booking' &&
        activePage !== 'workspace' &&
        activePage !== 'payment' &&
        activePage !== 'completion' &&
        activePage !== 'ticket' ? (
          <div>
            <h2 className="font-display font-black text-2xl text-purple-950 tracking-tight leading-tight">
              {pageTitle}
            </h2>
            {pageSubtitle && (
              <p className="text-xs font-semibold text-slate-500 hidden sm:block">
                {pageSubtitle}
              </p>
            )}
          </div>
        ) : (
          <div />
        )}
      </div>

      {/* RIGHT: TOP ACTION BUTTONS */}
      <div className="flex items-center gap-2.5 relative">
        {/* 🆘 CITIZEN "I'M STUCK" BUTTON */}
        <button
          type="button"
          onClick={() => setShowImStuck(true)}
          className="px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all hover:scale-105 cursor-pointer"
          title="Get immediate step-by-step help"
        >
          <span className="text-sm">🆘</span>
          <span className="hidden sm:inline">I'm Stuck</span>
        </button>

        {/* 🧭 VISUAL PAGE GUIDE / ARCHITECTURE DIAGRAM */}
        <button
          type="button"
          onClick={() => setShowVisualDiagram(true)}
          className="px-3 py-1.5 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all hover:scale-105 cursor-pointer"
          title="Open interactive visual diagram of this specific screen"
        >
          <span className="text-sm">🧭</span>
          <span className="hidden md:inline">Page Guide</span>
        </button>

        {/* 1. GIFT ICON BUTTON & REWARDS POPOVER */}
        <div className="relative" ref={rewardRef}>
          <button
            type="button"
            onClick={() => {
              setShowRewards(!showRewards);
              setShowNotifications(false);
              setShowDropdown(false);
            }}
            className="w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-sm flex items-center justify-center text-purple-800 hover:text-purple-950 transition-all hover:scale-105 cursor-pointer"
            aria-label="Rewards"
          >
            <Gift className="w-4 h-4" />
          </button>

          {showRewards && (
            <div className="absolute right-0 top-12 w-72 bg-white rounded-3xl shadow-[0_12px_40px_rgba(88,28,135,0.14)] border border-purple-100 p-4 space-y-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-purple-50 pb-2">
                <span className="font-bold text-xs text-purple-950 flex items-center gap-1.5">
                  <Gift className="w-3.5 h-3.5 text-purple-700" />
                  <span>Citizen Rewards</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Active
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-1">
                <span className="text-xs font-bold text-slate-900 block">Fair Access Pass #IN-84920</span>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  5% instant discount and zero queue penalty applied to all verified citizen bookings.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowRewards(false);
                  navigateTo('discover');
                }}
                className="w-full py-2 px-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Explore Destinations →
              </button>
            </div>
          )}
        </div>

        {/* 2. NOTIFICATIONS BELL & NOTIFICATIONS POPOVER */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowRewards(false);
              setShowDropdown(false);
              if (!showNotifications) markNotificationsRead();
            }}
            className="relative w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-sm flex items-center justify-center text-purple-800 hover:text-purple-950 transition-all hover:scale-105 cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {dynamicNotifCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF5C5C] text-white text-[10px] font-extrabold flex items-center justify-center border border-white shadow-sm">
                {dynamicNotifCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-white rounded-3xl shadow-[0_12px_40px_rgba(88,28,135,0.14)] border border-purple-100 p-4 space-y-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-purple-50 pb-2">
                <span className="font-bold text-xs text-purple-950 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-purple-700" />
                  <span>Notifications</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-400">
                  {dynamicNotifCount === 0 ? 'No unread' : `${dynamicNotifCount} new`}
                </span>
              </div>

              {notifications.length > 0 ? (
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {notifications.slice(0, 8).map((n) => (
                    <div key={n.id} className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-purple-950">
                        <span>{n.title}</span>
                        <span className="text-[10px] text-slate-400 font-semibold">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-600">{n.body}</p>
                    </div>
                  ))}
                </div>
              ) : issuedTicket ? (
                <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-purple-950">
                    <span>Ticket Confirmed 🎉</span>
                    <span className="text-[10px] text-emerald-600">Just now</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    PNR <strong className="font-mono">{issuedTicket.pnrNumber}</strong> for {issuedTicket.train?.trainName || 'Rajdhani Express'} is active.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNotifications(false);
                      navigateTo('my-journeys');
                    }}
                    className="text-[11px] font-bold text-purple-700 hover:underline pt-1 block cursor-pointer"
                  >
                    View Ticket Details →
                  </button>
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-slate-400 font-medium">
                  No new notifications right now. Platform alerts and ticket updates will appear here.
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. USER PROFILE AVATAR WITH DROPDOWN TRIGGER */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => {
              setShowDropdown(!showDropdown);
              setShowNotifications(false);
              setShowRewards(false);
            }}
            className="flex items-center gap-1.5 p-0.5 rounded-full bg-white/90 hover:bg-white shadow-sm transition-all hover:scale-105 group cursor-pointer"
            aria-expanded={showDropdown}
          >
            <div className="w-9 h-9 rounded-full overflow-hidden border border-purple-200 shrink-0 bg-purple-50">
              <img
                src={authState.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=pratay'}
                alt={authState.displayName || 'Citizen'}
                className="w-full h-full object-cover"
              />
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-500 group-hover:text-purple-900 transition-transform mr-1 ${
                showDropdown ? 'rotate-180 text-purple-900' : ''
              }`}
            />
          </button>

        {/* ═══════════════════════════════════════════════════════════════════
            4. DROPDOWN MENU (MATCHING REFERENCE IMAGE 1)
            ═══════════════════════════════════════════════════════════════════ */}
        {showDropdown && (
          <div className="absolute right-0 top-12 w-64 bg-white rounded-3xl shadow-[0_12px_40px_rgba(88,28,135,0.14)] border border-purple-100 p-3 space-y-2 z-50 animate-in fade-in zoom-in-95 duration-150">
            {/* Header User Card */}
            <div className="p-2.5 rounded-2xl bg-purple-50/50 border border-purple-50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-purple-200 shrink-0 bg-purple-100">
                <img
                  src={authState.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=pratay'}
                  alt={authState.displayName || 'Citizen'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-0.5 min-w-0">
                <h4 className="text-xs font-black text-slate-900 truncate">{authState.displayName || 'Citizen User'}</h4>
                <p className="text-[10px] text-slate-500 truncate">{authState.email || 'pratay.karali2005@gmail.com'}</p>
                <span className="inline-flex items-center gap-1 bg-[#7C3AED] text-white text-[9px] font-black px-2 py-0.2 rounded-full">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  <span>DigiLocker Verified</span>
                </span>
              </div>
            </div>

            {/* Menu Items */}
            <div className="space-y-0.5 text-xs font-bold text-slate-700">
              <button
                type="button"
                onClick={() => handleMenuClick('profile')}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-purple-50 hover:text-purple-900 transition-colors text-left cursor-pointer"
              >
                <User className="w-4 h-4 text-purple-700" />
                <span>My Profile</span>
              </button>

              <button
                type="button"
                onClick={() => handleMenuClick('passengers')}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-purple-50 hover:text-purple-900 transition-colors text-left cursor-pointer"
              >
                <Users className="w-4 h-4 text-purple-700" />
                <span>Saved Passengers</span>
              </button>

              <button
                type="button"
                onClick={() => handleMenuClick('settings')}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-purple-50 hover:text-purple-900 transition-colors text-left cursor-pointer"
              >
                <SettingsIcon className="w-4 h-4 text-purple-700" />
                <span>My Preferences</span>
              </button>

              <button
                type="button"
                onClick={() => handleMenuClick('accounts')}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-purple-50 hover:text-purple-900 transition-colors text-left cursor-pointer"
              >
                <Link className="w-4 h-4 text-purple-700" />
                <span>Linked Accounts</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowDropdown(false);
                  setShowOAuthModal(true);
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-950 font-black transition-colors text-left cursor-pointer border border-purple-200 shadow-2xs"
              >
                <span className="text-sm">🔑</span>
                <span>Login with Google / OAuth</span>
              </button>

              <hr className="border-purple-50 my-1" />

              <button
                type="button"
                onClick={() => handleMenuClick('logout')}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* OAuth Login Modal */}
      <OAuthLoginModal
        isOpen={showOAuthModal}
        onClose={() => setShowOAuthModal(false)}
      />
    </header>
  );
};

export default TopBar;
