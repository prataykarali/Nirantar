import React, { useEffect } from 'react';
import { Bell, X, Train, Ticket, AlertTriangle, XCircle, Info } from 'lucide-react';
import { useJourney, AppNotification } from '../context/JourneyContext';

function getNotificationMeta(type: AppNotification['type']) {
  if (type === 'delay' || type === 'warning') {
    return {
      Icon: AlertTriangle,
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      border: 'border-amber-200 shadow-[0_12px_40px_rgba(245,158,11,0.22)]',
    };
  }
  if (type === 'cancel') {
    return {
      Icon: XCircle,
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      border: 'border-rose-200 shadow-[0_12px_40px_rgba(244,63,94,0.22)]',
    };
  }
  if (type === 'ticket') {
    return {
      Icon: Ticket,
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      border: 'border-emerald-200 shadow-[0_12px_40px_rgba(16,185,129,0.2)]',
    };
  }
  if (type === 'track') {
    return {
      Icon: Train,
      bg: 'bg-purple-50 text-purple-700 border-purple-200',
      border: 'border-purple-200 shadow-[0_12px_40px_rgba(88,28,135,0.18)]',
    };
  }
  return {
    Icon: Bell,
    bg: 'bg-blue-50 text-blue-700 border-blue-200',
    border: 'border-blue-100 shadow-[0_12px_40px_rgba(59,130,246,0.18)]',
  };
}

export const NotificationToasts: React.FC = () => {
  const { notifications, dismissNotification } = useJourney();
  const visible = notifications.filter((n) => !n.dismissed).slice(0, 3);

  useEffect(() => {
    if (visible.length === 0) return;
    const timers = visible.map((n) =>
      window.setTimeout(() => dismissNotification(n.id), 8000)
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [visible.map((n) => n.id).join('|'), dismissNotification]);

  if (visible.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 sm:right-8 z-[60] flex flex-col gap-2 w-[min(100%-2rem,22rem)] pointer-events-none">
      {visible.map((n) => {
        const meta = getNotificationMeta(n.type);
        const Icon = meta.Icon;
        return (
          <div
            key={n.id}
            className={`pointer-events-auto bg-white border ${meta.border} rounded-2xl p-3.5 flex items-start gap-3 animate-in slide-in-from-right-5 fade-in duration-200`}
          >
            <div className={`w-9 h-9 rounded-xl ${meta.bg} border flex items-center justify-center shrink-0`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black text-slate-900">{n.title}</p>
              <p className="text-[11px] text-slate-600 font-medium mt-0.5 leading-snug">{n.body}</p>
              <p className="text-[10px] text-slate-400 mt-1">{n.time}</p>
            </div>
            <button
              type="button"
              onClick={() => dismissNotification(n.id)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default NotificationToasts;
