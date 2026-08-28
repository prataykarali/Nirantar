import React, { useEffect, useState } from 'react';
import { Clock, ShieldCheck } from 'lucide-react';
import { getFairAccessStatus } from '../../services/niraApi';
import { getFairAccessTicket, setFairAccessTicket, subscribeFairAccess } from '../../lib/fairAccessStore';
import type { FairAccessTicket } from '../../services/niraApi';
import { useJourney } from '../../context/JourneyContext';

export const FairAccessBanner: React.FC = () => {
  const { executeSearch, searchParams } = useJourney();
  const [ticket, setTicket] = useState<FairAccessTicket | null>(getFairAccessTicket());
  const resumeRef = React.useRef(executeSearch);
  const paramsRef = React.useRef(searchParams);
  resumeRef.current = executeSearch;
  paramsRef.current = searchParams;

  useEffect(() => subscribeFairAccess(setTicket), []);

  useEffect(() => {
    if (!ticket || ticket.admitted || ticket.status !== 'QUEUED') return undefined;
    const timer = window.setInterval(async () => {
      const next = await getFairAccessStatus(ticket.ticketId);
      if (!next) return;
      setFairAccessTicket(next);
      if (next.admitted) {
        await resumeRef.current(paramsRef.current);
      }
    }, 2000);
    return () => window.clearInterval(timer);
  }, [ticket?.ticketId, ticket?.admitted]);

  if (!ticket || ticket.admitted || ticket.status !== 'QUEUED') return null;

  return (
    <div className="mx-3 sm:mx-6 lg:mx-8 mt-2 mb-1 rounded-2xl border border-amber-200 bg-amber-50 px-3.5 sm:px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex items-start gap-3 flex-1">
        <span className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
          <Clock className="w-4 h-4" />
        </span>
        <div>
          <p className="text-sm font-black text-amber-950">
            High demand — you are in a fair-access queue
          </p>
          <p className="text-xs font-semibold text-amber-800 mt-0.5">
            Position {ticket.queuePosition} · about {ticket.estimatedWaitSeconds}s remaining.
            Your journey is saved. Please wait — extra retries are not needed.
          </p>
          {ticket.duplicateSuppressed && (
            <p className="text-[11px] font-bold text-amber-700 mt-1">
              Duplicate request ignored. Using your existing queue ticket.
            </p>
          )}
          <p className="text-[10px] text-amber-700/80 mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            {ticket.disclaimer}
          </p>
        </div>
      </div>
    </div>
  );
};
