/**
 * NIRANTAR — Station Concourse & Platform Telemetry Data
 * ========================================================
 * Provides detailed concourse mapping, entrance gates, foot overbridges (FOB),
 * escalators, platform layouts, and real-time crowd telemetry for major hubs:
 *  - New Delhi (NDLS)
 *  - Howrah Junction (HWH)
 *  - Mumbai Central (MMCT) / CSMT
 *  - KSR Bengaluru (SBC)
 *  - MGR Chennai Central (MAS)
 */

export interface StationConcourse {
  code: string;
  name: string;
  city: string;
  totalPlatforms: number;
  gates: Array<{
    id: string;
    name: string;
    location: string;
    nearestPlatforms: number[];
  }>;
  facilities: Array<{
    name: string;
    type: 'cloakroom' | 'waiting_room' | 'food_court' | 'ticket_counter' | 'help_desk' | 'wheelchair_ramp';
    platformOrLocation: string;
  }>;
  overbridges: Array<{
    id: string;
    name: string;
    connectsPlatforms: number[];
    hasEscalator: boolean;
    hasLift: boolean;
  }>;
}

export interface PlatformTelemetry {
  platformNumber: number;
  stationCode: string;
  crowdLevel: 'low' | 'moderate' | 'high' | 'critical';
  passengerInflow: number; // passengers per minute entering platform
  passengerOutflow: number; // passengers per minute exiting
  trainStatus: 'scheduled' | 'arriving' | 'boarding' | 'departed' | 'delayed';
  activeTrainNumber?: string;
  activeTrainName?: string;
  delayMinutes: number;
  scheduledDepartureTime: string;
  nearestEscalatorPillar: string;
}

export const STATION_CONCOURSES: Record<string, StationConcourse> = {
  NDLS: {
    code: 'NDLS',
    name: 'New Delhi Railway Station',
    city: 'Delhi',
    totalPlatforms: 16,
    gates: [
      { id: 'gate_1', name: 'Pahar Ganj Entrance (Gate 1)', location: 'West Concourse', nearestPlatforms: [1, 2, 3, 4] },
      { id: 'gate_2', name: 'Ajmeri Gate Entrance (Gate 2)', location: 'East Concourse', nearestPlatforms: [12, 13, 14, 15, 16] },
      { id: 'gate_vip', name: 'State Entry Road (VIP Gate)', location: 'North Concourse', nearestPlatforms: [1] },
    ],
    facilities: [
      { name: 'Executive Lounge & Cloak Room', type: 'waiting_room', platformOrLocation: 'Platform 1 Main Hall' },
      { name: 'IRCTC Food Track Concourse', type: 'food_court', platformOrLocation: 'Platform 16 & Central FOB' },
      { name: 'Divyangjan Wheelchair Ramp', type: 'wheelchair_ramp', platformOrLocation: 'Gate 2 Entrance' },
      { name: 'May I Help You Booth', type: 'help_desk', platformOrLocation: 'Central Concourse Pahar Ganj' },
    ],
    overbridges: [
      { id: 'fob_north', name: 'North Foot Overbridge', connectsPlatforms: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], hasEscalator: true, hasLift: true },
      { id: 'fob_central', name: 'Central Main Overbridge', connectsPlatforms: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], hasEscalator: true, hasLift: false },
      { id: 'fob_south', name: 'South Foot Overbridge', connectsPlatforms: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], hasEscalator: false, hasLift: true },
    ],
  },
  HWH: {
    code: 'HWH',
    name: 'Howrah Junction',
    city: 'Kolkata',
    totalPlatforms: 23,
    gates: [
      { id: 'hwh_old', name: 'Old Complex (Main Entrance)', location: 'Station Road Riverbank', nearestPlatforms: [1, 2, 3, 4, 5, 6, 7, 8] },
      { id: 'hwh_new', name: 'New Complex Entrance', location: 'South Riverfront', nearestPlatforms: [17, 18, 19, 20, 21, 22, 23] },
      { id: 'hwh_ferry', name: 'Ferry Ghat Concourse Gate', location: 'Hooghly Riverfront', nearestPlatforms: [1, 8] },
    ],
    facilities: [
      { name: 'Heritage Waiting Hall', type: 'waiting_room', platformOrLocation: 'Platform 8 Concourse' },
      { name: 'Jan Aahaar Dining', type: 'food_court', platformOrLocation: 'Platform 9-14 Interlink' },
      { name: 'Railway Police & Assist Booth', type: 'help_desk', platformOrLocation: 'Platform 1 Main Portico' },
    ],
    overbridges: [
      { id: 'fob_old_complex', name: 'Old Terminal Subway & FOB', connectsPlatforms: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], hasEscalator: true, hasLift: true },
      { id: 'fob_new_interlink', name: 'New Complex Interconnector', connectsPlatforms: [17, 18, 19, 20, 21, 22, 23], hasEscalator: true, hasLift: true },
    ],
  },
  MMCT: {
    code: 'MMCT',
    name: 'Mumbai Central Terminus',
    city: 'Mumbai',
    totalPlatforms: 9,
    gates: [
      { id: 'mmct_main', name: 'Main Concourse Portico', location: 'East Entrance', nearestPlatforms: [1, 2, 3, 4, 5] },
      { id: 'mmct_west', name: 'Tardeo West Gate', location: 'West Concourse', nearestPlatforms: [6, 7, 8, 9] },
    ],
    facilities: [
      { name: 'Pod Hotel & AC Lounge', type: 'waiting_room', platformOrLocation: '1st Floor Main Concourse' },
      { name: 'Wheelchair Assistance & Battery Cars', type: 'wheelchair_ramp', platformOrLocation: 'Platform 1 Cabway' },
    ],
    overbridges: [
      { id: 'mmct_fob_1', name: 'Main Terminus Skywalk', connectsPlatforms: [1, 2, 3, 4, 5, 6, 7, 8, 9], hasEscalator: true, hasLift: true },
    ],
  },
  SBC: {
    code: 'SBC',
    name: 'KSR Bengaluru City',
    city: 'Bengaluru',
    totalPlatforms: 10,
    gates: [
      { id: 'sbc_main', name: 'Kempegowda Main Gate', location: 'Main Frontage', nearestPlatforms: [1, 2, 3] },
      { id: 'sbc_back', name: 'Cottonpet Back Gate', location: 'South Gate', nearestPlatforms: [8, 9, 10] },
    ],
    facilities: [
      { name: 'Executive Lounge', type: 'waiting_room', platformOrLocation: 'Platform 1' },
      { name: 'Help Desk', type: 'help_desk', platformOrLocation: 'Main Portico' },
    ],
    overbridges: [
      { id: 'sbc_fob_1', name: 'Central Overbridge', connectsPlatforms: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], hasEscalator: true, hasLift: true },
    ],
  },
};

