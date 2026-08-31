import React, { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { RAILWAY_TERMS, getRailwayTerm, RailwayTerm } from '../data/railwayTerms';
import { Sparkles, X, ArrowRight, HelpCircle, Shield, CheckCircle, Train, CreditCard, MapPin } from 'lucide-react';
import { useJourney } from '../context/JourneyContext';

// Phrase mapping for natural text detection
interface GlossaryMatchEntry {
  phrase: string;
  termKey: string;
}

const GLOSSARY_MATCH_ENTRIES: GlossaryMatchEntry[] = [
  // Multi-word phrases first (highest priority)
  { phrase: 'double verification', termKey: 'DOUBLE_VERIFICATION' },
  { phrase: 'payment ledger', termKey: 'PAYMENT_LEDGER' },
  { phrase: 'payment bridge', termKey: 'PAYMENT_BRIDGE' },
  { phrase: 'ghost charge', termKey: 'GHOST_CHARGE' },
  { phrase: 'refund audit', termKey: 'REFUND_AUDIT' },
  { phrase: 'ticket deposit receipt', termKey: 'TDR' },
  { phrase: 'clerkage charge', termKey: 'CLERKAGE' },
  { phrase: 'clerkage fee', termKey: 'CLERKAGE' },
  { phrase: 'clerkage', termKey: 'CLERKAGE' },
  { phrase: 'zero pii', termKey: 'ZERO_PII' },
  { phrase: 'zero-pii', termKey: 'ZERO_PII' },
  { phrase: 'safe autofill', termKey: 'SAFE_AUTOFILL' },
  { phrase: 'fair-access token', termKey: 'FAIR_ACCESS_TOKEN' },
  { phrase: 'fair access token', termKey: 'FAIR_ACCESS_TOKEN' },
  { phrase: 'fair access', termKey: 'FAIR_ACCESS_TOKEN' },
  { phrase: 'live running status', termKey: 'LIVE_STATUS' },
  { phrase: 'running status', termKey: 'LIVE_STATUS' },
  { phrase: 'live status', termKey: 'LIVE_STATUS' },
  { phrase: 'delay estimator', termKey: 'DELAY' },
  { phrase: 'punctuality score', termKey: 'ON_TIME' },
  { phrase: 'on-time performance', termKey: 'ON_TIME' },
  { phrase: 'platform alignment', termKey: 'PLATFORM_ALIGNMENT' },
  { phrase: 'coach position', termKey: 'COACH_POSITION' },
  { phrase: 'rake layout', termKey: 'RAKE_LAYOUT' },
  { phrase: 'rake composition', termKey: 'RAKE_LAYOUT' },
  { phrase: 'berth preference', termKey: 'BERTH_PREFERENCE' },
  { phrase: 'berth preferences', termKey: 'BERTH_PREFERENCE' },
  { phrase: 'auto upgradation', termKey: 'AUTO_UPGRADATION' },
  { phrase: 'e-ticket', termKey: 'E_TICKET' },
  { phrase: 'e-tickets', termKey: 'E_TICKET' },
  { phrase: 'eticket', termKey: 'E_TICKET' },
  { phrase: 'e-catering', termKey: 'E_CATERING' },
  { phrase: 'ecatering', termKey: 'E_CATERING' },
  { phrase: 'travel insurance', termKey: 'TRAVEL_INSURANCE' },
  { phrase: 'intermediate station', termKey: 'INTERMEDIATE_STATION' },
  { phrase: 'intermediate stations', termKey: 'INTERMEDIATE_STATION' },
  { phrase: 'boarding station', termKey: 'BOARDING_STATION' },
  { phrase: 'chart preparation', termKey: 'CHART_PREPARED' },
  { phrase: 'chart prepared', termKey: 'CHART_PREPARED' },
  { phrase: 'confirmation probability', termKey: 'CONFIRMATION_PROBABILITY' },
  { phrase: 'confirmation odds', termKey: 'CONFIRMATION_PROBABILITY' },
  { phrase: 'positions cleared', termKey: 'POSITIONS_CLEARED' },
  { phrase: 'general quota', termKey: 'GENERAL_QUOTA' },
  { phrase: 'tatkal quota', termKey: 'TATKAL' },
  { phrase: 'premium tatkal', termKey: 'PREMIUM_TATKAL' },
  { phrase: 'ladies quota', termKey: 'LADIES_QUOTA' },
  { phrase: 'senior citizen quota', termKey: 'SENIOR_CITIZEN_QUOTA' },
  { phrase: 'senior citizen', termKey: 'SENIOR_CITIZEN_QUOTA' },
  { phrase: 'citizen wallet', termKey: 'CITIZEN_WALLET' },
  { phrase: 'natural language', termKey: 'NATURAL_LANGUAGE' },
  { phrase: 'side lower berth', termKey: 'SL_BERTH' },
  { phrase: 'side lower', termKey: 'SL_BERTH' },
  { phrase: 'side upper berth', termKey: 'SU_BERTH' },
  { phrase: 'side upper', termKey: 'SU_BERTH' },
  { phrase: 'lower berth', termKey: 'LB' },
  { phrase: 'middle berth', termKey: 'MB' },
  { phrase: 'upper berth', termKey: 'UB' },
  { phrase: 'sleeper class', termKey: 'SL' },
  { phrase: 'ac 3-tier', termKey: '3A' },
  { phrase: 'ac 3 tier', termKey: '3A' },
  { phrase: '3 tier ac', termKey: '3A' },
  { phrase: 'ac 3 economy', termKey: '3E' },
  { phrase: '3 economy', termKey: '3E' },
  { phrase: 'ac 2-tier', termKey: '2A' },
  { phrase: 'ac 2 tier', termKey: '2A' },
  { phrase: '2 tier ac', termKey: '2A' },
  { phrase: 'ac first class', termKey: '1A' },
  { phrase: 'first ac', termKey: '1A' },
  { phrase: 'chair car', termKey: 'CC' },
  { phrase: 'ac chair car', termKey: 'CC' },
  { phrase: 'executive chair car', termKey: 'EC' },
  { phrase: 'second sitting', termKey: '2S' },
  { phrase: 'safeassist', termKey: 'SAFEASSIST' },
  { phrase: 'nira ai', termKey: 'NIRA_AI' },
  { phrase: 'dynamic pricing', termKey: 'DYNAMIC_PRICING' },
  // Standalone abbreviations & codes
  { phrase: 'irctc', termKey: 'IRCTC' },
  { phrase: 'upi', termKey: 'UPI' },
  { phrase: 'pnr', termKey: 'PNR' },
  { phrase: 'cnf', termKey: 'CNF' },
  { phrase: 'rac', termKey: 'RAC' },
  { phrase: 'gnwl', termKey: 'GNWL' },
  { phrase: 'rlwl', termKey: 'RLWL' },
  { phrase: 'pqwl', termKey: 'PQWL' },
  { phrase: 'tqwl', termKey: 'TQWL' },
  { phrase: 'tatkal', termKey: 'TATKAL' },
  { phrase: 'tdr', termKey: 'TDR' },
  { phrase: 'tte', termKey: 'TTE' },
  { phrase: 'digilocker', termKey: 'DIGILOCKER' },
  { phrase: 'gps', termKey: 'GPS' },
  { phrase: 'pii', termKey: 'PII' },
  { phrase: 'berth', termKey: 'BERTH_PREFERENCE' },
  { phrase: 'berths', termKey: 'BERTH_PREFERENCE' },
  { phrase: 'quota', termKey: 'GENERAL_QUOTA' },
  { phrase: 'quotas', termKey: 'GENERAL_QUOTA' },
  { phrase: 'pf no', termKey: 'PLATFORM' },
  { phrase: 'pf number', termKey: 'PLATFORM' },
  { phrase: 'pf', termKey: 'PLATFORM' },
  { phrase: 'plat', termKey: 'PLATFORM' },
  { phrase: 'platform', termKey: 'PLATFORM' },
  { phrase: 'platforms', termKey: 'PLATFORM' },
];

// Sort longest phrase first so compound phrases match before single words
const SORTED_MATCH_ENTRIES = [...GLOSSARY_MATCH_ENTRIES].sort(
  (a, b) => b.phrase.length - a.phrase.length
);

const ESCAPED_REGEX_SOURCE = `(^|[^A-Za-z0-9])(${SORTED_MATCH_ENTRIES.map((e) =>
  e.phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
).join('|')})(?=$|[^A-Za-z0-9])`;

const TERM_REGEX = new RegExp(ESCAPED_REGEX_SOURCE, 'gi');

interface ActiveTooltip {
  term: RailwayTerm;
  rect: DOMRect;
}

export const GlossaryHoverHints: React.FC = () => {
  const { sendNiraQuery } = useJourney();
  const [activeTooltip, setActiveTooltip] = useState<ActiveTooltip | null>(null);
  const hoverTimeoutRef = useRef<number | null>(null);

  const hideTooltip = useCallback(() => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = window.setTimeout(() => {
      setActiveTooltip(null);
    }, 180);
  }, []);

  const showTooltip = useCallback((term: RailwayTerm, targetElement: HTMLElement) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    const rect = targetElement.getBoundingClientRect();
    setActiveTooltip({ term, rect });
  }, []);

  // Global event listener for jargon hint triggers
  useEffect(() => {
    const handleMouseEnter = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest?.('[data-jargon-hint]');
      if (!target) return;
      const termKey = target.getAttribute('data-term-key') || target.textContent || '';
      const termData = getRailwayTerm(termKey);
      if (termData) {
        showTooltip(termData, target as HTMLElement);
      }
    };

    const handleMouseLeave = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest?.('[data-jargon-hint]');
      if (target) {
        hideTooltip();
      }
    };

    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest?.('[data-jargon-hint]');
      if (!target) return;
      e.stopPropagation();
      const termKey = target.getAttribute('data-term-key') || target.textContent || '';
      const termData = getRailwayTerm(termKey);
      if (termData) {
        showTooltip(termData, target as HTMLElement);
      }
    };

    document.addEventListener('mouseover', handleMouseEnter);
    document.addEventListener('mouseout', handleMouseLeave);
    document.addEventListener('click', handleClick);

    window.addEventListener('nirantar-show-jargon-preview', (e: Event) => {
      const customEvt = e as CustomEvent<{ termKey?: string }>;
      const termKey = customEvt.detail?.termKey || 'GNWL';
      const termData = getRailwayTerm(termKey) || getRailwayTerm('GNWL') || RAILWAY_TERMS[0];
      if (!termData) return;

      const target =
        (document.querySelector(`[data-jargon-hint="true"][data-term-key="${termKey}"]`) as HTMLElement) ||
        (document.querySelector('[data-jargon-hint="true"]') as HTMLElement);

      if (target) {
        showTooltip(termData, target);
      } else {
        const fakeRect = new DOMRect(window.innerWidth / 2 - 140, 280, 280, 36);
        setActiveTooltip({ term: termData, rect: fakeRect });
      }
    });

    return () => {
      document.removeEventListener('mouseover', handleMouseEnter);
      document.removeEventListener('mouseout', handleMouseLeave);
      document.removeEventListener('click', handleClick);
    };
  }, [showTooltip, hideTooltip]);

  // DOM Text scanner for universal automatic term enhancement
  useEffect(() => {
    const shouldSkip = (node: Text) => {
      const parent = node.parentElement;
      return (
        !parent ||
        Boolean(
          parent.closest(
            'script, style, textarea, input, select, option, button, [data-jargon-hint], [data-no-jargon], pre, code'
          )
        )
      );
    };

    const highlightTextInElement = (root: Node) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      const textNodes: Text[] = [];
      let current: Node | null;

      while ((current = walker.nextNode())) {
        if (current.textContent?.trim() && !shouldSkip(current as Text)) {
          textNodes.push(current as Text);
        }
      }

      textNodes.forEach((textNode) => {
        const source = textNode.textContent || '';
        TERM_REGEX.lastIndex = 0;
        if (!TERM_REGEX.test(source)) return;

        TERM_REGEX.lastIndex = 0;
        const fragment = document.createDocumentFragment();
        let lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = TERM_REGEX.exec(source))) {
          const prefix = match[1] || '';
          const matchedPhrase = match[2];
          const start = match.index + prefix.length;
          const entry = SORTED_MATCH_ENTRIES.find(
            (e) => e.phrase.toLowerCase() === matchedPhrase.toLowerCase()
          );
          const termKey = entry ? entry.termKey : matchedPhrase;

          fragment.append(source.slice(lastIndex, start));

          const span = document.createElement('span');
          span.dataset.jargonHint = 'true';
          span.dataset.termKey = termKey;
          span.className = 'jargon-hint';
          span.tabIndex = 0;
          span.setAttribute('role', 'term');
          span.setAttribute('aria-label', matchedPhrase);
          span.textContent = matchedPhrase;

          fragment.append(span);
          lastIndex = start + matchedPhrase.length;
        }

        fragment.append(source.slice(lastIndex));
        textNode.replaceWith(fragment);
      });
    };

    let timer: number | null = null;
    const debouncedScan = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        highlightTextInElement(document.body);
      }, 250);
    };

    debouncedScan();

    const observer = new MutationObserver((mutations) => {
      let shouldProcess = false;
      for (const m of mutations) {
        if (
          m.type === 'childList' &&
          m.addedNodes.length > 0 &&
          !(m.target as Element)?.closest?.('[data-jargon-hint]')
        ) {
          shouldProcess = true;
          break;
        }
      }
      if (shouldProcess) debouncedScan();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      if (timer) window.clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  // Category Icon & Badge Colors
  const getCategoryConfig = (category: string) => {
    switch (category) {
      case 'reservation':
        return { label: 'Reservation', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: CheckCircle };
      case 'status':
        return { label: 'Live Status', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: MapPin };
      case 'coach':
      case 'berth':
        return { label: 'Coach & Berth', color: 'bg-sky-50 text-sky-700 border-sky-200', icon: Train };
      case 'quota':
        return { label: 'Quota', color: 'bg-amber-50 text-amber-800 border-amber-200', icon: Sparkles };
      case 'payment':
        return { label: 'Payment Shield', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CreditCard };
      case 'safety':
        return { label: 'Privacy & Safety', color: 'bg-rose-50 text-rose-700 border-rose-200', icon: Shield };
      default:
        return { label: 'Railway Guide', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: HelpCircle };
    }
  };

  // Render Portal Tooltip with smart collision positioning
  if (!activeTooltip) return null;

  const { term, rect } = activeTooltip;
  const catConfig = getCategoryConfig(term.category);
  const Icon = catConfig.icon;

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const tooltipWidth = Math.min(320, viewportWidth - 24);

  // Determine optimal top/bottom position
  const spaceBelow = viewportHeight - rect.bottom;
  const spaceAbove = rect.top;
  const showBelow = spaceBelow > 190 || spaceBelow > spaceAbove;

  let top = showBelow ? rect.bottom + 8 : rect.top - 8;
  let left = rect.left + rect.width / 2 - tooltipWidth / 2;

  // Boundary clamp
  if (left < 12) left = 12;
  if (left + tooltipWidth > viewportWidth - 12) {
    left = viewportWidth - tooltipWidth - 12;
  }

  return createPortal(
    <div
      className="fixed z-[99999] pointer-events-auto font-sans animate-in fade-in zoom-in-95 duration-150 select-none shadow-[0_16px_40px_rgba(30,11,62,0.22)] rounded-2xl bg-white border border-purple-100/90 text-slate-900 overflow-hidden"
      style={{
        width: tooltipWidth,
        top: showBelow ? top : undefined,
        bottom: !showBelow ? viewportHeight - top : undefined,
        left,
      }}
      onMouseEnter={() => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      }}
      onMouseLeave={hideTooltip}
    >
      {/* Header with Term and Category Badge */}
      <div className="p-3 pb-2 bg-gradient-to-r from-purple-50/80 via-white to-indigo-50/40 border-b border-purple-100/60 flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-extrabold text-sm text-slate-950 truncate tracking-tight">
            {term.short || term.id}
          </span>
          {term.id !== term.short && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 shrink-0">
              {term.id}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${catConfig.color}`}>
            <Icon className="w-2.5 h-2.5" />
            <span>{catConfig.label}</span>
          </span>
          <button
            type="button"
            onClick={() => setActiveTooltip(null)}
            className="w-5 h-5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Body: Plain-English Definition */}
      <div className="p-3 space-y-2 text-left">
        <p className="text-xs font-semibold text-slate-800 leading-relaxed">
          {term.simple}
        </p>

        {term.why_it_matters && (
          <div className="p-2 rounded-xl bg-purple-50/60 border border-purple-100/70 text-[11px] text-purple-950 leading-snug">
            <span className="font-bold text-purple-800 block text-[10px] uppercase tracking-wider mb-0.5">
              Why It Matters:
            </span>
            {term.why_it_matters}
          </div>
        )}
      </div>

      {/* Footer: Ask Nira Quick Button */}
      <div className="p-2 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-[11px]">
        <span className="text-[10px] text-slate-500 font-medium">Plain-English decoder</span>
        <button
          type="button"
          onClick={() => {
            setActiveTooltip(null);
            sendNiraQuery(`Explain in simple terms what ${term.short || term.id} means on my train ticket and how it works.`);
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] shadow-2xs transition-all active:scale-95 cursor-pointer"
        >
          <Sparkles className="w-2.5 h-2.5" />
          <span>Ask Nira</span>
          <ArrowRight className="w-2.5 h-2.5" />
        </button>
      </div>
    </div>,
    document.body
  );
};

export default GlossaryHoverHints;
