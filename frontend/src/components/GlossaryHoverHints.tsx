import { useEffect } from 'react';
import { RAILWAY_TERMS } from '../data/railwayTerms';

/**
 * Adds a short, on-hover definition to recognised railway jargon anywhere in
 * the rendered application. Text is enhanced after React renders, so pages do
 * not need to remember to add a glossary component for every label.
 */
const commonJourneyTerms = [
  { term: 'IRCTC', definition: 'Indian Railways’ official online ticketing service.' },
  { term: 'UPI', definition: 'India’s instant bank-to-bank payment system, usually paid with a UPI ID or QR code.' },
  { term: 'OTP', definition: 'A one-time password used to verify a secure action. Never share it.' },
  { term: 'CVV', definition: 'The short security code on your payment card. Never share it outside a trusted payment form.' },
  { term: 'GPS', definition: 'Satellite location data used to show where a train is currently running.' },
  { term: 'ledger', definition: 'A record of payments, refunds and their current status.' },
  { term: 'e-ticket', definition: 'The digital ticket issued after a successful booking.' },
  { term: 'quota', definition: 'A reserved pool of seats, such as General or Tatkal.' },
  { term: 'berth', definition: 'A sleeping place on a train, such as lower, middle or upper.' },
  { term: 'concession', definition: 'A fare discount or travel benefit for an eligible passenger.' },
  { term: 'clerkage', definition: 'The fixed administrative amount deducted when an eligible ticket is cancelled.' },
  { term: 'real-time', definition: 'Information updated as events happen, such as a train’s current running status.' },
  { term: 'availability', definition: 'The number of seats currently open for booking in a class and quota.' },
  { term: 'waitlist', definition: 'A queue for seats that may clear when other passengers cancel.' },
  { term: 'confirmation probability', definition: 'An estimate of how likely a waitlisted ticket is to become confirmed.' },
  { term: 'chart preparation', definition: 'The railway process that finalises passenger and berth allocations before departure.' },
  { term: 'boarding station', definition: 'The station where you get on the train.' },
  { term: 'coach position', definition: 'Where your coach will stop along the platform when the train arrives.' },
  { term: 'TTE', definition: 'Travelling Ticket Examiner—the railway staff member who checks tickets onboard.' },
  { term: 'DigiLocker', definition: 'India’s government digital document wallet for verified documents.' },
  { term: 'SafeAssist', definition: 'Nirantar’s local, rule-based helper for interpreting railway requests safely.' },
  { term: 'zero PII', definition: 'Personal information is kept out of the assistant’s processing.' },
  { term: 'PII', definition: 'Personally identifiable information, such as a phone number or identity number.' },
  { term: 'payment ledger', definition: 'A chronological record of charges, payment checks and refunds.' },
  { term: 'payment bridge', definition: 'The protected hand-off between Nirantar and an official payment flow.' },
  { term: 'double verification', definition: 'Checking payment status with two signals to help prevent duplicate charges.' },
  { term: 'concession', definition: 'A fare discount or travel benefit for an eligible passenger.' },
  { term: 'quota', definition: 'A reserved pool of seats, such as General, Tatkal or Senior Citizen.' },
  { term: 'berth preference', definition: 'Your requested sleeping position, such as lower, middle or upper.' },
  { term: 'natural language', definition: 'Everyday words instead of railway codes or a rigid form.' },
  { term: 'intent', definition: 'The task a passenger is trying to complete, such as checking a PNR.' },
  { term: 'platform alignment', definition: 'Guidance that helps match your coach or door with the platform position.' },
  { term: 'refund audit', definition: 'A record used to verify the amount and progress of a refund.' },
  { term: 'e-catering', definition: 'Ordering food for delivery to your seat through the official railway service.' },
];

const glossaryEntries = [
  ...Object.entries(RAILWAY_TERMS).flatMap(([term, definition]) => [
    { term, definition: definition.simple },
    { term: definition.short, definition: definition.simple },
  ]),
  ...commonJourneyTerms,
]
  .filter(({ term }, index, entries) => entries.findIndex((entry) => entry.term.toLowerCase() === term.toLowerCase()) === index)
  .sort((a, b) => b.term.length - a.term.length);

const termPattern = new RegExp(
  `(^|[^A-Za-z0-9])(${glossaryEntries
    .map(({ term }) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|')})(?=$|[^A-Za-z0-9])`,
  'gi',
);

const shouldSkip = (node: Text) => {
  const parent = node.parentElement;
  return !parent || Boolean(parent.closest('script, style, textarea, input, select, option, [data-jargon-hint]'));
};

const highlightTerms = (root: Node) => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let current: Node | null;

  while ((current = walker.nextNode())) {
    if (current.textContent?.trim() && shouldSkip(current as Text)) nodes.push(current as Text);
  }

  nodes.forEach((textNode) => {
    const source = textNode.textContent || '';
    termPattern.lastIndex = 0;
    if (!termPattern.test(source)) return;

    termPattern.lastIndex = 0;
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = termPattern.exec(source))) {
      const prefix = match[1] || '';
      const matchedTerm = match[2];
      const start = match.index + prefix.length;
      const definition = glossaryEntries.find(({ term }) => term.toLowerCase() === matchedTerm.toLowerCase());

      fragment.append(source.slice(lastIndex, start));
      const hint = document.createElement('span');
      hint.dataset.jargonHint = 'true';
      hint.className = 'jargon-hint';
      hint.tabIndex = 0;
      hint.setAttribute('role', 'term');
      hint.setAttribute('aria-label', `${matchedTerm}: ${definition?.definition || 'Railway term'}`);
      hint.setAttribute('title', definition?.definition || 'Railway term');
      hint.textContent = matchedTerm;
      hint.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        hint.classList.toggle('jargon-hint--open');
      });
      hint.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          hint.classList.toggle('jargon-hint--open');
        }
      });
      fragment.append(hint);
      lastIndex = start + matchedTerm.length;
    }

    fragment.append(source.slice(lastIndex));
    textNode.replaceWith(fragment);
  });
};

export const GlossaryHoverHints = () => {
  useEffect(() => {
    const enhance = () => highlightTerms(document.body);
    enhance();

    const observer = new MutationObserver((records) => {
      records.forEach((record) => {
        record.addedNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            if (node.textContent?.trim() && shouldSkip(node as Text)) highlightTerms(node.parentNode || document.body);
          } else if (node.nodeType === Node.ELEMENT_NODE && !(node as Element).matches('[data-jargon-hint]')) {
            highlightTerms(node);
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
};