/**
 * Returns real-time simulated telemetry for a given station platform.
 */
export function getPlatformTelemetry(stationCode: string, platformNumber = 5): PlatformTelemetry {
  const code = (stationCode || 'NDLS').toUpperCase();
  const concourse = STATION_CONCOURSES[code] || STATION_CONCOURSES.NDLS;
  const plat = Math.max(1, Math.min(platformNumber, concourse.totalPlatforms));

  // Platform 5 / 1 / 16 realistic defaults
  if (plat === 5) {
    return {
      platformNumber: 5,
      stationCode: code,
      crowdLevel: 'high',
      passengerInflow: 1240,
      passengerOutflow: 860,
      trainStatus: 'boarding',
      activeTrainNumber: '12951',
      activeTrainName: 'Mumbai Rajdhani Express',
      delayMinutes: 0,
      scheduledDepartureTime: '16:55',
      nearestEscalatorPillar: 'Pillar #8 & Central Overbridge',
    };
  }

  if (plat === 1) {
    return {
      platformNumber: 1,
      stationCode: code,
      crowdLevel: 'moderate',
      passengerInflow: 820,
      passengerOutflow: 740,
      trainStatus: 'arriving',
      activeTrainNumber: '12302',
      activeTrainName: 'Howrah Rajdhani Express',
      delayMinutes: 0,
      scheduledDepartureTime: '16:50',
      nearestEscalatorPillar: 'Pillar #4 & VIP Portico',
    };
  }

  return {
    platformNumber: plat,
    stationCode: code,
    crowdLevel: plat % 3 === 0 ? 'high' : 'moderate',
    passengerInflow: 600 + (plat * 65),
    passengerOutflow: 500 + (plat * 40),
    trainStatus: 'scheduled',
    activeTrainNumber: '22436',
    activeTrainName: 'Vande Bharat Express',
    delayMinutes: plat % 4 === 0 ? 12 : 0,
    scheduledDepartureTime: '18:30',
    nearestEscalatorPillar: `Pillar #${plat * 2} & Overbridge`,
  };
}
