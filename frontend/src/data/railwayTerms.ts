/**
 * ═══════════════════════════════════════════════════════════════
 * NIRANTAR EXPLAIN — Railway Knowledge Dictionary
 * ═══════════════════════════════════════════════════════════════
 *
 * Central verified dictionary of Indian Railways terminology & Nirantar features.
 * Every definition is hardcoded and deterministic (zero LLM latency).
 *
 * Progressive disclosure levels:
 *   Level 1 (instant)   → short + simple
 *   Level 2 (context)   → why_it_matters + example
 *   Level 3 (advanced)  → how_it_works
 */

export type TermCategory =
  | 'reservation'
  | 'status'
  | 'coach'
  | 'prediction'
  | 'berth'
  | 'quota'
  | 'payment'
  | 'safety'
  | 'service';

export interface RailwayTerm {
  id: string;
  short: string;
  simple: string;
  why_it_matters: string;
  example: string;
  how_it_works: string;
  category: TermCategory;
  relatedTerms?: string[];
}

export const RAILWAY_TERMS: Record<string, RailwayTerm> = {
  CNF: {
    id: 'CNF',
    short: 'Confirmed',
    simple: 'Your seat is guaranteed. You have a specific coach and berth number.',
    why_it_matters: 'A confirmed ticket means you will definitely travel with full boarding peace of mind.',
    example: 'CNF / S5 / 36 / LB means Confirmed in Coach S5, Berth 36, Lower Berth.',
    how_it_works: 'When you book and seats are available in the quota, the system immediately assigns you a coach and berth number. This status does not change unless you cancel.',
    category: 'reservation',
    relatedTerms: ['RAC', 'WL', 'Coach'],
  },

  RAC: {
    id: 'RAC',
    short: 'Reservation Against Cancellation',
    simple: 'You can board the train legally and share a berth with another RAC passenger until a full berth opens.',
    why_it_matters: 'RAC guarantees your right to board the train. As confirmed travelers cancel, RAC tickets get promoted to full confirmed berths.',
    example: 'RAC 3 means you are 3rd in the queue. Two RAC passengers share one side-lower berth initially.',
    how_it_works: 'RAC is a buffer between confirmed and waitlisted. Indian Railways keeps a fixed number of RAC berths (usually side-lower berths). As confirmed passengers cancel, RAC passengers get promoted to full confirmed berths. RAC passengers can always board the train.',
    category: 'reservation',
    relatedTerms: ['CNF', 'WL', 'GNWL'],
  },

  WL: {
    id: 'WL',
    short: 'Wait List',
    simple: 'You are in a queue waiting for a seat. Your ticket is not yet confirmed.',
    why_it_matters: 'A lower WL number means you are closer to getting a seat. If not confirmed before chart preparation, fully waitlisted e-tickets are auto-refunded.',
    example: 'WL 14 means 14 people are ahead of you in the waiting queue.',
    how_it_works: 'When all seats and RAC berths are sold, additional bookings go into the waitlist. As passengers cancel confirmed or RAC tickets, waitlisted passengers move up. If your WL is not cleared by chart preparation (4 hours before departure), the ticket is automatically cancelled and refunded.',
    category: 'reservation',
    relatedTerms: ['GNWL', 'RLWL', 'PQWL', 'RAC', 'CNF'],
  },

  GNWL: {
    id: 'GNWL',
    short: 'General Wait List',
    simple: 'You are waiting for a seat in the general reservation queue — the most common waitlist type.',
    why_it_matters: 'GNWL has the highest confirmation rate because general quota is the largest seat pool on any train.',
    example: 'GNWL 6 means 6 positions are currently ahead of you in the general queue.',
    how_it_works: 'GNWL is allocated for passengers booking from the originating station to a distant station. Cancellations from confirmed passengers in this quota directly benefit GNWL holders.',
    category: 'quota',
    relatedTerms: ['WL', 'RLWL', 'PQWL', 'TQWL'],
  },

  RLWL: {
    id: 'RLWL',
    short: 'Remote Location Wait List',
    simple: 'You are waitlisted against the intermediate station quota for journeys starting or ending at smaller stations.',
    why_it_matters: 'RLWL has a smaller quota pool than GNWL, so confirmation chances are typically lower.',
    example: 'RLWL 4 means 4 passengers are ahead of you in the remote location queue.',
    how_it_works: 'RLWL is for passengers boarding or alighting at intermediate stations (not the train\'s origin or destination). Each intermediate station gets a small fixed quota.',
    category: 'quota',
    relatedTerms: ['GNWL', 'PQWL', 'WL'],
  },

  PQWL: {
    id: 'PQWL',
    short: 'Pooled Quota Wait List',
    simple: 'You are waitlisted against the pooled (shared) quota for intermediate-to-intermediate journeys.',
    why_it_matters: 'PQWL has the smallest quota pool and the lowest confirmation probability among waitlist types.',
    example: 'PQWL 2 means 2 passengers are ahead of you in the pooled quota queue.',
    how_it_works: 'PQWL applies when both your boarding and destination are intermediate stations. The pooled quota is shared across multiple such station pairs.',
    category: 'quota',
    relatedTerms: ['GNWL', 'RLWL', 'WL'],
  },

  TQWL: {
    id: 'TQWL',
    short: 'Tatkal Quota Wait List',
    simple: 'You are waitlisted in the Tatkal (emergency/last-minute) booking quota.',
    why_it_matters: 'Tatkal WL rarely confirms because the Tatkal quota is very small and opens only 24 hours before departure.',
    example: 'TQWL 3 means 3 passengers are ahead of you in the Tatkal waitlist.',
    how_it_works: 'Tatkal quota opens at 10:00 AM (AC) or 11:00 AM (Non-AC) one day before departure. Once Tatkal seats are sold, additional bookings go to TQWL.',
    category: 'quota',
    relatedTerms: ['GNWL', 'WL', 'TATKAL'],
  },

  SL: {
    id: 'SL',
    short: 'Sleeper Class',
    simple: 'Non-AC sleeping coach with 3-tier berths. The most affordable overnight option.',
    why_it_matters: 'Sleeper is the most popular class — very affordable with 72 berths per coach.',
    example: 'A Sleeper coach has 9 bays of 8 berths each (6 in the bay + 2 side berths) = 72 berths per coach.',
    how_it_works: 'Sleeper coaches have open-layout 3-tier berths without air conditioning. Each bay has Lower Berth, Middle Berth, Upper Berth on both sides, plus Side Lower and Side Upper.',
    category: 'coach',
    relatedTerms: ['3A', '2A', '1A'],
  },

  '3A': {
    id: '3A',
    short: 'AC 3-Tier',
    simple: 'Air-conditioned sleeping coach with 3-tier berths and provided fresh bedding.',
    why_it_matters: '3A is the most popular AC class — air-conditioned with curtains, charging ports, and 64 berths per coach.',
    example: 'A 3A coach has 8 bays of 8 berths (6 in bay + 2 side) = 64 berths. Bedding is provided.',
    how_it_works: 'AC 3-Tier has the same berth layout as Sleeper but with air conditioning, curtains between bays, and provided bedding (pillow, blanket, sheet).',
    category: 'coach',
    relatedTerms: ['SL', '2A', '1A', '3E'],
  },

  '3E': {
    id: '3E',
    short: 'AC 3 Economy',
    simple: 'Modern air-conditioned 3-tier coach with economic fares, individual AC vents, and reading lights.',
    why_it_matters: '3E gives you full AC comfort at roughly 8-10% lower cost than standard 3A.',
    example: '3E coaches feature 83 berths with modular interiors and personal USB charging points.',
    how_it_works: 'Designed by Indian Railways to make AC travel affordable for everyone. Built with ergonomic lightweight berths.',
    category: 'coach',
    relatedTerms: ['3A', 'SL'],
  },

  '2A': {
    id: '2A',
    short: 'AC 2-Tier',
    simple: 'Air-conditioned sleeping coach with only 2-tier berths (no middle berth). More spacious and private.',
    why_it_matters: '2A has no middle berth — only lower and upper. More headroom, heavier curtains, and 46 berths per coach.',
    example: 'A 2A coach has bays of 4 berths plus side berths = 46 berths total.',
    how_it_works: 'AC 2-Tier eliminates the middle berth, giving significantly more headroom and personal space.',
    category: 'coach',
    relatedTerms: ['3A', '1A', 'SL'],
  },

  '1A': {
    id: '1A',
    short: 'AC First Class',
    simple: 'Premium air-conditioned coach with lockable private 2-berth or 4-berth cabins.',
    why_it_matters: '1A is the most luxurious and private class. Only 24 berths per coach in enclosed cabins.',
    example: 'A 1A coach has enclosed cabins: 4-berth cabins and 2-berth (coupe) cabins.',
    how_it_works: 'AC First Class has fully enclosed cabins with lockable doors, individual AC controls, mirror, and attendant call button.',
    category: 'coach',
    relatedTerms: ['2A', '3A'],
  },

  CC: {
    id: 'CC',
    short: 'AC Chair Car',
    simple: 'Air-conditioned seating coach for daytime travel with pushback reclining seats.',
    why_it_matters: 'Chair Car is used on Vande Bharat and Shatabdi trains for comfortable day journeys.',
    example: 'CC has 73 seats per coach arranged in 2+3 configuration with aircraft-style overhead racks.',
    how_it_works: 'Chair Car coaches feature reclining seats, individual AC louvers, reading lamps, and charging points.',
    category: 'coach',
    relatedTerms: ['EC', '2S'],
  },

  EC: {
    id: 'EC',
    short: 'Executive Chair Car',
    simple: 'Premium AC seating with wider 2+2 seats, extra legroom, and rotating seats on Vande Bharat.',
    why_it_matters: 'EC offers maximum day comfort with complimentary gourmet meal service included.',
    example: 'EC coaches on Vande Bharat feature 180° rotating seats and wide panoramic windows.',
    how_it_works: 'Executive Chair Car has 2+2 seating configuration with enhanced legroom and premium catering service.',
    category: 'coach',
    relatedTerms: ['CC', '1A'],
  },

  '2S': {
    id: '2S',
    short: 'Second Sitting (2S)',
    simple: 'Non-AC reserved bench seating coach for economical short-to-medium day journeys.',
    why_it_matters: '2S is the cheapest reserved travel option on day-running intercity express trains.',
    example: '2S coaches feature 108 cushioned bench seats in a 3+3 layout.',
    how_it_works: 'Second Sitting coaches are reserved so you get an assigned seat without unreserved rush.',
    category: 'coach',
    relatedTerms: ['CC', 'SL'],
  },

  LB: {
    id: 'LB',
    short: 'Lower Berth',
    simple: 'The bottom berth in the bay. Easy access, doubles as a seat during daytime.',
    why_it_matters: 'Lower berths are the most sought-after, especially for senior citizens, patients, and families.',
    example: 'Berth numbers 1, 4, 7, 10... are typically Lower Berths in each bay.',
    how_it_works: 'During daytime, the lower berth functions as a shared seat for all berth holders in that bay. At night, it converts to a sleeping berth.',
    category: 'berth',
    relatedTerms: ['MB', 'UB', 'SL_BERTH'],
  },

  MB: {
    id: 'MB',
    short: 'Middle Berth',
    simple: 'The middle berth — folds down from the wall at night in 3A and Sleeper coaches.',
    why_it_matters: 'Middle berth folds up during the day and is lowered for sleep between 10:00 PM and 6:00 AM.',
    example: 'Berth numbers 2, 5, 8, 11... are Middle Berths.',
    how_it_works: 'The middle berth is hinged to the wall and folded flat during daytime.',
    category: 'berth',
    relatedTerms: ['LB', 'UB'],
  },

  UB: {
    id: 'UB',
    short: 'Upper Berth',
    simple: 'The topmost berth in the bay. Available 24/7 for resting without daytime folding.',
    why_it_matters: 'Upper berth gives undisturbed private rest anytime, day or night.',
    example: 'Berth numbers 3, 6, 9, 12... are Upper Berths.',
    how_it_works: 'The upper berth is a fixed elevated platform reached via side ladders.',
    category: 'berth',
    relatedTerms: ['LB', 'MB', 'SU_BERTH'],
  },

  SL_BERTH: {
    id: 'SL_BERTH',
    short: 'Side Lower Berth',
    simple: 'The lower berth along the aisle corridor — converts into two facing window seats during the day.',
    why_it_matters: 'Side Lower is assigned for RAC passengers (shared as seats) or as confirmed single berths.',
    example: 'Berth numbers 7, 15, 23... are Side Lower berths.',
    how_it_works: 'Side berths run parallel to the train aisle, offering dedicated window views.',
    category: 'berth',
    relatedTerms: ['SU_BERTH', 'RAC', 'LB'],
  },

  SU_BERTH: {
    id: 'SU_BERTH',
    short: 'Side Upper Berth',
    simple: 'The upper berth along the aisle corridor with a private elevated window view.',
    why_it_matters: 'Side Upper is a fixed berth available all day with great privacy.',
    example: 'Berth numbers 8, 16, 24... are Side Upper berths.',
    how_it_works: 'Fixed upper berth along the aisle with independent lighting and charging points.',
    category: 'berth',
    relatedTerms: ['SL_BERTH', 'UB'],
  },

  CHART_PREPARED: {
    id: 'CHART_PREPARED',
    short: 'Chart Preparation',
    simple: 'The official passenger list is locked ~4 hours before train departure.',
    why_it_matters: 'Chart 1 finalises waitlist upgrades. Unconfirmed waitlisted e-tickets are auto-cancelled and 100% refunded.',
    example: 'Chart 1 is prepared 4 hours before departure; Chart 2 is generated 30 minutes before departure for last-minute vacancies.',
    how_it_works: 'Indian Railways locks the coach/berth chart and hands over the verified passenger list to the on-duty TTE.',
    category: 'status',
    relatedTerms: ['WL', 'RAC', 'CNF'],
  },

  CONFIRMATION_PROBABILITY: {
    id: 'CONFIRMATION_PROBABILITY',
    short: 'Confirmation Probability',
    simple: 'AI-estimated likelihood that your waitlisted ticket will become confirmed before departure.',
    why_it_matters: 'Helps you decide whether to hold your waitlist or book an alternative train without guesswork.',
    example: '88% High Probability means historically, 88 out of 100 tickets at this WL position cleared.',
    how_it_works: 'Calculated using historical cancellation trends, quota pool size, remaining days, and route demand.',
    category: 'prediction',
    relatedTerms: ['WL', 'GNWL', 'CHART_PREPARED'],
  },

  POSITIONS_CLEARED: {
    id: 'POSITIONS_CLEARED',
    short: 'Positions Cleared',
    simple: 'The number of waitlist positions that have moved forward since your booking.',
    why_it_matters: 'Shows real-time progress as cancellations bump your queue position toward confirmation.',
    example: 'Booked at WL 18 and currently at WL 6 = 12 positions cleared.',
    how_it_works: 'As confirmed travelers cancel, the system automatically advances RAC and WL queues.',
    category: 'prediction',
    relatedTerms: ['WL', 'GNWL', 'CONFIRMATION_PROBABILITY'],
  },

  PNR: {
    id: 'PNR',
    short: 'Passenger Name Record',
    simple: 'Your unique 10-digit ticket reference number for checking live status and platform info.',
    why_it_matters: 'PNR is the master key to your entire booking — status, coach, berth, passenger names, and refund ledger.',
    example: 'PNR 8429104821 — enter this on Nirantar to view instant status and e-ticket.',
    how_it_works: 'Generated automatically by Indian Railways CRIS database upon booking.',
    category: 'status',
    relatedTerms: ['CNF', 'RAC', 'WL', 'E_TICKET'],
  },

  TATKAL: {
    id: 'TATKAL',
    short: 'Tatkal Quota',
    simple: 'Emergency last-minute quota opening 24 hours prior to departure for urgent journeys.',
    why_it_matters: 'Your best option when regular tickets are sold out. Opens at 10:00 AM (AC) and 11:00 AM (Non-AC).',
    example: 'Tatkal booking for tomorrow\'s 4 PM train opens today at 10:00 AM for AC classes.',
    how_it_works: 'A dedicated quota of ~15% seats with dynamic surcharge. 0% refund on cancellation.',
    category: 'quota',
    relatedTerms: ['PREMIUM_TATKAL', 'GENERAL_QUOTA', 'TQWL'],
  },

  PREMIUM_TATKAL: {
    id: 'PREMIUM_TATKAL',
    short: 'Premium Tatkal',
    simple: 'Dynamic pricing quota for urgent bookings where ticket prices increase as seats sell.',
    why_it_matters: 'Available even when Tatkal is sold out, for passengers who need guaranteed seats regardless of price.',
    example: 'Fare starts at Tatkal rate and scales with real-time demand up to 3x base fare.',
    how_it_works: 'Dynamic algorithm adjusts fare dynamically based on remaining seat stock.',
    category: 'quota',
    relatedTerms: ['TATKAL', 'DYNAMIC_PRICING'],
  },

  GENERAL_QUOTA: {
    id: 'GENERAL_QUOTA',
    short: 'General (GN) Quota',
    simple: 'The primary reservation pool with the largest seat allocation and standard fares.',
    why_it_matters: 'Offers the best value and highest confirmation probability for advance bookings.',
    example: 'General quota opens up to 120 days in advance.',
    how_it_works: 'Default pool from which all standard bookings draw until exhausted.',
    category: 'quota',
    relatedTerms: ['GNWL', 'TATKAL'],
  },

  LADIES_QUOTA: {
    id: 'LADIES_QUOTA',
    short: 'Ladies Quota (LD)',
    simple: 'Dedicated seats reserved exclusively for solo women travelers or women traveling with children under 12.',
    why_it_matters: 'Provides safe, dedicated coach space with priority confirmation for female passengers.',
    example: '6 berths in Sleeper and 3A are reserved as Ladies Quota in most express trains.',
    how_it_works: 'Available during search by selecting the Ladies quota filter.',
    category: 'quota',
    relatedTerms: ['GENERAL_QUOTA', 'SENIOR_CITIZEN_QUOTA'],
  },

  SENIOR_CITIZEN_QUOTA: {
    id: 'SENIOR_CITIZEN_QUOTA',
    short: 'Senior Citizen Quota (SS)',
    simple: 'Reserved lower berths allocated for men aged 60+ and women aged 45+ traveling solo or in pairs.',
    why_it_matters: 'Ensures senior citizens receive guaranteed lower berths without having to climb ladders.',
    example: 'Select "Senior Citizen" in quota dropdown to prioritize lower berth allocation.',
    how_it_works: 'System validates age from profile and assigns dedicated lower berths.',
    category: 'quota',
    relatedTerms: ['LB', 'GENERAL_QUOTA'],
  },

  UPI: {
    id: 'UPI',
    short: 'Unified Payments Interface',
    simple: 'Instant 24x7 bank-to-bank payment system using QR code or UPI ID (Google Pay, PhonePe, Paytm).',
    why_it_matters: 'Fastest payment mode for train booking with near-zero failure rates and instant refunds.',
    example: 'Scan the QR code or approve the mandate on PhonePe / GPay in seconds.',
    how_it_works: 'Operated by NPCI, direct bank transfer without exposing card or CVV details.',
    category: 'payment',
    relatedTerms: ['CITIZEN_WALLET', 'DOUBLE_VERIFICATION', 'PAYMENT_LEDGER'],
  },

  CITIZEN_WALLET: {
    id: 'CITIZEN_WALLET',
    short: 'Nirantar Citizen Wallet',
    simple: 'Pre-funded instant digital balance (₹10,000 demo sandbox) for 1-click zero-delay ticket checkouts.',
    why_it_matters: 'Eliminates payment gateway timeouts and bank OTP delays, crucial for rush Tatkal bookings.',
    example: 'Pay ₹1,850 instantly with ₹10,000 Citizen Wallet balance with 100% success rate.',
    how_it_works: 'Direct ledger debit with zero intermediary bank dependencies.',
    category: 'payment',
    relatedTerms: ['UPI', 'PAYMENT_LEDGER', 'DOUBLE_VERIFICATION'],
  },

  DOUBLE_VERIFICATION: {
    id: 'DOUBLE_VERIFICATION',
    short: 'Double Verification Gate',
    simple: 'Two-point cryptographic check between bank ledger and IRCTC server to prevent ghost deductions.',
    why_it_matters: 'Ensures you are never charged twice if a gateway connection drops midway.',
    example: 'Validates bank transaction ID + railway PRS lock before finalizing state.',
    how_it_works: 'Performs dual handshake check. If either side fails, payment is held in escrow and safely reversed.',
    category: 'payment',
    relatedTerms: ['PAYMENT_LEDGER', 'GHOST_CHARGE', 'REFUND_AUDIT'],
  },

  PAYMENT_LEDGER: {
    id: 'PAYMENT_LEDGER',
    short: 'Payment Ledger',
    simple: 'An immutable transparent audit trail of all transactions, deductions, refunds, and bank status checks.',
    why_it_matters: 'You can verify every rupee spent and track real-time refund status with reference numbers.',
    example: 'Check Payment Ledger in Payments tab to view GST invoice and bank settlement IDs.',
    how_it_works: 'Logs double-entry cryptographic records for every ticket payment and refund transaction.',
    category: 'payment',
    relatedTerms: ['DOUBLE_VERIFICATION', 'REFUND_AUDIT', 'TDR'],
  },

  PAYMENT_BRIDGE: {
    id: 'PAYMENT_BRIDGE',
    short: 'Payment Bridge',
    simple: 'The secure gateway conduit connecting Nirantar\'s interface with official banking payment channels.',
    why_it_matters: 'Provides 256-bit encrypted checkout with automated fallback if one bank server is slow.',
    example: 'Multi-rail checkout supporting UPI, Cards, Net Banking, and Citizen Wallet.',
    how_it_works: 'Smart routing gateway that auto-selects the healthiest bank server.',
    category: 'payment',
    relatedTerms: ['UPI', 'DOUBLE_VERIFICATION'],
  },

  GHOST_CHARGE: {
    id: 'GHOST_CHARGE',
    short: 'Ghost Charge Prevention',
    simple: 'Safeguard ensuring money deducted during bank network drops is immediately tracked and auto-reversed.',
    why_it_matters: 'Protects passengers from duplicate deductions when connection drops during OTP entry.',
    example: 'If bank deducts but railway server fails, Nirantar\'s reconciliation engine issues an instant reversal.',
    how_it_works: 'Background heartbeat checks unmatched debits and triggers automated bank refund sweeps.',
    category: 'payment',
    relatedTerms: ['DOUBLE_VERIFICATION', 'REFUND_AUDIT'],
  },

  REFUND_AUDIT: {
    id: 'REFUND_AUDIT',
    short: 'Automated Refund Audit',
    simple: 'Real-time timeline tracking your refund from railway cancellation to arrival in your bank account.',
    why_it_matters: 'No guessing when your refund will arrive — displays ARN numbers and bank settlement stages.',
    example: 'Refund of ₹1,420 processed by IRCTC → Bank ARN: 8401928491 → Settled in 2 hours.',
    how_it_works: 'Integrates with payment switch webhooks to stream refund lifecycle events.',
    category: 'payment',
    relatedTerms: ['PAYMENT_LEDGER', 'CLERKAGE', 'TDR'],
  },

  TDR: {
    id: 'TDR',
    short: 'Ticket Deposit Receipt (TDR)',
    simple: 'An official refund claim filed when a train is delayed >3 hours, cancelled, or AC fails during journey.',
    why_it_matters: 'Enables you to get a full or partial refund under official railway rules even after chart preparation.',
    example: 'File TDR online for "Train Late More Than 3 Hours and Passenger Not Traveled".',
    how_it_works: 'Railway claims department verifies train telemetry logs and credits approved refunds directly.',
    category: 'service',
    relatedTerms: ['REFUND_AUDIT', 'CLERKAGE', 'PNR'],
  },

  CLERKAGE: {
    id: 'CLERKAGE',
    short: 'Clerkage Charge',
    simple: 'A nominal administrative deduction (₹60 per passenger + GST) applied when cancelling an RAC/WL ticket.',
    why_it_matters: 'You get 100% of your ticket fare back minus this small fixed ₹60 processing fee.',
    example: 'Cancelling a ₹680 RAC ticket returns ₹620 back to your original payment mode.',
    how_it_works: 'Standard fixed railway fee regulated by the Ministry of Railways.',
    category: 'payment',
    relatedTerms: ['REFUND_AUDIT', 'TDR'],
  },

  SAFE_AUTOFILL: {
    id: 'SAFE_AUTOFILL',
    short: 'Zero-PII Safe Autofill',
    simple: '1-click passenger details population that protects your sensitive data locally without cloud leaks.',
    why_it_matters: 'Fills passenger names, age, berth choices, and ID in 0.5s for fast booking while keeping data 100% private.',
    example: 'Click "Autofill Saved Profiles" to populate all 4 family members in 1 click.',
    how_it_works: 'Data is encrypted and stored strictly in your browser\'s local secure storage.',
    category: 'safety',
    relatedTerms: ['ZERO_PII', 'PII', 'FAIR_ACCESS_TOKEN'],
  },

  ZERO_PII: {
    id: 'ZERO_PII',
    short: 'Zero PII (Personally Identifiable Info)',
    simple: 'Privacy guarantee that your phone number, Aadhaar, and identity never touch public AI model prompts.',
    why_it_matters: 'Protects citizen privacy from model training, data scraping, and external logging.',
    example: 'Passenger names are masked with cryptographic tokens (e.g. Passenger_Alpha) before AI processing.',
    how_it_works: 'Local PII Redaction engine strips names and phone numbers before routing queries.',
    category: 'safety',
    relatedTerms: ['SAFE_AUTOFILL', 'PII'],
  },

  PII: {
    id: 'PII',
    short: 'Personally Identifiable Information',
    simple: 'Sensitive personal identifiers such as full name, phone number, date of birth, and identity numbers.',
    why_it_matters: 'Nirantar treats all PII with bank-grade local cryptographic isolation.',
    example: 'Phone numbers, Aadhaar tokens, and payment card numbers.',
    how_it_works: 'Protected with strict client-side encryption boundaries.',
    category: 'safety',
    relatedTerms: ['ZERO_PII', 'SAFE_AUTOFILL'],
  },

  FAIR_ACCESS_TOKEN: {
    id: 'FAIR_ACCESS_TOKEN',
    short: 'Fair-Access Anti-Bot Token',
    simple: 'Cryptographic proof ensuring tickets go to genuine citizens rather than automated scalper bot scripts.',
    why_it_matters: 'Guarantees equal access during high-rush Tatkal booking windows without abusive bot queues.',
    example: 'Validates human interaction timings and browser fingerprinting smoothly in background.',
    how_it_works: 'Emits zero-knowledge proof of genuine human interaction.',
    category: 'safety',
    relatedTerms: ['TATKAL', 'SAFE_AUTOFILL'],
  },

  GPS: {
    id: 'GPS',
    short: 'GPS Satellite Live Tracking',
    simple: 'Real-time satellite coordinates showing exactly where your train is located on the track right now.',
    why_it_matters: 'Never miss a train or wonder about delays — see live speed, upcoming stations, and delay estimates.',
    example: 'Train 12302 currently running at 114 km/h, 18 km before Kanpur Central, 4 mins ahead of schedule.',
    how_it_works: 'Connects to Indian Railways RTIS (Real-Time Train Information System) satellite transponders on locomotives.',
    category: 'status',
    relatedTerms: ['LIVE_STATUS', 'DELAY', 'PLATFORM_ALIGNMENT'],
  },

  LIVE_STATUS: {
    id: 'LIVE_STATUS',
    short: 'Live Running Status',
    simple: 'Current real-time train movement, last departed station, speed, and expected arrival times.',
    why_it_matters: 'Plan your station arrival time accurately without waiting on crowded platforms.',
    example: 'Departed Prayagraj on time, arriving New Delhi at Platform 8.',
    how_it_works: 'Aggregates GPS telemetry, signal block clearances, and station master updates.',
    category: 'status',
    relatedTerms: ['GPS', 'DELAY', 'PLATFORM'],
  },

  DELAY: {
    id: 'DELAY',
    short: 'Delay Estimator',
    simple: 'AI-calculated running delay based on current speed, track congestion, and scheduled halt times.',
    why_it_matters: 'Gives accurate projected arrival time instead of outdated schedule timestamps.',
    example: 'Running 12 minutes late due to signal regulation before junction.',
    how_it_works: 'Analyzes distance to destination, historical section speeds, and priority train clearances.',
    category: 'prediction',
    relatedTerms: ['LIVE_STATUS', 'GPS', 'ON_TIME'],
  },

  ON_TIME: {
    id: 'ON_TIME',
    short: 'Punctuality Score',
    simple: 'Historical percentage of trips where this train arrived within 15 minutes of scheduled time.',
    why_it_matters: 'Helps you pick reliable trains with minimal delay risk for tight connecting schedules.',
    example: '94% Punctuality Rating — historical average delay is under 6 minutes.',
    how_it_works: 'Compiled from the last 90 days of train telemetry on this exact route.',
    category: 'prediction',
    relatedTerms: ['DELAY', 'LIVE_STATUS'],
  },

  PLATFORM: {
    id: 'PLATFORM',
    short: 'Platform Number (PF / Plat)',
    simple: 'The specific track and boarding platform (abbreviated as PF or Plat) where your train halts.',
    why_it_matters: 'PF is the universal railway shortform for Platform. Knowing your PF number in advance lets you walk directly to your coach position.',
    example: 'PF 1 at New Delhi (NDLS), PF 4 at Kanpur Central (CNB).',
    how_it_works: 'Synchronized with station control room announcements and LED electronic display feeds.',
    category: 'coach',
    relatedTerms: ['PLATFORM_ALIGNMENT', 'COACH_POSITION'],
  },

  PLATFORM_ALIGNMENT: {
    id: 'PLATFORM_ALIGNMENT',
    short: 'Coach & Platform Alignment',
    simple: 'Exact position where your coach (e.g. B4 or S2) will stop along the physical platform.',
    why_it_matters: 'Stand exactly in front of your coach door before the train stops — no rushing through crowds.',
    example: 'Coach B4 will halt between Pillar 12 and 14 on Platform 4.',
    how_it_works: 'Calculated using standardized rake composition layout and platform marker sensors.',
    category: 'coach',
    relatedTerms: ['COACH_POSITION', 'RAKE_LAYOUT', 'PLATFORM'],
  },

  COACH_POSITION: {
    id: 'COACH_POSITION',
    short: 'Coach Position & Rake Layout',
    simple: 'The complete sequence of coaches in the train from locomotive engine to end brake van.',
    why_it_matters: 'Tells you if your coach is near the front, middle, or rear of the train.',
    example: 'ENG → GS → GS → S1 → S2 → B1 → B2 → B3 → B4 → A1 → H1 → GS → EOG',
    how_it_works: 'Matches the officially published rake layout of the train for that journey.',
    category: 'coach',
    relatedTerms: ['PLATFORM_ALIGNMENT', 'RAKE_LAYOUT', 'COACH'],
  },

  RAKE_LAYOUT: {
    id: 'RAKE_LAYOUT',
    short: 'Rake Composition',
    simple: 'The complete physical train composition (engine, power cars, sleeper coaches, AC coaches, pantry).',
    why_it_matters: 'Helps passengers locate pantry cars, luggage vans, and their specific compartment easily.',
    example: '22-coach LHB rake with 2 General, 6 Sleeper, 8 AC 3-Tier, 2 AC 2-Tier, 1 First AC, 1 Pantry.',
    how_it_works: 'Fixed configuration maintained by railway divisional mechanical workshops.',
    category: 'coach',
    relatedTerms: ['COACH_POSITION', 'COACH'],
  },

  COACH: {
    id: 'COACH',
    short: 'Railway Coach',
    simple: 'An individual passenger compartment car identified by codes like S1, B3, A1, H1, C2.',
    why_it_matters: 'Your coach code is printed on your ticket and displayed on electronic platform boards.',
    example: 'B3 = AC 3-Tier Coach #3. S5 = Sleeper Coach #5. A2 = AC 2-Tier Coach #2.',
    how_it_works: 'Standard Indian Railways nomenclature where prefix denotes class and number denotes coach order.',
    category: 'coach',
    relatedTerms: ['RAKE_LAYOUT', 'COACH_POSITION', 'SL', '3A', '2A', '1A'],
  },

  BERTH_PREFERENCE: {
    id: 'BERTH_PREFERENCE',
    short: 'Berth Preference',
    simple: 'Your preferred sleeping position (Lower, Middle, Upper, Side Lower, Side Upper) requested at booking.',
    why_it_matters: 'Indian Railways algorithm prioritizes your chosen preference based on remaining quota availability.',
    example: 'Selecting "Lower Berth" for senior citizens or "Side Upper" for solo travelers.',
    how_it_works: 'PRS seat allocation engine attempts exact match first, falling back to nearest available berth.',
    category: 'berth',
    relatedTerms: ['LB', 'MB', 'UB', 'SL_BERTH', 'SU_BERTH'],
  },

  AUTO_UPGRADATION: {
    id: 'AUTO_UPGRADATION',
    short: 'Auto Upgradation',
    simple: 'Free automatic promotion to a higher class (e.g. Sleeper to 3A, or 3A to 2A) if seats remain vacant.',
    why_it_matters: 'You get a higher luxury class for free without paying any additional fare difference.',
    example: 'Booked in 3A and upgraded to 2A at chart preparation at zero extra charge.',
    how_it_works: 'PRS automatically promotes confirmed passengers to fill empty higher-class berths to clear waitlists.',
    category: 'reservation',
    relatedTerms: ['3A', '2A', '1A', 'CHART_PREPARED'],
  },

  E_TICKET: {
    id: 'E_TICKET',
    short: 'Electronic Ticket (E-Ticket)',
    simple: 'The digital travel pass generated upon booking, containing QR code, PNR, passenger names, and coach/berth.',
    why_it_matters: 'Valid for boarding with any government ID (Aadhaar, Voter ID, Driving License) — no paper printout required.',
    example: 'Show your Nirantar digital ticket on your smartphone to the TTE on board.',
    how_it_works: 'Digitally verified against the official train chart by the onboard TTE handheld terminal.',
    category: 'status',
    relatedTerms: ['PNR', 'TTE', 'DIGILOCKER'],
  },

  IRCTC: {
    id: 'IRCTC',
    short: 'IRCTC Ticketing Service',
    simple: 'Indian Railway Catering and Tourism Corporation — the official government ticketing and catering portal.',
    why_it_matters: 'All train bookings across India are officially registered and issued through IRCTC PRS.',
    example: 'Enter your IRCTC User ID during booking for seamless official ticketing authorization.',
    how_it_works: 'Central government public sector enterprise managing online ticketing infrastructure.',
    category: 'service',
    relatedTerms: ['E_TICKET', 'PNR'],
  },

  TTE: {
    id: 'TTE',
    short: 'Travelling Ticket Examiner (TTE)',
    simple: 'The official railway ticket inspector on board who verifies passenger identity, tickets, and seat allocation.',
    why_it_matters: 'TTE helps RAC passengers get confirmed berths when vacancies arise and assists with onboard issues.',
    example: 'Show your digital e-ticket and Aadhaar/ID to the TTE when they visit your coach.',
    how_it_works: 'Carries an electronic Hand Held Terminal (HHT) synchronized in real-time with the PRS chart.',
    category: 'service',
    relatedTerms: ['E_TICKET', 'CHART_PREPARED', 'RAC'],
  },

  DIGILOCKER: {
    id: 'DIGILOCKER',
    short: 'DigiLocker Verified ID',
    simple: 'Government of India\'s secure cloud document wallet for verified Aadhaar, Driving License, and identity passes.',
    why_it_matters: 'Legally accepted across all Indian Railways trains for identity verification without physical cards.',
    example: 'Link DigiLocker to auto-verify passenger credentials and speed up checkouts.',
    how_it_works: 'Ministry of Electronics & IT initiative for authenticated electronic documents.',
    category: 'safety',
    relatedTerms: ['E_TICKET', 'SAFE_AUTOFILL'],
  },

  DYNAMIC_PRICING: {
    id: 'DYNAMIC_PRICING',
    short: 'Dynamic Pricing',
    simple: 'Fare structure where ticket prices scale upward in increments as remaining seat availability decreases.',
    why_it_matters: 'Used on Premium Tatkal and Suvidha trains — booking early guarantees the lowest base fare.',
    example: 'First 10% seats sell at base fare; each subsequent 10% slab increases fare by 10% up to 1.5x.',
    how_it_works: 'Automated slab adjustment triggered as seat inventory crosses threshold percentages.',
    category: 'payment',
    relatedTerms: ['PREMIUM_TATKAL', 'GENERAL_QUOTA'],
  },

  E_CATERING: {
    id: 'E_CATERING',
    short: 'E-Catering Seat Delivery',
    simple: 'Official service allowing you to order fresh hot food from popular restaurants delivered right to your train seat.',
    why_it_matters: 'Enjoy hygienic meals from Domino\'s, Haldiram\'s, Behrouz Biryani, etc. at intermediate stations.',
    example: 'Order food for delivery at Kanpur Central station delivered right to Coach B4 Seat 36.',
    how_it_works: 'Food delivery partners coordinate with train GPS to hand over packaged meals at your train window/door.',
    category: 'service',
    relatedTerms: ['LIVE_STATUS', 'GPS', 'PNR'],
  },

  SAFEASSIST: {
    id: 'SAFEASSIST',
    short: 'Nirantar SafeAssist',
    simple: 'Rule-based, high-speed assistance layer that decodes railway policies deterministically without AI hallucinations.',
    why_it_matters: 'Provides 100% accurate, verified answers to cancellation fees, baggage limits, and quota rules.',
    example: 'Instant lookup for "Can RAC board train?" or "What is Tatkal timing?".',
    how_it_works: 'Built with deterministic lookup trees and verified Indian Railways manual regulations.',
    category: 'service',
    relatedTerms: ['NIRA_AI', 'ZERO_PII'],
  },

  NIRA_AI: {
    id: 'NIRA_AI',
    short: 'Nira AI Assistant',
    simple: 'Your friendly conversational travel co-pilot that answers queries in voice and plain English 24x7.',
    why_it_matters: 'Assists with natural language search, step-by-step guidance, and jargon translation in plain English.',
    example: '"Find me the fastest train to Mumbai tomorrow evening under ₹2,000".',
    how_it_works: 'Advanced multi-modal assistant paired with Nirantar\'s real-time railway APIs and zero-PII privacy gate.',
    category: 'service',
    relatedTerms: ['SAFEASSIST', 'NATURAL_LANGUAGE'],
  },

  NATURAL_LANGUAGE: {
    id: 'NATURAL_LANGUAGE',
    short: 'Natural Language Search',
    simple: 'Type or speak normal everyday sentences instead of remembering station codes or rigid forms.',
    why_it_matters: 'Anyone can book trains effortlessly — type "Delhi to Kolkata day after tomorrow" and get ranked results.',
    example: '"Show morning trains with high confirmation chance".',
    how_it_works: 'AI entity extraction maps colloquial queries to station codes, dates, and quota classes.',
    category: 'service',
    relatedTerms: ['NIRA_AI', 'IRCTC'],
  },

  INTERMEDIATE_STATION: {
    id: 'INTERMEDIATE_STATION',
    short: 'Intermediate Station',
    simple: 'A scheduled stop along the route between the train\'s originating station and its final terminus.',
    why_it_matters: 'Intermediate stations have specific stop durations (2-15 mins) and dedicated remote quota pools.',
    example: 'Kanpur Central and Prayagraj are intermediate stations on the New Delhi to Howrah route.',
    how_it_works: 'Trains halt according to working timetable (WTT) schedules for passenger boarding and engine checks.',
    category: 'status',
    relatedTerms: ['RLWL', 'BOARDING_STATION', 'LIVE_STATUS'],
  },

  BOARDING_STATION: {
    id: 'BOARDING_STATION',
    short: 'Boarding Station',
    simple: 'The specific railway station where you plan to get on the train.',
    why_it_matters: 'You can change your boarding station online up to 4 hours before chart preparation without penalty.',
    example: 'Booking from Delhi (origin) but setting your boarding point as Ghaziabad.',
    how_it_works: 'Allows travelers to secure quota from originating station while boarding at a convenient halt.',
    category: 'reservation',
    relatedTerms: ['INTERMEDIATE_STATION', 'PNR'],
  },

  TRAVEL_INSURANCE: {
    id: 'TRAVEL_INSURANCE',
    short: 'Railway Travel Insurance',
    simple: 'Comprehensive travel accident coverage for just ₹0.45 per passenger during booking.',
    why_it_matters: 'Provides ₹10 Lakh compensation for accidental demise/disability and hospitalisation coverage.',
    example: 'Check the "Opt-in Travel Insurance (₹0.45)" checkbox during booking for peace of mind.',
    how_it_works: 'Administered in partnership with government-empanelled insurance underwriters.',
    category: 'safety',
    relatedTerms: ['SAFE_AUTOFILL', 'E_TICKET'],
  },

  RTIS: {
    id: 'RTIS',
    short: 'Real-Time Train Information System',
    simple: 'ISRO satellite transponder fitted on locomotive engines for sub-minute GPS location and speed tracking.',
    why_it_matters: 'Eliminates human manual entry errors and provides pinpoint continuous train coordinates even across remote zones.',
    example: 'Train #12951 transmits telemetry updates via NavIC / GPS every 30 seconds.',
    how_it_works: 'RTIS devices communicate directly with GSAT satellites to downlink exact latitude, longitude, and speed directly to Indian Railways National Train Enquiry System (NTES).',
    category: 'status',
    relatedTerms: ['WGS84', 'SATELLITE_STREAM', 'KAVACH'],
  },

  WGS84: {
    id: 'WGS84',
    short: 'WGS-84 Satellite Coordinate Datum',
    simple: 'The global geodetic standard coordinates (latitude/longitude) used for train and station location positioning.',
    why_it_matters: 'Ensures map markers, platform geometry, and live track routes align with sub-meter accuracy.',
    example: 'New Delhi Railway Station sits at coordinates 28.6427° N, 77.2201° E.',
    how_it_works: 'Ellipsoidal coordinate framework utilized by GPS, NavIC, and OpenStreetMap to render tracks without distortion.',
    category: 'status',
    relatedTerms: ['RTIS', 'GPS_TELEMETRY'],
  },

  SATELLITE_STREAM: {
    id: 'SATELLITE_STREAM',
    short: 'Live Satellite Telemetry Stream',
    simple: 'Continuous data downlink transmitting velocity, direction bearing, and timestamp directly from the locomotive.',
    why_it_matters: 'Enables real-time speedometers and dynamic station distance countdowns without lag.',
    example: 'Telemetry reports: 118 km/h, heading 145° SE, arriving at upcoming junction in 3m 45s.',
    how_it_works: 'Locomotive transmitters push packets to ISRO ground stations which feeds the railway live data API gateway.',
    category: 'status',
    relatedTerms: ['RTIS', 'SPEEDOMETER'],
  },

  SEAT_LOCK: {
    id: 'SEAT_LOCK',
    short: '10-Min Seat Inventory Lock',
    simple: 'Temporary guaranteed reservation freeze holding your selected berths while you complete passenger verification and payment.',
    why_it_matters: 'Prevents another traveler from snagging your seats while you are entering passenger names or OTP.',
    example: 'A 10:00 minute countdown clock secures your 3A berths in Coach B4 until payment checkout completes.',
    how_it_works: 'Nirantar locks the inventory slots in the reservation queue so no competing transaction can snatch your berths.',
    category: 'reservation',
    relatedTerms: ['CNF', 'FAIR_ACCESS_TOKEN'],
  },

  POISSON_CLEARANCE: {
    id: 'POISSON_CLEARANCE',
    short: 'Poisson Waitlist Clearance Algorithm',
    simple: 'Predictive statistical probability model calculating the exact mathematical likelihood of your waitlist ticket confirming.',
    why_it_matters: 'Gives you clear confidence (e.g. 94% High) so you know whether to wait or book a confirmed alternative train.',
    example: 'GNWL 14 shows 89% confirmation probability based on 5 years of cancellation patterns on this route.',
    how_it_works: 'Analyzes historical quota churn, seasonal holiday peaks, day-of-week trends, and emergency quota reallocation ratios.',
    category: 'prediction',
    relatedTerms: ['GNWL', 'WL', 'CONFIRMATION_PROBABILITY'],
  },

  SPEED_RESTRICTION: {
    id: 'SPEED_RESTRICTION',
    short: 'Speed Restriction (PSR/TSR)',
    simple: 'Track speed limit enforced by railway signaling due to curve geometry, bridge maintenance, or interlocking caution zones.',
    why_it_matters: 'Explains why a train suddenly slows down from 130 km/h to 60 km/h without any breakdown or failure.',
    example: 'Speed restricted to 62 km/h through the Yamuna bridge maintenance section.',
    how_it_works: 'Station masters and permanent way engineers issue caution orders to loco pilots for section safety.',
    category: 'status',
    relatedTerms: ['KAVACH', 'LOCO_PILOT'],
  },

  TATKAL_WINDOW: {
    id: 'TATKAL_WINDOW',
    short: 'Tatkal Booking Window',
    simple: 'The strictly timed daily quota window opening at 10:00 AM (AC) and 11:00 AM (Non-AC) for travel the next day.',
    why_it_matters: 'Last-minute travel lifesaver when all regular general quota tickets are completely sold out.',
    example: 'For a journey on 15th October, AC Tatkal opens at 10:00 AM sharp on 14th October.',
    how_it_works: 'High-speed booking session with premium charges. Nirantar autofills passenger data in 1 click to beat the rush.',
    category: 'quota',
    relatedTerms: ['TATKAL', 'PREMIUM_TATKAL'],
  },

  FOG_PASS: {
    id: 'FOG_PASS',
    short: 'FOG-PASS Navigation Unit',
    simple: 'GPS-guided onboard navigation unit that alerts train drivers to upcoming signals and level crossings in thick fog.',
    why_it_matters: 'Prevents severe winter train delays in North India by letting trains run safely up to 75 km/h even in zero visibility.',
    example: 'Audio alert 500 meters ahead: "Signal Approaching - Green".',
    how_it_works: 'Satellite coordinates of all signals are mapped in advance; the device beeps and announces as the train approaches.',
    category: 'safety',
    relatedTerms: ['KAVACH', 'LOCO_PILOT'],
  },

  KAVACH: {
    id: 'KAVACH',
    short: 'Kavach (Automatic Train Protection)',
    simple: "India's indigenous Automatic Train Protection system that automatically applies brakes if a driver passes a red signal.",
    why_it_matters: 'Zero collision technology — prevents head-on and rear-end collisions and enforces track speed restrictions automatically.',
    example: 'If two trains enter the same track section, Kavach halts both trains automatically without human intervention.',
    how_it_works: 'Radio Frequency Identification (RFID) tags on tracks and UHF radio between locomotives, stations, and towers monitor distance.',
    category: 'safety',
    relatedTerms: ['SPEED_RESTRICTION', 'RTIS'],
  },

  RAKE_FORMATION: {
    id: 'RAKE_FORMATION',
    short: 'Rake Formation & Composition',
    simple: 'The exact physical arrangement of all coaches in a train, from Engine (LOCO) to End-On-Generation (EOG) brake van.',
    why_it_matters: 'Know whether your coach (e.g. B4 or S2) is near the front, middle, or rear of the train before arrival.',
    example: 'LOCO ➔ EOG ➔ S1-S6 ➔ B1-B6 ➔ A1-A2 ➔ H1 ➔ Pantry ➔ EOG.',
    how_it_works: 'Managed by railway mechanical yard teams and verified against the electronic coach guidance system.',
    category: 'coach',
    relatedTerms: ['COACH_POSITION', 'RAKE_LAYOUT'],
  },

  BERTH_RADAR: {
    id: 'BERTH_RADAR',
    short: 'Nirantar Berth Radar',
    simple: 'Interactive 2D coach visualizer showing confirmed seats, vacant berths, and power socket locations in real-time.',
    why_it_matters: 'Choose the best berth (window view, charging plug, away from toilets) with total visual clarity.',
    example: 'Click Seat 36 to see: Lower Berth, window side, universal 220V plug, 4 berths away from washroom.',
    how_it_works: 'Parses live railway coach composition blueprints into an interactive SVG interactive seat matrix.',
    category: 'coach',
    relatedTerms: ['BERTH_PREFERENCE', 'RAKE_LAYOUT'],
  },

  SCATTERED_BERTH: {
    id: 'SCATTERED_BERTH',
    short: 'Scattered Berth Reallocation',
    simple: 'Intelligent seat grouping engine that detects family members split across different coaches and suggests swaps.',
    why_it_matters: 'Keeps families and traveling companions sitting together instead of separated 5 coaches apart.',
    example: 'Mom in B2 Seat 14 and Child in B5 Seat 58 ➔ Nirantar alerts you to an adjacent vacant berth in B2.',
    how_it_works: 'Scans real-time vacant berths before chart preparation to offer mutual swap requests to fellow travelers.',
    category: 'coach',
    relatedTerms: ['BERTH_RADAR', 'CNF'],
  },

  DYNAMIC_FARE: {
    id: 'DYNAMIC_FARE',
    short: 'Dynamic Flexi-Pricing',
    simple: 'Variable fare system in Rajdhani, Shatabdi, and Duronto trains where fares increase 10% for every 10% of seats sold.',
    why_it_matters: 'Booking early locks in the base fare before price increases reach up to 1.5x of the regular rate.',
    example: 'First 10% of seats sell at base fare ₹1,850; final 10% of seats sell at dynamic peak ₹2,775.',
    how_it_works: 'Algorithmic demand-based pricing implemented by Indian Railways to optimize revenue on high-demand routes.',
    category: 'payment',
    relatedTerms: ['DYNAMIC_PRICING', 'CITIZEN_WALLET'],
  },

  LOCO_PILOT: {
    id: 'LOCO_PILOT',
    short: 'Loco Pilot (Train Driver)',
    simple: 'The certified senior railway captain driving the locomotive, monitoring signals, speed, and safety.',
    why_it_matters: 'Ensures the safe and punctual transit of thousands of passengers across dynamic track conditions.',
    example: 'Assisted by an Assistant Loco Pilot (ALP) with continuous dead man vigilance controls.',
    how_it_works: 'Operates electric or diesel locomotives using cab signaling, throttle notches, and pneumatic air brakes.',
    category: 'service',
    relatedTerms: ['KAVACH', 'GUARD'],
  },

  GUARD: {
    id: 'GUARD',
    short: 'Train Guard / Manager',
    simple: 'The senior official in the rear brake van in charge of train safety, brake continuity, and departure clearance.',
    why_it_matters: 'A train cannot depart any platform until the Guard exchanges green flag/lamp signals with the Loco Pilot.',
    example: 'The Guard inspects rear tail lamps, monitors emergency brake pressure, and clears train departure.',
    how_it_works: 'Communicates with the loco pilot via VHF walkie-talkie and operates the emergency guard brake valve.',
    category: 'service',
    relatedTerms: ['LOCO_PILOT', 'STATION_MASTER'],
  },

  STATION_MASTER: {
    id: 'STATION_MASTER',
    short: 'Station Master (SM)',
    simple: 'The railway operational chief at each station directing train routes, platform allocations, and track signals.',
    why_it_matters: 'Decides which platform incoming trains receive and coordinates with division control to minimize delays.',
    example: 'Station Master sets route points for Train 12951 to enter Platform 3 via electronic interlocking.',
    how_it_works: 'Uses modern Electronic Interlocking (EI) panels and Panel Interlocking (PI) to switch tracks safely.',
    category: 'service',
    relatedTerms: ['PLATFORM', 'INTERMEDIATE_STATION'],
  },

  CRIS: {
    id: 'CRIS',
    short: 'Centre for Railway Information Systems',
    simple: 'The central information technology organization managing Indian Railways passenger reservation and freight networks.',
    why_it_matters: 'Powers the core backend PRS (Passenger Reservation System) and NTES systems.',
    example: 'All train PNR numbers and seat allocation databases are maintained inside CRIS server centers.',
    how_it_works: 'Autonomous society under the Ministry of Railways developing high-concurrency railway architectures.',
    category: 'service',
    relatedTerms: ['IRCTC', 'PNR'],
  },

  NAVIC: {
    id: 'NAVIC',
    short: 'NavIC Satellite System',
    simple: "India's independent regional satellite navigation system developed by ISRO for high-accuracy positioning.",
    why_it_matters: 'Provides sub-meter positioning accuracy for train engines across India without relying solely on foreign GPS.',
    example: 'ISRO NavIC constellation delivers uninterrupted location telemetry even in remote mountainous terrain.',
    how_it_works: '7 geostationary and geosynchronous satellites providing dual-frequency L5 and S-band precision signals.',
    category: 'status',
    relatedTerms: ['RTIS', 'GPS_TELEMETRY'],
  },

  SPEEDOMETER: {
    id: 'SPEEDOMETER',
    short: 'Live Speedometer',
    simple: 'Live digital velocity gauge measuring locomotive speed in kilometers per hour (km/h) via satellite transponders.',
    why_it_matters: 'Watch your train accelerate and cruise in real time as speed fluctuates smoothly with track geometry.',
    example: 'Speedometer reads: 118 km/h on green clear corridor.',
    how_it_works: 'Calculates Doppler shift and delta distance over time from continuous GPS/NavIC telemetry packets.',
    category: 'status',
    relatedTerms: ['SATELLITE_STREAM', 'RTIS'],
  },

  GPS_TELEMETRY: {
    id: 'GPS_TELEMETRY',
    short: 'GPS Telemetry Stream',
    simple: 'Real-time satellite data packet broadcasting coordinates, altitude, bearing, and timestamp.',
    why_it_matters: 'Enables live interactive tracking on maps and real-time station arrival countdowns.',
    example: 'Coordinates: 28.6427° N, 77.2201° E • Speed: 118 km/h • Heading: 145°.',
    how_it_works: 'Downlinks to railway cloud servers and is normalized into clean JSON for Nirantar users.',
    category: 'status',
    relatedTerms: ['RTIS', 'WGS84'],
  },

  DISTANCE_COUNTDOWN: {
    id: 'DISTANCE_COUNTDOWN',
    short: 'Distance Countdown',
    simple: 'Real-time kilometre decrement tracking exact remaining distance to the upcoming station halt.',
    why_it_matters: 'Know precisely how many kilometres remain before you need to gather your luggage for deboarding.',
    example: 'Decrements dynamically: 24.8 km ➔ 24.7 km ➔ 24.6 km to Raichur.',
    how_it_works: 'Computes great-circle haversine distance between current locomotive GPS coordinates and station geofence.',
    category: 'status',
    relatedTerms: ['SPEEDOMETER', 'GPS_TELEMETRY'],
  },

  VANDE_BHARAT: {
    id: 'VANDE_BHARAT',
    short: 'Vande Bharat Express',
    simple: "India's indigenous semi-high-speed electric train with 160 km/h operational capability.",
    why_it_matters: 'Fastest daytime connectivity in India with rotating seats, bio-vacuum toilets, and automatic doors.',
    example: 'Vande Bharat #20608 cuts travel time between Chennai and Mysuru to just 4 hours 45 minutes.',
    how_it_works: 'Distributed power traction under each alternate coach delivers rapid acceleration without a separate locomotive.',
    category: 'service',
    relatedTerms: ['SHATABDI', 'RAJDHANI'],
  },

  RAJDHANI: {
    id: 'RAJDHANI',
    short: 'Rajdhani Express',
    simple: 'Premium air-conditioned long-distance express connecting national capital New Delhi to state capitals.',
    why_it_matters: 'Highest priority right-of-way on Indian Railways tracks with complimentary gourmet meals and bedrolls.',
    example: 'Train #12302 Howrah Rajdhani connects New Delhi and Kolkata overnight in 17 hours.',
    how_it_works: 'Runs at maximum permissible speed (MPS) of 130-140 km/h with high-speed LHB German-designed coaches.',
    category: 'service',
    relatedTerms: ['SHATABDI', 'DURONTO'],
  },

  SHATABDI: {
    id: 'SHATABDI',
    short: 'Shatabdi Express',
    simple: 'Premium day-train express connecting major metro cities within a 4 to 8 hour distance with meals included.',
    why_it_matters: 'Fastest daytime executive journey with all-AC chair car seating and onboard meal service.',
    example: 'Bhopal Shatabdi #12002 was the first Indian train to touch 150 km/h on the Agra-Delhi corridor.',
    how_it_works: 'Turnaround day train returning to its origin station the very same evening.',
    category: 'service',
    relatedTerms: ['VANDE_BHARAT', 'RAJDHANI'],
  },

  DURONTO: {
    id: 'DURONTO',
    short: 'Duronto Express',
    simple: 'Non-stop point-to-point long-distance express connecting major cities with minimal technical halts.',
    why_it_matters: 'Travels between metro cities with the shortest travel time and fewer intermediate interruptions.',
    example: 'Train #12260 Sealdah Duronto runs non-stop overnight between New Delhi and Kolkata.',
    how_it_works: 'Stops only at operational halts for crew changes and water refilling, not for regular passenger boarding.',
    category: 'service',
    relatedTerms: ['RAJDHANI', 'GARIB_RATH'],
  },

  CONCOURSE: {
    id: 'CONCOURSE',
    short: 'Station Concourse Hall',
    simple: 'The central spacious public atrium of a railway station before reaching platform stairways.',
    why_it_matters: 'Houses ticket counters, waiting lounges, IRCTC food courts, and automated information display boards.',
    example: 'New Delhi Paharganj concourse features 40 ticketing counters and direct escalator access to Platform 1.',
    how_it_works: 'Acts as the primary pedestrian circulation hub distributing travelers smoothly across platforms.',
    category: 'service',
    relatedTerms: ['WAITING_HALL', 'FOOT_OVERBRIDGE'],
  },

  FOOT_OVERBRIDGE: {
    id: 'FOOT_OVERBRIDGE',
    short: 'Foot Overbridge (FOB)',
    simple: 'Elevated pedestrian pedestrian bridge connecting different platforms across railway tracks.',
    why_it_matters: 'Safe passage across active tracks equipped with ramps, lifts, and escalators for accessibility.',
    example: 'FOB #2 at Howrah connects Platforms 1 through 14 with wide luggage trolley ramps.',
    how_it_works: 'Spans multiple high-voltage 25kV overhead traction wires with safety protective mesh screens.',
    category: 'service',
    relatedTerms: ['CONCOURSE', 'PLATFORM'],
  },

  BIO_TOILET: {
    id: 'BIO_TOILET',
    short: 'IR-DRDO Bio-Toilet',
    simple: 'Eco-friendly onboard anaerobic bacterial toilet system that decomposes human waste inside sealed digestion tanks.',
    why_it_matters: 'Keeps railway tracks clean, prevents rail corrosion, and eliminates open track defecation completely.',
    example: 'All coaches in Indian Railways are 100% fitted with IR-DRDO bio-toilet digestion tanks.',
    how_it_works: 'Anaerobic bacteria break down waste into water and carbon dioxide, leaving zero solids discharged on tracks.',
    category: 'coach',
    relatedTerms: ['COACH_POSITION', 'SL'],
  },

  TRAVEL_CLASS: {
    id: 'TRAVEL_CLASS',
    short: 'Travel Class',
    simple: 'The specific coach comfort tier chosen for your journey (e.g. 1A, 2A, 3A, 3E, CC, or Sleeper).',
    why_it_matters: 'Determines berth availability, air-conditioning, bedding provision, and ticket fare.',
    example: 'Class 3A provides 3-tier AC berths with complimentary blankets and pillows.',
    how_it_works: 'Each class has segregated coach compartments and individual quota allocations in PRS.',
    category: 'coach',
    relatedTerms: ['3A', '2A', '1A', 'SL'],
  },

  DIRECT_EXPRESS: {
    id: 'DIRECT_EXPRESS',
    short: 'Direct Express Service',
    simple: 'A train service running non-stop or with minimal halts directly between two major cities without changing trains.',
    why_it_matters: 'Fastest travel time with zero hassle of luggage transfer or train switching.',
    example: 'Rajdhani and Duronto Express provide direct express connectivity between Delhi and Kolkata.',
    how_it_works: 'Operates with cleared track priority and green corridors across Indian Railways trunk routes.',
    category: 'service',
    relatedTerms: ['RAJDHANI', 'DURONTO'],
  },

  LOWER_BERTH_PRIORITY: {
    id: 'LOWER_BERTH_PRIORITY',
    short: 'Lower Berth Priority Allotment',
    simple: 'Automated IRCTC rule prioritizing ground-level lower berths for senior citizens (men 60+, women 45+) and pregnant women.',
    why_it_matters: 'Ensures elderly passengers travel comfortably without having to climb steep ladders to upper berths.',
    example: 'Checking "Senior Citizen Concession" automatically assigns Lower Berth in Coach B4.',
    how_it_works: 'PRS algorithms reserve a dedicated sub-quota of lower berths specifically for eligible travelers.',
    category: 'berth',
    relatedTerms: ['LB', 'SENIOR_CITIZEN_QUOTA'],
  },

  CONVENIENCE_FEE: {
    id: 'CONVENIENCE_FEE',
    short: 'IRCTC Convenience Fee',
    simple: 'Nominal online ticketing fee charged per e-ticket (₹15 for Non-AC, ₹30 for AC, or ₹0 with Citizen Wallet).',
    why_it_matters: 'Supports the 24x7 CRIS server infrastructure and digital payment gateways.',
    example: 'Free (₹0) when paying via Nirantar Citizen Wallet or direct bank UPI.',
    how_it_works: 'Statutory charge levied by IRCTC under Ministry of Railways guidelines for online ticket issuance.',
    category: 'payment',
    relatedTerms: ['CITIZEN_WALLET', 'UPI'],
  },

  PASSENGER_DETAILS: {
    id: 'PASSENGER_DETAILS',
    short: 'Passenger Manifest Details',
    simple: 'Official traveler data including full name (as per Govt ID), age, gender, berth preference, and concession type.',
    why_it_matters: 'Must match your valid government identity proof (Aadhaar/PAN/Voter ID) exactly for ticket validity.',
    example: 'Pratay Karali, Age 25, Male, Berth Preference: Lower Berth.',
    how_it_works: 'Entered into the railway reservation chart (manifest) and verified onboard by the TTE.',
    category: 'reservation',
    relatedTerms: ['ZERO_PII', 'SAFEASSIST', 'DIGILOCKER'],
  },

  FARE_SUMMARY: {
    id: 'FARE_SUMMARY',
    short: 'Transparent Fare Breakdown',
    simple: 'Itemized receipt showing base train fare, reservation charge, superfast surcharge, GST, and travel insurance.',
    why_it_matters: '100% transparency with zero hidden agent markups or surprise checkout fees.',
    example: 'Base Fare: ₹1,958 + Convenience Fee: ₹0 + Safe Insurance: Included = Total ₹1,958.',
    how_it_works: 'Calculated directly from the official Indian Railways distance-based telescopic fare tables.',
    category: 'payment',
    relatedTerms: ['DYNAMIC_FARE', 'PAYMENT_LEDGER'],
  },

  SAFE_TRAVEL_INSURANCE: {
    id: 'SAFE_TRAVEL_INSURANCE',
    short: 'Safe Travel Insurance',
    simple: 'Comprehensive accidental death and disability coverage of ₹10 Lakh for just ₹0.45 per traveler.',
    why_it_matters: 'Essential travel protection covering hospitalisation and accidental emergency care.',
    example: 'Included automatically on your booking confirmation for full travel peace of mind.',
    how_it_works: 'Underwritten by national insurance partners with claims filed directly against your PNR.',
    category: 'safety',
    relatedTerms: ['TRAVEL_INSURANCE', 'E_TICKET'],
  },
};

