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
          1. HEADER WITH TITLE & SETTINGS BACKGROUND GRAPHIC
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden flex items-center justify-between bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-purple-100">
        {/* Ambient Settings Background Illustration */}
        <div className="absolute inset-0 pointer-events-none opacity-25 overflow-hidden">
          <img
            src="/assets/images/settings_bg.png"
            alt="Settings Background"
            className="w-full h-full object-cover object-right"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-purple-50/60 pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center font-bold shadow-md shadow-purple-600/20">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              Settings
            </h1>
            <p className="text-xs font-medium text-slate-500">
              Customize your citizen preferences, accessibility, and app options
            </p>
          </div>
        </div>

        {saveSuccess && (
          <span className="relative z-10 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 animate-in fade-in shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Settings Saved!</span>
          </span>
        )}
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
              <div className="w-12 h-12 shrink-0">
                <img
                  src="/assets/images/characters/nira_guide_clean.svg"
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

        {/* ── RIGHT COLUMN: GENERAL FORM CONTROLS (8 Cols) ── */}
        <div className="relative overflow-hidden md:col-span-8 bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-purple-100 space-y-5">
          {/* Subtle Panel Background Graphic */}
          <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
            <img
              src="/assets/images/settings_bg.png"
              alt="Settings Graphic"
              className="w-full h-full object-cover object-bottom"
            />
          </div>

          <div className="relative z-10 flex items-center justify-between pb-2 border-b border-purple-50">
            <h2 className="text-sm font-black text-slate-900 tracking-tight">
              General Settings
            </h2>
            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
              Zero-PII Local Storage
            </span>
          </div>

          <form onSubmit={handleSave} className="relative z-10 space-y-4 text-xs font-semibold text-slate-700">
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

            {/* 3. App Language */}
            <div className="flex items-center justify-between gap-4 py-1">
              <div>
                <span className="text-xs font-bold text-slate-900 block">App Language</span>
                <span className="text-[11px] text-slate-400 font-medium">Primary language for journeys</span>
              </div>
              <select
                value={settings.appLanguage}
                onChange={(e) => setSettings({ ...settings, appLanguage: e.target.value })}
                className="px-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50/40 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600 cursor-pointer"
              >
                <option value="English">English</option>
                <option value="Hindi">हिन्दी (Hindi)</option>
                <option value="Bengali">বাংলা (Bengali)</option>
                <option value="Tamil">தமிழ் (Tamil)</option>
              </select>
            </div>

            <hr className="border-purple-50" />

            {/* 4. Default Journey Class */}
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

            {/* 5. Auto Save Journeys Toggle */}
            <div className="flex items-center justify-between gap-4 py-1">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Auto Save Journeys</span>
                <span className="text-[11px] text-slate-400 font-medium">Retain incomplete bookings locally</span>
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

            {/* 6. Show Recommended Trains Toggle */}
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

            <hr className="border-purple-50" />

            {/* 7. Data Saver Mode Toggle */}
            <div className="flex items-center justify-between gap-4 py-1">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Data Saver Mode</span>
                <span className="text-[11px] text-slate-400 font-medium">Reduce background animations on low bandwidth</span>
              </div>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, dataSaverMode: !settings.dataSaverMode })}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                  settings.dataSaverMode ? 'bg-emerald-500' : 'bg-slate-200'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    settings.dataSaverMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

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
