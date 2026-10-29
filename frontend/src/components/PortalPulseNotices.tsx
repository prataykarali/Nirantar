import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { NiraRobot } from './characters/NiraRobot';
import { subscribeFairAccess } from '../lib/fairAccessStore';

type PulseKind = 'warning' | 'action' | 'recovery';

type PulseEvent = {
  id?: string;
  portal_id?: string;
  cycle_id?: string;
  timestamp?: string;
  title?: string;
  message?: string;
  why_it_happened?: string;
  what_portalpulse_did?: string;
  current_result?: string;
  action?: string;
  status?: string;
  verification_status?: string;
  is_recovered?: boolean;
  actuation_record?: { status?: string };
  why?: string;
  before_metrics?: { p95_ms?: number; errors?: number; db_connections?: number };
};

type PulseNotice = {
  id: string;
  kind: PulseKind;
  source: string;
  title: string;
  detail: string;
  followUp: string;
  time: string;
};

function configuredBase(): string | null {
  const configured = String((import.meta as any).env?.VITE_PORTALPULSE_API_URL || '').trim();
  const base = configured || (location.pathname.startsWith('/portals/nirantar') ? location.origin : '');
  if (!base) return null;
  try {
    const url = new URL(base, location.origin);
    const local = ['localhost', '127.0.0.1'].includes(url.hostname);
    if (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) return null;
    return url.origin;
  } catch {
    return null;
  }
}

function normalize(kind: PulseKind, event: PulseEvent): PulseNotice | null {
  if (event.portal_id !== 'nirantar') return null;
  const action = (event.action || '').replace(/_/g, ' ').toLowerCase();
  if (kind === 'action' && (event.status !== 'EXECUTED' || event.actuation_record?.status !== 'SUCCESS')) return null;
  if (kind === 'recovery' && event.is_recovered !== true && event.verification_status !== 'RECOVERY_VERIFIED') return null;
  const title = kind === 'warning'
    ? event.title || 'Nirantar service needs attention'
    : kind === 'action'
      ? `PortalPulse applied ${action || 'a safe action'}`
      : event.title || 'Nirantar recovery verified';
  const pressure = event.before_metrics;
  const measured = pressure && [
    typeof pressure.p95_ms === 'number' ? `p95 ${Math.round(pressure.p95_ms)} ms` : '',
    typeof pressure.errors === 'number' ? `errors ${(pressure.errors * 100).toFixed(1)}%` : '',
    typeof pressure.db_connections === 'number' ? `DB pool ${Math.round(pressure.db_connections)}%` : '',
  ].filter(Boolean).join(' · ');
  const detail = kind === 'warning'
    ? event.message || event.why_it_happened || 'PortalPulse detected a service condition.'
    : kind === 'action'
      ? `${event.what_portalpulse_did || `M7 applied ${action || 'the approved action'} after M6 approved it.`}${measured ? ` Before action: ${measured}.` : ''}`
      : event.current_result || event.message || 'Later measured telemetry improved after the action.';
  const followUp = kind === 'warning'
    ? event.what_portalpulse_did || 'PortalPulse is evaluating a response.'
    : kind === 'action'
      ? `${event.why ? `Detected cause: ${event.why}. ` : ''}The next measured request window must improve before recovery can be claimed.`
      : 'The improvement was checked against later measurements. Monitoring continues.';
  const id = `${kind}:${event.id || event.cycle_id || event.timestamp || title}`;
  return { id, kind, source: 'PORTALPULSE SIMULATOR', title, detail, followUp, time: new Date(event.timestamp || new Date().toISOString()).toLocaleTimeString() };
}

const styles: Record<PulseKind, { frame: string; icon: string; label: string }> = {
  warning: {
    frame: 'border-rose-300 bg-rose-50 text-rose-950 shadow-[0_16px_45px_rgba(225,29,72,0.22)]',
    icon: 'bg-rose-600 text-white',
    label: 'LIVE WARNING',
  },
  action: {
    frame: 'border-sky-300 bg-sky-50 text-sky-950 shadow-[0_16px_45px_rgba(14,165,233,0.24)]',
    icon: 'bg-sky-600 text-white',
    label: 'ACTION APPLIED',
  },
  recovery: {
    frame: 'border-emerald-300 bg-emerald-50 text-emerald-950 shadow-[0_16px_45px_rgba(16,185,129,0.22)]',
    icon: 'bg-emerald-600 text-white',
    label: 'RECOVERY VERIFIED',
  },
};

