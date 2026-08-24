import React from 'react';

interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

export const Display: React.FC<TypographyProps> = ({ children, className = '', as: Component = 'h1', ...props }) => (
  <Component
    className={`font-display font-black text-3xl sm:text-4xl lg:text-5xl text-nirantar-text-primary leading-[1.15] tracking-tight ${className}`}
    {...props}
  >
    {children}
  </Component>
);

export const Heading1: React.FC<TypographyProps> = ({ children, className = '', as: Component = 'h1', ...props }) => (
  <Component
    className={`font-display font-extrabold text-2xl sm:text-3xl text-nirantar-text-primary leading-tight tracking-tight ${className}`}
    {...props}
  >
    {children}
  </Component>
);

export const Heading2: React.FC<TypographyProps> = ({ children, className = '', as: Component = 'h2', ...props }) => (
  <Component
    className={`font-display font-bold text-xl sm:text-2xl text-nirantar-text-primary leading-snug tracking-tight ${className}`}
    {...props}
  >
    {children}
  </Component>
);

export const Heading3: React.FC<TypographyProps> = ({ children, className = '', as: Component = 'h3', ...props }) => (
  <Component
    className={`font-display font-bold text-lg sm:text-xl text-nirantar-text-primary leading-snug ${className}`}
    {...props}
  >
    {children}
  </Component>
);

export const Heading4: React.FC<TypographyProps> = ({ children, className = '', as: Component = 'h4', ...props }) => (
  <Component
    className={`font-sans font-bold text-base sm:text-lg text-nirantar-text-primary leading-normal ${className}`}
    {...props}
  >
    {children}
  </Component>
);

export const BodyLarge: React.FC<TypographyProps> = ({ children, className = '', as: Component = 'p', ...props }) => (
  <Component
    className={`font-sans font-medium text-base sm:text-lg text-nirantar-text-secondary leading-relaxed ${className}`}
    {...props}
  >
    {children}
  </Component>
);

export const Body: React.FC<TypographyProps> = ({ children, className = '', as: Component = 'p', ...props }) => (
  <Component
    className={`font-sans text-sm sm:text-base text-nirantar-text-secondary leading-normal ${className}`}
    {...props}
  >
    {children}
  </Component>
);

export const Label: React.FC<TypographyProps> = ({ children, className = '', as: Component = 'span', ...props }) => (
  <Component
    className={`font-sans font-semibold text-xs sm:text-sm text-nirantar-text-primary leading-none ${className}`}
    {...props}
  >
    {children}
  </Component>
);

export const MicroTag: React.FC<TypographyProps> = ({ children, className = '', as: Component = 'span', ...props }) => (
  <Component
    className={`font-mono font-bold text-xs uppercase tracking-wider text-nirantar-primary-700 ${className}`}
    {...props}
  >
    {children}
  </Component>
);
