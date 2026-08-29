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
  Volume2,
  VolumeX,
  Eye,
  Layers,
  Image as ImageIcon,
  Check,
  Play,
  RotateCcw,
} from 'lucide-react';
import { useJourney } from '../context/JourneyContext';

export const SettingsPage: React.FC = () => {
  const { navigateTo, citizenProfile, setCitizenProfile, theme, setTheme } = useJourney();
  const [activeTab, setActiveTab] = useState('general');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeThemeBg, setActiveThemeBg] = useState('/assets/images/settings_bg.png');
  const [activeAudioTest, setActiveAudioTest] = useState<string | null>(null);
  const [redactionInput, setRedactionInput] = useState('My IRCTC password is secret123 and phone is 9876543210');

  // Settings State
  const [settings, setSettings] = useState({
    theme: 'Light',
    fontSize: 'Medium',
    appLanguage: 'English',
    defaultJourneyClass: 'AC 3 Tier',
    autoSaveJourneys: true,
    showRecommendedTrains: true,
    dataSaverMode: false,
    highContrast: false,
    stationChimes: true,
    whatsappAlerts: true,
    scenicWallpaper: 'Vande Bharat Sunrise',
  });

  const categories = [
    { id: 'general', label: 'General & Preferences', icon: SettingsIcon },
    { id: 'profile', label: 'Avatar & Profile', icon: User },
    { id: 'notifications', label: 'Alerts & Chimes', icon: Bell },
    { id: 'privacy', label: 'Zero-PII Vault', icon: Lock },
    { id: 'payments', label: 'Citizen Wallet', icon: CreditCard },
    { id: 'language', label: 'Languages (10)', icon: Globe },
    { id: 'accessibility', label: 'Easy Accessibility', icon: Accessibility },
    { id: 'about', label: 'About Nirantar', icon: Info },
  ];

  const AVATARS = [
    { id: 'student', name: 'Ankit', role: 'Student Explorer', path: '/assets/images/avatars/avatar_1_student.svg' },
    { id: 'senior', name: 'Ramachandran', role: 'Senior Citizen Priority', path: '/assets/images/avatars/avatar_2_senior.svg' },
    { id: 'techie', name: 'Vikram', role: 'Tech Professional', path: '/assets/images/avatars/avatar_3_techie.svg' },
    { id: 'commuter', name: 'Suresh', role: 'Daily Commuter', path: '/assets/images/avatars/avatar_4_commuter.svg' },
    { id: 'family', name: 'Verma Family', role: 'Family Vacationer', path: '/assets/images/avatars/avatar_5_family.svg' },
    { id: 'photographer', name: 'Priya', role: 'Travel Photographer', path: '/assets/images/avatars/avatar_6_photographer.svg' },
    { id: 'doctor', name: 'Dr. Meera', role: 'Medical Officer', path: '/assets/images/avatars/avatar_7_doctor.svg' },
    { id: 'entrepreneur', name: 'Amitav', role: 'Business Executive', path: '/assets/images/avatars/avatar_8_entrepreneur.svg' },
    { id: 'rail_enthusiast', name: 'Rohan', role: 'Rail Fan & Spotter', path: '/assets/images/avatars/avatar_9_rail_enthusiast.svg' },
    { id: 'nira_guide', name: 'Nira Copilot', role: 'AI Assistant Edition', path: '/assets/images/avatars/avatar_10_nira_guide.svg' },
    { id: 'ananya', name: 'Ananya', role: 'Digital Rail Navigator', path: '/assets/images/avatars/avatar_11_ananya.svg' },
    { id: 'conductor', name: 'Chief Conductor', role: 'TTE Conductor Edition', path: '/assets/images/avatars/avatar_12_conductor.svg' },
  ];

  const playAudioSimulation = (toneName: string) => {
    setActiveAudioTest(toneName);
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (toneName === 'gong') {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(440.0, ctx.currentTime + 0.3); // A4
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
        osc.start();
        osc.stop(ctx.currentTime + 1.2);
      } else if (toneName === 'fanfare') {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.3); // G5
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
        osc.start();
        osc.stop(ctx.currentTime + 0.9);
      } else {
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(440, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        osc.start();
        osc.stop(ctx.currentTime + 0.8);
      }
    } catch {}

    setTimeout(() => {
      setActiveAudioTest(null);
    }, 1500);
  };

  const handleSelectAvatar = (avatarPath: string, roleName: string) => {
    if (setCitizenProfile && citizenProfile) {
      const updated = { ...citizenProfile, avatar: avatarPath, role: roleName };
      setCitizenProfile(updated);
      try {
        localStorage.setItem('nirantar_citizen_profile', JSON.stringify(updated));
      } catch {}
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const getRedactedPreview = (raw: string) => {
    return raw
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '[REDACTED_EMAIL]')
      .replace(/\b(?:\+91|0)?[6-9]\d{9}\b/g, '[REDACTED_PHONE]')
      .replace(/(?:password|pwd|pin|secret|otp)\s*(?:is|=|:)?\s*([^\s,]+)/gi, 'password is [PROTECTED_CREDENTIAL]')
      .replace(/\b\d{4}[ -]?\d{4}[ -]?\d{4}\b/g, '[REDACTED_AADHAAR]');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-pink-50/50 dark:from-black dark:via-black dark:to-black -mx-4 -mt-4 p-3 sm:p-5 md:p-6 transition-colors duration-300">
      <div className="max-w-6xl mx-auto space-y-4 pb-12 select-none font-sans text-slate-800 dark:text-slate-100 animate-in fade-in duration-300">
        
        {/* ═══════════════════════════════════════════════════════════════════
            1. HERO BANNER - SLEEK, COMPACT & MODERN
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="relative overflow-hidden flex items-center justify-between rounded-2xl p-4 sm:p-5 shadow-lg border border-purple-400/20 dark:border-zinc-800 bg-gradient-to-r from-[#1A0B2E] via-[#2D1254] to-[#160B30] dark:from-[#0A0A0E] dark:via-[#131318] dark:to-[#0A0A0E] text-white">
          <div className="relative z-10 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 text-white flex items-center justify-center font-bold shadow-md backdrop-blur-md shrink-0">
              <SettingsIcon className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-[10px] font-bold tracking-wide uppercase backdrop-blur-md">
                <Sparkles className="w-3 h-3 text-purple-300" />
                <span>Preferences & Vault</span>
              </div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white mt-0.5">
                Settings & Preferences
              </h1>
            </div>
          </div>

          {/* Compact Mini Mascot & Save Indicator */}
          <div className="relative z-10 flex items-center gap-3 shrink-0">
            {saveSuccess ? (
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full shadow-md animate-in fade-in">
                <div className="w-6 h-6 flex items-center justify-center">
                  <img src="/assets/images/characters/nira_excited.png" alt="Saved" className="w-full h-full object-contain drop-shadow-xs" />
                </div>
                <span className="text-emerald-300 font-bold text-xs flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Saved
                </span>
              </div>
            ) : (
              <div className="w-11 h-11 flex items-center justify-center">
                <img
                  src="/assets/images/characters/nira_settings.png"
                  alt="Nira Settings"
                  className="w-full h-full object-contain drop-shadow-md"
                />
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            2. TWO-COLUMN LAYOUT
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          <div className="md:col-span-4 bg-white/80 backdrop-blur-xl rounded-[2rem] p-4 shadow-xl border border-purple-100/60 space-y-3">
            
            <div 
              onClick={() => setActiveTab('profile')}
              className="p-3.5 rounded-3xl bg-gradient-to-r from-purple-100/90 via-indigo-50/90 to-pink-50/90 border border-purple-200/60 flex items-center gap-3.5 shadow-sm hover:shadow-md cursor-pointer transition-all group"
            >
              <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 transition-transform group-hover:scale-105 flex items-center justify-center">
                <img
                  src={citizenProfile?.avatar || '/assets/images/avatars/avatar_1_student.svg'}
                  alt="Citizen Profile"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <h3 className="font-black text-sm text-slate-950 truncate">{citizenProfile?.name || 'Citizen User'}</h3>
                <span className="text-[11px] text-purple-700 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                  <span>{citizenProfile?.role || 'Citizen & Explorer'}</span>
                </span>
              </div>
              <ChevronRight className="w-4 h-4 ml-auto text-purple-400 group-hover:translate-x-0.5 transition-transform" />
            </div>

            <div className="space-y-1.5 px-1">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeTab === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveTab(cat.id)}
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

            <div className="pt-3 pb-1 px-1">
              <div className="relative overflow-hidden p-4 rounded-3xl bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border border-purple-100 shadow-sm flex items-center gap-3.5 group hover:shadow-md transition-shadow">
                <div className="w-16 h-16 shrink-0 overflow-hidden transition-transform group-hover:scale-105 flex items-center justify-center">
                  <img
                    src="/assets/images/characters/nira_guide_teacher.png"
                    alt="Guide"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="relative z-10 leading-tight min-w-0">
                  <strong className="text-purple-900 block font-black text-xs mb-0.5">Local Storage First</strong>
                  <span className="text-slate-600 text-[11px] font-medium">Preferences & avatar stay securely on your browser.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden md:col-span-8 bg-white/90 backdrop-blur-xl rounded-[2rem] p-6 sm:p-8 shadow-xl border border-purple-100/60 min-h-[600px] flex flex-col">
            <div className="absolute inset-0 pointer-events-none opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #6b21a8 1px, transparent 0)', backgroundSize: '24px 24px' }} />

            <div className="relative z-10 flex items-center justify-between pb-5 border-b border-purple-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-7 bg-gradient-to-b from-purple-600 to-indigo-600 rounded-full" />
                <h2 className="text-lg font-black text-slate-900 tracking-tight capitalize">
                  {activeTab === 'general'
                    ? 'General Settings & Preferences'
                    : activeTab === 'profile'
                    ? 'Citizen Avatar Picker & Identity'
                    : activeTab === 'notifications'
                    ? 'Alerts & Station Audio Chimes'
                    : activeTab === 'privacy'
                    ? 'Zero-PII Isolation Ring & Security'
                    : activeTab === 'payments'
                    ? 'Citizen Virtual Wallet & Payments'
                    : activeTab === 'language'
                    ? 'Multilingual Indian Localization (10)'
                    : activeTab === 'accessibility'
                    ? 'Accessibility & Visual Easy Mode'
                    : 'About Nirantar Master Architecture'}
                </h2>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                Live Verified
              </span>
            </div>

            <form onSubmit={handleSave} className="relative z-10 flex-1 flex flex-col">
              <div className="flex-1 space-y-5 text-xs sm:text-sm font-semibold text-slate-700">
                
                {activeTab === 'general' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-100 flex items-center gap-3">
                      <div className="w-12 h-12 flex items-center justify-center shrink-0">
                        <img src="/assets/images/characters/nira_idea.png" alt="Preferences" className="w-full h-full object-contain drop-shadow-sm" />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="font-black text-sm text-purple-950">App Appearance & Booking Preferences</h4>
                        <p className="text-xs text-slate-600 font-medium">Customize interface theme, default train classes, and session retention.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-purple-100 dark:border-slate-700 shadow-2xs hover:shadow-sm transition-all">
                        <div>
                          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block mb-0.5">Interface Theme Palette</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Curated soothing colour schemes</span>
                        </div>
                        <select
                          value={theme}
                          onChange={(e) => {
                            const val = e.target.value as any;
                            setTheme(val);
                            setSettings({ ...settings, theme: val });
                          }}
                          className="px-3 py-1.5 rounded-xl border border-purple-200 dark:border-slate-600 bg-purple-50/50 dark:bg-slate-700 text-xs font-bold text-purple-950 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-600 cursor-pointer shadow-2xs"
                        >
                          <option value="lavender">🌸 Royal Iris (Soft Lavender)</option>
                          <option value="midnight">🌌 Midnight Slate (Soft Dark)</option>
                          <option value="amber">🌅 Warm Sunset (Cozy Amber)</option>
                          <option value="emerald">🍃 Mint Express (Calm Pine)</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#16102A] border border-purple-100 dark:border-purple-900/50 shadow-2xs hover:shadow-sm hover:border-purple-200 transition-all">
                        <div>
                          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block mb-0.5">Default Class</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Preselected coach tier</span>
                        </div>
                        <select
                          value={settings.defaultJourneyClass}
                          onChange={(e) => setSettings({ ...settings, defaultJourneyClass: e.target.value })}
                          className="px-3.5 py-1.5 rounded-xl border border-purple-200 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/80 text-xs font-bold text-purple-950 dark:text-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-600 cursor-pointer shadow-2xs"
                        >
                          <option value="AC 3 Tier">AC 3 Tier (3A)</option>
                          <option value="AC 2 Tier">AC 2 Tier (2A)</option>
                          <option value="AC 1st Class">AC 1st Class (1A)</option>
                          <option value="Sleeper">Sleeper (SL)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-purple-100 shadow-2xs hover:shadow-sm hover:border-purple-200 transition-all">
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-slate-900 block mb-0.5">Auto Save Journeys to TaskStack</span>
                        <span className="text-xs text-slate-500 font-medium">Retain incomplete bookings when navigating pages</span>
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
                        <span className="text-xs sm:text-sm font-bold text-slate-900 block mb-0.5">Instant 1-Click Ticket Checkout</span>
                        <span className="text-xs text-slate-500 font-medium">Use pre-funded citizen virtual wallet for zero OTP friction</span>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">Enabled</span>
                    </div>
                  </div>
                )}

                {activeTab === 'profile' && (
                  <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-100/80 via-indigo-50/80 to-pink-50/80 border border-purple-200/80 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h4 className="font-black text-sm text-purple-950">Citizen Avatar Gallery (12 Characters)</h4>
                        <p className="text-xs text-slate-600 font-medium">Select your preferred avatar for tickets, copilot chats, and profile identity.</p>
                      </div>
                      <div className="w-12 h-12 flex items-center justify-center shrink-0">
                        <img src={citizenProfile?.avatar || '/assets/images/avatars/avatar_1_student.svg'} alt="Active Avatar" className="w-full h-full object-contain" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {AVATARS.map((av) => {
                        const isSelected = citizenProfile?.avatar === av.path;
                        return (
                          <div
                            key={av.id}
                            onClick={() => handleSelectAvatar(av.path, av.role)}
                            className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center text-center space-y-2 group shadow-2xs ${
                              isSelected
                                ? 'bg-purple-50 border-purple-600 ring-2 ring-purple-400/40 shadow-md scale-102'
                                : 'bg-white border-purple-100 hover:border-purple-300 hover:bg-purple-50/40'
                            }`}
                          >
                            <div className="w-14 h-14 rounded-2xl overflow-hidden transition-transform group-hover:scale-108 relative flex items-center justify-center">
                              <img src={av.path} alt={av.name} className="w-full h-full object-contain" />
                              {isSelected && (
                                <div className="absolute top-0 right-0 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                                  <Check className="w-2.5 h-2.5" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 w-full">
                              <strong className="text-xs font-black text-slate-900 block truncate">{av.name}</strong>
                              <span className="text-[10px] text-purple-700 font-bold block truncate">{av.role}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── TAB 3: NOTIFICATIONS & AUDIO SOUNDBOARD ── */}
                {activeTab === 'notifications' && (
                  <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
                    
                    {/* Audio Soundboard */}
                    <div className="p-5 rounded-3xl bg-gradient-to-br from-purple-900 to-indigo-950 text-white shadow-lg space-y-3 border border-purple-400/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Volume2 className="w-5 h-5 text-yellow-400" />
                          <h4 className="font-black text-sm">Station Audio Preview Soundboard</h4>
                        </div>
                        <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full font-bold text-purple-200">Interactive Chimes</span>
                      </div>
                      <p className="text-xs text-purple-200/90 leading-relaxed font-medium">
                        Preview the authentic acoustic chimes synthesized in NIRANTAR for announcements, booking confirmations, and arrival alarms.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                        <button
                          type="button"
                          onClick={() => playAudioSimulation('gong')}
                          className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                            activeAudioTest === 'gong' ? 'bg-yellow-400 text-slate-950 border-yellow-300 scale-102' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                          }`}
                        >
                          <span>🔔 4-Tone Station Gong</span>
                          <Play className="w-3.5 h-3.5 shrink-0" />
                        </button>

                        <button
                          type="button"
                          onClick={() => playAudioSimulation('fanfare')}
                          className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                            activeAudioTest === 'fanfare' ? 'bg-emerald-400 text-slate-950 border-emerald-300 scale-102' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                          }`}
                        >
                          <span>🎉 DigiLocker Fanfare</span>
                          <Play className="w-3.5 h-3.5 shrink-0" />
                        </button>

                        <button
                          type="button"
                          onClick={() => playAudioSimulation('alarm')}
                          className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                            activeAudioTest === 'alarm' ? 'bg-purple-400 text-slate-950 border-purple-300 scale-102' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                          }`}
                        >
                          <span>⏰ Destination Alarm</span>
                          <Play className="w-3.5 h-3.5 shrink-0" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-purple-100 shadow-2xs hover:border-purple-200 transition-all">
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-slate-900 block mb-0.5">WhatsApp Verified e-Ticket Push</span>
                        <span className="text-xs text-slate-500 font-medium">Send QR-verified PDF directly to registered mobile</span>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">Active</span>
                    </div>
                  </div>
                )}

                {/* ── TAB 4: ZERO-PII VAULT ── */}
                {activeTab === 'privacy' && (
                  <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
                    <div className="p-5 rounded-3xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 flex items-start gap-4 shadow-sm">
                      <div className="w-16 h-16 shrink-0 flex items-center justify-center">
                        <img src="/assets/images/safety_shield.png" alt="Safety Shield" className="w-full h-full object-contain" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-purple-700" />
                          <span className="font-black text-sm text-purple-950">Zero-PII Isolation Ring & Sanitizer</span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed">
                          Passwords, OTPs, CVVs, card numbers, and Aadhaar identifiers are redacted before reaching external AI models. All sensitive credentials stay protected on device.
                        </p>
                      </div>
                    </div>

                    {/* Interactive Redaction Simulator */}
                    <div className="p-4 rounded-2xl bg-white border border-purple-100 shadow-2xs space-y-2">
                      <label className="text-xs font-bold text-slate-900 block">
                        Live PII Redaction Simulator (Test What Nira Sees)
                      </label>
                      <input
                        type="text"
                        value={redactionInput}
                        onChange={(e) => setRedactionInput(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-purple-200 bg-purple-50/40 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
                        placeholder="Type text with phone or password..."
                      />
                      <div className="p-3 rounded-xl bg-slate-950 text-emerald-400 font-mono text-[11px] space-y-1">
                        <div className="text-[10px] text-slate-400 uppercase tracking-widest font-sans font-bold">Sanitized AI Payload:</div>
                        <div>{getRedactedPreview(redactionInput)}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB 5: CITIZEN WALLET ── */}
                {activeTab === 'payments' && (
                  <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
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
                  </div>
                )}

                {/* ── TAB 6: LANGUAGES (10 INDIAN REGIONAL SCRIPTS) ── */}
                {activeTab === 'language' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-purple-50 border border-purple-100">
                      <div className="w-14 h-14 shrink-0 flex items-center justify-center">
                        <img src="/assets/images/characters/nira_guide_teacher.png" alt="Language Guide" className="w-full h-full object-contain" />
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-slate-900 block mb-0.5">Multilingual Indian Regional Localization</span>
                        <span className="text-xs text-slate-600 font-medium">Nira understands and assists in 10 official Indian languages.</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                      {[
                        { code: 'en', name: 'English', native: 'English', greeting: 'Happy Journey' },
                        { code: 'hi', name: 'Hindi', native: 'हिन्दी', greeting: 'शुभ यात्रा' },
                        { code: 'bn', name: 'Bengali', native: 'বাংলা', greeting: 'শুভ যাত্রা' },
                        { code: 'ta', name: 'Tamil', native: 'தமிழ்', greeting: 'இனிய பயணம்' },
                        { code: 'te', name: 'Telugu', native: 'తెలుగు', greeting: 'శుభ ప్రయాణం' },
                        { code: 'mr', name: 'Marathi', native: 'मराठी', greeting: 'आनंददायी प्रवास' },
                        { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', greeting: 'સુખદ પ્રવાસ' },
                        { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', greeting: 'ಶುಭ ಪ್ರಯಾಣ' },
                        { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', greeting: 'ਸੁਖਦ ਯਾਤਰਾ' },
                        { code: 'ml', name: 'Malayalam', native: 'മലയാളം', greeting: 'ശുഭയാത്ര' },
                      ].map((lang) => (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => setSettings({ ...settings, appLanguage: lang.name })}
                          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer shadow-2xs space-y-0.5 ${
                            settings.appLanguage === lang.name
                              ? 'bg-purple-700 text-white border-purple-700 shadow-md shadow-purple-700/20'
                              : 'bg-white text-slate-700 border-purple-100 hover:bg-purple-50'
                          }`}
                        >
                          <div className="text-xs font-black">{lang.native}</div>
                          <div className={`text-[10px] font-medium ${settings.appLanguage === lang.name ? 'text-purple-200' : 'text-slate-500'}`}>{lang.name} • {lang.greeting}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── TAB 7: ACCESSIBILITY ── */}
                {activeTab === 'accessibility' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-purple-100 shadow-2xs hover:border-purple-200 transition-all">
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-slate-900 block mb-0.5">High Contrast Mode</span>
                        <span className="text-xs text-slate-500 font-medium">Sharp contrasting borders and text for sunlight legibility</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, highContrast: !settings.highContrast })}
                        className={`w-12 h-6 rounded-full transition-all relative p-0.5 cursor-pointer shadow-inner ${
                          settings.highContrast ? 'bg-gradient-to-r from-purple-600 to-indigo-600' : 'bg-slate-200'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                            settings.highContrast ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                )}

                {/* ── TAB 8: ABOUT ── */}
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
                  <span>Save All Settings</span>
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {/* Decorative Footer Section */}
        <div className="mt-8 flex items-center justify-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
          <div className="w-10 h-10 flex items-center justify-center">
            <img src="/assets/images/characters/nira_settings.png" alt="Nira" className="w-full h-full object-contain" />
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

