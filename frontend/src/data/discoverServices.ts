export type DiscoverServiceId =
  | 'PNR_STATUS' | 'TATKAL_BOOKING' | 'TRAIN_STATUS' | 'PLATFORM_INFO' | 'SEAT_AVAILABILITY'
  | 'TICKET_CANCELLATION' | 'REFUND_STATUS' | 'TRAIN_BOOKING' | 'COACH_POSITION' | 'RAILWAY_COMPLAINT'
  | 'RAILWAY_TERMS' | 'FARE_ENQUIRY' | 'TDR' | 'FOOD_ON_TRAIN' | 'STATION_INFO';

export interface DiscoverService {
  id: DiscoverServiceId;
  name: string;
  icon: string;
  summary: string;
  needs: string;
  officialName: string;
  officialUrl: string;
  nirantarHelp: string;
  keywords: string[];
  internalRoute?: string;
}

const irctc = 'https://www.irctc.co.in/nget/train-search';
const enquiry = 'https://www.indianrail.gov.in/enquiry/PNR/PnrEnquiry.html?locale=en';
const ntes = 'https://enquiry.indianrail.gov.in/mntes/';
const railMadad = 'https://railmadad.indianrailways.gov.in/madad/final/home.jsp';

/** Curated, static registry. It deliberately makes no requests and does not infer facts. */
export const DISCOVER_SERVICES: DiscoverService[] = [
  { id: 'PNR_STATUS', name: 'PNR Status', icon: '🎫', summary: 'Check the current reservation status of a booked ticket.', needs: 'Your 10-digit PNR number', officialName: 'Indian Railways PNR Enquiry', officialUrl: enquiry, nirantarHelp: 'Explains CNF, RAC and waitlist status.', keywords: ['pnr', 'ticket confirm', 'reservation status', 'ticket status', 'confirm hua', 'mera pnr', 'pnr kaha', 'pnr check'], internalRoute: 'track' },
  { id: 'TATKAL_BOOKING', name: 'Tatkal Booking', icon: '⚡', summary: 'Book a last-minute ticket through the official booking service.', needs: 'Passenger details, train/class and journey date', officialName: 'IRCTC Train Booking', officialUrl: irctc, nirantarHelp: 'Explains Tatkal timings, quota and common rules.', keywords: ['tatkal', 'premium tatkal', 'emergency ticket', 'last minute ticket', 'tatkal kab', 'tatkal kaise'], internalRoute: 'help' },
  { id: 'TRAIN_STATUS', name: 'Train Running Status', icon: '🚆', summary: 'See a train’s running position, expected arrival and delay updates.', needs: 'Train number or train name', officialName: 'National Train Enquiry System', officialUrl: ntes, nirantarHelp: 'Opens Nirantar’s live train tracker.', keywords: ['train status', 'running status', 'train late', 'where is my train', 'delay', 'track train', 'train kitna late', 'gaadi kaha'], internalRoute: 'track' },
  { id: 'PLATFORM_INFO', name: 'Platform Information', icon: '📍', summary: 'Find the platform information published for a train at a station.', needs: 'Train number and station', officialName: 'National Train Enquiry System', officialUrl: ntes, nirantarHelp: 'Guides you to the live-tracker view.', keywords: ['platform', 'platform number', 'platform change', 'which platform', 'platform kaise', 'kaunsa platform'], internalRoute: 'track' },
  { id: 'SEAT_AVAILABILITY', name: 'Seat Availability', icon: '💺', summary: 'Check whether seats are available in a train and travel class.', needs: 'Route, date, class and quota', officialName: 'IRCTC Train Booking', officialUrl: irctc, nirantarHelp: 'Helps compare available train options.', keywords: ['seat availability', 'available seat', 'berth available', 'seat available', 'availability'], internalRoute: 'discover' },
  { id: 'TICKET_CANCELLATION', name: 'Ticket Cancellation', icon: '↩️', summary: 'Cancel an eligible e-ticket through the official booking service.', needs: 'The booking you want to cancel', officialName: 'IRCTC Booked Ticket History', officialUrl: irctc, nirantarHelp: 'Explains cancellation rules before you continue.', keywords: ['cancel ticket', 'ticket cancel', 'cancellation', 'ticket cancel kaise'], internalRoute: 'payments' },
  { id: 'REFUND_STATUS', name: 'Refund Information', icon: '💰', summary: 'Understand a refund or check the relevant cancellation process.', needs: 'Booking details, if you have them', officialName: 'IRCTC', officialUrl: irctc, nirantarHelp: 'Explains common refund and cancellation terms.', keywords: ['refund', 'money back', 'refund status', 'refund amount'], internalRoute: 'payments' },
  { id: 'TRAIN_BOOKING', name: 'Train Booking', icon: '🗓️', summary: 'Search trains and complete a new railway booking.', needs: 'From/to stations, travel date and passenger details', officialName: 'IRCTC Train Booking', officialUrl: irctc, nirantarHelp: 'Searches and compares journeys inside Nirantar.', keywords: ['book train', 'book ticket', 'train booking', 'find train', 'search train'], internalRoute: 'discover' },
  { id: 'COACH_POSITION', name: 'Coach Position', icon: '🚉', summary: 'Find coach-position guidance for boarding at the station.', needs: 'Train number and boarding station', officialName: 'National Train Enquiry System', officialUrl: ntes, nirantarHelp: 'Explains coach and berth labels.', keywords: ['coach position', 'coach number', 'where is coach', 'bogie position'], internalRoute: 'track' },
  { id: 'RAILWAY_COMPLAINT', name: 'Railway Complaint', icon: '🚨', summary: 'Report a railway service issue through the official grievance service.', needs: 'Journey details and a clear description of the problem', officialName: 'RailMadad', officialUrl: railMadad, nirantarHelp: 'Helps identify the right issue category.', keywords: ['complaint', 'complain', 'report problem', 'service issue', 'lost item'], internalRoute: 'help' },
  { id: 'RAILWAY_TERMS', name: 'Railway Terms', icon: '📚', summary: 'Understand common ticket, quota and coach terminology.', needs: 'The term you want explained', officialName: 'Nirantar Guidance', officialUrl: '#', nirantarHelp: 'Shows plain-English definitions directly in Nirantar.', keywords: ['rac', 'wl', 'waitlist', 'cnf', 'gnwl', 'quota', 'what does', 'meaning'], internalRoute: 'help' },
  { id: 'FARE_ENQUIRY', name: 'Fare Enquiry', icon: '₹', summary: 'Check an estimated fare for a chosen journey and class.', needs: 'Route, date and travel class', officialName: 'IRCTC Train Booking', officialUrl: irctc, nirantarHelp: 'Lets you compare train options first.', keywords: ['fare', 'ticket price', 'how much ticket', 'price'], internalRoute: 'discover' },
  { id: 'TDR', name: 'TDR / Claim', icon: '📝', summary: 'Find guidance for a Ticket Deposit Receipt claim.', needs: 'PNR and the reason for your claim', officialName: 'IRCTC', officialUrl: irctc, nirantarHelp: 'Explains what TDR means and when it may apply.', keywords: ['tdr', 'ticket deposit receipt', 'claim refund'], internalRoute: 'help' },
  { id: 'FOOD_ON_TRAIN', name: 'Food on Train', icon: '🍱', summary: 'Order available meals for an eligible train journey.', needs: 'PNR or train and journey details', officialName: 'IRCTC eCatering', officialUrl: 'https://www.ecatering.irctc.co.in/', nirantarHelp: 'Explains the food-ordering option.', keywords: ['food', 'meal', 'catering', 'order food'], internalRoute: 'help' },
  { id: 'STATION_INFO', name: 'Station Information', icon: '🏛️', summary: 'Find station-related train and platform information.', needs: 'Station name or code', officialName: 'National Train Enquiry System', officialUrl: ntes, nirantarHelp: 'Helps find station codes and route details.', keywords: ['station info', 'station code', 'station facilities'], internalRoute: 'discover' },
];
