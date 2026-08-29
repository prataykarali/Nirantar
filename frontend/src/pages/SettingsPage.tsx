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
  ChevronRight,
  Shield,
  Zap,
} from 'lucide-react';
import { useJourney } from '../context/JourneyContext';

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
            1. HERO BANNER WITH SCENIC BACKGROUND & MASCOTS
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="relative overflow-hidden flex flex-col sm:flex-row items-center sm:justify-between rounded-[2rem] p-6 sm:p-8 shadow-2xl border border-purple-300/30 bg-gradient-to-br from-[#1A0B2E] via-[#2D1254] to-[#160B30] text-white">
          {/* Scenic Background Image Layer */}
          <div className="absolute inset-0 pointer-events-none opacity-25 overflow-hidden mix-blend-luminosity">
            <img
              src="/assets/images/settings_bg.png"
              alt="Settings Background"
              className="w-full h-full object-cover object-center"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A0B2E]/90 via-[#2D1254]/75 to-transparent pointer-events-none" />

          {/* Animated Decorative Gears */}
          <div className="absolute top-0 right-28 opacity-15 animate-[spin_20s_linear_infinite] pointer-events-none">
            <SettingsIcon className="w-32 h-32 text-purple-300" />
          </div>
          <div className="absolute -bottom-10 right-56 opacity-10 animate-[spin_25s_linear_infinite_reverse] pointer-events-none">
            <SettingsIcon className="w-48 h-48 text-violet-300" />
          </div>

          <div className="relative z-10 flex items-center gap-5 w-full sm:w-auto">
            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 text-white flex items-center justify-center font-bold shadow-xl backdrop-blur-md shrink-0">
              <SettingsIcon className="w-8 h-8" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-bold mb-1 backdrop-blur-md">
                <Sparkles className="w-3 h-3 text-purple-300" />
                <span>Preferences & Privacy Vault</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Settings & Customization
              </h1>
              <p className="text-xs sm:text-sm font-medium text-purple-200/90 mt-0.5">
                Customize your preferences, accessibility, and app options
              </p>
            </div>
          </div>

          {/* Mascot Avatars */}
          <div className="relative z-10 hidden sm:flex items-center gap-4 mt-4 sm:mt-0 shrink-0">
            {saveSuccess ? (
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 p-2 pr-5 rounded-full shadow-lg animate-in fade-in slide-in-from-right-4">
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
              <div className="flex items-center gap-3">
                <div className="w-28 h-28 overflow-hidden rounded-2xl shadow-xl transform rotate-2 hover:rotate-0 transition-transform">
                  <img
                    src="/assets/images/characters/nira_settings.jpg"
                    alt="Nira Settings"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="w-20 h-20 overflow-hidden rounded-2xl shadow-md transform -rotate-3 hover:rotate-0 transition-transform">
                  <img
                    src="/assets/images/characters/ananya_nira_duo.png"
                    alt="Ananya & Nira"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            2. TWO-COLUMN LAYOUT: CATEGORIES + GENERAL OPTIONS
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* ── LEFT COLUMN: CATEGORIES (4 Cols) ── */}
          <div className="md:col-span-4 bg-white/80 backdrop-blur-xl rounded-[2rem] p-4 shadow-xl border border-purple-100/60 space-y-3">
            
            {/* User Avatar Header Card with Real Citizen Photo */}
            <div 
              onClick={() => navigateTo('profile')}
              className="p-3.5 rounded-3xl bg-gradient-to-r from-purple-100/90 via-indigo-50/90 to-pink-50/90 border border-purple-200/60 flex items-center gap-3.5 shadow-sm hover:shadow-md cursor-pointer transition-all group"
            >
              <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-md shrink-0 transition-transform group-hover:scale-105">
                <img
                  src="/assets/images/characters/citizen_confident.png"
                  alt="Citizen Profile"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <div className="font-black text-slate-900 text-sm truncate group-hover:text-purple-900 transition-colors">
                  Pratay Karali
                </div>
                <div className="text-xs text-purple-700 font-bold flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>DigiLocker Verified</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 ml-auto text-purple-400 group-hover:text-purple-700 transition-colors" />
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
                    className={`group w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
                      isActive
                        ? 'bg-purple-700 text-white shadow-md shadow-purple-700/20'
                        : 'text-slate-700 hover:bg-purple-50/80 hover:text-purple-950'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-purple-100 text-purple-700 group-hover:bg-purple-200'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="truncate">{cat.label}</span>
                    {isActive && <ChevronRight className="w-4 h-4 ml-auto text-purple-200" />}
                  </button>
                );
              })}
            </div>

            {/* Mascot Guide Info Box */}
            <div className="pt-3 pb-1 px-1">
              <div className="relative overflow-hidden p-4 rounded-3xl bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border border-purple-100 shadow-sm flex items-center gap-3.5 group hover:shadow-md transition-shadow">
                <div className="w-16 h-16 shrink-0 overflow-hidden rounded-2xl shadow-md transition-transform group-hover:scale-105">
                  <img
                    src="/assets/images/characters/nira_guide_teacher.jpg"
                    alt="Guide"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="relative z-10 leading-tight min-w-0">
                  <strong className="text-purple-900 block font-black text-xs mb-0.5">Local Storage First</strong>
                  <span className="text-slate-600 text-[11px] font-medium">Preferences stay securely on your browser.</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN: CATEGORY-SPECIFIC SETTINGS CONTROLS (8 Cols) ── */}
          <div className="relative overflow-hidden md:col-span-8 bg-white/90 backdrop-blur-xl rounded-[2rem] p-6 sm:p-8 shadow-xl border border-purple-100/60 min-h-[600px] flex flex-col">
            
            {/* Subtle Dot Grid Pattern */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #6b21a8 1px, transparent 0)', backgroundSize: '24px 24px' }} />

            <div className="relative z-10 flex items-center justify-between pb-5 border-b border-purple-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-7 bg-gradient-to-b from-purple-600 to-indigo-600 rounded-full" />
                <h2 className="text-lg font-black text-slate-900 tracking-tight capitalize">
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
              <span className="flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                Live Verified Storage
              </span>
            </div>

            <form onSubmit={handleSave} className="relative z-10 flex-1 flex flex-col">
              <div className="flex-1 space-y-4 text-xs sm:text-sm font-semibold text-slate-700">
                {/* ── TAB 1: GENERAL ── */}
                {activeTab === 'general' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    {/* Visual Banner Header with Mascot */}
                    <div className="relative rounded-2xl p-4 overflow-hidden border border-purple-200/60 bg-gradient-to-r from-purple-100/70 via-indigo-50/70 to-pink-50/70 flex items-center justify-between shadow-2xs">
                      <div className="space-y-0.5">
                        <h4 className="font-black text-sm text-slate-900">Application Preferences</h4>
                        <p className="text-xs text-slate-600 font-medium">Fine-tune appearance, scaling, and train recommendations.</p>
                      </div>
                      <div className="w-14 h-14 rounded-xl overflow-hidden shadow-sm shrink-0">
                        <img src="/assets/images/characters/nira_settings.jpg" alt="Settings Mascot" className="w-full h-full object-contain" />
                      </div>
                    </div>

                    {/* Setting Rows */}
                    <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-purple-100 shadow-2xs hover:shadow-sm hover:border-purple-200 transition-all">
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-slate-900 block mb-0.5">Interface Theme</span>
                        <span className="text-xs text-slate-500 font-medium">Appearance mode of the application</span>
                      </div>
                      <select
                        value={settings.theme}
                        onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                        className="px-3.5 py-1.5 rounded-xl border border-purple-200 bg-purple-50/50 text-xs font-bold text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-600 cursor-pointer shadow-2xs"
                      >
                        <option value="Light">Light Mode</option>
                        <option value="Dark">Dark Mode</option>
                        <option value="System">System Default</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-purple-100 shadow-2xs hover:shadow-sm hover:border-purple-200 transition-all">
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-slate-900 block mb-0.5">Typography Scale</span>
                        <span className="text-xs text-slate-500 font-medium">Text scaling and readability size</span>
                      </div>
                      <select
                        value={settings.fontSize}
                        onChange={(e) => setSettings({ ...settings, fontSize: e.target.value })}
                        className="px-3.5 py-1.5 rounded-xl border border-purple-200 bg-purple-50/50 text-xs font-bold text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-600 cursor-pointer shadow-2xs"
                      >
                        <option value="Small">Small</option>
                        <option value="Medium">Medium</option>
                        <option value="Large">Large</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-purple-100 shadow-2xs hover:shadow-sm hover:border-purple-200 transition-all">
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-slate-900 block mb-0.5">Default Journey Class</span>
                        <span className="text-xs text-slate-500 font-medium">Preselected coach tier on search</span>
                      </div>
                      <select
                        value={settings.defaultJourneyClass}
                        onChange={(e) => setSettings({ ...settings, defaultJourneyClass: e.target.value })}
                        className="px-3.5 py-1.5 rounded-xl border border-purple-200 bg-purple-50/50 text-xs font-bold text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-600 cursor-pointer shadow-2xs"
                      >
                        <option value="AC 3 Tier">AC 3 Tier (3A)</option>
                        <option value="AC 2 Tier">AC 2 Tier (2A)</option>
                        <option value="AC 1st Class">AC 1st Class (1A)</option>
                        <option value="Sleeper">Sleeper (SL)</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-purple-100 shadow-2xs hover:shadow-sm hover:border-purple-200 transition-all">
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-slate-900 block mb-0.5">Auto Save Journeys</span>
                        <span className="text-xs text-slate-500 font-medium">Retain incomplete bookings in TaskStack</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, autoSaveJourneys: !settings.autoSaveJourneys })}
                        className={`w-12 h-6 rounded-full transition-all relative p-0.5 cursor-pointer shadow-inner ${
                          settings.autoSaveJourneys ? 'bg-gradient-to-r from-purple-600 to-indigo-600' : 'bg-slate-200'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                            settings.autoSaveJourneys ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-purple-100 shadow-2xs hover:shadow-sm hover:border-purple-200 transition-all">
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-slate-900 block mb-0.5">Recommended Trains</span>
                        <span className="text-xs text-slate-500 font-medium">Highlight fastest and safest train options</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, showRecommendedTrains: !settings.showRecommendedTrains })}
                        className={`w-12 h-6 rounded-full transition-all relative p-0.5 cursor-pointer shadow-inner ${
                          settings.showRecommendedTrains ? 'bg-gradient-to-r from-purple-600 to-indigo-600' : 'bg-slate-200'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                            settings.showRecommendedTrains ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                )}

                {/* ── TAB 2: NOTIFICATIONS ── */}
                {activeTab === 'notifications' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="relative rounded-2xl p-4 overflow-hidden border border-purple-200/60 bg-gradient-to-r from-indigo-100/70 via-purple-50/70 to-pink-50/70 flex items-center justify-between shadow-2xs">
                      <div className="space-y-0.5">
                        <h4 className="font-black text-sm text-slate-900">Real-Time Alerts & Chimes</h4>
                        <p className="text-xs text-slate-600 font-medium">Stay updated on train running status, RAC clearance, and arrival chimes.</p>
                      </div>
                      <div className="w-14 h-14 rounded-xl overflow-hidden shadow-sm shrink-0">
                        <img src="/assets/images/bell.png" alt="Notifications Bell" className="w-full h-full object-contain" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-purple-100 shadow-2xs hover:border-purple-200 transition-all">
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-slate-900 block mb-0.5">Journey Reminders</span>
                        <span className="text-xs text-slate-500 font-medium">Get notified 2 hours before train departure</span>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">Enabled</span>
                    </div>
                    
                    <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-purple-100 shadow-2xs hover:border-purple-200 transition-all">
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-slate-900 block mb-0.5">Waitlist Movement Alerts</span>
                        <span className="text-xs text-slate-500 font-medium">Instant alerts when your RAC/WL clears</span>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">Enabled</span>
                    </div>
                    
                    <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-purple-100 shadow-2xs hover:border-purple-200 transition-all">
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-slate-900 block mb-0.5">Station Arrival Chime</span>
                        <span className="text-xs text-slate-500 font-medium">Play authentic Indian Railways 4-tone chime</span>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold">Audio Active</span>
                    </div>
                  </div>
                )}

                {/* ── TAB 3: PRIVACY & SECURITY ── */}
                {activeTab === 'privacy' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="p-5 rounded-3xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 flex items-start gap-4 shadow-sm">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-sm shrink-0">
                        <img src="/assets/images/safety_shield.png" alt="Safety Shield" className="w-full h-full object-contain" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-purple-700" />
                          <span className="font-black text-sm text-purple-950">Zero-PII Isolation Ring</span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed">
                          Passwords, OTPs, CVVs, and Aadhaar numbers are never sent to external AI servers. All sensitive credentials remain protected locally.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-purple-100 shadow-2xs hover:border-purple-200 transition-all">
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-slate-900 block mb-0.5">Personal Security PIN</span>
                        <span className="text-xs text-slate-500 font-medium">Required for cancelling tickets and sensitive wallet actions</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigateTo('profile')}
                        className="px-4 py-2 rounded-xl bg-purple-100 text-purple-900 text-xs font-bold hover:bg-purple-200 transition-all cursor-pointer flex items-center gap-1"
                      >
                        Manage in Profile <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* ── TAB 4: PAYMENT METHODS ── */}
                {activeTab === 'payments' && (
                  <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
                    {/* Metallic Card with Scenic Backdrop */}
                    <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white relative overflow-hidden shadow-xl border border-purple-500/30">
                      <div className="absolute top-0 right-0 w-32 h-32 opacity-20 pointer-events-none">
                        <img src="/assets/images/payments.png" alt="Wallet Background" className="w-full h-full object-contain" />
                      </div>
                      <div className="relative z-10 flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <Cpu className="w-6 h-6 text-yellow-400 drop-shadow-md" />
                          <span className="text-xs uppercase font-black tracking-widest text-purple-200">Citizen Virtual Wallet</span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold">1-Click Active</span>
                      </div>
                      <div className="relative z-10 mt-6 space-y-1">
                        <div className="text-3xl sm:text-4xl font-mono font-black text-emerald-400 tracking-tight">₹10,000.00</div>
                        <p className="text-xs text-purple-200/80 font-medium">Zero-PIN instant booking with 100% gateway resilience.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-purple-100 shadow-2xs hover:border-purple-200 transition-all">
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-slate-900 block mb-0.5">Payment Receipts & Ledger</span>
                        <span className="text-xs text-slate-500 font-medium">Download GST invoices, bank UTRs, and refund audits</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigateTo('payments')}
                        className="px-4 py-2 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-bold hover:bg-purple-100 transition-all cursor-pointer flex items-center gap-1"
                      >
                        Open Ledger <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* ── TAB 5: LANGUAGE ── */}
                {activeTab === 'language' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-purple-50 border border-purple-100">
                      <div className="w-14 h-14 rounded-xl overflow-hidden shadow-sm shrink-0">
                        <img src="/assets/images/characters/nira_guide_teacher.jpg" alt="Language Guide" className="w-full h-full object-contain" />
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-slate-900 block mb-0.5">Multilingual Indian Support</span>
                        <span className="text-xs text-slate-600 font-medium">Nira responds naturally in your preferred regional dialect.</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      {['English', 'हिन्दी (Hindi)', 'বাংলা (Bengali)', 'தமிழ் (Tamil)'].map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => setSettings({ ...settings, appLanguage: lang.split(' ')[0] })}
                          className={`p-4 rounded-2xl border text-xs sm:text-sm font-bold text-left transition-all cursor-pointer shadow-2xs ${
                            settings.appLanguage === lang.split(' ')[0]
                              ? 'bg-purple-700 text-white border-purple-700 shadow-md shadow-purple-700/20'
                              : 'bg-white text-slate-700 border-purple-100 hover:bg-purple-50'
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
                    <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-purple-100 shadow-2xs hover:border-purple-200 transition-all">
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-slate-900 block mb-0.5">Citizen Easy Mode</span>
                        <span className="text-xs text-slate-500 font-medium">Enlarged touch targets and simplified railway terminology</span>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">Standard</span>
                    </div>
                    
                    <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-purple-100 shadow-2xs hover:border-purple-200 transition-all">
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-slate-900 block mb-0.5">Visual Spotlight Guidance</span>
                        <span className="text-xs text-slate-500 font-medium">Interactive green arrows and screen dimming</span>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">Always On</span>
                    </div>
                  </div>
                )}

                {/* ── TAB 7: ABOUT ── */}
                {activeTab === 'about' && (
                  <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
                    <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-950 via-[#2A114E] to-slate-950 text-white shadow-xl relative overflow-hidden border border-purple-500/20">
                      <div className="absolute top-0 right-0 w-44 h-44 opacity-20 pointer-events-none">
                        <img src="/assets/images/characters/ananya_nira_duo.png" alt="Mascot Duo" className="w-full h-full object-contain" />
                      </div>
                      <div className="relative z-10 space-y-2">
                        <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-[10px] font-mono font-bold tracking-widest text-purple-200">
                          SYSTEM OS • v2.0
                        </span>
                        <h3 className="font-black text-xl">🇮🇳 NIRANTAR (निरंतर)</h3>
                        <p className="text-xs sm:text-sm text-purple-200 font-medium max-w-md">The Railway Journey That Explains Itself</p>
                        <p className="text-xs text-slate-300 leading-relaxed mt-2 max-w-md">
                          State-aware citizen assistance and resilience layer designed for Indian Public Service Journeys.
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-4 bg-purple-50/80 rounded-2xl border border-purple-100 space-y-1">
                        <strong className="text-xs font-black text-purple-900 block">4 Pillars Architecture</strong>
                        <span className="text-[11px] text-slate-600 font-medium">Discover → Understand → Act → Recover</span>
                      </div>
                      <div className="p-4 bg-purple-50/80 rounded-2xl border border-purple-100 space-y-1">
                        <strong className="text-xs font-black text-purple-900 block">Zero-PII Trust Layer</strong>
                        <span className="text-[11px] text-slate-600 font-medium">Sanitizer Ring & Fair Access Telemetry</span>
                      </div>
                      <div className="p-4 bg-purple-50/80 rounded-2xl border border-purple-100 space-y-1">
                        <strong className="text-xs font-black text-purple-900 block">Commercial Rules</strong>
                        <span className="text-[11px] text-slate-600 font-medium">Deterministic Commercial Rules & NTES</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Save Changes Button */}
              <div className="pt-6 mt-4 border-t border-purple-100">
                <button
                  type="submit"
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {/* Decorative Footer Section */}
        <div className="mt-8 flex items-center justify-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
          <div className="w-10 h-10 overflow-hidden rounded-full shadow-sm">
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
