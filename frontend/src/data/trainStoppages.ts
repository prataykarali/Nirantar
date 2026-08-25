import { POPULAR_STATIONS } from './stationData';
import { MOCK_TRAINS_DATABASE, TrainDetail } from './mockTrains';

export interface StationStop {
  code: string;
  name: string;
  platform: string;
  scheduledArr: string;
  scheduledDep: string;
  distanceKm: number;
  doorSide: 'RIGHT SIDE' | 'LEFT SIDE';
  haltMins: number;
  pillarInfo: string;
}

const STATION_NAME: Record<string, string> = Object.fromEntries(
  POPULAR_STATIONS.map((s) => [s.code, s.name])
);

function stationName(code: string): string {
  return STATION_NAME[code] || code;
}

function doorSide(index: number): 'RIGHT SIDE' | 'LEFT SIDE' {
  return index % 2 === 0 ? 'RIGHT SIDE' : 'LEFT SIDE';
}

function platformFor(code: string, index: number, last: boolean): string {
  if (index === 0) return 'Platform 1';
  if (last) return 'Platform 9';
  const n = (code.charCodeAt(0) + index) % 8 + 1;
  return `Platform ${n}`;
}

function pillarFor(index: number): string {
  const pillars = [
    'Pillar #4 & North Overbridge',
    'Pillar #8 & Main Exit',
    'Pillar #14 & Escalator',
    'Pillar #6 & Ramp',
    'Pillar #11 & Footover Bridge',
    'Platform Pillar #18 & Cabway',
  ];
  return pillars[index % pillars.length];
}

function toMins(hhmm: string): number {
  const [h, m] = hhmm.split(':').map((n) => parseInt(n, 10) || 0);
  return h * 60 + m;
}

