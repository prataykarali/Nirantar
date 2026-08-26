import { apiBase } from '../lib/apiBase';
import { findStation, Station } from '../data/stationData';
import { SafeAssistParser, SafeAssistResult } from '../utils/SafeAssistParser';
import { deterministicNiraReply } from './niraRules';

const API_BASE = apiBase();

export interface NiraIntentResponse {
  intent: SafeAssistResult['intent'];
  entities: SafeAssistResult['entities'] & {
    from_station?: string | null;
    to_station?: string | null;
    date_label?: string | null;
    time_of_day?: string | null;
    train_number?: string | null;
  };
  confidence: number;
  response: string;
  source?: 'nvidia' | 'safe_assist';
  fallbackReason?: string | null;
  isActionSafe?: boolean;
  explanation?: string;
}

export interface FairAccessTicket {
  ticketId: string;
  status: 'QUEUED' | 'ADMITTED';
  admitted: boolean;
  queuePosition: number;
  estimatedWaitSeconds: number;
  requestPriority: number;
  demandLevel: string;
  trafficDemand: number;
  bookingDemand: number;
  systemCapacity: number;
  duplicateSuppressed: boolean;
  journeyId?: string | null;
  disclaimer: string;
}

function asStation(value: unknown, fallbackCode?: string | null): Station | null {
  if (value && typeof value === 'object' && 'code' in (value as Station)) {
    const found = findStation((value as Station).code);
    return found || (value as Station);
  }
  if (typeof value === 'string') return findStation(value);
  if (fallbackCode) return findStation(fallbackCode);
  return null;
}

export function toSafeAssistResult(api: NiraIntentResponse, raw: string): SafeAssistResult {
  const from = asStation(api.entities.from, api.entities.from_station);
  const to = asStation(api.entities.to, api.entities.to_station);
  return {
    intent: api.intent,
    entities: {
      from,
      to,
      origin: from?.city,
      destination: to?.city,
      date: api.entities.date || undefined,
      dateLabel: api.entities.dateLabel || api.entities.date_label || undefined,
      timeOfDay: (api.entities.timeOfDay || api.entities.time_of_day || 'Anytime') as SafeAssistResult['entities']['timeOfDay'],
      passengers: api.entities.passengers || 1,
      trainNumber: api.entities.trainNumber || api.entities.train_number || undefined,
      pnr: api.entities.pnr || undefined,
    },
    confidence: api.confidence,
    sourceLayer: api.source === 'nvidia' ? 'LAYER_2_LLM' : 'LAYER_1_SAFE_ASSIST',
    rawTranscript: raw,
    explanation: api.response || api.explanation || '',
    isActionSafe: api.isActionSafe !== false,
  };
}

export async function parseNiraIntent(query: string, language = 'en'): Promise<SafeAssistResult> {
  const parsed = SafeAssistParser.parse(query);
  return { ...parsed, explanation: deterministicNiraReply(query) };
}

export async function admitFairAccess(payload: {
  action: string;
  sessionId: string;
  origin?: string;
  destination?: string;
  travelDate?: string;
  journeyId?: string;
}): Promise<FairAccessTicket | null> {
  try {
    const res = await fetch(`${API_BASE}/fair-access/admit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: payload.action,
        session_id: payload.sessionId,
        origin: payload.origin,
        destination: payload.destination,
        travel_date: payload.travelDate,
        journey_id: payload.journeyId,
      }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function getFairAccessStatus(ticketId: string): Promise<FairAccessTicket | null> {
  try {
    const res = await fetch(`${API_BASE}/fair-access/status/${ticketId}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchPublicRailwayInfo(query = ''): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/ingestion/railway?query=${encodeURIComponent(query)}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function streamNiraChat(
  query: string,
  language = 'en',
  onToken: (token: string) => void,
  onComplete: () => void,
  onError: (err: any) => void,
  history: { role: string; content: string }[] = [],
  context = ''
): Promise<void> {
  const reply = deterministicNiraReply(query, context);
  for (const token of reply.match(/\S+\s*/g) || [reply]) onToken(token);
  onComplete();
}

export async function transcribeAudio(audioBase64: string, language = 'en'): Promise<string> {
  try {
    const res = await fetch(`${API_BASE}/voice/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audio_base64: audioBase64, language }),
    });
    if (!res.ok) return '';
    const data = await res.json();
    return String(data.transcript || '').trim();
  } catch {
    return '';
  }
}
