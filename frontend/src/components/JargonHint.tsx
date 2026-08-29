import React from 'react';
import { getRailwayTerm } from '../data/railwayTerms';

interface JargonHintProps {
  term: string;
  children?: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

export const JargonHint: React.FC<JargonHintProps> = ({
  term,
  children,
  className = '',
  as: Component = 'span',
}) => {
  const termData = getRailwayTerm(term);
  const displayLabel = children || term;

  return (
    <Component
      data-jargon-hint="true"
      data-term-key={term}
      className={`jargon-hint ${className}`}
      tabIndex={0}
      role="term"
      aria-label={`${term}: ${termData?.simple || 'Railway term'}`}
    >
      {displayLabel}
    </Component>
  );
};

export default JargonHint;
