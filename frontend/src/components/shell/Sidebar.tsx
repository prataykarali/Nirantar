import {
  Home,
  Search,
  Train,
  MapPin,
  CreditCard,
  HelpCircle,
  Settings,
  Send,
} from 'lucide-react';

export type NavPageId =
  | 'home'
  | 'discover'
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
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onNavigate,
  onOpenNira,
  className = '',
}) => {
  const navItems: Array<{ id: string; label: string; icon: React.ElementType }> = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'discover', label: 'Discover', icon: Search },
    { id: 'my-journeys', label: 'My Journeys', icon: Train },
    { id: 'track', label: 'Track', icon: MapPin },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'help', label: 'Help Center', icon: HelpCircle },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`w-64 lg:w-72 bg-white/95 backdrop-blur-sm border-r border-purple-100 flex flex-col h-screen sticky top-0 z-40 select-none shadow-[2px_0_16px_rgba(88,28,135,0.02)] justify-between p-4 overflow-y-auto overflow-x-hidden ${className}`}
    >
      {/* 1. TOP BRAND LOGO & NAVIGATION */}
      <div className="space-y-3">
        {/* BRAND LOGO */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigate('home')}
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
          <h1 className="font-display font-black text-xl tracking-tight text-slate-900 leading-none">
            Nirantar
          </h1>
          <p className="text-[11px] font-bold text-[#8B5CF6] mt-0.5 tracking-wide">
            Your journey, simplified.
          </p>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="space-y-0.5 pt-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              activePage === item.id ||
              (item.id === 'discover' && (activePage === 'trains' || activePage === 'results')) ||
              (item.id === 'my-journeys' && (activePage === 'ticket' || activePage === 'completion')) ||
              (item.id === 'payments' && activePage === 'payment');

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl transition-all duration-200 group text-left cursor-pointer ${
                  isActive
                    ? 'bg-[#F2EBFF] text-[#6B21A8] font-black shadow-xs'
                    : 'text-slate-700 hover:bg-purple-50/60 hover:text-purple-900 font-bold'
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-[#6B21A8] fill-current' : 'text-slate-600 group-hover:text-purple-800'
                  }`}
                />
                <span className="text-sm tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* 2. BOTTOM NIRA ROBOT ASSISTANT CARD (Elevated & never cropped) */}
      <div className="relative pt-10 mt-2">
        {/* Dynamic Nira 3D Mascot Peeking Out */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-24 h-24 pointer-events-none flex items-center justify-center z-10">
          <img
            src={
              activePage === 'completion' || activePage === 'ticket'
                ? '/assets/images/characters/nira_happy.png'
                : activePage === 'my-journeys' || activePage === 'journeys'
                ? '/assets/images/characters/nira_tablet.png'
                : activePage === 'payment' || activePage === 'payments'
                ? '/assets/images/characters/nira_wave.png'
                : activePage === 'booking' || activePage === 'workspace'
                ? '/assets/images/characters/nira_tablet.png'
                : activePage === 'trains' || activePage === 'results'
                ? '/assets/images/characters/nira_thumbsup.png'
                : activePage === 'discover'
                ? '/assets/images/characters/nira_idea.png'
                : activePage === 'track'
                ? '/assets/images/characters/nira_thinking.png'
                : '/assets/images/characters/nira_wave.png'
            }
            alt="Nira AI Assistant"
            className="w-20 h-20 object-contain drop-shadow-md animate-bounce-gentle"
          />
        </div>

        {/* Card Container */}
        <div className="pt-10 pb-3 px-3 rounded-[24px] bg-white border-2 border-purple-100 shadow-[0_6px_20px_rgba(88,28,135,0.06)] flex flex-col items-center text-center space-y-2">
          <div className="space-y-0.5">
            <h3 className="font-display font-black text-base text-slate-900 tracking-tight">
              Hi, I'm Nira!
            </h3>
            <p className="text-[11px] text-slate-500 font-semibold px-1">
              Your AI travel assistant
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenNira}
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
