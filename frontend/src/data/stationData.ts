import rawData from './realTrainsData.json';

export interface Station {
  code: string;
  name: string;
  city: string;
  state: string;
  aliases: string[];
}

const BASE_STATIONS: Station[] = [
  { code: 'NDLS', name: 'New Delhi', city: 'Delhi', state: 'Delhi', aliases: ['NEW DELHI', 'DELHI', 'DLI', 'NZM', 'ANVT', 'HAZRAT NIZAMUDDIN', 'ANAND VIHAR', 'NDLS'] },
  { code: 'HWH', name: 'Howrah Junction', city: 'Kolkata', state: 'West Bengal', aliases: ['HOWRAH', 'KOLKATA', 'CALCUTTA', 'SDAH', 'SEALDAH', 'KOAA', 'SHM', 'HOWRAH JN', 'HWH', 'KOL'] },
  { code: 'CSMT', name: 'Chhatrapati Shivaji Maharaj Terminus', city: 'Mumbai', state: 'Maharashtra', aliases: ['MUMBAI', 'BOMBAY', 'BCT', 'MMCT', 'MUMBAI CENTRAL', 'CSMT', 'CSTM', 'LTT', 'BDTS', 'DADAR', 'DR', 'KYN', 'KALYAN'] },
  { code: 'SBC', name: 'KSR Bengaluru', city: 'Bengaluru', state: 'Karnataka', aliases: ['BANGALORE', 'BENGALURU', 'BANGALURU', 'YPR', 'YESVANTPUR', 'SMVB', 'SBC', 'KSR BENGALURU', 'BENGALURU CITY'] },
  { code: 'MAS', name: 'MGR Chennai Central', city: 'Chennai', state: 'Tamil Nadu', aliases: ['CHENNAI', 'MADRAS', 'MAS', 'MS', 'CHENNAI EGMORE'] },
  { code: 'DHN', name: 'Dhanbad Junction', city: 'Dhanbad', state: 'Jharkhand', aliases: ['DHANBAD', 'DHN', 'JHARIA'] },
  { code: 'CNB', name: 'Kanpur Central', city: 'Kanpur', state: 'Uttar Pradesh', aliases: ['KANPUR', 'CNB', 'KANPUR CENTRAL'] },
  { code: 'PRYJ', name: 'Prayagraj Junction', city: 'Prayagraj', state: 'Uttar Pradesh', aliases: ['PRAYAGRAJ', 'ALLAHABAD', 'ALD', 'PRYJ'] },
  { code: 'DDU', name: 'Pt. Deen Dayal Upadhyaya', city: 'Mughalsarai', state: 'Uttar Pradesh', aliases: ['MUGHALSARAI', 'MGS', 'DDU', 'DEEN DAYAL UPADHYAYA'] },
  { code: 'GAYA', name: 'Gaya Junction', city: 'Gaya', state: 'Bihar', aliases: ['GAYA', 'BODH GAYA'] },
  { code: 'PNBE', name: 'Patna Junction', city: 'Patna', state: 'Bihar', aliases: ['PATNA', 'PNBE', 'PATLIPUTRA', 'PPTA', 'DANAPUR', 'DNR'] },
  { code: 'BSB', name: 'Varanasi Junction', city: 'Varanasi', state: 'Uttar Pradesh', aliases: ['VARANASI', 'BANARAS', 'KASHI', 'BSB'] },
  { code: 'LKO', name: 'Lucknow Charbagh', city: 'Lucknow', state: 'Uttar Pradesh', aliases: ['LUCKNOW', 'LKO', 'LJN', 'CHARBAGH'] },
  { code: 'AGC', name: 'Agra Cantt', city: 'Agra', state: 'Uttar Pradesh', aliases: ['AGRA', 'AGC', 'AF', 'AGRA FORT'] },
  { code: 'GWL', name: 'Gwalior Junction', city: 'Gwalior', state: 'Madhya Pradesh', aliases: ['GWALIOR', 'GWL'] },
  { code: 'VGLJ', name: 'V Lakshmibai Jhansi', city: 'Jhansi', state: 'Uttar Pradesh', aliases: ['JHANSI', 'JHS', 'VGLJ', 'VIRANGANA LAKSHMIBAI'] },
  { code: 'BPL', name: 'Bhopal Junction', city: 'Bhopal', state: 'Madhya Pradesh', aliases: ['BHOPAL', 'BPL', 'HABIBGANJ', 'RKMP', 'RANI KAMALAPATI'] },
  { code: 'NGP', name: 'Nagpur Junction', city: 'Nagpur', state: 'Maharashtra', aliases: ['NAGPUR', 'NGP'] },
  { code: 'SC', name: 'Secunderabad Junction', city: 'Hyderabad', state: 'Telangana', aliases: ['HYDERABAD', 'SECUNDERABAD', 'SC', 'HYB', 'KACHEGUDA', 'KCG'] },
  { code: 'PUNE', name: 'Pune Junction', city: 'Pune', state: 'Maharashtra', aliases: ['PUNE', 'POONA', 'SVJR', 'SHIVAJINAGAR'] },
  { code: 'ADI', name: 'Ahmedabad Junction', city: 'Ahmedabad', state: 'Gujarat', aliases: ['AHMEDABAD', 'ADI', 'SABARMATI', 'SBT'] },
  { code: 'ST', name: 'Surat', city: 'Surat', state: 'Gujarat', aliases: ['SURAT', 'ST'] },
  { code: 'BRC', name: 'Vadodara Junction', city: 'Vadodara', state: 'Gujarat', aliases: ['VADODARA', 'BARODA', 'BRC'] },
  { code: 'KOTA', name: 'Kota Junction', city: 'Kota', state: 'Rajasthan', aliases: ['KOTA', 'KOTA JN'] },
  { code: 'JP', name: 'Jaipur Junction', city: 'Jaipur', state: 'Rajasthan', aliases: ['JAIPUR', 'JP'] },
  { code: 'PURI', name: 'Puri Terminus', city: 'Puri', state: 'Odisha', aliases: ['PURI', 'JAGANNATH PURI'] },
  { code: 'BBS', name: 'Bhubaneswar', city: 'Bhubaneswar', state: 'Odisha', aliases: ['BHUBANESWAR', 'BBS'] },
  { code: 'KGP', name: 'Kharagpur Junction', city: 'Kharagpur', state: 'West Bengal', aliases: ['KHARAGPUR', 'KGP'] },
  { code: 'NJP', name: 'New Jalpaiguri', city: 'Siliguri', state: 'West Bengal', aliases: ['SILIGURI', 'NEW JALPAIGURI', 'NJP', 'DARJEELING', 'JALPAIGURI', 'NEW JALPAIGURI JN', 'NORTH BENGAL'] },
  { code: 'CDG', name: 'Chandigarh Junction', city: 'Chandigarh', state: 'Chandigarh', aliases: ['CHANDIGARH', 'CDG', 'SHIMLA', 'KALKA', 'KLK'] },
  { code: 'JAT', name: 'Jammu Tawi', city: 'Jammu', state: 'Jammu and Kashmir', aliases: ['JAMMU', 'JAT', 'JAMMU TAWI', 'KASHMIR', 'SRINAGAR'] },
  { code: 'SVDK', name: 'SMVD Katra', city: 'Katra', state: 'Jammu and Kashmir', aliases: ['KATRA', 'SVDK', 'VAISHNO DEVI', 'KASHMIR'] },
  { code: 'HW', name: 'Haridwar', city: 'Haridwar', state: 'Uttarakhand', aliases: ['HARIDWAR', 'HW'] },
  { code: 'DDN', name: 'Dehradun', city: 'Dehradun', state: 'Uttarakhand', aliases: ['DEHRADUN', 'DDN', 'RISHIKESH', 'YNRK'] },
  { code: 'GZB', name: 'Ghaziabad Junction', city: 'Ghaziabad', state: 'Uttar Pradesh', aliases: ['GHAZIABAD', 'GZB'] },
  { code: 'MTJ', name: 'Mathura Junction', city: 'Mathura', state: 'Uttar Pradesh', aliases: ['MATHURA', 'MTJ', 'VRINDAVAN'] },
];

