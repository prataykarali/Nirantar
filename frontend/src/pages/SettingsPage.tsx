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
    <div className="max-w-6xl mx-auto space-y-4 pb-6 select-none font-sans text-slate-800 animate-in fade-in duration-300">
      {/* ═══════════════════════════════════════════════════════════════════
          1. HEADER WITH TITLE & SCENIC SETTINGS BACKGROUND GRAPHIC
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden flex items-center justify-between rounded-3xl p-5 sm:p-6 shadow-md border border-purple-200/50 bg-gradient-to-r from-[#1A0B2E] via-[#260E45] to-[#160B30] text-white">
        {/* Ambient Settings Background Illustration */}
        <div className="absolute inset-0 pointer-events-none opacity-35 overflow-hidden">
          <img
            src="/assets/images/banners/scenic_railway_banner.png"
            alt="Settings Background"
            className="w-full h-full object-cover object-center"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#1A0B2E]/90 via-[#260E45]/80 to-transparent pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/40 text-purple-200 flex items-center justify-center font-bold shadow-md shadow-purple-950/40 backdrop-blur-xs">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight">
              Settings & Customization
            </h1>
            <p className="text-xs font-medium text-purple-200/90">
              Customize your citizen preferences, accessibility, and app options
            </p>
          </div>
        </div>

        {/* Mascot Avatar */}
        <div className="relative z-10 hidden sm:flex items-center gap-2">
          {saveSuccess ? (
            <span className="bg-emerald-500/20 border border-emerald-400/60 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 animate-in fade-in backdrop-blur-md">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Settings Saved!</span>
            </span>
          ) : (
            <div className="w-14 h-14 overflow-hidden rounded-2xl bg-white/10 p-1 border border-white/20 backdrop-blur-xs shadow-inner">
              <img
                src="/assets/images/characters/nira_robot_thumbsup.png"
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
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        {/* ── LEFT COLUMN: CATEGORIES (4 Cols) ── */}
        <div className="md:col-span-4 bg-white rounded-3xl p-4 shadow-sm border border-purple-100 space-y-2">
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
                className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-[#F2EBFF] text-[#6B21A8] shadow-xs'
                    : 'text-slate-600 hover:bg-purple-50/60 hover:text-purple-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#6B21A8]' : 'text-slate-500'}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}

          {/* Mascot Info Box */}
          <div className="pt-4 border-t border-purple-50">
            <div className="relative overflow-hidden p-3.5 rounded-2xl bg-gradient-to-br from-purple-50 via-white to-pink-50 border border-purple-100 flex items-center gap-3 shadow-2xs">
              <div className="w-14 h-14 shrink-0 overflow-hidden rounded-xl bg-purple-100/60 p-1 border border-purple-200">
                <img
                  src="/assets/images/characters/nira_robot_map.png"
                  alt="Nira Settings Mascot"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-[11px] relative z-10">
                <strong className="text-purple-950 block font-bold">Local-First Storage</strong>
                <span className="text-slate-500">Preferences stay securely on your browser.</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: CATEGORY-SPECIFIC SETTINGS CONTROLS (8 Cols) ── */}
        <div className="relative overflow-hidden md:col-span-8 bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-purple-100 space-y-5">
          {/* Subtle Panel Background Graphic */}
          <div className="absolute inset-0 pointer-events-none opacity-10 overflow-hidden">
            <img
              src="/assets/images/banners/scenic_railway_banner.png"
              alt="Settings Graphic"
              className="w-full h-full object-cover object-center"
            />
          </div>

          <div className="relative z-10 flex items-center justify-between pb-2 border-b border-purple-50">
            <h2 className="text-sm font-black text-slate-900 tracking-tight capitalize">
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
            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
              Live Verified Storage
            </span>
          </div>

          <form onSubmit={handleSave} className="relative z-10 space-y-4 text-xs font-semibold text-slate-700">
            {/* ── TAB 1: GENERAL ── */}
            {activeTab === 'general' && (
              <div className="space-y-3 animate-in fade-in">
                {/* 1. Theme */}
                <div className="flex items-center justify-between gap-4 py-1">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Theme</span>
                    <span className="text-[11px] text-slate-400 font-medium">Interface appearance mode</span>
                  </div>
                  <select
                    value={settings.theme}
                    onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                    className="px-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50/40 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600 cursor-pointer"
                  >
                    <option value="Light">Light</option>
                    <option value="Dark">Dark</option>
                    <option value="System">System</option>
                  </select>
                </div>

                <hr className="border-purple-50" />

                {/* 2. Font Size */}
                <div className="flex items-center justify-between gap-4 py-1">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Font Size</span>
                    <span className="text-[11px] text-slate-400 font-medium">Text scaling and readability</span>
                  </div>
                  <select
                    value={settings.fontSize}
                    onChange={(e) => setSettings({ ...settings, fontSize: e.target.value })}
                    className="px-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50/40 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600 cursor-pointer"
                  >
                    <option value="Small">Small</option>
                    <option value="Medium">Medium</option>
                    <option value="Large">Large</option>
                  </select>
                </div>

                <hr className="border-purple-50" />

                {/* 3. Default Journey Class */}
                <div className="flex items-center justify-between gap-4 py-1">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Default Journey Class</span>
                    <span className="text-[11px] text-slate-400 font-medium">Preselected coach tier on search</span>
                  </div>
                  <select
                    value={settings.defaultJourneyClass}
                    onChange={(e) => setSettings({ ...settings, defaultJourneyClass: e.target.value })}
                    className="px-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50/40 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600 cursor-pointer"
                  >
                    <option value="AC 3 Tier">AC 3 Tier (3A)</option>
                    <option value="AC 2 Tier">AC 2 Tier (2A)</option>
                    <option value="AC 1st Class">AC 1st Class (1A)</option>
                    <option value="Sleeper">Sleeper (SL)</option>
                  </select>
                </div>

                <hr className="border-purple-50" />

                {/* 4. Auto Save Journeys Toggle */}
                <div className="flex items-center justify-between gap-4 py-1">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Auto Save Journeys</span>
                    <span className="text-[11px] text-slate-400 font-medium">Retain incomplete bookings in TaskStack</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, autoSaveJourneys: !settings.autoSaveJourneys })}
                    className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                      settings.autoSaveJourneys ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                        settings.autoSaveJourneys ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <hr className="border-purple-50" />

                {/* 5. Show Recommended Trains Toggle */}
                <div className="flex items-center justify-between gap-4 py-1">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Show Recommended Trains</span>
                    <span className="text-[11px] text-slate-400 font-medium">Highlight fastest and safest train options</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, showRecommendedTrains: !settings.showRecommendedTrains })}
                    className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                      settings.showRecommendedTrains ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                        settings.showRecommendedTrains ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* ── TAB 2: NOTIFICATIONS ── */}
            {activeTab === 'notifications' && (
              <div className="space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between gap-4 py-1">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Journey Reminders</span>
                    <span className="text-[11px] text-slate-400 font-medium">Get notified 2 hours before train departure</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">Enabled</span>
                </div>
                <hr className="border-purple-50" />
                <div className="flex items-center justify-between gap-4 py-1">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Waitlist Movement Alerts</span>
                    <span className="text-[11px] text-slate-400 font-medium">Instant alerts when your RAC/WL clears</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">Enabled</span>
                </div>
                <hr className="border-purple-50" />
                <div className="flex items-center justify-between gap-4 py-1">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Station Arrival Chime</span>
                    <span className="text-[11px] text-slate-400 font-medium">Play authentic Indian Railways 4-tone chime</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">Audio Active</span>
                </div>
              </div>
            )}

            {/* ── TAB 3: PRIVACY & SECURITY ── */}
            {activeTab === 'privacy' && (
              <div className="space-y-3 animate-in fade-in">
                <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-700" />
                    <span className="font-bold text-xs text-slate-900">Zero-PII Isolation Ring</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Passwords, OTPs, CVVs, and Aadhaar numbers are never sent to external AI servers.
                  </p>
                </div>
                <hr className="border-purple-50" />
                <div className="flex items-center justify-between gap-4 py-1">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Personal Security PIN</span>
                    <span className="text-[11px] text-slate-400 font-medium">Required for cancelling tickets and sensitive edits</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigateTo('profile')}
                    className="px-3 py-1 rounded-xl bg-purple-100 text-purple-900 text-xs font-bold hover:bg-purple-200 cursor-pointer"
                  >
                    Manage in Profile ➔
                  </button>
                </div>
              </div>
            )}

            {/* ── TAB 4: PAYMENT METHODS ── */}
            {activeTab === 'payments' && (
              <div className="space-y-3 animate-in fade-in">
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-900 to-indigo-950 text-white space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-purple-300 block">Citizen Virtual Wallet</span>
                  <div className="text-xl font-mono font-black text-emerald-400">₹10,000.00 Active Balance</div>
                  <p className="text-[11px] text-purple-200">1-click zero-PIN booking for all official Indian Railway services.</p>
                </div>
                <hr className="border-purple-50" />
                <div className="flex items-center justify-between gap-4 py-1">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Payment Receipts & Ledger</span>
                    <span className="text-[11px] text-slate-400 font-medium">Download GST invoices and transaction logs</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigateTo('payments')}
                    className="px-3 py-1 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-bold hover:bg-purple-100 cursor-pointer"
                  >
                    Open Ledger ➔
                  </button>
                </div>
              </div>
            )}

            {/* ── TAB 5: LANGUAGE ── */}
            {activeTab === 'language' && (
              <div className="space-y-3 animate-in fade-in">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-900 block">Choose Interface Language</span>
                  <span className="text-[11px] text-slate-400 font-medium">Select your preferred Indian regional language</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {['English', 'हिन्दी (Hindi)', 'বাংলা (Bengali)', 'தமிழ் (Tamil)'].map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setSettings({ ...settings, appLanguage: lang.split(' ')[0] })}
                      className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all cursor-pointer ${
                        settings.appLanguage === lang.split(' ')[0]
                          ? 'bg-[#7C3AED] text-white border-purple-600 shadow-sm'
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
              <div className="space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between gap-4 py-1">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Citizen Easy Mode</span>
                    <span className="text-[11px] text-slate-400 font-medium">Enlarged touch targets and simplified terminology</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold">Standard</span>
                </div>
                <hr className="border-purple-50" />
                <div className="flex items-center justify-between gap-4 py-1">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Visual Spotlight Guidance</span>
                    <span className="text-[11px] text-slate-400 font-medium">Interactive green arrows and screen dimming</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">Always On</span>
                </div>
              </div>
            )}

            {/* ── TAB 7: ABOUT ── */}
            {activeTab === 'about' && (
              <div className="space-y-3 animate-in fade-in">
                <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-white to-pink-50 border border-purple-200 space-y-1.5">
                  <h3 className="font-black text-sm text-slate-900">🇮🇳 NIRANTAR (निरंतर) v2.0</h3>
                  <p className="text-xs text-purple-950 font-bold">The Railway Journey That Explains Itself</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    State-aware citizen assistance and resilience layer designed for Indian Public Service Journeys.
                  </p>
                </div>
                <div className="text-[11px] text-slate-500 space-y-1">
                  <div><strong>Architecture:</strong> 4 Pillars (Discover → Understand → Act → Recover)</div>
                  <div><strong>Trust Layer:</strong> Zero-PII Sanitizer & Fair Access Telemetry</div>
                  <div><strong>Core Rule Base:</strong> Deterministic Commercial Rules & NTES</div>
                </div>
              </div>
            )}

            {/* Save Changes Button */}
            <div className="pt-3">
              <button
                type="submit"
                className="w-full py-3 px-6 rounded-2xl border-2 border-purple-600 bg-white hover:bg-purple-50 text-purple-700 font-black text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Save className="w-4 h-4 text-purple-600" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
