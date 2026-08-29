import React from 'react';
import { getRailwayTerm } from '../data/railwayTerms';

const FALLBACK_DEFINITIONS: Record<string, string> = {
  UPI: 'India’s instant bank-to-bank payment system, usually paid with a UPI ID or QR code.',
  IRCTC: 'Indian Railways’ official online ticketing service.',
  GPS: 'Satellite location data used to show where a train is currently running.',
  OTP: 'A one-time password used to verify a secure action. Never share it.',
};

interface JargonHintProps { term: string; children?: React.ReactNode; className?: string; }

export const JargonHint: React.FC<JargonHintProps> = ({ term, children, className = '' }) => {
  const definition = getRailwayTerm(term)?.simple || FALLBACK_DEFINITIONS[term.toUpperCase()] || 'A railway term explained in plain English.';
  return <span className={`jargon-hint ${className}`} title={definition} tabIndex={0} role="term" aria-label={`${term}: ${definition}`}>{children || term}</span>;
};

export default JargonHint;
