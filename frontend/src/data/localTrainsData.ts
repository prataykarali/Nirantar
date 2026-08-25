export interface LocalTrainRoute {
  id: string;
  name: string;
  division: string;
  fromCode: string;
  fromCity: string;
  toCode: string;
  toCity: string;
  frequencyText: string;
  operatingHours: string;
  unreservedFare: number;
  firstClassFare: number;
  durationMins: number;
  platform: string;
  haltsCount: number;
  type: 'EMU_FAST' | 'EMU_SLOW' | 'MEMU' | 'DEMU';
  nextDepartures: string[];
}

export const LOCAL_SUBURBAN_TRAINS: LocalTrainRoute[] = [
  // Kolkata Suburban (Howrah / Sealdah)
  {
    id: 'hwh-bdel-local',
    name: 'Howrah ➔ Bandel Main Line Local (EMU)',
    division: 'Eastern Railway (Howrah Division)',
    fromCode: 'HWH',
    fromCity: 'Kolkata',
    toCode: 'BDEL',
    toCity: 'Bandel',
    frequencyText: 'Every 8 - 12 mins',
    operatingHours: '04:00 AM - 11:45 PM',
    unreservedFare: 15,
    firstClassFare: 70,
    durationMins: 48,
    platform: 'Platform 1 - 6 (Suburban)',
    haltsCount: 18,
    type: 'EMU_SLOW',
    nextDepartures: ['17:05', '17:18', '17:30', '17:42', '17:55'],
  },
  {
    id: 'hwh-bwcn-galoping',
    name: 'Howrah ➔ Bardhaman Galloping Super Local',
    division: 'Eastern Railway (Main Line)',
    fromCode: 'HWH',
    fromCity: 'Kolkata',
    toCode: 'BWN',
    toCity: 'Bardhaman',
    frequencyText: 'Every 20 mins',
    operatingHours: '04:30 AM - 11:15 PM',
    unreservedFare: 25,
    firstClassFare: 110,
    durationMins: 75,
    platform: 'Platform 3',
    haltsCount: 12,
    type: 'EMU_FAST',
    nextDepartures: ['17:15', '17:35', '18:00', '18:20'],
  },
  {
    id: 'sdah-rha-local',
    name: 'Sealdah ➔ Ranaghat Junction EMU Local',
    division: 'Eastern Railway (Sealdah North)',
    fromCode: 'SDAH',
    fromCity: 'Kolkata',
    toCode: 'RHA',
    toCity: 'Ranaghat',
    frequencyText: 'Every 15 mins',
    operatingHours: '04:15 AM - 11:30 PM',
    unreservedFare: 20,
    firstClassFare: 90,
    durationMins: 85,
    platform: 'Platform 1A - 4',
    haltsCount: 22,
    type: 'EMU_SLOW',
    nextDepartures: ['17:10', '17:25', '17:40', '17:58'],
  },

  // Mumbai Suburban (Central / Western)
  {
    id: 'csmt-kyn-fast',
    name: 'CSMT ➔ Kalyan Fast Local (Central Line)',
    division: 'Central Railway (Mumbai Division)',
    fromCode: 'CSMT',
    fromCity: 'Mumbai',
    toCode: 'KYN',
    toCity: 'Kalyan',
    frequencyText: 'Every 4 - 6 mins (Peak)',
    operatingHours: '24x7 (excluding 01:30 - 03:45 AM)',
    unreservedFare: 15,
    firstClassFare: 105,
    durationMins: 55,
    platform: 'Platform 3 - 6',
    haltsCount: 8,
    type: 'EMU_FAST',
    nextDepartures: ['17:02', '17:08', '17:14', '17:20', '17:26'],
  },
  {
    id: 'csmt-tna-slow',
    name: 'CSMT ➔ Thane All-Stops Slow Local',
    division: 'Central Railway (Mumbai Main)',
    fromCode: 'CSMT',
    fromCity: 'Mumbai',
    toCode: 'TNA',
    toCity: 'Thane',
    frequencyText: 'Every 5 mins',
    operatingHours: '04:00 AM - 01:15 AM',
    unreservedFare: 10,
    firstClassFare: 80,
    durationMins: 44,
    platform: 'Platform 1 - 2',
    haltsCount: 16,
    type: 'EMU_SLOW',
    nextDepartures: ['17:04', '17:09', '17:15', '17:22'],
  },
  {
    id: 'ccg-vr-fast',
    name: 'Churchgate ➔ Virar Fast AC / Non-AC Local',
    division: 'Western Railway',
    fromCode: 'CCG',
    fromCity: 'Mumbai',
    toCode: 'VR',
    toCity: 'Virar',
    frequencyText: 'Every 8 mins',
    operatingHours: '04:15 AM - 01:00 AM',
    unreservedFare: 20,
    firstClassFare: 140,
    durationMins: 78,
    platform: 'Platform 2 - 4',
    haltsCount: 11,
    type: 'EMU_FAST',
    nextDepartures: ['17:07', '17:16', '17:24', '17:33'],
  },

  // Delhi NCR Commuter
  {
    id: 'ndls-gzb-memu',
    name: 'New Delhi ➔ Ghaziabad MEMU Passenger',
    division: 'Northern Railway (Delhi Division)',
    fromCode: 'NDLS',
    fromCity: 'New Delhi',
    toCode: 'GZB',
    toCity: 'Ghaziabad',
    frequencyText: 'Every 20 - 30 mins',
    operatingHours: '05:00 AM - 10:45 PM',
    unreservedFare: 10,
    firstClassFare: 50,
    durationMins: 38,
    platform: 'Platform 11 / 12',
    haltsCount: 6,
    type: 'MEMU',
    nextDepartures: ['17:15', '17:45', '18:15', '18:40'],
  },
  {
    id: 'ndls-fdb-emu',
    name: 'New Delhi ➔ Faridabad / Palwal EMU Local',
    division: 'Northern Railway',
    fromCode: 'NDLS',
    fromCity: 'New Delhi',
    toCode: 'FDB',
    toCity: 'Faridabad',
    frequencyText: 'Every 25 mins',
    operatingHours: '05:30 AM - 10:30 PM',
    unreservedFare: 10,
    firstClassFare: 50,
    durationMins: 42,
    platform: 'Platform 7 / 8',
    haltsCount: 7,
    type: 'EMU_SLOW',
    nextDepartures: ['17:20', '17:50', '18:20'],
  },

  // Chennai Suburban
  {
    id: 'mas-tbm-suburban',
    name: 'Chennai Beach / Central ➔ Tambaram EMU Local',
    division: 'Southern Railway (Chennai Division)',
    fromCode: 'MAS',
    fromCity: 'Chennai',
    toCode: 'TBM',
    toCity: 'Tambaram',
    frequencyText: 'Every 10 mins',
    operatingHours: '04:00 AM - 11:30 PM',
    unreservedFare: 10,
    firstClassFare: 65,
    durationMins: 45,
    platform: 'Platform 1 - 4 (Moore Market)',
    haltsCount: 16,
    type: 'EMU_SLOW',
    nextDepartures: ['17:05', '17:15', '17:25', '17:35'],
  },
];

export function findLocalTrains(fromCode: string, toCode: string): LocalTrainRoute[] {
  const fc = (fromCode || '').toUpperCase().trim();
  const tc = (toCode || '').toUpperCase().trim();

  return LOCAL_SUBURBAN_TRAINS.filter(
    (t) =>
      (t.fromCode === fc || t.fromCity.toUpperCase().includes(fc) || fc.includes(t.fromCity.toUpperCase())) &&
      (t.toCode === tc || t.toCity.toUpperCase().includes(tc) || tc.includes(t.toCity.toUpperCase()))
  );
}
