import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Lock,
  CreditCard,
  Globe,
  Accessibility,
  Info,
  Save,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Cpu,
  ChevronRight
} from 'lucide-react';
import { useJourney } from '../context/JourneyContext';
import { JargonHint } from '../components/JargonHint';

export const SettingsPage: React.FC = () => {
  const { navigateTo } = useJourney();
  const [activeTab, setActiveTab] = useState('general');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Settings State
  const [settings, setSettings] = useState({
    theme: 'Light',
    fontSize: 'Medium',
    appLanguage: 'English',
    defaultJourneyClass: 'AC 3 Tier',
    autoSaveJourneys: true,
    showRecommendedTrains: true,
    dataSaverMode: false,
  });

  const categories = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Security', icon: Lock },
    { id: 'payments', label: 'Payment Methods', icon: CreditCard },
    { id: 'language', label: 'Language', icon: Globe },
    { id: 'accessibility', label: 'Accessibility', icon: Accessibility },
    { id: 'about', label: 'About Nirantar', icon: Info },
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-pink-50/50 -mx-4 -mt-4 p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6 pb-12 select-none font-sans text-slate-800 animate-in fade-in duration-300">
        
        {/* ═══════════════════════════════════════════════════════════════════
            1. HERO BANNER WITH ANIMATED GRADIENT & MASCOT
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="relative overflow-hidden flex flex-col sm:flex-row items-center sm:justify-between rounded-[2rem] p-6 sm:p-8 shadow-2xl border border-purple-300/30 bg-[length:200%_200%] animate-[gradient_8s_ease_infinite] bg-gradient-to-br from-indigo-900 via-purple-800 to-violet-900 text-white">
          {/* Animated Gears using CSS */}
          <div className="absolute top-0 right-10 opacity-20 animate-[spin_20s_linear_infinite]">
              <SettingsIcon className="w-32 h-32 text-purple-300" />
          </div>
          <div className="absolute -bottom-10 right-32 opacity-10 animate-[spin_25s_linear_infinite_reverse]">
              <SettingsIcon className="w-48 h-48 text-violet-300" />
          </div>
          
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent pointer-events-none" />

          <div className="relative z-10 flex items-center gap-5 w-full sm:w-auto">
            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 text-white flex items-center justify-center font-bold shadow-xl backdrop-blur-md">
              <SettingsIcon className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-purple-200 tracking-tight">
                Settings & Customization
              </h1>
              <p className="text-sm font-medium text-purple-200/90 mt-1">
                Customize your preferences, accessibility, and app options
              </p>
            </div>
          </div>

          {/* Mascot Avatar & Save Success State */}
          <div className="relative z-10 hidden sm:flex items-center gap-3 mt-4 sm:mt-0">
            {saveSuccess ? (
              <div className="flex items-center gap-3 border border-white/20 pr-5 rounded-full shadow-lg animate-in fade-in slide-in-from-right-4">
                <div className="w-16 h-16 overflow-hidden rounded-full shadow-lg">
                  <img
                    src="/assets/images/characters/nira_excited.jpg"
                    alt="Saved"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-emerald-300 font-bold flex items-center gap-1.5 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Saved!
                </span>
              </div>
            ) : (
              <div className="w-32 h-32 overflow-hidden rounded-full shadow-2xl transform transition-transform hover:scale-105">
                <img
                  src="/assets/images/characters/nira_settings.jpg"
                  alt="Nira Mascot"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            2. TWO-COLUMN LAYOUT: CATEGORIES + GENERAL OPTIONS
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* ── LEFT COLUMN: CATEGORIES (4 Cols) ── */}
          <div className="md:col-span-4 bg-white/70 backdrop-blur-xl rounded-[2rem] p-4 shadow-xl border border-purple-100/50 space-y-2">
            
            {/* User Avatar Header Card */}
            <div className="mb-6 p-4 rounded-3xl bg-gradient-to-r from-purple-100/80 to-indigo-50/80 border border-purple-200/50 flex items-center gap-4 shadow-inner">
               <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 p-0.5 shadow-md">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                     <User className="w-6 h-6 text-purple-600" />
                  </div>
               </div>
               <div>
                  <div className="font-bold text-slate-800 text-sm">Citizen Profile</div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">Manage your identity</div>
               </div>
            </div>

            <div className="space-y-1.5 px-1">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeTab === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      if (cat.id === 'profile') {
                        navigateTo('profile');
                      } else {
                        setActiveTab(cat.id);
                      }
                    }}
                    className={`group w-full flex items-center gap-4 px-3 py-2.5 rounded-2xl text-sm font-bold transition-all text-left cursor-pointer ${
                      isActive
                        ? 'bg-purple-100/80 text-purple-900 shadow-sm border border-purple-200/50'
                        : 'text-slate-600 hover:bg-purple-50 hover:text-purple-900 border border-transparent'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      isActive 
                        ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30' 
                        : 'bg-white text-slate-400 group-hover:bg-purple-100 group-hover:text-purple-600 shadow-sm border border-slate-100'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span>{cat.label}</span>
                    {isActive && <ChevronRight className="w-4 h-4 ml-auto text-purple-400" />}
                  </button>
                );
              })}
            </div>

            {/* Mascot Guide Info Box */}
            <div className="pt-6 pb-2 px-1">
              <div className="relative overflow-hidden p-4 rounded-3xl bg-gradient-to-br from-indigo-50/90 via-purple-50/90 to-pink-50/90 border border-purple-100 shadow-sm flex items-center gap-4 group hover:shadow-md transition-shadow">
                <div className="w-24 h-24 shrink-0 overflow-hidden rounded-2xl shadow-md transition-transform group-hover:scale-105">
                  <img
                    src="/assets/images/characters/nira_guide_teacher.jpg"
                    alt="Guide"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="relative z-10 leading-tight">
                  <strong className="text-purple-900 block font-bold text-sm mb-1">Local Storage</strong>
                  <span className="text-slate-600 text-xs font-medium">Preferences stay securely on your browser.</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN: CATEGORY-SPECIFIC SETTINGS CONTROLS (8 Cols) ── */}
          <div className="relative overflow-hidden md:col-span-8 bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 sm:p-8 shadow-xl border border-purple-100/50 min-h-[600px] flex flex-col">
            
            {/* Subtle Dot Grid Pattern */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.15]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #6b21a8 1px, transparent 0)', backgroundSize: '24px 24px' }} />

            <div className="relative z-10 flex items-center justify-between pb-6 border-b border-purple-100/60 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full" />
                <h2 className="text-xl font-black text-slate-800 tracking-tight capitalize">
                  {activeTab === 'general'
                    ? 'General Settings'
                    : activeTab === 'notifications'
                    ? 'Notification Preferences'
                    : activeTab === 'privacy'
                    ? 'Privacy & Security Controls'
                    : activeTab === 'payments'
                    ? 'Payment Methods & Citizen Wallet'
                    : activeTab === 'language'
                    ? 'Language & Regional Localization'
                    : activeTab === 'accessibility'
                    ? 'Accessibility & Easy Mode'
                    : 'About Nirantar System'}
                </h2>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-full shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                Live Verified Storage
              </span>
            </div>

            <form onSubmit={handleSave} className="relative z-10 flex-1 flex flex-col">
              <div className="flex-1 space-y-4 text-sm font-semibold text-slate-700">
                {/* ── TAB 1: GENERAL ── */}
                {activeTab === 'general' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    
                    {/* Setting Row */}
                    <div className="flex items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all group">
                      <div>
                        <span className="text-sm font-bold text-slate-900 block mb-0.5 group-hover:text-purple-700 transition-colors">Interface Theme</span>
                        <span className="text-xs text-slate-500 font-medium">Appearance mode of the application</span>
                      </div>
                      <select
                        value={settings.theme}
                        onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                        className="px-4 py-2 rounded-xl border border-purple-200 bg-purple-50/50 text-sm font-bold text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-600 cursor-pointer shadow-inner"
                      >
                        <option value="Light">Light Mode</option>
                        <option value="Dark">Dark Mode</option>
                        <option value="System">System Default</option>
                      </select>
                    </div>

                    {/* Setting Row */}
                    <div className="flex items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all group">
                      <div>
                        <span className="text-sm font-bold text-slate-900 block mb-0.5 group-hover:text-purple-700 transition-colors">Typography Scale</span>
                        <span className="text-xs text-slate-500 font-medium">Text scaling and readability size</span>
                      </div>
                      <select
                        value={settings.fontSize}
                        onChange={(e) => setSettings({ ...settings, fontSize: e.target.value })}
                        className="px-4 py-2 rounded-xl border border-purple-200 bg-purple-50/50 text-sm font-bold text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-600 cursor-pointer shadow-inner"
                      >
                        <option value="Small">Small</option>
                        <option value="Medium">Medium</option>
                        <option value="Large">Large</option>
                      </select>
                    </div>

                    {/* Setting Row */}
                    <div className="flex items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all group">
                      <div>
                        <span className="text-sm font-bold text-slate-900 block mb-0.5 group-hover:text-purple-700 transition-colors">Default Journey Class</span>
                        <span className="text-xs text-slate-500 font-medium">Preselected coach tier on search</span>
                      </div>
                      <select
                        value={settings.defaultJourneyClass}
                        onChange={(e) => setSettings({ ...settings, defaultJourneyClass: e.target.value })}
                        className="px-4 py-2 rounded-xl border border-purple-200 bg-purple-50/50 text-sm font-bold text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-600 cursor-pointer shadow-inner"
                      >
                        <option value="AC 3 Tier">AC 3 Tier (3A)</option>
                        <option value="AC 2 Tier">AC 2 Tier (2A)</option>
                        <option value="AC 1st Class">AC 1st Class (1A)</option>
                        <option value="Sleeper">Sleeper (SL)</option>
                      </select>
                    </div>

                    {/* Setting Row - Toggle */}
                    <div className="flex items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all group">
                      <div>
                        <span className="text-sm font-bold text-slate-900 block mb-0.5 group-hover:text-purple-700 transition-colors">Auto Save Journeys</span>
                        <span className="text-xs text-slate-500 font-medium">Retain incomplete bookings in TaskStack</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, autoSaveJourneys: !settings.autoSaveJourneys })}
                        className={`w-14 h-7 rounded-full transition-all relative p-1 cursor-pointer shadow-inner ${
                          settings.autoSaveJourneys ? 'bg-gradient-to-r from-purple-600 to-indigo-500' : 'bg-slate-200'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                            settings.autoSaveJourneys ? 'translate-x-7' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Setting Row - Toggle */}
                    <div className="flex items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all group">
                      <div>
                        <span className="text-sm font-bold text-slate-900 block mb-0.5 group-hover:text-purple-700 transition-colors">Recommended Trains</span>
                        <span className="text-xs text-slate-500 font-medium">Highlight fastest and safest train options</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, showRecommendedTrains: !settings.showRecommendedTrains })}
                        className={`w-14 h-7 rounded-full transition-all relative p-1 cursor-pointer shadow-inner ${
                          settings.showRecommendedTrains ? 'bg-gradient-to-r from-purple-600 to-indigo-500' : 'bg-slate-200'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                            settings.showRecommendedTrains ? 'translate-x-7' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                )}

                {/* ── TAB 2: NOTIFICATIONS ── */}
                {activeTab === 'notifications' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all group">
                      <div>
                        <span className="text-sm font-bold text-slate-900 block mb-0.5 group-hover:text-purple-700 transition-colors">Journey Reminders</span>
                        <span className="text-xs text-slate-500 font-medium">Get notified 2 hours before train departure</span>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-sm">Enabled</span>
                    </div>
                    
                    <div className="flex items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all group">
                      <div>
                        <span className="text-sm font-bold text-slate-900 block mb-0.5 group-hover:text-purple-700 transition-colors">Waitlist Movement Alerts</span>
                        <span className="text-xs text-slate-500 font-medium">Instant alerts when your RAC/WL clears</span>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-sm">Enabled</span>
                    </div>
                    
                    <div className="flex items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all group">
                      <div>
                        <span className="text-sm font-bold text-slate-900 block mb-0.5 group-hover:text-purple-700 transition-colors">Station Arrival Chime</span>
                        <span className="text-xs text-slate-500 font-medium">Play authentic Indian Railways 4-tone chime</span>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold shadow-sm">Audio Active</span>
                    </div>
                  </div>
                )}

                {/* ── TAB 3: PRIVACY & SECURITY ── */}
                {activeTab === 'privacy' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 shadow-inner space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-xl text-purple-700 shadow-sm">
                           <ShieldCheck className="w-6 h-6" />
                        </div>
                        <span className="font-black text-sm text-purple-900">Zero-PII Isolation Ring</span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed pl-11">
                        Passwords, OTPs, CVVs, and Aadhaar numbers are never sent to external AI servers. All sensitive inputs stay locally encrypted.
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all group">
                      <div>
                        <span className="text-sm font-bold text-slate-900 block mb-0.5 group-hover:text-purple-700 transition-colors">Personal Security PIN</span>
                        <span className="text-xs text-slate-500 font-medium">Required for cancelling tickets and sensitive edits</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigateTo('profile')}
                        className="px-4 py-2 rounded-xl bg-purple-100 text-purple-900 text-xs font-bold hover:bg-purple-200 hover:shadow-md transition-all cursor-pointer flex items-center gap-1"
                      >
                        Manage <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                {/* ── TAB 4: PAYMENT METHODS ── */}
                {activeTab === 'payments' && (
                  <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
                    
                    {/* Metallic Card */}
                    <div className="p-6 sm:p-8 rounded-[2rem] bg-gradient-to-br from-slate-800 via-slate-900 to-black text-white relative overflow-hidden shadow-2xl border border-slate-700/50">
                       <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none transform -skew-x-12" />
                       <div className="relative z-10 flex justify-between items-start">
                          <Cpu className="w-10 h-10 text-yellow-500/90 drop-shadow-md" />
                          <span className="text-xs uppercase font-black tracking-widest text-slate-400 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">Citizen Wallet</span>
                       </div>
                       <div className="relative z-10 mt-8 space-y-1">
                          <div className="text-4xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-200 tracking-tight drop-shadow-sm">₹10,000.00</div>
                          <p className="text-sm text-slate-400 font-medium">1-click zero-PIN booking for official services.</p>
                       </div>
                    </div>
                    
                    <div className="flex items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all group">
                      <div>
                        <span className="text-sm font-bold text-slate-900 block mb-0.5 group-hover:text-purple-700 transition-colors">Payment Receipts & Ledger</span>
                        <span className="text-xs text-slate-500 font-medium">Download GST invoices and transaction logs</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigateTo('payments')}
                        className="px-4 py-2 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-bold hover:bg-purple-100 hover:shadow-md transition-all cursor-pointer flex items-center gap-1"
                      >
                        Ledger <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                {/* ── TAB 5: LANGUAGE ── */}
                {activeTab === 'language' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="p-2">
                      <span className="text-sm font-bold text-slate-900 block mb-1">Interface Language</span>
                      <span className="text-xs text-slate-500 font-medium">Select your preferred Indian regional language</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {['English', 'हिन्दी (Hindi)', 'বাংলা (Bengali)', 'தமிழ் (Tamil)'].map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => setSettings({ ...settings, appLanguage: lang.split(' ')[0] })}
                          className={`p-4 rounded-2xl border text-sm font-bold text-left transition-all cursor-pointer shadow-sm ${
                            settings.appLanguage === lang.split(' ')[0]
                              ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white border-transparent shadow-purple-600/30 shadow-md ring-2 ring-purple-600 ring-offset-2'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-purple-50 hover:border-purple-300'
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── TAB 6: ACCESSIBILITY ── */}
                {activeTab === 'accessibility' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all group">
                      <div>
                        <span className="text-sm font-bold text-slate-900 block mb-0.5 group-hover:text-purple-700 transition-colors">Citizen Easy Mode</span>
                        <span className="text-xs text-slate-500 font-medium">Enlarged touch targets and simplified terminology</span>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200 shadow-sm">Standard</span>
                    </div>
                    
                    <div className="flex items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all group">
                      <div>
                        <span className="text-sm font-bold text-slate-900 block mb-0.5 group-hover:text-purple-700 transition-colors">Visual Spotlight Guidance</span>
                        <span className="text-xs text-slate-500 font-medium">Interactive green arrows and screen dimming</span>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-sm">Always On</span>
                    </div>
                  </div>
                )}

                {/* ── TAB 7: ABOUT ── */}
                {activeTab === 'about' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Info className="w-32 h-32" />
                      </div>
                      <div className="relative z-10 space-y-2">
                        <div className="inline-block px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold tracking-widest text-purple-200 mb-2">SYSTEM INFO</div>
                        <h3 className="font-black text-xl">🇮🇳 NIRANTAR (निरंतर) v2.0</h3>
                        <p className="text-sm text-purple-200 font-medium max-w-md">The Railway Journey That Explains Itself</p>
                        <p className="text-xs text-slate-400 leading-relaxed mt-4 max-w-md">
                          State-aware citizen assistance and resilience layer designed for Indian Public Service Journeys.
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                        <strong className="text-xs text-purple-900 block mb-1">Architecture</strong>
                        <span className="text-xs text-slate-600 font-medium">4 Pillars (Discover, Understand, Act, Recover)</span>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                        <strong className="text-xs text-purple-900 block mb-1">Trust Layer</strong>
                        <span className="text-xs text-slate-600 font-medium">Zero-PII Sanitizer & Fair Access Telemetry</span>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                        <strong className="text-xs text-purple-900 block mb-1">Core Rule Base</strong>
                        <span className="text-xs text-slate-600 font-medium">Deterministic Commercial Rules & NTES</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Save Changes Button */}
              <div className="pt-8 mt-4 border-t border-purple-100/60">
                <button
                  type="submit"
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-sm shadow-xl shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] group overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  <div className="relative z-10 flex items-center gap-2">
                    <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>Save Changes</span>
                  </div>
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {/* Decorative Footer Section */}
        <div className="mt-8 flex items-center justify-center gap-3 opacity-50 hover:opacity-100 transition-opacity">
            <div className="w-12 h-12 overflow-hidden rounded-full shadow-sm">
               <img src="/assets/images/characters/nira_settings.jpg" alt="Nira" className="w-full h-full object-contain" />
            </div>
            <div className="text-xs font-bold text-slate-500">
               Nirantar System OS • v2.0 • Privacy First
            </div>
        </div>

      </div>
    </div>
  );
};

export default SettingsPage;
