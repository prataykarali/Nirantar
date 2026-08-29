import React, { useState } from 'react';
import { getRailwayTerm } from '../data/railwayTerms';

const FALLBACK_DEFINITIONS: Record<string, string> = {
  UPI: 'India’s instant bank-to-bank payment system, usually paid with a UPI ID or QR code.',
  IRCTC: 'Indian Railways’ official online ticketing service.',
  GPS: 'Satellite location data used to show where a train is currently running.',
  LEDGER: 'A record of payments, refunds and their current status.',
  'E-TICKET': 'The digital ticket issued after a successful booking.',
  QUOTA: 'A reserved pool of seats, such as General or Tatkal.',
  BERTH: 'A sleeping place on a train, such as lower, middle or upper.',
  OTP: 'A one-time password used to verify a secure action. Never share it.',
};

interface JargonHintProps { term: string; children?: React.ReactNode; className?: string; }

export const JargonHint: React.FC<JargonHintProps> = ({ term, children, className = '' }) => {
  const [open, setOpen] = useState(false);
  const definition = getRailwayTerm(term)?.simple || FALLBACK_DEFINITIONS[term.toUpperCase()] || 'A railway term explained in plain English.';
  return <span className={`jargon-hint ${open ? 'jargon-hint--open' : ''} ${className}`} title={definition} tabIndex={0} role="button" aria-expanded={open} aria-label={`${term}: ${definition}`} onClick={(event) => { event.preventDefault(); event.stopPropagation(); setOpen((value) => !value); }} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setOpen((value) => !value); } }}>{children || term}</span>;
};

export default JargonHint;
