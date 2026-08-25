import React, { useEffect } from 'react';
import { Bell, X, Train, Ticket } from 'lucide-react';
import { useJourney, AppNotification } from '../context/JourneyContext';

function iconFor(type: AppNotification['type']) {
  if (type === 'ticket') return Ticket;
  if (type === 'track') return Train;
  return Bell;
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
        const Icon = iconFor(n.type);
        return (
          <div
            key={n.id}
            className="pointer-events-auto bg-white border border-purple-100 shadow-[0_12px_40px_rgba(88,28,135,0.18)] rounded-2xl p-3.5 flex items-start gap-3 animate-in slide-in-from-right-5 fade-in duration-200"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
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