/** Lookup a railway term by ID (case-insensitive). */
export function getRailwayTerm(termId: string): RailwayTerm | undefined {
  if (!termId) return undefined;
  const normalized = termId.toUpperCase().replace(/[\s-]/g, '_');
  return (
    RAILWAY_TERMS[normalized] ||
    RAILWAY_TERMS[termId] ||
    Object.values(RAILWAY_TERMS).find(
      (t) =>
        t.id.toLowerCase() === termId.toLowerCase() ||
        t.short.toLowerCase() === termId.toLowerCase()
    )
  );
}

/** Get all terms in a category. */
export function getTermsByCategory(category: TermCategory): RailwayTerm[] {
  return Object.values(RAILWAY_TERMS).filter((t) => t.category === category);
}

/** Search terms by keyword across all fields. */
export function searchTerms(query: string): RailwayTerm[] {
  const lower = query.toLowerCase();
  return Object.values(RAILWAY_TERMS).filter(
    (t) =>
      t.id.toLowerCase().includes(lower) ||
      t.short.toLowerCase().includes(lower) ||
      t.simple.toLowerCase().includes(lower)
  );
}

/** Finds a railway term matching a query text or acronym. */
export function findRailwayTerm(queryText: string): RailwayTerm | undefined {
  if (!queryText) return undefined;
  const q = queryText.trim().toLowerCase();

  // 1. Direct ID / short lookup
  const direct = getRailwayTerm(queryText);
  if (direct) return direct;

  // 2. Scan all terms to see if the phrase mentions this term's id or short name
  const allTerms = Object.values(RAILWAY_TERMS);
  for (const t of allTerms) {
    const idRegex = new RegExp(`\\b${t.id.replace(/_/g, '[\\s_]?')}\\b`, 'i');
    const shortRegex = new RegExp(`\\b${t.short.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
    if (idRegex.test(q) || shortRegex.test(q)) {
      return t;
    }
  }

  // 3. Fallback search
  const matches = searchTerms(queryText);
  return matches.length > 0 ? matches[0] : undefined;
}
