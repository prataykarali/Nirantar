import { TrainDetail } from '../data/mockTrains';

export const CLASS_PLAIN: Record<string, string> = {
  '1A': '1st AC',
  '2A': '2-tier AC',
  '3A': '3-tier AC',
  'SL': 'Sleeper',
  'CC': 'Chair car',
  'EC': 'Executive chair',
  '3E': '3-tier economy AC',
};

export function plainClass(code: string): string {
  return CLASS_PLAIN[code] || code;
}

export function parseDurationHours(duration: string): number {
  const h = duration.match(/(\d+)\s*h/i);
  const m = duration.match(/(\d+)\s*m/i);
  return (h ? parseInt(h[1], 10) : 0) + (m ? parseInt(m[1], 10) : 0) / 60;
}

export function cheapestFare(train: TrainDetail): number {
  const fares = (train.classes || []).map((c) => c.fare).filter((n) => n > 0);
  return fares.length ? Math.min(...fares) : 0;
}

export function rankTrains(trains: TrainDetail[]): TrainDetail[] {
  const fastestId = [...trains].sort(
    (a, b) => parseDurationHours(a.durationHours) - parseDurationHours(b.durationHours)
  )[0]?.trainNumber;
  const cheapestId = [...trains].sort((a, b) => cheapestFare(a) - cheapestFare(b))[0]?.trainNumber;

  return trains.slice(0, 5).map((t) => ({
    ...t,
    isFastest: t.trainNumber === fastestId,
    isBestValue: t.trainNumber === cheapestId,
  }));
}

export function formatTrainGrounding(
  trains: TrainDetail[],
  fromCity: string,
  toCity: string
): string {
  const lines = rankTrains(trains).map((t, i) => {
    const cls = t.classes[0];
    const tags = [
      t.isFastest ? 'fastest' : '',
      t.isBestValue ? 'cheapest' : '',
    ]
      .filter(Boolean)
      .join(', ');
    return `${i + 1}. #${t.trainNumber} ${t.trainName} — leaves ${t.departureTime}, ${t.durationHours}, ${plainClass(cls?.classCode || '3A')} from ₹${cls?.fare || 0}${tags ? ` (${tags})` : ''}`;
  });
  return `User route: ${fromCity} → ${toCity}\nI found these trains:\n${lines.join('\n')}\nRank them in plain language, ask what they prefer (fastest, cheapest, or more comfortable AC), then match one. Do not auto-book.`;
}
