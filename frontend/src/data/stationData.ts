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

export interface VerifiedHub {
  code: string;
  name: string;
  city: string;
  platforms: string;
  zone: 'north' | 'west' | 'east' | 'south' | 'central';
  state: string;
  tag?: string;
}

export const VERIFIED_PLATFORM_HUBS: VerifiedHub[] = [
  // North
  { code: 'NDLS', name: 'New Delhi', city: 'Delhi', platforms: 'Plat 1-16', zone: 'north', state: 'Delhi', tag: 'Capital Hub' },
  { code: 'DLI', name: 'Old Delhi', city: 'Delhi', platforms: 'Plat 1-16', zone: 'north', state: 'Delhi', tag: 'Historic' },
  { code: 'NZM', name: 'Hazrat Nizamuddin', city: 'Delhi', platforms: 'Plat 1-8', zone: 'north', state: 'Delhi', tag: 'Express Terminal' },
  { code: 'ANVT', name: 'Anand Vihar Terminus', city: 'Delhi', platforms: 'Plat 1-7', zone: 'north', state: 'Delhi' },
  { code: 'CDG', name: 'Chandigarh Junction', city: 'Chandigarh', platforms: 'Plat 1-6', zone: 'north', state: 'Chandigarh' },
  { code: 'ASR', name: 'Amritsar Junction', city: 'Amritsar', platforms: 'Plat 1-5', zone: 'north', state: 'Punjab' },
  { code: 'JAT', name: 'Jammu Tawi', city: 'Jammu', platforms: 'Plat 1-5', zone: 'north', state: 'Jammu & Kashmir' },
  { code: 'SVDK', name: 'SMVD Katra', city: 'Katra', platforms: 'Plat 1-5', zone: 'north', state: 'Jammu & Kashmir', tag: 'Pilgrimage' },
  { code: 'HW', name: 'Haridwar Junction', city: 'Haridwar', platforms: 'Plat 1-6', zone: 'north', state: 'Uttarakhand', tag: 'Ganga Ghats' },
  { code: 'DDN', name: 'Dehradun Terminus', city: 'Dehradun', platforms: 'Plat 1-5', zone: 'north', state: 'Uttarakhand' },
  { code: 'JP', name: 'Jaipur Junction', city: 'Jaipur', platforms: 'Plat 1-8', zone: 'north', state: 'Rajasthan', tag: 'Pink City' },
  { code: 'JU', name: 'Jodhpur Junction', city: 'Jodhpur', platforms: 'Plat 1-5', zone: 'north', state: 'Rajasthan' },
  { code: 'AII', name: 'Ajmer Junction', city: 'Ajmer', platforms: 'Plat 1-5', zone: 'north', state: 'Rajasthan' },
  { code: 'KOTA', name: 'Kota Junction', city: 'Kota', platforms: 'Plat 1-6', zone: 'north', state: 'Rajasthan' },
  { code: 'UDZ', name: 'Udaipur City', city: 'Udaipur', platforms: 'Plat 1-5', zone: 'north', state: 'Rajasthan', tag: 'Lake City' },
  { code: 'SML', name: 'Shimla Heritage', city: 'Shimla', platforms: 'Plat 1-2', zone: 'north', state: 'Himachal Pradesh', tag: 'UNESCO Toy Train' },
  { code: 'KLK', name: 'Kalka Junction', city: 'Kalka', platforms: 'Plat 1-4', zone: 'north', state: 'Haryana' },

  // Central (UP & MP)
  { code: 'CNB', name: 'Kanpur Central', city: 'Kanpur', platforms: 'Plat 1-10', zone: 'central', state: 'Uttar Pradesh', tag: 'Mega Junction' },
  { code: 'PRYJ', name: 'Prayagraj Junction', city: 'Prayagraj', platforms: 'Plat 1-10', zone: 'central', state: 'Uttar Pradesh', tag: 'Sangam Hub' },
  { code: 'BSB', name: 'Varanasi Junction', city: 'Varanasi', platforms: 'Plat 1-9', zone: 'central', state: 'Uttar Pradesh', tag: 'Kashi Hub' },
  { code: 'DDU', name: 'Pt. Deen Dayal Upadhyaya', city: 'Mughalsarai', platforms: 'Plat 1-8', zone: 'central', state: 'Uttar Pradesh', tag: 'Asia Largest Yard' },
  { code: 'LKO', name: 'Lucknow Charbagh', city: 'Lucknow', platforms: 'Plat 1-9', zone: 'central', state: 'Uttar Pradesh', tag: 'Heritage Palace' },
  { code: 'AGC', name: 'Agra Cantt', city: 'Agra', platforms: 'Plat 1-6', zone: 'central', state: 'Uttar Pradesh', tag: 'Taj Mahal City' },
  { code: 'GWL', name: 'Gwalior Junction', city: 'Gwalior', platforms: 'Plat 1-5', zone: 'central', state: 'Madhya Pradesh' },
  { code: 'JHS', name: 'V Lakshmibai Jhansi', city: 'Jhansi', platforms: 'Plat 1-7', zone: 'central', state: 'Uttar Pradesh' },
  { code: 'BPL', name: 'Bhopal Junction', city: 'Bhopal', platforms: 'Plat 1-6', zone: 'central', state: 'Madhya Pradesh' },
  { code: 'INDB', name: 'Indore Junction', city: 'Indore', platforms: 'Plat 1-6', zone: 'central', state: 'Madhya Pradesh', tag: 'Commercial Hub' },
  { code: 'UJN', name: 'Ujjain Junction', city: 'Ujjain', platforms: 'Plat 1-8', zone: 'central', state: 'Madhya Pradesh', tag: 'Mahakal Corridor' },
  { code: 'JBP', name: 'Jabalpur Junction', city: 'Jabalpur', platforms: 'Plat 1-6', zone: 'central', state: 'Madhya Pradesh' },
  { code: 'GKP', name: 'Gorakhpur Junction', city: 'Gorakhpur', platforms: 'Plat 1-10', zone: 'central', state: 'Uttar Pradesh', tag: 'World Longest PF' },

  // East & Northeast
  { code: 'HWH', name: 'Howrah Junction', city: 'Kolkata', platforms: 'Plat 1-23', zone: 'east', state: 'West Bengal', tag: '23 Platforms (Largest)' },
  { code: 'SDAH', name: 'Sealdah Terminus', city: 'Kolkata', platforms: 'Plat 1-21', zone: 'east', state: 'West Bengal', tag: '21 Platforms' },
  { code: 'KOAA', name: 'Kolkata Chitpur', city: 'Kolkata', platforms: 'Plat 1-5', zone: 'east', state: 'West Bengal' },
  { code: 'KGP', name: 'Kharagpur Junction', city: 'Kharagpur', platforms: 'Plat 1-12', zone: 'east', state: 'West Bengal', tag: '12 Platforms' },
  { code: 'NJP', name: 'New Jalpaiguri', city: 'Siliguri', platforms: 'Plat 1-5', zone: 'east', state: 'West Bengal', tag: 'Gateway to Northeast' },
  { code: 'MLDT', name: 'Malda Town', city: 'Malda', platforms: 'Plat 1-6', zone: 'east', state: 'West Bengal' },
  { code: 'DJ', name: 'Darjeeling Himalayan', city: 'Darjeeling', platforms: 'Plat 1-2', zone: 'east', state: 'West Bengal', tag: 'Toy Train' },
  { code: 'PNBE', name: 'Patna Junction', city: 'Patna', platforms: 'Plat 1-10', zone: 'east', state: 'Bihar', tag: 'State Capital' },
  { code: 'GAYA', name: 'Gaya Junction', city: 'Gaya', platforms: 'Plat 1-9', zone: 'east', state: 'Bihar', tag: 'Bodh Gaya' },
  { code: 'MFP', name: 'Muzaffarpur Junction', city: 'Muzaffarpur', platforms: 'Plat 1-5', zone: 'east', state: 'Bihar' },
  { code: 'DBG', name: 'Darbhanga Junction', city: 'Darbhanga', platforms: 'Plat 1-5', zone: 'east', state: 'Bihar' },
  { code: 'DHN', name: 'Dhanbad Junction', city: 'Dhanbad', platforms: 'Plat 1-8', zone: 'east', state: 'Jharkhand', tag: 'Coal Capital' },
  { code: 'RNC', name: 'Ranchi Junction', city: 'Ranchi', platforms: 'Plat 1-6', zone: 'east', state: 'Jharkhand' },
  { code: 'TATA', name: 'Tatanagar', city: 'Jamshedpur', platforms: 'Plat 1-5', zone: 'east', state: 'Jharkhand', tag: 'Steel City' },
  { code: 'BBS', name: 'Bhubaneswar', city: 'Bhubaneswar', platforms: 'Plat 1-6', zone: 'east', state: 'Odisha', tag: 'Temple City' },
  { code: 'PURI', name: 'Puri Terminus', city: 'Puri', platforms: 'Plat 1-8', zone: 'east', state: 'Odisha', tag: 'Jagannath Dham' },
  { code: 'GHY', name: 'Guwahati Junction', city: 'Guwahati', platforms: 'Plat 1-7', zone: 'east', state: 'Assam', tag: 'Northeast Hub' },

  // West
  { code: 'MMCT', name: 'Mumbai Central', city: 'Mumbai', platforms: 'Plat 1-8', zone: 'west', state: 'Maharashtra', tag: 'Western Hub' },
  { code: 'CSMT', name: 'Chhatrapati Shivaji Maharaj Terminus', city: 'Mumbai', platforms: 'Plat 1-18', zone: 'west', state: 'Maharashtra', tag: '18 Platforms (UNESCO)' },
  { code: 'BDTS', name: 'Bandra Terminus', city: 'Mumbai', platforms: 'Plat 1-7', zone: 'west', state: 'Maharashtra' },
  { code: 'LTT', name: 'Lokmanya Tilak Terminus', city: 'Mumbai', platforms: 'Plat 1-5', zone: 'west', state: 'Maharashtra' },
  { code: 'PUNE', name: 'Pune Junction', city: 'Pune', platforms: 'Plat 1-6', zone: 'west', state: 'Maharashtra', tag: 'IT & Cultural Hub' },
  { code: 'NGP', name: 'Nagpur Junction', city: 'Nagpur', platforms: 'Plat 1-8', zone: 'west', state: 'Maharashtra', tag: 'Diamond Crossing' },
  { code: 'BSL', name: 'Bhusawal Junction', city: 'Bhusawal', platforms: 'Plat 1-8', zone: 'west', state: 'Maharashtra' },
  { code: 'SUR', name: 'Solapur Junction', city: 'Solapur', platforms: 'Plat 1-5', zone: 'west', state: 'Maharashtra' },
  { code: 'ADI', name: 'Ahmedabad Junction', city: 'Ahmedabad', platforms: 'Plat 1-12', zone: 'west', state: 'Gujarat', tag: 'Kalupur 12 PFs' },
  { code: 'ST', name: 'Surat', city: 'Surat', platforms: 'Plat 1-6', zone: 'west', state: 'Gujarat', tag: 'Diamond City' },
  { code: 'BRC', name: 'Vadodara Junction', city: 'Vadodara', platforms: 'Plat 1-7', zone: 'west', state: 'Gujarat' },
  { code: 'RJT', name: 'Rajkot Junction', city: 'Rajkot', platforms: 'Plat 1-5', zone: 'west', state: 'Gujarat' },
  { code: 'MAO', name: 'Madgaon Junction', city: 'Goa', platforms: 'Plat 1-4', zone: 'west', state: 'Goa', tag: 'Konkan Gateway' },
  { code: 'R', name: 'Raipur Junction', city: 'Raipur', platforms: 'Plat 1-7', zone: 'west', state: 'Chhattisgarh' },
  { code: 'BSP', name: 'Bilaspur Junction', city: 'Bilaspur', platforms: 'Plat 1-8', zone: 'west', state: 'Chhattisgarh' },

  // South
  { code: 'SBC', name: 'KSR Bengaluru City', city: 'Bengaluru', platforms: 'Plat 1-10', zone: 'south', state: 'Karnataka', tag: 'Silicon Hub' },
  { code: 'YPR', name: 'Yesvantpur Junction', city: 'Bengaluru', platforms: 'Plat 1-6', zone: 'south', state: 'Karnataka' },
  { code: 'SMVB', name: 'SMVT Bengaluru', city: 'Bengaluru', platforms: 'Plat 1-7', zone: 'south', state: 'Karnataka', tag: 'Air-Conditioned' },
  { code: 'MAS', name: 'MGR Chennai Central', city: 'Chennai', platforms: 'Plat 1-12', zone: 'south', state: 'Tamil Nadu', tag: '12 Platforms' },
  { code: 'MS', name: 'Chennai Egmore', city: 'Chennai', platforms: 'Plat 1-11', zone: 'south', state: 'Tamil Nadu', tag: '11 Platforms' },
  { code: 'CBE', name: 'Coimbatore Junction', city: 'Coimbatore', platforms: 'Plat 1-6', zone: 'south', state: 'Tamil Nadu' },
  { code: 'MDU', name: 'Madurai Junction', city: 'Madurai', platforms: 'Plat 1-8', zone: 'south', state: 'Tamil Nadu', tag: 'Temple City' },
  { code: 'TPJ', name: 'Tiruchchirappalli Junction', city: 'Trichy', platforms: 'Plat 1-7', zone: 'south', state: 'Tamil Nadu' },
  { code: 'CAPE', name: 'Kanniyakumari', city: 'Kanyakumari', platforms: 'Plat 1-4', zone: 'south', state: 'Tamil Nadu', tag: 'Southernmost Point' },
  { code: 'HYB', name: 'Hyderabad Deccan', city: 'Hyderabad', platforms: 'Plat 1-6', zone: 'south', state: 'Telangana', tag: 'Nampally' },
  { code: 'SC', name: 'Secunderabad Junction', city: 'Hyderabad', platforms: 'Plat 1-10', zone: 'south', state: 'Telangana', tag: '10 Platforms' },
  { code: 'BZA', name: 'Vijayawada Junction', city: 'Vijayawada', platforms: 'Plat 1-10', zone: 'south', state: 'Andhra Pradesh', tag: 'Grand Junction' },
  { code: 'VSKP', name: 'Visakhapatnam Junction', city: 'Visakhapatnam', platforms: 'Plat 1-8', zone: 'south', state: 'Andhra Pradesh', tag: 'Coastal Hub' },
  { code: 'TPTY', name: 'Tirupati Main', city: 'Tirupati', platforms: 'Plat 1-5', zone: 'south', state: 'Andhra Pradesh', tag: 'Tirumala Balaji' },
  { code: 'TVC', name: 'Thiruvananthapuram Central', city: 'Thiruvananthapuram', platforms: 'Plat 1-5', zone: 'south', state: 'Kerala', tag: 'State Capital' },
  { code: 'ERS', name: 'Ernakulam Junction', city: 'Kochi', platforms: 'Plat 1-6', zone: 'south', state: 'Kerala', tag: 'Kochi South' },
  { code: 'CLT', name: 'Kozhikode (Calicut)', city: 'Kozhikode', platforms: 'Plat 1-4', zone: 'south', state: 'Kerala' },
  { code: 'CAN', name: 'Kannur', city: 'Kannur', platforms: 'Plat 1-3', zone: 'south', state: 'Kerala' },
];

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
