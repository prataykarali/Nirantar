/**
 * ═══════════════════════════════════════════════════════════════
 * NIRANTAR EXPLAIN — Railway Knowledge Dictionary
 * ═══════════════════════════════════════════════════════════════
 *
 * Central verified dictionary of Indian Railways terminology.
 * Every definition is hardcoded and deterministic (zero LLM).
 *
 * Each term has 3 progressive disclosure levels:
 *   Level 1 (instant)   → short + simple
 *   Level 2 (context)   → why_it_matters + example
 *   Level 3 (advanced)  → how_it_works
 */

export type TermCategory = 'reservation' | 'status' | 'coach' | 'prediction' | 'berth' | 'quota';

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
    why_it_matters: 'A confirmed ticket means you will definitely travel. No uncertainty.',
    example: 'CNF / S5 / 36 / LB means Confirmed in Coach S5, Berth 36, Lower Berth.',
    how_it_works: 'When you book and seats are available in the quota, the system immediately assigns you a coach and berth number. This status does not change unless you cancel.',
    category: 'reservation',
    relatedTerms: ['RAC', 'WL', 'Coach'],
  },

  RAC: {
    id: 'RAC',
    short: 'Reservation Against Cancellation',
    simple: 'You can board the train but share a berth with another RAC passenger until a full berth opens.',
    why_it_matters: 'RAC is much better than waitlist — you are guaranteed to travel. You just might share a side-lower berth initially.',
    example: 'RAC 3 means you are 3rd in the RAC queue. Two RAC passengers share one side-lower berth.',
    how_it_works: 'RAC is a buffer between confirmed and waitlisted. Indian Railways keeps a fixed number of RAC berths (usually side-lower berths). As confirmed passengers cancel, RAC passengers get promoted to full confirmed berths. RAC passengers can always board the train.',
    category: 'reservation',
    relatedTerms: ['CNF', 'WL', 'GNWL'],
  },

  WL: {
    id: 'WL',
    short: 'Wait List',
    simple: 'You are in a queue waiting for a seat. Your ticket is not yet confirmed.',
    why_it_matters: 'A lower WL number means you are closer to getting a seat. If your ticket is not confirmed before chart preparation, it gets auto-cancelled.',
    example: 'WL 14 means 14 people are ahead of you in the waiting queue.',
    how_it_works: 'When all seats and RAC berths are sold, additional bookings go into the waitlist. As passengers cancel confirmed or RAC tickets, waitlisted passengers move up. The system processes cancellations continuously. If your WL is not cleared by chart preparation (4 hours before departure), the ticket is automatically cancelled and refunded.',
    category: 'reservation',
    relatedTerms: ['GNWL', 'RLWL', 'PQWL', 'RAC', 'CNF'],
  },

  GNWL: {
    id: 'GNWL',
    short: 'General Wait List',
    simple: 'You are waiting for a seat in the general reservation queue — the most common waitlist type.',
    why_it_matters: 'GNWL has the highest confirmation rate because general quota is the largest pool. A lower number means you are closer to confirmation.',
    example: 'GNWL 6 means 6 positions are currently ahead of you in the general queue.',
    how_it_works: 'GNWL is allocated for passengers booking from the originating station to a distant station. It draws from the General Quota — the largest seat pool on any train. Cancellations from confirmed passengers in this quota directly benefit GNWL holders. Historically, GNWL up to 2x the total seats often confirms on popular routes.',
    category: 'quota',
    relatedTerms: ['WL', 'RLWL', 'PQWL', 'TQWL'],
  },

  RLWL: {
    id: 'RLWL',
    short: 'Remote Location Wait List',
    simple: 'You are waitlisted against the intermediate station quota — for journeys starting or ending at smaller stations.',
    why_it_matters: 'RLWL has a smaller quota pool than GNWL, so confirmation chances are typically lower.',
    example: 'RLWL 4 means 4 passengers are ahead of you in the remote location queue.',
    how_it_works: 'RLWL is for passengers boarding or alighting at intermediate stations (not the train\'s origin or destination). Each intermediate station gets a small fixed quota. Cancellations within that station\'s quota benefit RLWL holders. After chart preparation, unused GNWL quota can sometimes spill into RLWL.',
    category: 'quota',
    relatedTerms: ['GNWL', 'PQWL', 'WL'],
  },

  PQWL: {
    id: 'PQWL',
    short: 'Pooled Quota Wait List',
    simple: 'You are waitlisted against the pooled (shared) quota for intermediate-to-intermediate journeys.',
    why_it_matters: 'PQWL has the smallest quota pool and the lowest confirmation probability among waitlist types.',
    example: 'PQWL 2 means 2 passengers are ahead of you in the pooled quota queue.',
    how_it_works: 'PQWL applies when both your boarding and destination are intermediate stations. The pooled quota is shared across multiple such station pairs, making the effective quota very small. Confirmation depends on cancellations within this pool.',
    category: 'quota',
    relatedTerms: ['GNWL', 'RLWL', 'WL'],
  },

  TQWL: {
    id: 'TQWL',
    short: 'Tatkal Quota Wait List',
    simple: 'You are waitlisted in the Tatkal (emergency/last-minute) booking quota.',
    why_it_matters: 'Tatkal WL rarely confirms because the Tatkal quota is very small and opens only 24 hours before departure.',
    example: 'TQWL 3 means 3 passengers are ahead of you in the Tatkal waitlist.',
    how_it_works: 'Tatkal quota opens at 10:00 AM one day before departure. It has a very limited number of seats and higher fares. Once Tatkal seats are sold, additional bookings go to TQWL. These rarely confirm because cancellation charges are 100% for Tatkal.',
    category: 'quota',
    relatedTerms: ['GNWL', 'WL'],
  },

  SL: {
    id: 'SL',
    short: 'Sleeper Class',
    simple: 'Non-AC sleeping coach with 3-tier berths. Most affordable overnight option.',
    why_it_matters: 'Sleeper is the most popular class — very affordable but not air-conditioned. 72 berths per coach.',
    example: 'A Sleeper coach has 9 bays of 8 berths each (6 in the bay + 2 side berths) = 72 berths per coach.',
    how_it_works: 'Sleeper coaches have open-layout 3-tier berths without air conditioning. Each bay has Lower Berth (LB), Middle Berth (MB), Upper Berth (UB) on both sides, plus Side Lower (SL) and Side Upper (SU). Bedding is not provided. Windows have bars but no glass.',
    category: 'coach',
    relatedTerms: ['3A', '2A', '1A'],
  },

  '3A': {
    id: '3A',
    short: 'AC 3-Tier',
    simple: 'Air-conditioned sleeping coach with 3-tier berths. Good balance of comfort and price.',
    why_it_matters: '3A is the most popular AC class — air-conditioned with curtains for privacy. 64 berths per coach.',
    example: 'A 3A coach has 8 bays of 8 berths (6 in bay + 2 side) = 64 berths. Bedding is provided.',
    how_it_works: 'AC 3-Tier has the same berth layout as Sleeper but with air conditioning, curtains between bays, and provided bedding (pillow, blanket, sheet). Coaches are sealed with tinted windows. Charging points available.',
    category: 'coach',
    relatedTerms: ['SL', '2A', '1A'],
  },

  '2A': {
    id: '2A',
    short: 'AC 2-Tier',
    simple: 'Air-conditioned sleeping coach with only 2-tier berths. More spacious and private than 3A.',
    why_it_matters: '2A has no middle berth — only lower and upper. More headroom, heavier curtains, and 46 berths per coach.',
    example: 'A 2A coach has bays of 4 berths (LB + UB x 2 sides) plus side berths = 46 berths.',
    how_it_works: 'AC 2-Tier eliminates the middle berth, giving significantly more headroom and personal space. Each bay has 4 berths with full-length curtains. Side berths present. Considered the sweet spot between comfort and cost.',
    category: 'coach',
    relatedTerms: ['3A', '1A', 'SL'],
  },

  '1A': {
    id: '1A',
    short: 'AC First Class',
    simple: 'Premium air-conditioned coach with private 2-berth or 4-berth cabins with lockable doors.',
    why_it_matters: '1A is the most expensive and private class. Only 24 berths per coach in enclosed cabins.',
    example: 'A 1A coach has 6 cabins: 4 four-berth cabins and 2 two-berth (coupe) cabins = 24 berths total.',
    how_it_works: 'AC First Class has fully enclosed cabins with lockable doors, individual AC controls, mirror, and personal attendant service. Rarely waitlisted because of very limited demand at premium pricing.',
    category: 'coach',
    relatedTerms: ['2A', '3A'],
  },

  CC: {
    id: 'CC',
    short: 'Chair Car (AC)',
    simple: 'Air-conditioned seating coach for daytime travel. No berths — reclining seats only.',
    why_it_matters: 'Chair Car is used on Shatabdi and Vande Bharat trains for short daytime journeys.',
    example: 'CC has 73 seats per coach arranged in 2+3 configuration with airline-style reclining.',
    how_it_works: 'Chair Car coaches have pushback reclining seats, individual AC vents, reading lights, and charging points. Used exclusively on day trains. Catering is usually included in the fare on Shatabdi/Vande Bharat.',
    category: 'coach',
    relatedTerms: ['EC', '2A'],
  },

  EC: {
    id: 'EC',
    short: 'Executive Chair Car',
    simple: 'Premium AC seating with wider seats in 2+2 layout. Available on Vande Bharat and Shatabdi.',
    why_it_matters: 'EC has more legroom and wider seats than CC. Only ~56 seats per coach. Premium catering included.',
    example: 'EC coaches on Vande Bharat have rotating seats, entertainment screens, and complimentary meals.',
    how_it_works: 'Executive Chair Car is the premium day-travel class with 2+2 seating. Seats have more recline, wider armrests, and additional legroom. Full meal service included.',
    category: 'coach',
    relatedTerms: ['CC', '1A'],
  },

  LB: {
    id: 'LB',
    short: 'Lower Berth',
    simple: 'The bottom berth in the bay. Most preferred — easy access, doubles as a seat during the day.',
    why_it_matters: 'Lower berths are the most sought-after, especially for senior citizens and families.',
    example: 'Berth numbers 1, 4, 7, 10... are typically Lower Berths in each bay.',
    how_it_works: 'During daytime, the lower berth functions as a shared seat for all berth holders in that bay. At night, the lower berth passenger can fold it flat for sleeping. Senior citizens (60+) get lower berth preference.',
    category: 'berth',
    relatedTerms: ['MB', 'UB'],
  },

  MB: {
    id: 'MB',
    short: 'Middle Berth',
    simple: 'The middle berth — folds down from the wall at night. Only in 3A and Sleeper.',
    why_it_matters: 'Middle berth has the least headroom and can only be used after 9 PM. No middle berth in 2A/1A.',
    example: 'Berth numbers 2, 5, 8, 11... are Middle Berths.',
    how_it_works: 'The middle berth is a hinged platform that folds against the wall during daytime. At night (after 9 PM), it is pulled down and locked. MB passengers must sit on the lower berth during daytime. Only exists in 3-tier coaches (3A, SL).',
    category: 'berth',
    relatedTerms: ['LB', 'UB'],
  },

  UB: {
    id: 'UB',
    short: 'Upper Berth',
    simple: 'The topmost berth in the bay. Available 24/7 but requires climbing.',
    why_it_matters: 'Upper berth is always available for lying down — day or night. Best for passengers who want to rest anytime.',
    example: 'Berth numbers 3, 6, 9, 12... are Upper Berths.',
    how_it_works: 'The upper berth is a fixed platform at the top of each bay. Unlike lower and middle berths, it is not shared during daytime. Requires climbing. Slightly cooler in AC coaches due to AC vent positioning.',
    category: 'berth',
    relatedTerms: ['LB', 'MB'],
  },

  SL_BERTH: {
    id: 'SL_BERTH',
    short: 'Side Lower Berth',
    simple: 'The lower berth on the side of the aisle — shorter length, converts to seats during the day.',
    why_it_matters: 'Side Lower is used for RAC passengers (two share one SL). It faces the corridor and has less privacy.',
    example: 'Berth 7, 15, 23... are Side Lower. RAC 1/2 means two passengers share berth 7.',
    how_it_works: 'Side berths run perpendicular to the main bays, along the corridor. For RAC passengers, two people are assigned one Side Lower — they share it as seats and take turns sleeping.',
    category: 'berth',
    relatedTerms: ['SU', 'RAC', 'LB'],
  },

  SU_BERTH: {
    id: 'SU_BERTH',
    short: 'Side Upper Berth',
    simple: 'The upper berth on the side of the aisle. Fixed — available 24/7 but narrow.',
    why_it_matters: 'Side Upper is the narrowest berth. Not used for RAC — always confirmed or empty.',
    example: 'Berth 8, 16, 24... are Side Upper.',
    how_it_works: 'Side Upper is a fixed berth above the Side Lower, running along the corridor. Narrower than main berths. Always available for lying down.',
    category: 'berth',
    relatedTerms: ['SL_BERTH', 'UB'],
  },

  CHART_PREPARED: {
    id: 'CHART_PREPARED',
    short: 'Chart Preparation',
    simple: 'The final passenger list is locked. After this, no more waitlist movement — your status is final.',
    why_it_matters: 'Chart 1 is prepared ~4 hours before departure. Chart 2 (final) is ~30 minutes before. Un-confirmed WL tickets are auto-cancelled at Chart 1.',
    example: 'If your ticket is WL 3 at Chart 1, it may still confirm if 3+ cancellations happen before Chart 2.',
    how_it_works: 'Indian Railways prepares two charts:\n\nChart 1 (~4 hours before departure): First reservation chart. WL tickets not confirmed are auto-cancelled and refunded.\n\nChart 2 (~30 minutes before): Final chart incorporating last-minute cancellations. This is the definitive passenger list used by TTE on board.',
    category: 'status',
    relatedTerms: ['WL', 'RAC', 'CNF'],
  },

  CONFIRMATION_PROBABILITY: {
    id: 'CONFIRMATION_PROBABILITY',
    short: 'Estimated Confirmation Chance',
    simple: 'Nirantar\'s prediction of how likely your waitlisted ticket is to get confirmed before chart preparation.',
    why_it_matters: 'This helps you decide whether to wait or make alternative plans. Higher percentage = more likely to confirm.',
    example: '87% probability means historically, tickets at your WL position on this route confirmed 87 out of 100 times.',
    how_it_works: 'Nirantar estimates confirmation probability using: your WL position, historical cancellation patterns, days remaining, quota type, and season demand.\n\nDisclaimer: This is a Nirantar estimate, not an official Indian Railways guarantee.',
    category: 'prediction',
    relatedTerms: ['WL', 'GNWL', 'CHART_PREPARED'],
  },

  POSITIONS_CLEARED: {
    id: 'POSITIONS_CLEARED',
    short: 'Positions Cleared',
    simple: 'How many waitlist positions have been resolved since you booked — your queue is getting shorter.',
    why_it_matters: 'More positions cleared = faster movement toward confirmation.',
    example: 'If you booked at GNWL 12 and are now at GNWL 6, 6 positions have cleared.',
    how_it_works: 'Each time a confirmed passenger cancels, one waitlist position clears. RAC passengers get promoted to confirmed, and the first WL moves to RAC. The movement cascades.',
    category: 'prediction',
    relatedTerms: ['WL', 'GNWL', 'CONFIRMATION_PROBABILITY'],
  },

  PNR: {
    id: 'PNR',
    short: 'Passenger Name Record',
    simple: 'Your unique 10-digit booking reference number. Use it to check ticket status anytime.',
    why_it_matters: 'PNR is the single key to look up everything about your booking — status, passengers, coach, berth, and payment.',
    example: 'PNR 8429104821 — enter this on IRCTC or Nirantar to see your live booking status.',
    how_it_works: 'PNR is generated at the moment of booking and remains valid until the journey is complete or cancelled. The first digit indicates the zone. TTE on the train verifies your PNR against the chart.',
    category: 'status',
    relatedTerms: ['CNF', 'RAC', 'WL'],
  },

  TATKAL: {
    id: 'TATKAL',
    short: 'Tatkal (Emergency) Quota',
    simple: 'Last-minute booking window that opens 24 hours before departure with higher fares and limited seats.',
    why_it_matters: 'Tatkal is your only option for emergency travel. Fares are 30-50% higher. Cancellation gives 0% refund.',
    example: 'Tatkal opens at 10:00 AM, one day before departure. AC classes at 10:00 AM, SL at 11:00 AM.',
    how_it_works: 'Tatkal allocates ~10-15% of total seats for last-minute bookings. Higher dynamic surcharge applies. Cancellation charges are 100% (no refund). Very competitive — seats sell out in minutes on popular routes.',
    category: 'quota',
    relatedTerms: ['TQWL', 'GNWL'],
  },

  GENERAL_QUOTA: {
    id: 'GENERAL_QUOTA',
    short: 'General (GN) Quota',
    simple: 'The main reservation pool — largest number of seats available for regular advance bookings.',
    why_it_matters: 'GN quota has the most seats and the best confirmation odds.',
    example: 'On a train with 600 3A berths, ~480 might be in General Quota.',
    how_it_works: 'General Quota is the default reservation pool available for advance booking (up to 120 days). It has the largest seat allocation. After chart preparation, any unsold seats from other quotas may be released into GN.',
    category: 'quota',
    relatedTerms: ['GNWL', 'TATKAL'],
  },

  Coach: {
    id: 'Coach',
    short: 'Railway Coach/Compartment',
    simple: 'An individual railway car in the train. Each coach is identified by a code like S1, B2, A1, H1.',
    why_it_matters: 'Your coach number tells you exactly which car to board. Coaches are arranged in a specific order on the platform.',
    example: 'B4 = 4th AC 3-Tier coach. S1 = 1st Sleeper coach. A1 = 1st AC 2-Tier. H1 = AC First Class.',
    how_it_works: 'Indian Railways uses standard coach naming: S = Sleeper, B = AC 3-Tier, A = AC 2-Tier, H/HA = AC First Class, C = Chair Car, EC = Executive Chair Car, GS = General Sitting.',
    category: 'coach',
    relatedTerms: ['SL', '3A', '2A', '1A'],
  },
};

/** Lookup a railway term by ID (case-insensitive). */
export function getRailwayTerm(termId: string): RailwayTerm | undefined {
  const normalized = termId.toUpperCase().replace(/[\s-]/g, '_');
  return RAILWAY_TERMS[normalized] || RAILWAY_TERMS[termId] || Object.values(RAILWAY_TERMS).find(
    (t) => t.id.toLowerCase() === termId.toLowerCase() || t.short.toLowerCase() === termId.toLowerCase()
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
