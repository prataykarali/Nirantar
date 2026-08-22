import React from 'react';
import { Activity, Cpu, User, Globe, ChevronDown } from 'lucide-react';
import { useTranslation, LANGUAGES, LanguageCode } from '../locales/i18n';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNira: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenNira }) => {
  const { language, setLanguage, t } = useTranslation();

  return (
    <header
      role="banner"
      className="border-b border-white/10 bg-[#070c1e]/90 backdrop-blur-xl sticky top-0 z-40 px-4 md:px-8 py-3.5 shadow-xl"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* BRAND LOGO */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Nirantar Home"
          className="flex items-center gap-3 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-purple-400 rounded-xl"
          onClick={() => setActiveTab('home')}
          onKeyDown={(e) => e.key === 'Enter' && setActiveTab('home')}
        >
          <div className="relative">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 p-[1.5px] shadow-lg shadow-purple-500/25 group-hover:scale-105 transition-transform">
              <div className="h-full w-full bg-[#070c1e] rounded-[14px] flex items-center justify-center font-display font-black text-white text-xl">
                N
              </div>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-[#070c1e]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-black tracking-tight text-xl text-white">
                Nirantar
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium tracking-tight">
              Your journey, simplified.
            </p>
          </div>
        </div>

        {/* NAVIGATION LINKS & TABS */}
        <nav
          role="navigation"
          aria-label="Main Navigation"
          className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/10"
        >
          <button
            type="button"
            tabIndex={0}
            aria-label={t('nav.home', 'Home')}
            onClick={() => setActiveTab('home')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-purple-400 ${
              activeTab === 'home'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            {t('nav.home', 'Home')}
          </button>

          <button
            type="button"
            tabIndex={0}
            aria-label={t('nav.discover', 'Services')}
            onClick={() => setActiveTab('discover')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-purple-400 ${
              ['discover', 'guide', 'workspace', 'payment', 'result'].includes(activeTab)
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            {t('nav.discover', 'Services')}
          </button>

          <button
            type="button"
            tabIndex={0}
            aria-label={t('nav.tracking', 'Track')}
            onClick={() => setActiveTab('tracking')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-purple-400 ${
              activeTab === 'tracking'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            {t('nav.tracking', 'Track')}
          </button>

          <button
            type="button"
            tabIndex={0}
            aria-label="Help Assistant"
            onClick={onOpenNira}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            Help
          </button>

          <button
            type="button"
            tabIndex={0}
            aria-label={t('nav.command', 'Command Center')}
            onClick={() => setActiveTab('command')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
              activeTab === 'command'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            {t('nav.command', 'Command Center')}
          </button>

          <button
            type="button"
            tabIndex={0}
            aria-label={t('nav.benchmarks', 'Model Benchmarks')}
            onClick={() => setActiveTab('benchmarks')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
              activeTab === 'benchmarks'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            {t('nav.benchmarks', 'Benchmarks')}
          </button>
        </nav>

        {/* RIGHT CONTROLS: LANGUAGE SELECTOR & SIGN IN */}
        <div className="flex items-center gap-3">
          {/* Dynamic Language Selector Dropdown */}
          <div className="relative group">
            <div
              role="combobox"
              aria-expanded="false"
              aria-haspopup="listbox"
              aria-label={t('nav.selectLanguage', 'Select Language')}
              tabIndex={0}
              className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>{LANGUAGES.find((l) => l.code === language)?.nativeName || 'English'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>

            {/* Dropdown Menu */}
            <div
              role="listbox"
              aria-label="Language Options"
              className="absolute right-0 mt-1 w-36 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden hidden group-hover:block group-focus-within:block z-50 py-1"
            >
              {LANGUAGES.map((langObj) => (
                <button
                  key={langObj.code}
                  type="button"
                  role="option"
                  aria-selected={language === langObj.code}
                  tabIndex={0}
                  onClick={() => setLanguage(langObj.code as LanguageCode)}
                  className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center justify-between hover:bg-purple-600/30 transition-colors ${
                    language === langObj.code ? 'text-purple-300 font-bold bg-purple-950/40' : 'text-slate-300'
                  }`}
                >
                  <span>{langObj.nativeName}</span>
                  <span className="text-[10px] text-slate-500 uppercase">{langObj.code}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            tabIndex={0}
            aria-label="Sign in"
            onClick={() => alert('NIRANTAR Civic Identity Single Sign-On (Mock Login)')}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-extrabold shadow-md shadow-indigo-500/25 transition-all flex items-center gap-1.5 active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <User className="w-3.5 h-3.5" />
            Sign in
          </button>
        </div>
      </div>
    </header>
  );
};
