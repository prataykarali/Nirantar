/**
 * Deterministic Nira reply engine.  It uses weighted phrase matching, token
 * overlap, route-number extraction, and a stable hash for varied wording.
 * It makes no network request and never calls an LLM.
 */
type Rule = { terms: string[]; reply: string[] };

const RULES: Rule[] = [
  { terms: ['book', 'booking', 'reserve', 'ticket', 'seat', 'passenger', 'coach', 'class'], reply: [
    'To book, search your origin and destination, compare the listed trains, choose a class, then continue through passenger details and payment. I can also help you use the Step-by-Step Guide at any point.',
    'Start with a route such as “Delhi to Mumbai tomorrow for 2”. I will help you compare the available trains, then the booking screen keeps your selected train, class, and passenger count together.'
  ] },
  { terms: ['find', 'search', 'route', 'from', 'to', 'train between', 'cheapest', 'fastest', 'compare'], reply: [
    'Use Discover or the home search bar to enter two stations. Results can be sorted by price, duration, departure time, and comfort, so choose the trade-off that matters most for this journey.',
    'For route planning, give me origin, destination, date, passenger count, and whether you prefer the lowest fare, shortest trip, or an AC coach. The comparison cards make those choices visible before booking.'
  ] },
  { terms: ['track', 'tracking', 'live', 'where is', 'running', 'delay', 'platform', 'gps', 'train number'], reply: [
    'Open Track and enter a five-digit train number. The live-radar view shows its running state, next stop, platform cue, door side, and delay indicator in this demo.',
    'For tracking, type a train number such as 12302. The Track page is the quickest place to see the train timeline, next station, platform information, and current delay status.'
  ] },
  { terms: ['payment', 'pay', 'wallet', 'upi', 'card', 'refund', 'failed', 'money', 'charged'], reply: [
    'Payments are handled on the Payments screen. If a payment fails or times out, return there to review the saved booking state and retry only after checking the displayed status.',
    'Use the payment step after selecting passengers. The demo wallet and payment recovery screens explain the result clearly, while My Journeys keeps your booked trip details available.'
  ] },
  { terms: ['journey', 'my journeys', 'ticket', 'pnr', 'invoice', 'cancel', 'cancellation', 'resume'], reply: [
    'My Journeys is where you can review booked trips, ticket details, invoices, and a paused booking. If you leave mid-flow, use Resume Booking to continue from the saved step.',
    'Open My Journeys to revisit a ticket or resume a paused plan. Cancellation and booking-history guidance is available there alongside the trip timeline.'
  ] },
  { terms: ['guide', 'walkthrough', 'tour', 'spotlight', 'stuck', 'how do i', 'help me', 'screen'], reply: [
    'Choose Step-by-Step Guide or the “I’m Stuck” button for an on-screen walkthrough. It highlights the next control, explains the current step, and lets you continue at your pace.',
    'The Page Guide is built for this: it explains the current screen and points to the next action. You can stop it anytime and return to Home, Discover, Track, Payments, or My Journeys.'
  ] },
  { terms: ['voice', 'speak', 'microphone', 'audio', 'mute', 'language'], reply: [
    'Use the microphone button to dictate a route or train number, and the Speak button to hear an answer. Mute is available in the chat header if you prefer text only.',
    'Voice input works best with a simple request such as “track 12302” or “Delhi to Mumbai tomorrow”. You can always type the same request in the chat field.'
  ] },
  { terms: ['tatkal', 'chart', 'luggage', 'baggage', 'senior', 'boarding', 'food', 'catering', 'rule'], reply: [
    'For railway rules, use Help Center for the current demo guidance on Tatkal, charting, cancellation, luggage, boarding changes, and passenger assistance. For an official journey decision, verify time-sensitive rules with Indian Railways.',
    'Help Center groups railway guidance by topic. Tell me whether you mean Tatkal, cancellation, luggage, charting, boarding, or catering and I will point you to the relevant flow.'
  ] },
  { terms: ['discover', 'home', 'settings', 'profile', 'help center', 'navigation', 'page'], reply: [
    'Home starts a journey, Discover compares routes, Track follows a train, My Journeys stores trip progress, Payments handles checkout, Help Center explains features, and Settings controls preferences.',
    'You can navigate with the left sidebar: Home for a quick search, Discover for comparisons, My Journeys for tickets, Track for status, Payments for checkout, and Help Center for guidance.'
  ] },
  { terms: ['hello', 'hi', 'hey', 'what can you do', 'who are you'], reply: [
    'I am Nira, the Nirantar journey guide. I can explain every screen, help plan and compare trains, open booking guidance, track a train number, explain payments, and help you resume a journey.',
    'Ask me about any Nirantar feature: route search, train comparison, booking, passenger details, live tracking, payments, My Journeys, voice controls, Page Guide, or Help Center.'
  ] },
];

function words(value: string) {
  return value.toLowerCase().match(/[a-z0-9]+/g) || [];
}

function stableIndex(value: string, length: number) {
  let hash = 2166136261;
  for (const character of value) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return (hash >>> 0) % length;
}

export function deterministicNiraReply(query: string, context = ''): string {
  const normalized = ` ${query.toLowerCase()} ${context.toLowerCase()} `;
  const queryWords = new Set(words(query));
  let best: Rule | undefined;
  let bestScore = 0;

  for (const rule of RULES) {
    const score = rule.terms.reduce((sum, term) => {
      const phrase = term.toLowerCase();
      const exact = normalized.includes(` ${phrase} `) || normalized.includes(phrase);
      const overlap = words(phrase).filter((word) => queryWords.has(word)).length / words(phrase).length;
      return sum + (exact ? 3 : 0) + overlap;
    }, 0);
    if (score > bestScore) { best = rule; bestScore = score; }
  }

  const train = query.match(/\b\d{5}\b/)?.[0];
  if (train && /(track|where|live|delay|platform|running)/i.test(query)) {
    return `For train ${train}, open Track or use the Live GPS Radar card. It presents the demo running status, next station, platform cue, door-side hint, and delay timeline for that train.`;
  }
  if (!best || bestScore < 1.2) {
    return 'I can guide you through every Nirantar feature: search and compare routes, book tickets, fill passenger details, track a train, review payments, manage journeys, use voice controls, or start the Page Guide. What would you like to do?';
  }
  return best.reply[stableIndex(query, best.reply.length)];
}
