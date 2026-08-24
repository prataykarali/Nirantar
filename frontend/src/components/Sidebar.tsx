import React from 'react';
import { Home, Search, Briefcase, MapPin, CreditCard, HelpCircle, Send } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNira: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onOpenNira }) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'discover', label: 'Discover', icon: Search },
    { id: 'my-journeys', label: 'My Journeys', icon: Briefcase },
    { id: 'tracking', label: 'Track', icon: MapPin },
    { id: 'payment', label: 'Payments', icon: CreditCard },
    { id: 'help', label: 'Help', icon: HelpCircle },
  ];

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[220px] bg-white shadow-xl z-50 flex flex-col justify-between">
      {/* Top Section */}
      <div>
        {/* Logo Section */}
        <div className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-500 flex items-center justify-center shrink-0">
              <span className="text-white font-display font-black text-2xl">N</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-none">Nirantar</h1>
            </div>
          </div>
          <p className="text-xs text-gray-500 font-medium">Your journey, simplified.</p>
        </div>

        {/* Navigation */}
        <nav className="px-3 space-y-1 mt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-purple-50 text-purple-700 font-bold'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 font-medium'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-purple-700' : 'text-gray-400'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section - Nira (NO box, flows naturally) */}
      <div className="px-4 pb-6 flex flex-col items-center text-center">
        <img 
          src="/assets/images/nira-robot.jpg" 
          alt="Nira Mascot" 
          className="w-24 h-24 object-contain mb-2"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <h3 className="font-bold text-gray-900 text-sm">Hi, I'm Nira!</h3>
        <p className="text-xs text-gray-500 mb-3">Your AI travel assistant</p>
        
        <button 
          onClick={onOpenNira}
          className="w-full py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-purple-200"
        >
          Chat with Nira
          <Send size={14} className="rotate-[-30deg]" />
        </button>
      </div>
    </aside>
  );
};