export const POPULAR_STATIONS: Station[] = (rawData.stations && (rawData.stations as Station[]).length > BASE_STATIONS.length)
  ? (rawData.stations as Station[])
  : BASE_STATIONS;

export function findStation(query: string): Station | null {
  if (!query || typeof query !== 'string') return null;
  const clean = query
    .trim()
    .toUpperCase()
    .replace(/^(?:FROM|TO|NEAR|STATION|JN|JUNCTION|CITY)\s+/i, '')
    .trim();

  if (!clean) return null;

  if (clean.length < 3) {
    return POPULAR_STATIONS.find((s) => s.code.toUpperCase() === clean) || null;
  }

  // 1. Direct code match
  const direct = POPULAR_STATIONS.find((s) => s.code.toUpperCase() === clean);
  if (direct) return direct;

  // 2. City or name exact match
  const exactName = POPULAR_STATIONS.find(
    (s) => s.city.toUpperCase() === clean || s.name.toUpperCase() === clean
  );
  if (exactName) return exactName;

  // 3. Exact alias match
  const exactAliasMatch = POPULAR_STATIONS.find((s) =>
    s.aliases && s.aliases.some((a) => a.toUpperCase() === clean)
  );
  if (exactAliasMatch) return exactAliasMatch;

  // 4. Word-boundary token matching (ensures short aliases like "RU" do not match inside "BANGALURU")
  const wordBoundaryMatch = POPULAR_STATIONS.find((s) => {
    // Check if city matches as a standalone word
    const cityUpper = s.city.toUpperCase();
    if (new RegExp(`\\b${cityUpper.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\b`, 'i').test(clean)) {
      return true;
    }
    // Check if station code matches as a standalone word
    const codeUpper = s.code.toUpperCase();
    if (new RegExp(`\\b${codeUpper.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\b`, 'i').test(clean)) {
      return true;
    }
    // Check if any alias matches as a standalone word (only for aliases of length >= 3 to prevent false positives)
    if (s.aliases) {
      for (const a of s.aliases) {
        const aUpper = a.toUpperCase();
        if (aUpper.length >= 3 && new RegExp(`\\b${aUpper.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\b`, 'i').test(clean)) {
          return true;
        }
      }
    }
    return false;
  });
  if (wordBoundaryMatch) return wordBoundaryMatch;

  // 5. Prefix / startsWith matching for queries of at least 3 characters
  const prefixMatch = POPULAR_STATIONS.find(
    (s) =>
      s.city.toUpperCase().startsWith(clean) ||
      s.name.toUpperCase().startsWith(clean) ||
      (s.aliases && s.aliases.some((a) => a.toUpperCase().startsWith(clean) && clean.length >= 3))
  );
  if (prefixMatch) return prefixMatch;

  return null;
}

export function searchStations(query: string, limit: number = 8): Station[] {
  if (!query || query.trim().length === 0) return POPULAR_STATIONS.slice(0, limit);
  const q = query.trim().toUpperCase();
  return POPULAR_STATIONS.filter(
    (s) =>
      s.code.includes(q) ||
      s.name.toUpperCase().includes(q) ||
      s.city.toUpperCase().includes(q) ||
      (s.aliases && s.aliases.some((a) => a.toUpperCase().includes(q)))
  ).slice(0, limit);
}
