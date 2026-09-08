/**
 * NIRANTAR — Geographic Station Coordinates Directory
 * ====================================================
 * Supplies authentic WGS84 GPS latitude and longitude coordinates
 * for Indian Railway hubs and intermediate junction halts.
 */

export interface StationGeo {
  code: string;
  name: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  zone: string;
  platforms: number;
}

export const STATION_COORDINATES: Record<string, StationGeo> = {
  // Northern & Capital Region
  NDLS: { code: 'NDLS', name: 'New Delhi', city: 'Delhi', state: 'Delhi', latitude: 28.6427, longitude: 77.2201, zone: 'NR', platforms: 16 },
  DLI: { code: 'DLI', name: 'Old Delhi Junction', city: 'Delhi', state: 'Delhi', latitude: 28.6606, longitude: 77.2289, zone: 'NR', platforms: 16 },
  NZM: { code: 'NZM', name: 'Hazrat Nizamuddin', city: 'Delhi', state: 'Delhi', latitude: 28.5888, longitude: 77.2534, zone: 'NR', platforms: 7 },
  ANVT: { code: 'ANVT', name: 'Anand Vihar Terminal', city: 'Delhi', state: 'Delhi', latitude: 28.6508, longitude: 77.3153, zone: 'NR', platforms: 7 },
  GZB: { code: 'GZB', name: 'Ghaziabad Junction', city: 'Ghaziabad', state: 'Uttar Pradesh', latitude: 28.6644, longitude: 77.4332, zone: 'NR', platforms: 6 },
  CDG: { code: 'CDG', name: 'Chandigarh Junction', city: 'Chandigarh', state: 'Chandigarh', latitude: 30.7056, longitude: 76.8013, zone: 'NR', platforms: 6 },
  JAT: { code: 'JAT', name: 'Jammu Tawi', city: 'Jammu', state: 'Jammu & Kashmir', latitude: 32.7061, longitude: 74.8797, zone: 'NR', platforms: 7 },
  SVDK: { code: 'SVDK', name: 'SMVD Katra', city: 'Katra', state: 'Jammu & Kashmir', latitude: 32.9912, longitude: 74.9317, zone: 'NR', platforms: 5 },
  HW: { code: 'HW', name: 'Haridwar Junction', city: 'Haridwar', state: 'Uttarakhand', latitude: 29.9457, longitude: 78.1642, zone: 'NR', platforms: 9 },

  // Eastern & West Bengal
  HWH: { code: 'HWH', name: 'Howrah Junction', city: 'Kolkata', state: 'West Bengal', latitude: 22.5839, longitude: 88.3426, zone: 'ER', platforms: 23 },
  SDAH: { code: 'SDAH', name: 'Sealdah Station', city: 'Kolkata', state: 'West Bengal', latitude: 22.5697, longitude: 88.3713, zone: 'ER', platforms: 21 },
  KOAA: { code: 'KOAA', name: 'Kolkata Terminal (Chitpur)', city: 'Kolkata', state: 'West Bengal', latitude: 22.6022, longitude: 88.3768, zone: 'ER', platforms: 5 },
  BWN: { code: 'BWN', name: 'Barddhaman Junction', city: 'Bardhaman', state: 'West Bengal', latitude: 23.2324, longitude: 87.8615, zone: 'ER', platforms: 8 },
  ASN: { code: 'ASN', name: 'Asansol Junction', city: 'Asansol', state: 'West Bengal', latitude: 23.6889, longitude: 86.9661, zone: 'ER', platforms: 7 },
  KGP: { code: 'KGP', name: 'Kharagpur Junction', city: 'Kharagpur', state: 'West Bengal', latitude: 22.3276, longitude: 87.3204, zone: 'SER', platforms: 12 },
  NJP: { code: 'NJP', name: 'New Jalpaiguri', city: 'Siliguri', state: 'West Bengal', latitude: 26.6853, longitude: 88.4429, zone: 'NFR', platforms: 8 },

  // Central Corridor & Uttar Pradesh
  CNB: { code: 'CNB', name: 'Kanpur Central', city: 'Kanpur', state: 'Uttar Pradesh', latitude: 26.4539, longitude: 80.3512, zone: 'NCR', platforms: 10 },
  PRYJ: { code: 'PRYJ', name: 'Prayagraj Junction', city: 'Prayagraj', state: 'Uttar Pradesh', latitude: 25.4497, longitude: 81.8284, zone: 'NCR', platforms: 10 },
  DDU: { code: 'DDU', name: 'Pt. Deen Dayal Upadhyaya', city: 'Mughalsarai', state: 'Uttar Pradesh', latitude: 25.2798, longitude: 83.1206, zone: 'ECR', platforms: 8 },
  BSB: { code: 'BSB', name: 'Varanasi Junction', city: 'Varanasi', state: 'Uttar Pradesh', latitude: 25.3283, longitude: 82.9868, zone: 'NR', platforms: 9 },
  LKO: { code: 'LKO', name: 'Lucknow Charbagh', city: 'Lucknow', state: 'Uttar Pradesh', latitude: 26.8322, longitude: 80.9234, zone: 'NR', platforms: 9 },
  AGC: { code: 'AGC', name: 'Agra Cantt', city: 'Agra', state: 'Uttar Pradesh', latitude: 27.1591, longitude: 78.0068, zone: 'NCR', platforms: 6 },
  GWL: { code: 'GWL', name: 'Gwalior Junction', city: 'Gwalior', state: 'Madhya Pradesh', latitude: 26.2166, longitude: 78.1887, zone: 'NCR', platforms: 4 },
  VGLJ: { code: 'VGLJ', name: 'V Lakshmibai Jhansi', city: 'Jhansi', state: 'Uttar Pradesh', latitude: 25.4484, longitude: 78.5685, zone: 'NCR', platforms: 7 },
  BPL: { code: 'BPL', name: 'Bhopal Junction', city: 'Bhopal', state: 'Madhya Pradesh', latitude: 23.2685, longitude: 77.4126, zone: 'WCR', platforms: 6 },
  RKMP: { code: 'RKMP', name: 'Rani Kamalapati (Habibganj)', city: 'Bhopal', state: 'Madhya Pradesh', latitude: 23.2082, longitude: 77.4372, zone: 'WCR', platforms: 5 },
  NGP: { code: 'NGP', name: 'Nagpur Junction', city: 'Nagpur', state: 'Maharashtra', latitude: 21.1523, longitude: 79.0888, zone: 'CR', platforms: 8 },

  // Western & Mumbai
  CSMT: { code: 'CSMT', name: 'Chhatrapati Shivaji Terminus', city: 'Mumbai', state: 'Maharashtra', latitude: 18.9400, longitude: 72.8354, zone: 'CR', platforms: 18 },
  MMCT: { code: 'MMCT', name: 'Mumbai Central', city: 'Mumbai', state: 'Maharashtra', latitude: 18.9696, longitude: 72.8194, zone: 'WR', platforms: 9 },
  BDTS: { code: 'BDTS', name: 'Bandra Terminus', city: 'Mumbai', state: 'Maharashtra', latitude: 19.0622, longitude: 72.8427, zone: 'WR', platforms: 7 },
  LTT: { code: 'LTT', name: 'Lokmanya Tilak Terminus', city: 'Mumbai', state: 'Maharashtra', latitude: 19.0694, longitude: 72.8911, zone: 'CR', platforms: 5 },
  PUNE: { code: 'PUNE', name: 'Pune Junction', city: 'Pune', state: 'Maharashtra', latitude: 18.5284, longitude: 73.8743, zone: 'CR', platforms: 6 },
  SUR: { code: 'SUR', name: 'Solapur Junction', city: 'Solapur', state: 'Maharashtra', latitude: 17.6599, longitude: 75.9064, zone: 'CR', platforms: 5 },
  ADI: { code: 'ADI', name: 'Ahmedabad Junction', city: 'Ahmedabad', state: 'Gujarat', latitude: 23.0273, longitude: 72.6011, zone: 'WR', platforms: 12 },
  ST: { code: 'ST', name: 'Surat Junction', city: 'Surat', state: 'Gujarat', latitude: 21.2049, longitude: 72.8406, zone: 'WR', platforms: 4 },
  BRC: { code: 'BRC', name: 'Vadodara Junction', city: 'Vadodara', state: 'Gujarat', latitude: 22.3107, longitude: 73.1812, zone: 'WR', platforms: 7 },
  KOTA: { code: 'KOTA', name: 'Kota Junction', city: 'Kota', state: 'Rajasthan', latitude: 25.2238, longitude: 75.8648, zone: 'WCR', platforms: 4 },
  JP: { code: 'JP', name: 'Jaipur Junction', city: 'Jaipur', state: 'Rajasthan', latitude: 26.9196, longitude: 75.7878, zone: 'NWR', platforms: 8 },

  // Southern Region
  SBC: { code: 'SBC', name: 'KSR Bengaluru City', city: 'Bengaluru', state: 'Karnataka', latitude: 12.9781, longitude: 77.5696, zone: 'SWR', platforms: 10 },
  SMVB: { code: 'SMVB', name: 'Sir M. Visvesvaraya Terminal', city: 'Bengaluru', state: 'Karnataka', latitude: 13.0068, longitude: 77.6534, zone: 'SWR', platforms: 7 },
  YPR: { code: 'YPR', name: 'Yesvantpur Junction', city: 'Bengaluru', state: 'Karnataka', latitude: 13.0247, longitude: 77.5501, zone: 'SWR', platforms: 6 },
  MAS: { code: 'MAS', name: 'MGR Chennai Central', city: 'Chennai', state: 'Tamil Nadu', latitude: 13.0827, longitude: 80.2755, zone: 'SR', platforms: 17 },
  MS: { code: 'MS', name: 'Chennai Egmore', city: 'Chennai', state: 'Tamil Nadu', latitude: 13.0802, longitude: 80.2612, zone: 'SR', platforms: 11 },
  CBE: { code: 'CBE', name: 'Coimbatore Junction', city: 'Coimbatore', state: 'Tamil Nadu', latitude: 11.0016, longitude: 76.9667, zone: 'SR', platforms: 6 },
  SC: { code: 'SC', name: 'Secunderabad Junction', city: 'Hyderabad', state: 'Telangana', latitude: 17.4344, longitude: 78.5015, zone: 'SCR', platforms: 10 },
  HYB: { code: 'HYB', name: 'Hyderabad Deccan (Nampally)', city: 'Hyderabad', state: 'Telangana', latitude: 17.3922, longitude: 78.4716, zone: 'SCR', platforms: 6 },

  // Odisha & Bihar
  BBS: { code: 'BBS', name: 'Bhubaneswar Junction', city: 'Bhubaneswar', state: 'Odisha', latitude: 20.2644, longitude: 85.8400, zone: 'ECoR', platforms: 6 },
  PURI: { code: 'PURI', name: 'Puri Terminus', city: 'Puri', state: 'Odisha', latitude: 19.8135, longitude: 85.8312, zone: 'ECoR', platforms: 8 },
  PNBE: { code: 'PNBE', name: 'Patna Junction', city: 'Patna', state: 'Bihar', latitude: 25.6022, longitude: 85.1376, zone: 'ECR', platforms: 10 },
  GAYA: { code: 'GAYA', name: 'Gaya Junction', city: 'Gaya', state: 'Bihar', latitude: 24.7955, longitude: 84.9995, zone: 'ECR', platforms: 9 },
  DHN: { code: 'DHN', name: 'Dhanbad Junction', city: 'Dhanbad', state: 'Jharkhand', latitude: 23.7915, longitude: 86.4385, zone: 'ECR', platforms: 8 },
};

/**
 * Calculates the Haversine great-circle distance between two geographic coordinates in kilometers.
 */
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Finds the nearest railway station to a given GPS coordinate.
 */
export function findNearestStation(
  latitude: number,
  longitude: number
): { station: StationGeo; distanceKm: number; walkingEtaMinutes: number } {
  let closest: StationGeo = STATION_COORDINATES.NDLS;
  let minDistance = Number.MAX_VALUE;

  for (const code of Object.keys(STATION_COORDINATES)) {
    const s = STATION_COORDINATES[code];
    const dist = haversineDistanceKm(latitude, longitude, s.latitude, s.longitude);
    if (dist < minDistance) {
      minDistance = dist;
      closest = s;
    }
  }

  // Assuming pedestrian walking speed of 4.5 km/h (~75 m/min)
  const walkingEtaMinutes = Math.max(1, Math.round((minDistance / 4.5) * 60));

  return {
    station: closest,
    distanceKm: minDistance,
    walkingEtaMinutes,
  };
}