function fromMins(total: number): string {
  const n = ((total % 1440) + 1440) % 1440;
  const h = Math.floor(n / 60);
  const m = n % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function buildStops(
  codes: string[],
  dep: string,
  arr: string,
  distanceKm: number,
  haltMins: number[] = []
): StationStop[] {
  const start = toMins(dep);
  let end = toMins(arr);
  if (end <= start) end += 1440;
  const span = Math.max(end - start, codes.length * 30);
  const last = codes.length - 1;

  return codes.map((code, i) => {
    const t = start + Math.round((span * i) / Math.max(last, 1));
    const halt = i === 0 || i === last ? 0 : haltMins[i] ?? 2;
    const km = Math.round((distanceKm * i) / Math.max(last, 1));
    return {
      code,
      name: stationName(code),
      platform: platformFor(code, i, i === last),
      scheduledArr: i === 0 ? '--:--' : fromMins(t),
      scheduledDep: i === last ? '--:--' : fromMins(t + halt),
      distanceKm: km,
      doorSide: doorSide(i),
      haltMins: halt,
      pillarInfo: pillarFor(i),
    };
  });
}

/** Published-style halt lists for flagship trains. */
const FLAGSHIP_STOPS: Record<string, StationStop[]> = {
  '12302': [
    { code: 'NDLS', name: 'New Delhi', platform: 'Platform 14', scheduledArr: '--:--', scheduledDep: '16:55', distanceKm: 0, doorSide: 'RIGHT SIDE', haltMins: 0, pillarInfo: 'Pillar #4 & North Overbridge' },
    { code: 'CNB', name: 'Kanpur Central', platform: 'Platform 1', scheduledArr: '21:29', scheduledDep: '21:34', distanceKm: 440, doorSide: 'LEFT SIDE', haltMins: 5, pillarInfo: 'Pillar #8 & Main Exit' },
    { code: 'PRYJ', name: 'Prayagraj Junction', platform: 'Platform 4', scheduledArr: '23:39', scheduledDep: '23:41', distanceKm: 635, doorSide: 'RIGHT SIDE', haltMins: 2, pillarInfo: 'Pillar #14 & Escalator' },
    { code: 'DDU', name: 'Pt. Deen Dayal Upadhyaya', platform: 'Platform 2', scheduledArr: '01:28', scheduledDep: '01:38', distanceKm: 785, doorSide: 'RIGHT SIDE', haltMins: 10, pillarInfo: 'Pillar #6 & Ramp' },
    { code: 'GAYA', name: 'Gaya Junction', platform: 'Platform 1', scheduledArr: '03:39', scheduledDep: '03:42', distanceKm: 990, doorSide: 'LEFT SIDE', haltMins: 3, pillarInfo: 'Pillar #11 & Footover Bridge' },
    { code: 'DHN', name: 'Dhanbad Junction', platform: 'Platform 3', scheduledArr: '05:32', scheduledDep: '05:37', distanceKm: 1145, doorSide: 'RIGHT SIDE', haltMins: 5, pillarInfo: 'Pillar #9 & Footover Bridge' },
    { code: 'HWH', name: 'Howrah Junction', platform: 'Platform 9', scheduledArr: '09:55', scheduledDep: '--:--', distanceKm: 1451, doorSide: 'RIGHT SIDE', haltMins: 0, pillarInfo: 'Platform Pillar #18 & Cabway' },
  ],
  '12301': [
    { code: 'HWH', name: 'Howrah Junction', platform: 'Platform 9', scheduledArr: '--:--', scheduledDep: '16:50', distanceKm: 0, doorSide: 'RIGHT SIDE', haltMins: 0, pillarInfo: 'Platform Pillar #18 & Cabway' },
    { code: 'DHN', name: 'Dhanbad Junction', platform: 'Platform 3', scheduledArr: '19:03', scheduledDep: '19:08', distanceKm: 306, doorSide: 'LEFT SIDE', haltMins: 5, pillarInfo: 'Pillar #9 & Footover Bridge' },
    { code: 'GAYA', name: 'Gaya Junction', platform: 'Platform 1', scheduledArr: '21:22', scheduledDep: '21:25', distanceKm: 461, doorSide: 'RIGHT SIDE', haltMins: 3, pillarInfo: 'Pillar #11 & Footover Bridge' },
    { code: 'DDU', name: 'Pt. Deen Dayal Upadhyaya', platform: 'Platform 2', scheduledArr: '23:15', scheduledDep: '23:25', distanceKm: 666, doorSide: 'LEFT SIDE', haltMins: 10, pillarInfo: 'Pillar #6 & Ramp' },
    { code: 'PRYJ', name: 'Prayagraj Junction', platform: 'Platform 4', scheduledArr: '01:08', scheduledDep: '01:10', distanceKm: 816, doorSide: 'RIGHT SIDE', haltMins: 2, pillarInfo: 'Pillar #14 & Escalator' },
    { code: 'CNB', name: 'Kanpur Central', platform: 'Platform 1', scheduledArr: '03:20', scheduledDep: '03:25', distanceKm: 1011, doorSide: 'LEFT SIDE', haltMins: 5, pillarInfo: 'Pillar #8 & Main Exit' },
    { code: 'NDLS', name: 'New Delhi', platform: 'Platform 14', scheduledArr: '10:05', scheduledDep: '--:--', distanceKm: 1451, doorSide: 'RIGHT SIDE', haltMins: 0, pillarInfo: 'Pillar #4 & North Overbridge' },
  ],
  '12952': [
    { code: 'NDLS', name: 'New Delhi', platform: 'Platform 3', scheduledArr: '--:--', scheduledDep: '16:55', distanceKm: 0, doorSide: 'RIGHT SIDE', haltMins: 0, pillarInfo: 'Pillar #4 & North Overbridge' },
    { code: 'KOTA', name: 'Kota Junction', platform: 'Platform 1', scheduledArr: '21:43', scheduledDep: '21:48', distanceKm: 465, doorSide: 'LEFT SIDE', haltMins: 5, pillarInfo: 'Pillar #8 & Main Exit' },
    { code: 'RTM', name: 'Ratlam Junction', platform: 'Platform 4', scheduledArr: '00:57', scheduledDep: '01:00', distanceKm: 709, doorSide: 'RIGHT SIDE', haltMins: 3, pillarInfo: 'Pillar #14 & Escalator' },
    { code: 'BRC', name: 'Vadodara Junction', platform: 'Platform 3', scheduledArr: '03:27', scheduledDep: '03:35', distanceKm: 922, doorSide: 'LEFT SIDE', haltMins: 8, pillarInfo: 'Pillar #6 & Ramp' },
    { code: 'ST', name: 'Surat', platform: 'Platform 2', scheduledArr: '05:03', scheduledDep: '05:08', distanceKm: 1053, doorSide: 'RIGHT SIDE', haltMins: 5, pillarInfo: 'Pillar #11 & Footover Bridge' },
    { code: 'BVI', name: 'Borivali', platform: 'Platform 6', scheduledArr: '07:54', scheduledDep: '07:57', distanceKm: 1348, doorSide: 'LEFT SIDE', haltMins: 3, pillarInfo: 'Pillar #9 & Footover Bridge' },
    { code: 'CSMT', name: 'Chhatrapati Shivaji Maharaj Terminus', platform: 'Platform 18', scheduledArr: '08:35', scheduledDep: '--:--', distanceKm: 1386, doorSide: 'RIGHT SIDE', haltMins: 0, pillarInfo: 'Platform Pillar #18 & Cabway' },
  ],
  '12951': [
    { code: 'CSMT', name: 'Chhatrapati Shivaji Maharaj Terminus', platform: 'Platform 18', scheduledArr: '--:--', scheduledDep: '17:00', distanceKm: 0, doorSide: 'RIGHT SIDE', haltMins: 0, pillarInfo: 'Platform Pillar #18 & Cabway' },
    { code: 'BVI', name: 'Borivali', platform: 'Platform 6', scheduledArr: '17:33', scheduledDep: '17:36', distanceKm: 38, doorSide: 'LEFT SIDE', haltMins: 3, pillarInfo: 'Pillar #9 & Footover Bridge' },
    { code: 'ST', name: 'Surat', platform: 'Platform 2', scheduledArr: '20:13', scheduledDep: '20:18', distanceKm: 333, doorSide: 'RIGHT SIDE', haltMins: 5, pillarInfo: 'Pillar #11 & Footover Bridge' },
    { code: 'BRC', name: 'Vadodara Junction', platform: 'Platform 3', scheduledArr: '21:47', scheduledDep: '21:55', distanceKm: 464, doorSide: 'LEFT SIDE', haltMins: 8, pillarInfo: 'Pillar #6 & Ramp' },
    { code: 'RTM', name: 'Ratlam Junction', platform: 'Platform 4', scheduledArr: '00:32', scheduledDep: '00:35', distanceKm: 677, doorSide: 'RIGHT SIDE', haltMins: 3, pillarInfo: 'Pillar #14 & Escalator' },
    { code: 'KOTA', name: 'Kota Junction', platform: 'Platform 1', scheduledArr: '03:45', scheduledDep: '03:50', distanceKm: 921, doorSide: 'LEFT SIDE', haltMins: 5, pillarInfo: 'Pillar #8 & Main Exit' },
    { code: 'NDLS', name: 'New Delhi', platform: 'Platform 3', scheduledArr: '08:35', scheduledDep: '--:--', distanceKm: 1386, doorSide: 'RIGHT SIDE', haltMins: 0, pillarInfo: 'Pillar #4 & North Overbridge' },
  ],
  '22436': [
    { code: 'NDLS', name: 'New Delhi', platform: 'Platform 16', scheduledArr: '--:--', scheduledDep: '06:00', distanceKm: 0, doorSide: 'RIGHT SIDE', haltMins: 0, pillarInfo: 'Pillar #4 & North Overbridge' },
    { code: 'CNB', name: 'Kanpur Central', platform: 'Platform 1', scheduledArr: '10:50', scheduledDep: '10:55', distanceKm: 440, doorSide: 'LEFT SIDE', haltMins: 5, pillarInfo: 'Pillar #8 & Main Exit' },
    { code: 'PRYJ', name: 'Prayagraj Junction', platform: 'Platform 4', scheduledArr: '12:40', scheduledDep: '12:45', distanceKm: 635, doorSide: 'RIGHT SIDE', haltMins: 5, pillarInfo: 'Pillar #14 & Escalator' },
    { code: 'BSB', name: 'Varanasi Junction', platform: 'Platform 5', scheduledArr: '14:00', scheduledDep: '--:--', distanceKm: 759, doorSide: 'LEFT SIDE', haltMins: 0, pillarInfo: 'Platform Pillar #18 & Cabway' },
  ],
  '22435': [
    { code: 'BSB', name: 'Varanasi Junction', platform: 'Platform 5', scheduledArr: '--:--', scheduledDep: '15:00', distanceKm: 0, doorSide: 'RIGHT SIDE', haltMins: 0, pillarInfo: 'Platform Pillar #18 & Cabway' },
    { code: 'PRYJ', name: 'Prayagraj Junction', platform: 'Platform 4', scheduledArr: '16:15', scheduledDep: '16:20', distanceKm: 124, doorSide: 'LEFT SIDE', haltMins: 5, pillarInfo: 'Pillar #14 & Escalator' },
    { code: 'CNB', name: 'Kanpur Central', platform: 'Platform 1', scheduledArr: '18:05', scheduledDep: '18:10', distanceKm: 319, doorSide: 'RIGHT SIDE', haltMins: 5, pillarInfo: 'Pillar #8 & Main Exit' },
    { code: 'NDLS', name: 'New Delhi', platform: 'Platform 16', scheduledArr: '23:00', scheduledDep: '--:--', distanceKm: 759, doorSide: 'LEFT SIDE', haltMins: 0, pillarInfo: 'Pillar #4 & North Overbridge' },
  ],
  '12002': [
    { code: 'NDLS', name: 'New Delhi', platform: 'Platform 1', scheduledArr: '--:--', scheduledDep: '06:00', distanceKm: 0, doorSide: 'RIGHT SIDE', haltMins: 0, pillarInfo: 'Pillar #2 & VIP Exit' },
    { code: 'MTJ', name: 'Mathura Junction', platform: 'Platform 1', scheduledArr: '07:19', scheduledDep: '07:20', distanceKm: 141, doorSide: 'LEFT SIDE', haltMins: 1, pillarInfo: 'Pillar #5 & Main Gate' },
    { code: 'AGC', name: 'Agra Cantt', platform: 'Platform 1', scheduledArr: '07:50', scheduledDep: '07:55', distanceKm: 195, doorSide: 'RIGHT SIDE', haltMins: 5, pillarInfo: 'Pillar #6 & Tourist Lounge' },
    { code: 'DHO', name: 'Dholpur Junction', platform: 'Platform 2', scheduledArr: '08:39', scheduledDep: '08:40', distanceKm: 248, doorSide: 'LEFT SIDE', haltMins: 1, pillarInfo: 'Pillar #3 & FOB' },
    { code: 'MRA', name: 'Morena', platform: 'Platform 1', scheduledArr: '08:57', scheduledDep: '08:58', distanceKm: 275, doorSide: 'RIGHT SIDE', haltMins: 1, pillarInfo: 'Pillar #4 & Exit' },
    { code: 'GWL', name: 'Gwalior Junction', platform: 'Platform 1', scheduledArr: '09:23', scheduledDep: '09:28', distanceKm: 313, doorSide: 'LEFT SIDE', haltMins: 5, pillarInfo: 'Pillar #7 & Main Hall' },
    { code: 'VGLJ', name: 'V Lakshmibai Jhansi', platform: 'Platform 2', scheduledArr: '10:45', scheduledDep: '10:50', distanceKm: 411, doorSide: 'RIGHT SIDE', haltMins: 5, pillarInfo: 'Pillar #9 & Escalator' },
    { code: 'LAR', name: 'Lalitpur', platform: 'Platform 2', scheduledArr: '11:42', scheduledDep: '11:43', distanceKm: 501, doorSide: 'LEFT SIDE', haltMins: 1, pillarInfo: 'Pillar #3 & Ramp' },
    { code: 'BINA', name: 'Bina Junction', platform: 'Platform 3', scheduledArr: '12:40', scheduledDep: '12:42', distanceKm: 564, doorSide: 'RIGHT SIDE', haltMins: 2, pillarInfo: 'Pillar #5 & FOB' },
    { code: 'BPL', name: 'Bhopal Junction', platform: 'Platform 1', scheduledArr: '14:40', scheduledDep: '--:--', distanceKm: 708, doorSide: 'RIGHT SIDE', haltMins: 0, pillarInfo: 'Platform Pillar #12 & Portico' },
  ],
  '12004': [
    { code: 'NDLS', name: 'New Delhi', platform: 'Platform 12', scheduledArr: '--:--', scheduledDep: '06:10', distanceKm: 0, doorSide: 'RIGHT SIDE', haltMins: 0, pillarInfo: 'Pillar #3 & Ajmeri Gate' },
    { code: 'GZB', name: 'Ghaziabad Junction', platform: 'Platform 2', scheduledArr: '06:48', scheduledDep: '06:50', distanceKm: 26, doorSide: 'LEFT SIDE', haltMins: 2, pillarInfo: 'Pillar #5 & Main Gate' },
    { code: 'ALJN', name: 'Aligarh Junction', platform: 'Platform 3', scheduledArr: '07:47', scheduledDep: '07:49', distanceKm: 131, doorSide: 'RIGHT SIDE', haltMins: 2, pillarInfo: 'Pillar #4 & FOB' },
    { code: 'TDL', name: 'Tundla Junction', platform: 'Platform 5', scheduledArr: '08:45', scheduledDep: '08:47', distanceKm: 209, doorSide: 'LEFT SIDE', haltMins: 2, pillarInfo: 'Pillar #6 & Exit' },
    { code: 'ETW', name: 'Etawah Junction', platform: 'Platform 3', scheduledArr: '09:40', scheduledDep: '09:42', distanceKm: 301, doorSide: 'RIGHT SIDE', haltMins: 2, pillarInfo: 'Pillar #4 & Ramp' },
    { code: 'CNB', name: 'Kanpur Central', platform: 'Platform 1', scheduledArr: '11:20', scheduledDep: '11:25', distanceKm: 440, doorSide: 'LEFT SIDE', haltMins: 5, pillarInfo: 'Pillar #8 & Main Exit' },
    { code: 'LKO', name: 'Lucknow Charbagh', platform: 'Platform 1', scheduledArr: '12:40', scheduledDep: '--:--', distanceKm: 511, doorSide: 'RIGHT SIDE', haltMins: 0, pillarInfo: 'Platform Pillar #10 & Main Portico' },
  ],
  '22692': [
    { code: 'NDLS', name: 'New Delhi', platform: 'Platform 4', scheduledArr: '--:--', scheduledDep: '20:45', distanceKm: 0, doorSide: 'RIGHT SIDE', haltMins: 0, pillarInfo: 'Pillar #4 & North Overbridge' },
    { code: 'AGC', name: 'Agra Cantt', platform: 'Platform 1', scheduledArr: '22:48', scheduledDep: '22:50', distanceKm: 195, doorSide: 'LEFT SIDE', haltMins: 2, pillarInfo: 'Pillar #6 & Tourist Lounge' },
    { code: 'GWL', name: 'Gwalior Junction', platform: 'Platform 1', scheduledArr: '00:08', scheduledDep: '00:10', distanceKm: 313, doorSide: 'RIGHT SIDE', haltMins: 2, pillarInfo: 'Pillar #7 & Main Hall' },
    { code: 'VGLJ', name: 'V Lakshmibai Jhansi', platform: 'Platform 2', scheduledArr: '01:25', scheduledDep: '01:30', distanceKm: 411, doorSide: 'LEFT SIDE', haltMins: 5, pillarInfo: 'Pillar #9 & Escalator' },
    { code: 'BPL', name: 'Bhopal Junction', platform: 'Platform 1', scheduledArr: '05:20', scheduledDep: '05:25', distanceKm: 708, doorSide: 'RIGHT SIDE', haltMins: 5, pillarInfo: 'Pillar #12 & Portico' },
    { code: 'NGP', name: 'Nagpur Junction', platform: 'Platform 2', scheduledArr: '11:15', scheduledDep: '11:20', distanceKm: 1098, doorSide: 'LEFT SIDE', haltMins: 5, pillarInfo: 'Pillar #5 & Main Gate' },
    { code: 'BPQ', name: 'Balharshah Junction', platform: 'Platform 1', scheduledArr: '14:20', scheduledDep: '14:25', distanceKm: 1307, doorSide: 'RIGHT SIDE', haltMins: 5, pillarInfo: 'Pillar #4 & Exit' },
    { code: 'KZJ', name: 'Kazipet Junction', platform: 'Platform 2', scheduledArr: '17:35', scheduledDep: '17:37', distanceKm: 1542, doorSide: 'LEFT SIDE', haltMins: 2, pillarInfo: 'Pillar #6 & FOB' },
    { code: 'SC', name: 'Secunderabad Junction', platform: 'Platform 10', scheduledArr: '19:40', scheduledDep: '19:50', distanceKm: 1674, doorSide: 'RIGHT SIDE', haltMins: 10, pillarInfo: 'Pillar #8 & North Exit' },
    { code: 'RC', name: 'Raichur Junction', platform: 'Platform 1', scheduledArr: '23:33', scheduledDep: '23:35', distanceKm: 1964, doorSide: 'LEFT SIDE', haltMins: 2, pillarInfo: 'Pillar #3 & Ramp' },
    { code: 'SBC', name: 'KSR Bengaluru', platform: 'Platform 8', scheduledArr: '06:40', scheduledDep: '--:--', distanceKm: 2367, doorSide: 'RIGHT SIDE', haltMins: 0, pillarInfo: 'Platform Pillar #15 & VIP Exit' },
  ],
  '20835': [
    { code: 'HWH', name: 'Howrah Junction', platform: 'Platform 21', scheduledArr: '--:--', scheduledDep: '06:10', distanceKm: 0, doorSide: 'RIGHT SIDE', haltMins: 0, pillarInfo: 'Platform Pillar #18 & Cabway' },
    { code: 'KGP', name: 'Kharagpur Junction', platform: 'Platform 3', scheduledArr: '07:40', scheduledDep: '07:42', distanceKm: 115, doorSide: 'LEFT SIDE', haltMins: 2, pillarInfo: 'Pillar #5 & Main Gate' },
    { code: 'BLS', name: 'Baleshwar', platform: 'Platform 2', scheduledArr: '09:03', scheduledDep: '09:05', distanceKm: 231, doorSide: 'RIGHT SIDE', haltMins: 2, pillarInfo: 'Pillar #4 & FOB' },
    { code: 'BHC', name: 'Bhadrak', platform: 'Platform 2', scheduledArr: '09:48', scheduledDep: '09:50', distanceKm: 294, doorSide: 'LEFT SIDE', haltMins: 2, pillarInfo: 'Pillar #3 & Exit' },
    { code: 'JKR', name: 'Jajpur Keonjhar Road', platform: 'Platform 3', scheduledArr: '10:18', scheduledDep: '10:20', distanceKm: 337, doorSide: 'RIGHT SIDE', haltMins: 2, pillarInfo: 'Pillar #4 & Ramp' },
    { code: 'CTC', name: 'Cuttack Junction', platform: 'Platform 3', scheduledArr: '11:08', scheduledDep: '11:10', distanceKm: 409, doorSide: 'LEFT SIDE', haltMins: 2, pillarInfo: 'Pillar #6 & Main Hall' },
    { code: 'BBS', name: 'Bhubaneswar', platform: 'Platform 4', scheduledArr: '11:42', scheduledDep: '11:44', distanceKm: 437, doorSide: 'RIGHT SIDE', haltMins: 2, pillarInfo: 'Pillar #7 & North Exit' },
    { code: 'KUR', name: 'Khurda Road Junction', platform: 'Platform 5', scheduledArr: '12:00', scheduledDep: '12:02', distanceKm: 456, doorSide: 'LEFT SIDE', haltMins: 2, pillarInfo: 'Pillar #5 & FOB' },
    { code: 'PURI', name: 'Puri Terminus', platform: 'Platform 2', scheduledArr: '12:35', scheduledDep: '--:--', distanceKm: 500, doorSide: 'RIGHT SIDE', haltMins: 0, pillarInfo: 'Platform Pillar #10 & Grand Road Gate' },
  ],
  '12259': [
    { code: 'SDAH', name: 'Sealdah', platform: 'Platform 9B', scheduledArr: '--:--', scheduledDep: '17:00', distanceKm: 0, doorSide: 'RIGHT SIDE', haltMins: 0, pillarInfo: 'Pillar #3 & Main Hall' },
    { code: 'DHN', name: 'Dhanbad Junction', platform: 'Platform 3', scheduledArr: '20:30', scheduledDep: '20:35', distanceKm: 266, doorSide: 'LEFT SIDE', haltMins: 5, pillarInfo: 'Pillar #8 & FOB' },
    { code: 'DDU', name: 'Pt. Deen Dayal Upadhyaya', platform: 'Platform 2', scheduledArr: '01:25', scheduledDep: '01:35', distanceKm: 626, doorSide: 'RIGHT SIDE', haltMins: 10, pillarInfo: 'Pillar #6 & Ramp' },
    { code: 'CNB', name: 'Kanpur Central', platform: 'Platform 1', scheduledArr: '05:30', scheduledDep: '05:35', distanceKm: 971, doorSide: 'LEFT SIDE', haltMins: 5, pillarInfo: 'Pillar #8 & Main Exit' },
    { code: 'NDLS', name: 'New Delhi', platform: 'Platform 13', scheduledArr: '11:00', scheduledDep: '--:--', distanceKm: 1411, doorSide: 'RIGHT SIDE', haltMins: 0, pillarInfo: 'Pillar #4 & North Overbridge' },
  ],
  '12123': [
    { code: 'CSMT', name: 'Chhatrapati Shivaji Maharaj Terminus', platform: 'Platform 8', scheduledArr: '--:--', scheduledDep: '17:10', distanceKm: 0, doorSide: 'RIGHT SIDE', haltMins: 0, pillarInfo: 'Platform Pillar #18 & Heritage Gate' },
    { code: 'DR', name: 'Dadar Central', platform: 'Platform 6', scheduledArr: '17:22', scheduledDep: '17:24', distanceKm: 9, doorSide: 'LEFT SIDE', haltMins: 2, pillarInfo: 'Pillar #4 & Exit' },
    { code: 'KYN', name: 'Kalyan Junction', platform: 'Platform 5', scheduledArr: '18:08', scheduledDep: '18:10', distanceKm: 54, doorSide: 'RIGHT SIDE', haltMins: 2, pillarInfo: 'Pillar #7 & FOB' },
    { code: 'KJT', name: 'Karjat Junction', platform: 'Platform 1', scheduledArr: '18:48', scheduledDep: '18:50', distanceKm: 100, doorSide: 'LEFT SIDE', haltMins: 2, pillarInfo: 'Pillar #3 & Ghat Banker' },
    { code: 'LNL', name: 'Lonavala', platform: 'Platform 1', scheduledArr: '19:33', scheduledDep: '19:35', distanceKm: 128, doorSide: 'RIGHT SIDE', haltMins: 2, pillarInfo: 'Pillar #5 & Main Gate' },
    { code: 'SVJR', name: 'Shivajinagar', platform: 'Platform 2', scheduledArr: '20:18', scheduledDep: '20:20', distanceKm: 190, doorSide: 'LEFT SIDE', haltMins: 2, pillarInfo: 'Pillar #4 & Exit' },
    { code: 'PUNE', name: 'Pune Junction', platform: 'Platform 5', scheduledArr: '20:25', scheduledDep: '--:--', distanceKm: 192, doorSide: 'RIGHT SIDE', haltMins: 0, pillarInfo: 'Platform Pillar #8 & Main Portico' },
  ],
};

const CORRIDORS: string[][] = [
  ['NDLS', 'CNB', 'PRYJ', 'DDU', 'GAYA', 'DHN', 'HWH'],
  ['NDLS', 'KOTA', 'RTM', 'BRC', 'ST', 'BVI', 'CSMT'],
  ['NDLS', 'JHS', 'BPL', 'NGP', 'HYB', 'SBC'],
  ['NDLS', 'BPL', 'NGP', 'BZA', 'MAS'],
  ['NDLS', 'CNB', 'PRYJ', 'BSB'],
  ['NDLS', 'CNB', 'LKO'],
  ['NDLS', 'AGC', 'GWL', 'JHS', 'BPL'],
  ['NDLS', 'CDG', 'JAT', 'SVDK'],
  ['HWH', 'KGP', 'BBS', 'PURI'],
  ['HWH', 'MLDT', 'NJP'],
  ['HWH', 'PNBE'],
  ['CSMT', 'PUNE'],
  ['CSMT', 'ST', 'BRC', 'ADI'],
  ['MAS', 'SBC'],
  ['SBC', 'SA', 'ED', 'CBE'],
  ['NDLS', 'JP', 'AII'],
  ['NDLS', 'HW', 'DDN'],
];

function corridorBetween(from: string, to: string): string[] {
  for (const stops of CORRIDORS) {
    const i = stops.indexOf(from);
    const j = stops.indexOf(to);
    if (i >= 0 && j >= 0 && i !== j) {
      return i < j ? stops.slice(i, j + 1) : [...stops.slice(j, i + 1)].reverse();
    }
  }
  if (from && to && from !== to) return [from, to];
  return from ? [from, to || from] : ['NDLS', 'HWH'];
}

export function getTrainStoppages(
  trainNumber: string,
  train?: TrainDetail | null
): StationStop[] {
  const num = (trainNumber || '').trim();
  if (FLAGSHIP_STOPS[num]) return FLAGSHIP_STOPS[num];

  const found =
    train ||
    MOCK_TRAINS_DATABASE.find((t) => t.trainNumber === num) ||
    null;

  const from = found?.fromStationCode || 'NDLS';
  const to = found?.toStationCode || 'HWH';
  const dep = found?.departureTime || '16:55';
  const arr = found?.arrivalTime || '09:55';
  const km = found?.distanceKm || 1000;
  const codes = corridorBetween(from, to);
  return buildStops(codes, dep, arr, km);
}
