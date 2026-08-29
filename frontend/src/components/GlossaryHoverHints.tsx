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