export const PortalPulseNotices: React.FC = () => {
  const base = useMemo(configuredBase, []);
  const [notices, setNotices] = useState<PulseNotice[]>([]);
  const [connected, setConnected] = useState(false);
  const lastTicket = useRef<{ id: string; status: string } | null>(null);

  useEffect(() => subscribeFairAccess((ticket) => {
    if (!ticket) { lastTicket.current = null; return; }
    const before = lastTicket.current;
    const status = ticket.admitted ? 'ADMITTED' : ticket.status;
    if (before?.id === ticket.ticketId && before.status === status) return;
    lastTicket.current = { id: ticket.ticketId, status };
    const time = new Date().toLocaleTimeString();
    if (status === 'QUEUED') {
      setNotices((previous) => [
        {
          id: `queue:${ticket.ticketId}`,
          kind: 'warning' as const,
          source: 'NIRANTAR FAIR ACCESS',
          title: 'High demand: your request is queued',
          detail: `Position ${ticket.queuePosition} · estimated wait ${ticket.estimatedWaitSeconds}s.`,
          followUp: 'Your request is saved. The queue checks for admission automatically; extra retries are not needed.',
          time,
        },
        {
          id: `queue-control:${ticket.ticketId}`,
          kind: 'action' as const,
          source: 'NIRANTAR QUEUE CONTROL',
          title: 'Nira is balancing booking traffic',
          detail: 'New requests are being admitted in order while active journeys continue.',
          followUp: 'This is Nirantar fair-access control. It is separate from a PortalPulse M7 action.',
          time,
        },
        ...previous,
      ].slice(0, 3));
    } else if (status === 'ADMITTED' && before?.id === ticket.ticketId && before.status === 'QUEUED') {
      setNotices((previous) => [{
        id: `admitted:${ticket.ticketId}`,
        kind: 'recovery' as const,
        source: 'NIRANTAR FAIR ACCESS',
        title: 'Your request was admitted',
        detail: 'The live queue status changed to admitted, and your saved search can continue.',
        followUp: 'Nirantar resumed your journey automatically. This does not claim a PortalPulse M7 recovery.',
        time,
      }, ...previous].slice(0, 3));
    }
  }), []);

  useEffect(() => {
    if (!base) return;
    const source = new EventSource(`${base}/api/v1/stream/events`);
    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);
    const onEvent = (kind: PulseKind) => (event: Event) => {
      try {
        const notice = normalize(kind, JSON.parse((event as MessageEvent).data) as PulseEvent);
        if (!notice) return;
        setNotices((previous) => [notice, ...previous.filter((item) => item.id !== notice.id)].slice(0, 3));
      } catch {
        // Ignore malformed or unrelated stream messages.
      }
    };
    const warning = onEvent('warning');
    const action = onEvent('action');
    const recovery = onEvent('recovery');
    source.addEventListener('warning', warning);
    source.addEventListener('actuation', action);
    source.addEventListener('recovery', recovery);
    return () => source.close();
  }, [base]);

  useEffect(() => {
    if (!notices.length) return;
    const timeout = window.setTimeout(() => setNotices((previous) => previous.slice(0, -1)), 18000);
    return () => window.clearTimeout(timeout);
  }, [notices]);

  if (!notices.length) return null;
  return (
    <aside aria-label="PortalPulse live Nirantar events" className="fixed bottom-28 right-3 sm:right-7 z-[70] flex w-[min(22rem,calc(100vw-1.5rem))] flex-col gap-3 pointer-events-none">
      {notices.map((notice) => {
        const style = styles[notice.kind];
        const Icon = notice.kind === 'warning' ? AlertTriangle : notice.kind === 'action' ? ShieldCheck : CheckCircle2;
        const label = notice.source === 'NIRANTAR QUEUE CONTROL'
          ? 'QUEUE CONTROL ACTIVE'
          : notice.source === 'NIRANTAR FAIR ACCESS' && notice.kind === 'recovery'
            ? 'QUEUE ADMITTED'
            : style.label;
        return (
          <article key={notice.id} role={notice.kind === 'warning' ? 'alert' : 'status'} className={`pointer-events-auto relative rounded-[1.4rem] border-2 p-4 animate-in slide-in-from-right-5 fade-in duration-300 ${style.frame}`}>
            {(notice.kind === 'action' || notice.kind === 'recovery') && (
              <div className="absolute -top-10 right-9 pointer-events-none" aria-hidden="true">
                <NiraRobot expression={notice.kind === 'action' ? 'waving' : 'success'} size="sm" isFloating />
              </div>
            )}
            <div className="flex items-start gap-3">
              <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${style.icon}`}><Icon className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[10px] font-black tracking-[0.12em]"><Activity className="h-3 w-3" />{notice.source} · {label}</div>
                <h3 className="mt-1 text-sm font-black leading-tight">{notice.title}</h3>
                <p className="mt-1.5 text-xs font-medium leading-relaxed">{notice.detail}</p>
                <p className="mt-2 rounded-xl bg-white/75 px-2.5 py-2 text-[11px] font-semibold leading-relaxed">{notice.followUp}</p>
                <p className="mt-2 text-[10px] font-bold opacity-65">{notice.source.startsWith('PORTALPULSE') ? connected ? 'Live feed' : 'Feed reconnecting' : 'Live queue state'} · {notice.time}</p>
              </div>
              <button type="button" aria-label={`Dismiss ${notice.title}`} onClick={() => setNotices((previous) => previous.filter((item) => item.id !== notice.id))} className="rounded-full p-1 hover:bg-white/70"><X className="h-4 w-4" /></button>
            </div>
          </article>
        );
      })}
    </aside>
  );
};

export default PortalPulseNotices;
